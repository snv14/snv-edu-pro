/**
 * ترقيم صفحات كتاب الدفتر اليومي: لكل أسبوع دراسي صفحة واحدة أو صفحتان
 * حسب حجم المحتوى، بقاعدة حتمية قابلة للاختبار حتى لا تتبدل الصفحات صمتاً.
 *
 * الأسبوع الدراسي = الأحد→الخميس؛ يوما الجمعة والسبت يُضمّان إلى الأسبوع التالي.
 */

export interface BookletSourceRow {
  id: string;
  /** قد يحوي عدة تواريخ ISO между группами مدموجة؛ يُقرأ أول تاريخ. */
  dateStr: string;
  /** النص المعروض في خانة المحتوى. */
  text: string;
}

export interface WeekPage {
  rows: BookletSourceRow[];
  lines: number;
}

export interface WeekPlan {
  /** تاريخ ISO لأحد بداية الأسبوع — مفتاح الترتيب الزمني. */
  weekKey: string;
  rows: BookletSourceRow[];
  pages: WeekPage[];
  lines: number;
}

/** سعة الحرف في سطر الجدول بعرض 192mm تقريباً. */
export const CHARS_PER_LINE = 88;
/** أسطر المحتوى المتاحة في صفحة A4 بعد الترويسة والتذييل والتواقيع. */
export const PAGE_CAPACITY_LINES = 44;
/** سطر إضافي لكل صف جدول (حشوة وحدود). */
export const ROW_OVERHEAD_LINES = 1;

export function firstIsoDate(dateStr: string): string | null {
  const m = String(dateStr || '').match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

const isoPlus = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** أحد بداية الأسبوع الدراسي الذي يحوي التاريخ (الجمعة والسبت للأسبوع التالي). */
export function schoolWeekSunday(dateIso: string): string {
  const day = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  if (day === 5) return isoPlus(dateIso, 2);
  if (day === 6) return isoPlus(dateIso, 1);
  return isoPlus(dateIso, -day);
}

export function schoolWeekThursday(weekKey: string): string {
  return isoPlus(weekKey, 4);
}

/** تقدير الأسطر التي يشغلها نص: سطر لكل مقطع، وسطر لكل 88 حرفاً. */
export function estimateLines(text: string): number {
  const parts = String(text || '').split('\n');
  return parts.reduce((sum, part) => sum + Math.max(1, Math.ceil(part.trim().length / CHARS_PER_LINE)), 0);
}

export function rowLines(row: BookletSourceRow): number {
  return estimateLines(row.text) + ROW_OVERHEAD_LINES;
}

/**
 * صفحات الأسبوع: صفحة إن اتسع المحتوى، وإلا صفحتان متوازنتان مع حفظ الترتيب.
 * لا تُنتج أكثر من صفحتين أبداً — القاعدة المعلنة للمستخدم.
 */
export function planWeekPages(rows: BookletSourceRow[]): WeekPage[] {
  if (rows.length === 0) return [];
  const lines = rows.map(rowLines);
  const total = lines.reduce((a, b) => a + b, 0);
  if (total <= PAGE_CAPACITY_LINES) return [{ rows, lines: total }];

  const target = total / 2;
  const first: BookletSourceRow[] = [];
  let acc = 0;
  let i = 0;
  // صفحة أولى لا تتجاوز النصف، وبصف واحد على الأقل، ولا تترك الثانية فارغة
  while (i < rows.length - 1 && (acc === 0 || acc + lines[i] <= target)) {
    first.push(rows[i]);
    acc += lines[i];
    i++;
  }
  const second = rows.slice(i);
  const secondLines = lines.slice(i).reduce((a, b) => a + b, 0);
  return [
    { rows: first, lines: acc },
    { rows: second, lines: secondLines },
  ];
}

/** تجميع الصفوف أسابيعَ مرتبة زمنياً بحكم أحد البداية. */
export function planLogbookWeeks(rows: BookletSourceRow[]): WeekPlan[] {
  const byWeek = new Map<string, BookletSourceRow[]>();
  for (const row of rows) {
    const iso = firstIsoDate(row.dateStr);
    if (!iso) continue;
    const key = schoolWeekSunday(iso);
    const list = byWeek.get(key) ?? [];
    list.push(row);
    byWeek.set(key, list);
  }
  return [...byWeek.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([weekKey, weekRows]) => {
      const ordered = [...weekRows].sort((a, b) => {
        const da = firstIsoDate(a.dateStr) ?? '';
        const db = firstIsoDate(b.dateStr) ?? '';
        return da < db ? -1 : da > db ? 1 : 0;
      });
      return {
        weekKey,
        rows: ordered,
        pages: planWeekPages(ordered),
        lines: ordered.reduce((s, r) => s + rowLines(r), 0),
      };
    });
}
