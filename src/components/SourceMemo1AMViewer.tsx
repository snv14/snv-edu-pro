import React, { useMemo, useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Table2,
  Image as ImageIcon,
  Printer,
  Maximize2,
  Minimize2,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Layers,
  BookOpen,
  Sparkles,
  Download,
  FlaskConical,
  ClipboardList,
  ShieldAlert,
  Microscope,
  ArrowUpRight,
  X,
  FileJson,
  FolderOpen,
} from 'lucide-react';
import type { DB_Table, LessonMemo } from '../types';
import type {
  ActivityRecallBundle,
  ArchiveMediaType,
  ArchivedTableRecord,
} from '../data/memos/archiveSchema';
import {
  ARCHIVE_1AM_DB,
  ARCHIVE_1AM_EXPERIMENTS,
  ARCHIVE_1AM_MEDIA,
  ARCHIVE_1AM_PAGES,
  ARCHIVE_1AM_SOURCE_META,
  ARCHIVE_1AM_SOURCE_PDF_URL,
  ARCHIVE_1AM_TABLES,
  ARCHIVE_1AM_WORKSHEETS,
  getMediaForLesson,
  recallActivityBundle,
  search1AMArchive,
} from '../data/archive1am';
import sourceText from '../data/sourceMemo1amFullText.md?raw';

type ArchiveTab =
  | 'memos'
  | 'activities'
  | 'experiments'
  | 'media'
  | 'tables'
  | 'evaluations'
  | 'worksheets'
  | 'pages';

interface Props {
  lessons: LessonMemo[];
  onOpenMemoUnit?: (lesson: LessonMemo) => void;
  onRecallToLogbook?: (bundle: ActivityRecallBundle) => void;
}

