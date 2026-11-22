import { LessonMemo } from '../types';
import {
  CorrectionMemoData,
  INTEGRATION_CRITERIA,
  examStructure,
  levelLabel,
  toNumber,
} from './correctionMemoModel';

/**
 * تعبئة مذكرة التصحيح من قاعدة المناهج المحلية:
 * يبحث عن الدرس الأقرب لأسئلة الورقة ثم يعبّئ الميدان والمقطع والكفاءة
 * والموارد والمعايير في الخانات الفارغة فقط.
 */

const normalize = (value: unknown): string =>
  String(value || '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const STOP_WORDS = new Set([
  'في', 'من', 'على', 'عن', 'الى', 'إلى', 'مع', 'هو', 'هي', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي',
  'ما', 'ماذا', 'لماذا', 'كيف', 'اذكر', 'فسر', 'علل', 'استنتج', 'عرّف', 'عرف', 'بين', 'حدد',
  'اكتب', 'احسب', 'قارن', 'الشكل', 'الوثيقة', 'الجدول', 'التالي', 'التالية', 'نقطة', 'نقاط',
]);

const tokensOf = (value: unknown): string[] =>
  normalize(value).split(' ').filter(token => token.length > 2 && !STOP_WORDS.has(token));

const uniq = (values: string[]): string[] => Array.from(new Set(values));

export interface CurriculumMatch {
  lesson: LessonMemo;
  score: number;
}

const lessonText = (lesson: LessonMemo): string => [
  lesson.midan,
  lesson.maqta,
  lesson.mawrid,
  lesson.ta3alom,
  lesson.markaba,
  lesson.marifa,
  lesson.manhaji,
  lesson.wadiya,
  lesson.moshkila,
  ...(lesson.mostalahat ? [lesson.mostalahat] : []),
  ...(lesson.anshita || []).map(activity => activity.title),
].filter(Boolean).join(' ');

