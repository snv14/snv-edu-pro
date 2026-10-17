import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  X, 
  Check, 
  RotateCcw, 
  Sparkles, 
  CalendarDays, 
  Clock, 
  AlertCircle,
  FileCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  SchoolCalendarSettings, 
  getDefaultCalendarSettings, 
  alignToSunday, 
  computeWeekRange,
  deriveDefaultSchoolEntryDate,
  deriveSchoolYearFromDate,
  ARABIC_MONTH_NAMES 
} from '../utils/annualDistributionDateUtils';

interface CalendarAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SchoolCalendarSettings;
  onApply: (newSettings: SchoolCalendarSettings, syncWithLogbook: boolean) => void;
  onReset: () => void;
  totalWeeks?: number;
}

export const CalendarAdjustmentModal: React.FC<CalendarAdjustmentModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onApply,
  onReset,
  totalWeeks = 34,
}) => {
  const [settings, setSettings] = useState<SchoolCalendarSettings>(currentSettings);
  const [syncWithLogbook, setSyncWithLogbook] = useState(true);
  const [showAllWeeksPreview, setShowAllWeeksPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const startSunday = alignToSunday(settings.startDate);

  // حساب التواريخ المحسوبة للفترات الرئيسية للعرض الفوري
  const autumnRange = computeWeekRange(startSunday, settings.holidays.autumnWeek - 1);
  const winterRange1 = computeWeekRange(startSunday, settings.holidays.winterWeeks[0] - 1);
  const winterRange2 = computeWeekRange(startSunday, settings.holidays.winterWeeks[1] - 1);
  const springRange1 = computeWeekRange(startSunday, settings.holidays.springWeeks[0] - 1);
  const springRange2 = computeWeekRange(startSunday, settings.holidays.springWeeks[1] - 1);

  const exam1Range = computeWeekRange(startSunday, settings.exams.exam1Week - 1);
  const exam2Range = computeWeekRange(startSunday, settings.exams.exam2Week - 1);
  const exam3Range = computeWeekRange(startSunday, settings.exams.exam3Week - 1);

  const handlePresetYear = (yearStr: string, dateStr: string) => {
    setSettings((prev) => ({
      ...prev,
      schoolYear: yearStr,
      startDate: dateStr,
    }));
  };

  const handleSchoolYearChange = (yearStr: string) => {
    const derivedDate = deriveDefaultSchoolEntryDate(yearStr);
    setSettings((prev) => ({
      ...prev,
      schoolYear: yearStr,
      startDate: derivedDate || prev.startDate,
    }));
  };

  const handleStartDateChange = (dateStr: string) => {
    const derivedYear = deriveSchoolYearFromDate(dateStr);
    setSettings((prev) => ({
      ...prev,
      startDate: dateStr,
      schoolYear: derivedYear || prev.schoolYear,
    }));
  };

  const handleSave = () => {
    onApply(settings, syncWithLogbook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0d544c] via-[#106b61] to-[#147a6f] text-white p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-md">
              <CalendarDays size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">تعديل تواريخ التدرج السنوي والرزنامة الرسمية</h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                ضبط تاريخ الدخول المدرسي، العطل المدرسية، وفترات الاختبارات مع التحديث التلقائي لكافة أسابيع التدرج
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fafbfa]">

          {/* 1. قسم الدخول المدرسي */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>1. تاريخ الدخول المدرسي (انطلاق الموسم الدراسي)</span>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                يبدأ الأسبوع بالأحد وينتهي بالخميس
              </span>
            </div>

            {/* أزرار سريعة للمواسم الدراسية */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">اختيار سريع للموسم الوزاري المعتمد:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePresetYear('2024-2025', '2024-09-22')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col cursor-pointer ${
                    settings.startDate === '2024-09-22'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-800">موسم 2024 - 2025</span>
                  <span className="text-sm font-black mt-0.5">22 سبتمبر 2024</span>
                  <span className="text-[11px] text-gray-500 mt-1">تاريخ الدخول الرسمي السابق</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetYear('2025-2026', '2025-09-21')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col cursor-pointer ${
                    settings.startDate === '2025-09-21'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-800">موسم 2025 - 2026</span>
                  <span className="text-sm font-black mt-0.5">21 سبتمبر 2025</span>
                  <span className="text-[11px] text-gray-500 mt-1">تاريخ الدخول المحتمل القادم</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetYear('2026-2027', '2026-09-20')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col cursor-pointer ${
                    settings.startDate === '2026-09-20'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-800">موسم 2026 - 2027</span>
                  <span className="text-sm font-black mt-0.5">20 سبتمبر 2026</span>
                  <span className="text-[11px] text-gray-500 mt-1">تاريخ مستقبلي</span>
                </button>
              </div>
            </div>

            {/* إدخال يدوي للتاريخ والسنة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  تاريخ بداية الأسبوع الأول (أحد الدخول المدرسي):
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={settings.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full border-2 border-emerald-300 rounded-xl px-3 py-2 text-sm font-black text-gray-900 bg-emerald-50/40 focus:bg-white focus:border-emerald-600 outline-none transition"
                  />
                </div>
                <div className="text-[11px] text-emerald-800 font-bold mt-1.5 flex items-center gap-1">
                  <span>المحاذاة المعتمدة:</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded">
                    الأحد {startSunday.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  تسمية السنة الدراسية:
                </label>
                <input
                  type="text"
                  value={settings.schoolYear}
                  onChange={(e) => handleSchoolYearChange(e.target.value)}
                  placeholder="مثال: 2024-2025"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:border-emerald-600 outline-none transition"
                />
                <span className="text-[11px] text-gray-500 mt-1.5 block">
                  تتغير التواريخ وتترابط تلقائياً فور كتابة أو اختيار السنة الدراسية
                </span>
              </div>
            </div>
          </div>

          {/* 2. قسم العطل المدرسية الرسمية */}
          <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-amber-950 font-black text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>2. رزنامة العطل المدرسية الرسمية (الخريف، الشتاء، الربيع)</span>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                محسوبة تلقائياً حسب ترتيب الأسابيع
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* عطلة الخريف */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 text-xs">🍂 عطلة الخريف</span>
                  <span className="text-[11px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded">
                    الأسبوع {settings.holidays.autumnWeek}
                  </span>
                </div>
                <div className="bg-white border border-amber-200 rounded-lg p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-bold">التاريخ المحسوب:</div>
                  <div className="text-sm font-black text-amber-900 mt-0.5">
                    {autumnRange.datesStr} ({autumnRange.monthName})
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 block">رقم الأسبوع في التدرج:</label>
                  <input
                    type="number"
                    min={1}
                    max={totalWeeks}
                    value={settings.holidays.autumnWeek}
                    onChange={(e) => setSettings({
                      ...settings,
                      holidays: { ...settings.holidays, autumnWeek: Number(e.target.value) || 6 }
                    })}
                    className="w-full border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                  />
                </div>
              </div>

              {/* عطلة الشتاء */}
              <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sky-950 text-xs">❄️ عطلة الشتاء (أسبوعان)</span>
                  <span className="text-[11px] font-bold bg-sky-200/80 text-sky-950 px-2 py-0.5 rounded">
                    الأسابيع {settings.holidays.winterWeeks[0]} و {settings.holidays.winterWeeks[1]}
                  </span>
                </div>
                <div className="bg-white border border-sky-200 rounded-lg p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-bold">التاريخ المحسوب:</div>
                  <div className="text-sm font-black text-sky-950 mt-0.5">
                    {winterRange1.datesStr} و {winterRange2.datesStr}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block">الأسبوع 1:</label>
                    <input
                      type="number"
                      min={1}
                      max={totalWeeks}
                      value={settings.holidays.winterWeeks[0]}
                      onChange={(e) => setSettings({
                        ...settings,
                        holidays: {
                          ...settings.holidays,
                          winterWeeks: [Number(e.target.value) || 14, settings.holidays.winterWeeks[1]]
                        }
                      })}
                      className="w-full border border-sky-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block">الأسبوع 2:</label>
                    <input
                      type="number"
                      min={1}
                      max={totalWeeks}
                      value={settings.holidays.winterWeeks[1]}
                      onChange={(e) => setSettings({
                        ...settings,
                        holidays: {
                          ...settings.holidays,
                          winterWeeks: [settings.holidays.winterWeeks[0], Number(e.target.value) || 15]
                        }
                      })}
                      className="w-full border border-sky-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* عطلة الربيع */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-xs">🌸 عطلة الربيع (أسبوعان)</span>
                  <span className="text-[11px] font-bold bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded">
                    الأسابيع {settings.holidays.springWeeks[0]} و {settings.holidays.springWeeks[1]}
                  </span>
                </div>
                <div className="bg-white border border-emerald-200 rounded-lg p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-bold">التاريخ المحسوب:</div>
                  <div className="text-sm font-black text-emerald-950 mt-0.5">
                    {springRange1.datesStr} و {springRange2.datesStr}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block">الأسبوع 1:</label>
                    <input
                      type="number"
                      min={1}
                      max={totalWeeks}
                      value={settings.holidays.springWeeks[0]}
                      onChange={(e) => setSettings({
                        ...settings,
                        holidays: {
                          ...settings.holidays,
                          springWeeks: [Number(e.target.value) || 27, settings.holidays.springWeeks[1]]
                        }
                      })}
                      className="w-full border border-emerald-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block">الأسبوع 2:</label>
                    <input
                      type="number"
                      min={1}
                      max={totalWeeks}
                      value={settings.holidays.springWeeks[1]}
                      onChange={(e) => setSettings({
                        ...settings,
                        holidays: {
                          ...settings.holidays,
                          springWeeks: [settings.holidays.springWeeks[0], Number(e.target.value) || 28]
                        }
                      })}
                      className="w-full border border-emerald-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. قسم فترات الاختبارات الرسمية */}
          <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>3. رزنامة الاختبارات الفصلية الرسمية (الفصل الأول، الثاني، الثالث)</span>
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                تميز صفوف الاختبارات في الجدول
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* اختبارات الفصل الأول */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-950 text-xs">📝 اختبارات الفصل الأول</span>
                  <span className="text-[11px] font-bold bg-indigo-200/80 text-indigo-950 px-2 py-0.5 rounded">
                    الأسبوع {settings.exams.exam1Week}
                  </span>
                </div>
                <div className="bg-white border border-indigo-200 rounded-lg p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-bold">التاريخ المحسوب:</div>
                  <div className="text-sm font-black text-indigo-950 mt-0.5">
                    {exam1Range.datesStr} ({exam1Range.monthName})
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 block">رقم أسبوع الاختبارات:</label>
                  <input
                    type="number"
                    min={1}
                    max={totalWeeks}
                    value={settings.exams.exam1Week}
                    onChange={(e) => setSettings({
                      ...settings,
                      exams: { ...settings.exams, exam1Week: Number(e.target.value) || 11 }
                    })}
                    className="w-full border border-indigo-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                  />
                </div>
              </div>

              {/* اختبارات الفصل الثاني */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-950 text-xs">📝 اختبارات الفصل الثاني</span>
                  <span className="text-[11px] font-bold bg-purple-200/80 text-purple-950 px-2 py-0.5 rounded">
                    الأسبوع {settings.exams.exam2Week}
                  </span>
                </div>
                <div className="bg-white border border-purple-200 rounded-lg p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-bold">التاريخ المحسوب:</div>
                  <div className="text-sm font-black text-purple-950 mt-0.5">
                    {exam2Range.datesStr} ({exam2Range.monthName})
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 block">رقم أسبوع الاختبارات:</label>
                  <input
                    type="number"
                    min={1}
                    max={totalWeeks}
                    value={settings.exams.exam2Week}
                    onChange={(e) => setSettings({
                      ...settings,
                      exams: { ...settings.exams, exam2Week: Number(e.target.value) || 24 }
                    })}
                    className="w-full border border-purple-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                  />
                </div>
              </div>

              {/* اختبارات الفصل الثالث */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-950 text-xs">📝 اختبارات الفصل الثالث</span>
                  <span className="text-[11px] font-bold bg-rose-200/80 text-rose-950 px-2 py-0.5 rounded">
                    الأسبوع {settings.exams.exam3Week}
                  </span>
                </div>
                <div className="bg-white border border-rose-200 rounded-lg p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-bold">التاريخ المحسوب:</div>
                  <div className="text-sm font-black text-rose-950 mt-0.5">
                    {exam3Range.datesStr} ({exam3Range.monthName})
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 block">رقم أسبوع الاختبارات:</label>
                  <input
                    type="number"
                    min={1}
                    max={totalWeeks}
                    value={settings.exams.exam3Week}
                    onChange={(e) => setSettings({
                      ...settings,
                      exams: { ...settings.exams, exam3Week: Number(e.target.value) || 35 }
                    })}
                    className="w-full border border-rose-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. صيغة عرض التواريخ في الجدول */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
            <label className="text-xs font-bold text-gray-700 block">
              صيغة كتابة الأيام في خانة «التاريخ / الأسابيع»:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'short', title: '22-26', desc: 'صيغة المنشور الوزاري' },
                { id: 'spaced', title: '22 − 26', desc: 'متباعدة مع فاصلة' },
                { id: 'withMonth', title: '22 إلى 26 سبتمبر', desc: 'تفصيلية مع الشهر' },
                { id: 'isoShort', title: '22/09 - 26/09', desc: 'رقمية بالأشهر' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, dateFormat: fmt.id as any })}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    settings.dateFormat === fmt.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-2xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold'
                  }`}
                >
                  <div className="text-xs font-black">{fmt.title}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. معاينة حية لجدول الأسابيع المحسوبة (35 أسبوعاً) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAllWeeksPreview(!showAllWeeksPreview)}
                className="flex items-center gap-2 text-xs font-black text-gray-800 hover:text-emerald-700 transition cursor-pointer"
              >
                <CalendarDays size={16} className="text-emerald-600" />
                <span>معاينة حية فورية لجدول أسابيع التدرج ({totalWeeks} أسبوعاً)</span>
                {showAllWeeksPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <span className="text-[11px] font-bold text-gray-500">
                السنة: <strong className="text-emerald-800">{settings.schoolYear}</strong> | البداية: <strong className="text-emerald-800">{settings.startDate}</strong>
              </span>
            </div>

            {showAllWeeksPreview && (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 text-xs">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 border-b">الأسبوع</th>
                      <th className="p-2 border-b">الشهر</th>
                      <th className="p-2 border-b">التاريخ المحسوب (أحد - خميس)</th>
                      <th className="p-2 border-b">طبيعة الأسبوع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.from({ length: totalWeeks }, (_, idx) => {
                      const wNum = idx + 1;
                      const range = computeWeekRange(startSunday, idx, settings.dateFormat);
                      const isAutumn = wNum === settings.holidays.autumnWeek;
                      const isWinter = settings.holidays.winterWeeks.includes(wNum as any);
                      const isSpring = settings.holidays.springWeeks.includes(wNum as any);
                      const isExam1 = wNum === settings.exams.exam1Week;
                      const isExam2 = wNum === settings.exams.exam2Week;
                      const isExam3 = wNum === settings.exams.exam3Week;

                      let statusBadge = <span className="text-gray-600 font-normal">دراسة وبناء تعلمات</span>;
                      let rowBg = '';

                      if (isAutumn) {
                        statusBadge = <span className="bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded">🍂 {settings.holidays.autumnLabel}</span>;
                        rowBg = 'bg-amber-50/60 font-bold';
                      } else if (isWinter) {
                        statusBadge = <span className="bg-sky-100 text-sky-900 font-black px-2 py-0.5 rounded">❄️ {settings.holidays.winterLabel}</span>;
                        rowBg = 'bg-sky-50/60 font-bold';
                      } else if (isSpring) {
                        statusBadge = <span className="bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded">🌸 {settings.holidays.springLabel}</span>;
                        rowBg = 'bg-emerald-50/60 font-bold';
                      } else if (isExam1) {
                        statusBadge = <span className="bg-purple-100 text-purple-900 font-black px-2 py-0.5 rounded">📝 {settings.exams.exam1Label}</span>;
                        rowBg = 'bg-purple-50/60 font-bold';
                      } else if (isExam2) {
                        statusBadge = <span className="bg-indigo-100 text-indigo-900 font-black px-2 py-0.5 rounded">📝 {settings.exams.exam2Label}</span>;
                        rowBg = 'bg-indigo-50/60 font-bold';
                      } else if (isExam3) {
                        statusBadge = <span className="bg-rose-100 text-rose-900 font-black px-2 py-0.5 rounded">🏆 {settings.exams.exam3Label}</span>;
                        rowBg = 'bg-rose-50/60 font-bold';
                      }

                      return (
                        <tr key={wNum} className={`hover:bg-gray-50/80 ${rowBg}`}>
                          <td className="p-2 font-black text-gray-900">الأسبوع {wNum}</td>
                          <td className="p-2 font-bold text-gray-700">{range.monthName}</td>
                          <td className="p-2 font-mono font-bold text-emerald-900">{range.datesStr}</td>
                          <td className="p-2">{statusBadge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* خيار المزامنة مع دفتر النصوص */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="text-emerald-700 w-5 h-5 shrink-0" />
              <div>
                <span className="text-xs font-black text-emerald-950 block">
                  مزامنة تلقائية مع دفتر النصوص اليومي
                </span>
                <span className="text-[11px] text-emerald-800">
                  تحديث تاريخ الدخول والعطل في إعدادات دفتر النصوص لتتطابق تماماً مع التدرج السنوي
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={syncWithLogbook}
              onChange={(e) => setSyncWithLogbook(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded cursor-pointer accent-emerald-600 shrink-0"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            <RotateCcw size={14} /> استعادة التواريخ الافتراضية الرسمية
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-black rounded-xl hover:from-emerald-700 hover:to-teal-800 shadow-md transition cursor-pointer"
            >
              <Check size={16} /> تطبيق وتحديث التواريخ على كامل التدرج الآن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
