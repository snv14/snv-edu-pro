import type { LessonMemo } from '../types';

export type AssistantMemoField = 'activity' | 'irsae' | 'taqwim';
export function wantsMemoInsertion(question: string): boolean {
  return /(?:أدخل|ادخل|أدرج|ادرج|أضف|اضف|انقل|جهز|جهّز).*(?:المذكرة|مذكرة)/.test(question);
}

/** Explicitly confirmed append, never replace an existing activity or overwrite a scientific field. */
export function appendAssistantMemoContent(lesson: LessonMemo, field: AssistantMemoField, content: string): LessonMemo {
  const text = content.trim();
  if (!text) throw new Error('لا يوجد محتوى لإضافته.');
  if (text.length > 30000) throw new Error('المحتوى طويل جداً؛ اختصره قبل الإضافة.');
  if (!['activity', 'irsae', 'taqwim'].includes(field)) throw new Error('موضع الإدراج غير صالح.');
  const next = { ...lesson, sourceOfficial: false };
  if (field === 'activity') return { ...next, anshita: [...lesson.anshita, { title: 'نشاط مقترح — بإقرار الأستاذ', asila: text, ajwiba: '' }] };
  return { ...next, [field]: [lesson[field], 'إضافة مقترحة — بإقرار الأستاذ:', text].filter(Boolean).join('\n\n') };
}
