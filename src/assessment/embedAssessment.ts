import type { LessonMemo } from "../types";
import { assessmentText, memoIdentity, type AssessmentRecord } from "./types";
/** Keep the original source separately; export uses the explicit student/correction variant. */
export function embedAssessmentInLesson(
  lesson: LessonMemo,
  record: AssessmentRecord,
): LessonMemo {
  if (memoIdentity(lesson) !== record.memoId)
    throw new Error("التقويم لا ينتمي إلى هذه المذكرة.");
  const original = lesson.assessmentOriginalTaqwim ?? lesson.taqwim ?? "";
  return {
    ...lesson,
    assessment: record,
    assessmentOriginalTaqwim: original,
    assessmentOriginalTaqwimTables:
      lesson.assessmentOriginalTaqwimTables ?? lesson.taqwimTables ?? [],
    taqwimTables: record.assessmentItems.length
      ? []
      : (lesson.assessmentOriginalTaqwimTables ?? lesson.taqwimTables ?? []),
    taqwim: record.assessmentItems.length ? assessmentText(record) : original,
    sourceOfficial: false,
  };
}
