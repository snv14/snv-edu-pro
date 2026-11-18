import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  Database,
  Dna,
  FileText,
  FlaskConical,
  Globe2,
  GraduationCap,
  HelpCircle,
  Info,
  Mail,
  MessagesSquare,
  Microscope,
  Sprout,
  TreePine,
  Upload,
} from 'lucide-react';
import { LESSONS_DATA } from '../data/memos/lessonsData';
import { LessonMemo, MemoConfig } from '../types';
import card1amImg from '../assets/images/card_1am_plant_1790373274426.jpg';
import card2amImg from '../assets/images/card_2am_ecosystem_1790373285211.jpg';
import card3amImg from '../assets/images/card_3am_geology_1790373295369.jpg';
import card4amImg from '../assets/images/card_4am_human_1790373304110.jpg';
import heroScienceLabImg from '../assets/images/hero_science_lab.jpg';
import heroMicroscopesLabImg from '../assets/images/hero_microscopes_lab.jpg';
import heroPlantExperimentImg from '../assets/images/hero_plant_experiment.jpg';
import { getDesignerPhoto, saveDesignerPhoto } from '../utils/designerPhoto';

interface LevelsHomePageProps {
  onSelectYear: (level: '1am' | '2am' | '3am' | '4am', subTab?: 'memos' | 'distribution' | 'source') => void;
  onOpenLogbook: () => void;
  onOpenTimetable: () => void;
  onOpenDatabase: () => void;
  onOpenTool: (tool: 'assistant' | 'correction') => void;
  onOpenInfoModal?: (tab: 'about' | 'guide' | 'contact') => void;
  config: MemoConfig;
  curriculumLessons?: LessonMemo[];
}

const LAB_SCENES = [
  {
    id: 'main-lab',
    label: 'قاعة المخبر',
    caption: 'تجهيزات مخبرية متكاملة: أوانٍ زجاجية، مجسمات تشريحية، وعينات طبيعية',
    image: heroScienceLabImg,
  },
  {
    id: 'microscopes',
    label: 'المجاهر الضوئية',
    caption: 'مجاهر بصرية دقيقة لفحص الخلايا والأنسجة النباتية والحيوانية',
    image: heroMicroscopesLabImg,
  },
  {
    id: 'botany-exp',
    label: 'التجارب النباتية',
    caption: 'تحضير الشرائح وتجارب النمو والتركيب الضوئي عند النبات الأخضر',
    image: heroPlantExperimentImg,
  },
] as const;

