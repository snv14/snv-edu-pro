import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ChevronDown, Download, ExternalLink, FileText, Layers, Printer, Search, Clock, Eye } from 'lucide-react';
import { loadOfficialSources } from '../services/knowledgeOfficialSources';
import { normalizeSourceQuery } from '../services/sourceContent';
import { getYearPlans, YEAR_REFERENCE_LABELS, type YearLevel } from '../services/yearReferences';
import { getYearPlanOutline, getYearPlanTermPages, PLAN_TERM_LABELS, type YearPlanUnit } from '../data/yearPlanOutlines';
import { filterYearPlanUnits, getYearPlanMemos, getYearPlanStats } from '../services/yearPlanContent';
import type { OfficialKnowledgeDoc } from '../types/knowledge';
import type { LessonMemo } from '../types';

interface Props {
  level: YearLevel;
  guideMode?: boolean;
  lessons?: LessonMemo[];
  onOpenMemoUnit?: (lesson: LessonMemo) => void;
}

type PlanTab = 'schedule' | 'units' | 'source' | 'pdf';
const TABS = [
  { id: 'schedule', label: 'التوزيع السنوي', Icon: CalendarDays },
  { id: 'units', label: 'المقاطع والموارد', Icon: Layers },
  { id: 'source', label: 'الوثيقة الأصلية', Icon: FileText },
  { id: 'pdf', label: 'قارئ PDF', Icon: Eye },
] as const;
const buttonClass = 'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition';

/** إعادة ضبط حالة السنة عند تغييرها، حتى عند استعمال المكوّن خارج App. */
export function YearPlansViewer(props: Props) {
  return <YearPlansContent key={props.level} {...props} />;
}

