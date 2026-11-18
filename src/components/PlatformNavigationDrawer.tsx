import React from 'react';
import {
  BookOpenCheck,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  Database,
  Dna,
  Globe2,
  HelpCircle,
  Home,
  Info,
  Mail,
  MessagesSquare,
  Microscope,
  Settings,
  Sprout,
  TreePine,
} from 'lucide-react';
import { MemoConfig } from '../types';

interface PlatformNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenTimetable?: () => void;
  onOpenInfoModal: (tab: 'about' | 'contact' | 'guide') => void;
  onOpenTool: (tool: 'assistant' | 'correction') => void;
  config: MemoConfig;
}

export const PlatformNavigationDrawer: React.FC<PlatformNavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
  onOpenTimetable,
  onOpenInfoModal,
  onOpenTool,
  config,
}) => {
  if (!isOpen) return null;

  const levels = [
    {
      id: '1am',
      title: 'السنة الأولى متوسط (1AM)',
      icon: <Sprout className="w-4 h-4 text-emerald-600" />,
      bg: 'hover:bg-emerald-50',
    },
    {
      id: '2am',
      title: 'السنة الثانية متوسط (2AM)',
      icon: <TreePine className="w-4 h-4 text-teal-600" />,
      bg: 'hover:bg-teal-50',
    },
    {
      id: '3am',
      title: 'السنة الثالثة متوسط (3AM)',
      icon: <Globe2 className="w-4 h-4 text-sky-600" />,
      bg: 'hover:bg-sky-50',
    },
    {
      id: '4am',
      title: 'السنة الرابعة متوسط (4AM · BEM)',
      icon: <Dna className="w-4 h-4 text-cyan-700" />,
      bg: 'hover:bg-cyan-50',
    },
  ];

  const handleSelectSection = (sec: string) => {
    onNavigate(sec);
    onClose();
  };

  return (
    <div
      id="platform-nav-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-start animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Top Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-l from-[#0b3b36] via-[#0f766e] to-[#0369a1] text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 text-emerald-200 flex items-center justify-center shrink-0">
                <Microscope className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm leading-tight truncate">المنصة البيداغوجية</h3>
                <p className="text-[11px] text-emerald-100/90 truncate">علوم الطبيعة والحياة · التعليم المتوسط</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق القائمة"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>

          {(config.schoolYear || config.teacherName) && (
            <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100/90 gap-2">
              {config.schoolYear && <span>الموسم: <strong>{config.schoolYear}</strong></span>}
              {config.teacherName && <span className="truncate">{config.teacherName}</span>}
            </div>
          )}
        </div>

        {/* Organized Navigation Groups */}
        <div className="p-3.5 space-y-4 flex-1 bg-slate-50/40 overflow-y-auto">
          {/* 1. الرئيسية والسنوات الدراسية */}
          <div className="space-y-1">
            <div className="text-[11px] font-extrabold text-slate-500 px-2 mb-1">
              الواجهة والسنوات الدراسية
            </div>

            <button
              type="button"
              onClick={() => handleSelectSection('home')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'home'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" />
                <span>الصفحة الرئيسية والمخبر</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-60" />
            </button>

            {levels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleSelectSection(lvl.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${lvl.bg} ${
                  activeSection === lvl.id
                    ? 'bg-white border border-teal-300 text-teal-900 shadow-2xs font-extrabold'
                    : 'text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 text-right">
                  {lvl.icon}
                  <span>{lvl.title}</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>

          {/* 2. التنظيم المدرسي والموارد */}
          <div className="space-y-1 pt-2 border-t border-slate-200/80">
            <div className="text-[11px] font-extrabold text-slate-500 px-2 mb-1">
              التنظيم المدرسي والموارد
            </div>

            <button
              type="button"
              onClick={() => handleSelectSection('logbook')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'logbook'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpenCheck className="w-4 h-4" />
                <span>الدفتر الرقمي ودفتر النصوص</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-60" />
            </button>

            {onOpenTimetable && (
              <button
                type="button"
                onClick={() => {
                  onOpenTimetable();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-900 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-sky-700" />
                  <span>استعمال الزمن</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectSection('database')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'database'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4" />
                <span>الموارد التعليمية وقاعدة البيانات</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-60" />
            </button>
          </div>

          {/* 3. التقويم والمساعد الذكي */}
          <div className="space-y-1 pt-2 border-t border-slate-200/80">
            <div className="text-[11px] font-extrabold text-slate-500 px-2 mb-1">
              التقويم والمساعد الذكي
            </div>

            <button
              type="button"
              onClick={() => { onOpenTool('correction'); onClose(); }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                <span>الاختبارات ومذكرة التصحيح</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => { onOpenTool('assistant'); onClose(); }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MessagesSquare className="w-4 h-4 text-teal-700" />
                <span>المساعد الذكي</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* 4. إدارة الأستاذ ومعلومات المنصة */}
          <div className="space-y-1 pt-2 border-t border-slate-200/80">
            <div className="text-[11px] font-extrabold text-slate-500 px-2 mb-1">
              إدارة الأستاذ والدعم
            </div>

            <button
              type="button"
              onClick={() => handleSelectSection('settings')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>إعدادات الحساب والخاتم</span>
              </div>
              <ChevronLeft className="w-4 h-4 opacity-60" />
            </button>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => { onClose(); onOpenInfoModal('about'); }}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-sky-700" />
                <span>حول المنصة</span>
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onOpenInfoModal('guide'); }}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span>الدليل</span>
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onOpenInfoModal('contact'); }}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-slate-600" />
                <span>تواصل</span>
              </button>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-white text-center text-[11px] text-slate-500">
          تصميم وتطوير: <strong className="text-slate-800">الأستاذ بغداد الطيب</strong>
        </div>
      </div>
    </div>
  );
};
