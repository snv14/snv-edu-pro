import type { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';
import {
  logbookProgressionOf,
  type PedagogicalUnitRecord,
} from '../data/logbook';

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
  progressionUnitId: string;
  progressionOrder: number;
  midan: string;
  maqta: string;
  sectionGroup?: string;
  mawrid: string;
  ta3alom: string;
  moshkila?: string;
  activityText: string;
  fullContent: string;
  sessionIndexInActivity: number;
  totalSessionsForActivity: number;
  sessionNumberInUnit: number;
  totalSessionsInUnit: number;
  irsaaText?: string;
  taqwim?: string;
  officialDurationSessions: number | null;
  sourceFile: {
    pdfPath: string;
    sourcePage: number;
  };
  isIntroductory?: boolean;
  isReview?: boolean;
  isPractical?: boolean;
}

/**
 * توزيع عدد حصص وحدة تعليمية واحدة على أنشطتها دون حذف أو تكرار:
 * - إن لم يحدد الأستاذ مدة مخصصة للوحدة، يأخذ كل نشاط `sessionsPerActivity` (أو مخصص النشاط).
 * - إن حدد الأستاذ مدة مخصصة للوحدة (`unitSessionsMap[unit.id]`):
 *   • إن كانت أكبر من أو تساوي عدد الأنشطة، تتوزع الحصص بالتوازن على الأنشطة.
 *   • إن كانت أصغر (مثلاً حصة واحدة لوحدة فيها نشاطان)، تُدمج الأنشطة في حصة واحدة دون حذف أي نشاط.
 */
function resolveUnitActivityBuckets(
  unit: PedagogicalUnitRecord,
  sessionsPerActivity: number,
  activitySessionsMap?: Record<string, number>,
  unitSessionsMap?: Record<string, number>
): Array<{ activityText: string; sessionCount: number }> {
  const rawActivities = unit.activities.length > 0 ? unit.activities : [unit.ta3alom || unit.mawrid];
  const explicitUnitTotal = unitSessionsMap?.[unit.id];

  if (typeof explicitUnitTotal === 'number' && Number.isFinite(explicitUnitTotal) && explicitUnitTotal >= 1) {
    const targetTotal = Math.max(1, Math.round(explicitUnitTotal));
    if (targetTotal < rawActivities.length) {
      // Compress all activities cleanly into targetTotal buckets without losing any activity text
      const buckets: string[][] = Array.from({ length: targetTotal }, () => []);
      rawActivities.forEach((act, idx) => {
        const bucketIdx = Math.min(targetTotal - 1, Math.floor((idx * targetTotal) / rawActivities.length));
        buckets[bucketIdx].push(act);
      });
      return buckets.map((acts) => ({
        activityText: acts.join(' + '),
        sessionCount: 1,
      }));
    }
    const baseCount = Math.floor(targetTotal / rawActivities.length);
    const remainder = targetTotal % rawActivities.length;
    return rawActivities.map((act, idx) => ({
      activityText: act,
      sessionCount: baseCount + (idx < remainder ? 1 : 0),
    }));
  }

  return rawActivities.map((act, idx) => {
    const perUnitAct = unitSessionsMap?.[`${unit.id}::${idx}`];
    const perAct = activitySessionsMap?.[act];
    const count = Math.max(1, Math.round(perUnitAct ?? perAct ?? sessionsPerActivity ?? 1));
    return { activityText: act, sessionCount: count };
  });
}

/**
 * بناء تسلسل الحصص البيداغوجية للدفتر الرقمي حصرياً من قاعدة التدرج البيداغوجي المعتمدة للمستوى:
 * - يحترم حرفياً الترتيب التصاعدي الرسمي (`order: 1..N`) دون أي تقديم أو تأخير.
 * - لا يختلق حصص تعارف ولا مراجعات نهائية غير موجودة في ملف التدرج.
 * - يحفظ المرجع المصدري (`pdfPath`, `sourcePage`) ومعرف الوحدة (`unit.id`).
 * - يوضح صراحة أن المدد الزمنية قابلة للتخصيص من الأستاذ لغياب مدد محددة في الوثائق المرفقة.
 */
