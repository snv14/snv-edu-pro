/**
 * القاعدة الموحدة للمنصة — عائلات المصادر الأربع بالترتيب المرجعي.
 *
 * الترتيب ليس تفصيلاً تنظيمياً: إنه **مرجع أولوية المصادر** الذي تُشتق منه
 * `AI_SOURCE_PRIORITY` في services/aiSourcePriority.ts، فلا يُعرَّف الترتيب في مكانين.
 *
 *   1) المنهاج            — What/لماذا: الهوية الرسمية للمادة (ميادين، مقاطع، كفاءات، تدرج سنوي)
 *   2) الوثيقة المرافقة   — كيف: التوجيهات المنهجية لتطبيق المنهاج (الجيل الثاني)
 *   3) دليل الأستاذ       — التنفيذ الصفي: الأهداف، وضعيات الانطلاق، استغلال الوثائق، الأجوبة
 *   4) المذكرات           — الحصص الفعلية: 111 مذكرة و200 نشاط بتعليماتها وأجوبتها
 *
 * ولكل عائلة ثلاث طبقات:
 *   • `official`   — نص وزاري حرفي من src/data/official/ (مولَّد بـ scripts/ingest_official_pdfs.py)،
 *                    مُقتبس برقم الصفحة، وأولويته أقوى من كل ما عداه.
 *   • `registry`   — سجل الوثائق الرسمية data/pedagogicalOfficialSources.json: مرجع وثائقي
 *                    (عنوان، جهة، رابط/مسار) بلا نص حرفي مفهرس. وجود الوثيقة هنا يعني أن
 *                    المنصة تعرف مصدرها، لا أنها تملك نصها — والفرق مصرَّح به في الفجوات.
 *   • `structured` — بيانات المنصة المهيكلة القابلة للتصفية والتحرير.
 *
 * ⚠️ الدفتر اليومي **ليس** من هذه العائلات: له قاعدة خاصة في src/data/logbook/.
 *    وهو يقرأ التدرجات السنوية الرسمية من العائلة الأولى (بيانات وزارية مشتركة)،
 *    بينما تبقى برامجه ومدخلاته خاصة به. انظر src/data/logbook/index.ts.
 */
import type { KnowledgeSourceKind } from '../../types/knowledge';
import { OFFICIAL_SOURCES_MANIFEST } from '../official';
// السجل الوزاري للوثائق الرسمية. يُقرأ هنا مباشرة (لا عبر services/) لأن
// اتجاه الاستيراد في المستودع هو services ← data وليس العكس.
import registryFile from '../../../data/pedagogicalOfficialSources.json';

export type PlatformFamilyId = 'curriculum' | 'companionDocument' | 'teacherGuide' | 'memos';

export interface PlatformFamily {
  /** ترتيب العائلة في المرجعية الرسمية — 1 الأعلى سلطة. */
  order: number;
  id: PlatformFamilyId;
  label: string;
  /** دور العائلة في القرار التربوي، لا وصف محتواها فقط. */
  role: string;
  /** أنواع المصادر (`KnowledgeSourceKind`) التي تنتمي إلى هذه العائلة. */
  kinds: KnowledgeSourceKind[];
  /** أين تقع بياناتها المهيكلة داخل المستودع. */
  structuredModules: string[];
}

/**
 * العائلات الأربع بالترتيب المرجعي. أي تغيير في الترتيب هنا يغيّر أولوية
 * المصادر في البحث والاستخراج وفي ترتيب مزودات الذكاء الاصطناعي معاً.
 */
