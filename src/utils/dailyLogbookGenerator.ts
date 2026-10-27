import { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';
import { DAILY_LOGBOOK_PROGRAM_1AM, type DailyLogbookProgramItem } from '../data/dailyLogbookProgram1am';
import { DAILY_LOGBOOK_PROGRAM_2AM } from '../data/dailyLogbookProgram2am';
import { DAILY_LOGBOOK_PROGRAM_3AM } from '../data/dailyLogbookProgram3am';
import { DAILY_LOGBOOK_PROGRAM_4AM } from '../data/dailyLogbookProgram4am';

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
            sessionContent = `متابعة ${act} (الحصة 2: الاستنتاج والتركيب)`;
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
export function generateLogbookEntries({
  startDate,
  gridRows,
  period = 'سنة',
  holidays = [],
  sessionsPerActivity = 1,
  activitySessionsMap,
}: GenerateLogbookEntriesParams): LogEntry[] {
  if (!startDate) return [];

  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

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

  // كشف الفعاليات التقويمية (عطلة، فرض، اختبار)
  const getCalendarEvent = (dateStr: string): HolidayEntry | undefined => {
    return holidays.find((h) => dateStr >= h.startDate && dateStr <= (h.endDate || h.startDate));
  };

  const isDateHoliday = (dateStr: string): boolean => {
    const ev = getCalendarEvent(dateStr);
    return Boolean(ev && (!ev.type || ev.type === 'holiday'));
  };

  const getDateExamEvent = (dateStr: string): HolidayEntry | undefined => {
    const ev = getCalendarEvent(dateStr);
    if (!ev) return undefined;
    if (ev.type === 'exam' || ev.type === 'test' || ev.type === 'official_exam') return ev;
    if (/فرض|اختبار|امتحان|bem|شهادة/i.test(ev.label)) return ev;
    return undefined;
  };

  // تحديد عدد الأسابيع المستهدفة للتوليد
  const targetWeeksCount =
    period === 'أسبوع' || period === 'أسبوع واحد' ? 1 :
    period === 'أسبوعين' ? 2 :
    period === 'شهر' ? 4 :
    period === 'فصل' || period === 'ثلاثي' ? 12 : 34;

  // إعداد مصفوفة الخطوات البيداغوجية المتتالية لكل مستوى
  const stepsByLevel: Record<LogbookLevel, PedagogicalStep[]> = {
    '1م': buildPedagogicalStepsForLevel('1م', sessionsPerActivity, activitySessionsMap),
    '2م': buildPedagogicalStepsForLevel('2م', sessionsPerActivity, activitySessionsMap),
    '3م': buildPedagogicalStepsForLevel('3م', sessionsPerActivity, activitySessionsMap),
    '4م': buildPedagogicalStepsForLevel('4م', sessionsPerActivity, activitySessionsMap),
  };

  // مؤشر التقدم في خطوات المنهاج لكل قسم
  const sectionStepCursor: Record<string, number> = {};

  const generated: LogEntry[] = [];
  const parsedStart = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(parsedStart.getTime())) return [];

  // الانطلاق من يوم الأحد للأسبوع الذي يحوي تاريخ البداية
  const currentSunday = new Date(parsedStart);
  currentSunday.setDate(parsedStart.getDate() - parsedStart.getDay());

  const uniqueBaseSections = Array.from(new Set(allScheduledSlots.map((s) => s.baseSection)));

  let weeksGenerated = 0;
  let maxLoopIterations = targetWeeksCount * 3 + 12;

  while (weeksGenerated < targetWeeksCount && maxLoopIterations > 0) {
    maxLoopIterations--;

    // معلومات أيام هذا الأسبوع الدراسي (الأحد إلى الخميس)
    const weekDaysMap: Record<
      string,
      { dateStr: string; isHoliday: boolean; isBeforeStart: boolean; examEvent?: HolidayEntry }
    > = {};

    let holidaysInWeekCount = 0;

    for (let dIdx = 0; dIdx < 5; dIdx++) {
      const d = new Date(currentSunday);
      d.setDate(currentSunday.getDate() + dIdx);
      const dateStr = formatDateToIsoString(d);
      const dayName = days[dIdx];
      const isHoliday = isDateHoliday(dateStr);
      const isBeforeStart = dateStr < startDate;
      const examEvent = !isHoliday ? getDateExamEvent(dateStr) : undefined;

      if (isHoliday) holidaysInWeekCount++;
      weekDaysMap[dayName] = { dateStr, isHoliday, isBeforeStart, examEvent };
    }

    // إذا كان الأسبوع بأكمله عطلة مدرسية كاملة، نتجاوزه
    if (holidaysInWeekCount === 5) {
      currentSunday.setDate(currentSunday.getDate() + 7);
      continue;
    }

    const currentWeekEntries: LogEntry[] = [];

    // معالجة كل قسم لهذا الأسبوع
    for (const baseSec of uniqueBaseSections) {
      const secSlots = allScheduledSlots.filter((s) => s.baseSection === baseSec);
      if (secSlots.length === 0) continue;

      const lvl = secSlots[0].level;
      const steps = stepsByLevel[lvl] || stepsByLevel['1م'];
      if (!steps || steps.length === 0) continue;

      if (sectionStepCursor[baseSec] === undefined) {
        sectionStepCursor[baseSec] = 0;
      }

      const groupSlots = secSlots
        .filter((s) => s.isGroup)
        .sort((a, b) => a.groupNumber - b.groupNumber || a.timeMinutes - b.timeMinutes);

      const collectiveSlots = secSlots
        .filter((s) => !s.isGroup)
        .sort((a, b) => a.timeMinutes - b.timeMinutes);

      // دالة مساعدة للحصول على الخطوة الحالية وتحديث المؤشر
      const consumeCurrentStep = (): PedagogicalStep => {
        const curIdx = sectionStepCursor[baseSec] || 0;
        const step = steps[Math.min(curIdx, steps.length - 1)];
        sectionStepCursor[baseSec] = Math.min(curIdx + 1, steps.length - 1);
        return step;
      };

      const peekCurrentStep = (): PedagogicalStep => {
        const curIdx = sectionStepCursor[baseSec] || 0;
        return steps[Math.min(curIdx, steps.length - 1)];
      };

      // 1. معالجة حصص الأفواج المخبرية (دمج ف1 وف2 في حصة مخبرية واحدة بتوقيت مدمج)
      if (groupSlots.length >= 2) {
        const allSameDay = groupSlots.every((g) => g.dayName === groupSlots[0].dayName);
        const dayInfo0 = weekDaysMap[groupSlots[0].dayName];
        const isAnyValid = groupSlots.some((g) => {
          const dInfo = weekDaysMap[g.dayName];
          return dInfo && !dInfo.isBeforeStart && !dInfo.isHoliday;
        });

        if (isAnyValid) {
          const groupNumbers = groupSlots.map((g) => g.groupNumber);
          const mergedSection = `${baseSec} (${groupNumbers.map((num) => `فوج ${num}`).join(' + ')})`;

          let mergedDay = '';
          let mergedDate = '';
          let mergedTime = '';

          if (allSameDay) {
            mergedDay = groupSlots[0].dayName;
            mergedDate = dayInfo0?.dateStr || '';
            mergedTime = groupSlots
              .map((g) => `${formatTimeWithArrow(g.time)} (ف${g.groupNumber})`)
              .join(' / ');
          } else {
            mergedDay = groupSlots.map((g) => g.dayName).join(' / ');
            mergedDate = groupSlots
              .map((g) => `${weekDaysMap[g.dayName]?.dateStr || ''} (ف${g.groupNumber})`)
              .join(' / ');
            mergedTime = groupSlots
              .map((g) => `${formatTimeWithArrow(g.time)} (ف${g.groupNumber})`)
              .join(' / ');
          }

          // فحص هل اليوم فترة امتحان أو فرض
          const activeExamEvent = dayInfo0?.examEvent || weekDaysMap[groupSlots[0].dayName]?.examEvent;

          if (activeExamEvent) {
            // حصة تقويمية رسمية (لا تستهلك مؤشر المنهاج)
            const isTest = activeExamEvent.type === 'test' || /فرض/i.test(activeExamEvent.label);
            const entryId = `${mergedDate.split(' ')[0] || 'date'}-${baseSec.replace(/\s+/g, '')}-exam-${generated.length + currentWeekEntries.length}`;

            currentWeekEntries.push({
              id: entryId,
              dayName: mergedDay,
              dateStr: mergedDate,
              time: mergedTime,
              section: mergedSection,
              level: lvl,
              midan: 'التقويم والامتحانات',
              maqta: activeExamEvent.label || (isTest ? 'فروض المراقبة المستمرة' : 'الاختبارات الفصلية الرسمية'),
              mawrid: activeExamEvent.label || (isTest ? 'فرض محروس رسمي' : 'اختبار الفصل'),
              ta3alom: activeExamEvent.label || (isTest ? 'إجراء الفرض المحروس في مادة علوم الطبيعة والحياة' : 'إجراء الاختبار الفصلي لمادة علوم الطبيعة والحياة'),
              activitiesList: [activeExamEvent.label || (isTest ? 'إجراء الفرض المحروس' : 'إجراء الاختبار الفصلي الرسمي')],
              content: activeExamEvent.label || (isTest ? 'فرض محروس رسمي' : 'اختبار فصلي رسمي'),
              taqwim: isTest ? 'تقويم تحصيلي مستمر لمراقبة الكفاءات' : 'تقويم تحصيلي فصلي شامل',
              note: `عمل مخبري وتقويمي (${groupNumbers.map((num) => `أفواج ${num}`).join(' + ')}) — ${activeExamEvent.label}`,
              lessonType: 'assessment',
              resourceIndex: sectionStepCursor[baseSec] + 1,
              sourceLearningUnitId: `exam_${activeExamEvent.startDate}`,
            });
          } else {
            // حصة مخبرية وفق تسلسل خطوات التدرج
            const step = consumeCurrentStep();
            const entryId = `${mergedDate.split(' ')[0] || 'date'}-${baseSec.replace(/\s+/g, '')}-groups-${generated.length + currentWeekEntries.length}`;

            currentWeekEntries.push({
              id: entryId,
              dayName: mergedDay,
              dateStr: mergedDate,
              time: mergedTime,
              section: mergedSection,
              level: lvl,
              midan: step.midan,
              maqta: step.maqta,
              mawrid: step.mawrid,
              ta3alom: step.ta3alom,
              moshkila: step.moshkila,
              activitiesList: [step.fullContent],
              content: step.fullContent,
              taqwim: step.taqwim || 'تقويم تكويني ومتابعة الإنجاز المخبري والتجريبي',
              note: `عمل مخبري (${groupNumbers.map((num) => `أفواج ${num}`).join(' + ')})`,
              lessonType: step.isIntroductory ? 'introductory' : step.isReview ? 'remediation' : 'curriculum',
              resourceIndex: sectionStepCursor[baseSec],
              sourceLearningUnitId: step.sourceLearningUnitId,
            });
          }
        }
      } else if (groupSlots.length === 1) {
        // فوج فردي (إذا لم يكن هناك فوج ثانٍ مبرمج)
        const g = groupSlots[0];
        const dInfo = weekDaysMap[g.dayName];
        if (dInfo && !dInfo.isBeforeStart && !dInfo.isHoliday) {
          if (dInfo.examEvent) {
            const isTest = dInfo.examEvent.type === 'test' || /فرض/i.test(dInfo.examEvent.label);
            const entryId = `${dInfo.dateStr}-${g.section.replace(/\s+/g, '')}-exam-${generated.length + currentWeekEntries.length}`;

            currentWeekEntries.push({
              id: entryId,
              dayName: g.dayName,
              dateStr: dInfo.dateStr,
              time: `${formatTimeWithArrow(g.time)} (ف${g.groupNumber})`,
              section: `${baseSec} (فوج ${g.groupNumber})`,
              level: lvl,
              midan: 'التقويم والامتحانات',
              maqta: dInfo.examEvent.label || (isTest ? 'فروض المراقبة المستمرة' : 'الاختبارات الفصلية الرسمية'),
              mawrid: dInfo.examEvent.label || (isTest ? 'فرض محروس رسمي' : 'اختبار الفصل'),
              ta3alom: dInfo.examEvent.label || (isTest ? 'إجراء الفرض المحروس' : 'إجراء الاختبار الفصلي'),
              activitiesList: [dInfo.examEvent.label || 'إجراء الامتحان'],
              content: dInfo.examEvent.label || 'إجراء الامتحان',
              taqwim: isTest ? 'تقويم تحصيلي مستمر' : 'تقويم تحصيلي فصلي شامل',
              note: `عمل مخبري (فوج ${g.groupNumber}) — ${dInfo.examEvent.label}`,
              lessonType: 'assessment',
              resourceIndex: sectionStepCursor[baseSec] + 1,
              sourceLearningUnitId: `exam_${dInfo.examEvent.startDate}`,
            });
          } else {
            const step = consumeCurrentStep();
            const entryId = `${dInfo.dateStr}-${g.section.replace(/\s+/g, '')}-${g.timeMinutes}-${generated.length + currentWeekEntries.length}`;

            currentWeekEntries.push({
              id: entryId,
              dayName: g.dayName,
              dateStr: dInfo.dateStr,
              time: `${formatTimeWithArrow(g.time)} (ف${g.groupNumber})`,
              section: `${baseSec} (فوج ${g.groupNumber})`,
              level: lvl,
              midan: step.midan,
              maqta: step.maqta,
              mawrid: step.mawrid,
              ta3alom: step.ta3alom,
              moshkila: step.moshkila,
              activitiesList: [step.fullContent],
              content: step.fullContent,
              taqwim: step.taqwim || 'تقويم تكويني ومتابعة الإنجاز المخبري والتجريبي',
              note: `عمل مخبري (فوج ${g.groupNumber})`,
              lessonType: step.isIntroductory ? 'introductory' : step.isReview ? 'remediation' : 'curriculum',
              resourceIndex: sectionStepCursor[baseSec],
              sourceLearningUnitId: step.sourceLearningUnitId,
            });
          }
        }
      }

      // 2. معالجة الحصص الجماعية (القسم كاملاً)
      collectiveSlots.forEach((cSlot) => {
        const dInfo = weekDaysMap[cSlot.dayName];
        if (!dInfo || dInfo.isBeforeStart || dInfo.isHoliday) return;

        if (dInfo.examEvent) {
          const isTest = dInfo.examEvent.type === 'test' || /فرض/i.test(dInfo.examEvent.label);
          const entryId = `${dInfo.dateStr}-${baseSec.replace(/\s+/g, '')}-exam-${cSlot.timeMinutes}-${generated.length + currentWeekEntries.length}`;

          currentWeekEntries.push({
            id: entryId,
            dayName: cSlot.dayName,
            dateStr: dInfo.dateStr,
            time: formatTimeWithArrow(cSlot.time),
            section: baseSec,
            level: lvl,
            midan: 'التقويم والامتحانات',
            maqta: dInfo.examEvent.label || (isTest ? 'فروض المراقبة المستمرة' : 'الاختبارات الفصلية الرسمية'),
            mawrid: dInfo.examEvent.label || (isTest ? 'فرض محروس رسمي' : 'اختبار الفصل'),
            ta3alom: dInfo.examEvent.label || (isTest ? 'إجراء الفرض المحروس' : 'إجراء الاختبار الفصلي'),
            activitiesList: [dInfo.examEvent.label || (isTest ? 'إجراء الفرض المحروس' : 'إجراء الاختبار الفصلي')],
            content: dInfo.examEvent.label || (isTest ? 'فرض محروس رسمي' : 'اختبار فصلي رسمي'),
            taqwim: isTest ? 'تقويم تحصيلي مستمر لمراقبة الكفاءات' : 'تقويم تحصيلي فصلي شامل',
            note: `حصة جماعية — ${dInfo.examEvent.label}`,
            lessonType: 'assessment',
            resourceIndex: sectionStepCursor[baseSec] + 1,
            sourceLearningUnitId: `exam_${dInfo.examEvent.startDate}`,
          });
        } else {
          const step = consumeCurrentStep();
          const entryId = `${dInfo.dateStr}-${baseSec.replace(/\s+/g, '')}-${cSlot.timeMinutes}-${generated.length + currentWeekEntries.length}`;

          currentWeekEntries.push({
            id: entryId,
            dayName: cSlot.dayName,
            dateStr: dInfo.dateStr,
            time: formatTimeWithArrow(cSlot.time),
            section: baseSec,
            level: lvl,
            midan: step.midan,
            maqta: step.maqta,
            mawrid: step.mawrid,
            ta3alom: step.ta3alom,
            moshkila: step.moshkila,
            activitiesList: [step.fullContent],
            content: step.fullContent,
            taqwim: step.taqwim || 'تقويم تكويني ومتابعة الإنجاز الكتابي',
            note: 'حصة جماعية (القسم كاملاً)',
            lessonType: step.isIntroductory ? 'introductory' : step.isReview ? 'remediation' : 'curriculum',
            resourceIndex: sectionStepCursor[baseSec],
            sourceLearningUnitId: step.sourceLearningUnitId,
          });
        }
      });
    }

    if (currentWeekEntries.length > 0) {
      // ترتيب حصص الأسبوع زمنياً حسب التاريخ ثم وقت الحصة
      currentWeekEntries.sort((a, b) => {
        const dateCmp = a.dateStr.localeCompare(b.dateStr);
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
