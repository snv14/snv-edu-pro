import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_1AM_DISTRIBUTION,
  OFFICIAL_2AM_DISTRIBUTION,
  OFFICIAL_3AM_DISTRIBUTION,
  OFFICIAL_4AM_DISTRIBUTION,
} from '../src/data/curriculum/officialAnnualDistributionData';

/**
 * استكمال التدرجات السنوية: لا خانة ظاهرة فارغة في أي مستوى.
 *
 * القاعدة المطبَّقة: كل ملء مشتق من الأسطر نفسها — أسبوع الاستقبال من حصتيه،
 * والعطل من المقطع المحفوظ قبلها وبعدها (عُرف س3/س4)، والاختبارات والإدماج
 * من مقاطع الفصل الذي تقيسه فعلاً. لا يُختَرع محتوى تعليمي، ولا تُمسّ
 * التواريخ ولا النِسب ولا نصوص الحصص (يقارنها المستهلكون بالمساواة التامة).
 */

const LEVELS = [
  { name: 'س1', rows: OFFICIAL_1AM_DISTRIBUTION as Array<Record<string, any>> },
  { name: 'س2', rows: OFFICIAL_2AM_DISTRIBUTION as Array<Record<string, any>> },
  { name: 'س3', rows: OFFICIAL_3AM_DISTRIBUTION as Array<Record<string, any>> },
  { name: 'س4', rows: OFFICIAL_4AM_DISTRIBUTION as Array<Record<string, any>> },
];

/** الأعمدة التي يراها الأستاذ في جدول التدرج وفي تصدير Word. */
const VISIBLE_FIELDS = ['midan', 'maqta', 'mawrid', 'session1', 'session2', 'dates', 'month'];

const row = (rows: Array<Record<string, any>>, week: number) => {
  const found = rows.find(r => Number(r.week) === week);
  assert.ok(found, `لا سطر للأسبوع ${week}`);
  return found!;
};

test('لا خانة ظاهرة فارغة في التدرجات الأربعة', () => {
  for (const { name, rows } of LEVELS) {
    const empty = rows.flatMap(r =>
      VISIBLE_FIELDS.filter(field => !String(r[field] ?? '').trim()).map(field => `${name} أ${r.week}.${field}`)
    );
    assert.deepEqual(empty, [], `خانات فارغة: ${empty.join('، ')}`);
  }
});

test('لا حصة فارغة في أي مستوى (الحصة الأولى والثانية معاً)', () => {
  for (const { name, rows } of LEVELS) {
    const empty = rows
      .filter(r => !String(r.session1 ?? '').trim() || !String(r.session2 ?? '').trim())
      .map(r => `${name} أ${r.week}`);
    assert.deepEqual(empty, [], `أسطر بحصة فارغة: ${empty.join('، ')}`);
  }
});

test('«تعلم المورد» إما مملوء بالكامل أو فارغ بالكامل — لا حالة هجينة داخل المستوى', () => {
  // س1 مملوء من المذكرات الرسمية. في س2/س3/س4 صياغة التدرج أخشن من وحدات قاعدة
  // المنهج (صفر تطابق حرفي بين الموردين)، فاشتقاقه تخمين يُنسب إلى المصدر؛
  // يبقى الحقل فارغاً ويسقط مستهلكه الوحيد إلى مورد السطر نفسه.
  for (const { name, rows } of LEVELS) {
    const filled = rows.filter(r => String(r.learningUnit ?? '').trim()).length;
    assert.ok(filled === 0 || filled === rows.length, `${name}: ${filled}/${rows.length} — حالة هجينة`);
  }
  const oneAm = LEVELS[0].rows;
  assert.equal(oneAm.filter(r => String(r.learningUnit ?? '').trim()).length, oneAm.length, 'س1 مملوء بالكامل');
});

