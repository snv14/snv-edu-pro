import { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';

const JS_DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function formatDateToIsoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getBaseSection(sec: string): string {
  if (!sec) return 'قسم غير محدد';
  return sec
    .replace(/\s*\(?(?:فوج|ف|فـ|g|grp|group)\s*\d+\)?\s*/gi, '')
    .trim();
}

function detectLevelFromSection(sec: string): '1م' | '2م' | '3م' | '4م' | null {
  if (!sec) return null;
  const s = sec.trim();
  if (s.includes('4م') || s.includes('4 م') || s.startsWith('4')) return '4م';
  if (s.includes('3م') || s.includes('3 م') || s.startsWith('3')) return '3م';
  if (s.includes('2م') || s.includes('2 م') || s.startsWith('2')) return '2م';
  if (s.includes('1م') || s.includes('1 م') || s.startsWith('1')) return '1م';
  return null;
}

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

  // بناء جدول الحصص الأسبوعي من شبكة استعمال الزمن
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timetableSchedule: Record<string, { time: string; section: string; level: '1م' | '2م' | '3م' | '4م' }[]> = {};
  
  for (const day of days) {
    timetableSchedule[day] = [];
    for (const row of gridRows) {
      const cell = row.cells?.[day];
      if (cell && cell.trim()) {
        const lvl = detectLevelFromSection(cell.trim()) || '1م';
        timetableSchedule[day].push({
          time: row.time,
          section: cell.trim(),
          level: lvl,
        });
      }
    }
  }

  const hasAnySessions = Object.values(timetableSchedule).some(arr => arr.length > 0);
  if (!hasAnySessions) return [];

  const isDateInHoliday = (dateStr: string): boolean => {
    return holidays.some((h) => {
      const start = h.startDate;
      const end = h.endDate || h.startDate;
      return dateStr >= start && dateStr <= end;
    });
  };

  const targetDaysCount =
    period === 'أسبوع' ? 5 :
    period === 'أسبوعين' ? 10 :
    period === 'شهر' ? 30 :
    period === 'فصل' || period === 'ثلاثي' ? 90 : 180;

  const maxIterations = period === 'سنة' ? 365 : targetDaysCount * 2.5;

  const sectionSessionIndex: Record<string, number> = {};
  const generatedKeys = new Set<string>();
  const generated: LogEntry[] = [];
  const baseDate = new Date(`${startDate}T12:00:00`);
  const currDate = new Date(baseDate);

  let schoolDaysCounted = 0;
  let iterationGuard = 0;

  const processDaySessions = (dayName: string, dateStr: string): boolean => {
    const daySessions = timetableSchedule[dayName];
    if (!daySessions || daySessions.length === 0) return false;

    for (const sess of daySessions) {
      const baseSection = getBaseSection(sess.section);
      const lvl = sess.level || detectLevelFromSection(baseSection) || '1م';

      const generatedKey = `${dateStr}|${sess.time}|${sess.section}`;
      if (generatedKeys.has(generatedKey)) continue;
      generatedKeys.add(generatedKey);

      if (sectionSessionIndex[baseSection] === undefined) {
        sectionSessionIndex[baseSection] = 0;
      }
      sectionSessionIndex[baseSection] += 1;
      const sessionNum = sectionSessionIndex[baseSection];

      generated.push({
        id: `${dateStr}-${sess.section.replace(/\s+/g, '')}-${sess.time.replace(/\s+/g, '')}-${generated.length}`,
        dayName,
        dateStr,
        time: sess.time,
        section: sess.section,
        level: lvl,
        ta3alom: `حصة ${sessionNum}`,
        content: `حصة ${sessionNum} — نشاط وسير التعلمات`,
        note: '',
        lessonType: 'curriculum',
        resourceIndex: sessionNum,
      });
    }

    return daySessions.length > 0;
  };

  while (schoolDaysCounted < targetDaysCount && iterationGuard < maxIterations) {
    const dayName = JS_DAY_NAMES[currDate.getDay()];
    const dateStr = formatDateToIsoString(currDate);
    const isWeekend = dayName === 'الجمعة' || dayName === 'السبت';
    const isHoliday = isDateInHoliday(dateStr);

    if (!isWeekend && !isHoliday) {
      const hasSessions = processDaySessions(dayName, dateStr);
      if (hasSessions) schoolDaysCounted++;
    }
    currDate.setDate(currDate.getDate() + 1);
    iterationGuard++;
  }

  return generated;
}
