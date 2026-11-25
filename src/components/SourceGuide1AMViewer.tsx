import React, { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, ChevronDown, Download, ExternalLink, Eye, FileText, Layers, Printer, Search } from 'lucide-react';
import type { LessonMemo } from '../types';
import {
  TEACHER_GUIDE_1AM_SEQUENCES, filterTeacherGuide1am,
  getTeacherGuide1amLessons, getTeacherGuide1amSource,
} from '../data/teacherGuide1am';
import { loadOfficialSources } from '../services/knowledgeOfficialSources';
import type { OfficialSourcePage } from '../data/official/types';

type GuideTab = 'guide' | 'lessons' | 'assessment' | 'pdf';
interface Props { lessons: LessonMemo[]; onOpenMemoUnit?: (lesson: LessonMemo) => void; }
const TABS = [
  { id: 'guide', label: 'المقاطع وبناء التعلمات', icon: Layers },
  { id: 'lessons', label: 'المذكرات والأنشطة', icon: FileText },
  { id: 'assessment', label: 'الكفاءات والتقويم', icon: Award },
  { id: 'pdf', label: 'المستند الرسمي PDF', icon: Eye },
] as const;

const GuideList = ({ items }: { items: string[] }) => <ul className="list-disc pr-5 space-y-2 text-sm leading-7">{items.map(item => <li key={item}>{item}</li>)}</ul>;
const GuideText = ({ title, text }: { title: string; text?: string }) => text ? <div className="space-y-1"><h4 className="font-bold text-emerald-900">{title}</h4><p className="whitespace-pre-wrap leading-7 text-sm">{text}</p></div> : null;

