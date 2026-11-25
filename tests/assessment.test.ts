import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addExamExercise,
  createAssessmentExam,
  distributePoints,
  duplicateAssessmentExam,
  examCounts,
  examMaxTotal,
  flattenRefs,
  interpretAssessmentCommand,
  makeStudentResult,
  partOneExercises,
  rebalanceExamPoints,
  restoreExamVersion,
  setExamType,
  snapshotExam,
  studentScore20,
  updateStudentScore,
} from '../src/services/assessmentModel';
import {
  applyAnalysisToMemo,
  buildRemediationPlan,
  computeExamStats,
  detectRecurringErrors,
} from '../src/services/assessmentAnalysis';

const buildExam = () => createAssessmentExam({
  examType: 'اختبار',
  level: '3am',
  term: 'الفصل الأول',
  duration: 'ساعة',
  config: {
    level: '3am',
    schoolName: 'متوسطة النور',
    directorate: 'مديرية تربية الجزائر',
    teacherName: 'الأستاذ بغداد',
    schoolYear: '2025/2026',
    memoNumber: '',
    principalName: '',
    signDate: '2026-11-25',
    teacherStamp: null,
  },
});

test('إنشاء اختبار: تمرينان 6+6 ووضعية 8 والمجموع 20 والرأس يُعبأ من الإعدادات', () => {
  const exam = buildExam();
  assert.equal(partOneExercises(exam).length, 2);
  assert.deepEqual(partOneExercises(exam).map(exercise => exercise.declaredPoints), ['6', '6']);
  assert.equal(exam.memo.integration.declaredPoints, '8');
  assert.equal(examMaxTotal(exam), 20);
  assert.equal(exam.memo.schoolName, 'متوسطة النور');
  assert.equal(exam.memo.teacherName, 'الأستاذ بغداد');
  assert.equal(exam.level, '3am');
  assert.equal(exam.status, 'مسودة');
});

test('إضافة التمرين الثالث تحافظ على 20 نقطة وتحدّث المذكرة والموارد', () => {
  const exam = buildExam();
  const next = addExamExercise(exam, {
    label: 'التمرين الثالث',
    maqta: exam.memo.maqta,
    knowledge: 'استغلال وثيقة علمية',
    questions: [
      { text: 'حلل الوثيقة.', expected: 'ملاحظة ثم تفسير.', points: '' },
      { text: 'استنتج.', expected: 'الاستنتاج المنتظر.', points: '' },
    ],
  });

  assert.equal(partOneExercises(next).length, 3);
  assert.equal(next.memo.exercises.length, exam.memo.exercises.length + 1);
  assert.equal(next.memo.resources.length, exam.memo.resources.length + 1);
  assert.equal(examMaxTotal(next), 20);
  assert.equal(examCounts(next).exercises, 3);
  // الأصل لم يتغيّر.
  assert.equal(partOneExercises(exam).length, 2);
  // النقاط موزعة على أسئلة التمرين الجديد دون فراغ.
  assert.ok(next.memo.exercises.at(-1)?.questions.every(question => Number(question.points) > 0));
});

test('توزيع النقاط دقيق ويحافظ على المجموع في الحالات الصعبة', () => {
  assert.deepEqual(distributePoints(6, [1, 1, 1], 0.25), [2, 2, 2]);
  const shares = distributePoints(8, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0.25);
  assert.equal(Math.round(shares.reduce((sum, value) => sum + value, 0) * 100) / 100, 8);
  assert.ok(shares.every(value => value > 0));
});

test('إعادة التوزيع على 20 لاختبار بثلاثة تمارين + وضعية', () => {
  const exam = buildExam();
  const three = addExamExercise(exam, {
    label: 'التمرين الثالث',
    questions: [{ text: 'سؤال أول.', expected: '', points: '' }],
  });
  const redistributed = rebalanceExamPoints(three);
  assert.equal(examMaxTotal(redistributed), 20);
  assert.equal(redistributed.memo.part1DeclaredPoints, '12');
  assert.equal(redistributed.memo.integration.declaredPoints, '8');
  assert.equal(partOneExercises(redistributed).length, 3);
});

test('تحويل اختبار إلى فرض يصفّر الوضعية الإدماجية ويُبقي المجموع 20', () => {
  const exam = buildExam();
  const converted = rebalanceExamPoints(setExamType(exam, 'فرض'));
  assert.equal(converted.examType, 'فرض');
  assert.equal(converted.memo.integration.declaredPoints, '');
  assert.equal(converted.memo.integration.criteria.flatMap(criterion => criterion.indicators).reduce((sum, indicator) => sum + Number(indicator.points || 0), 0), 0);
  assert.equal(examMaxTotal(converted), 20);
});

