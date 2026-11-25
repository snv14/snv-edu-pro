import type { Activity, DB_Table, LessonMemo } from '../types';
import { getOfficialSourcesManifest } from './knowledgeOfficialSources';
import { getOfficialPedagogicalSources } from './officialPedagogicalSources';

export type SourceContentLevel = '2am' | '3am' | '4am';
export type SourceContentKind = 'memos' | 'activities' | 'tables' | 'diagrams' | 'evaluations';
export interface SourceContentRecord {
  id: string;
  kind: SourceContentKind;
  title: string;
  lesson: LessonMemo;
  activity?: Activity;
  table?: DB_Table;
  diagram?: { title?: string; svg?: string; imageUrl?: string; description?: string };
}

export const SOURCE_CONTENT_LEVEL_LABELS: Record<SourceContentLevel, string> = {
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
};

export function normalizeSourceQuery(value: string): string {
  return value.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** فهرس مشتق من قاعدة المذكرات الحالية، وليس تفريغاً حرفياً لملف PDF. */
export function buildSourceContent(level: SourceContentLevel, lessons: LessonMemo[]): SourceContentRecord[] {
  return lessons.filter(lesson => lesson.level === level).flatMap((lesson, index) => {
    const prefix = `${level}-${lesson.sourceLearningUnitId || lesson.memoNumber || index}-${index}`;
    const records: SourceContentRecord[] = [{ id: `${prefix}-memo`, kind: 'memos', title: lesson.ta3alom, lesson }];
    const addTable = (table: DB_Table, section: string, n: number, activity?: Activity) => {
      records.push({ id: `${prefix}-${section}-table-${n}`, kind: 'tables', title: table.table_title || activity?.title || lesson.ta3alom, lesson, activity, table });
    };
    for (const [section, tables] of [
      ['wadiya', lesson.wadiyaTables], ['irsae', lesson.irsaeTables], ['taqwim', lesson.taqwimTables],
    ] as const) tables?.forEach((table, n) => addTable(table, section, n));

    const seenDiagrams = new Set<string>();
    const addDiagram = (raw: unknown, context: string, n: number, activity?: Activity) => {
      if (!raw || typeof raw !== 'object') return;
      const d = raw as Record<string, unknown>;
      const svg = typeof d.svg === 'string' ? d.svg : typeof d.diagram_svg === 'string' ? d.diagram_svg : undefined;
      const imageUrl = typeof d.imageUrl === 'string' ? d.imageUrl : undefined;
      if (!svg && !imageUrl) return;
      const key = svg || imageUrl!;
      if (seenDiagrams.has(key)) return;
      seenDiagrams.add(key);
      const title = String(d.title || d.diagram_title || activity?.title || lesson.ta3alom);
      records.push({ id: `${prefix}-${context}-diagram-${n}`, kind: 'diagrams', title, lesson, activity,
        diagram: { title, svg, imageUrl, description: typeof d.description === 'string' ? d.description : undefined } });
    };
    lesson.anshita.forEach((activity, n) => {
      records.push({ id: `${prefix}-activity-${n}`, kind: 'activities', title: activity.title, lesson, activity });
      activity.tables?.forEach((table, t) => addTable(table, `activity-${n}`, t, activity));
      activity.diagrams?.forEach((diagram, d) => addDiagram(diagram, `activity-${n}`, d, activity));
    });
    lesson.diagrams?.forEach((diagram, n) => addDiagram(diagram, 'lesson', n));
    if (lesson.diagramSvg) addDiagram({ title: lesson.diagramTitle, svg: lesson.diagramSvg, description: lesson.diagramDescription }, 'legacy', 0);
    if (typeof lesson.diagram === 'string') addDiagram({ svg: lesson.diagram }, 'legacy', 1);
    else addDiagram(lesson.diagram, 'legacy', 1);
    if (lesson.taqwim?.trim() || lesson.taqwimTables?.length) {
      records.push({ id: `${prefix}-evaluation`, kind: 'evaluations', title: `تقويم — ${lesson.ta3alom}`, lesson });
    }
    return records;
  });
}

export function filterSourceContent(records: SourceContentRecord[], kind: SourceContentKind, query = '', sequence = '') {
  const terms = normalizeSourceQuery(query).split(' ').filter(Boolean);
  return records.filter(record => {
    if (record.kind !== kind || (sequence && record.lesson.maqta !== sequence)) return false;
    // البحث في محتوى السجل نفسه وفي مساره، لا في أنشطة شقيقة غير معروضة.
    const { lesson, activity, table, diagram } = record;
    const text = normalizeSourceQuery([
      lesson.memoNumber, lesson.midan, lesson.maqta, lesson.mawrid, lesson.ta3alom, record.title,
      kind === 'memos' ? JSON.stringify(lesson) : '',
      kind === 'evaluations' ? `${lesson.taqwim || ''} ${JSON.stringify(lesson.taqwimTables || [])}` : '',
      activity ? `${activity.asila} ${activity.ajwiba}` : '',
      table ? JSON.stringify(table) : '', diagram?.description, diagram?.svg,
    ].filter(Boolean).join(' '));
    return terms.every(term => text.includes(term));
  });
}

/** النصوص المتاحة حرفياً فقط؛ ملفات PDF الإضافية لا تُقدَّم على أنها مفرغة. */
export function getSourceContentDocuments(level: SourceContentLevel) {
  return getOfficialSourcesManifest().filter(entry => entry.level === level);
}

export function buildSourceContentExport(level: SourceContentLevel, lessons: LessonMemo[]) {
  return {
    format: 'snv-source-content', version: 1, level,
    provenance: 'محتوى منظم مشتق من قاعدة المذكرات، وليس نصاً حرفياً من PDF',
    lessons: lessons.filter(lesson => lesson.level === level),
    officialDocumentManifest: getSourceContentDocuments(level),
    sourceLinks: getSourceContentLinks(level),
  };
}

export function getSourceContentLinks(level: SourceContentLevel) {
  const ids: Record<SourceContentLevel, string[]> = {
    '2am': ['men-2am-teacher-plans-guide'],
    '3am': ['men-3am-teacher-guide', 'men-3am-learning-plan-2021-2022'],
    '4am': ['men-4am-teacher-plans-guide', 'men-4am-snv-book-adaptation'],
  };
  const links = getSourceContentDocuments(level).map(entry => ({ title: entry.title, url: entry.url }));
  const seen = new Set(links.map(link => link.url));
  for (const source of getOfficialPedagogicalSources()) {
    if (ids[level].includes(source.id) && !seen.has(source.url)) {
      links.push({ title: source.title, url: source.url });
      seen.add(source.url);
    }
  }
  return links;
}
