import test from "node:test";
import assert from "node:assert/strict";
import { homeDashboardStats } from "../src/services/homeDashboardStats";
import { getOfficialCurriculumDatabase } from "../src/data/memos/curriculumDb";
import type { LessonMemo } from "../src/types";

const lesson = (overrides: Partial<LessonMemo> = {}): LessonMemo =>
  ({
    level: "1am",
    midan: "الإنسان والصحة",
    maqta: "التغذية",
    mawrid: "الهضم",
    ta3alom: "تحولات الغذاء",
    anshita: [],
    ...overrides,
  }) as LessonMemo;

test("dashboard never supplies fictional counts for an empty curriculum", () => {
  assert.deepEqual(homeDashboardStats([]), {
    memos: 0,
    units: 0,
    resources: 0,
    activities: 0,
    domains: [],
  });
});

test("dashboard counts the supplied curriculum, with distinct level/domain/unit resources", () => {
  const lessons = [
    lesson({ anshita: [{ title: "نشاط" }] as LessonMemo["anshita"] }),
    lesson({ ta3alom: "تعلم آخر لنفس المورد" }),
    lesson({
      mawrid: "الامتصاص",
      anshita: [{ title: "أ" }, { title: "ب" }] as LessonMemo["anshita"],
    }),
    lesson({ level: "4am" }),
    lesson({ midan: "البيئة", anshita: undefined }),
  ];
  const before = JSON.stringify(lessons);
  assert.deepEqual(homeDashboardStats(lessons), {
    memos: 5,
    units: 3,
    resources: 4,
    activities: 3,
    domains: [
      { name: "الإنسان والصحة", count: 4, percent: 80 },
      { name: "البيئة", count: 1, percent: 20 },
    ],
  });
  assert.equal(
    JSON.stringify(lessons),
    before,
    "display statistics must never mutate curriculum records",
  );
});

test("dashboard handles imported empty fields and reports percentages from actual memo totals", () => {
  assert.deepEqual(
    homeDashboardStats([
      lesson({ midan: "  البيئة  ", maqta: "", mawrid: "" }),
      lesson({ midan: "البيئة", maqta: "", mawrid: "" }),
      lesson({ midan: "", maqta: "", mawrid: "" }),
    ]),
    {
      memos: 3,
      units: 0,
      resources: 0,
      activities: 0,
      domains: [
        { name: "البيئة", count: 2, percent: 67 },
        { name: "غير مصنف", count: 1, percent: 33 },
      ],
    },
  );
});

test("dashboard reflects user curriculum changes rather than fixed reference-image numbers", () => {
  const official = getOfficialCurriculumDatabase();
  const actual = homeDashboardStats(official);
  assert.equal(actual.memos, official.length);
  assert.equal(
    actual.activities,
    official.reduce((sum, entry) => sum + (entry.anshita?.length || 0), 0),
  );
  assert.equal(
    actual.domains.reduce((sum, domain) => sum + domain.count, 0),
    official.length,
  );
  assert.equal(
    homeDashboardStats(official.slice(1)).memos,
    official.length - 1,
  );
});
