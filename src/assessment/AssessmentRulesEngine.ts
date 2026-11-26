import type {
  AssessmentItem,
  AssessmentType,
  LessonAssessmentData,
} from "./types";
import { normalize } from "./types";
const GROUPS: AssessmentType[][] = [
  ["direct", "blank", "boolean", "mcq", "matching", "ordering"],
  ["explanation", "conclusion"],
  ["document", "experiment"],
  ["application", "integration"],
  ["formative", "summative"],
];
export class AssessmentRulesEngine {
  static compatible(a: AssessmentType, b: AssessmentType) {
    return (
      a === b || GROUPS.some((group) => group.includes(a) && group.includes(b))
    );
  }
  static objectivesTypes(objectives: string[]): AssessmentType[] {
    const text = normalize(objectives.join(" "));
    const types: AssessmentType[] = [];
    if (/استرجاع|يذكر|يسمي|تعرف|يحدد/.test(text)) types.push("direct");
    if (/تفسير|يفسر|يشرح/.test(text)) types.push("explanation");
    if (/تحليل|يحلل|يقارن/.test(text)) types.push("document", "experiment");
    if (/استنتاج|يستنتج/.test(text)) types.push("conclusion");
    if (/توظيف|يوظف|يطبق|تطبيق/.test(text)) types.push("application");
    return types.length ? types : ["direct", "explanation", "application"];
  }
  static select(
    ranked: AssessmentItem[],
    data: LessonAssessmentData,
    count = 3,
  ): AssessmentItem[] {
    const selected: AssessmentItem[] = [];
    const desired = this.objectivesTypes(data.objectives);
    for (const type of desired) {
      const item = ranked.find(
        (x) =>
          x.type === type &&
          !selected.some((s) => s.id === x.id || s.type === x.type),
      );
      if (item) selected.push(item);
      if (selected.length >= count) return selected;
    }
    for (const item of ranked) {
      if (!selected.some((s) => s.id === item.id || s.type === item.type))
        selected.push(item);
      if (selected.length >= count) break;
    }
    for (const item of ranked) {
      if (selected.length >= count) break;
      if (!selected.some((s) => s.id === item.id)) selected.push(item);
    }
    return selected;
  }
}
