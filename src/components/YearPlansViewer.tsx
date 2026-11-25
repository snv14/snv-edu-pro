import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { loadOfficialSources } from '../services/knowledgeOfficialSources';
import { normalizeSourceQuery } from '../services/sourceContent';
import { getYearPlans, YEAR_REFERENCE_LABELS, type YearLevel } from '../services/yearReferences';
import type { OfficialKnowledgeDoc } from '../types/knowledge';

interface Props { level: YearLevel; guideMode?: boolean; }

/** يستخدم للسنة الأولى أيضاً: الدليل المتوفر مدمج في مخططات بناء التعلمات، وليس كتاب دليل مستقل. */
export function YearPlansViewer({ level, guideMode = false }: Props) {
  const plans = useMemo(() => getYearPlans(level), [level]);
  const [selectedId, setSelectedId] = useState(plans[0]?.id || '');
  const [query, setQuery] = useState('');
  const [doc, setDoc] = useState<OfficialKnowledgeDoc | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const plan = plans.find(entry => entry.id === selectedId);

  useEffect(() => {
    let cancelled = false;
    setDoc(null);
    setState('loading');
    if (!plan) { setState('error'); return; }
    loadOfficialSources([plan.id]).then(docs => {
      if (cancelled) return;
      setDoc(docs[0] || null);
      setState(docs.length ? 'ready' : 'error');
    }).catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [plan?.id]);

  const terms = normalizeSourceQuery(query).split(' ').filter(Boolean);
  const pages = doc?.pages.filter(page => terms.every(term => normalizeSourceQuery(page.text).includes(term))) || [];
  const directPdf = plan?.url.startsWith('/assets/');

  return <section dir="rtl" className="h-full overflow-y-auto bg-slate-50 text-slate-800">
    <header className="bg-emerald-950 text-white p-5 space-y-3">
      <h1 className="text-xl font-black">{guideMode ? 'دليل الأستاذ' : 'المخططات'} — {YEAR_REFERENCE_LABELS[level]}</h1>
      <p className="text-sm leading-7">{guideMode
        ? 'المتوفر لهذه السنة هو دليل بناء التعلمات والتوجيهات البيداغوجية المدمجة في المخططات الوزارية؛ لا يتوفر هنا ملف مستقل لدليل استعمال الكتاب المدرسي.'
        : 'المخططات السنوية ومخطط التعلمات وآليات تنفيذه، مستقلة عن المحتوى المصدري وعن التدرج السنوي القابل للتعديل.'}</p>
    </header>
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-7">مخطط 2021/2022 يخص نظام التمدرس الاستثنائي، ولا يحل محل مخططات 2022/2023. اختر المرجع المطلوب للاطلاع على نصه الأصلي.</p>
      <div className="flex flex-wrap gap-2" aria-label="اختيار المخطط">
        {plans.map(entry => <button type="button" key={entry.id} aria-pressed={selectedId === entry.id} onClick={() => { setSelectedId(entry.id); setQuery(''); }}
          className={`rounded-xl border p-3 text-sm text-right ${selectedId === entry.id ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white border-slate-300'}`}>
          {entry.title}<span className="block text-xs mt-1">{entry.pages} صفحة مفهرسة</span>
        </button>)}
      </div>
      {plan && <div className="rounded-xl bg-white border p-4 space-y-2">
        <h2 className="font-bold">{plan.title}</h2>
        <p className="text-sm">{plan.authority}</p>
        <p className="text-sm leading-7">{plan.role}</p>
        <a href={plan.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-800 underline text-sm"><ExternalLink className="w-4 h-4" />{directPdf ? 'فتح ملف PDF الأصلي' : 'مرجع الوزارة — ملف PDF غير مرفق محلياً'}</a>
      </div>}
      <label className="flex items-center gap-2 bg-white border rounded-lg p-3"><Search className="w-4 h-4" /><input aria-label="البحث في المخطط" value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث في صفحات المخطط…" className="w-full outline-none text-sm" /></label>
      {state === 'loading' && <p role="status">جارٍ تحميل صفحات المخطط…</p>}
      {state === 'error' && <p role="alert">تعذر تحميل النص. يمكنك استعمال رابط المرجع أعلاه أو إعادة تحميل الصفحة.</p>}
      {state === 'ready' && <>
        <p role="status" className="text-sm">{pages.length} صفحة مطابقة — ترقيم الملف الأصلي</p>
        {!pages.length && <p>لا توجد صفحات مطابقة للبحث.</p>}
        {pages.map(page => <article key={page.page} className="border rounded-xl bg-white p-4">
          <h3 className="font-bold mb-3">{plan?.title} — ص {page.page}</h3>
          <p className="whitespace-pre-wrap text-sm leading-8">{page.text}</p>
          {directPdf && <a className="inline-block mt-3 text-sm text-emerald-800 underline" href={`${plan!.url}#page=${page.page}`} target="_blank" rel="noreferrer">فتح الملف — ص {page.page}</a>}
        </article>)}
      </>}
    </div>
  </section>;
}
