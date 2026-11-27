/**
 * هوك React للتعامل مع قاعدة بيانات الدفتر اليومي المستقلة.
 * يُهيئ القاعدة باستيراد التدرجات عند أول استخدام، ويُوفّر لقطة تفاعيدية
 * وعمليات القراءة/الكتابة المستقلة.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDailyLogbookDB,
  initializeDailyDatabase,
  type DailyDbOwner,
  type DailyLogbookDatabase,
  type DailyLogbookDB,
} from './index';

export interface UseDailyLogbookDB {
  db: DailyLogbookDB;
  database: DailyLogbookDatabase;
  /** إعادة تحميل اللقطة بعد أي تغيير. */
  reload: () => void;
  /** إعادة استيراد التدرجات (idempotent). */
  reimport: () => ReturnType<typeof initializeDailyDatabase>;
}

export function useDailyLogbookDB(owner: DailyDbOwner): UseDailyLogbookDB {
  const db = useMemo(() => createDailyLogbookDB(owner), [owner]);
  const [database, setDatabase] = useState<DailyLogbookDatabase>(() => db.snapshot());

  // التهيئة الأولى: استيراد التدرجات الأربعة عند أول استخدام.
  useEffect(() => {
    if (!db.isInitialized()) {
      initializeDailyDatabase();
    }
    setDatabase(db.snapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => {
    setDatabase(db.snapshot());
  }, [db]);

  const reimport = useCallback(() => {
    const result = initializeDailyDatabase();
    reload();
    return result;
  }, [db, reload]);

  // إعادة تحميل اللقطة عندما يتغير المحتوى المخزّن.
  useEffect(() => {
    const handler = () => reload();
    window.addEventListener('daily-db-updated', handler);
    return () => window.removeEventListener('daily-db-updated', handler);
  }, [reload]);

  return { db, database, reload, reimport };
}
