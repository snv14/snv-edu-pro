import { toNumber } from './correctionMemoModel';
import {
  AssessmentExam,
  AssessmentQuestionRef,
  StudentResult,
  examMaxTotal,
  flattenRefs,
  studentScore20,
  studentTotal,
} from './assessmentModel';

/**
 * تحليل نتائج التقويم: أرقام قابلة للاستعمال التربوي، لا رسوم فقط.
 * كل ما لا تدعمه البيانات يُصرَّح به («السبب المحتمل») ولا يُقدَّم كسبب مؤكد.
 */

export type ErrorKind =
  | 'معرفي'
  | 'منهجي'
  | 'لغوي'
  | 'سوء فهم التعليمة'
  | 'ضعف في استغلال الوثيقة'
  | 'ضعف في الاستنتاج';

export const ERROR_KINDS: ErrorKind[] = [
  'معرفي',
  'منهجي',
  'لغوي',
  'سوء فهم التعليمة',
  'ضعف في استغلال الوثيقة',
  'ضعف في الاستنتاج',
];

const round2 = (value: number): number => Math.round(value * 100) / 100;
const percent = (value: number, total: number): number => (total > 0 ? round2((value / total) * 100) : 0);

export interface QuestionPerformance {
  ref: AssessmentQuestionRef;
  answered: number;
  average: number;
  achievement: number;
  struggling: number;
  perfect: number;
}

export interface ExercisePerformance {
  id: string;
  label: string;
  max: number;
  average: number;
  achievement: number;
  struggling: number;
}

export interface ExamStats {
  hasData: boolean;
  enrolled: number;
  absent: number;
  graded: number;
  average20: number;
  highest20: number;
  lowest20: number;
  passCount: number;
  failCount: number;
  passRate: number;
  struggleRate: number;
  distribution: Array<{ label: string; count: number; ratio: number }>;
  perQuestion: QuestionPerformance[];
  perExercise: ExercisePerformance[];
  totalMax: number;
}

const gradedResults = (exam: AssessmentExam): StudentResult[] =>
  exam.results.filter(result => !result.absent && Object.values(result.scores || {}).some(value => toNumber(value) !== null));

