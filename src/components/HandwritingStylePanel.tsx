import React, { useState } from 'react';
import {
  X,
  PenTool,
  RotateCcw,
  Save,
  Trash2,
  Check,
  Palette,
  Type,
  Sparkles,
  Highlighter,
  Eraser,
  BookOpen,
} from 'lucide-react';
import {
  DEFAULT_PEN_PALETTE,
  HANDWRITING_FONTS,
  HandwritingFontId,
  HandwritingScope,
  HandwritingStyleSettings,
  PEN_ROLE_META,
  PenRole,
  SavedHandwritingPreset,
  applyPenColorToSelection,
  clearPenFormattingInSelection,
  deleteHandwritingPreset,
  loadSavedPresets,
  resetHandwritingSettings,
  saveHandwritingPreset,
} from '../services/handwritingStyle';
import { useHandwritingStyle } from '../hooks/useHandwritingStyle';

interface HandwritingStylePanelProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

const PEN_ROLES: PenRole[] = [
  'titleBlue',
  'subRed',
  'defGreen',
  'bodyBlack',
  'termPurple',
  'noteOrange',
];

export const HandwritingStylePanel: React.FC<HandwritingStylePanelProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { settings, updateSettings } = useHandwritingStyle();
  const [presets, setPresets] = useState<SavedHandwritingPreset[]>(() => loadSavedPresets());
  const [presetName, setPresetName] = useState('');
  const [underlineSelection, setUnderlineSelection] = useState(false);

  if (!isOpen) return null;

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
  };

  const handleApplySelectionColor = (role: PenRole) => {
    const applied = applyPenColorToSelection(role, settings.palette, underlineSelection);
    if (applied) {
      notify(`تم تلوين النص المحدد بقلم: ${PEN_ROLE_META[role].shortLabel}`);
    } else {
      notify('يرجى تحديد/تظليل كلمة أو جملة داخل المذكرة أو الدفتر أولاً');
    }
  };

  const handleClearSelection = () => {
    const cleared = clearPenFormattingInSelection();
    if (cleared) {
      notify('تمت إزالة التلوين عن النص المحدد');
    } else {
      notify('يرجى تحديد النص المراد إزالة تلوينه أولاً');
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) {
      notify('اكتب اسماً للتنسيق المفضل أولاً');
      return;
    }
    const next = saveHandwritingPreset(presetName, settings);
    setPresets(next);
    setPresetName('');
    notify('تم حفظ التنسيق اليدوي في قائمة التنسيقات المفضلة');
  };

  const handleApplyPreset = (preset: SavedHandwritingPreset) => {
    updateSettings({ ...preset.settings, activePresetId: preset.id });
    notify(`تم تطبيق تنسيق: ${preset.name}`);
  };

  const handleDeletePreset = (id: string) => {
    setPresets(deleteHandwritingPreset(id));
    notify('تم حذف التنسيق المحفوظ');
  };

  const handleResetColors = () => {
    updateSettings((prev) => ({
      ...prev,
      palette: { ...DEFAULT_PEN_PALETTE },
    }));
    notify('تمت استعادة ألوان الأقلام الستة الافتراضية');
  };

  const handleResetToOriginal = () => {
    resetHandwritingSettings(true);
    notify('تم الرجوع إلى التنسيق الأصلي للمنصة');
  };

  const handleRestoreHandwritingDefaults = () => {
    resetHandwritingSettings(false);
    notify('تم تفعيل التنسيق اليدوي الافتراضي بالأقلام الملونة');
  };

  const currentFont = HANDWRITING_FONTS[settings.fontId] || HANDWRITING_FONTS.playpen;

  return (
    <div
      id="handwriting-style-modal"
      className="print:hidden fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="تخصيص الخط اليدوي ونظام الأقلام الملونة"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-l from-emerald-50 via-white to-sky-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                تخصيص أسلوب الكتابة اليدوية والأقلام الملونة
              </h2>
              <p className="text-[11px] text-slate-500">
                يحاكي كراس الأستاذ بأقلام ملونة دون تعديل أي محتوى علمي أو بنية المنصة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 grid place-items-center cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* 1. Master Toggle + Scope */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) =>
                  updateSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="w-4 h-4 accent-blue-700 cursor-pointer"
              />
              <div>
                <div className="text-xs sm:text-[13px] font-extrabold text-slate-900">
                  تفعيل أسلوب الكتابة اليدوية بالأقلام الملونة
                </div>
                <div className="text-[11px] text-slate-500">
                  عند الإلغاء، يظهر النص بالخط والتنسيق الأصلي للمنصة
                </div>
              </div>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">نطاق التطبيق:</span>
              <select
                value={settings.scope}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    scope: e.target.value as HandwritingScope,
                  }))
                }
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
              >
                <option value="all">كامل المنصة والدفتر</option>
                <option value="logbook">الدفتر الرقمي فقط</option>
                <option value="memos">المذكرات والدروس فقط</option>
              </select>
            </div>
          </div>

          {/* 2. Live Notebook Preview */}
          <div
            className="rounded-xl border border-sky-200 bg-[#fffdf8] p-4 shadow-2xs space-y-1.5"
            style={{
              fontFamily: settings.enabled
                ? currentFont.cssFamily
                : HANDWRITING_FONTS.cairo.cssFamily,
              fontSize: `${Math.round(14 * (settings.enabled ? settings.fontSizeScale : 1))}px`,
              lineHeight: settings.enabled ? currentFont.lineHeight : 1.5,
              backgroundImage:
                settings.enabled && settings.ruledLines
                  ? 'repeating-linear-gradient(to bottom, transparent, transparent 25px, rgba(59,130,246,0.16) 26px)'
                  : undefined,
            }}
          >
            <div className="text-[10px] font-sans font-bold text-slate-400 mb-1">
              معاينة مباشرة للكراس المدرسي ({currentFont.label}):
            </div>
            <div
              className="font-bold text-[1.15em]"
              style={{
                color: settings.palette.titleBlue,
                textDecoration: 'underline',
                textDecorationColor: settings.palette.subRed,
                textUnderlineOffset: '4px',
              }}
            >
              المورد التعلمي: امتصاص المغذيات عند الإنسان
            </div>
            <div className="font-bold text-[0.98em]" style={{ color: settings.palette.subRed }}>
              المشكلة المطروحة: كيف تنتقل نواتج الهضم من المعي الدقيق إلى الدم؟
            </div>
            <div style={{ color: settings.palette.bodyBlack }}>
              تنتقل نواتج الهضم مثل{' '}
              <span className="font-bold" style={{ color: settings.palette.termPurple }}>
                الغلوكوز
              </span>{' '}
              و{' '}
              <span className="font-bold" style={{ color: settings.palette.termPurple }}>
                الأحماض الأمينية
              </span>{' '}
              عبر بنية متخصصة تُدعى{' '}
              <span className="font-bold" style={{ color: settings.palette.termPurple }}>
                الزغابة المعوية
              </span>
              .
            </div>
            <div style={{ color: settings.palette.defGreen }}>
              <span className="font-bold underline">إرساء المورد:</span> الزغابة المعوية هي مقر
              الامتصاص المعوي للمغذيات بفضل جدارها الرقيق وغناها بالشعيرات الدموية.
            </div>
            <div className="text-[0.94em]" style={{ color: settings.palette.noteOrange }}>
              <span className="font-bold underline">ملاحظة ومثال:</span> تمر الدسم عبر الطريق
              اللمفاوي بينما يمر السكر والأحماض الأمينية عبر الطريق الدموي.
            </div>
          </div>

          {/* 3. Font Family & Size + Ruled Paper */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-blue-700" />
                <span>اختيار نوع خط الكتابة اليدوية</span>
              </h3>
              <label className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ruledLines}
                  onChange={(e) =>
                    updateSettings((prev) => ({ ...prev, ruledLines: e.target.checked }))
                  }
                  className="accent-blue-700"
                />
                <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                <span>سطور الكراس الخفيفة</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(HANDWRITING_FONTS) as HandwritingFontId[]).map((fontKey) => {
                const font = HANDWRITING_FONTS[fontKey];
                const isSelected = settings.fontId === fontKey;
                return (
                  <button
                    key={fontKey}
                    type="button"
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        enabled: fontKey === 'cairo' ? prev.enabled : true,
                        fontId: fontKey,
                      }))
                    }
                    className={`text-right p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/15'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{font.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">{font.subtitle}</div>
                    <div
                      className="mt-1.5 text-[13px] text-slate-800 truncate"
                      style={{ fontFamily: font.cssFamily }}
                    >
                      {font.sampleText}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Font Size Scale */}
            <div className="rounded-xl border border-slate-200 p-3 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-800">
                حجم الخط المطبوع والشاشة (متوازن لصفحة A4):{' '}
                <span className="font-mono text-blue-700">
                  {Math.round(settings.fontSizeScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: 'صغير', value: 0.94 },
                  { label: 'متوسط (افتراضي)', value: 1.0 },
                  { label: 'واضح وكبير', value: 1.08 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      updateSettings((prev) => ({ ...prev, fontSizeScale: opt.value }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
                      Math.abs(settings.fontSizeScale - opt.value) < 0.02
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <input
                  type="range"
                  min={0.92}
                  max={1.12}
                  step={0.02}
                  value={settings.fontSizeScale}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      fontSizeScale: Number(e.target.value),
                    }))
                  }
                  className="w-24 accent-blue-700 cursor-pointer"
                  aria-label="حجم الخط"
                />
              </div>
            </div>
          </div>

          {/* 4. Six Pen Colors Customizer */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-blue-700" />
                <span>تخصيص ألوان الأقلام الستة</span>
              </h3>
              <button
                type="button"
                onClick={handleResetColors}
                className="text-[11px] font-bold text-slate-600 hover:text-blue-700 cursor-pointer"
              >
                استعادة الألوان الافتراضية
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PEN_ROLES.map((role) => {
                const meta = PEN_ROLE_META[role];
                const currentColor = settings.palette[role];
                return (
                  <div
                    key={role}
                    className="rounded-xl border border-slate-200 p-2.5 bg-white flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-extrabold" style={{ color: currentColor }}>
                        {meta.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{meta.description}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {meta.swatches.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            updateSettings((prev) => ({
                              ...prev,
                              palette: { ...prev.palette, [role]: hex },
                            }))
                          }
                          className={`w-5 h-5 rounded-full border cursor-pointer transition ${
                            currentColor.toLowerCase() === hex.toLowerCase()
                              ? 'ring-2 ring-offset-1 ring-slate-900 scale-110'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                          aria-label={`اختيار اللون ${hex}`}
                        />
                      ))}
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) =>
                          updateSettings((prev) => ({
                            ...prev,
                            palette: { ...prev.palette, [role]: e.target.value },
                          }))
                        }
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                        title="اختيار لون مخصص"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Apply Pen Color to Selected Text */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <Highlighter className="w-4 h-4 text-purple-700" />
                <span>تطبيق القلم على نص محدد (ظلّل أي جملة في المذكرة أو الدفتر ثم اختر اللون):</span>
              </div>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={underlineSelection}
                  onChange={(e) => setUnderlineSelection(e.target.checked)}
                  className="accent-red-700"
                />
                <span>إضافة تسطير</span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {PEN_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleApplySelectionColor(role)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-[11px] font-bold cursor-pointer shadow-2xs"
                  style={{ color: settings.palette[role] }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: settings.palette[role] }}
                  />
                  <span>{PEN_ROLE_META[role].shortLabel}</span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>مسح تلوين التحديد</span>
              </button>
            </div>
          </div>

          {/* 6. Save & Manage Favorite Presets */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>حفظ التنسيقات المفضلة</span>
            </h3>
            <form onSubmit={handleSavePreset} className="flex items-center gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="اسم التنسيق (مثال: كراس السنة الرابعة، خط الطباعة السريع...)"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ</span>
              </button>
            </form>

            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                      settings.activePresetId === preset.id
                        ? 'bg-blue-50 border-blue-400 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="cursor-pointer hover:underline"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label={`حذف ${preset.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>الرجوع إلى التنسيق الأصلي</span>
            </button>
            <button
              type="button"
              onClick={handleRestoreHandwritingDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>الافتراضي اليدوي بالأقلام</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
          >
            تم التطبيق
          </button>
        </div>
      </div>
    </div>
  );
};
