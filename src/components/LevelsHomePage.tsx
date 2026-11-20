import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
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
      focus: 'التغذية عند الإنسان والنبات الأخضر والتحصّل على الطاقة',
      image: card1amImg,
      icon: Sprout,
      accent: '#0e7a68',
    },
    {
      id: '2am' as const,
      number: '02',
      code: '2AM',
      title: 'السنة الثانية متوسط',
      focus: 'الوسط الحي، العلاقات الغذائية، والتكيّف وإعمار الأوساط',
      image: card2amImg,
      icon: TreePine,
      accent: '#0d6f8f',
    },
    {
      id: '3am' as const,
      number: '03',
      code: '3AM',
      title: 'السنة الثالثة متوسط',
      focus: 'الدينامية الداخلية والخارجية للأرض والموارد الطبيعية',
      image: card3amImg,
      icon: Globe2,
      accent: '#a06a12',
    },
    {
      id: '4am' as const,
      number: '04',
      code: '4AM · BEM',
      title: 'السنة الرابعة متوسط',
      focus: 'التغذية والأيض، التنسيق الوظيفي والمناعة، والوراثة',
      image: card4amImg,
      icon: Dna,
      accent: '#a33b5b',
    },
  ];

  const serviceGroups = [
    {
      id: 'group-planning',
      title: 'التخطيط البيداغوجي',
      subtitle: 'إعداد المذكرات والمخططات الزمنية للتعلمات',
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
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8">

        {/* ═══════════════════════════════════════════════════════════
            الواجهة الرئيسية: عنوان المنصة + مشهد المخبر
           ═══════════════════════════════════════════════════════════ */}
        <section aria-labelledby="hero-lab-title" className="snv-hero">
          <div className="relative z-10 grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-9 lg:p-10">
            {/* النص */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="snv-eyebrow">
                  <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                  منصة المذكرة البيداغوجية
                </span>
                <span className="snv-eyebrow snv-eyebrow--ghost">علوم الطبيعة والحياة · التعليم المتوسط</span>
              </div>

              <h1 id="hero-lab-title" className="snv-hero-title">
                منهاجُك البيداغوجي،
                <br />
                <span>في مساحة عمل واحدة.</span>
              </h1>

              <p className="max-w-xl text-[13px] font-medium leading-relaxed text-[#cfdedb] sm:text-sm">
                مذكرات، تدرجات سنوية، دفتر رقمي ومساعد ذكي — مبنية على وثائق المنهاج الرسمية
                للجيل الثاني، مع تصدير مباشر إلى Word وPDF.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button type="button" onClick={scrollToLevels} className="snv-btn snv-btn--gold">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  استعراض السنوات الدراسية
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTool('assistant')}
                  className="snv-btn snv-btn--outline-light"
                >
                  <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                  المساعد الذكي
                </button>
              </div>

              <dl className="grid max-w-md grid-cols-3 gap-3 pt-2">
                <div className="snv-stat">
                  <dt>سنوات دراسية</dt>
                  <dd className="tabular-nums">4</dd>
                </div>
                <div className="snv-stat">
                  <dt>مذكرة جاهزة</dt>
                  <dd className="tabular-nums">{totalLessons}</dd>
                </div>
                <div className="snv-stat">
                  <dt>صيغتا التصدير</dt>
                  <dd className="text-base">Word · PDF</dd>
                </div>
              </dl>
            </div>

            {/* الصورة والمشاهد */}
            <div className="space-y-2.5">
              <figure className="snv-hero-media">
                {!heroImgFailed ? (
                  <img
                    key={activeScene.id}
                    src={activeScene.image}
                    alt={activeScene.caption}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-900 to-sky-900"
                    aria-hidden="true"
                  >
                    <Microscope className="h-16 w-16 text-emerald-300/40" />
                  </div>
                )}

                <figcaption className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-[#04120f]/90 via-[#04120f]/45 to-transparent px-3.5 pb-3 pt-8">
                  <span className="mb-0.5 block text-[10.5px] font-extrabold tracking-wide text-[#f0d492]">
                    {activeScene.label}
                  </span>
                  <span className="block text-[11.5px] font-medium leading-snug text-white/85">
                    {activeScene.caption}
                  </span>
                </figcaption>
              </figure>

              <div
                role="tablist"
                aria-label="مشاهد المخبر العلمي"
                className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/12 bg-white/[0.06] p-1"
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
                      className={`flex-1 cursor-pointer whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                        isActive
                          ? 'bg-white text-[#0b1f1c] shadow-sm'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {scene.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            السنوات الدراسية
           ═══════════════════════════════════════════════════════════ */}
        <section id="levels-strip" aria-labelledby="levels-strip-title" className="scroll-mt-24 space-y-4">
          <div className="snv-section-head">
            <div>
              <span className="snv-kicker">01 · المسار الدراسي</span>
              <h2 id="levels-strip-title" className="snv-section-title">
                السنوات الدراسية الأربع
              </h2>
            </div>
            <span className="snv-note">اختر السنة للدخول المباشر إلى مذكراتها</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {yearLevels.map((lvl) => {
              const Icon = lvl.icon;
              const lessonCount = curriculumLessons.filter((l) => l.level === lvl.id).length;

              return (
                <article key={lvl.id} id={`card-select-level-${lvl.id}`} className="snv-level-card">
                  <button
                    type="button"
                    onClick={() => onSelectYear(lvl.id, 'memos')}
                    className="snv-level-media w-full cursor-pointer text-right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e7a68]"
                    aria-label={`دخول ${lvl.title}`}
                  >
                    <img src={lvl.image} alt={lvl.title} referrerPolicy="no-referrer" />
                    <span className="snv-level-icon">
                      <Icon className="h-4 w-4" style={{ color: lvl.accent }} aria-hidden="true" />
                    </span>
                    <span className="snv-level-index tabular-nums">{lvl.number}</span>
                    <span className="snv-level-code tabular-nums">{lvl.code}</span>
                  </button>

                  <div className="snv-level-body">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-extrabold text-[#0b1f1c] sm:text-[15px]">{lvl.title}</h3>
                      <p className="line-clamp-2 text-[11.5px] leading-relaxed text-[#5c6f6a]">{lvl.focus}</p>
                      <span className="snv-metric tabular-nums">
                        <FileText className="h-3 w-3" aria-hidden="true" />
                        {lessonCount} مذكرة معتمدة
                      </span>
                    </div>

                    <div className="mt-auto flex items-center gap-1.5 pt-3">
                      <button
                        type="button"
                        onClick={() => onSelectYear(lvl.id, 'memos')}
                        style={{ backgroundColor: lvl.accent }}
                        className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl px-3 py-2 text-[11.5px] font-extrabold text-white shadow-sm transition hover:brightness-110"
                      >
                        <span>دخول السنة</span>
                        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectYear(lvl.id, 'distribution')}
                        className="cursor-pointer whitespace-nowrap rounded-xl border border-[#e2e8e5] bg-white px-3 py-2 text-[11.5px] font-bold text-[#3f534e] transition hover:border-[#0e7a68]/40 hover:bg-[#f5faf8] hover:text-[#0a5f51]"
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

        {/* ═══════════════════════════════════════════════════════════
            أقسام وخدمات المنصة
           ═══════════════════════════════════════════════════════════ */}
        <section id="platform-services" aria-labelledby="platform-services-title" className="space-y-4">
          <div className="snv-section-head">
            <div>
              <span className="snv-kicker">02 · مساحة العمل</span>
              <h2 id="platform-services-title" className="snv-section-title">
                أقسام وخدمات المنصة
              </h2>
            </div>
            <span className="snv-note">منظمة حسب المهام البيداغوجية والمدرسية</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {serviceGroups.map((group, groupIndex) => (
              <div key={group.id} className="snv-service-panel">
                <div className="flex items-start gap-3 pb-2">
                  <span className="mt-0.5 font-[Tajawal] text-xs font-extrabold tabular-nums text-[#9db3ad]">
                    0{groupIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[13.5px] font-extrabold text-[#0b1f1c]">{group.title}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-[#6b7d78]">{group.subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        id={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="snv-service-row"
                      >
                        <span className="snv-icon-tile">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-1">
                            <span className="truncate text-[12px] font-extrabold text-[#0b1f1c]">{item.title}</span>
                            <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-[#9db3ad]" aria-hidden="true" />
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-[#61736e]">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            تذييل المنصة
           ═══════════════════════════════════════════════════════════ */}
        <footer className="snv-footer">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={designerPhoto}
                  alt="مصمم المنصة الأستاذ بغداد الطيب"
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-xl border border-white/20 object-cover"
                />
                <label
                  htmlFor="upload-designer-photo-banner"
                  className="absolute -bottom-1 -left-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-white/90 text-[#0b1f1c] shadow-sm transition hover:bg-white"
                  title="تحديث صورة المصمم"
                >
                  <Upload className="h-3 w-3" aria-hidden="true" />
                  <input
                    type="file"
                    id="upload-designer-photo-banner"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              <div className="min-w-0">
                <div className="text-xs font-extrabold text-white">
                  الأستاذ بغداد الطيب
                  <span className="font-semibold text-[#f0d492]"> · تصميم وتطوير المنصة</span>
                </div>
                <div className="text-[11px] text-white/60">
                  منصة المذكرة البيداغوجية لعلوم الطبيعة والحياة — التعليم المتوسط
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenInfoModal?.('about')}
                className="snv-btn snv-btn--outline-light !px-3 !py-1.5 !text-[11.5px]"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                <span>حول المنصة</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenInfoModal?.('guide')}
                className="snv-btn snv-btn--outline-light !px-3 !py-1.5 !text-[11.5px]"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>دليل الاستخدام</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenInfoModal?.('contact')}
                className="snv-btn snv-btn--outline-light !px-3 !py-1.5 !text-[11.5px]"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تواصل معنا</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5 text-[10.5px] text-white/45">
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            <span>منهاج الجيل الثاني · 4 سنوات دراسية · مذكرات وتدرجات رسمية</span>
          </div>
        </footer>
      </div>
    </main>
  );
};
