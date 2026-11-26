import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConversationalLocalAnswer,
  buildGroundedLocalAnswer,
  detectAssistantIntent,
  detectAssistantLevel,
  ensureSourcesSection,
  expandConversationQuery,
  NO_CONFIRMED_INFORMATION,
  planAssistantQuery,
  stripSourceDetails,
  validateCitationMarkers,
  wantsLevel,
  wantsSources,
} from '../src/services/assistantOrchestrator';
import { chunkSpaceText, searchSpace, splitIntoPages, type KnowledgeSpace } from '../src/services/knowledgeSpaces';
import type { KnowledgeReference } from '../src/services/knowledgeBase';

const reference = (overrides: Partial<KnowledgeReference> = {}): KnowledgeReference => ({
  id: 'ref-1',
  kind: 'memo',
  kindLabel: 'مذكرة',
  title: 'مذكرة مقر الامتصاص',
  section: 'النشاط 2',
  facet: 'activity',
  facetLabel: 'نشاط',
  level: '1am',
  status: 'platform',
  statusLabel: 'مصدر المنصة',
  sourceLabel: 'المذكرات',
  page: 14,
  snippet: 'يمتص النبات الماء والأملاح المعدنية عبر الجذور.',
  ...overrides,
});

const spaceWith = (text: string, pages?: number): KnowledgeSpace => ({
  id: 'space-1',
  title: 'التغذية عند النبات',
  description: '',
  level: '1am',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  sources: [{
    id: 'source-1',
    name: 'وثيقة الأستاذ.pdf',
    kind: 'pdf',
    mimeType: 'application/pdf',
    size: 1200,
    pages,
    text,
    chunks: chunkSpaceText(text, pages),
    addedAt: new Date(0).toISOString(),
    status: 'ready',
  }],
});

test('detectAssistantIntent يميز النوايا الأساسية من صياغة الأستاذ', () => {
  assert.equal(detectAssistantIntent('ابحث في الإنترنت عن موارد حديثة حول التغذية'), 'WEB_RESEARCH');
  assert.equal(detectAssistantIntent('قارن بين الوثيقة الأولى والثانية'), 'COMPARE_DOCUMENTS');
  assert.equal(detectAssistantIntent('لخص محتوى هذه الوثائق'), 'SUMMARIZE');
  assert.equal(detectAssistantIntent('استخرج التجارب الموجودة في الملفات'), 'EXTRACT_CONTENT');
  assert.equal(detectAssistantIntent('اقترح نشاطًا علاجيًا للتلاميذ الذين لم يتحكموا في المورد'), 'REMEDIATION');
  assert.equal(detectAssistantIntent('اقترح اختبارًا قصيرًا على مقر الامتصاص'), 'GENERATE_ASSESSMENT');
  assert.equal(detectAssistantIntent('ما هي أهداف درس التغذية عند الإنسان؟'), 'GENERAL_EDUCATIONAL_QUERY');
  assert.equal(detectAssistantIntent('أريد نشاطًا مناسبًا لدرس مقر الامتصاص'), 'SEARCH_ACTIVITY');
});

test('detectAssistantLevel يستنتج المستوى من السؤال ثم من السياق', () => {
  assert.equal(detectAssistantLevel('أريد نشاطًا للسنة الرابعة متوسط'), '4am');
  assert.equal(detectAssistantLevel('أريد نشاطًا', '2am'), '2am');
});

test('planAssistantQuery يضيف Connector المساحة عند وجود مصادر جاهزة فقط', () => {
  const withoutSpace = planAssistantQuery({ question: 'اقترح نشاطًا للسنة الأولى متوسط', level: '1am' });
  assert.deepEqual(withoutSpace.connectors, ['platform']);
  assert.equal(withoutSpace.level, '1am');

  const withSpace = planAssistantQuery({ question: 'اقترح نشاطًا', level: '1am', space: spaceWith('مقر الامتصاص عند النبات الأخضر') });
  assert.ok(withSpace.connectors.includes('space'));
  assert.ok(withSpace.stages.some(stage => stage.includes('مساحة المعرفة')));

  const web = planAssistantQuery({ question: 'ابحث في الإنترنت عن مصادر', level: '1am' });
  assert.equal(web.webMode, 'explicit');
  assert.ok(web.connectors.includes('web'));
});

test('validateCitationMarkers يحذف الإشارات التي لا يقابلها مصدر', () => {
  assert.equal(validateCitationMarkers('نص [1] وآخر [3] فقط', 2), 'نص [1] وآخر  فقط');
  assert.equal(validateCitationMarkers('بلا مصادر [1]', 0), 'بلا مصادر ');
});

