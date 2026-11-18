import type { LessonMemo } from '../../types';
import type {
  ActivityRecallBundle,
  ArchiveSearchResultGroup,
  ArchiveSourceTrace,
  ArchivedActivity,
  ArchivedEvaluation,
  ArchivedExperiment,
  ArchivedMediaItem,
  ArchivedTableRecord,
  ArchivedWorksheet,
  CurriculumArchiveDatabase,
} from '../memos/archiveSchema';
import { ARCHIVE_1AM_EXPERIMENTS } from './experiments1am';
import { ARCHIVE_1AM_LESSONS_PART1 } from './lessonsPart1';
import { ARCHIVE_1AM_LESSONS_PART2 } from './lessonsPart2';
import { ARCHIVE_1AM_LESSONS_PART3 } from './lessonsPart3';
import { ARCHIVE_1AM_MEDIA } from './mediaLibrary1am';
import {
  ARCHIVE_1AM_EXTRA_TABLES,
  ARCHIVE_1AM_PAGES,
  ARCHIVE_1AM_WORKSHEETS,
} from './worksheetsAndAppendices1am';

export const ARCHIVE_1AM_SOURCE_PDF_URL =
  '/assets/aistudio/________________________________e6f4ebb9.pdf';

export const ARCHIVE_1AM_SOURCE_META = {
  level: '1am' as const,
  sourceTitle: 'مذكرات السنة الأولى متوسط كاملة — علوم الطبيعة والحياة',
  sourceFile: 'مذكرات السنة الأولى متوسط كاملة.pdf',
  sourcePdfUrl: ARCHIVE_1AM_SOURCE_PDF_URL,
  totalPages: 98,
  author: 'الأستاذ موسى حمزة',
  school: 'متوسطة الشهيد بلمهدي الجودي، مزلوق - سطيف',
  location: 'مزلوق - سطيف، الجزائر',
  email: 'hamzamoussa748@gmail.com',
};

export const ARCHIVE_1AM_LESSONS: LessonMemo[] = [
  ...ARCHIVE_1AM_LESSONS_PART1,
  ...ARCHIVE_1AM_LESSONS_PART2,
  ...ARCHIVE_1AM_LESSONS_PART3,
];

const getLessonKey = (lesson: LessonMemo): string =>
  lesson.sourceLearningUnitId || `lu_1am_memo_${lesson.memoNumber || '00'}`;

const buildLessonTrace = (
  lesson: LessonMemo,
  sourcePage?: number,
  activityNumber?: string
): ArchiveSourceTrace => ({
  sourceFile: ARCHIVE_1AM_SOURCE_META.sourceFile,
  sourceAuthor: ARCHIVE_1AM_SOURCE_META.author,
  sourceSchool: ARCHIVE_1AM_SOURCE_META.school,
  sourcePage: sourcePage ?? lesson.sourcePage ?? 1,
  sourcePageEnd: lesson.sourcePageEnd,
  memoNumber: lesson.memoNumber,
  midan: lesson.midan,
  maqtaTitle: lesson.maqta,
  mawridTitle: lesson.mawrid,
  ta3alomTitle: lesson.ta3alom,
  activityNumber,
});

// استخراج جميع الجداول الرقمية الأصلية الـ 48 داخل المذكرات + الجداول الإضافية الـ 9
const CORE_LESSON_TABLES: ArchivedTableRecord[] = [];
ARCHIVE_1AM_LESSONS.forEach((lesson) => {
  const lessonId = getLessonKey(lesson);
  const basePage = lesson.sourcePage ?? 1;

  (lesson.wadiyaTables || []).forEach((table, idx) => {
    CORE_LESSON_TABLES.push({
      id: table.table_id || `tbl_${lessonId}_wadiya_${idx + 1}`,
      level: '1am',
      title: table.table_title || `جدول الوضعية — ${lesson.ta3alom}`,
      table,
      section: 'wadiya',
      memoNumber: lesson.memoNumber,
      relatedLessonId: lessonId,
      sourcePage: basePage,
    });
  });

  lesson.anshita.forEach((act, aIdx) => {
    const actId = act.sourceActivityId || `${lessonId}_act_${aIdx + 1}`;
    (act.tables || []).forEach((table, idx) => {
      CORE_LESSON_TABLES.push({
        id: table.table_id || `tbl_${actId}_${idx + 1}`,
        level: '1am',
        title: table.table_title || act.title,
        table,
        section: 'activity',
        memoNumber: lesson.memoNumber,
        relatedLessonId: lessonId,
        relatedActivityId: actId,
        sourcePage: basePage,
      });
    });
  });

  (lesson.irsaeTables || []).forEach((table, idx) => {
    CORE_LESSON_TABLES.push({
      id: table.table_id || `tbl_${lessonId}_irsae_${idx + 1}`,
      level: '1am',
      title: table.table_title || `جدول الإرساء — ${lesson.ta3alom}`,
      table,
      section: 'irsae',
      memoNumber: lesson.memoNumber,
      relatedLessonId: lessonId,
      sourcePage: lesson.sourcePageEnd ?? basePage,
    });
  });

  (lesson.taqwimTables || []).forEach((table, idx) => {
    CORE_LESSON_TABLES.push({
      id: table.table_id || `tbl_${lessonId}_taqwim_${idx + 1}`,
      level: '1am',
      title: table.table_title || `جدول التقويم — ${lesson.ta3alom}`,
      table,
      section: 'taqwim',
      memoNumber: lesson.memoNumber,
      relatedLessonId: lessonId,
      sourcePage: lesson.sourcePageEnd ?? basePage,
    });
  });
});

