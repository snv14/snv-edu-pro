import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssignment,
  createStudent,
  createSubmission,
  emptyTeacherAssistantData,
  type TeacherAssistantData,
} from '../src/services/teacherAssistantStore';
import {
  TeacherAssistantError,
  buildRubric,
  decideProposal,
  finalizeGrade,
  getReviewStatus,
  getUserRole,
  proposeGrade,
  searchStudent,
  sendNotification,
} from '../src/services/teacherAssistantTools';
import { runTeacherCommand } from '../src/services/teacherAssistantEngine';

const teacherId = 'teacher-1';

const setup = () => {
  let data: TeacherAssistantData = {
    ...emptyTeacherAssistantData(),
    teachers: [
      {
        userId: teacherId,
        name: 'الأستاذ بغداد',
        email: 'teacher@example.com',
        role: 'teacher',
        registeredAt: new Date().toISOString(),
      },
    ],
  };
  const student = createStudent({ fullName: 'سليم بن عمر', classId: '3م1', level: '3am', registrationNumber: '1001' });
  const otherStudent = createStudent({ fullName: 'سليمة مراد', classId: '3م2', level: '3am' });
  const assignment = createAssignment({
    title: 'الفرض المحروس الأول',
    level: '3am',
    classId: '3م1',
    questions: [
      { text: 'ما هي الزلازل؟', points: 4, expectedKeywords: ['هزة أرضية', 'اهتزاز القشرة'] },
      { text: 'اذكر آثار الزلازل', points: 6, expectedKeywords: ['تشقق', 'انهيار'] },
    ],
  });
  const submission = createSubmission({
    assignmentId: assignment.id,
    studentId: student.id,
    answerText: 'الزلزال هزة أرضية تسبب تشقق المباني.',
  });
  data = {
    ...data,
    students: [student, otherStudent],
    assignments: [assignment],
    submissions: [submission],
  };
  return { data, student, otherStudent, assignment, submission };
};

test('the role tool verifies the teacher and refuses an unknown actor', () => {
  const { data } = setup();
  const role = getUserRole(data, teacherId);
  assert.equal(role.value.role, 'teacher');
  assert.equal(role.value.verified, true);
  assert.throws(() => getUserRole(data, 'intruder'), (error: unknown) =>
    error instanceof TeacherAssistantError && error.code === 'AUTH_REQUIRED');
});

test('student search matches names and registration numbers without inventing records', () => {
  const { data } = setup();
  const ambiguous = searchStudent(data, { query: 'سليم' }, teacherId);
  assert.equal(ambiguous.value.length, 2);
  const byClass = searchStudent(data, { query: 'سليم', classId: '3م2' }, teacherId);
  assert.equal(byClass.value.length, 1);
  assert.equal(byClass.value[0].fullName, 'سليمة مراد');
  const byRegistration = searchStudent(data, { query: '1001' }, teacherId);
  assert.equal(byRegistration.value[0].fullName, 'سليم بن عمر');
  const missing = searchStudent(data, { query: 'طالب وهمي' }, teacherId);
  assert.equal(missing.value.length, 0);
  assert.match(missing.message, /لا يوجد طالب/);
});

test('the rubric is built from the teacher elements with the exact question points', () => {
  const { assignment } = setup();
  const rubric = buildRubric(assignment);
  assert.equal(rubric.approved, true);
  assert.equal(rubric.source, 'teacher');
  assert.equal(rubric.criteria.length, 4);
  const questionOne = rubric.criteria.filter(criterion => criterion.questionNumber === 1);
  assert.equal(questionOne.reduce((sum, criterion) => sum + criterion.points, 0), 4);
  assert.equal(rubric.questionsWithoutCriteria.length, 0);
});

test('an assignment without teacher elements gets an unapproved suggested rubric', () => {
  const assignment = createAssignment({
    title: 'فرض بلا سلّم',
    level: '4am',
    classId: '4م1',
    questions: [{ text: 'اشرح دور الأنزيمات في الهضم', points: 4 }],
  });
  const rubric = buildRubric(assignment);
  assert.equal(rubric.approved, false);
  assert.equal(rubric.source, 'suggested');
  assert.ok(rubric.criteria.length > 0);
});

