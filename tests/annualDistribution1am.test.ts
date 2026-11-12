import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_1AM_DISTRIBUTION } from '../src/data/curriculum/new1amDistribution';

/**
 * التدرج السنوي للسنة الأولى متوسط — قفل تعديل الأستاذ.
 *
 * التوجيه المنفَّذ: المعالجة البيداغوجية في **الأسبوع الثاني فقط**، الحصة الأولى
 * «الحفظ والصحة» والحصة الثانية «الحفظ والمحيط»، وينتقل التقويم التشخيصي
 * للمكتسبات القبلية إلى الأسبوع الثالث (تبادل بين الأسبوعين 2 و3).
 * كما تُستكمل كل الخانات الفارغة (الميدان، المقطع، تعلم المورد) بعُرف
 * س3/س4: أسطر العطل والاختبارات تحمل ميدان ومقطع المحتوى المجاور.
 *
 * التواريخ والشهور والنِسب لم تتغير — وهي مثبَّتة هنا بلقطة حرفية حتى لا
 * ينكسر الترتيب الزمني صمتاً.
 */

const rows = OFFICIAL_1AM_DISTRIBUTION as Array<Record<string, any>>;
const row = (week: number) => {
  const found = rows.find(r => Number(r.week) === week);
  assert.ok(found, `لا سطر للأسبوع ${week}`);
  return found!;
};

/** لقطة الترتيب الزمني: الأسبوع | الشهر | التاريخ | النسبة — كما في الورقة الرسمية. */
const CHRONOLOGY_SNAPSHOT = [
  '1|سبتمبر|21 − 26|0 %',
  '2|سبتمبر / أكتوبر|28 − 03|0 %',
  '3|أكتوبر|05 − 10|0 %',
  '4|أكتوبر|12 − 17|4 %',
  '5|أكتوبر|19 − 24|8 %',
  '6|أكتوبر|26 − 31|12 %',
  '7|نوفمبر|02 − 07|12 %',
  '8|نوفمبر|09 − 14|16 %',
  '9|نوفمبر|16 − 21|20 %',
  '10|نوفمبر|23 − 28|25 %',
  '11|ديسمبر|30 − 05|28 %',
  '12|ديسمبر|07 − 12|33 %',
  '13|ديسمبر|14 − 19|35 %',
  '14|ديسمبر|21 − 26|38 %',
  '15|ديسمبر / جانفي|28 − 02|38 %',
  '16|جانفي|04 − 09|38 %',
  '17|جانفي|11 − 16|42 %',
  '18|جانفي|18 − 23|46 %',
  '19|جانفي|25 − 30|50 %',
  '20|فيفري|01 − 06|55 %',
  '21|فيفري|08 − 13|60 %',
  '22|فيفري|15 − 20|65 %',
  '23|فيفري|22 − 27|68 %',
  '24|مارس|01 − 06|70 %',
  '25|مارس|08 − 13|73 %',
  '26|مارس|15 − 20|73 %',
  '27|مارس|22 − 27|73 %',
  '28|أفريل|29 − 03|78 %',
  '29|أفريل|05 − 10|84 %',
  '30|أفريل|12 − 17|90 %',
  '31|ماي|19 − 24|95 %',
  '32|ماي|26 − 31|100 %',
  '33|ماي|01 − 05|100 %',
];

test('الأسبوع الثاني = المعالجة البيداغوجية بحصتَي «الحفظ والصحة» و«الحفظ والمحيط»', () => {
  const week2 = row(2);
  assert.equal(week2.mawrid, 'معالجة بيداغوجية');
  assert.equal(week2.session1, 'الحفظ والصحة');
  assert.equal(week2.session2, 'الحفظ والمحيط');
  assert.equal(week2.isRemediation, true);
  assert.equal(week2.isIntroductory, undefined, 'لم يعد الأسبوع الثاني تمهيدياً');
  assert.equal(week2.learningUnit, 'معالجة بيداغوجية: الحفظ والصحة / الحفظ والمحيط');
  assert.ok(String(week2.midan).includes('الإنسان والصحة'));
  assert.ok(String(week2.midan).includes('الإنسان والمحيط'), 'الحفظ والمحيط من الميدان الثاني');
});

