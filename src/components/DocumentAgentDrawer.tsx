import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  FileUp,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { AgentReadResponse, AgentStatusResponse } from '../services/documentAgent';
import { AGENT_LEVEL_LABELS } from '../services/documentAgent';
import { fetchAgentStatus, readWithAgent } from '../services/documentAgentClient';
import {
  type AgentMemoryRecord,
  agentMemoryHints,
  clearAgentMemory,
  forgetAgentDocument,
  loadAgentMemory,
  rememberAgentDocument,
  searchAgentMemory,
} from '../services/agentMemoryStore';
import { saveKnowledgeDoc } from '../services/knowledgeLibraryStore';

interface DocumentAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLevel?: '1am' | '2am' | '3am' | '4am';
  showToast?: (message: string) => void;
}

const ACCEPT = '.pdf,.docx,.txt,.md,.csv,.html,.htm,.png,.jpg,.jpeg,.webp,.gif';
const MAX_BYTES = 20 * 1024 * 1024;

const STEPS = [
  'استلام الملف وفحص صيغته',
  'استخراج النص محليًا',
  'تحليل التمارين والنقاط',
  'مطابقة قاعدة بيانات المنصة',
  'استدعاء ذاكرة الوكيل',
];

const FORMAT_LABELS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  text: 'نص',
  html: 'HTML',
  image: 'صورة',
  unsupported: 'غير مدعوم',
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
};

