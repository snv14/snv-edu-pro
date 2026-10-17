import { OfficialAnnualDistributionRow } from '../data/officialAnnualDistributionData';

export const ANNUAL_SCHEDULE_DATA_VERSION = '2026-10-14-1am-exact-user-v1';
export const ANNUAL_STORAGE_KEY = 'algeria_sciences_annual_dist_exact_user_v1';

export const ARABIC_MONTH_NAMES = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export interface SchoolCalendarSettings {
  startDate: string; // YYYY-MM-DD
  schoolYear: string;
  dateFormat: 'short' | 'spaced' | 'withMonth' | 'isoShort';
  holidays: {
    autumnWeek: number;
    autumnLabel: string;
    winterWeeks: [number, number];
    winterLabel: string;
    springWeeks: [number, number];
    springLabel: string;
  };
  exams: {
    exam1Week: number;
    exam1Label: string;
    exam2Week: number;
    exam2Label: string;
    exam3Week: number;
    exam3Label: string;
  };
}

/**
 * اشتقاق تاريخ الدخول المدرسي الافتراضي حسب السنة الدراسية في الجزائر (الأحد المناسب في سبتمبر)
 */
export function deriveDefaultSchoolEntryDate(schoolYear: string): string {
  const match = String(schoolYear || '').match(/(20\d{2})/);
  const year = match ? Number(match[1]) : 2024;
  
  if (year === 2024) return '2024-09-22';
  if (year === 2025) return '2025-09-21';
  if (year === 2026) return '2026-09-21';
  
  // البحث عن الأحد الثالث أو الرابع من سبتمبر
  const sepDate = new Date(year, 8, 20); // 20 سبتمبر
  while (sepDate.getDay() !== 0) { // الأحد = 0
    sepDate.setDate(sepDate.getDate() + 1);
  }
  const m = String(sepDate.getMonth() + 1).padStart(2, '0');
  const d = String(sepDate.getDate()).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * اشتقاق تسمية السنة الدراسية (مثال: 2025-2026) من تاريخ البداية
 */
export function deriveSchoolYearFromDate(dateStr: string): string {
  if (!dateStr) return '2024-2025';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '2024-2025';
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 is Jan, 8 is Sep
  if (month >= 7) { // من شهر أوت فما فوق، بداية موسم دراسي جديد
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * الحصول على الإعدادات الافتراضية للرزنامة الوزارية
 */
export function getDefaultCalendarSettings(schoolYear: string, customStartDate?: string): SchoolCalendarSettings {
  const startDate = customStartDate || deriveDefaultSchoolEntryDate(schoolYear);
  return {
    startDate,
    schoolYear: schoolYear || '2026-2027',
    dateFormat: 'short',
    holidays: {
      autumnWeek: 7,
      autumnLabel: 'عطلة الخريف',
      winterWeeks: [15, 15],
      winterLabel: 'عطلة الشتاء',
      springWeeks: [27, 27],
      springLabel: 'عطلة الربيع',
    },
    exams: {
      exam1Week: 13,
      exam1Label: 'اختبارات الثلاثي الأول',
      exam2Week: 25,
      exam2Label: 'اختبارات الثلاثي الثاني',
      exam3Week: 34,
      exam3Label: 'اختبارات الثلاثي الثالث',
    },
  };
}

/**
 * محاذاة أي تاريخ إلى يوم الأحد المقابل في الأسبوع الدراسي الجزائري
 */
export function alignToSunday(dateStr: string): Date {
  if (!dateStr) return new Date();
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date();
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const dayOfMonth = Number(match[3]);
  const d = new Date(year, month, dayOfMonth, 12, 0, 0);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  if (day === 6) {
    // السبت: عشية الدخول المدرسي في الجزائر، يبدأ الأسبوع غداً الأحد (+1)
    d.setDate(d.getDate() + 1);
  } else if (day === 5) {
    // الجمعة: عطلة أسبوعية، يُحاذى للأحد الموالي (+2)
    d.setDate(d.getDate() + 2);
  } else if (day > 0) {
    // الاثنين إلى الخميس: ضمن نفس الأسبوع الدراسي، يحاذى لأحد هذا الأسبوع
    d.setDate(d.getDate() - day);
  }
  return d;
}

/**
 * حساب تفاصيل الأسبوع (الأحد والخميس والشهر والصيغة النصية)
 */
export function computeWeekRange(
  startSunday: Date,
  weekIndex: number,
  dateFormat: SchoolCalendarSettings['dateFormat'] = 'short'
) {
  // حساب الأحد والخميس بحساب الأيام الصريح لتفادي فروقات التوقيت الصيفي/الشتوي
  const sunday = new Date(startSunday.getFullYear(), startSunday.getMonth(), startSunday.getDate() + weekIndex * 7, 12, 0, 0);
  const thursday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 4, 12, 0, 0);

  const sunDayStr = String(sunday.getDate()).padStart(2, '0');
  const thuDayStr = String(thursday.getDate()).padStart(2, '0');
  const sunMonth = sunday.getMonth();
  const thuMonth = thursday.getMonth();

  // تحديد الشهر المعتمد في الوثائق الوزارية
  let monthName = ARABIC_MONTH_NAMES[sunMonth];
  if (sunMonth !== thuMonth) {
    // حساب عدد أيام الدراسة الواقعة في كل شهر
    const daysInSunMonth = (new Date(sunday.getFullYear(), sunMonth + 1, 0).getDate()) - sunday.getDate() + 1;
    const daysInThuMonth = thursday.getDate();
    monthName = daysInThuMonth >= daysInSunMonth ? ARABIC_MONTH_NAMES[thuMonth] : ARABIC_MONTH_NAMES[sunMonth];
  }

  let datesStr = `${sunDayStr}-${thuDayStr}`;
  if (dateFormat === 'spaced') {
    datesStr = `${sunDayStr} − ${thuDayStr}`;
  } else if (dateFormat === 'withMonth') {
    if (sunMonth === thuMonth) {
      datesStr = `${sunDayStr} إلى ${thuDayStr} ${ARABIC_MONTH_NAMES[sunMonth]}`;
    } else {
      datesStr = `${sunDayStr} ${ARABIC_MONTH_NAMES[sunMonth]} إلى ${thuDayStr} ${ARABIC_MONTH_NAMES[thuMonth]}`;
    }
  } else if (dateFormat === 'isoShort') {
    const sMonth = String(sunMonth + 1).padStart(2, '0');
    const tMonth = String(thuMonth + 1).padStart(2, '0');
    datesStr = `${sunDayStr}/${sMonth} - ${thuDayStr}/${tMonth}`;
  }

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const isoStart = `${sunday.getFullYear()}-${pad2(sunday.getMonth() + 1)}-${pad2(sunday.getDate())}`;
  const isoEnd = `${thursday.getFullYear()}-${pad2(thursday.getMonth() + 1)}-${pad2(thursday.getDate())}`;

  return {
    sunday,
    thursday,
    sunDayStr,
    thuDayStr,
    monthName,
    datesStr,
    isoStart,
    isoEnd,
  };
}

/**
 * إعادة حساب كافة تواريخ وأشهر التدرج السنوي بناءً على تاريخ الدخول المدرسي والعطل والاختبارات
 */
export function recalculateDistributionRows(
  baseRows: OfficialAnnualDistributionRow[],
  settings: SchoolCalendarSettings
): OfficialAnnualDistributionRow[] {
  if (!baseRows || baseRows.length === 0) return [];
  // تاريخ الدخول هو مرساة الأسبوع الأول، حتى لو كان الدخول يوم الإثنين–الخميس.
  const startSunday = new Date(`${settings.startDate}T12:00:00`);

  return baseRows.map((row, index) => {
    // رقم الأسبوع يبدأ من 1
    const weekNum = typeof row.week === 'number' ? row.week : (index + 1);
    const weekIndex = weekNum - 1;

    const range = computeWeekRange(startSunday, weekIndex, settings.dateFormat);

    // الحفاظ على التواريخ الوزارية الرسمية للأسبوع
    const finalMonth = (row.month && settings.dateFormat === 'short') ? row.month : range.monthName;
    const finalDates = (row.dates && settings.dateFormat === 'short') ? row.dates : range.datesStr;

    // لا يتم تحويل أي درس بيداغوجي لـ عطلة أو اختبار إلا إذا كان الصف مصنفاً رسمياً كذلك
    const isHoliday = Boolean(row.isHoliday || /عطلة/.test(row.session1 || '') || /عطلة/.test(row.mawrid || ''));
    const isExam = Boolean(row.isExam || /إ?ختبار|اختبارات/.test(row.session1 || '') || /إ?ختبار|اختبارات/.test(row.mawrid || ''));

    const isAutumn = weekNum === settings.holidays.autumnWeek;
    const isWinter = settings.holidays.winterWeeks.includes(weekNum as any);
    const isSpring = settings.holidays.springWeeks.includes(weekNum as any);
    const isExam1 = weekNum === settings.exams.exam1Week;
    const isExam2 = weekNum === settings.exams.exam2Week;
    const isExam3 = weekNum === settings.exams.exam3Week;

    let updatedSession1 = row.session1;
    let updatedSession2 = row.session2;
    let updatedHolidayLabel = row.holidayLabel;
    let updatedMawrid = row.mawrid;

    // تحديث مسميات العطل والاختبارات فقط إذا كان الصف عطلة أو اختباراً بالفعل
    if (isHoliday) {
      if (isAutumn) {
        updatedHolidayLabel = settings.holidays.autumnLabel;
        if (/عطلة/.test(row.session1 || '')) updatedSession1 = settings.holidays.autumnLabel;
        if (/عطلة/.test(row.session2 || '')) updatedSession2 = settings.holidays.autumnLabel;
      } else if (isWinter) {
        updatedHolidayLabel = settings.holidays.winterLabel;
        if (/عطلة/.test(row.session1 || '')) updatedSession1 = settings.holidays.winterLabel;
        if (/عطلة/.test(row.session2 || '')) updatedSession2 = settings.holidays.winterLabel;
      } else if (isSpring) {
        updatedHolidayLabel = settings.holidays.springLabel;
        if (/عطلة/.test(row.session1 || '')) updatedSession1 = settings.holidays.springLabel;
        if (/عطلة/.test(row.session2 || '')) updatedSession2 = settings.holidays.springLabel;
      }
    }

    if (isExam) {
      if (isExam1 && /اختبارات|إختبار/.test(row.session1 || '')) {
        updatedMawrid = settings.exams.exam1Label;
        updatedSession1 = settings.exams.exam1Label;
      } else if (isExam2 && /اختبارات|إختبار/.test(row.session1 || '')) {
        updatedMawrid = settings.exams.exam2Label;
        updatedSession1 = settings.exams.exam2Label;
      } else if (isExam3 && /اختبارات|إختبار/.test(row.session1 || '')) {
        updatedMawrid = settings.exams.exam3Label;
        updatedSession1 = settings.exams.exam3Label;
      }
    }

    return {
      ...row,
      week: weekNum,
      month: finalMonth,
      dates: finalDates,
      isHoliday,
      isExam,
      holidayLabel: updatedHolidayLabel,
      session1: updatedSession1,
      session2: updatedSession2,
      mawrid: updatedMawrid,
    };
  });
}

/**
 * مزامنة تاريخ الدخول والعطل مع دفتر النصوص في التخزين المحلي
 */
export function syncCalendarToDailyLogbook(startDate: string, settings: SchoolCalendarSettings): boolean {
  try {
    const raw = localStorage.getItem('daftar_table_v2027');
    const logbook = raw ? JSON.parse(raw) : {};
    
    logbook.startDate = startDate;
    
    // حساب تواريخ العطل لإدراجها في قائمة عطل الدفتر
    const startSunday = alignToSunday(startDate);
    const autumnRange = computeWeekRange(startSunday, settings.holidays.autumnWeek - 1);
    const winter1Range = computeWeekRange(startSunday, settings.holidays.winterWeeks[0] - 1);
    const winter2Range = computeWeekRange(startSunday, settings.holidays.winterWeeks[1] - 1);
    const spring1Range = computeWeekRange(startSunday, settings.holidays.springWeeks[0] - 1);
    const spring2Range = computeWeekRange(startSunday, settings.holidays.springWeeks[1] - 1);

    const generatedHolidays = [
      {
        id: 'holiday-autumn',
        startDate: autumnRange.isoStart,
        endDate: autumnRange.isoEnd,
        label: settings.holidays.autumnLabel,
      },
      {
        id: 'holiday-winter',
        startDate: winter1Range.isoStart,
        endDate: winter2Range.isoEnd,
        label: settings.holidays.winterLabel,
      },
      {
        id: 'holiday-spring',
        startDate: spring1Range.isoStart,
        endDate: spring2Range.isoEnd,
        label: settings.holidays.springLabel,
      },
    ];

    // دمج العطل دون تكرار
    const existingHolidays = Array.isArray(logbook.holidays) ? logbook.holidays : [];
    const nonOfficialHolidays = existingHolidays.filter(
      (h: any) => !/عطلة الخريف|عطلة الشتاء|عطلة الربيع/.test(h.label || '')
    );

    logbook.holidays = [...generatedHolidays, ...nonOfficialHolidays];
    localStorage.setItem('daftar_table_v2027', JSON.stringify(logbook));

    // إشعار كافة المكونات في الصفحة بتحديث الرزنامة فورياً
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('school-calendar-updated', {
        detail: { startDate, settings }
      }));
    }
    return true;
  } catch (err) {
    console.error('فشل مزامنة الرزنامة مع دفتر النصوص:', err);
    return false;
  }
}

