import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planLogbookWeeks,
  planWeekPages,
  schoolWeekSunday,
  schoolWeekThursday,
  estimateLines,
  firstIsoDate,
  PAGE_CAPACITY_LINES,
  type BookletSourceRow,
} from '../src/utils/logbookBookletPagination';

const row = (id: string, dateStr: string, text: string): BookletSourceRow => ({ id, dateStr, text });

test('أحد الأسبوع الدراسي: الأحد→الخميس لنفس الأسبوع، والجمعة والسبت للتالي', () => {
  // الأحد 2026-10-04 … الخميس 2026-10-08
  for (const d of ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']) {
    assert.equal(schoolWeekSunday(d), '2026-10-04', d);
  }
  assert.equal(schoolWeekSunday('2026-10-09'), '2026-10-11'); // الجمعة
  assert.equal(schoolWeekSunday('2026-10-10'), '2026-10-11'); // السبت
  assert.equal(schoolWeekThursday('2026-10-04'), '2026-10-08');
});

test('تقدير الأسطر: سطر لكل مقطع وسطر لكل 88 حرفاً', () => {
  assert.equal(estimateLines(''), 1);
  assert.equal(estimateLines('أ'.repeat(88)), 1);
  assert.equal(estimateLines('أ'.repeat(89)), 2);
  assert.equal(estimateLines('سطر أول\nسطر ثان'), 2);
});

test('أسبوع خفيف = صفحة واحدة', () => {
  const pages = planWeekPages([row('a', '2026-10-04', 'حصة قصيرة'), row('b', '2026-10-06', 'حصة قصيرة أخرى')]);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].rows.length, 2);
});

test('أسبوع ثقيل = صفحتان بالضبط مع حفظ الترتيب وبدون صفحة فارغة', () => {
  const heavy = 'نشاط طويل جداً '.repeat(40); // ~640 حرفاً ≈ 8 أسطر لكل صف
  const days = ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12'];
  const rows = Array.from({ length: 12 }, (_, i) => row(`r${i}`, days[i % days.length], heavy));
  const pages = planWeekPages(rows);
  assert.equal(pages.length, 2);
  assert.ok(pages[0].rows.length >= 1 && pages[1].rows.length >= 1);
  assert.equal(pages[0].rows.length + pages[1].rows.length, 12);
  const flat = pages.flatMap((p) => p.rows.map((r) => r.id));
  assert.deepEqual(flat, rows.map((r) => r.id));
  // التوازن: لا صفحة تتجاوز السعة بكثير عن أختها
  assert.ok(Math.abs(pages[0].lines - pages[1].lines) <= Math.max(pages[0].lines, pages[1].lines));
});

test('لا تتجاوز صفحتان أبداً مهما تضخم المحتوى', () => {
  const huge = Array.from({ length: 60 }, (_, i) => row(`h${i}`, '2026-12-06', 'محتوى '.repeat(200)));
  assert.equal(planWeekPages(huge).length, 2);
});

test('التجميع أسبوعياً مرتب زمنياً حتى لو دخلت الصفوف بترتيب مضطرب', () => {
  const rows = [
    row('w2', '2026-10-11', 'أسبوع 2'),
    row('w1b', '2026-10-06', 'أسبوع 1 ب'),
    row('w1a', '2026-10-04', 'أسبوع 1 أ'),
  ];
  const weeks = planLogbookWeeks(rows);
  assert.deepEqual(weeks.map((w) => w.weekKey), ['2026-10-04', '2026-10-11']);
  assert.deepEqual(weeks[0].rows.map((r) => r.id), ['w1a', 'w1b']);
});

test('الصفوف المدموجة متعددة التواريخ تُقرأ من أول تاريخ', () => {
  assert.equal(firstIsoDate('2026-10-08 (ف1) / 2026-10-04 (ف2)'), '2026-10-08');
  const weeks = planLogbookWeeks([row('m', '2026-10-08 (ف1) / 2026-10-04 (ف2)', 'مدموج')]);
  assert.equal(weeks[0].weekKey, '2026-10-04');
});

test('الصفوف بلا تاريخ ISO تُستبعد دون كسر الترتيب', () => {
  const weeks = planLogbookWeeks([row('x', 'بدون تاريخ', 'نص'), row('y', '2026-10-04', 'نص')]);
  assert.equal(weeks.length, 1);
  assert.deepEqual(weeks[0].rows.map((r) => r.id), ['y']);
});

test('سعة الصفحة ثابتة ومعلنة', () => {
  assert.equal(PAGE_CAPACITY_LINES, 44);
});
