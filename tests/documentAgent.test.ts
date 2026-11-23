import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeDocumentLocally,
  detectAgentLevel,
  parseAgentExercises,
  prepareAgentSource,
} from '../src/services/documentAgent';
import { readDocument } from '../src/server/documentReader';

const EXAM = `اختبار الفصل الأول في علوم الطبيعة والحياة
السنة الرابعة متوسط
التمرين الأول: (6 نقاط)
1) عرّف الهضم. (2 ن)
2) اذكر مراحل تحويل الأغذية. (2 ن)
3) فسّر دور الأنزيمات. (2 ن)
التمرين الثاني: (6 نقاط)
1) سمّ الأعضاء المشار إليها. (3 ن)
2) بيّن دور الأمعاء الدقيقة. (3 ن)
الجزء الثاني: الوضعية الإدماجية (8 نقاط)
1) حلّل الوثيقة. (4 ن)
2) استنتج دور اللعاب. (4 ن)
المجموع: 20`;

const DEVOIR = `الفرض المحروس الأول
السنة الثالثة متوسط
التمرين الأول (10 نقاط)
1- ما هي الزلازل؟ (4 ن)
2- اشرح ظاهرة الزلزال. (6 ن)
التمرين الثاني (10 نقاط)
1- اذكر آثار الزلازل. (5 ن)
2- ما هي الإجراءات الوقائية؟ (5 ن)`;

test('the agent reads an exam structure, its points and its integration situation', () => {
  const analysis = analyzeDocumentLocally(EXAM, { fileName: 'اختبار.docx' });
  assert.equal(analysis.examType, 'اختبار');
  assert.equal(analysis.level, '4am');
  assert.equal(analysis.exercises.filter(exercise => exercise.kind === 'exercise').length, 2);
  assert.equal(analysis.exercises.filter(exercise => exercise.kind === 'integration').length, 1);
  assert.equal(analysis.pointsSum, 20);
  assert.equal(analysis.totalPoints, 20);
  assert.equal(analysis.integrationDetected, true);
  assert.equal(analysis.suggestions.length, 0);
});

test('the agent flags an exam that lost its integration situation', () => {
  const analysis = analyzeDocumentLocally(`${EXAM.split('الجزء الثاني')[0]}\nالمجموع: 12`, { examType: 'اختبار' });
  assert.ok(analysis.suggestions.some(item => item.message.includes('وضعية إدماجية')));
});

test('a deux-devoir is read as a فرض with two exercises and no integration', () => {
  const analysis = analyzeDocumentLocally(DEVOIR);
  assert.equal(analysis.examType, 'فرض');
  assert.equal(analysis.level, '3am');
  assert.equal(analysis.exercises.length, 2);
  assert.equal(analysis.integrationDetected, false);
  assert.equal(analysis.pointsSum, 20);
});

test('the reader strips the total line before parsing questions', () => {
  const prepared = prepareAgentSource(EXAM);
  assert.ok(!/المجموع/.test(prepared));
  const exercises = parseAgentExercises(EXAM);
  const lastQuestion = exercises[exercises.length - 1].questions.at(-1);
  assert.ok(lastQuestion && !/المجموع/.test(lastQuestion.text));
});

test('level detection understands Arabic ordinals and level codes', () => {
  assert.equal(detectAgentLevel('السنة الأولى متوسط'), '1am');
  assert.equal(detectAgentLevel('مذكرة 3AM'), '3am');
  assert.equal(detectAgentLevel('نص بلا مستوى'), '');
  assert.equal(detectAgentLevel('نص بلا مستوى', '2am'), '2am');
});

test('local analysis matches the platform curriculum without any AI provider', () => {
  const analysis = analyzeDocumentLocally(EXAM, { level: '4am' });
  assert.ok(analysis.matches.length > 0);
  assert.equal(analysis.matches[0].midan, 'الإنسان والصحة');
  assert.match(analysis.matches[0].mawrid, /تحويل الأغذية/);
});

test('an unnumbered text yields no invented exercises', () => {
  const analysis = analyzeDocumentLocally('نص عادي عن المنهاج دون تمارين مرقمة ولا نقاط.');
  assert.equal(analysis.exercises.length, 0);
  assert.ok(analysis.warnings.length > 0);
});

test('the local PDF reader extracts Arabic text from a real official PDF', () => {
  const file = path.resolve(process.cwd(), 'public/assets/aistudio/_______3_3af5b876.pdf');
  const result = readDocument({ buffer: fs.readFileSync(file), name: 'progression.pdf' });
  assert.equal(result.format, 'pdf');
  assert.ok(result.chars > 500, `expected extracted text, got ${result.chars} chars`);
  assert.ok(!result.needsVision);
  assert.match(result.text, /السنة الثالثة متوسط/);
  assert.match(result.text, /الإنسان والمحيط/);
  assert.match(result.text, /ظاهرة طبيعية/);
  assert.ok(result.quality.score > 50);
});

test('an image is declared as needing vision instead of inventing text', () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea735c8b80000000049454e44ae426082', 'hex');
  const result = readDocument({ buffer: png, name: 'scan.png', mime: 'image/png' });
  assert.equal(result.format, 'image');
  assert.equal(result.needsVision, true);
  assert.equal(result.text, '');
  assert.ok(result.notes.some(note => note.includes('OCR')));
});

test('the local correction source maps the agent reading into the memo JSON without any provider', async () => {
  const { buildLocalCorrectionSource } = await import('../src/services/correctionMemoLocal');
  const source = buildLocalCorrectionSource(EXAM, 'اختبار', 'اختبار.docx');
  assert.ok(source);
  assert.equal(source!.source, 'local');
  assert.equal(source!.meta.level, 'السنة الرابعة متوسط');
  assert.equal(source!.exercises.length, 3);
  assert.equal(source!.totalPoints, 20);
  assert.equal(source!.exercises.filter(exercise => exercise.kind === 'integration').length, 1);
  assert.equal(source!.meta.mawrid.includes('تحويل الأغذية'), true);
});

test('the local correction source returns null when no numbered exercises are read', async () => {
  const { buildLocalCorrectionSource } = await import('../src/services/correctionMemoLocal');
  assert.equal(buildLocalCorrectionSource('نص بلا تمارين مرقمة ولا نقاط.', 'فرض', 'ملف.txt'), null);
});

test('the agent reading feeds the correction template without a provider', async () => {
  const { correctionMappingFromAgentAnalysis } = await import('../src/services/correctionMemoImport');
  const analysis = analyzeDocumentLocally(EXAM, { fileName: 'اختبار.docx' });
  const mapping = correctionMappingFromAgentAnalysis(analysis, 'اختبار.docx');
  assert.ok(mapping);
  assert.equal(mapping!.meta?.level, 'السنة الرابعة متوسط');
  assert.equal(mapping!.meta?.midan, 'الإنسان والصحة');
  assert.equal(mapping!.exercises.length, 3);
  assert.equal(mapping!.exercises.filter(exercise => exercise.kind === 'integration').length, 1);
  assert.equal(mapping!.totalPoints, 20);
  assert.equal(mapping!.exercises[0].questions.length, 3);
  assert.equal(mapping!.exercises[0].questions[0].points, 2);
});
