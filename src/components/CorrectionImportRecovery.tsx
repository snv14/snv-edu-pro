import React from 'react';
import {
  AlertTriangle, CheckCircle2, Database, FileText, Loader2, RefreshCw, Sparkles, Wand2, X,
} from 'lucide-react';

export type RecoveryStatus = 'reading' | 'analyzing' | 'enriching' | 'ready' | 'error';

export interface RecoveryPreset {
  label: string;
  exercisePoints: number[];
  integrationPoints: number;
}

export interface RecoverySummary {
  exercises: number;
  questions: number;
  points: number;
  usedAI: boolean;
  missing: string[];
  notice: string;
}

export interface CorrectionImportRecoveryProps {
  status: RecoveryStatus;
  /** المرحلة التي تعثّرت عند الخطأ، لتمييزها بالأحمر. */
  failedStep?: RecoveryStatus;
  fileName: string;
  fileSize: number;
  summary?: RecoverySummary;
  filled: string[];
  matchedLabel?: string;
  exercises: Array<{ label: string; questionCount: number }>;
  presets: RecoveryPreset[];
  activePreset: number;
  suggestedTotal: number;
  totalTarget: number;
  error?: string;
  onPreset: (index: number) => void;
  onConfirm: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

const STEPS: Array<{ key: RecoveryStatus; label: string; hint: string }> = [
  { key: 'reading', label: 'قراءة الملف', hint: 'فتح الصورة أو PDF أو Word وتحويله إلى نص' },
  { key: 'analyzing', label: 'تحليل الورقة', hint: 'التعرف على التمارين والأسئلة والنقاط المطبوعة' },
  { key: 'enriching', label: 'تعبئة من قاعدة المنصة', hint: 'المستوى والميدان والمقطع والموارد والمعايير' },
  { key: 'ready', label: 'اقتراح التنقيط', hint: 'توزيع النقاط على التمارين والوضعية الإدماجية' },
];

const ORDER: RecoveryStatus[] = ['reading', 'analyzing', 'enriching', 'ready'];

const stepState = (
  step: RecoveryStatus,
  status: RecoveryStatus,
  failedStep?: RecoveryStatus
): 'pending' | 'active' | 'done' | 'error' => {
  if (status === 'error') {
    const failedAt = ORDER.indexOf(failedStep || 'reading');
    const index = ORDER.indexOf(step);
    return index < failedAt ? 'done' : index === failedAt ? 'error' : 'pending';
  }
  const current = ORDER.indexOf(status);
  const index = ORDER.indexOf(step);
  if (index < current) return 'done';
  if (index === current) return status === 'ready' ? 'done' : 'active';
  return 'pending';
};

const formatSize = (bytes: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
};

export const CorrectionImportRecovery: React.FC<CorrectionImportRecoveryProps> = ({
  status,
  failedStep,
  fileName,
  fileSize,
  summary,
  filled,
  matchedLabel,
  exercises,
  presets,
  activePreset,
  suggestedTotal,
  totalTarget,
  error,
  onPreset,
  onConfirm,
  onRetry,
  onCancel,
}) => {
  const busy = status !== 'ready' && status !== 'error';
  const activePresetData = presets[activePreset] || presets[0];

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-[1px] flex items-start justify-center overflow-y-auto p-3 sm:p-6" dir="rtl">
      <section className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <header className="px-4 py-3 bg-gradient-to-l from-teal-900 to-emerald-700 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/15 grid place-items-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-[13.5px] leading-tight">صفحة استرداد الورقة</h3>
              <p className="text-[10.5px] text-white/80 truncate">يقرأ الملف آليًا ثم يعبّئ المذكرة من قاعدة المنصة قبل الاعتماد</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="إغلاق الاسترداد" className="p-1.5 rounded-lg hover:bg-white/15">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[11.5px] font-black text-slate-800 truncate max-w-[45%]">{fileName || 'لم يُختر ملف'}</span>
            <span className="text-[10.5px] font-bold text-slate-500">{formatSize(fileSize)}</span>
            <span className="flex-1" />
            {busy && (
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-teal-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ العمل…
              </span>
            )}
            {status === 'ready' && (
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> القراءة تمت — راجع ثم اعتمد
              </span>
            )}
          </div>

          <ol className="grid gap-1.5 sm:grid-cols-2">
            {STEPS.map(step => {
              const state = stepState(step.key, status, failedStep);
              return (
                <li
                  key={step.key}
                  className={`flex items-start gap-2 rounded-xl border px-2.5 py-2 ${
                    state === 'done' ? 'border-emerald-200 bg-emerald-50'
                      : state === 'active' ? 'border-teal-300 bg-teal-50'
                        : state === 'error' ? 'border-red-200 bg-red-50'
                          : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {state === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : state === 'active' ? <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
                        : state === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" />
                          : <span className="block w-4 h-4 rounded-full border-2 border-slate-300" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-black text-slate-800">{step.label}</span>
                    <span className="block text-[10px] font-bold text-slate-500 leading-tight">{step.hint}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] font-bold text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center">
                <div className="text-[16px] font-black text-slate-900 leading-none">{summary.exercises}</div>
                <div className="text-[9.5px] font-bold text-slate-500 mt-1">تمرين مقروء</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center">
                <div className="text-[16px] font-black text-slate-900 leading-none">{summary.questions}</div>
                <div className="text-[9.5px] font-bold text-slate-500 mt-1">سؤال</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center">
                <div className="text-[16px] font-black text-slate-900 leading-none">{summary.points}</div>
                <div className="text-[9.5px] font-bold text-slate-500 mt-1">نقطة مطبوعة</div>
              </div>
            </div>
          )}

          {summary?.notice && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-900 leading-relaxed">
              {summary.notice}
              {summary.missing.length > 0 && <span className="block mt-0.5 text-blue-800">ناقص من الملف: {summary.missing.join(' · ')}</span>}
            </div>
          )}

          {exercises.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-2.5 space-y-1.5">
              <div className="text-[11px] font-black text-slate-600">التمارين المقروءة</div>
              <div className="flex flex-wrap gap-1.5">
                {exercises.map((exercise, index) => (
                  <span key={`${exercise.label}-${index}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10.5px] font-bold text-slate-700">
                    {exercise.label}
                    <span className="text-slate-400">·</span>
                    {exercise.questionCount} سؤال
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-teal-900">
              <Database className="w-3.5 h-3.5" />
              من قاعدة المنصة
              {matchedLabel && <span className="font-bold text-teal-800 truncate">— {matchedLabel}</span>}
            </div>
            <div className="text-[10.5px] font-bold text-teal-900/90 leading-relaxed">
              {filled.length ? `عُبّئت: ${filled.slice(0, 10).join(' · ')}${filled.length > 10 ? ' …' : ''}` : 'لم تُعبّأ خانات جديدة: إما أن الحقول معبّأة، أو لا يوجد درس مطابق.'}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-900">
              <Wand2 className="w-3.5 h-3.5" /> اقتراح التنقيط
              <span className="font-bold text-indigo-800">— المجموع {suggestedTotal} / {totalTarget} ن</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset, index) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onPreset(index)}
                  aria-pressed={activePreset === index}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black border transition ${
                    activePreset === index
                      ? 'bg-indigo-700 text-white border-indigo-700'
                      : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {activePresetData && (
              <div className="text-[10px] font-bold text-indigo-900/80">
                الجزء الأول: {activePresetData.exercisePoints.join(' + ')} = {activePresetData.exercisePoints.reduce((sum, value) => sum + value, 0)} ن
                {activePresetData.integrationPoints > 0 ? ` · الوضعية الإدماجية: ${activePresetData.integrationPoints} ن` : ' · بلا وضعية إدماجية'}
              </div>
            )}
            <div className="text-[10px] font-bold text-slate-500">
              النقاط المطبوعة في الورقة الأصلية لا تُستبدل؛ يُكمّل الاقتراح الخانات الفارغة فقط. يمكنك تعديل كل رقم لاحقًا داخل المذكرة.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={onConfirm}
              disabled={status !== 'ready'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-[11.5px] font-black disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" /> اعتماد وتعبئة المذكرة
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11.5px] font-black"
            >
              <RefreshCw className="w-3.5 h-3.5" /> ملف آخر
            </button>
            <span className="flex-1" />
            <button type="button" onClick={onCancel} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11.5px] font-black">
              إلغاء
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
