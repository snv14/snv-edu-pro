import type { KnowledgeReference } from './knowledgeBase';
import type { EvidenceItem, EvidenceOrigin } from './assistantTypes';

/**
 * Evidence Set: كل معلومة تُعرض تُحوَّل إلى دليل له أصل وسلطة ودرجة صلة،
 * ثم تُرتَّب الأدلة قبل بناء الإجابة. لا تُنسب معلومة إلى مصدر أقوى مما هي منه.
 */

const ORIGIN_BY_KIND = (reference: KnowledgeReference): EvidenceOrigin => {
  if (reference.status === 'teacher' || reference.kind === 'teacherDocument') return 'teacher';
  return 'official';
};

const CONFIDENCE_LABEL: Record<EvidenceOrigin, string> = {
  official: 'موثق رسميًا',
  teacher: 'موثق من ملف الأستاذ',
  web: 'مصدر خارجي',
  generated: 'اقتراح مولّد',
};

const AUTHORITY: Record<EvidenceOrigin, number> = {
  official: 100,
  teacher: 60,
  web: 30,
  generated: 10,
};

export const evidenceFromReferences = (references: KnowledgeReference[]): EvidenceItem[] =>
  references.map((reference, index) => {
    const origin = ORIGIN_BY_KIND(reference);
    return {
      id: `evidence-${reference.id || index}`,
      origin,
      title: reference.title,
      section: reference.section,
      page: reference.page,
      snippet: reference.snippet,
      url: reference.url,
      relevance: Number(reference.score || 0),
      authority: AUTHORITY[origin],
      confidenceLabel: CONFIDENCE_LABEL[origin],
      referenceId: reference.id,
    };
  });

export const evidenceFromWeb = (sources: Array<{ title: string; uri: string }>): EvidenceItem[] =>
  sources.map((source, index) => ({
    id: `evidence-web-${index}`,
    origin: 'web',
    title: source.title || source.uri,
    section: 'مصدر خارجي',
    snippet: source.uri,
    url: source.uri,
    relevance: 1,
    authority: AUTHORITY.web,
    confidenceLabel: CONFIDENCE_LABEL.web,
  }));

/** ترتيب المصادر: السلطة أولًا ثم الصلة، مع الحفاظ على ترتيب المصادر الرسمية المسترجع. */
export function sortReferencesByAuthority(references: KnowledgeReference[]): KnowledgeReference[] {
  return references
    .map((reference, index) => {
      const origin = ORIGIN_BY_KIND(reference);
      return { reference, index, authority: AUTHORITY[origin], relevance: Number(reference.score || 0) };
    })
    .sort((a, b) => b.authority - a.authority || b.relevance - a.relevance || a.index - b.index)
    .map(item => item.reference);
}

export const evidenceSummary = (evidence: EvidenceItem[]): string => {
  const official = evidence.filter(item => item.origin === 'official').length;
  const teacher = evidence.filter(item => item.origin === 'teacher').length;
  const web = evidence.filter(item => item.origin === 'web').length;
  return [
    official ? `${official} مصدر رسمي` : '',
    teacher ? `${teacher} وثيقة أستاذ` : '',
    web ? `${web} مصدر خارجي` : '',
  ].filter(Boolean).join(' · ');
};