const RenderHtmlTable: React.FC<{
  tbl: DB_Table;
  accent?: 'emerald' | 'amber' | 'rose' | 'sky';
}> = ({ tbl, accent = 'emerald' }) => {
  const palette = {
    emerald: {
      headBg: 'bg-emerald-50',
      titleBg: 'bg-emerald-100/70 text-emerald-950 border-emerald-200',
      border: 'border-emerald-200',
    },
    amber: {
      headBg: 'bg-amber-50/80',
      titleBg: 'bg-amber-100/70 text-amber-950 border-amber-200',
      border: 'border-amber-200',
    },
    rose: {
      headBg: 'bg-rose-50',
      titleBg: 'bg-rose-100/70 text-rose-950 border-rose-200',
      border: 'border-rose-200',
    },
    sky: {
      headBg: 'bg-sky-50',
      titleBg: 'bg-sky-100/70 text-sky-950 border-sky-200',
      border: 'border-sky-200',
    },
  }[accent];

  return (
    <div className={`overflow-x-auto bg-white rounded-xl border ${palette.border} shadow-2xs`}>
      {tbl.table_title && (
        <div className={`px-3 py-1.5 text-xs font-black border-b ${palette.titleBg}`}>
          {tbl.table_title}
        </div>
      )}
      <table className="w-full text-xs text-right border-collapse">
        <thead>
          <tr className={palette.headBg}>
            {tbl.headers.map((h, hi) => (
              <th key={hi} className={`border ${palette.border} p-2 font-extrabold text-slate-900`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tbl.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50/70">
              {row.map((cell, ci) => (
                <td key={ci} className={`border ${palette.border} p-2 align-top text-slate-800 whitespace-pre-wrap`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SourceMemo1AMViewer: React.FC<Props> = ({
  lessons,
  onOpenMemoUnit,
  onRecallToLogbook,
}) => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>('memos');
  const [query, setQuery] = useState('');
  const [selectedMaqtaFilter, setSelectedMaqtaFilter] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'الكل' | ArchiveMediaType>('الكل');
  const [tableSectionFilter, setTableSectionFilter] = useState<
    'all' | ArchivedTableRecord['section']
  >('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [openAll, setOpenAll] = useState(false);
  const [showRawSource, setShowRawSource] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [previewLightbox, setPreviewLightbox] = useState<{
    title: string;
    subtitle?: string;
    svg?: string;
    imageUrl?: string;
  } | null>(null);
  const [recalledBundle, setRecalledBundle] = useState<ActivityRecallBundle | null>(null);

  // نستخدم قاعدة الأرشيف المحفوظة أو المذكرات الممررة إن كانت محدثة من المحرر
  const baseLessons = useMemo(() => {
    const oneAm = lessons.filter((l) => l.level === '1am');
    return oneAm.length === 27 ? oneAm : ARCHIVE_1AM_DB.lessons;
  }, [lessons]);

  const maqtaOptions = useMemo(
    () => Array.from(new Set(baseLessons.map((l) => l.maqta))),
    [baseLessons]
  );

  // نتائج البحث الذكي المجمّعة (مع التطبيع العربي)
  const searchResults = useMemo(() => search1AMArchive(query), [query]);

  const filteredLessons = useMemo(() => {
    const matchedIds = new Set(searchResults.lessons.map((l) => l.sourceLearningUnitId));
    return baseLessons.filter((l) => {
      if (!matchedIds.has(l.sourceLearningUnitId)) return false;
      if (selectedMaqtaFilter !== 'all' && l.maqta !== selectedMaqtaFilter) return false;
      return true;
    });
  }, [baseLessons, searchResults.lessons, selectedMaqtaFilter]);

  const filteredActivities = useMemo(() => {
    return searchResults.activities.filter(
      (a) => selectedMaqtaFilter === 'all' || a.maqtaTitle === selectedMaqtaFilter
    );
  }, [searchResults.activities, selectedMaqtaFilter]);

  const filteredExperiments = useMemo(() => {
    return searchResults.experiments.filter(
      (e) => selectedMaqtaFilter === 'all' || e.trace.maqtaTitle === selectedMaqtaFilter
    );
  }, [searchResults.experiments, selectedMaqtaFilter]);

  const filteredMedia = useMemo(() => {
    return searchResults.media.filter(
      (m) => mediaTypeFilter === 'الكل' || m.mediaType === mediaTypeFilter
    );
  }, [searchResults.media, mediaTypeFilter]);

  const filteredTables = useMemo(() => {
    return searchResults.tables.filter(
      (t) => tableSectionFilter === 'all' || t.section === tableSectionFilter
    );
  }, [searchResults.tables, tableSectionFilter]);

  const filteredEvaluations = useMemo(() => {
    return searchResults.evaluations.filter(
      (ev) => selectedMaqtaFilter === 'all' || ev.trace.maqtaTitle === selectedMaqtaFilter
    );
  }, [searchResults.evaluations, selectedMaqtaFilter]);

  const filteredWorksheets = useMemo(() => searchResults.worksheets, [searchResults.worksheets]);

  const filteredPages = useMemo(() => {
    const q = query.trim();
    if (!q) return ARCHIVE_1AM_PAGES;
    const norm = q.toLowerCase();
    return ARCHIVE_1AM_PAGES.filter(
      (p) =>
        `ص ${p.pageNumber}`.includes(norm) ||
        String(p.pageNumber) === norm ||
        p.title.toLowerCase().includes(norm) ||
        p.category.toLowerCase().includes(norm) ||
        p.summary.toLowerCase().includes(norm)
    );
  }, [query]);

  const sourcePages = useMemo(() => {
    const chunks = sourceText.split(/(?=<PARSED TEXT FOR PAGE: \d+ \/ 98>)/g).filter(Boolean);
    return chunks.map((text, index) => ({
      page: Number(text.match(/<PARSED TEXT FOR PAGE: (\d+)/)?.[1] || index + 1),
      text,
    }));
  }, []);

  const visibleSourceText = useMemo(() => {
    if (selectedPage == null) return sourceText;
    return sourcePages.find((p) => p.page === selectedPage)?.text || sourceText;
  }, [selectedPage, sourcePages]);

  const rawMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return sourceText.split(/\n{2,}/).filter((p) => p.toLowerCase().includes(q)).slice(0, 60);
  }, [query]);

  const toggleOpen = (id: string) => {
    if (openAll) {
      setOpenAll(false);
      const next = new Set(
        filteredLessons.map((r, i) => r.sourceLearningUnitId || `1am-${i}`)
      );
      next.delete(id);
      setOpenIds(next);
      return;
    }
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    setOpenAll(true);
    setOpenIds(
      new Set(filteredLessons.map((r, i) => r.sourceLearningUnitId || `1am-${i}`))
    );
  };

  const handleCollapseAll = () => {
    setOpenAll(false);
    setOpenIds(new Set());
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(ARCHIVE_1AM_DB, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'archive_1am_complete_database.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مذكرات السنة الأولى متوسط كاملة — الأرشيف العلمي الرقمي</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.7; padding: 24px; color: #0f172a; background: #fff; }
    h1, h2, h3, h4 { color: #064e3b; margin-top: 1.2em; }
    .memo-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin-bottom: 24px; page-break-inside: avoid; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #e2e8f0; margin-left: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid #94a3b8; padding: 8px; text-align: right; }
    th { background: #ecfdf5; }
    .activity-box { background: #f8fafc; border-right: 4px solid #0284c7; padding: 12px; margin: 10px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${ARCHIVE_1AM_SOURCE_META.sourceTitle}</h1>
  <p>إعداد: ${ARCHIVE_1AM_SOURCE_META.author} — ${ARCHIVE_1AM_SOURCE_META.school} | المذكرات: ${filteredLessons.length} | الأنشطة: ${ARCHIVE_1AM_DB.activities.length} | التجارب: ${ARCHIVE_1AM_EXPERIMENTS.length}</p>
  <hr/>
  ${filteredLessons
    .map(
      (l) => `
    <div class="memo-card">
      <div style="margin-bottom: 8px;">
        <span class="badge">${l.midan}</span>
        <span class="badge">${l.maqta}</span>
        <span class="badge">مذكرة ${l.memoNumber} (ص ${l.sourcePage || ''}${l.sourcePageEnd ? `–${l.sourcePageEnd}` : ''})</span>
      </div>
      <h2>${l.mawrid}</h2>
      <h3>${l.ta3alom}</h3>
      <p><b>مركبة الكفاءة:</b> ${l.markaba || '—'}</p>
      <p><b>المورد المعرفي:</b> ${l.marifa || '—'}</p>
      <p><b>المورد المنهجي:</b> ${l.manhaji || '—'}</p>
      <p><b>المصطلحات:</b> ${l.mostalahat || '—'}</p>
      <p><b>الوسائل:</b> ${l.wasail || '—'}</p>
      <p><b>وضعية تعلم المورد:</b> ${l.wadiya || '—'}</p>
      <p><b>المشكلة:</b> ${l.moshkila || '—'}</p>
      ${l.faradiyat ? `<p><b>الفرضيات:</b> ${l.faradiyat}</p>` : ''}
      ${l.anshita
        .map(
          (a) => `
        <div class="activity-box">
          <h4>${a.title}</h4>
          <p><b>التعليمات:</b><br/>${(a.asila || '').replace(/\n/g, '<br/>')}</p>
          <p><b>الإجابات والاستنتاجات:</b><br/>${(a.ajwiba || '').replace(/\n/g, '<br/>')}</p>
          ${(a.tables || [])
            .map(
              (t) => `<table>${t.table_title ? `<caption><b>${t.table_title}</b></caption>` : ''}<thead><tr>${t.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
            )
            .join('')}
        </div>
      `
        )
        .join('')}
      <p><b>إرساء المورد:</b><br/>${(l.irsae || '—').replace(/\n/g, '<br/>')}</p>
      ${l.taqwim ? `<p><b>تقويم المورد:</b><br/>${l.taqwim.replace(/\n/g, '<br/>')}</p>` : ''}
    </div>
  `
    )
    .join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'أرشيف_مذكرات_السنة_الأولى_متوسط_الكامل.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabItems: { id: ArchiveTab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'memos', label: 'المذكرات الكاملة', count: filteredLessons.length, icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'activities', label: 'بنك الأنشطة', count: filteredActivities.length, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'experiments', label: 'التجارب العلمية', count: filteredExperiments.length, icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'media', label: 'مكتبة الوسائط الأصلية', count: filteredMedia.length, icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'tables', label: 'الجداول الرقمية', count: filteredTables.length, icon: <Table2 className="w-3.5 h-3.5" /> },
    { id: 'evaluations', label: 'التقويمات والحلول', count: filteredEvaluations.length, icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'worksheets', label: 'أوراق العمل والمختبر', count: filteredWorksheets.length, icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'pages', label: 'فهرس 98 صفحة + PDF', count: filteredPages.length, icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <section dir="rtl" className="w-full min-h-full bg-slate-50 p-3 md:p-6 overflow-y-auto print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* رأس الأرشيف والإحصائيات */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 md:p-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <Microscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg md:text-2xl font-black text-slate-900">
                    أرشيف السنة الأولى متوسط الكامل (1AM — 98 صفحة)
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                    نقل حرفي 100%
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-600 mt-1">
                  المصدر: <span className="font-bold text-slate-800">{ARCHIVE_1AM_SOURCE_META.sourceFile}</span> ·{' '}
                  إعداد: <span className="font-bold text-emerald-800">{ARCHIVE_1AM_SOURCE_META.author}</span> ({ARCHIVE_1AM_SOURCE_META.school})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-black">
              <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                {ARCHIVE_1AM_DB.lessons.length} مذكرة
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-900 border border-sky-200">
                {ARCHIVE_1AM_DB.activities.length} نشاط
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200">
                {ARCHIVE_1AM_EXPERIMENTS.length} تجربة
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-cyan-50 text-cyan-900 border border-cyan-200">
                {ARCHIVE_1AM_MEDIA.length} وسائط أصلية
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                {ARCHIVE_1AM_TABLES.length} جدول رقمي
              </span>
            </div>
          </div>

          {/* شريط البحث الذكي وتصفية المقطع */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-emerald-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث عربي ذكي: مصدر الأغذية، الحليب، كنوب، التركيب الضوئي، التنفس، الإطراح، الخلية، ص 97..."
                className="w-full pr-10 pl-20 py-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 text-sm outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition text-slate-800 placeholder:text-slate-400 font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute left-2.5 top-2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                >
                  مسح
                </button>
              )}
            </div>

            <select
              value={selectedMaqtaFilter}
              onChange={(e) => setSelectedMaqtaFilter(e.target.value)}
              aria-label="تصفية حسب المقطع التعلمي"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-emerald-400"
            >
              <option value="all">كل المقاطع التعلمية ({maqtaOptions.length} مقاطع / 27 مذكرة)</option>
              {maqtaOptions.map((m, idx) => (
                <option key={m} value={m}>
                  {idx + 1}. {m}
                </option>
              ))}
            </select>
          </div>

          {/* التبويبات الثمانية للأرشيف */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {tabItems.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    active
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* أزرار التصدير والطباعة والملف الأصلي */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === 'memos' && (
                <>
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>توسيع كل المذكرات</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>طي الكل</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowRawSource((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showRawSource ? 'إخفاء النص المستخرج الخام' : 'عرض النص الخام للـ PDF'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
              <a
                href={ARCHIVE_1AM_SOURCE_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-xs transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>ملف المذكرات الأصلي (98 ص PDF)</span>
              </a>
              <button
                type="button"
                onClick={handleExportHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير HTML</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>تصدير JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* النص الخام المستخرج عند التفعيل */}
        {showRawSource && (
          <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-sm p-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b">
              <div className="font-black text-slate-900 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>النص الأصلي المستخرج من «{ARCHIVE_1AM_SOURCE_META.sourceFile}»</span>
              </div>
              <select
                value={selectedPage ?? ''}
                onChange={(e) => setSelectedPage(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
              >
                <option value="">كل الصفحات (1 إلى 98)</option>
                {sourcePages.map((p) => (
                  <option key={p.page} value={p.page}>
                    الصفحة {p.page}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="max-h-[55vh] overflow-auto rounded-xl bg-slate-950 text-slate-100 p-4 text-xs leading-6 whitespace-pre-wrap font-mono select-text"
              dir="rtl"
            >
              {query && rawMatches.length
                ? rawMatches.join('\n\n────────────────────────\n\n')
                : visibleSourceText}
            </div>
          </div>
        )}

        {/* 1. تبويب المذكرات الكاملة (27) */}
        {activeTab === 'memos' && (
          <div className="space-y-4">
            {filteredLessons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                لا توجد مذكرات مطابقة لعبارة البحث: <strong className="text-slate-900">"{query}"</strong>
              </div>
            ) : (
              filteredLessons.map((lesson, index) => {
                const id = lesson.sourceLearningUnitId || `1am-${index}`;
                const isOpen = openAll || openIds.has(id);
                const lessonMedia = getMediaForLesson(id);
                const tableCount =
                  (lesson.wadiyaTables?.length || 0) +
                  (lesson.irsaeTables?.length || 0) +
                  (lesson.taqwimTables?.length || 0) +
                  lesson.anshita.reduce((acc, a) => acc + (a.tables?.length || 0), 0);

                return (
                  <article
                    key={id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition print:border-slate-300 print:break-inside-avoid print:mb-6"
                  >
                    <div
                      onClick={() => toggleOpen(id)}
                      className="w-full text-right p-4 cursor-pointer hover:bg-slate-50/80 transition flex flex-wrap items-start justify-between gap-3 select-none"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                        <div className="mt-1 p-1 rounded-lg bg-slate-100 text-slate-600 print:hidden">
                          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900">
                              مذكرة #{lesson.memoNumber || String(index + 1).padStart(2, '0')}
                            </span>
                            {lesson.sourcePage && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                ص {lesson.sourcePage}
                                {lesson.sourcePageEnd && lesson.sourcePageEnd !== lesson.sourcePage
                                  ? `–${lesson.sourcePageEnd}`
                                  : ''}
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800">
                              {lesson.midan}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900">
                              {lesson.maqta}
                            </span>
                            {tableCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 inline-flex items-center gap-1">
                                <Table2 className="w-3 h-3" /> {tableCount} جدول
                              </span>
                            )}
                            {lessonMedia.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 inline-flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> {lessonMedia.length} صورة أصلية
                              </span>
                            )}
                          </div>
                          <h2 className="text-base md:text-lg font-black text-slate-900">{lesson.mawrid}</h2>
                          <p className="text-sm font-bold text-emerald-700 mt-0.5">{lesson.ta3alom}</p>
                        </div>
                      </div>

                      {onOpenMemoUnit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenMemoUnit(lesson);
                          }}
                          className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-2xs transition cursor-pointer shrink-0"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>فتح في محرر المذكرات</span>
                        </button>
                      )}
                    </div>

                    <div
                      className={`${
                        isOpen ? 'block' : 'hidden print:block'
                      } border-t border-slate-100 bg-slate-50/40 p-4 md:p-6 space-y-5 text-sm leading-relaxed`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="font-bold text-slate-500 text-xs block">مركبة الكفاءة:</span>
                          <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.markaba || '—'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 text-xs block">المورد المعرفي:</span>
                          <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.marifa || '—'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 text-xs block">المورد المنهجي:</span>
                          <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.manhaji || '—'}</p>
                        </div>
                        {lesson.ma3ayirTaqwim && (
                          <div>
                            <span className="font-bold text-slate-500 text-xs block">المورد القيمي / معايير التقويم:</span>
                            <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.ma3ayirTaqwim}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-500 text-xs block">المصطلحات:</span>
                          <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.mostalahat || '—'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 text-xs block">الوسائل:</span>
                          <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.wasail || '—'}</p>
                        </div>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-1.5 font-black text-amber-900 text-sm">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span>وضعية تعلم المورد والمشكلة والفرضيات</span>
                        </div>
                        {lesson.wadiya && (
                          <p className="text-xs md:text-sm text-slate-800">
                            <strong className="text-amber-950">الوضعية: </strong>
                            {lesson.wadiya}
                          </p>
                        )}
                        {lesson.moshkila && (
                          <p className="text-xs md:text-sm font-bold text-amber-900">
                            <strong>المشكلة: </strong>
                            {lesson.moshkila}
                          </p>
                        )}
                        {lesson.faradiyat && (
                          <p className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap">
                            <strong className="text-amber-950">الفرضيات: </strong>
                            {lesson.faradiyat}
                          </p>
                        )}
                        {(lesson.wadiyaTables || []).map((t, idx) => (
                          <RenderHtmlTable key={idx} tbl={t} accent="amber" />
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span>مرحلة البحث والتقصي — الأنشطة ({lesson.anshita.length})</span>
                        </div>

                        {lesson.anshita.map((act, actIdx) => (
                          <div
                            key={act.sourceActivityId || actIdx}
                            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                              <h3 className="font-black text-sm md:text-base text-emerald-800">{act.title}</h3>
                              <div className="flex items-center gap-2">
                                {act.zaman && (
                                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-bold">
                                    {act.zaman}
                                  </span>
                                )}
                                {act.sourceActivityId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const bundle = recallActivityBundle(act.sourceActivityId!);
                                      if (bundle) setRecalledBundle(bundle);
                                    }}
                                    className="print:hidden text-[11px] bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 px-2.5 py-0.5 rounded-lg font-bold cursor-pointer"
                                  >
                                    استدعاء حزمة النشاط
                                  </button>
                                )}
                              </div>
                            </div>

                            {act.asila && (
                              <div className="bg-blue-50/60 p-3 rounded-lg border-r-4 border-blue-500">
                                <span className="font-black text-blue-900 text-xs block mb-1">عمل الأستاذ (التعليمات):</span>
                                <p className="whitespace-pre-wrap text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                                  {act.asila}
                                </p>
                              </div>
                            )}

                            {act.ajwiba && (
                              <div className="bg-emerald-50/60 p-3 rounded-lg border-r-4 border-emerald-500">
                                <span className="font-black text-emerald-900 text-xs block mb-1">عمل المتعلم (الإجابات والاستنتاجات):</span>
                                <p className="whitespace-pre-wrap text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                                  {act.ajwiba}
                                </p>
                              </div>
                            )}

                            {(act.tables || []).map((tbl, tblIdx) => (
                              <RenderHtmlTable key={tblIdx} tbl={tbl} accent="emerald" />
                            ))}

                            {(act.diagrams || []).map((diag: any, diagIdx: number) => {
                              const dTitle = diag.title || diag.diagram_title || 'سند علمي';
                              const dSvg = diag.svg || diag.diagram_svg;
                              return (
                                <div
                                  key={diagIdx}
                                  className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-sky-600" />
                                    <span className="text-xs font-bold text-sky-900">{dTitle}</span>
                                  </div>
                                  {dSvg && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLightbox({ title: dTitle, svg: dSvg })}
                                      className="text-xs px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 transition cursor-pointer"
                                    >
                                      معاينة الرسم التخطيطي
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {lesson.irsae && (
                        <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-1.5 font-black text-emerald-900 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>إرساء المورد</span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                            {lesson.irsae}
                          </p>
                          {(lesson.irsaeTables || []).map((t, idx) => (
                            <RenderHtmlTable key={idx} tbl={t} accent="emerald" />
                          ))}
                        </div>
                      )}

                      {(lesson.taqwim || (lesson.taqwimTables && lesson.taqwimTables.length > 0)) && (
                        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-1.5 font-black text-rose-900 text-sm">
                            <HelpCircle className="w-4 h-4 text-rose-600" />
                            <span>تقويم المورد</span>
                          </div>
                          {lesson.taqwim && (
                            <p className="whitespace-pre-wrap text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                              {lesson.taqwim}
                            </p>
                          )}
                          {(lesson.taqwimTables || []).map((t, idx) => (
                            <RenderHtmlTable key={idx} tbl={t} accent="rose" />
                          ))}
                        </div>
                      )}

                      {/* الصور الأصلية المستخرجة من صفحات المذكرة */}
                      {lessonMedia.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 font-black text-slate-800 text-xs md:text-sm">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            <span>الصور والوثائق الأصلية المستخرجة من هذه المذكرة ({lessonMedia.length})</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {lessonMedia.map((med) => (
                              <button
                                key={med.id}
                                type="button"
                                onClick={() =>
                                  setPreviewLightbox({
                                    title: med.title,
                                    subtitle: `${med.mediaType} · الصفحة ${med.sourcePage} — ${med.description}`,
                                    imageUrl: med.imageUrl,
                                  })
                                }
                                className="group text-right border border-slate-200 rounded-xl p-2 bg-slate-50 hover:bg-white hover:border-emerald-400 transition cursor-pointer flex flex-col gap-1.5"
                              >
                                <img
                                  src={med.imageUrl}
                                  alt={med.title}
                                  className="w-full h-28 object-contain rounded-lg bg-white border border-slate-100"
                                  loading="lazy"
                                />
                                <span className="text-[11px] font-bold text-slate-800 line-clamp-2 group-hover:text-emerald-700">
                                  {med.title}
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">ص {med.sourcePage}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(lesson.diagrams || []).length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 font-black text-slate-800 text-xs md:text-sm">
                            <Sparkles className="w-4 h-4 text-sky-600" />
                            <span>الرسومات التخطيطية والسندات ({lesson.diagrams!.length})</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lesson.diagrams!.map((d, di) => (
                              <div
                                key={di}
                                className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 flex flex-col justify-between gap-2"
                              >
                                <div className="font-bold text-xs text-slate-800">{d.title}</div>
                                <div className="flex flex-wrap gap-2">
                                  {d.svg && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewLightbox({
                                          title: d.title || 'رسم تخطيطي',
                                          subtitle: d.description,
                                          svg: d.svg,
                                          imageUrl: d.imageUrl,
                                        })
                                      }
                                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                    >
                                      معاينة الرسم والصورة
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* 2. تبويب بنك الأنشطة المترابط (53) */}
        {activeTab === 'activities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActivities.map((act) => (
              <div key={act.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-900">
                      مذكرة {act.memoNumber} · {act.activityNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                      ص {act.sourcePage}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-700">{act.duration}</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500">
                    {act.maqtaTitle} ← {act.ta3alom}
                  </div>
                  <h3 className="font-black text-sm md:text-base text-slate-900 mt-0.5">{act.title}</h3>
                </div>

                {act.instructions && (
                  <p className="text-xs text-slate-700 bg-blue-50/50 p-2.5 rounded-lg border-r-2 border-blue-400 whitespace-pre-wrap">
                    {act.instructions}
                  </p>
                )}

                {act.answersAndConclusions && (
                  <p className="text-xs text-slate-800 bg-emerald-50/50 p-2.5 rounded-lg border-r-2 border-emerald-400 whitespace-pre-wrap">
                    {act.answersAndConclusions}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px]">
                  <div className="flex flex-wrap gap-1.5 font-bold text-slate-600">
                    {act.experimentIds.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">
                        {act.experimentIds.length} تجربة
                      </span>
                    )}
                    {act.mediaIds.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800">
                        {act.mediaIds.length} صور
                      </span>
                    )}
                    {act.tableIds.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                        {act.tableIds.length} جداول
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const b = recallActivityBundle(act.id);
                      if (b) setRecalledBundle(b);
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer"
                  >
                    استدعاء حزمة النشاط
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. تبويب التجارب العلمية المخبرية (19) */}
        {activeTab === 'experiments' && (
          <div className="space-y-4">
            {filteredExperiments.map((exp) => {
              const expPhotos = ARCHIVE_1AM_MEDIA.filter((m) => exp.originalPhotoIds.includes(m.id));
              return (
                <div key={exp.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-900">
                          مذكرة {exp.memoNumber} · ص {exp.trace.sourcePage}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {exp.trace.maqtaTitle} ← {exp.trace.ta3alomTitle}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-black text-slate-900">{exp.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-slate-800 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <strong className="text-indigo-950">الهدف التجريبي: </strong>
                    {exp.goal}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 block mb-1">الأدوات والوسائل:</strong>
                      <p className="text-slate-700">{exp.tools.join('، ')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 block mb-1">المواد والكواشف:</strong>
                      <p className="text-slate-700">{exp.materials.join('، ')}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 text-xs md:text-sm">
                    <strong className="text-blue-950 block mb-1">خطوات البروتوكول التجريبي:</strong>
                    <ol className="list-decimal list-inside space-y-1 text-slate-800">
                      {exp.steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                      <strong className="text-amber-950 block mb-1">الملاحظة:</strong>
                      <p className="text-slate-800">{exp.observation}</p>
                    </div>
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                      <strong className="text-emerald-950 block mb-1">الاستنتاج العلمي:</strong>
                      <p className="text-slate-900 font-semibold">{exp.conclusion}</p>
                    </div>
                  </div>

                  {expPhotos.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-black text-slate-700 block mb-2">صور التجربة الأصلية من الملف:</span>
                      <div className="flex flex-wrap gap-3">
                        {expPhotos.map((med) => (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() =>
                              setPreviewLightbox({
                                title: med.title,
                                subtitle: `ص ${med.sourcePage} — ${med.description}`,
                                imageUrl: med.imageUrl,
                              })
                            }
                            className="border border-slate-200 rounded-xl p-1.5 bg-white hover:border-indigo-400 transition cursor-pointer w-36 text-right"
                          >
                            <img
                              src={med.imageUrl}
                              alt={med.title}
                              className="w-full h-24 object-contain rounded-lg"
                              loading="lazy"
                            />
                            <span className="text-[10.5px] font-bold text-slate-700 line-clamp-2 mt-1">
                              {med.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 4. تبويب مكتبة الوسائط الأصلية */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
              {(['الكل', 'صورة', 'تجربة', 'مخطط', 'رسم', 'وثيقة', 'أداة مخبر'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    mediaTypeFilter === t
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((med) => (
                <div
                  key={med.id}
                  onClick={() =>
                    setPreviewLightbox({
                      title: med.title,
                      subtitle: `${med.mediaType} · الصفحة ${med.sourcePage}${med.memoNumber ? ` · مذكرة ${med.memoNumber}` : ''} — ${med.description}`,
                      imageUrl: med.imageUrl,
                    })
                  }
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs hover:shadow-md hover:border-emerald-400 transition cursor-pointer flex flex-col gap-2"
                >
                  <div className="h-40 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-2">
                    <img
                      src={med.imageUrl}
                      alt={med.title}
                      className="max-h-full max-w-full object-contain rounded"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10.5px] font-black">
                    <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-900">{med.mediaType}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      ص {med.sourcePage}
                      {med.memoNumber ? ` · م${med.memoNumber}` : ''}
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-900 line-clamp-2">{med.title}</h3>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{med.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. تبويب الجداول الرقمية الحقيقية */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'كل الجداول' },
                { key: 'wadiya', label: 'الوضعيات' },
                { key: 'activity', label: 'الأنشطة' },
                { key: 'irsae', label: 'الإرساء' },
                { key: 'taqwim', label: 'التقويم' },
                { key: 'worksheet', label: 'أوراق العمل' },
                { key: 'appendix', label: 'الملاحق والسلامة' },
              ].map((sec) => (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setTableSectionFilter(sec.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    tableSectionFilter === sec.key
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {filteredTables.map((rec) => (
              <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900">{rec.title}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    {rec.memoNumber && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        مذكرة {rec.memoNumber}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      ص {rec.sourcePage}
                    </span>
                    {rec.digitizedFromImage && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        مرقمن من وثيقة مصورة
                      </span>
                    )}
                  </div>
                </div>
                <RenderHtmlTable
                  tbl={rec.table}
                  accent={
                    rec.section === 'taqwim'
                      ? 'rose'
                      : rec.section === 'wadiya'
                      ? 'amber'
                      : rec.section === 'worksheet' || rec.section === 'appendix'
                      ? 'sky'
                      : 'emerald'
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* 6. تبويب التقويمات والحلول */}
        {activeTab === 'evaluations' && (
          <div className="space-y-4">
            {filteredEvaluations.map((ev) => {
              const evTables = ARCHIVE_1AM_TABLES.filter((t) => ev.tableIds.includes(t.id));
              return (
                <div key={ev.id} className="bg-white border border-rose-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <h3 className="text-sm md:text-base font-black text-rose-950">{ev.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800">
                      ص {ev.sourcePage}
                    </span>
                  </div>
                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-xs md:text-sm text-slate-900 whitespace-pre-wrap">
                    <strong className="text-rose-900 block mb-1">نص التقويم والتعليمة:</strong>
                    {ev.prompt}
                  </div>
                  {ev.modelAnswer && (
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs md:text-sm text-slate-800 whitespace-pre-wrap">
                      <strong className="text-emerald-900 block mb-1">الإجابة النموذجية / المرجع:</strong>
                      {ev.modelAnswer}
                    </div>
                  )}
                  {evTables.map((t) => (
                    <RenderHtmlTable key={t.id} tbl={t.table} accent="rose" />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* 7. تبويب أوراق العمل وأدوات المختبر والسلامة (ص 4–98) */}
        {activeTab === 'worksheets' && (
          <div className="space-y-4">
            {filteredWorksheets.map((ws) => {
              const wsTables = ARCHIVE_1AM_TABLES.filter((t) => ws.tableIds.includes(t.id));
              const wsMedia = ARCHIVE_1AM_MEDIA.filter((m) => ws.mediaIds.includes(m.id));
              return (
                <div key={ws.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                          ws.category === 'رموز السلامة المخبرية'
                            ? 'bg-rose-100 text-rose-900'
                            : ws.category === 'وسائل ومختبر'
                            ? 'bg-indigo-100 text-indigo-900'
                            : ws.category === 'فاصل مقطع'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-sky-100 text-sky-900'
                        }`}
                      >
                        {ws.category === 'رموز السلامة المخبرية' && <ShieldAlert className="w-3.5 h-3.5" />}
                        {ws.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                        ص {ws.sourcePage}
                        {ws.sourcePageEnd && ws.sourcePageEnd !== ws.sourcePage ? `–${ws.sourcePageEnd}` : ''}
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-black text-slate-900 w-full mt-1">{ws.title}</h3>
                  </div>

                  <p className="text-xs md:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {ws.content}
                  </p>

                  {ws.instructions.length > 0 && (
                    <ul className="list-disc list-inside text-xs md:text-sm text-slate-700 space-y-1">
                      {ws.instructions.map((inst, idx) => (
                        <li key={idx}>{inst}</li>
                      ))}
                    </ul>
                  )}

                  {wsTables.map((t) => (
                    <RenderHtmlTable key={t.id} tbl={t.table} accent="sky" />
                  ))}

                  {wsMedia.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2">
                      {wsMedia.map((med) => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() =>
                            setPreviewLightbox({
                              title: med.title,
                              subtitle: `ص ${med.sourcePage} — ${med.description}`,
                              imageUrl: med.imageUrl,
                            })
                          }
                          className="border border-slate-200 rounded-xl p-1.5 bg-white hover:border-sky-400 transition cursor-pointer text-right"
                        >
                          <img
                            src={med.imageUrl}
                            alt={med.title}
                            className="w-full h-24 object-contain rounded"
                            loading="lazy"
                          />
                          <span className="text-[10.5px] font-bold text-slate-700 line-clamp-2 mt-1">
                            {med.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 8. تبويب فهرس الصفحات (98/98) */}
        {activeTab === 'pages' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-black">
                    <th className="border-b border-slate-200 p-3 w-16">الصفحة</th>
                    <th className="border-b border-slate-200 p-3 w-44">التصنيف</th>
                    <th className="border-b border-slate-200 p-3">العنوان والملخص الحرفي</th>
                    <th className="border-b border-slate-200 p-3 w-36">الموارد المرتبطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPages.map((p) => (
                    <tr key={p.pageNumber} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-black text-emerald-800">{p.pageNumber} / 98</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.title}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{p.summary}</div>
                      </td>
                      <td className="p-3 text-[11px] font-bold text-slate-600 space-y-1">
                        {p.memoNumber && <div>مذكرة {p.memoNumber}</div>}
                        {p.mediaIds.length > 0 && <div className="text-cyan-700">{p.mediaIds.length} صور</div>}
                        {p.tableIds.length > 0 && <div className="text-amber-700">{p.tableIds.length} جداول إضافية</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* نافذة المعاينة المكبرة للصور والرسومات */}
        {previewLightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
            onClick={() => setPreviewLightbox(null)}
          >
            <div
              className="bg-white rounded-2xl p-5 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b pb-3 gap-2">
                <div>
                  <h3 className="font-black text-base md:text-lg text-slate-900">{previewLightbox.title}</h3>
                  {previewLightbox.subtitle && (
                    <p className="text-xs text-slate-600 mt-1">{previewLightbox.subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewLightbox(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {previewLightbox.imageUrl && (
                <div className="w-full flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <img
                    src={previewLightbox.imageUrl}
                    alt={previewLightbox.title}
                    className="max-h-[68vh] max-w-full object-contain rounded-lg"
                  />
                </div>
              )}
              {previewLightbox.svg && (
                <div
                  className="w-full flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: previewLightbox.svg }}
                />
              )}
            </div>
          </div>
        )}

        {/* نافذة استدعاء حزمة النشاط الكاملة */}
        {recalledBundle && (
          <div
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
            onClick={() => setRecalledBundle(null)}
          >
            <div
              className="bg-white rounded-2xl p-5 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b pb-3 gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800 mb-1">
                    <FolderOpen className="w-4 h-4" />
                    <span>حزمة الاستدعاء البيداغوجي الكاملة — مذكرة {recalledBundle.lesson.memoNumber}</span>
                  </div>
                  <h3 className="font-black text-lg text-slate-900">{recalledBundle.activity.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRecalledBundle(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 whitespace-pre-wrap">
                  <strong className="text-blue-950 block mb-1">التعليمات:</strong>
                  {recalledBundle.activity.instructions}
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 whitespace-pre-wrap">
                  <strong className="text-emerald-950 block mb-1">النتائج والاستنتاج:</strong>
                  {recalledBundle.activity.answersAndConclusions}
                </div>
              </div>

              {recalledBundle.experiments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-sm text-indigo-900">التجارب المرتبطة ({recalledBundle.experiments.length}):</h4>
                  {recalledBundle.experiments.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs space-y-1">
                      <div className="font-black text-indigo-950">{e.title}</div>
                      <div><strong>الأدوات:</strong> {e.tools.join('، ')}</div>
                      <div><strong>الملاحظة:</strong> {e.observation}</div>
                      <div><strong>الاستنتاج:</strong> {e.conclusion}</div>
                    </div>
                  ))}
                </div>
              )}

              {recalledBundle.media.length > 0 && (
                <div>
                  <h4 className="font-black text-sm text-cyan-900 mb-2">الوسائط الأصلية ({recalledBundle.media.length}):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {recalledBundle.media.map((m) => (
                      <div key={m.id} className="border border-slate-200 rounded-xl p-1.5 bg-slate-50 text-center">
                        <img src={m.imageUrl} alt={m.title} className="w-full h-24 object-contain rounded" />
                        <div className="text-[10.5px] font-bold text-slate-700 mt-1 line-clamp-2">{m.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recalledBundle.tables.map((t) => (
                <RenderHtmlTable key={t.id} tbl={t.table} accent="emerald" />
              ))}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t">
                {onOpenMemoUnit && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMemoUnit(recalledBundle.lesson);
                      setRecalledBundle(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
                  >
                    فتح المذكرة في المحرر
                  </button>
                )}
                {onRecallToLogbook && (
                  <button
                    type="button"
                    onClick={() => {
                      onRecallToLogbook(recalledBundle);
                      setRecalledBundle(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black cursor-pointer"
                  >
                    استدعاء للدفتر اليومي
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