test('the proposal scores only what the answer contains and keeps the rationale', () => {
  const { data, submission } = setup();
  const outcome = proposeGrade(data, { submissionId: submission.id }, teacherId);
  const proposal = outcome.value.proposal;
  assert.equal(proposal.status, 'pending');
  assert.equal(proposal.perQuestion[0].score, 2);
  assert.equal(proposal.perQuestion[1].score, 3);
  assert.equal(proposal.totalProposed, 5);
  assert.equal(proposal.totalMax, 10);
  assert.ok(proposal.perQuestion.every(entry => entry.rationale.length > 0));
  assert.deepEqual(proposal.perQuestion[0].missing, ['اهتزاز القشرة']);
  assert.match(outcome.message, /بانتظار مراجعتك/);
});

test('the proposal keeps the teacher rubric status and flags an unapproved one', () => {
  const assignment = createAssignment({
    title: 'اختبار بلا معايير',
    level: '4am',
    classId: '4م1',
    questions: [{ text: 'ما هي المناعة', points: 6 }],
  });
  const student = createStudent({ fullName: 'أمينة سالم', classId: '4م1', level: '4am' });
  const submission = createSubmission({ assignmentId: assignment.id, studentId: student.id, answerText: 'المناعة دفاع الجسم.' });
  const data: TeacherAssistantData = {
    ...emptyTeacherAssistantData(),
    teachers: [{ userId: teacherId, name: 'الأستاذ', email: '', role: 'teacher', registeredAt: new Date().toISOString() }],
    students: [student],
    assignments: [assignment],
    submissions: [submission],
  };
  const outcome = proposeGrade(data, { submissionId: submission.id }, teacherId);
  assert.equal(outcome.value.proposal.rubricStatus, 'unapproved');
  assert.match(outcome.message, /غير معتمد/);
});

test('every score needs a written rationale before it can be recorded', () => {
  const { data, submission } = setup();
  assert.throws(
    () =>
      proposeGrade(
        data,
        {
          submissionId: submission.id,
          perQuestionScores: [
            { questionNumber: 1, score: 4, maxPoints: 4, rationale: '', matched: [], missing: [] },
            { questionNumber: 2, score: 6, maxPoints: 6, rationale: 'إجابة كاملة.', matched: [], missing: [] },
          ],
        },
        teacherId,
      ),
    (error: unknown) => error instanceof TeacherAssistantError && error.code === 'RATIONALE_REQUIRED',
  );
});

test('finalizing needs the teacher approval and an explicit confirmation', () => {
  const { data, submission } = setup();
  const proposed = proposeGrade(data, { submissionId: submission.id }, teacherId);
  const proposal = proposed.value.proposal;

  assert.throws(
    () =>
      finalizeGrade(
        proposed.data,
        { submissionId: submission.id, approvedByTeacherId: teacherId, explicitApproval: false },
        teacherId,
      ),
    (error: unknown) => error instanceof TeacherAssistantError && error.code === 'FINALIZE_REQUIRES_CONFIRMATION',
  );

  assert.throws(
    () =>
      finalizeGrade(
        proposed.data,
        { submissionId: submission.id, approvedByTeacherId: teacherId, explicitApproval: true },
        teacherId,
      ),
    (error: unknown) => error instanceof TeacherAssistantError && error.code === 'NOT_APPROVED',
  );

  const approved = decideProposal(proposed.data, { proposalId: proposal.id, decision: 'approved' }, teacherId);
  assert.equal(approved.value.proposal.status, 'approved');

  const finalized = finalizeGrade(
    approved.data,
    { submissionId: submission.id, approvedByTeacherId: teacherId, explicitApproval: true },
    teacherId,
  );
  assert.equal(finalized.value.finalGrade.total, 5);
  assert.equal(finalized.value.finalGrade.totalMax, 10);
  assert.equal(finalized.data.submissions[0].status, 'graded');
  assert.ok(finalized.data.notifications.some(notification => notification.type === 'grade'));

  const status = getReviewStatus(finalized.data, { submissionId: submission.id }, teacherId);
  assert.equal(status.value.status, 'finalized');
});

