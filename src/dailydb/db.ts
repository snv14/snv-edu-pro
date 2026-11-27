/**
 * ============================================================================
 *  قاعدة بيانات الدفتر اليومي — منطق البيانات والعمليات المستقلة
 * ============================================================================
 *
 * هذه القاعدة مستقلة تمامًا عن قاعدة المنصة الرئيسية:
 *   • لا تُستعلم Collections المنصة الرئيسية (المستخدمون، المذكرات،
 *     المساعد الذكي، المحتوى التعليمي، الموارد...).
 *   • لا تعتمد على ملفات أو محتوى المذكرات أو المساعد الذكي.
 *   • كل عملية قراءة/كتابة تمر عبر Namespace الدفتر الخاص فقط.
 *
 * التدرجات المصدرة تُستورد كنسخة منظمة داخل هذه القاعدة (read-only
 * مرجعيًا): لا يُسمح لل دفتر اليومي بتعديل نص التدرج أو حذف مورد أو
 * تغيير ترتيبه. أي تعديل على الحصة يؤثر على `dailyLessons` و
 * `dailyLessonHistory` فقط.
 */

import {
  readCollection,
  writeCollection,
  readFullSnapshot,
  writeFullSnapshot,
  clearDailyDatabase,
  DAILY_DB_KEYS,
} from './storage';
import {
  createEmptyDailyLogbookDatabase,
  type DailyActivity,
  type DailyActivityType,
  type DailyClass,
  type DailyField,
  type DailyLesson,
  type DailyLessonAction,
  type DailyLessonHistory,
  type DailyLessonStatus,
  type DailyLearningItem,
  type DailyLearningResource,
  type DailyLearningSection,
  type DailyLogbookDatabase,
  type DailyProgression,
  type DailySourceFile,
} from './schema';

/** هوية المالك (الأستاذ). تُستخدم في سجل العمليات. */
export type DailyDbOwner = string;

/** إنشاء معرف فريد داخل Namespace الدفتر. */
function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** نقطة زمنية الآن (قيم ISO نصية). */
function now(): string {
  return new Date().toISOString();
}

/**
 * قاعدة بيانات الدفتر اليومي.
 * كل دالة تتعامل مع Collection محددة من Namespace الدفتر فقط.
 */
export class DailyLogbookDB {
  private owner: DailyDbOwner;

  constructor(owner: DailyDbOwner) {
    this.owner = owner;
  }

  // -------------------------------------------------------------------------
  // لقطة القاعدة الكاملة
  // -------------------------------------------------------------------------
  snapshot(): DailyLogbookDatabase {
    return readFullSnapshot();
  }

  save(db: DailyLogbookDatabase): void {
    writeFullSnapshot(db);
  }

  /** إعادة تعيين القاعدة إلى الحالة الفارغة (Namespace الدفتر فقط). */
  reset(): DailyLogbookDatabase {
    clearDailyDatabase();
    return createEmptyDailyLogbookDatabase();
  }

  /** هل تم تهيئة القاعدة من قبل (وجود إصدار). */
  isInitialized(): boolean {
    return readFullSnapshot().progressions.length > 0 ||
      readFullSnapshot().sourceFiles.length > 0;
  }

  // =====================================================================
  // التدرجات (مرجع ترتيب تعليمي — لا يُسمح بتعديله من الدفتر)
  // =====================================================================
  listProgressions(): DailyProgression[] {
    return readCollection<DailyProgression>(DAILY_DB_KEYS.progressions);
  }

  getProgression(id: string): DailyProgression | undefined {
    return this.listProgressions().find((p) => p.id === id);
  }

  getProgressionByLevel(levelCode: string): DailyProgression | undefined {
    return this.listProgressions().find((p) => p.levelCode === levelCode);
  }

