import type { LessonMemo } from '../types';
import {
  KNOWLEDGE_FACET_LABELS,
  KNOWLEDGE_KIND_LABELS,
  KNOWLEDGE_LEVEL_LABELS,
  KNOWLEDGE_STATUS_LABELS,
  type ExtractionCandidate,
  type FacetExtraction,
  type KnowledgeChunk,
  type KnowledgeDocument,
  type KnowledgeExtraction,
  type KnowledgeFacet,
  type KnowledgeHit,
  type KnowledgeIndex,
  type KnowledgeIndexStats,
  type KnowledgeLevel,
  type KnowledgeScope,
  type KnowledgeSearchFilters,
  type KnowledgeSourceKind,
  type KnowledgeStatus,
  type KnowledgeTaskKind,
  type ResolvedScope,
  type TeacherKnowledgeDoc,
  type OfficialKnowledgeDoc,
} from '../types/knowledge';
import { getOfficialCurriculumDatabase } from '../data/curriculumDb';
import {
  OFFICIAL_1AM_DISTRIBUTION,
  OFFICIAL_2AM_DISTRIBUTION,
  OFFICIAL_3AM_DISTRIBUTION,
  OFFICIAL_4AM_DISTRIBUTION,
  type OfficialAnnualDistributionRow,
} from '../data/officialAnnualDistributionData';
import { KNOWLEDGE_BASE_CORPUS } from '../data/knowledgeBaseCorpus';
import { sourcePriorityOf } from './aiSourcePriority';

