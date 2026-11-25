import React from 'react';
import { Award } from 'lucide-react';
import type { LessonMemo } from '../types';
import { OFFICIAL_2AM_SEQUENCES } from '../data/teacherGuide2am';
import { TeacherGuideViewer } from './TeacherGuideViewer';
import type { TeacherGuideConfig } from '../types/teacherGuide';

const CONFIG: TeacherGuideConfig = {
  level: '2am', title: 'المخططات السنوية ودليل بناء التعلمات — السنة الثانية متوسط',
  description: 'السند المرجعي الشامل لتخطيط وتدرج التعلمات في مادة علوم الطبيعة والحياة لميدان الإنسان والمحيط (توازن الأنظمة البيئية وتنوع الكائنات الحية).',
  badge: 'وثيقة 2022/2023 الرسمية (13 صفحة)',
  pdfUrl: '/assets/aistudio/plans_annuels2023-sciences2am_97a62a5b.pdf',
  searchLabel: 'البحث في دليل السنة الثانية', navLabel: 'أقسام دليل الأستاذ للسنة الثانية',
  searchPlaceholder: 'ابحث في دليل ومذكرات 2AM: بالموارد، المفاهيم، التحورات، السلاسل الغذائية، المستحاثات...',
  targetLabel: 'الكفاءة المستهدفة', resourcesLabel: 'الموارد التعلمية والتوجيهات البيداغوجية الرسمية:',
  stats: [
    { value: 5, label: 'المقاطع البيداغوجية', detail: 'ميدان الإنسان والمحيط' },
    { value: 16, label: 'إجمالي الموارد التعلمية', detail: 'مفاهيم وأنشطة متسلسلة' },
    { value: 48, label: 'الحجم الساعي الإجمالي', detail: '24 أسبوعاً دراسياً' },
    { value: '100%', label: 'التطابق الوزاري الرسمي', detail: 'مخططات سبتمبر 2022' },
  ],
};

const Assessment2AM = () => (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>الإطار المرجعي للكفاءات والتقويم البيداغوجي لمرحلة التعليم المتوسط — 2AM</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-black text-emerald-950 text-sm">الكفاءة الشاملة للطور الأول (1AM + 2AM)</h3>
                  <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                    يحل مشكلات متعلقة بوظائف الكائنات الحية وتفاعلها الإيجابي مع محيطها، انطلاقاً من ملاحظات ووثائق علمية، ويقترح حلولاً ملموسة للحفاظ على الصحة والبيئة.
                  </p>
                </div>

                <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-black text-teal-950 text-sm">الكفاءة الختامية لميدان الإنسان والمحيط (2AM)</h3>
                  <p className="text-xs text-teal-900 leading-relaxed font-medium">
                    يقترح سلوكات إيجابية للمحافظة على التنوع البيولوجي وتوازن الأنظمة البيئية اعتماداً على معارفه حول تنظيم الأوساط وتكيف وتكاثر الكائنات الحية وتاريخ الأرض الجيولوجي.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-black text-slate-900 text-sm">معايير ومؤشرات التقويم التكويني المعتمدة:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-black text-slate-900 text-xs">مع 1: الوجاهة (الملائمة)</div>
                    <p className="text-[11px] text-slate-600">فهم الوضعية بدقة، تحديد المشكل العلمي، واستعمال السندات المقترحة بشكل مناسب.</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-black text-slate-900 text-xs">مع 2: الاستعمال السليم لأدوات المادة</div>
                    <p className="text-[11px] text-slate-600">توظيف المصطلحات العلمية الدقيقة، الملاحظة المجهرية، رسم المخططات وقراءة الجداول.</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-black text-slate-900 text-xs">مع 3: الانسجام والمنطق</div>
                    <p className="text-[11px] text-slate-600">تسلسل الأفكار والتعليل العلمي المنطقي وربط الأسباب بالنتائج بوضوح.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
);

export const SourceGuide2AMViewer = ({ lessons }: { lessons: LessonMemo[] }) => (
  <TeacherGuideViewer lessons={lessons} config={CONFIG} sequences={OFFICIAL_2AM_SEQUENCES} assessment={<Assessment2AM />} />
);
