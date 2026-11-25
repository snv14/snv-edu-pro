import { normalizeArabic, tokenize } from './knowledgeBase';
import { indexedDbStorage, localDocumentProvider } from './assistantProviders';

/**
 * مساحات المعرفة: وثائق الأستاذ الخاصة مقسّمة إلى مقاطع مع أرقام الصفحات،
 * محفوظة على جهازه فقط (IndexedDB) ولا تُرسل إلى أي مزوّد إلا مع سؤاله.
 */

export type SpaceSourceKind = 'pdf' | 'docx' | 'text' | 'image' | 'link' | 'other';

export interface SpaceChunk {
  id: string;
  page?: number;
  text: string;
}

export interface SpaceSource {
  id: string;
  name: string;
  kind: SpaceSourceKind;
  mimeType: string;
  size: number;
  pages?: number;
  text: string;
  chunks: SpaceChunk[];
  addedAt: string;
  status: 'ready' | 'needs-text' | 'error';
  note?: string;
}

export interface KnowledgeSpace {
  id: string;
  title: string;
  description: string;
  level: string;
  sources: SpaceSource[];
  createdAt: string;
  updatedAt: string;
}

export interface SpaceSearchHit {
  source: SpaceSource;
  chunk: SpaceChunk;
  score: number;
  snippet: string;
}

