import type { SmartAiMessage } from './smartAi';
import { isConversationFollowUp } from './assistantConversationPolicy';

const MAX_STORED_MESSAGES = 80;
export const MAX_CONTEXT_MESSAGES = 20;

export interface StoredConversation {
  messages: SmartAiMessage[];
  updatedAt: string;
}

const storageKey = (level?: string) => `assistant_conversation_v2_${level || 'all'}`;

const safeParse = (raw: string | null): StoredConversation | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    const messages = parsed.messages
      .filter((item: any) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
      .slice(-MAX_STORED_MESSAGES);
    return { messages, updatedAt: String(parsed.updatedAt || '') };
  } catch {
    return null;
  }
};

export function loadConversation(level?: string): StoredConversation | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return safeParse(window.localStorage.getItem(storageKey(level)));
  } catch {
    return null;
  }
}

export function saveConversation(messages: SmartAiMessage[], level?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const valid = messages.filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string');
    const anchor = [...valid].reverse().find(item => item.role === 'user' && !isConversationFollowUp(item.text));
    const tail = valid.slice(-MAX_STORED_MESSAGES);
    const trimmed = anchor && !tail.includes(anchor) ? [anchor, ...tail.slice(-(MAX_STORED_MESSAGES - 1))] : tail;
    window.localStorage.setItem(storageKey(level), JSON.stringify({ messages: trimmed, updatedAt: new Date().toISOString() }));
  } catch {
    // التخزين المحلي اختياري؛ فشله لا يمنع استعمال المحادثة.
  }
}

export function clearConversation(level?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(storageKey(level));
  } catch {
    // تجاهل
  }
}

/** آخر الرسائل فقط تُرسل كسياق حتى لا يتضخم الطلب ولا تتجاوز حدود الخادم. */
export function conversationContext(messages: SmartAiMessage[]): SmartAiMessage[] {
  const valid = messages.filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string' && item.text.trim());
  const recent = valid.slice(-MAX_CONTEXT_MESSAGES);
  const anchor = [...valid].reverse().find(item => item.role === 'user' && !isConversationFollowUp(item.text));
  const kept = anchor && !recent.includes(anchor) ? [anchor, ...recent.slice(-(MAX_CONTEXT_MESSAGES - 1))] : recent;
  // Preserve the working draft at the end, bounded independently from an old topic anchor.
  let budget = 48000;
  const bounded: SmartAiMessage[] = [];
  for (const item of [...kept].reverse()) {
    const text = item.text.slice(0, Math.min(budget, item.role === 'assistant' ? 12000 : 3000));
    if (text.trim()) bounded.unshift({ role: item.role, text });
    budget -= text.length;
    if (budget <= 0) break;
  }
  // An old topic anchor is tiny relative to the working draft and must not disappear at the budget boundary.
  if (anchor && !bounded.some(item => item.role === 'user' && item.text === anchor.text.slice(0, 3000))) {
    if (bounded.length >= MAX_CONTEXT_MESSAGES) bounded.shift();
    bounded.unshift({ role: 'user', text: anchor.text.slice(0, 2000) });
  }
  return bounded.slice(-MAX_CONTEXT_MESSAGES);

}

/** One conversation across years; old per-year conversations remain intact and migrate once. */
export function loadUnifiedConversation(legacyLevel?: string): StoredConversation | null {
  const existing = loadConversation();
  if (existing) return existing;
  if (typeof window === 'undefined') return null;
  try {
    if (window.localStorage.getItem('assistant_conversation_unified_migrated')) return null;
    window.localStorage.setItem('assistant_conversation_unified_migrated', '1');
    const legacy = legacyLevel ? loadConversation(legacyLevel) : null;
    if (legacy) saveConversation(legacy.messages);
    return legacy;
  } catch { return null; }
}
