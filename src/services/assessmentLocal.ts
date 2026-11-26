import type { LessonMemo } from "../types";
import {
  AssessmentExam,
  ExerciseProposal,
  examCounts,
  examMaqta,
  examMawrid,
  partOneExercises,
} from "./assessmentModel";
import {
  applyCorrectionSuggestions,
  suggestAnswersForExercises,
  type CorrectionSuggestionsResult,
} from "./correctionMemoLocalAnswers";
import { AssessmentEngine } from "../assessment/AssessmentEngine";
import {
  AssessmentStore,
  getAssessmentStore,
} from "../assessment/assessmentStore";
import { AssessmentRulesEngine } from "../assessment/AssessmentRulesEngine";
import {
  EMPTY_ASSESSMENT,
  fingerprint,
  hash,
  lessonData,
  newId,
  normalize,
  type AssessmentRecord,
} from "../assessment/types";
export interface ThirdExerciseProposal extends ExerciseProposal {
  rationale: string;
  needsReview: true;
  bankRecord: AssessmentRecord;
}
export interface ProposalResult {
  proposal: ThirdExerciseProposal | null;
  error?: string;
}
function resolveLesson(
  exam: AssessmentExam,
  curriculum: LessonMemo[],
  lesson?: LessonMemo | null,
) {
  if (lesson && lesson.level === exam.level) return lesson;
  const resource = normalize(examMawrid(exam)),
    unit = normalize(examMaqta(exam));
  if (!resource && !unit) return null;
  const matches = curriculum.filter(
    (l) =>
      l.level === exam.level &&
      (!unit || normalize(l.maqta) === unit) &&
      (!resource ||
        [l.mawrid, l.ta3alom].some((s) => normalize(s) === resource)),
  );
  return matches.length === 1 ? matches[0] : null;
}
/** Purely local bank proposal. It is reserved atomically only when the teacher accepts it. */
export async function proposeNextExercise(
  exam: AssessmentExam,
  curriculum: LessonMemo[],
  lesson?: LessonMemo | null,
  store: AssessmentStore = getAssessmentStore(),
): Promise<ProposalResult> {
  const selected = resolveLesson(exam, curriculum, lesson);
  if (!selected) return { proposal: null, error: EMPTY_ASSESSMENT };
  const data = lessonData(selected),
    engine = new AssessmentEngine(store);
  const existing = partOneExercises(exam)
    .flatMap((e) => e.questions.map((q) => normalize(q.text)))
    .filter(Boolean);
  const ranked = (await engine.ranked(data)).filter(
    (item) =>
      !existing.some(
        (text) =>
          normalize(item.question) === text ||
          (text.length > 15 && normalize(item.question).endsWith(text)),
      ),
  );
  const items = AssessmentRulesEngine.select(ranked, data, 3);
  if (!items.length) return { proposal: null, error: EMPTY_ASSESSMENT };
  const now = new Date().toISOString();
  const bankRecord: AssessmentRecord = {
    id: newId(),
    lessonId: data.lessonId,
    memoId: `exam-${hash(exam.id)}`,
    assessment: { title: exam.title, variant: "correction" },
    assessmentItems: items,
    usedItemIds: items.map((i) => i.id),
    usedFingerprints: items.map(fingerprint),
    createdAt: now,
    updatedAt: now,
  };
  return {
    proposal: {
      label: `التمرين ${partOneExercises(exam).length + 1}`,
      maqta: data.unit,
      knowledge: selected.marifa || selected.mawrid,
      criteria: selected.ma3ayirTaqwim || "",
      source: "platform",
      questions: items.map((i) => ({
        text: i.question,
        expected: i.expectedAnswer || "",
        points: i.points === undefined ? "" : String(i.points),
      })),
      rationale:
        "اختيار محلي مطابق لمفاهيم الدرس وأهدافه، مع تنويع أنماط التفكير واستبعاد الأسئلة المستخدمة.",
      needsReview: true,
      bankRecord,
    },
  };
}
export interface AnswersOutcome {
  result: CorrectionSuggestionsResult;
  memo: AssessmentExam["memo"];
  applied: number;
  skipped: number;
}
export async function generateExamAnswers(
  exam: AssessmentExam,
  curriculum: LessonMemo[],
  lesson?: LessonMemo | null,
  exerciseId?: string,
  store: AssessmentStore = getAssessmentStore(),
): Promise<AnswersOutcome | null> {
  const result = await suggestAnswersForExercises({
    data: exam.memo,
    exercises: exerciseId
      ? exam.memo.exercises.filter((e) => e.id === exerciseId)
      : exam.memo.exercises,
    lesson: resolveLesson(exam, curriculum, lesson),
    curriculum,
    store,
  });
  if (!result) return null;
  const applied = applyCorrectionSuggestions(exam.memo, result);
  return {
    result,
    memo: applied.data,
    applied: applied.applied,
    skipped: applied.skipped,
  };
}
/** صياغة سياق محادثة المساعد انطلاقًا من تحليل التقويم (تكامل دون دمج الواجهتين). */
export function buildRemediationAssistantPrompt(
  exam: AssessmentExam,
  input: {
    resource: string;
    difficulty: string;
    learners: string;
    achievement?: number;
    error?: string;
  },
): string {
  const counts = examCounts(exam);
  return [
    "لديّ نتيجة تحليل تقويم وأحتاج مساعدتك في المعالجة البيداغوجية.",
    `الاختبار: ${exam.title} (${exam.examType}) — ${exam.memo.level || exam.level}.`,
    `عدد التمارين: ${counts.exercises} · الأسئلة: ${counts.questions} · العلامة: ${counts.points}.`,
    examMaqta(exam) || exam.memo.midan
      ? `المقطع/الميدان: ${exam.memo.midan || ""} — ${examMaqta(exam) || ""}`
      : "",
    `المورد غير المتحكم فيه: ${input.resource || "غير محدد"}.`,
    `نوع الصعوبة الملاحظ: ${input.difficulty || "غير محدد"}${typeof input.achievement === "number" ? ` (متوسط التحصيل ${input.achievement}%)` : ""}.`,
    `المتعلمون المعنيون: ${input.learners || "غير محددين بالاسم"}.`,
    input.error ? `وصف الخطأ المتكرر: ${input.error}` : "",
    "",
    "أجب بهذا الترتيب وبإيجاز:",
    "1) النتيجة: تشخيص تربوي للمورد غير المتحكم فيه (استنتاج من المعطيات، وسم ما هو احتمال).",
    "2) الشرح: سبب الصعوبة المحتمل وما يجب التحقق منه.",
    "3) النشاط العلاجي المقترح: خطوات قابلة للتنفيذ في حصة واحدة مع الزمن التقريبي.",
    "4) الوسيلة/السند المطلوب.",
    "5) مؤشر النجاح القابل للقياس.",
    "6) المصدر: من المنهاج/الوثيقة المرافقة/دليل الأستاذ مع رقم الصفحة إن وُجد، أو اكتب «لم أجد معلومة مؤكدة في المصادر المتاحة».",
    "لا تنسب أي محتوى جديد إلى المصادر الرسمية؛ ضعه تحت وسم «اقتراح تربوي — يحتاج مراجعة الأستاذ».",
  ]
    .filter(Boolean)
    .join("\n");
}
