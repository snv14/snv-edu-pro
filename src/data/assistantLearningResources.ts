import { OFFICIAL_1AM_GUIDE_SEQUENCES } from './teacherGuide1amResources';
import { OFFICIAL_2AM_SEQUENCES } from './teacherGuide2am';
import { GUIDE_3AM_SEQUENCES, OFFICIAL_SOLUTIONS_3AM, PEDAGOGICAL_CONCEPTS_3AM } from './teacherGuide3am';
import { getYearPlanOutline } from './yearPlanOutlines';
import type { TeacherKnowledgeDoc } from '../types/knowledge';

/** Derived platform summaries, not verbatim ministry documents; no private student/grade store is read. */
export function assistantLearningResources(): TeacherKnowledgeDoc[] {
  const docs: TeacherKnowledgeDoc[] = [];
  const createdAt = new Date(0).toISOString();
  const add = (doc: Omit<TeacherKnowledgeDoc, 'createdAt' | 'source'>) => docs.push({ ...doc, createdAt, source: 'teacher' });
  for (const [level, sequences] of [
    ['1am', OFFICIAL_1AM_GUIDE_SEQUENCES], ['2am', OFFICIAL_2AM_SEQUENCES], ['3am', GUIDE_3AM_SEQUENCES],
  ] as const) {
    for (const sequence of sequences) add({
      id: `platform-guide-${level}-${sequence.id}`, kind: 'teacherGuide', level,
      title: `قراءة منظمة: ${sequence.title}`,
      text: [sequence.title, sequence.targetCompetency, ...sequence.resources.flatMap(resource => [resource.title, ...resource.coreConcepts, resource.pedagogicalGuidance])].join('\n\n'),
    });
  }
  OFFICIAL_SOLUTIONS_3AM.forEach((item, index) => add({
    id: `platform-solution-3am-${index}`, kind: 'teacherGuide', level: '3am',
    title: `${item.unitTitle} — ${item.exerciseTitle}`,
    text: `تمرين: ${item.question}\n\nالتصحيح والجواب المرتقب: ${item.solution}`,
  }));
  PEDAGOGICAL_CONCEPTS_3AM.forEach((item, index) => add({
    id: `platform-pedagogy-3am-${index}`, kind: 'teacherGuide', level: '3am', title: item.term,
    text: [item.term, item.french, item.definition, item.classroomApplication].join('\n\n'),
  }));
  for (const level of ['1am', '2am', '3am', '4am'] as const) {
    for (const unit of getYearPlanOutline(level, `annualPlan2023_${level}`)) add({
      id: `platform-plan-${level}-${unit.id}`, kind: 'progression', level, title: unit.title,
      text: [`الفصل ${unit.term}: ${unit.title}`, `الحجم الزمني لبناء الموارد: ${unit.hours} ساعة، ${unit.weeksLabel || ''} دون الإدماج والاختبارات.`, ...unit.resources].join('\n\n'),
    });
  }
  return docs;
}
