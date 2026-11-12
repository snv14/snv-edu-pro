/**
 * أمانة قاعدة بيانات الدفتر اليومي تجاه مصدرها الرسمي.
 *
 * المصدر: «التدرج البيداغوجي لمادة علوم الطبيعة والحياة» — الوثيقة الوزارية التي
 * بُنيت منها `DAILY_LOGBOOK_PROGRAM_1AM…4AM` (كل ملف يذكر مصدره في ترويسه).
 * قورن س1 وس2 حرفياً بنسختَي الوثيقة (7 ص و6 ص) بعد تفريغها بـ PyMuPDF وتطبيع
 * NFKC (الوثيقة مخزّنة بأشكال العرض العربية U+FB50–U+FEFF، فلا يطابقها بحث
 * بالحروف القياسية U+0600–U+06FF قبل التطبيع).
 *
 * ما يُقفل هنا نوعان:
 *  1) صيغ رسمية ثبتت من المصدر، ومنها **غرور مقصود**: الوثيقة تستعمل «تعلم مورد 01/02»
 *     تحت المورد التعلمي 02 في س2، لكنها تستعمل «تعلم مورد 1-1/1-2» تحت المورد 3-1.
 *     هذا ليس خطأً يُوحَّد — توحيده يُبعد القاعدة عن مصدرها.
 *  2) فراغات **مطابقة للمصدر** وليست سهواً: س1 فيها 17 موضع «تقويم المورد» لـ26 وحدة
 *     (⇒ 9 بلا تقويم)، وس2 فيها 19 «المشكلة» لـ20 وحدة (⇒ واحدة بلا مشكلة).
 *     ملء هذه الفراغات اختراعٌ لنص وزاري غير موجود.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LOGBOOK_PROGRAMS, type LogbookLevel } from '../src/data/logbook';

const LEVELS: LogbookLevel[] = ['1am', '2am', '3am', '4am'];
const program = (lv: LogbookLevel) => LOGBOOK_PROGRAMS[lv];

/** كل عناصر المستويات الأربعة مع مستوى كل عنصر. */
const ALL = LEVELS.flatMap((lv) => program(lv).map((item) => ({ lv, item })));

test('لا تسمية مكررة داخل taqwim: المستهلكان يضيفان «التقويم» بنفسيهما', () => {
  // DailyLogbook.tsx:610 → addLine('التقويم', taqwim)
  // docxExportLogbook.ts:243 → `<u>التقويم:</u> ${assessment}`
  // فبادئة «تقويم المورد:» في القيمة تتحول إلى «التقويم: تقويم المورد: …».
  // في المصدر الرسمي «تقويم المورد :» تسميةٌ لا جزءٌ من النص.
  const offenders = ALL.filter(({ item }) =>
    /^تقويم المورد\s*:?/.test(String(item.taqwim || '').trim()),
  );
  assert.deepEqual(
    offenders.map(({ lv, item }) => `${lv}/${item.sourceLearningUnitId}`),
    [],
    'كانت 17 موضعاً في س1 وحدها؛ س2/س3/س4 لم تحملها قط — فالاصطلاح بلا بادئة',
  );
});

test('س2: الترقيم الرسمي لوحدتَي «تعلم مورد» تحت المورد التعلمي 02 هو 01 و02', () => {
  const under = program('2am').filter(
    (p) => p.mawrid === 'المورد التعلمي 02: العلاقات القائمة بين العناصر الحية في الوسط الحي',
  );
  assert.equal(under.length, 2, 'وحدتان تحت هذا المورد في الوثيقة');
  assert.equal(under[0].ta3alom, 'تعلم مورد 01: التفاعلات بين العناصر الحية في الوسط الحي');
  assert.equal(under[1].ta3alom, 'تعلم مورد 02: تنظيم العلاقات الغذائية في الوسط الحي');
});

