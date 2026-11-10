/**
 * أنواع قاعدة معرفة المساعد الذكي.
 * القاعدة مبنية من أربع عائلات مصادر رسمية:
 * المنهاج، الوثيقة المرافقة، دليل الأستاذ، والمذكرات (+ التدرج ووثائق الأستاذ المرفوعة).
 */

export type KnowledgeLevel = 'all' | '1am' | '2am' | '3am' | '4am';

export type KnowledgeSourceKind =
  | 'curriculum'
  | 'progression'
  | 'companionDocument'
  | 'teacherGuide'
  | 'memo'
  | 'teacherDocument';

/** نوع المعلومة داخل المصدر؛ يستعمل للاستخراج الموجه (الأنشطة، المشكلة، الفرضية، الإرساء…). */
export type KnowledgeFacet =
  | 'map'
  | 'progression'
  | 'midan'
  | 'maqta'
  | 'mawrid'
  | 'ta3alom'
  | 'kafaa'
  | 'markaba'
  | 'ma3ayir'
  | 'marifa'
  | 'manhaji'
  | 'mostalahat'
  | 'wasail'
  | 'zaman'
  | 'wadiya'
  | 'moshkila'
  | 'faradiyat'
  | 'activity'
  | 'instructions'
  | 'answers'
  | 'irsae'
  | 'taqwim'
  | 'teacherRole'
  | 'learnerRole'
  | 'methodology'
  | 'reference';

export type KnowledgeStatus = 'official' | 'platform' | 'reference' | 'teacher' | 'ocr';

export interface KnowledgeScope {
  midan?: string;
  maqta?: string;
  mawrid?: string;
  ta3alom?: string;
  memoNumber?: string;
  activityId?: string;
}

export interface KnowledgeDocument {
  id: string;
  kind: KnowledgeSourceKind;
  title: string;
  authority: string;
  url?: string;
  level: KnowledgeLevel;
  status: KnowledgeStatus;
  role: string;
  /** عدد المقاطع المفهرسة؛ يُملأ عند بناء الفهرس. */
  chunkCount?: number;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  kind: KnowledgeSourceKind;
  status: KnowledgeStatus;
  level: KnowledgeLevel;
  facet: KnowledgeFacet;
  section: string;
  text: string;
  scope: KnowledgeScope;
  url?: string;
  /** رقم الصفحة في الوثيقة الرسمية الأصلية؛ يُستعمل في الاستشهاد («ص 29»). */
  page?: number;
  /** أولوية المصدر (كلما صغر الرقم كان المصدر أقوى). */
  priority: number;
}

export interface KnowledgeSearchFilters {
  level?: KnowledgeLevel | string;
  kinds?: KnowledgeSourceKind[];
  facets?: KnowledgeFacet[];
  scope?: { maqta?: string; mawrid?: string; ta3alom?: string };
  topK?: number;
  minScore?: number;
}

export interface KnowledgeHit {
  chunk: KnowledgeChunk;
  score: number;
  snippet: string;
  matchedTerms: string[];
  sourceLabel: string;
}

/** وثيقة يرفعها الأستاذ (لصق نص أو ملف txt/md) وتُفهرس مع القاعدة. */
export interface TeacherKnowledgeDoc {
  id: string;
  kind: KnowledgeSourceKind;
  title: string;
  level: KnowledgeLevel;
  text: string;
  authority?: string;
  url?: string;
  createdAt: string;
  source?: 'teacher' | 'ocr' | 'platform' | 'official';
}

/**
 * وثيقة رسمية حرفية مفرَّغة من ملف الوزارة الأصلي (منهاج، وثيقة مرافقة، دليل
 * أستاذ، مخططات سنوية). تُولَّد بواسطة scripts/ingest_official_pdfs.py وتُخزَّن
 * في src/data/official. تحتفظ بترقيم الصفحات حتى يكون الاستشهاد دقيقاً:
 * «المنهاج 2016، ص 29».
 */
export interface OfficialKnowledgeDoc extends TeacherKnowledgeDoc {
  source: 'official';
  /** صفحات الوثيقة كما وردت في الملف الأصلي؛ الرقم يُستعمل في الاستشهاد. */
  pages: Array<{ page: number; text: string }>;
  /** مسار الاستخراج الذي فاز بالتسجيل الآلي (pypdf / pymupdf / +tounicode). */
  extraction?: string;
  /** نسبة مطابقة الكلمات للمفردات الرسمية — مؤشر جودة الطبقة النصية. */
  quality?: number;
}

