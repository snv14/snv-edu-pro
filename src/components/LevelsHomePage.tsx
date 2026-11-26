import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  BarChart3,
  LibraryBig,
  Presentation,
  Zap,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Database,
  Dna,
  FileSearch,
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
} from "lucide-react";
import { LESSONS_DATA } from "../data/memos/lessonsData";
import { LessonMemo, MemoConfig } from "../types";
import heroScienceLabImg from "../assets/images/hero_science_lab.jpg";
import heroMicroscopesLabImg from "../assets/images/hero_microscopes_lab.jpg";
import heroPlantExperimentImg from "../assets/images/hero_plant_experiment.jpg";
import dashboardBanner from "../assets/images/dashboard-science-banner.webp";
import { AssistantAvatar } from './AssistantAvatar';
import { homeDashboardStats } from "../services/homeDashboardStats";
import { getDesignerPhoto, saveDesignerPhoto } from "../utils/designerPhoto";

interface LevelsHomePageProps {
  onSelectYear: (
    level: "1am" | "2am" | "3am" | "4am",
    subTab?: "memos" | "distribution" | "source",
  ) => void;
  onOpenLogbook: () => void;
  onOpenTimetable: () => void;
  onOpenDatabase: () => void;
  onOpenAssessment: () => void;
  onOpenAssistant: () => void;
  onOpenInfoModal?: (tab: "about" | "guide" | "contact") => void;
  config: MemoConfig;
  curriculumLessons?: LessonMemo[];
}

const LAB_SCENES = [
  {
    id: "main-lab",
    label: "قاعة المخبر",
    caption:
      "تجهيزات مخبرية متكاملة: أوانٍ زجاجية، مجسمات تشريحية، وعينات طبيعية",
    image: heroScienceLabImg,
  },
  {
    id: "microscopes",
    label: "المجاهر الضوئية",
    caption: "مجاهر بصرية دقيقة لفحص الخلايا والأنسجة النباتية والحيوانية",
    image: heroMicroscopesLabImg,
  },
  {
    id: "botany-exp",
    label: "التجارب النباتية",
    caption: "تحضير الشرائح وتجارب النمو والتركيب الضوئي عند النبات الأخضر",
    image: heroPlantExperimentImg,
  },
] as const;

