/**
 * أنواع المصادر الرسمية الحرفية في قاعدة معرفة المساعد الذكي.
 * النصوص مولَّدة بواسطة scripts/ingest_official_pdfs.py من ملفات الوزارة الأصلية.
 */

import type { KnowledgeLevel, KnowledgeSourceKind } from '../../types/knowledge';

/** صفحة واحدة من وثيقة رسمية؛ الرقم يُستعمل في الاستشهاد («المنهاج 2016، ص 29»). */
export interface OfficialSourcePage {
  /** رقم الصفحة كما هو في الملف الأصلي (يبدأ من 1). */
  page: number;
  text: string;
}

export type OfficialSourcePages = OfficialSourcePage[];

/** وصف ثابت لوثيقة رسمية، متاح فوراً قبل تحميل نصها الكسول. */
export interface OfficialSourceManifestEntry {
  id: string;
  kind: KnowledgeSourceKind;
  level: KnowledgeLevel;
  title: string;
  authority: string;
  url: string;
  role: string;
  /** مسار الوحدة المولَّدة داخل src/data/official. */
  module: string;
  pages: number;
  chars: number;
  /** مسار الاستخراج الذي فاز بالتسجيل الآلي. */
  extraction: string;
  /** نسبة مطابقة الكلمات للمفردات الرسمية (مؤشر جودة الطبقة النصية). */
  quality: number;
  /** نسبة المحارف الشاذة قبل المصفاة النهائية؛ صفر تعني طبقة نصية نظيفة. */
  garbage: number;
}
