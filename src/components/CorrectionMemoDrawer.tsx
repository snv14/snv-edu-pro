import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardCheck, FileDown, Printer, Sparkles, X, Paperclip, FileUp, RotateCcw, XCircle, Trash2 } from 'lucide-react';
import { LessonMemo, MemoConfig } from '../types';
import { analyzeCorrectionSource, generateCorrectionMemo, CorrectionSourceAnalysis } from '../services/correctionMemoAi';
import { exportCorrectionMemoToDocx, exportCorrectionMemoToPdf, printCorrectionMemo } from '../utils/correctionMemoExport';
import { MemoAttachment, fileToMemoAttachment, listMemoAttachments, listMemoSourceDocuments, saveMemoAttachment, deleteMemoAttachment, MAX_TOTAL_ATTACHMENT_BYTES } from '../services/memoAttachmentStore';

export const CorrectionMemoDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentLesson?: LessonMemo | null;
  curriculumLessons?: LessonMemo[];
  config?: MemoConfig;
}> = ({ isOpen, onClose, currentLesson, curriculumLessons = [], config }) => {
  const [examType, setExamType] = useState<'فرض' | 'اختبار'>('فرض');
  const [title, setTitle] = useState('مذكرة تصحيح الفرض');
  const [examText, setExamText] = useState('');
  const [correction, setCorrection] = useState('');
  const [busy, setBusy] = useState(false);
  const [sourceAnalysis, setSourceAnalysis] = useState<CorrectionSourceAnalysis | null>(null);
  const [correctionSources, setCorrectionSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [attachments, setAttachments] = useState<MemoAttachment[]>([]);
  const [savedAttachments, setSavedAttachments] = useState<MemoAttachment[]>([]);
  const [sourceDocuments, setSourceDocuments] = useState<MemoAttachment[]>([]);
  const [sourceCategory, setSourceCategory] = useState<'curriculum' | 'companion' | 'teacher-guide' | 'memo'>('curriculum');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([listMemoAttachments(), listMemoSourceDocuments()]).then(([attachments, sources]) => { setSavedAttachments(attachments); setSourceDocuments(sources); }).catch(() => undefined);
  }, [isOpen]);

  const addFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      try {
        const attachment = await fileToMemoAttachment(file);
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'].includes(attachment.mimeType)) {
          setCorrection('المرفق يجب أن يكون صورة أو PDF.');
          continue;
        }
        setAttachments(prev => {
          const total = prev.reduce((sum, item) => sum + item.size, 0) + attachment.size;
          if (total > MAX_TOTAL_ATTACHMENT_BYTES) return prev;
          return [...prev, attachment].slice(0, 6);
        });
        attachment.category = 'exam';
        await saveMemoAttachment(attachment);
        setSavedAttachments(await listMemoAttachments());
        // وجود المرفق يكفي كمصدر؛ لا نضع نصاً وهمياً داخل ورقة التقييم.
      } catch (error: any) {
        setCorrection(error?.message || 'تعذر إضافة المرفق.');
      }
    }
  };

  const restoreSaved = async () => {
    const saved = await listMemoAttachments();
    setSavedAttachments(saved);
    setAttachments(saved.filter(item => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'].includes(item.mimeType)).slice(0, 6));
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(item => item.id !== id));

  const removeSaved = async (id: string) => {
    await deleteMemoAttachment(id);
    setSavedAttachments(prev => prev.filter(item => item.id !== id));
    removeAttachment(id);
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLElement>) => {
    const item = (Array.from(event.clipboardData.items) as DataTransferItem[]).find(x => x.type.startsWith('image/'));
    if (!item) return;
    event.preventDefault();
    const blob = item.getAsFile();
    if (blob) await addFiles([new File([blob], `صورة-التصحيح-${Date.now()}.png`, { type: blob.type || 'image/png' })]);
  };

  const context = useMemo(() => currentLesson
    ? [
        `المستوى: ${currentLesson.level}`,
        `الميدان: ${currentLesson.midan}`,
        `المقطع: ${currentLesson.maqta}`,
        `المورد التعلمي: ${currentLesson.mawrid}`,
        `تعلم المورد: ${currentLesson.ta3alom}`,
        `الأنشطة: ${currentLesson.anshita.map(activity => activity.title).join(' | ')}`,
      ].join('\n')
    : 'لا يوجد مورد محدد.', [currentLesson]);

  if (!isOpen) return null;

  const generate = async () => {
    if (!examText.trim() && attachments.length === 0) {
      setCorrection('أدخل نص ورقة الفرض/الاختبار أو أرفق صورة/PDF واضحاً لها.');
      return;
    }

    setBusy(true);
    setCorrection('');
    setSourceAnalysis(null);
    setCorrectionSources([]);
    try {
      const request = {
        examType,
        examText: examText.trim(),
        lesson: currentLesson,
        curriculum: curriculumLessons,
        attachments: attachments.map(({ name, mimeType, size, dataUrl }) => ({ name, mimeType, size, dataUrl })),
        sourceDocuments: sourceDocuments.filter(item => item.category && item.category !== 'exam').map(({ name, mimeType, dataUrl, category }) => ({ name, type: category as 'curriculum' | 'companion' | 'teacher-guide' | 'memo', text: mimeType === 'text/plain' ? atob(dataUrl.split(',')[1] || '') : undefined })),
      };
      const analysis = await analyzeCorrectionSource(request);
      if (!analysis) {
        setCorrection('تعذر قراءة مصدر ورقة التقييم. راجع وضوح الصورة/PDF أو أعد المحاولة.');
        return;
      }
      setSourceAnalysis(analysis);
      const result = await generateCorrectionMemo(request);
      setCorrection(result?.text || 'تعذر إنشاء مذكرة التصحيح بعد قراءة المصدر. راجع العناصر غير الواضحة ثم أعد المحاولة.');
      setCorrectionSources(result?.sources || []);
    } catch {
      setCorrection('تعذر إنشاء مذكرة التصحيح. أعد المحاولة.');
    } finally {
      setBusy(false);
    }
  };

  const clearForm = () => {
    setExamText('');
    setCorrection('');
    setSourceAnalysis(null);
    setCorrectionSources([]);
    setAttachments([]);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/45 flex justify-end" onClick={onClose}>
      <aside
          className="w-full max-w-5xl h-full bg-[#edf9f6] shadow-2xl overflow-y-auto"
          dir="rtl"
          onClick={e => e.stopPropagation()}
          onPaste={handlePaste}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files); }}
        >
        <header className="sticky top-0 z-10 px-5 py-4 bg-gradient-to-l from-teal-900 to-emerald-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center"><ClipboardCheck /></div>
            <div>
              <h2 className="font-black text-lg">مذكرة تصحيح الفرض والاختبار</h2>
              <p className="text-xs text-white/80">أداة مستقلة للتصحيح — منفصلة عن المساعد الذكي العام</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="إغلاق"><X /></button>
        </header>

        <main className="p-4 md:p-6 space-y-5">
          <section className="bg-[#fffdf8] rounded-2xl border border-teal-100 p-4 md:p-5 shadow-sm space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-black text-slate-600">نوع التقييم</span>
                <select value={examType} onChange={e => {
                  const value = e.target.value as 'فرض' | 'اختبار';
                  setExamType(value);
                  setTitle('مذكرة تصحيح ' + value);
                  setCorrection('');
                }} className="w-full border border-teal-100 rounded-xl p-3 bg-white">
                  <option value="فرض">فرض</option>
                  <option value="اختبار">اختبار</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-black text-slate-600">عنوان المذكرة</span>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-teal-100 rounded-xl p-3 bg-white" placeholder="عنوان المذكرة" />
              </label>
            </div>

            <div className="rounded-xl bg-teal-50/70 border border-teal-100 p-3 text-sm leading-7">
              <div className="font-black text-teal-900 mb-1">المصدر المرتبط بالتصحيح</div>
              <div>{context}</div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-xs font-black text-indigo-900">مكتبة المصادر التربوية</div><div className="text-[10px] text-slate-500">أضف هنا المصادر التي يعتمد عليها التصحيح، ولا تُعامل كأنها ورقة الفرض.</div></div>
                <label className="flex items-center gap-1 text-[10px] font-bold">
                  <span>نوع المصدر</span>
                  <select value={sourceCategory} onChange={e => setSourceCategory(e.target.value as typeof sourceCategory)} className="border rounded-lg bg-white px-2 py-1.5">
                    <option value="curriculum">المنهاج والتدرج</option>
                    <option value="companion">الوثيقة المرافقة</option>
                    <option value="teacher-guide">دليل الأستاذ</option>
                    <option value="memo">مذكرة/مرجع تربوي</option>
                  </select>
                </label>
                <button type="button" onClick={() => {
                  const input = document.createElement('input'); input.type='file'; input.accept='application/pdf,text/plain,image/jpeg,image/png,image/webp'; input.multiple=true;
                  input.onchange = async () => { if (!input.files) return; for (const file of Array.from(input.files)) { try { const a=await fileToMemoAttachment(file); a.category=sourceCategory; await saveMemoAttachment(a); } catch {} } setSourceDocuments(await listMemoSourceDocuments()); };
                  input.click();
                }} className="px-3 py-1.5 rounded-lg bg-indigo-700 text-white text-[11px] font-black"><FileUp className="inline w-3.5 h-3.5 ml-1" />إضافة مصدر</button>
              </div>
              {sourceDocuments.length > 0 ? <div className="grid sm:grid-cols-2 gap-1.5">{sourceDocuments.slice(0,12).map(item => <div key={item.id} className="bg-white border rounded-lg px-2 py-1.5 text-[10px] flex items-center gap-2"><span className="truncate flex-1 font-bold">{item.name}</span><span className="text-indigo-700">{item.category==='curriculum'?'منهاج':item.category==='companion'?'مرافقة':item.category==='teacher-guide'?'دليل':'مذكرة'}</span><button type="button" onClick={async()=>{await deleteMemoAttachment(item.id);setSourceDocuments(await listMemoSourceDocuments());}}><Trash2 size={12} className="text-red-500"/></button></div>)}</div> : <div className="text-[10px] text-slate-500">لا توجد مصادر إضافية محفوظة بعد.</div>}
            </div>

            <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-teal-900">
                  <Paperclip size={15} /> استيراد ملفات التصحيح
                  <span className="text-[10px] text-slate-500 font-medium">صور / PDF / TXT + لصق صورة + استرداد محفوظ</span>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1.5 rounded-lg bg-teal-700 text-white text-[11px] font-black">
                    <FileUp className="inline w-3.5 h-3.5 ml-1" />إضافة ملف
                  </button>
                  <button type="button" onClick={restoreSaved} className="px-2.5 py-1.5 rounded-lg bg-white border border-teal-200 text-teal-800 text-[11px] font-black">
                    <RotateCcw className="inline w-3.5 h-3.5 ml-1" />استرداد
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" multiple hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.currentTarget.value=''; }} />
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500">اسحب ملفات الفرض أو الاختبار إلى هذا المربع، أو اضغط «استيراد ملفات» من الهاتف/الحاسوب، أو الصق صورة مباشرة. سيُستخدم الملف كمصدر أصلي للتصحيح دون اختلاق أسئلة أو نقاط. الحد الأقصى 15MB للملف و24MB للمرفقات المحفوظة.</div>
              {attachments.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {attachments.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2">
                      {item.mimeType.startsWith('image/') ? <img src={item.dataUrl} alt="" className="w-12 h-12 rounded object-cover border" /> : <div className="w-12 h-12 rounded bg-red-50 text-red-700 flex items-center justify-center text-[10px] font-black">PDF</div>}
                      <span className="truncate flex-1 text-[11px] font-bold">{item.name}</span>
                      <button type="button" onClick={() => removeAttachment(item.id)}><XCircle size={15} className="text-slate-400 hover:text-red-600" /></button>
                    </div>
                  ))}
                </div>
              )}
              {savedAttachments.length > 0 && (
                <details className="text-[10px]">
                  <summary className="cursor-pointer font-bold text-slate-600">المحفوظ على الجهاز ({savedAttachments.length})</summary>
                  <div className="mt-1 space-y-1">
                    {savedAttachments.slice(0, 10).map(item => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <span className="truncate flex-1">{item.name}</span>
                        <button type="button" onClick={() => setAttachments(prev => prev.some(x => x.id === item.id) ? prev : [...prev, item].slice(0, 6))} className="text-teal-700 font-black">استرداد</button>
                        <button type="button" onClick={() => removeSaved(item.id)}><Trash2 size={13} className="text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-black text-slate-600">ورقة الفرض أو الاختبار</span>
              <textarea
                value={examText}
                onChange={e => setExamText(e.target.value)}
                rows={11}
                className="w-full border border-teal-100 rounded-xl p-3 bg-white leading-8"
                placeholder="ألصق نص ورقة الفرض أو الاختبار، أو اتركه فارغاً إذا أرفقت صورة/PDF واضحاً للورقة..."
              />
            </label>

            {sourceAnalysis && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs space-y-2">
                <div className="font-black text-amber-900">فحص ورقة التقييم قبل التصحيح</div>
                <div className="grid sm:grid-cols-3 gap-2 text-slate-700">
                  <span>التمارين: <b>{sourceAnalysis.exercises?.length || 0}</b></span>
                  <span>الوثائق: <b>{sourceAnalysis.documents?.length || 0}</b></span>
                  <span>المجموع: <b>{sourceAnalysis.totalPoints ?? 'غير محدد'}</b></span>
                </div>
                {!!sourceAnalysis.ambiguities?.length && (
                  <div className="text-amber-800">
                    <b>عناصر تحتاج مراجعة:</b> {sourceAnalysis.ambiguities.slice(0, 5).join(' • ')}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button onClick={generate} disabled={busy || (!examText.trim() && attachments.length === 0)} className="flex-1 min-w-[220px] py-3 rounded-xl bg-teal-700 text-white font-black disabled:opacity-40">
                <Sparkles className="inline w-4 h-4 ml-1" />{busy ? 'جاري إعداد مذكرة التصحيح...' : 'إعداد مذكرة التصحيح'}
              </button>
              <button onClick={clearForm} disabled={busy} className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-40">
                مسح
              </button>
            </div>
          </section>

          {correction && (
            <section className="bg-[#fffdf8] rounded-2xl border border-teal-100 p-3 shadow-sm">
              <div ref={previewRef} className="print-document bg-white p-6 md:p-8 min-h-[1120px] text-slate-900" dir="rtl">
                <div className="text-center border-b-2 border-teal-700 pb-4 mb-5">
                  <div className="font-black">الجمهورية الجزائرية الديمقراطية الشعبية</div>
                  <div className="font-bold">وزارة التربية الوطنية</div>
                  <h1 className="text-2xl font-black text-teal-800 mt-3">{title}</h1>
                  <div className="text-sm mt-2">{currentLesson?.level?.toUpperCase() || '—'} • علوم الطبيعة والحياة</div>
                </div>

                <div className="grid md:grid-cols-2 gap-2 text-sm border border-teal-100 rounded-xl p-3 mb-5 bg-teal-50/30">
                  <div>المؤسسة: {config?.schoolName || '................'}</div>
                  <div>الأستاذ(ة): {config?.teacherName || '................'}</div>
                  <div>الميدان: {currentLesson?.midan || '................'}</div>
                  <div>المقطع: {currentLesson?.maqta || '................'}</div>
                  <div>المورد التعلمي: {currentLesson?.mawrid || '................'}</div>
                  <div>تعلم المورد: {currentLesson?.ta3alom || '................'}</div>
                </div>

                <div className="whitespace-pre-wrap leading-8 text-[14px]">{correction}</div>

                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-6">
                  <div className="font-black text-amber-900 mb-1">من أين جاء التصحيح؟</div>
                  <div>الأولوية: ورقة التقييم → المنهاج والتدرج → الوثيقة المرافقة → دليل الأستاذ → المذكرات التربوية → الويب عند الحاجة → اقتراحات الذكاء الاصطناعي مع مراجعة الأستاذ.</div>
                  {correctionSources.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      <div className="font-bold">مصادر الويب المستخدمة:</div>
                      {correctionSources.map((source, index) => (
                        <a key={source.uri + index} href={source.uri} target="_blank" rel="noreferrer" className="block text-teal-800 underline truncate">{index + 1}. {source.title}</a>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-slate-600">لم يُستخدم مصدر ويب مباشر في هذه النتيجة؛ اعتمد التصحيح على ورقة التقييم وسياق المنصة، مع وجوب مراجعة الأستاذ قبل الاعتماد.</div>
                  )}
                </div>



                <div className="mt-8 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between gap-3">
                  <span>مذكرة تصحيح</span>
                  <span>مراجعة الأستاذ قبل الاعتماد</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-2.5 no-print rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-extrabold text-slate-600 px-1.5">إخراج المذكرة</span>
                <button onClick={() => previewRef.current && printCorrectionMemo(previewRef.current, title)} className="px-3.5 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800">
                  <Printer className="inline w-4 h-4 ml-1" />طباعة
                </button>
                <button onClick={() => previewRef.current && exportCorrectionMemoToPdf(previewRef.current, title)} className="px-3.5 py-2 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800">
                  <FileDown className="inline w-4 h-4 ml-1" />PDF
                </button>
                <button onClick={() => exportCorrectionMemoToDocx({ title, text: correction, config, level: currentLesson?.level })} className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">
                  <FileDown className="inline w-4 h-4 ml-1" />Word قابل للتعديل
                </button>
              </div>
            </section>
          )}
        </main>
      </aside>
    </div>
  );
};
