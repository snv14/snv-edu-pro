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
 * ولكل عائلة طبقتان:
 *   • `official`   — نص وزاري حرفي من src/data/official/ (مولَّد بـ scripts/ingest_official_pdfs.py)،
 *                    مُقتبس برقم الصفحة، وأولويته أقوى من كل ما عداه.
 *   • `structured` — بيانات المنصة المهيكلة القابلة للتصفية والتحرير.
 *
 * ⚠️ الدفتر اليومي **ليس** من هذه العائلات: له قاعدة خاصة في src/data/logbook/.
 *    وهو يقرأ التدرجات السنوية الرسمية من العائلة الأولى (بيانات وزارية مشتركة)،
 *    بينما تبقى برامجه ومدخلاته خاصة به. انظر src/data/logbook/index.ts.
 */
import type { KnowledgeSourceKind } from '../../types/knowledge';
import { OFFICIAL_SOURCES_MANIFEST } from '../official';

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
}

/** تغطية كل عائلة — تُستعمل في اللوحة وفي التقارير دون إعادة حساب يدوي. */
export function platformFamilyCoverage(): PlatformFamilyCoverage[] {
  return PLATFORM_FAMILIES.map(family => {
    const docs = officialSourcesOfFamily(family.id);
    const qualities = docs.map(entry => entry.quality);
    return {
      id: family.id,
      label: family.label,
      order: family.order,
      officialDocuments: docs.length,
      officialPages: docs.reduce((sum, entry) => sum + entry.pages, 0),
      officialChars: docs.reduce((sum, entry) => sum + entry.chars, 0),
      levelsWithOwnDocument: [...new Set(docs.filter(entry => entry.level !== 'all').map(entry => entry.level))].sort(),
      qualityRange: qualities.length ? [Math.min(...qualities), Math.max(...qualities)] : null,
    };
  });
}

/**
 * ما لا تغطيه القاعدة الموحدة بعد — يُصرَّح به بدل أن يُكتشف بالصدفة.
 * يُبنى من البيان نفسه فيتحدّث تلقائياً عند إضافة أي وثيقة.
 */
export function platformCoverageGaps(): string[] {
  const gaps: string[] = [];
  const levels = ['1am', '2am', '3am', '4am'];
  for (const family of PLATFORM_FAMILIES) {
    const docs = officialSourcesOfFamily(family.id);
    if (docs.length === 0) {
      gaps.push(`${family.label}: لا وثيقة رسمية حرفية — الاعتماد كلياً على الملخصات المنهجية وبيانات المنصة.`);
      continue;
    }
    const covered = new Set(docs.filter(d => d.level === 'all').length ? levels : docs.map(d => d.level));
    const missing = levels.filter(level => !covered.has(level));
    if (missing.length) gaps.push(`${family.label}: لا وثيقة رسمية للمستويات ${missing.join('، ')}.`);
  }
  return gaps;
}

/** القاعدة الموحدة ككل — نقطة الدخول الوحيدة للوحة والتقارير وواجهات الخادم. */
export const PLATFORM_DATABASE = {
  families: PLATFORM_FAMILIES,
  order: PLATFORM_FAMILY_ORDER,
  kindOrder: PLATFORM_KIND_ORDER,
  coverage: platformFamilyCoverage(),
  gaps: platformCoverageGaps(),
} as const;
