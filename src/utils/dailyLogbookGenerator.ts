import { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';
import { DAILY_LOGBOOK_PROGRAM_1AM, type DailyLogbookProgramItem } from '../data/dailyLogbookProgram1am';
import { DAILY_LOGBOOK_PROGRAM_2AM } from '../data/dailyLogbookProgram2am';
import { DAILY_LOGBOOK_PROGRAM_3AM } from '../data/dailyLogbookProgram3am';
import { DAILY_LOGBOOK_PROGRAM_4AM } from '../data/dailyLogbookProgram4am';

/** A merged group row may contain more than one ISO date. */
export function isLogbookRowOnOrAfter(dateStr: string, startDate: string): boolean {
  const dates = dateStr.match(/\d{4}-\d{2}-\d{2}/g) || [];
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

const LEVEL_PROGRAMS: Record<LogbookLevel, DailyLogbookProgramItem[]> = {
  '1م': DAILY_LOGBOOK_PROGRAM_1AM,
  '2م': DAILY_LOGBOOK_PROGRAM_2AM,
  '3م': DAILY_LOGBOOK_PROGRAM_3AM,
  '4م': DAILY_LOGBOOK_PROGRAM_4AM,
};

/**
 * بناء التسلسل الفعلي لأنشطة التدرج السنوي وفق المستوى والميدان والمقطع والمورد،
 * مع توزيع كل نشاط على عدد الحصص المطلوبة له قبل الانتقال إلى النشاط التالي.
 */
export function buildPedagogicalStepsForLevel(
  level: LogbookLevel,
  sessionsPerActivity = 1,
  activitySessionsMap?: Record<string, number>
): PedagogicalStep[] {
  const steps: PedagogicalStep[] = [];

  // 1. أسبوع الافتتاح: التعارف والصحة المدرسية
  const introActivities = [
    'التعارف بين الأستاذ والتلاميذ وتقديم برنامج مادة علوم الطبيعة والحياة وطريقة العمل وتنظيم الكراس',
    'قواعد الأمن والنظافة والمحافظة على الصحة المدرسية والوقاية داخل المخبر العلمي',
  ];

  introActivities.forEach((act, actIdx) => {
    steps.push({
      sourceLearningUnitId: `daily_logbook_intro_${level}_${actIdx + 1}`,
      midan: 'التحضير للدخول المدرسي',
      maqta: 'الافتتاح والتعارف',
      mawrid: 'التعارف والصحة المدرسية',
      ta3alom: 'التعارف بين الأستاذ والتلاميذ، تقديم المادة، وقواعد الأمن والنظافة والصحة المدرسية.',
      activityText: act,
      fullContent: act,
      sessionIndexInActivity: 1,
      totalSessionsForActivity: 1,
      taqwim: 'التعرف على التلاميذ والتذكير بقواعد النظافة والأمن والانضباط داخل المخبر والمؤسسة.',
      isIntroductory: true,
      isPractical: actIdx === 1,
    });
  });

  // 2. وحدات المنهاج والتدرج السنوي الرسمي
  const rawUnits = LEVEL_PROGRAMS[level] || LEVEL_PROGRAMS['1م'];

  rawUnits.forEach((unit) => {
    const validActivities = (unit.activities || []).filter((a) => Boolean(a && a.trim()));
    const activitiesToUse = validActivities.length > 0 ? validActivities : [unit.ta3alom || unit.mawrid || 'نشاط تعلمي'];

    activitiesToUse.forEach((act) => {
      // عدد الحصص المخصصة لهذا النشاط
      const isLab = /تحليل|الكشف|تجربة|مخبر|تشريح|ملاحظة مجهرية|فصل|كواشف|هضم كيميائي|البلعمة/i.test(act);
      const configuredSessions = activitySessionsMap?.[act] || sessionsPerActivity;
      const totalSessions = Math.max(1, configuredSessions || 1);

      for (let sIdx = 1; sIdx <= totalSessions; sIdx++) {
        let sessionContent = act;
        if (totalSessions > 1) {
          if (sIdx === 1) {
            sessionContent = `${act} (الحصة 1: الانطلاق والتقصي)`;
          } else {
            sessionContent = `متابعة ${act} (الحصة ${sIdx}: ${sIdx === totalSessions ? 'الاستنتاج والتركيب' : 'المتابعة والتقصي'})`;
          }
        }

        steps.push({
          sourceLearningUnitId: unit.sourceLearningUnitId,
          midan: unit.midan,
          maqta: unit.maqta,
          mawrid: unit.mawrid,
          ta3alom: unit.ta3alom,
          moshkila: unit.moshkila,
          activityText: act,
          fullContent: sessionContent,
          sessionIndexInActivity: sIdx,
          totalSessionsForActivity: totalSessions,
          taqwim: unit.taqwim,
          isPractical: isLab,
        });
      }
    });
  });

  // 3. محطة الإدماج والتقويم والمعالجة البيداغوجية
  const reviewActivities = [
    'تمارين إدماجية ومعالجة التعثرات البيداغوجية حول المكتسبات السابقة',
    'تقويم المكتسبات وحل الوضعيات الإدماجية التقييمية',
  ];

  reviewActivities.forEach((act, actIdx) => {
    steps.push({
      sourceLearningUnitId: `daily_logbook_review_${level}_${actIdx + 1}`,
      midan: 'الإدماج والتقويم',
      maqta: 'مراجعة التعلمات',
      mawrid: 'تقويم وإدماج الموارد',
      ta3alom: 'تثبيت المكتسبات ومعالجة الصعوبات المسجلة أثناء التعلمات.',
      activityText: act,
      fullContent: act,
      sessionIndexInActivity: 1,
      totalSessionsForActivity: 1,
      taqwim: 'تقويم تشخيصي وتكويني لمعرفة مدى التحكم في التعلمات واستدراك الصعوبات.',
      isReview: true,
      isPractical: actIdx === 1,
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
