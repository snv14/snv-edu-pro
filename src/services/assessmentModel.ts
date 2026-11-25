import { MemoConfig } from '../types';
import {
  CorrectionExercise,
  CorrectionMemoData,
  CorrectionQuestion,
  MemoFieldSource,
  applyExamStructure,
  createDefaultCorrectionMemo,
  examStructure,
  normalizeCorrectionMemo,
  overallTotal,
  toNumber,
  uid,
} from './correctionMemoModel';

/**
 * نموذج «التقويم» الموحّد: الاختبار هو المصدر الوحيد للأسئلة والإجابات والتنقيط،
 * ومذكرة التصحيح تُبنى منه مباشرة (لا نسخة ثانية تتقادم). النتائج والنسخ
 * مرتبطة بالاختبار نفسه، فيتحدّث السؤال ← الإجابة ← النقطة ← المجموع ← المذكرة معًا.
 */

export const ASSESSMENT_LEVELS = [
  { code: '1am', label: 'السنة الأولى متوسط' },
  { code: '2am', label: 'السنة الثانية متوسط' },
  { code: '3am', label: 'السنة الثالثة متوسط' },
  { code: '4am', label: 'السنة الرابعة متوسط' },
] as const;

export type AssessmentLevelCode = typeof ASSESSMENT_LEVELS[number]['code'];

export const levelLabelOf = (code?: string): string =>
  ASSESSMENT_LEVELS.find(level => level.code === code)?.label || '';

export const ASSESSMENT_STATUSES = ['مسودة', 'جاهز', 'تم التصحيح', 'تم التحليل'] as const;
export type AssessmentStatus = typeof ASSESSMENT_STATUSES[number];

export interface AssessmentVersion {
  id: string;
  at: string;
  label: string;
  total: number;
  memo: CorrectionMemoData;
}

export interface StudentResult {
  id: string;
  studentName: string;
  registrationNumber: string;
  absent: boolean;
  /** نقاط كل سؤال/مؤشر معيار بمفتاح معرّفه داخل المذكرة. */
  scores: Record<string, number>;
  note: string;
  updatedAt: string;
}

