import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildKnowledgeIndex,
  extractKnowledge,
  guessFacetOfFreeText,
  searchKnowledge,
  sourceLabelOf,
  toKnowledgeReferences,
} from '../src/services/knowledgeBase';
import {
  OFFICIAL_SOURCES_TOTAL,
  getCachedOfficialSources,
  getOfficialSourcesManifest,
  loadOfficialSources,
  officialSourcesReady,
  preloadOfficialSources,
  resetOfficialSourcesCache,
} from '../src/services/knowledgeOfficialSources';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';
import type { KnowledgeSourceKind } from '../src/types/knowledge';

const lessons = getOfficialCurriculumDatabase();
const officialDocs = await loadOfficialSources();

/**
 * المدى المقبول في نص وزاري عربي — يطابق ALLOWED_CODEPOINT في
 * scripts/ingest_official_pdfs.py. أي محرف خارجه يعني أن بوابة التلوث
 * في التفريغ تسرّبت إلى البيانات الملتزمة.
 */
const ALLOWED = /[\u0020-\u007e\u00a0-\u00ff\u0600-\u06ff\ufb50-\ufeff\u2000-\u206f\u2190-\u27bf\ufeff\n\r\t]/;

test('الوثائق الرسمية الأحد عشر تُفرَّغ وتُحمَّل كسولياً', async () => {
  const manifest = getOfficialSourcesManifest();
  assert.equal(manifest.length, 11, 'عدد الوثائق في البيان');
  assert.equal(new Set(manifest.map(entry => entry.id)).size, 11, 'المعرّفات فريدة');
  assert.equal(officialDocs.length, 11, 'كل وثيقة تُحمَّل فعلاً');

  for (const doc of officialDocs) {
    assert.equal(doc.source, 'official', `${doc.id}: حالة المصدر`);
    assert.ok(doc.pages.length > 0, `${doc.id}: بلا صفحات`);
    assert.ok(doc.text.length > 1000, `${doc.id}: نص قصير بشكل مريب`);
    assert.ok(doc.title.length > 10, `${doc.id}: عنوان`);
    assert.ok(doc.authority.includes('وزارة التربية الوطنية'), `${doc.id}: الجهة`);
    for (const page of doc.pages) {
      assert.ok(Number.isInteger(page.page) && page.page >= 1, `${doc.id}: رقم صفحة`);
      assert.ok(page.text.trim().length > 0, `${doc.id}: صفحة فارغة ${page.page}`);
    }
  }
});

test('العائلات الأربع كلها مغطاة والمستويات الأربعة ممثلة', () => {
  const kinds = new Set<KnowledgeSourceKind>(officialDocs.map(doc => doc.kind));
  for (const kind of ['curriculum', 'companionDocument', 'teacherGuide', 'progression'] as const) {
    assert.ok(kinds.has(kind), `العائلة الناقصة: ${kind}`);
  }
  const levels = new Set(officialDocs.map(doc => doc.level));
  for (const level of ['1am', '2am', '3am', '4am'] as const) {
    assert.ok(levels.has(level), `المستوى الناقص: ${level}`);
  }
  assert.ok(levels.has('all'), 'المنهاج والوثيقة المرافقة يغطيان كل المستويات');
});

test('البيان الثابت يطابق البيانات الملتزمة', () => {
  const manifest = getOfficialSourcesManifest();
  const manifestChars = manifest.reduce((sum, entry) => sum + entry.chars, 0);
  const manifestPages = manifest.reduce((sum, entry) => sum + entry.pages, 0);
  assert.equal(OFFICIAL_SOURCES_TOTAL.chars, manifestChars);
  assert.equal(OFFICIAL_SOURCES_TOTAL.pages, manifestPages);

  for (const entry of manifest) {
    const doc = officialDocs.find(item => item.id.endsWith(entry.id));
    assert.ok(doc, `وثيقة بلا مقابل محمَّل: ${entry.id}`);
    assert.equal(doc!.pages.length, entry.pages, `${entry.id}: عدد الصفحات`);
    assert.ok(entry.quality >= 70, `${entry.id}: جودة ${entry.quality}% دون الحد المقبول`);
    assert.equal(entry.garbage, 0, `${entry.id}: نسبة المحارف الشاذة يجب أن تكون صفراً`);
    assert.ok(['pypdf', 'pypdf+tounicode', 'pymupdf', 'pymupdf+tounicode'].includes(entry.extraction),
      `${entry.id}: مسار استخراج غير معروف ${entry.extraction}`);
  }
  assert.ok(manifestChars > 400_000, `الحجم الإجمالي ${manifestChars} أقل من المتوقع`);
});