export interface ResolvedScopeMatch {
  field: 'midan' | 'maqta' | 'mawrid' | 'ta3alom';
  value: string;
  level: KnowledgeLevel;
  score: number;
}

export interface ResolvedScope {
  level: KnowledgeLevel;
  midan?: string;
  maqta?: string;
  mawrid?: string;
  ta3alom?: string;
  candidates: ResolvedScopeMatch[];
  /** دروس مطابقة للنطاق المستنتج. */
  lessonIds: string[];
}

export type KnowledgeTaskKind =
  | 'extract'
  | 'suggestActivity'
  | 'suggestExercise'
  | 'explain'
  | 'compare'
  | 'general';

export interface ExtractionCandidate {
  text: string;
  section: string;
  documentTitle: string;
  kind: KnowledgeSourceKind;
  status: KnowledgeStatus;
  level: KnowledgeLevel;
  url?: string;
  scope: KnowledgeScope;
  /** رقم الصفحة في الوثيقة الرسمية الأصلية إن كانت المعلومة منها. */
  page?: number;
  score: number;
  priority: number;
  sourceLabel: string;
}

export interface FacetExtraction {
  facet: KnowledgeFacet;
  label: string;
  candidates: ExtractionCandidate[];
}

export interface KnowledgeExtraction {
  query: string;
  task: KnowledgeTaskKind;
  requestedFacets: KnowledgeFacet[];
  scope: ResolvedScope;
  facets: FacetExtraction[];
  hits: KnowledgeHit[];
  missing: KnowledgeFacet[];
  notes: string[];
  stats: KnowledgeIndexStats;
}

export interface KnowledgeIndexStats {
  chunks: number;
  documents: KnowledgeDocument[];
  byKind: Record<string, number>;
  byFacet: Record<string, number>;
  byLevel: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface KnowledgeIndex {
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
  stats: KnowledgeIndexStats;
}

export const KNOWLEDGE_KIND_LABELS: Record<KnowledgeSourceKind, string> = {
  curriculum: 'المنهاج',
  progression: 'التدرج الرسمي',
  companionDocument: 'الوثيقة المرافقة',
  teacherGuide: 'دليل الأستاذ',
  memo: 'المذكرات',
  teacherDocument: 'وثيقة الأستاذ',
};

export const KNOWLEDGE_STATUS_LABELS: Record<KnowledgeStatus, string> = {
  official: 'مصدر رسمي',
  platform: 'قاعدة المنصة',
  reference: 'مرجع منهجي',
  teacher: 'وثيقة الأستاذ',
  ocr: 'نص مصدر خام (OCR)',
};

export const KNOWLEDGE_FACET_LABELS: Record<KnowledgeFacet, string> = {
  map: 'خريطة المنهاج',
  progression: 'التدرج الأسبوعي',
  midan: 'الميدان',
  maqta: 'المقطع التعلمي',
  mawrid: 'المورد التعلمي',
  ta3alom: 'تعلم المورد',
  kafaa: 'الكفاءة الختامية',
  markaba: 'مركبة الكفاءة',
  ma3ayir: 'معايير التقويم',
  marifa: 'المورد المعرفي',
  manhaji: 'المورد المنهجي',
  mostalahat: 'المصطلحات',
  wasail: 'الوسائل',
  zaman: 'الزمن',
  wadiya: 'الوضعية الانطلاقية',
  moshkila: 'المشكلة / الوضعية المشكلة',
  faradiyat: 'الفرضيات',
  activity: 'النشاط (العنوان)',
  instructions: 'تعليمات وأسئلة النشاط',
  answers: 'الأجوبة المرتقبة',
  irsae: 'إرساء الموارد',
  taqwim: 'التقويم والتمارين',
  teacherRole: 'نشاط الأستاذ',
  learnerRole: 'نشاط المتعلم',
  methodology: 'توجيه منهجي',
  reference: 'مرجع عام',
};

export const KNOWLEDGE_LEVEL_LABELS: Record<KnowledgeLevel, string> = {
  all: 'كل المستويات',
  '1am': 'السنة الأولى متوسط',
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
};