export const PLATFORM_FAMILIES: PlatformFamily[] = [
  {
    order: 1,
    id: 'curriculum',
    label: 'المنهاج',
    role: 'الهوية الرسمية للمادة: الميادين والمقاطع والكفاءات الختامية ومركباتها، والتدرج السنوي الرسمي.',
    kinds: ['curriculum', 'progression'],
    structuredModules: [
      'src/data/curriculum/officialAnnualDistributionData.ts',
      'src/data/curriculum/new1amDistribution.ts',
      'src/data/curriculum/annualDistribution2am2026.ts',
    ],
  },
  {
    order: 2,
    id: 'companionDocument',
    label: 'الوثيقة المرافقة',
    role: 'كيف يُنفَّذ المنهاج: الوضعية المشكلة، التقصي، إرساء الموارد، التقويم والإدماج والتكييف.',
    kinds: ['companionDocument'],
    structuredModules: ['src/data/knowledgeBaseCorpus.ts'],
  },
  {
    order: 3,
    id: 'teacherGuide',
    label: 'دليل الأستاذ',
    role: 'التنفيذ الصفي: الهدف التعلمي، وضعية الانطلاق، استغلال الوثائق، الأجوبة المرتقبة، إدارة الأفواج والوسائل.',
    kinds: ['teacherGuide'],
    structuredModules: ['src/data/knowledgeBaseCorpus.ts'],
  },
  {
    order: 4,
    id: 'memos',
    label: 'المذكرات',
    role: 'الحصص الفعلية: المذكرات بمساراتها (ميدان ← مقطع ← مورد ← تعلم مورد) وأنشطتها بتعليماتها وأجوبتها.',
    kinds: ['memo'],
    structuredModules: [
      'src/data/memos/curriculumDb.ts',
      'src/data/memos/lessons1am.ts … lessons4am.ts',
      'src/data/memos/official_*.ts',
      'src/data/memos/diagrams*.ts',
    ],
  },
];

/** معرّفات العائلات مرتبة من الأعلى سلطة إلى الأدنى. */
export const PLATFORM_FAMILY_ORDER: PlatformFamilyId[] = PLATFORM_FAMILIES.map(family => family.id);

/** أنواع المصادر المرتبة حسب عائلة كل نوع (مسطحة، بنفس ترتيب العائلات). */
export const PLATFORM_KIND_ORDER: KnowledgeSourceKind[] = PLATFORM_FAMILIES.flatMap(family => family.kinds);

const FAMILY_BY_ID = new Map(PLATFORM_FAMILIES.map(family => [family.id, family]));
const FAMILY_BY_KIND = new Map<KnowledgeSourceKind, PlatformFamily>(
  PLATFORM_FAMILIES.flatMap(family => family.kinds.map(kind => [kind, family] as const)),
);

export function platformFamily(id: PlatformFamilyId): PlatformFamily {
  const family = FAMILY_BY_ID.get(id);
  if (!family) throw new Error(`عائلة غير معروفة في القاعدة الموحدة: ${id}`);
  return family;
}

/** العائلة التي ينتمي إليها نوع مصدر، أو `null` إن كان خارج العائلات الأربع (وثائق الأستاذ مثلاً). */
export function familyOfKind(kind: KnowledgeSourceKind): PlatformFamily | null {
  return FAMILY_BY_KIND.get(kind) || null;
}

/**
 * أولوية العائلة (1 = الأعلى). الأنواع الخارجة عن العائلات الأربع تُرتَّب بعدها،
 * لأن ما يرفعه الأستاذ أو ما يُلصقه أقل سلطة من أي مصدر وزاري.
 */
export function familyPriorityOf(kind: KnowledgeSourceKind): number {
  return familyOfKind(kind)?.order ?? PLATFORM_FAMILIES.length + 1;
}

/** الوثائق الرسمية الحرفية المنتمية إلى عائلة، من بيان src/data/official/. */
export function officialSourcesOfFamily(id: PlatformFamilyId) {
  const family = platformFamily(id);
  return OFFICIAL_SOURCES_MANIFEST.filter(entry => family.kinds.includes(entry.kind as KnowledgeSourceKind));
}

/** مستوى تعليمي كما تفهمه القاعدة الموحدة. */
export type PlatformLevel = '1am' | '2am' | '3am' | '4am' | 'all';

/** مدخلة في سجل الوثائق الرسمية بعد استكمال ما لا يحمله السجل (المستوى والعائلة). */
export interface PlatformRegistrySource {
  id: string;
  kind: string;
  title: string;
  authority: string;
  url: string;
  status: string;
  role: string;
  /**
   * مستوى الوثيقة. السجل الوزاري لا يحمل حقل مستوى، فيُستدل عليه من المعرّف
   * والعنوان بترتيب صارم: رمز صريح (1am…4am) ← اسم السنة بالأحرف ← «المتوسط»
   * أو «الطور» ← `all`.
   */
  level: PlatformLevel;
  /** العائلة المالكة، أو `null` لنوع خارج العائلات الأربع (attachment/web/library/ai). */
  family: PlatformFamilyId | null;
}

const LEVELS: PlatformLevel[] = ['1am', '2am', '3am', '4am'];

