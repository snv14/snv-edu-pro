import type { LessonMemo } from '../types';
import type { OfficialKnowledgeDoc } from '../types/knowledge';
import type { YearLevel } from './yearReferences';
import { normalizeSourceQuery } from './sourceContent';
import type { YearPlanUnit } from '../data/yearPlanOutlines';

export function filterYearPlanUnits(units: YearPlanUnit[], query: string, term: string, doc: OfficialKnowledgeDoc | null) {
  const terms = normalizeSourceQuery(query).split(' ').filter(Boolean);
  return units.filter(unit => {
    if (term && String(unit.term) !== term) return false;
    const text = normalizeSourceQuery([unit.title, ...unit.resources,
      ...(doc?.pages.filter(page => unit.pages.includes(page.page)).map(page => page.text) || []),
    ].join(' '));
    return terms.every(word => text.includes(word));
  });
}

export function getYearPlanStats(units: YearPlanUnit[]) {
  return {
    sequences: new Set(units.map(unit => unit.sequence)).size,
    resources: units.reduce((sum, unit) => sum + unit.resources.length, 0),
    hours: units.length && units.every(unit => unit.hours !== undefined)
      ? units.reduce((sum, unit) => sum + unit.hours!, 0) : null,
  };
}

/** روابط صريحة للمقاطع المطابقة فقط؛ لا تخمين للعلاقة من تشابه الكلمات. */
export function getYearPlanMemos(unit: YearPlanUnit, level: YearLevel, lessons: LessonMemo[]) {
  return unit.memoSequence ? lessons.filter(lesson => lesson.level === level && lesson.maqta === unit.memoSequence) : [];
}
