import test from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

test(
  "assessment Firestore rules reject cross-account access, ownership changes and unapproved fields",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(":");
    const env = await initializeTestEnvironment({
      projectId: "demo-snv-assessment-rules",
      firestore: {
        host,
        port: Number(port),
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
    try {
      const a = env.authenticatedContext("teacher-a").firestore(),
        b = env.authenticatedContext("teacher-b").firestore(),
        anon = env.unauthenticatedContext().firestore();
      const path = "users/teacher-a/assessmentItems/test-question";
      const item = {
        id: "test-question",
        userId: "teacher-a",
        subject: "علوم الطبيعة والحياة",
        level: "1am",
        domain: "المحيط",
        type: "direct",
        question: "سؤال محفوظ",
        difficulty: "easy",
        keywords: [],
        tags: [],
        active: true,
        updatedAt: new Date().toISOString(),
      };
      await assertSucceeds(setDoc(doc(a, path), item));
      await assertSucceeds(getDoc(doc(a, path)));
      await assertFails(getDoc(doc(b, path)));
      await assertFails(getDoc(doc(anon, path)));
      await assertFails(setDoc(doc(b, path), { ...item, userId: "teacher-b" }));
      await assertFails(setDoc(doc(a, path), { ...item, userId: "teacher-b" }));
      await assertFails(setDoc(doc(a, path), { ...item, apiKey: "forbidden" }));
      await assertFails(setDoc(doc(a, path), { ...item, type: "unknown" }));
    } finally {
      await env.cleanup();
    }
  },
);
