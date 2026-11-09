import { CorrectionMemoData, fillFromPlatform } from './correctionMemoModel';
import { LessonMemo, MemoConfig } from '../types';

export interface MappedQuestion {
  number: string;
  text: string;
  points?: number | string;
}

export interface MappedExercise {
  number: string;
  title?: string;
  questions: MappedQuestion[];
}

export interface CorrectionSourceMapping {
  title?: string;
  exercises: MappedExercise[];
  totalPoints?: number | string;
  source: 'file' | 'ai';
}

export interface ExtractionOutcome {
  data: CorrectionMemoData;
  extractedExercises: number;
  extractedQuestions: number;
  extractedPoints: number;
  usedAI: boolean;
  notice: string;
  missing: string[];
}

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'];

export const isSupportedCorrectionFile = (file: File): boolean =>
  acceptedTypes.includes(file.type) || /\.(jpe?g|png|webp|gif|pdf|txt)$/i.test(file.name);

export const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
  reader.readAsDataURL(file);
});

const decodeTextDataUrl = (dataUrl: string): string => {
  try {
    const base64 = dataUrl.split(',')[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '';
  }
};

/**
 * استخراج التمارين من نص ورقة التقييم محليًا، دون أي تخمين:
 * يعتمد على ترويسات التمارين والأسئلة المرقّمة، ويتجاهل ما لا يفهمه.
 */
export function parseExamTextLocally(text: string): CorrectionSourceMapping | null {
  const cleaned = (text || '')
    .replace(/\r/g, '')
    .replace(/[\u0660-\u0669]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\u06F0-\u06F9]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

  if (!cleaned.trim()) return null;

  const exercisePattern = /(?:^|\n)\s*(التمرين|الوضعية\s+الإدماجية|الوضعية\s+الادماجية|الجزء\s+(?:الأول|الثاني|الاول|الثاني))\s*([0-9]*)?\s*[::.\-–]?\s*/g;
  const matches = Array.from(cleaned.matchAll(exercisePattern));
  if (!matches.length) return null;

  const exercises: MappedExercise[] = [];
  matches.forEach((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index || cleaned.length) : cleaned.length;
    const body = cleaned.slice(start, end);
    const heading = match[1].includes('الجزء') ? 'الجزء' : match[1];
    const number = match[2] || String(index + 1);

    const questionPattern = /(?:^|\n)\s*(?:([0-9]{1,2})\s*[)\-–.:]|([0-9]{1,2})\s+)([\s\S]*?)(?=\n\s*(?:[0-9]{1,2})\s*[)\-–.:]|\n\s*(?:التمرين|الجزء|الوضعية)|$)/g;
    const questionMatches = Array.from(body.matchAll(questionPattern));
    const questions: MappedQuestion[] = questionMatches
      .map(questionMatch => {
        const questionNumber = questionMatch[1] || questionMatch[2] || '';
        const rawText = (questionMatch[3] || '').trim();
        const pointsMatch = rawText.match(/\(?\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:نقطة|نقاط|ن|pts?|points?)\s*\)?/i);
        const textWithoutPoints = pointsMatch ? rawText.replace(pointsMatch[0], '').trim() : rawText;
        if (!textWithoutPoints && !pointsMatch) return null;
        const result: MappedQuestion = { number: questionNumber, text: textWithoutPoints };
        if (pointsMatch) result.points = Number(pointsMatch[1].replace(',', '.'));
        return result;
      })
      .filter((item): item is MappedQuestion => Boolean(item));

    if (questions.length) {
      exercises.push({ number, title: heading, questions });
    }
  });

  if (!exercises.length) return null;

  const totalMatch = cleaned.match(/(?:المجموع|مجموع\s+النقاط|العلامة\s+النهائية)\s*[::]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:ن|نقطة)?/);
  return {
    exercises,
    totalPoints: totalMatch ? Number(totalMatch[1].replace(',', '.')) : undefined,
    source: 'file',
  };
}

/**
 * الاستيراد: يقرأ نص TXT محليًا، ويحاول قراءة بقية الصيغ عبر خدمة المنصة.
 * أي فشل يُعلن صراحة، ولا تُملأ خانات بالظن.
 */
