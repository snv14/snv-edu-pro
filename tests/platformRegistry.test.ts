import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLATFORM_DATABASE,
  PLATFORM_FAMILY_ORDER,
  PLATFORM_REGISTRY,
  PLATFORM_REGISTRY_SOURCES,
  registryLevelOf,
  registrySourcesOfFamily,
  registrySourcesWithoutFamily,
  platformCoverageGaps,
  platformFamilyCoverage,
  familyPriorityOf,
} from '../src/data/platform';
import registryFile from '../data/pedagogicalOfficialSources.json';

const rawSources = (registryFile as { sources?: Record<string, unknown>[] }).sources ?? [];
const LEVELS = ['1am', '2am', '3am', '4am'];

test('كل مدخلات السجل الوزاري مكتملة بعد الاستكمال (مستوى + عائلة)', () => {
  assert.equal(PLATFORM_REGISTRY_SOURCES.length, rawSources.length);
  assert.ok(PLATFORM_REGISTRY_SOURCES.length >= 8, 'السجل أقصر من المتوقع');
  for (const source of PLATFORM_REGISTRY_SOURCES) {
    assert.ok(source.id.length > 3, 'معرّف فارغ');
    assert.ok(source.title.length > 5, `عنوان ${source.id} فارغ`);
    assert.ok(source.authority.length > 5, `جهة ${source.id} فارغة`);
    assert.ok(source.url.length > 3, `رابط ${source.id} فارغ`);
    assert.ok(source.role.length > 5, `دور ${source.id} فارغ`);
    assert.ok([...LEVELS, 'all'].includes(source.level), `مستوى غير معروف لـ ${source.id}: ${source.level}`);
    assert.ok(
      source.family === null || PLATFORM_FAMILY_ORDER.includes(source.family),
      `عائلة غير معروفة لـ ${source.id}`,
    );
  }
  // لا معرّف مكرر
  assert.equal(new Set(PLATFORM_REGISTRY_SOURCES.map(s => s.id)).size, PLATFORM_REGISTRY_SOURCES.length);
});

test('اشتقاق المستوى: رمز صريح، اسم السنة بالأحرف، ثم وثيقة الطور', () => {
  assert.equal(registryLevelOf({ id: 'men-3am-teacher-guide', title: '' }), '3am');
  assert.equal(registryLevelOf({ id: 'x', title: 'المخططات السنوية — السنة الأولى متوسط' }), '1am');
  assert.equal(registryLevelOf({ id: 'x', title: 'تكييف كتاب السنة الرابعة متوسط - علوم الطبيعة والحياة' }), '4am');
  assert.equal(registryLevelOf({ id: 'x', title: 'دليل الأستاذ للسنة الثانية من التعليم المتوسط' }), '2am');
  assert.equal(registryLevelOf({ id: 'men-medium-curriculum-summary', title: 'ملخص منهاج الطور الأول من التعليم المتوسط' }), 'all');
  assert.equal(registryLevelOf({ id: 'x', title: 'الوثائق الرسمية البيداغوجية لمرحلة التعليم المتوسط' }), 'all');
  assert.equal(registryLevelOf({}), 'all');
});

test('اشتقاق المستوى لا يلتقط رمز سنة ملتصقاً بغيره', () => {
  // «sciences1am_6aafcda9» داخل اسم ملف لا يكفي وحده؛ الاعتماد على عنوان الوثيقة.
  assert.equal(registryLevelOf({ id: 'plans_annuels2023-sciences1am_6aafcda9', title: 'وثيقة بلا مستوى' }), 'all');
  assert.equal(registryLevelOf({ id: 'x1amy', title: '' }), 'all');
  // لكن الرمز المفصول يُلتقط
  assert.equal(registryLevelOf({ id: 'plans_annuels2023-sciences 1am', title: '' }), '1am');
});

test('الأدلة الأربعة لدليل الأستاذ تُسند إلى مستوياتها الصحيحة', () => {
  const guides = registrySourcesOfFamily('teacherGuide');
  assert.equal(guides.length, 5, 'أربعة أدلة/مخططات + تكييف كتاب س4');
  const byId = Object.fromEntries(guides.map(g => [g.id, g.level]));
  assert.equal(byId['men-1am-teacher-plans-guide'], '1am');
  assert.equal(byId['men-2am-teacher-plans-guide'], '2am');
  assert.equal(byId['men-3am-teacher-guide'], '3am');
  assert.equal(byId['men-4am-teacher-plans-guide'], '4am');
  assert.equal(byId['men-4am-snv-book-adaptation'], '4am');
});

