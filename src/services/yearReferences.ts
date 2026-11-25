import type { LessonMemo } from '../types';
import { getOfficialSourcesManifest } from './knowledgeOfficialSources';
import { getSourceById } from './officialPedagogicalSources';

export type YearLevel = LessonMemo['level'];
export const YEAR_REFERENCE_LABELS: Record<YearLevel, string> = {
  '1am': 'السنة الأولى متوسط', '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط', '4am': 'السنة الرابعة متوسط',
};

/** صفحات المخططات فقط؛ دليل الكتاب والتدرج القابل للتحرير يبقيان قسمين منفصلين. */
export function getYearPlans(level: YearLevel) {
  const localAnnualSource = level === '3am' ? undefined : getSourceById(`men-${level}-teacher-plans-guide`);
  return getOfficialSourcesManifest().filter(entry => entry.level === level && entry.kind === 'progression')
    .map(entry => ({ ...entry, url: entry.id === `annualPlan2023_${level}` && localAnnualSource ? localAnnualSource.url : entry.url }));
}
