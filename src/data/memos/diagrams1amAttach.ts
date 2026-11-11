/**
 * إلحاق الرسومات التخطيطية بمذكرات السنة الأولى متوسط.
 *
 * الوضع قبل هذا الملف: `DIAGRAMS_1AM` (11 رسم SVG) وخريطة مصادرها
 * `DIAGRAM_SOURCES_1AM` كانتا معلّقتين — لا يستوردهما أي مكوّن، فكانت
 * 0/22 مذكرة تحمل رسومات بينما س2/س3/س4 تحملها داخل أنشطتها.
 *
 * القاعدة: القاعدة الخام `EXACT_LESSONS_1AM` تبقى كما هي بلا تعديل؛
 * هذا الملف يبني منها نسخة مشتقة تُضيف حقل `diagrams` إلى النشاط المطابق،
 * بنفس شكل قاعدة البيانات المستعمل في بقية المستويات
 * ({ diagram_id, diagram_title, diagram_svg }) + توثيق المصدر.
 *
 * طريقة الربط: ربط صريح بمعرّف النشاط المستقر (`sourceActivityId`) لا بمطابقة
 * العناوين. السبب أن عناوين القاعدة هي صياغة الأستاذ («النشاط 01: التعرف على
 * مصدر الأغذية (تمييز الأغذية من حيث المصدر: عضوية ومعدنية)») بينما عناوين
 * خريطة المصدر هي صياغة الدليل («نشاط 01: التعرف على مصدر الأغذية»)، فالمطابقة
 * بالنص تُسقط 22 من 29 هدفًا وتُلحق رسمًا بنشاط لا يغطيه فعلًا
 * (مثل «أهمية التحكم في شروط التركيب الضوئي»). كل ربط أدناه معلّل بما هو
 * مرسوم فعلًا داخل وسم SVG.
 */

import { DIAGRAMS_1AM } from './diagrams1am';
import { DIAGRAM_SOURCES_1AM, type DiagramSource1AM } from './diagramSources1am';

/** رسم ملحق بنشاط، بنفس شكل DB_Diagram في schema.ts + توثيق المصدر. */
export interface ActivityDiagram1AM {
  diagram_id: string;
  diagram_title: string;
  diagram_svg: string;
  /** صفحات «مذكرات السنة الأولى متوسط كاملة.pdf» التي يوجد فيها السند الأصلي. */
  diagram_source_pages: number[];
  /** درجة الأمانة: الرسم الحالي معاد بناؤه وليس نسخة حرفية من صفحة المصدر. */
  diagram_fidelity: DiagramSource1AM['fidelity'];
}

/**
 * جدول الربط: مفتاح الرسم ← معرّفات الأنشطة التي يخدمها الرسم فعلًا.
 * التعليل بين قوسين مقتبس من نصوص الرسم نفسه.
 */
