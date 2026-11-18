import React, { useEffect, useState } from 'react';
import { useAuth } from './Auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ANNUAL_STORAGE_KEY } from '../utils/annualDistributionDateUtils';
import { mergeSecondYearOnCloudRestore } from '../utils/annualDistributionMigration';
import { CURRICULUM_DB_STORAGE_KEY as CURRICULUM_LEVEL_STORAGE_KEY } from '../data/memos/curriculumDb';

type SyncPayload = { config?: unknown; items?: unknown; lessons?: unknown; data?: unknown };

export const FirebaseDataSync: React.FC = () => {
  const { user } = useAuth();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!user || !db) return;

    let cancelled = false;
    let loading = true;
    const pending = new Map<string, unknown>();
    // ── تقسيم وثيقة المذكرات إلى وثيقة لكل مستوى ──────────────────────────
    // السبب: حدّ Firestore هو 1 MiB للوثيقة الواحدة. قاعدة المذكرات بلغت
    // 1162 KiB (113.5% من الحد) بعد ربط مخططات 1AM، فكان setDoc يفشل حتماً
    // وتبقى المذكرات بلا نسخة سحابية. التقسيم لكل مستوى يحصر أكبر وثيقة في
    // ~430 KiB (4AM) أي 42% من الحد. الوثيقة القديمة 'curriculum' تُقرأ مرة
    // واحدة للتوافق الخلفي ثم تُهمَل.
    const CURRICULUM_LEVELS = ['1am', '2am', '3am', '4am'] as const;
    const documents = [
      ['config', 'algeria_sciences_config', 'config'],
      ['annualDist', ANNUAL_STORAGE_KEY, 'data'],
      ...CURRICULUM_LEVELS.map(level => [
        `curriculum_${level}`,
        CURRICULUM_LEVEL_STORAGE_KEY,
        'lessons',
        level,
      ] as const),
      ['logbook', 'daftar_table_v2027', 'data'],
    ] as const;
    const initialValues = new Map(documents.map(([, key]) => [key, localStorage.getItem(key)]));
    // Serialize writes per document so an older request cannot finish after a newer one.
    const writes = new Map<string, Promise<void>>();
    /** يكتب وثيقة واحدة، مع تسلسل الكتابات لنفس المعرّف. */
    const writeDocument = (documentId: string, field: string, data: unknown) => {
      const previous = writes.get(documentId) || Promise.resolve();
      const next = previous.catch(() => {}).then(async () => {
        if (cancelled) return;
        await setDoc(doc(db, 'users', user.uid, 'data', documentId), {
          userId: user.uid, [field]: data, updatedAt: serverTimestamp(),
        }, { merge: true });
        if (!cancelled) { setLastSync(new Date().toLocaleTimeString()); setSyncStatus('ready'); }
      }).catch((error) => {
        console.error('Cloud write failed:', documentId, error);
        if (!cancelled) setSyncStatus('error');
      });
      writes.set(documentId, next);
      return next;
    };

    /** يوزّع مصفوفة المذكرات على وثيقة لكل مستوى. */
    const splitCurriculum = (lessons: unknown) => {
      const all = Array.isArray(lessons) ? lessons as Array<{ level?: string }> : [];
      return CURRICULUM_LEVELS.map(level =>
        writeDocument(`curriculum_${level}`, 'lessons', all.filter(l => l?.level === level)));
    };

    const save = (type: string, data: unknown) => {
      const documentId = type === 'dist' ? 'annualDist' : type;
      // المذكرات تُقسَّم لكل مستوى بدل وثيقة واحدة تتجاوز حد 1 MiB.
      if (documentId === 'curriculum') return Promise.all(splitCurriculum(data));
      const field = type === 'config' ? 'config' : 'data';
      return writeDocument(documentId, field, data);
    };
    (window as any).syncToCloud = (type: string, data: unknown) => {
      const documentId = type === 'dist' ? 'annualDist' : type;
      if (loading) {
        pending.set(documentId, data);
        return Promise.resolve();
      }
      return save(documentId, data);
    };

    const syncFromCloud = async () => {
      try {
        // ── جمع وثائق المذكرات المفصولة في قاعدة محلية واحدة ────────────────
        // تُقرأ الوثائق الأربع ثم تُدمج. إن لم يوجد أي منها نرجع للوثيقة القديمة
        // 'curriculum' (توافق خلفي مع نسخ سبقت التقسيم).
        const curriculumCollections: Array<{ level: string; lessons: unknown[] }> = [];
        let legacyCurriculum: unknown = undefined;
        // توافق خلفي: الوثيقة المفردة السابقة
        try {
          const legacySnap = await getDoc(doc(db, 'users', user.uid, 'data', 'curriculum'));
          if (legacySnap.exists()) {
            const p2 = legacySnap.data() as SyncPayload;
            if (Array.isArray(p2.lessons)) legacyCurriculum = p2.lessons;
          }
        } catch { /* الوثيقة القديمة قد لا تكون موجودة */ }

        for (const [documentId, storageKey, field] of documents) {
          const isCurriculumPart = documentId.startsWith('curriculum_');
          const snapshot = await getDoc(doc(db, 'users', user.uid, 'data', documentId));
          if (cancelled) return;
          if (!snapshot.exists()) continue;
          // Never replace local edits made while the request was in flight.
          if (localStorage.getItem(storageKey) !== initialValues.get(storageKey)) continue;
          const payload = snapshot.data() as SyncPayload;

          if (isCurriculumPart) {
            const level = (documents.find(d => d[0] === documentId) as readonly [string, string, string, string])[3];
            if (Array.isArray(payload[field])) {
              curriculumCollections.push({ level, lessons: payload[field] as unknown[] });
            }
            continue;
          }

          // Earlier versions wrote the annual object to data; accept legacy items too.
          const value = documentId === 'annualDist' ? (payload.data ?? payload.items) : payload[field];
          const valid = value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value);
          if (!valid) continue;
          let restored = value;
          if (documentId === 'annualDist') {
            try {
              const local = JSON.parse(localStorage.getItem(storageKey) || '{}');
              restored = mergeSecondYearOnCloudRestore(local, value as Record<string, any>);
            } catch (error) {
              // Do not discard a local document that cannot be parsed safely.
              console.error('تعذر دمج نسخة التدرج المحلية:', error);
              continue;
            }
          }
          localStorage.setItem(storageKey, JSON.stringify(restored));
          pending.delete(documentId);
          if (documentId === 'config') sessionStorage.setItem('algeria_sciences_session_config', JSON.stringify(value));
          window.dispatchEvent(new CustomEvent('firebase-sync-complete', { detail: { type: documentId } }));
        }
        // دمج وثائق المذكرات في القاعدة المحلية الواحدة
        if (curriculumCollections.length > 0) {
          const curriculumStorageKey = documents.find(d => d[0].startsWith('curriculum_'))![1];
          const merged = ['1am', '2am', '3am', '4am'].flatMap(level =>
            curriculumCollections.find(c => c.level === level)?.lessons || []);
          if (merged.length > 0 && localStorage.getItem(curriculumStorageKey) === initialValues.get(curriculumStorageKey)) {
            localStorage.setItem(curriculumStorageKey, JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('curriculum-db-updated'));
          }
        } else if (legacyCurriculum !== undefined) {
          const curriculumStorageKey = documents.find(d => d[0].startsWith('curriculum_'))![1];
          if (localStorage.getItem(curriculumStorageKey) === initialValues.get(curriculumStorageKey)) {
            localStorage.setItem(curriculumStorageKey, JSON.stringify(legacyCurriculum));
            window.dispatchEvent(new CustomEvent('curriculum-db-updated'));
          }
        }

        loading = false;
        for (const [type, data] of pending) void save(type, data);
        pending.clear();
        setLastSync(new Date().toLocaleTimeString());
        setSyncStatus('ready');
        window.dispatchEvent(new Event('firebase-sync-complete'));
      } catch (error) {
        // Keep pending changes local rather than overwrite an unread cloud document.
        console.error('Error syncing from cloud:', error);
        if (!cancelled) setSyncStatus('error');
      }
    };
    void syncFromCloud();
    return () => {
      cancelled = true;
      delete (window as any).syncToCloud;
    };
  }, [user]);

  if (!user || !db) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-emerald-200 rounded-lg p-2 shadow-sm flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      {syncStatus === 'loading' ? 'جاري استعادة البيانات السحابية…' : syncStatus === 'error' ? 'تعذرت المزامنة؛ البيانات محفوظة محلياً' : `المزامنة السحابية نشطة ${lastSync ? `(آخر مزامنة: ${lastSync})` : ''}`}
    </div>
  );
};
