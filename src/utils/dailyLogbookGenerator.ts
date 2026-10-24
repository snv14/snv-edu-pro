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
    const activities = (item.activities || []).filter((activity) => Boolean(activity && activity.trim()));
    const fallback = item.ta3alom || item.mawrid || 'نشاط تعلمي';
    return {
      id: item.sourceLearningUnitId,
      midan: item.midan,
      maqta: item.maqta,
      mawrid: item.mawrid,
      ta3alom: item.ta3alom,
      moshkila: item.moshkila,
      activities,
      session1: activities[0] || fallback,
      session2: activities[1] || activities[0] || fallback,
      taqwim: item.taqwim,
      sourceLearningUnitId: item.sourceLearningUnitId,
    };
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

  // مؤشر أسبوع التدرج لكل قسم
  const sectionWeekProgress: Record<string, number> = {};

  const generated: LogEntry[] = [];
  const parsedStart = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(parsedStart.getTime())) return [];

  // الانطلاق من يوم الأحد للأسبوع الدراسي الذي يحوي تاريخ البداية
  const currentSunday = new Date(parsedStart);
  currentSunday.setDate(parsedStart.getDate() - parsedStart.getDay());

  // قائمة الأقسام الأساسية الفريدة
  const uniqueBaseSections = Array.from(new Set(allScheduledSlots.map((s) => s.baseSection)));

  let weeksGenerated = 0;
  let maxLoopIterations = targetWeeksCount * 3 + 10;

  while (weeksGenerated < targetWeeksCount && maxLoopIterations > 0) {
    maxLoopIterations--;

    // معلومات أيام هذا الأسبوع (الأحد إلى الخميس)
    const weekDaysMap: Record<string, { dateStr: string; isHoliday: boolean; isBeforeStart: boolean }> = {};
    let allHolidayCount = 0;

    for (let dIdx = 0; dIdx < 5; dIdx++) {
      const d = new Date(currentSunday);
      d.setDate(currentSunday.getDate() + dIdx);
      const dateStr = formatDateToIsoString(d);
      const dayName = days[dIdx];
      const isHoliday = isDateInHoliday(dateStr);
      const isBeforeStart = dateStr < startDate;

      if (isHoliday) allHolidayCount++;
      weekDaysMap[dayName] = { dateStr, isHoliday, isBeforeStart };
    }

    // إذا كان الأسبوع بأكمله عطلة (مثل عطلة الشتاء أو الربيع)، نتجاوزه دون تقديم مؤشر التدرج
    if (allHolidayCount === 5) {
      currentSunday.setDate(currentSunday.getDate() + 7);
      continue;
    }

    const currentWeekEntries: LogEntry[] = [];

    // معالجة كل قسم لهذا الأسبوع
    for (const baseSec of uniqueBaseSections) {
      const secSlots = allScheduledSlots.filter((s) => s.baseSection === baseSec);
      if (secSlots.length === 0) continue;

      const lvl = secSlots[0].level;
      const teachingRows = teachingRowsByLevel[lvl] || teachingRowsByLevel['1م'];
      const weekIdx = sectionWeekProgress[baseSec] || 0;
      const currentRow = teachingRows[Math.min(weekIdx, teachingRows.length - 1)];
      const sectionEntriesBefore = currentWeekEntries.length;

      const groupSlots = secSlots.filter((s) => s.isGroup).sort((a, b) => a.groupNumber - b.groupNumber || a.timeMinutes - b.timeMinutes);
      const collectiveSlots = secSlots.filter((s) => !s.isGroup).sort((a, b) => a.timeMinutes - b.timeMinutes);

      // 1. معالجة حصص الأفواج (دمج الحصص أفواج لكل قسم في حصة مخبرية وتطبيقية واحدة مشتركة)
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

          // محتوى العمل المخبري والتطبيقي للأفواج (كلا الفوجين يأخذان نفس المحتوى المخبري بالضبط)
          const practicalContent = currentRow.session2 || currentRow.session1 || currentRow.mawrid || 'نشاط مخبري وتطبيقي';
          const entryId = `${mergedDate.split(' ')[0] || 'date'}-${baseSec.replace(/\s+/g, '')}-groups-${generated.length + currentWeekEntries.length}`;

          currentWeekEntries.push({
            id: entryId,
            dayName: mergedDay,
            dateStr: mergedDate,
            time: mergedTime,
            section: mergedSection,
            level: lvl,
            midan: currentRow.midan || '',
            maqta: currentRow.maqta || '',
            mawrid: currentRow.mawrid || '',
            ta3alom: currentRow.ta3alom || practicalContent,
            activitiesList: [practicalContent],
            content: practicalContent,
            taqwim: currentRow.taqwim || (currentRow.isExam ? 'تقويم تحصيلي وفصلّي رسمي' : 'تقويم تكويني ومتابعة الإنجاز المخبري والتجريبي'),
            note: `عمل مخبري (${groupNumbers.map((num) => `أفواج ${num}`).join(' + ')})`,
            lessonType: currentRow.isExam ? 'assessment' : (currentRow.isIntroductory ? 'introductory' : 'curriculum'),
            resourceIndex: weekIdx + 1,
            sourceLearningUnitId: currentRow.id,
          });
        }
      } else if (groupSlots.length === 1) {
        // فوج فردي
        const g = groupSlots[0];
        const dInfo = weekDaysMap[g.dayName];
        if (dInfo && !dInfo.isBeforeStart && !dInfo.isHoliday) {
          const practicalContent = currentRow.session2 || currentRow.session1 || currentRow.mawrid || 'نشاط مخبري وتطبيقي';
          const entryId = `${dInfo.dateStr}-${g.section.replace(/\s+/g, '')}-${g.timeMinutes}-${generated.length + currentWeekEntries.length}`;

          currentWeekEntries.push({
            id: entryId,
            dayName: g.dayName,
            dateStr: dInfo.dateStr,
            time: `${formatTimeWithArrow(g.time)} (ف${g.groupNumber})`,
            section: `${baseSec} (فوج ${g.groupNumber})`,
            level: lvl,
            midan: currentRow.midan || '',
            maqta: currentRow.maqta || '',
            mawrid: currentRow.mawrid || '',
            ta3alom: currentRow.ta3alom || practicalContent,
            activitiesList: [practicalContent],
            content: practicalContent,
            taqwim: currentRow.isExam ? 'تقويم تحصيلي وفصلّي رسمي' : 'تقويم تكويني ومتابعة الإنجاز المخبري والتجريبي',
            note: `عمل مخبري (فوج ${g.groupNumber})`,
            lessonType: currentRow.isExam ? 'assessment' : (currentRow.isIntroductory ? 'introductory' : 'curriculum'),
            resourceIndex: weekIdx + 1,
            sourceLearningUnitId: currentRow.id,
          });
        }
      }

      // 2. معالجة الحصص الجماعية (القسم كاملاً)
      collectiveSlots.forEach((cSlot, cIdx) => {
        const dInfo = weekDaysMap[cSlot.dayName];
        if (!dInfo || dInfo.isBeforeStart || dInfo.isHoliday) return;

        // إذا كان هناك حصة أفواج، تأخذ الحصة الجماعية الدرس الأول (session1) لبناء المفاهيم
        // إذا لم يكن هناك أفواج، توزع الحصص بين session1 و session2
        let lessonContent = '';
        if (groupSlots.length > 0) {
          lessonContent = currentRow.session1 || currentRow.mawrid || 'حصة تعلمية نظامية';
        } else {
          lessonContent = (cIdx === 0 ? currentRow.session1 : (currentRow.session2 || currentRow.session1)) || currentRow.mawrid || 'حصة تعلمية نظامية';
        }

        const entryId = `${dInfo.dateStr}-${baseSec.replace(/\s+/g, '')}-${cSlot.timeMinutes}-${generated.length + currentWeekEntries.length}`;

        currentWeekEntries.push({
          id: entryId,
          dayName: cSlot.dayName,
          dateStr: dInfo.dateStr,
          time: formatTimeWithArrow(cSlot.time),
          section: baseSec,
          level: lvl,
          midan: currentRow.midan || '',
          maqta: currentRow.maqta || '',
          mawrid: currentRow.mawrid || '',
          ta3alom: currentRow.ta3alom || lessonContent,
          activitiesList: [lessonContent],
          content: lessonContent,
          taqwim: currentRow.isExam ? 'تقويم تحصيلي وفصلّي رسمي' : 'تقويم تكويني ومتابعة الإنجاز الكتابي',
          note: 'حصة جماعية (القسم كاملاً)',
          lessonType: currentRow.isExam ? 'assessment' : (currentRow.isIntroductory ? 'introductory' : 'curriculum'),
          resourceIndex: weekIdx + 1,
          sourceLearningUnitId: currentRow.id,
        });
      });

      // لا نتقدم في البرنامج إلا إذا أُدرجت حصة فعلية لهذا القسم هذا الأسبوع.
      // هذا يمنع تخطي التعارف أو أي مورد بسبب تاريخ البداية أو العطل.
      if (currentWeekEntries.length > sectionEntriesBefore) {
        sectionWeekProgress[baseSec] = weekIdx + 1;
      }
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
