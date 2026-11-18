import React, { useState } from 'react';
import {
  Settings,
  GraduationCap,
  Stamp,
  Save,
  RotateCcw,
  CheckCircle2,
  Upload,
  Trash2,
  ShieldCheck,
  Database,
  AlertTriangle,
  PenTool,
} from 'lucide-react';
import { MemoConfig } from '../types';
import { TeacherOfficialStamp } from './TeacherOfficialStamp';
import { getDesignerPhoto, saveDesignerPhoto, resetDesignerPhoto } from '../utils/designerPhoto';
import { getFirebaseConfigStatus } from '../firebase';
import { useHandwritingStyle } from '../hooks/useHandwritingStyle';
import { HANDWRITING_FONTS, PEN_ROLE_META, PenRole } from '../services/handwritingStyle';
import { HandwritingStylePanel } from './HandwritingStylePanel';

interface AccountSettingsProps {
  config: MemoConfig;
  setConfig: React.Dispatch<React.SetStateAction<MemoConfig>>;
  showToast: (msg: string) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  config,
  setConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState<MemoConfig>({ ...config });
  const [stampColor, setStampColor] = useState<'blue' | 'purple' | 'red' | 'teal'>('blue');
  const [isSaved, setIsSaved] = useState(false);
  const [isHwPanelOpen, setIsHwPanelOpen] = useState(false);
  const [designerPhoto, setDesignerPhoto] = useState<string>(() => getDesignerPhoto());
  const fbStatus = React.useMemo(() => getFirebaseConfigStatus(), []);
  const { settings: hwStyle, resetToOriginal, restoreDefaultHandwriting } = useHandwritingStyle();

  React.useEffect(() => {
    const handleUpdated = (e: any) => {
      setDesignerPhoto(e.detail || getDesignerPhoto());
    };
    window.addEventListener('designer-photo-updated', handleUpdated);
    return () => window.removeEventListener('designer-photo-updated', handleUpdated);
  }, []);

  const handleDesignerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        saveDesignerPhoto(result);
        setDesignerPhoto(result);
        showToast('تم تحديث وتثبيت صورتك الأصلية بملامحك الحقيقية 100% بنجاح');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDesignerPhoto = () => {
    resetDesignerPhoto();
    setDesignerPhoto(getDesignerPhoto());
    showToast('تمت استعادة الصورة الافتراضية');
  };

