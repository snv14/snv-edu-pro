import React from "react";
import {
  BookOpenCheck,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  Database,
  Dna,
  FileSearch,
  Globe2,
  GraduationCap,
  HelpCircle,
  Home,
  Info,
  Mail,
  MessagesSquare,
  Microscope,
  Settings,
  Sprout,
  TreePine,
  X,
  LayoutGrid,
  UserRound,
} from "lucide-react";
import { MemoConfig } from "../types";

interface PlatformNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenTimetable?: () => void;
  onOpenInfoModal: (tab: "about" | "contact" | "guide") => void;
  config: MemoConfig;
  variant?: "drawer" | "sidebar";
}

const rowBase =
  "group w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-[12px] font-bold transition cursor-pointer border";
const rowIdle =
  "border-transparent text-[#334842] hover:bg-white hover:border-[#e2e8e5]";
const rowActive =
  "bg-white border-[#cfe3dc] text-[#0a5f51] shadow-[0_6px_18px_-16px_rgba(11,31,28,0.8)]";

export const PlatformNavigationDrawer: React.FC<
  PlatformNavigationDrawerProps
> = ({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
  onOpenTimetable,
  onOpenInfoModal,
  config,
  variant = "drawer",
}) => {
  const sidebar = variant === "sidebar";
  if (!isOpen && !sidebar) return null;

  const levels = [
    {
      id: "1am",
      title: "السنة الأولى متوسط",
      code: "1AM",
      icon: <Sprout className="w-4 h-4 text-[#0e7a68]" />,
    },
    {
      id: "2am",
      title: "السنة الثانية متوسط",
      code: "2AM",
      icon: <TreePine className="w-4 h-4 text-[#0d6f8f]" />,
    },
    {
      id: "3am",
      title: "السنة الثالثة متوسط",
      code: "3AM",
      icon: <Globe2 className="w-4 h-4 text-[#a06a12]" />,
    },
    {
      id: "4am",
      title: "السنة الرابعة متوسط",
      code: "BEM",
      icon: <Dna className="w-4 h-4 text-[#a33b5b]" />,
    },
  ];

  const handleSelectSection = (sec: string) => {
    onNavigate(sec);
    onClose();
  };

  const GroupLabel: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8fa39d]">
      {children}
    </div>
  );

  return (
    <div
      id={sidebar ? "platform-home-navigation" : "platform-nav-drawer"}
      aria-label={sidebar ? "التنقل الرئيسي" : undefined}
      className={
        sidebar
          ? "overview-sidebar"
          : "fixed inset-0 z-50 flex justify-start overflow-hidden bg-[#04110e]/55 backdrop-blur-[3px] animate-in fade-in duration-200"
      }
      onClick={sidebar ? undefined : onClose}
    >
      {sidebar && (
        <nav className="overview-rail" aria-label="اختصارات الأقسام">
          <span className="overview-rail__brand">
            <LayoutGrid size={25} />
          </span>
          {[
            { section: "home", label: "الرئيسية", icon: Home },
            { section: "database", label: "الموارد التعليمية", icon: Database },
            { section: "logbook", label: "الدفتر الرقمي", icon: BookOpenCheck },
            { section: "assessment", label: "التقويم", icon: ClipboardCheck },
            {
              section: "assistant",
              label: "المساعد الذكي",
              icon: MessagesSquare,
            },
            { section: "settings", label: "إعدادات الحساب", icon: Settings },
          ].map((item) => (
            <button
              type="button"
              key={item.section}
              title={item.label}
              aria-label={item.label}
              aria-current={activeSection === item.section ? "page" : undefined}
              onClick={() => handleSelectSection(item.section)}
            >
              <item.icon size={23} />
            </button>
          ))}
          <button
            type="button"
            title="تواصل معنا"
            aria-label="تواصل معنا"
            onClick={() => onOpenInfoModal("contact")}
          >
            <Mail size={23} />
          </button>
        </nav>
      )}
      <div
        className={`${sidebar ? "overview-sidebar__panel " : ""}flex h-full w-full max-w-[336px] flex-col border-l border-[#0b1f1c]/10 bg-[#f6f9f8] shadow-2xl animate-in slide-in-from-right-4 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ترويسة اللوحة */}
        <div className="relative overflow-hidden bg-[#0b1f1c] px-4 pb-4 pt-4 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(120% 120% at 100% 0%, rgba(18,160,138,.45), transparent 60%), radial-gradient(90% 90% at 0% 100%, rgba(226,190,99,.18), transparent 60%)",
            }}
          />
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#f0d492]">
                {sidebar ? (
                  <UserRound className="w-6 h-6" />
                ) : (
                  <Microscope className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[13.5px] font-extrabold leading-tight">
                  {sidebar
                    ? config.teacherName || "مرحبًا بك في منصتك"
                    : "المنصة البيداغوجية"}
                </h3>
                <p className="truncate text-[10.5px] text-white/60">
                  {sidebar
                    ? "مساحة عملك في علوم الطبيعة والحياة"
                    : "علوم الطبيعة والحياة · التعليم المتوسط"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق القائمة"
              hidden={sidebar}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!sidebar &&
            (config.schoolYear || config.teacherName || config.schoolName) && (
              <div className="relative mt-3 grid gap-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[10.5px] text-white/70">
                {config.teacherName && (
                  <span className="truncate font-bold text-white/90">
                    {config.teacherName}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {config.schoolName && (
                    <span className="truncate">{config.schoolName}</span>
                  )}
                  {config.schoolYear && (
                    <span className="tabular-nums text-[#f0d492]">
                      الموسم {config.schoolYear}
                    </span>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* التنقل */}
        <div className="flex-1 space-y-5 overflow-y-auto p-3">
          <div className="space-y-1">
            <GroupLabel>الواجهة والسنوات الدراسية</GroupLabel>

            <button
              type="button"
              onClick={() => handleSelectSection("home")}
              className={`${rowBase} ${activeSection === "home" ? rowActive : rowIdle}`}
            >
              <span className="flex items-center gap-2.5">
                <Home className="w-4 h-4 opacity-80" />
                <span>الصفحة الرئيسية والمخبر</span>
              </span>
              <ChevronLeft className="w-4 h-4 opacity-40" />
            </button>

            {levels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleSelectSection(lvl.id)}
                className={`${rowBase} ${activeSection === lvl.id ? rowActive : rowIdle}`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {lvl.icon}
                  <span className="truncate">{lvl.title}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-md border border-[#e2e8e5] bg-white px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums text-[#7b8d88]">
                    {lvl.code}
                  </span>
                  <ChevronLeft className="w-4 h-4 opacity-40" />
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1 border-t border-[#e2e8e5] pt-3">
            <GroupLabel>التنظيم المدرسي والموارد</GroupLabel>

            <button
              type="button"
              onClick={() => handleSelectSection("logbook")}
              className={`${rowBase} ${activeSection === "logbook" ? rowActive : rowIdle}`}
            >
              <span className="flex items-center gap-2.5">
                <BookOpenCheck className="w-4 h-4 text-[#0e7a68]" />
                <span>الدفتر الرقمي ودفتر النصوص</span>
              </span>
              <ChevronLeft className="w-4 h-4 opacity-40" />
            </button>

            {onOpenTimetable && (
              <button
                type="button"
                onClick={() => {
                  onOpenTimetable();
                  onClose();
                }}
                className={`${rowBase} ${rowIdle}`}
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#0d6f8f]" />
                  <span>استعمال الزمن</span>
                </span>
                <ChevronLeft className="w-4 h-4 opacity-40" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectSection("database")}
              className={`${rowBase} ${activeSection === "database" ? rowActive : rowIdle}`}
            >
              <span className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-[#a06a12]" />
                <span>الموارد التعليمية وقاعدة البيانات</span>
              </span>
              <ChevronLeft className="w-4 h-4 opacity-40" />
            </button>
          </div>

          <div className="space-y-1 border-t border-[#e2e8e5] pt-3">
            <GroupLabel>التقويم والمساعد الذكي</GroupLabel>

            <button
              type="button"
              onClick={() => handleSelectSection("assessment")}
              className={`${rowBase} ${activeSection === "assessment" ? rowActive : rowIdle}`}
            >
              <span className="flex items-center gap-2.5">
                <ClipboardCheck className="w-4 h-4 text-[#0e7a68]" />
                <span>التقويم</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-md border border-[#e2e8e5] bg-white px-1.5 py-0.5 text-[8.5px] font-extrabold text-[#7b8d88]">
                  اختبارات · نتائج
                </span>
                <ChevronLeft className="w-4 h-4 opacity-40" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSection("assistant")}
              className={`${rowBase} ${activeSection === "assistant" ? rowActive : rowIdle}`}
            >
              <span className="flex items-center gap-2.5">
                <MessagesSquare className="w-4 h-4 text-[#0d6f8f]" />
                <span>المساعد الذكي</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-md border border-[#e2e8e5] bg-white px-1.5 py-0.5 text-[8.5px] font-extrabold text-[#7b8d88]">
                  بحث · ملفات
                </span>
                <ChevronLeft className="w-4 h-4 opacity-40" />
              </span>
            </button>
          </div>

          <div className="space-y-1 border-t border-[#e2e8e5] pt-3">
            <GroupLabel>إدارة الأستاذ والدعم</GroupLabel>

            <button
              type="button"
              onClick={() => handleSelectSection("settings")}
              className={`${rowBase} ${activeSection === "settings" ? rowActive : rowIdle}`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 opacity-80" />
                <span>إعدادات الحساب والخاتم</span>
              </span>
              <ChevronLeft className="w-4 h-4 opacity-40" />
            </button>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoModal("about");
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#e2e8e5] bg-white p-2 text-[10.5px] font-bold text-[#334842] transition hover:border-[#0e7a68]/35 hover:text-[#0a5f51]"
              >
                <Info className="w-3.5 h-3.5 text-[#0d6f8f]" />
                <span>حول المنصة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoModal("guide");
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#e2e8e5] bg-white p-2 text-[10.5px] font-bold text-[#334842] transition hover:border-[#0e7a68]/35 hover:text-[#0a5f51]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0e7a68]" />
                <span>الدليل</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoModal("contact");
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#e2e8e5] bg-white p-2 text-[10.5px] font-bold text-[#334842] transition hover:border-[#0e7a68]/35 hover:text-[#0a5f51]"
              >
                <Mail className="w-3.5 h-3.5 text-[#7b8d88]" />
                <span>تواصل</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e2e8e5] bg-white px-4 py-2.5 text-center text-[10.5px] text-[#7b8d88]">
          تصميم وتطوير:{" "}
          <strong className="text-[#0b1f1c]">الأستاذ بغداد الطيب</strong>
        </div>
      </div>
    </div>
  );
};
