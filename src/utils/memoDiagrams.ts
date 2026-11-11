/**
 * توحيد قراءة الرسومات التخطيطية لمذكرة واحدة.
 *
 * في المستودع شكلان للرسومات:
 * 1) مستوى المذكرة: { title, svg, description } (ما تقرأه بطاقة الطباعة).
 * 2) مستوى النشاط: { diagram_id, diagram_title, diagram_svg } وهو شكل قاعدة
 *    البيانات المستعملة في س2/س3/س4 وما يبنيه مُلحِق رسومات س1
 *    (src/data/memos/diagrams1amAttach.ts).
 *
 * هذه الدوال نقية: تقرأ الشكلين وتُخرج قائمة واحدة للعرض والطباعة،
 * بلا تعديل على بيانات المصدر.
 */

/** رسم جاهز للعرض: عنوان + وسم SVG + وصف اختياري. */
export interface MemoDiagramView {
  title?: string;
  svg?: string;
  description?: string;
  /** صفحات الوثيقة المصدر التي يوجد فيها السند الأصلي. */
  sourcePages?: number[];
  /** درجة الأمانة تجاه المصدر. */
  fidelity?: 'source-page-reference' | 'reconstructed-svg';
}

const collapse = (value: string): string => value.replace(/\s+/g, ' ').trim();

/** رسومات مستوى المذكرة، مع دعم الحقول القديمة (diagram / diagramSvg / diagramTitle). */
export function lessonLevelDiagrams(lesson: any): MemoDiagramView[] {
  if (!lesson) return [];

  const fromArray: MemoDiagramView[] = Array.isArray(lesson.diagrams)
    ? lesson.diagrams
        .map((diagram: any): MemoDiagramView => ({
          title: diagram?.diagram_title ?? diagram?.title,
          svg: diagram?.diagram_svg ?? diagram?.svg,
          description: diagram?.description ?? diagram?.diagram_description,
          sourcePages: diagram?.diagram_source_pages,
          fidelity: diagram?.diagram_fidelity,
        }))
        .filter((diagram: MemoDiagramView) => Boolean(diagram.svg || diagram.title))
    : [];

  if (fromArray.length > 0) return fromArray;

  // الحقول المفردة القديمة (رسم واحد لكل مذكرة).
  const legacySvg =
    typeof lesson.diagram === 'string'
      ? lesson.diagram
      : lesson.diagramSvg || lesson.diagram?.svg || '';
  if (!legacySvg && !lesson.diagramTitle) return [];

  return [
    {
      title: lesson.diagramTitle,
      svg: legacySvg,
      description: lesson.diagramDescription || (typeof lesson.diagram === 'object' ? lesson.diagram?.description : undefined),
    },
  ];
}

/** رسومات مستوى النشاط (شكل قاعدة البيانات) مرتبة حسب ترتيب الأنشطة في المذكرة. */
export function activityLevelDiagrams(lesson: any): MemoDiagramView[] {
  if (!lesson || !Array.isArray(lesson.anshita)) return [];

  const collected: MemoDiagramView[] = [];
  for (const activity of lesson.anshita) {
    if (!activity || !Array.isArray(activity.diagrams)) continue;
    for (const diagram of activity.diagrams) {
      const svg = diagram?.diagram_svg ?? diagram?.svg;
      const title = diagram?.diagram_title ?? diagram?.title;
      if (!svg && !title) continue;
      collected.push({
        title,
        svg,
        description: diagram?.description,
        sourcePages: diagram?.diagram_source_pages,
        fidelity: diagram?.diagram_fidelity,
      });
    }
  }
  return collected;
}

/**
 * القائمة الموحّدة: رسومات المذكرة أولاً ثم رسومات الأنشطة،
 * مع إزالة المكرر (نفس العنوان) والحفاظ على الترتيب.
 */
export function memoDiagramList(lesson: any): MemoDiagramView[] {
  const merged = [...lessonLevelDiagrams(lesson), ...activityLevelDiagrams(lesson)];
  const seen = new Set<string>();
  const unique: MemoDiagramView[] = [];
  for (const diagram of merged) {
    const fingerprint = collapse(String(diagram.title ?? '')).toLowerCase();
    const key = fingerprint || collapse(String(diagram.svg ?? '')).slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(diagram);
  }
  return unique;
}

/** عدد الرسومات المتاحة للمذكرة (للاستعمال في الإحصاءات والشارات). */
export function memoDiagramCount(lesson: any): number {
  return memoDiagramList(lesson).length;
}