test('الأسبوع الثالث = التقويم التشخيصي للمكتسبات القبلية بحصتَيه الأصليتين', () => {
  const week3 = row(3);
  assert.equal(week3.mawrid, 'تقويم تشخيصي للمكتسبات القبلية');
  assert.equal(week3.session1, 'تقويم تشخيصي: معايير حفظ الصحة ونمط التغذية عند الإنسان');
  assert.equal(week3.session2, 'تقويم تشخيصي: معايير حفظ المحيط وخصائص الكائنات الحية');
  assert.equal(week3.isIntroductory, true);
  assert.equal(week3.isRemediation, undefined, 'لم يعد الأسبوع الثالث معالجة');
});

test('المعالجة البيداغوجية المستقلة في الأسبوع الثاني وحده، وتصحيح الاختبارات يبقى في موضعه', () => {
  const standalone = rows.filter(r => r.isRemediation && Number(r.week) < 10);
  assert.deepEqual(standalone.map(r => Number(r.week)), [2], 'معالجة تمهيدية واحدة في الأسبوع 2');
  // الأسبوعان 14 و25 معالجة لاحقة لاختبارات الفصلين — لا يمسهما التوجيه.
  assert.equal(row(14).mawrid, 'تصحيح الاختبارات والمعالجة البيداغوجية');
  assert.equal(row(25).mawrid, 'تصحيح الاختبارات والمعالجة البيداغوجية');
  assert.equal(row(14).isRemediation, true);
  assert.equal(row(25).isRemediation, true);
  assert.equal(row(1).isIntroductory, true, 'الأسبوع الأول يبقى أسبوع التعارف');
});

test('لا خانة فارغة في التدرج: كل الحقول مملوءة في الأسطر الثلاثة والثلاثين', () => {
  const fields = ['midan', 'maqta', 'mawrid', 'learningUnit', 'session1', 'session2', 'dates', 'month', 'percent'];
  const empty = rows.flatMap(r => fields.filter(f => !String(r[f] ?? '').trim()).map(f => `الأسبوع ${r.week}.${f}`));
  assert.deepEqual(empty, [], `خانات فارغة: ${empty.join('، ')}`);
});

test('الترتيب الزمني لم يتغير: لقطة الأسبوع والشهر والتاريخ والنسبة', () => {
  assert.equal(rows.length, 33);
  const actual = rows.map(r => `${r.week}|${r.month}|${r.dates}|${r.percent}`);
  assert.deepEqual(actual, CHRONOLOGY_SNAPSHOT);
  rows.forEach((r, i) => assert.equal(Number(r.week), i + 1, 'الأسابيع متسلسلة 1..33'));
});

test('النِسب التراكمية غير متناقصة وتبدأ 0 % وتنتهي 100 %', () => {
  const values = rows.map(r => Number.parseFloat(String(r.percent)));
  assert.equal(values[0], 0);
  assert.equal(values.at(-1), 100);
  values.forEach((value, i) => {
    if (i === 0) return;
    assert.ok(value >= values[i - 1], `نسبة الأسبوع ${rows[i].week} تناقصت`);
  });
});

test('أسطر العطل لم تُمسّ: نصوص الحصص والتسميات حرفية (يقارنها المستهلكون بالمساواة التامة)', () => {
  const holidays = rows.filter(r => r.isHoliday);
  assert.equal(holidays.length, 5, 'عطلة الخريف + أسبوعا الشتاء + أسبوعا الربيع');
  assert.deepEqual(
    holidays.map(r => `${r.week}:${r.session1}`),
    [
      '7:عطلة الخريف (راحة بيداغوجية)',
      '15:عطلة الشتاء (الأسبوع الأول)',
      '16:عطلة الشتاء (الأسبوع الثاني)',
      '26:عطلة الربيع (الأسبوع الأول)',
      '27:عطلة الربيع (الأسبوع الثاني)',
    ]
  );
  holidays.forEach(r => {
    assert.equal(r.session1, r.session2, 'أسبوع العطلة يُدمج في خانة واحدة');
    assert.ok(r.holidayLabel, `الأسبوع ${r.week} بلا تسمية عطلة`);
  });
});