const STORAGE_KEY = 'snv-edu-pro.assistant-spaces.v1';
const MAX_SOURCES = 24;
const MAX_TEXT = 120_000;
const CHUNK_SIZE = 900;

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createKnowledgeSpace = (title = 'مساحة معرفة جديدة', level = '', description = ''): KnowledgeSpace => ({
  id: makeId('space'),
  title: title.slice(0, 80),
  description: description.slice(0, 240),
  level,
  sources: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

export async function loadSpaces(): Promise<KnowledgeSpace[]> {
  try {
    const stored = await indexedDbStorage.get<KnowledgeSpace[]>(STORAGE_KEY);
    return Array.isArray(stored) ? stored.filter(item => item && typeof item.id === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveSpaces(spaces: KnowledgeSpace[]): Promise<void> {
  try {
    await indexedDbStorage.set(STORAGE_KEY, spaces);
  } catch {
    // التخزين المحلي اختياري؛ تبقى المساحات في الذاكرة خلال الجلسة.
  }
}

/* ─────────────────────────── تقطيع الوثائق وصفحاتها ─────────────────────────── */

const PAGE_MARKER = /<PARSED TEXT FOR PAGE:\s*(\d+)\s*(?:\/\s*\d+)?>/gi;

/** تقسيم النص إلى صفحات: علامات صريحة، ثم فواصل النماذج، ثم تقدير متساوٍ. */
export function splitIntoPages(text: string, pages?: number): Array<{ page?: number; text: string }> {
  const clean = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!clean) return [];

  const marked: Array<{ page: number; text: string }> = [];
  let match: RegExpExecArray | null;
  PAGE_MARKER.lastIndex = 0;
  const positions: Array<{ index: number; page: number; length: number }> = [];
  while ((match = PAGE_MARKER.exec(clean))) positions.push({ index: match.index, page: Number(match[1]), length: match[0].length });
  if (positions.length >= 2) {
    positions.forEach((position, order) => {
      const start = position.index + position.length;
      const end = order + 1 < positions.length ? positions[order + 1].index : clean.length;
      const body = clean.slice(start, end).trim();
      if (body) marked.push({ page: position.page, text: body });
    });
    if (marked.length) return marked;
  }

  if (clean.includes('\f')) {
    const parts = clean.split('\f').map(part => part.trim()).filter(Boolean);
    if (parts.length > 1) return parts.map((part, index) => ({ page: index + 1, text: part }));
  }

  const count = Math.max(1, Math.min(400, Math.round(Number(pages) || 1)));
  if (count > 1 && clean.length > count * 120) {
    const size = Math.ceil(clean.length / count);
    return Array.from({ length: count }, (_, index) => ({
      page: index + 1,
      text: clean.slice(index * size, (index + 1) * size).trim(),
    })).filter(page => page.text);
  }

  return [{ page: 1, text: clean }];
}

const splitLongText = (text: string, size = CHUNK_SIZE): string[] => {
  if (text.length <= size) return [text];
  const paragraphs = text.split(/\n{2,}/).map(item => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buffer = '';
  for (const paragraph of paragraphs) {
    if (!buffer) {
      buffer = paragraph;
    } else if (buffer.length + paragraph.length + 2 <= size) {
      buffer += `\n\n${paragraph}`;
    } else {
      chunks.push(buffer);
      buffer = paragraph;
    }
    while (buffer.length > size * 1.4) {
      chunks.push(buffer.slice(0, size).trim());
      buffer = buffer.slice(size);
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks.length ? chunks : [text.slice(0, size)];
};

export function chunkSpaceText(text: string, pages?: number): SpaceChunk[] {
  const chunks: SpaceChunk[] = [];
  splitIntoPages(text, pages).forEach(page => {
    splitLongText(page.text).forEach((piece, index) => {
      chunks.push({
        id: makeId(`chunk${index}`),
        page: page.page,
        text: piece.slice(0, MAX_TEXT),
      });
    });
  });
  return chunks;
}

export function kindFromFile(name: string, mimeType = ''): SpaceSourceKind {
  const lower = name.toLowerCase();
  if (/\.pdf$/i.test(lower) || mimeType === 'application/pdf') return 'pdf';
  if (/\.docx?$/i.test(lower) || /wordprocessingml|msword/.test(mimeType)) return 'docx';
  if (/\.(txt|md|csv)$/i.test(lower) || /^text\//.test(mimeType)) return 'text';
  if (/^image\//.test(mimeType) || /\.(png|jpe?g|webp|gif)$/i.test(lower)) return 'image';
  return 'other';
}

/** قراءة ملف عبر مزود الوثائق المحلي (PDF/Word/نص) دون أي مزوّد خارجي. */
export async function readSourceFile(file: File): Promise<{ text: string; pages?: number; needsVision?: boolean; note?: string }> {
  return localDocumentProvider.read(file);
}

export async function sourceFromFile(file: File): Promise<SpaceSource> {
  const kind = kindFromFile(file.name, file.type);
  const base: SpaceSource = {
    id: makeId('source'),
    name: file.name,
    kind,
    mimeType: file.type,
    size: file.size,
    text: '',
    chunks: [],
    addedAt: nowIso(),
    status: 'ready',
  };
  try {
    const read = await readSourceFile(file);
    if (!read.text.trim()) {
      return {
        ...base,
        status: 'needs-text',
        note: read.needsVision
          ? 'الصورة تحتاج إدخال نصها يدويًا: القارئ المحلي لا يستعمل OCR خارجيًا.'
          : 'لم يُستخرج نص من الملف. جرّب نسخة نصية أو أدخل النص يدويًا.',
      };
    }
    return { ...base, text: read.text, pages: read.pages, chunks: chunkSpaceText(read.text, read.pages) };
  } catch (error) {
    return {
      ...base,
      status: 'error',
      note: error instanceof Error ? error.message : 'تعذرت قراءة الملف.',
    };
  }
}

export function linkSource(url: string, title = ''): SpaceSource {
  const cleanUrl = String(url || '').trim();
  const label = (title || cleanUrl).slice(0, 120);
  const text = `${label}\n${cleanUrl}`;
  return {
    id: makeId('link'),
    name: label,
    kind: 'link',
    mimeType: 'text/uri-list',
    size: text.length,
    text,
    chunks: [{ id: makeId('chunk'), page: undefined, text }],
    addedAt: nowIso(),
    status: 'ready',
    note: 'رابط محفوظ كمرجع؛ افتحه لقراءة محتواه.',
  };
}

export function appendSource(space: KnowledgeSpace, source: SpaceSource): KnowledgeSpace {
  const sources = [...space.sources.filter(item => item.id !== source.id), source].slice(-MAX_SOURCES);
  return { ...space, sources, updatedAt: nowIso() };
}

export function removeSource(space: KnowledgeSpace, sourceId: string): KnowledgeSpace {
  return { ...space, sources: space.sources.filter(item => item.id !== sourceId), updatedAt: nowIso() };
}

/* ─────────────────────────────── البحث داخل المساحة ─────────────────────────────── */

const snippetAround = (text: string, tokens: string[], size = 260): string => {
  const normalized = normalizeArabic(text);
  const first = tokens.map(token => normalized.indexOf(token)).filter(index => index >= 0).sort((a, b) => a - b)[0];
  if (first === undefined || first < 0) return text.slice(0, size);
  const start = Math.max(0, first - 70);
  return `${start > 0 ? '…' : ''}${text.slice(start, start + size).trim()}${start + size < text.length ? '…' : ''}`;
};

/** بحث هجين مبسّط (كلمات + عبارة) داخل مقاطع مساحة واحدة. */
export function searchSpace(space: KnowledgeSpace | null | undefined, query: string, topK = 6): SpaceSearchHit[] {
  if (!space || !space.sources.length) return [];
  const tokens = tokenize(query);
  const normalizedQuery = normalizeArabic(query);
  if (!tokens.length && !normalizedQuery) return [];

  const hits: SpaceSearchHit[] = [];
  for (const source of space.sources) {
    if (source.status !== 'ready') continue;
    for (const chunk of source.chunks) {
      const normalized = normalizeArabic(chunk.text);
      if (!normalized) continue;
      const matched = tokens.filter(token => normalized.includes(token));
      if (!matched.length && !(normalizedQuery.length > 3 && normalized.includes(normalizedQuery))) continue;
      const coverage = tokens.length ? matched.length / tokens.length : 0;
      const phraseBonus = normalizedQuery.length > 4 && normalized.includes(normalizedQuery) ? 0.6 : 0;
      const score = Number((coverage + phraseBonus).toFixed(3));
      hits.push({ source, chunk, score, snippet: snippetAround(chunk.text, matched) });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(20, topK)));
}

export const spaceSizeLabel = (space: KnowledgeSpace): string => {
  const ready = space.sources.filter(source => source.status === 'ready').length;
  const chunks = space.sources.reduce((sum, source) => sum + source.chunks.length, 0);
  return `${ready} مصدر · ${chunks} مقطع`;
};
