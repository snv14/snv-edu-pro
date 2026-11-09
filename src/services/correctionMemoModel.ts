import { LessonMemo, MemoConfig } from '../types';

/** مصدر كل معلومة داخل المذكرة، يُعرض للأستاذ ولا يُخفى. */
export type MemoFieldSource = 'platform' | 'imported' | 'ai' | 'teacher' | 'template';

export type MemoConfidence = 'مرتفعة' | 'متوسطة' | 'منخفضة';

export const SOURCE_LABEL: Record<MemoFieldSource, string> = {
  platform: 'من المنصة',
  imported: 'مستورد من الورقة',
  ai: 'اقتراح AI',
  teacher: 'محرَّر يدويًا',
  template: 'قالب فارغ',
};

export const SOURCE_CONFIDENCE: Record<MemoFieldSource, MemoConfidence> = {
  platform: 'مرتفعة',
  imported: 'متوسطة',
  ai: 'منخفضة',
  teacher: 'مرتفعة',
  template: 'منخفضة',
};

export interface CorrectionQuestion {
  id: string;
  number: string;
  text: string;
  points: string;
  expected: string;
  source: MemoFieldSource;
  needsReview: boolean;
}

export interface CorrectionExercise {
  id: string;
  part: 1 | 2;
  label: string;
  declaredPoints: string;
  maqta: string;
  knowledge: string;
  criteria: string;
  questions: CorrectionQuestion[];
  source: MemoFieldSource;
}

export const INTEGRATION_CRITERIA = [
  { key: 'wajaha', label: 'المعيار 1: الوجاهة' },
  { key: 'isti3mal', label: 'المعيار 2: الاستعمال السليم لأدوات المادة' },
  { key: 'insijam', label: 'المعيار 3: الانسجام' },
  { key: 'itqan', label: 'المعيار 4: الإتقان' },
] as const;

export type IntegrationKey = typeof INTEGRATION_CRITERIA[number]['key'];

export interface IntegrationIndicator {
  id: string;
  text: string;
  points: string;
}

export interface IntegrationCriterion {
  id: string;
  key: IntegrationKey;
  label: string;
  indicators: IntegrationIndicator[];
}

export interface ResourceRow {
  id: string;
  exerciseLabel: string;
  maqta: string;
  knowledge: string;
  criteria: string;
  maqtaSource: MemoFieldSource;
  knowledgeSource: MemoFieldSource;
  criteriaSource: MemoFieldSource;
}

export interface RepeatedErrorRow {
  id: string;
  exercise: string;
  error: string;
  kind: string;
  learners: string;
  cause: string;
}

export interface RemediationRow {
  id: string;
  objective: string;
  activity: string;
  support: string;
  learners: string;
}

export interface CorrectionMemoData {
  version: 1;
  examType: 'فرض' | 'اختبار';
  title: string;
  term: string;
  level: string;
  schoolName: string;
  directorate: string;
  schoolYear: string;
  teacherName: string;
  duration: string;
  part1DeclaredPoints: string;
  integration: {
    declaredPoints: string;
    criteria: IntegrationCriterion[];
  };
  resources: ResourceRow[];
  exercises: CorrectionExercise[];
  results: { learners: string; above10: string; passRate: string; average: string };
  errors: RepeatedErrorRow[];
  remediation: RemediationRow[];
  notes: string[];
  updatedAt: string;
}

export interface CorrectionSourceMeta {
  field: string;
  source: MemoFieldSource;
  confidence: MemoConfidence;
}