  /** إدخال تدرج جديد (يُستخدم عند الاستيراد — لا يُستخدم للتعديل). */
  insertProgression(p: Omit<DailyProgression, 'createdAt' | 'updatedAt'>): DailyProgression {
    const record: DailyProgression = {
      ...p,
      createdAt: now(),
      updatedAt: now(),
    };
    const items = this.listProgressions();
    items.push(record);
    writeCollection(DAILY_DB_KEYS.progressions, items);
    return record;
  }

  // =====================================================================
  // الميادين
  // =====================================================================
  listFields(progressionId?: string): DailyField[] {
    const all = readCollection<DailyField>(DAILY_DB_KEYS.fields);
    return progressionId ? all.filter((f) => f.progressionId === progressionId) : all;
  }

  // =====================================================================
  // المقاطع التعلمية
  // =====================================================================
  listLearningSections(progressionId?: string): DailyLearningSection[] {
    const all = readCollection<DailyLearningSection>(DAILY_DB_KEYS.learningSections);
    return progressionId ? all.filter((s) => s.progressionId === progressionId) : all;
  }

  // =====================================================================
  // الموارد التعلمية
  // =====================================================================
  listLearningResources(progressionId?: string): DailyLearningResource[] {
    const all = readCollection<DailyLearningResource>(DAILY_DB_KEYS.learningResources);
    return progressionId ? all.filter((r) => r.progressionId === progressionId) : all;
  }

  // =====================================================================
  // تعلم الموارد
  // =====================================================================
  listLearningItems(progressionId?: string): DailyLearningItem[] {
    const all = readCollection<DailyLearningItem>(DAILY_DB_KEYS.learningItems);
    return progressionId ? all.filter((i) => i.progressionId === progressionId) : all;
  }

  getLearningItem(id: string): DailyLearningItem | undefined {
    return readCollection<DailyLearningItem>(DAILY_DB_KEYS.learningItems).find((i) => i.id === id);
  }

  // =====================================================================
  // الأنشطة
  // =====================================================================
  listActivities(learningItemId?: string): DailyActivity[] {
    const all = readCollection<DailyActivity>(DAILY_DB_KEYS.activities);
    return learningItemId ? all.filter((a) => a.learningItemId === learningItemId) : all;
  }

  // =====================================================================
  // الملفات المصدرية
  // =====================================================================
  listSourceFiles(levelCode?: string): DailySourceFile[] {
    const all = readCollection<DailySourceFile>(DAILY_DB_KEYS.sourceFiles);
    return levelCode ? all.filter((f) => f.levelCode === levelCode) : all;
  }

  // =====================================================================
  // الأقسام
  // =====================================================================
  listClasses(levelCode?: string): DailyClass[] {
    const all = readCollection<DailyClass>(DAILY_DB_KEYS.classes);
    return levelCode ? all.filter((c) => c.levelCode === levelCode) : all;
  }

  getClass(id: string): DailyClass | undefined {
    return readCollection<DailyClass>(DAILY_DB_KEYS.classes).find((c) => c.id === id);
  }

  /** إضافة قسم (أو التحقق من وجوده). */
  upsertClass(input: { levelCode: DailyClass['levelCode']; title: string; id?: string }): DailyClass {
    const items = readCollection<DailyClass>(DAILY_DB_KEYS.classes);
    if (input.id) {
      const idx = items.findIndex((c) => c.id === input.id);
      if (idx >= 0) {
        const updated: DailyClass = { ...items[idx], title: input.title, updatedAt: now() };
        items[idx] = updated;
        writeCollection(DAILY_DB_KEYS.classes, items);
        return updated;
      }
    }
    // تحقق من عدم التكرار بنفس المستوى والعنوان.
    const existing = items.find((c) => c.levelCode === input.levelCode && c.title === input.title);
    if (existing) return existing;
    const record: DailyClass = {
      id: makeId('cls'),
      levelCode: input.levelCode,
      title: input.title,
      createdAt: now(),
      updatedAt: now(),
    };
    items.push(record);
    writeCollection(DAILY_DB_KEYS.classes, items);
    return record;
  }

