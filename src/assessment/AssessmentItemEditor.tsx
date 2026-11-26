import React, { useState } from "react";
import { ASSESSMENT_TYPES, newId, type AssessmentItem } from "./types";
export function AssessmentItemEditor({
  item,
  defaults,
  onSave,
  onCancel,
}: {
  item?: AssessmentItem;
  defaults?: Partial<AssessmentItem>;
  onSave: (item: AssessmentItem) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<AssessmentItem>(() =>
    item
      ? { ...item }
      : {
          id: newId(),
          subject: "علوم الطبيعة والحياة",
          level: "1am",
          domain: "",
          type: "direct",
          question: "",
          difficulty: "medium",
          keywords: [],
          tags: [],
          active: true,
          ...defaults,
        },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const field = (
    key: keyof AssessmentItem,
    label: string,
    required = false,
  ) => (
    <label className="grid gap-1 text-xs font-bold">
      {label}
      <input
        required={required}
        value={String(value[key] || "")}
        onChange={(e) => setValue((v) => ({ ...v, [key]: e.target.value }))}
        className="border rounded-lg p-2 font-normal"
        maxLength={2000}
      />
    </label>
  );
  return (
    <form
      aria-label="تحرير سؤال التقويم"
      className="border rounded-2xl p-4 space-y-3 bg-slate-50"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onSave(value);
        } catch (error) {
          setError(
            error instanceof Error ? error.message : "تعذر حفظ السؤال محلياً.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs grid gap-1">
          نوع السؤال
          <select
            value={value.type}
            onChange={(e) =>
              setValue({
                ...value,
                type: e.target.value as AssessmentItem["type"],
              })
            }
            className="border rounded-lg p-2"
          >
            {Object.entries(ASSESSMENT_TYPES).map(([key, title]) => (
              <option key={key} value={key}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs grid gap-1">
          درجة الصعوبة
          <select
            value={value.difficulty}
            onChange={(e) =>
              setValue({
                ...value,
                difficulty: e.target.value as AssessmentItem["difficulty"],
              })
            }
            className="border rounded-lg p-2"
          >
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
        </label>
      </div>
      <label className="text-xs grid gap-1">
        السؤال
        <textarea
          required
          rows={4}
          maxLength={12000}
          value={value.question}
          onChange={(e) => setValue({ ...value, question: e.target.value })}
          className="border rounded-lg p-2 leading-7"
          placeholder="أدرج نص السند أو الاختيارات أو العبارات المطلوبة ضمن السؤال."
        />
      </label>
      <label className="text-xs grid gap-1">
        الإجابة المنتظرة
        <textarea
          rows={3}
          maxLength={16000}
          value={value.expectedAnswer || ""}
          onChange={(e) =>
            setValue({ ...value, expectedAnswer: e.target.value })
          }
          className="border rounded-lg p-2 leading-7"
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        {field("objective", "الهدف")}
        {field("concept", "المفهوم")}
        {field("domain", "المجال", true)}
        {field("unit", "الوحدة")}
        {field("lesson", "الدرس")}
        {field("competency", "الكفاءة")}
        <label className="text-xs grid gap-1">
          المستوى (تصنيف داخلي)
          <select
            value={value.level}
            onChange={(e) => setValue({ ...value, level: e.target.value })}
            className="border rounded-lg p-2"
          >
            {["1am", "2am", "3am", "4am"].map((l, i) => (
              <option key={l} value={l}>
                السنة {i + 1} متوسط
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs grid gap-1">
          سلم التنقيط (اختياري)
          <input
            type="number"
            min="0"
            max="100"
            step="0.25"
            value={value.points ?? ""}
            onChange={(e) =>
              setValue({
                ...value,
                points:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="border rounded-lg p-2"
          />
        </label>
      </div>
      <label className="text-xs grid gap-1">
        الكلمات المفتاحية (بفاصلة)
        <input
          value={value.keywords.join("، ")}
          onChange={(e) =>
            setValue({
              ...value,
              keywords: e.target.value.split(/[,،]/).map((s) => s.trim()),
            })
          }
          className="border rounded-lg p-2"
        />
      </label>
      <label className="text-xs grid gap-1">
        التصنيف / الوسوم
        <input
          value={value.tags.join("، ")}
          onChange={(e) =>
            setValue({
              ...value,
              tags: e.target.value.split(/[,،]/).map((s) => s.trim()),
            })
          }
          className="border rounded-lg p-2"
        />
      </label>
      {error && (
        <p role="alert" className="text-red-700 text-sm">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          disabled={busy}
          className="bg-teal-700 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-40"
        >
          حفظ في بنك التقويم
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