test('ensureSourcesSection يضيف قائمة المصادر مرة واحدة فقط', () => {
  const text = 'جواب موثق [1]';
  const once = ensureSourcesSection(text, [reference()]);
  assert.match(once, /### المصادر/);
  assert.match(once, /ص 14/);
  assert.equal(ensureSourcesSection(once, [reference()]), once);
});

test('الجواب المحلي يفصل المعلومة الموثقة عن اقتراح المساعد', () => {
  const plan = planAssistantQuery({ question: 'اقترح نشاطًا', level: '1am' });
  const answer = buildGroundedLocalAnswer(plan, [reference()], 'التغذية');
  assert.match(answer, /📘 وارد في المصادر/);
  assert.match(answer, /🤖 اقتراح المساعد/);
  assert.match(answer, /\[1\] مذكرة مقر الامتصاص/);
});

test('لا يخترع المساعد معلومة عند غياب المصادر', () => {
  const plan = planAssistantQuery({ question: 'ما هو مقر الامتصاص؟', level: '1am' });
  const answer = buildGroundedLocalAnswer(plan, []);
  assert.match(answer, new RegExp(NO_CONFIRMED_INFORMATION));
  assert.doesNotMatch(answer, /📘 وارد في المصادر/);
});

test('البحث الافتراضي شامل لكل المستويات دون تقييد', () => {
  const plan = planAssistantQuery({ question: 'أريد نشاطًا حول الهضم' });
  assert.equal(plan.level, 'all');
  assert.ok(plan.connectors.includes('platform'));
});

test('أسئلة المتابعة القصيرة تُوسّع بسياق آخر سؤال للأستاذ', () => {
  const history = [
    { role: 'user' as const, text: 'أريد نشاطًا حول الهضم' },
    { role: 'assistant' as const, text: 'إليك نشاطًا أوليًا حول الهضم.' },
  ];
  const expanded = expandConversationQuery('اجعله أكثر تفاعلية', history);
  assert.match(expanded, /الهضم/);
  assert.match(expanded, /أكثر تفاعلية/);
  assert.equal(expandConversationQuery('ما هو الهضم؟', history), 'ما هو الهضم؟');
});

test('كشف طلب المصادر أو المستوى الصريح فقط', () => {
  assert.equal(wantsSources('من أين أتت هذه المعلومة؟'), true);
  assert.equal(wantsSources('أريد نشاطًا حول الهضم'), false);
  assert.equal(wantsLevel('أي مستوى يناسب هذا النشاط؟'), true);
  assert.equal(wantsLevel('أريد نشاطًا حول الهضم'), false);
});

test('تنظيف الرد العادي يخفي الاستشهادات وأسماء المصادر', () => {
  const raw = 'الهضم عملية تحويل [1]، وفقًا للمنهاج.\n\n### المصادر\n[1] مذكرة الهضم ص 12';
  const clean = stripSourceDetails(raw);
  assert.doesNotMatch(clean, /\[1\]|المصادر|المنهاج|مذكرة|ص 12/);
  assert.match(clean, /الهضم/);
});

test('الجواب المحلي في المحادثة الحرة لا يعرض مستوى ولا اسم وثيقة', () => {
  const plan = planAssistantQuery({ question: 'ما هو مقر الامتصاص؟' });
  const answer = buildConversationalLocalAnswer(plan, [reference()]);
  assert.match(answer, /الإجابة/);
  assert.match(answer, /الجذور/);
  assert.doesNotMatch(answer, /1am|السنة الأولى|ص 14|المصادر|الوثيقة/);
});

test('تقطيع المساحة يحفظ أرقام الصفحات ويبحث دلاليًا بالكلمات', () => {
  const text = [
    '<PARSED TEXT FOR PAGE: 1 / 2>',
    'مقر الامتصاص عند النبات الأخضر: تمتص الجذور الماء والأملاح المعدنية.',
    '<PARSED TEXT FOR PAGE: 2 / 2>',
    'تجربة زراعة نبات في محلول معدني لبيان دور الأملاح.',
  ].join('\n');
  const pages = splitIntoPages(text, 2);
  assert.deepEqual(pages.map(page => page.page), [1, 2]);

  const space = spaceWith(text, 2);
  const hits = searchSpace(space, 'كيف تمتص الجذور الماء؟', 3);
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].chunk.page, 1);
  assert.match(hits[0].snippet, /الجذور|الماء/);
});