export const DocumentAgentDrawer: React.FC<DocumentAgentDrawerProps> = ({
  isOpen,
  onClose,
  selectedLevel,
  showToast,
}) => {
  const [status, setStatus] = useState<AgentStatusResponse | null>(null);
  const [memory, setMemory] = useState<AgentMemoryRecord[]>([]);
  const [memoryQuery, setMemoryQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [examType, setExamType] = useState<'' | 'فرض' | 'اختبار'>('');
  const [level, setLevel] = useState(selectedLevel || '');
  const [manualText, setManualText] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<AgentReadResponse | null>(null);
  const [error, setError] = useState('');
  const [learned, setLearned] = useState(false);
  const [knowledgeSaved, setKnowledgeSaved] = useState('');
  const [dragging, setDragging] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchAgentStatus().then(value => { if (active) setStatus(value); });
    loadAgentMemory().then(value => { if (active) setMemory(value); });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedLevel) return;
    setLevel(current => current || selectedLevel);
  }, [isOpen, selectedLevel]);

  useEffect(() => {
    if (!working) return;
    setStage(0);
    const timer = window.setInterval(() => {
      setStage(current => (current < STEPS.length - 1 ? current + 1 : current));
    }, 1200);
    return () => window.clearInterval(timer);
  }, [working]);

  const memoryShown = useMemo(
    () => (memoryQuery.trim() ? searchAgentMemory(memoryQuery, memory) : memory).slice(0, 10),
    [memory, memoryQuery],
  );

  if (!isOpen) return null;

  const pickFile = (next: File | null) => {
    setError('');
    setResult(null);
    setLearned(false);
    setKnowledgeSaved('');
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(`حجم الملف ${formatBytes(next.size)} يتجاوز الحد (20 م.ب).`);
      return;
    }
    setFile(next);
  };

  const runAnalysis = async (useText: boolean) => {
    if (useText && manualText.trim().length < 10) {
      setError('أدخل نصًا أطول ليتمكن الوكيل من تحليله.');
      return;
    }
    if (!useText && !file) {
      setError('اختر ملفًا أولًا.');
      return;
    }
    setWorking(true);
    setError('');
    setResult(null);
    setLearned(false);
    setKnowledgeSaved('');
    try {
      const response = await readWithAgent({
        file: useText ? null : file,
        text: useText ? manualText : '',
        examType,
        level,
        memory: agentMemoryHints(memory),
      });
      setResult(response);
      setStage(STEPS.length - 1);
      showToast?.(`قرأ الوكيل الملف: ${response.analysis.summary}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر تحليل الملف.');
    } finally {
      setWorking(false);
    }
  };

  const handleLearn = async () => {
    if (!result) return;
    try {
      await rememberAgentDocument({
        title: result.analysis.title || file?.name || 'مستند',
        fileName: file?.name || 'نص-يدوي.txt',
        format: result.read.format,
        level: result.analysis.level,
        examType: result.analysis.examType,
        exerciseCount: result.analysis.exercises.length,
        points: result.analysis.pointsSum || null,
        keywords: result.analysis.keywords,
        summary: result.analysis.summary,
        text: result.read.text,
      });
      setMemory(await loadAgentMemory());
      setLearned(true);
      showToast?.('حفظ الوكيل هذا المستند في ذاكرته، وسيستدعيه في الملفات المشابهة.');
    } catch {
      showToast?.('تعذر حفظ المستند في ذاكرة الوكيل.');
    }
  };

  const handleKnowledgeSave = () => {
    if (!result?.read.text.trim()) return;
    const saved = saveKnowledgeDoc({
      kind: 'teacherDocument',
      title: result.analysis.title || file?.name || 'وثيقة وكيل المستندات',
      level: (result.analysis.level || 'all') as '1am' | '2am' | '3am' | '4am' | 'all',
      text: result.read.text,
      authority: 'وثيقة قرأها وكيل المستندات داخل المنصة',
      source: 'teacher',
    });
    if (saved) {
      setKnowledgeSaved(`أُضيفت «${saved.title}» إلى قاعدة معرفة المنصة؛ ستستعملها المنصة والوكيل في الاسترجاع القادم.`);
      showToast?.('أُضيف النص إلى قاعدة معرفة المنصة.');
    } else {
      showToast?.('تعذر إضافة النص إلى قاعدة المعرفة.');
    }
  };

  const forget = async (id: string) => {
    await forgetAgentDocument(id);
    setMemory(await loadAgentMemory());
  };

  const wipeMemory = async () => {
    await clearAgentMemory();
    setMemory([]);
    showToast?.('أُفرغت ذاكرة وكيل المستندات.');
  };

  const analysis = result?.analysis;

  return (
    <div id="document-agent" dir="rtl" className="fixed inset-0 z-50 bg-[#eef3f1] flex" aria-label="وكيل المستندات">
      <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0b1f1c] text-[#f0d492] flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-slate-900">وكيل المستندات</p>
              <p className="text-[10px] text-slate-500 truncate">يقرأ ويحلّل ويتعلّم داخل المنصة</p>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto">
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10.5px] font-black text-teal-900">
              <BrainCircuit className="w-3.5 h-3.5" /> قراءة محلية دائمة
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {(status?.localFormats || ['pdf', 'docx', 'text']).map(format => (
                <span key={format} className="rounded-md border border-teal-200 bg-white px-1.5 py-0.5 text-[9.5px] font-bold text-teal-800">
                  {FORMAT_LABELS[format] || format}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-teal-800/80">
              {status?.visionConfigured ? 'مزوّد رؤية متاح للصور والوثائق المصوّرة.' : 'الصور والوثائق المصوّرة تقبل نصًا بديلًا يدويًا.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10.5px] font-black text-slate-700">
              <Database className="w-3.5 h-3.5 text-[#a06a12]" /> قاعدة بيانات المنصة
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] font-bold text-slate-600">
              <span>{status?.platformDatabase.lessons ?? '—'} مذكرة</span>
              <span>{status?.platformDatabase.officialDocuments ?? '—'} وثيقة رسمية</span>
              <span className="col-span-2 text-slate-400">{status?.platformDatabase.families ?? 4} عائلات مرجعية</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
              <p className="flex items-center gap-1.5 text-[10.5px] font-black text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> ذاكرة الوكيل ({memory.length})
              </p>
              {memory.length > 0 && (
                <button type="button" onClick={wipeMemory} className="text-[9.5px] font-bold text-rose-600 hover:underline">
                  تفريغ
                </button>
              )}
            </div>
            <div className="p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={memoryQuery}
                  onChange={event => setMemoryQuery(event.target.value)}
                  placeholder="ابحث فيما تعلّمه الوكيل…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-7 pl-2 text-[10.5px] font-bold text-slate-700 outline-none focus:border-teal-500"
                />
              </div>
              <div className="mt-1.5 max-h-64 space-y-1 overflow-y-auto">
                {!memoryShown.length && (
                  <p className="px-1 py-2 text-[10px] leading-relaxed text-slate-400">
                    لا شيء بعد. بعد تحليل ملف اضغط «تعلّم من هذا الملف» فيُحفظ هنا.
                  </p>
                )}
                {memoryShown.map(record => (
                  <div key={record.id} className="group rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="line-clamp-2 text-[10.5px] font-black text-slate-800">{record.title}</p>
                      <button
                        type="button"
                        onClick={() => forget(record.id)}
                        aria-label={`حذف ${record.title} من ذاكرة الوكيل`}
                        className="shrink-0 rounded p-0.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400">
                      {[record.examType, AGENT_LEVEL_LABELS[record.level] || record.level, record.points ? `${record.points} ن` : ''].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="px-1 text-[9px] leading-relaxed text-slate-400">
            الذاكرة تُحفظ على جهازك (localStorage) ولا تُرسل إلى مزوّد خارجي. المطابقة تستعمل قاعدة بيانات المنصة الرسمية.
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileSearch className="h-5 w-5 shrink-0 text-teal-700" />
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-black text-slate-900">وكيل المستندات المستقل</h2>
              <p className="truncate text-[10px] text-slate-500">قراءة محلية · تحليل تربوي · تعلّم من قاعدة المنصة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9.5px] font-black ${status?.visionConfigured ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status?.visionConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {status?.visionConfigured ? 'رؤية متاحة للصور' : 'بدون مزوّد خارجي'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق وكيل المستندات"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-4xl space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="agent-exam-type" className="mb-1 block text-[10.5px] font-black text-slate-500">نوع الورقة</label>
                  <select
                    id="agent-exam-type"
                    value={examType}
                    onChange={event => setExamType(event.target.value as '' | 'فرض' | 'اختبار')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="">تعرّف تلقائي</option>
                    <option value="فرض">فرض</option>
                    <option value="اختبار">اختبار</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="agent-level" className="mb-1 block text-[10.5px] font-black text-slate-500">المستوى</label>
                  <select
                    id="agent-level"
                    value={level}
                    onChange={event => setLevel(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="">تعرّف تلقائي</option>
                    {Object.entries(AGENT_LEVEL_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                onDragOver={event => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={event => {
                  event.preventDefault();
                  setDragging(false);
                  pickFile(event.dataTransfer.files?.[0] || null);
                }}
                className={`mt-3 rounded-2xl border-2 border-dashed p-5 text-center transition ${dragging ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}
              >
                <Upload className="mx-auto h-7 w-7 text-teal-700" />
                <p className="mt-2 text-[12.5px] font-black text-slate-800">أفلت الملف هنا أو اختره من جهازك</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  PDF نصي · Word (.docx) · TXT · HTML · صور (تُقرأ بمزوّد رؤية أو بنص بديل)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={event => pickFile(event.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-[12px] font-black text-white transition hover:bg-teal-800"
                >
                  <FileUp className="h-4 w-4" /> اختيار ملف
                </button>
              </div>

              {file && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-teal-700" />
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-black text-teal-900">{file.name}</p>
                      <p className="text-[9.5px] font-bold text-teal-700/70">{formatBytes(file.size)} · {file.type || 'صيغة غير معروفة'}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => pickFile(null)} aria-label="إزالة الملف" className="rounded p-1 text-teal-700 hover:bg-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runAnalysis(false)}
                  disabled={working || !file}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0b1f1c] px-4 py-2 text-[12px] font-black text-white transition hover:bg-[#123a33] disabled:opacity-40"
                >
                  {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#f0d492]" />}
                  {working ? 'الوكيل يعمل…' : 'اقرأ وحلّل'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManual(value => !value)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11.5px] font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" /> نص بديل (لصورة أو وثيقة مصوّرة)
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={() => { setResult(null); setFile(null); setManualText(''); setLearned(false); setKnowledgeSaved(''); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11.5px] font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    ملف جديد
                  </button>
                )}
              </div>

              {showManual && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <label htmlFor="agent-manual-text" className="mb-1 block text-[10.5px] font-black text-slate-500">
                    الصق نص الورقة هنا ليحللها الوكيل محليًا (بدل OCR)
                  </label>
                  <textarea
                    id="agent-manual-text"
                    value={manualText}
                    onChange={event => setManualText(event.target.value)}
                    rows={6}
                    dir="rtl"
                    placeholder={'التمرين الأول (6 نقاط)\n1) …\nالتمرين الثاني (6 نقاط)\n1) …\nالوضعية الإدماجية (8 نقاط)…'}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-[12px] leading-relaxed text-slate-800 outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => runAnalysis(true)}
                    disabled={working || manualText.trim().length < 10}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-teal-800 disabled:opacity-40"
                  >
                    {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    حلّل النص
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </p>
              )}
            </section>

            {(working || stage > 0) && !result && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-[11px] font-black text-slate-600">مسار الوكيل</p>
                <ol className="space-y-1.5">
                  {STEPS.map((label, index) => {
                    const done = stage > index;
                    const active = stage === index && working;
                    return (
                      <li key={label} className="flex items-center gap-2 text-[11px] font-bold">
                        {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                        <span className={done ? 'text-slate-700' : active ? 'text-teal-800' : 'text-slate-400'}>{label}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {result && analysis && (
              <>
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10.5px] font-black text-teal-900">
                      {analysis.examType}
                    </span>
                    {analysis.levelLabel && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-700">{analysis.levelLabel}</span>
                    )}
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-700">
                      {analysis.exercises.length} عنصر · {analysis.pointsSum || '—'} نقطة
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-700">
                      {FORMAT_LABELS[result.read.format] || result.read.format} · {result.read.chars.toLocaleString('ar')} حرف
                      {result.read.pages ? ` · ${result.read.pages} صفحة` : ''}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10.5px] font-bold ${result.read.quality.score >= 55 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                      جودة القراءة {result.read.quality.score}%
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] font-bold leading-relaxed text-slate-700">{analysis.summary}</p>
                  {result.provider && (
                    <p className="mt-1 text-[10px] font-bold text-emerald-700">استعان الوكيل بمزوّد الرؤية ({result.provider}) لأن الملف بلا طبقة نصية.</p>
                  )}
                  {result.read.notes.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {result.read.notes.map(note => (
                        <li key={note} className="flex items-start gap-1.5 text-[10.5px] font-bold leading-relaxed text-amber-800">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {note}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleLearn}
                      disabled={learned || !result.read.text.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-teal-800 disabled:opacity-50"
                    >
                      {learned ? <CheckCircle2 className="h-3.5 w-3.5" /> : <BrainCircuit className="h-3.5 w-3.5" />}
                      {learned ? 'تعلّمه الوكيل' : 'تعلّم من هذا الملف'}
                    </button>
                    <button
                      type="button"
                      onClick={handleKnowledgeSave}
                      disabled={!result.read.text.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Database className="h-3.5 w-3.5 text-[#a06a12]" /> أضف إلى قاعدة معرفة المنصة
                    </button>
                  </div>
                  {knowledgeSaved && (
                    <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10.5px] font-bold text-emerald-800">{knowledgeSaved}</p>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-black text-slate-800">
                    <BookOpen className="h-4 w-4 text-teal-700" /> البنية المقروءة
                  </h3>
                  {!analysis.exercises.length && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] font-bold text-slate-500">
                      لم يجد الوكيل تمارين مرقّمة. جرّب إدخال النص في «نص بديل» أو راجع الملف.
                    </p>
                  )}
                  <div className="space-y-2">
                    {analysis.exercises.map((exercise, index) => (
                      <details key={`${exercise.number}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
                          <span className="flex items-center gap-2 text-[11.5px] font-black text-slate-800">
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${exercise.kind === 'integration' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                              {exercise.kind === 'integration' ? 'وضعية' : 'تمرين'}
                            </span>
                            {exercise.title}
                          </span>
                          <span className="text-[10px] font-black text-slate-500">{exercise.points ?? '—'} ن</span>
                        </summary>
                        <ul className="space-y-1 border-t border-slate-200 px-3 py-2">
                          {exercise.questions.map((question, questionIndex) => (
                            <li key={`${question.number}-${questionIndex}`} className="flex items-start justify-between gap-2 text-[11px] font-bold leading-relaxed text-slate-600">
                              <span><span className="text-slate-400">{question.number}.</span> {question.text || '—'}</span>
                              <span className="shrink-0 text-[10px] text-slate-400">{question.points ?? '—'} ن</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>

                  {analysis.suggestions.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {analysis.suggestions.map(item => (
                        <li key={item.message} className={`flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold leading-relaxed ${item.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          {item.tone === 'warning' ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> : <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-teal-700" />}
                          {item.message}
                        </li>
                      ))}
                    </ul>
                  )}
                  {analysis.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {analysis.warnings.map(warning => (
                        <li key={warning} className="text-[10.5px] font-bold text-rose-700">• {warning}</li>
                      ))}
                    </ul>
                  )}
                </section>

                {(analysis.matches.length > 0 || result.citations.length > 0) && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-black text-slate-800">
                      <Database className="h-4 w-4 text-[#a06a12]" /> مطابقة قاعدة بيانات المنصة
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {analysis.matches.map(match => (
                        <div key={`${match.ta3alom}-${match.score}`} className="rounded-xl border border-teal-200 bg-teal-50/60 p-2.5">
                          <p className="text-[10px] font-black text-teal-700">{match.midan}</p>
                          <p className="text-[11.5px] font-black text-slate-800">{match.maqta}</p>
                          <p className="text-[10.5px] font-bold text-slate-600">{match.mawrid}</p>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-500">{match.ta3alom}</p>
                          <p className="mt-1 text-[9px] font-black text-teal-700">تقاطع دلالي {match.score}</p>
                        </div>
                      ))}
                    </div>
                    {result.citations.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400">استشهادات من الوثائق الرسمية ووثائق الأستاذ</p>
                        {result.citations.map((citation, index) => (
                          <div key={`${citation.title}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <p className="text-[10px] font-black text-slate-700">
                              {citation.label}{citation.page ? ` — ص ${citation.page}` : ''}
                            </p>
                            <p className="mt-0.5 line-clamp-3 text-[10.5px] leading-relaxed text-slate-600">{citation.snippet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {result.recalled.length > 0 && (
                  <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-black text-amber-900">
                      <BrainCircuit className="h-4 w-4" /> من ذاكرة الوكيل (ملفات مشابهة تعلّمها سابقًا)
                    </h3>
                    <div className="space-y-1.5">
                      {result.recalled.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5">
                          <p className="truncate text-[11px] font-black text-slate-800">{item.title}</p>
                          <p className="shrink-0 text-[9.5px] font-bold text-amber-800">
                            تشابه {Math.round(item.similarity * 100)}%{item.points ? ` · ${item.points} ن` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-[12px] font-black text-slate-800">
                      <FileText className="h-4 w-4 text-teal-700" /> النص المستخرج
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFullText(value => !value)}
                      className="text-[10.5px] font-black text-teal-700 hover:underline"
                    >
                      {showFullText ? 'طيّ النص' : 'عرض النص'}
                    </button>
                  </div>
                  {showFullText ? (
                    <pre dir="rtl" className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
                      {result.read.text.slice(0, 30_000) || 'لا يوجد نص مستخرج.'}
                    </pre>
                  ) : (
                    <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-slate-500">
                      {result.read.text.slice(0, 240) || 'لا يوجد نص مستخرج.'}
                    </p>
                  )}
                </section>
              </>
            )}

            {!result && !working && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                <Bot className="mx-auto h-8 w-8 text-teal-700" />
                <p className="mt-2 text-[13px] font-black text-slate-800">وكيل مستقل داخل المنصة، بلا حاجة إلى مفتاح ذكاء اصطناعي</p>
                <p className="mx-auto mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
                  يقرأ PDF النصي وWord والنصوص محليًا على الخادم، يستخرج التمارين والأسئلة والنقاط والوضعية الإدماجية،
                  يطابقها مع المذكرات والتدرجات والوثائق الرسمية، ويحفظ ما تعلّمه ليعود إليه في الملفات المشابهة.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