export function buildPedagogicalStepsForLevel(
  level: LogbookLevel,
  sessionsPerActivity = 1,
  activitySessionsMap?: Record<string, number>,
  unitSessionsMap?: Record<string, number>,
  customUnitsOverride?: PedagogicalUnitRecord[]
): PedagogicalStep[] {
  let units: PedagogicalUnitRecord[];
  if (Array.isArray(customUnitsOverride)) {
    units = customUnitsOverride;
  } else {
    const lookup = logbookProgressionOf(level);
    if (!lookup.available || lookup.units.length === 0) {
      return [];
    }
    units = lookup.units;
  }

  const orderedUnits = [...units].sort((a, b) => a.order - b.order);
  const steps: PedagogicalStep[] = [];

  for (const unit of orderedUnits) {
    const buckets = resolveUnitActivityBuckets(unit, sessionsPerActivity, activitySessionsMap, unitSessionsMap);
    const totalSessionsInUnit = buckets.reduce((sum, b) => sum + b.sessionCount, 0);
    let sessionNumberInUnit = 0;

    for (const bucket of buckets) {
      const isPractical = /تحليل|الكشف|تجربة|مخبر|تشريح|ملاحظة مجهرية|فصل|كواشف|هضم|البلعمة|مجهر|معاينة|تفاعل|بنية/i.test(
        bucket.activityText
      );
      const totalSessionsForActivity = bucket.sessionCount;

      for (let sIdx = 1; sIdx <= totalSessionsForActivity; sIdx++) {
        sessionNumberInUnit += 1;
        const isFinalSessionInUnit = sessionNumberInUnit === totalSessionsInUnit;
        let fullContent = bucket.activityText;

        if (totalSessionsForActivity > 1) {
          if (sIdx === 1) {
            fullContent = `${bucket.activityText} (الحصة 1 من ${totalSessionsForActivity}: الانطلاق والتقصي)`;
          } else if (sIdx === totalSessionsForActivity) {
            fullContent = `استكمال وإنهاء ${bucket.activityText} (الحصة ${sIdx} من ${totalSessionsForActivity}: الاستنتاج والتركيب)`;
          } else {
            fullContent = `متابعة ${bucket.activityText} (الحصة ${sIdx} من ${totalSessionsForActivity}: المتابعة والتجريب)`;
          }
        }

        steps.push({
          sourceLearningUnitId: unit.id,
          progressionUnitId: unit.id,
          progressionOrder: unit.order,
          midan: unit.midan,
          maqta: unit.maqta,
          sectionGroup: unit.sectionGroup,
          mawrid: unit.mawrid,
          ta3alom: unit.ta3alom,
          moshkila: unit.moshkila,
          activityText: bucket.activityText,
          fullContent,
          sessionIndexInActivity: sIdx,
          totalSessionsForActivity,
          sessionNumberInUnit,
          totalSessionsInUnit,
          irsaaText: isFinalSessionInUnit && unit.hasIrsaaMawrid ? (unit.irsaaText || 'إرساء المورد') : undefined,
          taqwim: isFinalSessionInUnit ? unit.taqwim : undefined,
          officialDurationSessions: unit.officialDurationSessions,
          sourceFile: unit.sourceFile,
          isPractical,
        });
      }
    }
  }

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

function getEndTimeMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const matches = Array.from(timeStr.matchAll(/(\d{1,2})[:h](\d{2})/gi));
  if (matches.length >= 2) {
    return parseInt(matches[1][1], 10) * 60 + parseInt(matches[1][2], 10);
  }
  return null;
}

/**
 * التحقق من أن الحصة تقع حصراً ضمن فترات الدوام الرسمي المعتمد (الصباح 08:00-12:00 أو المساء 13:30-17:30).
 */
