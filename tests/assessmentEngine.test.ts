import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  proposeNextExercise,
  generateExamAnswers,
} from "../src/services/assessmentLocal";
import { createAssessmentExam } from "../src/services/assessmentModel";
import { AssessmentStore } from "../src/assessment/assessmentStore";
import { AssessmentEngine } from "../src/assessment/AssessmentEngine";
import { AssessmentRulesEngine } from "../src/assessment/AssessmentRulesEngine";
import { scoreItem } from "../src/assessment/MatchingEngine";
import {
  ASSESSMENT_TYPES,
  assessmentText,
  fingerprint,
  lessonData,
  newId,
  validateItem,
  type AssessmentItem,
  type AssessmentRecord,
} from "../src/assessment/types";
import { AssessmentPreview } from "../src/assessment/AssessmentPreview";
import { embedAssessmentInLesson } from "../src/assessment/embedAssessment";
import { getOfficialCurriculumDatabase } from "../src/data/memos/curriculumDb";
import {
  suggestAnswersForExercises,
  applyCorrectionSuggestions,
} from "../src/services/correctionMemoLocalAnswers";
import { createDefaultCorrectionMemo } from "../src/services/correctionMemoModel";
const lessons = getOfficialCurriculumDatabase();
const lesson =
  lessons.find(
    (l) => l.level === "4am" && /هضم/.test([l.ta3alom, l.mawrid].join(" ")),
  ) || lessons[0];
const data = lessonData(lesson);
const store = () => new AssessmentStore(`test-${newId()}`);
function item(overrides: Partial<AssessmentItem> = {}): AssessmentItem {
  return {
    id: newId(),
    subject: data.subject,
    level: data.level,
    domain: data.domain,
    unit: data.unit,
    lesson: data.lessonTitle,
    objective: data.objectives[0],
    concept: data.concepts[0],
    type: "direct",
    question: `سؤال تجريبي ${newId()}`,
    expectedAnswer: "إجابة مثبتة",
    difficulty: "medium",
    keywords: data.keywords,
    tags: [],
    active: true,
    ...overrides,
  };
}
function record(items: AssessmentItem[]): AssessmentRecord {
  const now = new Date().toISOString();
  return {
    id: newId(),
    lessonId: data.lessonId,
    memoId: data.memoId,
    assessment: { title: "التقويم", variant: "student" },
    assessmentItems: items,
    usedItemIds: items.map((i) => i.id),
    usedFingerprints: items.map(fingerprint),
    createdAt: now,
    updatedAt: now,
  };
}

test("all platform levels seed lazily with real source questions and reusable reference templates", async () => {
  const s = store();
  assert.equal((await s.page({})).items.length, 0);
  for (const level of ["1am", "2am", "3am", "4am"]) {
    await s.ensureLevel(level);
    const page = await s.page({ level }, 0, 20);
    assert.equal(page.items.length, 20);
    assert.ok(page.items.every((i) => i.level === level && i.active));
    assert.ok(page.items.every((i) => i.question.trim() && i.domain));
  }
  const before = await s.page({ level: "1am" });
  await s.ensureLevel("1am");
  assert.deepEqual(
    (await s.page({ level: "1am" })).items.map((i) => i.id),
    before.items.map((i) => i.id),
  );
});

test("engine builds and restores an assessment without any network or provider", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("NETWORK MUST NOT BE USED");
  }) as typeof fetch;
  try {
    const s = store(),
      engine = new AssessmentEngine(s);
    const result = await engine.build(data);
    assert.ok(
      result.assessmentItems.length > 0 && result.assessmentItems.length <= 3,
    );
    assert.ok(result.assessmentItems.every((i) => i.level === data.level));
    const restored = await new AssessmentStore(s.owner).current(data.memoId);
    assert.deepEqual(restored, JSON.parse(JSON.stringify(result)));
  } finally {
    globalThis.fetch = original;
  }
});

test("matching weighs lesson, objective, concept, competency and keywords and refuses unrelated/cross-level/domain items", () => {
  const exact = item();
  assert.ok(scoreItem(exact, data) > 60);
  assert.equal(
    scoreItem({ ...exact, level: data.level === "1am" ? "4am" : "1am" }, data),
    -1,
  );
  assert.equal(scoreItem({ ...exact, domain: "مجال آخر" }, data), -1);
  assert.equal(
    scoreItem(
      {
        ...exact,
        lesson: "زيلوفون",
        objective: "زيلوفون",
        concept: "زيلوفون",
        keywords: ["زيلوفون"],
      },
      data,
    ),
    -1,
  );
  assert.equal(scoreItem({ ...exact, active: false }, data), -1);
  const reusable = {
    ...exact,
    lesson: "درس آخر",
    objective: data.objectives[0],
    concept: data.concepts[0],
  };
  assert.ok(scoreItem(reusable, data) > 0);
});

