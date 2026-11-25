import type { KnowledgeExtraction } from '../types/knowledge';
import { buildLocalKnowledgeAnswer } from './knowledgeBase';
import { assistantVisibility, presentAssistantAnswer } from './assistantConversationPolicy';

/** Non-generative fallback: real retrieved content, never pretend to have edited a draft. */
export function buildDirectAssistantAnswer(extraction: KnowledgeExtraction, question: string): string {
  if (assistantVisibility(question).sources) return presentAssistantAnswer(buildLocalKnowledgeAnswer(extraction, { maxPerFacet: 2 }), question);
  const sections: string[] = [];
  const seen = new Set<string>();
  for (const group of extraction.facets) {
    const candidates = group.candidates.filter(candidate => !seen.has(candidate.text)).slice(0, 2);
    if (!candidates.length) continue;
    sections.push(`### ${group.label}`);
    for (const candidate of candidates) {
      seen.add(candidate.text);
      sections.push(candidate.text.slice(0, 1800));
    }
  }
  if (!sections.length) return 'لم أجد معلومات كافية للإجابة بدقة. يمكنك توضيح الفكرة أو إرفاق المحتوى الذي تريد العمل عليه.';
  return presentAssistantAnswer(sections.join('\n\n'), question);
}
