/**
 * أدوات التاريخ للنظام الجديد.
 *
 * القاعدة الأساسية: التاريخ الذي يختاره الأستاذ (`selectedDate`) هو المرجع
 * الوحيد لتحديد محتوى الدفتر. لا يعتمد النظام مطلقاً على تاريخ تسجيل
 * الدخول أو بداية السنة كمصدر للتوليد.
 */

export const ARABIC_MONTH_NAMES = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const ARABIC_WEEK_DAYS = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت',
];

/** أيام الدراسة الرسمية في الجزائر (الأحد إلى الخميس). */
export const SCHOOL_WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

/** تنسيق تاريخ إلى صيغة ISO (YYYY-MM-DD). */
export function formatDateToIsoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** تنسيق تاريخ ISO إلى صيغة عربية جميلة (مثال: 18 نوفمبر 2026). */
export function formatDateArabic(iso: string): string {
  if (!iso) return '';
  const clean = iso.split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${ARABIC_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** اليوم باللغة العربية لتاريخ ISO. */
export function dayNameOf(iso: string): string {
  const clean = (iso || '').split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return ARABIC_WEEK_DAYS[d.getDay()];
}

/** هل هذا اليوم من أيام الدراسة (الأحد-الخميس)؟ */
export function isSchoolDay(iso: string): boolean {
  const clean = (iso || '').split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day >= 0 && day <= 4;
}

/** إضافة أيام إلى تاريخ. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.split(' ')[0]}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return formatDateToIsoString(d);
}

/**
 * بداية الأسبوع الذي ينتمي إليه التاريخ المحدد.
 * الأسبوع يبدأ يوم الأحد (يوم الدراسة الأول).
 */
export function startOfWeek(iso: string): string {
  const clean = (iso || '').split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() - d.getDay());
  return formatDateToIsoString(d);
}

/** نهاية الأسبوع (يوم السبت). */
export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6);
}

/** بداية الشهر الذي ينتمي إليه التاريخ المحدد. */
export function startOfMonth(iso: string): string {
  const clean = (iso || '').split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(1);
  return formatDateToIsoString(d);
}

/** نهاية الشهر الذي ينتمي إليه التاريخ المحدد. */
export function endOfMonth(iso: string): string {
  const clean = (iso || '').split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return formatDateToIsoString(d);
}

/**
 * المدى الزمني (البداية والنهاية) للفترة المحددة حول التاريخ المحدد.
 * - اليوم: التاريخ نفسه.
 * - الأسبوع: من الأحد إلى السبت للأسبواع الذي يحتوي على التاريخ.
 * - الشهر: اليوم الأول إلى آخر يوم من الشهر.
 */
export function getPeriodRange(iso: string, period: 'day' | 'week' | 'month'): { start: string; end: string } {
  const clean = (iso || '').split(' ')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return { start: clean, end: clean };
  if (period === 'day') return { start: clean, end: clean };
  if (period === 'week') return { start: startOfWeek(clean), end: endOfWeek(clean) };
  return { start: startOfMonth(clean), end: endOfMonth(clean) };
}

/** هل التاريخ يقع داخل المدى المحدد (شامل). */
export function isWithinRange(iso: string, start: string, end: string): boolean {
  const clean = (iso || '').split(' ')[0];
  return clean >= start && clean <= end;
}

/** توليد قائمة تواريخ أيام الدراسة داخل مدى زمني. */
export function schoolDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < 400) {
    if (isSchoolDay(cursor)) days.push(cursor);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return days;
}

/** فهرسة أسابيع الشهر (لعرض الأسابيع في عرض الشهر). */
export function weeksOfMonth(iso: string): { start: string; end: string; label: string }[] {
  const monthStart = startOfMonth(iso);
  const monthEnd = endOfMonth(iso);
  const weeks: { start: string; end: string; label: string }[] = [];
  let sunday = startOfWeek(monthStart);
  let guard = 0;
  while (sunday <= monthEnd && guard < 8) {
    const wed = addDays(sunday, 6);
    weeks.push({
      start: sunday,
      end: wed,
      label: `الأسبوع ${weeks.length + 1}`,
    });
    sunday = addDays(sunday, 7);
    guard++;
  }
  return weeks;
}

/** تاريخ اليوم الحالي (لا يُستخدم للتوليد، فقط كقيمة افتراضية للاختيار). */
export function todayIso(): string {
  return formatDateToIsoString(new Date());
}
