/**
 * مخزن الدفتر اليومي — الفصل بين **الدفتر** و **الحصة**.
 *
 * يُحفظ كل شيء في localStorage ضمن مفتاح موحد. لا يُستخدم الحذف النهائي
 * للحصة عند الإلغاء، بل تُغيّر حالتها إلى `cancelled` وتبقى في السجل.
 */
import type { Lesson, Logbook, LogbookLogEntry } from './types';

const STORAGE_KEY = 'snv_logbook_v1';

export interface LogbookSnapshot {
  version: number;
  logbook: Logbook;
  lessons: Lesson[];
  logs: LogbookLogEntry[];
}

function defaultLogbook(teacherId: string, schoolYear: string): Logbook {
  return {
    id: 'default-logbook',
    teacherId,
    schoolYear,
    startDate: '',
    updatedAt: new Date().toISOString(),
  };
}

function emptySnapshot(teacherId: string, schoolYear: string): LogbookSnapshot {
  return {
    version: 1,
    logbook: defaultLogbook(teacherId, schoolYear),
    lessons: [],
    logs: [],
  };
}

/** قراءة اللقطة الحالية من localStorage. */
export function loadSnapshot(teacherId: string, schoolYear: string): LogbookSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySnapshot(teacherId, schoolYear);
    const parsed = JSON.parse(raw) as LogbookSnapshot;
    if (!parsed || typeof parsed !== 'object') return emptySnapshot(teacherId, schoolYear);
    return {
      version: parsed.version ?? 1,
      logbook: { ...defaultLogbook(teacherId, schoolYear), ...parsed.logbook },
      lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return emptySnapshot(teacherId, schoolYear);
  }
}

/** حفظ اللقطة. */
export function saveSnapshot(snapshot: LogbookSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* تجاوز سعة التخزين — يُتجاهل بهدوء */
  }
}

/** إعادة تعيين المخزن (للإعدادات / التصحيح). */
export function resetSnapshot(teacherId: string, schoolYear: string): LogbookSnapshot {
  const snap = emptySnapshot(teacherId, schoolYear);
  saveSnapshot(snap);
  return snap;
}

/** إضافة أو تحديث حصة. */
export function upsertLesson(
  snapshot: LogbookSnapshot,
  lesson: Lesson,
  logLabel?: string,
  action: LogbookLogEntry['action'] = 'created'
): LogbookSnapshot {
  const exists = snapshot.lessons.some((l) => l.id === lesson.id);
  const lessons = exists
    ? snapshot.lessons.map((l) => (l.id === lesson.id ? lesson : l))
    : [...snapshot.lessons, lesson];
  const logs = logLabel
    ? [
        ...snapshot.logs,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          lessonId: lesson.id,
          action,
          label: logLabel,
          at: new Date().toISOString(),
        } as LogbookLogEntry,
      ]
    : snapshot.logs;
  return { ...snapshot, lessons, logs, logbook: { ...snapshot.logbook, updatedAt: new Date().toISOString() } };
}

/** تحديد حصة (تغيير حالتها). */
export function setLessonStatus(
  snapshot: LogbookSnapshot,
  lessonId: string,
  status: Lesson['status'],
  reason?: Lesson['cancellationReason'],
  detail?: string,
  logLabel?: string
): LogbookSnapshot {
  const lessons = snapshot.lessons.map((l) =>
    l.id === lessonId
      ? {
          ...l,
          status,
          cancellationReason: status === 'cancelled' ? (reason ?? null) : null,
          cancellationDetail: status === 'cancelled' ? (detail ?? '') : '',
          updatedAt: new Date().toISOString(),
        }
      : l
  );
  const logs = logLabel
    ? [
        ...snapshot.logs,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          lessonId,
          action: status === 'cancelled' ? 'cancelled' : status === 'scheduled' ? 'restored' : 'edited',
          label: logLabel,
          at: new Date().toISOString(),
        } as LogbookLogEntry,
      ]
    : snapshot.logs;
  return { ...snapshot, lessons, logs, logbook: { ...snapshot.logbook, updatedAt: new Date().toISOString() } };
}

/** حذف حصة نهائياً (يُستخدم فقط عند إزالة حصة يدوية غير مُستعادة، بتأكيد صريح). */
export function removeLesson(snapshot: LogbookSnapshot, lessonId: string): LogbookSnapshot {
  return {
    ...snapshot,
    lessons: snapshot.lessons.filter((l) => l.id !== lessonId),
    logs: snapshot.logs,
    logbook: { ...snapshot.logbook, updatedAt: new Date().toISOString() },
  };
}

/** نقل حصة إلى تاريخ/وقت آخر (يُحدّث التاريخ في المخزن أيضاً). */
export function moveLesson(
  snapshot: LogbookSnapshot,
  lessonId: string,
  newDate: string,
  newStart: string,
  newEnd: string,
  newClassName?: string
): LogbookSnapshot {
  const lessons = snapshot.lessons.map((l) =>
    l.id === lessonId
      ? {
          ...l,
          date: newDate,
          startTime: newStart,
          endTime: newEnd,
          className: newClassName ?? l.className,
          updatedAt: new Date().toISOString(),
        }
      : l
  );
  return { ...snapshot, lessons, logbook: { ...snapshot.logbook, updatedAt: new Date().toISOString() } };
}

/** تكرار حصة إلى تواريخ متعددة (نسخ). */
export function repeatLesson(
  snapshot: LogbookSnapshot,
  source: Lesson,
  dates: string[]
): LogbookSnapshot {
  const created: Lesson[] = dates.map((date) => ({
    ...source,
    id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    status: 'scheduled',
    cancellationReason: null,
    cancellationDetail: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  return {
    ...snapshot,
    lessons: [...snapshot.lessons, ...created],
    logbook: { ...snapshot.logbook, updatedAt: new Date().toISOString() },
  };
}

/** نسخ حصة (إنشاء نسخة جديدة في نفس التاريخ أو تاريخ آخر). */
export function copyLesson(snapshot: LogbookSnapshot, source: Lesson, targetDate: string): LogbookSnapshot {
  const copy: Lesson = {
    ...source,
    id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: targetDate,
    status: 'scheduled',
    cancellationReason: null,
    cancellationDetail: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { ...snapshot, lessons: [...snapshot.lessons, copy], logbook: { ...snapshot.logbook, updatedAt: new Date().toISOString() } };
}

/** ترتيب الحصص (إعادة ترتيب يدوي حسب المفاتيح الموجودة). */
export function reorderLessons(snapshot: LogbookSnapshot, ordered: Lesson[]): LogbookSnapshot {
  return { ...snapshot, lessons: ordered, logbook: { ...snapshot.logbook, updatedAt: new Date().toISOString() } };
}
