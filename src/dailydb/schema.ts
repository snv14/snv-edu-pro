/**
 * ============================================================================
 *  قاعدة بيانات الدفتر اليومي — البنية التحتية (Schema)
 * ============================================================================
 *
 * هذه القاعدة **مستقلة تمامًا** عن قاعدة بيانات المنصة الرئيسية:
 *   • Collections خاصة (`daily*`).
 *   • معرفات مستقلة.
 *   • منطق بيانات وعمليات قراءة/كتابة مستقل.
 *   • قواعد تحقق مستقلة.
 *   • لا تعتمد على Collections قاعدة المنصة الرئيسية، ولا على ملفات
 *     المذكرات أو المساعد الذكي أو باقي وحدات المنصة.
 *
 * مصدر بيانات هذه القاعدة هو **ملفات التدرجات البيداغوجية الأربعة**
 * (1AM–4AM). تُستورد التدرجات وتُحفظ كنسخة منظمة داخل هذه القاعدة،
 * وتبقى **مرجعًا للترتيب التعليمي** لا يُسمح بتعديله من الدفتر اليومي.
 *
 * التسلسل التعليمي داخل الملفات المصدر:
 *   الميدان ← المقطع التعلمي ← المورد التعلمي ← تعلم المورد ←
 *   المشكلة ← النشاط ← إرساء المورد ← تقويم المورد
 *
 * تُرجّم هذا التسلسل إلى الCollections التالية:
 *   dailyFields          ← الميادين
 *   dailyLearningSections ← المقاطع التعلمية
 *   dailyLearningResources ← الموارد التعلمية
 *   dailyLearningItems   ← تعلم الموارد (مع المشكلة/الإرساء/التقويم)
 *   dailyActivities      ← الأنشطة
 *   dailySourceFiles     ← معلومات الملفات المصدرية
 *   dailyProgressions    ← التدرجات (واحدة لكل مستوى)
 *
 * بينما تبقى البيانات الخاصة بالدفتر (غير التابعة للتدرج):
 *   dailyClasses         ← الأقسام
 *   dailyLessons         ← الحصص الفعلية
 *   dailyLessonHistory   ← سجل العمليات على الحصص
 */

/** رموز المستويات كما وردت في الملفات المصدرية. */
export type DailyLevelCode = '1AM' | '2AM' | '3AM' | '4AM';

export const DAILY_LEVEL_CODES: DailyLevelCode[] = ['1AM', '2AM', '3AM', '4AM'];

export function isDailyLevelCode(v: string): v is DailyLevelCode {
  return v === '1AM' || v === '2AM' || v === '3AM' || v === '4AM';
}

/** أنواع نشاط الحصة. */
export type DailyActivityType =
  | 'activity'
  | 'experiment'
  | 'observation'
  | 'exercise'
  | 'evaluation';

/** حالات الحصة. */
export type DailyLessonStatus =
  | 'planned'
  | 'completed'
  | 'cancelled'
  | 'postponed'
  | 'rescheduled';

/** إجراءات سجل العمليات. */
export type DailyLessonAction =
  | 'created'
  | 'edited'
  | 'cancelled'
  | 'restored'
  | 'postponed'
  | 'moved'
  | 'duplicated'
  | 'completed';

/** حالة التدرج المصدري. */
export type DailyProgressionStatus = 'official' | 'archived';

/** لغة الملفات المصدرية. */
export type DailySourceType = 'progression';

// ---------------------------------------------------------------------------
// معرفات الزمن — تُحفظ كقيم ISO نصية (مستقلة عن كائنات Timestamp الخادم)
// ---------------------------------------------------------------------------
export type DailyTimestamp = string;

// ---------------------------------------------------------------------------
// 1. التدرجات
// ---------------------------------------------------------------------------
export interface DailyProgression {
  id: string;
  levelCode: DailyLevelCode;
  academicYear: string;
  sourceFileId: string;
  sourceVersion: string;
  status: DailyProgressionStatus;
  createdAt: DailyTimestamp;
  updatedAt: DailyTimestamp;
}