export function isValidTimetablePeriod(timeStr: string): boolean {
  const start = getTimeMinutes(timeStr);
  if (start === 9999) return false;
  const end = getEndTimeMinutes(timeStr);
  const inMorning = start >= 8 * 60 && start < 12 * 60 && (end === null || end <= 12 * 60);
  const inAfternoon = start >= 13 * 60 + 30 && start < 17 * 60 + 30 && (end === null || end <= 17 * 60 + 30);
  return inMorning || inAfternoon;
}

export type CalendarEventType = 'holiday' | 'exam' | 'test' | 'official_exam';

export interface GenerateLogbookEntriesParams {
  startDate: string;
  /** Date from which the timetable is projected to estimate curriculum progress. Defaults to startDate. */
  sequenceStartDate?: string;
  gridRows: TimetableGridRow[];
  period?: string;
  holidays?: HolidayEntry[];
  sessionsPerActivity?: number;
  activitySessionsMap?: Record<string, number>;
  unitSessionsMap?: Record<string, number>;
  curriculumDb?: any;
}

/** End of the selected calendar period, exclusive. */
export function getLogbookPeriodEnd(startDate: string, period = 'سنة'): string {
  const date = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const days =
    period === 'أسبوع' || period === 'أسبوع واحد'
      ? 7
      : period === 'أسبوعين'
      ? 14
      : period === 'شهر'
      ? 30
      : period === 'فصل' || period === 'ثلاثي'
      ? 90
      : 365;
  date.setDate(date.getDate() + days);
  return formatDateToIsoString(date);
}

