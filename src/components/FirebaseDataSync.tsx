import React, { useEffect, useState } from 'react';
import { useAuth } from './Auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

type SyncType = 'config' | 'dist' | 'logbook' | 'curriculum';
type SyncPayload = { config?: unknown; items?: unknown; lessons?: unknown; data?: unknown };

export const FirebaseDataSync: React.FC = () => {
  const { user } = useAuth();
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const syncFromCloud = async () => {
      try {
        const documents = [
          ['config', 'algeria_sciences_config', 'config'],
          ['annualDist', 'algeria_sciences_annual_dist_v6', 'items'],
          ['curriculum', 'mizaniyati_curriculum_db_v1', 'lessons'],
          ['logbook', 'daftar_table_v2027', 'data'],
        ] as const;

        for (const [documentId, storageKey, field] of documents) {
          const snapshot = await getDoc(doc(db, 'users', user.uid, 'data', documentId));
          if (!snapshot.exists()) continue;

          const value = (snapshot.data() as SyncPayload)[field];
          const valid = field === 'items' || field === 'lessons'
            ? Array.isArray(value)
            : value !== undefined && value !== null;
          if (!valid) continue;

          const serialized = JSON.stringify(value);
          localStorage.setItem(storageKey, serialized);
          if (documentId === 'config') {
            sessionStorage.setItem('algeria_sciences_session_config', serialized);
          }

          window.dispatchEvent(new CustomEvent('firebase-sync-complete', { detail: { type: documentId } }));
          if (documentId === 'curriculum') {
            window.dispatchEvent(new CustomEvent('curriculum-db-updated'));
          }
        }

        setLastSync(new Date().toLocaleTimeString());
        window.dispatchEvent(new Event('firebase-sync-complete'));
      } catch (error) {
        console.error('Error syncing from cloud:', error);
      }
    };

    void syncFromCloud();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;

    (window as any).syncToCloud = async (type: SyncType, data: unknown) => {
      try {
        const documentId = type === 'dist' ? 'annualDist' : type;
        const field = type === 'config' ? 'config' : type === 'dist' ? 'items' : type === 'curriculum' ? 'lessons' : 'data';

        await setDoc(doc(db, 'users', user.uid, 'data', documentId), {
          userId: user.uid,
          [field]: data,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setLastSync(new Date().toLocaleTimeString());
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/data/${type}`);
      }
    };

    return () => {
      delete (window as any).syncToCloud;
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-emerald-200 rounded-lg p-2 shadow-sm flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      المزامنة السحابية نشطة {lastSync && `(آخر مزامنة: ${lastSync})`}
    </div>
  );
};
