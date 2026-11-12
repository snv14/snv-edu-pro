import { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';
import {
  OFFICIAL_1AM_DISTRIBUTION,
  OFFICIAL_2AM_DISTRIBUTION,
  OFFICIAL_3AM_DISTRIBUTION,
  OFFICIAL_4AM_DISTRIBUTION,
  type OfficialAnnualDistributionRow,
} from '../data/curriculum/officialAnnualDistributionData';
import { ANNUAL_STORAGE_KEY } from './annualDistributionDateUtils';
import { LOGBOOK_PROGRAMS, type DailyLogbookProgramItem } from '../data/logbook';

/** A merged group row may contain more than one ISO date. */
export function isLogbookRowOnOrAfter(dateStr: string, startDate: string): boolean {
  const dates: string[] = dateStr.match(/\d{4}-\d{2}-\d{2}/g) || [];
  return dates.every((date) => date >= startDate);
}

export function formatDateToIsoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function detectLevelFromSection(sec: string): '1م' | '2م' | '3م' | '4م' | null {
  if (!sec) return null;
  const s = sec.trim();
  if (s.includes('4م') || s.includes('4 م') || s.startsWith('4')) return '4م';
  if (s.includes('3م') || s.includes('3 م') || s.startsWith('3')) return '3م';
  if (s.includes('2م') || s.includes('2 م') || s.startsWith('2')) return '2م';
  if (s.includes('1م') || s.includes('1 م') || s.startsWith('1')) return '1م';
  return null;
}

export function normalizeBaseSection(raw: string): string {
  let s = String(raw || '').trim();
  s = s.replace(/([1234])\s*م\s*(\d+)/g, '$1م$2');
  s = s.replace(/[-—–/\\+]+$/, '').trim();
  s = s.replace(/^[-—–/\\+]+/, '').trim();
  s = s.replace(/\(\s*\)/g, '').trim();
  return s || raw;
}

export function extractGroupInfo(sec: string): {
  baseSection: string;
  isGroup: boolean;
  groupNumber: number;
  rawGroup?: string;
  level: '1م' | '2م' | '3م' | '4م';
  isMerged?: boolean;
  groupNumbers?: number[];
} {
  const raw = String(sec || '').trim();
  const level = detectLevelFromSection(raw) || '1م';

  if (!raw) {
    return {
      baseSection: 'قسم غير محدد',
      isGroup: false,
      groupNumber: 0,
      level,
      isMerged: false,
    };
  }

  // 1. فحص إذا كان القسم مدمجاً بالفعل (مثال: 1م1 (فوج 1 + فوج 2) أو 1م1 (ف1 + ف2))
  const mergedMatch = raw.match(/(?:[-—/–\s]*\(?(?:أفواج|فوج|فـ|ف)\s*([1234أبab])\s*(?:\+|و|&|\/|مع)\s*(?:أفواج|فوج|فـ|ف)?\s*([1234أبab])\)?\s*)/i);
  if (mergedMatch) {
    const base = normalizeBaseSection(raw.replace(mergedMatch[0], ''));
    const parseNum = (s: string) => {
      const low = s.toLowerCase();
      if (low === 'أ' || low === 'a') return 1;
      if (low === 'ب' || low === 'b') return 2;
      return parseInt(s, 10) || 1;
    };
    const g1 = parseNum(mergedMatch[1]);
    const g2 = parseNum(mergedMatch[2]);
    return {
      baseSection: base || raw,
      isGroup: true,
      isMerged: true,
      groupNumber: g1,
      groupNumbers: [g1, g2],
      rawGroup: `ف${g1}+ف${g2}`,
      level,
    };
  }

  const parseGroupNumber = (str: string): number => {
    const low = str.toLowerCase();
    if (low === 'أ' || low === 'a') return 1;
    if (low === 'ب' || low === 'b') return 2;
    return parseInt(str, 10) || 1;
  };

  // 2. إذا كانت تسمية الفوج سابقة لرقم القسم (مثال: ف1 1م1 أو فوج 1 - 1م1)
  const prefixMatch = raw.match(/^(?:\(?\s*(?:فوج|فـ|ف|grp|group|g)\s*([1234أبab])\s*\)?\s*[-—/–\s]*)/i);
  if (prefixMatch) {
    const gNum = parseGroupNumber(prefixMatch[1]);
    const base = normalizeBaseSection(raw.replace(prefixMatch[0], ''));
    return {
      baseSection: base || raw,
      isGroup: true,
      isMerged: false,
      groupNumber: gNum,
      rawGroup: `ف${gNum}`,
      level,
    };
  }

  // 3. صيغة الفوج مع رقم أو حرف (مثال: 1م1 ف1، 1م1 فوج 2، 4م1 (ف1)، 1م 1 - ف2، 1م1 فوج أ)
  const groupMatch = raw.match(/(?:[-—/–\s]*\(?\s*(?:فوج|فـ|ف|grp|group|g)\s*([1234أبab])\s*\)?\s*)/i);
  if (groupMatch) {
    const gNum = parseGroupNumber(groupMatch[1]);
    const base = normalizeBaseSection(raw.replace(groupMatch[0], ''));
    return {
      baseSection: base || raw,
      isGroup: true,
      isMerged: false,
      groupNumber: gNum,
      rawGroup: `ف${gNum}`,
      level,
    };
  }

  // 4. وسم الفوج العام دون رقم (مثال: 1م1 فوج، 1م1 مخبر)
  const genericMatch = raw.match(/(?:[-—/–\s]*\(?\s*(?:فوج|مخبر|عمل مخبري)\s*\)?\s*)/i);
  if (genericMatch) {
    const base = normalizeBaseSection(raw.replace(genericMatch[0], ''));
    return {
      baseSection: base || raw,
      isGroup: true,
      isMerged: false,
      groupNumber: 1,
      rawGroup: 'فوج',
      level,
    };
  }

  return {
    baseSection: normalizeBaseSection(raw),
    isGroup: false,
    groupNumber: 0,
    level,
    isMerged: false,
  };
}

export function getBaseSection(sec: string): string {
  return extractGroupInfo(sec).baseSection;
}

export type LogbookLevel = '1م' | '2م' | '3م' | '4م';

export interface PedagogicalStep {
  sourceLearningUnitId: string;
  midan: string;
  maqta: string;
  mawrid: string;
  ta3alom: string;
  moshkila?: string;
  activityText: string;
  fullContent: string;
  sessionIndexInActivity: number; // 1, 2, ...
  totalSessionsForActivity: number;
  taqwim?: string;
  isIntroductory?: boolean;
  isReview?: boolean;
  isPractical?: boolean;
}

export const LEVEL_PROGRAMS: Record<LogbookLevel, DailyLogbookProgramItem[]> = {
  '1م': LOGBOOK_PROGRAMS['1am'],
  '2م': LOGBOOK_PROGRAMS['2am'],
  '3م': LOGBOOK_PROGRAMS['3am'],
  '4م': LOGBOOK_PROGRAMS['4am'],
};

/**
 * الحصول على صفوف التدرج السنوي المعتمد للمستوى (من التخزين المخصص إن وجد، أو من التدرج الوزاري الرسمي).
 */
export function getAnnualDistributionRowsForLevel(level: LogbookLevel): OfficialAnnualDistributionRow[] {
  const levelKey = level === '1م' ? '1am' : level === '2م' ? '2am' : level === '3م' ? '3am' : '4am';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = JSON.parse(localStorage.getItem(ANNUAL_STORAGE_KEY) || '{}');
      if (stored[levelKey]?.items && Array.isArray(stored[levelKey].items) && stored[levelKey].items.length > 0) {
        return stored[levelKey].items;
      }
    } catch {}
  }
  if (level === '1م') return OFFICIAL_1AM_DISTRIBUTION;
  if (level === '2م') return OFFICIAL_2AM_DISTRIBUTION;
  if (level === '3م') return OFFICIAL_3AM_DISTRIBUTION;
  return OFFICIAL_4AM_DISTRIBUTION;
}

