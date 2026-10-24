import { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';
import { DAILY_LOGBOOK_PROGRAM_1AM, type DailyLogbookProgramItem } from '../data/dailyLogbookProgram1am';
import { DAILY_LOGBOOK_PROGRAM_2AM } from '../data/dailyLogbookProgram2am';
import { DAILY_LOGBOOK_PROGRAM_3AM } from '../data/dailyLogbookProgram3am';
import { DAILY_LOGBOOK_PROGRAM_4AM } from '../data/dailyLogbookProgram4am';

const JS_DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

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

export function extractGroupInfo(sec: string): {
  baseSection: string;
  isGroup: boolean;
  groupNumber: number;
  rawGroup?: string;
  level: '1م' | '2م' | '3م' | '4م';
} {
  const raw = String(sec || '').trim();
  const level = detectLevelFromSection(raw) || '1م';

  // Matches (ف1), (فوج 1), فـ1, ف1, فوج 2, g1, grp2, etc.
  const groupMatch = raw.match(/(?:فوج|فـ|ف|g|grp|group)\s*(\d+)/i);
  if (groupMatch) {
    const groupNumber = parseInt(groupMatch[1], 10) || 1;
    const baseSection = raw.replace(/\s*\(?(?:فوج|فـ|ف|g|grp|group)\s*\d+\)?\s*/gi, '').trim();
    return {
      baseSection: baseSection || raw,
      isGroup: true,
      groupNumber,
      rawGroup: groupMatch[0],
      level,
    };
  }

  // Also check general (ف) without number
  if (/\b(?:فوج|فـ|ف)\b/i.test(raw)) {
    const baseSection = raw.replace(/\s*\(?(?:فوج|فـ|ف)\)?\s*/gi, '').trim();
    return {
      baseSection: baseSection || raw,
      isGroup: true,
      groupNumber: 1,
      rawGroup: 'فوج',
      level,
    };
  }

  return {
    baseSection: raw,
    isGroup: false,
    groupNumber: 0,
    level,
  };
}

export function getBaseSection(sec: string): string {
  return extractGroupInfo(sec).baseSection;
}

type LogbookLevel = '1م' | '2م' | '3م' | '4م';

interface ProgramLesson {
  id: string;
  midan: string;
  maqta: string;
  mawrid: string;
  ta3alom: string;
  moshkila?: string;
  activities: string[];
  session1: string;
  session2: string;
  taqwim?: string;
  isIntroductory?: boolean;
  isExam?: boolean;
  sourceLearningUnitId: string;
  sourceActivityIds?: string[];
  activityPeriods?: number[];
}

const LEVEL_PROGRAMS: Record<LogbookLevel, DailyLogbookProgramItem[]> = {
  '1م': DAILY_LOGBOOK_PROGRAM_1AM,
  '2م': DAILY_LOGBOOK_PROGRAM_2AM,
  '3م': DAILY_LOGBOOK_PROGRAM_3AM,
  '4م': DAILY_LOGBOOK_PROGRAM_4AM,
};

function getTeachingRowsForLevel(level: LogbookLevel): ProgramLesson[] {
  const introContent = 'التعارف والصحة المدرسية: التعارف بين الأستاذ والتلاميذ، تقديم المادة، قواعد الأمن والنظافة، والمحافظة على الصحة المدرسية.';
  const intro: ProgramLesson = {
    id: `daily_logbook_intro_${level}`,
    midan: 'التحضير للدخول المدرسي',
    maqta: 'الافتتاح والتعارف',
    mawrid: 'التعارف والصحة المدرسية',
    ta3alom: introContent,
    activities: [introContent],
    session1: introContent,
    session2: introContent,
    taqwim: 'التعرف على التلاميذ، والتذكير بقواعد النظافة والأمن والانضباط داخل المؤسسة والمخبر.',
    isIntroductory: true,
    sourceLearningUnitId: `daily_logbook_intro_${level}`,
  };

  const curriculum: ProgramLesson[] = (LEVEL_PROGRAMS[level] || LEVEL_PROGRAMS['1م']).map((item) => {
    const activityItems = (item.activities || [])
      .map((activity, index) => ({ activity, index }))
      .filter(({ activity }) => Boolean(activity && activity.trim()));
    const activities = activityItems.map(({ activity }) => activity.trim());
    const fallback = item.ta3alom || item.mawrid || 'نشاط تعلمي';
    return {
      id: item.sourceLearningUnitId,
      midan: item.midan,
      maqta: item.maqta,
      mawrid: item.mawrid,
      ta3alom: item.ta3alom,
      moshkila: item.moshkila,
      activities,
      sourceActivityIds: activityItems.map(({ index }) => item.sourceActivityIds?.[index] || ''),
      activityPeriods: activityItems.map(({ index }) => {
        const periods = Number(item.activityPeriods?.[index] ?? 1);
        return Number.isFinite(periods) ? Math.max(1, Math.floor(periods)) : 1;
      }),
      session1: activities[0] || fallback,
      session2: activities[1] || activities[0] || fallback,
      taqwim: item.taqwim,
      sourceLearningUnitId: item.sourceLearningUnitId,
    };
  });

  // أرقام program_*_unit_* هي ترتيب وحدات التدرج في الملفات الأصلية؛
  // نعتمدها هنا صراحةً كي لا يغيّر ترتيب عناصر المصفوفة تسلسل حصص السنة.
  curriculum.sort((a, b) => {
    const orderOf = (id: string) => Number(id.match(/_unit_(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER);
    return orderOf(a.sourceLearningUnitId) - orderOf(b.sourceLearningUnitId);
  });

  const review: ProgramLesson = {
    id: `daily_logbook_review_${level}`,
    midan: 'الإدماج والتقويم',
    maqta: 'مراجعة التعلمات',
    mawrid: 'تقويم وإدماج الموارد',
    ta3alom: 'تثبيت المكتسبات ومعالجة الصعوبات المسجلة أثناء التعلمات.',
    activities: ['تمارين إدماجية، معالجة التعثرات، وتقويم المكتسبات.'],
    session1: 'تمارين إدماجية، معالجة التعثرات، وتقويم المكتسبات.',
    session2: 'تمارين دعم واستدراك وتقويم المكتسبات.',
    taqwim: 'تقويم تشخيصي وتكويني لمعرفة مدى التحكم في التعلمات.',
    sourceLearningUnitId: `daily_logbook_review_${level}`,
  };

  return [intro, ...curriculum, review];
}

/**
 * توليد الدفتر اليومي بربط مباشر ودقيق بالتدرج السنوي الرسمي:
 * - تماثل كامل في محتوى الأفواج (فوج 1 وفوج 2 لنفس القسم يأخذان نفس الحصة المخبرية دون تقدم أحدهما عن الآخر).
 * - تسلسل زمني دقيق ومنتظم انطلاقاً من تاريخ بداية الدخول المدرسي.
 * - إلغاء أي توليد عشوائي، والالتزام الحرفي بتوزيع الأنشطة والموارد الرسمية.
 */
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

/**
 * توليد الدفتر اليومي بربط مباشر ودقيق بالتدرج السنوي الرسمي:
 * - دمج حصص الأفواج (فوج 1 وفوج 2) لكل قسم في حصة مخبرية واحدة بتوقيت مدمج ومحتوى عملي مشترك.
 * - تخصيص الحصة الجماعية لبناء المورد والتعلمات النظامية (session1).
 * - تخصيص حصة الأفواج للأعمال المخبرية والتطبيقية (session2).
 * - معالجة نموذج 15 ساعة (5 أقسام × 3 ساعات = 10 حصص مدمجة أسبوعياً) ليتناسب تماماً مع صفحة أسبوعية واحدة (10 أسطر).
 */
export function generateLogbookEntries({
  startDate,
  gridRows,
  period = 'سنة',
  holidays = [],
}: {
  startDate: string;
  gridRows: TimetableGridRow[];
  period?: string;
  holidays?: HolidayEntry[];
  curriculumDb?: any;
}): LogEntry[] {
  if (!startDate) return [];

  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  
  // استخراج الحصص المبرمجة أسبوعياً
  interface ScheduledSlot {
    time: string;
    section: string;
    baseSection: string;
    isGroup: boolean;
    groupNumber: number;
    rawGroup?: string;
    level: '1م' | '2م' | '3م' | '4م';
    dayName: string;
    timeMinutes: number;
  }

  const allScheduledSlots: ScheduledSlot[] = [];

  for (const day of days) {
    for (const row of gridRows) {
      const cell = row.cells?.[day];
      if (cell && cell.trim()) {
        const trimmed = cell.trim();
        const groupInfo = extractGroupInfo(trimmed);
        allScheduledSlots.push({
          time: row.time,
          section: trimmed,
          baseSection: groupInfo.baseSection,
          isGroup: groupInfo.isGroup,
          groupNumber: groupInfo.groupNumber,
          rawGroup: groupInfo.rawGroup,
          level: groupInfo.level,
          dayName: day,
          timeMinutes: getTimeMinutes(row.time),
        });
      }
    }
  }

  if (allScheduledSlots.length === 0) return [];

  const isDateInHoliday = (dateStr: string): boolean =>
    holidays.some((h) => dateStr >= h.startDate && dateStr <= (h.endDate || h.startDate));

  // تحديد عدد الأسابيع المستهدفة
  const targetWeeksCount =
    period === 'أسبوع' || period === 'أسبوع واحد' ? 1 :
    period === 'أسبوعين' ? 2 :
    period === 'شهر' ? 4 :
    period === 'فصل' || period === 'ثلاثي' ? 12 : 32;

  // جداول التدرج لكل مستوى
  const teachingRowsByLevel: Record<LogbookLevel, ProgramLesson[]> = {
    '1م': getTeachingRowsForLevel('1م'),
    '2م': getTeachingRowsForLevel('2م'),
    '3م': getTeachingRowsForLevel('3م'),
    '4م': getTeachingRowsForLevel('4م'),
  };

  // تقدم مستقل لكل قسم ونشاط؛ أيام التقييم لا تحرك مؤشر التدرج.
  const sectionProgress: Record<string, { lessonIndex: number; activityIndex: number; activitySession: number }> = {};

  const generated: LogEntry[] = [];
  const parsedStart = new Date(startDate + 'T12:00:00');
  if (Number.isNaN(parsedStart.getTime())) return [];

  const currentSunday = new Date(parsedStart);
  currentSunday.setDate(parsedStart.getDate() - parsedStart.getDay());
  const uniqueBaseSections = Array.from(new Set(allScheduledSlots.map((s) => s.baseSection)));

  let weeksGenerated = 0;
  let maxLoopIterations = targetWeeksCount * 3 + 10;

  while (weeksGenerated < targetWeeksCount && maxLoopIterations > 0) {
    maxLoopIterations--;

    const weekDaysMap: Record<string, { dateStr: string; isHoliday: boolean; isBeforeStart: boolean; assessmentLabel?: string }> = {};
    let allHolidayCount = 0;
    for (let dIdx = 0; dIdx < 5; dIdx++) {
      const d = new Date(currentSunday);
      d.setDate(currentSunday.getDate() + dIdx);
      const dateStr = formatDateToIsoString(d);
      const dayName = days[dIdx];
      const event = holidays.find((h) => dateStr >= h.startDate && dateStr <= (h.endDate || h.startDate));
      const isHoliday = Boolean(event && (!event.kind || event.kind === 'holiday'));
      const assessmentLabel = event && event.kind && event.kind !== 'holiday'
        ? (event.label || (event.kind === 'assignment' ? 'فرض' : event.kind === 'test' ? 'اختبار' : 'امتحان'))
        : undefined;
      const isBeforeStart = dateStr < startDate;
      if (isHoliday) allHolidayCount++;
      weekDaysMap[dayName] = { dateStr, isHoliday, isBeforeStart, assessmentLabel };
    }

    const hasAssessmentThisWeek = Object.values(weekDaysMap).some((day) => Boolean(day.assessmentLabel));
    if (allHolidayCount === 5 && !hasAssessmentThisWeek) {
      currentSunday.setDate(currentSunday.getDate() + 7);
      continue;
    }

    const currentWeekEntries: LogEntry[] = [];
    type WeekSession = {
      sortDate: string;
      sortTime: number;
      dayName: string;
      dateStr: string;
      time: string;
      section: string;
      note: string;
      assessmentLabel?: string;
    };

    for (const baseSec of uniqueBaseSections) {
      const secSlots = allScheduledSlots.filter((s) => s.baseSection === baseSec);
      if (secSlots.length === 0) continue;

      const lvl = secSlots[0].level;
      const teachingRows = teachingRowsByLevel[lvl] || teachingRowsByLevel['1م'];
      const groupSlots = secSlots
        .filter((s) => s.isGroup)
        .sort((a, b) => a.groupNumber - b.groupNumber || a.timeMinutes - b.timeMinutes);
      const collectiveSlots = secSlots
        .filter((s) => !s.isGroup)
        .sort((a, b) => a.timeMinutes - b.timeMinutes);
      const weekSessions: WeekSession[] = [];

      const addGroupTeachingSession = (slots: ScheduledSlot[]) => {
        if (slots.length === 0) return;
        if (slots.length === 1) {
          const g = slots[0];
          const dayInfo = weekDaysMap[g.dayName];
          if (!dayInfo || dayInfo.isBeforeStart || dayInfo.isHoliday) return;
          weekSessions.push({
            sortDate: dayInfo.dateStr,
            sortTime: g.timeMinutes,
            dayName: g.dayName,
            dateStr: dayInfo.dateStr,
            time: formatTimeWithArrow(g.time) + ' (ف' + g.groupNumber + ')',
            section: baseSec + ' (فوج ' + g.groupNumber + ')',
            note: 'عمل مخبري (فوج ' + g.groupNumber + ')',
          });
          return;
        }

        const valid = slots.filter((slot) => {
          const dayInfo = weekDaysMap[slot.dayName];
          return dayInfo && !dayInfo.isBeforeStart && !dayInfo.isHoliday;
        });
        if (valid.length === 0) return;
        const allSameDay = slots.every((g) => g.dayName === slots[0].dayName);
        const groupNumbers = slots.map((g) => g.groupNumber);
        const dayInfo0 = weekDaysMap[slots[0].dayName];
        const mergedDay = allSameDay ? slots[0].dayName : slots.map((g) => g.dayName).join(' / ');
        const mergedDate = allSameDay
          ? (dayInfo0?.dateStr || '')
          : slots.map((g) => (weekDaysMap[g.dayName]?.dateStr || '') + ' (ف' + g.groupNumber + ')').join(' / ');
        const mergedTime = slots.map((g) => formatTimeWithArrow(g.time) + ' (ف' + g.groupNumber + ')').join(' / ');
        const firstValid = [...valid].sort((a, b) =>
          (weekDaysMap[a.dayName]?.dateStr || '').localeCompare(weekDaysMap[b.dayName]?.dateStr || '') ||
          a.timeMinutes - b.timeMinutes
        )[0];
        weekSessions.push({
          sortDate: weekDaysMap[firstValid.dayName].dateStr,
          sortTime: firstValid.timeMinutes,
          dayName: mergedDay,
          dateStr: mergedDate,
          time: mergedTime,
          section: baseSec + ' (' + groupNumbers.map((num) => 'فوج ' + num).join(' + ') + ')',
          note: 'عمل مخبري (' + groupNumbers.map((num) => 'أفواج ' + num).join(' + ') + ')',
        });
      };

      const assessmentGroups = new Map<string, ScheduledSlot[]>();
      const teachingGroups: ScheduledSlot[] = [];
      groupSlots.forEach((slot) => {
        const dayInfo = weekDaysMap[slot.dayName];
        if (!dayInfo || dayInfo.isBeforeStart || dayInfo.isHoliday) return;
        if (!dayInfo.assessmentLabel) {
          teachingGroups.push(slot);
          return;
        }
        const key = dayInfo.dateStr + '|' + dayInfo.assessmentLabel;
        const grouped = assessmentGroups.get(key) || [];
        grouped.push(slot);
        assessmentGroups.set(key, grouped);
      });
      addGroupTeachingSession(teachingGroups);
      assessmentGroups.forEach((slots) => {
        const first = slots[0];
        const dayInfo = weekDaysMap[first.dayName];
        const nums = slots.map((slot) => slot.groupNumber);
        weekSessions.push({
          sortDate: dayInfo.dateStr,
          sortTime: Math.min(...slots.map((slot) => slot.timeMinutes)),
          dayName: first.dayName,
          dateStr: dayInfo.dateStr,
          time: slots.map((slot) => formatTimeWithArrow(slot.time) + ' (ف' + slot.groupNumber + ')').join(' / '),
          section: baseSec + ' (' + nums.map((num) => 'فوج ' + num).join(' + ') + ')',
          note: dayInfo.assessmentLabel + ' • فترة تقييم',
          assessmentLabel: dayInfo.assessmentLabel,
        });
      });

      collectiveSlots.forEach((slot) => {
        const dayInfo = weekDaysMap[slot.dayName];
        if (!dayInfo || dayInfo.isBeforeStart || dayInfo.isHoliday) return;
        weekSessions.push({
          sortDate: dayInfo.dateStr,
          sortTime: slot.timeMinutes,
          dayName: slot.dayName,
          dateStr: dayInfo.dateStr,
          time: formatTimeWithArrow(slot.time),
          section: baseSec,
          note: dayInfo.assessmentLabel ? dayInfo.assessmentLabel + ' • فترة تقييم' : 'حصة جماعية (القسم كاملاً)',
          assessmentLabel: dayInfo.assessmentLabel,
        });
      });

      weekSessions.sort((a, b) =>
        a.sortDate.localeCompare(b.sortDate) ||
        a.sortTime - b.sortTime ||
        a.section.localeCompare(b.section)
      );

      const progress = { ...(sectionProgress[baseSec] || { lessonIndex: 0, activityIndex: 0, activitySession: 0 }) };
      weekSessions.forEach((session) => {
        if (session.assessmentLabel) {
          const assessmentText = session.assessmentLabel;
          const entryId = session.sortDate + '-' + baseSec.replace(/\s+/g, '') + '-' + session.sortTime + '-assessment-' + currentWeekEntries.length;
          currentWeekEntries.push({
            id: entryId,
            dayName: session.dayName,
            dateStr: session.dateStr,
            time: session.time,
            section: session.section,
            level: lvl,
            content: assessmentText,
            activitiesList: [assessmentText],
            note: session.note + ' • لا يتقدم التدرج',
            lessonType: 'assessment',
          });
          return;
        }

        const lessonIndex = Math.min(progress.lessonIndex, teachingRows.length - 1);
        const currentRow = teachingRows[lessonIndex];
        const activities = currentRow.activities.length
          ? currentRow.activities
          : [currentRow.session1 || currentRow.mawrid || 'نشاط تعلمي'];
        const activityIndex = Math.min(progress.activityIndex, activities.length - 1);
        const activityContent = activities[activityIndex] || currentRow.session1 || currentRow.mawrid || 'نشاط تعلمي';
        const requiredPeriods = Math.max(1, currentRow.activityPeriods?.[activityIndex] || 1);
        const activitySession = Math.min(requiredPeriods, progress.activitySession + 1);
        const progressLabel = requiredPeriods > 1
          ? ' • متابعة النشاط ' + (activityIndex + 1) + ' (الحصة ' + activitySession + ' من ' + requiredPeriods + ')'
          : (activities.length > 1 ? ' • النشاط ' + (activityIndex + 1) : '');
        const entryId = session.sortDate + '-' + baseSec.replace(/\s+/g, '') + '-' + session.sortTime + '-' + generated.length + '-' + currentWeekEntries.length;

        currentWeekEntries.push({
          id: entryId,
          dayName: session.dayName,
          dateStr: session.dateStr,
          time: session.time,
          section: session.section,
          level: lvl,
          midan: currentRow.midan || '',
          maqta: currentRow.maqta || '',
          mawrid: currentRow.mawrid || '',
          ta3alom: currentRow.ta3alom || activityContent,
          activitiesList: [activityContent],
          content: activityContent,
          taqwim: currentRow.taqwim || (currentRow.isExam ? 'تقويم تحصيلي وفصلّي رسمي' : 'تقويم تكويني ومتابعة الإنجاز'),
          note: session.note + progressLabel,
          lessonType: currentRow.isExam ? 'assessment' : (currentRow.isIntroductory ? 'introductory' : 'curriculum'),
          resourceIndex: lessonIndex + 1,
          sourceLearningUnitId: currentRow.sourceLearningUnitId,
          sourceActivityId: currentRow.sourceActivityIds?.[activityIndex] || undefined,
        });

        if (activitySession < requiredPeriods) {
          progress.activitySession = activitySession;
        } else {
          progress.activitySession = 0;
          if (activityIndex + 1 < activities.length) {
            progress.lessonIndex = lessonIndex;
            progress.activityIndex = activityIndex + 1;
          } else if (lessonIndex < teachingRows.length - 1) {
            progress.lessonIndex = lessonIndex + 1;
            progress.activityIndex = 0;
          } else {
            progress.lessonIndex = lessonIndex;
            progress.activityIndex = activityIndex;
          }
        }
      });
      if (weekSessions.length > 0) sectionProgress[baseSec] = progress;
    }

    if (currentWeekEntries.length > 0) {
      // ترتيب حصص الأسبوع زمنياً حسب التاريخ ثم وقت الحصة
      const dateKey = (value: string) => (value.match(/\d{4}-\d{2}-\d{2}/g) || [value]).sort()[0];
      currentWeekEntries.sort((a, b) => {
        const dateCmp = dateKey(a.dateStr).localeCompare(dateKey(b.dateStr));
        if (dateCmp !== 0) return dateCmp;
        return getTimeMinutes(a.time) - getTimeMinutes(b.time);
      });

      generated.push(...currentWeekEntries);
      weeksGenerated++;
    }

    currentSunday.setDate(currentSunday.getDate() + 7);
  }

  return generated;
}
