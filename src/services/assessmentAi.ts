import { LessonMemo } from '../types';
import {
  AssessmentExam,
  ExerciseProposal,
  examCounts,
  examMaqta,
  partOneExercises,
} from './assessmentModel';
import { applyCorrectionSuggestions, suggestAnswersForExercises, CorrectionSuggestionsResult } from './correctionMemoAi';

/**
 * خدمات الذكاء الاصطناعي الخاصة بالتقويم. كلها «مقترحات» تُعرض على الأستاذ
 * ولا تُطبَّق إلا باختياره، ولا تنسب نصًا رسميًا لمصدر لم يُقدَّم لها.
 */

export interface ThirdExerciseProposal extends ExerciseProposal {
  rationale: string;
  needsReview: true;
}

export interface ProposalResult {
  proposal: ThirdExerciseProposal | null;
  error?: string;
  provider?: string;
}

const asText = (value: unknown, max = 2000): string => (typeof value === 'string' ? value.slice(0, max) : '');

/** اقتراح تمرين موالٍ يكمل الاختبار دون تكرار مهارات التمرينين السابقين. */
export async function proposeNextExercise(
  exam: AssessmentExam,
  curriculum: LessonMemo[],
  lesson?: LessonMemo | null,
): Promise<ProposalResult> {
  const exercises = partOneExercises(exam);
  const level = exam.memo.level || exam.level;
  const sameLevel = curriculum.filter(item => item.level === (lesson?.level || exam.level));
  const scope = lesson
    ? [lesson, ...sameLevel.filter(item => item.maqta === lesson.maqta && item !== lesson)]
    : sameLevel.slice(0, 10);

  const prompt = [
    'أنت أداة مستقلة لإعداد تمرين إضافي لورقة تقويم في علوم الطبيعة والحياة بالتعليم المتوسط بالجزائر.',
    'المطلوب: تمرين واحد يكمل الاختبار الحالي، بنفس المقطع والمورد، دون تكرار المهارات التي قيّمها التمرينان السابقان.',
    'قواعد إلزامية:',
    '1. لا تغيّر نص الأسئلة الموجودة ولا ترتيبها؛ أنشئ تمرينًا جديدًا فقط.',
    '2. لا تخترع موردًا أو معيارًا غير موجود في السياق؛ ما لا تكفيه المعطيات اتركه فارغًا.',
    '3. اجعل الأسئلة متدرجة: استرجاع ثم استغلال وثيقة/تحليل ثم استنتاج.',
    '4. أعط لكل سؤال إجابة نموذجية مختصرة ونقطة مقترحة، ووسم السؤال الجديد بأنه اقتراح.',
    '5. أعد JSON فقط بهذه البنية دون أي نص خارجها:',
    '{"label":"التمرين الثالث","maqta":"","knowledge":"","criteria":"","rationale":"لماذا يكمل الاختبار","questions":[{"text":"","expected":"","points":"2"}]}',
    '',
    `نوع الورقة: ${exam.examType} — ${exam.title}`,
    `المستوى: ${level}`,
    `الوضعية الحالية للاختبار: ${examCounts(exam).exercises} تمارين، ${examCounts(exam).questions} سؤالًا، ${examCounts(exam).points} نقطة.`,
    '',
    'التمارين الحالية وأسئلتها (حافظ عليها كما هي):',
    JSON.stringify(exercises.map(exercise => ({
      label: exercise.label,
      maqta: exercise.maqta,
      knowledge: exercise.knowledge,
      criteria: exercise.criteria,
      questions: exercise.questions.map(question => ({ text: question.text, points: question.points })),
    })), null, 2),
    '',
    'المقطع والمورد المستهدف من قاعدة المنصة:',
    JSON.stringify(scope.slice(0, 8).map(item => ({
      level: item.level,
      midan: item.midan,
      maqta: item.maqta,
      mawrid: item.mawrid,
      ta3alom: item.ta3alom,
      markaba: item.markaba,
      kafaa: item.kafaaKhitamiya,
      criteria: item.ma3ayirTaqwim,
    })), null, 2),
  ].join('\n');

  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, useWeb: false }),
    });
    if (!response.ok) return { proposal: null, error: 'تعذر الوصول إلى خدمة التوليد. أضف التمرين يدويًا أو أعد المحاولة.' };
    const payload = await response.json();
    const raw = typeof payload?.text === 'string' ? payload.text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { proposal: null, error: 'لم يصل اقتراح بصيغة مفهومة. أعد المحاولة أو أضف التمرين يدويًا.' };
    const parsed = JSON.parse(match[0]);
    const questions = Array.isArray(parsed?.questions)
      ? parsed.questions
          .map((question: any) => ({
            text: asText(question?.text),
            expected: asText(question?.expected, 4000),
            points: question?.points === undefined || question?.points === null ? '' : String(question.points).slice(0, 20),
          }))
          .filter((question: { text: string }) => question.text.trim())
          .slice(0, 10)
      : [];
    if (!questions.length) return { proposal: null, error: 'الاقتراح وصل بلا أسئلة صالحة. أضف التمرين يدويًا.' };
    return {
      proposal: {
        label: asText(parsed?.label, 120) || `التمرين ${exercises.length + 1}`,
        maqta: asText(parsed?.maqta, 300) || exercises[exercises.length - 1]?.maqta || '',
        knowledge: asText(parsed?.knowledge, 4000) || exercises[exercises.length - 1]?.knowledge || '',
        criteria: asText(parsed?.criteria, 4000) || exercises[exercises.length - 1]?.criteria || '',
        rationale: asText(parsed?.rationale, 1200),
        needsReview: true,
        source: 'ai',
        questions,
      },
      provider: payload?.provider,
    };
  } catch (error) {
    console.error('[assessment-ai] exercise proposal failed', error);
    return { proposal: null, error: 'تعذر توليد الاقتراح. تحقق من إعداد مزوّد الذكاء الاصطناعي أو أضف التمرين يدويًا.' };
  }
}

