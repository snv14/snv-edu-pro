import { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';
import {
  OFFICIAL_1AM_DISTRIBUTION,
  OFFICIAL_2AM_DISTRIBUTION,
  OFFICIAL_3AM_DISTRIBUTION,
  OFFICIAL_4AM_DISTRIBUTION,
  type OfficialAnnualDistributionRow,
} from '../data/officialAnnualDistributionData';
import { ANNUAL_STORAGE_KEY } from './annualDistributionDateUtils';
import { DAILY_LOGBOOK_PROGRAM_1AM, type DailyLogbookProgramItem } from '../data/dailyLogbookProgram1am';
import { DAILY_LOGBOOK_PROGRAM_2AM } from '../data/dailyLogbookProgram2am';
import { DAILY_LOGBOOK_PROGRAM_3AM } from '../data/dailyLogbookProgram3am';
import { DAILY_LOGBOOK_PROGRAM_4AM } from '../data/dailyLogbookProgram4am';

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
  '1م': DAILY_LOGBOOK_PROGRAM_1AM,
  '2م': DAILY_LOGBOOK_PROGRAM_2AM,
  '3م': DAILY_LOGBOOK_PROGRAM_3AM,
  '4م': DAILY_LOGBOOK_PROGRAM_4AM,
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

/**
 * بناء التسلسل الفعلي لأنشطة الدفتر اليومي بالربط التام والمباشر مع التدرج السنوي الرسمي:
 * - يحترم بدقة الترتيب الزمني للتدرج (أسبوع بأسبوع، حصة أولى ثم حصة ثانية).
 * - يضمن التطابق الحرفي لعناوين الميادين والمقاطع والموارد والأنشطة والتقويمات.
 * - يوزع النشاط على عدد الحصص المطلوبة له قبل الانتقال إلى النشاط التالي.
 */
export function buildPedagogicalStepsForLevel(
  level: LogbookLevel,
  sessionsPerActivity = 1,
  activitySessionsMap?: Record<string, number>
): PedagogicalStep[] {
  const steps: PedagogicalStep[] = [];
  const distRows = getAnnualDistributionRowsForLevel(level);

  // استبعاد العطل المدرسية من قائمة الحصص التعلمية الفعلية (العطل تُدار عبر الرزنامة وجدول التوقيت)
  const activeRows = distRows.filter((r) => {
    const isHoliday = Boolean(
      r.isHoliday ||
      /عطلة/.test(r.session1 || '') ||
      /عطلة/.test(r.mawrid || '') ||
      /عطلة/.test(r.maqta || '')
    );
    return !isHoliday;
  });

  for (const r of activeRows) {
    const weekNum = r.week || 1;
    const isWeek1 = weekNum === 1 || weekNum === '1';

    const sessions = [
      { text: r.session1, num: 1 },
      { text: r.session2, num: 2 },
    ];

    for (const s of sessions) {
      if (!s.text || !s.text.trim()) continue;
      let text = s.text.trim();

      // توحيد مصطلح التعارف البيداغوجي لضمان التطابق مع التسمية الرسمية
      if (isWeek1 && !/التعارف/.test(text)) {
        if (/تعارف/.test(text)) {
          text = text.replace(/تعارف/, 'التعارف');
        } else if (/استقبال|توجيهات|الافتتاح/.test(text)) {
          text = `التعارف، ${text}`;
        }
      }

      // تصنيف الحصة البيداغوجية
      const isIntroductory = isWeek1 && (/التعارف|تعارف|استقبال|توجيهات/.test(text) || Boolean(r.isIntroductory));
      const isReview = Boolean(
        r.isRemediation ||
        /معالجة بيداغوجية|إدماج|ادماج|استدراك|حل الوضعية الانطلاقية|تصحيح الاختبارات/.test(text) ||
        /معالجة|إدماج/.test(r.mawrid || '')
      );
      const isLab = /تحليل|الكشف|تجربة|مخبر|تشريح|ملاحظة مجهرية|فصل|كواشف|هضم كيميائي|البلعمة|مجهر|معاينة/i.test(text);
      const isExam = Boolean(r.isExam || /إ?ختبار|فرض/.test(text));

      // استخراج المشكلة المطروحة إن وجدت في نص الحصة
      let moshkila = (r as any).moshkila || '';
      if (!moshkila && /المشكلة(?:\s+المطروحة)?\s*:\s*/.test(text)) {
        const m = text.match(/المشكلة(?:\s+المطروحة)?\s*:\s*([^–\-]+?)(?:[–\-]\s*(?:النشاط|المورد)|$)/i);
        if (m) moshkila = m[1].trim();
      }

      // الحصص الافتتاحية والتقويمية وحصص المعالجة لا تُمدد لعدة حصص متتالية
      const configuredSessions = (isIntroductory || isReview || isExam)
        ? 1
        : Math.max(1, (activitySessionsMap?.[text] || sessionsPerActivity || 1));

      for (let sIdx = 1; sIdx <= configuredSessions; sIdx++) {
        let fullContent = text;
        if (configuredSessions > 1) {
          if (sIdx === 1) {
            fullContent = `${text} (الحصة 1: الانطلاق والتقصي)`;
          } else {
            fullContent = `متابعة ${text} (الحصة ${sIdx}: ${sIdx === configuredSessions ? 'الاستنتاج والتركيب' : 'المتابعة والتقصي'})`;
          }
        }

        const sourceId = r.sourceLearningUnitId || r.id || `${level}_official_w${weekNum}_s${s.num}`;

        steps.push({
          sourceLearningUnitId: sourceId,
          midan: r.midan || 'علوم الطبيعة والحياة',
          maqta: r.maqta || r.mawrid || 'المقطع التعلمي',
          mawrid: r.mawrid || r.learningUnit || 'المورد التعلمي',
          ta3alom: r.learningUnit || r.mawrid || 'تعلم المورد',
          moshkila,
          activityText: text,
          fullContent,
          sessionIndexInActivity: sIdx,
          totalSessionsForActivity: configuredSessions,
          taqwim: r.taqwim || 'تقويم تكويني ومتابعة الإنجاز',
          isIntroductory,
          isReview,
          isPractical: isLab,
        });
      }
    }
  }

  // محطة ختامية احتياطية للإدماج والتقويم والمعالجة البيداغوجية لنهاية السنة
  const finalReview = [
    'تمارين إدماجية ومعالجة التعثرات البيداغوجية الشاملة حول الكفاءات الختامية للمستوى',
    'تقويم المكتسبات وحل الوضعيات الإدماجية التقييمية وحصيلة التعلمات السنوية',
  ];
  finalReview.forEach((act, actIdx) => {
    steps.push({
      sourceLearningUnitId: `official_review_${level}_${actIdx + 1}`,
      midan: 'الإدماج والتقويم',
      maqta: 'مراجعة التعلمات السنوية',
      mawrid: 'تقويم وإدماج الموارد الشاملة',
      ta3alom: 'تثبيت المكتسبات ومعالجة الصعوبات المسجلة أثناء التعلمات.',
      activityText: act,
      fullContent: act,
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