/* ------------------------------------------------------------------ *
 * مطابقة التدرج السنوي مع قاعدة الدفتر
 * ------------------------------------------------------------------ */

const LEVEL_DB_KEY: Record<LogbookLevel, '1am' | '2am' | '3am' | '4am'> = {
  '1م': '1am',
  '2م': '2am',
  '3م': '3am',
  '4م': '4am',
};

/** توحيد الحروف العربية لتمكين مطابقة نصوص التدرج السنوي مع نصوص قاعدة الدفتر. */
function normalizeArabicText(input: string): string {
  return String(input || '')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u064A0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MATCH_STOPWORDS = new Set(
  normalizeArabicText(
    'المورد التعلمي تعلم مورد النشاط المشكلة المطروحة المقطع الأول الثاني الثالث الرابع الخامس السادس السابع الثامن ' +
    '01 02 03 04 05 06 07 08 09 من في على عند مع الى عن و ثم التي الذي هذا هذه كذلك معين'
  ).split(' ').filter(Boolean)
);

function keyTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const word of normalizeArabicText(text).split(' ')) {
    if (word.length > 2 && !MATCH_STOPWORDS.has(word)) tokens.add(word);
  }
  return tokens;
}

/** نسبة الكلمات الدالة المشتركة بين نصين (0 = لا تشابه، 1 = تطابق تام). */
export function pedagogicalTextSimilarity(a: string, b: string): number {
  const left = keyTokens(a);
  const right = keyTokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;
  return shared / Math.min(left.size, right.size);
}

