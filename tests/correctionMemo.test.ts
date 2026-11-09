import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCorrectionMemo,
  fillFromPlatform,
  normalizeCorrectionMemo,
  overallTotal,
  part1Total,
  integrationTotal,
  validateCorrectionMemo,
  toNumber,
} from '../src/services/correctionMemoModel';
import { parseExamTextLocally } from '../src/services/correctionMemoImport';

const withPoints = () => {
  const data = createDefaultCorrectionMemo();
  data.exercises[0].declaredPoints = '6';
  data.exercises[0].questions[0].points = '2';
  data.exercises[0].questions[1].points = '2';
  data.exercises[0].questions[2].points = '2';
  data.exercises[1].declaredPoints = '6';
  data.exercises[1].questions[0].points = '3';
  data.exercises[1].questions[1].points = '3';
  data.exercises[1].questions[2].points = '';
  data.integration.criteria[0].indicators[0].points = '2';
  data.integration.criteria[1].indicators[0].points = '2';
  data.integration.criteria[2].indicators[0].points = '2';
  data.integration.criteria[3].indicators[0].points = '2';
  return data;
};

test('totals follow the points entered in the ladder', () => {
  const data = withPoints();
  assert.equal(part1Total(data), 12);
  assert.equal(integrationTotal(data), 8);
  assert.equal(overallTotal(data), 20);
});

test('validation flags a mismatch between declared and computed points', () => {
  const data = withPoints();
  data.exercises[0].questions[0].points = '4';
  const warnings = validateCorrectionMemo(data);
  assert.ok(warnings.some(warning => warning.blocking && warning.message.includes('التمرين الأول')));
  assert.ok(warnings.some(warning => warning.message.includes('المجموع العام')));
});

test('an empty template produces no blocking warnings and no invented totals', () => {
  const data = createDefaultCorrectionMemo();
  assert.equal(overallTotal(data), 0);
  assert.equal(validateCorrectionMemo(data).filter(warning => warning.blocking).length, 0);
});

test('platform fill never overwrites values typed by the teacher', () => {
  const data = createDefaultCorrectionMemo();
  data.schoolName = 'متوسطة كتبها الأستاذ';
  data.resources[0].maqta = 'مقطع يدوي';

  const lesson: any = {
    level: '3am', midan: 'الأرض', maqta: 'مقطع المنصة', mawrid: 'مورد', ta3alom: 'تعلم',
    markaba: 'مركبة', ma3ayirTaqwim: 'معيار 1، معيار 2', anshita: [],
  };
  const result = fillFromPlatform(data, {
    config: { schoolName: 'متوسطة المنصة', teacherName: 'أستاذ المنصة', directorate: 'مديرية', schoolYear: '2026 / 2027' } as any,
    lesson,
    curriculum: [lesson],
  });

  assert.equal(result.data.schoolName, 'متوسطة كتبها الأستاذ');
  assert.equal(result.data.teacherName, 'أستاذ المنصة');
  assert.equal(result.data.resources[0].maqta, 'مقطع يدوي');
  assert.equal(result.data.resources[0].knowledge, 'مركبة');
  assert.equal(result.data.resources[0].knowledgeSource, 'platform');
  assert.ok(result.filled.includes('الأستاذ(ة)'));
});

test('platform fill leaves empty fields empty when the platform has no value', () => {
  const result = fillFromPlatform(createDefaultCorrectionMemo(), { config: undefined, lesson: null, curriculum: [] });
  assert.equal(result.data.schoolName, '');
  assert.equal(result.data.directorate, '');
  assert.equal(result.filled.length, 0);
  assert.ok(result.skipped.length > 0);
});

test('corrupted drafts fall back to a usable template instead of crashing', () => {
  const data = normalizeCorrectionMemo({ exercises: 'broken', integration: { criteria: 'x' }, notes: 5 });
  assert.equal(data.exercises.length, 2);
  assert.equal(data.integration.criteria.length, 4);
  assert.equal(data.notes.length, 3);
  assert.equal(normalizeCorrectionMemo(null).version, 1);
});

test('arabic-indic digits are parsed for point totals', () => {
  assert.equal(toNumber('٠٦'), 6);
  assert.equal(toNumber('٢٫٥'), 2.5);
  assert.equal(toNumber(''), null);
  assert.equal(toNumber('abc'), null);
});

test('local text parsing keeps exercise order, questions and points', () => {
  const text = [
    'التمرين الأول: (06 نقاط)',
    '1) عرّف المصطلح التالي. (2 ن)',
    '2) فسّر الظاهرة العلمية. (2 ن)',
    '3) استنتج العلاقة. (2 ن)',
    'التمرين الثاني: (06 نقاط)',
    '1) اذكر ثلاث خصائص. (3 ن)',
    '2) علّل الإجابة. (3 ن)',
    'المجموع: 12 نقطة',
  ].join('\n');

  const parsed = parseExamTextLocally(text);
  assert.ok(parsed);
  assert.equal(parsed!.exercises.length, 2);
  assert.equal(parsed!.exercises[0].questions.length, 3);
  assert.equal(parsed!.exercises[0].questions[0].points, 2);
  assert.equal(parsed!.exercises[1].questions[1].text.includes('علّل'), true);
  assert.equal(parsed!.totalPoints, 12);
});

test('local text parsing returns null when the text has no exercises, so nothing is invented', () => {
  assert.equal(parseExamTextLocally('نص عادي بدون تمارين'), null);
  assert.equal(parseExamTextLocally(''), null);
});

test('the sheet renders the reference sections and computed totals', async () => {
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { CorrectionMemoSheet } = await import('../src/components/CorrectionMemoSheet');
  const data = withPoints();
  data.teacherName = 'الأستاذ التجريبي';
  data.schoolYear = '2026 / 2027';
  const markup = renderToStaticMarkup(React.createElement(CorrectionMemoSheet, { data, editable: false }));
  for (const heading of ['الموارد المعرفية المستهدفة', 'الجزء الأول', 'الجزء الثاني: الوضعية الإدماجية', 'التصحيح البعدي وتحليل النتائج', 'الأخطاء المتكررة', 'خطة المعالجة', 'ملاحظات خاصة بالتصحيح', 'السيد(ة) المدير(ة)']) {
    assert.ok(markup.includes(heading), `missing section: ${heading}`);
  }
  assert.ok(markup.includes('المجموع العام للمذكرة'));
  assert.ok(markup.includes('20 ن'));
  assert.ok(markup.includes('الأستاذ التجريبي'));
});
