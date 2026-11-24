import React, { useMemo, useState } from 'react';
import { GraduationCap, Layers, Columns, BookmarkCheck, Copy, Check, FolderOpen, FlaskConical, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { LessonMemo, MemoConfig } from '../types';
import { LEVELS, MAQATI_BY_LEVEL } from '../data/memos/lessonsData';
import {
  getExperimentsForLesson,
  getMediaForLesson,
  getTablesForLesson,
  getWorksheetsForLesson,
} from '../data/archive1am';

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
  onOpen1amArchive?: () => void;
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
  onOpen1amArchive,
}) => {
  const [copiedIrsae, setCopiedIrsae] = useState(false);
  const [previewImg, setPreviewImg] = useState<{ title: string; url: string } | null>(null);

  const archive1amResources = useMemo(() => {
    if (selectedLevel !== '1am' || !currentLesson?.sourceLearningUnitId) return null;
    const id = currentLesson.sourceLearningUnitId;
    return {
      media: getMediaForLesson(id),
      experiments: getExperimentsForLesson(id),
      tables: getTablesForLesson(id),
      worksheets: getWorksheetsForLesson(id),
    };
  }, [selectedLevel, currentLesson]);

  const handleCopyIrsae = () => {
    if (!currentLesson?.irsae) return;
    navigator.clipboard.writeText(currentLesson.irsae);
    setCopiedIrsae(true);
    showToast('تم نسخ إرساء الموارد بنجاح إلى الحافظة');
    setTimeout(() => setCopiedIrsae(false), 2000);
  };

  const maqatiList = providedMaqatiList || MAQATI_BY_LEVEL[selectedLevel] || [];

  return (
    <aside id="sidebar-controls" className="w-full lg:w-[330px] bg-white border-l border-slate-200 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto shrink-0 z-10">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
          <span className="font-extrabold text-[13px] text-slate-900">
            إعدادات المذكرة والمحتوى
          </span>
        </div>
        <span
          className={`text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
            selectedLevel === '1am'
              ? 'bg-sky-600'
              : selectedLevel === '2am'
              ? 'bg-purple-600'
              : selectedLevel === '3am'
              ? 'bg-teal-700'
              : 'bg-[#c2185b]'
          }`}
        >
          {selectedLevel.toUpperCase()}
        </span>
      </div>

      <div className="p-4 space-y-3.5">

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
                    ? (currentLesson?.midan?.includes('الإنسان والصحة') ? 'bg-sky-600' : 'bg-emerald-600')
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
                {copiedIrsae ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIrsae ? 'تم النسخ' : 'نسخ الحصيلة'}</span>
              </button>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[12px] text-gray-800 leading-relaxed font-medium whitespace-pre-line max-h-[160px] overflow-y-auto shadow-2xs">
              {currentLesson.irsae}
            </div>
          </div>
        )}


        {/* 8- استدعاء موارد الأرشيف (1م فقط) */}
        {selectedLevel === '1am' && archive1amResources && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-black text-emerald-900 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-emerald-700" />
                <span>موارد المذكرة #{currentLesson?.memoNumber} (ص {currentLesson?.sourcePage})</span>
              </span>
              {onOpen1amArchive && (
                <button
                  type="button"
                  onClick={onOpen1amArchive}
                  className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <span>الأرشيف</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2 text-[11px]">
              <div className="flex flex-wrap gap-1.5 font-bold">
                <span className="px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-800 inline-flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5" />
                  {archive1amResources.experiments.length} تجربة
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-cyan-200 text-cyan-800 inline-flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {archive1amResources.media.length} صور
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-800">
                  {archive1amResources.tables.length} جداول
                </span>
                {archive1amResources.worksheets.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-sky-800">
                    {archive1amResources.worksheets.length} أوراق عمل
                  </span>
                )}
              </div>

              {archive1amResources.media.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {archive1amResources.media.slice(0, 6).map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => setPreviewImg({ title: med.title, url: med.imageUrl })}
                      className="rounded-lg border border-slate-200 bg-white p-1 hover:border-emerald-400 transition cursor-pointer"
                      title={med.title}
                    >
                      <img
                        src={med.imageUrl}
                        alt={med.title}
                        className="w-full h-11 object-contain rounded"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImg(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-2xl w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <span className="font-black text-sm text-slate-900">{previewImg.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImg(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
            <img src={previewImg.url} alt={previewImg.title} className="max-h-[70vh] mx-auto object-contain rounded" />
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 text-[11px] text-gray-400 leading-4">
        النموذج الرسمي المعتمد للمذكرات البيداغوجية لعلوم الطبيعة والحياة (1م إلى 4م) — قابل للتعديل المباشر والتصدير.
      </div>
    </aside>
  );
};
