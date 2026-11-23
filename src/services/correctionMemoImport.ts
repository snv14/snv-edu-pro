import { CorrectionMemoData, INTEGRATION_CRITERIA, examStructure, fillFromPlatform, uid } from './correctionMemoModel';
import { LessonMemo, MemoConfig } from '../types';
import type { AgentAnalysis, AgentReadResponse } from './documentAgent';

export interface MappedQuestion {
  number: string;
  text: string;
  points?: number | string;
  expected?: string;
}

export interface MappedExercise {
  number: string;
  title?: string;
  kind?: 'exercise' | 'integration';
  questions: MappedQuestion[];
}

export interface MappedMeta {
  level?: string;
  midan?: string;
  maqta?: string;
  kafaa?: string;
  mawrid?: string;
  term?: string;
  duration?: string;
  title?: string;
}

export interface CorrectionSourceMapping {
  title?: string;
  meta?: MappedMeta;
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

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME = 'application/msword';

const acceptedTypes = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain', DOCX_MIME, DOC_MIME,
];

export const isSupportedCorrectionFile = (file: File): boolean =>
  acceptedTypes.includes(file.type) || /\.(jpe?g|png|webp|gif|pdf|txt|docx?)$/i.test(file.name);

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

const isIntegrationHeading = (heading: string): boolean =>
  /الوضعية\s*(الإدماجية|الادماجية)/.test(heading) || /وضعية\s*إدماجية/.test(heading);

/**
 * استخراج التمارين من نص ورقة التقييم محليًا، دون أي تخمين:
 * يعتمد على ترويسات التمارين والأسئلة المرقّمة، ويعزل الوضعية الإدماجية.
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
      const integration = isIntegrationHeading(match[1]);
      exercises.push({
        number,
        title: heading,
        kind: integration ? 'integration' : 'exercise',
        questions,
      });
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

const toPointsString = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '';
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? String(parsed) : '';
};

const asText = (value: unknown, max = 4000): string => (typeof value === 'string' ? value.slice(0, max) : '');

const normalizeMeta = (parsed: any): MappedMeta => ({
  level: asText(parsed?.meta?.level, 80),
  midan: asText(parsed?.meta?.midan, 300),
  maqta: asText(parsed?.meta?.maqta, 300),
  kafaa: asText(parsed?.meta?.kafaa, 800),
  mawrid: asText(parsed?.meta?.mawrid, 300),
  term: asText(parsed?.meta?.term, 60),
  duration: asText(parsed?.meta?.duration, 60),
  title: asText(parsed?.meta?.title, 200),
});

const normalizeExercises = (parsed: any): MappedExercise[] =>
  Array.isArray(parsed?.exercises)
    ? parsed.exercises
      .map((exercise: any, index: number): MappedExercise => {
        const title = asText(exercise?.title, 120);
        return {
          number: String(exercise?.number || index + 1),
          title: title || undefined,
          kind: exercise?.kind === 'integration' || isIntegrationHeading(title) ? 'integration' : 'exercise',
          questions: Array.isArray(exercise?.questions)
            ? exercise.questions
              .map((question: any, qIndex: number): MappedQuestion => ({
                number: String(question?.number || qIndex + 1),
                text: asText(question?.text, 2000).trim(),
                points: question?.points,
                expected: asText(question?.expected, 4000),
              }))
              .filter(question => question.text || question.expected)
            : [],
        };
      })
      .filter((exercise: MappedExercise) => exercise.questions.length > 0)
    : [];

/**
 * تطبيق بنية الورقة على التمارين المستخرجة:
 * الفرض يحتفظ بالتمارين فقط، والاختبار بتمرينين ثم وضعية إدماجية في معاييرها.
 */
