import type { LessonMemo } from '../types';
import { getOfficialCurriculumDatabase } from '../data/memos/curriculumDb';
import { normalizeArabic, tokenize } from './knowledgeBase';
import { examStructure } from './correctionMemoModel';
import { parseExamTextLocally } from './correctionMemoImport';

/**
 * محلّل المستندات المحلي للوكيل:
 * يستخرج بنية ورقة التقييم (تمارين/أسئلة/نقاط/وضعية إدماجية)، يحدّد المستوى،
 * ويطابق النص مع قاعدة بيانات المنصة (المذكرات والتدرجات) دون أي مزوّد ذكاء اصطناعي.
 */

export type AgentExamType = 'فرض' | 'اختبار' | 'غير محدد';

export interface AgentQuestion {
  number: string;
  text: string;
  points: number | null;
}

export interface AgentExercise {
  number: string;
  title: string;
  kind: 'exercise' | 'integration';
  points: number | null;
  questions: AgentQuestion[];
}

export interface AgentCurriculumMatch {
  level: string;
  midan: string;
  maqta: string;
  mawrid: string;
  ta3alom: string;
  kafaa: string;
  score: number;
}

export interface AgentStructureNote {
  tone: 'ok' | 'info' | 'warning';
  message: string;
}

export interface AgentAnalysis {
  examType: AgentExamType;
  level: string;
  levelLabel: string;
  title: string;
  exercises: AgentExercise[];
  integrationDetected: boolean;
  totalPoints: number | null;
  pointsSum: number;
  expectedStructure: { exercises: number; exercisePoints: number[]; integrationPoints: number; total: number } | null;
  suggestions: AgentStructureNote[];
  matches: AgentCurriculumMatch[];
  keywords: string[];
  warnings: string[];
  summary: string;
}

export const AGENT_LEVEL_LABELS: Record<string, string> = {
  '1am': 'السنة الأولى متوسط',
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
};

const ARABIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

