import type {
  AssessmentItem,
  AssessmentRecord,
  BankFilter,
  LessonAssessmentData,
} from "./types";
import { normalize, words, validateItem, newId, fingerprint } from "./types";
export type AssessmentCollection =
  | "assessmentItems"
  | "assessments"
  | "memoAssessments"
  | "assessmentTemplates"
  | "assessmentCategories";
const STORES = [
  "assessmentItems",
  "assessments",
  "memoAssessments",
  "assessmentTemplates",
  "assessmentCategories",
  "meta",
  "outbox",
] as const;
export interface PendingWrite {
  id: string;
  collection: AssessmentCollection;
  documentId: string;
  payload: any;
  version: string;
}
const req = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("لم يكتمل الحفظ المحلي."));
  });
export class AssessmentStore {
  private connection?: Promise<IDBDatabase>;
  private seeds = new Map<string, Promise<void>>();
  constructor(public readonly owner = "local") {}
  private open() {
    if (!this.connection)
      this.connection = new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
          reject(
            new Error(
              "التخزين المحلي IndexedDB غير متاح. فعّل تخزين المتصفح لحفظ التقويم.",
            ),
          );
          return;
        }
        const request = indexedDB.open(`snv-assessment-v1-${this.owner}`, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          for (const name of STORES) {
            const store = db.createObjectStore(name, { keyPath: "id" });
            if (name === "assessmentItems") {
              store.createIndex("level", "level");
              store.createIndex("tokens", "_tokens", { multiEntry: true });
            }
            if (name === "assessments") {
              store.createIndex("lessonId", "lessonId");
              store.createIndex("memoId", "memoId");
            }
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.connection = undefined;
          reject(request.error);
        };
      });
    return this.connection;
  }
  async get<T>(store: string, id: string): Promise<T | undefined> {
    const db = await this.open();
    return req(db.transaction(store).objectStore(store).get(id));
  }
  async setMeta(id: string, value: object) {
    const db = await this.open();
    const tx = db.transaction("meta", "readwrite");
    const complete = done(tx);
    tx.objectStore("meta").put({ ...value, id });
    await complete;
  }
  async requestedLevels(): Promise<string[]> {
    return (
      (await this.get<{ levels: string[] }>("meta", "requested-levels"))
        ?.levels || []
    );
  }
  private async requestLevel(level: string) {
    const db = await this.open();
    const tx = db.transaction("meta", "readwrite");
    const complete = done(tx);
    const store = tx.objectStore("meta");
    const request = store.get("requested-levels");
    request.onsuccess = () =>
      store.put({
        id: "requested-levels",
        levels: [...new Set([...(request.result?.levels || []), level])],
      });
    await complete;
    if (typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent("assessment-level-request", {
          detail: { owner: this.owner, level },
        }),
      );
  }
  private indexed(item: AssessmentItem) {
    return {
      ...item,
      _tokens: [
        ...new Set(
          words(
            [
              item.question,
              item.lesson,
              item.objective,
              item.concept,
              ...item.keywords,
            ].join(" "),
          ).map((token) => `${item.level}|${token}`),
        ),
      ],
    };
  }
  private queue(
    tx: IDBTransaction,
    collection: AssessmentCollection,
    id: string,
    payload: any,
  ) {
    tx.objectStore("outbox").put({
      id: `${collection}:${id}`,
      collection,
      documentId: id,
      payload: JSON.parse(JSON.stringify(payload)),
      version: newId(),
    });
  }
  async putItem(raw: AssessmentItem) {
    const item = validateItem(raw),
      db = await this.open();
    const tx = db.transaction(["assessmentItems", "outbox"], "readwrite");
    const complete = done(tx);
    tx.objectStore("assessmentItems").put(this.indexed(item));
    this.queue(tx, "assessmentItems", item.id, item);
    await complete;
    this.changed();
    return item;
  }
  async deleteItem(item: AssessmentItem) {
    return this.putItem({ ...item, active: false });
  }
  async ensureLevel(level: string) {
    if (!["1am", "2am", "3am", "4am"].includes(level)) return;
    if (!this.seeds.has(level))
      this.seeds.set(
        level,
        this.seedLevel(level)
          .then(() => this.requestLevel(level))
          .catch((error) => {
            this.seeds.delete(level);
            throw error;
          }),
      );
    await this.seeds.get(level);
  }
  private async seedLevel(level: string) {
    if (await this.get("meta", `seed-v1-${level}`)) return;
    const { seedBatches, ASSESSMENT_TEMPLATES } =
      await import("./assessmentSeeds");
    const db = await this.open();
    for await (const batch of seedBatches(level)) {
      const tx = db.transaction("assessmentItems", "readwrite");
      const complete = done(tx);
      const store = tx.objectStore("assessmentItems");
      for (const item of batch) {
        const r = store.get(item.id);
        r.onsuccess = () => {
          if (!r.result) store.put(this.indexed(item));
        };
      }
      await complete;
    }
    const tx = db.transaction(
      ["meta", "assessmentTemplates", "assessmentCategories", "outbox"],
      "readwrite",
    );
    const complete = done(tx);
    tx.objectStore("meta").put({ id: `seed-v1-${level}`, ready: true });
    for (const item of ASSESSMENT_TEMPLATES) {
      tx.objectStore("assessmentTemplates").put(item);
      this.queue(tx, "assessmentTemplates", item.id, item);
    }
    const category = { id: level, title: level };
    tx.objectStore("assessmentCategories").put(category);
    this.queue(tx, "assessmentCategories", level, category);
    await complete;
  }
  async page(
    filter: BankFilter,
    offset = 0,
    limit = 20,
  ): Promise<{ items: AssessmentItem[]; next: number | null }> {
    const db = await this.open();
    const store = db
      .transaction("assessmentItems")
      .objectStore("assessmentItems");
    const source = filter.level ? store.index("level") : store;
    const request = source.openCursor(
      filter.level ? IDBKeyRange.only(filter.level) : undefined,
    );
    return new Promise((resolve, reject) => {
      const items: AssessmentItem[] = [];
      let scanned = 0;
      let advanced = false;
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve({ items, next: null });
          return;
        }
        if (!advanced && offset > 0) {
          advanced = true;
          scanned = offset;
          cursor.advance(offset);
          return;
        }
        advanced = true;
        scanned++;
        const item = cursor.value as AssessmentItem;
        const match =
          item.active &&
          (!filter.domain ||
            normalize(item.domain).includes(normalize(filter.domain))) &&
          (!filter.unit ||
            normalize(item.unit || "").includes(normalize(filter.unit))) &&
          (!filter.lesson ||
            normalize(item.lesson || "").includes(normalize(filter.lesson))) &&
          (!filter.type || item.type === filter.type) &&
          (!filter.difficulty || item.difficulty === filter.difficulty) &&
          (!filter.search ||
            words(filter.search).every((w) =>
              normalize(
                [
                  item.question,
                  item.concept,
                  item.objective,
                  ...item.keywords,
                ].join(" "),
              ).includes(w),
            ));
        if (match) {
          const { _tokens, ...clean } = cursor.value;
          items.push(clean);
        }
        if (items.length >= limit) {
          resolve({ items, next: scanned });
          return;
        }
        cursor.continue();
      };
    });
  }
  async candidates(data: LessonAssessmentData): Promise<AssessmentItem[]> {
    await this.ensureLevel(data.level);
    const db = await this.open();
    const found = new Map<string, AssessmentItem>();
    // At most 24 indexed token reads, bounded to 160 hits each, not a whole-bank download/scan.
    const tokens = words(
      [data.lessonTitle, ...data.concepts, ...data.objectives].join(" "),
    ).slice(0, 24);
    for (const token of tokens) {
      const hits = await req<any[]>(
        db
          .transaction("assessmentItems")
          .objectStore("assessmentItems")
          .index("tokens")
          .getAll(`${data.level}|${token}`, 160),
      );
      for (const { _tokens, ...item } of hits)
        if (item.active) found.set(item.id, item as AssessmentItem);
    }
    return [...found.values()];
  }
  async history(lessonId: string): Promise<AssessmentRecord[]> {
    const db = await this.open();
    return req(
      db
        .transaction("assessments")
        .objectStore("assessments")
        .index("lessonId")
        .getAll(lessonId),
    );
  }
  async current(memoId: string): Promise<AssessmentRecord | undefined> {
    const link = await this.get<{ assessmentId: string }>(
      "memoAssessments",
      memoId,
    );
    return link ? this.get("assessments", link.assessmentId) : undefined;
  }
  async save(record: AssessmentRecord) {
    if (new TextEncoder().encode(JSON.stringify(record)).byteLength > 850000)
      throw new Error(
        "حجم التقويم كبير جداً للمزامنة؛ اختصر السندات أو قسّمه إلى تقويمين.",
      );
    if (record.assessmentItems.length > 30)
      throw new Error("الحد الأقصى 30 سؤالاً في التقويم الواحد.");
    const questionKeys = record.assessmentItems.map(fingerprint);
    if (new Set(questionKeys).size !== questionKeys.length)
      throw new Error("يوجد سؤال مكرر في نفس التقويم.");
    record.assessmentItems.forEach(validateItem);
    const db = await this.open();
    const tx = db.transaction(
      ["assessments", "memoAssessments", "outbox"],
      "readwrite",
    );
    const complete = done(tx);
    let conflict = false;
    const lookup = tx
      .objectStore("assessments")
      .index("lessonId")
      .getAll(record.lessonId);
    lookup.onsuccess = () => {
      const older = (lookup.result as AssessmentRecord[]).filter(
        (r) => r.id !== record.id,
      );
      conflict = older.some((r) =>
        record.assessmentItems.some(
          (item) =>
            r.usedItemIds.includes(item.id) ||
            r.usedFingerprints.includes(fingerprint(item)),
        ),
      );
      if (conflict) {
        tx.abort();
        return;
      }
      const payload = JSON.parse(JSON.stringify(record));
      tx.objectStore("assessments").put(payload);
      const link = {
        id: record.memoId,
        assessmentId: record.id,
        lessonId: record.lessonId,
        updatedAt: record.updatedAt,
      };
      tx.objectStore("memoAssessments").put(link);
      this.queue(tx, "assessments", record.id, payload);
      this.queue(tx, "memoAssessments", record.memoId, link);
    };
    try {
      await complete;
    } catch (error) {
      if (conflict)
        throw new Error("استُخدم سؤال في تقويم سابق مرتبط بالدرس؛ اختر بديلاً.");
      throw error;
    }
    this.changed();
  }
  async pending(limit = 30): Promise<PendingWrite[]> {
    const db = await this.open();
    return req(
      db.transaction("outbox").objectStore("outbox").getAll(undefined, limit),
    );
  }
  async ack(write: PendingWrite) {
    const db = await this.open();
    const tx = db.transaction("outbox", "readwrite");
    const complete = done(tx);
    const store = tx.objectStore("outbox");
    const request = store.get(write.id);
    request.onsuccess = () => {
      if (request.result?.version === write.version) store.delete(write.id);
    };
    await complete;
  }
  async mergeRemote(collection: AssessmentCollection, value: any) {
    if (!value || typeof value.id !== "string") return;
    if (collection === "assessmentItems") {
      try {
        validateItem(value);
      } catch {
        return;
      }
    }
    if (
      collection === "assessments" &&
      (!Array.isArray(value.assessmentItems) ||
        !Array.isArray(value.usedItemIds) ||
        !Array.isArray(value.usedFingerprints) ||
        !value.lessonId ||
        !value.memoId ||
        !["student", "correction"].includes(value.assessment?.variant))
    )
      return;
    if (collection === "assessments") {
      try {
        value.assessmentItems.forEach(validateItem);
      } catch {
        return;
      }
    }
    if (
      collection === "memoAssessments" &&
      (typeof value.assessmentId !== "string" ||
        typeof value.lessonId !== "string")
    )
      return;
    const db = await this.open();
    const tx = db.transaction([collection, "outbox"], "readwrite");
    const complete = done(tx);
    const queue = tx.objectStore("outbox").get(`${collection}:${value.id}`);
    queue.onsuccess = () => {
      if (queue.result) return;
      const store = tx.objectStore(collection);
      const r = store.get(value.id);
      r.onsuccess = () => {
        if (!r.result || (value.updatedAt || "") > (r.result.updatedAt || ""))
          store.put(
            collection === "assessmentItems" ? this.indexed(value) : value,
          );
      };
    };
    await complete;
  }
  private changed() {
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("assessment-local-change"));
  }
}
let active = new AssessmentStore();
export const getAssessmentStore = () => active;
export function setAssessmentOwner(owner?: string) {
  const next = owner || "local";
  if (active.owner !== next) {
    active = new AssessmentStore(next);
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("assessment-owner-change"));
  }
}