/** حصص لا تُسند إلى مورد تعلمي: التعارف، التشخيص، المعالجة، الفروض، الاختبارات، المراجعة. */
const CHECKPOINT_PATTERN = /(تعارف|استقبال|توجيهات|تشخيصي|معالجة بيداغوجية|استدراك|إدماج|ادماج|فرض|اختبار|تصحيح|مراجعة|حصيلة|الوضعية الانطلاقية)/;

function isCheckpointRow(row: OfficialAnnualDistributionRow): boolean {
  if (row.isExam || row.isRemediation || row.isIntroductory) return true;
  const hay = [row.maqta, row.mawrid, row.session1, row.session2].filter(Boolean).join(' ');
  return CHECKPOINT_PATTERN.test(hay);
}

/** أسطر العطل لا تُولّد حصصاً: الرزنامة وجدول التوقيت هما من يحجب أيام العطلة. */
function isHolidayRow(row: OfficialAnnualDistributionRow): boolean {
  if (row.isHoliday) return true;
  const hay = [row.maqta, row.mawrid, row.session1, row.session2].filter(Boolean).join(' ');
  return /عطلة/.test(hay);
}

/** أدنى درجة تشابه مقبولة لاعتبار صف التدرج السنوي مسنداً إلى وحدة من قاعدة الدفتر. */
const MIN_UNIT_MATCH = 0.18;

/** أكبر عدد موارد يُفحص انطلاقاً من الموضع الحالي (يمنع القفزات ويحفظ تسلسل التدرج). */
const MATCH_LOOKAHEAD = 8;

