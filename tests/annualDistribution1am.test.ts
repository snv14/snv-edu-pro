/**
 * حراسة التوزيع السنوي الرسمي لسنة أولى متوسط — مستندة إلى الوثيقة الورقية
 * «التوزيع السنوي للأنشطة — السنة الأولى متوسط»، متوسطة حسناوي عبد القادر،
 * السوقر/تيارت، الأستاذ جمال الدين أمين شعلال، الموسم 2026-2027.
 *
 * هذه الحراسة تحمي **البنية** التي كشفتها الوثيقة، لأنها كانت خاطئة في المنصة:
 *
 * 1) الميدانان متناوبان وليسا كتلتين: المقطع 3 في الميدان الأول هو «الإطراح عند
 *    الإنسان» وليس «التحصل على الطاقة عند النبات». الميدان الأول = التغذية ←
 *    التحصل على الطاقة ← الإطراح ← التكاثر عند الإنسان؛ الميدان الثاني = التغذية
 *    عند النبات ← التحصل على الطاقة عند النبات ← التكاثر عند النباتات ذات الأزهار
 *    ← الخلية.
 *
 * 2) الوثيقة 32 سطراً تنتهي باختبار الفصل الثالث، وليست 36 أسبوعاً ولا 39 سطراً.
 *
 * 3) النسب المئوية منقولة كما هي مطبوعة، وتنتهي عند 100 % في الخلية/الاختبار الثالث.
 *
 * 4) نهاية السنة الدراسية في جوان لا في سبتمبر (إصلاح `getLogbookPeriodEnd`).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_1AM_DISTRIBUTION } from '../src/data/curriculum/officialAnnualDistributionData';
import { getLogbookPeriodEnd, generateLogbookEntries } from '../src/utils/dailyLogbookGenerator';

const rows = OFFICIAL_1AM_DISTRIBUTION as Array<Record<string, any>>;

const MIDAN_1 = 'الإنسان والصحة';
const MIDAN_2 = 'الإنسان والمحيط';

const rowsOf = (needle: string) =>
  rows.filter(r => String(r.maqta || '').includes(needle));

// ═══════════════ 1. تقويم السنة الدراسية ═══════════════

test('نهاية السنة الدراسية في جوان لا في سبتمبر', () => {
  assert.equal(getLogbookPeriodEnd('2026-09-21', 'سنة'), '2027-06-30');
  assert.equal(getLogbookPeriodEnd('2026-08-15', 'سنة'), '2027-06-30');
  assert.equal(getLogbookPeriodEnd('2027-01-10', 'سنة'), '2027-06-30');
});

test('المدد القصيرة لم تتغير', () => {
  assert.equal(getLogbookPeriodEnd('2026-09-21', 'أسبوع'), '2026-09-28');
  assert.equal(getLogbookPeriodEnd('2026-09-21', 'أسبوعين'), '2026-10-05');
  assert.equal(getLogbookPeriodEnd('2026-09-21', 'شهر'), '2026-10-21');
});

// ═══════════════ 2. البنية العامة ═══════════════

test('التوزيع السنوي: 32 سطراً كما في الوثيقة (لا 36 ولا 39)', () => {
  assert.equal(rows.length, 32);
});

test('التوزيع السنوي: الأسابيع متصلة من 1 إلى 32 بلا فجوة ولا تكرار', () => {
  const weeks = rows.map(r => Number(r.week));
  assert.deepEqual(weeks, Array.from({ length: 32 }, (_, i) => i + 1));
});

test('التوزيع السنوي: معرّفات الأسطر فريدة', () => {
  const ids = rows.map(r => String(r.id));
  assert.equal(new Set(ids).size, ids.length, 'معرّف سطر مكرر');
});

test('التوزيع السنوي: لكل سطر حصتان مكتوبتان', () => {
  for (const r of rows) {
    assert.ok(String(r.session1 || '').trim(), `الأسبوع ${r.week}: الحصة الأولى فارغة`);
    assert.ok(String(r.session2 || '').trim(), `الأسبوع ${r.week}: الحصة الثانية فارغة`);
  }
});

// ═══════════════ 3. الشهور والتواريخ المشتقة ═══════════════

test('التوزيع السنوي: ترتيب الشهور تتصاعدي داخل الموسم', () => {
  const order = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر', 'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان'];
  let last = -1;
  for (const r of rows) {
    const idx = order.indexOf(String(r.month));
    assert.ok(idx >= 0, `شهر غير معروف: ${r.month}`);
    assert.ok(idx >= last, `تراجع في الشهور عند الأسبوع ${r.week}: ${r.month}`);
    last = idx;
  }
});

test('التوزيع السنوي: كل سطر يحمل تاريخاً مشتقاً صالحاً', () => {
  for (const r of rows) {
    assert.match(String(r.dates), /^\d{2} − \d{2}$/, `الأسبوع ${r.week}: تاريخ غير صالح «${r.dates}»`);
  }
});

test('التوزيع السنوي: الوثيقة تطبع أسابيع الشهور فلا يُعاد حساب تواريخها', () => {
  assert.ok(rows.every(r => r.referenceMonthlySchedule === true), 'أسطر 1AM يجب أن تُستثنى من محرك التواريخ');
});

// ═══════════════ 4. بنية الميدانين والمقاطع (جوهر التصحيح) ═══════════════

test('المقطع الثالث في الميدان الأول هو الإطراح لا التحصل على الطاقة عند النبات', () => {
  const ehraa = rowsOf('الإطراح');
  assert.ok(ehraa.length >= 2, `أسطر الإطراح: ${ehraa.length}`);
  for (const r of ehraa) {
    assert.ok(String(r.midan).includes(MIDAN_1), `الإطراح مسنَد إلى «${r.midan}» بدل الميدان الأول`);
  }
  const first = ehraa[0];
  assert.match(String(first.maqta), /المقطع الثالث/, 'الإطراح يجب أن يكون المقطع الثالث');
});

test('التحصل على الطاقة عند النبات في الميدان الثاني ولا يحمل رقم المقطع الثالث', () => {
  const plant = rowsOf('التحصل على الطاقة عند النبات');
  assert.ok(plant.length >= 2, `أسطر التحصل على الطاقة عند النبات: ${plant.length}`);
  for (const r of plant) {
    assert.ok(String(r.midan).includes(MIDAN_2), `«${r.midan}» لا ينتمي للميدان الثاني`);
    assert.match(String(r.maqta), /المقطع الثاني/, `رقم المقطع خاطئ: ${r.maqta}`);
  }
});

test('كل مقطع مرتبط بميدانه الصحيح: 8 مقاطع، ترقيم يُعاد من الأول عند كل ميدان', () => {
  const expected: Array<[string, string, string]> = [
    ['التغذية عند الإنسان', MIDAN_1, 'الأول'],
    ['التحصل على الطاقة عند الإنسان', MIDAN_1, 'الثاني'],
    ['الإطراح عند الإنسان', MIDAN_1, 'الثالث'],
    ['التكاثر عند الإنسان', MIDAN_1, 'الرابع'],
    ['التغذية عند النبات الأخضر', MIDAN_2, 'الأول'],
    ['التحصل على الطاقة عند النبات الأخضر', MIDAN_2, 'الثاني'],
    ['التكاثر عند النباتات ذات الأزهار', MIDAN_2, 'الثالث'],
    ['الخلية', MIDAN_2, 'الرابع'],
  ];
  for (const [name, midan, ordinal] of expected) {
    const matching = rows.filter(r => String(r.maqta).includes(name));
    assert.ok(matching.length > 0, `المقطع «${name}» غائب عن التوزيع`);
    for (const r of matching) {
      assert.ok(String(r.midan).includes(midan), `«${name}» في ميدان خاطئ: ${r.midan}`);
      assert.ok(
        String(r.maqta).includes(ordinal),
        `«${name}» يجب أن يحمل «المقطع ${ordinal}» — وجدنا: ${r.maqta}`,
      );
    }
  }
});

test('الميدان الأول يبدأ في الأسبوع الثالث والميدان الثاني في الأسبوع التاسع', () => {
  const m1 = rows.filter(r => String(r.midan).includes(MIDAN_1));
  const m2 = rows.filter(r => String(r.midan).includes(MIDAN_2));
  assert.ok(m1.length >= 8, `أسطر الميدان الأول: ${m1.length}`);
  assert.ok(m2.length >= 8, `أسطر الميدان الثاني: ${m2.length}`);
  assert.equal(Number(m1[0].week), 3, 'الميدان الأول يبدأ في الأسبوع الثالث');
  assert.equal(Number(m2[0].week), 9, 'الميدان الثاني يبدأ في الأسبوع التاسع');
});

test('الأسبوع الثامن سطر مختلط: تقويم الميدان الأول ثم انطلاق الميدان الثاني', () => {
  // الوثيقة تضع في السطر نفسه «اقتراح وضعية تقويم» للمقطع الأول، ثم «الميدان الثاني
  // / المقطع الأول / أغذية النبات الأخضر / النشاط 1». نتحقق من الحصتين معاً.
  const week8 = rows.find(r => Number(r.week) === 8);
  assert.ok(week8, 'سطر الأسبوع الثامن مفقود');
  assert.match(String(week8!.session1), /وضعية تقويم/, 'الحصة الأولى يجب أن تكون التقويم');
  assert.match(String(week8!.session2), /الميدان الثاني/, 'الحصة الثانية تفتح الميدان الثاني');
  assert.match(String(week8!.session2), /أغذية النبات الأخضر/, 'الحصة الثانية تفتح المقطع الأول للميدان الثاني');
});

// ═══════════════ 5. الاختبارات والعطل ═══════════════

test('الاختبارات الفصلية الثلاثة في أسابيعها الرسمية', () => {
  const exams = rows.filter(r => r.isExam || /اختبارات الفصل/.test(String(r.mawrid)));
  assert.equal(exams.length, 3, `عدد الاختبارات: ${exams.length}`);
  assert.deepEqual(
    exams.map(r => Number(r.week)),
    [10, 22, 32],
    'مواضع الاختبارات الفصلية',
  );
});

test('عطلا الشتاء والربيع بنصّ الوثيقة حرفياً', () => {
  const winter = rows.filter(r => /عطلة الشتاء/.test(String(r.mawrid)));
  const spring = rows.filter(r => /عطلة الربيع/.test(String(r.mawrid)));
  assert.equal(winter.length, 2, `أسطر عطلة الشتاء: ${winter.length}`);
  assert.equal(spring.length, 2, `أسطر عطلة الربيع: ${spring.length}`);

  assert.ok(
    winter.every(r => /17 ديسمبر 2026/.test(String(r.session1)) && /03 جانفي 2027/.test(String(r.session1))),
    'نصّ عطلة الشتاء لا يطابق الوثيقة',
  );
  assert.ok(
    spring.every(r => /18 مارس 2027/.test(String(r.session1)) && /04 أفريل 2027/.test(String(r.session1))),
    'نصّ عطلة الربيع لا يطابق الوثيقة',
  );
});

// ═══════════════ 6. النسب المئوية ═══════════════

test('النسب المئوية: لا تتجاوز 100 % وتنتهي عندها', () => {
  const values = rows
    .map(r => String(r.percent || '').replace('%', '').trim())
    .filter(Boolean)
    .map(Number);
  assert.ok(values.every(v => v >= 0 && v <= 100), `نسبة خارج المدى: ${values.filter(v => v > 100)}`);
  assert.equal(values[values.length - 1], 100, 'آخر نسبة يجب أن تكون 100 %');
});

test('النسب المئوية: رتيبة غير متناقصة (لا تراجع في التقدم)', () => {
  const values = rows
    .map(r => String(r.percent || '').replace('%', '').trim())
    .filter(Boolean)
    .map(Number);
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(values[i] >= values[i - 1], `تراجع في النسبة: ${values[i - 1]} ← ${values[i]}`);
  }
});

test('النسب المئوية: تُنقل حرفياً من الوثيقة (0/4/8/…/96/100)', () => {
  const printed = rows
    .map(r => String(r.percent || '').trim())
    .filter(Boolean);
  assert.deepEqual(printed, [
    '0 %', '0 %',
    '4 %', '8 %', '12 %', '16 %', '20 %', '24 %', '28 %', '32 %', '36 %',
    '40 %', '44 %', '48 %', '52 %',
    '56 %', '60 %', '64 %', '68 %',
    '72 %', '76 %', '80 %', '84 %', '88 %', '92 %', '96 %', '100 %',
  ]);
});

// ═══════════════ 7. الربط بقاعدة الدروس ═══════════════

test('التوزيع السنوي: كل سطر تعلمي مرتبط بوحدة موجودة في قاعدة المذكرات', async () => {
  const { EXACT_LESSONS_1AM } = await import('../src/data/memos/official_1am_exact_db');
  const known = new Set(EXACT_LESSONS_1AM.map(l => l.sourceLearningUnitId));
  const linked = rows.filter(r => r.sourceLearningUnitId);

  assert.ok(linked.length >= 20, `أسطر مرتبطة: ${linked.length}`);
  for (const r of linked) {
    assert.ok(
      known.has(r.sourceLearningUnitId),
      `الأسبوع ${r.week}: معرّف وحدة غير موجود «${r.sourceLearningUnitId}»`,
    );
  }
});

test('التوزيع السنوي: كل مقاطع الميدانين الثمانية لها تمثيل تعلمي', () => {
  for (const name of [
    'التغذية عند الإنسان', 'التحصل على الطاقة عند الإنسان',
    'الإطراح عند الإنسان', 'التكاثر عند الإنسان',
    'التغذية عند النبات الأخضر', 'التحصل على الطاقة عند النبات الأخضر',
    'التكاثر عند النباتات ذات الأزهار', 'الخلية',
  ]) {
    const learning = rows.filter(r => String(r.maqta).includes(name) && r.sourceLearningUnitId);
    assert.ok(learning.length > 0, `المقطع «${name}» بلا سطر تعلمي مرتبط بمذكرة`);
  }
});

// ═══════════════ 8. الدفتر اليومي ═══════════════

test('الدفتر اليومي: لا حصة واحدة بعد نهاية السنة الدراسية', () => {
  const grid = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00'].map((time, i) => ({
    id: `r${i}`, time,
    cells: Object.fromEntries(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
      .map((day, j) => [day, `${((i + j) % 4) + 1}م/${(j % 2) + 1}`])),
  }));
  const start = '2026-09-21';
  const end = getLogbookPeriodEnd(start, 'سنة');
  const entries = generateLogbookEntries({ startDate: start, gridRows: grid as never, period: 'سنة' });
  const beyond = entries.filter(e => String((e as any).dateStr) >= end);
  assert.equal(beyond.length, 0, `حصص بعد ${end}: ${beyond.length}`);
});

test('الدفتر اليومي: مقطعا الإطراح والتكاثر عند الإنسان يظهران في الحصص', () => {
  const grid = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00'].map((time, i) => ({
    id: `r${i}`, time,
    cells: Object.fromEntries(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
      .map((day, j) => [day, `${((i + j) % 4) + 1}م/${(j % 2) + 1}`])),
  }));
  const entries = generateLogbookEntries({ startDate: '2026-09-21', gridRows: grid as never, period: 'سنة' })
    .filter(e => String((e as any).level) === '1م') as Array<Record<string, any>>;
  const text = entries.map(e => `${e.ta3alom || ''} ${e.mawrid || ''} ${e.content || ''}`).join(' ');

  assert.ok(/الإطراح/.test(text), 'الإطراح غائب عن حصص الدفتر');
  assert.ok(/الإلقاح/.test(text), 'الإلقاح غائب عن حصص الدفتر');
});
