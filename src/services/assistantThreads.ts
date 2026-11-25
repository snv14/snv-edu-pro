import type { SmartAiMessage } from './smartAi';

/**
 * سجل محادثات المساعد الذكي: عدة محادثات محفوظة محليًا بدل محادثة واحدة تُستبدل.
 * لا يُرسل السجل إلى أي مزوّد؛ يبقى على جهاز الأستاذ.
 */

const STORAGE_KEY = 'snv-edu-pro.assistant-threads.v1';
const MAX_THREADS = 30;
const MAX_MESSAGES = 40;

export interface AssistantThread {
  id: string;
  title: string;
  level: string;
  messages: SmartAiMessage[];
  createdAt: string;
  updatedAt: string;
}

const nowIso = () => new Date().toISOString();

export const createThread = (level = '', title = 'محادثة جديدة'): AssistantThread => ({
  id: `thread-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  title: title.slice(0, 60) || 'محادثة جديدة',
  level,
  messages: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

export const threadTitleFrom = (text: string): string => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'محادثة جديدة';
  return clean.length > 46 ? `${clean.slice(0, 46)}…` : clean;
};

const normalizeMessages = (value: unknown): SmartAiMessage[] =>
  Array.isArray(value)
    ? value
        .filter((item: any) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
        .map((item: any) => ({ role: item.role, text: item.text.slice(0, 8000) }))
        .slice(-MAX_MESSAGES)
    : [];

export function loadThreads(): AssistantThread[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((thread: any) => thread && typeof thread.id === 'string')
      .map((thread: any) => ({
        id: String(thread.id),
        title: String(thread.title || 'محادثة').slice(0, 60),
        level: String(thread.level || ''),
        messages: normalizeMessages(thread.messages),
        createdAt: String(thread.createdAt || nowIso()),
        updatedAt: String(thread.updatedAt || nowIso()),
      }))
      .slice(0, MAX_THREADS);
  } catch {
    return [];
  }
}

export function saveThreads(threads: AssistantThread[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const trimmed = threads
      .slice(0, MAX_THREADS)
      .map(thread => ({ ...thread, messages: thread.messages.slice(-MAX_MESSAGES) }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // التخزين المحلي اختياري.
  }
}