function getWeekNumberFromAnchor(dateIso: string, anchorIso: string): number {
  const a = new Date(`${anchorIso}T12:00:00`);
  const d = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(d.getTime())) return 1;
  a.setDate(a.getDate() - a.getDay());
  d.setDate(d.getDate() - d.getDay());
  const diffDays = Math.round((d.getTime() - a.getTime()) / 86400000);
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function generateLogbookEntries({
  startDate,
  sequenceStartDate = startDate,
  gridRows,
  period = 'سنة',
  holidays = [],
  sessionsPerActivity = 1,
  activitySessionsMap,
  unitSessionsMap,
}: GenerateLogbookEntriesParams): LogEntry[] {
  const endDate = getLogbookPeriodEnd(startDate, period);
  if (!startDate || !endDate) return [];
  const anchor = sequenceStartDate && sequenceStartDate < startDate ? sequenceStartDate : startDate;
  const anchorDate = new Date(`${anchor}T12:00:00`);
  if (Number.isNaN(anchorDate.getTime())) return [];

  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const validGridRows = gridRows.filter((r) => isValidTimetablePeriod(r.time));

  type Slot = {
    date: string;
    day: string;
    time: string;
    minutes: number;
    section: string;
    base: string;
    level: LogbookLevel;
    isGroup: boolean;
    group: number;
    exam?: HolidayEntry;
  };
  type Job = { slots: Slot[] };

  const stepsByLevel: Record<LogbookLevel, PedagogicalStep[]> = {
    '1م': buildPedagogicalStepsForLevel('1م', sessionsPerActivity, activitySessionsMap, unitSessionsMap),
    '2م': buildPedagogicalStepsForLevel('2م', sessionsPerActivity, activitySessionsMap, unitSessionsMap),
    '3م': buildPedagogicalStepsForLevel('3م', sessionsPerActivity, activitySessionsMap, unitSessionsMap),
    '4م': buildPedagogicalStepsForLevel('4م', sessionsPerActivity, activitySessionsMap, unitSessionsMap),
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
      const events = holidays.filter((h) => iso >= h.startDate && iso <= (h.endDate || h.startDate));
      if (events.some((h) => !h.type || h.type === 'holiday')) continue;
      const exam = events.find((h) => h.type === 'exam' || h.type === 'test' || h.type === 'official_exam');
      for (const row of validGridRows) {
        const section = row.cells?.[days[dayIndex]]?.trim();
        if (!section) continue;
        const info = extractGroupInfo(section);
        slots.push({
          date: iso,
          day: days[dayIndex],
          time: row.time,
          minutes: getTimeMinutes(row.time),
          section,
          base: info.baseSection,
          level: info.level,
          isGroup: info.isGroup,
          group: info.groupNumber,
          exam,
        });
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

      // If no pedagogical progression exists for this year and it's not an exam, do not invent lessons
      if (sequence.length === 0 && !first.exam) continue;

      // نهاية التدرج: لا تُعاد آخر حصة على بقية خانات السنة. الخانات بعد آخر
      // نشاط منهجي تبقى بلا صف بدل تكرار آخر درس، والحصص التقويمية تبقى كما هي.
      if (!first.exam && index >= sequence.length) continue;

      const step = first.exam ? undefined : sequence[index];
      if (!first.exam) cursor[first.base] = index + 1;

      const visible = jobSlots.filter((slot) => slot.date >= startDate);
      if (!visible.length) continue;

      const sameDay = visible.every((slot) => slot.date === visible[0].date);
      const isGroup = first.isGroup;
      const groupNums = visible.map((slot) => slot.group);
      const uniqueGroupNums = Array.from(new Set(groupNums)).sort((a, b) => a - b);
      const dayName = sameDay ? visible[0].day : visible.map((slot) => slot.day).join(' / ');
      const dateStr = sameDay ? visible[0].date : visible.map((slot) => `${slot.date} (ف${slot.group})`).join(' / ');
      const time = visible.map((slot) => `${formatTimeWithArrow(slot.time)}${isGroup ? ` (ف${slot.group})` : ''}`).join(' / ');
      const section = isGroup ? `${first.base} (${uniqueGroupNums.map((n) => `فوج ${n}`).join(' + ')})` : first.base;
      const exam = first.exam;
      const examLabel = exam?.label || (exam?.type === 'test' ? 'فرض محروس رسمي' : 'اختبار فصلي رسمي');
      const content = exam ? examLabel : step!.fullContent;
      const weekNumber = getWeekNumberFromAnchor(visible[0].date, anchor);

      const sessionTag =
        !exam && step && step.totalSessionsInUnit > 1
          ? ` — الحصة ${step.sessionNumberInUnit} من ${step.totalSessionsInUnit}`
          : '';
      const note = exam
        ? `حصة تقويمية — ${examLabel}`
        : isGroup
        ? `${uniqueGroupNums.length > 1 ? 'عمل مخبري (أفواج 1 + 2)' : `عمل مخبري (فوج ${uniqueGroupNums[0]})`}${sessionTag}`
        : `حصة جماعية (القسم كاملاً)${sessionTag}`;

      result.push({
        id: `${visible[0].date}-${first.base.replace(/\s+/g, '')}-${first.minutes}-${result.length}`,
        dayName,
        dateStr,
        time,
        section,
        level: first.level,
        content,
        midan: exam ? 'التقويم والامتحانات' : step!.midan,
        maqta: exam ? examLabel : step!.maqta,
        sectionGroup: exam ? undefined : step!.sectionGroup,
        mawrid: exam ? examLabel : step!.mawrid,
        ta3alom: exam ? examLabel : step!.ta3alom,
        moshkila: exam ? undefined : step!.moshkila,
        activitiesList: [content],
        irsaaText: exam ? undefined : step!.irsaaText,
        taqwim: exam ? 'تقويم تحصيلي لمراقبة الكفاءات' : step!.taqwim,
        note,
        lessonType: exam ? 'assessment' : 'curriculum',
        resourceIndex: index + 1,
        sourceLearningUnitId: exam ? `exam_${exam.startDate}` : step!.sourceLearningUnitId,
        progressionUnitId: exam ? undefined : step!.progressionUnitId,
        progressionOrder: exam ? undefined : step!.progressionOrder,
        weekNumber,
        sessionNumberInUnit: exam ? undefined : step!.sessionNumberInUnit,
        totalSessionsInUnit: exam ? undefined : step!.totalSessionsInUnit,
        sessionNumberInActivity: exam ? undefined : step!.sessionIndexInActivity,
        totalSessionsInActivity: exam ? undefined : step!.totalSessionsForActivity,
        completionStatus: 'scheduled',
        sourceFile: exam ? undefined : step!.sourceFile,
        officialDurationSessions: exam ? null : step!.officialDurationSessions,
      });
    }

    sunday.setDate(sunday.getDate() + 7);
  }

  return result.sort(
    (a, b) => a.dateStr.slice(0, 10).localeCompare(b.dateStr.slice(0, 10)) || getTimeMinutes(a.time) - getTimeMinutes(b.time)
  );
}