export const DIAGRAM_ACTIVITY_BINDINGS_1AM: Record<string, string[]> = {
  // «تجارب الكشف عن أصل الأغذية (عضوي/معدني) بالتسخين» + «تصنيف الأغذية حسب الأصل والمصدر».
  foodClassification: ['act_1am_1_1_1_1', 'act_1am_1_1_1_2'],

  // «الكشف عن المكونات العضوية والمعدنية للحليب» + «النتيجة العلمية: تصنيف الأغذية حسب
  // التركيب (بسيط/مركب/مركب كامل)» وهو موضوع تقويم المورد في المذكرة 02.
  milkAnalysis: ['act_1am_1_1_2_1', 'act_1am_1_1_2_2'],

  // «دور الأغذية في الجسم وأنواع الرواتب الغذائية» (طاقة/نمو وصيانة) + تعريف الراتب
  // + الرواتب الأربعة (النمو، العمل، الصيانة، الإنتاج). لا يتضمن سوء التغذية.
  nutritionRations: ['act_1am_1_2_1_1', 'act_1am_1_3_1_1', 'act_1am_1_3_1_2'],

  // «التغذية المعدنية للنبات الأخضر وتأثير محلول كنوب (NPK)».
  plantMineralNutrition: ['act_1am_2_1_1_1'],

  // «مقر الامتصاص (الجذر والثغر الورقي)»: الأوبار الماصة + الثغور، وفيه صريحًا
  // «ظاهرة النتح: طرح الماء الزائد في شكل بخار عبر الثغور».
  plantAbsorption: ['act_1am_2_1_2_1', 'act_1am_2_4_2_1'],

  // «التركيب الضوئي ومسار انتقال النسغ الناقص والكامل»: شروط التركيب الضوئي،
  // ثمرة (مدخرات)، الأوعية الخشبية، النسغ الناقص/الكامل. لا يتضمن البيوت البلاستيكية.
  photosynthesisSap: ['act_1am_2_2_1_1', 'act_1am_2_2_1_2', 'act_1am_2_4_1_1', 'act_1am_2_4_1_2'],

  // «الجهاز التنفسي والمبادلات الغازية على مستوى السنخ الرئوي»: مجاري التنفس،
  // 700 مليون سنخ، شهيق O2 / زفير CO2، جدول مقارنة هواء الشهيق والزفير.
  // لا يتضمن الأمراض ولا القواعد الصحية.
  humanRespiratory: ['act_1am_3_1_1_1', 'act_1am_3_1_1_2'],

  // «بنية بذرة الفاصولياء ومراحل الإنتاش»: اللحافة/الفلقتان/الرشيم، المراحل الأربع،
  // و«استهلاك كامل المدخرات بعد اكتمال النبتة الفتية». لا يتضمن شروط الإنتاش
  // (الرطوبة/الحرارة) ولا استهلاك الأكسجين وإنتاج الحرارة.
  seedGermination: ['act_1am_5_2_1_1', 'act_1am_5_2_2_1', 'act_1am_5_2_2_2'],

  // «بنية الزهرة الكاملة، التأبير، والإلقاح الزهري»: مقطع طولي (كأس/تويج/سداة/مدقة)،
  // التأبير الذاتي والخلطي (حشرات/رياح)، مصير المبيض ← ثمرة والبويضات ← بذور.
  flowerReproduction: ['act_1am_5_1_1_1', 'act_1am_5_1_1_2', 'act_1am_5_1_2_1', 'act_1am_5_1_2_2'],

  // «بنية الخلية الحيوانية والخلية النباتية»: بشرة البصل ومخاطية الفم، الأجزاء المشتركة
  // (غشاء هيولي + هيولى + نواة) وجدار سيليلوزي، والخلاصة: الخلية الوحدة البنائية.
  cellStructure: ['act_1am_6_1_1_1', 'act_1am_6_1_1_2', 'act_1am_6_1_2_1', 'act_1am_6_1_2_2'],

  // urinarySystem (أجهزة الإطراح: الجهاز البولي والجلد) غير مربوط عمدًا:
  // لا توجد في قاعدة س1 (22 مذكرة) وحدة تعلمية ولا نشاط عن الإطراح، وإلحاقه
  // بنشاط تنفسي أو تغذوي سيكون نسبة خاطئة. يبقى الرسم متاحًا في DIAGRAMS_1AM
  // وفي خريطة مصدره إلى أن تُضاف مذكرة الإطراح.
};

/** فهرسة موحّدة بالاسم النصي: `DIAGRAMS_1AM` معرَّف بمفاتيح حرفية. */
const SVG_BY_KEY: Record<string, string> = DIAGRAMS_1AM as Record<string, string>;

/** الفهرس العكسي: معرّف النشاط ← مفاتيح الرسومات (يُبنى مرة واحدة). */
const KEYS_BY_ACTIVITY_ID: Record<string, string[]> = (() => {
  const index: Record<string, string[]> = {};
  for (const [key, activityIds] of Object.entries(DIAGRAM_ACTIVITY_BINDINGS_1AM)) {
    if (!SVG_BY_KEY[key]) continue;
    for (const activityId of activityIds) {
      (index[activityId] ||= []).push(key);
    }
  }
  return index;
})();

/**
 * تطبيع عنوان نشاط للمطابقة: إزالة التشكيل، توحيد الفراغات، وحذف «ال» الأولى.
 * «النشاط 01: التعرف على مصدر الأغذية» ← «نشاط 01: التعرف على مصدر الأغذية».
 */
