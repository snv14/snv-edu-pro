import type { LessonMemo } from "../types";
import {
  CorrectionExercise,
  CorrectionMemoData,
  toNumber,
} from "./correctionMemoModel";
import { normalize } from "../assessment/types";
import {
  getAssessmentStore,
  type AssessmentStore,
} from "../assessment/assessmentStore";
import { lessonData } from "../assessment/types";
export interface CorrectionSuggestion {
  exerciseId: string;
  questionId: string;
  expected: string;
  points?: string;
  needsReview: boolean;
  note?: string;
}
export interface CorrectionSuggestionsResult {
  suggestions: CorrectionSuggestion[];
  ambiguous: string[];
}
/** Only retrieve answers paired with the SAME question; never extrapolate a correction. */
export async function suggestAnswersForExercises(args: {
  data: CorrectionMemoData;
  exercises: CorrectionExercise[];
  lesson?: LessonMemo | null;
  curriculum: LessonMemo[];
  store?: AssessmentStore;
}): Promise<CorrectionSuggestionsResult | null> {
  const { lesson, exercises, curriculum } = args;
  const pool = curriculum.filter(
    (l) => !lesson || (l.level === lesson.level && l.midan === lesson.midan),
  );
  const pairs = pool.flatMap((l) =>
    l.anshita
      .filter((a) => a.asila?.trim() && a.ajwiba?.trim())
      .map((a) => ({ question: a.asila, answer: a.ajwiba })),
  );
  if (lesson) {
    try {
      const bank = await (args.store || getAssessmentStore()).candidates(
        lessonData(lesson),
      );
      pairs.push(
        ...bank
          .filter((i) => i.expectedAnswer?.trim())
          .map((i) => ({ question: i.question, answer: i.expectedAnswer! })),
      );
    } catch {
      /* Platform pairs remain usable without browser storage. */
    }
  }
  const suggestions: CorrectionSuggestion[] = [];
  const ambiguous: string[] = [];
  for (const exercise of exercises)
    for (const question of exercise.questions) {
      const text = normalize(question.text);
      if (!text) continue;
      const match = pairs.find((p) => normalize(p.question) === text);
      if (match)
        suggestions.push({
          exerciseId: exercise.id,
          questionId: question.id,
          expected: match.answer,
          needsReview: true,
          note: "إجابة مرتبطة بنفس السؤال في البنك؛ يراجعها الأستاذ.",
        });
      else ambiguous.push(question.number || question.id);
    }
  return suggestions.length ? { suggestions, ambiguous } : null;
}
export function applyCorrectionSuggestions(
  data: CorrectionMemoData,
  result: CorrectionSuggestionsResult,
): { data: CorrectionMemoData; applied: number; skipped: number } {
  const next: CorrectionMemoData = structuredClone(data);
  let applied = 0;
  let skipped = 0;

  result.suggestions.forEach((suggestion) => {
    const exercise =
      next.exercises.find((item) => item.id === suggestion.exerciseId) ||
      next.exercises.find((item) =>
        item.questions.some(
          (question) => question.id === suggestion.questionId,
        ),
      );
    const question = exercise?.questions.find(
      (item) => item.id === suggestion.questionId,
    );
    if (!question) return;
    if (question.source === "teacher" && question.expected.trim()) {
      skipped += 1;
      return;
    }
    if (!suggestion.expected.trim() && !suggestion.points) {
      skipped += 1;
      return;
    }
    if (suggestion.expected.trim()) {
      question.expected = suggestion.expected.trim();
      question.source = "platform";
      question.needsReview = suggestion.needsReview;
    }
    if (suggestion.points && !toNumber(question.points)) {
      question.points = suggestion.points;
      question.needsReview = suggestion.needsReview || question.needsReview;
    }
    applied += 1;
  });

  next.updatedAt = new Date().toISOString();
  return { data: next, applied, skipped };
}
