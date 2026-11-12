/**
 * ربط جدول التدرج السنوي الرسمي بقاعدة بيانات الدفتر اليومي.
 *
 * ── لماذا هذه الطبقة؟ ────────────────────────────────────────────────────────
 * الوثيقتان الرسميتان مختلفتان وليست إحداهما نسخة الأخرى:
 *   • **المخطط السنوي للتعلمات** ← جدول التدرج (`OFFICIAL_*AM_DISTRIBUTION`)،
 *     موارده مجمّعة: «المورد 1: خصائص الوسط الحي».
 *   • **التدرج البيداغوجي** ← قاعدة الدفتر (`DAILY_LOGBOOK_PROGRAM_*AM`)،
 *     وحداته مفصّلة وتحمل المشكلة والتقويم: «المورد التعلمي 1-1: عناصر الوسط الحي»
 *     و«1-2: أنواع الأوساط الحية».
 * فالعلاقة واحد↔متعدد والعناوين مُعاد صياغتها أحياناً («مكانة الإنسان في استقرار
 * النظام البيئي» مقابل «تأثير الإنسان على النظام البيئي»).
 *
 * ── القاعدة الحاكمة: لا اختراع ───────────────────────────────────────────────
 * بدون هذه الطبقة كانت **كل** حصة في المستويات الأربعة تأخذ النص العام
 * «تقويم تكويني ومتابعة الإنجاز» وتبقى مشكلتها فارغة. القياس الفعلي بعدها
 * (`progressionProgramCoverage`، مقفل باختبار):
 *
 *      المستوى  عناوين الموارد  ربط وحيد  ربط متعدد  غير مربوط  التغطية
 *      س1              18           6          7          5       72%
 *      س2              32           9          6         17       47%
 *      س3              23           7          7          9       61%
 *      س4              26           5          5         16       38%
 *
 * وعلى مستوى الحصص المولَّدة (252 حصة): 76 تحمل تقويماً وزارياً حرفياً (30%)،
 * و68 تحمل مشكلته الرسمية (27%) — وكان الاثنان صفراً ونصاً عاماً قبل الربط.
 *
 * لذلك لا تُربط إلا العناوين التي **تتطابق حرفياً بعد التطبيع**، وما دون ذلك يُترك
 * للسلوك السابق كما هو. الربط التخميني كان سينسب إلى وثيقة وزارية نصاً ليس فيها —
 * وهو ما رُفض في `learningUnit` للسبب نفسه (انظر tests/annualDistributionCompletion.test.ts).
 * إغلاق ما تبقى يحتاج وثيقتَي التدرج البيداغوجي لس3 وس4 (لم تصلا: النسخ المرفوعة
 * محروقة الترميز) أو جدول ربط مؤلَّفاً يدوياً يُراجَع بيداغوجياً.
 *
 * ── التعدد (مورد جدول ↔ عدة وحدات برنامج) ───────────────────────────────────
 * إن طابق العنوان أكثر من وحدة، لا يُختار منها واحدة: يُؤخذ الحقل **فقط إذا اتفقت
 * عليه الوحدات كلها** حرفياً، وإلا بقي الاحتياطي. ويُبلَّغ عن الحالة في `ambiguous`.
 */
import { LOGBOOK_PROGRAMS, type LogbookLevel } from '../data/logbook';
import type { DailyLogbookProgramItem } from '../data/logbook/dailyLogbookProgram1am';
import {
  OFFICIAL_1AM_DISTRIBUTION,
  OFFICIAL_2AM_DISTRIBUTION,
  OFFICIAL_3AM_DISTRIBUTION,
  OFFICIAL_4AM_DISTRIBUTION,
} from '../data/curriculum/officialAnnualDistributionData';

/** ما يلزم القياس من صف التدرج — عقد قراءة ضيق بدل استيراد نوع الجدول كله. */
interface DistributionRow {
  week?: number | string;
  maqta: string;
  mawrid: string;
  isHoliday?: boolean;
  isExam?: boolean;
  isIntroductory?: boolean;
  isRemediation?: boolean;
}

/** التدرجات الوزارية كما هي في المصدر، لا من `localStorage` الذي يتقدم عليها في الواجهة. */
const DISTRIBUTIONS: Record<LogbookLevel, DistributionRow[]> = {
  '1am': OFFICIAL_1AM_DISTRIBUTION,
  '2am': OFFICIAL_2AM_DISTRIBUTION,
  '3am': OFFICIAL_3AM_DISTRIBUTION,
  '4am': OFFICIAL_4AM_DISTRIBUTION,
};

