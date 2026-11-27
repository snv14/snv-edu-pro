/**
 * هوك React لإدارة مخزن الدفتر اليومي مع الحفظ التلقائي ودعم السجل.
 * يفصل بين الدفتر والحصة، ويحافظ على الحصص الملغاة في السجل.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadSnapshot,
  saveSnapshot,
  upsertLesson,
  setLessonStatus,
  moveLesson,
  repeatLesson,
  copyLesson,
  reorderLessons,
  type LogbookSnapshot,
} from './store';
import type { Lesson, LogbookLogEntry, LogbookPeriod } from './types';
import { lessonsInPeriod, sortLessons } from './exporters';
import { getPeriodRange, schoolDaysInRange, formatDateArabic, dayNameOf, nearestSchoolDay } from './dateUtils';
import { generateLessons } from './generation';

export interface LogbookStore {
  snapshot: LogbookSnapshot;
  lessons: Lesson[];
  logs: LogbookLogEntry[];
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  period: LogbookPeriod;
  setPeriod: (p: LogbookPeriod) => void;
  /** الحصص المعروضة في الفترة الحالية حول التاريخ المحدد. */
  visibleLessons: Lesson[];
  /** الحصص حسب كل يوم (للعرض). */
  lessonsByDay: { date: string; label: string; lessons: Lesson[] }[];
  addOrUpdateLesson: (lesson: Lesson, label: string, action?: LogbookLogEntry['action']) => void;
  cancelLesson: (id: string, reason: Lesson['cancellationReason'], detail: string) => void;
  restoreLesson: (id: string) => void;
  completeLesson: (id: string) => void;
  removeLessonPermanently: (id: string) => void;
  moveLessonTo: (id: string, date: string, start: string, end: string, className?: string) => void;
  repeatLessonTo: (source: Lesson, dates: string[]) => void;
  copyLessonTo: (source: Lesson, date: string) => void;
  reorder: (ordered: Lesson[]) => void;
  generateForPeriod: (
    selectedDate: string,
    period: LogbookPeriod,
    level: Lesson['level']
  ) => { added: number; skipped: number };
}

export function useLogbookStore(teacherId: string, schoolYear: string): LogbookStore {
  const [snapshot, setSnapshot] = useState<LogbookSnapshot>(() =>
    loadSnapshot(teacherId, schoolYear)
  );
  const [selectedDate, setSelectedDateRaw] = useState<string>(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return nearestSchoolDay(iso);
  });
  // كل اختيار تاريخ يُحوّل تلقائياً إلى أقرب يوم دراسي، حتى لا يعلق الدفتر
  // على تاريخ (جمعة/سبت) لا توجد فيه حصص.
  const setSelectedDate = useCallback((d: string) => {
    setSelectedDateRaw(nearestSchoolDay(d));
  }, []);
  const [period, setPeriod] = useState<LogbookPeriod>('day');
  const teacherRef = useRef(teacherId);
  const yearRef = useRef(schoolYear);
  teacherRef.current = teacherId;
  yearRef.current = schoolYear;

  // الحفظ التلقائي عند كل تغيير.
  useEffect(() => {
    saveSnapshot(snapshot);
  }, [snapshot]);

  const addOrUpdateLesson = useCallback(
    (lesson: Lesson, label: string, action: LogbookLogEntry['action'] = 'created') => {
      setSnapshot((prev) => upsertLesson(prev, lesson, label, action));
    },
    []
  );

  const cancelLesson = useCallback((id: string, reason: Lesson['cancellationReason'], detail: string) => {
    setSnapshot((prev) =>
      setLessonStatus(prev, id, 'cancelled', reason, detail, 'تم إلغاء الحصة')
    );
  }, []);

  const restoreLesson = useCallback((id: string) => {
    setSnapshot((prev) => setLessonStatus(prev, id, 'scheduled', undefined, '', 'تم استعادة الحصة'));
  }, []);

  const completeLesson = useCallback((id: string) => {
    setSnapshot((prev) => setLessonStatus(prev, id, 'completed', undefined, '', 'تم تحديد الحصة مكتملة'));
  }, []);

  const removeLessonPermanently = useCallback((id: string) => {
    setSnapshot((prev) => {
      const next = { ...prev };
      next.lessons = prev.lessons.filter((l) => l.id !== id);
      next.logbook = { ...prev.logbook, updatedAt: new Date().toISOString() };
      return next;
    });
  }, []);

  const moveLessonTo = useCallback((id: string, date: string, start: string, end: string, className?: string) => {
    setSnapshot((prev) => moveLesson(prev, id, date, start, end, className));
  }, []);

  const repeatLessonTo = useCallback((source: Lesson, dates: string[]) => {
    setSnapshot((prev) => repeatLesson(prev, source, dates));
  }, []);

  const copyLessonTo = useCallback((source: Lesson, date: string) => {
    setSnapshot((prev) => copyLesson(prev, source, date));
  }, []);

  const reorder = useCallback((ordered: Lesson[]) => {
    setSnapshot((prev) => reorderLessons(prev, ordered));
  }, []);

  const generateForPeriod = useCallback(
    (selDate: string, p: LogbookPeriod, level: Lesson['level']) => {
      const generated = generateLessons({ selectedDate: selDate, period: p, level });
      let added = 0;
      let skipped = 0;
      setSnapshot((prev) => {
        let next = prev;
        for (const g of generated) {
          const existing = next.lessons.find(
            (l) => l.date === g.date && l.startTime === g.startTime && l.className === g.className
          );
          if (existing) {
            skipped++;
            continue;
          }
          const lesson: Lesson = {
            id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            teacherId: teacherRef.current,
            date: g.date,
            startTime: g.startTime,
            endTime: g.endTime,
            level: g.level,
            className: g.className,
            subject: g.subject,
            unit: g.unit,
            activity: g.activity,
            type: g.type,
            duration: g.duration,
            competency: g.competency,
            flow: g.flow,
            activities: [],
            experiments: [],
            homework: '',
            resources: [],
            notes: '',
            memoTitle: g.memoTitle,
            status: 'scheduled',
            cancellationReason: null,
            cancellationDetail: '',
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          next = upsertLesson(next, lesson, `تم توليد حصة: ${g.className} — ${g.activity}`, 'generated');
          added++;
        }
        return next;
      });
      return { added, skipped };
    },
    []
  );

  const visibleLessons = lessonsInPeriod(snapshot.lessons, selectedDate, period);
  const lessonsByDay = schoolDaysInRange(
    getPeriodRange(selectedDate, period).start,
    getPeriodRange(selectedDate, period).end
  )
    .map((date) => ({
      date,
      label: `${dayNameOf(date)} — ${formatDateArabic(date)}`,
      lessons: sortLessons(visibleLessons.filter((l) => l.date === date)),
    }))
    .filter((d) => d.lessons.length > 0);

  return {
    snapshot,
    lessons: snapshot.lessons,
    logs: snapshot.logs,
    selectedDate,
    setSelectedDate,
    period,
    setPeriod,
    visibleLessons,
    lessonsByDay,
    addOrUpdateLesson,
    cancelLesson,
    restoreLesson,
    completeLesson,
    removeLessonPermanently,
    moveLessonTo,
    repeatLessonTo,
    copyLessonTo,
    reorder,
    generateForPeriod,
  };
}
