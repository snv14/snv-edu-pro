import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LessonMemo, MemoConfig } from "../types";
import { AssessmentStore } from "./assessmentStore";
import { AssessmentEngine } from "./AssessmentEngine";
import {
  ASSESSMENT_TYPES,
  EMPTY_ASSESSMENT,
  fingerprint,
  lessonData,
  memoIdentity,
  newId,
  validateItem,
  type AssessmentItem,
  type AssessmentRecord,
} from "./types";
import { AssessmentBank } from "./AssessmentBank";
import { AssessmentItemEditor } from "./AssessmentItemEditor";
import { AssessmentPreview } from "./AssessmentPreview";
const CorrectionMemoDrawer = lazy(() =>
  import("../components/CorrectionMemoDrawer").then((m) => ({
    default: m.CorrectionMemoDrawer,
  })),
);
export function AssessmentWorkspace({
  onClose,
  currentLesson,
  curriculumLessons,
  config,
  onEmbed,
  owner,
  authLoading = false,
  onOpenAdvanced,
}: {
  onClose: () => void;
  currentLesson?: LessonMemo | null;
  curriculumLessons: LessonMemo[];
  config?: MemoConfig;
  onEmbed: (record: AssessmentRecord, lesson: LessonMemo) => void;
  owner?: string;
  authLoading?: boolean;
  onOpenAdvanced?: (lesson: LessonMemo | null) => void;
}) {
  const store = useMemo(() => new AssessmentStore(owner || "local"), [owner]);
  const engine = useMemo(() => new AssessmentEngine(store), [store]);
  const [selected, setSelected] = useState<LessonMemo | null>(
    currentLesson || null,
  );
  const selectedKey = selected ? memoIdentity(selected) : "";
  const data = useMemo(
    () => (selected ? lessonData(selected) : null),
    [selectedKey],
  );
  const contextKey = `${store.owner}:${data?.memoId || ""}`;
  const contextRef = useRef(contextKey);
  contextRef.current = contextKey;
  const [record, setRecord] = useState<AssessmentRecord | null>(null);
  const recordRef = useRef<AssessmentRecord | null>(null);
  const [tab, setTab] = useState<"assessment" | "bank" | "preview">(
    "assessment",
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AssessmentItem | true | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [savedHistory, setSavedHistory] = useState<AssessmentRecord[]>([]);
  const preview = useRef<HTMLDivElement>(null);
  const queue = useRef(Promise.resolve());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    recordRef.current = null;
    setRecord(null);
    setEditing(null);
    setError("");
    setNotice("");
    if (!data || authLoading) return;
    setBusy(true);
    void (async () => {
      try {
        let existing = await store.current(data.memoId);
        if (!existing && data.lesson.assessment?.memoId === data.memoId) {
          existing = data.lesson.assessment;
          await store.save(existing);
        }
        const next = existing || (await engine.build(data));
        if (active) {
          recordRef.current = next;
          setRecord(next);
          if (next.assessmentItems.length < 3) setNotice(EMPTY_ASSESSMENT);
          onEmbed(next, data.lesson);
        }
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "تعذر فتح التقويم المحلي.");
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [data?.memoId, store, authLoading]);
  // Serialize local edits; a slow write must not restore an older question over a newer one.
  const save = (change: (previous: AssessmentRecord) => AssessmentRecord) => {
    const work = queue.current
      .catch(() => {})
      .then(async () => {
        if (contextRef.current !== contextKey) return;
        const previous = recordRef.current;
        if (!previous || !data) return;
        const next = change(previous);
        next.updatedAt = new Date().toISOString();
        await store.save(next);
        if (contextRef.current !== contextKey) return;
        recordRef.current = next;
        if (mounted.current) {
          setRecord(next);
          onEmbed(next, data.lesson);
          setNotice("تم الحفظ محلياً وإدراج التقويم في المذكرة.");
        }
      });
    queue.current = work;
    return work;
  };
  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "تعذر حفظ التعديل محلياً؛ أعد المحاولة.",
      );
    } finally {
      if (mounted.current && contextRef.current === contextKey) setBusy(false);
    }
  };
  const append = async (item: AssessmentItem) => {
    if (!data || !recordRef.current) return;
    const history = await store.history(data.lessonId);
    const all = [...history, recordRef.current];
    if (
      all.some(
        (r) =>
          r.usedItemIds.includes(item.id) ||
          r.usedFingerprints.includes(fingerprint(item)),
      )
    )
      throw new Error("استُخدم هذا السؤال سابقاً لهذا الدرس. اختر سؤالاً آخر.");
    if (item.level !== data.level)
      throw new Error("السؤال لا يطابق مستوى المذكرة.");
    await save((r) => ({
      ...r,
      assessmentItems: [...r.assessmentItems, item],
      usedItemIds: [...r.usedItemIds, item.id],
      usedFingerprints: [...r.usedFingerprints, fingerprint(item)],
    }));
    setTab("assessment");
  };
  const defaults: Partial<AssessmentItem> = data
    ? {
        level: data.level,
        domain: data.domain,
        unit: data.unit,
        lesson: data.lessonTitle,
        objective: data.objectives[0],
        competency: data.competencies[0],
        concept: data.concepts[0],
        keywords: data.keywords.slice(0, 70),
      }
    : {};
  if (legacy)
    return (
      <Suspense fallback={<p>جارٍ فتح مذكرة التصحيح…</p>}>
        <CorrectionMemoDrawer
          isOpen
          onClose={() => setLegacy(false)}
          currentLesson={selected}
          curriculumLessons={curriculumLessons}
          config={config}
          assessmentStore={store}
        />
      </Suspense>
    );
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="التقويم"
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-50 flex flex-col text-slate-800"
    >
      <header className="bg-white border-b px-4 py-3 flex gap-3 items-center">
        <button
          disabled={busy}
          aria-label="إغلاق التقويم"
          onClick={onClose}
          className="border rounded-lg px-3 py-2"
        >
          إغلاق
        </button>
        <h1 className="text-xl font-black flex-1">التقويم</h1>
        <button
          onClick={() => setTab("bank")}
          className="text-sm border rounded-lg px-3 py-2"
        >
          بنك التقويم
        </button>
        <button
          onClick={() =>
            onOpenAdvanced ? onOpenAdvanced(selected) : setLegacy(true)
          }
          className="text-xs underline"
        >
          الاختبارات والنتائج ومذكرة التصحيح
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {!currentLesson && (
            <label className="grid gap-2 text-sm">
              اختر مذكرة للبدء
              <select
                aria-label="المذكرة المرتبطة بالتقويم"
                value={selectedKey}
                disabled={busy}
                onChange={(e) =>
                  setSelected(
                    curriculumLessons.find(
                      (l) => memoIdentity(l) === e.target.value,
                    ) || null,
                  )
                }
                className="border rounded-xl p-3"
              >
                <option value="">اختر المذكرة</option>
                {curriculumLessons.map((l, i) => (
                  <option
                    key={`${memoIdentity(l)}-${i}`}
                    value={memoIdentity(l)}
                  >
                    {l.ta3alom} — {l.mawrid} ({l.level})
                  </option>
                ))}
              </select>
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="bg-red-50 text-red-800 border rounded-xl p-3"
            >
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-teal-800">
              {notice}
            </p>
          )}
          {busy && (
            <p role="status" className="text-sm">
              جارٍ إعداد التقويم وحفظه محلياً…
            </p>
          )}
          <details>
            <summary
              className="cursor-pointer text-sm"
              onClick={() => {
                if (data)
                  void store
                    .history(data.lessonId)
                    .then((rows) =>
                      setSavedHistory(
                        rows.sort((a, b) =>
                          b.updatedAt.localeCompare(a.updatedAt),
                        ),
                      ),
                    )
                    .catch((e) => setError(String(e)));
              }}
            >
              التقويمات المحفوظة لهذا الدرس
            </summary>
            <div className="space-y-2 p-2">
              {savedHistory.map((previous) => (
                <button
                  key={previous.id}
                  disabled={busy}
                  className="block text-xs underline"
                  onClick={() =>
                    void run(async () => {
                      await store.save(previous);
                      recordRef.current = previous;
                      setRecord(previous);
                      if (data) onEmbed(previous, data.lesson);
                    })
                  }
                >
                  {new Date(previous.createdAt).toLocaleString("ar-DZ")} —{" "}
                  {previous.assessmentItems.length} سؤال
                </button>
              ))}
            </div>
          </details>
          <nav className="flex gap-3 text-sm">
            <button
              onClick={() => setTab("assessment")}
              aria-pressed={tab === "assessment"}
            >
              الأسئلة
            </button>
            <button
              disabled={!record}
              onClick={() => setTab("preview")}
              aria-pressed={tab === "preview"}
            >
              معاينة قبل التصدير
            </button>
          </nav>
          {tab === "bank" ? (
            <AssessmentBank
              key={store.owner}
              store={store}
              initialLevel={data?.level}
              defaults={defaults}
              onPick={
                record
                  ? async (item) => {
                      await append(item);
                    }
                  : undefined
              }
            />
          ) : (
            record && (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label>
                    النسخة:{" "}
                    <select
                      aria-label="نسخة التقويم"
                      disabled={busy}
                      value={record.assessment.variant}
                      onChange={(e) => {
                        const variant = e.target.value as
                          "student" | "correction";
                        void run(() =>
                          save((r) => ({
                            ...r,
                            assessment: { ...r.assessment, variant },
                          })),
                        );
                      }}
                      className="border rounded-lg p-2"
                    >
                      <option value="student">نسخة التلميذ</option>
                      <option value="correction">نسخة التصحيح</option>
                    </select>
                  </label>
                  <button
                    disabled={busy || !record.assessmentItems.length}
                    onClick={() =>
                      void run(async () => {
                        setTab("preview");
                        await new Promise((r) => setTimeout(r, 80));
                        if (preview.current) {
                          const { exportAssessmentPdf } =
                            await import("./assessmentExport");
                          await exportAssessmentPdf(preview.current);
                        }
                      })
                    }
                    className="border rounded-lg p-2"
                  >
                    PDF
                  </button>
                  <button
                    disabled={busy || !record.assessmentItems.length}
                    onClick={() =>
                      void run(async () => {
                        setTab("preview");
                        await new Promise((r) => setTimeout(r, 80));
                        if (preview.current) {
                          const { printAssessment } =
                            await import("./assessmentExport");
                          await printAssessment(preview.current);
                        }
                      })
                    }
                    className="border rounded-lg p-2"
                  >
                    طباعة
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (data) {
                        onEmbed(record, data.lesson);
                        setNotice("التقويم مدرج في المذكرة ويظهر في تصديرها.");
                      }
                    }}
                    className="border rounded-lg p-2"
                  >
                    إدراج في المذكرة
                  </button>
                  <button
                    disabled={busy}
                    className="border rounded-lg p-2"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "إنشاء تقويم جديد دون إعادة أسئلة التقويمات السابقة؟ ستبقى النسخة السابقة محفوظة.",
                        )
                      )
                        return;
                      void run(async () => {
                        if (!data) return;
                        const next = await engine.build(data);
                        recordRef.current = next;
                        setRecord(next);
                        onEmbed(next, data.lesson);
                        if (!next.assessmentItems.length)
                          setNotice(EMPTY_ASSESSMENT);
                      });
                    }}
                  >
                    تقويم جديد
                  </button>
                </div>
                {tab === "preview" ? (
                  <div ref={preview}>
                    <AssessmentPreview record={record} />
                  </div>
                ) : (
                  <>
                    {!record.assessmentItems.length && !busy && (
                      <p className="border rounded-xl p-4">
                        {EMPTY_ASSESSMENT}
                      </p>
                    )}
                    {record.assessmentItems.map((item, index) => (
                      <article
                        key={item.id}
                        className="bg-white border rounded-2xl p-5 space-y-3"
                      >
                        <h2 className="font-bold">السؤال {index + 1}</h2>
                        <p className="whitespace-pre-wrap leading-8 text-sm">
                          {item.question}
                        </p>
                        {record.assessment.variant === "correction" && (
                          <div className="bg-teal-50 p-3 rounded-lg whitespace-pre-wrap text-sm leading-7">
                            <b>الإجابة المنتظرة: </b>
                            {item.expectedAnswer || "لم تُضف إجابة منتظرة."}
                            {item.points !== undefined && (
                              <p>سلم التنقيط: {item.points} ن</p>
                            )}
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-teal-800">
                          <button
                            disabled={busy}
                            onClick={() => setEditing(item)}
                          >
                            تعديل
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                if (!data) return;
                                const alternative = await engine.replacement(
                                  data,
                                  record,
                                  item,
                                );
                                if (!alternative) {
                                  setNotice(EMPTY_ASSESSMENT);
                                  return;
                                }
                                await save((r) => ({
                                  ...r,
                                  assessmentItems: r.assessmentItems.map((x) =>
                                    x.id === item.id ? alternative : x,
                                  ),
                                  usedItemIds: [
                                    ...r.usedItemIds,
                                    alternative.id,
                                  ],
                                  usedFingerprints: [
                                    ...r.usedFingerprints,
                                    fingerprint(alternative),
                                  ],
                                }));
                              })
                            }
                          >
                            استبدال
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                save((r) => ({
                                  ...r,
                                  assessmentItems: r.assessmentItems.filter(
                                    (x) => x.id !== item.id,
                                  ),
                                })),
                              )
                            }
                          >
                            حذف
                          </button>
                          <span className="text-slate-400">
                            {ASSESSMENT_TYPES[item.type]}
                          </span>
                        </div>
                      </article>
                    ))}
                    {editing && (
                      <AssessmentItemEditor
                        key={editing === true ? "new" : editing.id}
                        item={editing === true ? undefined : editing}
                        defaults={defaults}
                        onCancel={() => setEditing(null)}
                        onSave={async (raw) => {
                          const item = validateItem(raw);
                          await store.putItem(item);
                          if (editing === true) await append(item);
                          else
                            await save((r) => ({
                              ...r,
                              assessmentItems: r.assessmentItems.map((x) =>
                                x.id === item.id ? item : x,
                              ),
                              usedFingerprints: [
                                ...r.usedFingerprints,
                                fingerprint(item),
                              ],
                            }));
                          setEditing(null);
                        }}
                      />
                    )}
                    <div className="flex gap-4">
                      <button
                        disabled={busy}
                        onClick={() => setEditing(true)}
                        className="border bg-white rounded-xl px-4 py-3 text-sm"
                      >
                        + إضافة سؤال
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            if (!data) return;
                            const next = await engine.add(data, record);
                            if (next) await append(next);
                            else setNotice(EMPTY_ASSESSMENT);
                          })
                        }
                        className="text-sm underline"
                      >
                        إضافة من البنك تلقائياً
                      </button>
                    </div>
                  </>
                )}
              </>
            )
          )}
          <p className="text-xs text-slate-500 leading-6">
            يعمل التقويم من البنك المحلي وقواعد تربوية. راجع الأسئلة والإجابات
            قبل اعتمادها. تُحفظ الأسئلة محلياً وتُزامن عند تسجيل الدخول وتوفر
            الاتصال.
          </p>
        </div>
      </main>
    </div>
  );
}
