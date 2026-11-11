import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_2AM_DISTRIBUTION } from '../src/data/curriculum/annualDistribution2am2026';

/**
 * الترتيب الزمني لتدرج السنة الثانية متوسط — الموسم 2026-2027.
 *
 * الورقة الرسمية تطبع الأسابيع داخل كل شهر بلا تواريخ؛ التواريخ هنا مشتقة من
 * أسبوع الأحد→الخميس ومرتكزة على نطاقَي العطلة الرسميين المطبوعين فيها.
 * هذه الاختبارات تجعل الاشتقاق قابلاً للفحص آلياً حتى لا ينكسر صمتاً.
 */

const rows = OFFICIAL_2AM_DISTRIBUTION as Array<Record<string, any>>;

const AR_MONTHS: Record<string, number> = {
  'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
  'جانفي': 1, 'فيفري': 2, 'مارس': 3, 'أفريل': 4, 'ماي': 5, 'جوان': 6,
};

const span = (r: Record<string, any>): [string, string] => {
  const [s, e] = String(r.dates).split(' → ');
  assert.ok(s && e, `صف بلا نطاق تواريخ: week=${r.week}`);
  return [s, e];
};
const plusDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const monthOf = (iso: string): number => Number(iso.slice(5, 7));

test('الأسابيع متسلسلة تصاعدياً 1..36 بلا تكرار ولا فجوة', () => {
  assert.equal(rows.length, 36);
  rows.forEach((r, i) => assert.equal(Number(r.week), i + 1));
});

test('كل صف له نطاق ISO يبدأ الأحد وينتهي الخميس (+4 أيام)', () => {
  for (const r of rows) {
    const [s, e] = span(r);
    assert.match(s, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(`${s}T00:00:00Z`).getUTCDay(), 0, `${s} ليس أحداً (week=${r.week})`);
    assert.equal(e, plusDays(s, 4), `نهاية الأسبوع ليست الخميس (week=${r.week})`);
  }
});

test('الترتيب الزمني صارم: كل أسبوع يبدأ بعد انتهاء سابقه', () => {
  for (let i = 1; i < rows.length; i++) {
    const [s] = span(rows[i]);
    const [, pe] = span(rows[i - 1]);
    assert.ok(s > pe, `week=${rows[i].week} يبدأ ${s} قبل انتهاء week=${rows[i - 1].week} في ${pe}`);
  }
});

test('المرتكزان الرسميان: العطلة الشتوية والربيعية كما تطبعهما الورقة', () => {
  const by = (m: string, w: number) => rows.find((r) => r.month === m && r.weekInMonth === w)!;
  // آخر أسبوع تدريس قبل الشتاء ينتهي الخميس 17 ديسمبر 2026 مساءً
  assert.equal(span(by('ديسمبر', 2))[1], '2026-12-17');
  // أسبوعا العطلة الشتوية
  assert.deepEqual(span(by('ديسمبر', 3)), ['2026-12-20', '2026-12-24']);
  assert.deepEqual(span(by('ديسمبر', 4)), ['2026-12-27', '2026-12-31']);
  // الاستئناف الأحد 03 جانفي 2027 صباحاً
  assert.equal(span(by('جانفي', 1))[0], '2027-01-03');
  // آخر أسبوع تدريس قبل الربيع ينتهي الخميس 18 مارس 2027 مساءً
  assert.equal(span(by('مارس', 3))[1], '2027-03-18');
  assert.deepEqual(span(by('مارس', 4)), ['2027-03-21', '2027-03-25']);
  // الاستئناف الأحد 04 أفريل 2027 صباحاً
  assert.equal(span(by('أفريل', 1))[0], '2027-04-04');
  // نص العطلة حرفي من الورقة
  assert.match(by('ديسمبر', 3).holidayLabel, /من الخميس 17 ديسمبر 2026 مساء إلى الأحد 03 جانفي 2027 صباحا/);
  assert.match(by('مارس', 3).holidayLabel, /من الخميس 18 مارس 2027 مساء إلى الأحد 04 أفريل 2027 صباحا/);
});

test('الأسبوعان الغائبان عن الورقة هما 2026-11-01 و2027-03-28 فحسب', () => {
  const [first] = span(rows[0]);
  const [lastStart] = span(rows[rows.length - 1]);
  const covered = new Set(rows.map((r) => span(r)[0]));
  const missing: string[] = [];
  for (let s = first; s <= lastStart; s = plusDays(s, 7)) if (!covered.has(s)) missing.push(s);
  assert.deepEqual(missing, ['2026-11-01', '2027-03-28']);
});

test('تسمية الشهر تطابق شهر الأحد أو شهر أكثرية أيام الأسبوع', () => {
  for (const r of rows) {
    const label = AR_MONTHS[r.month];
    assert.ok(label, `شهر غير معروف: ${r.month}`);
    const [s] = span(r);
    const counts = new Map<number, number>();
    for (let d = 0; d < 5; d++) {
      const m = monthOf(plusDays(s, d));
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    const inLabel = counts.get(label) ?? 0;
    const max = Math.max(...counts.values());
    assert.ok(
      monthOf(s) === label || (inLabel >= 3 && inLabel === max),
      `week=${r.week}: الأحد ${s} من شهر ${monthOf(s)} والتسمية ${r.month} وليست شهر الأكثرية (${inLabel}/5)`
    );
  }
});

test('الأسبوع الأول مفصول: الافتتاح في الحصة 1 والتقويم التشخيصي في الحصة 2', () => {
  const w1 = rows[0];
  assert.match(w1.session1, /استقبال التلاميذ/);
  assert.ok(!/التقويم التشخيصي/.test(w1.session1), 'التقويم التشخيصي ما زال محزوماً في الحصة 1');
  assert.equal(w1.session2, 'التقويم التشخيصي');
  assert.equal(w1.isIntroductory, true);
});

test('النِسب التراكمية تصاعدية صارمة عبر صفوف التدريس', () => {
  let prev = -1;
  for (const r of rows) {
    if (!r.percent) continue;
    const v = parseFloat(String(r.percent).replace('%', ''));
    assert.ok(v > prev, `نسبة غير تصاعدية عند week=${r.week}: ${v} بعد ${prev}`);
    prev = v;
  }
  assert.equal(prev, 100);
});
