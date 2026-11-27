/**
 * ============================================================================
 *  قاعدة بيانات الدفتر اليومي — الوحدة المستقلة
 * ============================================================================
 *
 * وحدة بيانات مستقلة بالكامل عن قاعدة المنصة الرئيسية. تُصدّر كل ما
 * يحتاجه الدفتر اليومي من نماذج، طبقة تخزين منفصلة، منطق عمليات
 * مستقل، ووحدة استيراد التدرجات.
 *
 *   الاستخدام:
 *     import { createDailyLogbookDB, initializeDailyDatabase } from './dailydb';
 *
 *     const db = createDailyLogbookDB(teacherId);
 *     initializeDailyDatabase();          // استيراد التدرجات الأربعة
 *     const lesson = db.createLesson({...});
 *     db.cancelLesson(lesson.id, 'غياب الأستاذ');
 *
 * لا تعتمد هذه الوحدة على أي Collection أو ملف من قاعدة المنصة الرئيسية.
 */

export * from './schema';
export * from './storage';
export * from './db';
export * from './importer';
