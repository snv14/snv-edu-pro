import React, { useEffect, useMemo, useState } from 'react';
import { Database, ExternalLink, FilePlus2, Search, Trash2, X } from 'lucide-react';
import {
  getKnowledgeStats,
  searchKnowledge,
  type IndexBuildOptions,
} from '../services/knowledgeBase';
import {
  OFFICIAL_SOURCES_TOTAL,
  getOfficialSourcesManifest,
  loadOfficialSources,
} from '../services/knowledgeOfficialSources';
import {
  deleteKnowledgeDoc,
  loadKnowledgeDocs,
  MAX_DOC_CHARS,
  saveKnowledgeDoc,
  saveKnowledgeSettings,
  type KnowledgeSettings,
} from '../services/knowledgeLibraryStore';
import {
  KNOWLEDGE_FACET_LABELS,
  KNOWLEDGE_KIND_LABELS,
  KNOWLEDGE_LEVEL_LABELS,
  KNOWLEDGE_STATUS_LABELS,
  type KnowledgeFacet,
  type KnowledgeLevel,
  type KnowledgeSourceKind,
  type OfficialKnowledgeDoc,
  type TeacherKnowledgeDoc,
} from '../types/knowledge';

const KIND_STYLE: Record<KnowledgeSourceKind, string> = {
  curriculum: 'bg-teal-100 text-teal-900 border-teal-300',
  progression: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  companionDocument: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  teacherGuide: 'bg-violet-100 text-violet-900 border-violet-300',
  memo: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  teacherDocument: 'bg-amber-100 text-amber-900 border-amber-300',
};

const FAMILIES: KnowledgeSourceKind[] = ['curriculum', 'companionDocument', 'teacherGuide', 'memo', 'progression', 'teacherDocument'];

const EXTRACTION_FACETS: KnowledgeFacet[] = [
  'moshkila', 'faradiyat', 'activity', 'instructions', 'answers', 'irsae', 'taqwim',
  'wadiya', 'wasail', 'marifa', 'manhaji', 'mostalahat', 'markaba', 'ma3ayir',
  'teacherRole', 'learnerRole', 'map', 'progression', 'methodology',
];

interface Props {
  selectedLevel?: string;
  lessons?: IndexBuildOptions['lessons'];
  extraDocs?: TeacherKnowledgeDoc[];
  settings: KnowledgeSettings;
  onSettingsChange: (settings: KnowledgeSettings) => void;
  onUseQuery?: (query: string) => void;
  onClose: () => void;
}

