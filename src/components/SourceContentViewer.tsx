import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, ExternalLink, Search } from 'lucide-react';
import type { DB_Table, LessonMemo } from '../types';
import type { OfficialKnowledgeDoc } from '../types/knowledge';
import { loadOfficialSources } from '../services/knowledgeOfficialSources';
import {
  buildSourceContent, buildSourceContentExport, filterSourceContent, getSourceContentDocuments, getSourceContentLinks,
  normalizeSourceQuery, SOURCE_CONTENT_LEVEL_LABELS,
  type SourceContentKind, type SourceContentLevel, type SourceContentRecord,
} from '../services/sourceContent';

interface Props {
  level: SourceContentLevel;
  lessons: LessonMemo[];
  guide?: React.ReactNode;
  onOpenMemoUnit?: (lesson: LessonMemo) => void;
}

const TABS: { id: SourceContentKind; label: string }[] = [
  { id: 'memos', label: 'المذكرات' }, { id: 'activities', label: 'الأنشطة' },
  { id: 'tables', label: 'الجداول' }, { id: 'diagrams', label: 'الرسوم والمخططات' },
  { id: 'evaluations', label: 'التقويمات' },
];

const TextBlock = ({ title, text }: { title: string; text?: string }) => text?.trim() ? (
  <section className="mt-3"><h4 className="font-bold text-emerald-900">{title}</h4><p className="whitespace-pre-wrap leading-7">{text}</p></section>
) : null;

