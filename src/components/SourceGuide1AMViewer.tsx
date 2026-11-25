import React, { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import type { LessonMemo } from '../types';
import type { OfficialSourcePage } from '../data/official/types';
import type { TeacherGuideConfig } from '../types/teacherGuide';
import { getTeacherGuide1amLessons, getTeacherGuide1amSource } from '../data/teacherGuide1am';
import { OFFICIAL_1AM_GUIDE_SEQUENCES } from '../data/teacherGuide1amResources';
import { loadOfficialSources } from '../services/knowledgeOfficialSources';
import { TeacherGuideViewer } from './TeacherGuideViewer';

function Assessment1AM() {
  const source = useMemo(getTeacherGuide1amSource, []);
  const [pages, setPages] = useState<OfficialSourcePage[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let cancelled = false;
    loadOfficialSources([source.id]).then(docs => {
      if (cancelled) return;
      setPages(docs[0]?.pages.filter(page => [3, 7, 12, 16].includes(page.page)) || []);
      setState(docs.length ? 'ready' : 'error');
    }).catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [source.id]);
  return <div className="space-y-4">
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2"><Award className="w-5 h-5 text-emerald-600" />الإطار المرجعي للكفاءات والتقويم البيداغوجي — السنة الأولى متوسط</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2"><h3 className="font-black text-emerald-950 text-sm">الكفاءة الشاملة — ص 3</h3><p className="text-xs text-emerald-900 leading-relaxed">يحافظ على صحته وصحة غيره ويتدخل إيجابيا لحماية محيطه.</p></div>
        <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 space-y-2"><h3 className="font-black text-teal-950 text-sm">الكفاءات الختامية للميدانين — راجع ص 3</h3><p className="text-xs text-teal-900 leading-relaxed">توجيه عام: تجنيد الموارد لتفسير الاختلالات الوظيفية والمحافظة على صحة الإنسان، والتصرف بوعي للحفاظ على المحيط اعتماداً على مظاهر الحياة عند النبات الأخضر. النص الحرفي في الصفحة أدناه.</p></div>
      </div>
      <h3 className="font-black text-slate-900 text-sm">معايير التقويم — تسميات المصدر ص 3</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">{['الوجاهة', 'الاستعمال السليم لأدوات المادة', 'الانسجام', 'الإتقان'].map(label => <div key={label} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-black text-xs">{label}</div>)}</div>
      <p className="text-xs leading-6 text-slate-600">تشخيص المكتسبات، بناء الموارد وإرساؤها، إدماجها، حل الوضعية الانطلاقية، ثم التقويم والمعالجة: قراءة إجرائية للمخطط. النص الرسمي المفهرس أدناه في ص 3 و7 و12 و16؛ وص 7 تتضمن أيضاً نهاية مقطع التغذية عند النبات.</p>
    </div>
    {state === 'loading' && <p role="status">جارٍ تحميل النص الرسمي للكفاءات والتقويم…</p>}
    {state === 'error' && <p role="alert">تعذر تحميل النص؛ يمكنك فتح ملف PDF الأصلي.</p>}
    {pages.map(page => <article key={page.page} className="bg-white p-4 rounded-xl border border-slate-200"><h3 className="font-black text-sm">نص رسمي — ص {page.page}</h3><p className="whitespace-pre-wrap text-sm leading-8 mt-3">{page.text}</p><a href={`${source.url}#page=${page.page}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-800 underline">فتح الصفحة في المصدر</a></article>)}
  </div>;
}

export function SourceGuide1AMViewer({ lessons, onOpenMemoUnit }: { lessons: LessonMemo[]; onOpenMemoUnit?: (lesson: LessonMemo) => void }) {
  const source = getTeacherGuide1amSource();
  const config: TeacherGuideConfig = {
    level: '1am', title: 'المخططات السنوية ودليل بناء التعلمات — السنة الأولى متوسط',
    description: 'السند المرجعي لتخطيط وتدرج التعلمات في ميداني الإنسان والصحة والإنسان والمحيط، مع قراءة منظمة للموارد والمفاهيم وسيرورة الأنشطة.',
    badge: `وثيقة 2022/2023 الرسمية (${source.pages} صفحة)`, pdfUrl: source.url,
    searchLabel: 'البحث في دليل السنة الأولى', navLabel: 'أقسام دليل الأستاذ للسنة الأولى',
    searchPlaceholder: 'ابحث في دليل ومذكرات 1AM: بالموارد، المفاهيم، التغذية، التنفس، الإطراح، التكاثر والخلية…',
    targetLabel: 'الكفاءة المستهدفة — ملخص', resourcesLabel: 'الموارد التعلمية والتوجيهات البيداغوجية — قراءة منظمة:',
    notice: 'هذه قراءة بيداغوجية منظّمة للمخطط الوزاري، وليست كتاب دليل مستقل أو نقلاً حرفياً له. مذكرات قاعدة المنصة ليست نص الدليل. الملخصات منفصلة عن النص الرسمي؛ راجع صفحات المصدر المحددة. الحجم الزمني للمقاطع كما في المصدر، ولا تُفترض مدد مستقلة للموارد.',
    lessonNotice: 'مذكرات القاعدة الحالية منفصلة عن ملخصات الدليل. الأرشيف يتضمن «مظاهر النمو والتطور عند النبات»، ولا يُعد مقطعاً تاسعاً ضمن المقاطع الثمانية لمخطط 2022/2023.',
    stats: [
      { value: OFFICIAL_1AM_GUIDE_SEQUENCES.length, label: 'المقاطع البيداغوجية', detail: 'ميدانا الإنسان والصحة والإنسان والمحيط' },
      { value: OFFICIAL_1AM_GUIDE_SEQUENCES.reduce((sum, sequence) => sum + sequence.resources.length, 0), label: 'إجمالي الموارد التعلمية', detail: 'مفاهيم وأنشطة متسلسلة' },
      { value: OFFICIAL_1AM_GUIDE_SEQUENCES.reduce((sum, sequence) => sum + sequence.hours, 0), label: 'الحجم الساعي الإجمالي', detail: '24 أسبوعاً للمقاطع دون الإدماج والاختبارات' },
      { value: getTeacherGuide1amLessons(lessons).length, label: 'المذكرات المرتبطة', detail: 'من قاعدة المنصة الحالية' },
    ],
  };
  return <TeacherGuideViewer lessons={lessons} config={config} sequences={OFFICIAL_1AM_GUIDE_SEQUENCES} assessment={<Assessment1AM />} onOpenMemoUnit={onOpenMemoUnit} />;
}
