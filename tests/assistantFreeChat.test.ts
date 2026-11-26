import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantVisibility, conversationRetrievalQuery, presentAssistantAnswer, isConversationFollowUp } from '../src/services/assistantConversationPolicy';
import { conversationContext, loadUnifiedConversation, saveConversation, clearConversation, loadConversation } from '../src/services/conversationHistory';
import { extractKnowledge, buildKnowledgeIndex } from '../src/services/knowledgeBase';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';
import { buildDirectAssistantAnswer } from '../src/services/assistantKnowledge';
import { appendAssistantMemoContent, wantsMemoInsertion } from '../src/services/assistantMemoInsertion';
import { askSmartAi, prepareKnowledge, type SmartAiMessage } from '../src/services/smartAi';
import { searchNotebookKnowledge } from '../src/server/notebookKnowledge';

const lessons = getOfficialCurriculumDatabase();
const topic = 'اقترح نشاطاً حول الهضم وتحول الأغذية';
const followups = ['اجعله أكثر تفاعلية', 'أضف تجربة', 'أدخله في المذكرة'];

test('editing followups keep the original digestion topic and the working draft', () => {
  const history: SmartAiMessage[] = [{ role: 'user', text: topic }, { role: 'assistant', text: 'النشاط: الهضم' }];
  for (const question of followups) {
    assert.equal(isConversationFollowUp(question), true);
    assert.match(conversationRetrievalQuery(question, history), /الهضم/);
    history.push({ role: 'user', text: question }, { role: 'assistant', text: `مسودة ${question}` });
  }
  assert.equal(conversationRetrievalQuery('اشرح التنفس عند النبات', history), 'اشرح التنفس عند النبات');
  assert.equal(conversationRetrievalQuery('أضف تجربة عن التنفس', history), 'أضف تجربة عن التنفس');
});

test('long conversations retain a substantive topic and the latest draft, with bounded context', () => {
  const history: SmartAiMessage[] = [{ role: 'user', text: topic }];
  for (let i = 0; i < 55; i++) history.push({ role: 'user', text: 'أضف تجربة' }, { role: 'assistant', text: `المسودة ${i}` });
  const context = conversationContext(history);
  assert.equal(context[0].text, topic);
  assert.equal(context.at(-1)?.text, 'المسودة 54');
  assert.ok(context.length <= 20);
  const massive = conversationContext(history.map(item => item.role === 'assistant' ? { ...item, text: 'ن'.repeat(40000) } : item));
  assert.equal(massive[0].text, topic);
  assert.ok(massive.reduce((sum, item) => sum + item.text.length, 0) <= 50000);
});

test('normal answers omit provenance/year while explicit requests preserve them and scientific quantities remain', () => {
  const text = 'حسب المنهاج الرسمي، للسنة الرابعة متوسط: تجربة باستخدام 4 أنابيب [1]\nالمصدر: دليل الأستاذ\n\nالمراجع:\nدليل الأستاذ ص 10';
  const normal = presentAssistantAnswer(text, 'اقترح تجربة');
  assert.match(normal, /4 أنابيب/);
  assert.doesNotMatch(normal, /المنهاج|متوسط|المصدر|دليل|\[1\]/);
  assert.match(presentAssistantAnswer(text, 'ما المصدر وما السنة؟'), /المصدر: دليل الأستاذ/);
  assert.equal(assistantVisibility('كيف يستعمل النبات مصدر الطاقة؟').sources, false);
  assert.equal(assistantVisibility('ارفع مستوى التفاعل').level, false);
  assert.equal(assistantVisibility('ما المصدر؟').sources, true);
  assert.equal(assistantVisibility('ما مصدر هذا النشاط؟').sources, true);
  assert.equal(assistantVisibility('لأي مستوى دراسي؟').level, true);
});

test('global retrieval ignores active level/lesson without changing scoped consumers', () => {
  const teacherDocs = ['1am', '4am'].map(level => ({ id: `global-${level}`, kind: 'teacherDocument' as const, source: 'teacher' as const, level: level as '1am' | '4am', title: 'اختبار مستودع شامل', text: 'اختبار مستودع شامل زيلوفون تعليم مشترك', createdAt: '' }));
  const global = extractKnowledge('زيلوفون', { lessons: [], includeCorpus: false, level: '2am', teacherDocs, globalSearch: true });
  assert.ok(global.hits.some(hit => hit.chunk.level === '1am'));
  assert.ok(global.hits.some(hit => hit.chunk.level === '4am'));
  const scoped = extractKnowledge('زيلوفون', { lessons: [], includeCorpus: false, level: '2am', teacherDocs });
  assert.equal(scoped.scope.level, '2am');
  // Legacy scope uses soft ranking, not strict exclusion. Global search removes that bias.
  assert.ok(scoped.hits.find(hit => hit.chunk.level === '1am')!.score < global.hits.find(hit => hit.chunk.level === '1am')!.score);
});

