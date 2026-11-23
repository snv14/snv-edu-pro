import {
  TeacherAssistantError,
  decideProposal,
  finalizeGrade,
  getAssignment,
  getReviewStatus,
  getRubric,
  getUserRole,
  getSubmission,
  normalizeArabicText,
  proposeGrade,
  searchStudent,
  sendNotification,
  type RubricView,
} from './teacherAssistantTools';
import {
  type AssignmentRecord,
  type ProposedScore,
  type StudentRecord,
  type TeacherAssistantData,
  latestSubmission,
  levelLabel,
} from './teacherAssistantStore';

/**
 * محرّك المساعد التربوي: يقرأ طلب الأستاذ بالعربية ويستدعي الأدوات المناسبة فقط.
 * لا استدعاء لمزوّد ذكاء اصطناعي، ولا إجابة من خارج سجلات المنصة.
 */

export interface TeacherCommandInput {
  text: string;
  data: TeacherAssistantData;
  actorId: string;
  activeProposalId?: string | null;
  activeSubmissionId?: string | null;
  confirmFinalize?: boolean;
  finalScores?: ProposedScore[];
}

export type TeacherCommandKind =
  | 'text'
  | 'students'
  | 'assignments'
  | 'rubric'
  | 'submission'
  | 'proposal'
  | 'status'
  | 'final';

export interface TeacherCommandResult {
  data: TeacherAssistantData;
  reply: string;
  kind: TeacherCommandKind;
  proposalId?: string;
  submissionId?: string;
}

export function teacherAssistantHelp(): string {
  return [
    'أنا المساعد التربوي: أشتغل على سجلات المنصة وحدها، وأقترح الدرجات ولا أثبّتها إلا بتأكيدك.',
    'جرّب:',
    '• «الطلبة» — قائمة طلبتك',
    '• «ابحث عن سليم» — بطاقة طالب',
    '• «الفروض» — قائمة الفروض والاختبارات',
    '• «سلّم الفرض الأول» — معايير التصحيح',
    '• «إجابة سليم في الفرض الأول» — نص إجابة الطالب',
    '• «صحح سليم في الفرض الأول» — اقتراح تصحيح بانتظار مراجعتك',
    '• «الحالة» — حالة المراجعة',
    '• «اعتمد» أو «ارفض» — قرارك على الاقتراح',
    '• «ثبّت» — تثبيت نهائي بعد تأكيدك الصريح',
    '• «نبّهني» — تنبيه في سجل التنبيهات',
    'ولإدخال الطلبة والفروض والإجابات استعمل تبويب «البيانات».',
  ].join('\n');
}

const LEADING_WORDS = new Set([
  'ابحث',
  'بحث',
  'عن',
  'الطالب',
  'طالب',
  'الطالبه',
  'لي',
  'من',
  'فضلك',
  'ارجو',
  'لو',
  'سمحت',
]);

const stripLeading = (raw: string, extra: string[] = []): string => {
  const extraSet = new Set(extra.map(normalizeArabicText));
  const words = raw.trim().split(/\s+/).filter(Boolean);
  while (words.length > 1) {
    const word = normalizeArabicText(words[0]);
    if (!LEADING_WORDS.has(word) && !extraSet.has(word)) break;
    words.shift();
  }
  return words.join(' ').trim();
};

const SPLITTERS = [' في ', ' على ', ' - ', ' | ', '، ', ' / '];

const splitPair = (raw: string): [string, string] => {
  for (const splitter of SPLITTERS) {
    const index = raw.indexOf(splitter);
    if (index > 0) {
      return [raw.slice(0, index).trim(), raw.slice(index + splitter.length).trim()];
    }
  }
  return [raw.trim(), ''];
};

const resolveStudent = (data: TeacherAssistantData, query: string, actorId: string): StudentRecord => {
  const outcome = searchStudent(data, { query }, actorId);
  const matches = outcome.value;
  if (!matches.length) {
    throw new TeacherAssistantError(
      'NOT_FOUND',
      `لا يوجد طالب مطابق لـ«${query}» في سجلاتك. تحقّق من الاسم أو أضفه من تبويب «البيانات».`,
    );
  }
  if (matches.length > 1) {
    const lines = matches
      .slice(0, 8)
      .map(student => `• ${student.fullName} — ${student.classId || levelLabel(student.level)}`)
      .join('\n');
    throw new TeacherAssistantError(
      'INVALID',
      `وجدت ${matches.length} طلبة مطابقين:\n${lines}\nاكتب الاسم الكامل أو رقم القيد.`,
    );
  }
  return matches[0];
};