export const normalizeAgentText = (input: string): string =>
  String(input || '')
    .replace(/\r/g, '')
    .replace(ARABIC_DIGITS, digit => {
      const arabic = '٠١٢٣٤٥٦٧٨٩'.indexOf(digit);
      return String(arabic >= 0 ? arabic : '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit));
    });

/** مستوى الورقة من متنها أو من اختيار الأستاذ. */
export function detectAgentLevel(text: string, fallback = ''): string {
  if (fallback && AGENT_LEVEL_LABELS[fallback]) return fallback;
  const value = normalizeArabic(text);
  if (/(السنه|المستوي)?\s*(الاولي|الاولي|اولي|اولي)\s*متوسط|\b1\s*am\b|السنه الاولي/.test(value)) return '1am';
  if (/(الثانيه|ثاني)\s*متوسط|\b2\s*am\b|السنه الثانيه/.test(value)) return '2am';
  if (/(الثالثه|ثالث)\s*متوسط|\b3\s*am\b|السنه الثالثه/.test(value)) return '3am';
  if (/(الرابعه|رابع)\s*متوسط|\b4\s*am\b|السنه الرابعه|شهاده التعليم المتوسط/.test(value)) return '4am';
  return '';
}

export function detectAgentExamType(text: string, hint: '' | 'فرض' | 'اختبار' = ''): AgentExamType {
  if (hint === 'فرض' || hint === 'اختبار') return hint;
  const value = normalizeArabic(text);
  if (/وضعيه\s*ادماجيه|الاختبار|اختبار\s*الفصل|اختبار\s*ثلاثي/.test(value)) return 'اختبار';
  if (/\bفرض|الفرض|فرض\s*الفصل/.test(value)) return 'فرض';
  return 'غير محدد';
}

const POINTS_PATTERN = /(?:[([]\s*)?([0-9]+(?:[.,][0-9]+)?)\s*(?:نقطة|نقاط|نقطه|ن|pts?|points?)(?:\s*[)\]])?/i;

const pointsOf = (value: string): number | null => {
  const match = value.match(POINTS_PATTERN);
  if (!match) return null;
  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const stripPoints = (value: string): string => value.replace(POINTS_PATTERN, ' ').replace(/\s+/g, ' ').trim();

/**
 * استخراج التمارين من نص حر: يعتمد أولًا على محلل المنصة المعتمد،
 * ثم على مسح أكثر تسامحًا عندما تكون الترويسات داخل أسطر النص لا في بدايتها.
 */
const EXERCISE_ORDINALS = ['التمرين الأول', 'التمرين الثاني', 'التمرين الثالث', 'التمرين الرابع'];

/** تنظيف موضعي قبل التحليل: توحيد ترويسة الوضعية وحذف أسطر المجموع. */
export const prepareAgentSource = (input: string): string =>
  normalizeAgentText(input)
    .replace(/^[ \t]*(المجموع|مجموع\s+النقاط|العلامة\s+النهائية|العلامه\s+النهائيه)[^\n]*$/gm, '')
    .replace(/الجزء\s+(?:الثاني|الثانی|الثالث|2|3)\s*[:：.\-–)]?\s*(?=الوضعي)/g, '')
    .replace(/(?:^|\n)\s*(الوضعية\s*الإدماجية|الوضعية\s*الادماجية)/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export function parseAgentExercises(rawText: string): AgentExercise[] {
  const text = prepareAgentSource(rawText);
  if (!text.trim()) return [];

  const mapping = parseExamTextLocally(text);
  if (mapping && mapping.exercises.length) {
    return mapping.exercises.map((exercise, index) => {
      const plainTitle = stripPoints(exercise.title || '').trim();
      const integration =
        exercise.kind === 'integration'
        || /وضعيه\s*ادماجيه|الوضعيه\s*الادماجيه/.test(normalizeArabic(plainTitle));
      const questions = exercise.questions.map((question, questionIndex) => ({
        number: String(question.number || questionIndex + 1),
        text: stripPoints(question.text || '').replace(/(?:المجموع|مجموع\s+النقاط)[^\n]*/g, '').trim(),
        points: typeof question.points === 'number' ? question.points : pointsOf(question.text || ''),
      }));
      const declared = pointsOf(exercise.title || '');
      const sum = questions.reduce((total, question) => total + (question.points || 0), 0);
      const genericTitle = !plainTitle || /^(التمرين|الجزء|السؤال|الوضعية)$/.test(plainTitle);
      return {
        number: String(exercise.number || index + 1),
        title: genericTitle
          ? (integration ? 'الوضعية الإدماجية' : EXERCISE_ORDINALS[index] || `التمرين ${index + 1}`)
          : plainTitle,
        kind: integration ? 'integration' as const : 'exercise' as const,
        points: declared ?? (sum > 0 ? sum : null),
        questions,
      };
    });
  }

  // مسار احتياطي: ترويسات ملتصقة بنص السطر، أو أسئلة مرقّمة بلا ترويسة.
  const prepared = text.replace(/(^|\n)([^\n]{0,40}?)(التمرين\s+(?:الأول|الثاني|الثالث|الرابع|الاول|[0-9]+)|وضعية\s+إدماجية|الوضعية\s+الإدماجية)/g, (_match, start, prefix, heading) => `${start}${prefix}${prefix ? '\n' : ''}${heading}`);
  const headingPattern = /(?:^|\n)\s*(التمرين\s*(?:الأول|الثاني|الثالث|الرابع|الاول|الثاني|الثالث|[0-9]+)?|الوضعية\s*الإدماجية|الوضعية\s*الادماجية|وضعية\s*إدماجية)\s*[:：.\-–)]?\s*([^\n]*)/g;
  const headings = Array.from(prepared.matchAll(headingPattern));
  if (!headings.length) {
    const looseQuestions = Array.from(prepared.matchAll(/(?:^|\n)\s*([0-9]{1,2})\s*[)\-–.:]\s*([^\n]+)/g));
    if (!looseQuestions.length) return [];
    return [{
      number: '1',
      title: 'أسئلة الورقة',
      kind: 'exercise',
      points: null,
      questions: looseQuestions.map((item, index) => ({
        number: item[1] || String(index + 1),
        text: stripPoints(item[2] || ''),
        points: pointsOf(item[2] || ''),
      })),
    }];
  }

  const exercises: AgentExercise[] = [];
  headings.forEach((heading, index) => {
    const start = (heading.index || 0) + heading[0].length;
    const end = index + 1 < headings.length ? (headings[index + 1].index || prepared.length) : prepared.length;
    const body = prepared.slice(start, end);
    const integration = /وضعيه\s*ادماجيه/.test(normalizeArabic(heading[1]));
    const questionPattern = /(?:^|\n)\s*(?:([0-9]{1,2})\s*[)\-–.:]|([0-9]{1,2})\s+)([^\n]+)/g;
    const questions = Array.from(body.matchAll(questionPattern)).map((question, questionIndex) => ({
      number: question[1] || question[2] || String(questionIndex + 1),
      text: stripPoints(question[3] || ''),
      points: pointsOf(question[3] || ''),
    }));
    if (!questions.length && body.trim()) {
      questions.push({ number: '1', text: stripPoints(body.split('\n')[0] || '').slice(0, 600), points: pointsOf(body.split('\n')[0] || '') });
    }
    const declared = pointsOf(heading[2] || '');
    const sum = questions.reduce((total, question) => total + (question.points || 0), 0);
    exercises.push({
      number: String(index + 1),
      title: stripPoints(heading[1] || '').trim() || `التمرين ${index + 1}`,
      kind: integration ? 'integration' : 'exercise',
      points: declared ?? (sum > 0 ? sum : null),
      questions,
    });
  });

  return exercises;
}