test('a final grade cannot be recorded under another teacher identity', () => {
  const { data, submission } = setup();
  const proposed = proposeGrade(data, { submissionId: submission.id }, teacherId);
  const approved = decideProposal(proposed.data, { proposalId: proposed.value.proposal.id, decision: 'approved' }, teacherId);
  assert.throws(
    () =>
      finalizeGrade(
        approved.data,
        { submissionId: submission.id, approvedByTeacherId: 'someone-else', explicitApproval: true },
        teacherId,
      ),
    (error: unknown) => error instanceof TeacherAssistantError && error.code === 'FORBIDDEN',
  );
});

test('a rejected proposal never reaches finalization', () => {
  const { data, submission } = setup();
  const proposed = proposeGrade(data, { submissionId: submission.id }, teacherId);
  const rejected = decideProposal(proposed.data, { proposalId: proposed.value.proposal.id, decision: 'rejected' }, teacherId);
  assert.throws(
    () =>
      finalizeGrade(
        rejected.data,
        { submissionId: submission.id, approvedByTeacherId: teacherId, explicitApproval: true },
        teacherId,
      ),
    (error: unknown) => error instanceof TeacherAssistantError && error.code === 'NOT_APPROVED',
  );
});

test('notifications are stored only for existing platform accounts', () => {
  const { data } = setup();
  const sent = sendNotification(data, { recipientId: teacherId, message: 'اقتراح تصحيح بانتظارك.' }, teacherId);
  assert.equal(sent.data.notifications.length, 1);
  assert.equal(sent.data.notifications[0].recipientId, teacherId);
  assert.throws(
    () => sendNotification(data, { recipientId: 'ghost', message: 'تنبيه' }, teacherId),
    (error: unknown) => error instanceof TeacherAssistantError && error.code === 'NOT_FOUND',
  );
});

test('the assistant runs the full correction workflow from Arabic commands', () => {
  const { data, assignment, student } = setup();
  const proposed = runTeacherCommand({
    text: 'صحح سليم بن عمر في الفرض المحروس الأول',
    data,
    actorId: teacherId,
  });
  assert.equal(proposed.kind, 'proposal');
  assert.ok(proposed.proposalId);
  assert.match(proposed.reply, new RegExp(assignment.title));

  const status = runTeacherCommand({
    text: 'الحالة',
    data: proposed.data,
    actorId: teacherId,
    activeProposalId: proposed.proposalId,
  });
  assert.equal(status.kind, 'status');
  assert.match(status.reply, /بانتظار قرارك/);

  const approved = runTeacherCommand({
    text: 'اعتمد',
    data: status.data,
    actorId: teacherId,
    activeProposalId: proposed.proposalId,
  });
  assert.match(approved.reply, /اعتُمد الاقتراح/);

  const blocked = runTeacherCommand({
    text: 'ثبّت',
    data: approved.data,
    actorId: teacherId,
    activeProposalId: proposed.proposalId,
    activeSubmissionId: proposed.submissionId,
  });
  assert.match(blocked.reply, /تأكيدك الصريح/);

  const finalized = runTeacherCommand({
    text: 'ثبّت',
    data: blocked.data,
    actorId: teacherId,
    activeProposalId: proposed.proposalId,
    activeSubmissionId: proposed.submissionId,
    confirmFinalize: true,
  });
  assert.equal(finalized.kind, 'final');
  assert.equal(finalized.data.finalGrades[0].studentId, student.id);
});

test('the assistant reports missing records instead of inventing them', () => {
  const { data } = setup();
  const result = runTeacherCommand({ text: 'صحح طالب وهمي في فرض خيالي', data, actorId: teacherId });
  assert.match(result.reply, /لا يوجد طالب/);
  assert.equal(result.data.proposals.length, 0);
});