// ---------------------------------------------------------------------------
// 2. الميادين
// ---------------------------------------------------------------------------
export interface DailyField {
  id: string;
  progressionId: string;
  title: string;
  order: number;
}

// ---------------------------------------------------------------------------
// 3. المقاطع التعلمية
// ---------------------------------------------------------------------------
export interface DailyLearningSection {
  id: string;
  progressionId: string;
  fieldId: string;
  title: string;
  order: number;
}

// ---------------------------------------------------------------------------
// 4. الموارد التعلمية
// ---------------------------------------------------------------------------
export interface DailyLearningResource {
  id: string;
  progressionId: string;
  fieldId: string;
  sectionId: string;
  title: string;
  order: number;
}

// ---------------------------------------------------------------------------
// 5. تعلم الموارد
// ---------------------------------------------------------------------------
export interface DailyLearningItem {
  id: string;
  progressionId: string;
  fieldId: string;
  sectionId: string;
  resourceId: string;
  title: string;
  order: number;
  globalSequence: number;
  problem?: string;
  establishment?: string;
  evaluation?: string;
}

// ---------------------------------------------------------------------------
// 6. الأنشطة
// ---------------------------------------------------------------------------
export interface DailyActivity {
  id: string;
  progressionId: string;
  learningItemId: string;
  title: string;
  order: number;
  type: DailyActivityType;
  sourcePage?: number;
}

// ---------------------------------------------------------------------------
// 7. الأقسام
// ---------------------------------------------------------------------------
export interface DailyClass {
  id: string;
  levelCode: DailyLevelCode;
  title: string;
  createdAt: DailyTimestamp;
  updatedAt: DailyTimestamp;
}

// ---------------------------------------------------------------------------
// 8. الحصص الفعلية (البيانات الخاصة بالدفتر — ليست جزءًا من التدرج)
// ---------------------------------------------------------------------------
export interface DailyLesson {
  id: string;
  progressionId: string;
  levelCode: DailyLevelCode;
  classId: string;
  date: string; // YYYY-MM-DD — التاريخ المختار هو المرجع الفعلي
  startTime?: string;
  endTime?: string;
  /** رابط إلى عنصر تعلم مورد في تدرج قاعدة الدفتر — وليس نسخة من محتواه. */
  learningItemId?: string;
  lessonTitle?: string;
  status: DailyLessonStatus;
  cancellationReason?: string;
  notes?: string;
  createdAt: DailyTimestamp;
  updatedAt: DailyTimestamp;
}

// ---------------------------------------------------------------------------
// 9. سجل العمليات
// ---------------------------------------------------------------------------
export interface DailyLessonHistory {
  id: string;
  lessonId: string;
  action: DailyLessonAction;
  previousDate?: string;
  newDate?: string;
  previousStatus?: DailyLessonStatus;
  newStatus?: DailyLessonStatus;
  changedAt: DailyTimestamp;
  changedBy?: string;
}

// ---------------------------------------------------------------------------
// 10. الملفات المصدرية
// ---------------------------------------------------------------------------
export interface DailySourceFile {
  id: string;
  fileName: string;
  levelCode: DailyLevelCode;
  fileType: 'pdf';
  sourceType: DailySourceType;
  version?: string;
  importedAt: DailyTimestamp;
}

// ---------------------------------------------------------------------------
// محتوى القاعدة الكامل (لقطة واحدة)
// ---------------------------------------------------------------------------
export interface DailyLogbookDatabase {
  progressions: DailyProgression[];
  fields: DailyField[];
  learningSections: DailyLearningSection[];
  learningResources: DailyLearningResource[];
  learningItems: DailyLearningItem[];
  activities: DailyActivity[];
  classes: DailyClass[];
  lessons: DailyLesson[];
  lessonHistory: DailyLessonHistory[];
  sourceFiles: DailySourceFile[];
}

/** إنشاء قاعدة فارغة. */
export function createEmptyDailyLogbookDatabase(): DailyLogbookDatabase {
  return {
    progressions: [],
    fields: [],
    learningSections: [],
    learningResources: [],
    learningItems: [],
    activities: [],
    classes: [],
    lessons: [],
    lessonHistory: [],
    sourceFiles: [],
  };
}