export function computeExamStats(exam: AssessmentExam): ExamStats {
  const refs = flattenRefs(exam);
  const totalMax = examMaxTotal(exam);
  const graded = gradedResults(exam);
  const enrolled = exam.results.length;
  const absent = exam.results.filter(result => result.absent).length;
  const scores20 = graded.map(result => studentScore20(exam, result));

  const average20 = scores20.length ? round2(scores20.reduce((sum, value) => sum + value, 0) / scores20.length) : 0;
  const highest20 = scores20.length ? round2(Math.max(...scores20)) : 0;
  const lowest20 = scores20.length ? round2(Math.min(...scores20)) : 0;
  const passCount = scores20.filter(value => value >= 10).length;
  const failCount = scores20.length - passCount;

  const bands = [
    { label: '0 – 5', min: 0, max: 5 },
    { label: '5 – 10', min: 5, max: 10 },
    { label: '10 – 14', min: 10, max: 14 },
    { label: '14 – 20', min: 14, max: 20.0001 },
  ];
  const distribution = bands.map(band => {
    const count = scores20.filter(value => value >= band.min && value < band.max).length;
    return { label: band.label, count, ratio: percent(count, scores20.length) };
  });

  const perQuestion: QuestionPerformance[] = refs.map(ref => {
    const values = graded
      .map(result => toNumber(result.scores?.[ref.id]))
      .filter((value): value is number => value !== null);
    const average = values.length ? round2(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    return {
      ref,
      answered: values.length,
      average,
      achievement: percent(average, ref.max),
      struggling: ref.max > 0 ? values.filter(value => value < ref.max / 2).length : 0,
      perfect: ref.max > 0 ? values.filter(value => value >= ref.max).length : 0,
    };
  });

  const groups = new Map<string, { label: string; refs: AssessmentQuestionRef[] }>();
  refs.filter(ref => ref.kind === 'question').forEach(ref => {
    const group = groups.get(ref.exerciseId) || { label: ref.exerciseLabel, refs: [] };
    group.refs.push(ref);
    groups.set(ref.exerciseId, group);
  });

  const perExercise: ExercisePerformance[] = Array.from(groups.entries()).map(([id, group]) => {
    const max = round2(group.refs.reduce((sum, ref) => sum + ref.max, 0));
    const totals = graded.map(result => group.refs.reduce((sum, ref) => {
      const value = toNumber(result.scores?.[ref.id]);
      return sum + (value === null ? 0 : Math.min(Math.max(value, 0), ref.max));
    }, 0));
    const average = totals.length ? round2(totals.reduce((sum, value) => sum + value, 0) / totals.length) : 0;
    return {
      id,
      label: group.label,
      max,
      average,
      achievement: percent(average, max),
      struggling: max > 0 ? totals.filter(value => value < max / 2).length : 0,
    };
  });

  return {
    hasData: graded.length > 0,
    enrolled,
    absent,
    graded: graded.length,
    average20,
    highest20,
    lowest20,
    passCount,
    failCount,
    passRate: percent(passCount, scores20.length),
    struggleRate: percent(failCount, scores20.length),
    distribution,
    perQuestion,
    perExercise,
    totalMax,
  };
}

const errorKindOf = (text: string): ErrorKind => {
  const value = String(text || '');
  if (/(استنتج|استنتاج|الاستنتاج|ماذا تستنتج)/.test(value)) return 'ضعف في الاستنتاج';
  if (/(وثيقة|وثيقه|سند|شكل|جدول|رسم|منحنى|صورة|معطيات)/.test(value)) return 'ضعف في استغلال الوثيقة';
  if (/(قارن|صنف|رتب|فسر|علل|برر|اشرح|حلل|ناقش)/.test(value)) return 'منهجي';
  if (/(اذكر|عدد|عرف|سم|حدد|أكمل|اكمل)/.test(value)) return 'معرفي';
  return 'معرفي';
};

const POSSIBLE_CAUSES: Record<ErrorKind, string> = {
  'معرفي': 'المورد المعرفي غير مثبَّت بعد: التمثل الكافي للمفهوم لم يُبنَ.',
  'منهجي': 'منهجية الإجابة (الملاحظة ← التفسير ← الاستنتاج) غير متحكَّم فيها.',
  'لغوي': 'صعوبة في صياغة الإجابة العلمية بالمصطلحات الدقيقة.',
  'سوء فهم التعليمة': 'التمييز بين المطلوب (اذكر/فسر/استنتج) غير واضح لدى المتعلم.',
  'ضعف في استغلال الوثيقة': 'المعطيات لم تُستخرج من السند أو لم تُربط بالسؤال.',
  'ضعف في الاستنتاج': 'إعطاء ملاحظة بدل استنتاج، أو غياب الربط بين المعطيات والنتيجة.',
};

export interface RecurringErrorRow {
  id: string;
  questionId: string;
  exerciseLabel: string;
  question: string;
  error: string;
  kind: ErrorKind;
  learners: number;
  learnerNames: string[];
  possibleCause: string;
  resource: string;
  achievement: number;
}

/** أخطاء متكررة مبنية على النقاط المسجّلة فقط، بسبب «محتمل» لا مؤكد. */
export function detectRecurringErrors(exam: AssessmentExam, stats?: ExamStats): RecurringErrorRow[] {
  const computed = stats || computeExamStats(exam);
  if (!computed.hasData) return [];
  const graded = gradedResults(exam);

  return computed.perQuestion
    .filter(item => item.struggling > 0 && item.ref.max > 0)
    .map(item => {
      const learnerNames = graded
        .filter(result => {
          const value = toNumber(result.scores?.[item.ref.id]);
          return value !== null && value < item.ref.max / 2;
        })
        .map(result => result.studentName || 'تلميذ بلا اسم')
        .slice(0, 8);
      const kind = errorKindOf(item.ref.text);
      return {
        id: `err-${item.ref.id}`,
        questionId: item.ref.id,
        exerciseLabel: item.ref.exerciseLabel,
        question: item.ref.text || '(سؤال بلا نص)',
        error: `لم يحقق ${item.struggling} من ${computed.graded} التلاميذ نصف النقطة (${item.ref.max} ن)، ومتوسط التحصيل ${item.achievement}%.`,
        kind,
        learners: item.struggling,
        learnerNames,
        possibleCause: `${POSSIBLE_CAUSES[kind]} — احتمال يحتاج تأكيدًا من ملاحظات التصحيح.`,
        resource: item.ref.knowledge || item.ref.maqta || item.ref.exerciseLabel,
        achievement: item.achievement,
      };
    })
    .sort((a, b) => a.achievement - b.achievement)
    .slice(0, 20);
}

export interface RemediationRow {
  id: string;
  resource: string;
  difficulty: ErrorKind;
  activity: string;
  support: string;
  learners: string;
  learnerNames: string[];
  successIndicator: string;
  questionCount: number;
  achievement: number;
}

const ACTIVITY_BY_KIND: Record<ErrorKind, string> = {
  'معرفي': 'إعادة بناء المورد عبر نشاط قصير متدرج: سند + أسئلة استرجاع ثم تطبيق ثم إرساء مكتوب.',
  'منهجي': 'تدريب على منهجية الإجابة: تفكيك التعليمة، تحديد المعطيات، صياغة الاستنتاج ومراجعته.',
  'لغوي': 'ورشة مصطلحات: بطاقة مفاهيم للمقطع + إعادة صياغة جماعية لإجابات ناقصة.',
  'سوء فهم التعليمة': 'نشاط تمييز التعليمات: اذكر / فسّر / استنتج مع أمثلة مصححة ومقارنة.',
  'ضعف في استغلال الوثيقة': 'قراءة موجهة لوثيقة علمية: جدول معطيات ← استخراج ← تفسير ← استنتاج.',
  'ضعف في الاستنتاج': 'سلسلة: ملاحظة ← تفسير ← استنتاج على سند جديد، ثم استنتاج ذاتي.',
};

const SUPPORT_BY_KIND: Record<ErrorKind, string> = {
  'معرفي': 'السند من الكتاب المدرسي + ملخص المقطع في المذكرة المعتمدة.',
  'منهجي': 'ورقة تعليمة مبسّطة + إجابات نموذجية مجزّأة.',
  'لغوي': 'بطاقة مصطلحات المقطع + معجم المنهاج.',
  'سوء فهم التعليمة': 'أمثلة تعليمات مع إجاباتها لكل مستوى (اذكر/فسر/استنتج).',
  'ضعف في استغلال الوثيقة': 'وثيقة علمية واضحة (جدول أو منحنى) بأسئلة قراءة موجهة.',
  'ضعف في الاستنتاج': 'وثيقة جديدة قصيرة + قالب استنتاج من ثلاث خطوات.',
};

export function buildRemediationPlan(exam: AssessmentExam, errors?: RecurringErrorRow[]): RemediationRow[] {
  const rows = errors || detectRecurringErrors(exam);
  const groups = new Map<string, RecurringErrorRow[]>();
  rows.forEach(row => {
    const key = row.resource || row.exerciseLabel;
    groups.set(key, [...(groups.get(key) || []), row]);
  });

  return Array.from(groups.entries())
    .map(([resource, group]) => {
      const difficulty = group.reduce<ErrorKind>((dominant, row) => {
        const dominantCount = group.filter(item => item.kind === dominant).length;
        const rowCount = group.filter(item => item.kind === row.kind).length;
        return rowCount > dominantCount ? row.kind : dominant;
      }, group[0].kind);
      const learnerNames = Array.from(new Set(group.flatMap(row => row.learnerNames))).slice(0, 8);
      const learners = learnerNames.length ? learnerNames.join('، ') : `${group.reduce((sum, row) => sum + row.learners, 0)} متعلماً`;
      const achievement = round2(group.reduce((sum, row) => sum + row.achievement, 0) / group.length);
      return {
        id: `rem-${resource.slice(0, 24)}-${difficulty}`,
        resource: resource || 'مورد غير محدد',
        difficulty,
        activity: ACTIVITY_BY_KIND[difficulty],
        support: SUPPORT_BY_KIND[difficulty],
        learners,
        learnerNames,
        successIndicator: 'تحقيق 70% من المتعلمين المعنيين نصف النقطة على الأقل في سؤال مماثل بعد المعالجة.',
        questionCount: group.length,
        achievement,
      };
    })
    .sort((a, b) => a.achievement - b.achievement);
}

/** خلاصات تربوية قابلة للاستعمال استنادًا إلى الأرقام فقط. */
export function buildAnalysisNarrative(exam: AssessmentExam, stats: ExamStats, errors: RecurringErrorRow[]): string[] {
  if (!stats.hasData) {
    return ['أدخل نتائج التلاميذ في تبويب النتائج ليبني النظام تحليلًا مبنيًا على الأرقام، دون تقدير أو تخمين.'];
  }
  const lines: string[] = [];
  lines.push(`متوسط القسم ${stats.average20}/20، ونسبة النجاح ${stats.passRate}% (${stats.passCount} من ${stats.graded} مصححًا).`);

  const exercises = [...stats.perExercise].sort((a, b) => a.achievement - b.achievement);
  if (exercises.length) {
    const weakest = exercises[0];
    const strongest = exercises[exercises.length - 1];
    lines.push(`أدنى تحصيل في ${weakest.label} (${weakest.achievement}% من ${weakest.max} ن)، وأعلى تحصيل في ${strongest.label} (${strongest.achievement}%).`);
  }

  const hardest = stats.perQuestion
    .filter(item => item.ref.kind === 'question' && item.ref.text.trim() && item.ref.max > 0)
    .sort((a, b) => a.achievement - b.achievement)[0];
  if (hardest) {
    lines.push(`أكثر سؤال صعوبة: «${hardest.ref.text.slice(0, 90)}» — متوسط التحصيل ${hardest.achievement}%.`);
  }

  const weakResources = Array.from(new Set(errors.map(row => row.resource).filter(Boolean))).slice(0, 3);
  if (weakResources.length) {
    lines.push(`موارد تحتاج معالجة: ${weakResources.join(' · ')} (استنتاج من النقاط، يحتاج تأكيدًا من ملاحظات التصحيح).`);
  }
  if (stats.absent > 0) lines.push(`${stats.absent} تلميذًا غائبًا لم تُحتسب نتائجهم في المعدل.`);
  return lines;
}

/** نقل التحليل إلى مذكرة التصحيح ليطبعها الأستاذ مع المذكرة. */
export function applyAnalysisToMemo(
  exam: AssessmentExam,
  stats: ExamStats,
  errors: RecurringErrorRow[],
  plan: RemediationRow[],
): AssessmentExam {
  const structured = (globalThis as any)?.structuredClone;
  const next: AssessmentExam = structured ? structured(exam) : JSON.parse(JSON.stringify(exam));
  next.memo.results = {
    learners: String(stats.enrolled),
    above10: String(stats.passCount),
    passRate: `${stats.passRate}%`,
    average: `${stats.average20}/20`,
  };
  next.memo.errors = errors.slice(0, 12).map(row => ({
    id: row.id,
    exercise: `${row.exerciseLabel} — سؤال ${row.questionId.slice(-4)}`,
    error: row.error,
    kind: row.kind,
    learners: String(row.learners),
    cause: row.possibleCause,
  }));
  next.memo.remediation = plan.slice(0, 12).map(row => ({
    id: row.id,
    objective: row.resource,
    activity: row.activity,
    support: row.support,
    learners: row.learners,
  }));
  next.status = 'تم التحليل';
  next.updatedAt = new Date().toISOString();
  return next;
}