test('ملء العطل والاختبارات يتبع عُرف س3/س4: ميدان ومقطع المحتوى المجاور', () => {
  // عطلة الخريف داخل الميدان الأول / التغذية عند الإنسان (الأسابيع 4-6 ثم 8-9).
  assert.equal(row(7).midan, row(6).midan);
  assert.equal(row(7).maqta, row(6).maqta);
  // عطلة الشتاء داخل الميدان الثاني / التغذية عند النبات الأخضر (الأسبوع 12 ثم 17).
  assert.equal(row(15).midan, row(12).midan);
  assert.equal(row(15).maqta, row(12).maqta);
  assert.equal(row(16).midan, row(17).midan);
  assert.equal(row(16).maqta, row(17).maqta);
  // عطلة الربيع بعد آخر مقطع من الفصل الثاني (التحصل على الطاقة عند الإنسان).
  assert.equal(row(26).midan, row(23).midan);
  assert.equal(row(26).maqta, row(23).maqta);
  assert.equal(row(27).maqta, row(23).maqta);
  // أسابيع الاختبارات تسمّي مقاطع الفصل الذي تقيسه.
  assert.match(row(13).maqta, /اختبارات الفصل الأول/);
  assert.match(row(13).maqta, /التغذية عند الإنسان/);
  assert.match(row(13).maqta, /التغذية عند النبات الأخضر/);
  assert.match(row(24).maqta, /اختبارات الفصل الثاني/);
  assert.match(row(33).maqta, /اختبارات الفصل الثالث/);
  assert.match(row(33).maqta, /الخلية كوحدة بنيوية/);
});

test('معرفات الأسطر وتسمياتها محفوظة: لا سطر أُضيف أو حُذف أو أُعيد ترقيمه', () => {
  assert.deepEqual(
    rows.map(r => r.id),
    Array.from({ length: 33 }, (_, i) => `1am-official-${i + 1}`)
  );
  assert.equal(row(4).mawrid, 'المورد التعلمي 01: مصدر وتركيب الأغذية', 'أول مورد منهجي يبقى في الأسبوع 4');
  assert.equal(row(33).mawrid, 'اختبارات الفصل الثالث');
});

test('الدفتر اليومي يقرأ التعديل: الأسبوع الثاني معالجة والثالث منهجي', async () => {
  const { buildPedagogicalStepsForLevel } = await import('../src/utils/dailyLogbookGenerator');
  const steps = buildPedagogicalStepsForLevel('1م', 1);
  const contents = steps.map(s => s.activityText);

  const healthIndex = contents.indexOf('الحفظ والصحة');
  const surroundingsIndex = contents.indexOf('الحفظ والمحيط');
  assert.ok(healthIndex >= 0, 'حصة «الحفظ والصحة» وصلت إلى الدفتر');
  assert.equal(surroundingsIndex, healthIndex + 1, 'الحفظ والمحيط مباشرة بعد الحفظ والصحة');
  assert.equal(steps[healthIndex].isReview, true, 'حصتا الأسبوع الثاني معالجة بيداغوجية');
  assert.equal(steps[surroundingsIndex].isReview, true);

  // التقويم التشخيصي صار بعد المعالجة، وهو حصة منهجية تُمدَّد حسب الطلب.
  const diagnosticIndex = contents.findIndex(text => /^تقويم تشخيصي: معايير حفظ الصحة/.test(text));
  assert.ok(diagnosticIndex > surroundingsIndex, 'التقويم التشخيصي في الأسبوع الثالث بعد المعالجة');
  assert.equal(steps[diagnosticIndex].isReview, false);
  assert.ok(steps[diagnosticIndex].midan.includes('الإنسان والصحة'), 'الميدان مستكمل لا ساقط');
  assert.ok(steps[diagnosticIndex].maqta.length > 5, 'المقطع مستكمل لا ساقط');

  // لا حصة فارغة في خطوات الدفتر المشتقة من التدرج.
  assert.ok(steps.every(s => String(s.activityText).trim().length > 0), 'لا حصة فارغة في الدفتر');
});
