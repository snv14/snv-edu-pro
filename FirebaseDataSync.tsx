import React, { useEffect, useState } from 'react';
import { useAuth } from './Auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// الأنواع المقبولة في window.syncToCloud (تشمل الأسماء القديمة 'dist' للتوافق)
type SyncType = 'config' | 'dist' | 'annualDist' | 'logbook' | 'curriculum' | 'timetable';

interface SyncSpec {
  documentId: string;
  storageKey: string;
  field: 'config' | 'items' | 'lessons' | 'data';
  /** تحويل قيمة الحقل السحابي إلى ما يُخزَّن محلياً (null = تجاهل) */
  toLocal?: (value: any) => unknown;
  /** تحويل القيمة المحلية إلى ما يُرفع للسحابة */
  toCloud?: (value: any) => unknown;
  isValid: (value: unknown) => boolean;
}

const SPECS: SyncSpec[] = [
  { documentId: 'config', storageKey: 'algeria_sciences_config', field: 'config', isValid: (v) => v !== undefined && v !== null },
  { documentId: 'annualDist', storageKey: 'algeria_sciences_annual_dist_v6', field: 'items', isValid: Array.isArray },
  { documentId: 'curriculum', storageKey: 'mizaniyati_curriculum_db_v1', field: 'lessons', isValid: Array.isArray },
  { documentId: 'logbook', storageKey: 'daftar_table_v2027', field: 'data', isValid: (v) => v !== undefined && v !== null },
  {
    documentId: 'timetable',
    storageKey: 'algeria_sciences_timetable_grid',
    field: 'data',
    toLocal: (v) => v?.gridRows,
    toCloud: (v) => ({ gridRows: v }),
    isValid: (v: any) => !!v && Array.isArray(v.gridRows),
  },
];

const tsKey = (storageKey: string) => `${storageKey}__updatedAt`;

const readLocalTs = (storageKey: string): number => {
  try { return Number(localStorage.getItem(tsKey(storageKey))) || 0; } catch { return 0; }
};
const writeLocalTs = (storageKey: string, ms: number) => {
  try { localStorage.setItem(tsKey(storageKey), String(ms)); } catch { /* ignore */ }
};

const normalizeType = (type: SyncType): string => (type === 'dist' ? 'annualDist' : type);

export const FirebaseDataSync: React.FC = () => {
  const { user } = useAuth();
  const [lastSync, setLastSync] = useState<string | null>(null);

  // 1) تثبيت دالة الرفع أولاً (وتسجيل وقت آخر تعديل محلي)
  useEffect(() => {
    if (!user || !db) return;

    (window as any).syncToCloud = async (type: SyncType, data: unknown) => {
      const documentId = normalizeType(type);
      const spec = SPECS.find((s) => s.documentId === documentId);
      if (!spec) {
        console.warn(`syncToCloud: نوع غير معروف "${type}"`);
        return;
      }
      writeLocalTs(spec.storageKey, Date.now());
      try {
        await setDoc(doc(db, 'users', user.uid, 'data', documentId), {
          userId: user.uid,
          [spec.field]: data,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setLastSync(new Date().toLocaleTimeString());
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/data/${documentId}`);
      }
    };

    return () => {
      delete (window as any).syncToCloud;
    };
  }, [user]);

  // 2) المزامنة من السحابة: لا تُستبدل البيانات المحلية إلا إذا كانت السحابة أحدث
  useEffect(() => {
    if (!user || !db) return;
    let cancelled = false;

    const syncFromCloud = async () => {
      try {
        for (const spec of SPECS) {
          const snapshot = await getDoc(doc(db, 'users', user.uid, 'data', spec.documentId));
          if (cancelled) return;
          if (!snapshot.exists()) continue;

          const payload = snapshot.data() as Record<string, any>;
          const cloudValue = payload[spec.field];
          if (!spec.isValid(cloudValue)) continue;

          const cloudMs: number = typeof payload.updatedAt?.toMillis === 'function' ? payload.updatedAt.toMillis() : 0;
          const localMs = readLocalTs(spec.storageKey);
          const localRaw = localStorage.getItem(spec.storageKey);

          // تعديل محلي أحدث من السحابة (مثلاً عمل دون اتصال) → نرفعه بدل أن نفقده
          if (localRaw && localMs > cloudMs) {
            try {
              const localValue = JSON.parse(localRaw);
              await setDoc(doc(db, 'users', user.uid, 'data', spec.documentId), {
                userId: user.uid,
                [spec.field]: spec.toCloud ? spec.toCloud(localValue) : localValue,
                updatedAt: serverTimestamp(),
              }, { merge: true });
            } catch (error) {
              console.error('تعذر رفع التعديل المحلي الأحدث:', error);
            }
            continue;
          }

          const localValueToStore = spec.toLocal ? spec.toLocal(cloudValue) : cloudValue;
          if (localValueToStore === undefined || localValueToStore === null) continue;

          const serialized = JSON.stringify(localValueToStore);
          localStorage.setItem(spec.storageKey, serialized);
          writeLocalTs(spec.storageKey, cloudMs || Date.now());
          if (spec.documentId === 'config') {
            sessionStorage.setItem('algeria_sciences_session_config', serialized);
          }

          window.dispatchEvent(new CustomEvent('firebase-sync-complete', { detail: { type: spec.documentId } }));
          if (spec.documentId === 'curriculum') {
            window.dispatchEvent(new CustomEvent('curriculum-db-updated'));
          }
        }

        if (!cancelled) {
          setLastSync(new Date().toLocaleTimeString());
          window.dispatchEvent(new Event('firebase-sync-complete'));
        }
      } catch (error) {
        console.error('Error syncing from cloud:', error);
      }
    };

    void syncFromCloud();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-emerald-200 rounded-lg p-2 shadow-sm flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      المزامنة السحابية نشطة {lastSync && `(آخر مزامنة: ${lastSync})`}
    </div>
  );
};