/**
 * مطابقة النص مع دروس قاعدة المنصة.
 * الكلمة في عنوان المورد/التعلم تزن أكثر من كلمة في الكفاءة الختامية المشتركة،
 * وكلمة منتشرة في معظم الدروس (مثل «الأول») تفقد وزنها تلقائيًا.
 */
export function matchPlatformCurriculum(
  text: string,
  level: string,
  lessons: LessonMemo[] = getOfficialCurriculumDatabase(),
  limit = 3,
): AgentCurriculumMatch[] {
  const query = new Set(tokenize(text));
  if (!query.size || !lessons.length) return [];
  const candidates = level ? lessons.filter(lesson => lesson.level === level) : lessons;
  if (!candidates.length) return [];

  const fieldsOf = (lesson: LessonMemo) => ({
    mawrid: new Set(tokenize(lesson.mawrid)),
    ta3alom: new Set(tokenize(lesson.ta3alom)),
    maqta: new Set(tokenize(lesson.maqta)),
    midan: new Set(tokenize(lesson.midan)),
    rest: new Set(tokenize([lesson.markaba, lesson.marifa, lesson.manhaji, lesson.mostalahat].filter(Boolean).join(' '))),
  });
  const prepared = candidates.map(lesson => ({ lesson, fields: fieldsOf(lesson) }));

  const documentFrequency = new Map<string, number>();
  for (const item of prepared) {
    const all = new Set([...item.fields.mawrid, ...item.fields.ta3alom, ...item.fields.maqta, ...item.fields.midan, ...item.fields.rest]);
    all.forEach(token => {
      if (query.has(token)) documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    });
  }
  const tokenWeight = (token: string) =>
    (token.length >= 4 ? 2 : 1) / Math.log(2 + (documentFrequency.get(token) || 0));

  const scored: AgentCurriculumMatch[] = [];
  for (const { lesson, fields } of prepared) {
    let score = 0;
    query.forEach(token => {
      const weight = tokenWeight(token);
      if (fields.mawrid.has(token)) score += weight * 3;
      else if (fields.ta3alom.has(token)) score += weight * 2.5;
      else if (fields.maqta.has(token)) score += weight * 2;
      else if (fields.midan.has(token)) score += weight * 1.5;
      else if (fields.rest.has(token)) score += weight;
    });
    if (score >= 2.4) {
      scored.push({
        level: lesson.level,
        midan: lesson.midan || '',
        maqta: lesson.maqta || '',
        mawrid: lesson.mawrid || '',
        ta3alom: lesson.ta3alom || '',
        kafaa: lesson.kafaaKhitamiya || '',
        score: Math.round(score * 10) / 10,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

const STRUCTURAL_KEYWORDS = new Set([
  'التمرين', 'الجزء', 'السؤال', 'الوثيقه', 'الوثيقة', 'المجموع', 'نقاط', 'نقطه', 'الاول',
  'الثاني', 'الثالث', 'الرابع', 'الاختبار', 'الفرض', 'الورقه', 'التالي', 'التاليه', 'حل', 'اجب',
  'استنتج', 'فسر', 'اذكر', 'عرف', 'بين', 'سم', 'حلل', 'تمرين', 'وضعيه', 'ادماجيه', 'المشار',
]);

const keywordList = (text: string, limit = 14): string[] => {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (token.length < 3 || STRUCTURAL_KEYWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([token]) => token);
};

export interface AnalyzeDocumentOptions {
  examType?: '' | 'فرض' | 'اختبار';
  level?: string;
  lessons?: LessonMemo[];
  fileName?: string;
}

/** تحليل محلي كامل: بنية الورقة + قاعدة المنصة + ملاحظات الجودة البيداغوجية. */
export function analyzeDocumentLocally(text: string, options: AnalyzeDocumentOptions = {}): AgentAnalysis {
  const normalized = normalizeAgentText(text);
  const level = detectAgentLevel(normalized, options.level || '');
  const examType = detectAgentExamType(normalized, options.examType || '');
  const exercises = parseAgentExercises(normalized);
  const integrationDetected = exercises.some(exercise => exercise.kind === 'integration');
  const totalMatch = normalized.match(/(?:المجموع|مجموع\s+النقاط|العلامة\s+النهائية|العلامه\s+النهائيه)\s*[:：]?\s*([0-9]+(?:[.,][0-9]+)?)/);
  const totalPoints = totalMatch ? Number(totalMatch[1].replace(',', '.')) : null;
  const pointsSum = exercises.reduce((sum, exercise) => sum + (exercise.points || 0), 0);
  const expected = examType === 'غير محدد'
    ? null
    : examStructure(examType, Math.min(3, Math.max(2, exercises.filter(exercise => exercise.kind === 'exercise').length)));

  const suggestions: AgentStructureNote[] = [];
  const warnings: string[] = [];

  if (!exercises.length) {
    warnings.push('لم أتعرّف على تمارين مرقّمة في النص؛ قد تكون الورقة صورة أو تنسيقها غير معتاد.');
  }

  if (expected) {
    const plain = exercises.filter(exercise => exercise.kind === 'exercise');
    if (examType === 'اختبار') {
      if (plain.length !== 2) suggestions.push({ tone: 'warning', message: `الاختبار يعتمد تمرينين ووضعية إدماجية، والعناصر المقروءة تحتوي ${plain.length} تمرينًا.` });
      if (!integrationDetected) suggestions.push({ tone: 'warning', message: 'لم تُقرأ وضعية إدماجية في الورقة؛ تحقّق من الجزء الثاني قبل اعتماد المذكرة.' });
      const integration = exercises.find(exercise => exercise.kind === 'integration');
      if (integration && integration.points && integration.points !== expected.integrationPoints) {
        suggestions.push({ tone: 'info', message: `نقاط الوضعية في الورقة ${integration.points} والمقترح ${expected.integrationPoints}.` });
      }
    } else {
      if (integrationDetected) suggestions.push({ tone: 'info', message: 'الفرض لا يتضمن عادة وضعية إدماجية؛ يمكن إخفاؤها في مذكرة التصحيح.' });
      if (plain.length < 2 || plain.length > 3) suggestions.push({ tone: 'warning', message: `الفرض يعتمد تمرينين أو ثلاثة، والعناصر المقروءة ${plain.length}.` });
    }

    const suggestedTotal = expected.exercisePoints.reduce((sum, value) => sum + value, 0) + expected.integrationPoints;
    if (pointsSum > 0 && Math.abs(pointsSum - suggestedTotal) > 0.01) {
      suggestions.push({ tone: 'info', message: `مجموع النقاط المقروء ${pointsSum}؛ التوزيع المقترح ${expected.exercisePoints.join(' + ')}${expected.integrationPoints ? ` + وضعية ${expected.integrationPoints}` : ''} = ${suggestedTotal}.` });
    }
    if (!pointsSum) {
      suggestions.push({ tone: 'info', message: `لا توجد نقاط مقروءة؛ التنقيط المقترح: ${expected.exercisePoints.join(' + ')}${expected.integrationPoints ? ` + ${expected.integrationPoints}` : ''}.` });
    }
  }

  if (totalPoints !== null && pointsSum > 0 && Math.abs(totalPoints - pointsSum) > 0.01) {
    warnings.push(`المجموع المكتوب في الورقة ${totalPoints} ومجموع نقاط الأسئلة المقروءة ${pointsSum}.`);
  }
  if (pointsSum > 20.01) warnings.push(`مجموع النقاط المقروء ${pointsSum} يتجاوز 20؛ راجع النقاط المستخرجة.`);

  const matches = matchPlatformCurriculum(
    [normalized.slice(0, 6000), options.fileName || ''].join(' '),
    level,
    options.lessons,
  );

  const analysisText = [
    ...exercises.flatMap(exercise => [exercise.title, ...exercise.questions.map(question => question.text)]),
  ].filter(Boolean).join(' ');
  const keywords = keywordList(analysisText);

  const summaryParts = [
    examType === 'غير محدد' ? 'ورقة تقييم غير محدّد نوعها' : `${examType}`,
    level ? AGENT_LEVEL_LABELS[level] : 'مستوى غير مذكور',
    exercises.length ? `${exercises.filter(exercise => exercise.kind === 'exercise').length} تمرين${integrationDetected ? ' + وضعية إدماجية' : ''}` : 'بلا تمارين مقروءة',
    pointsSum ? `مجموع النقاط ${pointsSum}` : 'بلا نقاط مقروءة',
    matches[0] ? `أقرب مورد: ${matches[0].mawrid || matches[0].maqta || matches[0].ta3alom}` : '',
  ].filter(Boolean);

  return {
    examType,
    level,
    levelLabel: AGENT_LEVEL_LABELS[level] || '',
    title: options.fileName ? options.fileName.replace(/\.[^.]+$/, '') : '',
    exercises,
    integrationDetected,
    totalPoints,
    pointsSum,
    expectedStructure: expected
      ? { exercises: expected.exercises, exercisePoints: expected.exercisePoints, integrationPoints: expected.integrationPoints, total: expected.total }
      : null,
    suggestions,
    matches,
    keywords,
    warnings,
    summary: summaryParts.join(' · '),
  };
}

/** استعلام الاستشهاد من قاعدة المعرفة: موارد الورقة وأسئلتها لا كل النص. */
export function buildAgentKnowledgeQuery(analysis: AgentAnalysis, text: string): string {
  const parts = [
    analysis.matches[0] ? `${analysis.matches[0].midan} ${analysis.matches[0].maqta} ${analysis.matches[0].mawrid}` : '',
    ...analysis.exercises.flatMap(exercise => exercise.questions.slice(0, 3).map(question => question.text)),
    ...analysis.keywords,
  ].filter(Boolean);
  return (parts.join(' ') || text.slice(0, 400)).slice(0, 900);
}

/* ─────────────────────── عقد الاستجابة بين الخادم والواجهة ─────────────────────── */

export interface AgentCitation {
  title: string;
  label: string;
  page?: number;
  snippet: string;
  kind: string;
}

export interface AgentRecall {
  id: string;
  title: string;
  level: string;
  examType: string;
  points: number | null;
  similarity: number;
  shared: string[];
}

export interface AgentReadPayload {
  format: string;
  chars: number;
  pages?: number;
  quality: { score: number; letters: number; chars: number; arabicRatio: number; flags: string[] };
  needsVision: boolean;
  notes: string[];
  text: string;
  image?: { width?: number; height?: number; bytes: number };
}

export interface AgentReadResponse {
  read: AgentReadPayload;
  analysis: AgentAnalysis;
  citations: AgentCitation[];
  recalled: AgentRecall[];
  provider: string | null;
}

export interface AgentStatusResponse {
  ready: boolean;
  name: string;
  localReader: boolean;
  localFormats: string[];
  visionFormats: string[];
  visionConfigured: boolean;
  platformDatabase: { lessons: number; officialDocuments: number; families: number };
  message: string;
}
