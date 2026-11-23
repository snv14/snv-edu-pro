import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Calculator, CheckCircle2, Database, FileDown, FileSearch, FileUp, Loader2, Printer, Plus, RotateCcw,
  Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { LessonMemo, MemoConfig } from '../types';
import {
  CorrectionMemoData, CorrectionExercise, MemoFieldSource, SOURCE_CONFIDENCE, SOURCE_LABEL,
  applyExamStructure, createDefaultCorrectionMemo, examStructure, exerciseTotal, fillFromPlatform,
  normalizeCorrectionMemo, overallTotal, uid, validateCorrectionMemo,
} from '../services/correctionMemoModel';
import {
  applyPointSuggestion, buildPointSuggestion, enrichCorrectionMemoFromDb, PointSuggestion,
} from '../services/correctionMemoEnrich';
import { importCorrectionFile, isSupportedCorrectionFile, readFileAsDataUrl } from '../services/correctionMemoImport';
import { applyCorrectionSuggestions, suggestAnswersForExercises, CorrectionSuggestionsResult } from '../services/correctionMemoAi';
import { exportCorrectionMemoDataToDocx, exportCorrectionMemoToPdf, printCorrectionMemo } from '../utils/correctionMemoExport';
import { CorrectionMemoSheet, SourceLegend } from './CorrectionMemoSheet';
import { CorrectionImportRecovery, RecoveryPreset, RecoveryStatus, RecoverySummary } from './CorrectionImportRecovery';
import { PageTemplateSwitcher } from './ActionMenu';
import { DocxFontFallbackModal, useDocxFontFallbackDialog } from './DocxFontFallbackModal';
import { DocxFontEmbedError } from '../utils/docxFontEmbed';

export interface CorrectionMeta {
  field: string;
  source: MemoFieldSource;
  confidence: string;
}

const STORAGE_KEY = 'correction_memo_v2';

/** صفحة الاسترداد: حالة القراءة الآلية وتعبئة القالب قبل اعتماد الأستاذ. */
interface RecoveryState {
  status: RecoveryStatus;
  fileName: string;
  fileSize: number;
  summary?: RecoverySummary;
  filled: string[];
  matchedLabel?: string;
  exercises: Array<{ label: string; questionCount: number }>;
  presets: RecoveryPreset[];
  activePreset: number;
  data?: CorrectionMemoData;
  failedStep?: RecoveryStatus;
  error?: string;
}

/** توزيعات تنقيط جاهزة: اختبار 6+6+8، فرض 10+10 أو 7+7+6، مع بدائل للتغيير. */
const recoveryPresets = (examType: 'فرض' | 'اختبار', exerciseCount: number): RecoveryPreset[] => {
  if (examType === 'اختبار') {
    return [
      { label: '6 + 6 + وضعية 8', exercisePoints: [6, 6], integrationPoints: 8 },
      { label: '8 + 4 + وضعية 8', exercisePoints: [8, 4], integrationPoints: 8 },
      { label: '5 + 5 + وضعية 10', exercisePoints: [5, 5], integrationPoints: 10 },
    ];
  }
  if (exerciseCount >= 3) {
    return [
      { label: '7 + 7 + 6', exercisePoints: [7, 7, 6], integrationPoints: 0 },
      { label: '6 + 7 + 7', exercisePoints: [6, 7, 7], integrationPoints: 0 },
      { label: '8 + 6 + 6', exercisePoints: [8, 6, 6], integrationPoints: 0 },
    ];
  }
  return [
    { label: '10 + 10', exercisePoints: [10, 10], integrationPoints: 0 },
    { label: '12 + 8', exercisePoints: [12, 8], integrationPoints: 0 },
    { label: '8 + 12', exercisePoints: [8, 12], integrationPoints: 0 },
  ];
};

const loadStored = (): CorrectionMemoData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultCorrectionMemo();
    return normalizeCorrectionMemo(JSON.parse(raw));
  } catch {
    return createDefaultCorrectionMemo();
  }
};

const saveStored = (data: CorrectionMemoData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* التخزين المحلي اختياري */
  }
};