export const LevelsHomePage: React.FC<LevelsHomePageProps> = ({
  onSelectYear,
  onOpenLogbook,
  onOpenTimetable,
  onOpenDatabase,
  onOpenTool,
  onOpenInfoModal,
  config,
  curriculumLessons = LESSONS_DATA,
}) => {
  const [activeSceneId, setActiveSceneId] = useState<(typeof LAB_SCENES)[number]['id']>('main-lab');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [designerPhoto, setDesignerPhoto] = useState<string>(() => getDesignerPhoto());

  useEffect(() => {
    const handleUpdated = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setDesignerPhoto(custom.detail || getDesignerPhoto());
    };
    window.addEventListener('designer-photo-updated', handleUpdated);
    return () => window.removeEventListener('designer-photo-updated', handleUpdated);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        saveDesignerPhoto(dataUrl);
        setDesignerPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const activeScene = LAB_SCENES.find((s) => s.id === activeSceneId) || LAB_SCENES[0];
  const preferredLevel: '1am' | '2am' | '3am' | '4am' = config.level || '4am';
  const totalLessons = curriculumLessons.length;

  const scrollToLevels = () => {
    document.getElementById('levels-strip')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const yearLevels = [
    {
      id: '1am' as const,
      number: '01',
      code: '1AM',
      title: 'السنة الأولى متوسط',
      focus: 'التغذية عند الإنسان والنبات الأخضر والتحصل على الطاقة',
      image: card1amImg,
      icon: Sprout,
      accentText: 'text-emerald-800',
      numberColor: 'text-emerald-700',
      ctaClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    },
    {
      id: '2am' as const,
      number: '02',
      code: '2AM',
      title: 'السنة الثانية متوسط',
      focus: 'الوسط الحي، العلاقات الغذائية، والتكيف وإعمار الأوساط',
      image: card2amImg,
      icon: TreePine,
      accentText: 'text-teal-800',
      numberColor: 'text-teal-700',
      ctaClass: 'bg-teal-700 hover:bg-teal-800 text-white',
    },
    {
      id: '3am' as const,
      number: '03',
      code: '3AM',
      title: 'السنة الثالثة متوسط',
      focus: 'الدينامية الداخلية والخارجية للأرض والموارد الطبيعية',
      image: card3amImg,
      icon: Globe2,
      accentText: 'text-sky-800',
      numberColor: 'text-sky-700',
      ctaClass: 'bg-sky-700 hover:bg-sky-800 text-white',
    },
    {
      id: '4am' as const,
      number: '04',
      code: '4AM · BEM',
      title: 'السنة الرابعة متوسط',
      focus: 'التغذية والأيض، التنسيق الوظيفي والمناعة، والوراثة',
      image: card4amImg,
      icon: Dna,
      accentText: 'text-cyan-900',
      numberColor: 'text-cyan-800',
      ctaClass: 'bg-slate-900 hover:bg-slate-800 text-white',
    },
  ];

  const serviceGroups = [
    {
      id: 'group-planning',
      title: 'التخطيط البيداغوجي',
      subtitle: 'إعداد المذكرات والمخططات الزمنية للتعلمات',
      accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      items: [
        {
          id: 'service-memos',
          title: 'المذكرات البيداغوجية',
          description: 'توليد وتعديل المذكرات المفصلة والمدمجة وتصديرها بصيغتي Word وPDF.',
          icon: FileText,
          onClick: () => onSelectYear(preferredLevel, 'memos'),
        },
        {
          id: 'service-distribution',
          title: 'التدرج السنوي',
          description: 'استعراض وضبط مخططات تدرج التعلمات السنوية وفق الرزنامة الرسمية.',
          icon: CalendarDays,
          onClick: () => onSelectYear(preferredLevel, 'distribution'),
        },
      ],
    },
    {
      id: 'group-school-org',
      title: 'التنظيم المدرسي',
      subtitle: 'تسيير الحصص اليومية وجدول التوقيت الأسبوعي',
      accentBg: 'bg-teal-50 text-teal-700 border-teal-200/70',
      items: [
        {
          id: 'service-logbook',
          title: 'الدفتر الرقمي',
          description: 'الدفتر اليومي ودفتر النصوص الذكي مع التوليد الآلي والطباعة الرسمية.',
          icon: BookOpenCheck,
          onClick: onOpenLogbook,
        },
        {
          id: 'service-timetable',
          title: 'استعمال الزمن',
          description: 'تنظيم جدول التوقيت الأسبوعي للأستاذ والأقسام المسندة.',
          icon: Clock,
          onClick: onOpenTimetable,
        },
      ],
    },
    {
      id: 'group-learning',
      title: 'التعليم والتعلم والموارد',
      subtitle: 'الأنشطة المخبرية ودلائل الأستاذ وقاعدة المنهاج',
      accentBg: 'bg-sky-50 text-sky-700 border-sky-200/70',
      items: [
        {
          id: 'service-activities',
          title: 'الأنشطة التعليمية والمصادر',
          description: 'الوضعيات التعلمية، الأنشطة المخبرية، ودلائل الأستاذ المعتمدة.',
          icon: BookOpen,
          onClick: () => onSelectYear(preferredLevel, 'source'),
        },
        {
          id: 'service-database',
          title: 'الموارد التعليمية وقاعدة البيانات',
          description: 'إدارة قاعدة بيانات المنهاج والموارد المعرفية والوثائق المرجعية.',
          icon: Database,
          onClick: onOpenDatabase,
        },
      ],
    },
    {
      id: 'group-eval-ai',
      title: 'التقويم والمساعد الذكي',
      subtitle: 'مذكرات التصحيح والمساعدة التربوية الفورية',
      accentBg: 'bg-cyan-50 text-cyan-800 border-cyan-200/70',
      items: [
        {
          id: 'service-assessment',
          title: 'الاختبارات والتقويم',
          description: 'بناء مذكرات تصحيح الفروض والاختبارات وتحليل أوراق التقييم.',
          icon: ClipboardCheck,
          onClick: () => onOpenTool('correction'),
        },
        {
          id: 'service-assistant',
          title: 'المساعد الذكي',
          description: 'محادثة بيداغوجية تفاعلية مستندة إلى المنهاج والوثائق المرافقة.',
          icon: MessagesSquare,
          onClick: () => onOpenTool('assistant'),
        },
      ],
    },
  ];

  return (
    <main id="main-content" className="flex-1 w-full overflow-x-hidden">
      <div className="max-w-[1360px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* ═══════════════════════════════════════════════════════════════
            1. وسط الصفحة: مخبر علوم الطبيعة والحياة (Hero Laboratory Showcase)
           ═══════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="hero-lab-title"
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-900 shadow-md group"
        >
          <div className="relative min-h-[300px] sm:min-h-[350px] lg:min-h-[390px] w-full flex flex-col justify-end">
            {!heroImgFailed ? (
              <img
                key={activeScene.id}
                src={activeScene.image}
                alt={activeScene.caption}
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.015]"
              />
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-sky-900 flex items-center justify-center"
                aria-hidden="true"
              >
                <Microscope className="w-20 h-20 text-emerald-300/30" />
              </div>
            )}

            <div
              className="absolute inset-0 bg-gradient-to-l from-[#042420]/92 via-[#063430]/75 to-[#082f49]/40 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#031917]/90 via-transparent to-black/15 pointer-events-none"
              aria-hidden="true"
            />

            {/* Top Scene Switcher */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-8 pt-4 sm:pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100/95">
                <FlaskConical className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                <span>مخبر علوم الطبيعة والحياة</span>
                <span aria-hidden="true" className="text-emerald-300/60">·</span>
                <span className="text-sky-100/90">التعليم المتوسط</span>
              </div>

              <div
                role="tablist"
                aria-label="مشاهد المخبر العلمي"
                className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950/55 backdrop-blur-md border border-white/15"
              >
                {LAB_SCENES.map((scene) => {
                  const isActive = scene.id === activeSceneId;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        setHeroImgFailed(false);
                        setActiveSceneId(scene.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-100/85 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {scene.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Main Content */}
            <div className="relative z-10 mt-auto px-4 sm:px-8 pb-5 sm:pb-7 pt-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="max-w-2xl space-y-2.5">
                <h1
                  id="hero-lab-title"
                  style={{ fontSize: 'clamp(1.6rem, 3vw, 2.65rem)', textWrap: 'balance' }}
                  className="font-extrabold text-white leading-[1.2] tracking-tight"
                >
                  اكتشف عالم علوم الطبيعة والحياة
                </h1>

                <p className="text-xs sm:text-sm text-slate-100/95 font-medium leading-relaxed max-w-xl">
                  فضاء بيداغوجي حديث يجمع بين دقة التجربة المخبرية وسهولة إعداد المذكرات، التدرجات السنوية، والدفتر الرقمي وفق منهاج الجيل الثاني.
                </p>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-emerald-100/90 tabular-nums">
                  <span>منهاج الجيل الثاني المعتمد</span>
                  <span aria-hidden="true" className="text-emerald-300/60">·</span>
                  <span>4 سنوات دراسية</span>
                  <span aria-hidden="true" className="text-emerald-300/60">·</span>
                  <span>{totalLessons} مذكرة جاهزة</span>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={scrollToLevels}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>استعراض السنوات الدراسية</span>
                  </button>
                </div>
              </div>

              <div className="hidden md:block max-w-xs text-right bg-slate-950/50 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-100/90 leading-relaxed">
                <span className="font-bold text-emerald-300 block mb-0.5">مشهد المخبر الحالي</span>
                <span>{activeScene.caption}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            2. شريط السنوات الدراسية الأربع في أسفل القسم الرئيسي
           ═══════════════════════════════════════════════════════════════ */}
        <section id="levels-strip" aria-labelledby="levels-strip-title" className="space-y-3 scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-700 shrink-0" aria-hidden="true" />
              <h2 id="levels-strip-title" className="text-lg sm:text-xl font-extrabold text-slate-900">
                السنوات الدراسية · التعليم المتوسط
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap tabular-nums">
              اختر السنة للدخول المباشر
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {yearLevels.map((lvl) => {
              const Icon = lvl.icon;
              const lessonCount = curriculumLessons.filter((l) => l.level === lvl.id).length;

              return (
                <article
                  key={lvl.id}
                  id={`card-select-level-${lvl.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => onSelectYear(lvl.id, 'memos')}
                    className="relative h-28 w-full overflow-hidden bg-slate-100 text-right cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700"
                  >
                    <img
                      src={lvl.image}
                      alt={lvl.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent"
                      aria-hidden="true"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center justify-center w-9 h-9 rounded-xl bg-white/95 text-slate-900 shadow-xs">
                      <Icon className={`w-4 h-4 ${lvl.numberColor}`} aria-hidden="true" />
                    </div>
                    <div className="absolute bottom-2.5 right-3 left-3 flex items-end justify-between gap-2">
                      <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums leading-none">
                        {lvl.number}
                      </span>
                      <span className="text-[11px] font-bold text-slate-100/95 tabular-nums">
                        {lvl.code}
                      </span>
                    </div>
                  </button>

                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className={`text-sm sm:text-[15px] font-extrabold ${lvl.accentText}`}>
                        {lvl.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {lvl.focus}
                      </p>
                      <div className="text-[11.5px] font-semibold text-slate-500 tabular-nums">
                        {lessonCount} مذكرة معتمدة
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onSelectYear(lvl.id, 'memos')}
                        className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer whitespace-nowrap ${lvl.ctaClass}`}
                      >
                        <span>دخول السنة</span>
                        <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectYear(lvl.id, 'distribution')}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors duration-200 cursor-pointer whitespace-nowrap"
                        title="فتح التدرج السنوي"
                      >
                        التدرج
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            3. بقية أقسام المنصة منظمة في مجموعات منطقية واضحة
           ═══════════════════════════════════════════════════════════════ */}
        <section id="platform-services" aria-labelledby="platform-services-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
            <h2 id="platform-services-title" className="text-lg sm:text-xl font-extrabold text-slate-900">
              أقسام وخدمات المنصة
            </h2>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              منظمة حسب المهام البيداغوجية والمدرسية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">{group.title}</h3>
                  <span className="text-[11.5px] text-slate-500 truncate">{group.subtitle}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        id={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="group text-right p-3 rounded-xl border border-slate-200/75 bg-slate-50/50 hover:bg-white hover:border-teal-500/50 hover:shadow-xs transition-all duration-200 flex items-start gap-3 cursor-pointer"
                      >
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${group.accentBg}`}>
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 group-hover:text-teal-800 truncate">
                              {item.title}
                            </span>
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
                          </div>
                          <p className="text-[11.5px] text-slate-600 leading-snug mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            4. تذييل مدمج لمعلومات المصمم ودليل المنصة
           ═══════════════════════════════════════════════════════════════ */}
        <footer className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3.5 sm:px-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={designerPhoto}
                alt="مصمم المنصة الأستاذ بغداد الطيب"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <label
                htmlFor="upload-designer-photo-banner"
                className="absolute -bottom-1 -left-1 w-6 h-6 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer shadow-xs transition"
                title="تحديث صورة المصمم"
              >
                <Upload className="w-3 h-3" aria-hidden="true" />
                <input
                  type="file"
                  id="upload-designer-photo-banner"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div>
              <div className="text-xs font-extrabold text-slate-900">
                الأستاذ بغداد الطيب <span className="font-semibold text-teal-700">· تصميم وتطوير المنصة</span>
              </div>
              <div className="text-[11.5px] text-slate-500">
                منصة المذكرة البيداغوجية لعلوم الطبيعة والحياة — التعليم المتوسط
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenInfoModal?.('about')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <Info className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
              <span>حول المنصة</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenInfoModal?.('guide')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>دليل الاستخدام</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenInfoModal?.('contact')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>تواصل معنا</span>
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
};