/* ───────────────────────────── توحيد النص العربي ───────────────────────────── */

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const PUNCTUATION = /[\u00AB\u00BB"“”'’()\[\]{}<>,.;:!?،؛؟\-–—_/\\|*#~`+=×÷•·…\u060C]/g;

/** توحيد الحروف وإزالة التشكيل والترقيم حتى يتطابق «الأنشطة» مع «انشطة». */
export function normalizeArabic(input: unknown): string {
  return String(input ?? '')
    .replace(/\u0627\u064B/g, '')   // «تمريناً» ← «تمرين»
    .replace(/\u064B\u0627/g, '')
    .replace(DIACRITICS, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const PREFIXES = ['و', 'ف', 'ب', 'ك', 'ل'];

/** إزالة أدوات التعريف والعطف حتى تتطابق «الفرضيات» مع «فرضيات». */
export function stemToken(token: string): string {
  let value = token;
  for (let i = 0; i < 2; i += 1) {
    const prefix = PREFIXES.find(item => value.startsWith(item) && value.length > item.length + 2);
    if (!prefix) break;
    value = value.slice(prefix.length);
  }
  if (value.startsWith('ال') && value.length > 4) value = value.slice(2);
  return value;
}

const STOPWORDS = new Set([
  'من', 'في', 'على', 'الي', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'اللذين',
  'هو', 'هي', 'ما', 'ماذا', 'هل', 'ان', 'ثم', 'او', 'و', 'لا', 'قد', 'كما', 'بين',
  'عند', 'كل', 'بعض', 'بعد', 'قبل', 'تحت', 'فوق', 'عبر', 'حتي', 'اي', 'اما', 'اذا', 'كان',
  'تكون', 'يكون', 'نحن', 'انت', 'انا', 'لهم', 'بها', 'منه', 'فيها', 'هنا', 'هناك', 'حيث',
  'حين', 'بينما', 'لكن', 'بل', 'يا', 'ايها', 'ذات', 'غير', 'نفس', 'ضمن', 'حول', 'خلال',
  'التالي', 'التاليه', 'المقابل', 'مختلف', 'عده', 'يتم', 'يمكن', 'يجب',
  'the', 'of', 'and', 'for', 'in', 'on', 'with',
]);

/** كلمات بنوية عامة لا تحمل دلالة موضوعية عند مقارنة عناوين المنهاج. */
const STRUCTURAL_TOKENS = new Set([
  'تعلم', 'مورد', 'موارد', 'مقطع', 'مقاطع', 'ميدان', 'ميادين', 'التعلمي', 'تعلمي',
  'سلسله', 'وحده', 'نشاط', 'انشطه', 'السنة', 'متوسط',
]);

/** تحويل نص إلى كلمات مفهرسة (الصيغة + الصيغة المجردة) مع حذف الأدوات. */
export function tokenize(input: unknown): string[] {
  const normalized = normalizeArabic(input);
  if (!normalized) return [];
  const tokens: string[] = [];
  for (const raw of normalized.split(' ')) {
    const token = raw.trim();
    if (!token) continue;
    if (token.length < 2 && !/[0-9]/.test(token)) continue;
    if (STOPWORDS.has(token)) continue;
    if (!tokens.includes(token)) tokens.push(token);
    const stemmed = stemToken(token);
    if (stemmed !== token && stemmed.length > 1 && !STOPWORDS.has(stemmed) && !tokens.includes(stemmed)) {
      tokens.push(stemmed);
    }
  }
  return tokens;
}

/** كلمات الموضوع فقط (بدون الأرقام والألفاظ البنوية) لمقارنة عناوين المنهاج. */
const topicTokens = (input: unknown): string[] =>
  tokenize(input).filter(token =>
    /[0-9]/.test(token)
      ? false
      : !STRUCTURAL_TOKENS.has(token) && !STRUCTURAL_TOKENS.has(stemToken(token)));

/* ─────────────────────────── مرادفات وكشف نوع الطلب ─────────────────────────── */

const SYNONYM_GROUPS: string[][] = [
  ['مشكله', 'مشاكل', 'اشكاليه', 'مشكل'],
  ['فرضيه', 'فرضيات', 'تخمين'],
  ['نشاط', 'انشطه', 'نشاطات'],
  ['تعليمه', 'تعليمات', 'سؤال', 'اسئله', 'توجيهات'],
  ['اجابه', 'اجوبه', 'جواب', 'حل', 'حلول'],
  ['ارساء', 'تركيب', 'خلاصه', 'حصيله'],
  ['تقويم', 'تقييم', 'تقويمات'],
  ['تمرين', 'تمارين', 'تطبيق', 'تطبيقات'],
  ['اختبار', 'اختبارات', 'فرض', 'فروض', 'محروس'],
  ['ادماج', 'ادماجيه'],
  ['وسيله', 'وسائل', 'اداه', 'ادوات', 'عتاد'],
  ['رسم', 'رسوم', 'رسومات', 'مخطط', 'مخططات', 'سكيما'],
  ['تجربه', 'تجارب', 'بروتوكول'],
  ['منهاج', 'مناهج', 'برنامج', 'مقرر'],
  ['وثيقه', 'وثائق', 'سند', 'سندات'],
  ['مذكره', 'مذكرات', 'درس', 'دروس', 'حصه', 'حصص'],
  ['معلومه', 'معلومات', 'بيانات', 'معطيات'],
  ['كفاءه', 'كفاءات', 'مركبه', 'مركبات'],
  ['مصطلح', 'مصطلحات', 'مفردات'],
  ['بديل', 'بدائل'],
  ['مقطع', 'مقاطه', 'مقاطع'],
  ['مورد', 'موارد'],
  ['جدول', 'جداول'],
  ['مفهوم', 'مفاهيم'],
  ['ظاهرة', 'ظواهر'],
  ['خلية', 'خلايا'],
];

const SYNONYMS: Map<string, string[]> = new Map();
for (const group of SYNONYM_GROUPS) {
  for (const term of group) {
    const others = group.filter(item => item !== term);
    SYNONYMS.set(term, [...(SYNONYMS.get(term) || []), ...others]);
  }
}

/** كلمات دالة على نوع المعلومة المطلوبة (بعد التوحيد). */
export const FACET_KEYWORDS: Array<{ facet: KnowledgeFacet; terms: string[] }> = [
  { facet: 'moshkila', terms: ['مشكله', 'اشكاليه', 'مشكل'] },
  { facet: 'faradiyat', terms: ['فرضيه', 'فرضيات', 'تخمين'] },
  { facet: 'activity', terms: ['نشاط', 'انشطه', 'نشاطات', 'رسم', 'رسوم', 'مخطط', 'مخططات', 'سكيما'] },
  { facet: 'instructions', terms: ['تعليمات', 'تعليمه', 'اسئله', 'سؤال', 'توجيهات'] },
  { facet: 'answers', terms: ['اجوبه', 'اجابه', 'جواب', 'حل', 'مرتقب'] },
  { facet: 'irsae', terms: ['ارساء', 'تركيب', 'خلاصه', 'حصيله'] },
  { facet: 'taqwim', terms: ['تقويم', 'تقييم', 'تمرين', 'تمارين', 'تطبيق', 'تطبيقات', 'فرض', 'اختبار', 'ادماج', 'تنقيط'] },
  { facet: 'wadiya', terms: ['وضعيه', 'انطلاق', 'انطلاقيه'] },
  { facet: 'wasail', terms: ['وسائل', 'وسيله', 'ادوات', 'عتاد', 'مخبر'] },
  { facet: 'marifa', terms: ['معلومات', 'معلومه', 'بيانات', 'معطيات', 'مفهوم', 'تعريف', 'معرفي'] },
  { facet: 'manhaji', terms: ['منهجي', 'منهجيه', 'مهاره'] },
  { facet: 'mostalahat', terms: ['مصطلحات', 'مصطلح', 'مفردات'] },
  // «ختاميه» كلمة شديدة الخصوصية: لا تكاد ترد في الوثائق الرسمية إلا مع الكفاءة،
  // وبها تصبح واجهة الكفاءة الختامية قابلة للطلب صراحةً (كانت غير قابلة للوصول
  // فينسب السؤال إلى مركبة الكفاءة).
  { facet: 'kafaa', terms: ['ختاميه', 'ختامي'] },
  { facet: 'markaba', terms: ['كفاءه', 'كفاءات', 'مركبه'] },
  { facet: 'midan', terms: ['ميدان', 'ميادين'] },
  { facet: 'ma3ayir', terms: ['معايير', 'مؤشرات', 'شبكه', 'سلم'] },
  { facet: 'teacherRole', terms: ['الاستاذ', 'سيناريو', 'مراحل'] },
  { facet: 'learnerRole', terms: ['المتعلم', 'التلميذ'] },
  { facet: 'map', terms: ['خريطه', 'قائمه', 'عناوين', 'مقاطع'] },
  { facet: 'progression', terms: ['تدرج', 'اسبوع', 'شهري', 'سنوي', 'توزيع'] },
  { facet: 'zaman', terms: ['زمن', 'توقيت', 'مده'] },
  { facet: 'methodology', terms: ['منهجيه', 'توجيه', 'مواصفات', 'شروط'] },
];

const FACET_TERM_INDEX: Map<string, KnowledgeFacet[]> = (() => {
  const map = new Map<string, KnowledgeFacet[]>();
  const register = (term: string, facet: KnowledgeFacet) => {
    const list = map.get(term) || [];
    if (!list.includes(facet)) list.push(facet);
    map.set(term, list);
  };
  for (const entry of FACET_KEYWORDS) {
    for (const raw of entry.terms) {
      const term = normalizeArabic(raw);
      register(term, entry.facet);
      register(stemToken(term), entry.facet);
    }
  }
  return map;
})();

const DEFAULT_EXTRACTION_FACETS: KnowledgeFacet[] = [
  'moshkila', 'faradiyat', 'activity', 'instructions', 'answers', 'irsae', 'taqwim',
];

/** أنواع المعلومة الأنسب لكل مهمة عندما لا يحدد السؤال نوعاً صريحاً. */
export const TASK_DEFAULT_FACETS: Record<KnowledgeTaskKind, KnowledgeFacet[]> = {
  extract: DEFAULT_EXTRACTION_FACETS,
  suggestExercise: ['taqwim', 'irsae', 'marifa', 'instructions', 'mostalahat'],
  suggestActivity: ['activity', 'instructions', 'wasail', 'manhaji', 'irsae'],
  explain: ['marifa', 'irsae', 'methodology', 'mostalahat', 'manhaji'],
  compare: ['marifa', 'irsae', 'methodology'],
  general: ['marifa', 'irsae', 'activity'],
};

/** تحديد أنواع المعلومة المطلوبة من صيغة السؤال. */
export function detectRequestedFacets(query: string): KnowledgeFacet[] {
  const normalized = normalizeArabic(query);
  const found = new Map<KnowledgeFacet, number>();
  const register = (facet: KnowledgeFacet, weight: number) => {
    found.set(facet, (found.get(facet) || 0) + weight);
  };
  for (const token of tokenize(query)) {
    for (const facet of FACET_TERM_INDEX.get(token) || []) register(facet, 1);
  }
  // عبارات مركبة لها أولوية أعلى (وضعية مشكلة، إرساء الموارد، تعليمات النشاط…)
  const phrases: Array<{ phrase: string; facet: KnowledgeFacet; weight: number }> = [
    { phrase: 'وضعيه مشكله', facet: 'moshkila', weight: 3 },
    { phrase: 'وضعيه مشكله', facet: 'wadiya', weight: 2 },
    { phrase: 'السؤال المشكل', facet: 'moshkila', weight: 3 },
    { phrase: 'ارساء الموارد', facet: 'irsae', weight: 3 },
    { phrase: 'ارساء المورد', facet: 'irsae', weight: 3 },
    { phrase: 'وضعيه ادماجيه', facet: 'taqwim', weight: 2 },
    { phrase: 'تعليمات النشاط', facet: 'instructions', weight: 3 },
    { phrase: 'اسئله النشاط', facet: 'instructions', weight: 3 },
    { phrase: 'الاجوبه المرتقبة', facet: 'answers', weight: 3 },
    { phrase: 'نشاط الاستاذ', facet: 'teacherRole', weight: 3 },
    { phrase: 'نشاط المتعلم', facet: 'learnerRole', weight: 3 },
    { phrase: 'الوضعيه الانطلاقيه', facet: 'wadiya', weight: 3 },
    { phrase: 'ما هي مقاطع', facet: 'map', weight: 4 },
    { phrase: 'قائمه المقاطع', facet: 'map', weight: 4 },
    { phrase: 'عناوين الدروس', facet: 'map', weight: 4 },
    { phrase: 'خريطه المنهاج', facet: 'map', weight: 4 },
    // عبارات الكفاءة: تميّز الختامية والشاملة عن مركبة الكفاءة
    { phrase: 'الكفاءه الختاميه', facet: 'kafaa', weight: 4 },
    { phrase: 'الكفاءات الختاميه', facet: 'kafaa', weight: 4 },
    { phrase: 'كفاءه ختاميه', facet: 'kafaa', weight: 4 },
    { phrase: 'الكفاءه الشامله', facet: 'kafaa', weight: 4 },
    { phrase: 'الكفاءات المستهدفه', facet: 'kafaa', weight: 3 },
    { phrase: 'مركبه الكفاءه', facet: 'markaba', weight: 4 },
    { phrase: 'مركبات الكفاءه', facet: 'markaba', weight: 4 },
    // عبارات بنيوية تُطلب صراحة من الوثائق الرسمية
    { phrase: 'الهدف التعلمي', facet: 'ta3alom', weight: 4 },
    { phrase: 'الاهداف التعليميه', facet: 'ta3alom', weight: 3 },
    { phrase: 'مقطع تعلمي', facet: 'maqta', weight: 3 },
    { phrase: 'مورد تعلمي', facet: 'mawrid', weight: 3 },
    { phrase: 'معايير التقويم', facet: 'ma3ayir', weight: 4 },
    { phrase: 'الحجم الساعي', facet: 'zaman', weight: 4 },
    { phrase: 'المخطط السنوي', facet: 'progression', weight: 3 },
    { phrase: 'المخططات السنويه', facet: 'progression', weight: 3 },
  ];
  for (const item of phrases) if (normalized.includes(item.phrase)) register(item.facet, item.weight);
  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 6);
}

/** نوع المهمة: استخراج، اقتراح نشاط، اقتراح تمرين، شرح، مقارنة. */
export function detectTask(query: string): KnowledgeTaskKind {
  const normalized = normalizeArabic(query);
  if (/اقترح|اقتراح|صمم|ابني|انشئ|فكره|بدائل|بديل/.test(normalized)) {
    if (/تمرين|تمارين|تطبيق|تطبيقات|فرض|اختبار|تقويم|ادماج|تنقيط/.test(normalized)) return 'suggestExercise';
    return 'suggestActivity';
  }
  if (/قارن|مقارنه|الفرق بين|تعارض|اختلاف/.test(normalized)) return 'compare';
  if (/اشرح|فسر|وضح|لماذا|كيف|ما سبب/.test(normalized)) return 'explain';
  if (/استخرج|استخراج|حدد|اذكر|اعرض|ابحث|ما هي|ما هو|فيم|اوجد|اعطني/.test(normalized)) return 'extract';
  return 'general';
}

/** ذكر الأستاذ لعائلة مصدر صريحة يرجّح نتائجها («حسب الوثيقة المرافقة»…). */
const KIND_HINTS: Array<{ pattern: RegExp; kind: KnowledgeSourceKind; boost: number }> = [
  { pattern: /الوثيقه المرافقه|الوثائق المرافقه/, kind: 'companionDocument', boost: 1.9 },
  { pattern: /دليل الاستاذ|الكتاب المدرسي|كتاب الاستاذ/, kind: 'teacherGuide', boost: 1.9 },
  { pattern: /المنهاج|المنهج الرسمي|المقرر الرسمي/, kind: 'curriculum', boost: 1.6 },
  { pattern: /التدرج|التوزيع السنوي|التوزيع الشهري/, kind: 'progression', boost: 1.7 },
  { pattern: /المذكره|المذكرات|مذكرتي/, kind: 'memo', boost: 1.4 },
  { pattern: /وثيقتي|الوثيقه المرفوعه|ملفي/, kind: 'teacherDocument', boost: 1.8 },
];

export function detectKindHints(query: string): Array<{ kind: KnowledgeSourceKind; boost: number }> {
  const normalized = normalizeArabic(query);
  return KIND_HINTS.filter(item => item.pattern.test(normalized)).map(item => ({ kind: item.kind, boost: item.boost }));
}

/* ───────────────────────────── بناء الفهرس ───────────────────────────── */

const LEVELS: Array<'1am' | '2am' | '3am' | '4am'> = ['1am', '2am', '3am', '4am'];

const DISTRIBUTIONS: Record<'1am' | '2am' | '3am' | '4am', OfficialAnnualDistributionRow[]> = {
  '1am': OFFICIAL_1AM_DISTRIBUTION,
  '2am': OFFICIAL_2AM_DISTRIBUTION,
  '3am': OFFICIAL_3AM_DISTRIBUTION,
  '4am': OFFICIAL_4AM_DISTRIBUTION,
};

const priorityOf = (kind: KnowledgeSourceKind, status: KnowledgeStatus): number => {
  const base = sourcePriorityOf(kind === 'teacherDocument' ? 'attachment' : kind);
  if (status === 'official') return Math.max(1, base - 0.4);
  if (status === 'teacher') return base;
  if (status === 'ocr') return base + 1.5;
  if (status === 'reference') return base + 0.6;
  return base;
};

export const cleanText = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

export const multiline = (value: unknown): string => String(value ?? '').replace(/[ \t]+/g, ' ').trim();

const tablesToText = (tables: unknown, title: string): string => {
  if (!Array.isArray(tables) || tables.length === 0) return '';
  const parts: string[] = [];
  for (const table of tables as Array<{ table_title?: string; headers?: string[]; rows?: string[][] }>) {
    const head = cleanText(table?.table_title) || title;
    const headers = Array.isArray(table?.headers) ? table.headers.map(cleanText).filter(Boolean) : [];
    const rows = Array.isArray(table?.rows)
      ? table.rows.map(row => (Array.isArray(row) ? row.map(cleanText).join(' | ') : '')).filter(Boolean)
      : [];
    if (!headers.length && !rows.length) continue;
    parts.push([head, headers.length ? `الرؤوس: ${headers.join(' | ')}` : '', ...rows].filter(Boolean).join('\n'));
  }
  return parts.join('\n\n');
};

const diagramsToText = (diagrams: unknown): string => {
  if (!Array.isArray(diagrams) || diagrams.length === 0) return '';
  const lines = (diagrams as Array<{ title?: string; description?: string; svg?: string }>)
    .map(item => {
      const title = cleanText(item?.title);
      const description = cleanText(item?.description);
      if (!title && !description) return '';
      return [title, description].filter(Boolean).join(' — ');
    })
    .filter(Boolean);
  return lines.join('\n');
};

const TEACHER_PHASES: Array<{ key: 'inilitaq' | 'taqasi' | 'irsae' | 'taqwim'; label: string }> = [
  { key: 'inilitaq', label: 'مرحلة الانطلاق' },
  { key: 'taqasi', label: 'مرحلة التقصي' },
  { key: 'irsae', label: 'مرحلة إرساء الموارد' },
  { key: 'taqwim', label: 'مرحلة التقويم' },
];

export interface IndexBuildOptions {
  lessons?: LessonMemo[];
  teacherDocs?: TeacherKnowledgeDoc[];
  /** الوثائق الرسمية الحرفية (المنهاج، الوثيقة المرافقة، دليل الأستاذ، المخططات). */
  officialDocs?: OfficialKnowledgeDoc[];
  includeProgression?: boolean;
  includeCorpus?: boolean;
  /** تضمين المصادر الرسمية الحرفية؛ الافتراضي نعم. */
  includeOfficialDocs?: boolean;
}

const buildMemoDocuments = (lessons: LessonMemo[]): { documents: KnowledgeDocument[]; chunks: KnowledgeChunk[] } => {
  const documents: KnowledgeDocument[] = [];
  const chunks: KnowledgeChunk[] = [];

  for (const level of LEVELS) {
    const levelLessons = lessons.filter(item => item.level === level);
    if (!levelLessons.length) continue;
    const document: KnowledgeDocument = {
      id: `kb-memo-${level}`,
      kind: 'memo',
      title: `قاعدة المذكرات — ${KNOWLEDGE_LEVEL_LABELS[level]}`,
      authority: 'قاعدة بيانات المنصة (منقولة من المذكرات والتدرجات الرسمية)',
      level,
      status: 'platform',
      role: `${levelLessons.length} مذكرة مفهرسة بحقولها وأنشطتها.`,
    };
    documents.push(document);

    levelLessons.forEach((lesson, lessonIndex) => {
      const scope: KnowledgeScope = {
        midan: cleanText(lesson.midan),
        maqta: cleanText(lesson.maqta),
        mawrid: cleanText(lesson.mawrid),
        ta3alom: cleanText(lesson.ta3alom),
        memoNumber: cleanText(lesson.memoNumber),
      };
      const path = [scope.midan, scope.maqta, scope.mawrid, scope.ta3alom].filter(Boolean).join(' ← ');
      let counter = 0;
      const push = (facet: KnowledgeFacet, section: string, text: unknown, extra: KnowledgeScope = {}) => {
        const body = multiline(text).trim();
        if (body.length < 3) return;
        counter += 1;
        chunks.push({
          id: `kb-memo-${level}-${lessonIndex}-${counter}`,
          documentId: document.id,
          documentTitle: document.title,
          kind: document.kind,
          status: document.status,
          level,
          facet,
          section: section || KNOWLEDGE_FACET_LABELS[facet],
          text: body,
          scope: { ...scope, ...extra },
          priority: priorityOf(document.kind, document.status),
        });
      };

      push('ta3alom', 'بطاقة الوحدة التعلمية', `${KNOWLEDGE_LEVEL_LABELS[level]}${scope.memoNumber ? ` — المذكرة ${scope.memoNumber}` : ''}\n${path}`);
      if (lesson.kafaaKhitamiya) push('kafaa', 'الكفاءة الختامية', lesson.kafaaKhitamiya);
      if (lesson.markaba) push('markaba', 'مركبة الكفاءة', lesson.markaba);
      if (lesson.ma3ayirTaqwim) push('ma3ayir', 'معايير التقويم', lesson.ma3ayirTaqwim);
      if (lesson.marifa) push('marifa', 'المورد المعرفي', lesson.marifa);
      if (lesson.manhaji) push('manhaji', 'المورد المنهجي', lesson.manhaji);
      if (lesson.mostalahat) push('mostalahat', 'المصطلحات', lesson.mostalahat);
      if (lesson.wasail) push('wasail', 'الوسائل', lesson.wasail);
      if (lesson.marajie) push('reference', 'المراجع', lesson.marajie);
      if (lesson.zamanKoli) push('zaman', 'الزمن الكلي', lesson.zamanKoli);
      if (lesson.wadiya) push('wadiya', 'الوضعية الانطلاقية', lesson.wadiya);
      const wadiyaTables = tablesToText(lesson.wadiyaTables, 'جدول الوضعية');
      if (wadiyaTables) push('wadiya', 'جداول الوضعية الانطلاقية', wadiyaTables);
      if (lesson.moshkila) push('moshkila', 'المشكلة المطروحة', lesson.moshkila);
      if (lesson.faradiyat) push('faradiyat', 'الفرضيات', lesson.faradiyat);

      (Array.isArray(lesson.anshita) ? lesson.anshita : []).forEach((activity, activityIndex) => {
        const title = cleanText(activity?.title) || `النشاط ${activityIndex + 1}`;
        const activityScope: KnowledgeScope = {
          activityId: cleanText(activity?.sourceActivityId)
            || `${lesson.sourceLearningUnitId || lessonIndex}-act-${activityIndex + 1}`,
        };
        const meta = [
          activity?.zaman ? `الزمن: ${cleanText(activity.zaman)}` : '',
          activity?.mola7adha ? `ملاحظة: ${cleanText(activity.mola7adha)}` : '',
        ].filter(Boolean).join('\n');
        push('activity', title, [title, meta].filter(Boolean).join('\n'), activityScope);
        if (activity?.asila) push('instructions', `${title} — التعليمات والأسئلة`, activity.asila, activityScope);
        if (activity?.ajwiba) push('answers', `${title} — الأجوبة المرتقبة`, activity.ajwiba, activityScope);
        const activityTables = tablesToText(activity?.tables, 'جدول النشاط');
        if (activityTables) push('activity', `${title} — جداول وبيانات`, activityTables, activityScope);
        const activityDiagrams = diagramsToText(activity?.diagrams);
        if (activityDiagrams) push('activity', `${title} — الرسوم والمخططات`, activityDiagrams, activityScope);
      });

      const lessonDiagrams = diagramsToText(lesson.diagrams)
        || diagramsToText(lesson.diagramTitle || lesson.diagramDescription
          ? [{ title: lesson.diagramTitle, description: lesson.diagramDescription }]
          : []);
      if (lessonDiagrams) push('activity', 'الرسوم والمخططات المرفقة', lessonDiagrams);

      if (lesson.irsae) push('irsae', 'إرساء المورد', lesson.irsae);
      const irsaeTables = tablesToText(lesson.irsaeTables, 'جدول إرساء المورد');
      if (irsaeTables) push('irsae', 'جداول إرساء المورد', irsaeTables);
      if (lesson.taqwim) push('taqwim', 'التقويم', lesson.taqwim);
      const taqwimTables = tablesToText(lesson.taqwimTables, 'جدول التقويم');
      if (taqwimTables) push('taqwim', 'جداول التقويم', taqwimTables);

      for (const phase of TEACHER_PHASES) {
        const teacherText = cleanText((lesson.ustadhNashat as Record<string, string> | undefined)?.[phase.key]);
        const learnerText = cleanText((lesson.mutaalimNashat as Record<string, string> | undefined)?.[phase.key]);
        if (teacherText) push('teacherRole', `نشاط الأستاذ — ${phase.label}`, teacherText);
        if (learnerText) push('learnerRole', `نشاط المتعلم — ${phase.label}`, learnerText);
      }
    });
  }

  return { documents, chunks };
};

const buildCurriculumMap = (lessons: LessonMemo[]): { documents: KnowledgeDocument[]; chunks: KnowledgeChunk[] } => {
  const documents: KnowledgeDocument[] = [];
  const chunks: KnowledgeChunk[] = [];

  for (const level of LEVELS) {
    const levelLessons = lessons.filter(item => item.level === level);
    if (!levelLessons.length) continue;
    const document: KnowledgeDocument = {
      id: `kb-curriculum-map-${level}`,
      kind: 'curriculum',
      title: `خريطة المنهاج — ${KNOWLEDGE_LEVEL_LABELS[level]}`,
      authority: 'قاعدة بيانات المنصة (المنهاج والتدرج الرسمي)',
      level,
      status: 'platform',
      role: 'الميدان ← المقطع التعلمي ← المورد التعلمي ← تعلم المورد كما هي مثبتة في القاعدة.',
    };
    documents.push(document);

    const byMaqta = new Map<string, { midan: string; mawrid: Map<string, Set<string>> }>();
    for (const lesson of levelLessons) {
      const maqta = cleanText(lesson.maqta) || '(بدون مقطع)';
      if (!byMaqta.has(maqta)) byMaqta.set(maqta, { midan: cleanText(lesson.midan), mawrid: new Map() });
      const entry = byMaqta.get(maqta)!;
      const mawrid = cleanText(lesson.mawrid) || '(بدون مورد)';
      if (!entry.mawrid.has(mawrid)) entry.mawrid.set(mawrid, new Set());
      const ta3alom = cleanText(lesson.ta3alom);
      if (ta3alom) entry.mawrid.get(mawrid)!.add(ta3alom);
    }

    byMaqta.forEach((entry, maqta) => {
      const mawridNames = [...entry.mawrid.keys()];
      const text = [
        `${KNOWLEDGE_LEVEL_LABELS[level]} — الميدان: ${entry.midan || 'غير محدد'}`,
        `المقطع التعلمي: ${maqta}`,
        `الموارد التعلمية (${mawridNames.length}):`,
        ...mawridNames.map((name, index) => {
          const units = [...(entry.mawrid.get(name) || [])];
          return `${index + 1}) ${name}${units.length ? `\n   تعلمات المورد: ${units.join(' | ')}` : ''}`;
        }),
      ].join('\n');
      chunks.push({
        id: `${document.id}-${chunks.length}`,
        documentId: document.id,
        documentTitle: document.title,
        kind: document.kind,
        status: document.status,
        level,
        facet: 'map',
        section: maqta,
        text,
        scope: { midan: entry.midan, maqta },
        priority: priorityOf(document.kind, document.status),
      });
    });
  }

  return { documents, chunks };
};

const buildProgression = (): { documents: KnowledgeDocument[]; chunks: KnowledgeChunk[] } => {
  const documents: KnowledgeDocument[] = [];
  const chunks: KnowledgeChunk[] = [];

  for (const level of LEVELS) {
    const rows = DISTRIBUTIONS[level] || [];
    if (!rows.length) continue;
    const document: KnowledgeDocument = {
      id: `kb-progression-${level}`,
      kind: 'progression',
      title: `التدرج والتوزيع السنوي — ${KNOWLEDGE_LEVEL_LABELS[level]}`,
      authority: 'الوثائق المرفقة للتدرجات الرسمية',
      level,
      status: 'platform',
      role: 'توزيع الحصص أسبوعياً: الميدان، المقطع، المورد، ونص الحصتين.',
    };
    documents.push(document);

    const byMonth = new Map<string, OfficialAnnualDistributionRow[]>();
    for (const row of rows) {
      const month = cleanText((row as { month?: string }).month) || 'غير محدد';
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month)!.push(row);
    }

    byMonth.forEach((monthRows, month) => {
      const lines = monthRows.map(row => [
        `الأسبوع ${cleanText((row as { week?: number | string }).week)}${cleanText((row as { dates?: string }).dates) ? ` (${cleanText((row as { dates?: string }).dates)})` : ''}`,
        cleanText(row.midan) ? `الميدان: ${cleanText(row.midan)}` : '',
        cleanText(row.maqta) ? `المقطع: ${cleanText(row.maqta)}` : '',
        cleanText(row.mawrid) ? `المورد: ${cleanText(row.mawrid)}` : '',
        cleanText((row as { learningUnit?: string }).learningUnit) ? `تعلم المورد: ${cleanText((row as { learningUnit?: string }).learningUnit)}` : '',
        cleanText(row.session1) ? `الحصة 1: ${cleanText(row.session1)}` : '',
        cleanText(row.session2) ? `الحصة 2: ${cleanText(row.session2)}` : '',
      ].filter(Boolean).join('\n'));
      chunks.push({
        id: `${document.id}-${chunks.length}`,
        documentId: document.id,
        documentTitle: document.title,
        kind: document.kind,
        status: document.status,
        level,
        facet: 'progression',
        section: month,
        text: `${KNOWLEDGE_LEVEL_LABELS[level]} — شهر ${month}\n${lines.join('\n\n')}`,
        scope: {},
        priority: priorityOf(document.kind, document.status),
      });
    });
  }

  return { documents, chunks };
};

const buildCorpus = (): { documents: KnowledgeDocument[]; chunks: KnowledgeChunk[] } => {
  const documents: KnowledgeDocument[] = [];
  const chunks: KnowledgeChunk[] = [];
  for (const doc of KNOWLEDGE_BASE_CORPUS) {
    const document: KnowledgeDocument = {
      id: doc.id,
      kind: doc.kind,
      title: doc.title,
      authority: doc.authority,
      url: doc.url,
      level: doc.level,
      status: doc.status,
      role: doc.role,
    };
    documents.push(document);
    doc.sections.forEach((section, index) => {
      chunks.push({
        id: `${doc.id}-${index}`,
        documentId: document.id,
        documentTitle: document.title,
        kind: document.kind,
        status: document.status,
        level: document.level,
        facet: section.facet,
        section: section.section,
        text: multiline(section.text),
        scope: {},
        url: document.url,
        priority: priorityOf(document.kind, document.status),
      });
    });
  }
  return { documents, chunks };
};

const TEACHER_CHUNK_SIZE = 1100;

/** تقسيم نص وثيقة إلى مقاطع بحجم مناسب للبحث مع الحفاظ على العناوين. */
export function chunkTeacherText(text: string, maxSize: number = TEACHER_CHUNK_SIZE): string[] {
  const clean = String(text || '').replace(/\r/g, '');
  if (!clean.trim()) return [];
  const blocks = clean.split(/\n{2,}|(?=^#{1,4}\s)/m).map(block => block.trim()).filter(Boolean);
  const pieces: string[] = [];
  let buffer = '';
  const flush = () => { if (buffer.trim()) pieces.push(buffer.trim()); buffer = ''; };
  for (const block of blocks) {
    if (block.length > maxSize) {
      flush();
      const sentences = block.split(/(?<=[.!؟\n])\s+/);
      let part = '';
      for (const sentence of sentences) {
        if ((part + sentence).length > maxSize) {
          if (part.trim()) pieces.push(part.trim());
          part = sentence;
        } else {
          part = `${part} ${sentence}`.trim();
        }
      }
      if (part.trim()) pieces.push(part.trim());
      continue;
    }
    if (buffer && (buffer + '\n\n' + block).length > maxSize) flush();
    buffer = buffer ? `${buffer}\n\n${block}` : block;
  }
  flush();
  return pieces;
}

/**
 * قواعد تحديد نوع المعلومة داخل نص حر (وثيقة أستاذ أو نص رسمي مفرَّغ).
 *
 * كل قاعدة قائمة مصطلحات بأوزان: المصطلح المركّب («الكفاءة الختامية») يرجّح
 * بوزن أعلى من المفرد («كفاءة»)، لأن الصفحات الرسمية طويلة وتذكر عدة مفاهيم
 * معاً. الترتيب في المصفوفة يحسم التعادل، لذا تسبقها الواجهات البنيوية.
 */
const FACET_TEXT_RULES: Array<{ facet: KnowledgeFacet; terms: Array<[string, number]> }> = [
  { facet: 'kafaa', terms: [['كفاءه ختاميه', 4], ['كفاءات ختاميه', 4], ['كفاءه شامله', 4], ['الكفاءات المستهدفه', 3], ['كفاءه', 1]] },
  { facet: 'markaba', terms: [['مركبات الكفاءه', 4], ['مركبه الكفاءه', 4], ['مركبات', 2], ['مركبه', 2]] },
  { facet: 'ma3ayir', terms: [['معايير التقويم', 4], ['معايير', 2], ['معيار', 2]] },
  { facet: 'midan', terms: [['الميادين', 3], ['ميادين', 2], ['ميدان', 2]] },
  { facet: 'maqta', terms: [['مقطع تعلمي', 4], ['المقاطع التعلمي', 3], ['مقطع', 1]] },
  { facet: 'mawrid', terms: [['مورد تعلمي', 4], ['الموارد التعلمي', 3], ['مورد', 1]] },
  { facet: 'ta3alom', terms: [['الهدف التعلمي', 4], ['تعلم المورد', 4], ['اهداف تعليميه', 3]] },
  { facet: 'marifa', terms: [['مورد معرفي', 4], ['الموارد المعرفيه', 3]] },
  { facet: 'manhaji', terms: [['مورد منهجي', 4], ['الموارد المنهجيه', 3]] },
  { facet: 'mostalahat', terms: [['مصطلحات', 3], ['مصطلح', 3]] },
  { facet: 'zaman', terms: [['حجم ساعي', 4], ['الحجم الساعي', 4], ['عدد الاسابيع', 3], ['الحصص', 2]] },
  { facet: 'progression', terms: [['المخططات السنويه', 3], ['المخطط السنوي', 3], ['توزيع سنوي', 3], ['تدرج', 3], ['اسبوع', 1]] },
  { facet: 'wadiya', terms: [['وضعيه انطلاق', 4], ['الوضعيه الانطلاقيه', 4], ['انطلاقيه', 3], ['وضعيات', 1]] },
  { facet: 'moshkila', terms: [['اشكالي', 4], ['نص الوضعيه', 3], ['مشكل', 3]] },
  { facet: 'faradiyat', terms: [['فرضيات', 4], ['فرضي', 4]] },
  { facet: 'irsae', terms: [['ارساء', 4], ['خلاصه', 3], ['حصيله', 3]] },
  { facet: 'teacherRole', terms: [['دور الاستاذ', 4], ['نشاط الاستاذ', 4], ['يقود الاستاذ', 3]] },
  { facet: 'learnerRole', terms: [['دور المتعلم', 4], ['نشاط المتعلم', 4]] },
  { facet: 'instructions', terms: [['تعليمات', 4], ['اسئله', 3], ['السند', 2]] },
  { facet: 'answers', terms: [['سلم التنقيط', 4], ['اجوبه', 4], ['الاجابه المرتقبه', 4], ['اجابه', 3]] },
  { facet: 'taqwim', terms: [['تقويم', 3], ['اختبار', 3], ['فرض', 2], ['تمرين', 2], ['تطبيق', 1]] },
  { facet: 'activity', terms: [['انشطه', 3], ['النشاط', 2], ['نشاط', 1]] },
  { facet: 'wasail', terms: [['وسائل', 3], ['السندات', 2], ['ادوات', 2]] },
  { facet: 'methodology', terms: [['توجيه منهجي', 4], ['دليل الاستاذ', 3], ['وثيقه مرافقه', 3], ['ارشاد', 2]] },
];

/** حجم النص الذي تُفحص فيه المصطلحات؛ يكفي لتحديد الموضوع دون كلفة على الفهرسة. */
const FACET_GUESS_WINDOW = 1600;

/**
 * طيّ أداة التعريف لمقارنة مصطلحات الواجهات.
 *
 * `normalizeArabic` لا تحذف «ال»، فكان المصطلح «كفاءة ختامية» لا يطابق
 * «الكفاءة الختامية» كما ترد في الوثائق الرسمية. تُحذف «ال» من أول كل كلمة
 * في النص والمصطلح معاً، فتبقى القواعد مكتوبة بصيغتها الطبيعية.
 */
const foldArticle = (value: string): string => normalizeArabic(value).replace(/(^|\s)ال/g, '$1');

const countTerm = (haystack: string, needle: string): number => {
  if (!needle) return 0;
  let count = 0;
  let from = haystack.indexOf(needle);
  while (from >= 0 && count < 3) {
    count += 1;
    from = haystack.indexOf(needle, from + needle.length);
  }
  return count;
};

/**
 * تخمين نوع المعلومة داخل نص حر (وثيقة أستاذ أو نص رسمي مفرَّغ).
 *
 * تُجمع أوزان كل قاعدة بدل الاكتفاء بأول مطابقة: الصفحة الرسمية قد تذكر
 * «التقويم» عَرَضاً بينما موضوعها «الكفاءة الختامية»، والمطابقة الأولى كانت
 * تُصنّفها خطأ. ظهور المصطلح في أول سطر (موضع العنوان) يمنح ترجيحاً إضافياً.
 */
const FACET_TERM_FOLDS = new Map<string, string>();
const foldTerm = (term: string): string => {
  const cached = FACET_TERM_FOLDS.get(term);
  if (cached !== undefined) return cached;
  const folded = foldArticle(term);
  FACET_TERM_FOLDS.set(term, folded);
  return folded;
};

export function guessFacetOfFreeText(text: string): KnowledgeFacet {
  const source = String(text || '');
  const normalized = foldArticle(source.slice(0, FACET_GUESS_WINDOW));
  if (!normalized) return 'reference';
  const newlineAt = source.indexOf('\n');
  const heading = foldArticle(source.slice(0, newlineAt > 0 ? Math.min(newlineAt, 160) : Math.min(source.length, 160)));
  let best: { facet: KnowledgeFacet; score: number } | null = null;
  for (const rule of FACET_TEXT_RULES) {
    let score = 0;
    for (const [rawTerm, weight] of rule.terms) {
      const term = foldTerm(rawTerm);
      const hits = countTerm(normalized, term);
      if (hits === 0) continue;
      score += weight * hits;
      if (heading.includes(term)) score += weight * 2;
    }
    // التساوي يحسمه ترتيب القواعد: الواجهات البنيوية أولاً.
    if (score > 0 && (!best || score > best.score)) best = { facet: rule.facet, score };
  }
  return best ? best.facet : 'reference';
}

/**
 * حجم المقطع للوثائق الرسمية: أكبر قليلاً من وثائق الأستاذ لأن الصفحة الواحدة
 * وحدة استشهاد متماسكة، وتفتيتها أكثر يفقد الفقرة سياقها.
 */
const OFFICIAL_CHUNK_SIZE = 1500;

/**
 * أدنى طول لمقطع رسمي مفهرس. التفريغ يولّد أحياناً شذرات في آخر الصفحة
 * (بقايا خلية جدول أو رقم)، ومقاطعة بهذه القِصَر لا تحمل معنى وتلوّث البحث،
 * فتُدمج في المقطع السابق بدل فهرستها مستقلة.
 */
const MIN_OFFICIAL_CHUNK = 60;

const mergeShortPieces = (pieces: string[]): string[] => {
  const merged: string[] = [];
  for (const piece of pieces) {
    const previous = merged[merged.length - 1];
    if (piece.length < MIN_OFFICIAL_CHUNK && previous) {
      merged[merged.length - 1] = `${previous}\n${piece}`;
      continue;
    }
    merged.push(piece);
  }
  // شذرة أولى قصيرة تُرحَّل إلى ما بعدها
  if (merged.length > 1 && merged[0].length < MIN_OFFICIAL_CHUNK) {
    const [head, ...rest] = merged;
    return [`${head}\n${rest[0]}`, ...rest.slice(1)];
  }
  return merged.filter(piece => piece.length >= MIN_OFFICIAL_CHUNK || merged.length === 1);
};

/**
 * فهرسة النصوص الرسمية الحرفية صفحةً صفحة.
 *
 * الفرق الجوهري عن وثائق الأستاذ أن كل مقطع يحمل رقم صفحته في الملف الأصلي،
 * فيصبح الاستشهاد قابلاً للتحقق: «الوثيقة المرافقة — ص 31». وحالة المصدر
 * `official` تمنحه أولوية أعلى من الملخصات المنهجية (`reference`) في المحرك.
 */
const buildOfficialDocs = (docs: OfficialKnowledgeDoc[]): { documents: KnowledgeDocument[]; chunks: KnowledgeChunk[] } => {
  const documents: KnowledgeDocument[] = [];
  const chunks: KnowledgeChunk[] = [];
  for (const doc of docs) {
    const pages = Array.isArray(doc.pages) ? doc.pages.filter(page => String(page?.text || '').trim()) : [];
    if (pages.length === 0) continue;
    const document: KnowledgeDocument = {
      id: doc.id,
      kind: doc.kind || 'curriculum',
      title: doc.title,
      authority: doc.authority || 'وزارة التربية الوطنية',
      url: doc.url,
      level: doc.level || 'all',
      status: 'official',
      role: doc.quality
        ? `نص رسمي حرفي مفرَّغ من ملف الوزارة (مطابقة ${doc.quality}%).`
        : 'نص رسمي حرفي مفرَّغ من ملف الوزارة.',
    };
    documents.push(document);
    for (const page of pages) {
      mergeShortPieces(chunkTeacherText(String(page.text), OFFICIAL_CHUNK_SIZE)).forEach((piece, index) => {
        const heading = cleanText(piece.split('\n')[0]).slice(0, 70);
        chunks.push({
          id: `${document.id}-p${page.page}-${index}`,
          documentId: document.id,
          documentTitle: document.title,
          kind: document.kind,
          status: document.status,
          level: document.level,
          facet: guessFacetOfFreeText(piece),
          section: heading ? `ص ${page.page} — ${heading}` : `ص ${page.page}`,
          text: piece,
          scope: {},
          url: document.url,
          page: page.page,
          priority: priorityOf(document.kind, document.status),
        });
      });
    }
  }
  return { documents, chunks };
};

const buildTeacherDocs = (docs: TeacherKnowledgeDoc[]): { documents: KnowledgeDocument[]; chunks: KnowledgeChunk[] } => {
  const documents: KnowledgeDocument[] = [];
  const chunks: KnowledgeChunk[] = [];
  for (const doc of docs) {
    const kind: KnowledgeSourceKind = doc.kind || 'teacherDocument';
    const status: KnowledgeStatus = doc.source === 'ocr' ? 'ocr' : 'teacher';
    const document: KnowledgeDocument = {
      id: doc.id,
      kind,
      title: doc.title,
      authority: doc.authority || (status === 'ocr' ? 'نص مصدر خام مستخرج آلياً' : 'وثيقة رفعها الأستاذ'),
      url: doc.url,
      level: doc.level || 'all',
      status,
      role: status === 'ocr' ? 'نص المصدر الخام (OCR) — جودة متغيرة.' : 'وثيقة أستاذ مفهرسة في قاعدة المعرفة.',
    };
    documents.push(document);
    chunkTeacherText(doc.text).forEach((piece, index) => {
      chunks.push({
        id: `${doc.id}-${index}`,
        documentId: document.id,
        documentTitle: document.title,
        kind: document.kind,
        status: document.status,
        level: document.level,
        facet: guessFacetOfFreeText(piece),
        section: cleanText(piece.split('\n')[0]).slice(0, 80) || `مقطع ${index + 1}`,
        text: piece,
        scope: {},
        url: document.url,
        priority: priorityOf(document.kind, document.status),
      });
    });
  }
  return { documents, chunks };
};

interface IndexedChunk {
  chunk: KnowledgeChunk;
  tf: Map<string, number>;
  titleTokens: Set<string>;
  normalized: string;
}

interface IndexBundle {
  index: KnowledgeIndex;
  chunks: IndexedChunk[];
  inverted: Map<string, number[]>;
  frequencies: Map<string, number>;
}

function computeStats(documents: KnowledgeDocument[], chunks: KnowledgeChunk[]): KnowledgeIndexStats {
  const byKind: Record<string, number> = {};
  const byFacet: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const chunk of chunks) {
    byKind[chunk.kind] = (byKind[chunk.kind] || 0) + 1;
    byFacet[chunk.facet] = (byFacet[chunk.facet] || 0) + 1;
    byLevel[chunk.level] = (byLevel[chunk.level] || 0) + 1;
    byStatus[chunk.status] = (byStatus[chunk.status] || 0) + 1;
  }
  return { chunks: chunks.length, documents, byKind, byFacet, byLevel, byStatus };
}

export function buildKnowledgeIndex(options: IndexBuildOptions = {}): KnowledgeIndex {
  const lessons = options.lessons && options.lessons.length ? options.lessons : getOfficialCurriculumDatabase();
  const memoPart = buildMemoDocuments(lessons);
  const mapPart = buildCurriculumMap(lessons);
  const progressionPart = options.includeProgression === false ? { documents: [], chunks: [] } : buildProgression();
  const corpusPart = options.includeCorpus === false ? { documents: [], chunks: [] } : buildCorpus();
  const teacherPart = buildTeacherDocs(Array.isArray(options.teacherDocs) ? options.teacherDocs : []);
  const officialPart = options.includeOfficialDocs === false
    ? { documents: [], chunks: [] }
    : buildOfficialDocs(Array.isArray(options.officialDocs) ? options.officialDocs : []);

  const documents = [
    ...mapPart.documents,
    ...officialPart.documents,
    ...corpusPart.documents,
    ...progressionPart.documents,
    ...memoPart.documents,
    ...teacherPart.documents,
  ];
  const chunks = [
    ...mapPart.chunks,
    ...officialPart.chunks,
    ...corpusPart.chunks,
    ...progressionPart.chunks,
    ...memoPart.chunks,
    ...teacherPart.chunks,
  ];

  for (const document of documents) {
    document.chunkCount = chunks.filter(chunk => chunk.documentId === document.id).length;
  }

  return { documents, chunks, stats: computeStats(documents, chunks) };
}

const bundleOf = (index: KnowledgeIndex): IndexBundle => {
  const chunks: IndexedChunk[] = index.chunks.map(chunk => {
    const tokens = tokenize(`${chunk.section} ${chunk.text}`);
    const tf = new Map<string, number>();
    for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1);
    return {
      chunk,
      tf,
      titleTokens: new Set(tokenize(`${chunk.documentTitle} ${chunk.section}`)),
      normalized: normalizeArabic(chunk.text),
    };
  });
  const inverted = new Map<string, number[]>();
  const frequencies = new Map<string, number>();
  chunks.forEach((item, position) => {
    for (const token of item.tf.keys()) {
      frequencies.set(token, (frequencies.get(token) || 0) + 1);
      const postings = inverted.get(token);
      if (postings) postings.push(position);
      else inverted.set(token, [position]);
    }
  });
  return { index, chunks, inverted, frequencies };
};

const cache = new Map<string, { bundle: IndexBundle; lessons?: LessonMemo[] }>();
const CACHE_LIMIT = 4;

const signatureOf = (options: IndexBuildOptions): string => [
  options.lessons ? `${options.lessons.length}:${options.lessons[0]?.sourceLearningUnitId || ''}:${options.lessons[options.lessons.length - 1]?.ta3alom || ''}` : 'default',
  options.includeProgression === false ? 'no-progression' : 'progression',
  options.includeCorpus === false ? 'no-corpus' : 'corpus',
  (options.teacherDocs || []).map(doc => `${doc.id}:${doc.text.length}`).join(','),
  options.includeOfficialDocs === false
    ? 'no-official'
    : `official:${(options.officialDocs || []).map(doc => `${doc.id}:${doc.text.length}`).join(',')}`,
].join('|');

/** فهرس مخزّن مؤقتاً: يُعاد بناؤه فقط عند تغيّر الدروس أو وثائق الأستاذ. */
export function getKnowledgeBundle(options: IndexBuildOptions = {}): IndexBundle {
  const signature = signatureOf(options);
  const cached = cache.get(signature);
  if (cached && (cached.lessons === options.lessons || (!cached.lessons && !options.lessons))) {
    return cached.bundle;
  }
  const index = buildKnowledgeIndex(options);
  const bundle = bundleOf(index);
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(signature, { bundle, lessons: options.lessons });
  return bundle;
}

export function getKnowledgeIndex(options: IndexBuildOptions = {}): KnowledgeIndex {
  return getKnowledgeBundle(options).index;
}

export function getKnowledgeStats(options: IndexBuildOptions = {}): KnowledgeIndexStats {
  return getKnowledgeIndex(options).stats;
}

/** إعادة بناء الفهرس بعد تغيير قاعدة الدروس أو وثائق الأستاذ. */
export function invalidateKnowledgeCache(): void {
  cache.clear();
}

/* ───────────────────────────── البحث في القاعدة ───────────────────────────── */

interface QueryToken { token: string; weight: number; }

function expandQuery(query: string): QueryToken[] {
  const result: QueryToken[] = [];
  const seen = new Set<string>();
  for (const token of tokenize(query)) {
    if (!seen.has(token)) {
      seen.add(token);
      result.push({ token, weight: 1 });
    }
    for (const synonym of SYNONYMS.get(token) || SYNONYMS.get(stemToken(token)) || []) {
      for (const candidate of [synonym, stemToken(synonym)]) {
        if (!seen.has(candidate)) {
          seen.add(candidate);
          result.push({ token: candidate, weight: 0.5 });
        }
      }
    }
  }
  return result;
}

const STATUS_BOOST: Record<KnowledgeStatus, number> = {
  official: 1.3,
  platform: 1.15,
  reference: 1.0,
  teacher: 0.95,
  ocr: 0.75,
};

const levelWeight = (chunkLevel: KnowledgeLevel, wanted?: string): number => {
  if (!wanted) return 1;
  if (chunkLevel === 'all') return 1.02;
  return chunkLevel === String(wanted).toLowerCase() ? 1.35 : 0.35;
};

const buildSnippet = (text: string, terms: string[], max = 240): string => {
  if (text.length <= max) return text;
  const normalized = normalizeArabic(text);
  let position = -1;
  for (const term of terms) {
    const found = normalized.indexOf(term);
    if (found >= 0 && (position < 0 || found < position)) position = found;
  }
  if (position < 0) return `${text.slice(0, max).trim()}…`;
  const ratio = position / Math.max(1, normalized.length);
  const start = Math.max(0, Math.floor(ratio * text.length) - Math.floor(max / 3));
  const end = Math.min(text.length, start + max);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
};

export const sourceLabelOf = (chunk: KnowledgeChunk): string => {
  const kind = KNOWLEDGE_KIND_LABELS[chunk.kind] || chunk.kind;
  const level = chunk.level === 'all' ? '' : ` — ${KNOWLEDGE_LEVEL_LABELS[chunk.level]}`;
  // رقم الصفحة يجعل الاستشهاد من الوثيقة الرسمية قابلاً للتحقق منه ورقياً.
  const page = chunk.page ? ` — ص ${chunk.page}` : '';
  return `${kind}${level}${page}`;
};

export interface KnowledgeSearchOptions extends KnowledgeSearchFilters, IndexBuildOptions {
  query?: string;
}

/** بحث مرجّح في قاعدة المعرفة يعيد أفضل المقاطع المطابقة مع مقتطفاتها. */
export function searchKnowledge(query: string, options: KnowledgeSearchOptions = {}): KnowledgeHit[] {
  const bundle = getKnowledgeBundle(options);
  const total = bundle.chunks.length;
  if (!String(query || '').trim() || total === 0) return [];

  const topK = Math.max(1, Math.min(40, options.topK || 12));
  const kinds = options.kinds && options.kinds.length ? new Set(options.kinds) : null;
  const facets = options.facets && options.facets.length ? new Set(options.facets) : null;
  const level = options.level ? String(options.level).toLowerCase() : undefined;
  const scope = options.scope || {};
  const scopeText = normalizeArabic([scope.maqta, scope.mawrid, scope.ta3alom].filter(Boolean).join(' '));
  const normalizedQuery = normalizeArabic(query);
  const queryTokens = expandQuery(query);
  const kindHints = detectKindHints(query);

  const scores = new Map<number, number>();
  const matched = new Map<number, string[]>();
  const idfOf = (token: string) => Math.log(1 + total / ((bundle.frequencies.get(token) || 0) + 1));

  for (const { token, weight } of queryTokens) {
    const postings = bundle.inverted.get(token);
    if (!postings) continue;
    const idf = idfOf(token);
    for (const position of postings) {
      const item = bundle.chunks[position];
      const tf = item.tf.get(token) || 0;
      let value = idf * (1 + Math.log(tf)) * weight;
      if (item.titleTokens.has(token)) value *= 1.7;
      scores.set(position, (scores.get(position) || 0) + value);
      const list = matched.get(position) || [];
      if (!list.includes(token)) list.push(token);
      matched.set(position, list);
    }
  }

  // مكافأة العبارات المتجاورة («إرساء الموارد»، «الوضعية المشكلة»…) على النتائج المرشحة فقط.
  const ordered = tokenize(query);
  for (let i = 0; i < ordered.length - 1; i += 1) {
    const phrase = `${ordered[i]} ${ordered[i + 1]}`;
    if (phrase.length < 6) continue;
    const bonus = 1.5 * ((idfOf(ordered[i]) + idfOf(ordered[i + 1])) / 2);
    for (const position of scores.keys()) {
      if (bundle.chunks[position].normalized.includes(phrase)) {
        scores.set(position, (scores.get(position) || 0) + bonus);
      }
    }
  }

  const hits: KnowledgeHit[] = [];
  for (const [position, baseScore] of scores) {
    const item = bundle.chunks[position];
    const chunk = item.chunk;
    if (kinds && !kinds.has(chunk.kind)) continue;
    if (facets && !facets.has(chunk.facet)) continue;

    let score = baseScore * levelWeight(chunk.level, level) * (STATUS_BOOST[chunk.status] || 1);
    for (const hint of kindHints) if (hint.kind === chunk.kind) score *= hint.boost;
    if (scopeText) {
      const chunkScope = normalizeArabic([chunk.scope.maqta, chunk.scope.mawrid, chunk.scope.ta3alom].filter(Boolean).join(' '));
      if (chunkScope && (chunkScope.includes(scopeText) || scopeText.includes(chunkScope))) score *= 2;
    }
    if (normalizedQuery.length > 4 && item.normalized.includes(normalizedQuery)) score *= 1.5;
    // أولوية المصدر تكسر التعادل دون إلغاء نتيجة أدق.
    score += Math.max(0, 9 - chunk.priority) * 0.06;

    if (score < (options.minScore ?? 0.4)) continue;
    const terms = matched.get(position) || [];
    hits.push({
      chunk,
      score: Number(score.toFixed(3)),
      snippet: buildSnippet(chunk.text, terms),
      matchedTerms: terms.slice(0, 8),
      sourceLabel: sourceLabelOf(chunk),
    });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.chunk.priority - b.chunk.priority)
    .slice(0, topK);
}

/* ───────────────────────────── تحديد نطاق السؤال ───────────────────────────── */

const ORDINALS: Record<string, number> = {
  اول: 1, اولي: 1, ثاني: 2, ثانيه: 2, ثالث: 3, ثالثه: 3, رابع: 4, رابعه: 4,
  خامس: 5, خامسه: 5, سادس: 6, سابع: 7, ثامن: 8,
};

const ordinalOf = (value: string): number | null => {
  const match = normalizeArabic(value).match(/(مقطع|مورد|سلسله|وحده|ميدان)\s*(التعلمي)?\s*([0-9]{1,2}|اول|اولي|ثاني|ثانيه|ثالث|ثالثه|رابع|رابعه|خامس|خامسه)/);
  if (!match) return null;
  const token = match[3];
  if (/[0-9]/.test(token)) return Number(String(Number(token)));
  return ORDINALS[token] ?? null;
};

export interface ScopeResolutionOptions {
  lessons?: LessonMemo[];
  level?: string;
}

const LEVEL_PATTERNS: Array<[RegExp, KnowledgeLevel]> = [
  [/(?:السنه|مستوي|السنه الدراسية)\s*(?:ال)?(اول|اولي|اولى)\b/, '1am'],
  [/(?:السنه|مستوي)\s*(?:ال)?(ثاني|ثانيه)\b/, '2am'],
  [/(?:السنه|مستوي)\s*(?:ال)?(ثالث|ثالثه)\b/, '3am'],
  [/(?:السنه|مستوي)\s*(?:ال)?(رابع|رابعه)\b/, '4am'],
  [/(?:اول|اولي|اولى)\s*متوسط/, '1am'],
  [/(?:ثاني|ثانيه)\s*متوسط/, '2am'],
  [/(?:ثالث|ثالثه)\s*متوسط/, '3am'],
  [/(?:رابع|رابعه)\s*متوسط/, '4am'],
  [/(?:^|[^a-z0-9])1\s*(?:am|م|متوسط)/, '1am'],
  [/(?:^|[^a-z0-9])2\s*(?:am|م|متوسط)/, '2am'],
  [/(?:^|[^a-z0-9])3\s*(?:am|م|متوسط)/, '3am'],
  [/(?:^|[^a-z0-9])4\s*(?:am|م|متوسط)/, '4am'],
];

/** تحديد المستوى من نص السؤال («3am»، «السنة الثالثة متوسط»…) دون الخلط مع ترتيب المقطع. */
export function detectLevel(query: string, fallback?: string): KnowledgeLevel {
  const explicit = String(fallback || '').toLowerCase();
  if (/^[1-4]am$/.test(explicit)) return explicit as KnowledgeLevel;
  const normalized = ` ${normalizeArabic(query)} `.replace(/([^0-9a-z])am([^0-9a-z])/g, '$1 am $2');
  for (const [pattern, level] of LEVEL_PATTERNS) if (pattern.test(normalized)) return level;
  return 'all';
}

/** حد القبول لكل حقل: الحقول الأضيق تحتاج دقة أعلى حتى لا يُضيَّق النطاق خطأً. */
const FIELD_MIN_SCORE: Record<'midan' | 'maqta' | 'mawrid' | 'ta3alom', number> = {
  midan: 3.5,
  maqta: 3.5,
  mawrid: 3.5,
  ta3alom: 3.5,
};

const SCOPE_FIELDS = ['midan', 'maqta', 'mawrid', 'ta3alom'] as const;
type ScopeField = typeof SCOPE_FIELDS[number];

/** الحقل الأب لكل حقل: عند غموض القيمة نرتقي إلى القاسم المشترك. */
const PARENT_FIELD: Partial<Record<ScopeField, ScopeField>> = {
  maqta: 'midan',
  mawrid: 'maqta',
  ta3alom: 'mawrid',
};

const fieldValue = (lesson: LessonMemo, field: ScopeField): string =>
  cleanText((lesson as unknown as Record<string, string>)[field]);

/**
 * استخراج المستوى/الميدان/المقطع/المورد/تعلم المورد من نص السؤال.
 * الخوارزمية: تُسجَّل قيم الحقول بوزن IDF (الكلمة النادرة أدل)، ثم يُثبَّت أضيق
 * حقل قيمته وحيدة غير متنازع عليها؛ وعند تساوي قيمتين يُرتقى إلى القاسم المشترك
 * (المقطع أو المورد) بدل تضييق النطاق خطأً.
 */
export function resolveScope(query: string, options: ScopeResolutionOptions = {}): ResolvedScope {
  const lessons = options.lessons && options.lessons.length ? options.lessons : getOfficialCurriculumDatabase();
  const normalized = normalizeArabic(query);
  const queryTokens = new Set(tokenize(query));
  const queryOrdinal = ordinalOf(normalized);
  const level = detectLevel(query, options.level);
  const pool = level === 'all' ? lessons : lessons.filter(item => item.level === level);

  // تواتر كل كلمة عبر قيم الحقول المختلفة (لوزن الكلمات النادرة أكثر).
  const frequencies = new Map<string, number>();
  const distinctValues = new Set<string>();
  for (const lesson of pool) {
    for (const field of SCOPE_FIELDS) {
      const value = fieldValue(lesson, field);
      if (!value) continue;
      const key = `${field}:${lesson.level}:${value}`;
      if (distinctValues.has(key)) continue;
      distinctValues.add(key);
      for (const token of new Set(topicTokens(value))) {
        frequencies.set(token, (frequencies.get(token) || 0) + 1);
      }
    }
  }
  const totalValues = Math.max(1, distinctValues.size);
  const idf = (token: string) => Math.log(1 + totalValues / ((frequencies.get(token) || 0) + 1));

  interface ValueScore { score: number; ratio: number; substring: boolean; }

  const scoreValue = (value: string, withOrdinal: boolean): ValueScore => {
    const valueNormalized = normalizeArabic(value);
    const substring = valueNormalized.length > 3 && normalized.includes(valueNormalized);
    let score = substring ? 6 : 0;
    const valueTokens = [...new Set(topicTokens(value))];
    const matched = valueTokens.filter(token => queryTokens.has(token));
    for (const token of matched) score += 1.6 * idf(token);
    const ratio = valueTokens.length ? matched.length / valueTokens.length : 0;
    score += 2 * ratio;
    if (withOrdinal) {
      const valueOrdinal = ordinalOf(valueNormalized);
      if (queryOrdinal && valueOrdinal && valueOrdinal === queryOrdinal) score += 2.5;
    }
    return { score, ratio, substring };
  };

  const resolved: ResolvedScope = { level, candidates: [], lessonIds: [] };
  const ambiguous: string[] = [];
  let workingPool = pool;
  let narrowed = false;

  for (const field of ['maqta', 'mawrid', 'ta3alom'] as ScopeField[]) {
    const scored = new Map<string, { value: string; score: number; ratio: number; substring: boolean; lessons: LessonMemo[] }>();
    for (const lesson of workingPool) {
      const value = fieldValue(lesson, field);
      if (!value) continue;
      const { score, ratio, substring } = scoreValue(value, true);
      if (score < FIELD_MIN_SCORE[field]) continue;
      // لا نضيّق النطاق إلا بدليل قوي: مطابقة كاملة، أو أغلب كلمات القيمة (0.6 بعد تثبيت أب، 0.34 قبله).
      if (!substring && ratio < (narrowed ? 0.6 : 0.34)) continue;
      const entry = scored.get(value) || { value, score, ratio, substring, lessons: [] };
      entry.lessons.push(lesson);
      entry.score = Math.max(entry.score, score);
      scored.set(value, entry);
      resolved.candidates.push({ field, value, level: lesson.level as KnowledgeLevel, score: Number(score.toFixed(2)) });
    }
    if (!scored.size) {
      if (narrowed) break;
      continue;
    }

    const ranked = [...scored.values()].sort((a, b) => b.score - a.score);
    const best = ranked[0];
    // القيم المتقاربة (أقل من 20% فرقاً) تعتبر غموضاً لا رجحاناً.
    const tied = ranked.filter(item => item.score >= best.score * 0.8);

    if (tied.length === 1) {
      (resolved as unknown as Record<string, string | undefined>)[field] = best.value;
      workingPool = best.lessons;
      resolved.level = best.lessons[0]?.level as KnowledgeLevel || resolved.level;
      narrowed = true;
      continue;
    }

    // غموض بين قيمتين متكافئتين: نرتقي إلى القاسم المشترك بدل التخمين.
    ambiguous.push(...tied.map(item => item.value));
    const parentField = PARENT_FIELD[field];
    const tiedLessons = tied.flatMap(item => item.lessons);
    const parentValues = [...new Set(tiedLessons.map(lesson => fieldValue(lesson, parentField || 'midan')).filter(Boolean))];
    if (parentField && parentValues.length === 1) {
      (resolved as unknown as Record<string, string | undefined>)[parentField] = parentValues[0];
      workingPool = tiedLessons;
      resolved.level = tiedLessons[0]?.level as KnowledgeLevel || resolved.level;
    }
    break;
  }

  // الميدان يُستنتج من النطاق المثبت أو من السؤال مباشرة إن ورد وحده.
  if (!resolved.midan) {
    const direct = [...new Set(pool.map(lesson => fieldValue(lesson, 'midan')).filter(Boolean))]
      .map(value => ({ value, ...scoreValue(value, false) }))
      .filter(item => item.score >= FIELD_MIN_SCORE.midan)
      .sort((a, b) => b.score - a.score);
    const anchor = workingPool.find(lesson => fieldValue(lesson, 'midan'));
    if (direct.length === 1 && direct[0].ratio >= 0.5) {
      resolved.midan = direct[0].value;
      resolved.candidates.push({ field: 'midan', value: direct[0].value, level, score: Number(direct[0].score.toFixed(2)) });
    } else if (anchor && (resolved.maqta || resolved.mawrid || resolved.ta3alom)) {
      resolved.midan = fieldValue(anchor, 'midan');
    }
  }

  resolved.candidates = resolved.candidates
    .sort((a, b) => b.score - a.score)
    .filter((item, index, list) => list.findIndex(x => `${x.field}:${x.value}` === `${item.field}:${item.value}`) === index)
    .slice(0, 12);

  resolved.lessonIds = workingPool
    .filter(lesson =>
      (!resolved.maqta || fieldValue(lesson, 'maqta') === resolved.maqta)
      && (!resolved.mawrid || fieldValue(lesson, 'mawrid') === resolved.mawrid)
      && (!resolved.ta3alom || fieldValue(lesson, 'ta3alom') === resolved.ta3alom))
    .map(lesson => lesson.sourceLearningUnitId || `${lesson.level}-${lesson.memoNumber}-${lesson.ta3alom}`);

  if (ambiguous.length > 1) {
    (resolved as ResolvedScope & { ambiguous?: string[] }).ambiguous = [...new Set(ambiguous)].slice(0, 4);
  }

  return resolved;
}

/* ───────────────────────────── الاستخراج الموجه ───────────────────────────── */

export interface ExtractionOptions extends IndexBuildOptions {
  level?: string;
  facets?: KnowledgeFacet[];
  maxCandidates?: number;
  topK?: number;
  lesson?: LessonMemo | null;
}

const toCandidate = (hit: KnowledgeHit): ExtractionCandidate => ({
  text: hit.chunk.text,
  section: hit.chunk.section,
  documentTitle: hit.chunk.documentTitle,
  kind: hit.chunk.kind,
  status: hit.chunk.status,
  level: hit.chunk.level,
  url: hit.chunk.url,
  scope: hit.chunk.scope,
  page: hit.chunk.page,
  score: hit.score,
  priority: hit.chunk.priority,
  sourceLabel: hit.sourceLabel,
});

/**
 * البحث في المصادر وتقديم عدة احتمالات موثقة لكل نوع معلومة مطلوب:
 * المشكلة، الفرضيات، الأنشطة، التعليمات، الأجوبة، إرساء الموارد، التقويم…
 */
export function extractKnowledge(query: string, options: ExtractionOptions = {}): KnowledgeExtraction {
  const task = detectTask(query);
  const scope = resolveScope(query, { lessons: options.lessons, level: options.level || options.lesson?.level });
  const effectiveLevel = scope.level !== 'all'
    ? scope.level
    : ((options.lesson?.level as KnowledgeLevel) || 'all');

  const detectedFacets = detectRequestedFacets(query);
  const requestedFacets = options.facets && options.facets.length
    ? options.facets
    : (detectedFacets.length ? detectedFacets.slice(0, 5) : TASK_DEFAULT_FACETS[task]);

  const searchScope = {
    maqta: scope.maqta || (options.lesson ? cleanText(options.lesson.maqta) : undefined),
    mawrid: scope.mawrid || (options.lesson ? cleanText(options.lesson.mawrid) : undefined),
    ta3alom: scope.ta3alom || (options.lesson ? cleanText(options.lesson.ta3alom) : undefined),
  };
  const scoped = Boolean(searchScope.maqta || searchScope.mawrid || searchScope.ta3alom);

  const hits = searchKnowledge(query, {
    ...options,
    level: effectiveLevel,
    scope: searchScope,
    topK: Math.max(options.topK || 12, 12),
  });

  const maxCandidates = Math.max(1, Math.min(8, options.maxCandidates || 5));
  const facets: FacetExtraction[] = [];
  const missing: KnowledgeFacet[] = [];

  /** وزن تطابق المقطع مع النطاق المطلوب: الأضيق أولاً ثم المراجع العامة. */
  const scopeWeight = (candidate: ExtractionCandidate): number => {
    if (!scoped) return 0;
    const value = candidate.scope;
    if (!value || (!value.maqta && !value.mawrid && !value.ta3alom)) return -1;
    let weight = 0;
    if (searchScope.ta3alom && cleanText(value.ta3alom) === searchScope.ta3alom) weight += 4;
    if (searchScope.mawrid && cleanText(value.mawrid) === searchScope.mawrid) weight += 2;
    if (searchScope.maqta && cleanText(value.maqta) === searchScope.maqta) weight += 1;
    return weight;
  };

  for (const facet of requestedFacets) {
    const collected: ExtractionCandidate[] = [
      ...hits.filter(hit => hit.chunk.facet === facet).map(toCandidate),
    ];
    if (collected.length < maxCandidates) {
      collected.push(...searchKnowledge(query, {
        ...options,
        level: effectiveLevel,
        facets: [facet],
        scope: searchScope,
        topK: maxCandidates + 4,
        minScore: 0.02,
      }).map(toCandidate));
    }

    const unique: ExtractionCandidate[] = [];
    const seen = new Set<string>();
    for (const candidate of collected) {
      const key = normalizeArabic(candidate.text).slice(0, 140);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(candidate);
    }

    const weighted = unique
      .map(candidate => ({ candidate, weight: scopeWeight(candidate) }))
      .filter(item => effectiveLevel === 'all' || item.candidate.level === 'all' || item.candidate.level === effectiveLevel)
      .filter(item => !scoped || item.weight !== 0)
      .sort((a, b) => b.weight - a.weight || a.candidate.priority - b.candidate.priority || b.candidate.score - a.candidate.score);

    const kept = weighted.slice(0, maxCandidates).map(item => item.candidate);
    if (!kept.length) missing.push(facet);
    facets.push({ facet, label: KNOWLEDGE_FACET_LABELS[facet], candidates: kept });
  }

  const notes: string[] = [];
  if (!hits.length) notes.push('لم توجد نتيجة مطابقة في قاعدة المعرفة لهذا السؤال.');
  if (missing.length) {
    notes.push(`لا توجد قيم موثقة في القاعدة لـ: ${missing.map(facet => KNOWLEDGE_FACET_LABELS[facet]).join('، ')}. أي محتوى لها يوسم «اقتراح تربوي — يحتاج مراجعة الأستاذ».`);
  }
  if (task === 'suggestActivity' || task === 'suggestExercise') {
    notes.push('المهمة اقتراح: استعمل المقتطفات الموثقة كأساس، وقدّم 2–3 اقتراحات مختلفة (الوسائل، الزمن، مستوى الصعوبة) ولا تنسبها إلى المنهاج.');
  }
  if (!scope.candidates.length && !options.lesson) {
    notes.push('لم يتم التعرف على مقطع أو مورد محدد في السؤال؛ النتائج معروضة على نطاق أوسع.');
  }

  return {
    query,
    task,
    requestedFacets,
    scope: { ...scope, level: effectiveLevel },
    facets,
    hits,
    missing,
    notes,
    stats: getKnowledgeBundle(options).index.stats,
  };
}

/* ─────────────────── سياق النموذج وصياغة الجواب المحلي ─────────────────── */

const CONTEXT_ITEM_LIMIT = 900;

/** صياغة مقتطفات القاعدة كتعليقات مرقمة يستشهد بها النموذج في جوابه. */
export function buildKnowledgeContext(extraction: KnowledgeExtraction, budget = 14000): string {
  const lines: string[] = [];
  let used = 0;
  const scope = extraction.scope;
  const scopeLine = [
    scope.level !== 'all' ? KNOWLEDGE_LEVEL_LABELS[scope.level] : '',
    scope.midan, scope.maqta, scope.mawrid, scope.ta3alom,
  ].filter(Boolean).join(' ← ');
  if (scopeLine) {
    const header = `النطاق المستنتج من السؤال: ${scopeLine}`;
    lines.push(header);
    used += header.length;
  }

  extraction.hits.forEach((hit, index) => {
    const text = hit.chunk.text.length > CONTEXT_ITEM_LIMIT
      ? `${hit.chunk.text.slice(0, CONTEXT_ITEM_LIMIT)}…`
      : hit.chunk.text;
    const path = [hit.chunk.scope.maqta, hit.chunk.scope.mawrid, hit.chunk.scope.ta3alom].filter(Boolean).join(' ← ');
    const block = [
      `[${index + 1}] ${KNOWLEDGE_KIND_LABELS[hit.chunk.kind]} | ${KNOWLEDGE_LEVEL_LABELS[hit.chunk.level]} | ${KNOWLEDGE_STATUS_LABELS[hit.chunk.status]} | ${KNOWLEDGE_FACET_LABELS[hit.chunk.facet]}`,
      `الوثيقة: ${hit.chunk.documentTitle}${hit.chunk.url ? ` (${hit.chunk.url})` : ''}`,
      path ? `المسار: ${path}` : '',
      `العنوان: ${hit.chunk.section}`,
      `النص: ${text}`,
    ].filter(Boolean).join('\n');
    if (used + block.length > budget) return;
    used += block.length;
    lines.push(block);
  });

  if (!lines.length) return 'لا توجد مقتطفات مطابقة في قاعدة المعرفة لهذا السؤال.';
  return lines.join('\n\n');
}

const pathOf = (scope: KnowledgeScope): string =>
  [scope.midan, scope.maqta, scope.mawrid, scope.ta3alom].filter(Boolean).join(' ← ');

/**
 * جواب محلي موثّق من قاعدة المعرفة بدون مزود ذكاء اصطناعي:
 * يعرض كل الاحتمالات الموثقة مرقمة مع مصدر كل احتمال.
 */
export function buildLocalKnowledgeAnswer(extraction: KnowledgeExtraction, options: { maxPerFacet?: number } = {}): string {
  const max = options.maxPerFacet || 4;
  const parts: string[] = [];
  const scopeLine = [
    extraction.scope.level !== 'all' ? KNOWLEDGE_LEVEL_LABELS[extraction.scope.level] : 'كل المستويات',
    extraction.scope.maqta, extraction.scope.mawrid, extraction.scope.ta3alom,
  ].filter(Boolean).join(' ← ');

  parts.push('نتيجة البحث في قاعدة المعرفة (المنهاج، الوثيقة المرافقة، دليل الأستاذ، المذكرات)');
  parts.push(`النطاق: ${scopeLine}`);
  parts.push(`المطلوب: ${extraction.requestedFacets.map(facet => KNOWLEDGE_FACET_LABELS[facet]).join('، ')}`);
  parts.push('');

  const shown = new Set<string>();
  let foundAny = false;
  for (const group of extraction.facets) {
    if (!group.candidates.length) continue;
    foundAny = true;
    parts.push(`■ ${group.label} — ${group.candidates.length > 1 ? `${Math.min(max, group.candidates.length)} احتمالات موثقة` : 'قيمة موثقة واحدة'}`);
    group.candidates.slice(0, max).forEach((candidate, index) => {
      shown.add(candidate.text);
      const source = [
        KNOWLEDGE_KIND_LABELS[candidate.kind],
        KNOWLEDGE_LEVEL_LABELS[candidate.level],
        candidate.documentTitle,
        candidate.section,
      ].filter(Boolean).join(' | ');
      const path = pathOf(candidate.scope);
      const body = candidate.text.length > 700 ? `${candidate.text.slice(0, 700)}…` : candidate.text;
      parts.push(`${index + 1}) ${body}`);
      parts.push(`   المصدر: ${source}${path ? ` — ${path}` : ''} [${KNOWLEDGE_STATUS_LABELS[candidate.status]}]`);
    });
    parts.push('');
  }

  if (!foundAny) {
    parts.push('لا توجد نتيجة موثقة في قاعدة المعرفة لهذا النطاق.');
    parts.push('جرّب: تحديد المستوى والمقطع، أو استعمال كلمات المصدر كما هي مدونة، أو أضف الوثيقة في لوحة «قاعدة المعرفة».');
    parts.push('');
  }

  const related = extraction.hits.filter(hit => !shown.has(hit.chunk.text)).slice(0, 3);
  if (foundAny && related.length) {
    parts.push('مقاطع أخرى ذات صلة:');
    related.forEach((hit, index) => {
      parts.push(`${index + 1}) [${KNOWLEDGE_FACET_LABELS[hit.chunk.facet]}] ${hit.chunk.section} — ${hit.sourceLabel}: ${hit.snippet}`);
    });
    parts.push('');
  }

  for (const note of extraction.notes) parts.push(`تنبيه: ${note}`);
  parts.push('كل ما سبق مستخرج من المصادر المفهرسة. الاقتراحات الجديدة توضع في قسم مستقل بوسم «اقتراح تربوي — يحتاج مراجعة الأستاذ».');

  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** مراجع مختصرة للاستشهاد في واجهة المحادثة. */
export interface KnowledgeReference {
  id: string;
  kind: KnowledgeSourceKind;
  kindLabel: string;
  title: string;
  section: string;
  facet: KnowledgeFacet;
  facetLabel: string;
  level: KnowledgeLevel;
  status: KnowledgeStatus;
  statusLabel: string;
  sourceLabel: string;
  url?: string;
  /** رقم الصفحة في الوثيقة الرسمية الأصلية إن كان المقطع منها. */
  page?: number;
  snippet: string;
  score?: number;
  scopeLabel?: string;
}

/** نسخة خفيفة من نتيجة الاستخراج قابلة للإرسال عبر الواجهة (API). */
export interface SerializedExtraction {
  query: string;
  task: KnowledgeTaskKind;
  scopeLabel: string;
  level: KnowledgeLevel;
  requestedFacets: Array<{ facet: KnowledgeFacet; label: string }>;
  facets: Array<{
    facet: KnowledgeFacet;
    label: string;
    candidates: Array<{
      text: string;
      section: string;
      documentTitle: string;
      kind: KnowledgeSourceKind;
      level: KnowledgeLevel;
      status: KnowledgeStatus;
      statusLabel: string;
      sourceLabel: string;
      url?: string;
      page?: number;
      scopeLabel: string;
      score: number;
    }>;
  }>;
  references: KnowledgeReference[];
  missing: Array<{ facet: KnowledgeFacet; label: string }>;
  notes: string[];
  stats: {
    chunks: number;
    byKind: Record<string, number>;
    byFacet: Record<string, number>;
    byLevel: Record<string, number>;
  };
}

export function serializeExtraction(extraction: KnowledgeExtraction, options: { textLimit?: number } = {}): SerializedExtraction {
  const limit = options.textLimit ?? 1200;
  const trim = (value: string) => (value.length > limit ? `${value.slice(0, limit)}…` : value);
  return {
    query: extraction.query,
    task: extraction.task,
    scopeLabel: [
      extraction.scope.level !== 'all' ? KNOWLEDGE_LEVEL_LABELS[extraction.scope.level] : '',
      extraction.scope.midan,
      extraction.scope.maqta,
      extraction.scope.mawrid,
      extraction.scope.ta3alom,
    ].filter(Boolean).join(' ← '),
    level: extraction.scope.level,
    requestedFacets: extraction.requestedFacets.map(facet => ({ facet, label: KNOWLEDGE_FACET_LABELS[facet] })),
    facets: extraction.facets.map(group => ({
      facet: group.facet,
      label: group.label,
      candidates: group.candidates.map(candidate => ({
        text: trim(candidate.text),
        section: candidate.section,
        documentTitle: candidate.documentTitle,
        kind: candidate.kind,
        level: candidate.level,
        status: candidate.status,
        statusLabel: KNOWLEDGE_STATUS_LABELS[candidate.status],
        sourceLabel: candidate.sourceLabel,
        url: candidate.url,
        page: candidate.page,
        scopeLabel: pathOf(candidate.scope),
        score: candidate.score,
      })),
    })),
    references: toKnowledgeReferences(extraction.hits, 10),
    missing: extraction.missing.map(facet => ({ facet, label: KNOWLEDGE_FACET_LABELS[facet] })),
    notes: extraction.notes,
    stats: {
      chunks: extraction.stats.chunks,
      byKind: extraction.stats.byKind,
      byFacet: extraction.stats.byFacet,
      byLevel: extraction.stats.byLevel,
    },
  };
}

export function toKnowledgeReferences(hits: KnowledgeHit[], limit = 8): KnowledgeReference[] {
  return hits.slice(0, limit).map(hit => ({
    id: hit.chunk.id,
    kind: hit.chunk.kind,
    kindLabel: KNOWLEDGE_KIND_LABELS[hit.chunk.kind],
    title: hit.chunk.documentTitle,
    section: hit.chunk.section,
    facet: hit.chunk.facet,
    facetLabel: KNOWLEDGE_FACET_LABELS[hit.chunk.facet],
    level: hit.chunk.level,
    status: hit.chunk.status,
    statusLabel: KNOWLEDGE_STATUS_LABELS[hit.chunk.status],
    sourceLabel: hit.sourceLabel,
    url: hit.chunk.url,
    page: hit.chunk.page,
    snippet: hit.snippet,
    score: hit.score,
    scopeLabel: pathOf(hit.chunk.scope),
  }));
}