export async function importCorrectionFile(args: {
  file: File;
  dataUrl: string;
  examType: 'فرض' | 'اختبار';
  current: CorrectionMemoData;
  lesson?: LessonMemo | null;
  config?: MemoConfig;
}): Promise<ExtractionOutcome> {
  const { file, dataUrl, examType, current, lesson, config } = args;
  const base = fillFromPlatform(current, { config, lesson, level: lesson?.level }).data;
  let mapping: CorrectionSourceMapping | null = null;
  let notice = '';
  let usedAI = false;

  if (file.type === 'text/plain' || /\.txt$/i.test(file.name)) {
    const text = decodeTextDataUrl(dataUrl);
    mapping = parseExamTextLocally(text);
    if (!mapping) {
      notice = 'لم أتعرف على تمارين مرقّمة في الملف النصي. حرّر التمارين يدويًا.';
    }
  } else {
    try {
      const response = await fetch('/api/gemini/analyze-correction-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          examText: '',
          attachments: [{ name: file.name, mimeType: file.type, size: file.size, dataUrl }],
        }),
      });
      if (response.ok) {
        const payload = await response.json();
        if (typeof payload?.json === 'string' && payload.json.trim()) {
          const parsed = JSON.parse(payload.json);
          const exercises: MappedExercise[] = Array.isArray(parsed?.exercises)
            ? parsed.exercises.map((exercise: any, index: number) => ({
                number: String(exercise?.number || index + 1),
                title: typeof exercise?.title === 'string' ? exercise.title : undefined,
                questions: Array.isArray(exercise?.questions)
                  ? exercise.questions.map((question: any, qIndex: number) => ({
                      number: String(question?.number || qIndex + 1),
                      text: typeof question?.text === 'string' ? question.text : '',
                      points: question?.points,
                    }))
                  : [],
              })).filter((exercise: MappedExercise) => exercise.questions.length > 0)
            : [];
          if (exercises.length) {
            mapping = { exercises, totalPoints: parsed?.totalPoints, source: 'ai' };
            usedAI = true;
          } else {
            notice = 'لم أستخرج أسئلة قابلة للاعتماد من الملف. أدخل التمارين يدويًا.';
          }
        } else {
          notice = 'لم تُرجِع خدمة التحليل بيانات قابلة للقراءة. أدخل التمارين يدويًا.';
        }
      } else if (response.status === 503) {
        notice = 'قراءة الصور وPDF تحتاج مزوّد ذكاء اصطناعي مضبوطًا على الخادم، وهو غير متوفر حاليًا. أدخل التمارين يدويًا.';
      } else {
        notice = 'تعذر تحليل الملف. أدخل التمارين يدويًا.';
      }
    } catch {
      notice = 'تعذر الاتصال بخدمة التحليل. أدخل التمارين يدويًا.';
    }
  }

  if (!mapping) {
    return { data: { ...base, examType }, extractedExercises: 0, extractedQuestions: 0, extractedPoints: 0, usedAI: false, notice, missing: ['التمارين', 'الأسئلة', 'النقاط'] };
  }

  const exercises = mapping.exercises.slice(0, 12).map((exercise, index) => ({
    id: `${Date.now().toString(36)}-${index}`,
    part: (1 as const),
    label: exercise.title && exercise.title !== 'التمرين' ? `${exercise.title} ${exercise.number} — ${file.name}` : `التمرين ${exercise.number}`,
    declaredPoints: '',
    maqta: base.exercises[index]?.maqta || '',
    knowledge: base.exercises[index]?.knowledge || '',
    criteria: base.exercises[index]?.criteria || '',
    source: 'imported' as const,
    questions: exercise.questions.map((question, qIndex) => ({
      id: `q-${Date.now().toString(36)}-${index}-${qIndex}`,
      number: question.number || String(qIndex + 1),
      text: (question.text || '').trim(),
      points: question.points === undefined || question.points === null || question.points === '' ? '' : String(question.points),
      expected: '',
      source: 'imported' as const,
      needsReview: !question.text,
    })),
  }));

  const extractedQuestions = exercises.reduce((sum, exercise) => sum + exercise.questions.length, 0);
  const extractedPoints = exercises.reduce((sum, exercise) => sum + exercise.questions.filter(question => question.points && !Number.isNaN(Number(question.points))).length, 0);

  const part1Declared = typeof mapping.totalPoints === 'number' && Number.isFinite(mapping.totalPoints)
    ? String(mapping.totalPoints)
    : base.part1DeclaredPoints;

  const missing: string[] = [];
  if (!exercises.some(exercise => exercise.questions.some(question => question.points))) missing.push('النقاط الجزئية (لم تُقرأ من الورقة)');
  missing.push('عناصر الإجابة (تُكتب يدويًا أو تُولَّد آليًا)');
  missing.push('المعايير ومؤشرات الوضعية الإدماجية');
  missing.push('نتائج القسم وخطة المعالجة');

  const data: CorrectionMemoData = {
    ...base,
    examType,
    part1DeclaredPoints: part1Declared,
    exercises,
  };

  return {
    data,
    extractedExercises: exercises.length,
    extractedQuestions,
    extractedPoints,
    usedAI,
    notice: notice || (usedAI ? 'استُخرجت التمارين عبر خدمة التحليل؛ راجع كل سؤال ونقطة قبل الاعتماد.' : 'استُخرجت التمارين من الملف النصي؛ راجعها قبل الاعتماد.'),
    missing,
  };
}