/** الأرقام الحسابية ↔ الأعداد، لتتطابق «المقطع الأول» مع «المقطع التعلمي 01». */
const ORDINALS: ReadonlyArray<readonly [string, string]> = [
  ['الأول', '01'], ['الثاني', '02'], ['الثالث', '03'], ['الرابع', '04'],
  ['الخامس', '05'], ['السادس', '06'], ['السابع', '07'], ['الثامن', '08'],
  ['التاسع', '09'],
];

/** كلمات لا تجعل من المقطع موردَ تعلم (أسابيع الاستقبال والعطل والاختبارات والإدماج). */
const NOT_A_RESOURCE = /إدماج|معالجة|تصحيح|اختبار|فرض|عطلة|تعارف|استقبال|الصحة المدرسية|وضعية الانطلاق|المكتسبات القبلية|مراجعة/;

/**
 * تطبيع عنوان مورد/مقطع للمقارنة: يزيل البادئة الرسمية والترقيم والتشكيل وعلامات
 * الترقيم، ويوحّد الأرقام الحسابية. لا يُغيّر النص المعروض — للمقارنة فقط.
 */
export function normalizeResourceTitle(raw: string): string {
  let t = String(raw || '');
  // التشكيل وضوابط الاتجاه أولاً: «المَورِدُ التعلميُّ» لا تطابق بادئتها قبل إزالتهما
  t = t.replace(/[\u064B-\u065F\u0670\u0640]/g, '');            // تشكيل وتطويل
  t = t.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');      // ضوابط اتجاه
  t = t.replace(/^المورد\s+التعلمي\s*/, '').replace(/^المورد\s*/, '');
  t = t.replace(/^تعلم\s+مورد\s*/, '');
  t = t.replace(/^المقطع\s+التعلمي\s*/, '').replace(/^المقطع\s*/, '');
  t = t.replace(/^الميدان\s*/, '');
  for (const [word, digits] of ORDINALS) t = t.split(word).join(digits);
  // ترقيم بادئ بأية صيغة: «01-»، «1:»، «1-1»، «01 —»
  t = t.replace(/^\s*\d{1,2}([-–—]\d{1,2})?\s*[:\-–—.]\s*/, '');
  t = t.replace(/^\s*\d{1,2}([-–—]\d{1,2})?\s+/, '');
  t = t.replace(/[،,.;:!?()\[\]{}«»"'’‘\/\\|\-–—_=+*#~`^\u00B0]/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

/** رقم المقطع من أي صيغة: «المقطع الأول»، «المقطع التعلمي 01»، «1- الديناميكية…». */
export function segmentNumber(maqta: string): string {
  const t = String(maqta || '');
  for (const [word, digits] of ORDINALS) if (t.includes(word)) return digits;
  const m = t.match(/(\d{1,2})\s*[-–—:]/) || t.match(/المقطع\s+(?:التعلمي\s+)?(\d{1,2})/);
  return m ? m[1].padStart(2, '0') : '';
}

/**
 * عناوين الموارد المرشَّحة داخل نصّ (حقل `mawrid` أو نص حصة).
 * يُقسم على «/» والأسطر، ويُستبعد ما ليس موردَ تعلم (إدماج، معالجة، تصحيح…).
 */
export function resourceTitlesIn(text: string): string[] {
  const parts = String(text || '')
    .split(/[\/\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    if (NOT_A_RESOURCE.test(part)) continue;
    // يقبل «المورد 1: …» و«المورد التعلمي 1-1: …» و«01-الزلازل ظاهرة طبيعية»
    const looksLikeResource = /المورد/.test(part) || /^\s*\d{1,2}\s*[-–—:]/.test(part);
    if (!looksLikeResource) continue;
    const key = normalizeResourceTitle(part);
    if (key && key.length > 3 && !out.includes(key)) out.push(key);
  }
  return out;
}

export interface ProgramLink {
  /** الوحدات المطابقة؛ أكثر من واحدة حين يكون مورد الجدول مجمَّعاً. */
  units: DailyLogbookProgramItem[];
  /** العنوان الذي وقع عليه التطابق (بعد التطبيع). */
  matchedTitle: string;
  /** مطابقة واحدة لا لبس فيها. */
  unique: boolean;
}

/**
 * يجد وحدات قاعدة الدفتر المطابقة لعنوان مورد في صف من جدول التدرج.
 *
 * @param titles  عناوين مطبَّعة (من `resourceTitlesIn`)
 * @param program قاعدة الدفتر للمستوى
 * @param maqta   مقطع الصف، لحصر البحث في المقطع نفسه حين يكون رقمه واضحاً
 */
export function linkTitlesToProgram(
  titles: string[],
  program: DailyLogbookProgramItem[],
  maqta?: string,
): ProgramLink | null {
  const seg = segmentNumber(maqta || '');
  const scoped = seg ? program.filter((p) => segmentNumber(p.maqta) === seg) : program;
  const pools: DailyLogbookProgramItem[][] = [scoped, program];
  for (const pool of pools) {
    if (!pool.length) continue;
    for (const title of titles) {
      // الأولوية للحقل الأدق: «تعلم مورد» ثم «المورد التعلمي»
      for (const field of ['ta3alom', 'mawrid'] as const) {
        const hits = pool.filter((p) => normalizeResourceTitle(p[field]) === title);
        if (hits.length) {
          return {
            units: hits,
            matchedTitle: title,
            unique: hits.length === 1,
          };
        }
      }
    }
  }
  return null;
}

/** حقل مُستخلص من ربط: يُؤخذ إن اتفقت عليه كل الوحدات المطابقة. */
function agreedField(units: DailyLogbookProgramItem[], field: 'ta3alom' | 'moshkila' | 'taqwim'): string {
  const values = new Set(
    units.map((u) => String(u[field] || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
  );
  return values.size === 1 ? [...values][0] : '';
}

export interface ResolvedProgramFields {
  ta3alom?: string;
  moshkila?: string;
  taqwim?: string;
  /** معرفات الوحدات الرسمية التي بُنيت عليها القيم — للأثر الرجعي والاستشهاد. */
  sourceLearningUnitIds: string[];
  unique: boolean;
}

/**
 * يستخلص ما تُضيفه قاعدة الدفتر لصفّ من جدول التدرج: «تعلم مورد» والمشكلة
 * والتقويم، بنصها الرسمي. لا يُعيد إلا ما ثبت بالتطابق الحرفي.
 */
export function resolveProgramFields(
  mawrid: string,
  maqta: string,
  level: LogbookLevel,
  sessionText?: string,
): ResolvedProgramFields {
  const program = LOGBOOK_PROGRAMS[level] || [];
  // نص الحصة أدق من حقل المورد حين يذكر المورد صراحة (س2 تذكره في كل حصة)
  const fromSession = sessionText ? resourceTitlesIn(sessionText) : [];
  const fromRow = resourceTitlesIn(mawrid);
  const link =
    (fromSession.length ? linkTitlesToProgram(fromSession, program, maqta) : null) ||
    (fromRow.length ? linkTitlesToProgram(fromRow, program, maqta) : null);
  if (!link) return { sourceLearningUnitIds: [], unique: false };
  const ta3alom = agreedField(link.units, 'ta3alom');
  const moshkila = agreedField(link.units, 'moshkila');
  const taqwim = agreedField(link.units, 'taqwim');
  return {
    ...(ta3alom ? { ta3alom } : {}),
    ...(moshkila ? { moshkila } : {}),
    ...(taqwim ? { taqwim } : {}),
    sourceLearningUnitIds: link.units.map((u) => u.sourceLearningUnitId),
    unique: link.unique,
  };
}

export interface ProgressionProgramCoverage {
  level: LogbookLevel;
  /** عناوين الموارد في أسطر التدريس. */
  titles: number;
  /** عناوين ربطت بوحدة واحدة بلا لبس. */
  unique: number;
  /** عناوين ربطت بأكثر من وحدة (مورد جدول مجمَّع). */
  ambiguous: number;
  /** عناوين لم تطابق شيئاً — تبقى بسلوكها السابق. */
  unlinked: number;
  /** أمثلة على غير المربوط، للتقرير لا للعلاج الآلي. */
  unlinkedSamples: string[];
}

/**
 * قياس تغطية الربط لمستوى: كم عنوان مورد في جدول التدرج وجد وحدته في قاعدة الدفتر.
 * يُستهلك في الاختبارات وفي لوحة السجل الرسمي، حتى تبقى النسبة معلنة لا مضمرَة.
 */
export function progressionProgramCoverage(level: LogbookLevel): ProgressionProgramCoverage {
  const program = LOGBOOK_PROGRAMS[level] || [];
  const rows = distributionRowsOf(level);
  let unique = 0, ambiguous = 0, unlinked = 0, titles = 0;
  const unlinkedSamples: string[] = [];
  for (const row of rows) {
    if (row.isHoliday || row.isExam || row.isIntroductory || row.isRemediation) continue;
    for (const title of resourceTitlesIn(row.mawrid)) {
      titles++;
      const link = linkTitlesToProgram([title], program, row.maqta);
      if (!link) {
        unlinked++;
        if (unlinkedSamples.length < 6) unlinkedSamples.push(`أ${row.week ?? '?'} «${title}»`);
      } else if (link.unique) unique++;
      else ambiguous++;
    }
  }
  return { level, titles, unique, ambiguous, unlinked, unlinkedSamples };
}

/** صفوف التدرج الرسمية لمستوى، بمعزل عن التخزين المخصص (القياس على المصدر الوزاري). */
function distributionRowsOf(level: LogbookLevel): DistributionRow[] {
  return DISTRIBUTIONS[level];
}