const deepClone = <T,>(value: T): T => {
  const clone = (globalThis as any)?.structuredClone;
  if (typeof clone === 'function') return clone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const Chip: React.FC<{ source: MemoFieldSource; label?: string }> = ({ source, label }) => {
  if (source === 'template') return null;
  const color = source === 'platform' ? 'bg-teal-100 text-teal-900 border-teal-200'
    : source === 'imported' ? 'bg-blue-100 text-blue-900 border-blue-200'
      : source === 'ai' ? 'bg-amber-100 text-amber-900 border-amber-200'
        : 'bg-slate-100 text-slate-800 border-slate-200';
  return (
    <span className={`text-[9.5px] font-black border rounded-full px-1.5 py-0.5 ${color}`}>
      {label || SOURCE_LABEL[source]} · {SOURCE_CONFIDENCE[source]}
    </span>
  );
};

export const CorrectionMemoDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentLesson?: LessonMemo | null;
  curriculumLessons?: LessonMemo[];
  config?: MemoConfig;
}> = ({ isOpen, onClose, currentLesson, curriculumLessons = [], config }) => {
  const [data, setData] = useState<CorrectionMemoData>(() => loadStored());
  const [filledFromPlatform, setFilledFromPlatform] = useState<string[]>([]);
  const [skippedFromPlatform, setSkippedFromPlatform] = useState<string[]>([]);
  const [busy, setBusy] = useState<'import' | 'ai' | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [importMeta, setImportMeta] = useState<{ exercises: number; questions: number; points: number; usedAI: boolean; missing: string[] } | null>(null);
  const [aiResult, setAiResult] = useState<CorrectionSuggestionsResult | null>(null);
  const [aiTarget, setAiTarget] = useState<string>('all');
  const [pointSuggestion, setPointSuggestion] = useState<PointSuggestion | null>(null);
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const viaAgentRef = useRef(false);
  const [savedAt, setSavedAt] = useState<string>('');
  const {
    pendingError: pendingWordFontError,
    askFallbackChoice: askWordFallbackChoice,
    confirmFallback: confirmWordFallback,
    exportPdfInstead: exportWordPdfInstead,
    cancelFallback: cancelWordFallback,
  } = useDocxFontFallbackDialog();

  useEffect(() => {
    if (!isOpen) return;
    const stored = loadStored();
    setData(stored);
    const filled = fillFromPlatform(stored, { config, lesson: currentLesson, curriculum: curriculumLessons, level: currentLesson?.level });
    setData(filled.data);
    setFilledFromPlatform(filled.filled);
    setSkippedFromPlatform(filled.skipped);
  }, [isOpen, config, currentLesson, curriculumLessons]);

  useEffect(() => {
    if (!isOpen) return;
    saveStored(data);
    setSavedAt(new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }));
  }, [data, isOpen]);

  const warnings = useMemo(() => validateCorrectionMemo(data), [data]);
  const total = useMemo(() => overallTotal(data), [data]);

  const mutate = useCallback((updater: (draft: CorrectionMemoData) => void) => {
    setData(previous => {
      const draft = deepClone(previous);
      updater(draft);
      draft.updatedAt = new Date().toISOString();
      return draft;
    });
  }, []);

  const changeExamType = (examType: 'فرض' | 'اختبار') => {
    if (examType === data.examType) return;
    const count = data.exercises.filter(exercise => exercise.part === 1).length;
    setData(applyExamStructure(data, examType, count));
    setAiResult(null);
    setPointSuggestion(null);
    setNotice(examType === 'فرض'
      ? 'تحوّلت الورقة إلى فرض: تمارين فقط بلا وضعية إدماجية، والمجموع من 20.'
      : 'تحوّلت الورقة إلى اختبار: تمرينان (6+6) ووضعية إدماجية من 8 نقاط.');
  };

  /** الفرض يُنجز بتمرينين أو ثلاثة؛ التبديل يضيف/يحذف تمرينًا فارغًا ويضبط التنقيط. */
  const changeDevoirCount = (count: 2 | 3) => {
    const current = data.exercises.filter(exercise => exercise.part === 1).length;
    if (current === count) return;
    const next = applyExamStructure(data, 'فرض', count);
    setData(next);
    setPointSuggestion(null);
    const updated = next.exercises.filter(exercise => exercise.part === 1);
    setNotice(updated.length === count
      ? `الفرض الآن ${count} تمارين بتوزيع ${examStructure('فرض', count).exercisePoints.join(' + ')} نقطة.`
      : `بقي التمرين الزائد لأن به محتوى؛ احذفه يدويًا من «تحرير التمارين» إن أردت.`);
  };

  const enrichFromDb = () => {
    const result = enrichCorrectionMemoFromDb(data, { lesson: currentLesson, curriculum: curriculumLessons });
    setData(result.data);
    setPointSuggestion(null);
    if (!result.matched) {
      setNotice('لم أجد في قاعدة المناهج درساً مطابقاً لأسئلة هذه الورقة. اكتب الميدان والمقطع والكفاءة يدويًا أو افتح الدرس المقصود في المنصة.');
      return;
    }
    setNotice(result.filled.length
      ? `عُبّئت ${result.filled.length} خانة من قاعدة المناهج (${result.matched.mawrid || result.matched.maqta}). راجعها قبل الاعتماد.`
      : 'كل الحقول التربوية معبّأة مسبقاً؛ لم يُستبدل أي نص كتبته.');
  };

  const proposePoints = () => {
    setPointSuggestion(buildPointSuggestion(data));
    setNotice('اقتراح تنقيط متوازن جاهز للمراجعة. لم يُطبّق بعد؛ راجع التوزيع ثم اختر «تطبيق التنقيط».');
  };

  const applyPoints = () => {
    if (!pointSuggestion) return;
    const applied = applyPointSuggestion(data, pointSuggestion);
    setData(applied.data);
    setPointSuggestion(null);
    setNotice(`طُبّق التنقيط المقترح على ${applied.applied} خانة فارغة. ما كتبته يدويًا لم يُستبدل.`);
  };

  const refillFromPlatform = () => {
    const filled = fillFromPlatform(data, { config, lesson: currentLesson, curriculum: curriculumLessons, level: currentLesson?.level });
    setData(filled.data);
    setFilledFromPlatform(filled.filled);
    setSkippedFromPlatform(filled.skipped);
    setNotice(filled.filled.length
      ? `عُبّئت ${filled.filled.length} خانة من المنصة دون المساس بما كتبته.`
      : 'لا توجد خانات فارغة يمكن تعبئتها من المنصة حاليًا.');
  };

  const handleImport = async (file: File, viaAgent = false) => {
    setError('');
    setNotice('');
    if (!isSupportedCorrectionFile(file)) {
      setError('نوع الملف غير مدعوم. المدعوم: صورة، PDF، Word (.docx)، أو ملف TXT.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('حجم الملف يتجاوز 20 ميغابايت.');
      return;
    }
    const shell = { fileName: file.name, fileSize: file.size, filled: [] as string[], exercises: [] as Array<{ label: string; questionCount: number }>, presets: [] as RecoveryPreset[], activePreset: 0 };
    setRecovery({ status: 'reading', ...shell });
    setBusy('import');
    let phase: RecoveryStatus = 'reading';
    try {
      const dataUrl = await readFileAsDataUrl(file);
      phase = 'analyzing';
      setRecovery(previous => previous ? { ...previous, status: 'analyzing' } : previous);
      const outcome = await importCorrectionFile({ file, dataUrl, examType: data.examType, current: data, lesson: currentLesson, config, viaAgent });
      phase = 'enriching';
      setRecovery(previous => previous ? { ...previous, status: 'enriching' } : previous);
      const platformFilled = fillFromPlatform(outcome.data, { config, lesson: currentLesson, curriculum: curriculumLessons, level: currentLesson?.level });
      const enriched = enrichCorrectionMemoFromDb(platformFilled.data, { lesson: currentLesson, curriculum: curriculumLessons });
      const part1 = enriched.data.exercises.filter(exercise => exercise.part === 1);
      setRecovery({
        status: 'ready',
        fileName: file.name,
        fileSize: file.size,
        summary: {
          exercises: outcome.extractedExercises,
          questions: outcome.extractedQuestions,
          points: outcome.extractedPoints,
          usedAI: outcome.usedAI,
          missing: outcome.missing,
          notice: outcome.notice,
        },
        filled: [...platformFilled.filled, ...enriched.filled],
        matchedLabel: enriched.matched ? [enriched.matched.mawrid, enriched.matched.maqta].filter(Boolean).join(' — ') : undefined,
        exercises: part1.map(exercise => ({
          label: exercise.label,
          questionCount: exercise.questions.filter(question => question.text.trim()).length,
        })),
        presets: recoveryPresets(enriched.data.examType, part1.length),
        activePreset: 0,
        data: enriched.data,
      });
    } catch {
      setRecovery(previous => previous
        ? { ...previous, status: 'error', failedStep: phase, error: 'تعذر استرداد الملف. يمكنك إعادة المحاولة أو إدخال التمارين يدويًا.' }
        : previous);
    } finally {
      setBusy(null);
    }
  };

  /** اعتماد نتيجة الاسترداد: تطبيق التنقيط المقترح على الخانات الفارغة ثم فتح المذكرة. */
  const confirmRecovery = () => {
    if (!recovery?.data) return;
    const preset = recovery.presets[recovery.activePreset];
    const suggestion = preset
      ? buildPointSuggestion(recovery.data, { exercisePoints: preset.exercisePoints, integrationPoints: preset.integrationPoints })
      : buildPointSuggestion(recovery.data);
    const applied = applyPointSuggestion(recovery.data, suggestion);
    const next = deepClone(applied.data);
    // لا نمنح نقطة لسؤال فارغ لم يُقرأ من الورقة.
    next.exercises.forEach(exercise => {
      exercise.questions.forEach(question => { if (!question.text.trim()) question.points = ''; });
    });
    next.integration.criteria.forEach(criterion => {
      criterion.indicators.forEach(indicator => { if (!indicator.text.trim()) indicator.points = ''; });
    });
    setData(next);
    setFilledFromPlatform(recovery.filled);
    setSkippedFromPlatform([]);
    setPointSuggestion(null);
    setImportMeta({
      exercises: recovery.summary?.exercises || 0,
      questions: recovery.summary?.questions || 0,
      points: recovery.summary?.points || 0,
      usedAI: Boolean(recovery.summary?.usedAI),
      missing: recovery.summary?.missing || [],
    });
    setRecovery(null);
    setNotice('اعتُمدت الورقة المستوردة وبيانات المنصة. راجع الإجابة النموذجية، ثم «توليد آلي لعناصر الإجابة» أو اكتبها يدويًا قبل المعاينة والتصدير.');
  };

  const targetedExercises = (): CorrectionExercise[] => {
    if (aiTarget === 'all') return data.exercises;
    const found = data.exercises.find(exercise => exercise.id === aiTarget);
    return found ? [found] : [];
  };

  const generateAnswers = async () => {
    const targets = targetedExercises();
    if (!targets.some(exercise => exercise.questions.some(question => question.text.trim()))) {
      setError('لا توجد أسئلة مستوردة لتوليد إجابات لها. استورد ورقة التقييم أو أدخل نص الأسئلة أولًا.');
      return;
    }
    setError('');
    setNotice('');
    setBusy('ai');
    try {
      const result = await suggestAnswersForExercises({ data, exercises: targets, lesson: currentLesson, curriculum: curriculumLessons });
      if (!result) {
        setError('تعذر التوليد الآلي. تحقق من إعداد مزوّد الذكاء الاصطناعي على الخادم، أو اكتب عناصر الإجابة يدويًا.');
        setAiResult(null);
        return;
      }
      setAiResult(result);
      setNotice('وصلت مقترحات الإجابة. لم تُطبَّق بعد؛ راجعها ثم اختر «تطبيق المقترحات».');
    } catch {
      setError('تعذر التوليد الآلي. اكتب عناصر الإجابة يدويًا.');
    } finally {
      setBusy(null);
    }
  };

  const applyAi = () => {
    if (!aiResult) return;
    const applied = applyCorrectionSuggestions(data, aiResult);
    setData(applied.data);
    setAiResult(null);
    setNotice(`طُبّقت ${applied.applied} عنصر إجابة مقترح.${applied.skipped ? ` وتُرك ${applied.skipped} عنصرًا لأنك كتبته يدويًا أو لأن المقترح فارغ.` : ''}`);
  };

  const resetAll = () => {
    const fresh = createDefaultCorrectionMemo(data.examType, data.exercises.filter(exercise => exercise.part === 1).length);
    const filled = fillFromPlatform(fresh, { config, lesson: currentLesson, curriculum: curriculumLessons, level: currentLesson?.level });
    setData(filled.data);
    setFilledFromPlatform(filled.filled);
    setSkippedFromPlatform(filled.skipped);
    setImportMeta(null);
    setAiResult(null);
    setNotice('أُعيدت المذكرة إلى قالب فارغ مع تعبئة بيانات المنصة.');
    setError('');
  };

  const handleExportWord = async () => {
    setError('');
    try {
      await exportCorrectionMemoDataToDocx(data, { allowFallback: false });
      setNotice('تم تصدير مذكرة التصحيح بصيغة Word مع تضمين الخط المختار.');
    } catch (err) {
      if (err instanceof DocxFontEmbedError) {
        const choice = await askWordFallbackChoice(err);
        if (choice === 'fallback') {
          try {
            await exportCorrectionMemoDataToDocx(data, { allowFallback: true });
            setNotice('تم تصدير مذكرة التصحيح بخط بديل لعدم توفر تضمين الخط.');
          } catch {
            setError('تعذر تصدير مذكرة التصحيح إلى Word.');
          }
        } else if (choice === 'pdf') {
          if (sheetRef.current) {
            await exportCorrectionMemoToPdf(sheetRef.current, data.title);
          } else {
            setShowPreview(true);
            setError('افتح المعاينة ثم اختر PDF لتصدير الوثيقة.');
          }
        } else {
          setNotice('تم إلغاء تصدير Word.');
        }
        return;
      }
      console.error('Correction memo Word export error:', err);
      setError('تعذر تصدير مذكرة التصحيح إلى Word.');
    }
  };

  if (!isOpen) return null;

  const part1Exercises = data.exercises.filter(exercise => exercise.part === 1);

  return (
    <div className="fixed inset-0 z-[60] bg-black/45 flex justify-end no-print-shell" onClick={onClose}>
      <aside
        className="relative w-full max-w-6xl h-full page-desk page-desk--correction shadow-2xl overflow-y-auto cm-print-root"
        dir="rtl"
        onClick={event => event.stopPropagation()}
        aria-label="مذكرة التصحيح"
      >
        <header className="sticky top-0 z-20 px-4 py-3 bg-gradient-to-l from-teal-900 to-emerald-700 text-white flex justify-between items-center gap-2 cm-toolbar">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/15 items-center justify-center shrink-0 hidden sm:flex"><CheckCircle2 className="w-5 h-5" /></div>
            <div className="min-w-0">
              <h2 className="font-black text-[13px] sm:text-[15px] leading-tight">مذكرة التصحيح — الإجابة النموذجية وسلّم التنقيط</h2>
              <p className="text-[10.5px] text-white/80 truncate">
                قالب قابل للتحرير · المجموع الحالي {total} ن · {savedAt ? `حُفظ محليًا ${savedAt}` : 'حفظ محلي'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="p-1.5 rounded-lg hover:bg-white/15"><X className="w-5 h-5" /></button>
        </header>

        <div className="cm-toolbar p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-emerald-200 p-2.5">
            <span className="text-[11px] font-black text-slate-500 px-1">نوع الورقة</span>
            {(['فرض', 'اختبار'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => changeExamType(type)}
                aria-pressed={data.examType === type}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-black border transition ${data.examType === type
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'}`}
              >
                {type === 'فرض' ? 'فرض — تمارين فقط' : 'اختبار — تمرينان ووضعية إدماجية'}
              </button>
            ))}
            {data.examType === 'فرض' && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-1.5 py-0.5">
                <span className="text-[10.5px] font-black text-slate-600 px-1">عدد التمارين</span>
                {([2, 3] as const).map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => changeDevoirCount(count)}
                    aria-pressed={data.exercises.filter(exercise => exercise.part === 1).length === count}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-black border transition ${data.exercises.filter(exercise => exercise.part === 1).length === count
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {count}
                  </button>
                ))}
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-bold">
              {data.examType === 'فرض'
                ? `${examStructure('فرض', data.exercises.filter(exercise => exercise.part === 1).length).exercisePoints.join(' + ')} = 20 ن بلا وضعية إدماجية`
                : `${examStructure('اختبار').exercisePoints.join(' + ')} = ${examStructure('اختبار').part1Points} ن + وضعية إدماجية ${examStructure('اختبار').integrationPoints} ن`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-teal-100 p-2.5">
            <span className="text-[11px] font-black text-slate-500 px-1">استرداد الملف</span>
            <button type="button" onClick={() => { viaAgentRef.current = false; fileRef.current?.click(); }} disabled={busy !== null} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-[11.5px] font-black disabled:opacity-50">
              {busy === 'import' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
              استيراد ورقة الفرض/الاختبار
            </button>
            <button type="button" onClick={() => { viaAgentRef.current = true; fileRef.current?.click(); }} disabled={busy !== null} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-teal-300 text-teal-900 text-[11.5px] font-black disabled:opacity-50">
              {busy === 'import' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
              وكيل المستندات يقرأ ويعبّئ القالب
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.docx,.doc,image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={event => {
                const file = event.target.files?.[0];
                const viaAgent = viaAgentRef.current;
                viaAgentRef.current = false;
                if (file) void handleImport(file, viaAgent);
                event.target.value = '';
              }}
            />
            <span className="text-[10px] text-slate-500 font-bold">صورة أو PDF أو Word (.docx) — الوكيل يقرأ ويحلّل ويعبّئ القالب من قاعدة المنصة، وTXT بقراءة محلية</span>
            <span className="flex-1" />
            <button type="button" onClick={refillFromPlatform} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-teal-200 text-teal-900 text-[11.5px] font-black">
              <Wand2 className="w-3.5 h-3.5" /> تعبئة من المنصة
            </button>
            <button type="button" onClick={enrichFromDb} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-[11.5px] font-black">
              <Database className="w-3.5 h-3.5" /> تعبئة من قاعدة البيانات
            </button>
            <button type="button" onClick={resetAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11.5px] font-black">
              <RotateCcw className="w-3.5 h-3.5" /> قالب جديد
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-amber-100 p-2.5">
            <span className="text-[11px] font-black text-slate-500 px-1">التصحيح</span>
            <select value={aiTarget} onChange={event => setAiTarget(event.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white">
              <option value="all">كل التمارين</option>
              {data.exercises.map((exercise, index) => (
                <option key={exercise.id} value={exercise.id}>{exercise.label || `التمرين ${index + 1}`}</option>
              ))}
            </select>
            <button type="button" onClick={generateAnswers} disabled={busy !== null} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-[11.5px] font-black disabled:opacity-50">
              {busy === 'ai' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              توليد آلي لعناصر الإجابة
            </button>
            {aiResult && (
              <button type="button" onClick={applyAi} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-[11.5px] font-black">
                <CheckCircle2 className="w-3.5 h-3.5" /> تطبيق المقترحات ({aiResult.suggestions.length})
              </button>
            )}
            <button type="button" onClick={proposePoints} disabled={!data.exercises.some(exercise => exercise.questions.length)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-700 text-white text-[11.5px] font-black disabled:opacity-50">
              <Calculator className="w-3.5 h-3.5" /> اقتراح التنقيط
            </button>
            <span className="text-[10px] text-slate-500 font-bold">أو اكتب عناصر الإجابة مباشرة في الجداول — المكتوب يدويًا لا يُستبدل آليًا</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-slate-200 p-2.5">
            <button type="button" onClick={() => sheetRef.current && printCorrectionMemo(sheetRef.current, data.title)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11.5px] font-black">
              <Printer className="w-3.5 h-3.5" /> طباعة A4
            </button>
            <button type="button" onClick={() => sheetRef.current && void exportCorrectionMemoToPdf(sheetRef.current, data.title)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-[11.5px] font-black">
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
            <button type="button" onClick={() => void handleExportWord()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 text-white text-[11.5px] font-black">
              <FileDown className="w-3.5 h-3.5" /> Word بجداول
            </button>
            <button type="button" onClick={() => setShowPreview(value => !value)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11.5px] font-black">
              {showPreview ? 'إخفاء المعاينة' : 'إظهار المعاينة'}
            </button>
            <PageTemplateSwitcher />
            <span className="flex-1" />
            <SourceLegend />
          </div>

          {notice && <div className="rounded-xl bg-teal-50 border border-teal-200 px-3 py-2 text-[11.5px] font-bold text-teal-900">{notice}</div>}
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11.5px] font-bold text-red-800">{error}</div>}

          {importMeta && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-[11px] text-blue-900 space-y-1">
              <div className="font-black">نتيجة الاستيراد: {importMeta.exercises} تمرين · {importMeta.questions} سؤال · {importMeta.points} سؤال بنقطة مقروءة {importMeta.usedAI ? '· عبر خدمة التحليل' : '· قراءة محلية'}.</div>
              {importMeta.missing.length > 0 && <div>لم يأتِ من الملف: {importMeta.missing.join(' · ')}.</div>}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900 space-y-0.5">
              {warnings.map((warning, index) => (
                <div key={index} className={`flex items-start gap-1.5 ${warning.blocking ? 'font-bold' : ''}`}>
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <span>{warning.message}</span>
                </div>
              ))}
            </div>
          )}

          {filledFromPlatform.length > 0 && (
            <div className="rounded-xl bg-white border border-teal-100 px-3 py-2 text-[10.5px] text-slate-600">
              <span className="font-black text-teal-800">عُبّئ من المنصة: </span>{filledFromPlatform.slice(0, 8).join(' · ')}
              {skippedFromPlatform.length > 0 && <span className="block mt-1">لم يُعبّأ لغياب المصدر أو لوجود قيمة يدوية: {skippedFromPlatform.slice(0, 8).join(' · ')}</span>}
            </div>
          )}

          {pointSuggestion && (
            <div className="rounded-xl bg-white border border-indigo-200 p-2.5 space-y-1.5">
              <div className="text-[11px] font-black text-indigo-800">
                اقتراح التنقيط — الجزء الأول {pointSuggestion.part1DeclaredPoints} ن
                {pointSuggestion.integrationDeclaredPoints ? ` + الوضعية الإدماجية ${pointSuggestion.integrationDeclaredPoints} ن` : ''}
                {' '}· المجموع {pointSuggestion.total} ن (لم يُطبّق بعد)
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                {pointSuggestion.exercises.map(exercise => (
                  <div key={exercise.exerciseId} className="text-[10.5px] text-slate-700 border-t border-slate-100 pt-1">
                    <span className="font-black">{exercise.label}</span> · {exercise.declaredPoints} ن
                    <div className="text-[10px] text-slate-500">
                      {exercise.questions.map(question => `س${question.number}: ${question.points} ن`).join(' · ')}
                    </div>
                  </div>
                ))}
                {pointSuggestion.criteria.length > 0 && (
                  <div className="text-[10.5px] text-slate-700 border-t border-slate-100 pt-1">
                    <span className="font-black">الوضعية الإدماجية</span>
                    <div className="text-[10px] text-slate-500">
                      {pointSuggestion.criteria.map(criterion => `${criterion.label}: ${criterion.indicators.reduce((sum, indicator) => sum + (Number(indicator.points) || 0), 0)} ن`).join(' · ')}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={applyPoints} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-700 text-white text-[10.5px] font-black">
                  <CheckCircle2 className="w-3 h-3" /> تطبيق التنقيط على الخانات الفارغة
                </button>
                <button type="button" onClick={() => setPointSuggestion(null)} className="text-[10px] font-black text-slate-500 hover:text-slate-800">تجاهل</button>
              </div>
            </div>
          )}

          {aiResult && (
            <div className="rounded-xl bg-white border border-amber-200 p-2.5 space-y-1.5">
              <div className="text-[11px] font-black text-amber-800">مقترحات لم تُطبَّق بعد — راجعها قبل القبول</div>
              {aiResult.suggestions.slice(0, 4).map(suggestion => (
                <div key={suggestion.questionId} className="text-[10.5px] text-slate-700 border-t border-slate-100 pt-1">
                  <span className="font-bold">{suggestion.expected.slice(0, 160) || 'لا يوجد نص'}</span>
                  {suggestion.needsReview && <span className="text-amber-700 font-bold"> · يحتاج مراجعة الأستاذ</span>}
                </div>
              ))}
              {aiResult.ambiguous.length > 0 && <div className="text-[10px] text-amber-800">غير واضح: {aiResult.ambiguous.slice(0, 3).join(' · ')}</div>}
              <button type="button" onClick={() => setAiResult(null)} className="text-[10px] font-black text-slate-500 hover:text-slate-800">تجاهل المقترحات</button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-slate-200 p-2.5">
            <span className="text-[11px] font-black text-slate-500 px-1">تحرير التمارين</span>
            <button
              type="button"
              onClick={() => mutate(draft => {
                const exercise = draft.exercises[draft.exercises.length - 1];
                const label = `التمرين ${draft.exercises.length + 1}`;
                draft.exercises.push({
                  id: uid('ex'),
                  part: exercise?.part || 1,
                  label,
                  declaredPoints: '',
                  maqta: exercise?.maqta || '',
                  knowledge: exercise?.knowledge || '',
                  criteria: exercise?.criteria || '',
                  source: 'teacher',
                  questions: [{ id: uid('q'), number: '1', text: '', points: '', expected: '', source: 'template', needsReview: false }],
                });
                draft.resources.push({
                  id: uid('res'),
                  exerciseLabel: label,
                  maqta: exercise?.maqta || '',
                  knowledge: exercise?.knowledge || '',
                  criteria: exercise?.criteria || '',
                  maqtaSource: exercise?.maqta ? 'platform' : 'template',
                  knowledgeSource: exercise?.knowledge ? 'platform' : 'template',
                  criteriaSource: exercise?.criteria ? 'platform' : 'template',
                });
              })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-black"
            >
              <Plus className="w-3.5 h-3.5" /> تمرين
            </button>
            <button
              type="button"
              onClick={() => mutate(draft => {
                draft.errors.push({ id: uid('err'), exercise: '', error: '', kind: '', learners: '', cause: '' });
              })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-black"
            >
              <Plus className="w-3.5 h-3.5" /> خطأ متكرر
            </button>
            <button
              type="button"
              onClick={() => mutate(draft => {
                draft.remediation.push({ id: uid('rem'), objective: '', activity: '', support: '', learners: '' });
              })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-black"
            >
              <Plus className="w-3.5 h-3.5" /> سطر معالجة
            </button>
            <span className="text-[10px] text-slate-500 font-bold">تُضاف الصفوف عند الحاجة دون تغيير الشكل</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 space-y-2">
            <div className="text-[11px] font-black text-slate-600 px-1">التمارين والأسئلة (يمكن حذف صف أو سؤال)</div>
            {part1Exercises.map((exercise, index) => (
              <details key={exercise.id} className="rounded-xl border border-slate-200 p-2">
                <summary className="cursor-pointer text-[11.5px] font-black text-slate-800 flex items-center justify-between gap-2">
                  <span>{exercise.label || `التمرين ${index + 1}`} · {exerciseTotal(exercise)} ن</span>
                  <Chip source={exercise.source} />
                </summary>
                <div className="mt-2 space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    <input value={exercise.label} onChange={event => mutate(draft => { const target = draft.exercises.find(item => item.id === exercise.id); if (target) target.label = event.target.value; })} className="flex-1 min-w-[140px] border border-slate-200 rounded-lg px-2 py-1 text-[11px]" placeholder="اسم التمرين" />
                    <input value={exercise.declaredPoints} onChange={event => mutate(draft => { const target = draft.exercises.find(item => item.id === exercise.id); if (target) target.declaredPoints = event.target.value; })} className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-[11px]" placeholder="النقطة" />
                    <button type="button" onClick={() => mutate(draft => {
                      draft.exercises = draft.exercises.filter(item => item.id !== exercise.id);
                      draft.resources = draft.resources.filter(item => item.exerciseLabel !== exercise.label);
                    })} className="px-2 py-1 rounded-lg bg-red-50 text-red-700 text-[10.5px] font-black inline-flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> حذف التمرين
                    </button>
                  </div>
                  {exercise.questions.map(question => (
                    <div key={question.id} className="flex flex-wrap items-start gap-1.5">
                      <input value={question.number} onChange={event => mutate(draft => { const target = draft.exercises.find(item => item.id === exercise.id)?.questions.find(item => item.id === question.id); if (target) target.number = event.target.value; })} className="w-12 border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] text-center" />
                      <input value={question.text} onChange={event => mutate(draft => { const target = draft.exercises.find(item => item.id === exercise.id)?.questions.find(item => item.id === question.id); if (target) target.text = event.target.value; })} className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-2 py-1 text-[11px]" placeholder="نص السؤال كما ورد في الورقة" />
                      <input value={question.points} onChange={event => mutate(draft => { const target = draft.exercises.find(item => item.id === exercise.id)?.questions.find(item => item.id === question.id); if (target) target.points = event.target.value; })} className="w-16 border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] text-center" placeholder="ن" />
                      <button type="button" onClick={() => mutate(draft => { const target = draft.exercises.find(item => item.id === exercise.id); if (target) target.questions = target.questions.filter(item => item.id !== question.id); })} aria-label="حذف السؤال" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => mutate(draft => { const target = draft.exercises.find(item => item.id === exercise.id); if (target) target.questions.push({ id: uid('q'), number: String(target.questions.length + 1), text: '', points: '', expected: '', source: 'template', needsReview: false }); })} className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-800">
                    <Plus className="w-3 h-3" /> إضافة سؤال
                  </button>
                </div>
              </details>
            ))}
          </div>
        </div>

        {showPreview && (
          <div className="p-3">
            <div ref={sheetRef} className="page-sheet page-sheet--correction mx-auto" style={{ maxWidth: '210mm', padding: '12mm' }}>
              <CorrectionMemoSheet data={data} editable onChange={mutate} />
            </div>
          </div>
        )}

        <div className="cm-toolbar px-3 pb-6 text-[10px] text-slate-500 space-y-1">
          <div className="font-bold">الرموز الملونة: أخضر = من المنصة · أزرق = مستورد من الورقة · برتقالي = اقتراح AI · رمادي داكن = محرَّر يدويًا.</div>
          <div>الأولوية: ما أكده الأستاذ ← الورقة الأصلية ← قاعدة المنصة ← مقترح AI. لا يُستبدل أي نص كتبته يدويًا. القالب الفارغ لا يُملأ بالتخمين.</div>
        </div>
        {recovery && (
          <CorrectionImportRecovery
            status={recovery.status}
            failedStep={recovery.failedStep}
            fileName={recovery.fileName}
            fileSize={recovery.fileSize}
            summary={recovery.summary}
            filled={recovery.filled}
            matchedLabel={recovery.matchedLabel}
            exercises={recovery.exercises}
            presets={recovery.presets.length ? recovery.presets : recoveryPresets(data.examType, data.exercises.filter(exercise => exercise.part === 1).length)}
            activePreset={recovery.activePreset}
            suggestedTotal={(() => {
              const presets = recovery.presets.length ? recovery.presets : recoveryPresets(data.examType, 2);
              const chosen = presets[recovery.activePreset] || presets[0];
              return chosen ? chosen.exercisePoints.reduce((sum, value) => sum + value, 0) + chosen.integrationPoints : 0;
            })()}
            totalTarget={20}
            error={recovery.error}
            onPreset={index => setRecovery(previous => previous ? { ...previous, activePreset: index } : previous)}
            onConfirm={confirmRecovery}
            onRetry={() => fileRef.current?.click()}
            onCancel={() => setRecovery(null)}
          />
        )}
      </aside>
      <DocxFontFallbackModal
        error={pendingWordFontError}
        onConfirmFallback={confirmWordFallback}
        onExportPdf={sheetRef.current ? exportWordPdfInstead : undefined}
        onCancel={cancelWordFallback}
      />
    </div>
  );
};