export const ARCHIVE_1AM_TABLES: ArchivedTableRecord[] = [
  ...CORE_LESSON_TABLES,
  ...ARCHIVE_1AM_EXTRA_TABLES,
];

// استخراج قاعدة التقويمات الكاملة (27 تقويماً مع الجداول والوسائط المرتبطة)
export const ARCHIVE_1AM_EVALUATIONS: ArchivedEvaluation[] = ARCHIVE_1AM_LESSONS.map((lesson) => {
  const lessonId = getLessonKey(lesson);
  const evalPage = lesson.sourcePageEnd ?? lesson.sourcePage ?? 1;
  const evalTables = ARCHIVE_1AM_TABLES.filter(
    (t) => t.relatedLessonId === lessonId && t.section === 'taqwim'
  );
  const evalMediaIds = ARCHIVE_1AM_MEDIA.filter(
    (m) =>
      m.relatedLessonId === lessonId &&
      (m.tags.includes('تقويم') || m.sourcePage === evalPage)
  ).map((m) => m.id);

  // بناء ملخص الحل النموذجي من جدول التقويم إن وجد أو من نص التقويم وإرساء المورد
  const modelAnswerParts: string[] = [];
  if (evalTables.length > 0) {
    for (const tblRec of evalTables) {
      const hdr = tblRec.table.headers.join(' | ');
      const rws = tblRec.table.rows.map((r) => r.join(' — ')).join('\n');
      modelAnswerParts.push(`${hdr}\n${rws}`);
    }
  } else if (lesson.irsae) {
    modelAnswerParts.push(`الإرساء المرجعي للحل:\n${lesson.irsae}`);
  }

  return {
    id: `eval_${lessonId}`,
    level: '1am',
    memoNumber: lesson.memoNumber || '',
    title: `تقويم المورد — مذكرة ${lesson.memoNumber}: ${lesson.ta3alom}`,
    prompt: lesson.taqwim || '',
    modelAnswer: modelAnswerParts.join('\n\n'),
    tableIds: evalTables.map((t) => t.id),
    mediaIds: evalMediaIds,
    relatedLessonId: lessonId,
    relatedActivityIds: lesson.anshita.map((a, idx) => a.sourceActivityId || `${lessonId}_act_${idx + 1}`),
    sourcePage: evalPage,
    trace: buildLessonTrace(lesson, evalPage),
  };
});

