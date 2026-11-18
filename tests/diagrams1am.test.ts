/**
 * حراسة ربط مخططات السنة الأولى متوسط وتقسيم وثيقة المذكرات السحابية.
 *
 * خلفية 1: المخططات الـ11 كانت موجودة في `diagrams1am.ts` ومربوطة بمصادرها في
 * `diagramSources1am.ts`، لكن لا شيء يستوردها — فكانت كل مذكرات 1AM بلا رسوم
 * (`diagrams: 0/22`). الربط الآن في `diagramLink1am.ts`.
 *
 * خلفية 2: بعد الربط بلغت قاعدة المذكرات 1162 KiB = 113.5% من حد Firestore
 * (1 MiB للوثيقة)، فكان setDoc يفشل حتماً. الحل: وثيقة لكل مستوى.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS_1AM } from '../src/data/memos/lessons1am';
import { EXACT_LESSONS_1AM } from '../src/data/memos/official_1am_exact_db';
import { DIAGRAMS_1AM } from '../src/data/memos/diagrams1am';
import { DIAGRAM_SOURCES_1AM } from '../src/data/memos/diagramSources1am';
import {
  DIAGRAM_MAP_1AM,
  diagramCoverage1AM,
  diagramsForUnit1AM,
  withDiagrams1AM,
} from '../src/data/memos/diagramLink1am';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';

test('المخططات: 11 مخططاً و11 مصدراً بنفس المفاتيح', () => {
  const diagramKeys = Object.keys(DIAGRAMS_1AM).sort();
  const sourceKeys = Object.keys(DIAGRAM_SOURCES_1AM).sort();
  assert.equal(diagramKeys.length, 11);
  assert.deepEqual(diagramKeys, sourceKeys, 'مفتاح بلا مصدر أو العكس');
});

test('المخططات: كل SVG سليم البنية (يبدأ بـ <svg> وينتهي بـ </svg>)', () => {
  for (const [key, svg] of Object.entries(DIAGRAMS_1AM)) {
    const text = String(svg).trim();
    assert.ok(text.startsWith('<svg'), `${key}: لا يبدأ بـ <svg>`);
    assert.ok(text.endsWith('</svg>'), `${key}: لا ينتهي بـ </svg>`);
    assert.ok(text.length > 500, `${key}: حجم غير معقول (${text.length})`);
  }
});

test('الربط: كل مخطط مستعمل في وحدة واحدة على الأقل — لا مخطط مهمَل', () => {
  const coverage = diagramCoverage1AM();
  assert.deepEqual(coverage.unusedDiagrams, [], 'مخططات غير مربوطة بأي وحدة');
  assert.equal(coverage.distinctDiagramsUsed, 11);
});

test('الربط: 24 وحدة من 28 تحمل مخططات (المقطع 6 لا مخطط له)', () => {
  const coverage = diagramCoverage1AM();
  assert.equal(coverage.units, 28);
  assert.equal(coverage.unitsWithDiagram, 24);
  assert.equal(coverage.totalDiagrams, 25);
});

test('الربط: قاعدة 1AM المصدَّرة تحمل الرسومات فعلاً', () => {
  const withDiagrams = LESSONS_1AM.filter(l => (l.diagrams?.length || 0) > 0);
  assert.equal(withDiagrams.length, 24);
  const total = LESSONS_1AM.reduce((sum, l) => sum + (l.diagrams?.length || 0), 0);
  assert.equal(total, 25);
});

test('الربط: المصدر الأصلي لم يُعدَّل (نسخة التحرير بلا رسوم)', () => {
  // EXACT_LESSONS_1AM يبقى مرجعاً نقياً — الربط يُرجع نسخة جديدة.
  const originalWithDiagrams = EXACT_LESSONS_1AM.filter(l => (l.diagrams?.length || 0) > 0);
  assert.equal(originalWithDiagrams.length, 0, 'الربط عدّل المصدر الأصلي');
});

test('الربط: كل مفتاح في الخريطة يشير إلى مخطط موجود', () => {
  for (const [unitId, keys] of Object.entries(DIAGRAM_MAP_1AM)) {
    for (const key of keys) {
      assert.ok(key in DIAGRAMS_1AM, `الوحدة ${unitId} تشير إلى مخطط غير موجود: ${key}`);
    }
  }
});

test('الربط: كل معرّف وحدة في الخريطة موجود فعلاً في القاعدة', () => {
  const ids = new Set(LESSONS_1AM.map(l => l.sourceLearningUnitId));
  for (const unitId of Object.keys(DIAGRAM_MAP_1AM)) {
    assert.ok(ids.has(unitId), `معرّف وحدة غير موجود: ${unitId}`);
  }
});

test('الربط: الإطراح (المقطع 5) يحصل على مخطط الجهاز الإطراحي', () => {
  const diagrams = diagramsForUnit1AM('lu_1am_o5_1_1');
  assert.equal(diagrams.length, 1);
  assert.equal(diagrams[0].sourceKey, 'urinarySystem');
  assert.ok(diagrams[0].title.includes('الإطراح') || diagrams[0].title.includes('الكلية'));
});

test('الربط: مخطط الخلية مربوط بوحدة الخلية لا بغيرها', () => {
  const diagrams = diagramsForUnit1AM('lu_1am_6_1_2');
  assert.equal(diagrams.map(d => d.sourceKey).join(), 'cellStructure');
});

test('withDiagrams1AM دالة نقية: لا تعدّل المصفوفة المُدخلة', () => {
  const input = EXACT_LESSONS_1AM.slice(0, 3);
  const before = JSON.stringify(input);
  withDiagrams1AM(input);
  assert.equal(JSON.stringify(input), before, 'الدالة عدّلت المُدخل');
});

test('التقسيم السحابي: كل مستوى داخل حد Firestore بعد تقسيم المذكرات', () => {
  const db = getOfficialCurriculumDatabase();
  const LIMIT = 1024 * 1024; // 1 MiB
  for (const level of ['1am', '2am', '3am', '4am']) {
    const part = db.filter((l: { level: string }) => l.level === level);
    const bytes = Buffer.byteLength(JSON.stringify(part), 'utf8');
    assert.ok(
      bytes < LIMIT,
      `وثيقة ${level} تتجاوز الحد: ${(bytes / 1024).toFixed(1)} KiB`,
    );
  }
});

test('التقسيم السحابي: الوثيقة الموحّدة كانت ستتجاوز الحد (توثيق سبب التقسيم)', () => {
  const db = getOfficialCurriculumDatabase();
  const bytes = Buffer.byteLength(JSON.stringify(db), 'utf8');
  assert.ok(bytes > 1024 * 1024, `الوثيقة الموحّدة ${(bytes / 1024).toFixed(1)} KiB — لم تعد تتجاوز الحد، راجع التقسيم`);
});