/** أفضل مورد مطابق لنص واحد داخل نافذة محدودة انطلاقاً من الموضع الحالي (‎-1 عند غياب تطابق). */
function bestUnitIndexForText(
  text: string,
  units: DailyLogbookProgramItem[],
  cursor: number,
  lookahead = MATCH_LOOKAHEAD
): number {
  if (!text || !text.trim()) return -1;
  const from = Math.max(0, cursor);
  const to = Math.min(units.length - 1, cursor + lookahead);
  let bestIndex = -1;
  let bestScore = 0;
  for (let index = from; index <= to; index++) {
    const unit = units[index];
    const unitText = [unit.mawrid, unit.ta3alom, unit.maqta, ...unit.activities].join(' ');
    const raw = Math.max(
      pedagogicalTextSimilarity(text, unitText),
      pedagogicalTextSimilarity(text, [unit.ta3alom, ...unit.activities].join(' '))
    );
    const score = index >= cursor ? raw + 0.01 : raw;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestScore >= MIN_UNIT_MATCH ? bestIndex : -1;
}

/**
 * إسناد سطر من التدرج السنوي إلى وحدة من قاعدة الدفتر.
 * - عمود «المقطع» في التدرجات الرسمية يحمل غالباً اسم المورد نفسه، لذا يدخل في المطابقة.
 * - تُطابق الحصتان كلٌّ على حدة ويُعتمد أبعد مورد داخل نافذة مقبولة، لأن السطر الواحد
 *   قد يجمع موردين متتاليين (مثل «التغذية المعدنية» و«مقر الامتصاص»)، وهذا يضبط
 *   موضع المحطة التقويمية التي تليه ولا يسمح لها بالقفز إلى مقطع لاحق.
 */
function findProgramUnitIndex(
  row: OfficialAnnualDistributionRow,
  units: DailyLogbookProgramItem[],
  cursor = -1
): number {
  const perSession = [
    bestUnitIndexForText(String(row.session1 || ''), units, cursor),
    bestUnitIndexForText(String(row.session2 || ''), units, cursor),
  ].filter((index) => index >= 0);
  const whole = bestUnitIndexForText(
    [row.maqta, row.mawrid, row.session1, row.session2].filter(Boolean).join(' '),
    units,
    cursor
  );
  const candidates = whole >= 0 ? [...perSession, whole] : perSession;
  return candidates.length ? Math.max(...candidates) : -1;
}

/**
 * خلايا التدرج السنوي للسنة الثانية تحمل عدة أسطر في الخلية نفسها:
 * «المقطع … / وضعية الانطلاق / المورد … / النشاط …». نُبقي سطر النشاط وحده
 * حتى لا تُطبع عناوين المقطع والمورد داخل محتوى الحصة.
 */
function simplifyDistributionText(text: string): string {
  const raw = String(text || '').trim();
  const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) return raw;
  const activityLines = lines.filter((line) => /^(النشاط|تقويم|إرساء|حل|وضعية|المشكلة|أقترح|أنجز)/.test(line));
  return activityLines.length ? activityLines.join(' ') : lines[lines.length - 1];
}

/** هل النص مكرر لمضمون نشاط موجود أصلاً في قاعدة الدفتر؟ (تفادي الحصص المكررة) */
function duplicatesProgramActivity(text: string, units: DailyLogbookProgramItem[]): boolean {
  const cleaned = simplifyDistributionText(text);
  if (cleaned.length < 12) return false;
  return units.some((unit) =>
    unit.activities.some((activity) => pedagogicalTextSimilarity(cleaned, activity) >= 0.6)
  );
}

const LAB_PATTERN = /(تحليل|الكشف|تجربة|مخبر|تشريح|ملاحظة مجهرية|فحص مجهري|فصل مكونات|كواشف|معاينة|نمذجة|استقصاء)/i;

/**
 * بناء التسلسل الفعلي لحصص الدفتر اليومي اعتماداً على التدرجات البيداغوجية الرسمية
 * المحفوظة في قاعدة الدفتر (LOGBOOK_PROGRAMS)، وهي المرجع الوحيد لترتيب التعلمات:
 *
 * - الترتيب: ميدان -> مقطع -> مورد -> تعلم مورد -> أنشطة، كما ورد في التدرج الرسمي.
 * - المحتوى: عنوان النشاط ومشكلة الوحدة وتقويم المورد مأخوذة من قاعدة الدفتر.
 * - التدرج السنوي (التوزيع الوزاري) لا يحدد المحتوى، بل يحدد مواضع المحطات
 *   التقويمية فقط: التعارف والتقويم التشخيصي في البداية، ثم الفروض والاختبارات
 *   والمعالجة والتصحيح بعد آخر مورد تم بلوغه في التدرج.
 * - بذلك تُدرَّس كل وحدات البرنامج بالترتيب الرسمي دون إسقاط أي مقطع.
 */
