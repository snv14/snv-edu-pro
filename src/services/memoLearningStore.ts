import localforage from 'localforage';

export type SuggestionDecision = 'accepted' | 'rejected' | 'edited';

export interface SuggestionLearningEvent {
  id: string;
  suggestionId: string;
  category: string;
  decision: SuggestionDecision;
  gradeLevel: string;
  topic: string;
  sourceType: string;
  createdAt: string;
  editedText?: string;
}

const STORE_KEY = 'snv-edu-pro.memo-suggestion-learning.v1';

async function readEvents(): Promise<SuggestionLearningEvent[]> {
  return (await localforage.getItem<SuggestionLearningEvent[]>(STORE_KEY)) || [];
}

export async function recordSuggestionDecision(event: Omit<SuggestionLearningEvent, 'id' | 'createdAt'>) {
  const events = await readEvents();
  const next: SuggestionLearningEvent = {
    ...event,
    id: `learn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await localforage.setItem(STORE_KEY, [...events.slice(-499), next]);
  return next;
}

export async function getSuggestionLearningSummary() {
  const events = await readEvents();
  const summary: Record<string, { accepted: number; rejected: number; edited: number }> = {};
  for (const event of events) {
    const key = `${event.gradeLevel}|${event.category}`;
    summary[key] ||= { accepted: 0, rejected: 0, edited: 0 };
    summary[key][event.decision] += 1;
  }
  return { total: events.length, summary };
}