export interface ReorganizeSessionsParams {
  rows: LogEntry[];
  anchorRowId: string;
  extraSessionsForUnit?: number;
  newStatus?: 'scheduled' | 'in_progress' | 'completed' | 'postponed';
  startDate: string;
  sequenceStartDate?: string;
  gridRows: TimetableGridRow[];
  period?: string;
  holidays?: HolidayEntry[];
  sessionsPerActivity?: number;
  activitySessionsMap?: Record<string, number>;
  unitSessionsMap?: Record<string, number>;
}

export interface ReorganizeSessionsResult {
  updatedRows: LogEntry[];
  changedCount: number;
  updatedUnitSessionsMap: Record<string, number>;
}

/**
 * إعادة تنظيم وترحيل الحصص اللاحقة تلقائياً داخل أوقات استعمال الزمن الأسبوعي فقط:
 * - يحتفظ بالحصة المحددة والحصص السابقة أو المنجزة (completed) كما هي.
 * - عند تمديد درس أو تأجيل حصة (postponed / in_progress + extraSessionsForUnit)،
 *   يعيد إسقاط الحصص اللاحقة غير المنجزة بالترتيب الزمني الرسمي على خانات استعمال الزمن المتاحة.
 * - لا يغيّر ترتيب أو محتوى التدرج البيداغوجي المصدري.
 */