export function buildPedagogicalStepsForLevel(
  level: LogbookLevel,
  sessionsPerActivity = 1,
  activitySessionsMap?: Record<string, number>
): PedagogicalStep[] {
  const program = LEVEL_PROGRAMS[level];
  const distRows = getAnnualDistributionRowsForLevel(level);

  // 1) استخراج المحطات التقويمية من التدرج السنوي وتحديد موضعها في تدرج البرنامج.
  type Checkpoint = { row: OfficialAnnualDistributionRow; afterUnit: number };
  const checkpoints: Checkpoint[] = [];
  let matchedCursor = -1;
  for (const row of distRows) {
    if (isHolidayRow(row)) continue;
    if (isCheckpointRow(row)) {
      checkpoints.push({ row, afterUnit: matchedCursor });
      continue;
    }
    const unitIndex = findProgramUnitIndex(row, program, matchedCursor);
    if (unitIndex >= 0) {
      matchedCursor = Math.max(matchedCursor, unitIndex);
      continue;
    }
    // صف تعلمي لم يُسند إلى وحدة: يُهمل إن كان تكراراً لنشاط موجود في القاعدة،
    // وإلا يبقى حصة قائمة بذاتها في موضعه من التدرج حتى لا يضيع أي محتوى رسمي.
    if (duplicatesProgramActivity([row.session1, row.session2].filter(Boolean).join('\n'), program)) continue;
    checkpoints.push({ row, afterUnit: matchedCursor });
  }

  const steps: PedagogicalStep[] = [];

  const pushCheckpoint = ({ row }: Checkpoint) => {
    const sessions = [
      { text: row.session1, num: 1 },
      { text: row.session2, num: 2 },
    ];
    for (const session of sessions) {
      let text = simplifyDistributionText(session.text || '');
      if (!text) continue;
      // توحيد مصطلح التعارف البيداغوجي لضمان التطابق مع التسمية الرسمية.
      if (!text.includes('التعارف') && text.includes('تعارف')) {
        text = text.replace('تعارف', 'التعارف');
      }
      const isIntroductory = /(تعارف|استقبال|توجيهات|تشخيصي)/.test(text) || Boolean(row.isIntroductory);
      const isReview = Boolean(row.isRemediation) ||
        /(معالجة|استدراك|إدماج|ادماج|تصحيح|مراجعة|فرض|اختبار|حصيلة|الوضعية الانطلاقية)/.test(text);
      const firstLine = (value?: string) => String(value || '').split(/\n+/)[0].trim();
      const rowMaqta = firstLine(row.maqta);
      const rowMawrid = firstLine(row.mawrid);
      steps.push({
        sourceLearningUnitId: row.sourceLearningUnitId || row.id || `${level}_checkpoint_${steps.length + 1}`,
        midan: firstLine(row.midan) || 'التقويم والمتابعة',
        maqta: rowMaqta || rowMawrid || 'محطة تقويمية',
        mawrid: rowMawrid || 'محطة تقويمية',
        ta3alom: firstLine(row.learningUnit) || rowMawrid || 'محطة تقويمية',
        moshkila: (row as { moshkila?: string }).moshkila || '',
        activityText: text,
        fullContent: text,
        sessionIndexInActivity: session.num,
        totalSessionsForActivity: 1,
        taqwim: row.taqwim || 'تقويم تكويني ومتابعة الإنجاز',
        isIntroductory,
        isReview,
        isPractical: false,
      });
    }
  };

  // 2) إدراج وحدات البرنامج بترتيبها الرسمي، مع حقن المحطات في مواضعها.
  program.forEach((unit, unitIndex) => {
    while (checkpoints.length && checkpoints[0].afterUnit < unitIndex) {
      pushCheckpoint(checkpoints.shift() as Checkpoint);
    }
    unit.activities.forEach((activity) => {
      const configuredSessions = Math.max(1, activitySessionsMap?.[activity] || sessionsPerActivity || 1);
      for (let sessionIndex = 1; sessionIndex <= configuredSessions; sessionIndex++) {
        let fullContent = activity;
        if (configuredSessions > 1) {
          fullContent = sessionIndex === 1
            ? `${activity} (الحصة 1: الانطلاق والتقصي)`
            : `متابعة ${activity} (الحصة ${sessionIndex}: ${sessionIndex === configuredSessions ? 'الاستنتاج والتركيب' : 'المتابعة والتقصي'})`;
        }
        steps.push({
          sourceLearningUnitId: unit.sourceLearningUnitId,
          midan: unit.midan,
          maqta: unit.maqta,
          mawrid: unit.mawrid,
          ta3alom: unit.ta3alom,
          moshkila: unit.moshkila,
          activityText: activity,
          fullContent,
          sessionIndexInActivity: sessionIndex,
          totalSessionsForActivity: configuredSessions,
          taqwim: unit.taqwim || 'تقويم تكويني ومتابعة الإنجاز',
          isPractical: LAB_PATTERN.test(activity),
        });
      }
    });
  });
  while (checkpoints.length) {
    pushCheckpoint(checkpoints.shift() as Checkpoint);
  }

  // 3) محطة ختامية احتياطية للإدماج والتقويم والمعالجة البيداغوجية لنهاية السنة.
  const finalReview = [
    'تمارين إدماجية ومعالجة التعثرات البيداغوجية الشاملة حول الكفاءات الختامية للمستوى',
    'تقويم المكتسبات وحل الوضعيات الإدماجية التقييمية وحصيلة التعلمات السنوية',
  ];
  finalReview.forEach((activity, index) => {
    steps.push({
      sourceLearningUnitId: `official_review_${level}_${index + 1}`,
      midan: 'الإدماج والتقويم',
      maqta: 'مراجعة التعلمات السنوية',
      mawrid: 'تقويم وإدماج الموارد الشاملة',
      ta3alom: 'تثبيت المكتسبات ومعالجة الصعوبات المسجلة أثناء التعلمات.',
      activityText: activity,
      fullContent: activity,
      sessionIndexInActivity: 1,
      totalSessionsForActivity: 1,
      taqwim: 'تقويم تشخيصي وتكويني لمعرفة مدى التحكم في التعلمات واستدراك الصعوبات.',
      isReview: true,
      isPractical: false,
    });
  });

  return steps;
}

