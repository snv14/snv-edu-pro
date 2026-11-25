import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BookOpen, FileText, Globe, Layers, Link2, Loader2, Plus, Search,
  Sparkles, Trash2, Upload,
} from 'lucide-react';
import {
  appendSource, chunkSpaceText, linkSource, removeSource, searchSpace, sourceFromFile, spaceSizeLabel,
  type KnowledgeSpace, type SpaceSource,
} from '../services/knowledgeSpaces';

const SOURCE_ICON = (source: SpaceSource) => {
  if (source.kind === 'link') return <Link2 className="h-4 w-4 text-sky-700" />;
  if (source.kind === 'image') return <Layers className="h-4 w-4 text-violet-700" />;
  if (source.kind === 'pdf') return <FileText className="h-4 w-4 text-rose-700" />;
  return <BookOpen className="h-4 w-4 text-emerald-700" />;
};

const STATUS_LABEL: Record<SpaceSource['status'], string> = {
  ready: 'جاهز للبحث',
  'needs-text': 'بانتظار نص',
  error: 'تعذرت القراءة',
};

export const KnowledgeSpacePanel: React.FC<{
  space: KnowledgeSpace;
  onUpdate: (space: KnowledgeSpace) => void;
  onDelete: () => void;
  onClose: () => void;
  onAsk: (prompt: string) => void;
}> = ({ space, onUpdate, onDelete, onClose, onAsk }) => {
  const [title, setTitle] = useState(space.title);
  const [description, setDescription] = useState(space.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(space.title);
    setDescription(space.description);
  }, [space.id, space.title, space.description]);

  const results = useMemo(() => (query.trim() ? searchSpace(space, query, 5) : []), [space, query]);

  const commitMeta = () => {
    const nextTitle = title.trim().slice(0, 80) || 'مساحة معرفة';
    const nextDescription = description.trim().slice(0, 240);
    if (nextTitle === space.title && nextDescription === space.description) return;
    onUpdate({ ...space, title: nextTitle, description: nextDescription, updatedAt: new Date().toISOString() });
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError('');
    setNotice('');
    setBusy(true);
    let next = space;
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      try {
        const source = await sourceFromFile(file);
        next = appendSource(next, source);
        added.push(source.status === 'ready' ? source.name : `${source.name} (${STATUS_LABEL[source.status]})`);
      } catch (err) {
        setError(err instanceof Error ? err.message : `تعذرت إضافة «${file.name}».`);
      }
    }
    onUpdate(next);
    if (added.length) setNotice(`أُضيف: ${added.join(' · ')}`);
    setBusy(false);
  };

  const addLink = () => {
    const url = window.prompt('رابط المصدر (https://…)');
    if (!url || !/^https?:\/\//i.test(url.trim())) return;
    const name = window.prompt('اسم المصدر (اختياري)') || '';
    onUpdate(appendSource(space, linkSource(url.trim(), name.trim())));
  };

  const deleteSource = (source: SpaceSource) => {
    if (!window.confirm(`حذف المصدر «${source.name}» من المساحة؟`)) return;
    onUpdate(removeSource(space, source.id));
  };

  const enterSourceText = (source: SpaceSource) => {
    const text = window.prompt(`أدخل نص «${source.name}» (من الصورة أو النسخة الممسوحة):`);
    if (!text || !text.trim()) return;
    const updated: SpaceSource = {
      ...source,
      text: text.trim().slice(0, 120_000),
      chunks: chunkSpaceText(text.trim()),
      status: 'ready',
      note: 'نص أُدخل يدويًا من الأستاذ.',
    };
    onUpdate({
      ...space,
      sources: space.sources.map(item => (item.id === source.id ? updated : item)),
      updatedAt: new Date().toISOString(),
    });
  };

  const summarize = () => {
    onAsk(`لخص جميع مصادر مساحة المعرفة «${space.title}»: اعرض الأفكار الأساسية لكل مصدر مع اسم الملف ورقم الصفحة، ثم خلاصة جامعة. لا تضف معلومات غير موجودة في المصادر.`);
    onClose();
  };

  const compare = () => {
    onAsk(`قارن بين مصادر مساحة المعرفة «${space.title}»: وحّد محاور المقارنة (الهدف، المحتوى، المستوى، الأنشطة، مواضع الاتفاق والاختلاف)، واستشهد باسم كل ملف وصفحته.`);
    onClose();
  };

  return (
    <div dir="rtl" className="flex-1 min-h-0 overflow-y-auto bg-[#eef3f1]">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-5 py-4 space-y-4">
        <div className="rounded-2xl border border-teal-100 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="space-title" className="text-[10px] font-black text-slate-400">اسم المساحة</label>
              <input
                id="space-title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                onBlur={commitMeta}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <label htmlFor="space-description" className="mt-2 block text-[10px] font-black text-slate-400">وصف مختصر</label>
              <textarea
                id="space-description"
                value={description}
                rows={2}
                onChange={event => setDescription(event.target.value)}
                onBlur={commitMeta}
                placeholder="مثال: التغذية عند الإنسان — 4AM"
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <p className="mt-1 text-[10px] text-slate-500">{spaceSizeLabel(space)} · محفوظة على جهازك فقط</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={onClose} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                <ArrowRight className="h-4 w-4" /> المحادثة
              </button>
              <button type="button" onClick={onDelete} aria-label="حذف المساحة" className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-black text-slate-900">المصادر</p>
              <p className="text-[10.5px] text-slate-500">PDF · Word · صور · نصوص · روابط — تُقرأ محليًا وتُفهرس بمقاطع وصفحات.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={addLink} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                <Link2 className="h-4 w-4" /> رابط
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-2 text-[11px] font-black text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                إضافة مصدر
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.csv,image/png,image/jpeg,image/webp"
                onChange={event => { void addFiles(event.target.files); event.target.value = ''; }}
              />
            </div>
          </div>

          {error && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10.5px] font-bold text-amber-800">{error}</p>}
          {notice && <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-900">{notice}</p>}

          <div className="mt-3 space-y-1.5">
            {space.sources.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center">
                <Plus className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-1 text-[12px] font-black text-slate-700">لا توجد مصادر بعد</p>
                <p className="text-[10.5px] text-slate-500">أضف مذكرة أو اختبارًا أو وثيقة، ثم اسأل عنها في المحادثة.</p>
              </div>
            )}
            {space.sources.map(source => (
              <div key={source.id} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-2">
                <span className="mt-0.5 shrink-0">{SOURCE_ICON(source)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black text-slate-800">{source.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {STATUS_LABEL[source.status]}
                    {source.pages ? ` · ${source.pages} صفحة` : ''}
                    {source.chunks.length ? ` · ${source.chunks.length} مقطع` : ''}
                    {source.size ? ` · ${Math.max(1, Math.round(source.size / 1024))} كب` : ''}
                  </p>
                  {source.note && <p className="mt-0.5 text-[10px] text-amber-700">{source.note}</p>}
                  {source.status === 'needs-text' && (
                    <button
                      type="button"
                      onClick={() => enterSourceText(source)}
                      className="mt-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-900 hover:bg-amber-100"
                    >
                      إدخال النص يدويًا
                    </button>
                  )}
                </div>
                {source.kind === 'link' && (
                  <a href={source.text.split('\n').pop()} target="_blank" rel="noreferrer" aria-label={`فتح ${source.name}`} className="rounded p-1 text-sky-700 hover:bg-sky-50">
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
                <button type="button" onClick={() => deleteSource(source)} aria-label={`حذف ${source.name}`} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[13px] font-black text-slate-900">البحث داخل المصادر</p>
          <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="ابحث داخل مصادر هذه المساحة…"
              className="w-full bg-transparent text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {query.trim() && (
            <div className="mt-2 space-y-1.5">
              {results.length === 0 && <p className="text-[10.5px] text-slate-500">لا نتيجة داخل هذه المصادر. جرّب كلمة من المورد.</p>}
              {results.map((hit, index) => (
                <button
                  key={`${hit.source.id}-${hit.chunk.id}-${index}`}
                  type="button"
                  onClick={() => {
                    onAsk(`استخرج لي هذا المقطع من المصدر «${hit.source.name}»${hit.chunk.page ? ` (ص ${hit.chunk.page})` : ''} واشرح كيف أوظفه في الحصة: ${hit.snippet}`);
                    onClose();
                  }}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-right hover:border-teal-300 hover:bg-teal-50"
                >
                  <p className="text-[10.5px] font-black text-teal-900">{hit.source.name}{hit.chunk.page ? ` — ص ${hit.chunk.page}` : ''}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10.5px] text-slate-600">{hit.snippet}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={summarize} className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-[11px] font-black text-white hover:bg-teal-800">
            <Sparkles className="h-4 w-4" /> تلخيص جميع المصادر
          </button>
          <button type="button" onClick={compare} className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[11px] font-black text-teal-900 hover:bg-teal-100">
            <Layers className="h-4 w-4" /> مقارنة المصادر
          </button>
          <button
            type="button"
            onClick={() => {
              onAsk(`استخرج التجارب والأنشطة العملية الموجودة في مصادر مساحة المعرفة «${space.title}»، مع اسم الملف والصفحة والوسائل المطلوبة.`);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> استخراج التجارب
          </button>
        </div>
      </div>
    </div>
  );
};
