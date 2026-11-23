import {
  type AssignmentRecord,
  type FinalGradeRecord,
  type GradeProposal,
  type ProposedScore,
  type SubmissionRecord,
  type StudentRecord,
  type TeacherAccount,
  type TeacherAssistantData,
  type TeacherRole,
  type NotificationType,
  findAssignmentById,
  findStudentById,
  latestSubmission,
  levelLabel,
  newRecordId,
  withAudit,
} from './teacherAssistantStore';

/**
 * أدوات المساعد التربوي: دوال نقية تعمل على سجلّات المنصة فقط.
 * لا مزوّد ذكاء اصطناعي، ولا توليد لأي معلومة غير موجودة: ما لا يوجد في
 * السجل يُعلن صراحة أنه غير متوفر، ولا تُثبَّت أي درجة دون اعتماد صريح.
 */

const ARABIC_MARKS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;

/** توحيد عربي بسيط للمطابقة: شكل الحروف والهمزات والتشكيل والمسافات. */
export function normalizeArabicText(value: string): string {
  return String(value || '')
    .replace(ARABIC_MARKS, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export type TeacherAssistantErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID'
  | 'RATIONALE_REQUIRED'
  | 'FINALIZE_REQUIRES_CONFIRMATION'
  | 'NOT_APPROVED';

export class TeacherAssistantError extends Error {
  code: TeacherAssistantErrorCode;

  constructor(code: TeacherAssistantErrorCode, message: string) {
    super(message);
    this.name = 'TeacherAssistantError';
    this.code = code;
  }
}

export interface ToolOutcome<T> {
  data: TeacherAssistantData;
  message: string;
  value: T;
}

const roundScore = (value: number): number => Math.round(value * 100) / 100;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const requireTeacher = (data: TeacherAssistantData, actorId: string): TeacherAccount => {
  const teacher = data.teachers.find(account => account.userId === actorId);
  if (!teacher) {
    throw new TeacherAssistantError(
      'AUTH_REQUIRED',
      'لا أستطيع تنفيذ عملية على سجلات الطلبة قبل التحقق من دورك. سجّل الدخول بحساب الأستاذ ثم أعد المحاولة.',
    );
  }
  return teacher;
};

const requireTeacherRole = (data: TeacherAssistantData, actorId: string): TeacherAccount => {
  const teacher = requireTeacher(data, actorId);
  if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
    throw new TeacherAssistantError('FORBIDDEN', 'دورك الحالي لا يسمح بتعديل سجلات الطلبة أو الدرجات.');
  }
  return teacher;
};

/* ————— 1) الدور والصلاحية ————— */

export interface RoleValue {
  userId: string;
  name: string;
  role: TeacherRole;
  verified: boolean;
}

export function getUserRole(data: TeacherAssistantData, actorId: string): ToolOutcome<RoleValue> {
  const teacher = data.teachers.find(account => account.userId === actorId);
  if (!teacher) {
    throw new TeacherAssistantError(
      'AUTH_REQUIRED',
      'لم أتعرّف عليك بعد. يلزم تسجيل الدخول بحساب الأستاذ قبل أي عملية على سجلات الطلبة.',
    );
  }
  return {
    data,
    value: { userId: teacher.userId, name: teacher.name, role: teacher.role, verified: true },
    message: `أنت الأستاذ المخوّل: ${teacher.name || 'بلا اسم'} — الدور: ${teacher.role === 'admin' ? 'مسؤول' : 'أستاذ'}.`,
  };
}

export function registerTeacher(
  data: TeacherAssistantData,
  input: { userId: string; name?: string; email?: string; role?: TeacherRole },
): ToolOutcome<TeacherAccount> {
  const userId = String(input.userId || '').trim();
  if (!userId) {
    throw new TeacherAssistantError('AUTH_REQUIRED', 'لا يمكن تسجيل أستاذ بمعرّف فارغ.');
  }
  const existing = data.teachers.find(account => account.userId === userId);
  if (existing) {
    return { data, value: existing, message: `حساب الأستاذ مسجّل مسبقًا: ${existing.name || existing.userId}.` };
  }
  const account: TeacherAccount = {
    userId,
    name: (input.name || '').trim().slice(0, 120),
    email: (input.email || '').trim().slice(0, 160),
    role: input.role === 'admin' ? 'admin' : 'teacher',
    registeredAt: new Date().toISOString(),
  };
  const next = withAudit(
    { ...data, teachers: [...data.teachers, account] },
    userId,
    'تسجيل الأستاذ',
    account.name || userId,
  );
  return { data: next, value: account, message: `تم تسجيل الأستاذ ${account.name || account.email || userId}.` };
}

/* ————— 2) البحث عن طالب ————— */

export function searchStudent(
  data: TeacherAssistantData,
  input: { query?: string; classId?: string } = {},
  actorId = '',
): ToolOutcome<StudentRecord[]> {
  requireTeacher(data, actorId);
  const query = normalizeArabicText(input.query || '');
  const classId = normalizeArabicText(input.classId || '');
  const matches = data.students
    .filter(student => (classId ? normalizeArabicText(student.classId).includes(classId) : true))
    .filter(student => {
      if (!query) return true;
      const name = normalizeArabicText(student.fullName);
      const registration = normalizeArabicText(student.registrationNumber);
      return name.includes(query) || (registration && registration.includes(query));
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));

  return {
    data,
    value: matches,
    message: query
      ? matches.length
        ? `وجدت ${matches.length} طالبًا مطابقًا لـ«${input.query}».`
        : `لا يوجد طالب مطابق لـ«${input.query}» في سجلات المنصة.`
      : `في سجلاتك ${matches.length} طالبًا.`,
  };
}

/* ————— 3) الفرض ————— */

export function resolveAssignment(data: TeacherAssistantData, reference: string): AssignmentRecord {
  const raw = String(reference || '').trim();
  if (!raw) throw new TeacherAssistantError('INVALID', 'حدّد الفرض المطلوب (عنوانه أو معرّفه).');
  const direct = findAssignmentById(data, raw);
  if (direct) return direct;
  const normalized = normalizeArabicText(raw);
  const matches = data.assignments.filter(assignment =>
    normalizeArabicText(`${assignment.title} ${assignment.classId} ${assignment.level}`).includes(normalized),
  );
  if (!matches.length) {
    throw new TeacherAssistantError('NOT_FOUND', `لا يوجد فرض مطابق لـ«${raw}» في سجلات المنصة.`);
  }
  if (matches.length > 1) {
    const titles = matches.map(assignment => `• ${assignment.title}`).join('\n');
    throw new TeacherAssistantError('INVALID', `وجدت أكثر من فرض مطابق:\n${titles}\nحدّد العنوان بدقة أكبر.`);
  }
  return matches[0];
}

export function getAssignment(
  data: TeacherAssistantData,
  input: { assignmentId?: string; reference?: string },
  actorId = '',
): ToolOutcome<AssignmentRecord> {
  requireTeacher(data, actorId);
  const assignment = resolveAssignment(data, input.assignmentId || input.reference || '');
  return { data, value: assignment, message: `الفرض: ${assignment.title} — ${assignment.questions.length} سؤالًا.` };
}

/* ————— 4) سلّم التصحيح ————— */

export interface RubricCriterion {
  id: string;
  questionNumber: number;
  label: string;
  keywords: string[];
  points: number;
}

export interface RubricView {
  assignmentId: string;
  approved: boolean;
  source: 'teacher' | 'suggested';
  criteria: RubricCriterion[];
  questionsWithoutCriteria: number[];
}

const STOPWORDS = new Set(
  'ما هي هو هل ثم من في على عن الى إلى مع او أو التي الذي الذين هذا هذه ذلك تلك بين كل بعد قبل عند كيف لماذا اذكر اشرح عرف بين حلل استنتج قارن اعط مثالا'.split(
    ' ',
  ),
);

/** سلّم مبني من عناصر الإجابة التي كتبها الأستاذ؛ وإن غابت، سلّم مقترح غير معتمد. */
export function buildRubric(assignment: AssignmentRecord): RubricView {
  const authored = assignment.questions.some(question => question.expectedKeywords.length > 0);
  const criteria: RubricCriterion[] = [];
  const questionsWithoutCriteria: number[] = [];

  assignment.questions.forEach(question => {
    const keywords = question.expectedKeywords.map(item => item.trim()).filter(Boolean);
    if (keywords.length) {
      const share = roundScore(Math.max(0, question.points) / keywords.length);
      keywords.forEach((keyword, index) => {
        // آخر معيار يحمل الباقي حتى يكون مجموع المعايير مساويًا لنقطة السؤال.
        const points = index === keywords.length - 1
          ? roundScore(Math.max(0, question.points) - share * (keywords.length - 1))
          : share;
        criteria.push({
          id: `${question.id}-c${index}`,
          questionNumber: question.number,
          label: keyword,
          keywords: [keyword],
          points,
        });
      });
      return;
    }

    if (authored) {
      questionsWithoutCriteria.push(question.number);
      return;
    }

    const tokens = normalizeArabicText(question.text)
      .split(' ')
      .filter(token => token.length >= 4 && !STOPWORDS.has(token))
      .slice(0, 3);
    if (!tokens.length) {
      questionsWithoutCriteria.push(question.number);
      return;
    }
    const share = roundScore(Math.max(0, question.points) / tokens.length);
    tokens.forEach((token, index) => {
      criteria.push({
        id: `${question.id}-s${index}`,
        questionNumber: question.number,
        label: token,
        keywords: [token],
        points: index === tokens.length - 1
          ? roundScore(Math.max(0, question.points) - share * (tokens.length - 1))
          : share,
      });
    });
  });

  return {
    assignmentId: assignment.id,
    approved: authored,
    source: authored ? 'teacher' : 'suggested',
    criteria,
    questionsWithoutCriteria,
  };
}

export function getRubric(
  data: TeacherAssistantData,
  input: { assignmentId?: string; reference?: string },
  actorId = '',
): ToolOutcome<{ assignment: AssignmentRecord; rubric: RubricView }> {
  requireTeacher(data, actorId);
  const assignment = resolveAssignment(data, input.assignmentId || input.reference || '');
  const rubric = buildRubric(assignment);
  const message = rubric.criteria.length
    ? rubric.approved
      ? `سلّم تصحيح معتمد منك: ${rubric.criteria.length} معيارًا.`
      : `لا يوجد سلّم معتمد لهذا الفرض. أقترح سلّمًا مبدئيًا (${rubric.criteria.length} معيارًا) — غير معتمد بعد، بانتظار موافقتك.`
    : 'هذا الفرض بلا معايير ولا أسئلة كافية لبناء سلّم تصحيح.';
  return { data, value: { assignment, rubric }, message };
}

/* ————— 5) إجابة الطالب ————— */

export interface SubmissionValue {
  submission: SubmissionRecord;
  student: StudentRecord;
  assignment: AssignmentRecord;
}

export function getSubmission(
  data: TeacherAssistantData,
  input: { submissionId?: string; studentId?: string; assignmentId?: string },
  actorId = '',
): ToolOutcome<SubmissionValue> {
  requireTeacher(data, actorId);
  let submission: SubmissionRecord | null = null;
  if (input.submissionId) {
    submission = data.submissions.find(item => item.id === input.submissionId) || null;
  } else {
    submission = latestSubmission(data, { studentId: input.studentId, assignmentId: input.assignmentId });
  }
  if (!submission) {
    throw new TeacherAssistantError('NOT_FOUND', 'لا توجد إجابة مسجّلة بهذه المواصفات في المنصة.');
  }
  const student = findStudentById(data, submission.studentId);
  const assignment = findAssignmentById(data, submission.assignmentId);
  if (!student || !assignment) {
    throw new TeacherAssistantError('NOT_FOUND', 'الإجابة موجودة لكن سجل الطالب أو الفرض المرتبط بها مفقود.');
  }
  return {
    data,
    value: { submission, student, assignment },
    message: `إجابة ${student.fullName} في «${assignment.title}» — ${submission.answerText.length} حرفًا.`,
  };
}

/* ————— التصحيح المحلي: مطابقة الإجابة بمعايير السلّم ————— */

export function scoreSubmission(
  assignment: AssignmentRecord,
  rubric: RubricView,
  answerText: string,
): ProposedScore[] {
  const haystack = normalizeArabicText(answerText);

  return assignment.questions.map(question => {
    const criteria = rubric.criteria.filter(criterion => criterion.questionNumber === question.number);
    const maxPoints = question.points;
    if (!criteria.length) {
      return {
        questionNumber: question.number,
        score: 0,
        maxPoints,
        rationale: 'لا معايير معتمدة لهذا السؤال؛ لم تُحتسب أي نقطة بدل التخمين. اعتمد عناصر الإجابة أولًا.',
        matched: [],
        missing: [],
      };
    }

    const matched = criteria.filter(criterion =>
      criterion.keywords.some(keyword => {
        const normalized = normalizeArabicText(keyword);
        return normalized.length >= 2 && haystack.includes(normalized);
      }),
    );
    const missing = criteria.filter(criterion => !matched.includes(criterion));
    const score = roundScore(clamp(matched.reduce((sum, criterion) => sum + criterion.points, 0), 0, maxPoints));

    const matchedLabels = matched.map(criterion => criterion.label);
    const missingLabels = missing.map(criterion => criterion.label);
    let rationale: string;
    if (!matched.length) {
      rationale = `لم يُعثر في الإجابة على أي عنصر مقبول${missingLabels.length ? ` (${missingLabels.join('، ')})` : ''}.`;
    } else if (!missing.length) {
      rationale = `استوفت الإجابة كل العناصر: ${matchedLabels.join('، ')}.`;
    } else {
      rationale = `تحقّق: ${matchedLabels.join('، ')} · غاب: ${missingLabels.join('، ')}.`;
    }

    return {
      questionNumber: question.number,
      score,
      maxPoints,
      rationale,
      matched: matchedLabels,
      missing: missingLabels,
    };
  });
}

function validateScores(
  assignment: AssignmentRecord,
  scores: ProposedScore[],
): ProposedScore[] {
  if (!Array.isArray(scores) || !scores.length) {
    throw new TeacherAssistantError('INVALID', 'لا توجد درجات صالحة لتسجيل الاقتراح.');
  }
  return scores.map(entry => {
    const question = assignment.questions.find(item => item.number === entry.questionNumber);
    if (!question) {
      throw new TeacherAssistantError('INVALID', `السؤال رقم ${entry.questionNumber} غير موجود في هذا الفرض.`);
    }
    if (!Number.isFinite(entry.score) || entry.score < 0 || entry.score > question.points) {
      throw new TeacherAssistantError(
        'INVALID',
        `درجة السؤال ${entry.questionNumber} يجب أن تكون بين 0 و${question.points}.`,
      );
    }
    const rationale = String(entry.rationale || '').trim();
    if (!rationale) {
      throw new TeacherAssistantError(
        'RATIONALE_REQUIRED',
        `السؤال ${entry.questionNumber}: كل درجة تحتاج تعليلًا مكتوبًا قبل تسجيلها.`,
      );
    }
    return {
      questionNumber: entry.questionNumber,
      score: roundScore(entry.score),
      maxPoints: question.points,
      rationale: rationale.slice(0, 600),
      matched: Array.isArray(entry.matched) ? entry.matched.slice(0, 20) : [],
      missing: Array.isArray(entry.missing) ? entry.missing.slice(0, 20) : [],
    };
  });
}

const totalMaxOf = (assignment: AssignmentRecord): number =>
  assignment.totalPoints || assignment.questions.reduce((sum, question) => sum + question.points, 0);

/* ————— 6) اقتراح التصحيح ————— */

export interface ProposalInput {
  submissionId: string;
  perQuestionScores?: ProposedScore[];
  rubricUsed?: string;
}

export function proposeGrade(
  data: TeacherAssistantData,
  input: ProposalInput,
  actorId: string,
): ToolOutcome<{ proposal: GradeProposal; submission: SubmissionValue['submission']; student: StudentRecord; assignment: AssignmentRecord }> {
  requireTeacherRole(data, actorId);
  const resolved = getSubmission(data, { submissionId: input.submissionId }, actorId);
  const { submission, student, assignment } = resolved.value;

  const rubric = buildRubric(assignment);
  const scores = input.perQuestionScores
    ? validateScores(assignment, input.perQuestionScores)
    : scoreSubmission(assignment, rubric, submission.answerText);

  const totalProposed = roundScore(scores.reduce((sum, entry) => sum + entry.score, 0));
  const proposal: GradeProposal = {
    id: newRecordId('prop'),
    submissionId: submission.id,
    studentId: student.id,
    assignmentId: assignment.id,
    perQuestion: scores,
    totalProposed,
    totalMax: totalMaxOf(assignment),
    rubricStatus: rubric.approved ? 'approved' : 'unapproved',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  let next: TeacherAssistantData = {
    ...data,
    proposals: [proposal, ...data.proposals],
  };
  next = withAudit(
    next,
    actorId,
    input.perQuestionScores ? 'اقتراح تصحيح معدّل' : 'اقتراح تصحيح',
    `${student.fullName} — ${assignment.title}: ${totalProposed}/${proposal.totalMax}`,
  );

  const note = rubric.approved
    ? ''
    : ' تنبيه: السلّم المستعمل مقترح غير معتمد بعد، يلزم أن تعتمده قبل تثبيت أي درجة.';
  return {
    data: next,
    value: { proposal, submission, student, assignment },
    message: `اقتراح تصحيح لـ${student.fullName} في «${assignment.title}»: ${totalProposed}/${proposal.totalMax} — بانتظار مراجعتك.${note}`,
  };
}

/* ————— 7) حالة المراجعة ————— */

export function getReviewStatus(
  data: TeacherAssistantData,
  input: { submissionId: string },
  actorId = '',
): ToolOutcome<{ status: 'none' | 'pending' | 'approved' | 'rejected' | 'finalized'; proposal: GradeProposal | null; finalGrade: FinalGradeRecord | null }> {
  requireTeacher(data, actorId);
  const proposal = [...data.proposals]
    .filter(item => item.submissionId === input.submissionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
  const finalGrade = data.finalGrades.find(item => item.submissionId === input.submissionId) || null;

  if (finalGrade) {
    return {
      data,
      value: { status: 'finalized', proposal, finalGrade },
      message: `الدرجة النهائية مثبّتة: ${finalGrade.total}/${finalGrade.totalMax}.`,
    };
  }
  if (!proposal) {
    return { data, value: { status: 'none', proposal: null, finalGrade: null }, message: 'لا يوجد اقتراح تصحيح لهذه الإجابة بعد.' };
  }
  const labels: Record<GradeProposal['status'], string> = {
    pending: 'بانتظار قرارك',
    approved: 'اعتمدتَه ولم تُثبَّت الدرجة النهائية بعد',
    rejected: 'مرفوض',
  };
  return {
    data,
    value: { status: proposal.status, proposal, finalGrade: null },
    message: `الاقتراح ${labels[proposal.status]} (${proposal.totalProposed}/${proposal.totalMax}).`,
  };
}

/* ————— قرار الأستاذ على الاقتراح ————— */

export function decideProposal(
  data: TeacherAssistantData,
  input: { proposalId: string; decision: 'approved' | 'rejected' },
  actorId: string,
): ToolOutcome<{ proposal: GradeProposal }> {
  const teacher = requireTeacherRole(data, actorId);
  const proposal = data.proposals.find(item => item.id === input.proposalId);
  if (!proposal) {
    throw new TeacherAssistantError('NOT_FOUND', 'الاقتراح المطلوب غير موجود.');
  }
  if (proposal.status !== 'pending') {
    throw new TeacherAssistantError('INVALID', 'هذا الاقتراح حُسم سابقًا؛ لا يمكن تغيير قراره.');
  }
  const updated: GradeProposal = {
    ...proposal,
    status: input.decision,
    decidedAt: new Date().toISOString(),
    decidedByTeacherId: teacher.userId,
  };
  let next: TeacherAssistantData = {
    ...data,
    proposals: data.proposals.map(item => (item.id === updated.id ? updated : item)),
  };
  next = withAudit(
    next,
    actorId,
    input.decision === 'approved' ? 'اعتماد اقتراح' : 'رفض اقتراح',
    `${updated.id} — ${updated.totalProposed}/${updated.totalMax}`,
  );
  return {
    data: next,
    value: { proposal: updated },
    message: input.decision === 'approved'
      ? 'اعتُمد الاقتراح. الخطوة التالية — إن أردت — تثبيت الدرجة النهائية بتأكيد صريح منك.'
      : 'رُفض الاقتراح، ولم تُثبَّت أي درجة.',
  };
}

export function adjustProposal(
  data: TeacherAssistantData,
  input: { proposalId: string; perQuestionScores: ProposedScore[] },
  actorId: string,
): ToolOutcome<{ proposal: GradeProposal }> {
  requireTeacherRole(data, actorId);
  const proposal = data.proposals.find(item => item.id === input.proposalId);
  if (!proposal) throw new TeacherAssistantError('NOT_FOUND', 'الاقتراح المطلوب غير موجود.');
  if (proposal.status !== 'pending') {
    throw new TeacherAssistantError('INVALID', 'لا يمكن تعديل اقتراح حُسم. أنشئ اقتراحًا جديدًا.');
  }
  const assignment = findAssignmentById(data, proposal.assignmentId);
  if (!assignment) throw new TeacherAssistantError('NOT_FOUND', 'الفرض المرتبط بالاقتراح غير موجود.');
  const scores = validateScores(assignment, input.perQuestionScores);
  const updated: GradeProposal = {
    ...proposal,
    perQuestion: scores,
    totalProposed: roundScore(scores.reduce((sum, entry) => sum + entry.score, 0)),
  };
  let next: TeacherAssistantData = {
    ...data,
    proposals: data.proposals.map(item => (item.id === updated.id ? updated : item)),
  };
  next = withAudit(next, actorId, 'تعديل اقتراح', `${updated.id} — ${updated.totalProposed}/${updated.totalMax}`);
  return {
    data: next,
    value: { proposal: updated },
    message: `حُدّث الاقتراح: ${updated.totalProposed}/${updated.totalMax}.`,
  };
}

/* ————— 8) التثبيت النهائي ————— */

export function finalizeGrade(
  data: TeacherAssistantData,
  input: {
    submissionId: string;
    approvedByTeacherId: string;
    finalScores?: ProposedScore[];
    explicitApproval: boolean;
  },
  actorId: string,
): ToolOutcome<{ finalGrade: FinalGradeRecord; student: StudentRecord; assignment: AssignmentRecord }> {
  const teacher = requireTeacherRole(data, actorId);
  if (input.approvedByTeacherId !== teacher.userId) {
    throw new TeacherAssistantError('FORBIDDEN', 'التثبيت النهائي يجب أن يحمل هوية الأستاذ الموثّقة نفسه.');
  }
  if (input.explicitApproval !== true) {
    throw new TeacherAssistantError(
      'FINALIZE_REQUIRES_CONFIRMATION',
      'لا أُثبّت أي درجة نهائية دون تأكيد صريح منك. راجع الجدول ثم أكّد التثبيت.',
    );
  }

  const resolved = getSubmission(data, { submissionId: input.submissionId }, actorId);
  const { submission, student, assignment } = resolved.value;

  const proposal = [...data.proposals]
    .filter(item => item.submissionId === submission.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!proposal || proposal.status !== 'approved') {
    throw new TeacherAssistantError(
      'NOT_APPROVED',
      'لا يمكن تثبيت الدرجة: لا يوجد اقتراح معتمد منك لهذه الإجابة.',
    );
  }

  const scores = input.finalScores
    ? validateScores(assignment, input.finalScores)
    : proposal.perQuestion;
  const total = roundScore(scores.reduce((sum, entry) => sum + entry.score, 0));
  const totalMax = totalMaxOf(assignment);

  const finalGrade: FinalGradeRecord = {
    submissionId: submission.id,
    proposalId: proposal.id,
    studentId: student.id,
    assignmentId: assignment.id,
    finalScores: scores,
    total,
    totalMax,
    approvedByTeacherId: teacher.userId,
    finalizedAt: new Date().toISOString(),
  };

  let next: TeacherAssistantData = {
    ...data,
    finalGrades: [finalGrade, ...data.finalGrades.filter(item => item.submissionId !== submission.id)],
    submissions: data.submissions.map(item =>
      item.id === submission.id ? { ...item, status: 'graded' } : item,
    ),
    notifications: [
      {
        id: newRecordId('notif'),
        recipientId: teacher.userId,
        message: `ثُبّتت درجة ${student.fullName} في «${assignment.title}»: ${total}/${totalMax}.`,
        type: 'grade',
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...data.notifications,
    ],
  };
  next = withAudit(next, actorId, 'تثبيت درجة نهائية', `${student.fullName} — ${assignment.title}: ${total}/${totalMax}`);
  return {
    data: next,
    value: { finalGrade, student, assignment },
    message: `ثُبّتت الدرجة النهائية لـ${student.fullName} في «${assignment.title}»: ${total}/${totalMax}.`,
  };
}

/* ————— 9) التنبيه ————— */

export function sendNotification(
  data: TeacherAssistantData,
  input: { recipientId: string; message: string; type?: NotificationType },
  actorId: string,
): ToolOutcome<{ notificationId: string }> {
  requireTeacherRole(data, actorId);
  const recipient = data.teachers.find(account => account.userId === input.recipientId);
  if (!recipient) {
    throw new TeacherAssistantError('NOT_FOUND', 'المستلم المطلوب غير موجود في حسابات المنصة.');
  }
  const message = String(input.message || '').trim();
  if (!message) {
    throw new TeacherAssistantError('INVALID', 'لا يمكن إرسال تنبيه فارغ.');
  }
  const notificationId = newRecordId('notif');
  let next: TeacherAssistantData = {
    ...data,
    notifications: [
      {
        id: notificationId,
        recipientId: recipient.userId,
        message: message.slice(0, 500),
        type: input.type || 'info',
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...data.notifications,
    ],
  };
  next = withAudit(next, actorId, 'إرسال تنبيه', message.slice(0, 200));
  return {
    data: next,
    value: { notificationId },
    message: `أُرسل التنبيه إلى ${recipient.name || recipient.userId}.`,
  };
}

/* ————— عرض مساعد للواجهة ————— */

export function describeStudent(student: StudentRecord): string {
  const parts = [student.fullName];
  if (student.classId) parts.push(`القسم ${student.classId}`);
  parts.push(levelLabel(student.level));
  if (student.registrationNumber) parts.push(`رقم القيد ${student.registrationNumber}`);
  return parts.join(' · ');
}
