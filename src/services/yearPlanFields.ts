import { YEAR_PLAN_FIELD_LOCATORS, type PlanFieldKey } from '../data/yearPlanFields';
import type { YearPlanUnit } from '../data/yearPlanOutlines';
import type { OfficialKnowledgeDoc } from '../types/knowledge';

export const PLAN_FIELD_LABELS: Record<PlanFieldKey, string> = {
  resources: 'هيكلة الموارد المعرفية المستهدفة بالبناء والإرساء والإدماج',
  duration: 'تقدير الحجم الزمني',
  execution: 'آلية التنفيذ',
  assessment: 'معايير ومؤشرات التقويم',
  notes: 'ملاحظات',
};
export const PLAN_FIELD_ORDER: PlanFieldKey[] = ['resources', 'duration', 'execution', 'assessment', 'notes'];
export interface PlanFieldExcerpt { page: number; text: string; }
export interface PlanFieldContent {
  key: PlanFieldKey;
  label: string;
  excerpts: PlanFieldExcerpt[];
  status: 'ready' | 'unindexed' | 'source-unavailable' | 'source-changed';
}

/** FNV-1a over UTF-16, identical in the browser and source-verification tests. */
export function planSourcePageHash(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return hash;
}

/** Resolve reviewed excerpts only. Never infer table columns from flattened text order. */
export function getYearPlanFields(planId: string, unit: YearPlanUnit, doc: OfficialKnowledgeDoc | null): PlanFieldContent[] {
  const selections = YEAR_PLAN_FIELD_LOCATORS[planId]?.[unit.id];
  const matchesSource = doc?.id === `kb-official-${planId}`;
  return PLAN_FIELD_ORDER.map(key => {
    const references = selections?.[key];
    if (!references?.length) return { key, label: PLAN_FIELD_LABELS[key], excerpts: [], status: 'unindexed' };
    if (!matchesSource) return { key, label: PLAN_FIELD_LABELS[key], excerpts: [], status: 'source-unavailable' };
    const excerpts: PlanFieldExcerpt[] = [];
    for (const [pageNumber, from, to, expectedHash] of references) {
      const page = doc.pages.find(page => page.page === pageNumber);
      // Also require a reference within this unit: no bleed between units, years, or editions.
      if (!page || !unit.pages.includes(pageNumber) || planSourcePageHash(page.text) !== expectedHash) {
        return { key, label: PLAN_FIELD_LABELS[key], excerpts: [], status: 'source-changed' };
      }
      const lines = page.text.split('\n');
      if (from < 0 || to < from || to >= lines.length) return { key, label: PLAN_FIELD_LABELS[key], excerpts: [], status: 'source-changed' };
      const text = lines.slice(from, to + 1).join('\n').trim();
      if (!text) return { key, label: PLAN_FIELD_LABELS[key], excerpts: [], status: 'source-changed' };
      excerpts.push({ page: pageNumber, text });
    }
    return { key, label: PLAN_FIELD_LABELS[key], excerpts, status: 'ready' };
  });
}
