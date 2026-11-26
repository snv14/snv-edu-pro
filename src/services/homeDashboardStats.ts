import type { LessonMemo } from "../types";
/** Display-only aggregates of the same curriculum passed to the home page. No invented usage statistics. */
export function homeDashboardStats(lessons: LessonMemo[]) {
  const units = new Set<string>(),
    resources = new Set<string>();
  const domains = new Map<string, number>();
  let activities = 0;
  for (const lesson of lessons) {
    if (lesson.maqta)
      units.add(`${lesson.level}|${lesson.midan}|${lesson.maqta}`);
    if (lesson.mawrid)
      resources.add(
        `${lesson.level}|${lesson.midan}|${lesson.maqta}|${lesson.mawrid}`,
      );
    activities += lesson.anshita?.length || 0;
    const domain = lesson.midan?.trim() || "غير مصنف";
    domains.set(domain, (domains.get(domain) || 0) + 1);
  }
  return {
    memos: lessons.length,
    units: units.size,
    resources: resources.size,
    activities,
    domains: [...domains].map(([name, count]) => ({
      name,
      count,
      percent: lessons.length ? Math.round((count * 100) / lessons.length) : 0,
    })),
  };
}