const rubricLines = (rubric: RubricView): string => {
  const byQuestion = new Map<number, string[]>();
  rubric.criteria.forEach(criterion => {
    const line = `${criterion.label} (${criterion.points} ن)`;
    byQuestion.set(criterion.questionNumber, [...(byQuestion.get(criterion.questionNumber) || []), line]);
  });
  const lines: string[] = [];
  Array.from(byQuestion.keys())
    .sort((a, b) => a - b)
    .forEach(questionNumber => {
      lines.push(`السؤال ${questionNumber}: ${(byQuestion.get(questionNumber) || []).join(' · ')}`);
    });
  if (rubric.questionsWithoutCriteria.length) {
    lines.push(`أسئلة بلا معايير: ${rubric.questionsWithoutCriteria.join('، ')}`);
  }
  if (!rubric.approved) {
    lines.push('هذا السلّم مقترح آليًا من نص الأسئلة ولم يعتمده الأستاذ بعد.');
  }
  return lines.join('\n');
};

const assignmentsReply = (assignments: AssignmentRecord[]): string => {
  if (!assignments.length) {
    return 'لا توجد فروض أو اختبارات مسجّلة بعد. أضفها من تبويب «البيانات».';
  }
  return assignments
    .map(
      assignment =>
        `• ${assignment.title} — ${levelLabel(assignment.level)}${
          assignment.classId ? ` · القسم ${assignment.classId}` : ''
        } · ${assignment.questions.length} سؤالًا · ${assignment.totalPoints} نقطة${
          assignment.dueDate ? ` · تسليم ${assignment.dueDate}` : ''
        }`,
    )
    .join('\n');
};

const errorReply = (data: TeacherAssistantData, error: unknown): TeacherCommandResult => ({
  data,
  reply: error instanceof Error ? error.message : 'تعذّر تنفيذ الطلب.',
  kind: 'text',
});

