/**
 * نافذة إضافة / تعديل حصة.
 * تشمل جميع الحقول المطلوبة: التاريخ، اليوم، التوقيت، المستوى، القسم،
 * المادة، الوحدة/المقطع، عنوان النشاط، نوع الحصة، مدة الحصة، الملاحظات.
 * بالإضافة إلى المحتوى التعليمي المربوط (الكفاءة، سير الحصة، الأنشطة،
 * التجارب، الواجب).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { X, Calendar, Clock, GraduationCap, Users, BookOpen, Layers, ListChecks, ClipboardList, NotebookPen, Sparkles, FlaskConical, BookMarked } from 'lucide-react';
import {
  LESSON_TYPE_LABELS,
  LEVEL_LABELS,
  type Lesson,
  type LessonType,
  type LogbookLevel,
} from './types';
import { formatDateArabic, dayNameOf } from './dateUtils';
import { SCHOOL_PERIODS } from './generation';
import { getCurriculumUnits } from './generation';

interface LessonFormModalProps {
  isOpen: boolean;
  initial: Lesson | null;
  defaultDate: string;
  defaultLevel: LogbookLevel;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
}

const LEVEL_OPTIONS: LogbookLevel[] = ['1م', '2م', '3م', '4م'];

export function LessonFormModal({ isOpen, initial, defaultDate, defaultLevel, onClose, onSave }: LessonFormModalProps) {
  const [form, setForm] = useState<Lesson | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initial
          ? { ...initial, activities: [...initial.activities], experiments: [...initial.experiments], resources: [...initial.resources] }
          : {
              ...createBlank(defaultDate, defaultLevel),
            }
      );
    }
  }, [isOpen, initial, defaultDate, defaultLevel]);

  const units = useMemo(
    () => getCurriculumUnits(form?.level),
    [form?.level]
  );

  if (!isOpen || !form) return null;

  const set = <K extends keyof Lesson>(key: K, value: Lesson[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const handlePickUnit = (unitId: string) => {
    const u = units.find((x) => x.id === unitId);
    if (!u) return;
    setForm((f) =>
      f
        ? {
            ...f,
            unit: u.ta3alom || u.mawrid,
            activity: u.activities[0] || u.ta3alom,
            competency: u.irsaaText || u.taqwim || '',
            memoTitle: `${u.midan} · ${u.mawrid} · ${u.ta3alom}`,
          }
        : f
    );
  };

  const handleSave = () => {
    const lesson: Lesson = {
      ...form,
      updatedAt: new Date().toISOString(),
    };
    onSave(lesson);
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none transition';

  return (
    <div
      className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-white/95 backdrop-blur rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                {initial ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {initial ? 'تعديل محتوى الحصة المحددة' : 'تظهر الحصة مباشرة في دفتر التاريخ المحدد'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Date + time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" /> التاريخ
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={fieldClass}
              />
              <div className="text-[11px] text-slate-500 mt-1">{dayNameOf(form.date)} — {formatDateArabic(form.date)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> التوقيت
                </label>
                <select
                  value={form.startTime}
                  onChange={(e) => {
                    const idx = SCHOOL_PERIODS.findIndex((p) => p.start === e.target.value);
                    const end = idx >= 0 ? SCHOOL_PERIODS[idx].end : '09:00';
                    setForm((f) => (f ? { ...f, startTime: e.target.value, endTime: end } : f));
                  }}
                  className={fieldClass}
                >
                  {SCHOOL_PERIODS.map((p) => (
                    <option key={p.start} value={p.start}>
                      {p.start} — {p.end}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> المدة
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  placeholder="1 ساعة"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          {/* Level + class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" /> المستوى
              </label>
              <select value={form.level} onChange={(e) => set('level', e.target.value as LogbookLevel)} className={fieldClass}>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" /> القسم
              </label>
              <input
                type="text"
                value={form.className}
                onChange={(e) => set('className', e.target.value)}
                placeholder="3AM 2"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Subject + unit + activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" /> المادة
              </label>
              <input type="text" value={form.subject} onChange={(e) => set('subject', e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" /> الوحدة / المقطع
              </label>
              <input type="text" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="التغذية عند الإنسان" className={fieldClass} />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> عنوان النشاط
            </label>
            <input type="text" value={form.activity} onChange={(e) => set('activity', e.target.value)} className={fieldClass} />
          </div>

          {/* Link to curriculum content */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <BookMarked className="w-3.5 h-3.5 text-teal-600" /> ربط المحتوى التعليمي
            </label>
            <select
              value={''}
              onChange={(e) => handlePickUnit(e.target.value)}
              className={fieldClass}
              defaultValue=""
            >
              <option value="">— اختر وحدة من قاعدة المنصة —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.ta3alom} ({u.mawrid}) — {u.midan}
                </option>
              ))}
            </select>
            {form.memoTitle && (
              <div className="mt-2 text-[11px] text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                🔗 مذكرة مرتبطة: {form.memoTitle}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <ListChecks className="w-3.5 h-3.5 text-teal-600" /> نوع الحصة
            </label>
            <select value={form.type} onChange={(e) => set('type', e.target.value as LessonType)} className={fieldClass}>
              {(Object.keys(LESSON_TYPE_LABELS) as LessonType[]).map((t) => (
                <option key={t} value={t}>
                  {LESSON_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Competency + flow */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" /> الكفاءة المستهدفة
            </label>
            <textarea
              value={form.competency}
              onChange={(e) => set('competency', e.target.value)}
              rows={2}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <NotebookPen className="w-3.5 h-3.5 text-teal-600" /> سير الحصة
            </label>
            <textarea
              value={form.flow}
              onChange={(e) => set('flow', e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>

          {/* Activities / experiments / homework */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <ListChecks className="w-3.5 h-3.5 text-teal-600" /> الأنشطة
            </label>
            <textarea
              value={form.activities.join('\n')}
              onChange={(e) => set('activities', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
              rows={2}
              placeholder="اكتب كل نشاط في سطر مستقل"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-teal-600" /> التجارب
            </label>
            <textarea
              value={form.experiments.join('\n')}
              onChange={(e) => set('experiments', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
              rows={2}
              placeholder="اكتب كل تجربة في سطر مستقل"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-teal-600" /> الواجب المنزلي
            </label>
            <textarea
              value={form.homework}
              onChange={(e) => set('homework', e.target.value)}
              rows={2}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 mb-1.5">
              <NotebookPen className="w-3.5 h-3.5 text-teal-600" /> ملاحظات
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-white/95 backdrop-blur rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/30 cursor-pointer transition flex items-center gap-1.5"
          >
            <NotebookPen className="w-4 h-4" />
            {initial ? 'حفظ التعديلات' : 'إضافة إلى الدفتر'}
          </button>
        </div>
      </div>
    </div>
  );
}

function createBlank(date: string, level: LogbookLevel): Lesson {
  const period = SCHOOL_PERIODS[0];
  const now = new Date().toISOString();
  return {
    id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    teacherId: '',
    date,
    startTime: period.start,
    endTime: period.end,
    level,
    className: '',
    subject: 'علوم الطبيعة والحياة',
    unit: '',
    activity: '',
    type: 'curriculum',
    duration: '1 ساعة',
    competency: '',
    flow: '',
    activities: [],
    experiments: [],
    homework: '',
    resources: [],
    notes: '',
    status: 'scheduled',
    cancellationReason: null,
    cancellationDetail: '',
    updatedAt: now,
    createdAt: now,
  };
}
