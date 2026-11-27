/**
 * النماذج البيانية لنظام الدفتر اليومي المُعاد تصميمه.
 *
 * القاعدة الأساسية: يُفصل كائن **الدفتر** عن كائن **الحصة**، حتى يمكن
 * تعديل / نقل / إلغاء حصة دون التأثير على بقية الدفتر. لا يُستخدم الحذف
 * النهائي للحصة عند الإلغاء، بل تتحول إلى حالة `cancelled` وتظل في السجل.
 */

/** الحالة الممكنة للحصة داخل البرنامج. */
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';

/** أسباب الإلغاء المقترحة (تظهر داخل الدفتر وتحفظ في السجل). */
export type CancellationReason =
  | 'teacher_absent'
  | 'students_absent'
  | 'school_activity'
  | 'holiday'
  | 'other';

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  teacher_absent: 'غياب الأستاذ',
  students_absent: 'غياب التلاميذ',
  school_activity: 'نشاط مدرسي',
  holiday: 'عطلة',
  other: 'سبب آخر',
};

/** نوع الحصة (يحدد طبيعة النشاط المُبرمج). */
export type LessonType =
  | 'curriculum'
  | 'practical'
  | 'introductory'
  | 'assessment'
  | 'remediation'
  | 'holiday';

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  curriculum: 'درس نظري',
  practical: 'حصة مخبرية / تجريبية',
  introductory: 'وضعية انطلاق',
  assessment: 'إدماج وتقويم',
  remediation: 'معالجة بيداغوجية',
  holiday: 'عطلة',
};

/** المستوى المدرسي بصيغة عربية قصيرة (1م، 2م، ...). */
export type LogbookLevel = '1م' | '2م' | '3م' | '4م';

export const LEVELS: { code: '1am' | '2am' | '3am' | '4am'; arabic: LogbookLevel; label: string }[] = [
  { code: '1am', arabic: '1م', label: 'السنة الأولى متوسط' },
  { code: '2am', arabic: '2م', label: 'السنة الثانية متوسط' },
  { code: '3am', arabic: '3م', label: 'السنة الثالثة متوسط' },
  { code: '4am', arabic: '4م', label: 'السنة الرابعة متوسط (BEM)' },
];

export const LEVEL_LABELS: Record<LogbookLevel, string> = {
  '1م': 'السنة الأولى متوسط (1AM)',
  '2م': 'السنة الثانية متوسط (2AM)',
  '3م': 'السنة الثالثة متوسط (3AM)',
  '4م': 'السنة الرابعة متوسط (4AM - BEM)',
};

export function levelCodeToArabic(code: '1am' | '2am' | '3am' | '4am'): LogbookLevel {
  return `${code[0]}م` as LogbookLevel;
}

export function arabicToLevelCode(arabic: LogbookLevel | string): '1am' | '2am' | '3am' | '4am' {
  const n = String(arabic).match(/\d/)?.[0];
  return `${n || '1'}am` as '1am' | '2am' | '3am' | '4am';
}

/**
 * الحصة الواحدة — الكائن المستقل الذي يُدار داخل الدفتر.
 * يُحافظ على سجله الكامل (حتى عند الإلغاء) ويسمح بالاستعادة لاحقاً.
 */
export interface Lesson {
  id: string;
  teacherId: string;
  /** تاريخ الحصة (YYYY-MM-DD) — المرجع الوحيد لتحديد محتوى الدفتر. */
  date: string;
  startTime: string;
  endTime: string;
  level: LogbookLevel;
  className: string;
  subject: string;
  /** الوحدة / المقطع. */
  unit: string;
  /** عنوان النشاط. */
  activity: string;
  type: LessonType;
  /** مدة الحصة (ساعة / دقيقة). */
  duration: string;
  /** الكفاءة المستهدفة. */
  competency: string;
  /** سير الحصة. */
  flow: string;
  /** الأنشطة. */
  activities: string[];
  /** التجارب المخبرية. */
  experiments: string[];
  /** الواجب المنزلي. */
  homework: string;
  /** الموارد التعليمية المرتبطة (عناوين أو روابط). */
  resources: string[];
  /** ملاحظات عامة. */
  notes: string;
  /** المذكرة المرتبطة (عنوان + معرف). */
  memoTitle?: string;
  memoId?: string;
  status: LessonStatus;
  cancellationReason?: CancellationReason | null;
  /** سبب الإلغاء المفصّل عند اختيار "سبب آخر". */
  cancellationDetail?: string;
  /** وقت/تاريخ آخر تعديل. */
  updatedAt: string;
  createdAt: string;
}

/** سجل الدفتر — 追踪 جميع التغييرات على الحصص. */
export interface LogbookLogEntry {
  id: string;
  lessonId: string;
  action: 'created' | 'edited' | 'cancelled' | 'restored' | 'moved' | 'copied' | 'repeated' | 'generated';
  label: string;
  at: string;
}

/** الدفتر نفسه — مجموعة سياقات زمنية حول الحصص. */
export interface Logbook {
  id: string;
  teacherId: string;
  schoolYear: string;
  /** تاريخ البداية المرجعي للدفتر (لا يعتمد على تاريخ تسجيل الدخول). */
  startDate: string;
  updatedAt: string;
}

/** الفترة الزمنية التي يُعرض/يُصدّر الدفتر على أساسها. */
export type LogbookPeriod = 'day' | 'week' | 'month';

export const PERIOD_LABELS: Record<LogbookPeriod, string> = {
  day: 'اليوم',
  week: 'الأسبوع',
  month: 'الشهر',
};

/** إنشاء حصة فارغة بقيم افتراضية. */
export function createEmptyLesson(teacherId: string, date: string): Lesson {
  const now = new Date().toISOString();
  return {
    id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    teacherId,
    date,
    startTime: '08:00',
    endTime: '09:00',
    level: '3م',
    className: '',
    subject: 'علوم الطبيعة والحياة',
    unit: '',
    activity: '',
    type: 'curriculum',
    duration: '1 ساعة',
    competency: '',
    flow: '',
    activities: [],
    experiments: [],
    homework: '',
    resources: [],
    notes: '',
    status: 'scheduled',
    cancellationReason: null,
    cancellationDetail: '',
    updatedAt: now,
    createdAt: now,
  };
}

/** إنشاء سجل فارغ. */
export function createLogEntry(
  lessonId: string,
  action: LogbookLogEntry['action'],
  label: string
): LogbookLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lessonId,
    action,
    label,
    at: new Date().toISOString(),
  };
}
