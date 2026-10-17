import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  CalendarDays,
  BookOpenCheck,
  UserCog,
  Database,
  Bot,
  Info,
  Mail,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  Sprout,
  TreePine,
  Mountain,
  Dna,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { MemoConfig } from '../types';
import designerPortraitImg from '../assets/images/designer_portrait_1790463396414.jpg';
import { getDesignerPhoto } from '../utils/designerPhoto';

interface PlatformNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenAssistant: () => void;
  onOpenInfoModal: (tab: 'about' | 'contact' | 'guide') => void;
  config: MemoConfig;
}

export const PlatformNavigationDrawer: React.FC<PlatformNavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
  onOpenAssistant,
  onOpenInfoModal,
  config,
}) => {
  const [designerPhoto, setDesignerPhoto] = useState<string>(() => getDesignerPhoto());

  useEffect(() => {
    const handleUpdated = (e: any) => {
      setDesignerPhoto(e.detail || getDesignerPhoto());
    };
    window.addEventListener('designer-photo-updated', handleUpdated);
    return () => window.removeEventListener('designer-photo-updated', handleUpdated);
  }, []);

  if (!isOpen) return null;

  const levels = [
    {
      id: '1am',
      title: 'السنة الأولى متوسط (1AM)',
      midan: 'الإنسان والصحة + الإنسان والمحيط',
      color: '#0284c7',
      icon: <Sprout className="w-4 h-4 text-sky-600" />,
      bg: 'hover:bg-sky-50',
    },
    {
      id: '2am',
      title: 'السنة الثانية متوسط (2AM)',
      midan: 'الإنسان والمحيط (الوسط الحي)',
      color: '#7c3aed',
      icon: <TreePine className="w-4 h-4 text-purple-600" />,
      bg: 'hover:bg-purple-50',
    },
    {
      id: '3am',
      title: 'السنة الثالثة متوسط (3AM)',
      midan: 'دينامية الأرض والجيولوجيا',
      color: '#ea580c',
      icon: <Mountain className="w-4 h-4 text-orange-600" />,
      bg: 'hover:bg-orange-50',
    },
    {
      id: '4am',
      title: 'السنة الرابعة متوسط (4AM - BEM)',
      midan: 'الإنسان والصحة والمناعة والوراثة',
      color: '#c2185b',
      icon: <Dna className="w-4 h-4 text-[#c2185b]" />,
      bg: 'hover:bg-pink-50',
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
        className="w-full max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-white/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Top Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-l from-[#0b3b36] via-[#0f766e] to-[#164e63] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-[15px] leading-tight">المنصة البيداغوجية الوطنية</h3>
                <p className="text-[11.5px] text-gray-300">علوم الطبيعة والحياة • متوسط</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11.5px] text-gray-300">
            <span>الموسم: <strong>{config.schoolYear}</strong></span>
            <span className="truncate max-w-[150px]">{config.teacherName || ''}</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-5 flex-1 bg-gradient-to-b from-white to-slate-50/90">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-2 mb-1.5">
              التنقل العام
            </div>

            <button
              type="button"
              onClick={() => handleSelectSection('home')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[13px] font-bold transition cursor-pointer ${
                activeSection === 'home'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4" />
                <span>الصفحة الرئيسية (المستويات)</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectSection('logbook')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[13px] font-bold transition cursor-pointer ${
                activeSection === 'logbook'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpenCheck className="w-4 h-4 text-emerald-600" />
                <span>الدفتر اليومي ودفتر النصوص</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectSection('settings')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[13px] font-bold transition cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCog className="w-4 h-4 text-gray-600" />
                <span>إعدادات الحساب والمؤسسة</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectSection('database')}
              className={'w-full flex items-center justify-between p-2.5 rounded-xl text-[13px] font-bold transition cursor-pointer ' + (
                activeSection === 'database'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-700" />
                <span>إدارة قاعدة البيانات</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Educational Levels */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
              <span>المذكرات وتدرج التعلمات</span>
              <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {levels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleSelectSection(lvl.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[12.5px] font-bold transition cursor-pointer ${lvl.bg} ${
                  activeSection === lvl.id
                    ? 'bg-gray-100 border border-gray-300 font-black'
                    : 'text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2.5 text-right">
                  {lvl.icon}
                  <div>
                    <div className="text-gray-900">{lvl.title}</div>
                    <div className="text-[10.5px] text-gray-500 font-normal">{lvl.midan}</div>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>

          {/* AI Assistant & Platform Hub */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-2 mb-1.5">
              أدوات وخدمات المنصة
            </div>

            {/* Smart AI Assistant Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAssistant();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-l from-teal-700 to-emerald-800 text-white font-black text-[13px] shadow-sm hover:opacity-95 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-200" />
                </div>
                <div className="text-right">
                  <div>المساعد البيداغوجي الذكي</div>
                  <div className="text-[10.5px] text-teal-100 font-medium">استشارات وتحضير التجارب</div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </button>

            {/* About Platform Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInfoModal('about');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-[12.5px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>حول المنصة البيداغوجية</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            {/* User Guide Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInfoModal('guide');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-[12.5px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>دليل الاستخدام</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            {/* Contact Us Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInfoModal('contact');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-[12.5px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>اتصل بنا والملاحظات</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Footer info & Designer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/90 space-y-2.5">
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs">
            <img 
              src={designerPhoto} 
              alt="مصمم المنصة الأستاذ بغداد الطيب" 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-600 shadow-md ring-2 ring-emerald-200 shrink-0" 
              referrerPolicy="no-referrer"
            />
            <div className="text-right">
              <span className="text-[11px] text-emerald-700 font-bold block leading-none mb-1">تصميم وتطوير المنصة</span>
              <strong className="text-gray-900 text-[15px] block font-black leading-tight">الأستاذ بغداد الطيب</strong>
            </div>
          </div>
          <div className="text-center text-[10.5px] text-gray-500 space-y-0.5">
            <p className="font-bold text-gray-700">
              المنصة الوطنية لأساتذة علوم الطبيعة والحياة
            </p>
            <p className="text-gray-400">مرحلة التعليم المتوسط — الجمهورية الجزائرية</p>
          </div>
        </div>
      </div>
    </div>
  );
};
