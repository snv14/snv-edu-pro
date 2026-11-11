/**
 * اختبارات القاعدة الموحدة للمنصة وعزل قاعدة الدفتر.
 *
 * الغرض: أن يبقى ترتيب العائلات الأربع مرجعاً واحداً للأولوية، وأن لا يعود
 * التبعثر (نسخ جذرية، ملفات دفتر بين بيانات المنهاج) بعد إعادة التنظيم.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  PLATFORM_DATABASE,
  PLATFORM_FAMILY_ORDER,
  PLATFORM_KIND_ORDER,
  familyOfKind,
  familyPriorityOf,
  officialSourcesOfFamily,
  platformFamily,
} from '../src/data/platform';
import { AI_SOURCE_PRIORITY, sourcePriorityOf } from '../src/services/aiSourcePriority';
import { LOGBOOK_DATABASE, LOGBOOK_PROGRAMS, logbookProgramOf } from '../src/data/logbook';
import { getOfficialSourcesManifest } from '../src/services/knowledgeOfficialSources';

test('ترتيب العائلات هو المرجعية المطلوبة: المنهاج ← الوثيقة المرافقة ← دليل الأستاذ ← المذكرات', () => {
  assert.deepEqual(PLATFORM_FAMILY_ORDER, ['curriculum', 'companionDocument', 'teacherGuide', 'memos']);
  assert.deepEqual(PLATFORM_DATABASE.families.map(family => family.order), [1, 2, 3, 4]);
  assert.deepEqual(PLATFORM_DATABASE.order, PLATFORM_FAMILY_ORDER);
});

test('أولوية المصادر مشتقة من العائلات ومطابقة للترتيب الملتزم تاريخياً', () => {
  // هذه القيم هي نفسها الملتزمة قبل اشتقاقها من PLATFORM_FAMILIES.
  // إن تغيّر ترتيب العائلات فيتغيّر هذا الاختبار عمداً — لا صمتاً.
  assert.deepEqual(AI_SOURCE_PRIORITY, {
    curriculum: 1,
    progression: 1,
    companionDocument: 2,
    teacherGuide: 3,
    memo: 4,
    teacherDocument: 5,
    attachment: 5,
    web: 6,
    library: 7,
    ai: 8,
  });
  // كل نوع في عائلة يحمل أولوية عائلته نفسها
  for (const family of PLATFORM_DATABASE.families) {
    for (const kind of family.kinds) {
      assert.equal(sourcePriorityOf(kind), family.order, `أولوية ${kind}`);
      assert.equal(familyPriorityOf(kind), family.order, `familyPriorityOf(${kind})`);
      assert.equal(familyOfKind(kind)?.id, family.id, `عائلة ${kind}`);
    }
  }
  // ما ليس في العائلات يُرتَّب بعدها
  assert.equal(familyOfKind('teacherDocument'), null);
  assert.ok(familyPriorityOf('teacherDocument') > PLATFORM_DATABASE.families.length);
});

test('ترتيب الأنواع مسطَّحاً يتبع ترتيب العائلات', () => {
  assert.deepEqual(PLATFORM_KIND_ORDER, ['curriculum', 'progression', 'companionDocument', 'teacherGuide', 'memo']);
});

test('platformFamily ترفض معرّفاً غير معروف بدل إرجاع undefined', () => {
  assert.equal(platformFamily('curriculum').label, 'المنهاج');
  assert.throws(() => platformFamily('logbook' as never), /عائلة غير معروفة/);
});

test('تغطية العائلات تُحسب من البيان نفسه لا بأرقام مكتوبة يدوياً', () => {
  const manifest = getOfficialSourcesManifest();
  const coverage = PLATFORM_DATABASE.coverage;
  assert.equal(coverage.length, 4);

  // مجموع وثائق العائلات = مجموع البيان (كل وثيقة تنتمي لعائلة واحدة)
  const total = coverage.reduce((sum, entry) => sum + entry.officialDocuments, 0);
  assert.equal(total, manifest.length, 'كل وثيقة رسمية مُسندة إلى عائلة');

  for (const entry of coverage) {
    const docs = officialSourcesOfFamily(entry.id);
    assert.equal(docs.length, entry.officialDocuments, `عدد وثائق ${entry.id}`);
    assert.equal(entry.officialPages, docs.reduce((sum, doc) => sum + doc.pages, 0), `صفحات ${entry.id}`);
    assert.equal(entry.officialChars, docs.reduce((sum, doc) => sum + doc.chars, 0), `أحرف ${entry.id}`);
    if (entry.qualityRange) {
      const qualities = docs.map(doc => doc.quality);
      assert.deepEqual(entry.qualityRange, [Math.min(...qualities), Math.max(...qualities)]);
    }
  }

  // المنهاج هو العائلة الوحيدة التي تملك وثيقة خاصة بكل مستوى
  const curriculum = coverage.find(entry => entry.id === 'curriculum')!;
  assert.deepEqual(curriculum.levelsWithOwnDocument, ['1am', '2am', '3am', '4am']);
});

test('الفجوات مُصرَّح بها آلياً: إدخال دليل الأستاذ لس1–س3، والمذكرات بلا نص حرفي', () => {
  const gaps = PLATFORM_DATABASE.gaps;
  assert.ok(gaps.some(gap => gap.includes('دليل الأستاذ') && gap.includes('1am')), 'فجوة دليل الأستاذ');
  assert.ok(gaps.some(gap => gap.includes('المذكرات') && gap.includes('لا وثيقة رسمية حرفية')), 'فجوة المذكرات');
  // المنهاج والوثيقة المرافقة مكتملتان فلا فجوة لهما
  assert.ok(!gaps.some(gap => gap.startsWith('المنهاج')), 'لا فجوة في المنهاج');
  assert.ok(!gaps.some(gap => gap.startsWith('الوثيقة المرافقة')), 'لا فجوة في الوثيقة المرافقة');
  // دليل الأستاذ لم يعد «غائباً»: وثائقه مسجَّلة، والنقص في إدخال نصها الحرفي فقط
  assert.ok(!gaps.some(gap => gap.startsWith('دليل الأستاذ: لا وثيقة رسمية')), 'لا يُدّعى غياب دليل الأستاذ');
  assert.ok(gaps.some(gap => gap.startsWith('دليل الأستاذ: وثائق مسجَّلة')), 'الفجوة هي فجوة إدخال لا غياب');
});

test('قاعدة الدفتر معزولة: تملك برامجها ومدخلاتها ولا تنسخ التدرجات', async () => {
  assert.deepEqual(Object.keys(LOGBOOK_PROGRAMS).sort(), ['1am', '2am', '3am', '4am']);
  for (const level of ['1am', '2am', '3am', '4am']) {
    const program = logbookProgramOf(level);
    assert.ok(Array.isArray(program) && program.length > 0, `برنامج ${level} غير فارغ`);
  }
  assert.equal(logbookProgramOf('5am'), null, 'مستوى غير معروف');
  assert.ok(Array.isArray(LOGBOOK_DATABASE.owned.seededEntries));

  // ما تشاركه يُشار إليه بمسار ولا يُنسخ — والمساران موجودان فعلاً
  assert.ok(existsSync(LOGBOOK_DATABASE.sharedFrom.annualDistributions), 'مسار التدرجات السنوية موجود');
  assert.ok(existsSync(LOGBOOK_DATABASE.sharedFrom.curriculumMemos), 'مسار قاعدة المذكرات موجود');
});

test('التنظيم الفيزيائي: العائلات في مجلداتها ولا نسخ متبقية في src/data/ الجذر', () => {
  // ملفات الدفتر انتقلت إلى مجلدها
  for (const name of ['dailyLogbookProgram1am', 'dailyLogbookProgram2am', 'dailyLogbookProgram3am',
    'dailyLogbookProgram4am', 'dailyLogData']) {
    assert.ok(existsSync(`src/data/logbook/${name}.ts`), `logbook/${name}.ts موجود`);
    assert.ok(!existsSync(`src/data/${name}.ts`), `src/data/${name}.ts لم يعد في الجذر`);
  }
  // التدرجات السنوية صارت ضمن عائلة المنهاج
  for (const name of ['officialAnnualDistributionData', 'new1amDistribution', 'annualDistribution2am2026']) {
    assert.ok(existsSync(`src/data/curriculum/${name}.ts`), `curriculum/${name}.ts موجود`);
    assert.ok(!existsSync(`src/data/${name}.ts`), `src/data/${name}.ts لم يعد في الجذر`);
  }
  // بيانات المذكرات صارت ضمن عائلتها — ومنها مدخلات خط التفريغ
  for (const name of ['curriculumDb', 'lessons1am', 'official_1am_exact_db', 'official_3am_maqta1',
    'lessons3am_maqta1', 'diagrams1am', 'schema']) {
    assert.ok(existsSync(`src/data/memos/${name}.ts`), `memos/${name}.ts موجود`);
    assert.ok(!existsSync(`src/data/${name}.ts`), `src/data/${name}.ts لم يعد في الجذر`);
  }
  // التكرار المحذوف لا يعود
  assert.ok(!existsSync('src/data/official_2am.json'), 'official_2am.json المكرر محذوف');
  assert.ok(!existsSync('src/data/annualDistributionData.ts'), 'annualDistributionData الفارغ محذوف');
  // المتن الرسمي المولَّد يبقى في مكانه (يكتبه سكربت التفريغ)
  assert.ok(existsSync('src/data/official/index.ts'), 'official/ المولَّد في مكانه');
});