export function runTeacherCommand(input: TeacherCommandInput): TeacherCommandResult {
  const raw = String(input.text || '').trim();
  if (!raw) {
    return { data: input.data, reply: teacherAssistantHelp(), kind: 'text' };
  }

  const normalized = normalizeArabicText(raw);
  const firstWord = normalized.split(' ')[0] || '';
  const { data, actorId } = input;

  try {
    if (/^(من انت|دورك|صلاحيتي|الصلاحيات|دوري)$/.test(normalized) || normalized.includes('من انت')) {
      const role = getUserRole(data, actorId);
      const counts = `طلبة: ${data.students.length} · فروض: ${data.assignments.length} · اقتراحات معلّقة: ${
        data.proposals.filter(proposal => proposal.status === 'pending').length
      } · درجات مثبّتة: ${data.finalGrades.length}`;
      return { data: role.data, reply: `${role.message}\n${counts}`, kind: 'text' };
    }

    if (/^(مرحبا|السلام عليكم|اهلا|سلام|صباح الخير|مساء الخير)/.test(normalized)) {
      return {
        data,
        reply: `أهلًا بك. ${getUserRole(data, actorId).message}\n${teacherAssistantHelp()}`,
        kind: 'text',
      };
    }

    if (/^(ساعدني|مساعده|ماذا تستطيع|كيف استعملك|تعليمات|help)$/.test(normalized)) {
      return { data, reply: teacherAssistantHelp(), kind: 'text' };
    }

    if (/^(الطلبه|الطلاب|طلبتي|قائمه الطلبه|عرض الطلبه|قائمه الطلاب)$/.test(normalized)) {
      const outcome = searchStudent(data, {}, actorId);
      const students = outcome.value;
      const reply = students.length
        ? `${outcome.message}\n${students
            .map(student => `• ${student.fullName} — ${student.classId || levelLabel(student.level)}`)
            .join('\n')}`
        : 'لا يوجد طلبة في سجلاتك بعد. أضفهم من تبويب «البيانات».';
      return { data: outcome.data, reply, kind: 'students' };
    }

    if (firstWord === 'ابحث' || firstWord === 'بحث' || /^(الطالب|طالب)$/.test(firstWord)) {
      const query = stripLeading(raw.replace(/^(ابحث|بحث)\s+/, ''));
      const outcome = searchStudent(data, { query }, actorId);
      const students = outcome.value;
      const reply = students.length
        ? `${outcome.message}\n${students
            .map(
              student =>
                `• ${student.fullName} — ${student.classId || levelLabel(student.level)}${
                  student.registrationNumber ? ` · رقم القيد ${student.registrationNumber}` : ''
                }`,
            )
            .join('\n')}`
        : outcome.message;
      return { data: outcome.data, reply, kind: 'students' };
    }

    if (/^(الفروض|الاختبارات|قائمه الفروض|عرض الفروض|قائمه الاختبارات)$/.test(normalized)) {
      return { data, reply: assignmentsReply(data.assignments), kind: 'assignments' };
    }

    if (firstWord === 'سلم' || firstWord === 'السلم' || normalized.startsWith('سلم التصحيح')) {
      const reference = stripLeading(raw.replace(/^(سلم|السلم|سلم التصحيح)\s+/, ''));
      const outcome = getRubric(data, { reference }, actorId);
      return {
        data: outcome.data,
        reply: `${outcome.message}\n${rubricLines(outcome.value.rubric)}\nالفرض: ${outcome.value.assignment.title}`,
        kind: 'rubric',
      };
    }

    if (firstWord === 'اجابه' || firstWord === 'تسليم' || normalized.startsWith('اجابه الطالب')) {
      const rest = stripLeading(raw.replace(/^(اجابه|تسليم)\s+/, ''));
      const [studentPart, assignmentPart] = splitPair(rest);
      const student = resolveStudent(data, studentPart, actorId);
      const assignment = assignmentPart
        ? getAssignment(data, { reference: assignmentPart }, actorId).value
        : null;
      const submission = latestSubmission(data, { studentId: student.id, assignmentId: assignment?.id });
      if (!submission) {
        return {
          data,
          reply: `لا توجد إجابة مسجّلة لـ${student.fullName}${
            assignment ? ` في «${assignment.title}»` : ''
          }. أضف الإجابة من تبويب «البيانات» أولًا.`,
          kind: 'text',
        };
      }
      const outcome = getSubmission(data, { submissionId: submission.id }, actorId);
      const excerpt = outcome.value.submission.answerText.slice(0, 700);
      return {
        data: outcome.data,
        reply: `إجابة ${student.fullName} في «${outcome.value.assignment.title}» (${outcome.value.submission.status === 'graded' ? 'مصحّحة' : 'بانتظار التصحيح'}):\n${excerpt}${
          outcome.value.submission.answerText.length > 700 ? '…' : ''
        }`,
        kind: 'submission',
        submissionId: submission.id,
      };
    }

    if (firstWord === 'صحح' || firstWord === 'صحّح' || normalized.startsWith('اقترح التصحيح')) {
      const rest = stripLeading(raw.replace(/^(صحح|صحّح|اقترح التصحيح)\s+/, ''));
      const [studentPart, assignmentPart] = splitPair(rest);
      if (!studentPart) {
        return { data, reply: 'قل: «صحح اسم الطالب في عنوان الفرض».', kind: 'text' };
      }
      const student = resolveStudent(data, studentPart, actorId);
      const assignment = assignmentPart
        ? getAssignment(data, { reference: assignmentPart }, actorId).value
        : null;
      const submission = latestSubmission(data, { studentId: student.id, assignmentId: assignment?.id });
      if (!submission) {
        return {
          data,
          reply: `لا توجد إجابة مسجّلة لـ${student.fullName}${
            assignment ? ` في «${assignment.title}»` : ''
          }. أضف الإجابة من تبويب «البيانات» ثم أعد المحاولة.`,
          kind: 'text',
        };
      }
      const outcome = proposeGrade(data, { submissionId: submission.id }, actorId);
      return {
        data: outcome.data,
        reply: outcome.message,
        kind: 'proposal',
        proposalId: outcome.value.proposal.id,
        submissionId: submission.id,
      };
    }

    if (/^(الحاله|حاله المراجعه|هل اعتمد|مراجعه|المراجعه|حاله الاقتراح)$/.test(normalized)) {
      const submissionId =
        input.activeSubmissionId ||
        (input.activeProposalId
          ? data.proposals.find(proposal => proposal.id === input.activeProposalId)?.submissionId
          : undefined) ||
        [...data.proposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.submissionId;
      if (!submissionId) {
        return { data, reply: 'لا يوجد اقتراح تصحيح بعد. قل مثلًا: «صحح سليم في الفرض الأول».', kind: 'text' };
      }
      const outcome = getReviewStatus(data, { submissionId }, actorId);
      return {
        data: outcome.data,
        reply: outcome.message,
        kind: 'status',
        submissionId,
        proposalId: outcome.value.proposal?.id,
      };
    }

    if (/^(اعتمد|اعتماد|وافق|اوافق|اقبل)$/.test(normalized)) {
      const proposal =
        data.proposals.find(item => item.id === input.activeProposalId) ||
        [...data.proposals].filter(item => item.status === 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (!proposal) {
        return { data, reply: 'لا يوجد اقتراح بانتظار قرارك.', kind: 'text' };
      }
      const outcome = decideProposal(data, { proposalId: proposal.id, decision: 'approved' }, actorId);
      return {
        data: outcome.data,
        reply: outcome.message,
        kind: 'status',
        proposalId: proposal.id,
        submissionId: proposal.submissionId,
      };
    }

    if (/^(ارفض|رفض|لا اوافق|الغاء)$/.test(normalized)) {
      const proposal =
        data.proposals.find(item => item.id === input.activeProposalId) ||
        [...data.proposals].filter(item => item.status === 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (!proposal) {
        return { data, reply: 'لا يوجد اقتراح بانتظار قرارك.', kind: 'text' };
      }
      const outcome = decideProposal(data, { proposalId: proposal.id, decision: 'rejected' }, actorId);
      return {
        data: outcome.data,
        reply: outcome.message,
        kind: 'status',
        proposalId: proposal.id,
        submissionId: proposal.submissionId,
      };
    }

    if (/^(ثبت|تثبيت|الدرجه النهائيه|درجه نهائيه)$/.test(normalized)) {
      const submissionId =
        input.activeSubmissionId ||
        (input.activeProposalId
          ? data.proposals.find(proposal => proposal.id === input.activeProposalId)?.submissionId
          : undefined) ||
        [...data.proposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.submissionId;
      if (!submissionId) {
        return { data, reply: 'لا توجد إجابة محدّدة لتثبيت درجتها.', kind: 'text' };
      }
      if (!input.confirmFinalize) {
        return {
          data,
          reply: 'التثبيت النهائي يحتاج تأكيدك الصريح. راجع الجدول ثم اضغط «تأكيد التثبيت النهائي».',
          kind: 'status',
          submissionId,
        };
      }
      const outcome = finalizeGrade(
        data,
        {
          submissionId,
          approvedByTeacherId: actorId,
          finalScores: input.finalScores,
          explicitApproval: true,
        },
        actorId,
      );
      return {
        data: outcome.data,
        reply: outcome.message,
        kind: 'final',
        submissionId,
      };
    }

    if (firstWord === 'نبهني' || firstWord === 'تنبيه' || firstWord === 'اشعار' || firstWord === 'ذكرني') {
      const message = stripLeading(raw.replace(/^(نبهني|تنبيه|اشعار|ذكرني)\s*/, '')).trim();
      const outcome = sendNotification(
        data,
        {
          recipientId: actorId,
          message: message || 'تذكير بمراجعة اقتراحات التصحيح المعلّقة.',
          type: 'review',
        },
        actorId,
      );
      return { data: outcome.data, reply: outcome.message, kind: 'text' };
    }

    return {
      data,
      reply: `لم أفهم الطلب: «${raw}».\n${teacherAssistantHelp()}`,
      kind: 'text',
    };
  } catch (error) {
    return errorReply(data, error);
  }
}