function YearPlansContent({ level, guideMode = false, lessons = [], onOpenMemoUnit }: Props) {
  const plans = useMemo(() => getYearPlans(level), [level]);
  const [selectedId, setSelectedId] = useState(plans[0]?.id || '');
  const [tab, setTab] = useState<PlanTab>('schedule');
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [sourcePage, setSourcePage] = useState<number | null>(null);
  const [doc, setDoc] = useState<OfficialKnowledgeDoc | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const plan = plans.find(entry => entry.id === selectedId);
  const outline = useMemo(() => getYearPlanOutline(level, selectedId), [level, selectedId]);
  const stats = getYearPlanStats(outline);
  const directPdf = !!plan?.url.startsWith('/assets/');
  const exceptional = selectedId.startsWith('learningPlan');
  const visibleUnits = useMemo(() => filterYearPlanUnits(outline, query, term, doc), [outline, query, term, doc]);

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
  const termPages = new Set(getYearPlanTermPages(selectedId, term));
  const pages = doc?.pages.filter(page => (!sourcePage || sourcePage === page.page)
    && (!term || termPages.has(page.page))
    && terms.every(word => normalizeSourceQuery(page.text).includes(word))) || [];

  const selectPlan = (id: string) => {
    if (id === selectedId) return;
    setSelectedId(id); setDoc(null); setState('loading'); setQuery(''); setTerm(''); setOpenIds(new Set()); setSourcePage(null);
  };
  const showSource = (page: number) => {
    setSourcePage(page); setQuery(''); setTerm(''); setTab('source');
  };
  const toggleUnit = (id: string) => setOpenIds(previous => {
    const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const pageLinks = (unit: YearPlanUnit) => <div className="flex flex-wrap gap-2">
    {unit.pages.map(page => <button key={page} type="button" onClick={() => showSource(page)} className="text-xs font-bold text-emerald-800 underline underline-offset-4 hover:text-emerald-600">عرض الصفحة الأصلية — ص {page}</button>)}
  </div>;

  return <section dir="rtl" data-year-plans={level} className="h-full overflow-y-auto bg-slate-50 text-slate-800">
    <header className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 shadow-md border-b-4 border-emerald-500">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <p className="text-xs text-emerald-200 font-bold">علوم الطبيعة والحياة · التخطيط البيداغوجي</p>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2"><CalendarDays className="w-6 h-6 shrink-0" />{guideMode ? 'دليل الأستاذ' : 'المخططات'} — {YEAR_REFERENCE_LABELS[level]}</h1>
            <p className="text-xs text-slate-300 leading-6">{guideMode
              ? 'المتوفر لهذه السنة هو دليل بناء التعلمات والتوجيهات البيداغوجية المدمجة في المخططات الوزارية؛ لا يتوفر هنا ملف مستقل لدليل استعمال الكتاب المدرسي.'
              : 'متى أدرّس؟ وبأي ترتيب؟ قراءة منظمة للمخططات، مستقلة عن المحتوى المصدري ودليل الأستاذ والتدرج السنوي القابل للتعديل.'}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 print:hidden">
            {plan && <a href={plan.url} target="_blank" rel="noreferrer" className={`${buttonClass} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}><ExternalLink className="w-4 h-4" />{directPdf ? 'فتح PDF الأصلي' : 'مرجع الوزارة'}</a>}
            {directPdf && <a href={plan!.url} download className={`${buttonClass} bg-slate-800 border border-slate-600 hover:bg-slate-700`}><Download className="w-4 h-4" />تحميل</a>}
            <button type="button" onClick={() => window.print()} className={`${buttonClass} bg-slate-800 border border-slate-600 hover:bg-slate-700`}><Printer className="w-4 h-4" />طباعة</button>
          </div>
        </div>
        <nav aria-label="طرق عرض المخطط" className="flex gap-2 overflow-x-auto border-t border-white/10 pt-3 print:hidden">
          {TABS.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`${buttonClass} shrink-0 whitespace-nowrap ${tab === id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800/60 text-slate-200 hover:bg-slate-700'}`}><Icon className="w-4 h-4" />{label}</button>)}
        </nav>
      </div>
    </header>

    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-3 print:hidden" aria-label="اختيار المخطط">
        {plans.map(entry => <button type="button" key={entry.id} aria-pressed={selectedId === entry.id} onClick={() => selectPlan(entry.id)} className={`text-right p-4 rounded-2xl border transition ${selectedId === entry.id ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
          <span className={`inline-block rounded-md px-2 py-1 mb-2 text-xs font-black ${entry.id.startsWith('annualPlan') ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>{entry.id.startsWith('annualPlan') ? '2022/2023' : '2021/2022 — نظام استثنائي'}</span>
          <span className="block font-bold text-sm leading-6">{entry.title}</span><span className="block text-xs text-slate-500 mt-1">{entry.pages} صفحة مفهرسة</span>
        </button>)}
      </div>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">مخطط 2021/2022 يخص نظام التمدرس الاستثنائي، ولا يحل محل مخططات 2022/2023. لا تُنقل مدد أو موارد إحدى الطبعتين إلى الأخرى.</p>
      {plan && <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-1.5">
        <h2 className="text-sm font-black">{plan.title}</h2><p className="text-xs text-slate-500 leading-6">{plan.authority}</p><p className="text-xs leading-6 text-slate-600">{plan.role}</p>
        {!directPdf && <p className="text-xs font-bold text-amber-800">ملف PDF غير مرفق محلياً؛ النص المفهرس متاح في تبويب الوثيقة الأصلية، والرابط الخارجي لمرجع الوزارة وليس لملف PDF.</p>}
      </div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="إحصاءات المخطط المختار">
        {[
          { label: 'المقاطع التعلمية', value: stats.sequences, detail: 'حسب المخطط المختار', Icon: Layers },
          { label: 'الموارد الملخصة', value: stats.resources || 'غير ملخّصة', detail: exceptional ? 'تفاصيلها في النص الأصلي' : 'عناوين منظمة من المصدر', Icon: BookOpen },
          { label: 'ساعات بناء الموارد', value: stats.hours ?? 'غير مفهرسة', detail: 'دون الإدماج والاختبارات', Icon: Clock },
          { label: 'الصفحات المفهرسة', value: plan?.pages ?? 0, detail: 'مع الترقيم الأصلي', Icon: FileText },
        ].map(({ label, value, detail, Icon }) => <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"><Icon className="w-5 h-5 text-emerald-600 mb-2" /><div className="text-xl font-black text-slate-900">{value}</div><div className="text-xs font-bold mt-1">{label}</div><div className="text-[11px] text-slate-500 mt-1">{detail}</div></div>)}
      </div>
      <p className="text-xs leading-6 text-slate-500">هذا فهرس عرض ملخّص؛ النص الأصلي هو المرجع. التوزيع أدناه حسب الفصول في جداول الوثيقة، دون اختراع تواريخ أو أسابيع تفصيلية. الأرقام لترتيب العرض، وقد يمتد المقطع الواحد عبر فصلين.</p>
      {tab !== 'pdf' && <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <label className="flex flex-1 items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5"><Search className="w-4 h-4 text-emerald-600 shrink-0" /><input aria-label="البحث في المخطط" value={query} onChange={event => { setQuery(event.target.value); setSourcePage(null); }} placeholder="ابحث في المقاطع والموارد ونص المخطط…" className="w-full min-w-0 outline-none text-sm bg-transparent" /></label>
        <select aria-label="تصفية حسب الفصل" value={term} onChange={event => { setTerm(event.target.value); setSourcePage(null); }} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"><option value="">كل الفصول</option>{([1, 2, 3] as const).map(value => <option key={value} value={value}>{PLAN_TERM_LABELS[value]}</option>)}</select>
        {(query || term || sourcePage) && <button type="button" className={`${buttonClass} bg-slate-200`} onClick={() => { setQuery(''); setTerm(''); setSourcePage(null); }}>مسح التصفية</button>}
      </div>}
      {tab !== 'pdf' && state === 'loading' && <p role="status" className="text-sm text-slate-500">جارٍ تحميل صفحات المخطط… البحث في النص الكامل يصبح متاحاً بعد التحميل.</p>}
      {tab !== 'pdf' && state === 'error' && <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm space-y-2"><p>تعذر تحميل النص. يمكنك استعمال رابط المرجع أعلاه؛ يبقى الفهرس الملخّص متاحاً.</p><button type="button" className="underline font-bold" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</button></div>}

      {(tab === 'schedule' || tab === 'units') && <>
        <p role="status" className="text-xs text-slate-500">{visibleUnits.length} وحدة عرض مطابقة</p>
        {!visibleUnits.length && <div className="bg-white border border-dashed rounded-2xl p-8 text-center text-sm text-slate-500">لا توجد مقاطع أو موارد تطابق البحث والتصفية.</div>}
        {tab === 'schedule' && <div className="space-y-5">
          {([1, 2, 3] as const).map(value => {
            const rows = visibleUnits.filter(unit => unit.term === value);
            return rows.length > 0 && <section key={value} aria-label={PLAN_TERM_LABELS[value]} className="space-y-3">
              <h3 className="font-black text-sm flex items-center gap-2"><span className="bg-emerald-100 text-emerald-800 w-7 h-7 rounded-lg grid place-items-center">{value}</span>{PLAN_TERM_LABELS[value]}</h3>
              <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_7rem_minmax(0,2fr)] gap-3 px-4 text-xs font-bold text-slate-500" aria-hidden="true"><span>المقطع / الوحدة</span><span>الموارد بالترتيب</span><span>الحجم الساعي</span><span>المصدر</span></div>
              {rows.map(unit => <article key={unit.id} data-plan-unit={unit.id} className="bg-white border border-slate-200 rounded-2xl p-4 grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_7rem_minmax(0,2fr)] gap-3 text-xs leading-6 shadow-sm">
                <h4 className="font-black text-sm"><span className="text-emerald-700">{unit.sequence}. </span>{unit.title}</h4>
                {unit.resources.length ? <ol className="list-decimal list-inside text-slate-600">{unit.resources.map(resource => <li key={resource}>{resource}</li>)}</ol> : <p className="text-slate-500">الموارد مفصلة في الصفحات الأصلية؛ لم تُلخّص لهذه الطبعة.</p>}
                <div className="text-emerald-800"><p className="font-bold">{unit.hours !== undefined ? `${unit.hours} ساعة` : 'المدة في المصدر'}</p>{unit.weeksLabel && <p className="text-[11px] text-slate-500">{unit.weeksLabel} حسب الوثيقة</p>}</div>
                {pageLinks(unit)}
              </article>)}
            </section>;
          })}
        </div>}
        {tab === 'units' && <div className="space-y-3">
          <div className="flex flex-wrap gap-2 print:hidden"><button type="button" className={`${buttonClass} bg-emerald-100 text-emerald-900`} onClick={() => setOpenIds(new Set(visibleUnits.map(unit => unit.id)))}>توسيع كل المقاطع</button><button type="button" className={`${buttonClass} bg-slate-200`} onClick={() => setOpenIds(new Set())}>طي كل المقاطع</button></div>
          {visibleUnits.map(unit => {
            const open = openIds.has(unit.id);
            const memos = getYearPlanMemos(unit, level, lessons);
            return <article key={unit.id} data-plan-unit={unit.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <h3><button type="button" aria-expanded={open} aria-controls={`plan-${level}-${unit.id}`} onClick={() => toggleUnit(unit.id)} className="w-full text-right p-4 flex items-center gap-3 hover:bg-emerald-50/40"><span className="bg-emerald-100 text-emerald-900 w-9 h-9 rounded-xl grid place-items-center font-black shrink-0">{unit.sequence}</span><span className="flex-1"><span className="block text-sm font-black">{unit.title}</span><span className="block text-xs text-slate-500 mt-1">{PLAN_TERM_LABELS[unit.term]} · {unit.hours !== undefined ? `${unit.hours} ساعة` : 'المدة في المصدر'}{unit.weeksLabel ? ` · ${unit.weeksLabel} حسب الوثيقة` : ''}</span></span><ChevronDown className={`w-4 h-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} /></button></h3>
              {open && <div id={`plan-${level}-${unit.id}`} className="border-t border-slate-200 p-4 bg-slate-50/60 space-y-4">
                <div><h4 className="font-bold text-xs mb-2">الموارد والتعلّمات بالترتيب</h4>{unit.resources.length ? <ol className="grid sm:grid-cols-2 gap-2">{unit.resources.map((resource, index) => <li key={resource} className="bg-white border border-slate-200 rounded-xl p-3 text-xs leading-6"><span className="font-bold text-emerald-700">{index + 1}. </span>{resource}</li>)}</ol> : <p className="text-xs text-slate-500">لم تُلخّص موارد هذه الطبعة؛ استعمل الصفحات الأصلية لقراءة الموارد والتوقيت والتوجيهات دون خلطها بطبعة أخرى.</p>}</div>
                {pageLinks(unit)}
                {onOpenMemoUnit && memos.length > 0 && <div className="space-y-2 print:hidden"><h4 className="text-xs font-bold">مذكرات الأرشيف المرتبطة بالمقطع (محتوى مستقل عن النص الرسمي)</h4><div className="flex flex-wrap gap-2">{memos.map((memo, index) => <button key={`${memo.memoNumber}-${index}`} type="button" onClick={() => onOpenMemoUnit(memo)} className={`${buttonClass} border border-emerald-200 text-emerald-800 bg-white`}>فتح المذكرة {memo.memoNumber}: {memo.ta3alom}</button>)}</div></div>}
              </div>}
            </article>;
          })}
        </div>}
      </>}

      {tab === 'source' && <div className="space-y-3">
        {sourcePage && <div className="flex items-center gap-3"><span className="text-sm font-bold">الصفحة المختارة: {sourcePage}</span><button type="button" className="text-xs underline text-emerald-800" onClick={() => setSourcePage(null)}>عرض جميع الصفحات</button></div>}
        {state === 'ready' && <><p role="status" className="text-xs text-slate-500">{pages.length} صفحة مطابقة — ترقيم الملف الأصلي</p>{!pages.length && <p className="text-sm">لا توجد صفحات مطابقة للبحث.</p>}
          {pages.map(page => <article key={page.page} data-plan-page={page.page} className="border border-slate-200 rounded-2xl bg-white p-4 md:p-5 space-y-3"><h3 className="font-black text-sm">{plan?.title} — ص {page.page}</h3><p className="whitespace-pre-wrap text-sm leading-8">{page.text}</p>{directPdf && <a className="inline-flex text-xs text-emerald-800 underline" href={`${plan!.url}#page=${page.page}`} target="_blank" rel="noreferrer">فتح PDF — ص {page.page}</a>}</article>)}
        </>}
      </div>}
      {tab === 'pdf' && <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-black">{plan?.title}</h3>
        {directPdf ? <><p className="text-xs text-slate-500">البحث والتصفية أعلاه يخصان الفهرس والنص المستخرج؛ استخدم أدوات قارئ PDF للبحث داخل الملف.</p><iframe title={`المخطط الأصلي — ${YEAR_REFERENCE_LABELS[level]}`} src={plan!.url} className="w-full min-h-[70vh] rounded-xl border border-slate-200" /><a href={plan!.url} target="_blank" rel="noreferrer" className="text-xs text-emerald-800 underline">إذا تعذر العرض، افتح الملف في نافذة مستقلة</a></> : <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm leading-7"><p>ملف PDF غير مرفق محلياً لهذه الوثيقة. يمكنك قراءة النص المفهرس كاملاً، أو زيارة مرجع الوزارة.</p><button type="button" onClick={() => { setSourcePage(null); setQuery(''); setTerm(''); setTab('source'); }} className={`${buttonClass} bg-white border border-amber-200 mt-2`}>قراءة الوثيقة الأصلية</button></div>}
      </div>}
    </div>
  </section>;
}