const SourceTable = ({ table }: { table: DB_Table }) => (
  <div className="overflow-x-auto my-3">
    <table className="w-full text-right border-collapse text-sm">
      {table.table_title && <caption className="text-right font-bold p-2">{table.table_title}</caption>}
      <thead><tr>{table.headers.map((header, i) => <th key={i} scope="col" className="border border-slate-300 bg-emerald-50 p-2">{header}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-slate-300 p-2 whitespace-pre-wrap">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const ActivityContent = ({ activity }: { activity: LessonMemo['anshita'][number] }) => <>
  <TextBlock title="الأسئلة وتعليمات النشاط" text={activity.asila} />
  <TextBlock title="الأجوبة والاستنتاجات المسجلة" text={activity.ajwiba} />
  <TextBlock title="المدة" text={activity.zaman} />
  <TextBlock title="ملاحظات" text={activity.mola7adha} />
</>;

function RecordContent({ record }: { record: SourceContentRecord }) {
  const { kind, lesson, activity, table, diagram } = record;
  if (kind === 'tables' && table) return <SourceTable table={table} />;
  if (kind === 'activities' && activity) return <ActivityContent activity={activity} />;
  if (kind === 'evaluations') return <>
    <TextBlock title="التقويم" text={lesson.taqwim} />
    {lesson.taqwimTables?.map((t, i) => <SourceTable key={i} table={t} />)}
  </>;
  if (kind === 'diagrams' && diagram) {
    // SVG معروض كصورة معزولة: لا حقن HTML أو تنفيذ شيفرة من قاعدة مستوردة.
    const src = diagram.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(diagram.svg.replace(/className=/g, 'class='))}`
      : /^(https?:\/\/|\/(?!\/)|data:image\/)/i.test(diagram.imageUrl || '') ? diagram.imageUrl : undefined;
    return <figure className="mt-3">{src ? <img loading="lazy" src={src} alt={record.title} className="w-full h-auto max-w-4xl max-h-[600px] object-contain mx-auto" /> : <p>رابط الصورة غير متاح.</p>}<figcaption className="mt-2 whitespace-pre-wrap">{diagram.description}</figcaption></figure>;
  }
  return <>
    <TextBlock title="الكفاءة الختامية" text={lesson.kafaaKhitamiya} />
    <TextBlock title="مركبة الكفاءة" text={lesson.markaba} />
    <TextBlock title="المعارف المستهدفة" text={lesson.marifa} />
    <TextBlock title="الأهداف المنهجية" text={lesson.manhaji} />
    <TextBlock title="المصطلحات" text={lesson.mostalahat} />
    <TextBlock title="الوسائل" text={lesson.wasail} />
    <TextBlock title="الوضعية الانطلاقية" text={lesson.wadiya} />
    {lesson.wadiyaTables?.map((t, i) => <SourceTable key={i} table={t} />)}
    <TextBlock title="المشكلة" text={lesson.moshkila} />
    <TextBlock title="الفرضيات" text={lesson.faradiyat} />
    {lesson.anshita.map((a, i) => <section key={i} className="mt-4 border-t border-slate-200 pt-3">
      <h4 className="font-black">{a.title}</h4><ActivityContent activity={a} />
      {a.tables?.map((t, n) => <SourceTable key={n} table={t} />)}
    </section>)}
    <TextBlock title="إرساء الموارد" text={lesson.irsae} />
    {lesson.irsaeTables?.map((t, i) => <SourceTable key={i} table={t} />)}
    <TextBlock title="التقويم" text={lesson.taqwim} />
    {lesson.taqwimTables?.map((t, i) => <SourceTable key={i} table={t} />)}
    <TextBlock title="معايير التقويم" text={lesson.ma3ayirTaqwim} />
    <TextBlock title="المراجع المسجلة" text={lesson.marajie} />
  </>;
}

export function SourceContentViewer({ level, lessons, guide, onOpenMemoUnit }: Props) {
  const [tab, setTab] = useState<SourceContentKind | 'sources' | 'guide'>('memos');
  const [query, setQuery] = useState('');
  const [sequence, setSequence] = useState('');
  const [documents, setDocuments] = useState<OfficialKnowledgeDoc[]>([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const records = useMemo(() => buildSourceContent(level, lessons), [level, lessons]);
  const manifest = useMemo(() => getSourceContentDocuments(level), [level]);
  const links = useMemo(() => getSourceContentLinks(level), [level]);
  const sequences = useMemo(() => [...new Set(records.filter(r => r.kind === 'memos').map(r => r.lesson.maqta))], [records]);
  const filtered = useMemo(() => tab === 'sources' || tab === 'guide' ? [] : filterSourceContent(records, tab, query, sequence), [records, tab, query, sequence]);

  useEffect(() => {
    if (tab !== 'sources') return;
    let cancelled = false;
    setLoadState('loading');
    // لا نمسح ذاكرة تحميل بقية المنصة ولا نحمّل المستويات الأخرى.
    loadOfficialSources(manifest.map(entry => entry.id)).then(docs => {
      if (cancelled) return;
      setDocuments(docs);
      setSelectedDocument(previous => docs.some(doc => doc.id === previous) ? previous : docs[0]?.id || '');
      setLoadState(docs.length === manifest.length ? 'ready' : 'error');
    }).catch(() => { if (!cancelled) setLoadState('error'); });
    return () => { cancelled = true; };
  }, [tab, manifest]);

  const activeDocument = documents.find(doc => doc.id === selectedDocument);
  const terms = normalizeSourceQuery(query).split(' ').filter(Boolean);
  const pages = activeDocument?.pages.filter(page => terms.every(term => normalizeSourceQuery(page.text).includes(term))) || [];
  const exportContent = () => {
    const blob = new Blob([JSON.stringify(buildSourceContentExport(level, lessons), null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `source-content-${level}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div dir="rtl" className="h-full overflow-y-auto bg-slate-50 text-slate-800">
    <header className="bg-emerald-950 text-white p-5 space-y-3">
      <h1 className="text-xl font-black flex items-center gap-2"><BookOpen className="w-6 h-6" />المحتوى المصدري — {SOURCE_CONTENT_LEVEL_LABELS[level]}</h1>
      <p className="text-sm text-emerald-100">مذكرات وأنشطة وجداول ورسوم وتقويمات قابلة للبحث، مع الوثائق الرسمية المتاحة.</p>
      <p className="text-xs leading-6 text-amber-100">المحتوى المنظم مستمد من قاعدة المذكرات الحالية، وليس نقلاً حرفياً من ملف أصلي. النصوص الحرفية منفصلة في تبويب «المصادر والصفحات»، ولا تُنسب لها أرقام صفحات المذكرات أو الرسوم المعاد بناؤها.</p>
      <button type="button" onClick={exportContent} className="inline-flex items-center gap-2 border border-emerald-500 rounded-lg px-3 py-2 text-sm hover:bg-emerald-900"><Download className="w-4 h-4" />تصدير محتوى السنة JSON</button>
    </header>
    <nav aria-label="أقسام المحتوى المصدري" className="flex flex-wrap gap-2 p-3 border-b bg-white">
      {[...TABS.map(item => ({ ...item, count: records.filter(r => r.kind === item.id).length })), { id: 'sources' as const, label: 'المصادر والصفحات', count: manifest.length }, ...(guide ? [{ id: 'guide' as const, label: 'الدليل البيداغوجي', count: undefined }] : [])].map(item => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={`px-3 py-2 rounded-lg text-sm font-bold ${tab === item.id ? 'bg-emerald-800 text-white' : 'bg-slate-100 hover:bg-emerald-50'}`}>{item.label}{item.count !== undefined ? ` (${item.count})` : ''}</button>)}
    </nav>
    {tab === 'guide' ? <div className="min-h-[600px]">{guide}</div> : <main className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <label className="flex-1 min-w-48 flex items-center gap-2 bg-white border border-slate-300 p-2 rounded-lg"><Search className="w-4 h-4" /><input aria-label="البحث في المحتوى المصدري" placeholder="ابحث في المحتوى…" value={query} onChange={event => setQuery(event.target.value)} className="w-full outline-none text-sm" /></label>
        {tab !== 'sources' && <select aria-label="تصفية حسب المقطع" value={sequence} onChange={event => setSequence(event.target.value)} className="bg-white border border-slate-300 p-2 rounded-lg text-sm"><option value="">كل المقاطع</option>{sequences.map(title => <option key={title} value={title}>{title}</option>)}</select>}
      </div>
      {tab === 'sources' ? <>
        <p className="text-sm text-slate-600">تعرض الصفحات نصوص الوثائق المفهرسة فقط، بأرقام صفحات ملف PDF. بعض المراجع متاحة كرابط PDF فقط؛ لا نفترض وجود تفريغ نصي لها. مخططات 2021/2022 تاريخية ولا تستبدل المخططات الأحدث.</p>
        <div className="grid md:grid-cols-2 gap-2">{links.map(link => <a key={`${link.title}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="bg-white border rounded-xl p-3 text-sm text-emerald-900 hover:underline">{link.title}<ExternalLink className="inline-block w-4 h-4 mr-2" /></a>)}</div>
        {loadState === 'loading' && <p role="status">جارٍ تحميل النصوص الأصلية…</p>}
        {loadState === 'error' && <p role="alert">تعذر تحميل بعض النصوص. تظل روابط المصادر متاحة. <button type="button" className="underline" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</button></p>}
        {documents.length > 0 && <>
          <select aria-label="اختيار الوثيقة الأصلية" value={selectedDocument} onChange={event => setSelectedDocument(event.target.value)} className="w-full p-3 border rounded-xl bg-white">{documents.map(doc => <option key={doc.id} value={doc.id}>{doc.title}</option>)}</select>
          <p role="status" className="text-sm">{pages.length} صفحة مطابقة</p>
          {pages.map(page => <article key={page.page} className="bg-white border rounded-xl p-4">
            <h3 className="font-bold mb-3">{activeDocument?.title} — ص {page.page}</h3>
            <p className="whitespace-pre-wrap leading-8 text-sm">{page.text}</p>
            {activeDocument?.url && <a target="_blank" rel="noreferrer" className="inline-block mt-3 text-emerald-800 underline text-sm" href={`${activeDocument.url}${activeDocument.url.startsWith('/assets/') ? `#page=${page.page}` : ''}`}>فتح المصدر{activeDocument.url.startsWith('/assets/') ? ` — ص ${page.page}` : ''}</a>}
          </article>)}
          {!pages.length && <p>لا توجد صفحات مطابقة للبحث.</p>}
        </>}
      </> : <>
        <p role="status" className="text-sm text-slate-600">{filtered.length} نتيجة — من قاعدة المذكرات</p>
        {!filtered.length && <p className="bg-white border rounded-xl p-6">لا يوجد محتوى مطابق في هذا القسم. جرّب تغيير البحث أو المقطع.</p>}
        {filtered.map(record => <details key={record.id} className="bg-white border border-slate-200 rounded-xl p-4">
          <summary className="cursor-pointer font-bold text-emerald-950">{record.title}<span className="block text-xs text-slate-500 font-normal mt-1">مذكرة {record.lesson.memoNumber || '—'} · {record.lesson.maqta} · {record.lesson.mawrid}</span></summary>
          <div className="text-sm mt-3"><RecordContent record={record} />
            {onOpenMemoUnit && <button type="button" onClick={() => onOpenMemoUnit(record.lesson)} className="mt-4 px-3 py-2 rounded-lg bg-emerald-800 text-white">فتح المذكرة المرتبطة</button>}
          </div>
        </details>)}
      </>}
    </main>}
  </div>;
}