export function SourceGuide1AMViewer({ lessons, onOpenMemoUnit }: Props) {
  const [activeTab, setActiveTab] = useState<GuideTab>('guide');
  const [query, setQuery] = useState('');
  const [openSequence, setOpenSequence] = useState('nutrition-human');
  const [officialPages, setOfficialPages] = useState<OfficialSourcePage[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const source = useMemo(getTeacherGuide1amSource, []);
  const ownLessons = useMemo(() => getTeacherGuide1amLessons(lessons), [lessons]);
  const sequences = useMemo(() => filterTeacherGuide1am(query), [query]);
  const filteredLessons = useMemo(() => getTeacherGuide1amLessons(lessons, query), [lessons, query]);
  const totalHours = TEACHER_GUIDE_1AM_SEQUENCES.reduce((sum, sequence) => sum + sequence.hours, 0);
  const resourceCount = TEACHER_GUIDE_1AM_SEQUENCES.reduce((sum, sequence) => sum + sequence.resources.length, 0);

  useEffect(() => {
    if (activeTab !== 'assessment') return;
    let cancelled = false;
    setLoadState('loading');
    loadOfficialSources([source.id]).then(docs => {
      if (cancelled) return;
      setOfficialPages(docs[0]?.pages.filter(page => [3, 7, 12, 16].includes(page.page)) || []);
      setLoadState(docs.length ? 'ready' : 'error');
    }).catch(() => { if (!cancelled) setLoadState('error'); });
    return () => { cancelled = true; };
  }, [activeTab, source.id]);

  return <section dir="rtl" className="h-full overflow-y-auto bg-slate-50 text-slate-800">
    <header className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 border-b-4 border-emerald-500 shadow-md">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-bold text-emerald-200">علوم الطبيعة والحياة · السنة الأولى متوسط · مرجع وزارة التربية الوطنية</p>
            <h1 className="flex items-center gap-2 text-xl md:text-2xl font-black"><BookOpen className="w-6 h-6 shrink-0" />دليل الأستاذ وبناء التعلمات — السنة الأولى متوسط</h1>
            <span className="inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-slate-950">المخطط الرسمي 2022/2023 · {source.pages} صفحة</span>
            <p className="text-sm text-emerald-50 leading-7">دليل منظّم للميدانين: الإنسان والصحة، والإنسان والمحيط؛ يجمع المقاطع والموارد والتوجيهات البيداغوجية والمذكرات المرتبطة بها.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold print:hidden">
            <a href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-emerald-400 text-slate-950 p-3 hover:bg-emerald-300"><ExternalLink className="w-4 h-4" />فتح المستند الرسمي</a>
            <a href={source.url} download="plans_annuels2023-sciences1am.pdf" className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-600 p-3"><Download className="w-4 h-4" />تحميل PDF</a>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-600 p-3"><Printer className="w-4 h-4" />طباعة</button>
          </div>
        </div>
        <nav aria-label="أقسام دليل الأستاذ للسنة الأولى" className="flex gap-2 overflow-x-auto border-t border-emerald-700/60 pt-3 print:hidden">
          {TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => { setActiveTab(id); setQuery(''); }} className={`flex items-center gap-2 shrink-0 rounded-lg px-3 py-2 text-xs font-black transition ${activeTab === id ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}><Icon className="w-4 h-4" />{label}</button>)}
        </nav>
      </div>
    </header>

    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">هذه قراءة بيداغوجية منظّمة للمخطط الوزاري، وليست كتاب دليل مستقل أو نقلاً حرفياً له. ملخصات المقاطع منفصلة عن النص الرسمي وعن مذكرات قاعدة المنصة. تبويبا المحتوى المصدري والمخططات باقيان دون تغيير.</p>
      {activeTab === 'guide' && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          [TEACHER_GUIDE_1AM_SEQUENCES.length, 'مقاطع في المخطط الرسمي'], [resourceCount, 'مورداً في قراءة الدليل'],
          [totalHours, 'ساعة للمقاطع دون الإدماج والاختبارات'], [ownLessons.length, 'مذكرة في قاعدة المنصة'],
        ].map(([count, label]) => <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm"><strong className="block text-2xl font-black text-emerald-800">{count}</strong><span className="text-xs font-bold text-slate-500">{label}</span></div>)}
      </div>}
      {(activeTab === 'guide' || activeTab === 'lessons') && <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm print:hidden">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input aria-label="البحث في دليل السنة الأولى" value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث بالمقطع، المورد، المفهوم أو النشاط…" className="flex-1 min-w-0 text-sm outline-none" />
        {query && <button type="button" onClick={() => setQuery('')} className="text-xs bg-slate-100 rounded-lg p-2">مسح</button>}
      </label>}

      {activeTab === 'guide' && <div className="space-y-4">
        <p role="status" className="text-xs text-slate-500">{sequences.length} مقاطع مطابقة · الملخصات التالية قراءة منظّمة، وللنص الحرفي راجع الصفحات المحددة.</p>
        {!sequences.length && <p className="rounded-xl border bg-white p-5">لا توجد مقاطع مطابقة للبحث.</p>}
        {sequences.map(sequence => {
          const expanded = openSequence === sequence.id || !!query.trim();
          const linkedLessons = ownLessons.filter(lesson => lesson.maqta === sequence.lessonSequence);
          return <article key={sequence.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button type="button" aria-expanded={expanded} aria-controls={`guide-1am-${sequence.id}`} onClick={() => setOpenSequence(openSequence === sequence.id ? '' : sequence.id)} className="w-full flex items-center justify-between gap-3 text-right p-4 bg-emerald-50/70 hover:bg-emerald-50">
              <span><span className="block font-black text-emerald-950">{sequence.title}</span><span className="block text-xs text-slate-500 mt-1">الفصل {sequence.term} · {sequence.hours} ساعات · ص {sequence.pages.join('، ')} · {linkedLessons.length} مذكرات مرتبطة</span></span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && <div id={`guide-1am-${sequence.id}`} className="p-4 md:p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-5">
                <section className="rounded-xl bg-slate-50 p-4"><h3 className="font-black text-slate-800 mb-2">المكتسبات القبلية — ملخص</h3><GuideList items={sequence.priorKnowledge} /></section>
                <section className="rounded-xl bg-emerald-50 p-4"><h3 className="font-black text-emerald-900 mb-2">الموارد المعرفية</h3><GuideList items={sequence.resources} /></section>
              </div>
              <GuideText title="التوجيه البيداغوجي — قراءة منظمة" text={sequence.guidance} />
              <section><h3 className="font-bold text-emerald-900 mb-2">مؤشرات متابعة التعلم — ملخص</h3><GuideList items={sequence.indicators} /></section>
              <div className="flex flex-wrap gap-2">{sequence.pages.map(page => <a key={page} href={`${source.url}#page=${page}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-800 underline">المصدر الرسمي — ص {page}</a>)}</div>
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <h3 className="font-bold text-sm">مذكرات قاعدة المنصة المرتبطة — ليست نص الدليل</h3>
                {!linkedLessons.length && <p className="text-sm text-slate-500">لا توجد مذكرات مرتبطة في القاعدة الحالية.</p>}
                <div className="flex flex-wrap gap-2">{linkedLessons.map((lesson, i) => onOpenMemoUnit ? <button key={i} type="button" onClick={() => onOpenMemoUnit(lesson)} className="rounded-lg border border-emerald-200 p-2 text-xs text-emerald-900 hover:bg-emerald-50">{lesson.memoNumber} · {lesson.ta3alom}</button> : <span key={i} className="rounded-lg bg-slate-100 p-2 text-xs">{lesson.memoNumber} · {lesson.ta3alom}</span>)}</div>
              </div>
            </div>}
          </article>;
        })}
      </div>}

      {activeTab === 'lessons' && <div className="space-y-3">
        <p className="text-xs text-slate-600 leading-6">{filteredLessons.length} مذكرة من القاعدة الحالية. الأرشيف يتضمن أيضاً «مظاهر النمو والتطور عند النبات»؛ لا يُعد هنا مقطعاً تاسعاً ضمن مخطط 2022/2023 ذي المقاطع الثمانية.</p>
        {!filteredLessons.length && <p>لا توجد مذكرات مطابقة للبحث.</p>}
        {filteredLessons.map((lesson, i) => <details key={`${lesson.sourceLearningUnitId || lesson.memoNumber}-${i}`} className="rounded-xl border bg-white p-4">
          <summary className="cursor-pointer font-bold text-emerald-950">مذكرة {lesson.memoNumber || '—'} · {lesson.ta3alom}<span className="block font-normal text-xs text-slate-500 mt-1">{lesson.maqta} · {lesson.mawrid}</span></summary>
          <div className="pt-4 space-y-4">
            <GuideText title="المشكلة" text={lesson.moshkila} /><GuideText title="الوسائل" text={lesson.wasail} />
            {lesson.anshita.map((activity, n) => <section key={n} className="rounded-xl bg-slate-50 p-3 space-y-2"><h4 className="font-black text-sm">{activity.title}</h4><GuideText title="التعليمات والأسئلة" text={activity.asila} /><GuideText title="الأجوبة والاستنتاجات المسجلة" text={activity.ajwiba} /></section>)}
            <GuideText title="إرساء الموارد" text={lesson.irsae} /><GuideText title="التقويم" text={lesson.taqwim} />
            {onOpenMemoUnit && <button type="button" onClick={() => onOpenMemoUnit(lesson)} className="rounded-lg bg-emerald-800 px-3 py-2 text-white text-sm">فتح المذكرة الكاملة</button>}
          </div>
        </details>)}
      </div>}

      {activeTab === 'assessment' && <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-5 space-y-3">
          <h2 className="text-lg font-black text-emerald-950">الكفاءات والتقويم التكويني</h2>
          <p className="text-sm leading-7">قراءة إجرائية: تشخيص المكتسبات، بناء الموارد وإرساؤها، إدماجها، حل الوضعية الانطلاقية، ثم التقويم والمعالجة. تُراجع الكفاءات ومعايير التقويم في ص 3، ومحطات الإدماج والاختبارات في ص 7 و12 و16.</p>
          <p className="text-xs text-slate-500">الصفحات التالية هي النص الرسمي المفهرس، وليست الملخصات السابقة. ص 7 تتضمن أيضاً نهاية مقطع التغذية عند النبات.</p>
        </div>
        {loadState === 'loading' && <p role="status">جارٍ تحميل النص الرسمي للكفاءات والتقويم…</p>}
        {loadState === 'error' && <p role="alert">تعذر تحميل النص. يمكنك فتح المستند الرسمي من أعلى الدليل.</p>}
        {officialPages.map(page => <article key={page.page} className="rounded-xl border bg-white p-4"><h3 className="font-bold text-emerald-950">نص رسمي — ص {page.page}</h3><p className="whitespace-pre-wrap text-sm leading-8 mt-3">{page.text}</p><a href={`${source.url}#page=${page.page}`} target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs text-emerald-800 underline">فتح الصفحة في المصدر</a></article>)}
      </div>}

      {activeTab === 'pdf' && <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="font-black">قارئ المستند الرسمي — {source.pages} صفحة</h2>
        <p className="text-sm text-slate-600">إن لم يظهر المستند في متصفحك، <a href={source.url} target="_blank" rel="noreferrer" className="text-emerald-800 underline">افتحه في نافذة مستقلة</a>.</p>
        <iframe src={source.url} title="المخططات السنوية ودليل بناء التعلمات للسنة الأولى متوسط 2022/2023" className="w-full h-[75vh] min-h-[500px] rounded-xl border" />
      </div>}
    </main>
  </section>;
}