test('platform guides, corrections and annual progressions are indexed with honest reference status', () => {
  const index = buildKnowledgeIndex({ lessons: [], includeProgression: true });
  for (const prefix of ['platform-guide-', 'platform-solution-', 'platform-plan-']) {
    assert.ok(index.documents.some(doc => doc.id.includes(prefix)), prefix);
  }
  assert.ok(index.documents.filter(doc => doc.id.includes('platform-guide-')).every(doc => doc.status === 'reference'));
  const without = buildKnowledgeIndex({ lessons: [], includeProgression: false });
  assert.ok(!without.documents.some(doc => doc.id.includes('platform-plan-')));
});

test('unified history migrates once, survives year changes, and reset does not revive an old year', () => {
  const memory = new Map<string, string>();
  (globalThis as any).window = { localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) } };
  saveConversation([{ role: 'user', text: topic }], '1am');
  saveConversation([{ role: 'user', text: 'موضوع آخر' }], '4am');
  assert.equal(loadUnifiedConversation('1am')?.messages[0].text, topic);
  assert.equal(loadUnifiedConversation('4am')?.messages[0].text, topic);
  clearConversation();
  assert.equal(loadUnifiedConversation('4am'), null);
  assert.equal(loadConversation('1am')?.messages[0].text, topic);
});

test('memo insertion is append-only and requires a real valid target/content', () => {
  const lesson = lessons[0];
  const original = structuredClone(lesson);
  const activity = appendAssistantMemoContent(lesson, 'activity', 'تجربة الهضم');
  assert.equal(activity.anshita.length, lesson.anshita.length + 1);
  assert.equal(activity.sourceOfficial, false);
  assert.deepEqual(lesson, original);
  const assessment = appendAssistantMemoContent(lesson, 'taqwim', 'سؤال إضافي');
  assert.match(assessment.taqwim, /سؤال إضافي/);
  assert.ok(assessment.taqwim.startsWith(lesson.taqwim));
  assert.throws(() => appendAssistantMemoContent(lesson, 'activity', '   '));
  assert.equal(wantsMemoInsertion('أدخله في المذكرة'), true);
});

test('local fallback is direct content and exposes provenance only on request', () => {
  const extraction = extractKnowledge('الهضم', { globalSearch: true, includeProgression: true });
  const answer = buildDirectAssistantAnswer(extraction, 'اشرح الهضم');
  assert.ok(answer.length > 30);
  assert.doesNotMatch(answer, /المصدر:|مسار المصدر:|المستوى:|قاعدة المعرفة|[1-4]AM/i);
  const prepared = prepareKnowledge({ question: 'أضف تجربة', level: '1am', lesson: lessons[0], history: [{ role: 'user', text: topic }] });
  assert.ok(prepared && prepared.candidateCount > 0);
});

test('browser sends contextual history and a global scope, suppressing routine metadata', async () => {
  const originalFetch = globalThis.fetch;
  let payload: any;
  globalThis.fetch = (async (input: any, init: any) => {
    if (String(input).includes('/api/gemini/smart-assistant')) {
      payload = JSON.parse(init.body);
      return new Response(JSON.stringify({ text: 'حسب المنهاج الرسمي، للسنة الرابعة متوسط: تجربة آمنة [1]', knowledgeUsed: [], localAnswer: false }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  }) as typeof fetch;
  try {
    const reply = await askSmartAi({ question: 'أضف تجربة', level: '1am', lesson: lessons[0], history: [{ role: 'user', text: topic }], knowledge: { settings: { includeProgression: false, includeCorpus: false, includeOfficialSources: false } } });
    assert.equal(payload.level, 'all');
    assert.equal(payload.currentLesson, null);
    assert.equal(payload.history[0].text, topic);
    assert.match(payload.knowledgeContext, /الهضم/);
    assert.doesNotMatch(reply?.text || '', /المنهاج|متوسط|\[1\]/);
  } finally { globalThis.fetch = originalFetch; }
});

test('Notebook bridge is off by default, fails closed and accepts actual bounded excerpts only', async () => {
  const originalFetch = globalThis.fetch;
  const previous = process.env.NOTEBOOKLM_BRIDGE_URL;
  delete process.env.NOTEBOOKLM_BRIDGE_URL;
  try {
    assert.deepEqual(await searchNotebookKnowledge('الهضم'), []);
    process.env.NOTEBOOKLM_BRIDGE_URL = 'http://not-secure.test';
    assert.deepEqual(await searchNotebookKnowledge('الهضم'), []);
    process.env.NOTEBOOKLM_BRIDGE_URL = 'https://bridge.example/search';
    globalThis.fetch = (async (_: any, init: any) => {
      assert.equal(JSON.parse(init.body).query, 'الهضم');
      return new Response(JSON.stringify({ excerpts: [{ title: 'مرجع مستورد', text: 'الهضم تحول الغذاء' }] }));
    }) as typeof fetch;
    const docs = await searchNotebookKnowledge('الهضم');
    assert.equal(docs.length, 1);
    assert.equal(docs[0].source, 'teacher');
    globalThis.fetch = (async () => { throw new Error('offline'); }) as typeof fetch;
    assert.deepEqual(await searchNotebookKnowledge('الهضم'), []);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.NOTEBOOKLM_BRIDGE_URL; else process.env.NOTEBOOKLM_BRIDGE_URL = previous;
  }
});
