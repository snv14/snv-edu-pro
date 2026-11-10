import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildKnowledgeIndex,
  buildLocalKnowledgeAnswer,
  chunkTeacherText,
  detectKindHints,
  detectLevel,
  detectRequestedFacets,
  detectTask,
  extractKnowledge,
  normalizeArabic,
  resolveScope,
  searchKnowledge,
  serializeExtraction,
  stemToken,
  tokenize,
} from '../src/services/knowledgeBase';
import { getOfficialCurriculumDatabase } from '../src/data/curriculumDb';
import { buildQuickTaskPrompt, describeScope, KNOWLEDGE_QUICK_TASKS } from '../src/services/knowledgeQuickTasks';
import { detectAssistantMode } from '../src/services/smartAi';
import type { TeacherKnowledgeDoc } from '../src/types/knowledge';

const lessons = getOfficialCurriculumDatabase();

test('Arabic normalization matches different spellings of the same word', () => {
  assert.equal(normalizeArabic('الأنشطةُ'), 'الانشطه');
  assert.equal(stemToken(normalizeArabic('الأنشطةُ')), stemToken(normalizeArabic('انشطة')));
  assert.equal(normalizeArabic('إرساء الموارد'), 'ارساء الموارد');
  assert.equal(normalizeArabic('تمريناً'), 'تمرين');
  assert.equal(normalizeArabic('مذكرة'), 'مذكره');
  assert.equal(stemToken('الفرضيات'), 'فرضيات');
  assert.equal(stemToken('بالفرضيات'), 'فرضيات');
  const tokens = tokenize('ما هي الأنشطة الموثقة في المذكرة؟');
  assert.ok(tokens.includes('انشطه'));
  assert.ok(!tokens.includes('ما'));
});

test('the knowledge base indexes the four official source families', () => {
  const index = buildKnowledgeIndex({ lessons });
  const kinds = new Set(index.documents.map(document => document.kind));
  for (const kind of ['curriculum', 'companionDocument', 'teacherGuide', 'memo', 'progression']) {
    assert.ok(kinds.has(kind), `missing source family: ${kind}`);
  }
  assert.ok(index.chunks.length > 1000, 'expected a rich index');
  assert.ok(index.stats.byFacet.activity > 100);
  assert.ok(index.stats.byFacet.moshkila > 50);
  assert.ok(index.stats.byFacet.irsae > 50);
  assert.ok(index.stats.byFacet.faradiyat > 20);
  assert.ok(index.stats.byFacet.instructions > 100);
  // كل مقطع من المذكرات يحمل مساره (الميدان/المقطع/المورد) للاستشهاد.
  const memoChunk = index.chunks.find(chunk => chunk.kind === 'memo' && chunk.facet === 'moshkila');
  assert.ok(memoChunk?.scope.maqta && memoChunk?.scope.mawrid);
});

test('the level is read from the question without confusing it with the maqta order', () => {
  assert.equal(detectLevel('استخرج الأنشطة للسنة الثالثة متوسط'), '3am');
  assert.equal(detectLevel('أنشطة المقطع الأول 2am'), '2am');
  assert.equal(detectLevel('استخرج الأنشطة للمقطع الأول من التعليم المتوسط'), 'all');
  assert.equal(detectLevel('مشكلة المورد', '4am'), '4am');
});

test('scope resolution narrows to the documented curriculum path', () => {
  const precise = resolveScope('استخرج إرساء الموارد لتعلم مورد عناصر الوسط الحي 2am', { lessons });
  assert.equal(precise.level, '2am');
  assert.equal(precise.maqta, 'المقطع التعلمي 01: الوسط الحي');
  assert.equal(precise.mawrid, 'المورد التعلمي 01: خصائص الوسط الحي.');
  assert.equal(precise.ta3alom, 'تعلم مورد 1-1: عناصر الوسط الحي.');
  assert.ok(precise.lessonIds.length >= 1);

  // سؤال يذكر المقطع فقط لا يجب أن يُضيَّق إلى مورد واحد بالخطأ.
  const broad = resolveScope('استخرج الأنشطة للسنة الثالثة متوسط المقطع الأول الديناميكية الداخلية للكرة الأرضية', { lessons });
  assert.equal(broad.level, '3am');
  assert.equal(broad.maqta, 'الديناميكية الداخلية للكرة الأرضية');
  assert.equal(broad.mawrid, undefined);
  assert.equal(broad.ta3alom, undefined);

  const none = resolveScope('كيف تصاغ الوضعية المشكلة حسب الوثيقة المرافقة؟', { lessons });
  assert.equal(none.maqta, undefined);
  assert.equal(none.ta3alom, undefined);
});