/** أفضل درس مطابق لأسئلة الورقة؛ يُرجع null إن لم يكن هناك تطابق حقيقي. */
export function findBestCurriculumLesson(
  data: CorrectionMemoData,
  curriculum: LessonMemo[]
): CurriculumMatch | null {
  const questionText = data.exercises
    .flatMap(exercise => exercise.questions.map(question => question.text))
    .filter(Boolean)
    .join(' ');
  const queryTokens = uniq(tokensOf(questionText || data.title));
  if (!queryTokens.length) return null;

  const level = data.level ? normalize(data.level) : '';
  let best: CurriculumMatch | null = null;

  curriculum.forEach(lesson => {
    const text = normalize(lessonText(lesson));
    if (!text) return;
    let score = 0;
    queryTokens.forEach(token => {
      if (text.includes(token)) score += 1;
    });
    if (level) {
      const label = normalize(levelLabel(lesson.level));
      if (level.includes(label) || label.includes(level)) score += 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { lesson, score };
  });

  // لا نعتبر التطابق مقبولاً إلا إذا اشترك في كلمتين دلاليتين على الأقل.
  return best && (best as CurriculumMatch).score >= 2 ? best : null;
}

export interface EnrichmentResult {
  data: CorrectionMemoData;
  filled: string[];
  matched: { midan: string; maqta: string; mawrid: string; ta3alom: string; level: string; score: number } | null;
}

/**
 * تعبئة الميدان/المقطع/الكفاءة/الموارد/المعايير من قاعدة المناهج.
 * الأولوية: الدرس المفتوح في المنصة، ثم أقرب درس مطابق لأسئلة الورقة.
 */
export function enrichCorrectionMemoFromDb(
  data: CorrectionMemoData,
  context: { lesson?: LessonMemo | null; curriculum?: LessonMemo[] }
): EnrichmentResult {
  const next: CorrectionMemoData = structuredClone(data);
  const filled: string[] = [];
  const curriculum = context.curriculum || [];

  let source = context.lesson || null;
  let score = source ? 99 : 0;
  if (!source) {
    const best = findBestCurriculumLesson(data, curriculum);
    if (best) {
      source = best.lesson;
      score = best.score;
    }
  }
  if (!source) return { data: next, filled, matched: null };

  const maqta = source.maqta || '';
  const knowledge = source.markaba || source.ta3alom || source.mawrid || '';
  const criteria = source.ma3ayirTaqwim || '';

  if (!next.midan.trim() && source.midan) {
    next.midan = source.midan;
    next.midanSource = 'platform';
    filled.push('الميدان');
  }
  if (!next.competence.trim() && source.kafaaKhitamiya) {
    next.competence = source.kafaaKhitamiya;
    next.competenceSource = 'platform';
    filled.push('الكفاءة الختامية');
  }
  if (!next.level.trim() && source.level) {
    next.level = levelLabel(source.level);
    filled.push('المستوى');
  }

  const integrationVisible = next.examType === 'اختبار';
  next.resources.forEach(resource => {
    if (!integrationVisible && resource.exerciseLabel.includes('الإدماجية')) return;
    if (!resource.maqta.trim() && maqta) {
      resource.maqta = maqta;
      resource.maqtaSource = 'platform';
      filled.push(`المقطع/${resource.exerciseLabel}`);
    }
    if (!resource.knowledge.trim() && knowledge) {
      resource.knowledge = knowledge;
      resource.knowledgeSource = 'platform';
      filled.push(`الموارد/${resource.exerciseLabel}`);
    }
    if (!resource.criteria.trim() && criteria) {
      resource.criteria = criteria;
      resource.criteriaSource = 'platform';
      filled.push(`المعايير/${resource.exerciseLabel}`);
    }
  });

  next.exercises.forEach(exercise => {
    if (!exercise.maqta.trim() && maqta) exercise.maqta = maqta;
    if (!exercise.knowledge.trim() && knowledge) exercise.knowledge = knowledge;
    if (!exercise.criteria.trim() && criteria) exercise.criteria = criteria;
  });

  next.updatedAt = new Date().toISOString();
  return {
    data: next,
    filled,
    matched: {
      midan: source.midan || '',
      maqta,
      mawrid: source.mawrid || '',
      ta3alom: source.ta3alom || '',
      level: levelLabel(source.level),
      score,
    },
  };
}

/** اقتراح سلّم تنقيط متوازن: الجزء الأول 12 أو 20، والوضعية الإدماجية 8. */
export interface PointSuggestion {
  examType: 'فرض' | 'اختبار';
  part1DeclaredPoints: string;
  exercises: Array<{
    exerciseId: string;
    label: string;
    declaredPoints: string;
    questions: Array<{ questionId: string; number: string; points: string }>;
  }>;
  integrationDeclaredPoints: string;
  criteria: Array<{
    criterionId: string;
    label: string;
    indicators: Array<{ indicatorId: string; points: string }>;
  }>;
  total: number;
}

const roundTo = (value: number, step: number): number => Math.max(step, Math.round(value / step) * step);

const splitTotal = (total: number, weights: number[], step: number): number[] => {
  if (!weights.length) return [];
  const sum = weights.reduce((acc, weight) => acc + Math.max(weight, 0.0001), 0);
  const parts = weights.map(weight => roundTo((total * Math.max(weight, 0.0001)) / sum, step));
  const diff = Math.round((total - parts.reduce((acc, part) => acc + part, 0)) * 100) / 100;
  parts[parts.length - 1] = Math.max(step, Math.round((parts[parts.length - 1] + diff) * 100) / 100);
  return parts;
};

const weightOf = (text: string): number => Math.max(1, Math.min(8, Math.round((text || '').trim().length / 40) + 1));

/** توزيع بديل يختاره الأستاذ (مثل 6+6+8) قبل اعتماد الاقتراح. */
export interface PointSuggestionOptions {
  exercisePoints?: number[];
  integrationPoints?: number;
}

export function buildPointSuggestion(data: CorrectionMemoData, options: PointSuggestionOptions = {}): PointSuggestion {
  const exercises = data.exercises.filter(exercise => exercise.part === 1);
  const structure = examStructure(data.examType, exercises.length);
  const exerciseWeights = exercises.map(exercise =>
    exercise.questions.reduce((acc, question) => acc + weightOf(question.text), 0)
  );
  // الأولوية لتوزيع الأستاذ، ثم توزيع النوع المعتمد (6+6 للاختبار، 10+10 أو 7+7+6 للفرض)،
  // ثم التوزيع الموزون حسب حجم الأسئلة عندما يختلف عدد التمارين عن التوزيع المعتمد.
  const exerciseTotals = options.exercisePoints && options.exercisePoints.length === exercises.length
    ? options.exercisePoints.map(value => Math.max(0.5, Number(value) || 0))
    : structure.exercisePoints.length === exercises.length
      ? [...structure.exercisePoints]
      : splitTotal(structure.part1Points, exerciseWeights, 1);
  const part1Points = Math.round(exerciseTotals.reduce((sum, value) => sum + value, 0) * 100) / 100;
  const integrationPoints = options.integrationPoints ?? (structure.integration ? structure.integrationPoints : 0);

  const suggestion: PointSuggestion = {
    examType: data.examType,
    part1DeclaredPoints: String(part1Points),
    exercises: exercises.map((exercise, index) => {
      const total = exerciseTotals[index] ?? 1;
      const questionWeights = exercise.questions.map(question => weightOf(question.text));
      const questionPoints = splitTotal(total, questionWeights, 0.5);
      return {
        exerciseId: exercise.id,
        label: exercise.label,
        declaredPoints: String(total),
        questions: exercise.questions.map((question, qIndex) => ({
          questionId: question.id,
          number: question.number,
          points: String(questionPoints[qIndex] ?? 0.5),
        })),
      };
    }),
    integrationDeclaredPoints: integrationPoints ? String(integrationPoints) : '',
    criteria: [],
    total: Math.round((part1Points + integrationPoints) * 100) / 100,
  };

  if (integrationPoints > 0) {
    const criterionTotalPoints = integrationPoints / INTEGRATION_CRITERIA.length;
    suggestion.criteria = data.integration.criteria.map(criterion => {
      const weighted = criterion.indicators.map(indicator => (indicator.text.trim() ? 1 : 0));
      const usable = weighted.some(weight => weight > 0) ? weighted : criterion.indicators.map((_, index) => (index === 0 ? 1 : 0));
      const shares = splitTotal(criterionTotalPoints, usable, 0.25);
      return {
        criterionId: criterion.id,
        label: criterion.label,
        indicators: criterion.indicators.map((indicator, index) => ({
          indicatorId: indicator.id,
          points: usable[index] ? String(shares[index] ?? 0.25) : '',
        })),
      };
    });
  }

  return suggestion;
}

/** تطبيق الاقتراح على الخانات الفارغة فقط حتى لا يُستبدل تنقيط الأستاذ. */
export function applyPointSuggestion(
  data: CorrectionMemoData,
  suggestion: PointSuggestion,
  options: { overwrite?: boolean } = {}
): { data: CorrectionMemoData; applied: number } {
  const next: CorrectionMemoData = structuredClone(data);
  const overwrite = options.overwrite === true;
  let applied = 0;

  const assign = (target: { points: string; source?: string }, value: string) => {
    if (!value) return;
    if (!overwrite && target.points.trim()) return;
    target.points = value;
    applied += 1;
  };

  if (overwrite || !toNumber(next.part1DeclaredPoints)) {
    next.part1DeclaredPoints = suggestion.part1DeclaredPoints;
  }

  suggestion.exercises.forEach(item => {
    const exercise = next.exercises.find(entry => entry.id === item.exerciseId);
    if (!exercise) return;
    if (overwrite || !exercise.declaredPoints.trim()) exercise.declaredPoints = item.declaredPoints;
    item.questions.forEach(questionItem => {
      const question = exercise.questions.find(entry => entry.id === questionItem.questionId);
      if (question) assign(question, questionItem.points);
    });
  });

  if (next.examType === 'اختبار') {
    if (overwrite || !toNumber(next.integration.declaredPoints)) {
      next.integration.declaredPoints = suggestion.integrationDeclaredPoints;
    }
    suggestion.criteria.forEach(item => {
      const criterion = next.integration.criteria.find(entry => entry.id === item.criterionId);
      if (!criterion) return;
      item.indicators.forEach(indicatorItem => {
        const indicator = criterion.indicators.find(entry => entry.id === indicatorItem.indicatorId);
        if (indicator) assign(indicator, indicatorItem.points);
      });
    });
  }

  next.updatedAt = new Date().toISOString();
  return { data: next, applied };
}
