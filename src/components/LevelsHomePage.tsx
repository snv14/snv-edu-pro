import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CalendarDays,
  ChevronLeft,
  BookOpenCheck,
  UserCog,
  FileText,
  Dna,
  TreePine,
  Sprout,
  Globe2,
  Bot,
  Sparkles,
  Info,
  Layers,
  FileDown,
  Printer,
  Compass,
  Award,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Camera,
  Upload,
} from 'lucide-react';
import { LESSONS_DATA } from '../data/lessonsData';
import { MemoConfig } from '../types';
import card1amImg from '../assets/images/card_1am_plant_1790373274426.jpg';
import card2amImg from '../assets/images/card_2am_ecosystem_1790373285211.jpg';
import card3amImg from '../assets/images/card_3am_geology_1790373295369.jpg';
import card4amImg from '../assets/images/card_4am_human_1790373304110.jpg';
import designerPortraitImg from '../assets/images/designer_portrait_1790463396414.jpg';
import { getDesignerPhoto, saveDesignerPhoto } from '../utils/designerPhoto';

interface LevelsHomePageProps {
  onSelectYear: (level: '1am' | '2am' | '3am' | '4am', subTab?: 'memos' | 'distribution') => void;
  onOpenLogbook: () => void;
  onOpenSettings: () => void;
  onOpenAssistant?: () => void;
  onOpenInfoModal?: (tab: 'about' | 'guide' | 'contact') => void;
  config: MemoConfig;
  curriculumBackground?: string;
}

