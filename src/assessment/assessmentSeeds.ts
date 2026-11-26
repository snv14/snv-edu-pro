import type { AssessmentItem } from "./types";
import { lessonData, hash, normalize } from "./types";
/** Lazy, per-level derivation from platform data. No provider, fabricated answer or whole-bank JSON download. */
export async function* seedBatches(
  level: string,
): AsyncGenerator<AssessmentItem[]> {
  const { getOfficialCurriculumDatabase } =
    await import("../data/memos/curriculumDb");
  const lessons = getOfficialCurriculumDatabase().filter(
    (lesson) => lesson.level === level,
  );
  let batch: AssessmentItem[] = [];
  for (const lesson of lessons) {
    const data = lessonData(lesson);
    const seen = new Set<string>();
    const add = (
      question: string,
      expectedAnswer: string,
      type: AssessmentItem["type"],
      suffix: string,
      templateId?: string,
    ) => {
      if (!question.trim() || seen.has(normalize(question))) return;
      seen.add(normalize(question));
      batch.push({
        id: `seed-${hash(`${data.lessonId}|${suffix}|${question}`)}`,
        subject: data.subject,
        level,
        domain: data.domain,
        unit: data.unit,
        lesson: data.lessonTitle,
        objective: data.objectives[0],
        competency: data.competencies[0],
        concept: data.concepts[0],
        type,
        question: question.slice(0, 12000),
        expectedAnswer: expectedAnswer.slice(0, 16000),
        difficulty: type === "direct" ? "easy" : "medium",
        keywords: data.keywords.slice(0, 70),
        tags: [templateId ? "قالب تربوي قابل للتحرير" : "من بيانات المنصة"],
        templateId,
        active: true,
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    };
    lesson.anshita.forEach((a, index) => {
      const tables = (a.tables || [])
        .map((table) =>
          [
            table.table_title || "",
            table.headers.join(" | "),
            ...table.rows.map((row) => row.join(" | ")),
          ].join("\n"),
        )
        .join("\n\n");
      // Do not emit an opaque "analyse document 1" without its actual supporting data.
      if (/وثيق|منحنى|منحني|الرسم|الشكل|الجدول/.test(a.asila || "") && !tables)
        return;
      if (a.asila?.trim())
        add(
          `${a.title}${tables ? "\nالسند:\n" + tables : ""}\n${a.asila}`,
          a.ajwiba || "",
          /تجرب/.test(a.title)
            ? "experiment"
            : /وثيق|نتائج/.test(a.asila)
              ? "document"
              : /فسر|فسّر/.test(a.asila)
                ? "explanation"
                : "direct",
          `activity-${index}`,
        );
    });
    if (
      lesson.taqwim?.trim() &&
      !/وثيق|منحنى|منحني|الرسم|الشكل|الجدول/.test(lesson.taqwim)
    )
      add(lesson.taqwim, "", "formative", "assessment");
    // Templates require a real resource summary; expected answer is that existing text, never invented content.
    if (lesson.irsae?.trim()) {
      add(
        `اشرح المفاهيم الأساسية في «${data.lessonTitle}» واربط بينها.`,
        lesson.irsae,
        "explanation",
        "explain",
        "explain-resource-v1",
      );
      if (data.activities.length)
        add(
          `بالاعتماد على الأنشطة المنجزة حول «${data.lessonTitle}»، استنتج خلاصة علمية مدعمة بالملاحظات.`,
          lesson.irsae,
          "conclusion",
          "conclude",
          "conclude-resource-v1",
        );
    }
    if (batch.length >= 60) {
      yield batch;
      batch = [];
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  if (batch.length) yield batch;
}
export const ASSESSMENT_TEMPLATES = [
  {
    id: "explain-resource-v1",
    title: "شرح مفاهيم المورد",
    type: "explanation",
    requires: ["lessonTitle", "irsae"],
  },
  {
    id: "conclude-resource-v1",
    title: "استخلاص من الأنشطة المنجزة",
    type: "conclusion",
    requires: ["lessonTitle", "irsae", "activities"],
  },
];