test('النص الملتزم خالٍ من المحارف الشاذة والترويسات المتكررة', () => {
  const disallowed = new Map<string, number>();
  for (const doc of officialDocs) {
    for (const char of doc.text) {
      if (!ALLOWED.test(char)) disallowed.set(char, (disallowed.get(char) || 0) + 1);
    }
  }
  assert.deepEqual([...disallowed.entries()], [], 'محارف خارج المدى المقبول');

  // الترويسة المتكررة تُحذف لأنها تتكرر في كل صفحة وتلوّث البحث
  const curriculum = officialDocs.find(doc => doc.kind === 'curriculum');
  assert.ok(curriculum);
  const headed = curriculum!.pages.filter(page => page.text.slice(0, 120).includes('وزارة التربية الوطنية'));
  assert.equal(headed.length, 0, 'ترويسة وزارية لم تُحذف');

  // العلامة المائية لمدونة الدليل لا يجوز أن تصل إلى القاعدة
  const guide = officialDocs.find(doc => doc.kind === 'teacherGuide');
  assert.ok(guide);
  assert.ok(!guide!.text.includes('maktoobblog'), 'علامة مائية متسربة');
  assert.ok(!guide!.text.includes('yahoo.fr'), 'بريد إلكتروني متسرب');
});

test('الفهرس يضم المقاطع الرسمية بحالة official وأرقام صفحات', () => {
  const index = buildKnowledgeIndex({ lessons, officialDocs, includeCorpus: false, includeProgression: false });
  const official = index.chunks.filter(chunk => chunk.status === 'official');
  assert.ok(official.length > 400, `عدد المقاطع الرسمية ${official.length}`);
  assert.equal(index.stats.byStatus.official, official.length);

  for (const chunk of official.slice(0, 200)) {
    assert.ok(typeof chunk.page === 'number' && chunk.page >= 1, `${chunk.id}: بلا رقم صفحة`);
    assert.match(chunk.section, /^ص \d+/, `${chunk.id}: المقطع لا يعلن صفحته`);
    assert.ok(chunk.text.length > 40, `${chunk.id}: نص قصير`);
  }

  const kinds = new Set(official.map(chunk => chunk.kind));
  for (const kind of ['curriculum', 'companionDocument', 'teacherGuide', 'progression'] as const) {
    assert.ok(kinds.has(kind), `عائلة بلا مقاطع: ${kind}`);
  }
});

test('المصادر الرسمية تُستبعد بطلب صريح', () => {
  const without = buildKnowledgeIndex({
    lessons, officialDocs, includeCorpus: false, includeProgression: false, includeOfficialDocs: false,
  });
  assert.equal(without.chunks.filter(chunk => chunk.status === 'official').length, 0);
  assert.equal(without.stats.byStatus.official, undefined);

  const empty = buildKnowledgeIndex({ lessons, includeCorpus: false, includeProgression: false });
  assert.equal(empty.chunks.filter(chunk => chunk.status === 'official').length, 0);
});

test('النص الرسمي الحرفي يسبق الملخص المنهجي في الأولوية والترتيب', () => {
  const index = buildKnowledgeIndex({ lessons, officialDocs });
  const officialCurriculum = index.chunks.find(
    chunk => chunk.kind === 'curriculum' && chunk.status === 'official',
  );
  const referenceCurriculum = index.chunks.find(
    chunk => chunk.kind === 'curriculum' && chunk.status === 'reference',
  );
  assert.ok(officialCurriculum && referenceCurriculum, 'كلا المصدرين موجودان');
  // الأولوية: كلما صغر الرقم كان المصدر أقوى
  assert.ok(
    officialCurriculum!.priority < referenceCurriculum!.priority,
    `أولوية الرسمي ${officialCurriculum!.priority} يجب أن تسبق المرجعي ${referenceCurriculum!.priority}`,
  );
});

test('الاستشهاد يحمل رقم الصفحة في التسمية والمراجع والمرشّحات', () => {
  const index = buildKnowledgeIndex({ lessons, officialDocs });
  const chunk = index.chunks.find(item => item.status === 'official' && item.page);
  assert.ok(chunk);
  assert.match(sourceLabelOf(chunk!), /ص \d+$/);

  const hits = searchKnowledge('الكفاءة الشاملة للمادة', { lessons, officialDocs, topK: 6 });
  assert.ok(hits.length > 0);
  const officialHit = hits.find(hit => hit.chunk.status === 'official');
  assert.ok(officialHit, 'لم يظهر مصدر رسمي في نتائج البحث');
  assert.ok(typeof officialHit!.chunk.page === 'number');

  const references = toKnowledgeReferences(hits, 6);
  const cited = references.find(item => item.status === 'official');
  assert.ok(cited);
  assert.equal(typeof cited!.page, 'number');
  assert.match(cited!.sourceLabel, /ص \d+/);
});