// بناء بنك الأنشطة المستقل (53 نشاطاً مترابطاً بالمعرفات)
export const ARCHIVE_1AM_ACTIVITIES: ArchivedActivity[] = ARCHIVE_1AM_LESSONS.flatMap((lesson) => {
  const lessonId = getLessonKey(lesson);
  return lesson.anshita.map((act, idx) => {
    const actId = act.sourceActivityId || `${lessonId}_act_${idx + 1}`;
    const actNum = `نشاط ${String(idx + 1).padStart(2, '0')}`;
    const expIds = ARCHIVE_1AM_EXPERIMENTS.filter(
      (e) => e.relatedActivityId === actId
    ).map((e) => e.id);
    const mediaIds = ARCHIVE_1AM_MEDIA.filter(
      (m) => m.relatedActivityId === actId
    ).map((m) => m.id);
    const tableIds = ARCHIVE_1AM_TABLES.filter(
      (t) => t.relatedActivityId === actId
    ).map((t) => t.id);
    const worksheetIds = ARCHIVE_1AM_WORKSHEETS.filter(
      (w) => w.relatedLessonId === lessonId && w.category === 'ورقة عمل تلميذ'
    ).map((w) => w.id);
    const actSourcePage =
      ARCHIVE_1AM_MEDIA.find((m) => m.relatedActivityId === actId)?.sourcePage ??
      lesson.sourcePage ??
      1;

    return {
      id: actId,
      level: '1am',
      memoNumber: lesson.memoNumber || '',
      lessonId,
      maqtaId: `maqta_${lesson.maqta}`,
      maqtaTitle: lesson.maqta,
      mawridId: lesson.sourceResourceId || `mawrid_${lesson.mawrid}`,
      mawridTitle: lesson.mawrid,
      ta3alom: lesson.ta3alom,
      activityNumber: actNum,
      title: act.title,
      instructions: act.asila || '',
      questions: (act.asila || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      answersAndConclusions: act.ajwiba || '',
      duration: act.zaman || '30 د',
      workMode: act.mola7adha || 'عمل أفواج',
      sourcePage: actSourcePage,
      experimentIds: expIds,
      mediaIds,
      tableIds,
      evaluationIds: [`eval_${lessonId}`],
      worksheetIds,
      trace: buildLessonTrace(lesson, actSourcePage, actNum),
    };
  });
});

export const ARCHIVE_1AM_DB: CurriculumArchiveDatabase = {
  level: '1am',
  sourceTitle: ARCHIVE_1AM_SOURCE_META.sourceTitle,
  sourceFile: ARCHIVE_1AM_SOURCE_META.sourceFile,
  sourcePdfUrl: ARCHIVE_1AM_SOURCE_META.sourcePdfUrl,
  totalPages: ARCHIVE_1AM_SOURCE_META.totalPages,
  author: ARCHIVE_1AM_SOURCE_META.author,
  school: ARCHIVE_1AM_SOURCE_META.school,
  location: ARCHIVE_1AM_SOURCE_META.location,
  lessons: ARCHIVE_1AM_LESSONS,
  activities: ARCHIVE_1AM_ACTIVITIES,
  experiments: ARCHIVE_1AM_EXPERIMENTS,
  media: ARCHIVE_1AM_MEDIA,
  tables: ARCHIVE_1AM_TABLES,
  evaluations: ARCHIVE_1AM_EVALUATIONS,
  worksheets: ARCHIVE_1AM_WORKSHEETS,
  pages: ARCHIVE_1AM_PAGES,
};

export {
  ARCHIVE_1AM_EXPERIMENTS,
  ARCHIVE_1AM_MEDIA,
  ARCHIVE_1AM_EXTRA_TABLES,
  ARCHIVE_1AM_WORKSHEETS,
  ARCHIVE_1AM_PAGES,
};

// ─── تطبيع النص العربي للبحث الذكي ───────────────────────────────────────────
export const normalizeArabicSearchText = (text: string): string =>
  (text || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();

const matchesTokens = (haystack: string, tokens: string[]): boolean => {
  if (tokens.length === 0) return true;
  const norm = normalizeArabicSearchText(haystack);
  return tokens.every((tok) => norm.includes(tok));
};

/** البحث الذكي المجمّع في جميع فئات أرشيف السنة الأولى متوسط */
export const search1AMArchive = (query: string): ArchiveSearchResultGroup => {
  const normQuery = normalizeArabicSearchText(query);
  const tokens = normQuery.split(' ').filter(Boolean);

  if (tokens.length === 0) {
    return {
      lessons: ARCHIVE_1AM_LESSONS,
      activities: ARCHIVE_1AM_ACTIVITIES,
      experiments: ARCHIVE_1AM_EXPERIMENTS,
      media: ARCHIVE_1AM_MEDIA,
      tables: ARCHIVE_1AM_TABLES,
      evaluations: ARCHIVE_1AM_EVALUATIONS,
      worksheets: ARCHIVE_1AM_WORKSHEETS,
    };
  }

  return {
    lessons: ARCHIVE_1AM_LESSONS.filter((l) =>
      matchesTokens(
        [
          l.memoNumber || '',
          l.maqta,
          l.mawrid,
          l.ta3alom,
          l.wadiya || '',
          l.moshkila || '',
          l.faradiyat || '',
          l.irsae || '',
          l.taqwim || '',
          l.marifa || '',
          l.manhaji || '',
          l.mostalahat || '',
          l.wasail || '',
          l.kafaaKhitamiya || '',
          l.anshita
            .map((a) => `${a.title} ${a.asila || ''} ${a.ajwiba || ''}`)
            .join(' '),
        ].join(' '),
        tokens
      )
    ),
    activities: ARCHIVE_1AM_ACTIVITIES.filter((a) =>
      matchesTokens(
        [
          a.memoNumber,
          a.maqtaTitle,
          a.mawridTitle,
          a.ta3alom,
          a.title,
          a.instructions,
          a.answersAndConclusions,
        ].join(' '),
        tokens
      )
    ),
    experiments: ARCHIVE_1AM_EXPERIMENTS.filter((e) =>
      matchesTokens(
        [
          e.memoNumber,
          e.title,
          e.goal,
          e.tools.join(' '),
          e.materials.join(' '),
          e.steps.join(' '),
          e.observation,
          e.conclusion,
          e.trace.ta3alomTitle,
        ].join(' '),
        tokens
      )
    ),
    media: ARCHIVE_1AM_MEDIA.filter((m) =>
      matchesTokens(
        [
          m.memoNumber || '',
          m.title,
          m.mediaType,
          m.description,
          m.tags.join(' '),
          `ص ${m.sourcePage}`,
        ].join(' '),
        tokens
      )
    ),
    tables: ARCHIVE_1AM_TABLES.filter((t) =>
      matchesTokens(
        [
          t.memoNumber || '',
          t.title,
          t.table.table_title || '',
          t.table.headers.join(' '),
          t.table.rows.flat().join(' '),
        ].join(' '),
        tokens
      )
    ),
    evaluations: ARCHIVE_1AM_EVALUATIONS.filter((ev) =>
      matchesTokens(
        [
          ev.memoNumber,
          ev.title,
          ev.prompt,
          ev.modelAnswer,
          ev.trace.maqtaTitle,
          ev.trace.ta3alomTitle,
        ].join(' '),
        tokens
      )
    ),
    worksheets: ARCHIVE_1AM_WORKSHEETS.filter((w) =>
      matchesTokens(
        [w.memoNumber || '', w.title, w.category, w.content, w.instructions.join(' ')].join(' '),
        tokens
      )
    ),
  };
};

// ─── دوال الاستدعاء المترابط للمذكرات والدفتر اليومي ────────────────────────
export const getMediaForLesson = (lessonId: string): ArchivedMediaItem[] =>
  ARCHIVE_1AM_MEDIA.filter((m) => m.relatedLessonId === lessonId);

export const getExperimentsForLesson = (lessonId: string): ArchivedExperiment[] =>
  ARCHIVE_1AM_EXPERIMENTS.filter((e) => e.relatedLessonId === lessonId);

export const getWorksheetsForLesson = (lessonId: string): ArchivedWorksheet[] =>
  ARCHIVE_1AM_WORKSHEETS.filter((w) => w.relatedLessonId === lessonId);

export const getTablesForLesson = (lessonId: string): ArchivedTableRecord[] =>
  ARCHIVE_1AM_TABLES.filter((t) => t.relatedLessonId === lessonId);

/** استدعاء حزمة النشاط الكاملة (المذكرة + النشاط + التجارب + الصور + الجداول + التقويم + أوراق العمل) */
export const recallActivityBundle = (activityOrLessonId: string): ActivityRecallBundle | null => {
  let activity = ARCHIVE_1AM_ACTIVITIES.find((a) => a.id === activityOrLessonId);
  let lesson = activity
    ? ARCHIVE_1AM_LESSONS.find((l) => getLessonKey(l) === activity!.lessonId)
    : ARCHIVE_1AM_LESSONS.find((l) => getLessonKey(l) === activityOrLessonId);

  if (!lesson && activityOrLessonId) {
    lesson = ARCHIVE_1AM_LESSONS.find((l) => l.memoNumber === activityOrLessonId);
  }
  if (!lesson) return null;

  const lessonId = getLessonKey(lesson);
  if (!activity) {
    activity = ARCHIVE_1AM_ACTIVITIES.find((a) => a.lessonId === lessonId);
  }
  if (!activity) return null;

  const experiments = ARCHIVE_1AM_EXPERIMENTS.filter(
    (e) => e.relatedActivityId === activity!.id || e.relatedLessonId === lessonId
  );
  const directMedia = ARCHIVE_1AM_MEDIA.filter((m) => m.relatedActivityId === activity!.id);
  const media =
    directMedia.length > 0
      ? directMedia
      : ARCHIVE_1AM_MEDIA.filter((m) => m.relatedLessonId === lessonId);

  const tables = ARCHIVE_1AM_TABLES.filter(
    (t) => t.relatedActivityId === activity!.id || t.relatedLessonId === lessonId
  );
  const evaluations = ARCHIVE_1AM_EVALUATIONS.filter((ev) => ev.relatedLessonId === lessonId);
  const worksheets = ARCHIVE_1AM_WORKSHEETS.filter((w) => w.relatedLessonId === lessonId);

  return {
    lesson,
    activity,
    experiments,
    media,
    tables,
    evaluations,
    worksheets,
  };
};