test('س2: الوثيقة تستعمل 1-1 و1-2 تحت المورد 3-1 — غرور مصدر يُحفظ ولا يُوَحَّد', () => {
  const under = program('2am').filter(
    (p) => p.mawrid === 'المورد التعلمي 3-1: أنماط التكاثر عند الحيوانات',
  );
  assert.equal(under.length, 2);
  assert.equal(under[0].ta3alom, 'تعلم مورد 1-1: استراتيجيات التكاثر الجنسي عند الحيوانات');
  assert.equal(under[1].ta3alom, 'تعلم مورد 1-2: أنماط الإلقاح عند الحيوانات');
});

test('س1: الصياغة الرسمية لآخر وحدة هي «الخلية كالوحدة البنائية للكائن الحي»', () => {
  const cell = program('1am').filter((p) => /الخلية/.test(p.ta3alom));
  assert.equal(cell.length, 1);
  assert.equal(cell[0].ta3alom, 'تعلم مورد: الخلية كالوحدة البنائية للكائن الحي');
});

test('س2: وحدة «هجرة الجراد» رسمية وإن غابت عن جدول التدرج السنوي', () => {
  // التدرج السنوي (المخطط السنوي) يكتفي بأربعة موارد في المقطع الثاني، بينما
  // التدرج البيداغوجي يفصل «2-4: هجرة الجراد» وحدة مستقلة. حذفها لمطابقة الجدول
  // إسقاطٌ لنص وزاري موجود.
  const unit = program('2am').find((p) => p.mawrid === 'المورد التعلمي 2-4: هجرة الجراد');
  assert.ok(unit, 'الوحدة موجودة في القاعدة');
  assert.match(unit.moshkila, /أنماط تنقل الجراد/);
  assert.equal(unit.activities.length, 2);
});

test('فراغات taqwim مطابقة للمصدر: 9 في س1 وصفر في غيرها', () => {
  const counts = Object.fromEntries(
    LEVELS.map((lv) => [lv, program(lv).filter((p) => !String(p.taqwim || '').trim()).length]),
  );
  assert.deepEqual(counts, { '1am': 9, '2am': 0, '3am': 0, '4am': 0 },
    'س1: 17 موضع «تقويم المورد» في الوثيقة لـ26 وحدة');
  assert.equal(program('1am').filter((p) => String(p.taqwim || '').trim()).length, 17);
});

test('فراغ moshkila الوحيد في س2 هو وحدة «وسائل غزو وإعمار الأوساط من طرف النباتات»', () => {
  const blank = program('2am').filter((p) => !String(p.moshkila || '').trim());
  assert.equal(blank.length, 1, 'الوثيقة تحوي 19 «المشكلة» لـ20 وحدة');
  assert.equal(blank[0].mawrid, 'المورد التعلمي 3-2: وسائل غزو وإعمار الأوساط من طرف النباتات');
  assert.equal(blank[0].sourceLearningUnitId, 'program_2am_unit_15');
  assert.ok(String(blank[0].taqwim).trim(), 'لكن لها تقويماً وأنشطة في المصدر');
  for (const lv of ['1am', '3am', '4am'] as LogbookLevel[]) {
    assert.equal(program(lv).filter((p) => !String(p.moshkila || '').trim()).length, 0);
  }
});

test('الحقول الإلزامية مملوءة في المستويات الأربعة والمستوى صحيح', () => {
  for (const { lv, item } of ALL) {
    const where = `${lv}/${item.sourceLearningUnitId}`;
    assert.equal(item.level, lv, `level مطابِق لمفتاح القاعدة (${where})`);
    for (const f of ['midan', 'maqta', 'mawrid', 'ta3alom'] as const) {
      assert.ok(String(item[f] || '').trim(), `${f} غير فارغ (${where})`);
    }
    assert.ok(Array.isArray(item.activities) && item.activities.length > 0,
      `أنشطة غير فارغة (${where})`);
    assert.ok(item.activities.every((a) => String(a).trim()), `كل نشاط غير فارغ (${where})`);
  }
});