test("rules follow cognitive objectives and prefer diversity over repeating a question type", () => {
  const types = AssessmentRulesEngine.objectivesTypes([
    "استرجاع وتفسير وتحليل واستنتاج وتوظيف",
  ]);
  for (const type of [
    "direct",
    "explanation",
    "document",
    "experiment",
    "conclusion",
    "application",
  ])
    assert.ok(types.includes(type as any));
  const candidates = [
    item({ type: "direct" }),
    item({ type: "direct" }),
    item({ type: "explanation" }),
    item({ type: "application" }),
  ];
  const chosen = AssessmentRulesEngine.select(
    candidates,
    { ...data, objectives: ["استرجاع وتفسير وتوظيف"] },
    3,
  );
  assert.equal(new Set(chosen.map((i) => i.type)).size, 3);
  assert.equal(Object.keys(ASSESSMENT_TYPES).length, 14);
});

test("history excludes IDs and normalized question duplicates even after deletion and new assessment creation", async () => {
  const s = store(),
    engine = new AssessmentEngine(s);
  const first = await engine.build(data, 2);
  const dup = {
    ...first.assessmentItems[0],
    id: newId(),
    question: ` ${first.assessmentItems[0].question} `,
  };
  await s.putItem(dup);
  const deleted = { ...first, assessmentItems: [] };
  await s.save(deleted);
  const second = await engine.build(data, 3);
  assert.ok(
    second.assessmentItems.every(
      (i) =>
        !first.usedItemIds.includes(i.id) &&
        !first.usedFingerprints.includes(fingerprint(i)),
    ),
  );
  assert.ok(!second.assessmentItems.some((i) => i.id === dup.id));
  assert.equal((await s.history(data.lessonId)).length, 2);
});

