import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileDown,
  FileText,
  FileUp,
  History,
  Info,
  Loader2,
  PencilLine,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { AssessmentStore as LocalQuestionStore } from '../assessment/assessmentStore';
import { EMPTY_ASSESSMENT } from '../assessment/types';
import { LessonMemo, MemoConfig } from '../types';
import {
  ASSESSMENT_LEVELS,
  ASSESSMENT_STATUSES,
  AssessmentExam,
  AssessmentLevelCode,
  AssessmentStatus,
  addExamExercise,
  createAssessmentExam,
  duplicateAssessmentExam,
  examCounts,
  examMaqta,
  examMawrid,
  flattenRefs,
  interpretAssessmentCommand,
  setExamMaqta,
  levelLabelOf,
  makeStudentResult,
  missingAnswers,
  moveExamExercise,
  partOneExercises,
  rebalanceExamPoints,
  removeExamExercise,
  restoreExamVersion,
  setExamType,
  snapshotExam,
  studentScore20,
  studentTotal,
  touchExam,
  updateStudentScore,
} from '../services/assessmentModel';
import {
  AssessmentLibrary,
  emptyAssessmentLibrary,
  loadAssessmentLibrary,
  removeExam,
  saveAssessmentLibrary,
  upsertExam,
} from '../services/assessmentStore';
import {
  RemediationRow,
  applyAnalysisToMemo,
  buildAnalysisNarrative,
  buildRemediationPlan,
  computeExamStats,
  detectRecurringErrors,
} from '../services/assessmentAnalysis';
import {
  buildRemediationAssistantPrompt,
  generateExamAnswers,
  proposeNextExercise,
  ThirdExerciseProposal,
} from '../services/assessmentLocal';
import {
  CorrectionExercise,
  CorrectionMemoData,
  fillFromPlatform,
  formatPoints,
  toNumber,
  validateCorrectionMemo,
} from '../services/correctionMemoModel';
import { enrichCorrectionMemoFromDb } from '../services/correctionMemoEnrich';
import {
  importCorrectionFile,
  isSupportedCorrectionFile,
  readFileAsDataUrl,
} from '../services/correctionMemoImport';
import {
  exportCorrectionMemoDataToDocx,
  exportCorrectionMemoToPdf,
  printCorrectionMemo,
} from '../utils/correctionMemoExport';
import { CorrectionMemoSheet } from './CorrectionMemoSheet';
import { AssessmentExamPaper } from './AssessmentPaper';

type Tab = 'exams' | 'editor' | 'memo' | 'results' | 'analysis';
type Busy = 'import' | 'answers' | 'propose' | 'export' | 'word';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'exams', label: 'الاختبارات' },
  { id: 'editor', label: 'الاختبار' },
  { id: 'memo', label: 'مذكرة التصحيح' },
  { id: 'results', label: 'النتائج' },
  { id: 'analysis', label: 'التحليل' },
];