export function formatTimeWithArrow(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr
    .replace(/\s*[-–—→←➔]\s*/g, ' ➔ ')
    .replace(/\s*➔\s*/g, ' ➔ ')
    .trim();
}

function getTimeMinutes(timeStr: string): number {
  if (!timeStr) return 9999;
  const match = timeStr.match(/(\d{1,2})[:h](\d{2})/i);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  return 9999;
}

export type CalendarEventType = 'holiday' | 'exam' | 'test' | 'official_exam';

export interface GenerateLogbookEntriesParams {
  startDate: string;
  /** Date from which the timetable is projected to estimate curriculum progress. */
  sequenceStartDate?: string;
  gridRows: TimetableGridRow[];
  period?: string;
  holidays?: HolidayEntry[];
  sessionsPerActivity?: number;
  activitySessionsMap?: Record<string, number>;
  curriculumDb?: any;
}

/**
 * توليد الدفتر اليومي بربط مباشر ودقيق بالتدرج السنوي الرسمي:
 * - يحترم الترتيب الفعلي لأنشطة التدرج السنوي (المستوى -> الميدان -> المقطع -> المورد -> الأنشطة).
 * - يوزع النشاط على عدد الحصص المطلوبة له قبل الانتقال إلى النشاط التالي.
 * - يراعي بدقة تاريخ بداية الدفتر، فلا يُنشئ أي حصص أو صفحات تسبقه.
 * - يراعي العطل المدرسية، الفروض، الاختبارات والامتحانات الرسمية.
 * - خلال فترة الفروض والاختبارات، يولد حصص تقويمية رسمية مع تجميد مؤشر الأنشطة التربوية لتستأنف بعد الامتحان مباشرة.
 */