test('صيغة المقطع والمورد والأنشطة رسمية في المستويات الأربعة كلها', () => {
  for (const { lv, item } of ALL) {
    const where = `${lv}/${item.sourceLearningUnitId}`;
    assert.match(item.maqta, /^المقطع التعلمي \d{2}: \S/, where);
    assert.match(item.mawrid, /^المورد التعلمي [\d-]+: \S/, where);
    for (const a of item.activities) {
      assert.match(a, /^النشاط( الأول| الثاني| الثالث| \d{1,2})?: \S/, `${where} — ${a}`);
    }
  }
});

test('صيغة ta3alom «تعلم مورد …» ثابتة في س1 وس2 المثبتتين من المصدر', () => {
  // س1 (26/26) وس2 (20/20) قورنتا حرفياً بوثيقتيهما، وكل وحدة فيهما مسبوقة
  // بـ«تعلم مورد» في المصدر.
  for (const lv of ['1am', '2am'] as LogbookLevel[]) {
    for (const item of program(lv)) {
      assert.match(item.ta3alom, /^تعلم مورد( [\d-]{1,5})?: \S/,
        `${lv}/${item.sourceLearningUnitId}`);
    }
  }
  // س3 (17/28) وس4 (8/23) تحمل بقيتها حصيلة تعلم حرة («تشوهات الطبقات الصخرية»،
  // «التنفس الخلوي والتمثيل الغذائي»). **لم تُوحَّد** لأن وثيقتَي هذين المستويين
  // لم تصلا: النسخ المرفوعة كانت محروقة الترميز (صفر محرف عربي، كل حرف «؟»).
  // توحيدها بلا مصدر إعادة صياغة لنص وزاري، وهذا الاختبار يثبت العدد كما هو.
  assert.equal(program('3am').filter((p) => /^تعلم مورد/.test(p.ta3alom)).length, 17);
  assert.equal(program('4am').filter((p) => /^تعلم مورد/.test(p.ta3alom)).length, 8);
});

test('المعرّفات منتظمة وفريدة: الوحدات داخل المستوى والأنشطة على مستوى المنصة', () => {
  const acts: string[] = [];
  for (const lv of LEVELS) {
    const ids = program(lv).map((p) => p.sourceLearningUnitId);
    for (const id of ids) {
      assert.match(id, new RegExp(`^program_${lv}_unit_\\d{2,}$`), id);
    }
    assert.equal(new Set(ids).size, ids.length, `معرفات وحدات ${lv} فريدة`);
    for (const p of program(lv)) {
      assert.ok(p.sourceActivityIds?.length, `${p.sourceLearningUnitId} له أنشطة مصدرية`);
      for (const a of p.sourceActivityIds) {
        assert.match(a, new RegExp(`^program_${lv}_act_\\d{2,}$`), a);
        acts.push(a);
      }
    }
  }
  assert.equal(new Set(acts).size, acts.length, 'لا نشاط مصدري مكرر عبر المنصة');
});

test('التغطية: عدد الوحدات والمقاطع لكل مستوى (حارس انحدار)', () => {
  const shape = Object.fromEntries(
    LEVELS.map((lv) => [lv, {
      units: program(lv).length,
      segments: new Set(program(lv).map((p) => p.maqta)).size,
    }]),
  );
  // مقاطع س1 التسعة هي مقاطع التدرج البيداغوجي الرسمية، وهي أوسع من مقاطع
  // جدول التدرج السنوي (6) — وثيقتان رسميتان مختلفتا المدى، فلا تُقلَّم القاعدة.
  assert.deepEqual(shape, {
    '1am': { units: 26, segments: 9 },
    '2am': { units: 20, segments: 5 },
    '3am': { units: 28, segments: 4 },
    '4am': { units: 23, segments: 3 },
  });
});