  const handleChange = (field: keyof MemoConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClassesChange = (val: string) => {
    const classes = val
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, assignedClasses: classes }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(formData);

    // Session storage: will be cleared automatically when closing browser/session
    try {
      sessionStorage.setItem('algeria_sciences_session_config', JSON.stringify(formData));
      if ((window as any).syncToCloud) (window as any).syncToCloud('config', formData);
    } catch {
      // ignore
    }

    setIsSaved(true);
    showToast('تم تطبيق معلومات وختم الأستاذ بنجاح على جميع عناصر المنصة');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, teacherStamp: result }));
      showToast('تم تحميل صورة الختم / التوقيع المخصص');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStamp = () => {
    setFormData((prev) => ({ ...prev, teacherStamp: null }));
    showToast('تمت العودة إلى الختم الرقمي المولد آلياً');
  };

  const handleResetSession = () => {
    if (confirm('هل ترغب في مسح بيانات الجلسة الحالية واسترجاع القيم الافتراضية؟')) {
      try {
        sessionStorage.removeItem('algeria_sciences_session_config');
        localStorage.removeItem('algeria_sciences_config');
      } catch {
        // ignore
      }
      const resetConfig: MemoConfig = {
        level: '4am',
        schoolName: '',
        directorate: '',
        teacherName: '',
        teacherGrade: 'أستاذ التعليم المتوسط',
        schoolYear: '2025 - 2026',
        memoNumber: '01',
        principalName: '',
        inspectorName: '',
        signDate: new Date().toISOString().split('T')[0],
        teacherStamp: null,
        assignedClasses: ['4 م 1', '3 م 1', '2 م 1', '2 م 2', '1 م 1'],
        weeklyHours: 18,
      };
      setFormData(resetConfig);
      setConfig(resetConfig);
      showToast('تم مسح البيانات وتفريغ الجلسة');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-3 sm:px-4" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              إعدادات الحساب والهوية البيداغوجية
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تُنقل هذه المعلومات والختم تلقائياً إلى المذكرات والتدرج والدفتر اليومي
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-[11.5px] font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>حفظ محلي آمن للجلسة مع دعم المزامنة السحابية</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* 1. Main Teacher & School Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-700" />
              <h3 className="font-extrabold text-[15px] text-gray-900">
                المعلومات البيداغوجية الأساسية
              </h3>
            </div>
            <span className="text-[11px] font-bold text-gray-400">
              الحقول المعلمة بـ (*) مطلوبة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teacher Name */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                اسم ولقب الأستاذ(ة) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.teacherName}
                onChange={(e) => handleChange('teacherName', e.target.value)}
                placeholder="مثال: الأستاذ(ة) فلان بن فلان"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 bg-white font-semibold text-gray-900"
              />
            </div>

            {/* School Name */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                اسم المتوسطة (المؤسسة التعليمية) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                placeholder="متوسطة الشهيد ..."
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 bg-white font-semibold text-gray-900"
              />
            </div>

            {/* Directorate */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                مديرية التربية للولاية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.directorate}
                onChange={(e) => handleChange('directorate', e.target.value)}
                placeholder="مديرية التربية لولاية ..."
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 bg-white font-semibold text-gray-900"
              />
            </div>

            {/* Teacher Grade */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                الرتبة المهنية
              </label>
              <select
                value={formData.teacherGrade || 'أستاذ التعليم المتوسط'}
                onChange={(e) => handleChange('teacherGrade', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 bg-white font-medium text-gray-900"
              >
                <option value="أستاذ التعليم المتوسط">أستاذ التعليم المتوسط</option>
                <option value="أستاذ رئيسي للتعليم المتوسط">أستاذ رئيسي للتعليم المتوسط</option>
                <option value="أستاذ مكون في التعليم المتوسط">أستاذ مكون في التعليم المتوسط</option>
                <option value="أستاذ متعاقد / مستخلف">أستاذ متعاقد / مستخلف</option>
              </select>
            </div>

            {/* Assigned Classes */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12.5px] font-bold text-gray-700">
                  الأقسام والأفواج المسندة (تُنقل آلياً للدفتر اليومي)
                </label>
                <span className="text-[11px] text-teal-700 font-bold">
                  افصل بين الأقسام بفاصلة (،)
                </span>
              </div>
              <input
                type="text"
                value={formData.assignedClasses ? formData.assignedClasses.join('، ') : ''}
                onChange={(e) => handleClassesChange(e.target.value)}
                placeholder="مثال: 4 م 1، 4 م 2، 3 م 1، 2 م 2، 1 م 1"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 bg-white font-medium text-gray-900"
              />
              {formData.assignedClasses && formData.assignedClasses.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11.5px] text-gray-500 font-medium">معاينة الأقسام في الدفتر:</span>
                  {formData.assignedClasses.map((cls) => (
                    <span
                      key={cls}
                      className="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[11.5px] font-black"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Hours */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                عدد الساعات الأسبوعية (الحجم الساعي)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.weeklyHours || 18}
                  onChange={(e) => handleChange('weeklyHours', parseInt(e.target.value) || 18)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 bg-white font-bold text-gray-900 pl-12"
                />
                <span className="absolute left-3.5 top-2.5 text-[12px] text-gray-500 font-bold">
                  ساعة/أسبوع
                </span>
              </div>
            </div>

            {/* School Year */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                الموسم الدراسي
              </label>
              <input
                type="text"
                value={formData.schoolYear}
                onChange={(e) => handleChange('schoolYear', e.target.value)}
                placeholder="2025 - 2026"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 bg-white font-medium text-gray-900"
              />
            </div>

            {/* Principal Name (مدير المؤسسة) */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                مدير(ة) المؤسسة التعليمية
              </label>
              <input
                type="text"
                value={formData.principalName || ''}
                onChange={(e) => handleChange('principalName', e.target.value)}
                placeholder="اسم ولقب مدير المؤسسة"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 bg-white font-medium text-gray-900"
              />
            </div>

            {/* Inspector Name (المفتش) */}
            <div>
              <label className="block text-[12.5px] font-bold text-gray-700 mb-1">
                مفتش(ة) مادة علوم الطبيعة والحياة
              </label>
              <input
                type="text"
                value={formData.inspectorName || ''}
                onChange={(e) => handleChange('inspectorName', e.target.value)}
                placeholder="اسم ولقب مفتش المقاطعة"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-teal-700 bg-white font-medium text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* 2. Auto-Generated Official Stamp Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <h3 className="font-extrabold text-[15px] text-slate-900">
                  الختم الرسمي وتوقيع الأستاذ
                </h3>
                <p className="text-[11.5px] text-slate-500">
                  يوضع تلقائياً في أسفل المذكرات، التدرج السنوي، والدفتر اليومي
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Auto Stamp Preview */}
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100 mb-2">
                <TeacherOfficialStamp
                  config={formData}
                  size="md"
                  color={stampColor}
                />
              </div>
              <div className="text-[11.5px] font-bold text-slate-700">
                معاينة الختم باسم: <span className="text-teal-800">{formData.teacherName || '—'}</span>
              </div>
            </div>

            {/* Stamp Options & Custom Upload */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  لون حبر الختم المولد:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'blue', label: 'أزرق رسمي', bg: 'bg-blue-600' },
                    { id: 'teal', label: 'أخضر مائي', bg: 'bg-teal-700' },
                    { id: 'purple', label: 'بنفسجي', bg: 'bg-purple-700' },
                    { id: 'red', label: 'عنابي', bg: 'bg-rose-700' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setStampColor(c.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11.5px] font-bold transition cursor-pointer whitespace-nowrap ${
                        stampColor === c.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  أو تحميل صورة ختم ممسوح ضوئياً (اختياري):
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[12px] font-bold transition">
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span>رفع صورة ختم مخصص</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.teacherStamp && (
                    <button
                      type="button"
                      onClick={handleRemoveStamp}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-[12px] font-bold hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إلغاء الرفع واستخدام المولد</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Compact Designer Portrait & Cloud Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-4">
            <img
              src={designerPhoto}
              alt="صورة المصمم الأصلية"
              className="w-16 h-16 rounded-2xl border-2 border-emerald-600 object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">صورة مصمم المنصة</h3>
                <p className="text-[11.5px] text-slate-500">الأستاذ بغداد الطيب</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <label
                  htmlFor="settings-designer-photo-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11.5px] font-bold cursor-pointer transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>تحديث الصورة</span>
                  <input
                    type="file"
                    id="settings-designer-photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDesignerPhotoUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleResetDesignerPhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11.5px] font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>استعادة</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700 shrink-0" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  المزامنة السحابية (Firebase)
                </h3>
              </div>
              {fbStatus.isValid ? (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  متصل
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  تخزين محلي
                </span>
              )}
            </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            تعمل المنصة بالتخزين المحلي الآمن في المتصفح لجميع البيانات.
            {fbStatus.isValid ? (
              <span className="text-emerald-700 font-bold block mt-1">
                تم تهيئة Firebase بنجاح للمزامنة التلقائية عبر السحابة.
              </span>
            ) : (
              <span className="text-slate-500 block mt-1">
                المتغيرات الناقصة للمزامنة السحابية: <span className="text-amber-700 font-mono text-[11px] font-bold">{fbStatus.missingVars.join('، ')}</span>
              </span>
            )}
          </p>
          </div>
        </div>

        {/* 4. Handwriting & 6-Pen Notebook Style Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-700 shrink-0" />
              <h3 className="font-extrabold text-[15px] text-slate-900">
                أسلوب الكتابة اليدوية والأقلام الملونة في الكراس
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${hwStyle.enabled ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-600'}`}>
                {hwStyle.enabled ? `مفعّل (${HANDWRITING_FONTS[hwStyle.fontId]?.label || hwStyle.fontId})` : 'التنسيق الأصلي'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              تخصيص خط اليد الطبيعي وألوان الأقلام الستة (الأزرق، الأحمر، الأخضر، الأسود، البنفسجي، البرتقالي) عبر المذكرات، الدفتر اليومي، التصدير PDF وWord.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {(['titleBlue', 'subRed', 'defGreen', 'bodyBlack', 'termPurple', 'noteOrange'] as PenRole[]).map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-[10.5px] font-bold text-slate-700"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hwStyle.palette[role] }} />
                  {PEN_ROLE_META[role].shortLabel}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsHwPanelOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black transition cursor-pointer shadow-xs"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>تخصيص الخط والأقلام</span>
            </button>
            {hwStyle.enabled ? (
              <button
                type="button"
                onClick={() => {
                  resetToOriginal();
                  showToast('تمت استعادة التنسيق الأصلي للمنصة');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>التنسيق الأصلي</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  restoreDefaultHandwriting();
                  showToast('تم تفعيل أسلوب الكتابة اليدوية بالأقلام الستة');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
              >
                <span>تفعيل خط اليد</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={handleResetSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 text-[12px] font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مسح بيانات الجلسة وإعادة الضبط</span>
          </button>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-emerald-600 text-[12px] font-black flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                تم الحفظ والتطبيق!
              </span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-[13px] font-black transition shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق على كافة المنصة</span>
            </button>
          </div>
        </div>
      </form>

      <HandwritingStylePanel
        isOpen={isHwPanelOpen}
        onClose={() => setIsHwPanelOpen(false)}
        showToast={showToast}
      />
    </div>
  );
};