export const LevelsHomePage: React.FC<LevelsHomePageProps> = ({
  onSelectYear,
  onOpenLogbook,
  onOpenTimetable,
  onOpenDatabase,
  onOpenAssessment,
  onOpenAssistant,
  onOpenInfoModal,
  config,
  curriculumLessons = LESSONS_DATA,
}) => {
  const [activeSceneId, setActiveSceneId] =
    useState<(typeof LAB_SCENES)[number]["id"]>("main-lab");
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [designerPhoto, setDesignerPhoto] = useState<string>(() =>
    getDesignerPhoto(),
  );

  useEffect(() => {
    const handleUpdated = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setDesignerPhoto(custom.detail || getDesignerPhoto());
    };
    window.addEventListener("designer-photo-updated", handleUpdated);
    return () =>
      window.removeEventListener("designer-photo-updated", handleUpdated);
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

  const activeScene =
    LAB_SCENES.find((s) => s.id === activeSceneId) || LAB_SCENES[0];
  const preferredLevel: "1am" | "2am" | "3am" | "4am" = config.level || "4am";
  const stats = homeDashboardStats(curriculumLessons);

  const yearLevels = [
    {
      id: "1am" as const,
      number: "01",
      code: "1AM",
      title: "السنة الأولى متوسط",
      focus: "التغذية عند الإنسان والنبات الأخضر والتحصّل على الطاقة",
      icon: Sprout,
      accent: "#1687ee",
    },
    {
      id: "2am" as const,
      number: "02",
      code: "2AM",
      title: "السنة الثانية متوسط",
      focus: "الوسط الحي، العلاقات الغذائية، والتكيّف وإعمار الأوساط",
      icon: TreePine,
      accent: "#f49417",
    },
    {
      id: "3am" as const,
      number: "03",
      code: "3AM",
      title: "السنة الثالثة متوسط",
      focus: "الدينامية الداخلية والخارجية للأرض والموارد الطبيعية",
      icon: Globe2,
      accent: "#23b744",
    },
    {
      id: "4am" as const,
      number: "04",
      code: "4AM · BEM",
      title: "السنة الرابعة متوسط",
      focus: "التغذية والأيض، التنسيق الوظيفي والمناعة، والوراثة",
      icon: Dna,
      accent: "#9834dd",
    },
  ];

  const serviceGroups = [
    {
      id: "group-planning",
      title: "التخطيط البيداغوجي",
      subtitle: "إعداد المذكرات والمخططات الزمنية للتعلمات",
      items: [
        {
          id: "service-memos",
          title: "المذكرات البيداغوجية",
          description:
            "توليد وتعديل المذكرات المفصلة والمدمجة وتصديرها بصيغتي Word وPDF.",
          icon: FileText,
          onClick: () => onSelectYear(preferredLevel, "memos"),
        },
        {
          id: "service-distribution",
          title: "التدرج السنوي",
          description:
            "استعراض وضبط مخططات تدرج التعلمات السنوية وفق الرزنامة الرسمية.",
          icon: CalendarDays,
          onClick: () => onSelectYear(preferredLevel, "distribution"),
        },
      ],
    },
    {
      id: "group-school-org",
      title: "التنظيم المدرسي",
      subtitle: "تسيير الحصص اليومية وجدول التوقيت الأسبوعي",
      items: [
        {
          id: "service-logbook",
          title: "الدفتر الرقمي",
          description:
            "الدفتر اليومي ودفتر النصوص الذكي مع التوليد الآلي والطباعة الرسمية.",
          icon: BookOpenCheck,
          onClick: onOpenLogbook,
        },
        {
          id: "service-timetable",
          title: "استعمال الزمن",
          description: "تنظيم جدول التوقيت الأسبوعي للأستاذ والأقسام المسندة.",
          icon: Clock,
          onClick: onOpenTimetable,
        },
      ],
    },
    {
      id: "group-learning",
      title: "التعليم والتعلم والموارد",
      subtitle: "الأنشطة المخبرية ودلائل الأستاذ وقاعدة المنهاج",
      items: [
        {
          id: "service-activities",
          title: "الأنشطة التعليمية والمصادر",
          description:
            "الوضعيات التعلمية، الأنشطة المخبرية، ودلائل الأستاذ المعتمدة.",
          icon: BookOpen,
          onClick: () => onSelectYear(preferredLevel, "source"),
        },
        {
          id: "service-database",
          title: "الموارد التعليمية وقاعدة البيانات",
          description:
            "إدارة قاعدة بيانات المنهاج والموارد المعرفية والوثائق المرجعية.",
          icon: Database,
          onClick: onOpenDatabase,
        },
      ],
    },
    {
      id: "group-eval-ai",
      title: "التقويم والمساعد الذكي",
      subtitle: "تنفيذ العمل التقييمي، والبحث والفهم والمساعدة",
      items: [
        {
          id: "service-assessment",
          title: "التقويم",
          description:
            "أنشئ اختباراتك، صححها، أنجز مذكرة التصحيح، أدخل النتائج وحلل أداء التلاميذ.",
          icon: ClipboardCheck,
          onClick: onOpenAssessment,
        },
        {
          id: "service-assistant",
          title: "المساعد الذكي",
          description:
            "بحث وقراءة ملفات وفهم وتلخيص واقتراح — مستندًا إلى المنهاج والوثائق المرافقة.",
          icon: MessagesSquare,
          onClick: onOpenAssistant,
        },
      ],
    },
  ];

  return (
    <main id="main-content" className="overview-home flex-1 w-full min-w-0">
      <div className="overview-content">
        <section
          aria-labelledby="hero-lab-title"
          className="overview-banner"
          style={
            {
              "--overview-banner": `url(${dashboardBanner})`,
            } as React.CSSProperties
          }
        >
          <div className="overview-banner__copy">
            <p className="overview-breadcrumb">
              الرئيسية <span>/</span> منصة علوم الطبيعة والحياة
            </p>
            <h1 id="hero-lab-title">الرئيسية</h1>
            <p className="overview-banner__subtitle">
              مساحتك البيداغوجية لعلوم الطبيعة والحياة
            </p>
            <p className="overview-banner__note">
              مذكرات وتدرجات وموارد تعليمية، مع التصدير إلى Word وPDF.
            </p>
          </div>
          <span className="overview-school-year">
            <CalendarDays size={15} aria-hidden="true" />
            {config.schoolYear || "التعليم المتوسط"}
          </span>
        </section>

        <section
          id="levels-strip"
          aria-labelledby="levels-strip-title"
          className="overview-levels-section"
        >
          <h2 id="levels-strip-title" className="sr-only">
            السنوات الدراسية الأربع
          </h2>
          <div className="overview-levels">
            {yearLevels.map((lvl) => {
              const Icon = lvl.icon;
              const count = curriculumLessons.filter(
                (l) => l.level === lvl.id,
              ).length;
              return (
                <article
                  key={lvl.id}
                  id={`card-select-level-${lvl.id}`}
                  className={`overview-year overview-year--${lvl.id}`}
                  style={{ "--year-accent": lvl.accent } as React.CSSProperties}
                >
                  <Icon size={38} strokeWidth={2.1} aria-hidden="true" />
                  <h3>{lvl.title}</h3>
                  <p className="overview-year__focus">{lvl.focus}</p>
                  <span className="overview-year__count">{count} مذكرة</span>
                  <div className="overview-year__actions">
                    <button
                      type="button"
                      onClick={() => onSelectYear(lvl.id, "memos")}
                      aria-label={`دخول ${lvl.title}`}
                    >
                      الدخول <ArrowLeft size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectYear(lvl.id, "distribution")}
                      title={`التدرج السنوي — ${lvl.title}`}
                      aria-label={`التدرج السنوي — ${lvl.title}`}
                      className="overview-year__plan"
                    >
                      <CalendarDays size={16} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="overview-panel overview-statistics">
            <div className="overview-panel__heading">
              <h2>
                <BarChart3 size={24} aria-hidden="true" /> محتوى المنصة من
                مذكراتك
              </h2>
              <span className="overview-pill">جميع السنوات</span>
            </div>
            <div className="overview-statistics__body">
              <div className="overview-domain-list">
                <h3>المذكرات حسب الميدان</h3>
                {stats.domains.map((domain, index) => (
                  <div
                    className="overview-domain"
                    key={domain.name}
                    style={
                      {
                        "--domain-color": [
                          "#2589ed",
                          "#34b344",
                          "#983bdb",
                          "#f39b23",
                        ][index % 4],
                      } as React.CSSProperties
                    }
                  >
                    <span title={domain.name}>{domain.name}</span>
                    <div
                      role="meter"
                      aria-label={domain.name}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={domain.percent}
                    >
                      <i style={{ width: `${domain.percent}%` }} />
                    </div>
                    <b>{domain.percent}%</b>
                  </div>
                ))}
                {!stats.domains.length && (
                  <p className="text-sm text-slate-500">
                    لا توجد مذكرات في قاعدة البيانات الحالية.
                  </p>
                )}
              </div>
              <div className="overview-metrics">
                {[
                  {
                    value: stats.activities,
                    label: "نشاط تعليمي",
                    icon: FlaskConical,
                    tone: "orange",
                  },
                  {
                    value: stats.resources,
                    label: "مورد تعليمي",
                    icon: LibraryBig,
                    tone: "blue",
                  },
                  {
                    value: stats.units,
                    label: "مقطع تعليمي",
                    icon: FileText,
                    tone: "green",
                  },
                  {
                    value: stats.memos,
                    label: "مذكرة دروس",
                    icon: Presentation,
                    tone: "purple",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className={`overview-metric overview-metric--${metric.tone}`}
                  >
                    <metric.icon size={32} aria-hidden="true" />
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                    <i aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="platform-services"
          aria-labelledby="platform-services-title"
          className="overview-workspace"
        >
          <h2 id="platform-services-title" className="sr-only">
            أقسام وخدمات المنصة
          </h2>
          <div className="overview-panel overview-assistant-card">
            <div className="overview-assistant-card__copy">
              <h3>المساعد الذكي</h3>
              <p>
                رفيقك في التحضير والفهم، والإجابة عن أسئلتك في علوم الطبيعة
                والحياة.
              </p>
              <button type="button" onClick={onOpenAssistant}>
                ابدأ المحادثة <ArrowLeft size={15} aria-hidden="true" />
              </button>
            </div>
            <AssistantAvatar size="hero" />
          </div>
          <div className="overview-panel overview-tools">
            <div className="overview-panel__heading">
              <h3>
                <Zap size={23} aria-hidden="true" />
                أقسام وخدمات المنصة
              </h3>
            </div>
            <div className="overview-tool-groups">
              {serviceGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="overview-tool-group"
                  role="group"
                  aria-labelledby={group.id}
                >
                  <h4 id={group.id} title={group.subtitle}>
                    {group.title}
                  </h4>
                  <div className="overview-tool-grid">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          id={item.id}
                          key={item.id}
                          type="button"
                          onClick={item.onClick}
                          className={`overview-tool overview-tool--${index}`}
                          title={item.description}
                        >
                          <Icon size={25} aria-hidden="true" />
                          <span>{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="overview-panel overview-lab">
            <div className="overview-panel__heading">
              <h3>
                <Microscope size={22} aria-hidden="true" />
                المخبر العلمي
              </h3>
            </div>
            <figure>
              {!heroImgFailed ? (
                <img
                  key={activeScene.id}
                  src={activeScene.image}
                  alt={activeScene.caption}
                  onError={() => setHeroImgFailed(true)}
                />
              ) : (
                <div className="overview-lab__fallback">
                  <Microscope size={45} aria-hidden="true" />
                </div>
              )}
              <figcaption>{activeScene.caption}</figcaption>
            </figure>
            <div
              role="tablist"
              aria-label="مشاهد المخبر العلمي"
              className="overview-lab__tabs"
            >
              {LAB_SCENES.map((scene) => (
                <button
                  type="button"
                  key={scene.id}
                  role="tab"
                  aria-selected={activeSceneId === scene.id}
                  onClick={() => {
                    setHeroImgFailed(false);
                    setActiveSceneId(scene.id);
                  }}
                >
                  {scene.label}
                </button>
              ))}
            </div>
          </div>
        </section>

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
                  <span className="font-semibold text-[#f0d492]">
                    {" "}
                    · تصميم وتطوير المنصة
                  </span>
                </div>
                <div className="text-[11px] text-white/60">
                  منصة المذكرة البيداغوجية لعلوم الطبيعة والحياة — التعليم
                  المتوسط
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenInfoModal?.("about")}
                className="snv-btn snv-btn--outline-light !px-3 !py-1.5 !text-[11.5px]"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                <span>حول المنصة</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenInfoModal?.("guide")}
                className="snv-btn snv-btn--outline-light !px-3 !py-1.5 !text-[11.5px]"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>دليل الاستخدام</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenInfoModal?.("contact")}
                className="snv-btn snv-btn--outline-light !px-3 !py-1.5 !text-[11.5px]"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تواصل معنا</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5 text-[10.5px] text-white/45">
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            <span>
              منهاج الجيل الثاني · 4 سنوات دراسية · مذكرات وتدرجات رسمية
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
};
