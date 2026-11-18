/**
 * ربط المخططات التخطيطية (SVG) بمذكرات السنة الأولى متوسط.
 *
 * ── المشكلة التي يحلّها هذا الملف ─────────────────────────────────────────────
 * المخططات الـ11 كانت موجودة في `diagrams1am.ts` منذ البداية، ومربوطة بمصادرها
 * في `diagramSources1am.ts` (صفحة المصدر والنشاطات المقابلة)، لكن **لا شيء
 * يستوردها**: قياسٌ على القاعدة قبل هذا الربط كان `diagrams: 0/28`، أي أن حقول
 * الرسومات في كل مذكرات 1AM فارغة رغم توفّر الرسوم.
 *
 * ── لماذا الربط بالكلمات المفتاحية لا بالتخمين ────────────────────────────────
 * كل مخطط في `DIAGRAM_SOURCES_1AM` يعلن الصفحات والنشاطات التي وُلّد منها. أخذتُ
 * من تلك النشاطات وسم المخطط بالمذكرات التي تتقاطع معها دلالياً، وتحقّقتُ يدوياً
 * من كل ربط بمقارنة عناوين الأنشطة. أمثلة على التحقق:
 *   • humanRespiratory (ص37–46) ← المذكرة 12 و14 (المبادلات الغازية + قواعد التنفس)
 *   • urinarySystem    (ص58–63) ← المذكرة 23–25 (الإطراح: تركيب، أعضاء، صحة)
 *   • flowerReproduction (ص82–87) ← المذكرة 17 و18 (بنية الزهرة + الإلقاح)
 *
 * ── حدود المطابقة (مصرَّح بها) ────────────────────────────────────────────────
 * الرسوم الحالية `fidelity: 'reconstructed-svg'` — أي **إعادة بناء** لا نسخ حرفي
 * من صفحات المصدر (منصوص عليه في `diagramSources1am.ts`). لذلك تُعرض في المنصة
 * كسندات علمية مصاحبة، ولا تُوصف بأنها صورة المصدر الأصلية.
 */
import { LESSONS_1AM } from './lessons1am';
import { DIAGRAMS_1AM } from './diagrams1am';
import { DIAGRAM_SOURCES_1AM } from './diagramSources1am';
import type { LessonMemo } from '../../types';

/** مخطط واحد كما تعرضه الواجهة: عنوان + SVG + وصف + تتبّع المصدر. */
export interface AttachedDiagram1AM {
  title: string;
  svg: string;
  description: string;
  /** صفحات المذكرة المصدرية (98 صفحة) التي وُلّد منها الرسم. */
  sourcePages: number[];
  sourceKey: string;
}

/**
 * خريطة الربط: معرّف الوحدة (`sourceLearningUnitId`) ← مفاتيح مخططاتها.
 *
 * الترتيب داخل كل وحدة مقصود: الأكثر تخصيصاً أولاً (مثلاً «بنية الزهرة» قبل
 * مخطط التكاثر العام).
 */
