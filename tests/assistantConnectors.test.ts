import assert from 'node:assert/strict';
import test from 'node:test';
import type { LessonMemo } from '../src/types';
import { planAssistantQuery } from '../src/services/assistantOrchestrator';
import { contextGraph, detectAssistantContext, suggestFollowUps } from '../src/services/assistantContext';
import { connectorHealthList, spaceReferencesOf } from '../src/services/assistantConnectors';
import { evidenceFromReferences, sortReferencesByAuthority } from '../src/services/assistantEvidence';
import type { KnowledgeSpace } from '../src/services/knowledgeSpaces';
import type { KnowledgeReference } from '../src/services/knowledgeBase';

const lesson = {
  level: '1am',
  midan: 'الإنسان والصحة',
  maqta: 'المقطع التعلمي 3',
  mawrid: 'مقر الامتصاص عند النبات الأخضر',
  ta3alom: 'كيف يمتص النبات الماء؟',
  markaba: 'ربط مقر الامتصاص ببنية الجذر',
  anshita: [],
} as unknown as LessonMemo;

const reference = (overrides: Partial<KnowledgeReference>): KnowledgeReference => ({
  id: 'r',
  kind: 'memo',
  kindLabel: 'مذكرة',
  title: 'مذكرة',
  section: 'نشاط',
  facet: 'activity',
  facetLabel: 'نشاط',
  level: '1am',
  status: 'platform',
  statusLabel: 'موثق رسميًا',
  sourceLabel: 'المذكرات',
  snippet: 'مقتطف',
  ...overrides,
});

const space = (ready: boolean): KnowledgeSpace => ({
  id: 'space',
  title: 'التغذية',
  description: '',
  level: '1am',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  sources: [{
    id: 's',
    name: 'وثيقة.pdf',
    kind: 'pdf',
    mimeType: 'application/pdf',
    size: 100,
    pages: 1,
    text: 'مقر الامتصاص',
    chunks: [{ id: 'c', page: 1, text: 'مقر الامتصاص عند النبات' }],
    addedAt: new Date(0).toISOString(),
    status: ready ? 'ready' : 'needs-text',
  }],
});

test('السياق التربوي يُستنتج من السؤال وبيانات المورد دون إدخال يدوي', () => {
  const plan = planAssistantQuery({
    question: 'أريد نشاطًا حول مقر الامتصاص عند النبات الأخضر للسنة الأولى متوسط.',
    level: '2am',
    lesson,
    curriculum: [],
  });
  assert.equal(plan.context.level, '1am');
  assert.equal(plan.context.levelLabel, 'السنة الأولى متوسط');
  assert.equal(plan.context.sequence, 'المقطع التعلمي 3');
  assert.equal(plan.context.resource, 'مقر الامتصاص عند النبات الأخضر');
  assert.equal(plan.context.competency, 'ربط مقر الامتصاص ببنية الجذر');
  assert.equal(plan.context.subject, 'علوم الطبيعة والحياة');

  const graph = contextGraph(plan.context, lesson);
  assert.deepEqual(graph.map(node => node.label), ['المستوى', 'المادة', 'الميدان', 'المقطع', 'الكفاءة', 'المورد']);
});

test('detectAssistantContext يبني نطاق المصادر من Connectors المختارة', () => {
  const context = detectAssistantContext({
    question: 'قارن بين الوثيقتين',
    level: '2am',
    lesson: null,
    intent: 'COMPARE_DOCUMENTS',
    intentLabel: 'مقارنة مصادر',
    topic: 'الوثيقتان',
    connectors: ['platform', 'space'],
  });
  assert.deepEqual(context.sourceScope, ['platform', 'space']);
  assert.equal(context.requestedAction, 'مقارنة المصادر');
});

test('اقتراحات المتابعة مرتبطة بالنية والموضوع وتبقى قصيرة', () => {
  const followUps = suggestFollowUps('REMEDIATION', 'مقر الامتصاص');
  assert.equal(followUps.length, 3);
  assert.ok(followUps.every(item => item.includes('مقر الامتصاص') || item.includes('المعالجة')));
});

test('صحة Connectors تعكس حالة الويب والمساحة دون إسقاط بقية المصادر', () => {
  const offline = connectorHealthList({ space: null, online: false, aiConfigured: false });
  assert.equal(offline.find(row => row.id === 'platform')?.state, 'available');
  assert.equal(offline.find(row => row.id === 'space')?.state, 'degraded');
  assert.equal(offline.find(row => row.id === 'web')?.state, 'offline');

  const ready = connectorHealthList({ space: space(true), online: true, aiConfigured: true });
  assert.equal(ready.find(row => row.id === 'space')?.state, 'available');
  assert.equal(ready.find(row => row.id === 'web')?.state, 'available');

  const noProvider = connectorHealthList({ space: space(false), online: true, aiConfigured: false });
  assert.equal(noProvider.find(row => row.id === 'space')?.state, 'degraded');
  assert.equal(noProvider.find(row => row.id === 'web')?.state, 'degraded');
});

test('ترتيب الأدلة يضع المصدر الرسمي قبل وثيقة الأستاذ مهما كان ترتيب الإدخال', () => {
  const teacher = reference({ id: 't', kind: 'teacherDocument', status: 'teacher', score: 9 });
  const official = reference({ id: 'o', kind: 'progression', status: 'official', score: 2 });
  const sorted = sortReferencesByAuthority([teacher, official]);
  assert.deepEqual(sorted.map(item => item.id), ['o', 't']);

  const evidence = evidenceFromReferences(sorted);
  assert.equal(evidence[0].confidenceLabel, 'موثق رسميًا');
  assert.equal(evidence[1].confidenceLabel, 'موثق من ملف الأستاذ');
  assert.ok(evidence[0].authority > evidence[1].authority);
});

test('مصادر المساحة تحمل اسم الملف ورقم الصفحة ونوع «وثيقة الأستاذ»', () => {
  const refs = spaceReferencesOf(space(true), [{
    source: space(true).sources[0],
    chunk: { id: 'c', page: 1, text: 'مقر الامتصاص' },
    score: 1,
    snippet: 'مقر الامتصاص',
  }]);
  assert.equal(refs[0].page, 1);
  assert.equal(refs[0].status, 'teacher');
  assert.match(refs[0].sourceLabel || '', /مساحة المعرفة/);
});
