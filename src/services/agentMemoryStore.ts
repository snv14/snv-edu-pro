import localforage from 'localforage';
import { normalizeArabic, tokenize } from './knowledgeBase';

/**
 * ذاكرة وكيل المستندات: كل ملف يعتمده الأستاذ يُحفظ مع بنيته وكلماته المفتاحية،
 * فيستدعيه الوكيل في الملفات المشابهة ويعرض ما تعلّمه سابقًا.
 * التخزين محلي على جهاز الأستاذ (localforage) ولا يُرسل لأي مزوّد.
 */

export interface AgentMemoryRecord {
  id: string;
  title: string;
  fileName: string;
  format: string;
  level: string;
  examType: string;
  exerciseCount: number;
  points: number | null;
  keywords: string[];
  summary: string;
  text: string;
  createdAt: string;
  uses: number;
}

export interface AgentMemoryHint {
  id: string;
  title: string;
  level: string;
  examType: string;
  points: number | null;
  keywords: string[];
}

const STORE_KEY = 'snv-edu-pro.document-agent-memory.v1';
const MAX_RECORDS = 40;
const MAX_TEXT = 12_000;

const readAll = async (): Promise<AgentMemoryRecord[]> => {
  const stored = await localforage.getItem<AgentMemoryRecord[]>(STORE_KEY);
  return Array.isArray(stored) ? stored : [];
};

export async function loadAgentMemory(): Promise<AgentMemoryRecord[]> {
  return (await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function rememberAgentDocument(input: {
  title: string;
  fileName: string;
  format: string;
  level: string;
  examType: string;
  exerciseCount: number;
  points: number | null;
  keywords: string[];
  summary: string;
  text: string;
}): Promise<AgentMemoryRecord> {
  const records = await readAll();
  const record: AgentMemoryRecord = {
    id: `agent-mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim().slice(0, 160) || 'مستند بلا عنوان',
    fileName: input.fileName.slice(0, 200),
    format: input.format,
    level: input.level,
    examType: input.examType,
    exerciseCount: input.exerciseCount,
    points: input.points,
    keywords: Array.from(new Set(input.keywords)).slice(0, 30),
    summary: input.summary.slice(0, 600),
    text: input.text.slice(0, MAX_TEXT),
    createdAt: new Date().toISOString(),
    uses: 0,
  };
  await localforage.setItem(STORE_KEY, [record, ...records].slice(0, MAX_RECORDS));
  return record;
}

export async function forgetAgentDocument(id: string): Promise<void> {
  const records = await readAll();
  await localforage.setItem(STORE_KEY, records.filter(record => record.id !== id));
}

export async function clearAgentMemory(): Promise<void> {
  await localforage.setItem(STORE_KEY, []);
}

export function agentMemoryHints(records: AgentMemoryRecord[]): AgentMemoryHint[] {
  return records.slice(0, 30).map(record => ({
    id: record.id,
    title: record.title,
    level: record.level,
    examType: record.examType,
    points: record.points,
    keywords: record.keywords,
  }));
}

/** بحث في ما تعلّمه الوكيل: الكلمات المشتركة مع عنوان/كلمات/نص المستند المحفوظ. */
export function searchAgentMemory(query: string, records: AgentMemoryRecord[]): AgentMemoryRecord[] {
  const tokens = new Set(tokenize(query));
  if (!tokens.size) return records;
  return records
    .map(record => {
      const haystack = normalizeArabic(`${record.title} ${record.keywords.join(' ')} ${record.text.slice(0, 4000)}`);
      let score = 0;
      tokens.forEach(token => {
        if (haystack.includes(token)) score += 1;
      });
      return { record, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.record);
}