export const DIAGRAM_MAP_1AM: Record<string, string[]> = {
  // ── المقطع 1: التغذية عند الإنسان ──────────────────────────────────────
  lu_1am_1_1_1: ['foodClassification'],                    // مصدر الأغذية — ص2،3
  lu_1am_1_1_2: ['foodClassification', 'milkAnalysis'],     // تركيب الأغذية — ص2–6
  lu_1am_1_2_1: ['nutritionRations'],                       // دور الأغذية في الجسم
  lu_1am_1_3_1: ['nutritionRations'],                       // الرواتب الغذائية — ص11–15
  lu_1am_1_3_2: ['nutritionRations'],                       // التوازن الغذائي

  // ── المقطع 2: التغذية عند النبات الأخضر ────────────────────────────────
  lu_1am_2_1_1: ['plantMineralNutrition'],                  // التغذية المعدنية — ص19,20
  lu_1am_2_1_2: ['plantAbsorption'],                        // مقر الامتصاص — ص23,24
  lu_1am_2_2_1: ['photosynthesisSap'],                      // التركيب الضوئي — ص27,28
  lu_1am_2_4_1: ['photosynthesisSap'],                      // انتقال النسغ — ص30–34
  lu_1am_2_4_2: ['photosynthesisSap'],                      // ظاهرة النتح

  // ── المقطع 3: التحصل على الطاقة عند الإنسان ────────────────────────────
  lu_1am_3_1_1: ['humanRespiratory'],                       // المبادلات الغازية — ص37–46
  lu_1am_3_2_1: ['humanRespiratory'],                       // تعريف التنفس
  lu_1am_3_3_1: ['humanRespiratory'],                       // قواعد التنفس الصحي — ص43,46

  // ── المقطع 4: التحصل على الطاقة عند النبات الأخضر ──────────────────────
  lu_1am_4_1_1: ['photosynthesisSap'],                      // التبادلات عند النبات
  lu_1am_4_2_1: ['photosynthesisSap'],                      // التنفس عند النبات

  // ── المقطع 5: الإطراح عند الإنسان ──────────────────────────────────────
  lu_1am_o5_1_1: ['urinarySystem'],                         // تعريف الإطراح — ص58–63
  lu_1am_o5_2_1: ['urinarySystem'],                         // دور أعضاء الإطراح
  lu_1am_o5_3_1: ['urinarySystem'],                         // القواعد الصحية للإطراح

  // ── المقطع 6: التكاثر عند الإنسان ──────────────────────────────────────
  // لا مخطط مخصصاً للأجهزة التكاثرية عند الإنسان في المجموعة الحالية (الـ11
  // مخططاً تغطي النباتات والجسم عموماً). نُبقيها بلا رسم بدل إسناد رسم غير مطابق.

  // ── المقطع 7: التكاثر عند النباتات ذات الأزهار ─────────────────────────
  lu_1am_5_1_1: ['flowerReproduction'],                     // بنية الزهرة — ص82–87
  lu_1am_5_1_2: ['flowerReproduction'],                     // الإلقاح وتشكل البذور
  lu_1am_5_2_1: ['seedGermination'],                        // بنية البذرة — ص66,67
  lu_1am_5_2_2: ['seedGermination'],                        // مراحل الإنتاش

  // ── المقطع 8: الخلية ───────────────────────────────────────────────────
  lu_1am_6_1_1: ['cellStructure'],                          // الملاحظة المجهرية — ص90–93
  lu_1am_6_1_2: ['cellStructure'],                          // مكونات الخلية
};

/** عنوان معروض لكل مخطط — مأخوذ من مفهومه العلمي لا من اسم المفتاح. */
const DIAGRAM_TITLES: Record<string, string> = {
  foodClassification: 'تجارب تصنيف الأغذية حسب المصدر والأصل (الكشف بالحرق)',
  milkAnalysis: 'تحليل الحليب والكشف عن مكوناته',
  nutritionRations: 'الرواتب الغذائية والتوازن الغذائي',
  plantMineralNutrition: 'التغذية المعدنية عند النبات الأخضر (محلول كنوب)',
  plantAbsorption: 'مقر امتصاص المحلول المعدني (الأوبار الماصة)',
  photosynthesisSap: 'التركيب الضوئي وانتقال النسغ',
  humanRespiratory: 'المبادلات الغازية التنفسية عند الإنسان (الأسناخ الرئوية)',
  urinarySystem: 'الجهاز الإطراحي: الكلية والجلد',
  seedGermination: 'بنية البذرة ومراحل الإنتاش',
  flowerReproduction: 'الأعضاء التكاثرية عند النباتات ذات الأزهار',
  cellStructure: 'بنية الخلية النباتية والخلية الحيوانية',
};