export const KnowledgeBasePanel: React.FC<Props> = ({
  selectedLevel,
  lessons,
  extraDocs = [],
  settings,
  onSettingsChange,
  onUseQuery,
  onClose,
}) => {
  const [docs, setDocs] = useState<TeacherKnowledgeDoc[]>(() => loadKnowledgeDocs());
  const [officialDocs, setOfficialDocs] = useState<OfficialKnowledgeDoc[]>([]);

  // النصوص الرسمية كبيرة (~473 ألف حرف) فتُحمَّل كسولياً مرة واحدة عند فتح اللوحة.
  useEffect(() => {
    let active = true;
    void loadOfficialSources().then(loaded => { if (active) setOfficialDocs(loaded); });
    return () => { active = false; };
  }, []);
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', kind: 'companionDocument' as KnowledgeSourceKind, level: (selectedLevel || 'all') as KnowledgeLevel, text: '', url: '' });
  const [error, setError] = useState('');

  const indexOptions = useMemo<IndexBuildOptions>(() => ({
    lessons,
    teacherDocs: settings.includeTeacherDocs ? [...docs, ...extraDocs] : extraDocs,
    officialDocs: settings.includeOfficialSources ? officialDocs : [],
    includeCorpus: settings.includeCorpus,
    includeProgression: settings.includeProgression,
  }), [lessons, docs, extraDocs, officialDocs, settings.includeTeacherDocs, settings.includeOfficialSources, settings.includeCorpus, settings.includeProgression]);

  const stats = useMemo(() => getKnowledgeStats(indexOptions), [indexOptions]);

  const results = useMemo(() => {
    if (!searched.trim()) return [];
    return searchKnowledge(searched, {
      ...indexOptions,
      level: selectedLevel,
      topK: 10,
    });
  }, [searched, indexOptions, selectedLevel]);

  const updateSettings = (patch: Partial<KnowledgeSettings>) => {
    onSettingsChange(saveKnowledgeSettings(patch));
  };

  const refreshDocs = () => setDocs(loadKnowledgeDocs());

  const readFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
    reader.readAsText(file);
  });

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!/\.(txt|md|markdown)$/i.test(file.name) && !/^text\//.test(file.type)) {
      setError('الملفات المدعومة للإضافة الدائمة: txt وmd. ملفات PDF وWord تُرفق في المحادثة لتحليلها مباشرة.');
      return;
    }
    if (file.size > MAX_DOC_CHARS * 4) {
      setError('حجم الملف أكبر من الحد المسموح للفهرسة المحلية.');
      return;
    }
    try {
      const text = await readFile(file);
      setForm(previous => ({
        ...previous,
        text: text.slice(0, MAX_DOC_CHARS),
        title: previous.title || file.name.replace(/\.(txt|md|markdown)$/i, ''),
      }));
    } catch {
      setError('تعذر قراءة نص الملف.');
    }
  };

  const addDocument = () => {
    setError('');
    if (!form.title.trim() || !form.text.trim()) {
      setError('العنوان ونص الوثيقة مطلوبان.');
      return;
    }
    const saved = saveKnowledgeDoc({
      title: form.title.trim(),
      kind: form.kind,
      level: form.level,
      text: form.text,
      url: form.url.trim() || undefined,
      authority: 'وثيقة أستاذ مرفوعة في المنصة',
    });
    if (!saved) {
      setError('تعذر حفظ الوثيقة (قد تكون المساحة المحلية ممتلئة).');
      return;
    }
    setForm({ title: '', kind: form.kind, level: form.level, text: '', url: '' });
    setFormOpen(false);
    refreshDocs();
  };

  const removeDocument = (id: string) => {
    deleteKnowledgeDoc(id);
    refreshDocs();
  };

  const Toggle: React.FC<{ label: string; hint: string; checked: boolean; onChange: (value: boolean) => void }> = ({ label, hint, checked, onChange }) => (
    <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 cursor-pointer hover:border-emerald-300 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="mt-0.5 w-3.5 h-3.5 accent-emerald-700"
      />
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-slate-800">{label}</span>
        <span className="block text-[9.5px] text-slate-500 leading-snug">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-3.5 py-3 space-y-3" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center"><Database className="w-4 h-4" /></span>
          <div>
            <h3 className="text-[13px] font-black text-slate-900">قاعدة معرفة المساعد</h3>
            <p className="text-[10px] text-slate-500">المنهاج · الوثيقة المرافقة · دليل الأستاذ · المذكرات</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="إغلاق لوحة قاعدة المعرفة" className="p-1.5 rounded-lg text-slate-500 hover:bg-white transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {FAMILIES.map(kind => {
          const documents = stats.documents.filter(document => document.kind === kind);
          const count = documents.reduce((sum, document) => sum + (document.chunkCount || 0), 0);
          return (
            <div key={kind} className={`rounded-xl border px-2.5 py-2 ${KIND_STYLE[kind]}`}>
              <p className="text-[11px] font-black">{KNOWLEDGE_KIND_LABELS[kind]}</p>
              <p className="text-[9.5px] opacity-80">{documents.length} وثيقة · {count} مقطع مفهرس</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-500 bg-white border border-gray-200 rounded-xl px-2.5 py-2">
        إجمالي المقاطع المفهرسة: <strong className="text-slate-800">{stats.chunks}</strong>. يستطيع المساعد استخراج:
        <span className="block mt-1 leading-relaxed">
          {EXTRACTION_FACETS.map(facet => KNOWLEDGE_FACET_LABELS[facet]).join(' · ')}
        </span>
      </p>

      <section className="rounded-xl border border-teal-200 bg-teal-50/60 p-2.5 space-y-1.5">
        <h4 className="text-[11.5px] font-black text-teal-900">
          الوثائق الرسمية المفهرسة
          <span className="mr-1 font-bold text-teal-700">
            ({OFFICIAL_SOURCES_TOTAL.pages} صفحة · {Math.round(OFFICIAL_SOURCES_TOTAL.chars / 1000)} ألف حرف)
          </span>
        </h4>
        <ul className="space-y-1">
          {getOfficialSourcesManifest().map(entry => (
            <li key={entry.id} className="flex items-start gap-1.5 text-[10.5px] leading-snug text-teal-900">
              <span className={`mt-0.5 shrink-0 rounded border px-1 py-px font-black ${KIND_STYLE[entry.kind] || 'bg-white text-slate-700 border-slate-300'}`}>
                {KNOWLEDGE_KIND_LABELS[entry.kind] || entry.kind}
              </span>
              <span className="min-w-0">
                {entry.title}
                <span className="block font-bold text-teal-700">
                  {entry.pages} صفحة · مطابقة {entry.quality}%
                  {entry.level !== 'all' ? ` · ${KNOWLEDGE_LEVEL_LABELS[entry.level as KnowledgeLevel]}` : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-2.5 space-y-2">
        <h4 className="text-[11.5px] font-black text-slate-800">إعدادات البحث</h4>
        <div className="grid grid-cols-1 gap-1.5">
          <Toggle
            label={`الوثائق الرسمية الحرفية (${officialDocs.length}/${OFFICIAL_SOURCES_TOTAL.documents} محمَّلة)`}
            hint="نص الوزارة الأصلي كما هو: المنهاج 2016، الوثيقة المرافقة، دليل الأستاذ س4، والمخططات السنوية — بأرقام الصفحات للاستشهاد."
            checked={settings.includeOfficialSources}
            onChange={value => updateSettings({ includeOfficialSources: value })}
          />
          <Toggle
            label="التوجيهات المنهجية (ملخصات بنيوية)"
            hint="ملخصات تُستعمل لمعايير الصياغة والاستخراج؛ أولويتها أدنى من النص الرسمي الحرفي."
            checked={settings.includeCorpus}
            onChange={value => updateSettings({ includeCorpus: value })}
          />
          <Toggle
            label="التدرج والتوزيع السنوي"
            hint="توزيع الحصص أسبوعياً لكل مستوى من الوثائق المرفقة."
            checked={settings.includeProgression}
            onChange={value => updateSettings({ includeProgression: value })}
          />
          <Toggle
            label="وثائقي المرفوعة"
            hint="النصوص التي تضيفها أدناه (منهاج، وثيقة مرافقة، دليل أستاذ، مذكرات)."
            checked={settings.includeTeacherDocs}
            onChange={value => updateSettings({ includeTeacherDocs: value })}
          />
          <Toggle
            label="نص المصدر الخام لمذكرات 1AM (OCR)"
            hint="نص مستخرج آلياً، جودته متغيرة؛ يُستحسن إبقاؤه للاستئناس فقط."
            checked={settings.includeOcrSupplement}
            onChange={value => updateSettings({ includeOcrSupplement: value })}
          />
          <Toggle
            label="الاستخراج المباشر دون ذكاء اصطناعي"
            hint="يعرض النتائج الموثقة من القاعدة فوراً (يعمل بدون مفتاح API)."
            checked={settings.localFirst}
            onChange={value => updateSettings({ localFirst: value })}
          />
        </div>
        <label className="flex items-center gap-2 text-[10.5px] font-bold text-slate-700">
          عدد المقاطع المسترجعة لكل سؤال
          <select
            value={settings.topK}
            onChange={event => updateSettings({ topK: Number(event.target.value) })}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-[10.5px]"
          >
            {[6, 10, 12, 16, 20].map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-2.5 space-y-2">
        <h4 className="text-[11.5px] font-black text-slate-800">اختبار البحث في القاعدة</h4>
        <div className="flex items-center gap-1.5">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') setSearched(query); }}
            placeholder="مثال: استخرج المشكلة والفرضيات للمقطع الأول 3am"
            className="flex-1 rounded-lg border border-gray-300 bg-slate-50 px-2.5 py-1.5 text-[11.5px] focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setSearched(query)}
            disabled={!query.trim()}
            className="p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 transition"
            aria-label="ابحث في قاعدة المعرفة"
          >
            <Search className="w-4 h-4" />
          </button>
          {onUseQuery && (
            <button
              type="button"
              onClick={() => onUseQuery(query)}
              disabled={!query.trim()}
              className="px-2 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 text-[10px] font-bold hover:bg-emerald-50 disabled:opacity-40 transition"
            >
              اسأل المساعد
            </button>
          )}
        </div>
        {searched.trim() && (
          <div className="space-y-1.5">
            {results.length === 0 && <p className="text-[10.5px] text-amber-700">لا توجد نتيجة مطابقة. جرّب كلمات من المصدر أو وسّع المستوى.</p>}
            {results.map(hit => (
              <article key={hit.chunk.id} className="rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black ${KIND_STYLE[hit.chunk.kind]}`}>{KNOWLEDGE_KIND_LABELS[hit.chunk.kind]}</span>
                  <span className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{KNOWLEDGE_FACET_LABELS[hit.chunk.facet]}</span>
                  {hit.chunk.level !== 'all' && (
                    <span className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{KNOWLEDGE_LEVEL_LABELS[hit.chunk.level]}</span>
                  )}
                  <span className="text-[9px] text-slate-400">درجة المطابقة {hit.score}</span>
                </div>
                <p className="mt-1 text-[10.5px] font-bold text-slate-800">{hit.chunk.section}</p>
                <p className="text-[9.5px] text-slate-500">{hit.chunk.documentTitle} · {KNOWLEDGE_STATUS_LABELS[hit.chunk.status]}</p>
                <p className="mt-1 text-[10.5px] text-slate-700 whitespace-pre-line leading-relaxed">{hit.snippet}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[11.5px] font-black text-slate-800">وثائقي في القاعدة ({docs.length})</h4>
          <button
            type="button"
            onClick={() => setFormOpen(open => !open)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-800 transition"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            {formOpen ? 'إلغاء' : 'إضافة وثيقة'}
          </button>
        </div>

        {formOpen && (
          <div className="space-y-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
            <input
              value={form.title}
              onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))}
              placeholder="عنوان الوثيقة (مثال: الوثيقة المرافقة — مقطع التغذية)"
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[11px]"
            />
            <div className="flex flex-wrap gap-1.5">
              <select
                value={form.kind}
                onChange={event => setForm(previous => ({ ...previous, kind: event.target.value as KnowledgeSourceKind }))}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[11px]"
              >
                {FAMILIES.map(kind => <option key={kind} value={kind}>{KNOWLEDGE_KIND_LABELS[kind]}</option>)}
              </select>
              <select
                value={form.level}
                onChange={event => setForm(previous => ({ ...previous, level: event.target.value as KnowledgeLevel }))}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[11px]"
              >
                {(Object.keys(KNOWLEDGE_LEVEL_LABELS) as KnowledgeLevel[]).map(level => (
                  <option key={level} value={level}>{KNOWLEDGE_LEVEL_LABELS[level]}</option>
                ))}
              </select>
              <input
                value={form.url}
                onChange={event => setForm(previous => ({ ...previous, url: event.target.value }))}
                placeholder="رابط المصدر (اختياري)"
                className="flex-1 min-w-[140px] rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[11px]"
              />
            </div>
            <textarea
              value={form.text}
              onChange={event => setForm(previous => ({ ...previous, text: event.target.value.slice(0, MAX_DOC_CHARS) }))}
              rows={5}
              placeholder="الصق نص الوثيقة هنا، أو اختر ملف txt / md…"
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-[11px] leading-relaxed"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer hover:border-emerald-400 transition">
                اختيار ملف txt / md
                <input
                  type="file"
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  className="hidden"
                  onChange={event => { void onPickFile(event.target.files?.[0]); event.target.value = ''; }}
                />
              </label>
              <span className="text-[9.5px] text-slate-500">{form.text.length} / {MAX_DOC_CHARS} حرف</span>
              <button
                type="button"
                onClick={addDocument}
                className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[10.5px] font-bold text-white hover:bg-emerald-800 transition"
              >
                حفظ وفهرسة
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-[10.5px] font-bold text-red-700">{error}</p>}

        {docs.length === 0 && !formOpen && (
          <p className="text-[10.5px] text-slate-500">
            لم تُضف وثائق بعد. أضف نص المنهاج أو الوثيقة المرافقة أو دليل الأستاذ أو مذكرتك ليبحث فيها المساعد مع المصادر الرسمية.
          </p>
        )}

        <ul className="space-y-1.5">
          {docs.map(doc => (
            <li key={doc.id} className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-800 truncate">{doc.title}</p>
                <p className="text-[9.5px] text-slate-500">
                  {KNOWLEDGE_KIND_LABELS[doc.kind]} · {KNOWLEDGE_LEVEL_LABELS[doc.level]} · {doc.text.length} حرف
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeDocument(doc.id)}
                aria-label={`حذف ${doc.title}`}
                className="p-1 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-2.5 space-y-1.5">
        <h4 className="text-[11.5px] font-black text-slate-800">الوثائق المفهرسة</h4>
        <ul className="space-y-1">
          {stats.documents.map(document => (
            <li key={document.id} className="flex items-start justify-between gap-2 text-[10.5px]">
              <span className="min-w-0">
                <span className={`ml-1 rounded-md border px-1.5 py-0.5 text-[9px] font-black ${KIND_STYLE[document.kind]}`}>
                  {KNOWLEDGE_KIND_LABELS[document.kind]}
                </span>
                <span className="font-bold text-slate-800">{document.title}</span>
                <span className="block text-[9.5px] text-slate-500 leading-snug">{document.role}</span>
              </span>
              {document.url ? (
                <a href={document.url} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1 text-[9.5px] text-blue-700 hover:underline">
                  المصدر <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="shrink-0 text-[9.5px] text-slate-400">{document.chunkCount} مقطع</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