const STATUS_STYLE: Record<AssessmentStatus, string> = {
  'مسودة': 'bg-slate-100 text-slate-700 border-slate-200',
  'جاهز': 'bg-sky-50 text-sky-800 border-sky-200',
  'تم التصحيح': 'bg-amber-50 text-amber-800 border-amber-200',
  'تم التحليل': 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const clone = <T,>(value: T): T => {
  const structured = (globalThis as any)?.structuredClone;
  if (typeof structured === 'function') return structured(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('ar-DZ', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const nowIso = () => new Date().toISOString();

interface ImportStep {
  step: 'reading' | 'analyzing' | 'enriching' | 'ready' | 'error';
  fileName: string;
}

export interface AssessmentHubProps {
  config: MemoConfig;
  curriculumLessons: LessonMemo[];
  initialLevel?: AssessmentLevelCode;
  onOpenAssistant: (context: {
    prompt: string;
    level?: string;
    maqta?: string;
    mawrid?: string;
    error?: string;
    successRate?: string | number;
  }) => void;
  showToast: (message: string) => void;
  currentLesson?: LessonMemo | null;
  assessmentOwner?: string;
  onOpenLocalAssessment?: () => void;
}

const StatCard: React.FC<{ label: string; value: string; hint?: string; tone?: string }> = ({ label, value, hint, tone = 'text-white' }) => (
  <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2 backdrop-blur-[2px]">
    <p className="text-[9.5px] font-bold text-white/55">{label}</p>
    <p className={`mt-0.5 text-[17px] font-black tabular-nums ${tone}`}>{value}</p>
    {hint && <p className="text-[9px] text-white/45">{hint}</p>}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block space-y-1">
    <span className="text-[10.5px] font-extrabold text-slate-500">{label}</span>
    {children}
    {hint && <span className="block text-[9.5px] text-slate-400">{hint}</span>}
  </label>
);

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500';

const StatusBadge: React.FC<{ status: AssessmentStatus }> = ({ status }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9.5px] font-black ${STATUS_STYLE[status]}`}>
    {status}
  </span>
);

export const AssessmentHub: React.FC<AssessmentHubProps> = ({
  config,
  curriculumLessons,
  initialLevel,
  onOpenAssistant,
  showToast, currentLesson, assessmentOwner, onOpenLocalAssessment,
}) => {
  const questionStore = useMemo(() => new LocalQuestionStore(assessmentOwner || 'local'), [assessmentOwner]);
  const [library, setLibrary] = useState<AssessmentLibrary>(() => emptyAssessmentLibrary());
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [tab, setTab] = useState<Tab>('exams');
  const [activeExamId, setActiveExamId] = useState('');
  const [busy, setBusy] = useState<Busy | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(null);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkNames, setBulkNames] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [expandedResult, setExpandedResult] = useState('');
  const [proposal, setProposal] = useState<ThirdExerciseProposal | null>(null);
  const [importStep, setImportStep] = useState<ImportStep | null>(null);
  const [answerTarget, setAnswerTarget] = useState('all');
  const [command, setCommand] = useState('');
  const [form, setForm] = useState({
    examType: 'اختبار' as 'فرض' | 'اختبار',
    level: (initialLevel || config.level || '4am') as AssessmentLevelCode,
    title: '',
    className: '',
    term: 'الفصل الأول',
    duration: 'ساعة واحدة',
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    let active = true;
    void loadAssessmentLibrary().then(stored => {
      if (!active) return;
      setLibrary(stored);
      setActiveExamId(stored.lastActiveExamId);
      setReady(true);
      hydrated.current = true;
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      void saveAssessmentLibrary(library);
      setSavedAt(new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [library]);

  const exam = useMemo(
    () => library.exams.find(item => item.id === activeExamId) || null,
    [library.exams, activeExamId],
  );

  useEffect(() => {
    if (!exam) return;
    const exerciseId = exam.memo.exercises.find(item => item.part === 1)?.id || '';
    setSelectedExerciseId(previous => (exam.memo.exercises.some(item => item.id === previous) ? previous : exerciseId));
  }, [exam?.id]);

  const stats = useMemo(() => (exam ? computeExamStats(exam) : null), [exam]);
  const errors = useMemo(() => (exam ? detectRecurringErrors(exam, stats || undefined) : []), [exam, stats]);
  const plan = useMemo(() => (exam ? buildRemediationPlan(exam, errors) : []), [exam, errors]);
  const narrative = useMemo(() => (exam && stats ? buildAnalysisNarrative(exam, stats, errors) : []), [exam, stats, errors]);
  const warnings = useMemo(() => (exam ? validateCorrectionMemo(exam.memo) : []), [exam]);
  const missing = useMemo(() => (exam ? missingAnswers(exam) : []), [exam]);

  const overview = useMemo(() => {
    const exams = library.exams;
    const graded = exams.map(computeExamStats).filter(item => item.hasData);
    const names = new Set<string>();
    exams.forEach(item => item.results.forEach(result => {
      const name = result.studentName.trim();
      if (name) names.add(name);
    }));
    const gradedCount = graded.reduce((sum, item) => sum + item.graded, 0);
    const passCount = graded.reduce((sum, item) => sum + item.passCount, 0);
    const average = gradedCount
      ? round2(graded.reduce((sum, item) => sum + item.average20 * item.graded, 0) / gradedCount)
      : 0;
    const latest = [...exams].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return {
      count: exams.length,
      students: names.size || exams.reduce((sum, item) => sum + item.results.length, 0),
      average,
      passRate: gradedCount ? round2((passCount / gradedCount) * 100) : 0,
      latest: latest ? formatDate(latest.updatedAt) : '—',
    };
  }, [library.exams]);

  const filteredExams = useMemo(() => {
    const value = query.trim();
    return [...library.exams]
      .filter(item => (levelFilter === 'all' ? true : item.level === levelFilter))
      .filter(item => !value
        || item.title.includes(value)
        || examMaqta(item).includes(value)
        || item.className.includes(value)
        || examMawrid(item).includes(value))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [library.exams, levelFilter, query]);

  const selectedExercise = useMemo(() => {
    if (!exam) return null;
    return exam.memo.exercises.find(item => item.id === selectedExerciseId)
      || partOneExercises(exam)[0]
      || null;
  }, [exam, selectedExerciseId]);

  const commitExam = useCallback((next: AssessmentExam, message?: string, tone: 'ok' | 'warn' | 'error' = 'ok') => {
    setLibrary(current => upsertExam(current, next));
    setActiveExamId(next.id);
    if (message) setNotice({ tone, text: message });
  }, []);

  const updateActive = useCallback((updater: (current: AssessmentExam) => AssessmentExam) => {
    setLibrary(current => {
      const target = current.exams.find(item => item.id === activeExamId);
      if (!target) return current;
      return upsertExam(current, updater(target));
    });
  }, [activeExamId]);

  const mutateMemo = useCallback((updater: (draft: CorrectionMemoData) => void) => {
    updateActive(current => {
      const draft = clone(current.memo);
      updater(draft);
      const updatedAt = nowIso();
      draft.updatedAt = updatedAt;
      return { ...current, memo: draft, updatedAt };
    });
  }, [updateActive]);

  const patchExercise = (exerciseId: string, patch: Partial<CorrectionExercise>) => {
    mutateMemo(draft => {
      const target = draft.exercises.find(item => item.id === exerciseId);
      if (target) Object.assign(target, patch);
    });
  };

  const openExam = (id: string, target: Tab = 'editor') => {
    setActiveExamId(id);
    setTab(target);
  };

  const handleCreate = () => {
    const created = createAssessmentExam({
      examType: form.examType,
      level: form.level,
      title: form.title,
      className: form.className,
      term: form.term,
      duration: form.duration,
      schoolYear: config.schoolYear,
      config,
    });
    const filled = fillFromPlatform(created.memo, { config, curriculum: curriculumLessons });
    created.memo = filled.data;
    commitExam(created, 'أُنشئ الاختبار كمسودة. حرّر التمارين أو استورد ورقة جاهزة.', 'ok');
    setShowCreate(false);
    setTab('editor');
    setForm(previous => ({ ...previous, title: '', className: '' }));
  };

  const openCreate = () => {
    setForm({
      examType: 'اختبار',
      level: (initialLevel || config.level || '4am') as AssessmentLevelCode,
      title: '',
      className: '',
      term: 'الفصل الأول',
      duration: 'ساعة واحدة',
    });
    setShowCreate(true);
  };

  const handleDelete = (target: AssessmentExam) => {
    if (!window.confirm(`حذف «${target.title}» نهائيًا مع نتائجه ونسخه؟`)) return;
    setLibrary(current => removeExam(current, target.id));
    if (activeExamId === target.id) {
      setActiveExamId('');
      setTab('exams');
    }
    setNotice({ tone: 'warn', text: 'حُذف الاختبار من هذا الجهاز.' });
  };

  const handleDuplicate = (target: AssessmentExam) => {
    const copy = duplicateAssessmentExam(target, 'نسخة');
    commitExam(copy, 'حُفظت نسخة جديدة مستقلة، والأصل لم يتغير.', 'ok');
    setTab('editor');
  };

  const handleImportFile = async (file: File) => {
    if (!isSupportedCorrectionFile(file)) {
      setNotice({ tone: 'error', text: 'نوع الملف غير مدعوم. المدعوم: صورة، PDF، Word (.docx)، أو TXT.' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setNotice({ tone: 'error', text: 'حجم الملف يتجاوز 20 ميغابايت.' });
      return;
    }
    setBusy('import');
    setNotice(null);
    setImportStep({ step: 'reading', fileName: file.name });

    try {
      const base = exam || createAssessmentExam({
        examType: 'اختبار',
        level: (initialLevel || config.level || '4am') as AssessmentLevelCode,
        term: 'الفصل الأول',
        schoolYear: config.schoolYear,
        config,
      });
      const dataUrl = await readFileAsDataUrl(file);
      setImportStep({ step: 'analyzing', fileName: file.name });
      const outcome = await importCorrectionFile({
        file,
        dataUrl,
        examType: base.examType,
        current: base.memo,
        config,
        viaAgent: true,
      });
      setImportStep({ step: 'enriching', fileName: file.name });
      const filled = fillFromPlatform(outcome.data, { config, curriculum: curriculumLessons });
      const enriched = enrichCorrectionMemoFromDb(filled.data, { curriculum: curriculumLessons });
      const imported: AssessmentExam = {
        ...base,
        memo: enriched.data,
        sourceFileName: file.name,
        status: 'مسودة',
        updatedAt: nowIso(),
      };
      setImportStep({ step: 'ready', fileName: file.name });
      commitExam(
        imported,
        `تم تحليل الوثيقة: ${outcome.extractedExercises} تمارين · ${outcome.extractedQuestions} سؤالًا. ${outcome.notice}`,
        'ok',
      );
      setTab('editor');
    } catch (error) {
      console.error('[assessment] import failed', error);
      setImportStep({ step: 'error', fileName: file.name });
      setNotice({ tone: 'error', text: 'تعذر استرداد الملف. أعد المحاولة أو أدخل الأسئلة يدويًا.' });
    } finally {
      setBusy(null);
    }
  };

  const saveVersion = () => {
    if (!exam) return;
    updateActive(current => snapshotExam(current, 'حفظ يدوي'));
    setNotice({ tone: 'ok', text: 'حُفظت نسخة من الاختبار ومذكرته. يمكنك العودة إليها من سجل النسخ.' });
    showToast('حُفظت نسخة من الاختبار');
  };

  const handleRedistribute = () => {
    if (!exam) return;
    if (!window.confirm('إعادة توزيع التنقيط على 20 قد تغيّر نقاط الأسئلة الحالية. سيُحفظ الوضع الحالي كنسخة أولًا. متابعة؟')) return;
    updateActive(current => rebalanceExamPoints(snapshotExam(current, 'قبل إعادة التوزيع')));
    setNotice({ tone: 'ok', text: 'أُعيد توزيع التنقيط على 20 (الاختبار: 12 + وضعية 8، الفرض: 20) مع حفظ نسخة سابقة.' });
  };

  const handleAddManualExercise = () => {
    if (!exam) return;
    updateActive(current => addExamExercise(current, {
      label: `التمرين ${partOneExercises(current).length + 1}`,
      source: 'teacher',
      questions: [{ text: '', expected: '', points: '' }],
    }));
    setNotice({ tone: 'ok', text: 'أُضيف تمرين جديد. حرّر أسئلته وأعد توزيع النقاط عند الحاجة.' });
  };

  const handlePropose = async () => {
    if (!exam || busy) return;
    setBusy('propose'); setNotice(null);
    try {
      const outcome = await proposeNextExercise(exam, curriculumLessons, currentLesson, questionStore);
      if (!outcome.proposal) { setNotice({tone:'warn',text:outcome.error || EMPTY_ASSESSMENT}); return; }
      setProposal(outcome.proposal);
    } catch { setNotice({tone:'warn',text:EMPTY_ASSESSMENT}); }
    finally { setBusy(null); }
  };

  const applyProposal = async () => {
    if (!exam || !proposal || busy) return;
    setBusy('propose');
    try { await questionStore.save(proposal.bankRecord); } catch (error) { setNotice({ tone:'warn', text: error instanceof Error ? error.message : EMPTY_ASSESSMENT }); setBusy(null); return; }
    updateActive(current => addExamExercise(snapshotExam(current, 'قبل إضافة تمرين'), proposal));
    setProposal(null);
    setNotice({ tone: 'ok', text: 'اعتُمد التمرين المقترح وأُعيد توزيع النقاط على 20. راجع الإجابات قبل الاعتماد النهائي.' });
    showToast('اعتُمد التمرين الجديد'); setBusy(null);
  };

  const handleGenerateAnswers = async () => {
    if (!exam) return;
    setBusy('answers');
    setNotice(null);
    const outcome = await generateExamAnswers(
      exam,
      curriculumLessons,
      currentLesson,
      answerTarget === 'all' ? undefined : answerTarget,
      questionStore,
    );
    setBusy(null);
    if (!outcome) {
      setNotice({ tone: 'warn', text: EMPTY_ASSESSMENT });
      return;
    }
    updateActive(current => ({ ...current, memo: { ...outcome.memo, updatedAt: nowIso() }, updatedAt: nowIso() }));
    setNotice({
      tone: 'ok',
      text: `وصلت ${outcome.result.suggestions.length} مقترحات وطُبّق ${outcome.applied} عنصرًا في الخانات غير المحرَّرة يدويًا.${outcome.skipped ? ` تُرك ${outcome.skipped} عنصرًا محميًا.` : ''}`,
    });
  };

  const handleWord = async () => {
    if (!exam) return;
    setBusy('word');
    try {
      await exportCorrectionMemoDataToDocx(exam.memo, { allowFallback: true });
      setNotice({ tone: 'ok', text: 'صُدّرت مذكرة التصحيح بصيغة Word.' });
    } catch (error) {
      console.error('[assessment] word export failed', error);
      setNotice({ tone: 'error', text: 'تعذر تصدير المذكرة إلى Word.' });
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    if (!exam) return;
    if (!sheetRef.current) {
      setTab('memo');
      setNotice({ tone: 'warn', text: 'افتح تبويب مذكرة التصحيح ثم أعد المحاولة.' });
      return;
    }
    setBusy('export');
    try {
      await exportCorrectionMemoToPdf(sheetRef.current, exam.memo.title);
      setNotice({ tone: 'ok', text: 'صُدّرت المذكرة بصيغة PDF.' });
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = () => {
    if (!exam) return;
    if (!sheetRef.current) {
      setTab('memo');
      return;
    }
    printCorrectionMemo(sheetRef.current, exam.memo.title);
  };

  const handleCommand = () => {
    if (!exam || !command.trim()) return;
    const parsed = interpretAssessmentCommand(command);
    setCommand('');
    if (parsed.intent === 'add-exercise') {
      void handlePropose();
      setNotice({ tone: 'ok', text: 'سأقترح تمرينًا إضافيًا مرتبطًا بنفس المقطع والمورد، دون تكرار مهارات التمارين الحالية.' });
      return;
    }
    if (parsed.intent === 'redistribute') {
      handleRedistribute();
      return;
    }
    if (parsed.intent === 'answers') {
      void handleGenerateAnswers();
      return;
    }
    if (parsed.intent === 'add-question') {
      if (selectedExercise) {
        const number = String(selectedExercise.questions.length + 1);
        mutateMemo(draft => {
          const target = draft.exercises.find(item => item.id === selectedExercise.id);
          if (target) target.questions.push({ id: `q-${Date.now().toString(36)}`, number, text: '', points: '', expected: '', source: 'teacher', needsReview: false });
        });
        setNotice({ tone: 'ok', text: 'أُضيف سؤال جديد في التمرين المحدد.' });
        return;
      }
    }
    if (parsed.intent === 'analyze') {
      setTab('analysis');
      return;
    }
    setNotice({
      tone: 'warn',
      text: 'لم أفهم الطلب. جرّب: «أضف تمرينًا ثالثًا» · «أعد توزيع النقاط على 20» · «أعد توليد الإجابات» · «حلّل النتائج».',
    });
  };

  const askAssistantPlan = (row: RemediationRow) => {
    if (!exam) return;
    onOpenAssistant({
      prompt: buildRemediationAssistantPrompt(exam, {
        resource: row.resource,
        difficulty: row.difficulty,
        learners: row.learners,
        achievement: row.achievement,
      }),
      level: exam.level,
      maqta: examMaqta(exam),
      mawrid: row.resource,
      error: row.difficulty,
      successRate: row.achievement,
    });
  };

  // Explicit navigation only: question creation never invokes the general assistant.
  const askAssistantGeneral = () => onOpenAssistant({prompt:''});

  const addStudent = () => {
    updateActive(current => ({ ...current, results: [...current.results, makeStudentResult()], updatedAt: nowIso() }));
  };

  const addBulkStudents = () => {
    const names = bulkNames.split(/\n|,/).map(value => value.trim()).filter(Boolean).slice(0, 100);
    if (!names.length) return;
    updateActive(current => ({
      ...current,
      results: [...current.results, ...names.map(name => makeStudentResult(name))],
      updatedAt: nowIso(),
    }));
    setBulkNames('');
    setShowBulk(false);
    setNotice({ tone: 'ok', text: `أُضيف ${names.length} تلميذًا إلى القائمة.` });
  };

  const applyAnalysis = () => {
    if (!exam || !stats) return;
    const next = applyAnalysisToMemo(exam, stats, errors, plan);
    commitExam(next, 'نُقل التحليل وخطة المعالجة إلى مذكرة التصحيح لتُطبع معها.', 'ok');
    setTab('memo');
  };

  const importStepper = importStep && (
    <div className="rounded-2xl border border-teal-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          {importStep.step === 'error' ? <AlertTriangle className="h-4 w-4" /> : importStep.step === 'ready' ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-black text-slate-900">
            {importStep.step === 'reading' && 'جارٍ قراءة الوثيقة…'}
            {importStep.step === 'analyzing' && 'تم استلام الملف — جارٍ تحليل الأسئلة والنقاط…'}
            {importStep.step === 'enriching' && 'ربط الأسئلة بقاعدة المنهاج والمقطع…'}
            {importStep.step === 'ready' && 'تم تحليل الوثيقة'}
            {importStep.step === 'error' && 'تعذر تحليل الوثيقة'}
          </p>
          <p className="truncate text-[10.5px] text-slate-500">{importStep.fileName}</p>
          {importStep.step === 'ready' && (
            <p className="mt-0.5 text-[10.5px] font-bold text-teal-700">راجع التمارين والأسئلة قبل الاعتماد، ثم أكمل الإجابات والتنقيط.</p>
          )}
        </div>
        <button type="button" onClick={() => setImportStep(null)} aria-label="إغلاق" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const emptyState = (
    <div className="rounded-3xl border border-dashed border-[#cfe0da] bg-white px-5 py-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef5f2] text-[#0e7a68]">
        <ClipboardList className="h-7 w-7" />
      </span>
      <h3 className="mt-3 text-[15px] font-black text-slate-900">لا توجد اختبارات بعد</h3>
      <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-relaxed text-slate-500">
        أنشئ اختبارًا جديدًا أو استورد ورقة جاهزة (PDF، Word، صورة) ليقرأها المساعد ويعبّئ القالب تلقائيًا.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7a68] px-3.5 py-2 text-[12px] font-black text-white hover:bg-[#0b6a5a]">
          <Plus className="h-4 w-4" /> إنشاء أول اختبار
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-[#cfe0da] bg-white px-3.5 py-2 text-[12px] font-black text-[#0a5f51] hover:bg-[#f5faf8]">
          <FileUp className="h-4 w-4" /> استيراد ورقة
        </button>
      </div>
    </div>
  );

  return (
    <main id="main-content" className="flex-1 w-full overflow-x-hidden bg-[#f6f9f8]">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-3 py-4 sm:px-5 sm:py-6 lg:px-7">

        <section className="overflow-hidden rounded-3xl border border-[#0b1f1c]/10 bg-[#0b1f1c] p-4 text-white sm:p-6">
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10.5px] font-black text-[#f0d492]">
                <ClipboardCheck className="h-3.5 w-3.5" /> التقويم
              </span>
              <h1 className="mt-2 text-xl font-black sm:text-2xl">التقويم</h1>
              <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-white/70 sm:text-[12.5px]">
                إدارة الاختبارات والنتائج والتحليل والمعالجة في مكان واحد. أضف، صحّح، حلّل، ثم اقترح المعالجة — والأستاذ صاحب القرار.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {onOpenLocalAssessment && <button type="button" onClick={onOpenLocalAssessment} className="rounded-xl border border-white/30 px-3 py-2 text-xs font-bold">التقويم من المذكرة وبنك الأسئلة</button>}
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-[#f0d492] px-3 py-2 text-[11.5px] font-black text-[#0b1f1c] hover:brightness-105">
                <Plus className="h-4 w-4" /> إنشاء اختبار
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy === 'import'} className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11.5px] font-black text-white hover:bg-white/15 disabled:opacity-50">
                {busy === 'import' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} استيراد ورقة
              </button>
              <button type="button" onClick={askAssistantGeneral} className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-[11.5px] font-black text-white/90 hover:bg-white/15">
                <Bot className="h-4 w-4" /> فتح المساعد العام
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="عدد الاختبارات" value={String(overview.count)} />
            <StatCard label="آخر تعديل" value={overview.latest} hint="اختبار" />
            <StatCard label="عدد التلاميذ" value={String(overview.students)} hint="في كل الاختبارات" />
            <StatCard label="متوسط القسم" value={overview.average ? `${overview.average}/20` : '—'} tone="text-[#f0d492]" />
            <StatCard label="نسبة النجاح" value={overview.passRate ? `${overview.passRate}%` : '—'} tone="text-emerald-200" />
          </div>
        </section>

        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.txt,.docx,.doc,image/jpeg,image/png,image/webp,image/gif"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void handleImportFile(file);
          }}
        />

        {importStepper}

        {notice && (
          <div className={`flex items-start gap-2 rounded-2xl border px-3 py-2 text-[11.5px] font-bold ${
            notice.tone === 'ok'
              ? 'border-teal-200 bg-teal-50 text-teal-900'
              : notice.tone === 'warn'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-red-200 bg-red-50 text-red-800'
          }`}
          >
            {notice.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="flex-1">{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="إغلاق" className="rounded p-0.5 hover:bg-black/5"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <nav aria-label="تبويبات التقويم" className="flex items-center gap-0.5 overflow-x-auto rounded-2xl border border-[#e2e8e5] bg-white p-1">
          {TABS.map(item => {
            const disabled = item.id !== 'exams' && !exam;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-[11.5px] font-black transition ${
                  tab === item.id
                    ? 'bg-[#0e7a68] text-white shadow-sm'
                    : disabled
                      ? 'text-slate-300'
                      : 'text-slate-600 hover:bg-[#f1f6f4] hover:text-[#0a5f51]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <span className="mr-auto hidden shrink-0 items-center gap-1 px-2 text-[9.5px] text-slate-400 sm:flex">
            <Save className="h-3 w-3" /> {savedAt ? `حفظ محلي ${savedAt}` : 'حفظ تلقائي'}
          </span>
        </nav>

        {tab === 'exams' && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e2e8e5] bg-white p-2.5">
              <div className="relative min-w-[190px] flex-1">
                <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="ابحث بعنوان الاختبار، المقطع، أو القسم…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-2 text-[11.5px] font-bold focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
              <select value={levelFilter} onChange={event => setLevelFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700">
                <option value="all">كل المستويات</option>
                {ASSESSMENT_LEVELS.map(level => <option key={level.code} value={level.code}>{level.label}</option>)}
              </select>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{filteredExams.length} اختبار</span>
            </div>

            {!ready ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map(index => <div key={index} className="h-40 animate-pulse rounded-2xl border border-[#e2e8e5] bg-white" />)}
              </div>
            ) : filteredExams.length === 0 ? emptyState : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredExams.map(item => {
                  const counts = examCounts(item);
                  return (
                    <article key={item.id} className="flex flex-col rounded-2xl border border-[#e2e8e5] bg-white p-3.5 shadow-[0_1px_2px_rgba(11,31,28,0.04)] transition hover:border-[#bfd8d0] hover:shadow-[0_8px_24px_-20px_rgba(11,31,28,0.6)]">
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => openExam(item.id)} className="min-w-0 text-right">
                          <h3 className="truncate text-[13px] font-black text-slate-900 hover:text-[#0a5f51]">{item.title}</h3>
                          <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                            {levelLabelOf(item.level)} · علوم الطبيعة والحياة{examMaqta(item) ? ` · ${examMaqta(item)}` : ''}
                          </p>
                        </button>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-[#f6faf8] p-1.5 text-center">
                        <span className="text-[9.5px] text-slate-500">التمارين<b className="block text-[12px] font-black tabular-nums text-slate-900">{counts.exercises}</b></span>
                        <span className="text-[9.5px] text-slate-500">الأسئلة<b className="block text-[12px] font-black tabular-nums text-slate-900">{counts.questions}</b></span>
                        <span className="text-[9.5px] text-slate-500">النقاط<b className="block text-[12px] font-black tabular-nums text-slate-900">{formatPoints(counts.points)}</b></span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[9.5px] text-slate-400">
                        <span className="truncate">{item.className || 'بلا قسم'} · {item.duration || 'مدة غير محددة'}</span>
                        <span className="shrink-0 tabular-nums">{item.results.length} تلميذًا</span>
                      </div>
                      <div className="mt-0.5 text-[9.5px] text-slate-400">آخر تعديل: {formatDate(item.updatedAt)}</div>

                      <div className="mt-auto flex items-center gap-1.5 pt-3">
                        <button type="button" onClick={() => openExam(item.id, 'editor')} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#0e7a68] px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-[#0b6a5a]">
                          <PencilLine className="h-3.5 w-3.5" /> فتح
                        </button>
                        <button type="button" onClick={() => openExam(item.id, 'memo')} className="rounded-xl border border-[#e2e8e5] bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50" title="مذكرة التصحيح">
                          المذكرة
                        </button>
                        <button type="button" onClick={() => handleDuplicate(item)} aria-label="حفظ كنسخة" title="حفظ كنسخة" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(item)} aria-label="حذف" title="حذف" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'editor' && exam && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#e2e8e5] bg-white p-2.5">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5">
                {(['اختبار', 'فرض'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (type === exam.examType) return;
                      updateActive(current => rebalanceExamPoints(setExamType(snapshotExam(current, 'قبل تغيير نوع الورقة'), type)));
                      setNotice({ tone: 'ok', text: type === 'اختبار' ? 'حُوّلت الورقة إلى اختبار: تمرينان + وضعية إدماجية.' : 'حُوّلت الورقة إلى فرض: تمارين فقط من 20.' });
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[10.5px] font-black ${exam.examType === type ? 'bg-[#0e7a68] text-white' : 'text-slate-600'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <span className="rounded-lg bg-[#f6faf8] px-2 py-1 text-[10px] font-bold text-slate-500">
                {examCounts(exam).exercises} تمارين · {examCounts(exam).questions} سؤالًا · {formatPoints(examCounts(exam).points)} ن
              </span>
              <span className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:block" />
              <button type="button" onClick={handleAddManualExercise} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                <Plus className="h-3.5 w-3.5" /> تمرين
              </button>
              <button type="button" onClick={handlePropose} disabled={busy === 'propose'} className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-black text-amber-900 hover:bg-amber-100 disabled:opacity-50">
                {busy === 'propose' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} اقترح تمرينًا
              </button>
              <button type="button" onClick={handleRedistribute} className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-black text-indigo-900 hover:bg-indigo-100">
                <RefreshCw className="h-3.5 w-3.5" /> وزّع على 20
              </button>
              <button type="button" onClick={saveVersion} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                <Save className="h-3.5 w-3.5" /> حفظ نسخة
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                <FileUp className="h-3.5 w-3.5" /> استيراد
              </button>
              <button type="button" onClick={() => setShowHistory(value => !value)} className="mr-auto inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[10.5px] font-bold text-slate-500 hover:bg-slate-100">
                <History className="h-3.5 w-3.5" /> النسخ ({exam.versions.length})
              </button>
            </div>

            {proposal && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-black text-amber-900">اقتراح: {proposal.label} — لم يُعتمد بعد</p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-amber-800">{proposal.rationale || 'تمرين مكمّل بنفس المقطع والمورد.'}</p>
                  </div>
                  <button type="button" onClick={() => setProposal(null)} aria-label="تجاهل" className="rounded p-1 text-amber-700 hover:bg-amber-100"><X className="h-4 w-4" /></button>
                </div>
                <ol className="mt-2 space-y-1">
                  {proposal.questions.map((question, index) => (
                    <li key={index} className="rounded-xl border border-amber-100 bg-white px-2.5 py-1.5 text-[11px] text-slate-700">
                      <span className="font-black">{index + 1}) </span>{question.text}
                      {question.points && <span className="mr-1 text-[9.5px] font-bold text-slate-500">({question.points} ن)</span>}
                      {question.expected && <span className="mt-0.5 block text-[10px] text-emerald-800">الإجابة: {question.expected}</span>}
                    </li>
                  ))}
                </ol>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={applyProposal} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-[11px] font-black text-white hover:bg-emerald-800">
                    <Check className="h-3.5 w-3.5" /> اعتماد التمرين
                  </button>
                  <span className="text-[9.5px] text-amber-800">الاعتماد يعيد توزيع النقاط على 20 ويحفظ نسخة سابقة.</span>
                </div>
              </div>
            )}

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-x-auto rounded-2xl border border-[#e2e8e5] bg-[#eef3f1] p-2 sm:p-3">
                <div className="mx-auto min-w-[560px] max-w-[210mm] bg-white shadow-[0_10px_30px_-24px_rgba(11,31,28,0.8)]">
                  <AssessmentExamPaper exam={exam} />
                </div>
              </div>

              <aside className="space-y-2.5">
                <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[12px] font-black text-slate-900">معلومات الاختبار</h3>
                    <select
                      value={exam.status}
                      onChange={event => updateActive(current => touchExam(current, { status: event.target.value as AssessmentStatus }))}
                      className="rounded-lg border border-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-700"
                    >
                      {ASSESSMENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Field label="عنوان الاختبار">
                      <input value={exam.title} onChange={event => updateActive(current => touchExam(current, { title: event.target.value }))} className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="المستوى">
                        <select
                          value={exam.level}
                          onChange={event => {
                            const level = event.target.value as AssessmentLevelCode;
                            updateActive(current => ({ ...current, level, memo: { ...current.memo, level: levelLabelOf(level) }, updatedAt: nowIso() }));
                          }}
                          className={inputClass}
                        >
                          {ASSESSMENT_LEVELS.map(level => <option key={level.code} value={level.code}>{level.label}</option>)}
                        </select>
                      </Field>
                      <Field label="القسم">
                        <input value={exam.className} onChange={event => updateActive(current => touchExam(current, { className: event.target.value }))} placeholder="3م1" className={inputClass} />
                      </Field>
                      <Field label="الفصل">
                        <input value={exam.term} onChange={event => updateActive(current => touchExam(current, { term: event.target.value }))} className={inputClass} />
                      </Field>
                      <Field label="المدة">
                        <input value={exam.duration} onChange={event => updateActive(current => touchExam(current, { duration: event.target.value }))} className={inputClass} />
                      </Field>
                      <Field label="السنة الدراسية">
                        <input value={exam.schoolYear} onChange={event => updateActive(current => touchExam(current, { schoolYear: event.target.value }))} placeholder={config.schoolYear || '2025/2026'} className={inputClass} />
                      </Field>
                      <Field label="المقطع">
                        <input value={examMaqta(exam)} onChange={event => updateActive(current => setExamMaqta(current, event.target.value))} className={inputClass} />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                  <h3 className="mb-2 text-[12px] font-black text-slate-900">التمارين</h3>
                  <div className="space-y-1">
                    {partOneExercises(exam).map((exercise, index) => (
                      <div key={exercise.id} className={`flex items-center gap-1 rounded-xl border px-2 py-1.5 ${selectedExercise?.id === exercise.id ? 'border-teal-300 bg-teal-50/60' : 'border-transparent hover:bg-slate-50'}`}>
                        <button type="button" onClick={() => setSelectedExerciseId(exercise.id)} className="min-w-0 flex-1 text-right">
                          <span className="block truncate text-[11.5px] font-black text-slate-800">{exercise.label || `التمرين ${index + 1}`}</span>
                          <span className="text-[9.5px] text-slate-500">{exercise.questions.length} أسئلة · {formatPoints(toNumber(exercise.declaredPoints))} ن</span>
                        </button>
                        <button type="button" onClick={() => updateActive(current => moveExamExercise(current, exercise.id, -1))} aria-label="تحريك لأعلى" className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700"><ArrowUp className="h-3 w-3" /></button>
                        <button type="button" onClick={() => updateActive(current => moveExamExercise(current, exercise.id, 1))} aria-label="تحريك لأسفل" className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700"><ArrowDown className="h-3 w-3" /></button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm(`حذف ${exercise.label} بكل أسئلته؟`)) return;
                            updateActive(current => removeExamExercise(current, exercise.id));
                          }}
                          aria-label="حذف التمرين"
                          className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {partOneExercises(exam).length < 3 && (
                    <button type="button" onClick={handlePropose} disabled={busy === 'propose'} className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 px-2 py-1.5 text-[10.5px] font-black text-teal-900 hover:bg-teal-50 disabled:opacity-50">
                      <Sparkles className="h-3.5 w-3.5" /> أضف التمرين {partOneExercises(exam).length + 1} من بنك التقويم
                    </button>
                  )}
                </div>

                {selectedExercise && (
                  <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[12px] font-black text-slate-900">تحرير {selectedExercise.label}</h3>
                      <span className="text-[9.5px] font-bold text-slate-500">{formatPoints(toNumber(selectedExercise.declaredPoints))} ن</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="اسم التمرين">
                        <input value={selectedExercise.label} onChange={event => patchExercise(selectedExercise.id, { label: event.target.value })} className={inputClass} />
                      </Field>
                      <Field label="النقطة">
                        <input value={selectedExercise.declaredPoints} onChange={event => patchExercise(selectedExercise.id, { declaredPoints: event.target.value })} className={inputClass} />
                      </Field>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <Field label="المورد المعرفي" hint="ما يقيسه التمرين — يظهر في مذكرة التصحيح.">
                        <textarea rows={2} value={selectedExercise.knowledge} onChange={event => patchExercise(selectedExercise.id, { knowledge: event.target.value })} className={`${inputClass} resize-y leading-relaxed`} />
                      </Field>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      {selectedExercise.questions.map((question, index) => (
                        <div key={question.id} className="rounded-xl border border-slate-200 p-2">
                          <div className="flex items-center gap-1.5">
                            <input value={question.number} onChange={event => mutateMemo(draft => { const target = draft.exercises.find(item => item.id === selectedExercise.id)?.questions.find(item => item.id === question.id); if (target) target.number = event.target.value; })} className="w-10 rounded-lg border border-slate-200 px-1 py-0.5 text-center text-[10.5px] font-bold" aria-label="رقم السؤال" />
                            <span className="text-[9.5px] font-bold text-slate-400">سؤال {index + 1}</span>
                            <span className="mr-auto text-[9.5px] font-black text-slate-500">{question.points || '—'} ن</span>
                            <input value={question.points} onChange={event => mutateMemo(draft => { const target = draft.exercises.find(item => item.id === selectedExercise.id)?.questions.find(item => item.id === question.id); if (target) target.points = event.target.value; })} className="w-12 rounded-lg border border-slate-200 px-1 py-0.5 text-center text-[10.5px] font-bold" aria-label="النقطة" />
                            <button type="button" onClick={() => mutateMemo(draft => { const target = draft.exercises.find(item => item.id === selectedExercise.id); if (target) target.questions = target.questions.filter(item => item.id !== question.id); })} aria-label="حذف السؤال" className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                          </div>
                          <textarea rows={2} value={question.text} onChange={event => mutateMemo(draft => { const target = draft.exercises.find(item => item.id === selectedExercise.id)?.questions.find(item => item.id === question.id); if (target) target.text = event.target.value; })} placeholder="نص السؤال كما سيُطبع…" className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-2 py-1 text-[11.5px] leading-relaxed focus:border-teal-500 focus:outline-none" />
                          <textarea rows={2} value={question.expected} onChange={event => mutateMemo(draft => { const target = draft.exercises.find(item => item.id === selectedExercise.id)?.questions.find(item => item.id === question.id); if (target) { target.expected = event.target.value; target.source = 'teacher'; } })} placeholder="عناصر الإجابة النموذجية (تظهر في مذكرة التصحيح)…" className="mt-1 w-full resize-y rounded-lg border border-emerald-100 bg-emerald-50/30 px-2 py-1 text-[11px] leading-relaxed focus:border-emerald-500 focus:outline-none" />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => mutateMemo(draft => {
                          const target = draft.exercises.find(item => item.id === selectedExercise.id);
                          if (target) target.questions.push({ id: `q-${Date.now().toString(36)}`, number: String(target.questions.length + 1), text: '', points: '', expected: '', source: 'teacher', needsReview: false });
                        })}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10.5px] font-black text-slate-700 hover:bg-slate-200"
                      >
                        <Plus className="h-3 w-3" /> سؤال
                      </button>
                    </div>
                  </div>
                )}

                {exam.examType === 'اختبار' && (
                  <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                    <h3 className="mb-2 text-[12px] font-black text-slate-900">الوضعية الإدماجية</h3>
                    <textarea
                      rows={4}
                      value={exam.integrationSituation}
                      onChange={event => updateActive(current => touchExam(current, { integrationSituation: event.target.value }))}
                      placeholder="نص الوضعية والسند والمطلوب كما يُطبع في الورقة…"
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>معايير التصحيح ومؤشراتها</span>
                      <button type="button" onClick={() => setTab('memo')} className="font-black text-teal-800 hover:underline">فتح المذكرة ←</button>
                    </div>
                  </div>
                )}

                <details className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                  <summary className="cursor-pointer text-[12px] font-black text-slate-900">الوثائق والتعليمات</summary>
                  <div className="mt-2 space-y-2">
                    <Field label="الوثائق والسندات">
                      <textarea rows={2} value={exam.documents} onChange={event => updateActive(current => touchExam(current, { documents: event.target.value }))} className={`${inputClass} resize-y`} placeholder="وصف الوثائق المرفقة بالورقة…" />
                    </Field>
                    <Field label="تعليمات عامة">
                      <textarea rows={2} value={exam.instructions} onChange={event => updateActive(current => touchExam(current, { instructions: event.target.value }))} className={`${inputClass} resize-y`} placeholder="اقرأ الأسئلة بتمعّن…" />
                    </Field>
                  </div>
                </details>

                {showHistory && (
                  <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                    <h3 className="mb-2 text-[12px] font-black text-slate-900">سجل النسخ</h3>
                    {exam.versions.length === 0 ? (
                      <p className="text-[10.5px] text-slate-500">لا توجد نسخ بعد. تُحفظ نسخة تلقائيًا قبل كل تغيير كبير.</p>
                    ) : (
                      <div className="space-y-1">
                        {exam.versions.map(version => (
                          <div key={version.id} className="flex items-center gap-1.5 rounded-xl border border-slate-100 px-2 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10.5px] font-black text-slate-800">{version.label}</p>
                              <p className="text-[9px] text-slate-400">{formatDate(version.at)} · {formatPoints(version.total)} ن</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm('استرجاع هذه النسخة؟ سيُحفظ الوضع الحالي كنسخة قبل الاسترجاع.')) return;
                                updateActive(current => restoreExamVersion(current, version.id));
                                setNotice({ tone: 'ok', text: 'استُرجعت النسخة المحددة، والوضع السابق محفوظ.' });
                              }}
                              className="rounded-lg bg-slate-100 px-2 py-0.5 text-[9.5px] font-black text-slate-700 hover:bg-slate-200"
                            >
                              استرجاع
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-3">
                  <label className="text-[10px] font-black text-teal-900">مساعد التقويم — نفّذ طلبًا</label>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      value={command}
                      onChange={event => setCommand(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter') handleCommand(); }}
                      placeholder="أضف تمرينًا ثالثًا…"
                      className="flex-1 rounded-xl border border-teal-200 bg-white px-2 py-1.5 text-[11px] font-bold focus:border-teal-500 focus:outline-none"
                    />
                    <button type="button" onClick={handleCommand} disabled={!command.trim()} className="rounded-xl bg-teal-700 px-2.5 py-1.5 text-[10.5px] font-black text-white disabled:opacity-40">تنفيذ</button>
                  </div>
                  <p className="mt-1 text-[9px] leading-relaxed text-teal-800/70">كل تعديل يُحفظ محليًا، ويُحفظ الوضع السابق كنسخة قبل التغييرات الكبيرة.</p>
                </div>
              </aside>
            </div>
          </section>
        )}

        {tab === 'memo' && exam && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#e2e8e5] bg-white p-2.5">
              <select value={answerTarget} onChange={event => setAnswerTarget(event.target.value)} className="rounded-xl border border-slate-200 px-2 py-1.5 text-[10.5px] font-bold">
                <option value="all">كل التمارين</option>
                {exam.memo.exercises.map(exercise => <option key={exercise.id} value={exercise.id}>{exercise.label}</option>)}
              </select>
              <button type="button" onClick={handleGenerateAnswers} disabled={busy === 'answers'} className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-amber-700 disabled:opacity-50">
                {busy === 'answers' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} مطابقة عناصر الإجابة من البنك
              </button>
              <button type="button" onClick={handleRedistribute} className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-black text-indigo-900">
                <RefreshCw className="h-3.5 w-3.5" /> اقتراح التنقيط على 20
              </button>
              <span className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:block" />
              <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-[11px] font-black text-white"><Printer className="h-3.5 w-3.5" /> طباعة</button>
              <button type="button" onClick={handlePdf} disabled={busy === 'export'} className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-2.5 py-1.5 text-[11px] font-black text-white disabled:opacity-50">
                {busy === 'export' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />} PDF
              </button>
              <button type="button" onClick={handleWord} disabled={busy === 'word'} className="inline-flex items-center gap-1 rounded-xl bg-blue-700 px-2.5 py-1.5 text-[11px] font-black text-white disabled:opacity-50">
                {busy === 'word' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Word
              </button>
              <button type="button" onClick={saveVersion} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-black text-slate-700"><Save className="h-3.5 w-3.5" /> نسخة</button>
              <span className="mr-auto text-[10px] font-bold text-slate-500">المجموع {formatPoints(examCounts(exam).points)} / 20</span>
            </div>

            {missing.length > 0 && (
              <p className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10.5px] font-bold text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5" /> {missing.length} سؤالًا بلا عناصر إجابة — يمكنك توليدها أو كتابتها يدويًا داخل الجدول.
              </p>
            )}
            {warnings.length > 0 && (
              <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[10.5px] text-amber-900">
                {warnings.slice(0, 4).map((warning, index) => (
                  <p key={index} className={warning.blocking ? 'font-bold' : ''}>• {warning.message}</p>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-[#e2e8e5] bg-white p-2 sm:p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10.5px] text-slate-500">
                <Info className="h-3.5 w-3.5" /> القالب المعتمد للمذكرة. كل خانة قابلة للتحرير مباشرة، وما كتبته يدويًا لا يُستبدل آليًا.
              </p>
              <div className="overflow-x-auto">
                <div ref={sheetRef} className="page-sheet page-sheet--correction mx-auto" style={{ maxWidth: '210mm', padding: '12mm' }}>
                  <CorrectionMemoSheet data={exam.memo} editable onChange={mutateMemo} />
                </div>
              </div>
            </div>
            <p className="text-center text-[9.5px] text-slate-400">
              الأولوية: ما أكده الأستاذ ← الورقة الأصلية ← قاعدة المنصة ← مطابقة البنك المحلي. لا يُملأ القالب الفارغ بالتخمين.
            </p>
          </section>
        )}

        {tab === 'results' && exam && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#e2e8e5] bg-white p-2.5">
              <button type="button" onClick={addStudent} className="inline-flex items-center gap-1 rounded-xl bg-[#0e7a68] px-2.5 py-1.5 text-[11px] font-black text-white"><Plus className="h-3.5 w-3.5" /> تلميذ</button>
              <button type="button" onClick={() => setShowBulk(value => !value)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-black text-slate-700"><Users className="h-3.5 w-3.5" /> إدخال قائمة</button>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{exam.results.length} تلميذًا</span>
              {stats && stats.hasData && <span className="text-[10px] font-bold text-slate-500">مصحح: {stats.graded} · متوسط {stats.average20}/20</span>}
              <button type="button" onClick={() => setTab('analysis')} className="mr-auto inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-[11px] font-black text-teal-900">
                <BarChart3 className="h-3.5 w-3.5" /> تحليل النتائج
              </button>
            </div>

            {showBulk && (
              <div className="rounded-2xl border border-teal-200 bg-white p-3">
                <p className="text-[11px] font-black text-slate-800">ألصق أسماء التلاميذ (اسم في كل سطر أو مفصولة بفواصل)</p>
                <textarea rows={4} value={bulkNames} onChange={event => setBulkNames(event.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-2 py-1.5 text-[11.5px]" />
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button type="button" onClick={addBulkStudents} disabled={!bulkNames.trim()} className="rounded-xl bg-[#0e7a68] px-3 py-1.5 text-[10.5px] font-black text-white disabled:opacity-40">إضافة</button>
                  <button type="button" onClick={() => setShowBulk(false)} className="text-[10.5px] font-bold text-slate-500">إلغاء</button>
                </div>
              </div>
            )}

            {exam.results.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#cfe0da] bg-white px-4 py-9 text-center">
                <Users className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-2 text-[12.5px] font-black text-slate-800">لم تُدخل نتائج بعد</p>
                <p className="mt-0.5 text-[11px] text-slate-500">أضف التلاميذ ثم نقاط الأسئلة. يُحسب المجموع والعلامة على 20 والتحليل تلقائيًا.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#e2e8e5] bg-white">
                <table className="w-full min-w-[760px] text-right text-[11px]">
                  <thead className="bg-[#f6faf8] text-[9.5px] font-black text-slate-600">
                    <tr>
                      <th className="px-2 py-2">التلميذ</th>
                      <th className="px-1 py-2 text-center">غائب</th>
                      {partOneExercises(exam).map(exercise => (
                        <th key={exercise.id} className="px-1.5 py-2 text-center">
                          {exercise.label.replace('التمرين ', '')} <span className="font-normal text-slate-400">/{formatPoints(toNumber(exercise.declaredPoints))}</span>
                        </th>
                      ))}
                      <th className="px-1.5 py-2 text-center">المجموع</th>
                      <th className="px-1.5 py-2 text-center">/20</th>
                      <th className="px-1 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {exam.results.map(result => {
                      const exercises = partOneExercises(exam);
                      const expanded = expandedResult === result.id;
                      return (
                        <React.Fragment key={result.id}>
                          <tr className={`border-t border-slate-100 ${result.absent ? 'bg-slate-50/60 text-slate-400' : ''}`}>
                            <td className="px-2 py-1.5">
                              <input
                                value={result.studentName}
                                onChange={event => updateActive(current => ({
                                  ...current,
                                  results: current.results.map(item => item.id === result.id ? { ...item, studentName: event.target.value } : item),
                                  updatedAt: nowIso(),
                                }))}
                                placeholder="اسم التلميذ"
                                className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-[11px] font-bold hover:border-slate-200 focus:border-teal-500 focus:bg-white focus:outline-none"
                              />
                            </td>
                            <td className="px-1 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={result.absent}
                                onChange={() => updateActive(current => ({
                                  ...current,
                                  results: current.results.map(item => item.id === result.id ? { ...item, absent: !item.absent } : item),
                                  updatedAt: nowIso(),
                                }))}
                                aria-label="غائب"
                                className="h-3.5 w-3.5 accent-teal-700"
                              />
                            </td>
                            {exercises.map(exercise => {
                              const value = exercise.questions.reduce((sum, question) => {
                                const raw = toNumber(result.scores?.[question.id]);
                                return sum + (raw === null ? 0 : Math.min(Math.max(raw, 0), toNumber(question.points) || 0));
                              }, 0);
                              return <td key={exercise.id} className="px-1.5 py-1.5 text-center font-bold tabular-nums">{result.absent ? '—' : formatPoints(value)}</td>;
                            })}
                            <td className="px-1.5 py-1.5 text-center font-black tabular-nums">{result.absent ? '—' : formatPoints(studentTotal(exam, result))}</td>
                            <td className={`px-1.5 py-1.5 text-center font-black tabular-nums ${!result.absent && studentScore20(exam, result) >= 10 ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {result.absent ? '—' : formatPoints(studentScore20(exam, result))}
                            </td>
                            <td className="px-1 py-1.5">
                              <div className="flex items-center justify-end gap-0.5">
                                <button type="button" onClick={() => setExpandedResult(expanded ? '' : result.id)} aria-label="نقاط الأسئلة" className={`rounded p-1 hover:bg-slate-100 ${expanded ? 'text-teal-700' : 'text-slate-400'}`}>
                                  <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />
                                </button>
                                <button type="button" onClick={() => updateActive(current => ({ ...current, results: current.results.filter(item => item.id !== result.id), updatedAt: nowIso() }))} aria-label="حذف التلميذ" className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="bg-[#fbfdfc]">
                              <td colSpan={partOneExercises(exam).length + 5} className="px-3 py-2">
                                <div className="space-y-2">
                                  {exercises.map(exercise => (
                                    <div key={exercise.id}>
                                      <p className="mb-1 text-[10px] font-black text-slate-600">{exercise.label} — نقاط الأسئلة</p>
                                      <div className="grid gap-1 sm:grid-cols-2">
                                        {exercise.questions.map(question => {
                                          const max = toNumber(question.points) || 0;
                                          const value = result.scores?.[question.id];
                                          return (
                                            <label key={question.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-1.5 py-1">
                                              <span className="w-4 shrink-0 text-[9.5px] font-black text-slate-500">{question.number}</span>
                                              <span className="min-w-0 flex-1 truncate text-[10px] text-slate-600" title={question.text}>{question.text || 'سؤال بلا نص'}</span>
                                              <input
                                                type="number"
                                                min={0}
                                                max={max}
                                                step={0.25}
                                                value={value ?? ''}
                                                onChange={event => {
                                                  const raw = event.target.value;
                                                  const parsed = raw === '' ? null : Math.min(Math.max(Number(raw), 0), max);
                                                  updateActive(current => updateStudentScore(current, result.id, question.id, parsed === null || Number.isNaN(parsed) ? null : parsed));
                                                }}
                                                className="w-14 shrink-0 rounded border border-slate-200 px-1 py-0.5 text-center text-[10px] font-bold tabular-nums focus:border-teal-500 focus:outline-none"
                                                aria-label={`نقطة السؤال ${question.number}`}
                                              />
                                              <span className="shrink-0 text-[9px] text-slate-400">/{formatPoints(max)}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                  {exam.examType === 'اختبار' && (
                                    <div>
                                      <p className="mb-1 text-[10px] font-black text-slate-600">الوضعية الإدماجية — مؤشرات المعايير</p>
                                      <div className="grid gap-1 sm:grid-cols-2">
                                        {exam.memo.integration.criteria.flatMap(criterion => criterion.indicators.map(indicator => {
                                          const max = toNumber(indicator.points) || 0;
                                          const value = result.scores?.[indicator.id];
                                          return (
                                            <label key={indicator.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-1.5 py-1">
                                              <span className="min-w-0 flex-1 truncate text-[10px] text-slate-600" title={`${criterion.label}: ${indicator.text}`}>{criterion.label.replace('المعيار ', 'م')} · {indicator.text || 'مؤشر'}</span>
                                              <input
                                                type="number"
                                                min={0}
                                                max={max}
                                                step={0.25}
                                                value={value ?? ''}
                                                onChange={event => {
                                                  const raw = event.target.value;
                                                  const parsed = raw === '' ? null : Math.min(Math.max(Number(raw), 0), max);
                                                  updateActive(current => updateStudentScore(current, result.id, indicator.id, parsed === null || Number.isNaN(parsed) ? null : parsed));
                                                }}
                                                className="w-14 shrink-0 rounded border border-slate-200 px-1 py-0.5 text-center text-[10px] font-bold tabular-nums focus:border-teal-500 focus:outline-none"
                                                aria-label="نقطة المؤشر"
                                              />
                                              <span className="shrink-0 text-[9px] text-slate-400">/{formatPoints(max)}</span>
                                            </label>
                                          );
                                        }))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'analysis' && exam && (
          <section className="space-y-3">
            {!stats?.hasData ? (
              <div className="rounded-3xl border border-dashed border-[#cfe0da] bg-white px-4 py-9 text-center">
                <BarChart3 className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-2 text-[12.5px] font-black text-slate-800">التحليل ينتظر النتائج</p>
                <p className="mx-auto mt-0.5 max-w-md text-[11px] leading-relaxed text-slate-500">
                  أدخل علامات التلاميذ أولًا. لن يعرض النظام أرقامًا أو أسبابًا غير مدعومة بالبيانات.
                </p>
                <button type="button" onClick={() => setTab('results')} className="mt-3 rounded-xl bg-[#0e7a68] px-3 py-1.5 text-[11px] font-black text-white">إدخال النتائج</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    { label: 'متوسط القسم', value: `${stats.average20}/20` },
                    { label: 'أعلى علامة', value: `${stats.highest20}/20` },
                    { label: 'أدنى علامة', value: `${stats.lowest20}/20` },
                    { label: 'نسبة النجاح', value: `${stats.passRate}%` },
                    { label: 'نسبة التعثر', value: `${stats.struggleRate}%` },
                  ].map(card => (
                    <div key={card.label} className="rounded-2xl border border-[#e2e8e5] bg-white px-3 py-2">
                      <p className="text-[9.5px] font-bold text-slate-500">{card.label}</p>
                      <p className="mt-0.5 text-[16px] font-black tabular-nums text-slate-900">{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-3">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-black text-teal-900"><Target className="h-3.5 w-3.5" /> خلاصة تربوية</p>
                  <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-teal-900/90">
                    {narrative.map((line, index) => <li key={index}>• {line}</li>)}
                  </ul>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                    <h3 className="text-[12px] font-black text-slate-900">توزيع العلامات</h3>
                    <div className="mt-2 space-y-1.5">
                      {stats.distribution.map(band => (
                        <div key={band.label} className="flex items-center gap-2">
                          <span className="w-14 shrink-0 text-[9.5px] font-bold text-slate-500 tabular-nums">{band.label}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-teal-600/80" style={{ width: `${Math.max(band.ratio, band.count ? 4 : 0)}%` }} />
                          </div>
                          <span className="w-6 shrink-0 text-left text-[9.5px] font-black text-slate-600 tabular-nums">{band.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                    <h3 className="text-[12px] font-black text-slate-900">أداء التمارين</h3>
                    <div className="mt-2 space-y-1.5">
                      {stats.perExercise.map(exercise => (
                        <div key={exercise.id}>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span className="truncate">{exercise.label}</span>
                            <span className="shrink-0 tabular-nums">{exercise.average}/{exercise.max} · {exercise.achievement}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${exercise.achievement >= 60 ? 'bg-emerald-500' : exercise.achievement >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(exercise.achievement, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                  <h3 className="text-[12px] font-black text-slate-900">أكثر الأسئلة صعوبة</h3>
                  <div className="mt-1.5 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-right text-[10.5px]">
                      <thead className="text-[9.5px] font-black text-slate-500">
                        <tr><th className="px-1.5 py-1">التمرين</th><th className="px-1.5 py-1">السؤال</th><th className="px-1.5 py-1">المتوسط</th><th className="px-1.5 py-1">التحصيل</th><th className="px-1.5 py-1">متعثرون</th></tr>
                      </thead>
                      <tbody>
                        {[...stats.perQuestion]
                          .filter(item => item.ref.kind === 'question' && item.ref.text.trim() && item.ref.max > 0)
                          .sort((a, b) => a.achievement - b.achievement)
                          .slice(0, 6)
                          .map(item => (
                            <tr key={item.ref.id} className="border-t border-slate-100">
                              <td className="px-1.5 py-1 text-slate-500">{item.ref.exerciseLabel.replace('التمرين ', '')}</td>
                              <td className="max-w-[240px] truncate px-1.5 py-1 text-slate-800" title={item.ref.text}>{item.ref.text}</td>
                              <td className="px-1.5 py-1 tabular-nums">{item.average}/{item.ref.max}</td>
                              <td className={`px-1.5 py-1 font-bold tabular-nums ${item.achievement < 40 ? 'text-rose-600' : 'text-slate-700'}`}>{item.achievement}%</td>
                              <td className="px-1.5 py-1 tabular-nums">{item.struggling}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[12px] font-black text-slate-900">الأخطاء المتكررة</h3>
                    <span className="text-[9.5px] text-slate-400">السبب «محتمل» ويتطلب تأكيدًا من ملاحظات التصحيح</span>
                  </div>
                  {errors.length === 0 ? (
                    <p className="mt-2 text-[10.5px] text-slate-500">لا يوجد خطأ متكرر بدرجة كافية في البيانات المسجّلة.</p>
                  ) : (
                    <div className="mt-1.5 overflow-x-auto">
                      <table className="w-full min-w-[720px] text-right text-[10.5px]">
                        <thead className="text-[9.5px] font-black text-slate-500">
                          <tr><th className="px-1.5 py-1">السؤال</th><th className="px-1.5 py-1">الخطأ</th><th className="px-1.5 py-1">النوع</th><th className="px-1.5 py-1">التلاميذ</th><th className="px-1.5 py-1">السبب المحتمل</th><th className="px-1.5 py-1">المورد</th></tr>
                        </thead>
                        <tbody>
                          {errors.map(row => (
                            <tr key={row.id} className="border-t border-slate-100 align-top">
                              <td className="max-w-[200px] px-1.5 py-1" title={row.question}><span className="block truncate text-slate-700">{row.question}</span><span className="text-[9px] text-slate-400">{row.exerciseLabel}</span></td>
                              <td className="max-w-[220px] px-1.5 py-1 text-slate-600">{row.error}</td>
                              <td className="px-1.5 py-1"><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-700">{row.kind}</span></td>
                              <td className="px-1.5 py-1 text-center font-black tabular-nums">{row.learners}</td>
                              <td className="max-w-[240px] px-1.5 py-1 text-slate-500">{row.possibleCause}</td>
                              <td className="max-w-[160px] px-1.5 py-1 text-slate-500"><span className="block truncate" title={row.resource}>{row.resource}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#e2e8e5] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[12px] font-black text-slate-900">خطة المعالجة</h3>
                    <button type="button" onClick={applyAnalysis} className="inline-flex items-center gap-1 rounded-xl bg-[#0e7a68] px-2.5 py-1.5 text-[10.5px] font-black text-white hover:bg-[#0b6a5a]">
                      <Save className="h-3.5 w-3.5" /> نقلها إلى مذكرة التصحيح
                    </button>
                  </div>
                  {plan.length === 0 ? (
                    <p className="mt-2 text-[10.5px] text-slate-500">لا توجد موارد متعثرة بدرجة كافية لبناء خطة معالجة.</p>
                  ) : (
                    <div className="mt-1.5 overflow-x-auto">
                      <table className="w-full min-w-[860px] text-right text-[10.5px]">
                        <thead className="text-[9.5px] font-black text-slate-500">
                          <tr><th className="px-1.5 py-1">المورد المستهدف</th><th className="px-1.5 py-1">نوع الصعوبة</th><th className="px-1.5 py-1">النشاط العلاجي المقترح</th><th className="px-1.5 py-1">الوسيلة</th><th className="px-1.5 py-1">المتعلمون</th><th className="px-1.5 py-1">مؤشر النجاح</th><th className="px-1.5 py-1" /></tr>
                        </thead>
                        <tbody>
                          {plan.map(row => (
                            <tr key={row.id} className="border-t border-slate-100 align-top">
                              <td className="max-w-[170px] px-1.5 py-1 font-bold text-slate-800">{row.resource}</td>
                              <td className="px-1.5 py-1"><span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-800">{row.difficulty}</span></td>
                              <td className="max-w-[230px] px-1.5 py-1 text-slate-600">{row.activity}</td>
                              <td className="max-w-[150px] px-1.5 py-1 text-slate-500">{row.support}</td>
                              <td className="max-w-[170px] px-1.5 py-1 text-slate-500"><span className="block truncate" title={row.learners}>{row.learners}</span></td>
                              <td className="max-w-[170px] px-1.5 py-1 text-slate-500">{row.successIndicator}</td>
                              <td className="px-1.5 py-1">
                                <button type="button" onClick={() => askAssistantPlan(row)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-teal-200 bg-teal-50 px-1.5 py-1 text-[9.5px] font-black text-teal-900 hover:bg-teal-100">
                                  <Bot className="h-3 w-3" /> نشاط علاجي
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e2e8e5] bg-white px-3 py-2">
                  <p className="text-[10.5px] text-slate-500">يُحفظ التحليل داخل الاختبار، ويمكن نقله إلى المذكرة ليُطبع مع خطة المعالجة.</p>
                  <button type="button" onClick={askAssistantGeneral} className="inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-[10.5px] font-black text-teal-900">
                    <Bot className="h-3.5 w-3.5" /> اسأل المساعد عن هذا التحليل
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {tab !== 'exams' && !exam && (
          <div className="rounded-3xl border border-dashed border-[#cfe0da] bg-white px-4 py-9 text-center">
            <ClipboardList className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-2 text-[12.5px] font-black text-slate-800">اختر اختبارًا أو أنشئ واحدًا</p>
            <button type="button" onClick={() => setTab('exams')} className="mt-2 inline-flex items-center gap-1 rounded-xl bg-[#0e7a68] px-3 py-1.5 text-[11px] font-black text-white">
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" /> قائمة الاختبارات
            </button>
          </div>
        )}

        <footer className="pb-2 text-center text-[9.5px] text-slate-400">
          التقويم: تنفيذ العمل التقييمي · المساعد الذكي: البحث والفهم والمساعدة · كل اقتراح آلي يبقى بمراجعة الأستاذ.
        </footer>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3" onClick={() => setShowCreate(false)} role="dialog" aria-modal="true" aria-label="إنشاء اختبار">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white p-4 shadow-2xl sm:p-5" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-black text-slate-900">اختبار جديد</h2>
                <p className="mt-0.5 text-[10.5px] text-slate-500">معلومات سريعة، ثم تحرير التمارين أو استيراد الورقة.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="إغلاق" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label="نوع الورقة">
                <select value={form.examType} onChange={event => setForm(previous => ({ ...previous, examType: event.target.value as 'فرض' | 'اختبار' }))} className={inputClass}>
                  <option value="اختبار">اختبار (تمرينان + وضعية إدماجية)</option>
                  <option value="فرض">فرض (تمارين فقط)</option>
                </select>
              </Field>
              <Field label="المستوى">
                <select value={form.level} onChange={event => setForm(previous => ({ ...previous, level: event.target.value as AssessmentLevelCode }))} className={inputClass}>
                  {ASSESSMENT_LEVELS.map(level => <option key={level.code} value={level.code}>{level.label}</option>)}
                </select>
              </Field>
              <Field label="الفصل">
                <select value={form.term} onChange={event => setForm(previous => ({ ...previous, term: event.target.value }))} className={inputClass}>
                  {['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'].map(term => <option key={term} value={term}>{term}</option>)}
                </select>
              </Field>
              <Field label="القسم">
                <input value={form.className} onChange={event => setForm(previous => ({ ...previous, className: event.target.value }))} placeholder="3م1" className={inputClass} />
              </Field>
              <Field label="المدة">
                <input value={form.duration} onChange={event => setForm(previous => ({ ...previous, duration: event.target.value }))} className={inputClass} />
              </Field>
              <Field label="عنوان مخصص (اختياري)">
                <input value={form.title} onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} placeholder="يُولَّد تلقائيًا" className={inputClass} />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f6faf8] px-3 py-2">
              <p className="text-[9.5px] leading-relaxed text-slate-500">
                {form.examType === 'اختبار' ? 'الجزء الأول 12 ن + الوضعية الإدماجية 8 ن = 20.' : 'تمارين فقط، والمجموع 20.'} يُعبّأ رأس الورقة من إعدادات الأستاذ.
              </p>
              <button type="button" onClick={handleCreate} className="inline-flex items-center gap-1 rounded-xl bg-[#0e7a68] px-3 py-1.5 text-[11px] font-black text-white hover:bg-[#0b6a5a]">
                <Check className="h-3.5 w-3.5" /> إنشاء ومتابعة
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