/**
 * مزامنة تاريخ الدخول المدرسي والرزنامة الوزارية عبر كافة المستويات (1م، 2م، 3م، 4م) وفي التخزين المحلي
 */
export function syncCalendarToAllLevels(
  newSettings: SchoolCalendarSettings,
  levelBaseRowsProvider?: (level: '1am' | '2am' | '3am' | '4am') => OfficialAnnualDistributionRow[]
): boolean {
  try {
    const ANNUAL_STORAGE_KEY = 'annual_distribution_custom_v3';
    const existing = JSON.parse(localStorage.getItem(ANNUAL_STORAGE_KEY) || '{}');
    
    // حفظ الإعدادات العالمية الموحدة لكامل المؤسسة
    existing.globalCalendarSettings = newSettings;

    const levels: ('1am' | '2am' | '3am' | '4am')[] = ['1am', '2am', '3am', '4am'];
    for (const lvl of levels) {
      const prevData = existing[lvl] || {};
      const baseRows = (Array.isArray(prevData.items) && prevData.items.length > 0)
        ? prevData.items
        : (levelBaseRowsProvider ? levelBaseRowsProvider(lvl) : []);

      if (baseRows && baseRows.length > 0) {
        const recalculated = recalculateDistributionRows(baseRows, newSettings);
        existing[lvl] = {
          ...prevData,
          startDate: newSettings.startDate,
          calendarSettings: newSettings,
          items: recalculated,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    localStorage.setItem(ANNUAL_STORAGE_KEY, JSON.stringify(existing));

    // مزامنة دفتر النصوص اليومي أيضاً
    syncCalendarToDailyLogbook(newSettings.startDate, newSettings);

    if (typeof window !== 'undefined') {
      if ((window as any).syncToCloud) {
        (window as any).syncToCloud('annualDist', existing);
      }
      window.dispatchEvent(new CustomEvent('school-calendar-updated', {
        detail: { startDate: newSettings.startDate, settings: newSettings }
      }));
    }
    return true;
  } catch (error) {
    console.error('فشل تطبيق الرزنامة على كافة المستويات:', error);
    return false;
  }
}