/** رموز السنوات الصريحة ثم أسماؤها بالأحرف، بالترتيب نفسه. */
const LEVEL_MARKERS: [RegExp, PlatformLevel][] = [
  [/(?:^|[^a-z0-9])1am([^a-z0-9]|$)/i, '1am'],
  [/(?:^|[^a-z0-9])2am([^a-z0-9]|$)/i, '2am'],
  [/(?:^|[^a-z0-9])3am([^a-z0-9]|$)/i, '3am'],
  [/(?:^|[^a-z0-9])4am([^a-z0-9]|$)/i, '4am'],
  [/السنة الأولى متوسط|الأولى من التعليم المتوسط|1\s*متوسط/, '1am'],
  [/السنة الثانية متوسط|الثانية من التعليم المتوسط|2\s*متوسط/, '2am'],
  [/السنة الثالثة متوسط|الثالثة من التعليم المتوسط|3\s*متوسط/, '3am'],
  [/السنة الرابعة متوسط|الرابعة من التعليم المتوسط|4\s*متوسط/, '4am'],
];

/**
 * استخلاص مستوى وثيقة السجل من معرّفها وعنوانها.
 * القاعدة: أدق علامة تفوز، و«المتوسط/الطور» بلا سنة يعني المستويات كلها.
 */
export function registryLevelOf(source: { id?: string; title?: string }): PlatformLevel {
  const haystack = `${source?.id ?? ''} ${source?.title ?? ''}`;
  for (const [pattern, level] of LEVEL_MARKERS) {
    if (pattern.test(haystack)) return level;
  }
  // لا علامة سنة: وثيقة طور (مثل «الوثائق الرسمية البيداغوجية لمرحلة التعليم
  // المتوسط») فتُسند إلى المستويات كلها بدل اختراع مستوى لها.
  return 'all';
}

/** سجل الوثائق الرسمية مُكمَّلًا بالمستوى والعائلة. */
export const PLATFORM_REGISTRY_SOURCES: PlatformRegistrySource[] = (
  (registryFile as { sources?: Record<string, unknown>[] }).sources ?? []
).map((entry) => {
  const kind = String(entry.kind ?? '');
  return {
    id: String(entry.id ?? ''),
    kind,
    title: String(entry.title ?? ''),
    authority: String(entry.authority ?? ''),
    url: String(entry.url ?? ''),
    status: String(entry.status ?? ''),
    role: String(entry.role ?? ''),
    level: registryLevelOf({ id: String(entry.id ?? ''), title: String(entry.title ?? '') }),
    family: familyOfKind(kind as KnowledgeSourceKind)?.id ?? null,
  };
});

/** وثائق السجل المنتمية إلى عائلة (بلا النص الحرفي — مرجع وثائقي فقط). */
export function registrySourcesOfFamily(id: PlatformFamilyId): PlatformRegistrySource[] {
  return PLATFORM_REGISTRY_SOURCES.filter((source) => source.family === id);
}

/** وثائق السجل التي لا تنتمي إلى أي عائلة (مرفقات، مواقع، مكتبة، ذكاء اصطناعي). */
export function registrySourcesWithoutFamily(): PlatformRegistrySource[] {
  return PLATFORM_REGISTRY_SOURCES.filter((source) => source.family === null);
}

export interface PlatformFamilyCoverage {
  id: PlatformFamilyId;
  label: string;
  order: number;
  /** عدد الوثائق الرسمية الحرفية وصفحاتها وأحرفها. */
  officialDocuments: number;
  officialPages: number;
  officialChars: number;
  /** المستويات التي تملك وثيقة رسمية خاصة بها، مقابل ما تغطيه وثيقة عامة. */
  levelsWithOwnDocument: string[];
  /** أدنى وأعلى نسبة مطابقة للمفردات بين وثائق العائلة. */
  qualityRange: [number, number] | null;
  /** عدد وثائق السجل الوزاري (مرجع وثائقي بلا نص حرفي مفهرس). */
  registryDocuments: number;
  /** المستويات التي لها وثيقة في السجل. */
  registryLevels: string[];
  /** المستويات المغطاة بنص حرفي أو بمرجع في السجل. */
  levelsWithAnySource: string[];
  /** المستويات التي لها وثيقة مسجَّلة لكن نصها الحرفي لم يُدخَل بعد. */
  levelsPendingIngestion: string[];
}