export interface AssessmentExam {
  version: 1;
  id: string;
  title: string;
  examType: 'فرض' | 'اختبار';
  level: AssessmentLevelCode;
  className: string;
  term: string;
  schoolYear: string;
  duration: string;
  sourceFileName: string;
  /** السندات والوثائق المرفقة بورقة الاختبار. */
  documents: string;
  /** تعليمات عامة تظهر في الورقة. */
  instructions: string;
  /** نص الوضعية الإدماجية كما يُطبع في الورقة. */
  integrationSituation: string;
  status: AssessmentStatus;
  memo: CorrectionMemoData;
  versions: AssessmentVersion[];
  results: StudentResult[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamInput {
  examType: 'فرض' | 'اختبار';
  level: AssessmentLevelCode;
  title?: string;
  className?: string;
  term?: string;
  schoolYear?: string;
  duration?: string;
  memo?: CorrectionMemoData;
  config?: MemoConfig;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

const clone = <T,>(value: T): T => {
  const structured = (globalThis as any)?.structuredClone;
  if (typeof structured === 'function') return structured(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

export const defaultExamTitle = (examType: 'فرض' | 'اختبار', term: string, level: AssessmentLevelCode): string =>
  `${examType === 'اختبار' ? 'اختبار' : 'فرض'} ${term || 'الفصل الأول'} في مادة علوم الطبيعة والحياة — ${levelLabelOf(level)}`;

export function createAssessmentExam(input: CreateExamInput): AssessmentExam {
  const memo = input.memo
    ? normalizeCorrectionMemo(input.memo)
    : createDefaultCorrectionMemo(input.examType);
  memo.examType = input.examType;

  const levelLabel = levelLabelOf(input.level);
  if (levelLabel) memo.level = levelLabel;
  if (input.term) memo.term = input.term;
  if (input.duration) memo.duration = input.duration;
  if (input.schoolYear) memo.schoolYear = input.schoolYear;
  if (input.config) {
    memo.schoolName = memo.schoolName || input.config.schoolName || '';
    memo.directorate = memo.directorate || input.config.directorate || '';
    memo.teacherName = memo.teacherName || input.config.teacherName || '';
    memo.schoolYear = memo.schoolYear || input.config.schoolYear || '';
  }

  const now = new Date().toISOString();
  return rebalanceExamPoints({
    version: 1,
    id: uid('exam'),
    title: (input.title || '').trim() || defaultExamTitle(input.examType, input.term || 'الفصل الأول', input.level),
    examType: input.examType,
    level: input.level,
    className: (input.className || '').trim(),
    term: (input.term || '').trim(),
    schoolYear: (input.schoolYear || '').trim(),
    duration: (input.duration || '').trim(),
    sourceFileName: '',
    documents: '',
    instructions: '',
    integrationSituation: '',
    status: 'مسودة',
    memo,
    versions: [],
    results: [],
    createdAt: now,
    updatedAt: now,
  });
}

const clampString = (value: unknown, max = 2000): string =>
  typeof value === 'string' ? value.slice(0, max) : (typeof value === 'number' ? String(value) : '');

const normalizeStatus = (value: unknown): AssessmentStatus =>
  ASSESSMENT_STATUSES.includes(value as AssessmentStatus) ? (value as AssessmentStatus) : 'مسودة';

const normalizeLevel = (value: unknown): AssessmentLevelCode =>
  ASSESSMENT_LEVELS.some(level => level.code === value) ? (value as AssessmentLevelCode) : '4am';

export function normalizeStudentResult(raw: unknown): StudentResult {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<StudentResult>;
  const scores: Record<string, number> = {};
  if (source.scores && typeof source.scores === 'object') {
    Object.entries(source.scores).forEach(([key, value]) => {
      const parsed = toNumber(value);
      if (parsed !== null && parsed >= 0) scores[String(key).slice(0, 120)] = round2(parsed);
    });
  }
  return {
    id: clampString(source.id, 80) || uid('res'),
    studentName: clampString(source.studentName, 120),
    registrationNumber: clampString(source.registrationNumber, 40),
    absent: Boolean(source.absent),
    scores,
    note: clampString(source.note, 400),
    updatedAt: clampString(source.updatedAt, 40) || new Date().toISOString(),
  };
}

export function makeStudentResult(studentName = ''): StudentResult {
  return {
    id: uid('res'),
    studentName,
    registrationNumber: '',
    absent: false,
    scores: {},
    note: '',
    updatedAt: new Date().toISOString(),
  };
}

/** استرجاع آمن لاختبار محفوظ (نسخة قديمة أو تالفة لا تكسر الواجهة). */
export function normalizeAssessmentExam(raw: unknown): AssessmentExam {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<AssessmentExam>;
  const examType: 'فرض' | 'اختبار' = source.examType === 'فرض' ? 'فرض' : 'اختبار';
  const memo = normalizeCorrectionMemo(source.memo);
  memo.examType = examType;
  const level = normalizeLevel(source.level);
  const versions = Array.isArray(source.versions)
    ? source.versions.slice(0, 20).map((version, index) => ({
        id: clampString(version?.id, 80) || uid('ver'),
        at: clampString(version?.at, 40) || new Date().toISOString(),
        label: clampString(version?.label, 120) || `نسخة ${index + 1}`,
        total: round2(toNumber(version?.total) ?? overallTotal(normalizeCorrectionMemo(version?.memo))),
        memo: normalizeCorrectionMemo(version?.memo),
      }))
    : [];
  const results = Array.isArray(source.results)
    ? source.results.slice(0, 400).map(normalizeStudentResult)
    : [];

  return {
    version: 1,
    id: clampString(source.id, 80) || uid('exam'),
    title: clampString(source.title, 200) || defaultExamTitle(examType, '', level),
    examType,
    level,
    className: clampString(source.className, 60),
    term: clampString(source.term, 60),
    schoolYear: clampString(source.schoolYear, 60),
    duration: clampString(source.duration, 60),
    sourceFileName: clampString(source.sourceFileName, 240),
    documents: clampString(source.documents),
    instructions: clampString(source.instructions),
    integrationSituation: clampString(source.integrationSituation),
    status: normalizeStatus(source.status),
    memo,
    versions,
    results,
    createdAt: clampString(source.createdAt, 40) || new Date().toISOString(),
    updatedAt: clampString(source.updatedAt, 40) || new Date().toISOString(),
  };
}

/** نسخة مستقلة بمعرّفات جديدة — «حفظ كنسخة جديدة» لا يمسّ الأصل. */
export function duplicateAssessmentExam(exam: AssessmentExam, titleSuffix = 'نسخة'): AssessmentExam {
  const next = clone(exam);
  next.id = uid('exam');
  next.title = `${exam.title} — ${titleSuffix}`.slice(0, 200);
  next.status = 'مسودة';
  next.results = [];
  next.versions = [];
  next.createdAt = new Date().toISOString();
  next.updatedAt = next.createdAt;
  next.memo.exercises.forEach(exercise => {
    exercise.id = uid('ex');
    exercise.questions.forEach(question => { question.id = uid('q'); });
  });
  next.memo.integration.criteria.forEach(criterion => {
    criterion.id = uid('crit');
    criterion.indicators.forEach(indicator => { indicator.id = uid('ind'); });
  });
  return next;
}

export function snapshotExam(exam: AssessmentExam, label = 'حفظ يدوي'): AssessmentExam {
  const next = clone(exam);
  next.versions = [
    {
      id: uid('ver'),
      at: new Date().toISOString(),
      label,
      total: overallTotal(exam.memo),
      memo: clone(exam.memo),
    },
    ...next.versions,
  ].slice(0, 20);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function restoreExamVersion(exam: AssessmentExam, versionId: string): AssessmentExam {
  const version = exam.versions.find(item => item.id === versionId);
  if (!version) return exam;
  const withCurrent = snapshotExam(exam, 'قبل الاسترجاع');
  return {
    ...withCurrent,
    examType: version.memo.examType,
    memo: normalizeCorrectionMemo(clone(version.memo)),
    status: 'مسودة',
    updatedAt: new Date().toISOString(),
  };
}

export function touchExam(exam: AssessmentExam, patch: Partial<AssessmentExam> = {}): AssessmentExam {
  return { ...exam, ...patch, updatedAt: new Date().toISOString() };
}

export function setExamType(exam: AssessmentExam, examType: 'فرض' | 'اختبار'): AssessmentExam {
  const next = clone(exam);
  const count = next.memo.exercises.filter(exercise => exercise.part === 1).length || 2;
  next.memo = applyExamStructure(next.memo, examType, count);
  next.examType = examType;
  next.memo.examType = examType;
  if (!next.integrationSituation.trim() && examType === 'فرض') next.integrationSituation = '';
  next.updatedAt = new Date().toISOString();
  return next;
}

export interface AssessmentQuestionRef {
  id: string;
  kind: 'question' | 'integration';
  exerciseId: string;
  exerciseLabel: string;
  number: string;
  text: string;
  expected: string;
  max: number;
  knowledge: string;
  maqta: string;
  criterionLabel?: string;
}

/** كل خانات التنقيط في الورقة: أسئلة التمارين + مؤشرات الوضعية الإدماجية. */
export function flattenRefs(exam: AssessmentExam): AssessmentQuestionRef[] {
  const refs: AssessmentQuestionRef[] = exam.memo.exercises
    .filter(exercise => exercise.part === 1)
    .flatMap(exercise => exercise.questions.map(question => ({
      id: question.id,
      kind: 'question' as const,
      exerciseId: exercise.id,
      exerciseLabel: exercise.label,
      number: question.number,
      text: question.text,
      expected: question.expected,
      max: toNumber(question.points) ?? 0,
      knowledge: exercise.knowledge,
      maqta: exercise.maqta,
    })));

  if (exam.examType === 'اختبار') {
    exam.memo.integration.criteria.forEach(criterion => {
      criterion.indicators.forEach(indicator => {
        refs.push({
          id: indicator.id,
          kind: 'integration',
          exerciseId: criterion.id,
          exerciseLabel: 'الوضعية الإدماجية',
          number: criterion.label,
          criterionLabel: criterion.label,
          text: indicator.text,
          expected: indicator.text,
          max: toNumber(indicator.points) ?? 0,
          knowledge: exam.memo.competence,
          maqta: '',
        });
      });
    });
  }

  return refs;
}

export const examMaxTotal = (exam: AssessmentExam): number => overallTotal(exam.memo);

/** المقطع التعلمي للورقة: من صفوف الموارد أو من التمارين (المذكرة لا تحمل حقلًا مستقلًا). */
export const examMaqta = (exam: AssessmentExam): string =>
  exam.memo.resources.find(row => row.maqta.trim())?.maqta
  || exam.memo.exercises.find(exercise => exercise.part === 1 && exercise.maqta.trim())?.maqta
  || '';

/** المورد المعرفي المستهدف الأول (للسياق والبحث). */
export const examMawrid = (exam: AssessmentExam): string =>
  exam.memo.exercises.filter(exercise => exercise.part === 1).map(exercise => exercise.knowledge.trim()).find(Boolean)
  || exam.memo.competence
  || '';

/** كتابة المقطع على مستوى الورقة: يعمّم على التمارين وصفوف الموارد غير الإدماجية. */
export function setExamMaqta(exam: AssessmentExam, maqta: string): AssessmentExam {
  const next = clone(exam);
  next.memo.resources.forEach(row => {
    if (row.exerciseLabel.includes('الإدماجية')) return;
    row.maqta = maqta;
    row.maqtaSource = 'teacher';
  });
  next.memo.exercises.filter(exercise => exercise.part === 1).forEach(exercise => {
    exercise.maqta = maqta;
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

export const partOneExercises = (exam: AssessmentExam): CorrectionExercise[] =>
  exam.memo.exercises.filter(exercise => exercise.part === 1);

export function studentTotal(exam: AssessmentExam, result: StudentResult): number {
  const total = flattenRefs(exam).reduce((sum, ref) => {
    const raw = toNumber(result.scores?.[ref.id]);
    if (raw === null) return sum;
    return sum + Math.min(Math.max(raw, 0), ref.max || 0);
  }, 0);
  return round2(total);
}

export function studentScore20(exam: AssessmentExam, result: StudentResult): number {
  const max = examMaxTotal(exam);
  if (max <= 0) return 0;
  return round2((studentTotal(exam, result) / max) * 20);
}

export function updateStudentScore(
  exam: AssessmentExam,
  resultId: string,
  refId: string,
  value: number | null,
): AssessmentExam {
  const next = clone(exam);
  const result = next.results.find(item => item.id === resultId);
  if (!result) return exam;
  if (value === null) delete result.scores[refId];
  else result.scores[refId] = round2(Math.max(0, value));
  result.updatedAt = new Date().toISOString();
  next.updatedAt = result.updatedAt;
  return next;
}

/** توزيع دقيق بالنقاط (largest remainder) حتى يكون المجموع مطابقًا تمامًا. */
export function distributePoints(total: number, weights: number[], step = 0.25): number[] {
  if (!weights.length) return [];
  const units = Math.round(total / step);
  const safeWeights = weights.map(weight => Math.max(0.0001, weight));
  const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0);
  const quotas = safeWeights.map(weight => (units * weight) / weightSum);
  const shares = quotas.map(Math.floor);
  let remainder = units - shares.reduce((sum, share) => sum + share, 0);
  const order = quotas
    .map((quota, index) => ({ index, fraction: quota - Math.floor(quota) }))
    .sort((a, b) => b.fraction - a.fraction);
  let cursor = 0;
  while (remainder > 0 && order.length) {
    shares[order[cursor % order.length].index] += 1;
    remainder -= 1;
    cursor += 1;
  }
  while (remainder < 0) {
    const target = order.find(item => shares[item.index] > 0);
    if (!target) break;
    shares[target.index] -= 1;
    remainder += 1;
  }
  return shares.map(share => round2(share * step));
}

const questionWeight = (question: CorrectionQuestion): number => Math.max(1, question.text.trim().length / 30 + 1);

/**
 * إعادة توزيع التنقيط على 20: الجزء الأول 12 + الوضعية 8 في الاختبار، و20 في الفرض،
 * مع احترام التوزيع المعتمد للتمارين وتوزيع داخلي موزون بحجم الأسئلة.
 */
export function rebalanceExamPoints(exam: AssessmentExam): AssessmentExam {
  const next = clone(exam);
  const exercises = next.memo.exercises.filter(exercise => exercise.part === 1);
  if (!exercises.length) return exam;

  const part1Target = next.examType === 'اختبار' ? 12 : 20;
  const preset = examStructure(next.examType, exercises.length);
  const exerciseTargets = preset.exercisePoints.length === exercises.length
    ? [...preset.exercisePoints]
    : distributePoints(
        part1Target,
        exercises.map(exercise => exercise.questions.reduce((sum, question) => sum + questionWeight(question), 0)),
        1,
      );

  next.memo.part1DeclaredPoints = String(part1Target);
  exercises.forEach((exercise, index) => {
    const target = exerciseTargets[index] ?? 0;
    exercise.declaredPoints = String(target);
    if (!exercise.questions.length) {
      exercise.questions = [{
        id: uid('q'), number: '1', text: '', points: '', expected: '',
        source: 'template' as MemoFieldSource, needsReview: false,
      }];
    }
    const shares = distributePoints(target, exercise.questions.map(questionWeight), 0.25);
    exercise.questions.forEach((question, qIndex) => {
      question.points = String(shares[qIndex] ?? 0);
    });
  });

  if (next.examType === 'اختبار') {
    const integrationTarget = 8;
    next.memo.integration.declaredPoints = String(integrationTarget);
    const indicators = next.memo.integration.criteria.flatMap(criterion => criterion.indicators);
    if (indicators.length) {
      const shares = distributePoints(integrationTarget, indicators.map(indicator => (indicator.text.trim() ? 2 : 1)), 0.25);
      indicators.forEach((indicator, index) => {
        indicator.points = String(shares[index] ?? 0);
      });
    }
  } else {
    // الفرض لا يحمل وضعية إدماجية: تُصفَّر نقاط مؤشراتها حتى لا تُحتسب في المجموع.
    next.memo.integration.declaredPoints = '';
    next.memo.integration.criteria.forEach(criterion => {
      criterion.indicators.forEach(indicator => { indicator.points = ''; });
    });
  }

  next.updatedAt = new Date().toISOString();
  next.memo.updatedAt = next.updatedAt;
  return next;
}

export interface ExerciseProposal {
  label?: string;
  maqta?: string;
  knowledge?: string;
  criteria?: string;
  source?: MemoFieldSource;
  questions: Array<{ text: string; expected?: string; points?: string }>;
}

/** إضافة تمرين (الثالث مثلًا) دون إنشاء اختبار جديد، مع إعادة التوازن إلى 20. */
export function addExamExercise(exam: AssessmentExam, proposal: ExerciseProposal): AssessmentExam {
  const next = clone(exam);
  const count = next.memo.exercises.filter(exercise => exercise.part === 1).length;
  const label = (proposal.label || '').trim() || `التمرين ${count + 1}`;
  const questions: CorrectionQuestion[] = proposal.questions
    .filter(question => question.text.trim())
    .slice(0, 12)
    .map((question, index) => ({
      id: uid('q'),
      number: String(index + 1),
      text: question.text.trim().slice(0, 2000),
      points: question.points ?? '',
      expected: (question.expected || '').trim().slice(0, 4000),
      source: proposal.source || 'ai',
      needsReview: true,
    }));

  const exercise: CorrectionExercise = {
    id: uid('ex'),
    part: 1,
    label,
    declaredPoints: '',
    maqta: (proposal.maqta || '').slice(0, 300),
    knowledge: (proposal.knowledge || '').slice(0, 4000),
    criteria: (proposal.criteria || '').slice(0, 4000),
    source: proposal.source || 'ai',
    questions: questions.length
      ? questions
      : [{ id: uid('q'), number: '1', text: '', points: '', expected: '', source: 'ai', needsReview: true }],
  };

  next.memo.exercises.push(exercise);
  next.memo.resources.push({
    id: uid('res'),
    exerciseLabel: label,
    maqta: exercise.maqta,
    knowledge: exercise.knowledge,
    criteria: exercise.criteria,
    maqtaSource: exercise.maqta ? 'ai' : 'template',
    knowledgeSource: exercise.knowledge ? 'ai' : 'template',
    criteriaSource: exercise.criteria ? 'ai' : 'template',
  });

  return rebalanceExamPoints(next);
}

export function removeExamExercise(exam: AssessmentExam, exerciseId: string): AssessmentExam {
  const next = clone(exam);
  const target = next.memo.exercises.find(exercise => exercise.id === exerciseId);
  if (!target) return exam;
  next.memo.exercises = next.memo.exercises.filter(exercise => exercise.id !== exerciseId);
  next.memo.resources = next.memo.resources.filter(row => row.exerciseLabel !== target.label);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function moveExamExercise(exam: AssessmentExam, exerciseId: string, direction: -1 | 1): AssessmentExam {
  const next = clone(exam);
  const list = next.memo.exercises.filter(exercise => exercise.part === 1);
  const index = list.findIndex(exercise => exercise.id === exerciseId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return exam;
  const reordered = [...list];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  const others = next.memo.exercises.filter(exercise => exercise.part !== 1);
  next.memo.exercises = [...reordered, ...others];
  reordered.forEach((exercise, position) => {
    exercise.label = `التمرين ${position === 0 ? 'الأول' : position === 1 ? 'الثاني' : position === 2 ? 'الثالث' : position + 1}`;
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

export type AssessmentCommandIntent =
  | 'add-exercise'
  | 'add-question'
  | 'redistribute'
  | 'answers'
  | 'analyze'
  | 'unknown';

export interface AssessmentCommand {
  intent: AssessmentCommandIntent;
  exerciseNumber?: number;
  raw: string;
}

const normalizeDigits = (value: string): string =>
  value
    .replace(/[\u0660-\u0669]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\u06F0-\u06F9]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

/** فهم أوامر الأستاذ داخل التقويم («أضف تمرينًا ثالثًا»، «أعد توزيع النقاط على 20»…). */
export function interpretAssessmentCommand(text: string): AssessmentCommand {
  const raw = (text || '').trim();
  const value = normalizeDigits(raw);
  if (/(أضف|اضف|زد)\s+.*سؤال/.test(value)) return { intent: 'add-question', raw };
  const addExercise = /(أضف|اضف|زد|أضفه|اضفه|إضافة|اضافة|أريد|اريد)\s+.*تمرين/.test(value)
    || /تمرين\s*(ثالث|٣|3)/.test(value);
  if (addExercise) {
    const match = value.match(/تمرين\s*(?:رقم\s*)?(\d{1,2})/);
    return { intent: 'add-exercise', exerciseNumber: match ? Number(match[1]) : undefined, raw };
  }
  if (/(أعد|اعد|وزّع|وزع|توزيع|رتب)\s*.*(النقاط|نقاط|التنقيط|تنقيط)/.test(value)
    || /(النقاط|التنقيط)\s*(على|من)\s*(20|عشرين)/.test(value)) {
    return { intent: 'redistribute', raw };
  }
  if (/(أعد|اعد|ولّد|ولد|أنشئ|انشئ|اكتب|حدّث|حدث)\s*.*(الإجابة|الاجابة|إجابة|اجابة|إجابات|عناصر)/.test(value)
    || /(الحل|التصحيح)\s*(النموذجي|الآلي)/.test(value)) {
    return { intent: 'answers', raw };
  }
  if (/(حلّل|حلل|تحليل|النتائج|الأخطاء|الاخطاء|المعالجة)/.test(value)) {
    return { intent: 'analyze', raw };
  }
  return { intent: 'unknown', raw };
}

export function missingAnswers(exam: AssessmentExam): Array<{ exerciseLabel: string; number: string; text: string }> {
  return flattenRefs(exam)
    .filter(ref => ref.kind === 'question' && ref.text.trim() && !ref.expected.trim())
    .map(ref => ({ exerciseLabel: ref.exerciseLabel, number: ref.number, text: ref.text }));
}

export function examCounts(exam: AssessmentExam): { exercises: number; questions: number; points: number } {
  return {
    exercises: exam.memo.exercises.filter(exercise => exercise.part === 1).length,
    questions: flattenRefs(exam).filter(ref => ref.kind === 'question' && ref.text.trim()).length,
    points: examMaxTotal(exam),
  };
}
