import type { SmartAiMessage } from './smartAi';

const MAX_STORED_MESSAGES = 40;
export const MAX_CONTEXT_MESSAGES = 12;

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
    const trimmed = messages
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
      .slice(-MAX_STORED_MESSAGES);
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
  return messages
    .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string' && item.text.trim())
    .slice(-MAX_CONTEXT_MESSAGES);
}
