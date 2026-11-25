import localforage from 'localforage';

/**
 * عقود المزودين: يمكن تغيير القارئ أو التخزين أو مزود AI دون إعادة بناء المساعد.
 * لا يُخزَّن أي مفتاح في الواجهة؛ استدعاء AI يمر عبر بوابة الخادم.
 */

export interface AIProvider {
  id: string;
  label: string;
  available: boolean;
  generate(request: { prompt: string; question?: string; useWeb?: boolean }): Promise<{ text: string; provider: string }>;
}

export interface SearchProvider<TResult = unknown> {
  id: string;
  label: string;
  search(query: string, options?: { topK?: number; level?: string }): Promise<TResult[]>;
}

export interface EmbeddingProvider {
  id: string;
  label: string;
  available: boolean;
  embed(texts: string[]): Promise<number[][]>;
}

export interface DocumentRead {
  text: string;
  pages?: number;
  needsVision?: boolean;
  note?: string;
}

export interface DocumentProvider {
  id: string;
  label: string;
  read(file: File): Promise<DocumentRead>;
}

export interface StorageProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

const MAX_TEXT = 120_000;

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
  reader.readAsDataURL(file);
});

/** قارئ الوثائق المحلي على الخادم (PDF/Word/نص) — بلا مزود خارجي. */
export const localDocumentProvider: DocumentProvider = {
  id: 'server-local-reader',
  label: 'قارئ الوثائق المحلي',
  async read(file) {
    if (/\.(txt|md|csv)$/i.test(file.name) || /^text\//.test(file.type)) {
      return { text: (await file.text()).slice(0, MAX_TEXT) };
    }
    const dataUrl = await fileToDataUrl(file);
    const response = await fetch('/api/document/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, mimeType: file.type, dataUrl }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'تعذر قراءة الملف.');
    return {
      text: String(payload?.text || '').slice(0, MAX_TEXT),
      pages: Number(payload?.pages) || undefined,
      needsVision: Boolean(payload?.needsVision),
      note: Array.isArray(payload?.notes) ? payload.notes.join(' · ') : '',
    };
  },
};

const storage = localforage.createInstance({ name: 'snv-edu-pro', storeName: 'assistant_spaces' });

/** تخزين محلي على جهاز الأستاذ (IndexedDB) عبر واجهة قابلة للتبديل. */
export const indexedDbStorage: StorageProvider = {
  get: <T>(key: string) => storage.getItem<T>(key),
  set: async (key, value) => { await storage.setItem(key, value); },
  remove: async key => { await storage.removeItem(key); },
};

/** مزود AI عبر بوابة الخادم؛ لا يعرف الواجهة أي مفتاح. */
export const gatewayAIProvider: AIProvider = {
  id: 'server-gateway',
  label: 'AI Gateway',
  available: true,
  async generate({ prompt, question, useWeb }) {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, question, useWeb: Boolean(useWeb) }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'تعذر توليد الرد.');
    return { text: String(payload?.text || ''), provider: String(payload?.provider || 'gateway') };
  },
};

/**
 * لا يوجد مزود Embeddings مهيأ في هذه النسخة؛ البحث الحالي هجين لغوي.
 * عند إضافة مزود متجهات لاحقًا يكفي تنفيذ هذا العقد وتبديله هنا.
 */
export const unconfiguredEmbeddingProvider: EmbeddingProvider = {
  id: 'none',
  label: 'بدون مزود متجهات',
  available: false,
  async embed() {
    return [];
  },
};