test('س2: أسبوعا عطلة الشتاء يحملان مقطع الأسبوعين المجاورين (11 و14)', () => {
  const rows = OFFICIAL_2AM_DISTRIBUTION as Array<Record<string, any>>;
  assert.equal(row(rows, 12).maqta, row(rows, 11).maqta);
  assert.equal(row(rows, 13).maqta, row(rows, 14).maqta);
  assert.equal(row(rows, 12).midan, row(rows, 11).midan);
  assert.equal(row(rows, 12).maqta, 'المقطع الأول: الوسط الحي');
});

test('س2: أسبوعا عطلة الربيع يحملان مقطع الأسبوعين المجاورين (23 و26)', () => {
  const rows = OFFICIAL_2AM_DISTRIBUTION as Array<Record<string, any>>;
  assert.equal(row(rows, 24).maqta, row(rows, 23).maqta);
  assert.equal(row(rows, 25).maqta, row(rows, 26).maqta);
  assert.equal(row(rows, 24).maqta, 'المقطع الثالث: التكاثر وإعمار الأوساط');
});

test('س2: أسابيع الاختبارات والإدماج تسمّي مقاطع الفصل الذي تقيسه فعلاً', () => {
  const rows = OFFICIAL_2AM_DISTRIBUTION as Array<Record<string, any>>;
  // الفصل الأول = المقطع الأول: الوسط الحي (الأسابيع 2-9 و11)
  assert.match(row(rows, 10).maqta, /^اختبارات الفصل الأول — المقطع الأول: الوسط الحي$/);
  // الفصل الثاني = تتمّة المقطع الأول (المورد 5 في الأسبوعين 14-15) + المقطع الثاني (16-21)
  assert.match(row(rows, 22).maqta, /^اختبارات الفصل الثاني — /);
  assert.ok(row(rows, 22).maqta.includes('المورد 5'), 'تتمّة المقطع الأول مُسمّاة');
  assert.ok(row(rows, 22).maqta.includes('المقطع الثاني: توزع الكائنات الحية في أوساطها'));
  // الفصل الثالث = المقاطع الثالث والرابع والخامس (الأسابيع 23-34)
  for (const week of [35, 36]) {
    const maqta = row(rows, week).maqta;
    assert.ok(maqta.includes('المقطع الثالث: التكاثر وإعمار الأوساط'), `أ${week}`);
    assert.ok(maqta.includes('المقطع الرابع: تصنيف الكائنات الحية'), `أ${week}`);
    assert.ok(maqta.includes('المقطع الخامس: المستحاثات'), `أ${week}`);
  }
  assert.match(row(rows, 35).maqta, /^إدماج كلي — /);
  assert.match(row(rows, 36).maqta, /^اختبارات الفصل الثالث — /);
});

test('س2: أسبوع الافتتاح مُسمّى من حصتيه (الصحة المدرسية والتقويم التشخيصي)', () => {
  const week1 = row(OFFICIAL_2AM_DISTRIBUTION as Array<Record<string, any>>, 1);
  assert.equal(week1.maqta, 'أسبوع الافتتاح — الصحة المدرسية والتقويم التشخيصي');
  assert.equal(week1.midan, 'الإنسان والمحيط', 'الميدان يُشتق من المقطع في بانية الأسطر');
  assert.equal(week1.isIntroductory, true);
  assert.equal(week1.session2, 'التقويم التشخيصي', 'نص الحصة لم يتغير');
});

test('س3 وس4: الأسبوع الأول يحمل ميدان بداية السنة وأسبوع الاستقبال', () => {
  const three = row(OFFICIAL_3AM_DISTRIBUTION as Array<Record<string, any>>, 1);
  assert.equal(three.midan, 'الإنسان والمحيط');
  assert.equal(three.midan, row(OFFICIAL_3AM_DISTRIBUTION as Array<Record<string, any>>, 2).midan);
  assert.equal(three.maqta, 'أسبوع الاستقبال: التعارف والصحة المدرسية');

  const four = row(OFFICIAL_4AM_DISTRIBUTION as Array<Record<string, any>>, 1);
  assert.equal(four.midan, 'الإنسان والصحة');
  assert.equal(four.midan, row(OFFICIAL_4AM_DISTRIBUTION as Array<Record<string, any>>, 2).midan);
  assert.equal(four.maqta, 'أسبوع الاستقبال: التعارف والصحة المدرسية');
});