export function reorganizeSubsequentSessions({
  rows,
  anchorRowId,
  extraSessionsForUnit = 0,
  newStatus,
  startDate,
  sequenceStartDate,
  gridRows,
  period = 'سنة',
  holidays = [],
  sessionsPerActivity = 1,
  activitySessionsMap,
  unitSessionsMap = {},
}: ReorganizeSessionsParams): ReorganizeSessionsResult {
  const anchorIdx = rows.findIndex((r) => r.id === anchorRowId);
  if (anchorIdx === -1) {
    return { updatedRows: rows, changedCount: 0, updatedUnitSessionsMap: unitSessionsMap };
  }

  const anchorRow = rows[anchorIdx];
  const anchorBase = getBaseSection(anchorRow.section);
  const anchorDateIso = (anchorRow.dateStr.match(/\d{4}-\d{2}-\d{2}/) || [startDate])[0];
  const nextUnitSessionsMap: Record<string, number> = { ...unitSessionsMap };

  const unitId = anchorRow.progressionUnitId || anchorRow.sourceLearningUnitId;
  if (unitId && extraSessionsForUnit > 0) {
    const levelSteps = buildPedagogicalStepsForLevel(
      (anchorRow.level as LogbookLevel) || '1م',
      sessionsPerActivity,
      activitySessionsMap,
      nextUnitSessionsMap
    );
    const currentUnitStepsCount = levelSteps.filter((s) => s.progressionUnitId === unitId).length || 1;
    nextUnitSessionsMap[unitId] = currentUnitStepsCount + extraSessionsForUnit;
  }

  const regenerated = generateLogbookEntries({
    startDate,
    sequenceStartDate: sequenceStartDate || startDate,
    gridRows,
    period,
    holidays,
    sessionsPerActivity,
    activitySessionsMap,
    unitSessionsMap: nextUnitSessionsMap,
  });

  // Collect all slots for anchorBase strictly after anchorRow, plus the updated anchor row itself
  const isSameSlot = (a: LogEntry, b: LogEntry) =>
    a.dateStr === b.dateStr && a.time === b.time && getBaseSection(a.section) === getBaseSection(b.section);

  const regenByKey = new Map<string, LogEntry>();
  for (const r of regenerated) {
    regenByKey.set(`${r.dateStr}|${r.time}|${getBaseSection(r.section)}`, r);
  }

  let changedCount = 0;
  const updatedRows = rows.map((row, idx) => {
    const rowBase = getBaseSection(row.section);
    if (row.id === anchorRowId) {
      const nextNote =
        newStatus === 'postponed'
          ? `${row.note ? `${row.note} — ` : ''}مؤجلة (ترحيل تلقائي للحصص اللاحقة)`
          : extraSessionsForUnit > 0
          ? `${row.note ? `${row.note} — ` : ''}ممددة (+${extraSessionsForUnit} حصة)`
          : row.note;
      changedCount += 1;
      return {
        ...row,
        completionStatus: newStatus || row.completionStatus || 'in_progress',
        note: nextNote,
        manualEdited: true,
      };
    }

    if (idx <= anchorIdx || rowBase !== anchorBase) {
      return row;
    }

    // Preserve already completed or manually absent records
    if (row.completionStatus === 'completed' || row.attendance) {
      return row;
    }

    const rowDateIso = (row.dateStr.match(/\d{4}-\d{2}-\d{2}/) || [''])[0];
    if (rowDateIso < anchorDateIso) return row;

    const key = `${row.dateStr}|${row.time}|${rowBase}`;
    const replacement = regenByKey.get(key);
    if (replacement) {
      // If postponed (not completed) and no extra sessions added yet, keep progression shifted by finding the previous slot's content
      if (replacement.content !== row.content || replacement.sourceLearningUnitId !== row.sourceLearningUnitId) {
        changedCount += 1;
        return {
          ...replacement,
          id: row.id,
          completionStatus: row.completionStatus || 'scheduled',
        };
      }
    }
    return row;
  });

  // Also handle pure postponement shift without extraSessionsForUnit: shift uncompleted curriculum entries for this class forward by 1 timetable slot
  if (newStatus === 'postponed' && extraSessionsForUnit === 0) {
    const classFutureIndices: number[] = [];
    for (let i = anchorIdx; i < updatedRows.length; i++) {
      const r = updatedRows[i];
      if (getBaseSection(r.section) !== anchorBase) continue;
      if (r.lessonType === 'assessment') continue;
      if (i > anchorIdx && (r.completionStatus === 'completed' || r.attendance)) continue;
      classFutureIndices.push(i);
    }
    if (classFutureIndices.length >= 2) {
      // Snapshot pedagogical payloads starting from anchorIdx
      const payloads = classFutureIndices.map((idx) => {
        const src = rows[idx];
        return {
          content: src.content,
          midan: src.midan,
          maqta: src.maqta,
          sectionGroup: src.sectionGroup,
          mawrid: src.mawrid,
          ta3alom: src.ta3alom,
          moshkila: src.moshkila,
          activitiesList: src.activitiesList,
          irsaaText: src.irsaaText,
          taqwim: src.taqwim,
          resourceIndex: src.resourceIndex,
          sourceLearningUnitId: src.sourceLearningUnitId,
          progressionUnitId: src.progressionUnitId,
          progressionOrder: src.progressionOrder,
          sessionNumberInUnit: src.sessionNumberInUnit,
          totalSessionsInUnit: src.totalSessionsInUnit,
          sessionNumberInActivity: src.sessionNumberInActivity,
          totalSessionsInActivity: src.totalSessionsInActivity,
          sourceFile: src.sourceFile,
        };
      });

      for (let k = 1; k < classFutureIndices.length; k++) {
        const targetIdx = classFutureIndices[k];
        const shiftedPayload = payloads[k - 1];
        const targetRow = updatedRows[targetIdx];
        if (!isSameSlot(targetRow, anchorRow)) {
          updatedRows[targetIdx] = {
            ...targetRow,
            ...shiftedPayload,
            completionStatus: targetRow.completionStatus === 'completed' ? 'completed' : 'scheduled',
          };
          changedCount += 1;
        }
      }
    }
  }

  return {
    updatedRows,
    changedCount,
    updatedUnitSessionsMap: nextUnitSessionsMap,
  };
}
