import React, { useEffect, useState } from 'react';
import { useAuth } from './Auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ANNUAL_STORAGE_KEY } from '../utils/annualDistributionDateUtils';

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
    const documents = [
      ['config', 'algeria_sciences_config', 'config'],
      ['annualDist', ANNUAL_STORAGE_KEY, 'data'],
      ['curriculum', 'mizaniyati_curriculum_db_v1', 'lessons'],
      ['logbook', 'daftar_table_v2027', 'data'],
    ] as const;
    const initialValues = new Map(documents.map(([, key]) => [key, localStorage.getItem(key)]));
    // Serialize writes per document so an older request cannot finish after a newer one.
    const writes = new Map<string, Promise<void>>();
    const save = (type: string, data: unknown) => {
      const documentId = type === 'dist' ? 'annualDist' : type;
      const field = type === 'config' ? 'config' : type === 'curriculum' ? 'lessons' : 'data';
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
        for (const [documentId, storageKey, field] of documents) {
          const snapshot = await getDoc(doc(db, 'users', user.uid, 'data', documentId));
          if (cancelled) return;
          if (!snapshot.exists()) continue;
          // Never replace local edits made while the request was in flight.
          if (localStorage.getItem(storageKey) !== initialValues.get(storageKey)) continue;
          const payload = snapshot.data() as SyncPayload;
          // Earlier versions wrote the annual object to data; accept legacy items too.
          const value = documentId === 'annualDist' ? (payload.data ?? payload.items) : payload[field];
          const valid = documentId === 'curriculum' ? Array.isArray(value)
            : value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value);
          if (!valid) continue;
          localStorage.setItem(storageKey, JSON.stringify(value));
          pending.delete(documentId);
          if (documentId === 'config') sessionStorage.setItem('algeria_sciences_session_config', JSON.stringify(value));
          window.dispatchEvent(new CustomEvent('firebase-sync-complete', { detail: { type: documentId } }));
          if (documentId === 'curriculum') window.dispatchEvent(new CustomEvent('curriculum-db-updated'));
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
