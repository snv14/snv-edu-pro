import React from 'react';
import { BookMarked, CheckSquare } from 'lucide-react';
import type { LessonMemo } from '../types';
import type { TeacherGuideConfig, TeacherGuideExtraTab } from '../types/teacherGuide';
import { TeacherGuideViewer } from './TeacherGuideViewer';
import { GUIDE_3AM_SEQUENCES, OFFICIAL_SOLUTIONS_3AM, PEDAGOGICAL_CONCEPTS_3AM, filterGuide3amSolutions, filterGuide3amConcepts } from '../data/teacherGuide3am';

const CONFIG: TeacherGuideConfig = {
  level: '3am',
  title: 'دليل استعمال الكتاب المدرسي — السنة الثالثة متوسط',
  description: 'علوم الطبيعة والحياة: الديناميكية الداخلية والخارجية للكرة الأرضية، الموارد الطبيعية الباطنية، والتربة.',
  badge: 'الدليل الأصلي — 96 صفحة',
  pdfUrl: '/assets/aistudio/siences3am_gen2-guide_book_2__12109d38.pdf',
  downloadFileName: 'sciences3am-guide.pdf',
  authorityLabel: 'وزارة التربية الوطنية — دار القصبة للنشر — إشراف أ.د. فريدة خمار وتأليف مفتشي وأساتذة التعليم المتوسط',
  searchLabel: 'البحث في دليل السنة الثالثة', navLabel: 'أقسام دليل الأستاذ للسنة الثالثة',
  searchPlaceholder: 'ابحث في المقاطع والأنشطة والمذكرات والتصحيحات والمفاهيم البيداغوجية...',
  targetLabel: 'الكفاءة المستهدفة', resourcesLabel: 'الوحدات التعلمية والأنشطة والتوجيهات البيداغوجية:',
  resourceConceptLabel: 'الأنشطة التعلمية', assessmentTabLabel: 'تصحيحات التمارين والتقويم',
  notice: 'قراءة منظمة للبيانات المتاحة وليست نقلاً حرفياً كاملاً للدليل. احتُفظ بالمدد والتوزيع كما وردا في البيانات السابقة دون إعادة تقدير؛ الملف الأصلي مرجع التحقق.',
  stats: [
    { value: 4, label: 'المقاطع البيداغوجية', detail: 'ميدان الإنسان والمحيط' },
    { value: 16, label: 'الوحدات التعلمية', detail: '38 نشاطاً في القراءة المنظمة' },
    { value: 64, label: 'الحجم الساعي الإجمالي', detail: 'حسب مدد المقاطع في البيانات المتاحة' },
    { value: OFFICIAL_SOLUTIONS_3AM.length, label: 'تصحيحات التمارين', detail: `${PEDAGOGICAL_CONCEPTS_3AM.length} مفاهيم بيداغوجية متاحة` },
  ],
};

function Solutions3AM({ query }: { query: string }) {
  const filteredSolutions = filterGuide3amSolutions(query);
  return (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <span>تصحيحات نموذجية لأدوات قياس الموارد (تمارين الكتاب المدرسي) وشبكات تصحيح الكفاءات</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                تصحيحات متاحة في القراءة المنظمة؛ راجع المحور التاسع من الدليل الأصلي (الصفحات 72 إلى 89) للتحقق من الصياغة والسياق الكامل.
              </p>
            </div>

            <div className="space-y-4">
              {!filteredSolutions.length && <p role="status" className="text-sm text-slate-500">لا توجد تصحيحات تطابق البحث.</p>}
              {filteredSolutions.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {item.unitTitle}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {item.exerciseTitle}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="font-black text-slate-900 block mb-1">السؤال والتعليمات:</span>
                    <p className="text-slate-700 font-bold leading-relaxed">{item.question}</p>
                  </div>

                  <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200 text-xs">
                    <span className="font-black text-emerald-950 block mb-1">التصحيح في القراءة المنظمة:</span>
                    <p className="text-emerald-900 leading-relaxed font-bold whitespace-pre-line">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
  );
}

function Concepts3AM({ query }: { query: string }) {
  const filteredConcepts = filterGuide3amConcepts(query);
  return (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                <BookMarked className="w-5 h-5 text-emerald-600" />
                <span>معجم المفاهيم البيداغوجية الأساسية — دليل الأستاذ (الصفحات 90 إلى 95)</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                المفاهيم الثمانية المتاحة في القراءة المنظمة مع تطبيقاتها الصفية؛ راجع الدليل الأصلي للصياغة والسياق الكامل.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!filteredConcepts.length && <p role="status" className="text-sm text-slate-500">لا توجد مفاهيم تطابق البحث.</p>}
              {filteredConcepts.map((c, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-slate-900 text-sm">{c.term}</span>
                    <span className="text-xs font-mono font-bold text-slate-400">{c.french}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {c.definition}
                  </p>
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-950">
                    <strong className="font-black text-emerald-900 block mb-0.5">التطبيق الميداني في القسم:</strong>
                    {c.classroomApplication}
                  </div>
                </div>
              ))}
            </div>
          </div>
  );
}

const EXTRA_TABS: TeacherGuideExtraTab[] = [
  { id: 'extra-concepts', label: 'معجم المفاهيم البيداغوجية (8)', render: query => <Concepts3AM query={query} /> },
];

export const SourceGuide3AMViewer = ({ lessons }: { lessons: LessonMemo[] }) => (
  <TeacherGuideViewer lessons={lessons} config={CONFIG} sequences={GUIDE_3AM_SEQUENCES}
    assessment={query => <Solutions3AM query={query} />} extraTabs={EXTRA_TABS} />
);
