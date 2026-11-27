/**
 * محرك التوليد للنظام الجديد.
 *
 * يعتمد حصرياً على `selectedDate` الذي يختاره الأستاذ:
 * - **توليد اليوم**: الحصص في التاريخ نفسه.
 * - **توليد الأسبوع**: الأسبوع الذي ينتمي إليه التاريخ المحدد (من الأحد إلى السبت).
 * - **توليد الشهر**: الشهر الذي ينتمي إليه التاريخ المحدد.
 *
 * لا يستخدم تاريخ تسجيل الدخول أو بداية السنة كمصدر للتوليد. يُعيد
 * استخدام التدرج البيداغوجي الرسمي الموجود (`buildPedagogicalStepsForLevel`)
 * والجدول الزمنيًا لاستخراج محتوى كل حصة.
 */
import {
  buildPedagogicalStepsForLevel,
  extractGroupInfo,
  type PedagogicalStep,
} from '../utils/dailyLogbookGenerator';
import { LOGBOOK_PROGRESSIONS, arabicLevelToCode } from '../data/logbook';
import type { LogbookLevel } from './types';
import {
  formatDateToIsoString,
  getPeriodRange,
  isSchoolDay,
  SCHOOL_WEEK_DAYS,
} from './dateUtils';

/** الفترات الزمنية المعتمدة في الجدول المدرسي. */
export const SCHOOL_PERIODS: { start: string; end: string }[] = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:30', end: '14:30' },
  { start: '14:30', end: '15:30' },
  { start: '15:30', end: '16:30' },
  { start: '16:30', end: '17:30' },
];

/**
 * الجدول الزمنيًا المعتمد (15 ساعة أسبوعية: 5 أقسام × 3h) كأقسام وتواقيت.
 * يُستخدم افتراضياً عند التوليد. يمكن للأستاذ تعديله لاحقاً.
 */
export const DEFAULT_TIMETABLE: Record<string, Record<string, string>> = {
  الأحد: { '08:00': '1م1', '09:00': '1م2', '10:00': '1م5 ف1' },
  الإثنين: { '08:00': '1م1 ف2', '09:00': '1م3', '10:00': '1م5 ف2' },
  الثلاثاء: { '08:00': '1م2 ف2', '09:00': '1م4', '10:00': '' },
  الأربعاء: { '08:00': '1م3 ف2', '09:00': '1م5', '10:00': '' },
  الخميس: { '08:00': '1م4 ف2', '09:00': '', '10:00': '' },
};

export interface GenerateOptions {
  selectedDate: string;
  period: 'day' | 'week' | 'month';
  level?: LogbookLevel;
  timetable?: Record<string, Record<string, string>>;
  sessionsPerActivity?: number;
}

export interface GeneratedLessonPreview {
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  className: string;
  level: LogbookLevel;
  subject: string;
  unit: string;
  activity: string;
  type: 'curriculum' | 'practical' | 'introductory' | 'assessment' | 'remediation' | 'holiday';
  duration: string;
  competency: string;
  flow: string;
  memoTitle?: string;
}

