import { LogEntry, TimetableGridRow, HolidayEntry } from '../components/DailyLogbook';
import { DAILY_LOGBOOK_PROGRAM_1AM } from '../data/dailyLogbookProgram1am';
import { DAILY_LOGBOOK_PROGRAM_2AM } from '../data/dailyLogbookProgram2am';
import { DAILY_LOGBOOK_PROGRAM_3AM } from '../data/dailyLogbookProgram3am';
import { DAILY_LOGBOOK_PROGRAM_4AM } from '../data/dailyLogbookProgram4am';

const JS_DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function formatDateToIsoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getBaseSection(sec: string): string {
  if (!sec) return 'قسم غير محدد';
  return sec.replace(/\s*\(?(?:فوج|ف|فـ|g|grp|group)\s*\d+\)?\s*/gi, '').trim();
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

  // استعمال الزمن يحدد الأيام والأقسام والتوقيت؛ محتوى 1م و2م يأتي من برنامجيهما المستقلين.
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timetableSchedule: Record<string, { time: string; section: string; level: '1م' | '2م' | '3م' | '4م' }[]> = {};

  for (const day of days) {
    timetableSchedule[day] = [];
    for (const row of gridRows) {
      const cell = row.cells?.[day];
      if (cell && cell.trim()) {
        timetableSchedule[day].push({
          time: row.time,
          section: cell.trim(),
          level: detectLevelFromSection(cell.trim()) || '1م',
        });
      }
    }
  }

  if (!Object.values(timetableSchedule).some((arr) => arr.length > 0)) return [];

  const isDateInHoliday = (dateStr: string): boolean =>
    holidays.some((h) => dateStr >= h.startDate && dateStr <= (h.endDate || h.startDate));

  const targetDaysCount =
    period === 'أسبوع' ? 5 :
    period === 'أسبوعين' ? 10 :
    period === 'شهر' ? 30 :
    period === 'فصل' || period === 'ثلاثي' ? 90 : 180;
  const maxIterations = period === 'سنة' ? 365 : targetDaysCount * 2.5;

  const sectionSessionIndex: Record<string, number> = {};
  const generatedKeys = new Set<string>();
  const generated: LogEntry[] = [];
  const currDate = new Date(`${startDate}T12:00:00`);
  let schoolDaysCounted = 0;
  let iterationGuard = 0;

  const processDaySessions = (dayName: string, dateStr: string): boolean => {
    const daySessions = timetableSchedule[dayName];
    if (!daySessions?.length) return false;

    for (const sess of daySessions) {
      const baseSection = getBaseSection(sess.section);
      const lvl = sess.level || detectLevelFromSection(baseSection) || '1م';
      const generatedKey = `${dateStr}|${sess.time}|${sess.section}`;
      if (generatedKeys.has(generatedKey)) continue;
      generatedKeys.add(generatedKey);

      sectionSessionIndex[baseSection] = (sectionSessionIndex[baseSection] || 0) + 1;
      const sessionNum = sectionSessionIndex[baseSection];

      if (lvl === '1م') {
        // كل قسم يتقدم في تسلسل البرنامج مستقلاً؛ بعد إكمال الوحدات يبدأ التسلسل من أوله.
        const programIndex = (sessionNum - 1) % DAILY_LOGBOOK_PROGRAM_1AM.length;
        const unit = DAILY_LOGBOOK_PROGRAM_1AM[programIndex];
        generated.push({
          id: `${dateStr}-${sess.section.replace(/\s+/g, '')}-${sess.time.replace(/\s+/g, '')}-${generated.length}`,
          dayName, dateStr, time: sess.time, section: sess.section, level: lvl,
          midan: unit.midan,
          maqta: unit.maqta,
          mawrid: unit.mawrid,
          ta3alom: unit.ta3alom,
          moshkila: unit.moshkila,
          activitiesList: [...unit.activities],
          content: unit.activities.join('؛ '),
          taqwim: unit.taqwim || '',
          note: '',
          lessonType: 'curriculum',
          resourceIndex: programIndex + 1,
          sourceLearningUnitId: unit.sourceLearningUnitId,
          sourceActivityId: unit.sourceActivityIds[0],
          sourceActivityId2: unit.sourceActivityIds[1],
        });
      } else if (lvl === '2م') {
        // كل قسم في السنة الثانية يتقدم مستقلاً في تسلسل التدرج البيداغوجي المرفق.
        const programIndex = (sessionNum - 1) % DAILY_LOGBOOK_PROGRAM_2AM.length;
        const unit = DAILY_LOGBOOK_PROGRAM_2AM[programIndex];
        generated.push({
          id: `${dateStr}-${sess.section.replace(/\s+/g, '')}-${sess.time.replace(/\s+/g, '')}-${generated.length}`,
          dayName, dateStr, time: sess.time, section: sess.section, level: lvl,
          midan: unit.midan,
          maqta: unit.maqta,
          mawrid: unit.mawrid,
          ta3alom: unit.ta3alom,
          moshkila: unit.moshkila,
          activitiesList: [...unit.activities],
          content: unit.activities.join('؛ '),
          taqwim: unit.taqwim || '',
          note: '',
          lessonType: 'curriculum',
          resourceIndex: programIndex + 1,
          sourceLearningUnitId: unit.sourceLearningUnitId,
          sourceActivityId: unit.sourceActivityIds[0],
          sourceActivityId2: unit.sourceActivityIds[1],
        });
      } else if (lvl === '3م') {
        // كل قسم في السنة الثالثة يتقدم مستقلاً وفق التدرج البيداغوجي المرفق.
        const programIndex = (sessionNum - 1) % DAILY_LOGBOOK_PROGRAM_3AM.length;
        const unit = DAILY_LOGBOOK_PROGRAM_3AM[programIndex];
        generated.push({
          id: `${dateStr}-${sess.section.replace(/\s+/g, '')}-${sess.time.replace(/\s+/g, '')}-${generated.length}`,
          dayName, dateStr, time: sess.time, section: sess.section, level: lvl,
          midan: unit.midan,
          maqta: unit.maqta,
          mawrid: unit.mawrid,
          ta3alom: unit.ta3alom,
          moshkila: unit.moshkila,
          activitiesList: [...unit.activities],
          content: unit.activities.join('؛ '),
          taqwim: unit.taqwim || '',
          note: '',
          lessonType: 'curriculum',
          resourceIndex: programIndex + 1,
          sourceLearningUnitId: unit.sourceLearningUnitId,
          sourceActivityId: unit.sourceActivityIds[0],
          sourceActivityId2: unit.sourceActivityIds[1],
        });
      } else if (lvl === '4م') {
        // كل قسم في السنة الرابعة يتقدم وفق التدرج البيداغوجي المرفق.
        const programIndex = (sessionNum - 1) % DAILY_LOGBOOK_PROGRAM_4AM.length;
        const unit = DAILY_LOGBOOK_PROGRAM_4AM[programIndex];
        generated.push({
          id: `${dateStr}-${sess.section.replace(/\s+/g, '')}-${sess.time.replace(/\s+/g, '')}-${generated.length}`,
          dayName, dateStr, time: sess.time, section: sess.section, level: lvl,
          midan: unit.midan,
          maqta: unit.maqta,
          mawrid: unit.mawrid,
          ta3alom: unit.ta3alom,
          moshkila: unit.moshkila,
          activitiesList: [...unit.activities],
          content: unit.activities.join('؛ '),
          taqwim: unit.taqwim || '',
          note: '',
          lessonType: 'curriculum',
          resourceIndex: programIndex + 1,
          sourceLearningUnitId: unit.sourceLearningUnitId,
          sourceActivityId: unit.sourceActivityIds[0],
          sourceActivityId2: unit.sourceActivityIds[1],
        });
      } else {
        generated.push({
          id: `${dateStr}-${sess.section.replace(/\s+/g, '')}-${sess.time.replace(/\s+/g, '')}-${generated.length}`,
          dayName, dateStr, time: sess.time, section: sess.section, level: lvl,
          ta3alom: `حصة ${sessionNum}`,
          content: `حصة ${sessionNum} — نشاط وسير التعلمات`,
          note: '',
          lessonType: 'curriculum',
          resourceIndex: sessionNum,
        });
      }
    }
    return daySessions.length > 0;
  };

  while (schoolDaysCounted < targetDaysCount && iterationGuard < maxIterations) {
    const dayName = JS_DAY_NAMES[currDate.getDay()];
    const dateStr = formatDateToIsoString(currDate);
    if (dayName !== 'الجمعة' && dayName !== 'السبت' && !isDateInHoliday(dateStr)) {
      if (processDaySessions(dayName, dateStr)) schoolDaysCounted++;
    }
    currDate.setDate(currDate.getDate() + 1);
    iterationGuard++;
  }

  return generated;
}