let counter = 0;
/** معرّفات مستقرة عند النسخ، حتى تبقى تعديلات الأستاذ مربوطة بسؤالها. */
export const uid = (prefix = 'cm') => {
  const cryptoApi = (globalThis as any)?.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}-${cryptoApi.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${(counter += 1).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const emptyQuestion = (number: string): CorrectionQuestion => ({
  id: uid('q'),
  number,
  text: '',
  points: '',
  expected: '',
  source: 'template',
  needsReview: false,
});

export const emptyExercise = (part: 1 | 2, label: string): CorrectionExercise => ({
  id: uid('ex'),
  part,
  label,
  declaredPoints: '',
  maqta: '',
  knowledge: '',
  criteria: '',
  questions: [emptyQuestion('1'), emptyQuestion('2'), emptyQuestion('3')],
  source: 'template',
});

const emptyIndicator = (): IntegrationIndicator => ({ id: uid('ind'), text: '', points: '' });

const emptyCriterion = (index: number): IntegrationCriterion => ({
  id: uid('crit'),
  key: INTEGRATION_CRITERIA[index].key,
  label: INTEGRATION_CRITERIA[index].label,
  indicators: [emptyIndicator(), emptyIndicator(), emptyIndicator()],
});

const emptyResource = (exerciseLabel: string): ResourceRow => ({
  id: uid('res'),
  exerciseLabel,
  maqta: '',
  knowledge: '',
  criteria: '',
  maqtaSource: 'template',
  knowledgeSource: 'template',
  criteriaSource: 'template',
});

export function createDefaultCorrectionMemo(): CorrectionMemoData {
  const first = emptyExercise(1, 'التمرين الأول');
  const second = emptyExercise(1, 'التمرين الثاني');
  return {
    version: 1,
    examType: 'اختبار',
    title: 'مذكرة التصحيح (الإجابة النموذجية وسلّم التنقيط)',
    term: 'الفصل الأول',
    level: '',
    schoolName: '',
    directorate: '',
    schoolYear: '',
    teacherName: '',
    duration: '',
    part1DeclaredPoints: '12',
    integration: {
      declaredPoints: '8',
      criteria: INTEGRATION_CRITERIA.map((_, index) => emptyCriterion(index)),
    },
    resources: [emptyResource('التمرين الأول'), emptyResource('التمرين الثاني'), emptyResource('الوضعية الإدماجية')],
    exercises: [first, second],
    results: { learners: '', above10: '', passRate: '', average: '' },
    errors: [
      { id: uid('err'), exercise: '', error: '', kind: '', learners: '', cause: '' },
      { id: uid('err'), exercise: '', error: '', kind: '', learners: '', cause: '' },
    ],
    remediation: [
      { id: uid('rem'), objective: '', activity: '', support: '', learners: '' },
      { id: uid('rem'), objective: '', activity: '', support: '', learners: '' },
    ],
    notes: ['', '', ''],
    updatedAt: new Date().toISOString(),
  };
}

/** رقم من نص عربي/لاتيني؛ الفراغ يعني غير محدد وليس صفراً. */
export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[\u066B]/g, '.')
    .replace(/[\u066C]/g, '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatPoints = (value: number | null): string =>
  value === null ? '—' : (Number.isInteger(value) ? String(value) : value.toFixed(1));

export const exerciseTotal = (exercise: CorrectionExercise): number => {
  const total = exercise.questions.reduce((sum, question) => sum + (toNumber(question.points) || 0), 0);
  return Math.round(total * 100) / 100;
};

export const criterionTotal = (criterion: IntegrationCriterion): number => {
  const total = criterion.indicators.reduce((sum, indicator) => sum + (toNumber(indicator.points) || 0), 0);
  return Math.round(total * 100) / 100;
};

export const integrationTotal = (data: CorrectionMemoData): number => {
  const total = data.integration.criteria.reduce((sum, criterion) => sum + criterionTotal(criterion), 0);
  return Math.round(total * 100) / 100;
};

export const part1Total = (data: CorrectionMemoData): number => {
  const total = data.exercises.filter(exercise => exercise.part === 1).reduce((sum, exercise) => sum + exerciseTotal(exercise), 0);
  return Math.round(total * 100) / 100;
};

export const overallTotal = (data: CorrectionMemoData): number =>
  Math.round((part1Total(data) + integrationTotal(data)) * 100) / 100;

export interface CorrectionWarning {
  message: string;
  blocking: boolean;
}

/** تحقق من تطابق مجموع سلّم التنقيط مع العلامة النهائية، دون منع الحفظ أو التصدير. */
export function validateCorrectionMemo(data: CorrectionMemoData, expectedTotal = 20): CorrectionWarning[] {
  const warnings: CorrectionWarning[] = [];

  data.exercises.forEach(exercise => {
    const declared = toNumber(exercise.declaredPoints);
    const computed = exerciseTotal(exercise);
    if (declared !== null && computed !== declared) {
      warnings.push({
        message: `${exercise.label}: مجموع الأسئلة ${formatPoints(computed)} ن لا يطابق النقطة المعلنة ${formatPoints(declared)} ن.`,
        blocking: true,
      });
    }
    if (declared === null && computed > 0) {
      warnings.push({ message: `${exercise.label}: النقطة الإجمالية غير محددة.`, blocking: false });
    }
  });

  const declaredPart1 = toNumber(data.part1DeclaredPoints);
  const computedPart1 = part1Total(data);
  if (declaredPart1 !== null && computedPart1 > 0 && declaredPart1 !== computedPart1) {
    warnings.push({
      message: `الجزء الأول: مجموع التمارين ${formatPoints(computedPart1)} ن لا يطابق النقطة المعلنة ${formatPoints(declaredPart1)} ن.`,
      blocking: true,
    });
  }

  const declaredIntegration = toNumber(data.integration.declaredPoints);
  const computedIntegration = integrationTotal(data);
  if (declaredIntegration !== null && computedIntegration > 0 && declaredIntegration !== computedIntegration) {
    warnings.push({
      message: `الوضعية الإدماجية: مجموع المعايير ${formatPoints(computedIntegration)} ن لا يطابق النقطة المعلنة ${formatPoints(declaredIntegration)} ن.`,
      blocking: true,
    });
  }

  const total = overallTotal(data);
  if (total > 0 && Math.abs(total - expectedTotal) > 0.001) {
    warnings.push({
      message: `المجموع العام ${formatPoints(total)} ن يختلف عن ${formatPoints(expectedTotal)} ن. راجع سلّم التنقيط.`,
      blocking: true,
    });
  }

  const unanswered = data.exercises
    .flatMap(exercise => exercise.questions.map(question => ({ exercise, question })))
    .filter(({ question }) => question.text.trim() && !question.expected.trim());
  if (unanswered.length) {
    warnings.push({
      message: `${unanswered.length} سؤالًا بلا عناصر إجابة: ${unanswered.slice(0, 4).map(({ exercise, question }) => `${exercise.label}/${question.number}`).join('، ')}${unanswered.length > 4 ? '…' : ''}`,
      blocking: false,
    });
  }

  return warnings;
}

/** حالة كل خانة مصدرها، لعرض الشارات داخل المحرر. */
export function collectFieldSources(data: CorrectionMemoData): CorrectionSourceMeta[] {
  const meta: CorrectionSourceMeta[] = [];
  const push = (field: string, source: MemoFieldSource) => meta.push({ field, source, confidence: SOURCE_CONFIDENCE[source] });

  push('schoolName', data.schoolName ? 'teacher' : 'template');
  push('directorate', data.directorate ? 'teacher' : 'template');
  push('schoolYear', data.schoolYear ? 'teacher' : 'template');
  push('teacherName', data.teacherName ? 'teacher' : 'template');
  data.exercises.forEach(exercise => {
    exercise.questions.forEach(question => push(`${exercise.label}/${question.number}`, question.source));
  });
  return meta;
}

const LEVEL_LABEL: Record<string, string> = {
  '1am': 'السنة الأولى متوسط',
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
};

export const levelLabel = (level?: string): string => (level ? LEVEL_LABEL[level] || level : '');

const kept = (current: string, next: string | undefined): string => current.trim() ? current : (next || '');

/**
 * تعبئة آلية من بيانات المنصة فقط، دون المساس بأي قيمة أدخلها الأستاذ.
 * لا تُختلق قيمة غير موجودة في الإعدادات أو قاعدة المناهج.
 */
export function fillFromPlatform(
  data: CorrectionMemoData,
  context: { config?: MemoConfig; lesson?: LessonMemo | null; curriculum?: LessonMemo[]; level?: string }
): { data: CorrectionMemoData; filled: string[]; skipped: string[] } {
  const { config, lesson, curriculum = [], level } = context;
  const filled: string[] = [];
  const skipped: string[] = [];
  const next: CorrectionMemoData = structuredClone(data);

  const assign = (key: string, current: string, value: string | undefined | null, apply: (text: string) => void) => {
    const target = (value || '').trim();
    if (!target) { skipped.push(key); return; }
    if (current.trim()) { skipped.push(key); return; }
    apply(target);
    filled.push(key);
  };

  assign('المؤسسة', next.schoolName, config?.schoolName, text => { next.schoolName = text; });
  assign('مديرية التربية', next.directorate, config?.directorate, text => { next.directorate = text; });
  assign('السنة الدراسية', next.schoolYear, config?.schoolYear, text => { next.schoolYear = text; });
  assign('الأستاذ(ة)', next.teacherName, config?.teacherName, text => { next.teacherName = text; });
  assign('المستوى', next.level, levelLabel(lesson?.level || level), text => { next.level = text; });

  if (lesson) {
    const sameLevel = curriculum.filter(item => item.level === lesson.level);
    const sameMaqta = sameLevel.filter(item => item.maqta === lesson.maqta);
    const criteria = lesson.ma3ayirTaqwim || sameMaqta.map(item => item.ma3ayirTaqwim).filter(Boolean).join(' | ');
    const knowledge = lesson.markaba || lesson.ta3alom || lesson.mawrid;

    next.resources.forEach((resource, index) => {
      if (index >= next.exercises.length + 1) return;
      if (!resource.maqta.trim() && lesson.maqta) { resource.maqta = lesson.maqta; resource.maqtaSource = 'platform'; filled.push(`المقطع/${resource.exerciseLabel}`); }
      if (!resource.knowledge.trim() && knowledge) { resource.knowledge = knowledge; resource.knowledgeSource = 'platform'; filled.push(`الموارد المعرفية/${resource.exerciseLabel}`); }
      if (!resource.criteria.trim() && criteria) { resource.criteria = criteria; resource.criteriaSource = 'platform'; filled.push(`المعايير/${resource.exerciseLabel}`); }
    });

    next.exercises.forEach(exercise => {
      if (!exercise.maqta.trim() && lesson.maqta) { exercise.maqta = lesson.maqta; }
      if (!exercise.knowledge.trim() && knowledge) { exercise.knowledge = knowledge; }
      if (!exercise.criteria.trim() && criteria) { exercise.criteria = criteria; }
    });
  } else {
    skipped.push('بيانات المورد الحالي');
  }

  next.updatedAt = new Date().toISOString();
  return { data: next, filled, skipped };
}

const clampString = (value: unknown, max = 4000): string =>
  typeof value === 'string' ? value.slice(0, max) : (typeof value === 'number' ? String(value) : '');

const normalizeSource = (value: unknown): MemoFieldSource =>
  value === 'platform' || value === 'imported' || value === 'ai' || value === 'teacher' || value === 'template' ? value : 'template';

/** استرجاع آمن: يقبل المسودات القديمة أو التالفة دون كسر الواجهة. */
export function normalizeCorrectionMemo(raw: unknown): CorrectionMemoData {
  const base = createDefaultCorrectionMemo();
  if (!raw || typeof raw !== 'object') return base;
  const source = raw as Partial<CorrectionMemoData>;

  const exercises = Array.isArray(source.exercises) && source.exercises.length
    ? source.exercises.slice(0, 12).map((exercise, index) => ({
        id: clampString((exercise as any)?.id, 80) || uid('ex'),
        part: ((exercise as any)?.part === 2 ? 2 : 1) as 1 | 2,
        label: clampString((exercise as any)?.label, 120) || `التمرين ${index + 1}`,
        declaredPoints: clampString((exercise as any)?.declaredPoints, 20),
        maqta: clampString((exercise as any)?.maqta, 300),
        knowledge: clampString((exercise as any)?.knowledge),
        criteria: clampString((exercise as any)?.criteria),
        source: normalizeSource((exercise as any)?.source),
        questions: Array.isArray((exercise as any)?.questions) && (exercise as any).questions.length
          ? (exercise as any).questions.slice(0, 40).map((question: any, qIndex: number) => ({
              id: clampString(question?.id, 80) || uid('q'),
              number: clampString(question?.number, 20) || String(qIndex + 1),
              text: clampString(question?.text, 2000),
              points: clampString(question?.points, 20),
              expected: clampString(question?.expected),
              source: normalizeSource(question?.source),
              needsReview: Boolean(question?.needsReview),
            }))
          : [emptyQuestion('1')],
      }))
    : base.exercises;

  const criteriaSource = Array.isArray(source.integration?.criteria) ? source.integration.criteria : [];
  const criteria = INTEGRATION_CRITERIA.map((definition, index) => {
    const stored = criteriaSource.find(item => item?.key === definition.key) || criteriaSource[index];
    const indicators = Array.isArray(stored?.indicators) && stored.indicators.length
      ? stored.indicators.slice(0, 10).map((indicator: any) => ({
          id: clampString(indicator?.id, 80) || uid('ind'),
          text: clampString(indicator?.text, 1000),
          points: clampString(indicator?.points, 20),
        }))
      : [emptyIndicator(), emptyIndicator(), emptyIndicator()];
    return {
      id: clampString(stored?.id, 80) || uid('crit'),
      key: definition.key,
      label: definition.label,
      indicators,
    };
  });

  const resources = Array.isArray(source.resources) && source.resources.length
    ? source.resources.slice(0, 16).map(resource => ({
        id: clampString(resource?.id, 80) || uid('res'),
        exerciseLabel: clampString(resource?.exerciseLabel, 120),
        maqta: clampString(resource?.maqta, 300),
        knowledge: clampString(resource?.knowledge),
        criteria: clampString(resource?.criteria),
        maqtaSource: normalizeSource(resource?.maqtaSource),
        knowledgeSource: normalizeSource(resource?.knowledgeSource),
        criteriaSource: normalizeSource(resource?.criteriaSource),
      }))
    : base.resources;

  const errors = Array.isArray(source.errors) && source.errors.length
    ? source.errors.slice(0, 30).map(error => ({
        id: clampString(error?.id, 80) || uid('err'),
        exercise: clampString(error?.exercise, 200),
        error: clampString(error?.error, 1000),
        kind: clampString(error?.kind, 60),
        learners: clampString(error?.learners, 60),
        cause: clampString(error?.cause, 1000),
      }))
    : base.errors;

  const remediation = Array.isArray(source.remediation) && source.remediation.length
    ? source.remediation.slice(0, 30).map(row => ({
        id: clampString(row?.id, 80) || uid('rem'),
        objective: clampString(row?.objective, 1000),
        activity: clampString(row?.activity, 1000),
        support: clampString(row?.support, 600),
        learners: clampString(row?.learners, 200),
      }))
    : base.remediation;

  const notes = Array.isArray(source.notes) && source.notes.length
    ? source.notes.slice(0, 6).map(note => clampString(note, 600))
    : base.notes;

  return {
    version: 1,
    examType: source.examType === 'اختبار' ? 'اختبار' : 'فرض',
    title: clampString(source.title, 200) || base.title,
    term: clampString(source.term, 60) || base.term,
    level: clampString(source.level, 80),
    schoolName: clampString(source.schoolName, 200),
    directorate: clampString(source.directorate, 200),
    schoolYear: clampString(source.schoolYear, 60),
    teacherName: clampString(source.teacherName, 200),
    duration: clampString(source.duration, 60),
    part1DeclaredPoints: clampString(source.part1DeclaredPoints, 20) || base.part1DeclaredPoints,
    integration: {
      declaredPoints: clampString(source.integration?.declaredPoints, 20) || base.integration.declaredPoints,
      criteria,
    },
    resources,
    exercises,
    results: {
      learners: clampString(source.results?.learners, 60),
      above10: clampString(source.results?.above10, 60),
      passRate: clampString(source.results?.passRate, 60),
      average: clampString(source.results?.average, 60),
    },
    errors,
    remediation,
    notes,
    updatedAt: clampString(source.updatedAt, 40) || new Date().toISOString(),
  };
}

/** خيارات عرض الترويسة مع قيم بديلة بصرية فقط، لا تُحفظ ولا تُعتبر بيانات. */
export const displayValue = (value: string, fallback = '................'): string => value.trim() || fallback;

export { kept as keepFilledValue };