function minutesOf(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/**
 * توليد قائمة الحصص للفترة المحددة حول التاريخ المحدد.
 * يعيد الحصص فقط لأيام الدراسة (الأحد-الخميس) داخل المدى.
 */
export function generateLessons(opts: GenerateOptions): GeneratedLessonPreview[] {
  const { selectedDate, period, level, timetable = DEFAULT_TIMETABLE, sessionsPerActivity = 1 } = opts;
  if (!selectedDate) return [];

  const { start, end } = getPeriodRange(selectedDate, period);
  const cursor = new Date(`${start}T12:00:00`);
  if (Number.isNaN(cursor.getTime())) return [];

  // خط التدرج البيداغوجي لكل مستوى (يُستخدم لاكتشاف المحتوى).
  const stepsByLevel: Record<string, PedagogicalStep[]> = {};
  for (const key of ['1م', '2م', '3م', '4م'] as LogbookLevel[]) {
    stepsByLevel[key] = buildPedagogicalStepsForLevel(key, sessionsPerActivity);
  }

  // مؤشر التقدم لكل قسم (لتوزيع المحتوى عبر الأسابيع بشكل متتابع).
  const cursorByBase: Record<string, number> = {};
  const generated: GeneratedLessonPreview[] = [];

  let guard = 0;
  while (cursor.getTime() <= new Date(`${end}T12:00:00`).getTime() && guard < 400) {
    const iso = formatDateToIsoString(cursor);
    if (iso >= start && iso <= end && isSchoolDay(iso)) {
      const dayName = SCHOOL_WEEK_DAYS[cursor.getDay()];
      const slots = timetable[dayName] || {};
      const entries = Object.entries(slots).filter(([, cls]) => cls && cls.trim());
      entries.sort((a, b) => minutesOf(a[0]) - minutesOf(b[0]));
      for (const [time, cls] of entries) {
        const info = extractGroupInfo(cls);
        const base = info.baseSection || cls;
        const lvl = (info.level as LogbookLevel) || level || '3م';
        const steps = stepsByLevel[lvl] || [];
        const idx = cursorByBase[base] || 0;
        if (steps.length === 0) {
          // لا يوجد تدرج للمستوى — نُدرج حصة بعنوان القسم فقط دون اختلاق محتوى.
          generated.push(makeEmptySlot(iso, dayName, time, cls, lvl));
          continue;
        }
        if (idx >= steps.length) {
          // انتهاء التدرج — تبقى الخانة شاغرة ولا تُكرر آخر حصة.
          cursorByBase[base] = idx;
          continue;
        }
        const step = steps[idx];
        cursorByBase[base] = idx + 1;
        generated.push(makeStepLesson(iso, dayName, time, cls, lvl, step));
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  return generated.sort(
    (a, b) => a.date.localeCompare(b.date) || minutesOf(a.startTime) - minutesOf(b.startTime)
  );
}

function makeStepLesson(
  date: string,
  dayName: string,
  time: string,
  cls: string,
  level: LogbookLevel,
  step: PedagogicalStep
): GeneratedLessonPreview {
  const duration = '1 ساعة';
  const isPractical = step.isPractical || /تحليل|الكشف|تجربة|مخبر|تشريح|مجهر/i.test(step.activityText);
  const type = isPractical
    ? 'practical'
    : step.isIntroductory
    ? 'introductory'
    : step.isReview
    ? 'remediation'
    : 'curriculum';
  const unit = step.ta3alom || step.mawrid || step.midan;
  return {
    date,
    dayName,
    startTime: time,
    endTime: nextPeriodEnd(time),
    className: cls,
    level,
    subject: 'علوم الطبيعة والحياة',
    unit,
    activity: step.activityText,
    type,
    duration,
    competency: step.irsaaText || step.taqwim || '',
    flow: step.fullContent,
    memoTitle: `${step.midan} · ${step.mawrid} · ${step.ta3alom}`,
  };
}

function makeEmptySlot(
  date: string,
  dayName: string,
  time: string,
  cls: string,
  level: LogbookLevel
): GeneratedLessonPreview {
  return {
    date,
    dayName,
    startTime: time,
    endTime: nextPeriodEnd(time),
    className: cls,
    level,
    subject: 'علوم الطبيعة والحياة',
    unit: '',
    activity: '',
    type: 'curriculum',
    duration: '1 ساعة',
    competency: '',
    flow: '',
  };
}

function nextPeriodEnd(time: string): string {
  const idx = SCHOOL_PERIODS.findIndex((p) => p.start === time);
  if (idx >= 0) return SCHOOL_PERIODS[idx].end;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return time;
  const mins = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + 60;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** المحتوى التعليمي المتاح لربط الحصة به (من قاعدة التدرج البيداغوجي). */
export function getCurriculumUnits(level?: LogbookLevel) {
  if (!level) return [];
  const code = arabicLevelToCode(level);
  const units = LOGBOOK_PROGRESSIONS[code];
  return units.map((u) => ({
    id: u.id,
    level: u.arabicLevel,
    midan: u.midan,
    maqta: u.maqta,
    mawrid: u.mawrid,
    ta3alom: u.ta3alom,
    activities: u.activities,
    taqwim: u.taqwim || '',
    irsaaText: u.irsaaText || '',
    sourcePage: u.sourceFile.sourcePage,
  }));
}