/** End of the selected calendar period, exclusive. */
export function getLogbookPeriodEnd(startDate: string, period = 'سنة'): string {
  const date = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const days = period === 'أسبوع' || period === 'أسبوع واحد' ? 7
    : period === 'أسبوعين' ? 14 : period === 'شهر' ? 30
    : period === 'فصل' || period === 'ثلاثي' ? 90 : 365;
  date.setDate(date.getDate() + days);
  return formatDateToIsoString(date);
}

export function generateLogbookEntries({
  startDate,
  sequenceStartDate = startDate,
  gridRows,
  period = 'سنة',
  holidays = [],
  sessionsPerActivity = 1,
  activitySessionsMap,
}: GenerateLogbookEntriesParams): LogEntry[] {
  const endDate = getLogbookPeriodEnd(startDate, period);
  if (!startDate || !endDate) return [];
  const anchor = sequenceStartDate && sequenceStartDate < startDate ? sequenceStartDate : startDate;
  const anchorDate = new Date(`${anchor}T12:00:00`);
  if (Number.isNaN(anchorDate.getTime())) return [];
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  type Slot = { date: string; day: string; time: string; minutes: number; section: string;
    base: string; level: LogbookLevel; isGroup: boolean; group: number; exam?: HolidayEntry };
  type Job = { slots: Slot[] };
  const stepsByLevel: Record<LogbookLevel, PedagogicalStep[]> = {
    '1م': buildPedagogicalStepsForLevel('1م', sessionsPerActivity, activitySessionsMap),
    '2م': buildPedagogicalStepsForLevel('2م', sessionsPerActivity, activitySessionsMap),
    '3م': buildPedagogicalStepsForLevel('3م', sessionsPerActivity, activitySessionsMap),
    '4م': buildPedagogicalStepsForLevel('4م', sessionsPerActivity, activitySessionsMap),
  };
  const cursor: Record<string, number> = {};
  const result: LogEntry[] = [];
  const sunday = new Date(anchorDate);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  while (formatDateToIsoString(sunday) < endDate) {
    const slots: Slot[] = [];
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + dayIndex);
      const iso = formatDateToIsoString(date);
      if (iso < anchor || iso >= endDate) continue;
      const events = holidays.filter(h => iso >= h.startDate && iso <= (h.endDate || h.startDate));
      if (events.some(h => !h.type || h.type === 'holiday')) continue;
      const exam = events.find(h => h.type === 'exam' || h.type === 'test' || h.type === 'official_exam');
      for (const row of gridRows) {
        const section = row.cells?.[days[dayIndex]]?.trim();
        if (!section) continue;
        const info = extractGroupInfo(section);
        slots.push({ date: iso, day: days[dayIndex], time: row.time, minutes: getTimeMinutes(row.time),
          section, base: info.baseSection, level: info.level, isGroup: info.isGroup, group: info.groupNumber, exam });
      }
    }
    slots.sort((a, b) => a.date.localeCompare(b.date) || a.minutes - b.minutes);
    const jobs: Job[] = [];
    const used = new Set<Slot>();
    for (const slot of slots) {
      if (used.has(slot)) continue;
      used.add(slot);
      const partners = [slot];
      if (slot.isGroup) {
        // Only distinct groups of the same class and event share an activity.
        const groups = new Set([slot.group]);
        for (const other of slots) {
          if (used.has(other) || !other.isGroup || other.base !== slot.base || groups.has(other.group)) continue;
          if ((other.exam?.id || other.exam?.startDate || '') !== (slot.exam?.id || slot.exam?.startDate || '')) continue;
          partners.push(other);
          groups.add(other.group);
          used.add(other);
        }
      }
      jobs.push({ slots: partners });
    }
    jobs.sort((a, b) => a.slots[0].date.localeCompare(b.slots[0].date) || a.slots[0].minutes - b.slots[0].minutes);
    for (const { slots: jobSlots } of jobs) {
      const first = jobSlots[0];
      const sequence = stepsByLevel[first.level];
      const index = cursor[first.base] || 0;
      const step = sequence[Math.min(index, sequence.length - 1)];
      if (!first.exam) cursor[first.base] = Math.min(index + 1, sequence.length - 1);
      // A merged group can straddle the visible start date; keep its later groups,
      // but retain the activity assigned at the first group's actual date.
      const visible = jobSlots.filter(slot => slot.date >= startDate);
      if (!visible.length) continue;
      const sameDay = visible.every(slot => slot.date === visible[0].date);
      const isGroup = first.isGroup;
      const groupNums = visible.map(slot => slot.group);
      const uniqueGroupNums = Array.from(new Set(groupNums)).sort((a, b) => a - b);
      const dayName = sameDay ? visible[0].day : visible.map(slot => slot.day).join(' / ');
      const dateStr = sameDay ? visible[0].date : visible.map(slot => `${slot.date} (ف${slot.group})`).join(' / ');
      const time = visible.map(slot => `${formatTimeWithArrow(slot.time)}${isGroup ? ` (ف${slot.group})` : ''}`).join(' / ');
      const section = isGroup ? `${first.base} (${uniqueGroupNums.map(n => `فوج ${n}`).join(' + ')})` : first.base;
      const exam = first.exam;
      const examLabel = exam?.label || (exam?.type === 'test' ? 'فرض محروس رسمي' : 'اختبار فصلي رسمي');
      const content = exam ? examLabel : step.fullContent;
      const note = exam
        ? `حصة تقويمية — ${examLabel}`
        : isGroup
          ? (uniqueGroupNums.length > 1 ? 'عمل مخبري (أفواج 1 + 2)' : `عمل مخبري (فوج ${uniqueGroupNums[0]})`)
          : 'حصة جماعية (القسم كاملاً)';
      result.push({
        id: `${visible[0].date}-${first.base.replace(/\s+/g, '')}-${first.minutes}-${result.length}`,
        dayName, dateStr, time, section, level: first.level, content,
        midan: exam ? 'التقويم والامتحانات' : step.midan,
        maqta: exam ? examLabel : step.maqta,
        mawrid: exam ? examLabel : step.mawrid,
        ta3alom: exam ? examLabel : step.ta3alom,
        moshkila: exam ? undefined : step.moshkila,
        activitiesList: [content],
        taqwim: exam ? 'تقويم تحصيلي لمراقبة الكفاءات' : step.taqwim || 'تقويم تكويني ومتابعة الإنجاز',
        note,
        lessonType: exam ? 'assessment' : step.isIntroductory ? 'introductory' : step.isReview ? 'remediation' : 'curriculum',
        resourceIndex: index + 1,
        sourceLearningUnitId: exam ? `exam_${exam.startDate}` : step.sourceLearningUnitId,
      });
    }
    sunday.setDate(sunday.getDate() + 7);
  }
  return result.sort((a, b) => a.dateStr.slice(0, 10).localeCompare(b.dateStr.slice(0, 10)) || getTimeMinutes(a.time) - getTimeMinutes(b.time));
}
