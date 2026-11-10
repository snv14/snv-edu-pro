import type { KnowledgeLevel, KnowledgeSourceKind, TeacherKnowledgeDoc } from '../types/knowledge';
import { invalidateKnowledgeCache } from './knowledgeBase';

/**
 * مكتبة وثائق الأستاذ المفهرسة في قاعدة معرفة المساعد.
 * تُحفظ محلياً (localStorage) وتُدمج في الفهرس مع المصادر الرسمية.
 */

const STORAGE_KEY = 'assistant_knowledge_docs_v1';
const SETTINGS_KEY = 'assistant_knowledge_settings_v1';

export const MAX_DOC_CHARS = 400_000;
export const MAX_DOCS = 40;

export interface KnowledgeSettings {
  /** تضمين وثائق الأستاذ المرفوعة في البحث. */
  includeTeacherDocs: boolean;
  /** تضمين النص الخام (OCR) لمذكرات 1AM. */
  includeOcrSupplement: boolean;
  /** تضمين التوجيهات المنهجية (المنهاج، الوثيقة المرافقة، دليل الأستاذ). */
  includeCorpus: boolean;
  /** تضمين التدرج والتوزيع السنوي. */
  includeProgression: boolean;
  /** عدد المقاطع المسترجعة لكل سؤال. */
  topK: number;
  /** الاعتماد على الاستخراج المباشر من القاعدة دون انتظار مزود الذكاء الاصطناعي. */
  localFirst: boolean;
}

export const DEFAULT_KNOWLEDGE_SETTINGS: KnowledgeSettings = {
  includeTeacherDocs: true,
  includeOcrSupplement: false,
  includeCorpus: true,
  includeProgression: true,
  topK: 12,
  localFirst: false,
};

const hasStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

const readJson = <T,>(key: string, fallback: T): T => {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): boolean => {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const sanitizeDoc = (doc: Partial<TeacherKnowledgeDoc>): TeacherKnowledgeDoc | null => {
  const text = String(doc.text || '').slice(0, MAX_DOC_CHARS);
  const title = String(doc.title || '').trim().slice(0, 160);
  if (!text.trim() || !title) return null;
  return {
    id: String(doc.id || `kb-doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    kind: (doc.kind || 'teacherDocument') as KnowledgeSourceKind,
    title,
    level: (doc.level || 'all') as KnowledgeLevel,
    text,
    authority: doc.authority ? String(doc.authority).slice(0, 160) : undefined,
    url: doc.url && /^https?:\/\//i.test(String(doc.url)) ? String(doc.url).slice(0, 500) : undefined,
    createdAt: doc.createdAt || new Date().toISOString(),
    source: doc.source === 'ocr' ? 'ocr' : 'teacher',
  };
};

export function loadKnowledgeDocs(): TeacherKnowledgeDoc[] {
  const stored = readJson<unknown>(STORAGE_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .map(item => sanitizeDoc(item as Partial<TeacherKnowledgeDoc>))
    .filter((item): item is TeacherKnowledgeDoc => Boolean(item))
    .slice(0, MAX_DOCS);
}

export function saveKnowledgeDoc(input: Partial<TeacherKnowledgeDoc>): TeacherKnowledgeDoc | null {
  const doc = sanitizeDoc(input);
  if (!doc) return null;
  const docs = loadKnowledgeDocs().filter(item => item.id !== doc.id);
  const next = [doc, ...docs].slice(0, MAX_DOCS);
  if (!writeJson(STORAGE_KEY, next)) return null;
  invalidateKnowledgeCache();
  return doc;
}

export function deleteKnowledgeDoc(id: string): boolean {
  const docs = loadKnowledgeDocs();
  const next = docs.filter(item => item.id !== id);
  if (next.length === docs.length) return false;
  const ok = writeJson(STORAGE_KEY, next);
  if (ok) invalidateKnowledgeCache();
  return ok;
}

export function clearKnowledgeDocs(): void {
  if (!hasStorage()) return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* التخزين اختياري */ }
  invalidateKnowledgeCache();
}

export function loadKnowledgeSettings(): KnowledgeSettings {
  return { ...DEFAULT_KNOWLEDGE_SETTINGS, ...readJson<Partial<KnowledgeSettings>>(SETTINGS_KEY, {}) };
}

export function saveKnowledgeSettings(settings: Partial<KnowledgeSettings>): KnowledgeSettings {
  const next = { ...loadKnowledgeSettings(), ...settings };
  writeJson(SETTINGS_KEY, next);
  invalidateKnowledgeCache();
  return next;
}
