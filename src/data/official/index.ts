/**
 * فهرس المصادر الرسمية الحرفية لقاعدة معرفة المساعد الذكي.
 *
 * هذا الملف مولَّد آلياً — لا تحرّره يدوياً.
 * لإعادة التوليد: python3 scripts/ingest_official_pdfs.py <مجلد ملفات PDF>
 *
 * النصوص مُحمَّلة كسولياً (dynamic import) حتى لا تدخل في الحزمة الرئيسية؛
 * البيان (MANIFEST) وحده ثابت ومتاح فوراً لعرضه في الواجهة قبل وصول النص.
 */
import type { OfficialSourceManifestEntry, OfficialSourcePages } from './types';

export const OFFICIAL_SOURCES_MANIFEST: OfficialSourceManifestEntry[] = [
  {
    "garbage": 0.0,
    "id": "curriculum2016",
    "kind": "curriculum",
    "level": "all",
    "title": "منهاج علوم الطبيعة والحياة — مرحلة التعليم المتوسط (2016)",
    "authority": "وزارة التربية الوطنية — المديرية المكلفة بالمناهج",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "النص الرسمي الحرفي للمنهاج: الملمح الشامل، الميادين، الكفاءات الختامية ومركباتها.",
    "module": "./curriculum2016",
    "pages": 57,
    "chars": 75882,
    "extraction": "pypdf+tounicode",
    "quality": 81.5
  },
  {
    "garbage": 0.0,
    "id": "companionDocument",
    "kind": "companionDocument",
    "level": "all",
    "title": "الوثيقة المرافقة لمنهاج مادة علوم الطبيعة والحياة — الجيل الثاني",
    "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "التوجيهات المنهجية الرسمية: بناء المقطع، التقويم التكويني، معالجة التعثرات.",
    "module": "./companionDocument",
    "pages": 58,
    "chars": 87779,
    "extraction": "pypdf+tounicode",
    "quality": 74.3
  },
  {
    "garbage": 0.0,
    "id": "teacherGuide4am",
    "kind": "teacherGuide",
    "level": "4am",
    "title": "دليل الأستاذ لاستعمال الكتاب المدرسي — علوم الطبيعة والحياة — السنة الرابعة متوسط",
    "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "التنفيذ الصفي الرسمي لكل نشاط: الهدف التعلمي، الوضعية الانطلاقية، استغلال الوثائق، الأسئلة والأجوبة.",
    "module": "./teacherGuide4am",
    "pages": 147,
    "chars": 114954,
    "extraction": "pymupdf",
    "quality": 75.2
  },
  {
    "garbage": 0.0,
    "id": "annualPlan2023_1am",
    "kind": "progression",
    "level": "1am",
    "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الأولى متوسط",
    "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    "module": "./annualPlan2023_1am",
    "pages": 16,
    "chars": 26154,
    "extraction": "pypdf",
    "quality": 78.5
  },
  {
    "garbage": 0.0,
    "id": "annualPlan2023_2am",
    "kind": "progression",
    "level": "2am",
    "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الثانية متوسط",
    "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    "module": "./annualPlan2023_2am",
    "pages": 13,
    "chars": 23175,
    "extraction": "pypdf",
    "quality": 79.4
  },
  {
    "garbage": 0.0,
    "id": "annualPlan2023_3am",
    "kind": "progression",
    "level": "3am",
    "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الثالثة متوسط",
    "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    "module": "./annualPlan2023_3am",
    "pages": 13,
    "chars": 20568,
    "extraction": "pypdf",
    "quality": 80.8
  },
  {
    "garbage": 0.0,
    "id": "annualPlan2023_4am",
    "kind": "progression",
    "level": "4am",
    "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الرابعة متوسط",
    "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    "module": "./annualPlan2023_4am",
    "pages": 13,
    "chars": 21912,
    "extraction": "pypdf",
    "quality": 79.3
  },
  {
    "garbage": 0.0,
    "id": "learningPlan1am",
    "kind": "progression",
    "level": "1am",
    "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الأولى متوسط",
    "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    "module": "./learningPlan1am",
    "pages": 26,
    "chars": 34550,
    "extraction": "pypdf+tounicode",
    "quality": 75.1
  },
  {
    "garbage": 0.0,
    "id": "learningPlan2am",
    "kind": "progression",
    "level": "2am",
    "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الثانية متوسط",
    "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    "module": "./learningPlan2am",
    "pages": 15,
    "chars": 21696,
    "extraction": "pypdf",
    "quality": 79.7
  },
  {
    "garbage": 0.0,
    "id": "learningPlan3am",
    "kind": "progression",
    "level": "3am",
    "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الثالثة متوسط",
    "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    "module": "./learningPlan3am",
    "pages": 15,
    "chars": 20630,
    "extraction": "pypdf",
    "quality": 78.8
  },
  {
    "garbage": 0.0,
    "id": "learningPlan4am",
    "kind": "progression",
    "level": "4am",
    "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الرابعة متوسط",
    "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
    "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
    "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    "module": "./learningPlan4am",
    "pages": 13,
    "chars": 21953,
    "extraction": "pypdf",
    "quality": 77.2
  }
];

/** محمّلات كسولة: كل وثيقة في حزمة مستقلة تُجلب عند أول استعمال. */
export const OFFICIAL_SOURCE_LOADERS: Record<string, () => Promise<{ pages: OfficialSourcePages }>> = {
  curriculum2016: () => import('./curriculum2016'),
  companionDocument: () => import('./companionDocument'),
  teacherGuide4am: () => import('./teacherGuide4am'),
  annualPlan2023_1am: () => import('./annualPlan2023_1am'),
  annualPlan2023_2am: () => import('./annualPlan2023_2am'),
  annualPlan2023_3am: () => import('./annualPlan2023_3am'),
  annualPlan2023_4am: () => import('./annualPlan2023_4am'),
  learningPlan1am: () => import('./learningPlan1am'),
  learningPlan2am: () => import('./learningPlan2am'),
  learningPlan3am: () => import('./learningPlan3am'),
  learningPlan4am: () => import('./learningPlan4am'),
};

export const OFFICIAL_SOURCES_TOTAL_CHARS = OFFICIAL_SOURCES_MANIFEST.reduce(
  (sum, entry) => sum + entry.chars,
  0,
);

export const OFFICIAL_SOURCES_TOTAL_PAGES = OFFICIAL_SOURCES_MANIFEST.reduce(
  (sum, entry) => sum + entry.pages,
  0,
);