export function normalizeActivityTitle(title: string): string {
  return String(title ?? '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^ال/, '');
}

const HAS_ARABIC = /[\u0600-\u06FF]/;

/**
 * عنوان الرسم: أول نص عربي داخل وسم SVG نفسه، حتى يبقى العنوان
 * متطابقًا مع محتوى الرسم ولا يُكتب يدويًا في مكانين.
 */
export function diagramTitleOf(key: string): string {
  const svg = String(SVG_BY_KEY[key] ?? '');
  const texts = svg.match(/<text[^>]*>([^<]+)<\/text>/g) ?? [];
  for (const raw of texts) {
    const content = raw.replace(/<text[^>]*>/, '').replace(/<\/text>$/, '').trim();
    if (HAS_ARABIC.test(content)) return content;
  }
  return key;
}

/**
 * تحويل وسم SVG المخزَّن كنص إلى HTML صالح للحقن:
 * النسخ المخزونة تحمل `className` (خاصية JSX) وهي غير معروفة في HTML،
 * فتُسقط أصناف Tailwind عند الحقن بـ innerHTML.
 */
export function toHtmlSvg(svg: string): string {
  return String(svg ?? '').replace(/className=/g, 'class=');
}

/** مفاتيح الرسومات المرتبطة بمعرّف نشاط. */
export function diagramKeysForActivityId(activityId: string): string[] {
  return KEYS_BY_ACTIVITY_ID[String(activityId ?? '')] ?? [];
}

/** بناء رسم ملحق من مفتاحه. */
export function buildActivityDiagram(key: string): ActivityDiagram1AM | null {
  const svg = SVG_BY_KEY[key];
  const source = DIAGRAM_SOURCES_1AM[key];
  if (!svg) return null;
  return {
    diagram_id: `diag_1am_${key}`,
    diagram_title: diagramTitleOf(key),
    diagram_svg: toHtmlSvg(svg),
    diagram_source_pages: source?.sourcePages ?? [],
    diagram_fidelity: source?.fidelity ?? 'reconstructed-svg',
  };
}

/** الرسومات الملحق بنشاط واحد (حسب معرّفه ثم عنوانه احتياطًا). */
export function diagramsForActivity(activity: { sourceActivityId?: string; title?: string }): ActivityDiagram1AM[] {
  const keys = diagramKeysForActivityId(String(activity?.sourceActivityId ?? ''));
  return keys
    .map(buildActivityDiagram)
    .filter((diagram): diagram is ActivityDiagram1AM => diagram !== null);
}

/**
 * إلحاق الرسومات بأنشطة المذكرات: يُرجع مصفوفة جديدة ولا يعدّل المدخل.
 * كل نشاط مربوط يحمل `diagrams`؛ وغير المربوط يبقى بلا الحقل.
 */
export function attachDiagrams1am<T extends { anshita?: { sourceActivityId?: string; title?: string }[] }>(
  lessons: T[],
): T[] {
  return lessons.map((lesson) => {
    if (!Array.isArray(lesson.anshita)) return lesson;
    const anshita = lesson.anshita.map((activity) => {
      const diagrams = diagramsForActivity(activity as { sourceActivityId?: string; title?: string });
      if (diagrams.length === 0) return activity;
      return { ...activity, diagrams };
    });
    return { ...lesson, anshita } as T;
  });
}

/** إحصاء التغطية بعد الإلحاق، مع المعرّفات والمفاتيح غير المربوطة (للتقارير والاختبارات). */
export function diagramCoverage1am(
  lessons: { anshita?: { sourceActivityId?: string; title?: string }[] }[],
) {
  let activities = 0;
  let activitiesWithDiagram = 0;
  let memosWithDiagram = 0;
  const boundIds = new Set<string>();
  const keys = new Set<string>();
  for (const lesson of lessons) {
    let hit = false;
    for (const activity of lesson.anshita ?? []) {
      activities += 1;
      const matched = diagramKeysForActivityId(String(activity?.sourceActivityId ?? ''));
      if (matched.length > 0) {
        activitiesWithDiagram += 1;
        boundIds.add(String(activity?.sourceActivityId ?? ''));
        hit = true;
        matched.forEach((key) => keys.add(key));
      }
    }
    if (hit) memosWithDiagram += 1;
  }
  const declaredIds = Object.values(DIAGRAM_ACTIVITY_BINDINGS_1AM).flat();
  return {
    memos: lessons.length,
    memosWithDiagram,
    activities,
    activitiesWithDiagram,
    diagramKeysUsed: keys.size,
    diagramKeysTotal: Object.keys(SVG_BY_KEY).length,
    /** رسومات موجودة لكن بلا نشاط مطابق في قاعدة س1. */
    unboundDiagramKeys: Object.keys(SVG_BY_KEY).filter((key) => !keys.has(key)),
    /** معرّفات معلنة في جدول الربط لكنها غير موجودة في القاعدة (يجب أن تبقى فارغة). */
    missingActivityIds: declaredIds.filter((id) => !boundIds.has(id)),
  };
}

/**
 * إثراء نسخة محفوظة (localStorage) أو مستوردة (ملف JSON) بالرسومات الرسمية
 * دون المساس بتعديلات الأستاذ: الرسم الرسمي يُضاف فقط إذا لم يوجد رسم
 * بنفس `diagram_id` في النشاط، وكل حقل آخر يبقى كما هو.
 */
export function mergeOfficialDiagrams1am<T extends { level?: string; anshita?: any[] }>(lessons: T[]): T[] {
  return lessons.map((lesson) => {
    if (lesson?.level !== '1am' || !Array.isArray(lesson.anshita)) return lesson;

    let changed = false;
    const anshita = lesson.anshita.map((activity: any) => {
      const official = diagramsForActivity(activity ?? {});
      if (official.length === 0) return activity;
      const existing: any[] = Array.isArray(activity?.diagrams) ? activity.diagrams : [];
      const missing = official.filter(
        (diagram) => !existing.some((item) => item?.diagram_id === diagram.diagram_id),
      );
      if (missing.length === 0) return activity;
      changed = true;
      return { ...activity, diagrams: [...existing, ...missing] };
    });

    return changed ? ({ ...lesson, anshita } as T) : lesson;
  });
}