test("atomic save prevents two tabs committing the same question under different assessment IDs", async () => {
  const s = store(),
    q = item();
  const a = record([q]),
    b = record([q]);
  const results = await Promise.allSettled([s.save(a), s.save(b)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
});

test("replacement keeps objective/concept, compatible type, nearby difficulty and never returns a used item", async () => {
  const s = store(),
    engine = new AssessmentEngine(s);
  const target = item({
    question: "اختبار استبدال أساسي",
    type: "explanation",
  });
  const same = item({ question: "بديل شرح صالح", type: "explanation" });
  const compatible = item({
    question: "بديل استنتاج صالح",
    type: "conclusion",
  });
  const wrong = item({ question: "بديل خاطئ", type: "integration" });
  await s.putItem(same);
  await s.putItem(compatible);
  await s.putItem(wrong);
  const saved = record([target]);
  await s.save(saved);
  const replacement = await engine.replacement(data, saved, target);
  assert.ok(replacement);
  assert.ok(AssessmentRulesEngine.compatible(target.type, replacement!.type));
  assert.equal(replacement?.objective, target.objective);
  assert.equal(replacement?.concept, target.concept);
  assert.notEqual(replacement?.id, target.id);
  assert.equal(scoreItem(wrong, data, target), -1);
  const hard = item({ difficulty: "hard" }),
    easy = item({ difficulty: "easy" });
  assert.equal(scoreItem(hard, data, easy), -1);
});

test("teacher items survive seeding/deletion, bank pagination/filtering never loads full bank into UI", async () => {
  const s = store();
  await s.ensureLevel(data.level);
  const custom = item({
    question: "سؤال كلماتتمييز بحث فريد",
    type: "mcq",
    difficulty: "hard",
  });
  await s.putItem(custom);
  const match = await s.page({
    level: data.level,
    search: "كلماتتمييز",
    type: "mcq",
    difficulty: "hard",
  });
  assert.equal(match.items[0].id, custom.id);
  const p1 = await s.page({ level: data.level }, 0, 10),
    p2 = await s.page({ level: data.level }, p1.next!, 10);
  assert.equal(p1.items.length, 10);
  assert.ok(p2.items.every((i) => !p1.items.some((x) => x.id === i.id)));
  const q = record([custom]);
  await s.save(q);
  await s.deleteItem(custom);
  assert.equal(
    (await s.page({ level: data.level, search: "كلماتتمييز" })).items.length,
    0,
  );
  assert.equal(
    (await s.current(data.memoId))!.assessmentItems[0].question,
    custom.question,
  );
});

test("outbox persists offline edits, acknowledgement is version-safe and remote restoration cannot overwrite pending local edits", async () => {
  const s = store(),
    q = item({ question: "نسخة محلية" });
  await s.putItem(q);
  const pending = (await s.pending()).find((w) => w.documentId === q.id)!;
  assert.ok(pending);
  await s.putItem({ ...q, question: "نسخة محلية أحدث" });
  await s.ack(pending);
  assert.ok((await s.pending()).some((w) => w.documentId === q.id));
  await s.mergeRemote("assessmentItems", {
    ...q,
    question: "نسخة سحابية",
    updatedAt: "2099-01-01",
  });
  assert.equal(
    (await s.get<AssessmentItem>("assessmentItems", q.id))?.question,
    "نسخة محلية أحدث",
  );
  const latest = (await s.pending()).find((w) => w.documentId === q.id)!;
  await s.ack(latest);
  assert.ok(!(await s.pending()).some((w) => w.documentId === q.id));
  await s.mergeRemote("assessmentItems", {
    ...q,
    question: "نسخة سحابية",
    updatedAt: "2099-01-01",
  });
  assert.equal(
    (await s.get<AssessmentItem>("assessmentItems", q.id))?.question,
    "نسخة سحابية",
  );
  assert.equal(await store().get("assessmentItems", q.id), undefined);
});

test("invalid bank rows and malformed remote records cannot break the local editor", async () => {
  assert.throws(() => validateItem(item({ question: "" })));
  assert.throws(() => validateItem(item({ type: "unknown" as any })));
  assert.throws(() => validateItem(item({ points: -1 })));
  const s = store();
  await s.mergeRemote("assessments", { id: "bad", assessmentItems: [] });
  assert.equal(await s.get("assessments", "bad"), undefined);
  const q = item();
  await assert.rejects(s.save(record([q, { ...q, id: newId() }])), /مكرر/);
});

test("student/correction preview and embedded memo export preserve question order, RTL, answers and optional marks", () => {
  const q = item({
    question: "نص السؤال الأول",
    expectedAnswer: "إجابة سرية للتصحيح",
    points: 2,
  });
  const r = record([
    q,
    item({ question: "نص السؤال الثاني", expectedAnswer: "إجابة ثانية" }),
  ]);
  const student = renderToStaticMarkup(
    React.createElement(AssessmentPreview, { record: r }),
  );
  assert.match(student, /dir="rtl"/);
  assert.match(student, /السؤال 1/);
  assert.doesNotMatch(student, /إجابة سرية/);
  assert.ok(
    student.indexOf("نص السؤال الأول") < student.indexOf("نص السؤال الثاني"),
  );
  const sourceTable = { headers: ["سند"], rows: [["جدول المصدر"]] };
  const withTable = embedAssessmentInLesson(
    { ...lesson, taqwimTables: [sourceTable] },
    r,
  );
  assert.deepEqual(withTable.taqwimTables, []);
  assert.deepEqual(
    embedAssessmentInLesson(withTable, { ...r, assessmentItems: [] })
      .taqwimTables,
    [sourceTable],
  );
  const studentMemo = embedAssessmentInLesson(lesson, r);
  assert.equal(studentMemo.assessmentOriginalTaqwim, lesson.taqwim || "");
  assert.doesNotMatch(studentMemo.taqwim!, /إجابة سرية/);
  const corrected = {
    ...r,
    assessment: { ...r.assessment, variant: "correction" as const },
  };
  assert.match(assessmentText(corrected), /إجابة سرية/);
  const correctedMemo = embedAssessmentInLesson(studentMemo, corrected);
  assert.equal(correctedMemo.assessmentOriginalTaqwim, lesson.taqwim || "");
  assert.match(correctedMemo.taqwim!, /2 ن/);
  assert.equal(
    embedAssessmentInLesson(correctedMemo, {
      ...corrected,
      assessmentItems: [],
    }).taqwim,
    lesson.taqwim || "",
  );
});

test("legacy correction answer matching is local, exact and never overwrites a teacher answer", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("NO NETWORK");
  }) as typeof fetch;
  try {
    const memo = createDefaultCorrectionMemo();
    memo.exercises[0].questions[0].text = "سؤال معروف";
    const ex = memo.exercises[0];
    const result = await suggestAnswersForExercises({
      data: memo,
      exercises: [ex],
      curriculum: [
        {
          ...lesson,
          anshita: [
            { title: "نشاط", asila: "سؤال معروف", ajwiba: "جواب محفوظ" },
          ],
        },
      ],
    });
    assert.equal(result?.suggestions[0].expected, "جواب محفوظ");
    const applied = applyCorrectionSuggestions(memo, result!);
    assert.equal(applied.data.exercises[0].questions[0].source, "platform");
    memo.exercises[0].questions[0].source = "teacher";
    memo.exercises[0].questions[0].expected = "جواب الأستاذ";
    assert.equal(
      applyCorrectionSuggestions(memo, result!).data.exercises[0].questions[0]
        .expected,
      "جواب الأستاذ",
    );
    memo.exercises[0].questions[0].text = "سؤال غير معروف";
    assert.equal(
      await suggestAnswersForExercises({
        data: memo,
        exercises: [ex],
        curriculum: [lesson],
      }),
      null,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("assessment generation/import dependency boundary has no external provider or removed failure message", () => {
  const files = [
    ...readdirSync("src/assessment")
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => `src/assessment/${f}`),
    "src/services/correctionMemoLocalAnswers.ts",
    "src/services/assessmentLocal.ts",
    "src/components/AssessmentHub.tsx",
    "src/services/correctionMemoImport.ts",
    "src/components/CorrectionMemoDrawer.tsx",
  ];
  for (const path of files) {
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(
      text,
      /api\/gemini|api\.openai|api\.anthropic|correctionMemoAi|geminiPedagogicalService|تعذر التوليد الآلي|تحقق من.*مزوّد/,
      path,
    );
  }
  const route = readFileSync("src/server/api.ts", "utf8")
    .split("apiApp.post('/api/correction/analyze-source'")[1]
    .split("// نقطة نهاية")[0];
  assert.doesNotMatch(
    route,
    /generateContent|generateTextWithGateway|GoogleGenAI|API_KEY/,
  );
});

test("cloud cache demand and checkpoints are local, durable and per-used-level only", async () => {
  const s = store();
  await s.ensureLevel("2am");
  assert.deepEqual(await s.requestedLevels(), ["2am"]);
  assert.equal((await s.page({ level: "4am" })).items.length, 0);
  await s.setMeta("cloud-checkpoint-assessmentItems-2am", {
    seconds: 100,
    nanoseconds: 12,
    documentId: "last-row",
  });
  assert.equal(
    (
      await new AssessmentStore(s.owner).get<any>(
        "meta",
        "cloud-checkpoint-assessmentItems-2am",
      )
    )?.documentId,
    "last-row",
  );
});

test("existing assessment hub proposals and corrections use the local bank, reserving only accepted questions", async () => {
  const s = store(),
    exam = createAssessmentExam({ examType: "اختبار", level: lesson.level });
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("EXTERNAL REQUEST FORBIDDEN");
  }) as typeof fetch;
  try {
    const proposal = await proposeNextExercise(exam, lessons, lesson, s);
    assert.ok(proposal.proposal?.questions.length);
    assert.equal(proposal.proposal?.source, "platform");
    assert.equal((await s.history(data.lessonId)).length, 0);
    await s.save(proposal.proposal!.bankRecord);
    const next = await proposeNextExercise(exam, lessons, lesson, s);
    const old = new Set(proposal.proposal!.bankRecord.usedItemIds);
    assert.ok(
      !next.proposal ||
        next.proposal.bankRecord.usedItemIds.every((id) => !old.has(id)),
    );
    const question = proposal.proposal!.questions.find((q) =>
      q.expected?.trim(),
    );
    if (question) {
      exam.memo.exercises[0].questions[0].text = question.text;
      const answers = await generateExamAnswers(
        exam,
        lessons,
        lesson,
        undefined,
        s,
      );
      assert.ok(answers?.applied);
    }
  } finally {
    globalThis.fetch = original;
  }
});

test("Firestore rules enforce owner isolation and all five assessment collections with strict fields", () => {
  const rules = readFileSync("firestore.rules", "utf8");
  for (const name of [
    "assessmentItems",
    "assessments",
    "memoAssessments",
    "assessmentTemplates",
    "assessmentCategories",
  ])
    assert.ok(rules.includes(name));
  assert.match(rules, /isOwner\(userId\) && isAssessmentCollection/);
  assert.match(rules, /data\.userId == request\.auth\.uid/);
  assert.match(rules, /data\.question\.size\(\) <= 12000/);
  assert.match(rules, /match \/\{document=\*\*\}/);
});