export const LevelsHomePage: React.FC<LevelsHomePageProps> = ({
  onSelectYear,
  onOpenLogbook,
  onOpenSettings,
  onOpenAssistant,
  onOpenInfoModal,
  config,
  curriculumBackground,
}) => {
  const [designerPhoto, setDesignerPhoto] = useState<string>(() => getDesignerPhoto());

  useEffect(() => {
    const handleUpdated = (e: any) => {
      setDesignerPhoto(e.detail || getDesignerPhoto());
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

  // تصميم بطاقات المستويات الدراسية وفق الهوية البصرية الجديدة المستوحاة من النموذج اللوحي
  const levelThemes = [
    {
      id: '1am' as const,
      image: card1amImg,
      title: '1 متوسط (السنة الأولى متوسط)',
      midanFocus: 'ميدان: الإنسان والصحة • التغذية عند النبات الأخضر والتحصل على الطاقة',
      gradient: 'linear-gradient(135deg, #74dfc7 0%, #6cdbc3 50%, #82e4ce 100%)',
      borderColor: 'border-[#5ecfb5]',
      titleColor: 'text-[#0d3b32]',
      subtitleColor: 'text-[#164e43]',
      statsColor: 'text-[#164e43]',
      primaryBtn: {
        bg: 'bg-[#d5faf2] hover:bg-white text-[#0d3b32]',
        border: 'border-[#a8ebd9]',
      },
      secondaryBtn: {
        bg: 'bg-white/40 hover:bg-white/80 text-[#0d3b32]',
        border: 'border-[#5ecfb5]/40',
      },
      hasBem: false,
    },
    {
      id: '2am' as const,
      image: card2amImg,
      title: '2 متوسط (السنة الثانية متوسط)',
      midanFocus: 'ميدان: الإنسان والمحيط • الوسط الحي • التكيف وإعمار الأوساط',
      gradient: 'linear-gradient(135deg, #cfb16e 0%, #c5a45b 50%, #d8be7e 100%)',
      borderColor: 'border-[#bfa157]',
      titleColor: 'text-[#3e2b0a]',
      subtitleColor: 'text-[#4a3512]',
      statsColor: 'text-[#4e3814]',
      primaryBtn: {
        bg: 'bg-[#fbf3d3] hover:bg-white text-[#451a03]',
        border: 'border-[#ecdba4]',
      },
      secondaryBtn: {
        bg: 'bg-white/40 hover:bg-white/80 text-[#451a03]',
        border: 'border-[#bfa157]/40',
      },
      hasBem: false,
    },
    {
      id: '3am' as const,
      image: card3amImg,
      title: '3 متوسط (السنة الثالثة متوسط)',
      midanFocus: 'ميدان: الإنسان والمحيط (الدينامية الداخلية للأرض والجيولوجيا)',
      gradient: 'linear-gradient(135deg, #96bdf7 0%, #88b3f4 50%, #a4c7f9 100%)',
      borderColor: 'border-[#78a3ea]',
      titleColor: 'text-[#132c57]',
      subtitleColor: 'text-[#1a3666]',
      statsColor: 'text-[#19396e]',
      primaryBtn: {
        bg: 'bg-[#e0efff] hover:bg-white text-[#172554]',
        border: 'border-[#bad7fc]',
      },
      secondaryBtn: {
        bg: 'bg-white/40 hover:bg-white/80 text-[#172554]',
        border: 'border-[#78a3ea]/40',
      },
      hasBem: false,
    },
    {
      id: '4am' as const,
      image: card4amImg,
      title: '4 متوسط (السنة الرابعة متوسط)',
      midanFocus: 'ميدان: الإنسان والصحة • التغذية والأيض الخلوي • الوراثة والجينات',
      gradient: 'linear-gradient(135deg, #78d2c6 0%, #6ecbbd 50%, #8ae0d4 100%)',
      borderColor: 'border-[#5fc1b1]',
      titleColor: 'text-[#12443c]',
      subtitleColor: 'text-[#1b4f47]',
      statsColor: 'text-[#1a534b]',
      primaryBtn: {
        bg: 'bg-[#fed8dc] hover:bg-white text-[#881337]',
        border: 'border-[#fbbbc5]',
      },
      secondaryBtn: {
        bg: 'bg-white/40 hover:bg-white/80 text-[#0f3d35]',
        border: 'border-[#5fc1b1]/40',
      },
      hasBem: true,
    },
  ];

  return (
    <div className="relative flex-1 min-h-full py-8 px-4 sm:px-6 lg:px-12 flex flex-col items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${curriculumBackground || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90'})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/85 to-slate-100/95" aria-hidden="true" />
      
      <div className="w-full max-w-6xl space-y-8 relative z-10">

        {/* Designer Signature Top Banner */}
        <div className="w-full glass-panel rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden bg-white/90 border border-emerald-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-50 rounded-tr-full opacity-60 pointer-events-none" />
          
          <div className="flex items-center gap-4 sm:gap-6 relative z-10 text-right">
            <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-3xl border-4 border-emerald-600 p-1 shadow-2xl ring-4 ring-emerald-300/80 bg-white shrink-0 group">
              <img 
                src={designerPhoto} 
                alt="مصمم المنصة الأستاذ بغداد الطيب" 
                className="w-full h-full rounded-2xl object-cover shadow-inner"
                referrerPolicy="no-referrer"
              />
              <label
                htmlFor="upload-designer-photo-banner"
                className="absolute -bottom-2 -left-2 w-10 h-10 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition border-2 border-white hover:scale-110"
                title="تحديث صورة المصمم الأصلية"
              >
                <Camera className="w-5 h-5" />
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
              <div className="text-[12px] sm:text-[13.5px] text-gray-500 font-bold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> تصميم وتطوير المنصة
              </div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">الأستاذ بغداد الطيب</h2>
                <label
                  htmlFor="upload-designer-photo-banner"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11.5px] font-bold border border-emerald-200/80 cursor-pointer transition shadow-2xs"
                  title="رفع صورتك بجودتها الكاملة"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>تغيير / تحديث الصورة</span>
                </label>
              </div>
              <div className="text-[12px] sm:text-[13px] font-extrabold text-emerald-800 bg-emerald-100/90 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mt-2 border border-emerald-300/60">
                <UserCog className="w-4 h-4" /> منصة المذكرة البيداغوجية لعلوم الطبيعة والحياة
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex relative z-10 text-left items-center gap-3">
            <div className="bg-emerald-50/80 px-5 py-3 rounded-2xl border border-emerald-200 shadow-2xs text-right">
              <div className="text-[13px] font-black text-emerald-950">منهاج الجيل الثاني المعتمد</div>
              <div className="text-[11.5px] font-medium text-emerald-700 mt-0.5">الجمهورية الجزائرية الديمقراطية الشعبية</div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            بطاقات المستويات الدراسية الأربعة (1، 2، 3، 4 متوسط)
           ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0f766e]/10 text-[#0f766e] flex items-center justify-center shadow-2xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                  المستويات الدراسية (التعليم المتوسط)
                </h2>
              </div>
              <p className="text-gray-600 text-[13.5px] mt-1 font-medium">
                اختر المستوى الدراسي لتصفح المذكرات البيداغوجية وتدرج التعلمات الخاص بكل ميدان
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-teal-800 font-bold shadow-2xs">
                مناهج الجيل الثاني الرسمية
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {levelThemes.map((lvl) => {
              const count = LESSONS_DATA.filter((l) => l.level === lvl.id).length;
              return (
                <div
                  key={lvl.id}
                  id={`card-select-level-${lvl.id}`}
                  style={{
                    backgroundImage: `url(${lvl.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  className={`relative overflow-hidden min-h-[310px] w-full text-right p-5 sm:p-7 rounded-3xl border ${lvl.borderColor} transition-all duration-300 shadow-md hover:shadow-xl group flex flex-col justify-end gap-5`}
                >
                  {/* صورة المستوى تظهر كخلفية كاملة للبطاقة فقط؛ لا تؤثر على قوالب المذكرات أو التدرج السنوي */}
                  <div
                    className="absolute inset-0 bg-gradient-to-l from-black/65 via-black/30 to-black/5 pointer-events-none"
                    aria-hidden="true"
                  />
                  {/* طبقة لونية خفيفة تحافظ على هوية كل مستوى دون إخفاء الصورة */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ background: lvl.gradient }}
                    aria-hidden="true"
                  />
                  {/* محتوى البطاقة النصي فوق الصورة */}
                  <div className="relative z-10 flex-1 flex flex-col justify-end h-full space-y-3.5 w-full">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-xl sm:text-2xl font-black ${lvl.titleColor}`}>
                          {lvl.title}
                        </h3>
                        {lvl.hasBem && (
                          <span className="text-[11.5px] font-black px-2.5 py-0.5 rounded-full border border-white/60 bg-white/30 text-[#0f3d35] shadow-2xs">
                            BEM
                          </span>
                        )}
                      </div>

                      <p className={`text-[12.5px] sm:text-[13px] font-bold mt-2 leading-relaxed ${lvl.subtitleColor}`}>
                        {lvl.midanFocus}
                      </p>
                    </div>

                    {/* إحصائيات المذكرات الرسمية والنموذج */}
                    <div className={`flex flex-wrap items-center gap-4 text-[12px] sm:text-[12.5px] font-black ${lvl.statsColor}`}>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 opacity-85" />
                        <span>{count} مذكرة معتمدة</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 opacity-85" />
                        <span>نموذج مفصل ومدمج</span>
                      </span>
                    </div>

                    {/* أزرار الإجراء: فتح المذكرات والتدرج السنوي بتصميم Pill المعتمد في النموذج اللوحي */}
                    <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectYear(lvl.id, 'memos')}
                        className={`px-5 py-2.5 rounded-full text-[13px] sm:text-[13.5px] font-black flex items-center gap-2 border transition-all shadow-xs hover:shadow-md cursor-pointer ${lvl.primaryBtn.bg} ${lvl.primaryBtn.border}`}
                      >
                        <BookOpenCheck className="w-4 h-4" />
                        <span>فتح المذكرات البيداغوجية</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectYear(lvl.id, 'distribution')}
                        className={`px-4 py-2 rounded-full text-[12px] font-bold flex items-center gap-1.5 border transition cursor-pointer ${lvl.secondaryBtn.bg} ${lvl.secondaryBtn.border}`}
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>التدرج السنوي</span>
                      </button>
                    </div>
                  </div>

                  {/* الصورة أصبحت خلفية كاملة للبطاقة، لذلك لا نكررها كصورة جانبية */}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            قسم المساعد البيداغوجي الذكي (AI Pedagogical Assistant)
           ═══════════════════════════════════════════════════════════════ */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-l from-teal-900 via-teal-800 to-emerald-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>مساعد بيداغوجي متخصص في منهاج علوم الطبيعة والحياة</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">
                المساعد الذكي للأستاذ في التحضير والتقويم
              </h3>
              <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
                استشر المساعد الذكي في صياغة الفرضيات، وضعيات الانطلاق، تكييف النشاطات التعليمية،
                واقتراح بروتوكولات تجريبية مطابقة للتوجيهات البيداغوجية الرسمية لوزارة التربية الوطنية.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-medium">✓ صياغة المشكل العلمي</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-medium">✓ اقتراح استراتيجيات تعليمية</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-medium">✓ تحليل النشاطات التجريبية</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-medium">✓ معايير التقويم البيداغوجي</span>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                id="home-open-assistant-btn"
                onClick={onOpenAssistant}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-teal-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Bot className="w-5 h-5 text-teal-950" />
                <span>فتح المساعد الذكي الآن</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            قسم معلومات وميزات المنصة البيداغوجية
           ═══════════════════════════════════════════════════════════════ */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-700" />
                <span>حول منصة المذكرة البيداغوجية</span>
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">
                بيئة عمل متكاملة مخصصة لأساتذة مادة علوم الطبيعة والحياة بمرحلة التعليم المتوسط
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenInfoModal && onOpenInfoModal('about')}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                نبذة تعريفية
              </button>
              <button
                type="button"
                onClick={() => onOpenInfoModal && onOpenInfoModal('guide')}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                دليل الاستخدام
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="font-black text-sm text-gray-900">مطابقة المناهج الرسمية</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                مذكرات وتدرجات مبنية حرفياً على وثائق منهاج الجيل الثاني، الأدلة البيداغوجية والمخططات السنوية الاستثنائية.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <FileDown className="w-4 h-4" />
              </div>
              <h4 className="font-black text-sm text-gray-900">تصدير Word و PDF</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                تصدير احترافي متوافق تماماً مع جداول Microsoft Word وطباعة نظيفة جاهزة للمصادقة والتأشيرة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-black text-sm text-gray-900">تزامن وحفظ آمن</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                حفظ التعديلات محلياً وسحابياً عبر حساب Google، مع الحفاظ الكامل على خصوصية بيانات الأستاذ والمؤسسة.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