export interface AnswersOutcome {
  result: CorrectionSuggestionsResult;
  memo: AssessmentExam['memo'];
  applied: number;
  skipped: number;
}

/** توليد عناصر الإجابة للتمارين المطلوبة فقط، دون المساس بما كتبه الأستاذ. */
export async function generateExamAnswers(
  exam: AssessmentExam,
  curriculum: LessonMemo[],
  lesson?: LessonMemo | null,
  exerciseId?: string,
): Promise<AnswersOutcome | null> {
  const targets = exerciseId
    ? exam.memo.exercises.filter(exercise => exercise.id === exerciseId)
    : exam.memo.exercises;
  const result = await suggestAnswersForExercises({
    data: exam.memo,
    exercises: targets,
    lesson: lesson || null,
    curriculum,
  });
  if (!result) return null;
  const applied = applyCorrectionSuggestions(exam.memo, result);
  return { result, memo: applied.data, applied: applied.applied, skipped: applied.skipped };
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
    'لديّ نتيجة تحليل تقويم وأحتاج مساعدتك في المعالجة البيداغوجية.',
    `الاختبار: ${exam.title} (${exam.examType}) — ${exam.memo.level || exam.level}.`,
    `عدد التمارين: ${counts.exercises} · الأسئلة: ${counts.questions} · العلامة: ${counts.points}.`,
    examMaqta(exam) || exam.memo.midan ? `المقطع/الميدان: ${exam.memo.midan || ''} — ${examMaqta(exam) || ''}` : '',
    `المورد غير المتحكم فيه: ${input.resource || 'غير محدد'}.`,
    `نوع الصعوبة الملاحظ: ${input.difficulty || 'غير محدد'}${typeof input.achievement === 'number' ? ` (متوسط التحصيل ${input.achievement}%)` : ''}.`,
    `المتعلمون المعنيون: ${input.learners || 'غير محددين بالاسم'}.`,
    input.error ? `وصف الخطأ المتكرر: ${input.error}` : '',
    '',
    'أجب بهذا الترتيب وبإيجاز:',
    '1) النتيجة: تشخيص تربوي للمورد غير المتحكم فيه (استنتاج من المعطيات، وسم ما هو احتمال).',
    '2) الشرح: سبب الصعوبة المحتمل وما يجب التحقق منه.',
    '3) النشاط العلاجي المقترح: خطوات قابلة للتنفيذ في حصة واحدة مع الزمن التقريبي.',
    '4) الوسيلة/السند المطلوب.',
    '5) مؤشر النجاح القابل للقياس.',
    '6) المصدر: من المنهاج/الوثيقة المرافقة/دليل الأستاذ مع رقم الصفحة إن وُجد، أو اكتب «لم أجد معلومة مؤكدة في المصادر المتاحة».',
    'لا تنسب أي محتوى جديد إلى المصادر الرسمية؛ ضعه تحت وسم «اقتراح تربوي — يحتاج مراجعة الأستاذ».',
  ].filter(Boolean).join('\n');
}
