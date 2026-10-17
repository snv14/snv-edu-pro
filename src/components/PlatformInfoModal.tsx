import React, { useState } from 'react';
import {
  Info,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Send,
  CheckCircle2,
  HelpCircle,
  FileText,
  Layers,
  HeartHandshake,
  UserCheck,
  Camera,
  Upload,
} from 'lucide-react';
import designerPortraitImg from '../assets/images/designer_portrait_1790463396414.jpg';
import { getDesignerPhoto, saveDesignerPhoto } from '../utils/designerPhoto';

interface PlatformInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'about' | 'contact' | 'guide';
}

export const PlatformInfoModal: React.FC<PlatformInfoModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'about',
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'contact' | 'guide'>(defaultTab);
  const [designerPhoto, setDesignerPhoto] = useState<string>(() => getDesignerPhoto());

  React.useEffect(() => {
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

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'استفسار بيداغوجي / اقتراح تحسين',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setContactForm({ name: '', email: '', subject: 'استفسار بيداغوجي / اقتراح تحسين', message: '' });
      onClose();
    }, 2000);
  };

  return (
    <div
      id="platform-info-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-gray-200 bg-gradient-to-l from-slate-900 via-gray-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-[16px]">المنصة البيداغوجية الوطنية</h3>
              <p className="text-gray-300 text-[12px]">
                مادة علوم الطبيعة والحياة — مرحلة التعليم المتوسط
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`pb-2.5 px-4 text-[13px] font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'about'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>حول المنصة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-4 text-[13px] font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>دليل الاستخدام</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-2.5 px-4 text-[13px] font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'contact'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>اتصل بنا والملاحظات</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-right text-gray-800 text-[13.5px] leading-relaxed">
          {activeTab === 'about' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
                <div className="flex items-center gap-2 text-teal-950 font-black text-[15px]">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h4>رسالة المنصة وهدفها البيداغوجي</h4>
                </div>
                <p className="text-teal-900 leading-relaxed font-medium">
                  منصة رقمية بيداغوجية وطنية شاملة ومجانية، تم تصميمها خصيصاً لتيسير عمل **أساتذة مادة علوم الطبيعة والحياة** بمرحلة التعليم المتوسط في كافة أنحاء الجزائر.
                </p>
              </div>

              {/* بطاقة المصمم والمطور */}
              <div className="p-5 rounded-3xl bg-gradient-to-l from-emerald-50 via-white to-teal-50/60 border border-emerald-300 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-4 border-emerald-600 shadow-xl ring-4 ring-emerald-200/70 shrink-0 group">
                  <img
                    src={designerPhoto}
                    alt="مصمم ومطور المنصة الأستاذ بغداد الطيب"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <label
                    htmlFor="upload-designer-photo-modal"
                    className="absolute -bottom-1 -left-1 w-9 h-9 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition border-2 border-white hover:scale-110"
                    title="تحديث صورة المصمم الأصلية"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      id="upload-designer-photo-modal"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
                <div className="space-y-1.5 flex-1 text-center sm:text-right">
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>تصميم وبرمجة وتطوير المنصة</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-[16px] font-black text-gray-900">الأستاذ المطور: بغداد الطيب</h4>
                    <label
                      htmlFor="upload-designer-photo-modal"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 text-[11px] font-extrabold border border-emerald-300/60 cursor-pointer transition shadow-2xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>تحديث / رفع الصورة الأصلية</span>
                    </label>
                  </div>
                  <p className="text-[12.5px] text-gray-600 leading-relaxed font-medium">
                    مبادرة بيداغوجية وطنية لرقمنة وتطوير أدوات التحضير التربوي، المذكرات النموذجية، والدفتر اليومي لمادة علوم الطبيعة والحياة لجميع مستويات التعليم المتوسط بالجزائر.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-1">
                  <div className="font-extrabold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>تغطية المستويات الأربعة</span>
                  </div>
                  <p className="text-gray-600 text-[12.5px]">
                    مذكرات وتوزيعات سنوية مطابقة للمناهج ومخططات التدرج السنوية (1AM, 2AM, 3AM, 4AM).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-1">
                  <div className="font-extrabold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>نموذج مفصل ومدمج</span>
                  </div>
                  <p className="text-gray-600 text-[12.5px]">
                    إمكانية التبديل بنقرة زر واحدة بين النموذج المفصل (أستاذ + متعلم) والمدمج (نشاط الأستاذ الموحد).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-1">
                  <div className="font-extrabold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>تصدير وطباعة دقيقة</span>
                  </div>
                  <p className="text-gray-600 text-[12.5px]">
                    تصدير فوري إلى Word (.doc) أو طباعة مباشرة مع تخصيص الختم والتوقيع الرقمي.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-1">
                  <div className="font-extrabold text-gray-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-600" />
                    <span>متاح لجميع الأساتذة</span>
                  </div>
                  <p className="text-gray-600 text-[12.5px]">
                    حفظ محلي آمن في متصفح الأستاذ دون تعقيدات تسجيل أو قيود استخدام.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-[15px] text-gray-900">
                كيفية الاستفادة المثلى من المنصة:
              </h4>
              <ol className="space-y-3 list-decimal list-inside text-gray-700 font-medium">
                <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <strong className="text-gray-900">اختيار المستوى والمقطع:</strong> اختر السنة (1AM أو 2AM أو 3AM أو 4AM) من الصفحة الرئيسية أو الشريط الجانبي لتصفح الموارد.
                </li>
                <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <strong className="text-gray-900">اختيار نموذج المذكرة:</strong> يمكنك التبديل بين النموذج المدمج (للتدريس السريع) أو المفصل من أعلى المذكرة أو الشريط الجانبي.
                </li>
                <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <strong className="text-gray-900">الدفتر اليومي:</strong> سجل متابعة الحصص اليومية والأفواج التربوية واطبع بطاقات المتابعة الدورية.
                </li>
                <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <strong className="text-gray-900">المساعد البيداغوجي الذكي:</strong> استخدم المساعد الجانبي للحصول على مقترحات التجارب، الفرضيات وتوزيع التوقيت.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              {isSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-emerald-950 text-[16px]">تم إرسال رسالتكم بنجاح!</h4>
                  <p className="text-emerald-800 text-[13px]">
                    شكراً لتواصلكم زميلنا الأستاذ. سيتم أخذ مقترحكم بعين الاعتبار في التحديثات البيداغوجية القادمة.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 mb-1">
                        اسم ولقب الأستاذ(ة):
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="الأستاذ(ة)..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 mb-1">
                        البريد الإلكتروني / الولاية:
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="email@example.com / ولاية..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1">
                      موضوع الرسالة:
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1">
                      نص المقترح أو الاستفسار:
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="اكتب ملاحظاتك البيداغوجية، طلبات إضافة موارد، أو أي اقتراح يخدم أساتذة المادة..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-black text-[13.5px] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                    <span>إرسال الرسالة إلى إدارة المنصة</span>
                  </button>
                </form>
              )}

              <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between text-[11.5px] text-gray-500 gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية</span>
                </span>
                <span className="font-bold text-gray-700">مبادرة بيداغوجية مفتوحة لأساتذة المادة</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