test('استخراج الكفاءة الختامية يقدّم نصاً رسمياً لا ملخصاً', () => {
  const extraction = extractKnowledge('ما هي الكفاءة الختامية للسنة الثالثة متوسط حسب المنهاج؟', {
    lessons, officialDocs, level: '3am', facets: ['kafaa'], maxCandidates: 5,
  });
  const group = extraction.facets.find(item => item.facet === 'kafaa');
  assert.ok(group && group.candidates.length > 0, 'لا مرشّحات للكفاءة الختامية');
  assert.equal(group!.candidates[0].status, 'official', 'أول مرشّح يجب أن يكون رسمياً');
  assert.ok(typeof group!.candidates[0].page === 'number', 'المرشّح الرسمي يحمل صفحته');
  assert.ok(group!.candidates[0].text.length > 60);
});

test('دليل الأستاذ يقدّم الأجوبة المرتقبة بصفحتها', () => {
  const extraction = extractKnowledge('ما الأجوبة المرتقبة لنشاط المبادلات الغازية التنفسية؟', {
    lessons, officialDocs, level: '4am', facets: ['answers'], maxCandidates: 5,
  });
  const group = extraction.facets.find(item => item.facet === 'answers');
  assert.ok(group && group.candidates.length > 0);
  const fromGuide = group!.candidates.find(candidate => candidate.kind === 'teacherGuide');
  assert.ok(fromGuide, 'لا جواب من دليل الأستاذ');
  assert.equal(fromGuide!.status, 'official');
  assert.ok(typeof fromGuide!.page === 'number');
});

test('المخططات السنوية تُستخرج كتدرج رسمي', () => {
  const extraction = extractKnowledge('استخرج التدرج الأسبوعي والحجم الساعي للسنة الثانية متوسط', {
    lessons, officialDocs, level: '2am', facets: ['progression', 'zaman'], maxCandidates: 5,
  });
  assert.ok(extraction.facets.length > 0, 'لا مجموعات استخراج');
  // التدرج الأسبوعي الدقيق موجود أصلاً في قاعدة المنصة، فلا يُشترط أن يحتل
  // النص الرسمي المرتبة الأولى؛ المطلوب أن يكون قابلاً للاسترجاع وموثقاً بصفحته.
  const official = extraction.facets.flatMap(group => group.candidates)
    .filter(candidate => candidate.status === 'official');
  assert.ok(official.length > 0, 'لا تدرج رسمي بين المرشّحات');
  assert.ok(official.every(candidate => candidate.kind === 'progression'));
  assert.ok(official.every(candidate => typeof candidate.page === 'number'), 'التدرج الرسمي يحمل صفحته');
});

test('تحديد نوع المعلومة يرجّح الواجهة البنيوية على الذكر العَرَضي', () => {
  // الصفحة تذكر «التقويم» عَرَضاً لكن موضوعها الكفاءة الختامية
  assert.equal(guessFacetOfFreeText('الكفاءة الختامية: يقدم إرشادات وتفسيرا علميا، مع التطرق إلى التقويم.'), 'kafaa');
  assert.equal(guessFacetOfFreeText('معايير التقويم المعتمدة في المقطع التعلمي'), 'ma3ayir');
  assert.equal(guessFacetOfFreeText('دور الأستاذ: يقود الاستاذ التلاميذ من خلال مناقشة'), 'teacherRole');
  assert.equal(guessFacetOfFreeText('الهدف التعلمي: تحديد مفهوم الوسط الداخلي ومكوناته'), 'ta3alom');
  assert.equal(guessFacetOfFreeText('نص الوضعية الانطلاقية: يعاني أطفال الدول الفقيرة'), 'wadiya');
  assert.equal(guessFacetOfFreeText('الميدان الأول: الإنسان والصحة'), 'midan');
  assert.equal(guessFacetOfFreeText('الحجم الساعي الأسبوعي وعدد الأسابيع'), 'zaman');
  assert.equal(guessFacetOfFreeText('سلم التنقيط والاجابة المرتقبة'), 'answers');
  assert.equal(guessFacetOfFreeText(''), 'reference');
});

test('التحميل الكسول يُخزَّن ولا يُعاد، والتفريغ يعيده', async () => {
  resetOfficialSourcesCache();
  assert.equal(officialSourcesReady(), false);
  assert.deepEqual(getCachedOfficialSources(), []);

  const first = await preloadOfficialSources();
  const second = await preloadOfficialSources();
  assert.equal(first, second, 'الوعد نفسه يُعاد فلا تحميل مكرر');
  assert.equal(officialSourcesReady(), true);
  assert.equal(getCachedOfficialSources().length, first.length);

  // تحميل وثيقة واحدة بعينها لا يمسّ الذاكرة المخزنة الكاملة
  const only = await loadOfficialSources(['curriculum2016']);
  assert.equal(only.length, 1);
  assert.equal(only[0].kind, 'curriculum');
  assert.equal(getCachedOfficialSources().length, first.length);

  resetOfficialSourcesCache();
  assert.equal(officialSourcesReady(), false);
});
