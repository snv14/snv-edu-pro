import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Database,
  GraduationCap,
  Loader2,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from './Auth';
import type { MemoConfig } from '../types';
import {
  LEVEL_LABELS,
  type TeacherAssistantData,
  createAssignment,
  createStudent,
  createSubmission,
  loadTeacherAssistantData,
  saveTeacherAssistantData,
  withAudit,
} from '../services/teacherAssistantStore';
import {
  adjustProposal,
  decideProposal,
  finalizeGrade,
  registerTeacher,
} from '../services/teacherAssistantTools';
import { runTeacherCommand, teacherAssistantHelp } from '../services/teacherAssistantEngine';

interface TeacherAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: MemoConfig;
  selectedLevel?: '1am' | '2am' | '3am' | '4am';
  showToast?: (message: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'teacher' | 'assistant';
  text: string;
}

interface QuestionDraft {
  id: string;
  text: string;
  points: string;
  keywords: string;
}

const formatScore = (value: number): string => (Number.isInteger(value) ? String(value) : value.toFixed(2));

const toNumber = (value: string): number => {
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const splitKeywords = (value: string): string[] =>
  value
    .split(/[,،;؛]/)
    .map(item => item.trim())
    .filter(Boolean);

const inputClass =
  'w-full rounded-xl border border-[#dbe6e2] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#20332e] outline-none transition focus:border-[#0e7a68] focus:ring-2 focus:ring-[#0e7a68]/15';

const labelClass = 'mb-1 block text-[10.5px] font-extrabold text-[#5c716b]';

const emptyQuestion = (points = '2'): QuestionDraft => ({
  id: `qd-${Math.random().toString(36).slice(2, 8)}`,
  text: '',
  points,
  keywords: '',
});

export const TeacherAssistantDrawer: React.FC<TeacherAssistantDrawerProps> = ({
  isOpen,
  onClose,
  config,
  selectedLevel,
  showToast,
}) => {
  const { user } = useAuth();
  const actorId = user?.uid || 'local-teacher';
  const teacherName = config.teacherName || user?.displayName || 'الأستاذ';

  const [data, setData] = useState<TeacherAssistantData | null>(null);
  const [tab, setTab] = useState<'chat' | 'data'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<number, string>>({});
  const [confirmingFinalize, setConfirmingFinalize] = useState(false);

  const [studentForm, setStudentForm] = useState<{ fullName: string; classId: string; level: string; registrationNumber: string }>({
    fullName: '',
    classId: '',
    level: selectedLevel || '4am',
    registrationNumber: '',
  });
  const [assignmentForm, setAssignmentForm] = useState<{
    title: string;
    level: string;
    classId: string;
    subject: string;
    dueDate: string;
  }>({ title: '', level: selectedLevel || '4am', classId: '', subject: 'علوم الطبيعة والحياة', dueDate: '' });
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [submissionForm, setSubmissionForm] = useState({ assignmentId: '', studentId: '', answerText: '' });
  const [formError, setFormError] = useState('');

  const proposal = useMemo(
    () => data?.proposals.find(item => item.id === activeProposalId) || null,
    [data, activeProposalId],
  );

  const pushAssistant = useCallback((text: string) => {
    setMessages(previous => [...previous, { id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role: 'assistant', text }]);
  }, []);

  const commit = useCallback(async (next: TeacherAssistantData) => {
    setData(next);
    await saveTeacherAssistantData(next);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const loaded = await loadTeacherAssistantData();
      const registered = registerTeacher(loaded, {
        userId: actorId,
        name: config.teacherName || user?.displayName || 'الأستاذ',
        email: user?.email || '',
      });
      if (registered.data !== loaded) await saveTeacherAssistantData(registered.data);
      if (!alive) return;
      setData(registered.data);
      setMessages(previous =>
        previous.length
          ? previous
          : [
              {
                id: 'welcome',
                role: 'assistant',
                text: `أهلًا ${teacherName}. ${registered.message}\n${teacherAssistantHelp()}`,
              },
            ],
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // config.teacherName وuser يتغيّران نادرًا؛ إعادة التحميل عند فتح اللوحة أو تغيّر الحساب تكفي.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, actorId]);

  useEffect(() => {
    if (!proposal) {
      setDraftScores({});
      setConfirmingFinalize(false);
      return;
    }
    const next: Record<number, string> = {};
    proposal.perQuestion.forEach(entry => {
      next[entry.questionNumber] = formatScore(entry.score);
    });
    setDraftScores(next);
    setConfirmingFinalize(false);
  }, [proposal?.id]);

  if (!isOpen) return null;

  const teacher = data?.teachers.find(account => account.userId === actorId) || null;

  const send = (value?: string) => {
    const text = (value ?? input).trim();
    if (!text || !data) return;
    const result = runTeacherCommand({
      text,
      data,
      actorId,
      activeProposalId,
    });
    void commit(result.data);
    setMessages(previous => [
      ...previous,
      { id: `m-${Date.now()}-s`, role: 'teacher', text },
      { id: `m-${Date.now()}-r`, role: 'assistant', text: result.reply },
    ]);
    if (result.proposalId) setActiveProposalId(result.proposalId);
    setInput('');
    setTab('chat');
  };

  const updateProposalScores = async () => {
    if (!data || !proposal) return;
    try {
      const perQuestion = proposal.perQuestion.map(entry => ({
        ...entry,
        score: toNumber(draftScores[entry.questionNumber] ?? String(entry.score)),
      }));
      const outcome = adjustProposal(data, { proposalId: proposal.id, perQuestionScores: perQuestion }, actorId);
      await commit(outcome.data);
      pushAssistant(outcome.message);
    } catch (error) {
      pushAssistant(error instanceof Error ? error.message : 'تعذّر تعديل الاقتراح.');
    }
  };

  const decide = async (decision: 'approved' | 'rejected') => {
    if (!data || !proposal) return;
    try {
      const outcome = decideProposal(data, { proposalId: proposal.id, decision }, actorId);
      await commit(outcome.data);
      pushAssistant(outcome.message);
      showToast?.(outcome.message);
    } catch (error) {
      pushAssistant(error instanceof Error ? error.message : 'تعذّر تسجيل القرار.');
    }
  };

  const finalize = async () => {
    if (!data || !proposal) return;
    try {
      const outcome = finalizeGrade(
        data,
        {
          submissionId: proposal.submissionId,
          approvedByTeacherId: actorId,
          explicitApproval: true,
        },
        actorId,
      );
      await commit(outcome.data);
      pushAssistant(outcome.message);
      setConfirmingFinalize(false);
      showToast?.(outcome.message);
    } catch (error) {
      pushAssistant(error instanceof Error ? error.message : 'تعذّر تثبيت الدرجة.');
    }
  };

  const addStudent = async () => {
    if (!data) return;
    setFormError('');
    if (!studentForm.fullName.trim() || !studentForm.classId.trim()) {
      setFormError('اسم الطالب والقسم مطلوبان.');
      return;
    }
    const student = createStudent(studentForm);
    const next = withAudit(
      { ...data, students: [...data.students, student] },
      actorId,
      'إضافة طالب',
      `${student.fullName} — ${student.classId}`,
    );
    await commit(next);
    setStudentForm({ fullName: '', classId: '', level: studentForm.level, registrationNumber: '' });
    showToast?.(`أُضيف الطالب ${student.fullName}.`);
  };

  const addAssignment = async () => {
    if (!data) return;
    setFormError('');
    if (!assignmentForm.title.trim() || !assignmentForm.classId.trim()) {
      setFormError('عنوان الفرض والقسم مطلوبان.');
      return;
    }
    const questions = questionDrafts.filter(draft => draft.text.trim());
    if (!questions.length) {
      setFormError('أضف سؤالًا واحدًا على الأقل.');
      return;
    }
    const assignment = createAssignment({
      title: assignmentForm.title,
      subject: assignmentForm.subject,
      level: assignmentForm.level,
      classId: assignmentForm.classId,
      dueDate: assignmentForm.dueDate,
      questions: questions.map(draft => ({
        text: draft.text,
        points: toNumber(draft.points),
        expectedKeywords: splitKeywords(draft.keywords),
      })),
    });
    const next = withAudit(
      { ...data, assignments: [...data.assignments, assignment] },
      actorId,
      'إضافة فرض',
      `${assignment.title} — ${assignment.questions.length} سؤالًا`,
    );
    await commit(next);
    setAssignmentForm({ title: '', level: assignmentForm.level, classId: '', subject: 'علوم الطبيعة والحياة', dueDate: '' });
    setQuestionDrafts([emptyQuestion()]);
    showToast?.(`أُضيف الفرض ${assignment.title}.`);
  };

  const addSubmission = async () => {
    if (!data) return;
    setFormError('');
    if (!submissionForm.assignmentId || !submissionForm.studentId || !submissionForm.answerText.trim()) {
      setFormError('اختر الفرض والطالب واكتب الإجابة.');
      return;
    }
    const submission = createSubmission(submissionForm);
    const next = withAudit(
      { ...data, submissions: [...data.submissions, submission] },
      actorId,
      'تسجيل إجابة',
      `${data.students.find(item => item.id === submission.studentId)?.fullName || submission.studentId}`,
    );
    await commit(next);
    setSubmissionForm({ assignmentId: submissionForm.assignmentId, studentId: submissionForm.studentId, answerText: '' });
    showToast?.('سُجّلت الإجابة، ويمكنك الآن طلب اقتراح التصحيح.');
  };

  const finalGradeForProposal = proposal
    ? data?.finalGrades.find(grade => grade.submissionId === proposal.submissionId) || null
    : null;
  const proposalStudent = proposal ? data?.students.find(student => student.id === proposal.studentId) : null;
  const proposalAssignment = proposal ? data?.assignments.find(assignment => assignment.id === proposal.assignmentId) : null;
  const scoresDirty = Boolean(
    proposal &&
      proposal.perQuestion.some(
        entry => toNumber(draftScores[entry.questionNumber] ?? String(entry.score)) !== entry.score,
      ),
  );

  const quickActions = ['الطلبة', 'الفروض', 'الحالة', 'نبّهني بمراجعة الاقتراحات'];

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex justify-start bg-[#04110e]/55 backdrop-blur-[3px] animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="المساعد التربوي"
    >
      <div
        className="flex h-full w-full max-w-[580px] flex-col border-l border-[#0b1f1c]/10 bg-[#f6f9f8] shadow-2xl animate-in slide-in-from-right-4 duration-200"
        onClick={event => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-[#0b1f1c] px-4 pb-3 pt-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#f0d492]">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[13.5px] font-extrabold leading-tight">المساعد التربوي</h3>
                <p className="truncate text-[10.5px] text-white/60">التصحيح والدرجات · سجلات المنصة المحلية</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق المساعد"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10.5px]">
            <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 font-bold text-white/85">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8fe0ce]" />
              {teacher ? `${teacher.name || teacherName} · ${teacher.role === 'admin' ? 'مسؤول' : 'أستاذ'}` : 'بانتظار التحقق من الدور'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/65 tabular-nums">
              {data?.students.length || 0} طالبًا · {data?.assignments.length || 0} فرضًا ·{' '}
              {data?.proposals.filter(item => item.status === 'pending').length || 0} اقتراحًا معلّقًا
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.06] p-1">
            <button
              type="button"
              onClick={() => setTab('chat')}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-extrabold transition ${
                tab === 'chat' ? 'bg-white text-[#0b5f51]' : 'text-white/70 hover:text-white'
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              المحادثة والتصحيح
            </button>
            <button
              type="button"
              onClick={() => setTab('data')}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-extrabold transition ${
                tab === 'data' ? 'bg-white text-[#0b5f51]' : 'text-white/70 hover:text-white'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              البيانات
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-[12px] font-bold text-[#0e7a68]">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحميل سجلاتك…
          </div>
        ) : tab === 'chat' ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'teacher' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[92%] whitespace-pre-line rounded-2xl px-3 py-2 text-[12px] leading-6 shadow-sm ${
                      message.role === 'teacher'
                        ? 'rounded-tr-md border border-[#cfe3dc] bg-white text-[#20332e]'
                        : 'rounded-tl-md bg-[#0b5f51] text-white/95'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {proposal && proposalStudent && proposalAssignment ? (
                <div className="rounded-2xl border border-[#dbe6e2] bg-white p-3 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-extrabold text-[#0b1f1c]">
                        {proposalStudent.fullName} — {proposalAssignment.title}
                      </div>
                      <div className="text-[10.5px] text-[#6b807a]">
                        {proposal.status === 'pending'
                          ? 'اقتراح بانتظار قرارك'
                          : proposal.status === 'approved'
                            ? 'اعتمدتَ الاقتراح'
                            : 'مرفوض'}{' '}
                        · {formatScore(proposal.totalProposed)} من {formatScore(proposal.totalMax)}
                        {proposal.rubricStatus === 'unapproved' ? ' · السلّم غير معتمد' : ''}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        finalGradeForProposal
                          ? 'bg-emerald-100 text-emerald-800'
                          : proposal.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : proposal.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {finalGradeForProposal ? 'درجة مثبّتة' : proposal.status === 'pending' ? 'بانتظار المراجعة' : proposal.status === 'rejected' ? 'مرفوض' : 'معتمد'}
                    </span>
                  </div>

                  {proposal.rubricStatus === 'unapproved' ? (
                    <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10.5px] font-semibold text-amber-900">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>لا يوجد سلّم معتمد لهذا الفرض؛ الاقتراح مبني على معايير مقترحة من نص الأسئلة. اعتمد عناصر الإجابة أولًا.</span>
                    </div>
                  ) : null}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-right text-[11px]">
                      <thead>
                        <tr className="bg-[#f1f6f4] text-[10px] font-extrabold text-[#4d625c]">
                          <th className="border border-[#e2ebe8] px-1.5 py-1">السؤال</th>
                          <th className="border border-[#e2ebe8] px-1.5 py-1">ما وجد في الإجابة</th>
                          <th className="border border-[#e2ebe8] px-1.5 py-1">المقترحة</th>
                          <th className="border border-[#e2ebe8] px-1.5 py-1">من أصل</th>
                          <th className="border border-[#e2ebe8] px-1.5 py-1">سبب الدرجة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.perQuestion.map(entry => (
                          <tr key={entry.questionNumber} className="align-top">
                            <td className="border border-[#e2ebe8] px-1.5 py-1 font-extrabold tabular-nums text-[#0b1f1c]">
                              {entry.questionNumber}
                            </td>
                            <td className="border border-[#e2ebe8] px-1.5 py-1 text-[#4d625c]">
                              {entry.matched.length ? entry.matched.join('، ') : 'لا عنصر محقّق'}
                              {entry.missing.length ? (
                                <span className="block text-[10px] text-rose-700">غاب: {entry.missing.join('، ')}</span>
                              ) : null}
                            </td>
                            <td className="border border-[#e2ebe8] px-1 py-1">
                              <input
                                aria-label={`درجة السؤال ${entry.questionNumber}`}
                                className="w-14 rounded-md border border-[#dbe6e2] px-1 py-0.5 text-center text-[11px] font-extrabold tabular-nums outline-none focus:border-[#0e7a68]"
                                inputMode="decimal"
                                value={draftScores[entry.questionNumber] ?? formatScore(entry.score)}
                                disabled={proposal.status !== 'pending'}
                                onChange={event =>
                                  setDraftScores(previous => ({ ...previous, [entry.questionNumber]: event.target.value }))
                                }
                              />
                            </td>
                            <td className="border border-[#e2ebe8] px-1.5 py-1 text-center tabular-nums">{formatScore(entry.maxPoints)}</td>
                            <td className="border border-[#e2ebe8] px-1.5 py-1 text-[10.5px] leading-5 text-[#4d625c]">{entry.rationale}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#f7faf9] font-extrabold">
                          <td className="border border-[#e2ebe8] px-1.5 py-1" colSpan={2}>
                            المجموع
                          </td>
                          <td className="border border-[#e2ebe8] px-1.5 py-1 text-center tabular-nums text-[#0b5f51]" colSpan={2}>
                            {formatScore(proposal.totalProposed)} / {formatScore(proposal.totalMax)}
                          </td>
                          <td className="border border-[#e2ebe8] px-1.5 py-1 text-[10px] font-bold text-[#6b807a]">
                            {finalGradeForProposal
                              ? `مثبّتة: ${formatScore(finalGradeForProposal.total)}/${formatScore(finalGradeForProposal.totalMax)}`
                              : 'لا تُثبَّت إلا بتأكيدك'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {proposal.status === 'pending' ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {scoresDirty ? (
                        <button
                          type="button"
                          onClick={() => void updateProposalScores()}
                          className="cursor-pointer rounded-lg border border-[#0e7a68]/30 bg-[#e8f5f1] px-2.5 py-1 text-[11px] font-extrabold text-[#0b5f51] transition hover:bg-[#d8efe8]"
                        >
                          تحديث الاقتراح بالدرجات المعدّلة
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void decide('approved')}
                        className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#0b5f51] px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-[#0a5145]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        اعتماد الاقتراح
                      </button>
                      <button
                        type="button"
                        onClick={() => void decide('rejected')}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-700 transition hover:bg-rose-100"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        رفض
                      </button>
                      <span className="self-center text-[10px] font-semibold text-[#7b8d88]">لا تُثبَّت أي درجة قبل اعتمادك.</span>
                    </div>
                  ) : proposal.status === 'approved' && !finalGradeForProposal ? (
                    confirmingFinalize ? (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
                        <p className="text-[10.5px] font-bold text-amber-900">
                          سيُثبّت نهائيًا: {formatScore(proposal.totalProposed)} / {formatScore(proposal.totalMax)} — لا رجوع بعد التثبيت.
                        </p>
                        <div className="mt-1.5 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => void finalize()}
                            className="cursor-pointer rounded-lg bg-[#0b5f51] px-2.5 py-1 text-[11px] font-extrabold text-white hover:bg-[#0a5145]"
                          >
                            تأكيد التثبيت النهائي
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingFinalize(false)}
                            className="cursor-pointer rounded-lg border border-[#dbe6e2] bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#4d625c]"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmingFinalize(true)}
                          className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#0b5f51] px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-[#0a5145]"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          تأكيد التثبيت النهائي
                        </button>
                        <span className="text-[10px] font-semibold text-[#7b8d88]">اعتُمد الاقتراح، والدرجة النهائية بانتظار تأكيدك الصريح.</span>
                      </div>
                    )
                  ) : finalGradeForProposal ? (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10.5px] font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      ثُبّتت الدرجة النهائية وأُرسل تنبيه إلى سجل التنبيهات.
                    </div>
                  ) : (
                    <p className="mt-2 text-[10.5px] font-semibold text-rose-700">رفضتَ الاقتراح، ولم تُثبَّت أي درجة.</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-t border-[#e2ebe8] bg-white p-2.5">
              <div className="mb-1.5 flex flex-wrap gap-1">
                {quickActions.map(action => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => send(action)}
                    className="cursor-pointer rounded-full border border-[#dbe6e2] bg-[#f6f9f8] px-2 py-0.5 text-[10px] font-bold text-[#4d625c] transition hover:border-[#0e7a68]/40 hover:text-[#0b5f51]"
                  >
                    {action}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-1.5">
                <textarea
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  placeholder="مثال: صحح سليم في الفرض الأول"
                  className="min-h-[38px] flex-1 resize-none rounded-xl border border-[#dbe6e2] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#20332e] outline-none transition focus:border-[#0e7a68] focus:ring-2 focus:ring-[#0e7a68]/15"
                />
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#0b5f51] text-white transition hover:bg-[#0a5145] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="إرسال"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-[9.5px] leading-4 text-[#8fa39d]">
                لا معلومة من خارج سجلاتك، ولا درجة نهائية دون تأكيد صريح. الصور والملفات تُقرأ عبر وكيل المستندات.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {formError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700">
                {formError}
              </div>
            ) : null}

            <section className="rounded-2xl border border-[#dbe6e2] bg-white p-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-[#0b1f1c]">
                <UserRound className="h-4 w-4 text-[#0e7a68]" />
                إضافة طالب
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={labelClass}>الاسم الكامل</label>
                  <input
                    className={inputClass}
                    value={studentForm.fullName}
                    onChange={event => setStudentForm(previous => ({ ...previous, fullName: event.target.value }))}
                    placeholder="مثال: سليم بن عمر"
                  />
                </div>
                <div>
                  <label className={labelClass}>القسم</label>
                  <input
                    className={inputClass}
                    value={studentForm.classId}
                    onChange={event => setStudentForm(previous => ({ ...previous, classId: event.target.value }))}
                    placeholder="مثال: 3م1"
                  />
                </div>
                <div>
                  <label className={labelClass}>المستوى</label>
                  <select
                    className={inputClass}
                    value={studentForm.level}
                    onChange={event => setStudentForm(previous => ({ ...previous, level: event.target.value }))}
                  >
                    {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>رقم القيد (اختياري)</label>
                  <input
                    className={inputClass}
                    value={studentForm.registrationNumber}
                    onChange={event => setStudentForm(previous => ({ ...previous, registrationNumber: event.target.value }))}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => void addStudent()}
                className="mt-2 flex cursor-pointer items-center gap-1 rounded-lg bg-[#0b5f51] px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-[#0a5145]"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة الطالب
              </button>

              {data?.students.length ? (
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto border-t border-[#eef4f2] pt-2 text-[10.5px] text-[#4d625c]">
                  {data.students.slice(-12).reverse().map(student => (
                    <li key={student.id} className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold text-[#20332e]">{student.fullName}</span>
                      <span className="shrink-0 text-[#7b8d88]">
                        {student.classId} · {LEVEL_LABELS[student.level] || student.level}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#dbe6e2] bg-white p-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-[#0b1f1c]">
                <ClipboardCheck className="h-4 w-4 text-[#0e7a68]" />
                فرض أو اختبار وسلّم تصحيحه
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={labelClass}>العنوان</label>
                  <input
                    className={inputClass}
                    value={assignmentForm.title}
                    onChange={event => setAssignmentForm(previous => ({ ...previous, title: event.target.value }))}
                    placeholder="مثال: الفرض المحروس الأول"
                  />
                </div>
                <div>
                  <label className={labelClass}>المستوى</label>
                  <select
                    className={inputClass}
                    value={assignmentForm.level}
                    onChange={event => setAssignmentForm(previous => ({ ...previous, level: event.target.value }))}
                  >
                    {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>القسم</label>
                  <input
                    className={inputClass}
                    value={assignmentForm.classId}
                    onChange={event => setAssignmentForm(previous => ({ ...previous, classId: event.target.value }))}
                    placeholder="مثال: 3م1"
                  />
                </div>
                <div>
                  <label className={labelClass}>المادة</label>
                  <input
                    className={inputClass}
                    value={assignmentForm.subject}
                    onChange={event => setAssignmentForm(previous => ({ ...previous, subject: event.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>تاريخ التسليم</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={assignmentForm.dueDate}
                    onChange={event => setAssignmentForm(previous => ({ ...previous, dueDate: event.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-2 space-y-1.5">
                {questionDrafts.map((draft, index) => (
                  <div key={draft.id} className="rounded-xl border border-[#eef4f2] bg-[#f9fbfa] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10.5px] font-extrabold text-[#5c716b]">السؤال {index + 1}</span>
                      {questionDrafts.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setQuestionDrafts(previous => previous.filter(item => item.id !== draft.id))}
                          className="cursor-pointer rounded-md border border-rose-200 bg-white p-1 text-rose-600"
                          aria-label={`حذف السؤال ${index + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                    <input
                      className={inputClass}
                      value={draft.text}
                      onChange={event =>
                        setQuestionDrafts(previous =>
                          previous.map(item => (item.id === draft.id ? { ...item, text: event.target.value } : item)),
                        )
                      }
                      placeholder="نص السؤال"
                    />
                    <div className="mt-1 grid grid-cols-[70px_1fr] gap-1.5">
                      <input
                        className={inputClass}
                        value={draft.points}
                        inputMode="decimal"
                        aria-label={`نقطة السؤال ${index + 1}`}
                        onChange={event =>
                          setQuestionDrafts(previous =>
                            previous.map(item => (item.id === draft.id ? { ...item, points: event.target.value } : item)),
                          )
                        }
                      />
                      <input
                        className={inputClass}
                        value={draft.keywords}
                        onChange={event =>
                          setQuestionDrafts(previous =>
                            previous.map(item => (item.id === draft.id ? { ...item, keywords: event.target.value } : item)),
                          )
                        }
                        placeholder="عناصر الإجابة المنتظرة مفصولة بفاصلة (لكل عنصر نقطة جزئية)"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setQuestionDrafts(previous => [...previous, emptyQuestion('1')])}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#dbe6e2] bg-white px-2 py-1 text-[10.5px] font-extrabold text-[#4d625c]"
                >
                  <Plus className="h-3 w-3" />
                  سؤال آخر
                </button>
              </div>

              <button
                type="button"
                onClick={() => void addAssignment()}
                className="mt-2 flex cursor-pointer items-center gap-1 rounded-lg bg-[#0b5f51] px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-[#0a5145]"
              >
                <Plus className="h-3.5 w-3.5" />
                حفظ الفرض والسلّم
              </button>

              {data?.assignments.length ? (
                <ul className="mt-2 space-y-1 border-t border-[#eef4f2] pt-2 text-[10.5px] text-[#4d625c]">
                  {data.assignments.slice(-8).reverse().map(assignment => (
                    <li key={assignment.id} className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold text-[#20332e]">{assignment.title}</span>
                      <span className="shrink-0 text-[#7b8d88]">
                        {assignment.questions.length} سؤالًا · {formatScore(assignment.totalPoints)} ن
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#dbe6e2] bg-white p-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-[#0b1f1c]">
                <Database className="h-4 w-4 text-[#0e7a68]" />
                تسجيل إجابة طالب
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>الفرض</label>
                  <select
                    className={inputClass}
                    value={submissionForm.assignmentId}
                    onChange={event => setSubmissionForm(previous => ({ ...previous, assignmentId: event.target.value }))}
                  >
                    <option value="">اختر…</option>
                    {data?.assignments.map(assignment => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>الطالب</label>
                  <select
                    className={inputClass}
                    value={submissionForm.studentId}
                    onChange={event => setSubmissionForm(previous => ({ ...previous, studentId: event.target.value }))}
                  >
                    <option value="">اختر…</option>
                    {data?.students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>نص الإجابة المستخرج من ورقة الطالب</label>
                  <textarea
                    className={`${inputClass} min-h-[86px] resize-y leading-5`}
                    value={submissionForm.answerText}
                    onChange={event => setSubmissionForm(previous => ({ ...previous, answerText: event.target.value }))}
                    placeholder="الصق هنا إجابة الطالب كما قرأتها من الورقة. لا تُخترع إجابة غير موجودة."
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => void addSubmission()}
                className="mt-2 flex cursor-pointer items-center gap-1 rounded-lg bg-[#0b5f51] px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-[#0a5145]"
              >
                <Plus className="h-3.5 w-3.5" />
                تسجيل الإجابة
              </button>
              <p className="mt-1.5 text-[10px] leading-5 text-[#7b8d88]">
                {data?.submissions.length || 0} إجابة مسجّلة. للصور والملفات استعمل وكيل المستندات ثم الصق النص هنا.
              </p>
            </section>

            <section className="rounded-2xl border border-[#dbe6e2] bg-white p-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-[#0b1f1c]">
                <ShieldCheck className="h-4 w-4 text-[#0e7a68]" />
                آخر القرارات والتنبيهات
              </h4>
              <ul className="space-y-1 text-[10.5px] text-[#4d625c]">
                {data?.notifications.slice(0, 5).map(notification => (
                  <li key={notification.id} className="rounded-lg border border-[#eef4f2] bg-[#f9fbfa] px-2 py-1">
                    {notification.message}
                  </li>
                ))}
                {!data?.notifications.length ? <li className="text-[#8fa39d]">لا تنبيهات بعد.</li> : null}
              </ul>
              <ul className="mt-1.5 space-y-1 text-[10px] text-[#7b8d88]">
                {data?.audit.slice(0, 5).map(entry => (
                  <li key={entry.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{entry.action}</span>
                    <span className="shrink-0 tabular-nums">{new Date(entry.at).toLocaleString('ar-DZ')}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
