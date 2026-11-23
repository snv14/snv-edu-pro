import localforage from 'localforage';

/**
 * سجلّات المساعد التربوي: الطلبة والفروض والإجابات والاقتراحات والدرجات النهائية.
 * المصدر الوحيد لأدوات المساعد، محلي على جهاز الأستاذ (localforage) ولا يُرسل لأي مزوّد.
 * لا تُولَّد أي بيانات تلقائيًا: كل سجل يكتبه الأستاذ بنفسه.
 */

export type TeacherRole = 'teacher' | 'admin';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'info' | 'review' | 'grade';

export interface TeacherAccount {
  userId: string;
  name: string;
  email: string;
  role: TeacherRole;
  registeredAt: string;
}

export interface StudentRecord {
  id: string;
  fullName: string;
  registrationNumber: string;
  classId: string;
  level: string;
  createdAt: string;
}

export interface AssignmentQuestion {
  id: string;
  number: number;
  text: string;
  points: number;
  /** عناصر الإجابة المنتظرة: كل عنصر معيار مستقل يُحتسب بنقطة جزئية. */
  expectedKeywords: string[];
}

export interface AssignmentRecord {
  id: string;
  title: string;
  subject: string;
  level: string;
  classId: string;
  totalPoints: number;
  dueDate: string;
  questions: AssignmentQuestion[];
  createdAt: string;
}

export interface SubmissionRecord {
  id: string;
  assignmentId: string;
  studentId: string;
  answerText: string;
  status: 'submitted' | 'graded';
  submittedAt: string;
}

export interface ProposedScore {
  questionNumber: number;
  score: number;
  maxPoints: number;
  rationale: string;
  matched: string[];
  missing: string[];
}

export interface GradeProposal {
  id: string;
  submissionId: string;
  studentId: string;
  assignmentId: string;
  perQuestion: ProposedScore[];
  totalProposed: number;
  totalMax: number;
  rubricStatus: 'approved' | 'unapproved';
  status: ProposalStatus;
  createdAt: string;
  decidedAt?: string;
  decidedByTeacherId?: string;
}

export interface FinalGradeRecord {
  submissionId: string;
  proposalId: string;
  studentId: string;
  assignmentId: string;
  finalScores: ProposedScore[];
  total: number;
  totalMax: number;
  approvedByTeacherId: string;
  finalizedAt: string;
}

export interface AssistantNotification {
  id: string;
  recipientId: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: string;
  details: string;
}

export interface TeacherAssistantData {
  version: 1;
  teachers: TeacherAccount[];
  students: StudentRecord[];
  assignments: AssignmentRecord[];
  submissions: SubmissionRecord[];
  proposals: GradeProposal[];
  finalGrades: FinalGradeRecord[];
  notifications: AssistantNotification[];
  audit: AuditEntry[];
}

const STORAGE_KEY = 'snv-edu-pro.teacher-assistant.v1';
const MAX_AUDIT = 300;

export const LEVEL_LABELS: Record<string, string> = {
  '1am': 'السنة الأولى متوسط',
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
};

export const levelLabel = (level: string): string => LEVEL_LABELS[level] || level || 'غير محدّد';

export const newRecordId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const emptyTeacherAssistantData = (): TeacherAssistantData => ({
  version: 1,
  teachers: [],
  students: [],
  assignments: [],
  submissions: [],
  proposals: [],
  finalGrades: [],
  notifications: [],
  audit: [],
});

export function withAudit(
  data: TeacherAssistantData,
  actorId: string,
  action: string,
  details: string,
): TeacherAssistantData {
  const entry: AuditEntry = {
    id: newRecordId('audit'),
    at: new Date().toISOString(),
    actorId,
    action,
    details,
  };
  return { ...data, audit: [entry, ...data.audit].slice(0, MAX_AUDIT) };
}

export function createStudent(input: {
  fullName: string;
  classId: string;
  level: string;
  registrationNumber?: string;
}): StudentRecord {
  return {
    id: newRecordId('stu'),
    fullName: input.fullName.trim().slice(0, 120),
    registrationNumber: (input.registrationNumber || '').trim().slice(0, 40),
    classId: input.classId.trim().slice(0, 40),
    level: input.level,
    createdAt: new Date().toISOString(),
  };
}

export function createAssignment(input: {
  title: string;
  subject?: string;
  level: string;
  classId: string;
  dueDate?: string;
  questions: Array<{ text: string; points: number; expectedKeywords?: string[] }>;
}): AssignmentRecord {
  const questions: AssignmentQuestion[] = input.questions
    .filter(question => question.text.trim())
    .map((question, index) => ({
      id: newRecordId('q'),
      number: index + 1,
      text: question.text.trim().slice(0, 1200),
      points: Number.isFinite(question.points) ? Math.max(0, question.points) : 1,
      expectedKeywords: (question.expectedKeywords || [])
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 20),
    }));

  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  return {
    id: newRecordId('asg'),
    title: input.title.trim().slice(0, 160) || 'فرض بلا عنوان',
    subject: (input.subject || 'علوم الطبيعة والحياة').slice(0, 80),
    level: input.level,
    classId: input.classId.trim().slice(0, 40),
    totalPoints: Math.round(totalPoints * 100) / 100,
    dueDate: (input.dueDate || '').slice(0, 20),
    questions,
    createdAt: new Date().toISOString(),
  };
}

export function createSubmission(input: {
  assignmentId: string;
  studentId: string;
  answerText: string;
}): SubmissionRecord {
  return {
    id: newRecordId('sub'),
    assignmentId: input.assignmentId,
    studentId: input.studentId,
    answerText: input.answerText.trim().slice(0, 40_000),
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
}

export async function loadTeacherAssistantData(): Promise<TeacherAssistantData> {
  const stored = await localforage.getItem<TeacherAssistantData>(STORAGE_KEY);
  if (!stored || stored.version !== 1) return emptyTeacherAssistantData();
  const base = emptyTeacherAssistantData();
  return {
    version: 1,
    teachers: Array.isArray(stored.teachers) ? stored.teachers : base.teachers,
    students: Array.isArray(stored.students) ? stored.students : base.students,
    assignments: Array.isArray(stored.assignments) ? stored.assignments : base.assignments,
    submissions: Array.isArray(stored.submissions) ? stored.submissions : base.submissions,
    proposals: Array.isArray(stored.proposals) ? stored.proposals : base.proposals,
    finalGrades: Array.isArray(stored.finalGrades) ? stored.finalGrades : base.finalGrades,
    notifications: Array.isArray(stored.notifications) ? stored.notifications : base.notifications,
    audit: Array.isArray(stored.audit) ? stored.audit : base.audit,
  };
}

export async function saveTeacherAssistantData(data: TeacherAssistantData): Promise<void> {
  await localforage.setItem(STORAGE_KEY, data);
}

export async function clearTeacherAssistantData(): Promise<void> {
  await localforage.removeItem(STORAGE_KEY);
}

export function findStudentById(data: TeacherAssistantData, studentId: string): StudentRecord | null {
  return data.students.find(student => student.id === studentId) || null;
}

export function findAssignmentById(data: TeacherAssistantData, assignmentId: string): AssignmentRecord | null {
  return data.assignments.find(assignment => assignment.id === assignmentId) || null;
}

export function latestSubmission(
  data: TeacherAssistantData,
  filter: { studentId?: string; assignmentId?: string },
): SubmissionRecord | null {
  const matches = data.submissions
    .filter(submission => (filter.studentId ? submission.studentId === filter.studentId : true))
    .filter(submission => (filter.assignmentId ? submission.assignmentId === filter.assignmentId : true))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return matches[0] || null;
}
