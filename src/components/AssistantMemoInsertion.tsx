import React, { useState } from 'react';
import type { LessonMemo } from '../types';
import type { AssistantMemoField } from '../services/assistantMemoInsertion';

export function AssistantMemoInsertion({ text, lessons, initialLesson, onConfirm, onCancel }: {
  text: string; lessons: LessonMemo[]; initialLesson?: LessonMemo | null;
  onConfirm: (lesson: LessonMemo, field: AssistantMemoField, text: string) => void;
  onCancel: () => void;
}) {
  const initialIndex = initialLesson ? lessons.indexOf(initialLesson) : -1;
  const [target, setTarget] = useState(initialIndex >= 0 ? String(initialIndex) : '');
  const [field, setField] = useState<AssistantMemoField>('activity');
  const [content, setContent] = useState(text);
  const [error, setError] = useState('');
  return <section aria-label="مراجعة الإضافة إلى المذكرة" className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
    <h3 className="font-bold text-sm">مراجعة الإضافة إلى المذكرة</h3>
    <p className="text-xs leading-6 text-slate-600">راجع النص وحدد موضع إضافته. لن يتغير أي محتوى قبل تأكيدك، ولن يُحذف المحتوى الموجود.</p>
    <select aria-label="المذكرة المستهدفة" value={target} onChange={e => setTarget(e.target.value)} className="w-full rounded-xl border p-2 text-xs">
      <option value="">اختر المذكرة التي تريد تعديلها</option>
      {lessons.map((lesson, index) => <option value={index} key={index}>{lesson.ta3alom} — {lesson.mawrid} — مذكرة {lesson.memoNumber || index + 1}{lessons.some((other, i) => i !== index && other.ta3alom === lesson.ta3alom && other.mawrid === lesson.mawrid) ? ` (${lesson.level})` : ''}</option>)}
    </select>
    <select aria-label="موضع الإضافة" value={field} onChange={e => setField(e.target.value as AssistantMemoField)} className="w-full rounded-xl border p-2 text-xs"><option value="activity">نشاط إضافي</option><option value="irsae">إرساء الموارد</option><option value="taqwim">التقويم</option></select>
    <textarea aria-label="معاينة المحتوى قبل الإدراج" value={content} onChange={e => setContent(e.target.value)} rows={6} maxLength={30000} className="w-full rounded-xl border p-3 text-sm leading-7" />
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex gap-2"><button type="button" disabled={target === '' || !content.trim()} onClick={() => { try { if (target !== '' && lessons[Number(target)]) onConfirm(lessons[Number(target)], field, content); } catch (e) { setError(e instanceof Error ? e.message : 'تعذرت الإضافة؛ لم يتم حفظها.'); } }} className="rounded-xl px-3 py-2 bg-teal-700 text-white text-xs disabled:opacity-40">تأكيد الإضافة</button><button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 bg-white border text-xs">إلغاء</button></div>
  </section>;
}
