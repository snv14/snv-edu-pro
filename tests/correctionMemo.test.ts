import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyExamStructure,
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
import { buildPointSuggestion, enrichCorrectionMemoFromDb } from '../src/services/correctionMemoEnrich';

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

test('a فرض keeps exercises only while an اختبار adds the integration situation', () => {
  const quiz = createDefaultCorrectionMemo('فرض');
  assert.equal(quiz.examType, 'فرض');
  assert.equal(quiz.part1DeclaredPoints, '20');
  assert.equal(quiz.integration.declaredPoints, '');
  assert.ok(!quiz.resources.some(row => row.exerciseLabel.includes('الإدماجية')));

  const exam = applyExamStructure(quiz, 'اختبار');
  assert.equal(exam.part1DeclaredPoints, '12');
  assert.equal(exam.integration.declaredPoints, '8');
  assert.ok(exam.resources.some(row => row.exerciseLabel.includes('الإدماجية')));
});

test('the suggested point ladder adds up to 12 + 8 without touching teacher points', () => {
  const data = createDefaultCorrectionMemo('اختبار');
  const suggestion = buildPointSuggestion(data);
  const part1 = suggestion.exercises.reduce((sum, exercise) => sum + Number(exercise.declaredPoints), 0);
  const integration = suggestion.criteria.reduce(
    (sum, criterion) => sum + criterion.indicators.reduce((acc, indicator) => acc + (Number(indicator.points) || 0), 0),
    0
  );
  assert.equal(part1, 12);
  assert.equal(Math.round(integration * 100) / 100, 8);
  assert.equal(suggestion.total, 20);
});

test('database enrichment fills midan, maqta and competence but keeps teacher text', () => {
  const data = createDefaultCorrectionMemo('فرض');
  data.exercises[0].questions[0].text = 'التنفس عند النبات الأخضر';
  data.midan = 'ميدان كتبه الأستاذ';
  const lesson: any = {
    level: '1am', midan: 'الإنسان والصحة', maqta: 'مقطع التنفس', mawrid: 'التنفس عند النبات',
    ta3alom: 'تعلم', markaba: 'مركبة', kafaaKhitamiya: 'كفاءة ختامية', ma3ayirTaqwim: 'معيار', anshita: [],
  };

  const result = enrichCorrectionMemoFromDb(data, { lesson, curriculum: [lesson] });
  assert.equal(result.data.midan, 'ميدان كتبه الأستاذ');
  assert.equal(result.data.competence, 'كفاءة ختامية');
  assert.equal(result.data.resources[0].maqta, 'مقطع التنفس');
  assert.ok(result.filled.includes('الكفاءة الختامية'));
});

test('importing a text paper applies the exam structure and moves the integration prompts to the criteria', async () => {
  const { importCorrectionFile } = await import('../src/services/correctionMemoImport');
  const text = [
    'التمرين الأول: (06 نقاط)',
    '1) عرّف المصطلح. (2 ن)',
    '2) فسّر الظاهرة. (4 ن)',
    'التمرين الثاني: (06 نقاط)',
    '1) اذكر ثلاث خصائص. (3 ن)',
    '2) علّل الإجابة. (3 ن)',
    'الوضعية الإدماجية: (08 نقاط)',
    '1) حلل الوثيقة. (4 ن)',
    '2) استنتج النتيجة. (4 ن)',
  ].join('\n');
  const file = new File([text], 'sujet.txt', { type: 'text/plain' });
  const dataUrl = `data:text/plain;base64,${Buffer.from(text).toString('base64')}`;

  const outcome = await importCorrectionFile({ file, dataUrl, examType: 'اختبار', current: createDefaultCorrectionMemo('اختبار') });
  assert.equal(outcome.data.exercises.length, 2);
  assert.equal(outcome.data.examType, 'اختبار');
  assert.equal(outcome.data.part1DeclaredPoints, '12');
  const filledCriteria = outcome.data.integration.criteria.filter(criterion => criterion.indicators.some(indicator => indicator.text.trim()));
  assert.equal(filledCriteria.length, 2);
  assert.ok(outcome.data.integration.criteria[0].indicators[0].text.includes('حلل الوثيقة'));
});

test('a فرض import keeps exercises only and never adds an integration block', async () => {
  const { importCorrectionFile } = await import('../src/services/correctionMemoImport');
  const text = [
    'التمرين الأول:',
    '1) عرّف التنفس. (2 ن)',
    'الوضعية الإدماجية:',
    '1) حلل السند. (4 ن)',
  ].join('\n');
  const file = new File([text], 'devoir.txt', { type: 'text/plain' });
  const dataUrl = `data:text/plain;base64,${Buffer.from(text).toString('base64')}`;

  const outcome = await importCorrectionFile({ file, dataUrl, examType: 'فرض', current: createDefaultCorrectionMemo('فرض') });
  assert.equal(outcome.data.examType, 'فرض');
  assert.equal(outcome.data.part1DeclaredPoints, '20');
  assert.equal(outcome.data.exercises.length, 1);
  assert.equal(outcome.data.integration.criteria.some(criterion => criterion.indicators.some(indicator => indicator.text.trim())), false);
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
