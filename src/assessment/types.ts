import type { LessonMemo } from "../types";
export const ASSESSMENT_TYPES = {
  direct: "سؤال مباشر",
  blank: "أكمل الفراغ",
  boolean: "صح أو خطأ",
  mcq: "اختيار من متعدد",
  matching: "مطابقة",
  ordering: "ترتيب",
  document: "تحليل وثيقة",
  experiment: "تحليل تجربة",
  explanation: "تفسير نتيجة",
  conclusion: "استنتاج",
  application: "تطبيق",
  integration: "وضعية إدماجية",
  formative: "تقويم مرحلي",
  summative: "تقويم ختامي",
} as const;
export type AssessmentType = keyof typeof ASSESSMENT_TYPES;
export interface AssessmentItem {
  id: string;
  subject: string;
  level: string;
  domain: string;
  unit?: string;
  lesson?: string;
  objective?: string;
  competency?: string;
  concept?: string;
  type: AssessmentType;
  question: string;
  expectedAnswer?: string;
  difficulty: "easy" | "medium" | "hard";
  keywords: string[];
  tags: string[];
  templateId?: string;
  active: boolean;
  points?: number;
  updatedAt?: string;
}
export interface LessonAssessmentData {
  lessonId: string;
  memoId: string;
  lessonTitle: string;
  subject: string;
  level: string;
  domain: string;
  unit: string;
  objectives: string[];
  competencies: string[];
  activities: string[];
  concepts: string[];
  experiments: string[];
  keywords: string[];
  lesson: LessonMemo;
}
export interface AssessmentRecord {
  id: string;
  lessonId: string;
  memoId: string;
  assessment: { title: string; variant: "student" | "correction" };
  assessmentItems: AssessmentItem[];
  usedItemIds: string[];
  usedFingerprints: string[];
  createdAt: string;
  updatedAt: string;
}
export interface BankFilter {
  level?: string;
  domain?: string;
  unit?: string;
  lesson?: string;
  type?: string;
  difficulty?: string;
  search?: string;
}
export const EMPTY_ASSESSMENT =
  "لا توجد عناصر كافية لهذا الدرس. يمكنك إضافة عناصر جديدة إلى بنك التقويم.";
export const normalize = (s: string) =>
  String(s || "")
    .normalize("NFKC")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
export const words = (s: string) => [
  ...new Set(
    normalize(s)
      .split(" ")
      .filter(
        (w) =>
          w.length > 2 &&
          ![
            "على",
            "الى",
            "التي",
            "الذي",
            "خلال",
            "حول",
            "هذا",
            "هذه",
            "باستعمال",
            "النشاط",
          ].includes(w),
      ),
  ),
];
export const hash = (s: string) => {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++)
    n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return (n >>> 0).toString(36);
};
export const fingerprint = (item: Pick<AssessmentItem, "question">) =>
  hash(normalize(item.question));
export const newId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function lessonIdentity(lesson: LessonMemo): string {
  return `lesson-${hash([lesson.level, lesson.midan, lesson.maqta, lesson.mawrid, lesson.ta3alom, lesson.sourceLearningUnitId || ""].join("|"))}`;
}
export const memoIdentity = (lesson: LessonMemo) =>
  `memo-${hash(`${lessonIdentity(lesson)}|${lesson.memoNumber || ""}`)}`;
export function lessonData(lesson: LessonMemo): LessonAssessmentData {
  const split = (s = "") =>
    s
      .split(/[\n؛]/)
      .map((x) => x.trim())
      .filter(Boolean);
  const objectives = split(
    [lesson.marifa, lesson.manhaji, lesson.markaba].filter(Boolean).join("\n"),
  );
  const concepts = [
    ...new Set([...split(lesson.mostalahat), lesson.ta3alom, lesson.mawrid]),
  ].filter(Boolean);
  const activities = lesson.anshita.map((a) => [a.title, a.asila].join("\n"));
  return {
    lessonId: lessonIdentity(lesson),
    memoId: memoIdentity(lesson),
    lessonTitle: lesson.ta3alom || lesson.mawrid,
    subject: "علوم الطبيعة والحياة",
    level: lesson.level,
    domain: lesson.midan,
    unit: lesson.maqta,
    objectives,
    competencies: split(lesson.kafaaKhitamiya || lesson.markaba),
    concepts,
    activities,
    experiments: activities.filter((a) => /تجرب|نتائج/.test(a)),
    keywords: words(
      [lesson.ta3alom, lesson.mawrid, ...objectives, ...concepts].join(" "),
    ),
    lesson,
  };
}
export function validateItem(item: AssessmentItem): AssessmentItem {
  if (
    !item.id ||
    !/^[\w-]{1,128}$/.test(item.id) ||
    !["1am", "2am", "3am", "4am"].includes(item.level) ||
    !item.question.trim() ||
    !item.subject.trim() ||
    !item.domain.trim() ||
    !(item.type in ASSESSMENT_TYPES) ||
    !["easy", "medium", "hard"].includes(item.difficulty) ||
    !Array.isArray(item.keywords) ||
    !Array.isArray(item.tags)
  )
    throw new Error("راجع السؤال والمجال ونوع السؤال ودرجة الصعوبة.");
  if (
    item.question.length > 12000 ||
    (item.expectedAnswer?.length || 0) > 16000 ||
    item.keywords.length > 80 ||
    item.tags.length > 80
  )
    throw new Error("بيانات السؤال طويلة جداً.");
  if (
    item.points !== undefined &&
    (!Number.isFinite(item.points) || item.points < 0 || item.points > 100)
  )
    throw new Error("سلم التنقيط غير صالح.");
  return {
    ...item,
    question: item.question.trim(),
    updatedAt: new Date().toISOString(),
  };
}
export function assessmentText(record: AssessmentRecord): string {
  return record.assessmentItems
    .map((item, index) =>
      [
        `السؤال ${index + 1}${item.points !== undefined ? ` (${item.points} ن)` : ""}`,
        item.question,
        record.assessment.variant === "correction" && item.expectedAnswer
          ? `الإجابة المنتظرة: ${item.expectedAnswer}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}