test('تعديل السؤال يحدّث المذكرة والتنقيط لأن المصدر واحد', () => {
  const exam = buildExam();
  const first = partOneExercises(exam)[0];
  const question = first.questions[0];
  const edited = {
    ...exam,
    memo: {
      ...exam.memo,
      exercises: exam.memo.exercises.map(exercise => exercise.id === first.id
        ? {
            ...exercise,
            questions: exercise.questions.map(item => item.id === question.id
              ? { ...item, text: 'فسّر امتصاص الماء عند النبات الأخضر.', expected: 'الجواب النموذجي.' }
              : item),
          }
        : exercise),
    },
  };
  const ref = flattenRefs(edited).find(item => item.id === question.id);
  assert.equal(ref?.text, 'فسّر امتصاص الماء عند النبات الأخضر.');
});

test('النسخ: حفظ واسترجاع يبقيان مترابطين، والنسخة الجديدة مستقلة', () => {
  const exam = buildExam();
  const changed = { ...exam, title: 'نسخة معدلة', status: 'جاهز' as const };
  const withVersion = snapshotExam(changed, 'قبل التعديل');
  assert.equal(withVersion.versions.length, 1);
  assert.equal(withVersion.versions[0].total, 20);

  const restored = restoreExamVersion(withVersion, withVersion.versions[0].id);
  assert.equal(restored.title, 'نسخة معدلة');
  assert.equal(restored.status, 'مسودة');
  assert.equal(restored.versions.length, 2); // نسخة «قبل الاسترجاع» أضيفت

  const copy = duplicateAssessmentExam(exam, 'نسخة');
  assert.notEqual(copy.id, exam.id);
  assert.notEqual(copy.memo.exercises[0].id, exam.memo.exercises[0].id);
  assert.equal(copy.results.length, 0);
  assert.ok(copy.title.includes('نسخة'));
});

test('فهم أوامر الأستاذ داخل التقويم', () => {
  assert.equal(interpretAssessmentCommand('أضف تمرينًا ثالثًا').intent, 'add-exercise');
  assert.equal(interpretAssessmentCommand('أعد توزيع النقاط على 20').intent, 'redistribute');
  assert.equal(interpretAssessmentCommand('أعد توليد الإجابات').intent, 'answers');
  assert.equal(interpretAssessmentCommand('حلّل النتائج').intent, 'analyze');
  assert.equal(interpretAssessmentCommand('أضف سؤالًا إلى التمرين الأول').intent, 'add-question');
  assert.equal(interpretAssessmentCommand('صباح الخير').intent, 'unknown');
});

test('تحليل النتائج: معدل، نجاح، أداء الأسئلة، أخطاء متكررة، خطة معالجة', () => {
  const exam = buildExam();
  const refs = flattenRefs(exam).filter(ref => ref.max > 0);
  const hardRef = refs[0];
  let withResults = exam;

  ['سليم بن عمر', 'مريم مراد', 'أمين قاسم'].forEach((name, index) => {
    const student = makeStudentResult(name);
    withResults = { ...withResults, results: [...withResults.results, student] };
    refs.forEach(ref => {
      const max = ref.max;
      const value = ref.id === hardRef.id ? 0 : (index === 2 && ref.kind === 'integration' ? max / 2 : max);
      withResults = updateStudentScore(withResults, student.id, ref.id, value);
    });
  });

  const stats = computeExamStats(withResults);
  assert.equal(stats.hasData, true);
  assert.equal(stats.graded, 3);
  assert.equal(stats.passRate, 100);
  assert.ok(stats.average20 < 20 && stats.average20 > 10);

  const hardQuestion = stats.perQuestion.find(item => item.ref.id === hardRef.id);
  assert.equal(hardQuestion?.struggling, 3);
  assert.equal(hardQuestion?.achievement, 0);

  const errors = detectRecurringErrors(withResults, stats);
  assert.ok(errors.length >= 1);
  assert.equal(errors[0].questionId, hardRef.id);
  assert.ok(errors[0].possibleCause.includes('احتمال'));

  const plan = buildRemediationPlan(withResults, errors);
  assert.ok(plan.length >= 1);
  assert.ok(plan.every(row => row.activity.length > 0 && row.support.length > 0));

  const transferred = applyAnalysisToMemo(withResults, stats, errors, plan);
  assert.equal(transferred.status, 'تم التحليل');
  assert.equal(transferred.memo.results.learners, '3');
  assert.equal(transferred.memo.errors.length, errors.length);
  assert.equal(transferred.memo.remediation.length, plan.length);
});

test('بلا نتائج: لا تحليل ولا أخطاء مخترعة', () => {
  const exam = buildExam();
  const stats = computeExamStats(exam);
  assert.equal(stats.hasData, false);
  assert.equal(detectRecurringErrors(exam, stats).length, 0);
  assert.equal(buildRemediationPlan(exam, []).length, 0);
  assert.equal(studentScore20(exam, makeStudentResult('تلميذ')), 0);
});
