/**
 * ============================================================================
 *  قاعدة بيانات الدفتر اليومي — طبقة التخزين المنفصلة
 * ============================================================================
 *
 * هذه الطبقة هي **الواجهة الوحيدة** للقراءة والكتابة في قاعدة بيانات
 * الدفتر اليومي. وهي منفصلة تمامًا عن طبقة تخزين المنصة الرئيسية:
 *
 *   • كل Collection تُحفظ تحت مفتاح محلي مستقل (namespaced).
 *   • البادئة `snv_dailydb_v1::` تضمن عدم تداخل مفاتيح الدفتر مع
 *     مفاتيح قاعدة المنصة الرئيسية (التي تستخدم بادئات أخرى مثل
 *     `mizaniyati_...` أو `algeria_sciences_...`).
 *   • لا تُستعلم ولا تُكتب أي من Collections قاعدة المنصة الرئيسية هنا.
 */

import type { DailyLogbookDatabase } from './schema';

/** البادئة المميزة لقاعدة بيانات الدفتر اليومي — تفصلها عن بقية المنصة. */
export const DAILY_DB_PREFIX = 'snv_dailydb_v1::';

/** رقم إصدار شكل القاعدة (للحفظ والتحقق). */
export const DAILY_DB_VERSION = 1;

/**
 * مفاتيح التخزين لكل Collection. كل منها مفتاح محلي مستقل داخل
 * Namespace الدفتر، فلا تتداخل مع Collections المنصة الرئيسية.
 */
export const DAILY_DB_KEYS = {
  progressions: `${DAILY_DB_PREFIX}progressions`,
  fields: `${DAILY_DB_PREFIX}fields`,
  learningSections: `${DAILY_DB_PREFIX}learningSections`,
  learningResources: `${DAILY_DB_PREFIX}learningResources`,
  learningItems: `${DAILY_DB_PREFIX}learningItems`,
  activities: `${DAILY_DB_PREFIX}activities`,
  classes: `${DAILY_DB_PREFIX}classes`,
  lessons: `${DAILY_DB_PREFIX}lessons`,
  lessonHistory: `${DAILY_DB_PREFIX}lessonHistory`,
  sourceFiles: `${DAILY_DB_PREFIX}sourceFiles`,
} as const;

/** مفتاح الإصدار. */
export const DAILY_DB_VERSION_KEY = `${DAILY_DB_PREFIX}version`;

/** قراءة قائمة من المفتاح المحلي (مع تجريب الأخطاء). */
export function readCollection<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch {
    return [];
  }
}

/** كتابة قائمة إلى المفتاح المحلي. */
export function writeCollection<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* تجاوز سعة التخزين — يُتجاهل بهدوء */
  }
}

/** قراءة قيمة نصية من المفتاح المحلي. */
export function readMeta(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** كتابة قيمة نصية إلى المفتاح المحلي. */
export function writeMeta(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* يُتجاهل بهدوء */
  }
}

/**
 * قراءة لقطة القاعدة الكاملة من Namespace الدفتر فقط.
 * لا تقرأ أي مفاتيح من Namespace المنصة الرئيسية.
 */
export function readFullSnapshot(): DailyLogbookDatabase {
  return {
    progressions: readCollection(DAILY_DB_KEYS.progressions),
    fields: readCollection(DAILY_DB_KEYS.fields),
    learningSections: readCollection(DAILY_DB_KEYS.learningSections),
    learningResources: readCollection(DAILY_DB_KEYS.learningResources),
    learningItems: readCollection(DAILY_DB_KEYS.learningItems),
    activities: readCollection(DAILY_DB_KEYS.activities),
    classes: readCollection(DAILY_DB_KEYS.classes),
    lessons: readCollection(DAILY_DB_KEYS.lessons),
    lessonHistory: readCollection(DAILY_DB_KEYS.lessonHistory),
    sourceFiles: readCollection(DAILY_DB_KEYS.sourceFiles),
  };
}

/** كتابة لقطة القاعدة الكاملة إلى Namespace الدفتر فقط. */
export function writeFullSnapshot(db: DailyLogbookDatabase): void {
  writeCollection(DAILY_DB_KEYS.progressions, db.progressions);
  writeCollection(DAILY_DB_KEYS.fields, db.fields);
  writeCollection(DAILY_DB_KEYS.learningSections, db.learningSections);
  writeCollection(DAILY_DB_KEYS.learningResources, db.learningResources);
  writeCollection(DAILY_DB_KEYS.learningItems, db.learningItems);
  writeCollection(DAILY_DB_KEYS.activities, db.activities);
  writeCollection(DAILY_DB_KEYS.classes, db.classes);
  writeCollection(DAILY_DB_KEYS.lessons, db.lessons);
  writeCollection(DAILY_DB_KEYS.lessonHistory, db.lessonHistory);
  writeCollection(DAILY_DB_KEYS.sourceFiles, db.sourceFiles);
  writeMeta(DAILY_DB_VERSION_KEY, String(DAILY_DB_VERSION));
}

/** حذف كل بيانات الدفتر من Namespace الدفتر فقط. */
export function clearDailyDatabase(): void {
  Object.values(DAILY_DB_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* يُتجاهل بهدوء */
    }
  });
  try {
    localStorage.removeItem(DAILY_DB_VERSION_KEY);
  } catch {
    /* يُتجاهل بهدوء */
  }
}
