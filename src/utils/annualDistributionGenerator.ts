import { LessonMemo } from '../types';

export interface AnnualCalendarEvent {
  startDate: string;
  endDate?: string;
  label: string;
  type: 'holiday' | 'exam' | 'test' | 'assessment';
}

export interface GeneratedSession {
  id?: string;
  level?: LessonMemo['level'];
  lessonType?: 'curriculum' | 'introductory' | 'opening' | 'health' | 'remediation' | 'assessment' | 'holiday';
  midan: string;
  maqta: string;
  mawrid: string;
  session1: string;
  session2: string;
  isExam?: boolean;
  isHoliday?: boolean;
  isIntroductory?: boolean;
  isRemediation?: boolean;
  holidayLabel?: string;
  month: string;
  dates: string;
  sourceSequenceId?: string;
  sourceResourceId?: string;
  sourceLearningUnitId?: string;
  sourceActivityId?: string;
  sourceActivityId2?: string;
  learningUnit?: string;
  taqwim?: string;
  percent?: string;
  week?: number | string;
}

export function generateAnnualDistribution(
  lessons: LessonMemo[],
  startDateStr: string,
  holidays: { startDate: string; endDate?: string; label: string }[] = [],
  calendarEvents: AnnualCalendarEvent[] = []
): GeneratedSession[] {
  // For 1AM, keep every learning unit intact: activities from one learning unit
  // must never be paired with activities from another resource.
  const flatActivities: { midan: string; maqta: string; mawrid: string; title: string; sourceSequenceId?: string; sourceResourceId?: string; sourceLearningUnitId?: string; sourceActivityId?: string; learningUnit?: string; taqwim?: string }[] = [];
  
  // Build sessions only from curriculum activities; never invent curriculum content.
  for (const lesson of lessons) {
    for (const [activityIndex, act] of lesson.anshita.entries()) {
      flatActivities.push({
        midan: lesson.midan,
        maqta: lesson.maqta,
        mawrid: lesson.mawrid,
        title: act.title,
        sourceSequenceId: lesson.sourceSequenceId,
        sourceResourceId: lesson.sourceResourceId,
        sourceLearningUnitId: lesson.sourceLearningUnitId,
        sourceActivityId: act.sourceActivityId || `generated:${lesson.level || 'level'}:${lesson.memoNumber || lesson.sourceLearningUnitId || 'unit'}:activity-${activityIndex + 1}`,
        learningUnit: lesson.ta3alom,
        taqwim: lesson.taqwim || ''
      });
    }
  }

  const generated: GeneratedSession[] = [];
  if (!startDateStr) return [];
  const currentDate = new Date(startDateStr);
  if (Number.isNaN(currentDate.getTime())) return [];
  
  // Align to the Sunday containing the school-entry date (or the Sunday
  // immediately before it). Never jump to the following week.
  while (currentDate.getDay() !== 0) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  const ARABIC_MONTHS = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const getFormattedDateRange = (date: Date) => {
    const thu = new Date(date);
    thu.setDate(thu.getDate() + 4);
    const format = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const month = ARABIC_MONTHS[d.getMonth()];
      return `${day} ${month} ${d.getFullYear()}`;
    };
    return `${format(date)} - ${format(thu)}`;
  };

  const parseLocalDate = (value: string) => {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const weekEnd = (d: Date) => {
    const end = new Date(d);
    end.setDate(end.getDate() + 4);
    return end;
  };

  const overlapsWeek = (startDate: string, endDate?: string, weekStart?: Date) => {
    if (!weekStart || !startDate) return false;
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate || startDate);
    if (!start || !end) return false;
    const currentEnd = weekEnd(weekStart);
    return start <= currentEnd && end >= weekStart;
  };

  const findCalendarEvent = (weekStart: Date) => {
    const holiday = holidays.find(h => overlapsWeek(h.startDate, h.endDate, weekStart));
    if (holiday) return { type: 'holiday' as const, label: holiday.label };
    const event = calendarEvents.find(e => overlapsWeek(e.startDate, e.endDate, weekStart));
    if (event) return { type: event.type, label: event.label };
    return null;
  };

  let actIdx = 0;
  let weekNum = 1;
  let lastMidan = '';
  let lastMaqta = '';
  let lastMawrid = '';
  const is1AM = lessons.some(lesson => lesson.level === '1am');

  while (actIdx < flatActivities.length || weekNum <= 2) {
    const month = ARABIC_MONTHS[currentDate.getMonth()];
    const dates = getFormattedDateRange(currentDate);

    // Keep track of current location in curriculum
    if (flatActivities[actIdx]) {
      lastMidan = flatActivities[actIdx].midan || lastMidan;
      lastMaqta = flatActivities[actIdx].maqta || lastMaqta;
      lastMawrid = flatActivities[actIdx].mawrid || lastMawrid;
    }

    // Opening week: every level has the opening lesson first,
    // followed by school health as the second session of the same week.
    if (weekNum === 1) {
      generated.push({
        id: 'annual-1-opening',
        level: lessons[0]?.level,
        lessonType: 'introductory',
        midan: '',
        maqta: '',
        mawrid: '',
        session1: 'تعارف + الدرس الافتتاحي',
        session2: 'الصحة المدرسية',
        month,
        dates
      });
      weekNum++;
      currentDate.setDate(currentDate.getDate() + 7);
      continue;
    }

    if (weekNum === 2) {
      // After the opening/health week:
      // 1AM gets two pedagogical-remediation sessions.
      // Other levels start the regular school study sequence.
      if (is1AM) {
        generated.push({
          id: 'annual-2-remediation',
          level: lessons[0]?.level,
          lessonType: 'remediation',
          midan: '',
          maqta: '',
          mawrid: '',
          // 1AM – الأسبوع الثاني: المعالجة البيداغوجية حسب التوجيه المحدد
          // للحصتين، مع إبقاء الميدان والمقطع فارغين لأنها حصة معالجة وليست
          // انطلاقاً من مورد منهجي جديد.
          session1: 'الحفظ والصحة — المعيار 3، المعيار 4',
          session2: 'الحفظ والمحيط — المعيار 1: تحديد خصائص النباتات ومظاهر تكيفها في أوساطها واحتياجاتها',
          month,
          dates,
          taqwim: 'المعيار 3، المعيار 4 / المعيار 1'
        });
      } else {
        const act1 = flatActivities[actIdx++];
        generated.push({
          id: 'annual-2-start-study',
          level: lessons[0]?.level,
          // Week 2 session 1 is the pedagogical starting situation for
          // the first field/sequence and its first learning unit.
          // Session 2 remains the first official curriculum activity.
          lessonType: 'introductory',
          midan: act1?.midan || '',
          maqta: act1?.maqta || '',
          mawrid: act1?.mawrid || '',
          session1: 'وضعية انطلاقية للميدان والمقطع',
          session2: act1?.title || '',
          month,
          dates,
          sourceSequenceId: act1?.sourceSequenceId,
          sourceResourceId: act1?.sourceResourceId,
          sourceLearningUnitId: act1?.sourceLearningUnitId,
          sourceActivityId2: act1?.sourceActivityId,
          learningUnit: act1?.learningUnit,
          taqwim: lessons[0]?.taqwim || ''
        });
      }
      weekNum++;
      currentDate.setDate(currentDate.getDate() + 7);
      continue;
    }

    // العطل والاختبارات والفروض تُقرأ من الرزنامة المحفوظة/المعتمدة.
    // لا نستعمل دالة غير معرفة ولا نثبت عطلاً بأرقام أسابيع.
    const calendarEvent = findCalendarEvent(currentDate);
    if (calendarEvent) {
      const isHolidayEvent = calendarEvent.type === 'holiday';
      const isAssessmentEvent =
        calendarEvent.type === 'exam' ||
        calendarEvent.type === 'test' ||
        calendarEvent.type === 'assessment';

      generated.push({
        midan: lastMidan,
        maqta: lastMaqta,
        mawrid: lastMawrid,
        session1: isHolidayEvent ? '' : calendarEvent.label,
        session2: isHolidayEvent ? '' : 'تصحيح ' + calendarEvent.label,
        isExam: isAssessmentEvent,
        isHoliday: isHolidayEvent,
        holidayLabel: isHolidayEvent ? calendarEvent.label : undefined,
        month,
        dates
      });
      weekNum++;
      currentDate.setDate(currentDate.getDate() + 7);
      continue;
    }

    // Normal week. For 1AM, consume at most two activities from the same learning unit.
    const act1 = flatActivities[actIdx++];
    let act2 = flatActivities[actIdx] || null;
    if (is1AM && act2 && act2.sourceLearningUnitId !== act1.sourceLearningUnitId) {
      act2 = null;
    } else if (act2) {
      actIdx++;
    }

    generated.push({
      id: 'annual-' + weekNum + '-' + (act1.sourceActivityId || actIdx),
      level: lessons[0]?.level,
      lessonType: 'curriculum',
      midan: act1.midan,
      maqta: act1.maqta,
      mawrid: act1.mawrid,
      session1: act1.title,
      session2: act2 ? act2.title : (act1.taqwim ? `تقويم: ${act1.taqwim}` : 'تقويم'),
      month,
      dates,
      sourceSequenceId: act1.sourceSequenceId,
      sourceResourceId: act1.sourceResourceId,
      sourceLearningUnitId: act1.sourceLearningUnitId,
      sourceActivityId: act1.sourceActivityId,
      sourceActivityId2: act2?.sourceActivityId,
      learningUnit: act1.learningUnit,
      taqwim: act1.taqwim || ''
    });
    weekNum++;
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return generated;
}
