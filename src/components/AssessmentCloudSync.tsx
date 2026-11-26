import React, { useEffect, useState } from "react";
import { useAuth } from "./Auth";
import { db } from "../firebase";
import {
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  AssessmentStore,
  type AssessmentCollection,
} from "../assessment/assessmentStore";
const COLLECTIONS: AssessmentCollection[] = [
  "assessmentItems",
  "assessments",
  "memoAssessments",
  "assessmentTemplates",
  "assessmentCategories",
];
interface Checkpoint {
  seconds: number;
  nanoseconds: number;
  documentId: string;
}
/** Persistent versioned outbox + incremental, bounded, per-requested-level cloud cache. */
export function AssessmentCloudSync() {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!user || !db) return;
    let stopped = false,
      running = false,
      rerun = false,
      lastPull = 0,
      retryTimer: number | undefined;
    const store = new AssessmentStore(user.uid),
      database = db;
    const flush = async () => {
      if (stopped || !navigator.onLine) return;
      if (running) {
        rerun = true;
        return;
      }
      running = true;
      try {
        let writes = await store.pending();
        while (writes.length && !stopped) {
          for (const write of writes) {
            if (stopped) break;
            await setDoc(
              doc(
                database,
                "users",
                user.uid,
                write.collection,
                write.documentId,
              ),
              {
                ...write.payload,
                userId: user.uid,
                syncedAt: serverTimestamp(),
              },
            );
            await store.ack(write);
          }
          writes = await store.pending();
        }
        if (Date.now() - lastPull > 30000) {
          lastPull = Date.now();
          const levels = await store.requestedLevels();
          const streams = COLLECTIONS.flatMap<{
            name: AssessmentCollection;
            level: string;
          }>((name) =>
            name === "assessmentItems"
              ? levels.map((level) => ({ name, level }))
              : [{ name, level: "" }],
          );
          for (const { name, level } of streams) {
            if (stopped) break;
            const key = `cloud-checkpoint-${name}-${level}`;
            const checkpoint = await store.get<Checkpoint>("meta", key);
            const page = await getDocs(
              query(
                collection(database, "users", user.uid, name),
                ...(level ? [where("level", "==", level)] : []),
                orderBy("syncedAt"),
                orderBy(documentId()),
                ...(checkpoint
                  ? [
                      startAfter(
                        new Timestamp(
                          checkpoint.seconds,
                          checkpoint.nanoseconds,
                        ),
                        checkpoint.documentId,
                      ),
                    ]
                  : []),
                limit(100),
              ),
            );
            if (stopped) break;
            for (const entry of page.docs) {
              const { userId, syncedAt, ...value } = entry.data();
              await store.mergeRemote(name, { ...value, id: entry.id });
            }
            const last = page.docs.at(-1);
            const stamp = last?.data().syncedAt as Timestamp | undefined;
            if (last && stamp)
              await store.setMeta(key, {
                seconds: stamp.seconds,
                nanoseconds: stamp.nanoseconds,
                documentId: last.id,
              });
            if (page.size === 100) {
              rerun = true;
              lastPull = 0;
            }
          }
          if (!stopped)
            window.dispatchEvent(new Event("assessment-cloud-restored"));
        }
        if (!stopped) setStatus("التقويم محفوظ محلياً وتمت مزامنته");
      } catch {
        if (!stopped)
          setStatus("التقويم محفوظ محلياً؛ ستُعاد المزامنة عند توفر الاتصال");
      } finally {
        running = false;
        if (rerun && !stopped) {
          rerun = false;
          retryTimer = window.setTimeout(() => void flush(), 500);
        }
      }
    };
    const retry = () => void flush();
    const requestLevel = (event: Event) => {
      if ((event as CustomEvent).detail?.owner !== user.uid) return;
      lastPull = 0;
      retry();
    };
    retry();
    window.addEventListener("online", retry);
    window.addEventListener("assessment-local-change", retry);
    window.addEventListener("assessment-level-request", requestLevel);
    const timer = window.setInterval(retry, 60000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.clearTimeout(retryTimer);
      window.removeEventListener("online", retry);
      window.removeEventListener("assessment-local-change", retry);
      window.removeEventListener("assessment-level-request", requestLevel);
    };
  }, [user]);
  return status ? (
    <span className="sr-only" role="status">
      {status}
    </span>
  ) : null;
}