test('توزيع السجل على العائلات: المنهاج 1 والوثيقة المرافقة 2 ودليل الأستاذ 5 والمذكرات 0', () => {
  assert.equal(PLATFORM_REGISTRY.documents, rawSources.length);
  assert.equal(registrySourcesOfFamily('curriculum').length, 1);
  assert.equal(registrySourcesOfFamily('companionDocument').length, 2);
  assert.equal(registrySourcesOfFamily('teacherGuide').length, 5);
  assert.equal(registrySourcesOfFamily('memos').length, 0);
  assert.deepEqual(registrySourcesWithoutFamily(), []);
  const summed = PLATFORM_REGISTRY.byFamily.reduce((total, entry) => total + entry.documents, 0);
  assert.equal(summed + registrySourcesWithoutFamily().length, PLATFORM_REGISTRY.documents);
});

test('تغطية دليل الأستاذ: مرجع لكل مستوى، وثلاثة مستويات تنتظر إدخال نصها الحرفي', () => {
  const guide = platformFamilyCoverage().find(entry => entry.id === 'teacherGuide')!;
  assert.equal(guide.officialDocuments, 1, 'وثيقة حرفية واحدة (س4)');
  assert.equal(guide.officialPages, 147);
  assert.deepEqual(guide.registryLevels, LEVELS);
  assert.deepEqual(guide.levelsWithAnySource, LEVELS);
  assert.deepEqual(guide.levelsWithOwnDocument, ['4am']);
  assert.deepEqual(guide.levelsPendingIngestion, ['1am', '2am', '3am']);
});

test('عائلتا المنهاج والوثيقة المرافقة لا تنتظران إدخالاً (لديهما وثيقة عامة لكل المستويات)', () => {
  for (const id of ['curriculum', 'companionDocument'] as const) {
    const entry = platformFamilyCoverage().find(item => item.id === id)!;
    assert.deepEqual(entry.levelsWithAnySource, LEVELS, `${id} يغطي المستويات الأربعة`);
    assert.deepEqual(entry.levelsPendingIngestion, [], `${id} بلا مستوى منتظر`);
  }
});

test('الفجوات: لم يعد يُدّعى غياب دليل الأستاذ، بل نقص إدخال نصه', () => {
  const gaps = platformCoverageGaps();
  const guideGap = gaps.find(gap => gap.startsWith('دليل الأستاذ'));
  assert.ok(guideGap, 'يجب أن تبقى فجوة لدليل الأستاذ (نص حرفي ناقص)');
  assert.ok(guideGap!.startsWith('دليل الأستاذ: وثائق مسجَّلة'), guideGap);
  assert.ok(guideGap!.includes('1am، 2am، 3am'), 'المستويات المنتظرة');
  assert.ok(guideGap!.includes('men-1am-teacher-plans-guide'), 'المعرّف مُسمّى في الفجوة');
  assert.ok(guideGap!.includes('men-3am-teacher-guide'), 'المعرّف مُسمّى في الفجوة');
  assert.ok(!gaps.some(gap => gap.startsWith('دليل الأستاذ: لا وثيقة رسمية')), 'لا فجوة غياب');
});

test('فجوة المذكرات تبقى كما هي: لا نص حرفي ولا مرجع في السجل', () => {
  const gaps = platformCoverageGaps();
  const memosGap = gaps.find(gap => gap.startsWith('المذكرات'));
  assert.ok(memosGap, 'فجوة المذكرات');
  assert.ok(memosGap!.includes('لا وثيقة رسمية حرفية ولا مرجع في السجل'), memosGap);
});

test('لا فجوة للمنهاج ولا للوثيقة المرافقة', () => {
  const gaps = platformCoverageGaps();
  assert.ok(!gaps.some(gap => gap.startsWith('المنهاج')), 'لا فجوة في المنهاج');
  assert.ok(!gaps.some(gap => gap.startsWith('الوثيقة المرافقة')), 'لا فجوة في الوثيقة المرافقة');
});

test('طبقة السجل لا تغيّر ترتيب العائلات ولا أولويات المصادر', () => {
  assert.deepEqual(PLATFORM_FAMILY_ORDER, ['curriculum', 'companionDocument', 'teacherGuide', 'memos']);
  assert.equal(familyPriorityOf('curriculum'), 1);
  assert.equal(familyPriorityOf('companionDocument'), 2);
  assert.equal(familyPriorityOf('teacherGuide'), 3);
  assert.equal(familyPriorityOf('memo'), 4);
  assert.equal(familyPriorityOf('teacherDocument'), 5, 'خارج العائلات يبقى بعدها');
});

test('الحساب حتمي: استدعاءان متطابقان للتغطية والفجوات والسجل', () => {
  assert.deepEqual(platformFamilyCoverage(), platformFamilyCoverage());
  assert.deepEqual(platformCoverageGaps(), platformCoverageGaps());
  assert.deepEqual(PLATFORM_DATABASE.registry.byFamily, PLATFORM_REGISTRY.byFamily);
  assert.deepEqual(PLATFORM_DATABASE.gaps, platformCoverageGaps());
});