const DIAGRAM_DESCRIPTIONS: Record<string, string> = {
  foodClassification: 'يوضّح الكشف التجريبي عن أصل الأغذية: العضوية تتفحم بالحرق لاحتوائها على الكربون، والمعدنية لا تتفحم.',
  milkAnalysis: 'يبيّن فصل مكونات الحليب والكشف عن العناصر الكيميائية البسيطة المكوّنة له.',
  nutritionRations: 'يمثّل الحاجيات الغذائية حسب النشاط والعمر، ومظاهر اختلال التوازن الغذائي.',
  plantMineralNutrition: 'يبرز شروط نمو النبات الأخضر وأهمية العناصر المعدنية الأساسية (N, P, K).',
  plantAbsorption: 'يحدد مقر امتصاص المحلول المعدني عبر الأوبار الماصة في الجذر.',
  photosynthesisSap: 'يربط بين شروط التركيب الضوئي وانتقال النسغ عبر الأوعية الناقلة.',
  humanRespiratory: 'يوضّح بنية السنخ الرئوي ومقر المبادلات الغازية بين الهواء والدم.',
  urinarySystem: 'يمثّل مسار الفضلات عبر الكلية والجلد ودورهما في ثبات الوسط الداخلي.',
  seedGermination: 'يبيّن مكونات البذرة والمراحل الأساسية للإنتاش ومصير المدخرات.',
  flowerReproduction: 'يعرض مكونات الزهرة وأعضاء التذكير والتأنيث ومراحل تشكل الثمرة والبذرة.',
  cellStructure: 'يقارن بين الخلية النباتية والخلية الحيوانية: المكونات المشتركة والفروق.',
};

/** يحوّل مفتاح مخطط إلى الشكل الذي تعرضه الواجهة، أو `null` إن كان المفتاح غير معروف. */
export function buildDiagram1AM(key: string): AttachedDiagram1AM | null {
  const svg = (DIAGRAMS_1AM as Record<string, string>)[key];
  const source = DIAGRAM_SOURCES_1AM[key];
  if (!svg || !source) return null;
  return {
    title: DIAGRAM_TITLES[key] || key,
    svg,
    description: DIAGRAM_DESCRIPTIONS[key] || '',
    sourcePages: source.sourcePages,
    sourceKey: key,
  };
}

/** مخططات وحدة تعلّم بعينها (بحسب معرّفها المصري). */
export function diagramsForUnit1AM(learningUnitId?: string): AttachedDiagram1AM[] {
  if (!learningUnitId) return [];
  const keys = DIAGRAM_MAP_1AM[learningUnitId] || [];
  return keys.map(buildDiagram1AM).filter((d): d is AttachedDiagram1AM => Boolean(d));
}

/**
 * قاعدة 1AM بعد ربط المخططات: نفس المذكرات، لكن كل وحدة تحمل مخططاتها.
 *
 * دالة نقية لا تعدّل المدخل — تُرجع نسخة جديدة، حتى يبقى المصدر الأصلي
 * (`EXACT_LESSONS_1AM`) مرجعاً غير معدَّل كما تُقرأ منه نسخة التحرير.
 */
export function withDiagrams1AM(lessons: LessonMemo[] = LESSONS_1AM): LessonMemo[] {
  return lessons.map(lesson => {
    const diagrams = diagramsForUnit1AM(lesson.sourceLearningUnitId);
    if (diagrams.length === 0) return lesson;
    return {
      ...lesson,
      // نملأ `diagrams` (مصفوفة) لأن الواجهة تعرضها سطراً سطراً مع عنوان ووصف.
      diagrams: diagrams.map(d => ({
        title: d.title,
        svg: d.svg,
        description: d.description,
      })),
    };
  });
}

/** إحصاء تغطية سريع — يستعمل في الاختبارات وفي أي لوحة حالة. */
export function diagramCoverage1AM(lessons: LessonMemo[] = LESSONS_1AM) {
  let unitsWithDiagram = 0;
  let totalDiagrams = 0;
  const usedKeys = new Set<string>();
  for (const lesson of lessons) {
    const diagrams = diagramsForUnit1AM(lesson.sourceLearningUnitId);
    if (diagrams.length > 0) unitsWithDiagram += 1;
    totalDiagrams += diagrams.length;
    diagrams.forEach(d => usedKeys.add(d.sourceKey));
  }
  const allKeys = Object.keys(DIAGRAMS_1AM);
  return {
    units: lessons.length,
    unitsWithDiagram,
    totalDiagrams,
    distinctDiagramsUsed: usedKeys.size,
    unusedDiagrams: allKeys.filter(k => !usedKeys.has(k)),
  };
}
