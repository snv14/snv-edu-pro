import React, { useMemo, useState } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Printer,
  ChevronDown,
  ChevronUp,
  Award,
  Compass,
  Calendar,
  Clock,
  Sparkles,
  Eye,
} from 'lucide-react';
import type { TeacherGuideSequence, TeacherGuideViewerProps } from '../types/teacherGuide';
import { normalizeSourceQuery } from '../services/sourceContent';

export const TeacherGuideViewer: React.FC<TeacherGuideViewerProps> = ({ lessons, config, sequences, assessment, extraTabs = [], onOpenMemoUnit }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'guide' | 'lessons' | 'pdf' | 'assessment' | `extra-${string}`>('guide');
  const [openSeqIds, setOpenSeqIds] = useState<Set<string>>(new Set(sequences[0] ? [sequences[0].id] : []));
  const [openLessonIds, setOpenLessonIds] = useState<Set<string>>(new Set());

  const yearLessons = useMemo(() => {
    return lessons.filter(l => l.level === config.level);
  }, [lessons, config.level]);

  const filteredSequences = useMemo(() => {
    const q = normalizeSourceQuery(query);
    if (!q) return sequences;
    return sequences.map(seq => {
      const matchSeq = normalizeSourceQuery(seq.title).includes(q) ||
        normalizeSourceQuery(seq.targetCompetency).includes(q) ||
        seq.priorKnowledge.some(p => normalizeSourceQuery(p).includes(q));
      
      const filteredRes = seq.resources.filter(r => 
        normalizeSourceQuery(r.title).includes(q) ||
        normalizeSourceQuery(r.pedagogicalGuidance).includes(q) ||
        r.coreConcepts.some(c => normalizeSourceQuery(c).includes(q))
      );

      if (matchSeq || filteredRes.length > 0) {
        return {
          ...seq,
          resources: filteredRes.length > 0 ? filteredRes : seq.resources
        };
      }
      return null;
    }).filter(Boolean) as TeacherGuideSequence[];
  }, [query, sequences]);

  const filteredLessons = useMemo(() => {
    const q = normalizeSourceQuery(query);
    if (!q) return yearLessons;
    return yearLessons.filter(l => {
      const hay = [
        l.memoNumber || '',
        l.midan || '',
        l.maqta || '',
        l.mawrid || '',
        l.ta3alom || '',
        l.marifa || '',
        l.manhaji || '',
        l.wasail || '',
        l.wadiya || '',
        l.moshkila || '',
        l.irsae || '',
        l.taqwim || '',
        ...l.anshita.map(a => `${a.title} ${a.asila} ${a.ajwiba}`)
      ].join(' ');
      return normalizeSourceQuery(hay).includes(q);
    });
  }, [yearLessons, query]);

  const toggleSequence = (id: string) => {
    setOpenSeqIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLesson = (id: string) => {
    setOpenLessonIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const pdfUrl = config.pdfUrl;

  return (
    <div dir="rtl" data-guide-level={config.level} className="h-full flex flex-col bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 shadow-md border-b-4 border-emerald-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-black tracking-wide">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </span>
              <span>•</span>
              <span>{config.authorityLabel || 'وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2.5 text-white">
              <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{config.title}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black">
                {config.badge}
              </span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {config.description}
            </p>
          </div>

          {/* Quick PDF Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح المستند الرسمي (PDF)</span>
            </a>

            <a
              href={pdfUrl}
              download={config.downloadFileName || `plans_annuels2023-sciences${config.level}.pdf`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition"
            >
              <Download className="w-4 h-4" />
              <span>تحميل</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label={config.navLabel} className="max-w-7xl mx-auto flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto print:hidden">
          <button
            type="button"
            aria-pressed={activeTab === 'guide'}
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition shrink-0 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>المقاطع والوحدات ({sequences.length} مقاطع)</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'lessons'}
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition shrink-0 whitespace-nowrap ${
              activeTab === 'lessons'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المذكرات النموذجية والأنشطة ({yearLessons.length} مذكرة)</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'pdf'}
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition shrink-0 whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>قارئ الـ PDF المدمج</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'assessment'}
            onClick={() => setActiveTab('assessment')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition shrink-0 whitespace-nowrap ${
              activeTab === 'assessment'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{config.assessmentTabLabel || 'الكفاءات والتقويم التكويني'}</span>
          </button>
          {extraTabs.map(tab => <button key={tab.id} type="button" aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition shrink-0 whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}>
            <BookOpen className="w-4 h-4" /><span>{tab.label}</span>
          </button>)}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {config.notice && <p className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs leading-6 text-amber-950">{config.notice}</p>}
        {/* Search Bar */}
        {activeTab !== 'pdf' && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label={config.searchLabel}
              placeholder={config.searchPlaceholder}
              className="flex-1 text-sm bg-transparent outline-none font-bold placeholder-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
              >
                مسح
              </button>
            )}
          </div>
        )}

        {/* TAB 1: OFFICIAL SEQUENCES GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {config.stats.map((stat, index) => <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${['bg-emerald-100 text-emerald-800', 'bg-teal-100 text-teal-800', 'bg-cyan-100 text-cyan-800', 'bg-violet-100 text-violet-800'][index % 4]}`}>{stat.value}</div>
                <div><div className="text-xs text-slate-500 font-bold">{stat.label}</div><div className="text-base font-black text-slate-900">{stat.detail}</div></div>
              </div>)}
            </div>

            {/* Sequence Cards */}
            <div className="space-y-4">
              {!filteredSequences.length && <p role="status">لا توجد مقاطع مطابقة للبحث.</p>}
              {filteredSequences.map(seq => {
                const isOpen = openSeqIds.has(seq.id);
                return (
                  <div
                    key={seq.id} data-guide-sequence={seq.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 transition shadow-sm overflow-hidden"
                  >
                    <div
                      role="button" tabIndex={0} aria-expanded={isOpen} aria-controls={`guide-${config.level}-${seq.id}`}
                      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleSequence(seq.id); } }}
                      onClick={() => toggleSequence(seq.id)}
                      className="p-4 md:p-5 flex items-start justify-between cursor-pointer bg-gradient-to-l from-slate-50 to-white"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-sm shadow">
                          {seq.number}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-base md:text-lg font-black text-slate-900">
                              {seq.title}
                            </h2>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Calendar className="w-3.5 h-3.5" />
                              {typeof seq.weeks === 'number' ? `${seq.weeks} أسابيع` : seq.weeks}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                              <Clock className="w-3.5 h-3.5" />
                              {seq.hours} ساعة
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            <strong className="text-slate-900">{config.targetLabel}:</strong> {seq.targetCompetency}
                          </p>
                        </div>
                      </div>

                      <span aria-hidden="true" className="p-1 rounded-lg text-slate-400">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </span>
                    </div>

                    {isOpen && (
                      <div id={`guide-${config.level}-${seq.id}`} className="p-4 md:p-6 border-t border-slate-200 space-y-4 bg-slate-50/50">
                        {seq.sourcePages && <div className="flex flex-wrap gap-2">{seq.sourcePages.map(page => <a key={page} className="text-xs text-emerald-800 underline" href={`${pdfUrl}#page=${page}`} target="_blank" rel="noreferrer">المصدر الرسمي — ص {page}</a>)}</div>}
                        {/* Prior Knowledge */}
                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                          <div className="font-black mb-1.5 flex items-center gap-1.5 text-amber-950">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>المكتسبات القبلية المجندة لبناء موارد المقطع:</span>
                          </div>
                          {!seq.priorKnowledge.length && <p>غير مفصلة في البيانات الحالية؛ راجع الدليل الأصلي.</p>}
                          <ul className="list-disc list-inside space-y-1 font-medium pr-1">
                            {seq.priorKnowledge.map((pk, idx) => (
                              <li key={idx}>{pk}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Resources Table/List */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-700 tracking-wide">
                            {config.resourcesLabel}
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {seq.resources.map(res => (
                              <div
                                key={res.num} data-guide-resource={res.num}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                  <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs flex items-center justify-center font-bold">
                                      {res.num}
                                    </span>
                                    <span>المورد {res.num}: {res.title}</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                    {res.weeks}
                                  </span>
                                </div>

                                <div>
                                  <div className="text-[11px] font-black text-slate-500 mb-1">{config.resourceConceptLabel || 'المفاهيم الأساسية'}:</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {res.coreConcepts.map((cc, i) => (
                                      <span
                                        key={i}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200"
                                      >
                                        {cc}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="text-xs bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-emerald-950 leading-relaxed font-medium">
                                  <strong className="font-black text-emerald-900">سيرورة الأنشطة والتوجيه المنهجي:</strong>{' '}
                                  {res.pedagogicalGuidance}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LESSON MEMOS EXPLORER */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            {config.lessonNotice && <p className="text-xs leading-6 text-slate-600">{config.lessonNotice}</p>}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600 font-bold">
                عدد المذكرات المطابقة: <span className="text-emerald-700 font-black">{filteredLessons.length}</span> من أصل {yearLessons.length}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (openLessonIds.size > 0) {
                    setOpenLessonIds(new Set());
                  } else {
                    setOpenLessonIds(new Set(filteredLessons.map(l => l.sourceLearningUnitId || l.memoNumber)));
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 transition"
              >
                {openLessonIds.size > 0 ? 'طي كل المذكرات' : 'توسيع كل المذكرات'}
              </button>
            </div>

            <div className="space-y-3">
              {!filteredLessons.length && <p role="status">لا توجد مذكرات مطابقة للبحث.</p>}
              {filteredLessons.map(lesson => {
                const id = lesson.sourceLearningUnitId || lesson.memoNumber;
                const isOpen = openLessonIds.has(id);

                return (
                  <div
                    key={id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-sm transition overflow-hidden"
                  >
                    <div role="button" tabIndex={0} aria-expanded={isOpen} aria-controls={`memo-${config.level}-${id}`}
                      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleLesson(id); } }}
                      onClick={() => toggleLesson(id)}
                      className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-xs">
                            مذكرة {lesson.memoNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {lesson.maqta}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            المورد: {lesson.mawrid}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 pt-1">
                          {lesson.ta3alom}
                        </h3>
                        {lesson.moshkila && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            <strong className="text-slate-700">المشكلة:</strong> {lesson.moshkila}
                          </p>
                        )}
                      </div>

                      <span aria-hidden="true" className="p-1 rounded-lg text-slate-400 shrink-0">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </span>
                    </div>

                    {isOpen && (
                      <div id={`memo-${config.level}-${id}`} className="p-4 md:p-5 border-t border-slate-200 bg-slate-50/60 space-y-4 text-xs">
                        {onOpenMemoUnit && <button type="button" onClick={() => onOpenMemoUnit(lesson)} className="px-3 py-2 rounded-lg bg-emerald-800 text-white font-bold">فتح المذكرة الكاملة</button>}
                        {/* Objectives Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {lesson.marifa && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-black text-emerald-800 block mb-1">المركبة المعرفية:</span>
                              <p className="text-slate-700 leading-relaxed font-medium">{lesson.marifa}</p>
                            </div>
                          )}
                          {lesson.manhaji && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-black text-teal-800 block mb-1">المركبة المنهجية:</span>
                              <p className="text-slate-700 leading-relaxed font-medium">{lesson.manhaji}</p>
                            </div>
                          )}
                        </div>

                        {/* Problematic & Hypothesis */}
                        {lesson.wadiya && (
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                            <div>
                              <span className="font-black text-slate-900 block mb-0.5">الوضعية الانطلاقية:</span>
                              <p className="text-slate-700 leading-relaxed">{lesson.wadiya}</p>
                            </div>
                            {lesson.moshkila && (
                              <div className="pt-2 border-t border-slate-100">
                                <span className="font-black text-rose-700 block mb-0.5">المشكلة العلمية:</span>
                                <p className="text-slate-800 font-bold">{lesson.moshkila}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Activities */}
                        {lesson.anshita && lesson.anshita.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-black text-slate-900 block">سيرورة النشاطات التعليمية التعلمية:</span>
                            <div className="space-y-2.5">
                              {lesson.anshita.map((act, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                                  <div className="flex items-center justify-between font-black text-slate-800">
                                    <span>النشاط {idx + 1}: {act.title}</span>
                                    {act.zaman && <span className="text-slate-400 font-bold">{act.zaman}</span>}
                                  </div>
                                  {act.asila && (
                                    <div className="text-slate-700">
                                      <strong className="text-slate-900">مهمة الأستاذ/السند:</strong> {act.asila}
                                    </div>
                                  )}
                                  {act.ajwiba && (
                                    <div className="text-emerald-900 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                                      <strong className="text-emerald-950">نشاط وإجابة المتعلم:</strong> {act.ajwiba}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Structuring / Conclusion */}
                        {lesson.irsae && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5">
                            <span className="font-black text-emerald-950 block mb-1">إرساء الموارد (النتيجة / الاستخلاص):</span>
                            <p className="text-emerald-900 leading-relaxed font-bold whitespace-pre-line">{lesson.irsae}</p>
                          </div>
                        )}

                        {/* Formative Assessment */}
                        {lesson.taqwim && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <span className="font-black text-blue-950 block mb-1">التقويم التكويني:</span>
                            <p className="text-blue-900 leading-relaxed font-medium">{lesson.taqwim}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EMBEDDED PDF VIEWER */}
        {activeTab === 'pdf' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-slate-900 text-sm">
                  {config.title} — {config.badge}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في علامة تبويب كاملة</span>
                </a>
                <a
                  href={pdfUrl}
                  download={config.downloadFileName || `plans_annuels2023-sciences${config.level}.pdf`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الملف</span>
                </a>
              </div>
            </div>

            <div className="w-full h-[750px] bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-lg">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1`}
                title={config.title}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        )}

        {/* TAB 4: PEDAGOGICAL ASSESSMENT & COMPETENCIES */}
        {activeTab === 'assessment' && (typeof assessment === 'function' ? assessment(query) : assessment)}
        {extraTabs.map(tab => activeTab === tab.id ? <React.Fragment key={tab.id}>{tab.render(query)}</React.Fragment> : null)}
      </div>
    </div>
  );
};