test('facet and task detection read the teacher request', () => {
  assert.deepEqual(detectRequestedFacets('استخرج المشكلة والفرضيات'), ['moshkila', 'faradiyat']);
  assert.ok(detectRequestedFacets('أريد إرساء الموارد')[0] === 'irsae');
  assert.ok(detectRequestedFacets('ما هي تعليمات النشاط؟').includes('instructions'));
  assert.equal(detectTask('اقترح تمريناً تطبيقياً حول التغذية'), 'suggestExercise');
  assert.equal(detectTask('اقترح نشاطاً بديلاً بالوسائل المتاحة'), 'suggestActivity');
  assert.equal(detectTask('استخرج الأنشطة الموثقة'), 'extract');
  assert.equal(detectKindHints('حسب الوثيقة المرافقة')[0].kind, 'companionDocument');
  assert.equal(detectKindHints('ماذا يقول دليل الأستاذ؟')[0].kind, 'teacherGuide');
  assert.equal(detectAssistantMode('استخرج إرساء الموارد لهذا المورد'), 'irsae');
  assert.equal(detectAssistantMode('ما المشكلة والفرضيات في هذه المذكرة؟'), 'problem-hypothesis');
  assert.equal(detectAssistantMode('اقترح تمريناً مع الحل'), 'exercise');
  assert.equal(detectAssistantMode('استخرج البيانات والجداول'), 'extraction');
});

test('search returns documented memos first and honours the requested source family', () => {
  const memoHits = searchKnowledge('المشكلة المطروحة حول الزلازل', { lessons, level: '3am', topK: 6 });
  assert.ok(memoHits.length > 0);
  assert.equal(memoHits[0].chunk.level, '3am');
  assert.match(memoHits[0].chunk.text, /الزلزال|الزلازل/);

  const companionHits = searchKnowledge('كيف تصاغ الوضعية المشكلة حسب الوثيقة المرافقة؟', { lessons, topK: 5 });
  assert.equal(companionHits[0].chunk.kind, 'companionDocument');

  const guideHits = searchKnowledge('ما توجيهات دليل الأستاذ حول صياغة تعليمات النشاط؟', { lessons, topK: 5 });
  assert.equal(guideHits[0].chunk.kind, 'teacherGuide');
});

test('extraction offers several documented possibilities with their sources', () => {
  const extraction = extractKnowledge('ما هي المشكلة والفرضيات في مذكرات الزلازل 3am؟', { lessons });
  assert.equal(extraction.scope.level, '3am');
  const problems = extraction.facets.find(group => group.facet === 'moshkila');
  assert.ok(problems && problems.candidates.length >= 2, 'expected multiple documented problems');
  for (const candidate of problems.candidates) {
    assert.ok(candidate.text.trim().length > 5);
    assert.ok(candidate.documentTitle.includes('المذكرات'));
    assert.ok(candidate.scope.maqta);
  }

  const hypotheses = extraction.facets.find(group => group.facet === 'faradiyat');
  assert.ok(hypotheses && hypotheses.candidates.length >= 1);

  const answer = buildLocalKnowledgeAnswer(extraction);
  assert.match(answer, /قاعدة المعرفة/);
  assert.match(answer, /احتمالات موثقة|قيمة موثقة واحدة/);
  assert.match(answer, /المصدر:/);
});

test('activities and instructions are extracted with the exact curriculum wording', () => {
  const extraction = extractKnowledge('استخرج الأنشطة والتعليمات للمورد التعلمي 01 خصائص الوسط الحي', { lessons });
  const activities = extraction.facets.find(group => group.facet === 'activity');
  const instructions = extraction.facets.find(group => group.facet === 'instructions');
  assert.ok(activities && activities.candidates.length >= 1);
  assert.ok(instructions && instructions.candidates.length >= 1);
  assert.match(activities.candidates[0].text, /إحصاء عناصر الوسط الحي/);
  assert.match(instructions.candidates[0].text, /حدد|صنف/);
  assert.equal(activities.candidates[0].level, '2am');
});