const buildExercises = (
  mapping: CorrectionSourceMapping,
  examType: 'فرض' | 'اختبار',
  base: CorrectionMemoData,
  fileName: string
) => {
  const structure = examStructure(examType);
  const plain = mapping.exercises.filter(exercise => exercise.kind !== 'integration');
  const integration = mapping.exercises.filter(exercise => exercise.kind === 'integration');
  const selected = plain.slice(0, examType === 'اختبار' ? structure.exercises : 6);

  const exercises = selected.map((exercise, index) => {
    const fallbackLabel = index === 0 ? 'التمرين الأول' : index === 1 ? 'التمرين الثاني' : `التمرين ${index + 1}`;
    const fromFile = exercise.title && !/^(التمرين|الجزء)$/.test(exercise.title)
      ? `${exercise.title} ${exercise.number}`
      : fallbackLabel;
    return {
      id: uid('ex'),
      part: 1 as const,
      label: `${fromFile} — ${fileName}`.slice(0, 120),
      declaredPoints: '',
      maqta: base.exercises[index]?.maqta || '',
      knowledge: base.exercises[index]?.knowledge || '',
      criteria: base.exercises[index]?.criteria || '',
      source: 'imported' as const,
      questions: exercise.questions.map((question, qIndex) => ({
        id: uid('q'),
        number: question.number || String(qIndex + 1),
        text: (question.text || '').trim(),
        points: toPointsString(question.points),
        expected: (question.expected || '').trim(),
        source: (question.expected ? 'ai' : 'imported') as 'ai' | 'imported',
        needsReview: !question.text,
      })),
    };
  });

  return { exercises, integration };
};

export interface ImportCorrectionArgs {
  file: File;
  dataUrl: string;
  examType: 'فرض' | 'اختبار';
  current: CorrectionMemoData;
  lesson?: LessonMemo | null;
  config?: MemoConfig;
  /** قراءة عبر وكيل المستندات المحلي بدل مسار التحليل العادي. */
  viaAgent?: boolean;
}

/** تحويل تحليل وكيل المستندات إلى صيغة المصدر التي يستهلكها قالب التصحيح. */
export function correctionMappingFromAgentAnalysis(
  analysis: AgentAnalysis,
  fileName: string,
): CorrectionSourceMapping | null {
  if (!analysis.exercises.length) return null;
  const best = analysis.matches[0];
  const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : analysis.title;
  return {
    title: baseName,
    meta: {
      level: analysis.levelLabel,
      midan: best?.midan || '',
      maqta: best?.maqta || '',
      kafaa: best?.kafaa || '',
      mawrid: best?.mawrid || '',
      term: '',
      duration: '',
      title: baseName,
    },
    exercises: analysis.exercises.map(exercise => ({
      number: exercise.number,
      title: exercise.title,
      kind: exercise.kind,
      questions: exercise.questions.map(question => ({
        number: question.number,
        text: question.text,
        points: question.points === null ? undefined : question.points,
      })),
    })),
    totalPoints: analysis.totalPoints ?? (analysis.pointsSum > 0 ? analysis.pointsSum : undefined),
    source: 'file',
  };
}

/**
 * الاستيراد: يقرأ TXT محليًا، ويقرأ PDF والصور وWord عبر خدمة المنصة.
 * يُعبّئ التمارين ثم الحقول التربوية (الميدان/المقطع/الكفاءة) ثم يطبّق بنية
 * نوع الورقة. أي فشل يُعلن صراحة، ولا تُملأ خانات بالظن.
 */
