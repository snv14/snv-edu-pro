import React, { useRef, useState, useEffect } from 'react';
import { Calendar, Hash, Stamp, Upload, GraduationCap, Building2, Layers, Columns, BookmarkCheck, Copy, Check, CalendarDays } from 'lucide-react';
import { LessonMemo, MemoConfig } from '../types';
import { LEVELS, MAQATI_BY_LEVEL } from '../data/lessonsData';
import { 
  deriveDefaultSchoolEntryDate, 
  deriveSchoolYearFromDate, 
  getDefaultCalendarSettings, 
  syncCalendarToAllLevels,
  ANNUAL_STORAGE_KEY 
} from '../utils/annualDistributionDateUtils';

interface SidebarControlsProps {
  selectedLevel: '1am' | '2am' | '3am' | '4am';
  setSelectedLevel: (v: '1am' | '2am' | '3am' | '4am') => void;
  selectedMidan: string;
  setSelectedMidan: (v: string) => void;
  selectedMaqta: string;
  setSelectedMaqta: (v: string) => void;
  selectedMawrid: string;
  setSelectedMawrid: (v: string) => void;
  selectedTa3alom: string;
  setSelectedTa3alom: (v: string) => void;
  currentLesson: LessonMemo | null;
  activeActivities: boolean[];
  onToggleActivity: (index: number) => void;
  onSelectAllActivities: () => void;
  onDeselectAllActivities: () => void;
  config: MemoConfig;
  setConfig: React.Dispatch<React.SetStateAction<MemoConfig>>;
  mawridList: string[];
  ta3alomList: string[];
  showToast: (msg: string) => void;
  maqatiList?: string[];
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  selectedLevel,
  setSelectedLevel,
  selectedMidan,
  selectedMaqta,
  setSelectedMaqta,
  selectedMawrid,
  setSelectedMawrid,
  selectedTa3alom,
  setSelectedTa3alom,
  currentLesson,
  activeActivities,
  onToggleActivity,
  onSelectAllActivities,
  onDeselectAllActivities,
  config,
  setConfig,
  mawridList,
  ta3alomList,
  showToast,
  maqatiList: providedMaqatiList,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedIrsae, setCopiedIrsae] = useState(false);

  const handleCopyIrsae = () => {
    if (!currentLesson?.irsae) return;
    navigator.clipboard.writeText(currentLesson.irsae);
    setCopiedIrsae(true);
    showToast('تم نسخ إرساء الموارد بنجاح إلى الحافظة');
    setTimeout(() => setCopiedIrsae(false), 2000);
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({ ...prev, teacherStamp: reader.result as string }));
      showToast('تم رفع ختم الأستاذ بنجاح');
    };
    reader.readAsDataURL(file);
  };

  const maqatiList = providedMaqatiList || MAQATI_BY_LEVEL[selectedLevel] || [];

  return (
    <aside id="sidebar-controls" className="w-full lg:w-[360px] bg-white border-l border-gray-200 lg:h-screen lg:sticky lg:top-0 overflow-y-auto shrink-0 z-10">
      <div className="p-5 border-b border-gray-100 bg-[#fafafa]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#c2185b] flex items-center justify-center text-white font-extrabold shadow-sm">
            م
          </div>
          <h1 className="font-extrabold text-[17px] text-[#c2185b]">
            المذكرة البيداغوجية الرقمية
          </h1>
        </div>
        <p className="text-[12px] text-gray-500">
          مادة علوم الطبيعة والحياة - التعليم المتوسط
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* 1- المستوى الدراسي المحدد حسب الميدان */}
        <div
          className={`p-3.5 rounded-xl border ${
            selectedLevel === '1am'
              ? 'bg-sky-50/70 border-sky-200'
              : selectedLevel === '2am'
              ? 'bg-purple-50/70 border-purple-200'
              : selectedLevel === '3am'
              ? 'bg-teal-50/80 border-teal-300'
              : 'bg-rose-50/70 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-gray-600 flex items-center gap-1.5">
              <GraduationCap
                className={`w-4 h-4 ${
                  selectedLevel === '1am'
                    ? 'text-sky-600'
                    : selectedLevel === '2am'
                    ? 'text-purple-600'
                    : selectedLevel === '3am'
                    ? 'text-teal-700'
                    : 'text-[#c2185b]'
                }`}
              />
              المستوى الدراسي:
            </span>
            <span
              className={`text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs ${
                selectedLevel === '1am'
                  ? 'bg-sky-600'
                  : selectedLevel === '2am'
                  ? 'bg-purple-600'
                  : selectedLevel === '3am'
                  ? 'bg-teal-700 border border-amber-300/40'
                  : 'bg-[#c2185b]'
              }`}
            >
              {selectedLevel.toUpperCase()}
            </span>
          </div>
          <p className="text-[14px] font-black text-gray-900 mt-1">
            {selectedLevel === '4am'
              ? 'السنة الرابعة متوسط (BEM)'
              : selectedLevel === '3am'
              ? 'السنة الثالثة متوسط'
              : selectedLevel === '2am'
              ? 'السنة الثانية متوسط'
              : 'السنة الأولى متوسط'}
          </p>
        </div>

        {/* نموذج تخطيط المذكرة (مفصل أو مدمج بدون خانة نشاط المتعلم) */}
        <div>
          <label className="block text-[13px] font-bold text-gray-800 mb-1.5 flex items-center justify-between">
            <span>نموذج تخطيط المذكرة:</span>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              {config.memoFormat === 'merged_teacher' ? 'مدمج' : 'مفصل'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-format-standard"
              onClick={() => {
                setConfig((prev) => ({ ...prev, memoFormat: 'standard' }));
                showToast('تم تفعيل النموذج المفصل (أستاذ + متعلم)');
              }}
              className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                config.memoFormat !== 'merged_teacher'
                  ? 'border-gray-900 bg-gray-900 text-white shadow-xs'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Columns className="w-4 h-4" />
                <span className="text-[10px] font-bold opacity-80">عمودين</span>
              </div>
              <span className="text-[11.5px] font-black leading-tight">مذكرة مفصلة</span>
              <span className="text-[9.5px] opacity-75 mt-0.5">أستاذ + متعلم</span>
            </button>

            <button
              type="button"
              id="btn-format-merged"
              onClick={() => {
                setConfig((prev) => ({ ...prev, memoFormat: 'merged_teacher' }));
                showToast('تم تفعيل النموذج المدمج (بدون خانة نشاط المتعلم)');
              }}
              className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                config.memoFormat === 'merged_teacher'
                  ? 'border-[#c2185b] bg-[#c2185b] text-white shadow-xs'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-[10px] font-bold opacity-80">عمود واحد</span>
              </div>
              <span className="text-[11.5px] font-black leading-tight">مذكرة مدمجة</span>
              <span className="text-[9.5px] opacity-75 mt-0.5">بدون خانة متعلم</span>
            </button>
          </div>
        </div>

        {/* 2- الميدان */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-bold text-gray-800">
              2- الميدان
            </label>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                selectedLevel === '1am'
                  ? 'bg-sky-100 text-sky-800'
                  : selectedLevel === '2am'
                  ? 'bg-purple-100 text-purple-800'
                  : selectedLevel === '3am'
                  ? 'bg-teal-100 text-teal-900 border border-teal-300'
                  : 'bg-[#c2185b]/10 text-[#c2185b]'
              }`}
            >
              {selectedLevel === '1am' ? 'ميدانين (صحة + محيط)' : 'المنهاج الرسمي'}
            </span>
          </div>
          <div
            id="display-midan"
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13px] font-bold bg-[#fafafa] text-gray-900 flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedLevel === '1am'
                    ? (currentLesson?.midan === 'الإنسان والصحة' ? 'bg-sky-600' : 'bg-emerald-600')
                    : selectedLevel === '2am'
                    ? 'bg-purple-600'
                    : selectedLevel === '3am'
                    ? 'bg-teal-600'
                    : 'bg-[#c2185b]'
                }`}
              />
              <span className="font-extrabold text-gray-900">
                {currentLesson?.midan || selectedMidan}
              </span>
            </div>
            <span className="text-[11px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
              {selectedLevel === '4am'
                ? '4 متوسط'
                : selectedLevel === '3am'
                ? '3 متوسط'
                : selectedLevel === '2am'
                ? '2 متوسط'
                : '1 متوسط'}
            </span>
          </div>
        </div>

        {/* 3- المقطع التعلمي */}
        <div>
          <label className="block text-[13px] font-bold mb-1.5 text-gray-800">
            3- المقطع التعلمي
          </label>
          <select
            id="select-maqta"
            value={selectedMaqta}
            onChange={(e) => setSelectedMaqta(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-[12.5px] bg-white focus:outline-none focus:ring-2 focus:ring-[#c2185b]/20 focus:border-[#c2185b] leading-5"
          >
            {maqatiList.map((maqta) => (
              <option key={maqta} value={maqta}>
                {maqta}
              </option>
            ))}
          </select>
        </div>

        {/* 4- المورد التعلمي */}
        <div>
          <label className="block text-[13px] font-bold mb-1.5 text-gray-800">
            4- المورد التعلمي
          </label>
          <select
            id="select-mawrid"
            value={selectedMawrid}
            onChange={(e) => setSelectedMawrid(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-[12.5px] bg-white focus:outline-none focus:ring-2 focus:ring-[#c2185b]/20 focus:border-[#c2185b]"
          >
            {mawridList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* 5- تعلم مورد */}
        <div>
          <label className="block text-[13px] font-bold mb-1.5 text-gray-800">
            5- تعلم مورد
          </label>
          <select
            id="select-ta3alom"
            value={selectedTa3alom}
            onChange={(e) => setSelectedTa3alom(e.target.value)}
            className="w-full border border-[#c2185b] rounded-lg px-3 py-2.5 text-[12.5px] bg-[#fff0f5] focus:outline-none focus:ring-2 focus:ring-[#c2185b]/20 text-gray-900 font-medium"
          >
            {ta3alomList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="mt-1.5 text-[11px] text-gray-500">
            {ta3alomList.length} موارد في هذا المقطع
          </div>
        </div>

        {/* 6- الأنشطة */}
        <div>
          <label className="block text-[13px] font-bold mb-2 text-gray-800">
            6- الأنشطة (اختر لسير الحصة)
          </label>
          <div className="bg-[#fafafa] border border-gray-200 rounded-xl p-3 space-y-2 max-h-[260px] overflow-y-auto">
            {currentLesson?.anshita.map((act, idx) => (
              <label
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={!!activeActivities[idx]}
                  onChange={() => onToggleActivity(idx)}
                  className="mt-1 accent-[#c2185b] w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-[12px] font-bold leading-5 text-gray-800">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    {act.asila.slice(0, 80)}...
                  </div>
                </div>
              </label>
            ))}
            {(!currentLesson || currentLesson.anshita.length === 0) && (
              <div className="text-[12px] text-gray-400 p-2">لا توجد أنشطة</div>
            )}
          </div>
          <div className="flex gap-2 mt-2.5 items-center">
            <button
              id="btn-select-all"
              type="button"
              onClick={onSelectAllActivities}
              className="text-[11px] px-3 py-1 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              تحديد الكل
            </button>
            <button
              id="btn-deselect-all"
              type="button"
              onClick={onDeselectAllActivities}
              className="text-[11px] px-3 py-1 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              إلغاء الكل
            </button>
            <span className="text-[11px] text-gray-500 mr-auto">
              {activeActivities.filter(Boolean).length} / {currentLesson?.anshita.length || 0} محدد
            </span>
          </div>
        </div>

        {/* 7- إرساء الموارد المعرفية */}
        {currentLesson?.irsae && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-[#ea580c]" />
                7- إرساء الموارد (الحصيلة)
              </label>
              <button
                type="button"
                id="btn-copy-irsae"
                onClick={handleCopyIrsae}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                title="نسخ الحصيلة المعرفية"
              >
                {copiedIrsae ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIrsae ? 'تم النسخ' : 'نسخ الحصيلة'}</span>
              </button>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[12px] text-gray-800 leading-relaxed font-medium whitespace-pre-line max-h-[160px] overflow-y-auto shadow-2xs">
              {currentLesson.irsae}
            </div>
          </div>
        )}

        {/* 8- الهوية والإدارة */}
        <div className="border-t border-gray-200 pt-4 space-y-3.5">
          <div className="flex items-center gap-2 font-bold text-[13px] text-gray-800">
            <Building2 className="w-4 h-4 text-[#c2185b]" />
            8- المؤسسة والتوقيعات
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1 text-gray-600">
              مديرية التربية
            </label>
            <input
              id="input-directorate"
              type="text"
              value={config.directorate}
              onChange={(e) => setConfig((prev) => ({ ...prev, directorate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12.5px] bg-white focus:outline-none focus:border-[#c2185b]"
              placeholder="مديرية التربية تيارت"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1 text-gray-600">
              اسم المتوسطة
            </label>
            <input
              id="input-school-name"
              type="text"
              value={config.schoolName}
              onChange={(e) => setConfig((prev) => ({ ...prev, schoolName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12.5px] bg-white focus:outline-none focus:border-[#c2185b]"
              placeholder="شيخاوي عمر عين الذهب"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1 text-gray-600">
              اسم الأستاذ(ة)
            </label>
            <input
              id="input-teacher-name"
              type="text"
              value={config.teacherName}
              onChange={(e) => setConfig((prev) => ({ ...prev, teacherName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12.5px] bg-white focus:outline-none focus:border-[#c2185b]"
              placeholder="بغداد الطيب"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold mb-1 text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> الموسم
              </label>
              <input
                id="input-school-year"
                type="text"
                value={config.schoolYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfig((prev) => ({ ...prev, schoolYear: val }));
                  if (val && /(20\d{2})/.test(val)) {
                    const derivedStart = deriveDefaultSchoolEntryDate(val);
                    const newSettings = getDefaultCalendarSettings(val, derivedStart);
                    syncCalendarToAllLevels(newSettings);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12.5px] bg-white focus:outline-none focus:border-[#c2185b]"
                placeholder="2025 - 2026"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1 text-gray-600 flex items-center gap-1">
                <Hash className="w-3 h-3" /> رقم المذكرة
              </label>
              <input
                id="input-memo-number"
                type="text"
                value={config.memoNumber}
                onChange={(e) => setConfig((prev) => ({ ...prev, memoNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12.5px] bg-[#fff0f5] border-[#c2185b]/30 focus:outline-none focus:border-[#c2185b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1 text-gray-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-emerald-700" /> تاريخ الدخول المدرسي
              </span>
              <span className="text-[10px] text-emerald-800 font-normal">تطبيق فوري على التدرج</span>
            </label>
            <input
              type="date"
              defaultValue={deriveDefaultSchoolEntryDate(config.schoolYear)}
              onChange={(e) => {
                const newDate = e.target.value;
                if (newDate) {
                  const derivedYear = deriveSchoolYearFromDate(newDate);
                  setConfig((prev) => ({ ...prev, schoolYear: derivedYear }));
                  const newSettings = getDefaultCalendarSettings(derivedYear, newDate);
                  syncCalendarToAllLevels(newSettings);
                  showToast(`تم اعتماد تاريخ الدخول ${newDate} وتطبيقه على كامل التدرج ودفتر النصوص 📅`);
                }
              }}
              className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 text-[12.5px] bg-emerald-50/50 font-bold text-emerald-950 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1.5 text-gray-600">
              ختم الأستاذ
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleStampUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                id="btn-upload-stamp"
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  showToast('اختر صورة الختم');
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-300 text-[12px] font-bold hover:bg-gray-50 transition"
              >
                <Upload className="w-4 h-4 text-gray-600" />
                رفع الختم
              </button>
              {config.teacherStamp && (
                <button
                  id="btn-remove-stamp"
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({ ...prev, teacherStamp: null }));
                    showToast('تم حذف الختم');
                  }}
                  className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[12px] font-bold hover:bg-red-100 transition"
                >
                  حذف
                </button>
              )}
            </div>

            {config.teacherStamp ? (
              <div className="mt-2.5 w-[110px] h-[110px] border-2 border-dashed border-[#c2185b]/40 rounded-full overflow-hidden bg-[#fff0f5] flex items-center justify-center mx-auto p-1">
                <img
                  src={config.teacherStamp}
                  alt="ختم"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="mt-2.5 w-[110px] h-[110px] border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center gap-1 mx-auto text-gray-400">
                <Stamp className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-medium">ختم الأستاذ</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 text-[11px] text-gray-400 leading-4">
        النموذج الرسمي المعتمد للمذكرات البيداغوجية لعلوم الطبيعة والحياة (1م و 3م) — قابل للتعديل المباشر والتصدير.
      </div>
    </aside>
  );
};
