import type {
  AssessmentItem,
  AssessmentRecord,
  LessonAssessmentData,
} from "./types";
import { fingerprint, newId } from "./types";
import { AssessmentStore, getAssessmentStore } from "./assessmentStore";
import { scoreItem } from "./MatchingEngine";
import { AssessmentRulesEngine } from "./AssessmentRulesEngine";
export class AssessmentEngine {
  constructor(private store: AssessmentStore = getAssessmentStore()) {}
  async ranked(
    data: LessonAssessmentData,
    record?: AssessmentRecord,
    target?: AssessmentItem,
  ) {
    const history = await this.store.history(data.lessonId);
    const records = [...history, ...(record ? [record] : [])];
    const ids = new Set(
      records.flatMap((r) => [
        ...r.usedItemIds,
        ...r.assessmentItems.map((i) => i.id),
      ]),
    );
    const texts = new Set(
      records.flatMap((r) => [
        ...r.usedFingerprints,
        ...r.assessmentItems.map(fingerprint),
      ]),
    );
    const candidates = await this.store.candidates(data);
    const seen = new Set<string>();
    return candidates
      .filter((item) => !ids.has(item.id) && !texts.has(fingerprint(item)))
      .map((item) => ({ item, score: scoreItem(item, data, target) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
      .filter(({ item }) => {
        const key = fingerprint(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((x) => x.item);
  }
  async build(
    data: LessonAssessmentData,
    count = 3,
  ): Promise<AssessmentRecord> {
    const ranked = await this.ranked(data);
    const items = AssessmentRulesEngine.select(
      ranked,
      data,
      Math.max(1, Math.min(20, count)),
    );
    const now = new Date().toISOString();
    const record: AssessmentRecord = {
      id: newId(),
      memoId: data.memoId,
      lessonId: data.lessonId,
      assessment: { title: "التقويم", variant: "student" },
      assessmentItems: items,
      usedItemIds: items.map((i) => i.id),
      usedFingerprints: items.map(fingerprint),
      createdAt: now,
      updatedAt: now,
    };
    try {
      await this.store.save(record);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("استُخدم سؤال"))
        throw error;
      // Another tab may have reserved the same questions between ranking and committing.
      const alternatives = AssessmentRulesEngine.select(
        await this.ranked(data),
        data,
        count,
      );
      record.assessmentItems = alternatives;
      record.usedItemIds = alternatives.map((i) => i.id);
      record.usedFingerprints = alternatives.map(fingerprint);
      await this.store.save(record);
    }
    return record;
  }
  async replacement(
    data: LessonAssessmentData,
    record: AssessmentRecord,
    target: AssessmentItem,
  ) {
    return (await this.ranked(data, record, target))[0];
  }
  async add(data: LessonAssessmentData, record: AssessmentRecord) {
    return (await this.ranked(data, record))[0];
  }
}