export async function importCorrectionFile(args: ImportCorrectionArgs): Promise<ExtractionOutcome> {
  const { file, dataUrl, examType, current, lesson, config, viaAgent = false } = args;
  const base = fillFromPlatform(current, { config, lesson, level: lesson?.level }).data;
  let mapping: CorrectionSourceMapping | null = null;
  let notice = '';
  let usedAI = false;
  let providerError = '';

  if (file.type === 'text/plain' || /\.txt$/i.test(file.name)) {
    const text = decodeTextDataUrl(dataUrl);
    mapping = parseExamTextLocally(text);
    if (!mapping) {
      notice = 'لم أتعرف على تمارين مرقّمة في الملف النصي. حرّر التمارين يدويًا.';
    }
  } else if (viaAgent) {
    try {
      const response = await fetch('/api/agent/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type,
          dataUrl,
          examType,
          level: lesson?.level || '',
        }),
      });
      const payload = await response.json().catch(() => ({} as AgentReadResponse));
      if (!response.ok) {
        notice = typeof (payload as any)?.error === 'string'
          ? `تعذر على وكيل المستندات قراءة الملف: ${(payload as any).error}. أدخل التمارين يدويًا.`
          : 'تعذر على وكيل المستندات قراءة الملف. أدخل التمارين يدويًا.';
      } else if ((payload as AgentReadResponse)?.read?.needsVision) {
        notice = 'وكيل المستندات قرأ الملف لكن الصور والوثائق المصوّرة تحتاج OCR أو إدخال النص يدويًا. لم يُملأ القالب.';
      } else {
        const agentAnalysis = (payload as AgentReadResponse)?.analysis;
        mapping = agentAnalysis ? correctionMappingFromAgentAnalysis(agentAnalysis, file.name) : null;
        if (!mapping) notice = 'لم يستخرج وكيل المستندات تمارين مرقّمة من الملف. أدخل التمارين يدويًا أو الصق النص.';
      }
    } catch {
      notice = 'تعذر الاتصال بوكيل المستندات. أدخل التمارين يدويًا.';
    }
  } else {
    try {
      const response = await fetch('/api/correction/analyze-source', {
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
          const exercises = normalizeExercises(parsed);
          if (exercises.length) {
            mapping = {
              title: asText(parsed?.title, 200),
              meta: normalizeMeta(parsed),
              exercises,
              totalPoints: parsed?.totalPoints,
              source: payload?.provider === 'local' ? 'file' : 'ai',
            };
            usedAI = payload?.provider !== 'local';
          } else {
            notice = 'لم أستخرج أسئلة قابلة للاعتماد من الملف. أدخل التمارين يدويًا.';
          }
        } else {
          notice = 'لم تُرجِع خدمة التحليل بيانات قابلة للقراءة. أدخل التمارين يدويًا.';
        }
      } else {
        const body = await response.json().catch(() => ({}));
        providerError = typeof body?.error === 'string' ? body.error : '';
        if (response.status === 503) {
          notice = 'لم أقرأ تمارين من هذا الملف. الصور والوثائق المصوّرة تحتاج OCR أو نصًا بديلًا يدويًا، أما PDF النصي وWord فيُقرآن محليًا. أدخل التمارين يدويًا أو الصق النص ثم استعمل «تعبئة من قاعدة البيانات» و«اقتراح التنقيط».';
        } else if (/\.doc$/i.test(file.name)) {
          notice = 'صيغة .doc القديمة غير مدعومة. احفظ الملف بصيغة .docx أو PDF ثم أعد الاستيراد.';
        } else {
          notice = providerError
            ? `تعذر تحليل الملف: ${providerError}. أدخل التمارين يدويًا.`
            : 'تعذر تحليل الملف. أدخل التمارين يدويًا.';
        }
      }
    } catch {
      notice = 'تعذر الاتصال بخدمة التحليل. أدخل التمارين يدويًا.';
    }
  }

  if (!mapping) {
    return {
      data: { ...base, examType },
      extractedExercises: 0,
      extractedQuestions: 0,
      extractedPoints: 0,
      usedAI: false,
      notice,
      missing: ['التمارين', 'الأسئلة', 'النقاط'],
    };
  }

  const { exercises, integration } = buildExercises(mapping, examType, base, file.name);

  const integrationQuestions = integration.flatMap(exercise => exercise.questions);
  const criteria = base.integration.criteria.map(criterion => structuredClone(criterion));
  if (examType === 'اختبار' && integrationQuestions.length) {
    integrationQuestions.forEach((question, index) => {
      const criterion = criteria[index % criteria.length];
      const indicator = criterion.indicators.find(item => !item.text.trim()) || criterion.indicators[0];
      if (!indicator) return;
      indicator.text = (question.expected || question.text || '').slice(0, 1000);
      if (question.points !== undefined && question.points !== '') {
        indicator.points = toPointsString(question.points);
      }
    });
  }

  const extractedQuestions = exercises.reduce((sum, exercise) => sum + exercise.questions.length, 0)
    + (examType === 'اختبار' ? integrationQuestions.length : 0);
  const extractedPoints = exercises.reduce(
    (sum, exercise) => sum + exercise.questions.filter(question => question.points && !Number.isNaN(Number(question.points))).length,
    0
  );

  const meta = mapping.meta || {};
  const structure = examStructure(examType);
  const part1Declared = typeof mapping.totalPoints === 'number'
    ? String(Math.min(Number(mapping.totalPoints), 20))
    : String(structure.part1Points);

  const missing: string[] = [];
  if (!exercises.some(exercise => exercise.questions.some(question => question.points))) missing.push('النقاط الجزئية (لم تُقرأ من الورقة)');
  if (!exercises.some(exercise => exercise.questions.some(question => question.expected))) missing.push('عناصر الإجابة (تُكتب يدويًا أو تُولَّد آليًا)');
  if (!meta.midan) missing.push('الميدان (يمكن تعبئته من قاعدة البيانات)');
  if (!meta.kafaa) missing.push('الكفاءة الختامية (يمكن تعبئتها من قاعدة البيانات)');
  if (examType === 'اختبار' && !integrationQuestions.length) missing.push('الوضعية الإدماجية (لم تُقرأ من الورقة)');

  const data: CorrectionMemoData = {
    ...base,
    examType,
    title: base.title,
    term: meta.term || base.term,
    duration: meta.duration || base.duration,
    level: meta.level || base.level,
    midan: meta.midan || base.midan,
    midanSource: meta.midan ? 'ai' : base.midanSource,
    competence: meta.kafaa || base.competence,
    competenceSource: meta.kafaa ? 'ai' : base.competenceSource,
    part1DeclaredPoints: part1Declared,
    integration: {
      declaredPoints: examType === 'اختبار' ? String(structure.integrationPoints) : '',
      criteria,
    },
    exercises,
  };

  // صفوف الموارد تُبنى من جديد لتطابق التمارين المستخرجة، مع نقل ما عُبّئ من المنصة.
  data.resources = exercises.map((exercise, index) => {
    const existing = base.resources[index];
    return {
      id: uid('res'),
      exerciseLabel: exercise.label,
      maqta: meta.maqta || existing?.maqta || '',
      knowledge: meta.mawrid || existing?.knowledge || '',
      criteria: existing?.criteria || '',
      maqtaSource: (meta.maqta ? 'ai' : existing?.maqtaSource || 'template') as CorrectionMemoData['resources'][number]['maqtaSource'],
      knowledgeSource: (meta.mawrid ? 'ai' : existing?.knowledgeSource || 'template') as CorrectionMemoData['resources'][number]['knowledgeSource'],
      criteriaSource: (existing?.criteriaSource || 'template') as CorrectionMemoData['resources'][number]['criteriaSource'],
    };
  });
  if (examType === 'اختبار') {
    const integrationRow = base.resources.find(row => row.exerciseLabel.includes('الإدماجية'));
    data.resources.push({
      id: uid('res'),
      exerciseLabel: 'الوضعية الإدماجية',
      maqta: meta.maqta || integrationRow?.maqta || '',
      knowledge: meta.mawrid || integrationRow?.knowledge || '',
      criteria: base.integration.criteria.map(criterion => criterion.label).join(' · '),
      maqtaSource: meta.maqta ? 'ai' : integrationRow?.maqtaSource || 'template',
      knowledgeSource: meta.mawrid ? 'ai' : integrationRow?.knowledgeSource || 'template',
      criteriaSource: 'platform',
    });
  }

  const summary = viaAgent
    ? 'قرأ وكيل المستندات الملف محليًا وعبّأ قالب التصحيح من قاعدة المنصة. راجع كل سؤال ونقطة قبل الاعتماد.'
    : usedAI
      ? 'قُرئ الملف عبر خدمة التحليل، وعُبّئت الحقول التربوية المتاحة. راجع كل سؤال ونقطة قبل الاعتماد.'
      : 'قُرئ الملف محليًا داخل المنصة، واستُخرجت التمارين والنقاط دون مزوّد خارجي. راجعها قبل الاعتماد.';

  return {
    data,
    extractedExercises: exercises.length,
    extractedQuestions,
    extractedPoints,
    usedAI,
    notice: notice || summary,
    missing,
  };
}

export const INTEGRATION_HEADING = INTEGRATION_CRITERIA.map(criterion => criterion.label).join(' · ');