test('س2: التواريخ والنِسب ونصوص العطل لم تتغير مع الملء', () => {
  const rows = OFFICIAL_2AM_DISTRIBUTION as Array<Record<string, any>>;
  assert.equal(rows.length, 36);
  // لقطة التواريخ المشتقة من الرزنامة الرسمية (الأحد → الخميس)
  assert.deepEqual(
    [1, 10, 12, 13, 22, 24, 25, 35, 36].map(week => `${week}:${row(rows, week).dates}`),
    [
      '1:2026-09-27 → 2026-10-01',
      '10:2026-12-06 → 2026-12-10',
      '12:2026-12-20 → 2026-12-24',
      '13:2026-12-27 → 2026-12-31',
      '22:2027-02-28 → 2027-03-04',
      '24:2027-03-14 → 2027-03-18',
      '25:2027-03-21 → 2027-03-25',
      '35:2027-06-06 → 2027-06-10',
      '36:2027-06-13 → 2027-06-17',
    ]
  );
  // نصوص حصص العطل وتسمياتها حرفية — يقارنها المستهلكون بالمساواة التامة
  for (const week of [12, 13]) {
    assert.equal(row(rows, week).session1, 'عطلة الشتاء');
    assert.equal(row(rows, week).session2, 'عطلة الشتاء');
    assert.equal(row(rows, week).isHoliday, true);
    assert.equal(
      row(rows, week).holidayLabel,
      'عطلة الشتاء: من الخميس 17 ديسمبر 2026 مساء إلى الأحد 03 جانفي 2027 صباحا'
    );
  }
  for (const week of [24, 25]) {
    assert.equal(row(rows, week).session1, 'عطلة الربيع');
    assert.equal(row(rows, week).isHoliday, true);
    assert.equal(
      row(rows, week).holidayLabel,
      'عطلة الربيع: من الخميس 18 مارس 2027 مساء إلى الأحد 04 أفريل 2027 صباحا'
    );
  }
  // النِسب التراكمية كما هي
  assert.equal(row(rows, 10).percent, '29%');
  assert.equal(row(rows, 22).percent, '61.2%');
  assert.equal(row(rows, 35).percent, '96.6%');
  assert.equal(row(rows, 36).percent, '100%');
});

test('أعلام العطل والاختبارات محفوظة حتى يبقى دمج الخلايا واستبعاد الدفتر سليماً', () => {
  // isMergeable في واجهة التدرج يستثني العطل والاختبارات من دمج rowSpan،
  // ومولّد الدفتر يستبعد أسطر العطلة؛ فبقاء الأعلام شرط لسلامة الملء.
  for (const { rows } of LEVELS) {
    for (const r of rows) {
      if (/عطلة/.test(String(r.session1)) || /عطلة/.test(String(r.mawrid))) {
        assert.equal(r.isHoliday, true, `أ${r.week} عطلة بلا علم`);
      }
      if (/^اختبارات/.test(String(r.mawrid))) {
        assert.equal(r.isExam, true, `أ${r.week} اختبارات بلا علم`);
      }
    }
  }
});

test('الدفتر اليومي: لا حصة فارغة ولا مقطع ساقط إلى القيمة الافتراضية', async () => {
  const { buildPedagogicalStepsForLevel } = await import('../src/utils/dailyLogbookGenerator');
  for (const level of ['1م', '2م', '3م', '4م'] as const) {
    const steps = buildPedagogicalStepsForLevel(level, 1);
    assert.ok(steps.length > 20, `${level}: خطوات قليلة`);
    assert.ok(steps.every(s => String(s.activityText).trim().length > 0), `${level}: حصة فارغة`);
    assert.ok(steps.every(s => String(s.midan).trim().length > 0), `${level}: ميدان فارغ`);
    assert.ok(
      steps.every(s => s.maqta !== 'المقطع التعلمي' && String(s.maqta).trim().length > 0),
      `${level}: مقطع ساقط إلى القيمة الافتراضية`
    );
  }
});
