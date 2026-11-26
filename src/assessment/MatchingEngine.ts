import type { AssessmentItem, LessonAssessmentData } from "./types";
import { normalize, words } from "./types";
import { AssessmentRulesEngine } from "./AssessmentRulesEngine";
const overlap = (a: string, b: string) => {
  const aa = normalize(a),
    bb = normalize(b);
  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  const left = words(aa),
    right = new Set(words(bb));
  return left.length
    ? left.filter((w) => right.has(w)).length /
        Math.max(left.length, right.size)
    : 0;
};
export function scoreItem(
  item: AssessmentItem,
  data: LessonAssessmentData,
  target?: AssessmentItem,
): number {
  if (
    !item.active ||
    item.level !== data.level ||
    (item.domain && normalize(item.domain) !== normalize(data.domain))
  )
    return -1;
  const lesson = overlap(item.lesson || "", data.lessonTitle);
  const objective = Math.max(
    0,
    ...data.objectives.map((o) => overlap(item.objective || "", o)),
  );
  const concept = Math.max(
    0,
    ...data.concepts.map((o) => overlap(item.concept || "", o)),
  );
  const keyword = overlap(item.keywords.join(" "), data.keywords.join(" "));
  // Type/difficulty alone must never make an unrelated question eligible.
  if (lesson < 0.25 && objective < 0.2 && concept < 0.25 && keyword < 0.12)
    return -1;
  let score = lesson * 40 + objective * 30 + concept * 20 + keyword * 10;
  score +=
    overlap(item.unit || "", data.unit) * 8 +
    overlap(item.competency || "", data.competencies.join(" ")) * 12;
  const types = AssessmentRulesEngine.objectivesTypes(data.objectives);
  if (types.includes(item.type)) score += 10;
  if (item.difficulty === (target?.difficulty || "medium")) score += 10;
  if (target) {
    if (
      target.objective &&
      overlap(item.objective || "", target.objective) < 0.5
    )
      return -1;
    if (target.concept && overlap(item.concept || "", target.concept) < 0.5)
      return -1;
    if (!AssessmentRulesEngine.compatible(target.type, item.type)) return -1;
    if (
      Math.abs(
        ["easy", "medium", "hard"].indexOf(item.difficulty) -
          ["easy", "medium", "hard"].indexOf(target.difficulty),
      ) > 1
    )
      return -1;
    score += item.type === target.type ? 20 : 10;
  }
  return score;
}