test('missing values are reported instead of being invented', () => {
  const extraction = extractKnowledge('استخرج المشكلة والفرضيات لموضوع غير موجود في القاعدة: المركبات الفضائية', { lessons });
  const problems = extraction.facets.find(group => group.facet === 'moshkila');
  const relevant = (problems?.candidates || []).filter(candidate => /فضاء|فضائ/.test(candidate.text));
  assert.equal(relevant.length, 0);
  const serialized = serializeExtraction(extraction);
  assert.ok(Array.isArray(serialized.facets));
  assert.ok(serialized.stats.chunks > 0);
});

test('a teacher document is indexed, retrieved and labelled as a teacher source', () => {
  const doc: TeacherKnowledgeDoc = {
    id: 'kb-doc-test',
    kind: 'companionDocument',
    title: 'الوثيقة المرافقة — مقتطف الأستاذ',
    level: '2am',
    text: 'مواصفات إرساء الموارد في الوثيقة المرافقة للأستاذ كريم:\n\n'
      + 'تُصاغ خلاصة إرساء المورد في ثلاثة أسطر كحد أقصى، بمصطلحات المورد، وتُكتب بعد التقصي لا قبله.\n\n'
      + 'تُرفق الخلاصة بسؤال تقويم سريع للتحقق من تدوين المتعلمين لها.',
    createdAt: new Date().toISOString(),
    source: 'teacher',
  };
  const hits = searchKnowledge('مواصفات إرساء الموارد في الوثيقة المرافقة للأستاذ كريم', { lessons, teacherDocs: [doc], topK: 5 });
  const teacherHit = hits.find(hit => hit.chunk.documentId === doc.id);
  assert.ok(teacherHit, 'the uploaded document should be retrievable');
  assert.equal(teacherHit.chunk.status, 'teacher');
  assert.equal(teacherHit.chunk.level, '2am');
  assert.ok(chunkTeacherText(doc.text).length >= 1);
  const long = Array.from({ length: 40 }, (_, index) => `فقرة ${index + 1}: ${'نص توجيهي من الوثيقة المرافقة يشرح مواصفات إرساء الموارد. '.repeat(4)}`).join('\n\n');
  assert.ok(chunkTeacherText(long).length > 5, 'a long document must be split into searchable chunks');
  assert.ok(chunkTeacherText(long).every(chunk => chunk.length <= 1400));
});

test('quick tasks build a scoped request for the assistant', () => {
  const scope = { level: '3am', maqta: 'الديناميكية الداخلية للكرة الأرضية', mawrid: 'الزلازل، ظاهرة طبيعية.' };
  assert.equal(describeScope(scope), 'الزلازل، ظاهرة طبيعية. — الديناميكية الداخلية للكرة الأرضية — السنة الثالثة متوسط');
  const activitiesTask = KNOWLEDGE_QUICK_TASKS.find(task => task.id === 'activities');
  assert.ok(activitiesTask);
  const prompt = buildQuickTaskPrompt(activitiesTask, scope);
  assert.ok(prompt.includes('الزلازل، ظاهرة طبيعية.'));
  assert.ok(!prompt.includes('{النطاق}'));
  assert.equal(describeScope({}), 'المستوى الحالي');
});

test('teacher knowledge documents are stored locally and can be removed', async () => {
  const memory = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
      removeItem: (key: string) => { memory.delete(key); },
    },
  };
  const { saveKnowledgeDoc, loadKnowledgeDocs, deleteKnowledgeDoc, saveKnowledgeSettings, loadKnowledgeSettings } =
    await import('../src/services/knowledgeLibraryStore');

  const saved = saveKnowledgeDoc({ title: 'دليل الأستاذ — مقتطف', kind: 'teacherGuide', level: '1am', text: 'نص توجيهي للأستاذ.' });
  assert.ok(saved?.id);
  assert.equal(loadKnowledgeDocs().length, 1);
  assert.equal(saveKnowledgeDoc({ title: '', kind: 'memo', level: 'all', text: '' }), null);

  const updated = saveKnowledgeSettings({ localFirst: true, topK: 16 });
  assert.equal(updated.localFirst, true);
  assert.equal(loadKnowledgeSettings().topK, 16);

  assert.equal(deleteKnowledgeDoc(saved!.id), true);
  assert.equal(loadKnowledgeDocs().length, 0);
  delete (globalThis as any).window;
});