  // =====================================================================
  // الحصص الفعلية (البيانات الخاصة بالدفتر)
  // =====================================================================

  /** الحصص ضمن نطاق زمني حول التاريخ المحدد. */
  listLessons(filter?: { levelCode?: string; classId?: string; date?: string; period?: { start: string; end: string } }): DailyLesson[] {
    const all = readCollection<DailyLesson>(DAILY_DB_KEYS.lessons);
    return all
      .filter((l) => (filter?.levelCode ? l.levelCode === filter.levelCode : true))
      .filter((l) => (filter?.classId ? l.classId === filter.classId : true))
      .filter((l) => (filter?.date ? l.date === filter.date : true))
      .filter((l) =>
        filter?.period
          ? l.date >= filter.period.start && l.date <= filter.period.end
          : true
      )
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''));
  }

  getLesson(id: string): DailyLesson | undefined {
    return readCollection<DailyLesson>(DAILY_DB_KEYS.lessons).find((l) => l.id === id);
  }

  /** إضافة حصة جديدة. */
  createLesson(input: {
    progressionId: string;
    levelCode: DailyLesson['levelCode'];
    classId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    learningItemId?: string;
    lessonTitle?: string;
    status?: DailyLessonStatus;
    notes?: string;
    cancellationReason?: string;
  }): DailyLesson {
    const record: DailyLesson = {
      id: makeId('lesson'),
      progressionId: input.progressionId,
      levelCode: input.levelCode,
      classId: input.classId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      learningItemId: input.learningItemId,
      lessonTitle: input.lessonTitle,
      status: input.status ?? 'planned',
      cancellationReason: input.cancellationReason,
      notes: input.notes,
      createdAt: now(),
      updatedAt: now(),
    };
    const items = readCollection<DailyLesson>(DAILY_DB_KEYS.lessons);
    items.push(record);
    writeCollection(DAILY_DB_KEYS.lessons, items);
    this.recordHistory({
      lessonId: record.id,
      action: 'created',
      newStatus: record.status,
      changedBy: this.owner,
    });
    return record;
  }

  /** تعديل حصة (مع تسجيل التغييرات في سجل العمليات). */
  updateLesson(
    id: string,
    updates: Partial<Omit<DailyLesson, 'id' | 'createdAt'>>,
    action: DailyLessonAction = 'edited'
  ): DailyLesson | undefined {
    const items = readCollection<DailyLesson>(DAILY_DB_KEYS.lessons);
    const idx = items.findIndex((l) => l.id === id);
    if (idx < 0) return undefined;
    const previous = items[idx];
    const updated: DailyLesson = { ...previous, ...updates, updatedAt: now() };
    items[idx] = updated;
    writeCollection(DAILY_DB_KEYS.lessons, items);
    this.recordHistory({
      lessonId: id,
      action,
      previousDate: previous.date,
      newDate: updated.date,
      previousStatus: previous.status,
      newStatus: updated.status,
      changedBy: this.owner,
    });
    return updated;
  }

  /** إلغاء حصة (تحويل الحالة إلى cancelled، مع بقاءها في السجل). */
  cancelLesson(id: string, reason: string): DailyLesson | undefined {
    return this.updateLesson(id, { status: 'cancelled', cancellationReason: reason }, 'cancelled');
  }

  /** استرجاع حصة مُلغاة. */
  restoreLesson(id: string): DailyLesson | undefined {
    return this.updateLesson(id, { status: 'planned', cancellationReason: undefined }, 'restored');
  }

  /** تأجيل حصة. */
  postponeLesson(id: string, newDate: string): DailyLesson | undefined {
    return this.updateLesson(id, { date: newDate, status: 'postponed' }, 'postponed');
  }

  /** نقل حصة (تغيير التاريخ، مع تحديثه في القاعدة). */
  moveLesson(id: string, newDate: string): DailyLesson | undefined {
    return this.updateLesson(id, { date: newDate, status: 'rescheduled' }, 'moved');
  }

  /** تسجيل حصة منجزة. */
  completeLesson(id: string): DailyLesson | undefined {
    return this.updateLesson(id, { status: 'completed' }, 'completed');
  }

  /** تكرار حصة إلى تواريخ متعددة (إنشاء نسخ جديدة). */
  duplicateLesson(id: string, targetDates: string[]): DailyLesson[] {
    const source = this.getLesson(id);
    if (!source) return [];
    const created: DailyLesson[] = [];
    for (const date of targetDates) {
      const copy = this.createLesson({
        progressionId: source.progressionId,
        levelCode: source.levelCode,
        classId: source.classId,
        date,
        startTime: source.startTime,
        endTime: source.endTime,
        learningItemId: source.learningItemId,
        lessonTitle: source.lessonTitle,
        status: 'planned',
        notes: source.notes,
      });
      this.recordHistory({ lessonId: copy.id, action: 'duplicated', newDate: date, changedBy: this.owner });
      created.push(copy);
    }
    return created;
  }

  /** ربط الحصة بتعلم مورد. */
  linkLearningItem(id: string, learningItemId: string): DailyLesson | undefined {
    return this.updateLesson(id, { learningItemId }, 'edited');
  }

  /** حذف حصة نهائياً (يُستخدم بتأكيد صريح فقط). */
  deleteLesson(id: string): void {
    const items = readCollection<DailyLesson>(DAILY_DB_KEYS.lessons).filter((l) => l.id !== id);
    writeCollection(DAILY_DB_KEYS.lessons, items);
  }

  // =====================================================================
  // سجل العمليات
  // =====================================================================
  listHistory(lessonId?: string): DailyLessonHistory[] {
    const all = readCollection<DailyLessonHistory>(DAILY_DB_KEYS.lessonHistory);
    const sorted = [...all].sort((a, b) => b.changedAt.localeCompare(a.changedAt));
    return lessonId ? sorted.filter((h) => h.lessonId === lessonId) : sorted;
  }

  /** تسجيل إجراء في سجل العمليات. */
  recordHistory(input: {
    lessonId: string;
    action: DailyLessonAction;
    previousDate?: string;
    newDate?: string;
    previousStatus?: DailyLessonStatus;
    newStatus?: DailyLessonStatus;
    changedBy?: string;
  }): DailyLessonHistory {
    const record: DailyLessonHistory = {
      id: makeId('hist'),
      lessonId: input.lessonId,
      action: input.action,
      previousDate: input.previousDate,
      newDate: input.newDate,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      changedAt: now(),
      changedBy: input.changedBy ?? this.owner,
    };
    const items = readCollection<DailyLessonHistory>(DAILY_DB_KEYS.lessonHistory);
    items.push(record);
    writeCollection(DAILY_DB_KEYS.lessonHistory, items);
    return record;
  }
}

/** إنشاء مثيل للقاعدة لمالك معين. */
export function createDailyLogbookDB(owner: DailyDbOwner): DailyLogbookDB {
  return new DailyLogbookDB(owner);
}

/** إعادة تصنيف نوع نشاط من نص النشاط (مستبعد من الاستيراد). */
export function inferActivityType(title: string): DailyActivityType {
  const t = title || '';
  if (/تحليل|الكشف|تجربة|مخبر|تشريح|مجهر|معاينة|تفاعل|بنية|هضم|البلعمة|فصل|كواشف/i.test(t)) {
    return 'experiment';
  }
  if (/ملاحظة|مشاهدة|رصد/i.test(t)) return 'observation';
  if (/تقويم|تقييم|فرض|امتحان|اختبار|إدماج/i.test(t)) return 'evaluation';
  if (/تمرين|تطبيق|تدريب|حل/i.test(t)) return 'exercise';
  return 'activity';
}
