import React, { useEffect, useState } from "react";
import { AssessmentStore } from "./assessmentStore";
import {
  ASSESSMENT_TYPES,
  EMPTY_ASSESSMENT,
  type AssessmentItem,
  type BankFilter,
} from "./types";
import { AssessmentItemEditor } from "./AssessmentItemEditor";
export function AssessmentBank({
  store,
  initialLevel,
  defaults,
  onPick,
}: {
  store: AssessmentStore;
  initialLevel?: string;
  defaults?: Partial<AssessmentItem>;
  onPick?: (item: AssessmentItem) => Promise<void>;
}) {
  const [filter, setFilter] = useState<BankFilter>({
    level: initialLevel || "1am",
  });
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [pages, setPages] = useState<number[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [editing, setEditing] = useState<AssessmentItem | true | null>(null);
  const [preview, setPreview] = useState<AssessmentItem | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await store.ensureLevel(filter.level || "1am");
          const page = await store.page(filter, offset);
          if (active) {
            setItems(page.items);
            setNext(page.next);
            setError("");
          }
        } catch (e) {
          if (active)
            setError(e instanceof Error ? e.message : "تعذر فتح البنك المحلي.");
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [store, filter, offset, revision]);
  useEffect(() => {
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener("assessment-cloud-restored", refresh);
    return () =>
      window.removeEventListener("assessment-cloud-restored", refresh);
  }, []);
  const change = (key: keyof BankFilter, value: string) => {
    setFilter((f) => ({ ...f, [key]: value }));
    setOffset(0);
    setPages([]);
  };
  return (
    <section className="space-y-4" aria-label="بنك التقويم">
      <div className="flex justify-between">
        <h2 className="font-bold text-xl">بنك التقويم</h2>
        <button
          className="border rounded-lg p-2 text-sm"
          onClick={() => setEditing(true)}
        >
          + إضافة سؤال
        </button>
      </div>
      <input
        aria-label="البحث في بنك التقويم"
        placeholder="بحث في الأسئلة والمفاهيم…"
        value={filter.search || ""}
        onChange={(e) => change("search", e.target.value)}
        className="border rounded-xl p-3 w-full"
      />
      <details>
        <summary className="text-sm cursor-pointer">فلاتر اختيارية</summary>
        <div className="grid sm:grid-cols-3 gap-2 mt-2">
          <select
            aria-label="مستوى بنك التقويم"
            value={filter.level}
            onChange={(e) => change("level", e.target.value)}
            className="border rounded-lg p-2"
          >
            {["1am", "2am", "3am", "4am"].map((l, i) => (
              <option key={l} value={l}>
                السنة {i + 1} متوسط
              </option>
            ))}
          </select>
          {(["domain", "unit", "lesson"] as const).map((key, i) => (
            <input
              key={key}
              aria-label={["المجال", "الوحدة", "الدرس"][i]}
              placeholder={["المجال", "الوحدة", "الدرس"][i]}
              value={filter[key] || ""}
              onChange={(e) => change(key, e.target.value)}
              className="border rounded-lg p-2"
            />
          ))}
          <select
            aria-label="تصفية نوع السؤال"
            value={filter.type || ""}
            onChange={(e) => change("type", e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="">جميع الأنواع</option>
            {Object.entries(ASSESSMENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="تصفية الصعوبة"
            value={filter.difficulty || ""}
            onChange={(e) => change("difficulty", e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="">جميع الصعوبات</option>
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
        </div>
      </details>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {loading && <p role="status">جارٍ فتح البنك المحلي…</p>}
      {editing && (
        <AssessmentItemEditor
          key={editing === true ? "new" : editing.id}
          item={editing === true ? undefined : editing}
          defaults={{ ...defaults, level: filter.level || "1am" }}
          onCancel={() => setEditing(null)}
          onSave={async (item) => {
            await store.putItem(item);
            setEditing(null);
            setRevision((x) => x + 1);
          }}
        />
      )}
      {preview && (
        <div
          className="bg-teal-50 rounded-xl p-4 whitespace-pre-wrap leading-8"
          aria-label="معاينة السؤال"
        >
          <h3 className="font-bold">معاينة السؤال</h3>
          {preview.question}
          <hr />
          {preview.expectedAnswer || "لم تُضف إجابة منتظرة."}
          <button className="block underline" onClick={() => setPreview(null)}>
            إغلاق المعاينة
          </button>
        </div>
      )}
      {!loading && !items.length && <p>{EMPTY_ASSESSMENT}</p>}
      {items.map((item) => (
        <article key={item.id} className="border rounded-xl p-4 space-y-2">
          <p className="text-xs text-teal-800">
            {ASSESSMENT_TYPES[item.type]} · {item.concept}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-7">
            {item.question}
          </p>
          <div className="flex gap-4 text-xs text-teal-800">
            <button onClick={() => setEditing(item)}>تعديل وتصنيف</button>
            <button onClick={() => setPreview(item)}>معاينة</button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "حذف السؤال من بنك التقويم؟ لن تُحذف نسخه المحفوظة في المذكرات.",
                  )
                )
                  void store
                    .deleteItem(item)
                    .then(() => setRevision((x) => x + 1))
                    .catch((e) => setError(String(e)));
              }}
            >
              حذف
            </button>
            {onPick && (
              <button
                onClick={() =>
                  void onPick(item).catch((e) => setError(String(e)))
                }
              >
                إضافة إلى التقويم
              </button>
            )}
          </div>
        </article>
      ))}
      <div className="flex justify-between">
        <button
          disabled={!pages.length || loading}
          onClick={() => {
            setOffset(pages.at(-1) || 0);
            setPages((p) => p.slice(0, -1));
          }}
        >
          السابق
        </button>
        <span className="text-xs">
          الصفحة {pages.length + 1} · حتى 20 سؤالاً
        </span>
        <button
          disabled={next === null || loading}
          onClick={() => {
            setPages((p) => [...p, offset]);
            setOffset(next!);
          }}
        >
          التالي
        </button>
      </div>
    </section>
  );
}
