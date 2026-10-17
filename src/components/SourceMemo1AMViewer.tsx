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
  Download
} from 'lucide-react';
import { LessonMemo, DB_Table } from '../types';
import { SOURCE_MEMO_1AM } from '../data/sourceMemo1am';
import sourceText from '../data/sourceMemo1amFullText.md?raw';

interface Props {
  lessons: LessonMemo[];
}

export const SourceMemo1AMViewer: React.FC<Props> = ({ lessons }) => {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [openAll, setOpenAll] = useState(false);
  const [showRawSource, setShowRawSource] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [previewSvg, setPreviewSvg] = useState<{ title: string; svg: string } | null>(null);

  const sourcePages = useMemo(() => {
    const chunks = sourceText.split(/(?=<PARSED TEXT FOR PAGE: \d+ \/ 98>)/g).filter(Boolean);
    return chunks.map((text, index) => ({
      page: Number(text.match(/<PARSED TEXT FOR PAGE: (\d+)/)?.[1] || index + 1),
      text,
    }));
  }, []);

  const visibleSourceText = useMemo(() => {
    if (selectedPage == null) return sourceText;
    return sourcePages.find(p => p.page === selectedPage)?.text || sourceText;
  }, [selectedPage, sourcePages]);

  // البحث المعمق الشامل: الميدان، المقطع، المورد، تعلم المورد، عنوان النشاط، نص النشاط، التقويم، الجداول، المصطلحات، الوضعيات، إلخ.
  const records = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = lessons.filter(l => l.level === '1am');
    if (!q) return source;

    return source.filter(l => {
      // جمع كافة نصوص الجداول
      const allTables: DB_Table[] = [
        ...(l.wadiyaTables || []),
        ...(l.irsaeTables || []),
        ...(l.taqwimTables || []),
        ...l.anshita.flatMap(a => a.tables || [])
      ];

      const tablesText = allTables.map(t => [
        t.table_title || '',
        ...t.headers,
        ...t.rows.flat()
      ].join(' ')).join(' ');

      const activitiesText = l.anshita.map(a => [
        a.title || '',
        a.asila || '',
        a.ajwiba || '',
        a.mola7adha || ''
      ].join(' ')).join(' ');

      const diagramsText = (l.diagrams || []).map(d => d.title || '').join(' ');

      const fullHaystack = [
        l.memoNumber || '',
        l.midan || '',
        l.maqta || '',
        l.mawrid || '',
        l.ta3alom || '',
        l.markaba || '',
        l.marifa || '',
        l.manhaji || '',
        l.ma3ayirTaqwim || '',
        l.mostalahat || '',
        l.wasail || '',
        l.wadiya || '',
        l.moshkila || '',
        l.faradiyat || '',
        l.irsae || '',
        l.taqwim || '',
        activitiesText,
        tablesText,
        diagramsText
      ].join('\n').toLowerCase();

      return fullHaystack.includes(q);
    });
  }, [lessons, query]);

  const rawMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return sourceText.split(/\n{2,}/).filter(p => p.toLowerCase().includes(q)).slice(0, 80);
  }, [query]);

  const stats = useMemo(() => {
    const activities = records.flatMap(l => l.anshita);
    const tables = [
      ...records.flatMap(l => l.wadiyaTables || []),
      ...records.flatMap(l => l.irsaeTables || []),
      ...records.flatMap(l => l.taqwimTables || []),
      ...activities.flatMap(a => a.tables || [])
    ];
    const diagrams = records.flatMap(l => l.diagrams || []);
    return {
      lessons: records.length,
      activities: activities.length,
      tables: tables.length,
      diagrams: diagrams.length
    };
  }, [records]);

  const toggleOpen = (id: string) => {
    if (openAll) {
      setOpenAll(false);
      const newSet = new Set(records.map((_, i) => records[i].sourceLearningUnitId || `1am-${i}`));
      newSet.delete(id);
      setOpenIds(newSet);
      return;
    }
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setOpenAll(true);
    const all = new Set(records.map((r, i) => r.sourceLearningUnitId || `1am-${i}`));
    setOpenIds(all);
  };

  const handleCollapseAll = () => {
    setOpenAll(false);
    setOpenIds(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  // تصدير المحتوى كملف HTML مستقل كامل
  const handleExportHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مذكرات السنة الأولى متوسط كاملة — المصدر البيداغوجي الأصلي</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 20px; color: #1e293b; background: #fff; }
    h1, h2, h3, h4 { color: #0f172a; margin-top: 1.5em; }
    .memo-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin-bottom: 24px; page-break-inside: avoid; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #e2e8f0; margin-left: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid #94a3b8; padding: 8px; text-align: right; }
    th { background: #f1f5f9; }
    .activity-box { background: #f8fafc; border-right: 4px solid #0284c7; padding: 12px; margin: 10px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>مذكرات السنة الأولى متوسط — المصدر الكامل الرسمي</h1>
  <p>المصدر: مذكرات السنة الأولى متوسط كاملة.pdf | إجمالي المذكرات: ${records.length}</p>
  <hr/>
  ${records.map(l => `
    <div class="memo-card">
      <div style="margin-bottom: 8px;">
        <span class="badge" style="background:#dbeafe; color:#1e40af;">${l.midan}</span>
        <span class="badge" style="background:#fef3c7; color:#92400e;">${l.maqta}</span>
        <span class="badge" style="background:#dcfce7; color:#166534;">المذكرة رقم ${l.memoNumber}</span>
      </div>
      <h2>${l.mawrid}</h2>
      <h3>${l.ta3alom}</h3>
      <p><b>مركبة الكفاءة:</b> ${l.markaba || '—'}</p>
      <p><b>المورد المعرفي:</b> ${l.marifa || '—'}</p>
      <p><b>المورد المنهجي:</b> ${l.manhaji || '—'}</p>
      ${l.ma3ayirTaqwim ? `<p><b>المورد القيمي:</b> ${l.ma3ayirTaqwim}</p>` : ''}
      <p><b>المصطلحات:</b> ${l.mostalahat || '—'}</p>
      <p><b>الوسائل والسندات:</b> ${l.wasail || '—'}</p>
      <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:6px; margin:12px 0;">
        <p><b>وضعية الانطلاق:</b> ${l.wadiya || '—'}</p>
        <p><b>المشكلة:</b> ${l.moshkila || '—'}</p>
        ${l.faradiyat ? `<p><b>الفرضيات:</b> ${l.faradiyat}</p>` : ''}
      </div>
      <h4>مرحلة البحث والتقصي (الأنشطة)</h4>
      ${l.anshita.map((a, i) => `
        <div class="activity-box">
          <h4>${a.title}</h4>
          ${a.asila ? `<p><b>عمل الأستاذ:</b><br/>${a.asila.replace(/\n/g, '<br/>')}</p>` : ''}
          ${a.ajwiba ? `<p><b>عمل المتعلم:</b><br/>${a.ajwiba.replace(/\n/g, '<br/>')}</p>` : ''}
          ${(a.tables || []).map(t => `
            <table>
              ${t.table_title ? `<caption><b>${t.table_title}</b></caption>` : ''}
              <thead><tr>${t.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          `).join('')}
        </div>
      `).join('')}
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:6px; margin:12px 0;">
        <h4>إرساء المورد</h4>
        <p>${(l.irsae || '—').replace(/\n/g, '<br/>')}</p>
      </div>
      ${l.taqwim ? `
        <div style="background:#fef2f2; border:1px solid #fecaca; padding:12px; border-radius:6px; margin:12px 0;">
          <h4>تقويم المورد</h4>
          <p>${l.taqwim.replace(/\n/g, '<br/>')}</p>
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `مذكرات_السنة_الأولى_متوسط_المصدر_الكامل.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section dir="rtl" className="w-full min-h-full bg-slate-50 p-3 md:p-6 overflow-y-auto print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* شريط التحكم العلوي والمعلومات */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 md:p-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-2xl font-black text-slate-900">
                    المحتوى الكامل للمصدر — السنة الأولى متوسط (1AM)
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                    قاعدة مدمجة 100%
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  المصدر الأصلي: <span className="font-bold text-slate-700">{SOURCE_MEMO_1AM.fileName}</span> ·{' '}
                  <span className="font-bold text-slate-700">{SOURCE_MEMO_1AM.pages} صفحة</span> ·{' '}
                  تصفح شامل لجميع المذكرات والأنشطة والجداول والرسومات الرسمية.
                </p>
              </div>
            </div>

            {/* إحصائيات القاعدة */}
            <div className="flex flex-wrap gap-2 text-xs font-black">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                المذكرات: <strong className="text-emerald-700 font-black">{stats.lessons}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                الأنشطة: <strong className="text-emerald-700 font-black">{stats.activities}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                الجداول الحقيقية: <strong className="text-amber-700 font-black">{stats.tables}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                الرسومات التخطيطية: <strong className="text-blue-700 font-black">{stats.diagrams}</strong>
              </span>
            </div>
          </div>

          {/* محرك البحث المتقدم الشامل */}
          <div className="relative mt-4">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-emerald-600" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="البحث الشامل في 1AM: الميدان، المقطع، المورد، تعلم المورد، نص النشاط، الفرضيات، الجداول، المصطلحات، التقويم..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 text-sm outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-3 top-2.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-lg"
              >
                مسح البحث
              </button>
            )}
          </div>

          {/* أزرار التحكم بالواجهة والتصدير */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>عرض الكل ممتداً (بدون فتح كل عنصر)</span>
              </button>

              <button
                type="button"
                onClick={handleCollapseAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>طي الكل</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRawSource(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showRawSource ? 'إخفاء النص الخام المستخرج' : 'النص المستخرج من الـ PDF'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة المعاينة الكاملة</span>
              </button>

              <button
                type="button"
                onClick={handleExportHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير HTML شامل</span>
              </button>
            </div>
          </div>
        </div>

        {/* عرض النص الخام إذا تم تفعيله */}
        {showRawSource && (
          <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-sm p-4 print:hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <div className="font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>النص الأصلي المستخرج من ملف «مذكرات السنة الأولى متوسط كاملة.pdf»</span>
              </div>
              <select
                value={selectedPage ?? ''}
                onChange={e => setSelectedPage(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
              >
                <option value="">تصفح كل الصفحات (98 صفحة)</option>
                {sourcePages.map(p => (
                  <option key={p.page} value={p.page}>
                    الصفحة {p.page}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="max-h-[60vh] overflow-auto rounded-xl bg-slate-950 text-slate-100 p-4 text-xs leading-6 whitespace-pre-wrap font-mono select-text"
              dir="rtl"
            >
              {query && rawMatches.length ? rawMatches.join('\n\n────────────────────────\n\n') : visibleSourceText}
            </div>
          </div>
        )}

        {/* نافذة معاينة الرسم البياني المنبثقة إذا تم النقر عليه */}
        {previewSvg && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
            onClick={() => setPreviewSvg(null)}
          >
            <div
              className="bg-white rounded-2xl p-5 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-lg text-slate-900">{previewSvg.title}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewSvg(null)}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
              <div
                className="w-full flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200"
                dangerouslySetInnerHTML={{ __html: previewSvg.svg }}
              />
            </div>
          </div>
        )}

        {/* عرض المذكرات المنسقة والمنظمة */}
        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              لا توجد مذكرات مطابقة لبحثك: <strong className="text-slate-900">"{query}"</strong>
            </div>
          ) : (
            records.map((lesson, index) => {
              const id = lesson.sourceLearningUnitId || `1am-${index}`;
              const isOpen = openAll || openIds.has(id);

              const allTables: DB_Table[] = [
                ...(lesson.wadiyaTables || []),
                ...(lesson.irsaeTables || []),
                ...(lesson.taqwimTables || []),
                ...lesson.anshita.flatMap(a => a.tables || [])
              ];

              return (
                <article
                  key={id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow transition print:border-none print:shadow-none print:break-inside-avoid print:mb-8"
                >
                  {/* رأس بطاقة المذكرة */}
                  <div
                    onClick={() => toggleOpen(id)}
                    className="w-full text-right p-4 cursor-pointer hover:bg-slate-50/80 transition flex items-start gap-3 select-none"
                  >
                    <div className="mt-1 p-1 rounded-lg bg-slate-100 text-slate-500 print:hidden">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900">
                          المذكرة #{lesson.memoNumber || String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800">
                          {lesson.midan || 'الإنسان والصحة'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900">
                          {lesson.maqta}
                        </span>
                        {allTables.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 flex items-center gap-1">
                            <Table2 className="w-3 h-3" /> {allTables.length} جداول
                          </span>
                        )}
                        {(lesson.diagrams?.length || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> رسومات
                          </span>
                        )}
                      </div>

                      <h2 className="text-base md:text-lg font-black text-slate-900">
                        {lesson.mawrid}
                      </h2>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">
                        {lesson.ta3alom}
                      </p>
                    </div>
                  </div>

                  {/* المحتوى التفصيلي الكامل عند الفتح */}
                  {(isOpen || true) && (
                    <div className={`${isOpen ? 'block' : 'hidden print:block'} border-t border-slate-100 bg-slate-50/40 p-4 md:p-6 space-y-6 text-sm leading-relaxed`}>
                      {/* جدول بطاقة المعلومات البيداغوجية الرسمية */}
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
                          <span className="font-bold text-slate-500 text-xs block">المصطلحات العلمية:</span>
                          <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.mostalahat || '—'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 text-xs block">الوسائل والسندات:</span>
                          <p className="font-semibold text-slate-800 text-xs md:text-sm mt-0.5">{lesson.wasail || '—'}</p>
                        </div>
                      </div>

                      {/* مرحلة الانطلاق والوضعية والمشكلة */}
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-1.5 font-black text-amber-900 text-sm">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span>مرحلة الانطلاق (الوضعية التعلمية والمشكلة)</span>
                        </div>
                        {lesson.wadiya && (
                          <div>
                            <strong className="text-amber-950 text-xs">وضعية التعلم: </strong>
                            <span className="text-slate-800 text-xs md:text-sm">{lesson.wadiya}</span>
                          </div>
                        )}
                        {lesson.moshkila && (
                          <div>
                            <strong className="text-amber-950 text-xs">المشكلة المطروحة: </strong>
                            <span className="font-bold text-amber-800 text-xs md:text-sm">{lesson.moshkila}</span>
                          </div>
                        )}
                        {lesson.faradiyat && (
                          <div>
                            <strong className="text-amber-950 text-xs">الفرضيات: </strong>
                            <span className="text-slate-700 text-xs md:text-sm">{lesson.faradiyat}</span>
                          </div>
                        )}
                        {/* جداول وضعية الانطلاق إن وجدت */}
                        {(lesson.wadiyaTables || []).map((t, idx) => (
                          <div key={idx} className="mt-3 overflow-x-auto bg-white rounded-xl border border-amber-200 shadow-sm">
                            {t.table_title && (
                              <div className="bg-amber-100/70 px-3 py-1.5 text-xs font-black text-amber-900 border-b border-amber-200">
                                {t.table_title}
                              </div>
                            )}
                            <table className="w-full text-xs text-right border-collapse">
                              <thead>
                                <tr className="bg-amber-50/80">
                                  {t.headers.map((h, hi) => (
                                    <th key={hi} className="border border-amber-200 p-2 font-bold text-amber-950">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {t.rows.map((row, ri) => (
                                  <tr key={ri} className="hover:bg-amber-50/30">
                                    {row.map((cell, ci) => (
                                      <td key={ci} className="border border-amber-200 p-2 align-top">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>

                      {/* مرحلة البحث والتقصي — الأنشطة التعليمية التعلمية */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span>مرحلة البحث والتقصي — الأنشطة ({lesson.anshita.length})</span>
                        </div>

                        <div className="space-y-4">
                          {lesson.anshita.map((act, actIdx) => (
                            <div
                              key={act.sourceActivityId || actIdx}
                              className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs"
                            >
                              <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-black text-sm md:text-base text-emerald-800">
                                  {act.title}
                                </h3>
                                {act.zaman && (
                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                                    {act.zaman}
                                  </span>
                                )}
                              </div>

                              {act.asila && (
                                <div className="bg-blue-50/60 p-3 rounded-lg border-r-4 border-blue-500">
                                  <span className="font-black text-blue-900 text-xs block mb-1">عمل الأستاذ (التوجيهات والتعليمات):</span>
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

                              {/* جداول النشاط */}
                              {(act.tables || []).length > 0 && (
                                <div className="space-y-3 pt-2">
                                  {act.tables!.map((tbl, tblIdx) => (
                                    <div key={tblIdx} className="overflow-x-auto bg-slate-50/50 rounded-xl border border-slate-200 shadow-xs">
                                      {tbl.table_title && (
                                        <div className="bg-emerald-50/80 px-3 py-1.5 text-xs font-black text-emerald-900 border-b border-emerald-200">
                                          {tbl.table_title}
                                        </div>
                                      )}
                                      <table className="w-full text-xs text-right border-collapse">
                                        <thead>
                                          <tr className="bg-slate-100">
                                            {tbl.headers.map((h, hi) => (
                                              <th key={hi} className="border border-slate-300 p-2 font-bold text-slate-900">
                                                {h}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {tbl.rows.map((row, ri) => (
                                            <tr key={ri} className="hover:bg-slate-50">
                                              {row.map((cell, ci) => (
                                                <td key={ci} className="border border-slate-300 p-2 align-top text-slate-800 whitespace-pre-wrap">
                                                  {cell}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* رسومات النشاط وسنداته */}
                              {(act.diagrams || []).length > 0 && (
                                <div className="space-y-2 pt-2">
                                  {act.diagrams!.map((diag, diagIdx) => (
                                    <div
                                      key={diagIdx}
                                      className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-sky-600" />
                                        <span className="text-xs font-bold text-sky-900">{diag.diagram_title}</span>
                                      </div>
                                      {diag.diagram_svg && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewSvg({ title: diag.diagram_title, svg: diag.diagram_svg! })}
                                          className="text-xs px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 transition"
                                        >
                                          معاينة الرسم التخطيطي
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* مرحلة إرساء المورد */}
                      {lesson.irsae && (
                        <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-1.5 font-black text-emerald-900 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>إرساء المورد (الحصيلة المعرفية)</span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                            {lesson.irsae}
                          </p>

                          {/* جداول إرساء المورد إن وجدت */}
                          {(lesson.irsaeTables || []).map((t, idx) => (
                            <div key={idx} className="mt-3 overflow-x-auto bg-white rounded-xl border border-emerald-200 shadow-sm">
                              {t.table_title && (
                                <div className="bg-emerald-100/70 px-3 py-1.5 text-xs font-black text-emerald-900 border-b border-emerald-200">
                                  {t.table_title}
                                </div>
                              )}
                              <table className="w-full text-xs text-right border-collapse">
                                <thead>
                                  <tr className="bg-emerald-50">
                                    {t.headers.map((h, hi) => (
                                      <th key={hi} className="border border-emerald-200 p-2 font-bold text-emerald-950">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {t.rows.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-emerald-50/40">
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="border border-emerald-200 p-2 align-top">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* مرحلة تقويم المورد */}
                      {(lesson.taqwim || (lesson.taqwimTables && lesson.taqwimTables.length > 0)) && (
                        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-1.5 font-black text-rose-900 text-sm">
                            <HelpCircle className="w-4 h-4 text-rose-600" />
                            <span>تقويم المورد (التطبيق والتمارين)</span>
                          </div>
                          {lesson.taqwim && (
                            <p className="whitespace-pre-wrap text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                              {lesson.taqwim}
                            </p>
                          )}

                          {/* جداول تقويم المورد */}
                          {(lesson.taqwimTables || []).map((t, idx) => (
                            <div key={idx} className="mt-3 overflow-x-auto bg-white rounded-xl border border-rose-200 shadow-sm">
                              {t.table_title && (
                                <div className="bg-rose-100/70 px-3 py-1.5 text-xs font-black text-rose-900 border-b border-rose-200">
                                  {t.table_title}
                                </div>
                              )}
                              <table className="w-full text-xs text-right border-collapse">
                                <thead>
                                  <tr className="bg-rose-50">
                                    {t.headers.map((h, hi) => (
                                      <th key={hi} className="border border-rose-200 p-2 font-bold text-rose-950">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {t.rows.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-rose-50/40">
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="border border-rose-200 p-2 align-top">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* الرسومات التخطيطية الكلية للمذكرة */}
                      {(lesson.diagrams || []).length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 font-black text-slate-800 text-xs md:text-sm">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            <span>الرسومات والسندات العلمية المرفقة بالمذكرة ({lesson.diagrams!.length})</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lesson.diagrams!.map((d, di) => (
                              <div
                                key={di}
                                className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 hover:bg-white transition flex flex-col justify-between gap-2"
                              >
                                <div className="font-bold text-xs text-slate-800">{d.title}</div>
                                {d.svg && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewSvg({ title: d.title, svg: d.svg! })}
                                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>عرض الرسم التخطيطي التفاعلي</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
