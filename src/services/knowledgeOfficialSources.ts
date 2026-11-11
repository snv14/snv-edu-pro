import type {
  KnowledgeLevel,
  KnowledgeSourceKind,
  OfficialKnowledgeDoc,
} from '../types/knowledge';
import {
  OFFICIAL_SOURCES_MANIFEST,
  OFFICIAL_SOURCE_LOADERS,
  OFFICIAL_SOURCES_TOTAL_CHARS,
  OFFICIAL_SOURCES_TOTAL_PAGES,
} from '../data/official/index';
import type { OfficialSourceManifestEntry, OfficialSourcePages } from '../data/official/types';

/**
 * المصادر الرسمية الحرفية لقاعدة معرفة المساعد الذكي.
 *
 * هذه ليست ملخصات منهجية (تلك في knowledgeBaseCorpus.ts بحالة `reference`) بل
 * النص الرسمي كما ورد في ملفات الوزارة، مفرَّغاً صفحةً صفحة بواسطة
 * scripts/ingest_official_pdfs.py ومخزَّناً في src/data/official.
 *
 * النصوص كبيرة (~473 ألف حرف)، لذلك تُحمَّل كسولياً: البيان (MANIFEST) ثابت
 * ومتاح فوراً لعرضه في الواجهة، أما النص فيُجلب عند أول استعمال ويُخزَّن.
 * التحميل الكسول بـ dynamic import يعمل في المتصفح (Vite) وفي الخادم (tsx)
 * معاً، على عكس استيراد `?raw` الذي يقتصر على المتصفح.
 */

export const OFFICIAL_SOURCE_ID_PREFIX = 'kb-official-';

export const OFFICIAL_SOURCES_TOTAL = {
  documents: OFFICIAL_SOURCES_MANIFEST.length,
  pages: OFFICIAL_SOURCES_TOTAL_PAGES,
  chars: OFFICIAL_SOURCES_TOTAL_CHARS,
};

let cache: OfficialKnowledgeDoc[] | null = null;
let pending: Promise<OfficialKnowledgeDoc[]> | null = null;
const failed = new Set<string>();

/** بيان المصادر الرسمية: متاح فوراً وبلا تحميل، ويُستعمل في الواجهة والتقارير. */
export function getOfficialSourcesManifest(): OfficialSourceManifestEntry[] {
  return OFFICIAL_SOURCES_MANIFEST;
}

const documentIdOf = (entry: OfficialSourceManifestEntry): string =>
  `${OFFICIAL_SOURCE_ID_PREFIX}${entry.id}`;

const toOfficialDoc = (
  entry: OfficialSourceManifestEntry,
  pages: OfficialSourcePages,
): OfficialKnowledgeDoc | null => {
  const usable = pages.filter(page => String(page?.text || '').trim().length > 0);
  if (usable.length === 0) return null;
  return {
    id: documentIdOf(entry),
    kind: entry.kind as KnowledgeSourceKind,
    title: entry.title,
    level: entry.level as KnowledgeLevel,
    // النص الكامل يُبقي التوافق مع كل مسار يقرأ `text`، والصفحات تُبقي الاستشهاد دقيقاً.
    text: usable.map(page => page.text).join('\n\n'),
    pages: usable.map(page => ({ page: page.page, text: page.text })),
    authority: entry.authority,
    url: entry.url,
    createdAt: new Date(0).toISOString(),
    source: 'official',
    extraction: entry.extraction,
    quality: entry.quality,
  };
};

/**
 * جلب نصوص المصادر الرسمية مرة واحدة.
 *
 * @param ids معرّفات البيان المطلوب تحميلها؛ الافتراضي كلها.
 */
export async function loadOfficialSources(ids?: string[]): Promise<OfficialKnowledgeDoc[]> {
  if (cache && !ids) return cache;
  const wanted = new Set(ids || []);
  const entries = ids && ids.length
    ? OFFICIAL_SOURCES_MANIFEST.filter(entry => wanted.has(entry.id))
    : OFFICIAL_SOURCES_MANIFEST;

  const loaded = await Promise.all(
    entries.map(async entry => {
      const loader = OFFICIAL_SOURCE_LOADERS[entry.id];
      if (!loader || failed.has(entry.id)) return null;
      try {
        const module = await loader();
        const pages = (module?.pages || (module as unknown as OfficialSourcePages) || []) as OfficialSourcePages;
        return toOfficialDoc(entry, Array.isArray(pages) ? pages : []);
      } catch {
        // بيئة لا تدعم الاستيراد الديناميكي للوحدة، أو ملف مفقود:
        // تُستبعد الوثيقة بدل أن يفشل تحميل باقي المصادر.
        failed.add(entry.id);
        return null;
      }
    }),
  );

  const docs = loaded.filter((doc): doc is OfficialKnowledgeDoc => Boolean(doc));
  if (!ids) cache = docs;
  return docs;
}

/** تحميل مسبق دون انتظار؛ يُستدعى عند إقلاع الواجهة والخادم. */
export function preloadOfficialSources(): Promise<OfficialKnowledgeDoc[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = loadOfficialSources().finally(() => { pending = null; });
  }
  return pending;
}

/**
 * النسخة المحمَّلة مسبقاً، متزامنة.
 *
 * `prepareKnowledge` دالة متزامنة تُستدعى مع كل سؤال، فلا يمكنها انتظار التحميل؛
 * لذلك تعتمد هذه النسخة التي تكون فارغة في اللحظة الأولى ثم تمتلئ فور انتهاء
 * `preloadOfficialSources`. المسار غير المتزامن (الخادم) يستعمل `loadOfficialSources`.
 */
export function getCachedOfficialSources(): OfficialKnowledgeDoc[] {
  return cache || [];
}

/** هل وصلت النصوص الرسمية فعلاً؟ تُستعمل لتنبيه الواجهة أثناء التحميل. */
export function officialSourcesReady(): boolean {
  return Array.isArray(cache) && cache.length > 0;
}

/** تفريغ الذاكرة المخزنة (بعد تغيير الإعدادات أو في الاختبارات). */
export function resetOfficialSourcesCache(): void {
  cache = null;
  pending = null;
  failed.clear();
}
