import type { TeacherKnowledgeDoc } from '../types/knowledge';

/**
 * مصادر تكميلية تُفهرس عند الطلب داخل قاعدة معرفة المساعد.
 * النص الخام (OCR) لمذكرات السنة الأولى متوسط كبير الحجم، لذلك يُحمَّل
 * بطريقة كسولة ولا يُضمَّن في البحث إلا إذا فعّل الأستاذ ذلك.
 */

export const OCR_SUPPLEMENT_ID = 'kb-ocr-source-memo-1am';

let cachedOcr: TeacherKnowledgeDoc | null = null;
let ocrAttempted = false;

export async function loadOcrSupplement(): Promise<TeacherKnowledgeDoc | null> {
  if (cachedOcr) return cachedOcr;
  if (ocrAttempted) return null;
  ocrAttempted = true;
  try {
    const module = await import('../data/sourceMemo1amFullText.md?raw');
    const raw = String((module as { default?: string }).default || '');
    if (!raw.trim()) return null;
    cachedOcr = {
      id: OCR_SUPPLEMENT_ID,
      kind: 'memo',
      title: 'نص المصدر الخام — مذكرات السنة الأولى متوسط (OCR)',
      level: '1am',
      text: raw,
      authority: 'نص مستخرج آلياً من ملف المصدر المرفق',
      createdAt: new Date(0).toISOString(),
      source: 'ocr',
    };
    return cachedOcr;
  } catch {
    return null;
  }
}