/** تغطية كل عائلة — تُستعمل في اللوحة وفي التقارير دون إعادة حساب يدوي. */
export function platformFamilyCoverage(): PlatformFamilyCoverage[] {
  return PLATFORM_FAMILIES.map(family => {
    const docs = officialSourcesOfFamily(family.id);
    const qualities = docs.map(entry => entry.quality);
    const registry = registrySourcesOfFamily(family.id);
    const verbatimLevels = new Set<string>(
      docs.some(entry => entry.level === 'all') ? LEVELS : docs.map(entry => String(entry.level)),
    );
    const registryLevels = new Set<string>(
      registry.some(entry => entry.level === 'all') ? LEVELS : registry.map(entry => entry.level),
    );
    return {
      id: family.id,
      label: family.label,
      order: family.order,
      officialDocuments: docs.length,
      officialPages: docs.reduce((sum, entry) => sum + entry.pages, 0),
      officialChars: docs.reduce((sum, entry) => sum + entry.chars, 0),
      levelsWithOwnDocument: [...new Set(docs.filter(entry => entry.level !== 'all').map(entry => entry.level))].sort(),
      qualityRange: qualities.length ? [Math.min(...qualities), Math.max(...qualities)] : null,
      registryDocuments: registry.length,
      registryLevels: LEVELS.filter(level => registryLevels.has(level)),
      levelsWithAnySource: LEVELS.filter(level => verbatimLevels.has(level) || registryLevels.has(level)),
      levelsPendingIngestion: LEVELS.filter(level => registryLevels.has(level) && !verbatimLevels.has(level)),
    };
  });
}

/**
 * ما لا تغطيه القاعدة الموحدة بعد — يُصرَّح به بدل أن يُكتشف بالصدفة.
 * يُبنى من البيان نفسه فيتحدّث تلقائياً عند إضافة أي وثيقة.
 */
export function platformCoverageGaps(): string[] {
  const gaps: string[] = [];
  for (const family of PLATFORM_FAMILIES) {
    const docs = officialSourcesOfFamily(family.id);
    const registry = registrySourcesOfFamily(family.id);
    const coverage = platformFamilyCoverage().find(item => item.id === family.id);
    const pending = coverage?.levelsPendingIngestion ?? [];
    const missing = LEVELS.filter(level => !(coverage?.levelsWithAnySource ?? []).includes(level));

    if (docs.length === 0 && registry.length === 0) {
      gaps.push(`${family.label}: لا وثيقة رسمية حرفية ولا مرجع في السجل — الاعتماد كلياً على الملخصات المنهجية وبيانات المنصة.`);
      continue;
    }
    if (missing.length) {
      gaps.push(`${family.label}: لا وثيقة رسمية ولا مرجع مسجَّل للمستويات ${missing.join('، ')}.`);
    }
    if (pending.length) {
      const ids = registry
        .filter(entry => pending.includes(entry.level))
        .map(entry => entry.id)
        .join('، ');
      gaps.push(
        `${family.label}: وثائق مسجَّلة للمستويات ${pending.join('، ')} لكنها غير مُدخَلة نصاً حرفياً ` +
        `(بلا صفحات مفهرسة، فلا تُقتبس برقم صفحة) — المعرّفات: ${ids}.`,
      );
    }
    if (docs.length === 0 && registry.length > 0 && pending.length === 0) {
      gaps.push(`${family.label}: مراجع السجل عامة (لكل المستويات) ولا نص حرفي خاص بأي مستوى.`);
    }
  }
  return gaps;
}

/** القاعدة الموحدة ككل — نقطة الدخول الوحيدة للوحة والتقارير وواجهات الخادم. */
/** سجل الوثائق الرسمية مجمَّعاً حسب العائلة — للنقطة النهائية والتقارير. */
export const PLATFORM_REGISTRY = {
  documents: PLATFORM_REGISTRY_SOURCES.length,
  byFamily: PLATFORM_FAMILY_ORDER.map(id => ({
    id,
    label: platformFamily(id).label,
    documents: registrySourcesOfFamily(id).length,
    levels: platformFamilyCoverage().find(item => item.id === id)?.registryLevels ?? [],
  })),
  withoutFamily: registrySourcesWithoutFamily().map(source => ({ id: source.id, kind: source.kind, title: source.title })),
  sources: PLATFORM_REGISTRY_SOURCES,
} as const;

export const PLATFORM_DATABASE = {
  families: PLATFORM_FAMILIES,
  order: PLATFORM_FAMILY_ORDER,
  kindOrder: PLATFORM_KIND_ORDER,
  coverage: platformFamilyCoverage(),
  gaps: platformCoverageGaps(),
  registry: PLATFORM_REGISTRY,
} as const;
