import React, { useState, useMemo, useEffect } from 'react';
import { generateLogbookDocx, generateTimetableDocx } from "../utils/docxExportLogbook";
import { generatePreviewMatchPdf } from "../utils/pdfExportLogbook";
import { safeHtml2Canvas } from "../utils/html2canvasSanitizer";
import {
  BookOpen,
  Calendar,
  AlertCircle,
  Clock,
  Eraser,
  Eye,
  FileStack,
  FileText,
  Grid3x3,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Table as TableIcon,
  X,
  ZoomIn,
  ZoomOut,
  Printer,
  CheckCircle2,
  Filter,
  GraduationCap,
  Layers,
  ListFilter,
  Check,
  ChevronDown,
  Info,
  Save,
  Download,
} from 'lucide-react';
import { LessonMemo, MemoConfig, Activity } from '../types';
import { TeacherOfficialStamp } from './TeacherOfficialStamp';
import { generateLogbookEntries, isLogbookRowOnOrAfter } from '../utils/dailyLogbookGenerator';
import { collectPreservedRows, preservedRowsInPeriod } from '../utils/logbookPreservation';
import { DailyLogSheetTemplate, ScienceHeaderLeft, ScienceHeaderRight, CornerLeaves } from './DailyLogSheetTemplate';
import { DAILY_LOGBOOK_PROGRAM_1AM } from '../data/dailyLogbookProgram1am';
import { DAILY_LOGBOOK_PROGRAM_2AM } from '../data/dailyLogbookProgram2am';
import { DAILY_LOGBOOK_PROGRAM_3AM } from '../data/dailyLogbookProgram3am';
import { DAILY_LOGBOOK_PROGRAM_4AM } from '../data/dailyLogbookProgram4am';

interface DailyLogbookProps {
  selectedLevel?: '1am' | '2am' | '3am' | '4am';
  setSelectedLevel?: (lvl: '1am' | '2am' | '3am' | '4am') => void;
  config: MemoConfig;
  setConfig?: React.Dispatch<React.SetStateAction<MemoConfig>>;
  showToast: (msg: string) => void;
  curriculumLessons?: LessonMemo[];
}

export interface CurriculumResourceItem {
  level: string;
  memoNumber?: string;
  midan?: string;
  maqta?: string;
  mawrid?: string;
  ta3alom?: string;
  activities?: string[];
  [key: string]: any;
}



const LEVEL_NAMES_MAP: Record<string, string> = {
  '1م': 'السنة الأولى متوسط (1AM)',
  '2م': 'السنة الثانية متوسط (2AM)',
  '3م': 'السنة الثالثة متوسط (3AM)',
  '4م': 'السنة الرابعة متوسط (4AM - BEM)',
};

const WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

const JS_DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

const MORNING_PERIODS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'];
const AFTERNOON_PERIODS = ['13:30 - 14:30', '14:30 - 15:30', '15:30 - 16:30', '16:30 - 17:30'];
const ALL_PERIODS = [...MORNING_PERIODS, ...AFTERNOON_PERIODS];

const TIME_RANK: Record<string, number> = {};
ALL_PERIODS.forEach((t, i) => {
  TIME_RANK[t] = i;
});

function isMorningTime(timeStr: string): boolean {
  return MORNING_PERIODS.includes(timeStr);
}

function isAfternoonTime(timeStr: string): boolean {
  return AFTERNOON_PERIODS.includes(timeStr);
}

function isValidSchoolPeriod(timeStr: string): boolean {
  return ALL_PERIODS.includes(timeStr);
}

function getTimeRank(timeStr: string): number {
  return TIME_RANK[timeStr] ?? 999;
}

function createEmptyDayCells(): Record<string, string> {
  return {
    الأحد: '',
    الإثنين: '',
    الثلاثاء: '',
    الأربعاء: '',
    الخميس: '',
  };
}

export interface TimetableGridRow {
  id: string;
  time: string;
  cells: Record<string, string>;
}

export type CalendarEventType = 'holiday' | 'exam' | 'test' | 'official_exam';

export interface HolidayEntry {
  id?: string;
  startDate: string;
  endDate?: string;
  label: string;
  type?: CalendarEventType;
}

export interface LogEntry {
  id: string;
  dayName: string;
  dateStr: string;
  time: string;
  section: string;
  level: string;
  content: string;
  midan?: string;
  maqta?: string;
  mawrid?: string;
  ta3alom?: string;
  activitiesList?: string[];
  note: string;
  resourceIndex?: number;
  attendance?: string;
  wasail?: string;
  lessonType?: 'curriculum' | 'introductory' | 'opening' | 'health' | 'remediation' | 'assessment' | 'holiday';
  taqwim?: string;
  moshkila?: string;
  manualContent?: string;
  manualEdited?: boolean;
  sourceSequenceId?: string;
  sourceResourceId?: string;
  sourceLearningUnitId?: string;
  sourceActivityId?: string;
  sourceActivityId2?: string;
}

const EMPTY_TIMETABLE_ROWS: TimetableGridRow[] = Array.from({ length: 8 }, (_, i) => ({
  id: `r${i + 1}`,
  time: ALL_PERIODS[i],
  cells: createEmptyDayCells(),
}));

// Default rows used by the automatic timetable-fill action (15-hour standard Algerian middle school science schedule: 5 classes × 3h = 15h)
export const AUTO_FILLED_TIMETABLE_ROWS: TimetableGridRow[] = [
  { id: 'r1', time: '08:00 - 09:00', cells: { الأحد: '1م1', الإثنين: '1م1 ف1', الثلاثاء: '1م2 ف1', الأربعاء: '1م3 ف1', الخميس: '1م4 ف1' } },
  { id: 'r2', time: '09:00 - 10:00', cells: { الأحد: '1م2', الإثنين: '1م1 ف2', الثلاثاء: '1م2 ف2', الأربعاء: '1م3 ف2', الخميس: '1م4 ف2' } },
  { id: 'r3', time: '10:00 - 11:00', cells: { الأحد: '1م5 ف1', الإثنين: '1م3', الثلاثاء: '1م4', الأربعاء: '1م5', الخميس: '' } },
  { id: 'r4', time: '11:00 - 12:00', cells: { الأحد: '1م5 ف2', الإثنين: '', الثلاثاء: '', الأربعاء: '', الخميس: '' } },
  { id: 'r5', time: '13:30 - 14:30', cells: createEmptyDayCells() },
  { id: 'r6', time: '14:30 - 15:30', cells: createEmptyDayCells() },
  { id: 'r7', time: '15:30 - 16:30', cells: createEmptyDayCells() },
  { id: 'r8', time: '16:30 - 17:30', cells: createEmptyDayCells() },
];

const LOGBOOK_DATA_VERSION = '2026-10-24-sheet-template-v19';
const ROWS_PER_PAGE = 10;
const getPageDimensions = (orientation: 'portrait' | 'landscape') => orientation === 'landscape' ? { w: 297, h: 210 } : { w: 210, h: 297 };
const PRINT_MARGIN = '14mm';
const PAGE_INNER_PADDING = '12px';
const NOTEBOOK_CONTENT_MIN_HEIGHT = '58px';

function getSchoolWeekKey(dateStr: string): string {
  const clean = (dateStr || '').split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - d.getDay());
  return formatDateToIsoString(d);
}

function getSchoolWeekNumber(dateStr: string, startDate: string): number {
  const cleanStart = (startDate || '').split(' ')[0];
  const cleanDate = (dateStr || '').split(' ')[0];
  const start = new Date(cleanStart + 'T12:00:00');
  const current = new Date(cleanDate + 'T12:00:00');
  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return 1;
  start.setDate(start.getDate() - start.getDay());
  const diff = Math.floor((current.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.floor(diff / 7) + 1);
}

function getTotalLogbookPages(rowCount: number): number {
  return Math.max(1, Math.ceil(rowCount / ROWS_PER_PAGE));
}

export function detectLevelFromSection(sec: string): '1م' | '2م' | '3م' | '4م' | null {
  if (!sec) return null;
  const s = sec.trim();
  if (s.includes('4م') || s.includes('4 م') || s.startsWith('4')) return '4م';
  if (s.includes('3م') || s.includes('3 م') || s.startsWith('3')) return '3م';
  if (s.includes('2م') || s.includes('2 م') || s.startsWith('2')) return '2م';
  if (s.includes('1م') || s.includes('1 م') || s.startsWith('1')) return '1م';
  return null;
}

/**
 * استخراج بيانات الفوج والقسم الأساسي:
 * يتعامل مع مختلف صياغات الأساتذة: (ف1)، (فوج 1)، ف1، فوج 1، grp 1، إلخ.
 */
export function extractGroupInfo(sec: string): { baseSection: string; groupNum?: string; rawGroup?: string; isGroup?: boolean } {
  const clean = (sec || '').trim();
  if (!clean) return { baseSection: 'قسم غير محدد' };
  const match = clean.match(/(?:[-—/–\s]*\(?(?:فوج|فـ|ف|grp|group|g)\s*([1234])\)?\s*)/i);
  if (match) {
    const base = clean.replace(match[0], '').replace(/\(\s*\)/g, '').trim();
    return {
      baseSection: base || clean,
      groupNum: match[1],
      rawGroup: `ف${match[1]}`,
      isGroup: true,
    };
  }
  const isGenericGroup = /\b(?:فوج|فـ|ف)\b/i.test(clean);
  return {
    baseSection: clean,
    isGroup: isGenericGroup,
  };
}

export function getBaseSection(sec: string): string {
  return extractGroupInfo(sec).baseSection;
}

function formatDateToIsoString(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** تاريخ افتراضي محلي للدفتر؛ لا يقرأ إعدادات التدرج السنوي ولا يكتب إليها. */
function getDefaultNotebookStartDate(schoolYear: string): string {
  const match = String(schoolYear || '').match(/(20\d{2})/);
  const year = match ? Number(match[1]) : new Date().getFullYear();
  if (year === 2024) return '2024-09-22';
  if (year === 2025) return '2025-09-21';
  if (year === 2026) return '2026-09-21';
  const date = new Date(year, 8, 20, 12, 0, 0);
  while (date.getDay() !== 0) date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const LOGBOOK_ARABIC_MONTHS = ['جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function formatLogbookDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    return dateStr
      .split('/')
      .map((part) => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
        if (!match) return trimmed;
        const monthIndex = Number(match[2]) - 1;
        const monthName =
          monthIndex >= 0 && monthIndex < 12 ? LOGBOOK_ARABIC_MONTHS[monthIndex] : match[2];
        return `${match[3]} ${monthName} ${match[1]}${match[4] || ''}`;
      })
      .join(' / ');
  }
  const match = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  if (!match) return dateStr || '';
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${match[3]} ${LOGBOOK_ARABIC_MONTHS[monthIndex]} ${match[1]}${match[4] || ''}`;
}

/**
 * دمج الحصص التابعة لنفس القسم (مثل: فوج 1 وفوج 2 لنفس القسم) في خانة واحدة
 * يدمج التوقيت معاً والتاريخ معاً والقسم والمحتوى في حصة واحدة
 */
export function mergeConsecutiveGroupEntries(entries: LogEntry[]): LogEntry[] {
  const result: LogEntry[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < entries.length; i++) {
    if (visited.has(i)) continue;
    const a = entries[i];
    visited.add(i);

    const baseA = getBaseSection(a.section);
    const infoA = extractGroupInfo(a.section);

    // إذا كانت الحصة فوجاً، نبحث عن حصة الفوج الشريك لنفس القسم في نفس الأسبوع
    let partnerIdx = -1;
    if (infoA.isGroup || a.section.includes('ف')) {
      for (let j = i + 1; j < entries.length; j++) {
        if (visited.has(j)) continue;
        const b = entries[j];
        const infoB = extractGroupInfo(b.section);
        if (
          (infoB.isGroup || b.section.includes('ف')) &&
          b.level === a.level &&
          getBaseSection(b.section) === baseA &&
          getSchoolWeekKey(b.dateStr) === getSchoolWeekKey(a.dateStr)
        ) {
          partnerIdx = j;
          break;
        }
      }
    }

    if (partnerIdx !== -1) {
      const b = entries[partnerIdx];
      visited.add(partnerIdx);
      const infoB = extractGroupInfo(b.section);

      const grpA = infoA.groupNum || '1';
      const grpB = infoB.groupNum || '2';

      const sameDay = a.dateStr === b.dateStr;
      const combinedDay = sameDay ? (a.dayName || 'الأحد') : `${a.dayName || ''} / ${b.dayName || ''}`;
      const combinedDate = sameDay
        ? a.dateStr
        : `${a.dateStr} (ف${grpA}) / ${b.dateStr} (ف${grpB})`;

      let combinedTime = a.time;
      if (a.time !== b.time || !sameDay) {
        const timeA = a.time.includes('ف') ? a.time : `${a.time} (ف${grpA})`;
        const timeB = b.time.includes('ف') ? b.time : `${b.time} (ف${grpB})`;
        combinedTime = `${timeA} / ${timeB}`;
      } else {
        combinedTime = `${a.time} (ف${grpA} + ف${grpB})`;
      }

      const combinedSection = `${baseA} (فوج 1 + فوج 2)`;
      const combinedNote = `عمل مخبري (أفواج 1 + 2)`;

      result.push({
        ...a,
        dayName: combinedDay,
        dateStr: combinedDate,
        time: combinedTime,
        section: combinedSection,
        note: combinedNote,
      });
    } else {
      result.push(a);
    }
  }

  return result;
}

/**
 * عرض هرمي لمحتوى الدفتر اليومي:
 * - الميدان يكتب ولا يتكرر إلا إذا وجد ميدان جديد.
 * - نفس الشيء للمقطع، المورد، وتعلم المورد.
 * - أسبوع التعارف والصحة المدرسية والمعالجة البيداغوجية ليس لهما ميدان ولا مقطع.
 */
function buildHierarchicalContent(
  row: LogEntry,
  previous?: LogEntry
): string {
  if (row.manualContent?.trim()) return row.manualContent.trim();
  if (row.lessonType && row.lessonType !== 'curriculum') {
    return row.content || '';
  }

  const clean = (value?: string) => String(value || '').trim();
  const unique = (values: string[] = []) =>
    Array.from(new Set(values.map(clean).filter(Boolean)));

  const activities = unique(row.activitiesList);
  const parts: string[] = [];
  const seen = new Set<string>();

  const addLine = (label: string, value?: string) => {
    const cleanValue = clean(value);
    if (!cleanValue) return;
    const line = `<u>${label}:</u> ${cleanValue}`;
    if (seen.has(line)) return;
    seen.add(line);
    parts.push(line);
  };

  const currentMidan = clean(row.midan);
  const prevMidan = clean(previous?.midan);
  const currentMaqta = clean(row.maqta);
  const prevMaqta = clean(previous?.maqta);
  const currentMawrid = clean(row.mawrid);
  const prevMawrid = clean(previous?.mawrid);
  const currentTa3alom = clean(row.ta3alom);
  const prevTa3alom = clean(previous?.ta3alom);

  // 1. الميدان: يكتب فقط عند أول ظهور له، ولا يتكرر إلا إذا وجد ميدان جديد
  const isNewMidan = !!currentMidan && (!previous || !prevMidan || prevMidan !== currentMidan);

  // 2. المقطع: يكتب عند أول ظهور له، ولا يتكرر إلا إذا وجد مقطع جديد أو ميدان جديد
  const isNewMaqta = !!currentMaqta && (isNewMidan || !previous || !prevMaqta || prevMaqta !== currentMaqta);

  // 3. المورد التعلمي + 4. تعلم المورد:
  // حسب قاعدة الدفتر الجديدة، هذان العنصران يُكتبان دائماً مع الأنشطة
  // لأنهما يحددان المورد الذي تُستخرج منه الأنشطة في المذكرة.
  const isNewMawrid = !!currentMawrid && (isNewMaqta || !previous || !prevMawrid || prevMawrid !== currentMawrid);
  const isNewTa3alom = !!currentTa3alom && (isNewMawrid || !previous || !prevTa3alom || prevTa3alom !== currentTa3alom);

  if (isNewMidan) addLine('الميدان', currentMidan);
  if (isNewMaqta) addLine('المقطع', currentMaqta);

  // المورد التعلمي وتعلم المورد لا يُخفَيان بسبب التكرار؛ يُعرضان في كل حصة منهجية.
  if (currentMawrid) addLine('المورد التعلمي', currentMawrid);
  if (currentTa3alom) addLine('تعلم المورد', currentTa3alom);
  if (isNewTa3alom && row.moshkila) {
    addLine('المشكلة المطروحة', row.moshkila);
  }

  // 5. الأنشطة والتعلمات المنجزة
  if (activities.length) {
    addLine('الأنشطة', activities.join(' + '));
  } else if (row.content) {
    addLine('النشاط المنجز', row.content);
  }

  // 6. التقويم (إن وجد لهذه الحصة)
  const taqwim = clean(row.taqwim);
  if (taqwim) {
    addLine('التقويم', taqwim);
  }

  return parts.join('\n');
}

/**
 * البحث عن آخر حصة لنفس القسم ونفس المستوى بغض النظر عن حدود الأسابيع
 * حتى لا يتكرر الميدان والمقطع والمورد عند الانتقال من أسبوع لآخر
 */
const findPreviousComparableCurriculumRow = (allRows: LogEntry[], currentIndex: number, row: LogEntry): LogEntry | undefined => {
  const baseSection = getBaseSection(row.section);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const candidate = allRows[i];
    if (
      candidate.level === row.level &&
      getBaseSection(candidate.section) === baseSection &&
      (!candidate.lessonType || candidate.lessonType === 'curriculum')
    ) {
      return candidate;
    }
  }
  return undefined;
};

const normalizeDailyLogbookRows = (
  savedRows: LogEntry[],
  _db?: any
): LogEntry[] => {
  return mergeConsecutiveGroupEntries(savedRows);
};

/** Keep teacher-entered or manually changed rows when regenerating the automatic sequence, strictly on or after startDate. */
const mergeGeneratedWithPreservedRows = (
  generatedRows: LogEntry[],
  savedRows: unknown,
  startDate?: string
): LogEntry[] => {
  if (!Array.isArray(savedRows)) return generatedRows;

  const rowKey = (row: LogEntry) =>
    `${row.dateStr || ''}|${row.time || ''}|${(row.section || '').trim()}`;
  const merged = new Map<string, LogEntry>(generatedRows.map((row) => [rowKey(row), row]));

  const preservedRows = (savedRows as LogEntry[]).filter((row) => {
    if (!row) return false;
    if (startDate && !isLogbookRowOnOrAfter(row.dateStr || '', startDate)) return false;
    return Boolean(
      String(row.id || '').startsWith('manual-') ||
      !row.sourceLearningUnitId ||
      row.manualContent ||
      row.manualEdited ||
      row.attendance
    );
  });

  preservedRows.forEach((row) => {
    // A manual absence/change overrides the generated lesson at the same date, time and class.
    merged.set(rowKey(row), row);
  });

  return Array.from(merged.values())
    .filter((row) => {
      return !startDate || isLogbookRowOnOrAfter(row.dateStr || '', startDate);
    })
    .sort((a, b) => {
      const dateA = (a.dateStr || '').split(' ')[0] || (a.dateStr || '');
      const dateB = (b.dateStr || '').split(' ')[0] || (b.dateStr || '');
      return (
        dateA.localeCompare(dateB) ||
        (a.time || '').localeCompare(b.time || '') ||
        (a.section || '').localeCompare(b.section || '')
      );
    });
};

interface DailyLogbookAudit {
  duplicateRows: string[];
  missingHierarchy: string[];
  missingSource: string[];
  sourceMismatches: string[];
  duplicateActivities: string[];
}

const auditGeneratedDailyLogbook = (
  generatedRows: LogEntry[],
  db: Record<'1م' | '2م' | '3م' | '4م', CurriculumResourceItem[]>
): DailyLogbookAudit => {
  const duplicateRows: string[] = [];
  const missingHierarchy: string[] = [];
  const missingSource: string[] = [];
  const sourceMismatches: string[] = [];
  const duplicateActivities: string[] = [];
  const seenRows = new Set<string>();

  for (const row of generatedRows) {
    const rowKey = row.dateStr + '|' + row.time + '|' + row.section;
    if (seenRows.has(rowKey)) duplicateRows.push(rowKey);
    seenRows.add(rowKey);

    // إذا كانت الحصة غير منهجية (تعارف، صحة مدرسية، معالجة بيداغوجية، تقويم تشخيصي، عطلة)
    const isSpecialLesson =
      (row.lessonType && row.lessonType !== 'curriculum') ||
      !row.midan ||
      !row.maqta ||
      /تعارف|صحة|استقبال|معالجة|تشخيصي/.test(row.mawrid || '') ||
      /تعارف|صحة|استقبال|معالجة|تشخيصي/.test(row.content || '');

    if (isSpecialLesson) continue;

    if (!row.midan || !row.maqta || !row.mawrid || !row.ta3alom) {
      missingHierarchy.push(row.dateStr + ' ' + row.time + ' ' + row.section);
    }

    const activityTitles = Array.from(
      new Set((row.activitiesList || []).map((x) => String(x || '').trim()).filter(Boolean))
    ).slice(0, 2);
    if (activityTitles.length !== (row.activitiesList || []).filter(Boolean).slice(0, 2).length) {
      duplicateActivities.push(row.dateStr + ' ' + row.time + ' ' + row.section);
    }
    if (row.sourceActivityId && row.sourceActivityId2 && row.sourceActivityId === row.sourceActivityId2) {
      sourceMismatches.push(row.dateStr + ' ' + row.time + ' ' + row.section + ': معرف النشاط الأول والثاني متطابقان.');
    }

    const bank = db[row.level as '1م' | '2م' | '3م' | '4م'] || [];
    const resource =
      (row.sourceLearningUnitId
        ? bank.find((r) => r.sourceLearningUnitId === row.sourceLearningUnitId)
        : undefined) ||
      (row.sourceActivityId
        ? bank.find((r) => r.sourceActivityIds?.includes(row.sourceActivityId))
        : undefined) ||
      (row.sourceActivityId2
        ? bank.find((r) => r.sourceActivityIds?.includes(row.sourceActivityId2))
        : undefined) ||
      bank.find((r) =>
        r.midan === row.midan &&
        r.maqta === row.maqta &&
        r.mawrid === row.mawrid &&
        r.ta3alom === row.ta3alom
      ) ||
      (() => {
        const matches = bank.filter((r) =>
          (row.activitiesList || []).some((title) => r.activities.includes(title))
        );
        return matches.length === 1 ? matches[0] : undefined;
      })();

    if (!resource) {
      missingSource.push(row.dateStr + ' ' + row.time + ' ' + row.section);
      continue;
    }

    const hierarchyMatches =
      row.midan === resource.midan &&
      row.maqta === resource.maqta &&
      row.mawrid === resource.mawrid &&
      row.ta3alom === resource.ta3alom;

    if (!hierarchyMatches) {
      sourceMismatches.push(
        row.dateStr + ' ' + row.time + ' ' + row.section + ': بيانات الميدان/المقطع/المورد/تعلم المورد لا تطابق المصدر.'
      );
    }

    for (const title of activityTitles) {
      if (!resource.activities.includes(title)) {
        sourceMismatches.push(
          row.dateStr + ' ' + row.time + ' ' + row.section + ': نشاط غير موجود داخل تعلم المورد المرتبط.'
        );
      }
    }
  }

  return { duplicateRows, missingHierarchy, missingSource, sourceMismatches, duplicateActivities };
};


export function buildCurriculumDatabase(
  _curriculumLessons?: LessonMemo[]
): Record<'1م' | '2م' | '3م' | '4م', CurriculumResourceItem[]> {
  // تم إلغاء ربط الدفتر اليومي بالمذكرات: يعتمد الدفتر اليومي حصراً على المنهاج والتدرج السنوي الوزاري الرسمي
  return {
    '1م': DAILY_LOGBOOK_PROGRAM_1AM.map((p) => ({
      ...p,
      level: '1م',
    })),
    '2م': DAILY_LOGBOOK_PROGRAM_2AM.map((p) => ({
      ...p,
      level: '2م',
    })),
    '3م': DAILY_LOGBOOK_PROGRAM_3AM.map((p) => ({
      ...p,
      level: '3م',
    })),
    '4م': DAILY_LOGBOOK_PROGRAM_4AM.map((p) => ({
      ...p,
      level: '4م',
    })),
  };
}

export const DailyLogbook: React.FC<DailyLogbookProps> = ({
  selectedLevel,
  setSelectedLevel: _setSelectedLevel,
  config,
  setConfig,
  showToast,
}) => {
  // State for Header Info (synced with config initially)
  // يعتمد الدفتر على ملفات برنامجه الداخلية فقط، ويتجاهل المذكرات القادمة من بقية المنصة.
  const CURRICULUM_DATABASE = useMemo(() => buildCurriculumDatabase(), []);

  const [wilaya, setWilaya] = useState<string>(config.directorate || '');
  const [school, setSchool] = useState<string>(config.schoolName || '');
  const [teacher, setTeacher] = useState<string>(config.teacherName || '');
  const [subject, setSubject] = useState<string>('علوم الطبيعة والحياة');
  const [showSubjectInHeader, setShowSubjectInHeader] = useState<boolean>(true);
  const [showYearInHeader, setShowYearInHeader] = useState<boolean>(false);

  // Timetable grid rows with persistent loading
  const [gridRows, setGridRows] = useState<TimetableGridRow[]>(() => {
    try {
      const savedGrid = localStorage.getItem('algeria_sciences_timetable_grid');
      if (savedGrid) {
        const parsed = JSON.parse(savedGrid);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const item = localStorage.getItem('daftar_table_v2027');
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed.gridRows && Array.isArray(parsed.gridRows) && parsed.gridRows.length > 0) {
          return parsed.gridRows;
        }
      }
    } catch {}
    return AUTO_FILLED_TIMETABLE_ROWS;
  });

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState<boolean>(false);

  // Holidays with date ranges (من تاريخ إلى تاريخ)
  const [holidays, setHolidays] = useState<HolidayEntry[]>([]);
  const [newHolidayStartDate, setNewHolidayStartDate] = useState<string>('');
  const [newHolidayEndDate, setNewHolidayEndDate] = useState<string>('');
  const [newHolidayLabel, setNewHolidayLabel] = useState<string>('');
  const [newHolidayType, setNewHolidayType] = useState<CalendarEventType>('holiday');

  // Generation controls
  const [period, setPeriod] = useState<string>('شهر');
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [sessionsPerActivity, setSessionsPerActivity] = useState<number>(() => {
    try {
      const item = localStorage.getItem('daftar_table_v2027');
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed.sessionsPerActivity) return Number(parsed.sessionsPerActivity) || 1;
      }
    } catch {}
    return 1;
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const pageDimensions = getPageDimensions(orientation);
  const [startDate, setStartDate] = useState<string>(() => {
    try {
      const item = localStorage.getItem('daftar_table_v2027');
      if (item) {
        const parsed = JSON.parse(item);
        if (typeof parsed.startDate === 'string') return parsed.startDate;
      }
    } catch {}
    return getDefaultNotebookStartDate(config.schoolYear || '2026-2027') || formatDateToIsoString(new Date());
  });

  // The projected curriculum timeline starts at school entry, independently of
  // the period the teacher chooses to display.
  const [sequenceStartDate, setSequenceStartDate] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('daftar_table_v2027') || '{}');
      if (saved.sequenceStartDate) return saved.sequenceStartDate;
    } catch {}
    return getDefaultNotebookStartDate(config.schoolYear || '2026-2027');
  });
  const [archivedRows, setArchivedRows] = useState<LogEntry[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('daftar_table_v2027') || '{}');
      return Array.isArray(saved.archivedRows) ? saved.archivedRows : [];
    } catch { return []; }
  });

  // تاريخ البداية مستقل عن التدرج السنوي؛ لا يستمع الدفتر إلى أحداث الرزنامة ولا يكتب إليها. 

  // Generated Daily Log Entries
  const [rows, setRows] = useState<LogEntry[]>(() => {
    try {
      const item = localStorage.getItem('daftar_table_v2027');
      if (item) {
        const parsed = JSON.parse(item);
        if (
          parsed.logbookDataVersion === LOGBOOK_DATA_VERSION &&
          Array.isArray(parsed.rows)
        ) {
          const effectiveStart = typeof parsed.startDate === 'string' ? parsed.startDate : startDate;
          const normalized = normalizeDailyLogbookRows(
            effectiveStart ? parsed.rows.filter((r: LogEntry) => isLogbookRowOnOrAfter(r.dateStr || '', effectiveStart)) : parsed.rows,
            CURRICULUM_DATABASE
          );
          if (effectiveStart) {
            return normalized.filter((r) => {
              return isLogbookRowOnOrAfter(r.dateStr || '', effectiveStart);
            });
          }
          return normalized;
        }
      }
    } catch {}
    return generateLogbookEntries({
      startDate: startDate || getDefaultNotebookStartDate(config.schoolYear || '2026-2027'),
      sequenceStartDate,
      gridRows: AUTO_FILLED_TIMETABLE_ROWS,
      period: 'سنة',
      holidays: [],
      curriculumDb: CURRICULUM_DATABASE,
    });
  });

  const handleUpdateLogbookRow = (rowId: string, updates: Partial<LogEntry>) => {
    setRows(current => current.map(row => row.id === rowId ? { ...row, ...updates, manualEdited: true } : row));
  };

  // Modals & UI States
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [manualLessonDate, setManualLessonDate] = useState(startDate || getDefaultNotebookStartDate(config.schoolYear || '2026-2027'));
  const [manualLessonTime, setManualLessonTime] = useState(ALL_PERIODS[0]);
  const [manualLessonSection, setManualLessonSection] = useState('');
  const [manualLessonStatus, setManualLessonStatus] = useState<'normal' | 'changed' | 'teacher_absent' | 'students_absent' | 'not_completed'>('normal');
  const [manualLessonContent, setManualLessonContent] = useState('');
  const [manualLessonNote, setManualLessonNote] = useState('');

  const handleAddManualLesson = () => {
    if (!manualLessonDate || !manualLessonSection.trim()) {
      showToast('يرجى تحديد تاريخ الحصة والقسم.');
      return;
    }
    if (startDate && manualLessonDate < startDate) {
      showToast('لا يمكن إضافة حصة قبل تاريخ بداية الدفتر.');
      return;
    }
    if ((manualLessonStatus === 'normal' || manualLessonStatus === 'changed') && !manualLessonContent.trim()) {
      showToast('يرجى إدخال محتوى الحصة.');
      return;
    }
    const date = new Date(`${manualLessonDate}T12:00:00`);
    const statusLabels: Record<typeof manualLessonStatus, string> = {
      normal: 'حصة مضافة يدوياً',
      changed: 'تغيير محتوى الحصة',
      teacher_absent: 'غياب الأستاذ — الحصة غير منجزة',
      students_absent: 'غياب التلاميذ',
      not_completed: 'الحصة غير مكتملة — يُستكمل المحتوى لاحقاً',
    };
    const statusContent = manualLessonStatus === 'teacher_absent'
      ? 'غياب الأستاذ — لم تُنجز الحصة'
      : manualLessonStatus === 'students_absent'
        ? 'غياب التلاميذ'
        : manualLessonStatus === 'not_completed'
          ? (manualLessonContent.trim() ? `المحتوى المبرمج: ${manualLessonContent.trim()}\nالحالة: لم يُستكمل ويُرحّل للمتابعة` : 'الحصة غير مكتملة — يُستكمل المحتوى لاحقاً')
          : manualLessonContent.trim();
    const entry: LogEntry = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dayName: JS_DAY_NAMES[date.getDay()] || '',
      dateStr: manualLessonDate,
      time: manualLessonTime,
      section: manualLessonSection.trim(),
      level: detectLevelFromSection(manualLessonSection) || selectedLevel?.replace('am', 'م') || '1م',
      content: statusContent,
      manualContent: statusContent,
      note: [statusLabels[manualLessonStatus], manualLessonNote.trim()].filter(Boolean).join(' — '),
      attendance: manualLessonStatus === 'teacher_absent' ? 'غياب الأستاذ' : manualLessonStatus === 'students_absent' ? 'غياب التلاميذ' : undefined,
      lessonType: manualLessonStatus === 'teacher_absent' || manualLessonStatus === 'students_absent' ? 'health' : undefined,
    };
    setRows((current) => {
      const shouldUpdateExisting = manualLessonStatus !== 'normal';
      const existingIndex = shouldUpdateExisting
        ? current.findIndex((row) => row.dateStr === entry.dateStr && row.time === entry.time && row.section.trim() === entry.section.trim())
        : -1;
      if (existingIndex >= 0) {
        const updated = [...current];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          content: statusContent,
          manualContent: statusContent,
          attendance: entry.attendance,
          note: [statusLabels[manualLessonStatus], manualLessonNote.trim()].filter(Boolean).join(' — '),
        };
        return updated.sort((a, b) => a.dateStr.localeCompare(b.dateStr) || getTimeRank(a.time) - getTimeRank(b.time) || a.time.localeCompare(b.time));
      }
      return [...current, entry].sort((a, b) => a.dateStr.localeCompare(b.dateStr) || getTimeRank(a.time) - getTimeRank(b.time) || a.time.localeCompare(b.time));
    });
    setIsAddLessonModalOpen(false);
    setManualLessonContent('');
    setManualLessonNote('');
    showToast(manualLessonStatus === 'normal'
      ? 'تمت إضافة الحصة إلى الدفتر وحفظها تلقائياً.'
      : 'تم تسجيل التغيير/الغياب. إذا وُجدت حصة مطابقة تم تحديثها بدلاً من تكرارها.');
  };

  const [isElementsModalOpen, setIsElementsModalOpen] = useState<boolean>(false);
  const [modalFilterLevel, setModalFilterLevel] = useState<string>('assigned');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"all" | "single">("all");
  const [previewZoom, setPreviewZoom] = useState<number>(85);
  const [showEmptyWarning, setShowEmptyWarning] = useState<boolean>(false);
  const [userAlert, setUserAlert] = useState<string | null>(null);

  // Quick Lesson Picker for individual rows
  const [activePickerRowId, setActivePickerRowId] = useState<string | null>(null);

  const displayUserAlert = (msg: string) => {
    setUserAlert(msg);
    setTimeout(() => setUserAlert(null), 3500);
  };

  // Load saved state from localStorage
  const loadFromStorage = () => {
    const OLD_KEYS_TO_REMOVE = [
      'daftar_table',
      'daftar_table_v1',
      'daftar_table_v2',
      'mizaniyati_curriculum_db_v2027',
      'mizaniyati_curriculum_db_v2027_1am',
    ];
    for (const oldKey of OLD_KEYS_TO_REMOVE) {
      try { localStorage.removeItem(oldKey); } catch {}
    }

    const keys = ['daftar_table_v2027'];
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (!item) continue;
      try {
        const parsed = JSON.parse(item);
        if (parsed.wilaya) setWilaya(parsed.wilaya);
        if (parsed.school) setSchool(parsed.school);
        if (parsed.teacher) setTeacher(parsed.teacher);
        if (parsed.subject !== undefined) setSubject(parsed.subject);
        if (parsed.showSubjectInHeader !== undefined) setShowSubjectInHeader(parsed.showSubjectInHeader);
        if (parsed.showYearInHeader !== undefined) setShowYearInHeader(parsed.showYearInHeader);
        if (parsed.holidays && Array.isArray(parsed.holidays)) {
          const normalized: HolidayEntry[] = parsed.holidays.map((h: any, idx: number) => ({
            id: h.id || `h-${idx}`,
            startDate: h.startDate || h.date || '',
            endDate: h.endDate || h.startDate || h.date || '',
            label: h.label || 'عطلة',
            type: h.type || 'holiday',
          })).filter((h: HolidayEntry) => !!h.startDate);
          if (normalized.length > 0) setHolidays(normalized);
        }

        if (parsed.sessionsPerActivity) {
          setSessionsPerActivity(Number(parsed.sessionsPerActivity) || 1);
        }

        if (parsed.sequenceStartDate) setSequenceStartDate(parsed.sequenceStartDate);
        if (Array.isArray(parsed.archivedRows)) setArchivedRows(parsed.archivedRows);
        if (typeof parsed.startDate === 'string') {
          setStartDate(parsed.startDate);
        }
        if (parsed.period) setPeriod(parsed.period);
        if (parsed.orientation === 'portrait' || parsed.orientation === 'landscape') setOrientation(parsed.orientation);
        if (parsed.gridRows && Array.isArray(parsed.gridRows)) {
          const valid: TimetableGridRow[] = [];
          const seen = new Set<string>();
          for (const row of parsed.gridRows) {
            if (!row.time || !isValidSchoolPeriod(row.time)) continue;
            if (seen.has(row.time)) continue;
            seen.add(row.time);
            const cleanCells = { ...row.cells };
            delete cleanCells['السبت'];
            valid.push({ ...row, cells: cleanCells });
          }
          if (valid.length > 0) {
            valid.sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time));
            setGridRows(valid);
          }
        }


        let hasValidRows = false;
        if (
          parsed.logbookDataVersion === LOGBOOK_DATA_VERSION &&
          parsed.rows &&
          Array.isArray(parsed.rows)
        ) {
          const effectiveStart = typeof parsed.startDate === 'string' ? parsed.startDate : startDate;
          const normalized = normalizeDailyLogbookRows(
            effectiveStart ? parsed.rows.filter((r: LogEntry) => isLogbookRowOnOrAfter(r.dateStr || '', effectiveStart)) : parsed.rows,
            CURRICULUM_DATABASE
          );
          setRows(effectiveStart ? normalized.filter((r) => {
            return isLogbookRowOnOrAfter(r.dateStr || '', effectiveStart);
          }) : normalized);
          hasValidRows = true;
        }

        // إذا لم تكن هناك صفوف صالحة أو كانت النسخة قديمة أو محتوية على قاعدة بيانات سابقة، نحدث فورياً
        if (!hasValidRows) {
          const effectiveStart = parsed.startDate || startDate || getDefaultNotebookStartDate(config.schoolYear || '2026-2027');
          const isGridValid = parsed.gridRows && Array.isArray(parsed.gridRows) && parsed.gridRows.some((r: any) => Object.values(r.cells).some((c: any) => c && String(c).trim()));
          const effectiveGrid = isGridValid ? parsed.gridRows : AUTO_FILLED_TIMETABLE_ROWS;
          
          if (!isGridValid) {
            setGridRows(AUTO_FILLED_TIMETABLE_ROWS);
          }

          const generatedRows = generateLogbookEntries({
            startDate: effectiveStart,
            sequenceStartDate: parsed.sequenceStartDate || sequenceStartDate,
            gridRows: effectiveGrid,
            period: parsed.period || period || 'سنة',
            holidays: parsed.holidays || holidays,
            curriculumDb: CURRICULUM_DATABASE,
          });
          const fresh = mergeGeneratedWithPreservedRows(generatedRows, parsed.rows, effectiveStart);
          if (fresh.length > 0) {
            setRows(fresh);
            const dataToSave = {
              logbookDataVersion: LOGBOOK_DATA_VERSION,
              wilaya: parsed.wilaya || wilaya,
              school: parsed.school || school,
              teacher: parsed.teacher || teacher,
              subject: parsed.subject ?? subject,
              showSubjectInHeader: parsed.showSubjectInHeader ?? showSubjectInHeader,
              showYearInHeader: parsed.showYearInHeader ?? showYearInHeader,
              gridRows: effectiveGrid,
              holidays: parsed.holidays || holidays,
              rows: fresh,
              archivedRows: parsed.archivedRows || [],
              sequenceStartDate: parsed.sequenceStartDate || sequenceStartDate,
              startDate: effectiveStart,
              period: parsed.period || period || 'سنة',
              orientation: parsed.orientation || orientation,
            };
            try {
              localStorage.setItem('daftar_table_v2027', JSON.stringify(dataToSave));
            } catch {}
          }
        }
      } catch {
        // ignore
      }
    }

    if (!localStorage.getItem('daftar_table_v2027')) {
      const effectiveStart = startDate || getDefaultNotebookStartDate(config.schoolYear || '2026-2027');
      const fresh = generateLogbookEntries({
        startDate: effectiveStart,
        sequenceStartDate,
        gridRows: AUTO_FILLED_TIMETABLE_ROWS,
        period: 'سنة',
        holidays,
        curriculumDb: CURRICULUM_DATABASE,
      });
      if (fresh.length > 0) {
        setRows(fresh);
      }
    }
  };

  useEffect(() => {
    loadFromStorage();
    setStorageLoaded(true);
    const handleSync = (event: Event) => {
      if ((event as CustomEvent).detail?.type === 'logbook') loadFromStorage();
    };
    window.addEventListener('firebase-sync-complete', handleSync);
    return () => window.removeEventListener('firebase-sync-complete', handleSync);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    // Wait until all saved settings have been restored before writing them back.
    if (!storageLoaded) return;
    // Only persist rows that are on or after startDate to prevent orphan rows from prior dates
    const filteredRows = startDate ? rows.filter((r) => {
      return isLogbookRowOnOrAfter(r.dateStr || '', startDate);
    }) : rows;
    const dataToSave = {
      logbookDataVersion: LOGBOOK_DATA_VERSION,
      wilaya,
      school,
      teacher,
      subject,
      showSubjectInHeader,
      showYearInHeader,
      gridRows,
      holidays,
      rows: filteredRows,
      archivedRows,
      sequenceStartDate,
      startDate,
      period,
      sessionsPerActivity,
      orientation,
    };
    localStorage.setItem(
      'daftar_table_v2027',
      JSON.stringify(dataToSave)
    );
    if ((window as any).syncToCloud) {
      (window as any).syncToCloud('logbook', dataToSave);
    }
  }, [wilaya, school, teacher, subject, config.schoolYear, showSubjectInHeader, showYearInHeader, gridRows, holidays, rows, startDate, period, sessionsPerActivity, orientation, storageLoaded, archivedRows, sequenceStartDate]);

  // Keyboard navigation for preview modal
  useEffect(() => {
    if (!isPreviewModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPreviewModalOpen(false);
      if (e.key === '+' || e.key === '=') setPreviewZoom((z) => Math.min(150, z + 10));
      if (e.key === '-' || e.key === '_') setPreviewZoom((z) => Math.max(50, z - 10));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPreviewModalOpen]);

  // اكتشاف المستويات المسندة للأستاذ آلياً من جدول استعمال الزمن
  const assignedLevels = useMemo<'1م' | '2م' | '3م' | '4م'[]>(() => {
    const levelsSet = new Set<string>();
    gridRows.forEach((row) => {
      WEEK_DAYS.forEach((day) => {
        const sec = row.cells[day]?.trim();
        if (sec) {
          const lvl = detectLevelFromSection(sec);
          if (lvl) levelsSet.add(lvl);
        }
      });
    });
    if (levelsSet.size === 0 && config.assignedClasses && config.assignedClasses.length > 0) {
      config.assignedClasses.forEach(sec => {
        const lvl = detectLevelFromSection(sec);
        if (lvl) levelsSet.add(lvl);
      });
    }
    return Array.from(levelsSet).sort() as any;
  }, [gridRows, config.assignedClasses]);

  // الأقسام الفرعية المسندة بالتفصيل
  const assignedSectionsList = useMemo<string[]>(() => {
    const secSet = new Set<string>();
    gridRows.forEach((row) => {
      WEEK_DAYS.forEach((day) => {
        const sec = row.cells[day]?.trim();
        if (sec) secSet.add(sec);
      });
    });
    if (secSet.size > 0) return Array.from(secSet).sort();
    if (config.assignedClasses && config.assignedClasses.length > 0) {
      return [...config.assignedClasses].sort();
    }
    return [];
  }, [gridRows, config.assignedClasses]);

  const levelColors: Record<string, string> = {
    '1م': 'border-emerald-200 bg-emerald-50 text-emerald-800',
    '2م': 'border-blue-200 bg-blue-50 text-blue-800',
    '3م': 'border-amber-200 bg-amber-50 text-amber-800',
    '4م': 'border-rose-200 bg-rose-50 text-rose-800',
  };

  const levelStats = useMemo(() => {
    return assignedLevels.map((level) => {
      const slots = gridRows.reduce((sum, row) =>
        sum + WEEK_DAYS.filter((day) => detectLevelFromSection(row.cells[day] || '') === level).length, 0
      );
      const sections = new Set<string>();
      gridRows.forEach((row) => WEEK_DAYS.forEach((day) => {
        const value = row.cells[day];
        if (value && detectLevelFromSection(value) === level) {
          sections.add(value.trim().replace(/\s*\(?(?:فوج|ف|فـ|g|grp|group)\s*\d+\)?\s*/gi, '').trim());
        }
      }));
      return { level, slots, sections: sections.size };
    });
  }, [assignedLevels, gridRows]);

  // Structured Timetable lookup مع دمج الحصص التي تضم نفس القسم (مثل فوج 1 وفوج 2)
  const timetableSchedule = useMemo(() => {
    const sched: Record<string, { id: string; time: string; section: string; level: '1م' | '2م' | '3م' | '4م' | null }[]> = {
      الأحد: [],
      الإثنين: [],
      الثلاثاء: [],
      الأربعاء: [],
      الخميس: [],
    };

    WEEK_DAYS.forEach((day) => {
      // 1. جمع الحصص لهذا اليوم مرتبة زمنياً
      const rawSessions: Array<{ time: string; section: string; level: '1م' | '2م' | '3م' | '4م' | null; baseSection: string; groupNum?: string; rawGroup?: string }> = [];

      [...gridRows]
        .sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time))
        .forEach((row) => {
          const sec = row.cells[day]?.trim();
          if (!sec) return;
          const level = detectLevelFromSection(sec);
          const { baseSection, groupNum, rawGroup } = extractGroupInfo(sec);
          rawSessions.push({
            time: row.time,
            section: sec,
            level,
            baseSection,
            groupNum,
            rawGroup,
          });
        });

      // 2. دمج الحصص التابعة لنفس القسم (مثل: من 8:00 إلى 9:00 ف1 و 9:00 إلى 10:00 ف2) في خانة واحدة
      const mergedList: Array<{ id: string; time: string; section: string; level: '1م' | '2م' | '3م' | '4م' | null }> = [];
      const visited = new Set<number>();

      for (let i = 0; i < rawSessions.length; i++) {
        if (visited.has(i)) continue;
        const current = rawSessions[i];
        visited.add(i);

        // البحث عن حصة شريكة لنفس القسم في نفس اليوم
        let partnerIndex = -1;
        for (let j = i + 1; j < rawSessions.length; j++) {
          if (visited.has(j)) continue;
          const candidate = rawSessions[j];
          if (candidate.baseSection === current.baseSection && candidate.level === current.level) {
            partnerIndex = j;
            break;
          }
        }

        if (partnerIndex !== -1) {
          const partner = rawSessions[partnerIndex];
          visited.add(partnerIndex);

          const grpA = current.groupNum || (current.rawGroup ? current.rawGroup.replace(/\D/g, '') : '1');
          const grpB = partner.groupNum || (partner.rawGroup ? partner.rawGroup.replace(/\D/g, '') : '2');
          const isGroupSplit = !!current.groupNum || !!partner.groupNum || !!current.rawGroup || !!partner.rawGroup || current.section.includes('ف') || partner.section.includes('ف');

          let mergedTime = '';
          let mergedSection = '';

          if (isGroupSplit) {
            // التوقيت يكتب كما هو: 08:00 - 09:00 (ف1) / 09:00 - 10:00 (ف2)
            mergedTime = `${current.time} (ف${grpA}) / ${partner.time} (ف${grpB})`;
            mergedSection = `${current.baseSection} (فوج 1 + فوج 2)`;
          } else {
            mergedTime = `${current.time} / ${partner.time}`;
            mergedSection = current.baseSection;
          }

          mergedList.push({
            id: `merged-${day}-${i}-${partnerIndex}`,
            time: mergedTime,
            section: mergedSection,
            level: current.level,
          });
        } else {
          mergedList.push({
            id: `single-${day}-${i}`,
            time: current.time,
            section: current.section,
            level: current.level,
          });
        }
      }

      sched[day] = mergedList;
    });

    return sched;
  }, [gridRows]);

  const targetDaysCount = useMemo(() => {
    switch (period) {
      case 'أسبوع':
        return 7;
      case 'أسبوعين':
        return 14;
      case 'شهر':
        return 30;
      case 'فصل':
        return 90;
      case 'سنة':
        return 180;
      default:
        return 30;
    }
  }, [period]);

  // دالة فحص العطل عبر التواريخ (تاريخ البداية والنهاية)
  const isDateInHoliday = (dateStr: string): boolean => {
    return holidays.some((h) => {
      const start = h.startDate;
      const end = h.endDate || h.startDate;
      return dateStr >= start && dateStr <= end;
    });
  };

  const formatPageNumberLabel = (pgIdx: number, total: number) =>
    `صفحة ${pgIdx + 1} من ${total} - 🇩🇿`;



  // دالة مركزية لتوليد وتطبيق وحفظ الدفتر انطلاقاً من التاريخ المختار بالضبط
  const generateAndApplyLogbook = (
    targetStartDate: string,
    targetPeriod: string = period,
    targetSessionsPerActivity: number = sessionsPerActivity,
    targetGrid: TimetableGridRow[] = gridRows
  ): LogEntry[] => {
    if (!targetStartDate) return [];

    const isGridEmpty = targetGrid.every((r) =>
      Object.values(r.cells || {}).every((cell: any) => !cell || !String(cell).trim())
    );
    const effectiveGrid = isGridEmpty ? AUTO_FILLED_TIMETABLE_ROWS : targetGrid;
    if (isGridEmpty) setGridRows(effectiveGrid);

    const fresh = generateLogbookEntries({
      startDate: targetStartDate,
      sequenceStartDate,
      gridRows: effectiveGrid,
      period: targetPeriod || 'سنة',
      holidays,
      curriculumDb: CURRICULUM_DATABASE,
      sessionsPerActivity: targetSessionsPerActivity,
    });

    // Keep teacher-entered changes even when they fall outside the new period.
    const archive = collectPreservedRows(archivedRows, rows);
    setArchivedRows(archive);
    const relevantManualRows = preservedRowsInPeriod(archive, targetStartDate, targetPeriod);
    const combined = mergeGeneratedWithPreservedRows(fresh, relevantManualRows, targetStartDate);
    if (combined.length > 0) {
      setRows(combined);
      try {
        const dataToSave = {
          logbookDataVersion: LOGBOOK_DATA_VERSION,
          wilaya,
          school,
          teacher,
          subject,
          showSubjectInHeader,
          showYearInHeader,
          gridRows: effectiveGrid,
          holidays,
          rows: combined,
          archivedRows: archive,
          sequenceStartDate,
          startDate: targetStartDate,
          period: targetPeriod || 'سنة',
          sessionsPerActivity: targetSessionsPerActivity,
          orientation,
        };
        localStorage.setItem('daftar_table_v2027', JSON.stringify(dataToSave));
      } catch {}
      return combined;
    } else {
      setRows([]);
      return [];
    }
  };

  // توليد الدفتر اليومي من البرنامج المستقل الخاص بكل مستوى، مع احترام المدة المحددة
  const handleGenerateSmartLogbook = () => {
    if (!startDate) {
      displayUserAlert('يرجى تحديد تاريخ بداية الدفتر أولاً.');
      return;
    }
    const effectiveStart = startDate;
    const fresh = generateAndApplyLogbook(effectiveStart, period, sessionsPerActivity);
    if (fresh.length > 0) {
      showToast(`تم توليد الدفتر انطلاقاً من ${effectiveStart} (${fresh.length} حصة) بنجاح 🇩🇿`);
      setTimeout(() => {
        document.getElementById('pages-start')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      displayUserAlert('يرجى تعبئة حصة واحدة على الأقل في جدول استعمال الزمن لتوليد الحصص');
    }
  };

  // ضمان وجود حصص لتفعيل التصدير دائماً دون تعطيل أو رسائل خطأ
  const ensureRowsForExport = (): LogEntry[] => {
    if (!startDate) {
      displayUserAlert('يرجى تحديد تاريخ بداية الدفتر أولاً.');
      return [];
    }
    if (rows.length > 0) return rows;
    showToast('جاري تجهيز حصص الدفتر تلقائياً للتصدير...');
    const effectiveStart = startDate;
    const fresh = generateLogbookEntries({
      startDate: effectiveStart,
      sequenceStartDate,
      gridRows,
      period: period || 'سنة',
      holidays,
      curriculumDb: CURRICULUM_DATABASE,
      sessionsPerActivity,
    });
    if (fresh.length > 0) {
      setRows(fresh);
      try {
        const dataToSave = {
          logbookDataVersion: LOGBOOK_DATA_VERSION,
          wilaya,
          school,
          teacher,
          subject,
          showSubjectInHeader,
          showYearInHeader,
          gridRows,
          holidays,
          rows: fresh,
          archivedRows,
          sequenceStartDate,
          startDate: effectiveStart,
          period: period || 'سنة',
          orientation,
        };
        localStorage.setItem('daftar_table_v2027', JSON.stringify(dataToSave));
      } catch {}
      return fresh;
    }
    return [];
  };

  // حفظ استعمال الزمن في التخزين المحلي وتحديث الأقسام المسندة في إعدادات الأستاذ
  const handleSaveTimetable = () => {
    try {
      // 1. حفظ شبكة استعمال الزمن في التخزين المحلي
      localStorage.setItem('algeria_sciences_timetable_grid', JSON.stringify(gridRows));
      
      try {
        const stored = localStorage.getItem('daftar_table_v2027');
        const parsed = stored ? JSON.parse(stored) : {};
        parsed.gridRows = gridRows;
        parsed.logbookDataVersion = LOGBOOK_DATA_VERSION;
        localStorage.setItem('daftar_table_v2027', JSON.stringify(parsed));
      } catch {}

      // 2. استخراج الأقسام المسندة وتحديث إعدادات الأستاذ
      const secSet = new Set<string>();
      gridRows.forEach(row => {
        WEEK_DAYS.forEach(day => {
          const val = row.cells[day]?.trim();
          if (val) secSet.add(val);
        });
      });
      const newSections = Array.from(secSet).sort();

      if (setConfig) {
        setConfig(prev => {
          const updated = {
            ...prev,
            assignedClasses: newSections,
            weeklyHours: totalFilledTimetableSlots,
          };
          try {
            sessionStorage.setItem('algeria_sciences_session_config_v3', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      // 3. التزامن السحابي عند توفره
      if ((window as any).syncToCloud) {
        (window as any).syncToCloud('timetable', {
          gridRows,
          assignedSections: newSections,
          weeklyHours: totalFilledTimetableSlots,
        });
      }

      showToast(`💾 تم حفظ استعمال الزمن بنجاح وتثبيت ${newSections.length} أقسام مسندة (${totalFilledTimetableSlots} حصة/ساعة أسبوعياً)`);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء حفظ استعمال الزمن');
    }
  };

  // تصدير جدول استعمال الزمن كملف Word رسمي مستقل
  const handleExportTimetableWord = async () => {
    try {
      showToast('جاري تصدير استعمال الزمن كملف Word...');
      const blob = await generateTimetableDocx(
        gridRows,
        config,
        assignedLevels,
        assignedSectionsList
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `استعمال-الزمن-الاسبوعي-${config.teacherName || 'الاستاذ'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      showToast('✅ تم تصدير جدول استعمال الزمن كملف Word بنجاح');
    } catch (err) {
      console.error(err);
      showToast('تعذر تصدير استعمال الزمن كملف Word');
    }
  };

  // تصدير جدول استعمال الزمن كملف PDF
  const handleExportTimetablePdf = async () => {
    try {
      showToast('جاري تصدير استعمال الزمن PDF...');
      if (!isTimetableModalOpen) {
        setIsTimetableModalOpen(true);
        await new Promise(resolve => setTimeout(resolve, 350));
      }
      const el = document.getElementById('official-printable-timetable');
      if (!el) throw new Error('تعذر العثور على وثيقة استعمال الزمن');

      const { jsPDF } = await import('jspdf');

      const canvas = await safeHtml2Canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`استعمال-الزمن-الاسبوعي-${config.teacherName || 'الاستاذ'}.pdf`);
      showToast('✅ تم تحميل جدول استعمال الزمن PDF بنجاح');
    } catch (err) {
      console.error(err);
      showToast('تعذر تصدير استعمال الزمن PDF');
    }
  };

  // طباعة جدول استعمال الزمن مباشرة
  const handlePrintTimetable = () => {
    setIsTimetableModalOpen(true);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // تفعيل تصدير Word للدفتر اليومي دون أي تعطل
  const handleExportWord = async () => {
    try {
      const activeRows = ensureRowsForExport();
      if (activeRows.length === 0) {
        showToast('يرجى التأكد من برمجة حصة واحدة على الأقل في استعمال الزمن لتصدير Word');
        return;
      }
      showToast('جاري تصدير الدفتر كملف Word قابل للتعديل...');
      const blob = await generateLogbookDocx(
        activeRows,
        config,
        gridRows,
        holidays,
        assignedLevels,
        orientation,
        paginatedPages
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `الدفتر-اليومي-${config.teacherName || 'الاستاذ'}-${orientation === 'landscape' ? 'أفقي' : 'عمودي'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      showToast('✅ تم تصدير الدفتر كملف Word قابل للتعديل بنجاح');
    } catch (error) {
      console.error(error);
      showToast('تعذر تصدير Word');
    }
  };

  // تفعيل طباعة الدفتر اليومي
  const handlePrintLogbook = async () => {
    try {
      const activeRows = ensureRowsForExport();
      if (activeRows.length === 0) {
        showToast('يرجى التأكد من برمجة حصة واحدة على الأقل في استعمال الزمن');
        return;
      }
      setShowEmptyWarning(false);
      if (!isPreviewModalOpen || previewMode !== 'all') {
        setPreviewMode('all');
        setPreviewZoom(100);
        setIsPreviewModalOpen(true);
      }

      // الانتظار حتى يستقر عرض كافة صفحات الدفتر في الـ DOM
      let renderedPages: HTMLElement[] = [];
      let stableCount = 0;
      let lastCount = -1;
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        const modalContainer = document.querySelector('.print-preview-root .preview-scroll');
        const currentPages = modalContainer
          ? Array.from(modalContainer.querySelectorAll<HTMLElement>('[data-preview-export-page="true"]'))
          : [];
        if (currentPages.length >= 2) {
          if (currentPages.length === lastCount) {
            stableCount++;
            if (stableCount >= 2) {
              renderedPages = currentPages;
              break;
            }
          } else {
            lastCount = currentPages.length;
            stableCount = 0;
          }
        }
      }

      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      if (renderedPages.length === 0) {
        // إذا تعذر جلبها من المعاينة نحاول من الصفحة الرئيسية
        const fallbackPages = Array.from(document.querySelectorAll<HTMLElement>('[data-preview-export-page="true"]'));
        if (fallbackPages.length === 0) {
          throw new Error('لم يتم العثور على صفحات الدفتر للطباعة');
        }
      }

      window.print();
    } catch (error) {
      console.error(error);
      showToast('تعذر فتح الطباعة');
    }
  };

  // تفعيل تصدير PDF للدفتر اليومي
  const handleExportPdf = async () => {
    try {
      const activeRows = ensureRowsForExport();
      if (activeRows.length === 0) {
        showToast('يرجى التأكد من برمجة حصة واحدة على الأقل في استعمال الزمن لتصدير PDF');
        return;
      }
      showToast('جاري تحضير كافة صفحات الدفتر اليومي للتصدير...');
      if (!isPreviewModalOpen || previewMode !== 'all') {
        setPreviewMode('all');
        setIsPreviewModalOpen(true);
      }

      let pages: HTMLElement[] = [];
      let stableCount = 0;
      let lastCount = -1;
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        const modalContainer = document.querySelector('.print-preview-root .preview-scroll');
        const currentPages = modalContainer
          ? Array.from(modalContainer.querySelectorAll<HTMLElement>('[data-preview-export-page="true"]'))
          : [];
        if (currentPages.length >= 2) {
          if (currentPages.length === lastCount) {
            stableCount++;
            if (stableCount >= 2) {
              pages = currentPages;
              break;
            }
          } else {
            lastCount = currentPages.length;
            stableCount = 0;
          }
        }
      }

      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      if (pages.length === 0) {
        const fallbackPages = Array.from(document.querySelectorAll<HTMLElement>('[data-preview-export-page="true"]'));
        if (fallbackPages.length > 0) {
          pages = fallbackPages;
        } else {
          throw new Error('لم يتم العثور على صفحات الدفتر لتصدير PDF');
        }
      }

      await generatePreviewMatchPdf(pages, orientation, (current, total) => {
        showToast(`جاري تصدير الصفحة ${current} من ${total}...`);
      });
      showToast(`✅ تم تصدير جميع صفحات الدفتر اليومي (${pages.length} صفحة) كملف PDF بنجاح`);
    } catch (error) {
      console.error(error);
      showToast('تعذر تصدير PDF للدفتر اليومي');
    }
  };

  const weeklyGroups = useMemo(() => {
    const groups = new Map<string, LogEntry[]>();
    [...rows].sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.time.localeCompare(b.time)).forEach((row) => {
      const key = getSchoolWeekKey(row.dateStr);
      const current = groups.get(key) || [];
      current.push(row);
      groups.set(key, current);
    });
    return Array.from(groups.entries()).map(([weekKey, weekRows]) => ({
      weekKey,
      weekNumber: getSchoolWeekNumber(weekRows[0]?.dateStr || startDate, startDate),
      rows: weekRows,
    }));
  }, [rows, startDate]);

  const paginatedPages = useMemo(() => {
    const pages: LogEntry[][] = [];
    // تقدير ارتفاع كل حصة اعتماداً على النص الذي سيلتف داخل الأعمدة.
    // هذا يجعل التقسيم يتأثر بطول المحتوى، لا بعدد الصفوف وحده.
    const pageHeightPx = pageDimensions.h * 3.7795;
    const availableHeightPx = Math.max(360, pageHeightPx - (orientation === 'landscape' ? 330 : 390));
    const estimateLines = (value: unknown, charsPerLine: number) => {
      const text = String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (!text) return 1;
      return text.split('\n').reduce((sum, part) => sum + Math.max(1, Math.ceil(part.length / charsPerLine)), 0);
    };
    const estimateRowHeight = (row: LogEntry) => {
      const content = buildHierarchicalContent(row);
      const contentLines = estimateLines(content, orientation === 'landscape' ? 95 : 65);
      const noteLines = estimateLines(row.note, orientation === 'landscape' ? 30 : 22);
      const sectionLines = estimateLines(row.section, 12);
      return Math.max(58, 26 + Math.max(contentLines, noteLines, sectionLines) * 17);
    };

    weeklyGroups.forEach((group) => {
      let pageRows: LogEntry[] = [];
      let usedHeight = 0;
      group.rows.forEach((row) => {
        const rowHeight = estimateRowHeight(row);
        if (pageRows.length > 0 && (usedHeight + rowHeight > availableHeightPx || pageRows.length >= ROWS_PER_PAGE)) {
          pages.push(pageRows);
          pageRows = [];
          usedHeight = 0;
        }
        pageRows.push(row);
        usedHeight += rowHeight;
      });
      if (pageRows.length) pages.push(pageRows);
    });
    return pages;
  }, [weeklyGroups, pageDimensions.h, orientation]);

  const levelDistributionSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      counts[r.level] = (counts[r.level] || 0) + 1;
    });
    // نعرض فقط المستويات المسندة التي توجد في الحصص
    return (
      assignedLevels
        .map((lvl) => `${lvl} (${counts[lvl] || 0} حصة)`)
        .join(' • ') || '—'
    );
  }, [rows, assignedLevels]);

  const totalFilledTimetableSlots = useMemo(() => {
    let count = 0;
    gridRows.forEach((row) =>
      WEEK_DAYS.forEach((day) => {
        if (row.cells[day]?.trim()) count++;
      })
    );
    return count;
  }, [gridRows]);

  // Timetable row modifications
  const handleCellChange = (rowId: string, day: string, value: string) => {
    setGridRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [day]: value } } : r))
    );
  };

  const handleTimeChange = (rowId: string, newTime: string, shiftType: 'morning' | 'afternoon') => {
    if (!isValidSchoolPeriod(newTime)) {
      displayUserAlert('الفترة محجوزة للراحة - الصباح 08-12 والمساء 13:30-17:30');
      return;
    }
    if (shiftType === 'morning' && !isMorningTime(newTime)) {
      displayUserAlert('الفترة محجوزة للراحة - الصباح 08-12 والمساء 13:30-17:30');
      return;
    }
    if (shiftType === 'afternoon' && !isAfternoonTime(newTime)) {
      displayUserAlert('الفترة محجوزة للراحة - الصباح 08-12 والمساء 13:30-17:30');
      return;
    }
    if (gridRows.some((r) => r.time === newTime && r.id !== rowId)) {
      displayUserAlert(`التوقيت ${newTime} موجود مسبقاً`);
      return;
    }
    setGridRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, time: newTime } : r)));
  };

  const handleAddMorningRow = () => {
    const existing = new Set(gridRows.map((r) => r.time));
    const available = MORNING_PERIODS.find((t) => !existing.has(t));
    if (!available) {
      displayUserAlert('جميع فترات الصباح (08:00-12:00) ممتلئة');
      return;
    }
    const newRow: TimetableGridRow = {
      id: Math.random().toString(36).slice(2, 7),
      time: available,
      cells: createEmptyDayCells(),
    };
    setGridRows((prev) => [...prev, newRow].sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time)));
    showToast('تمت إضافة فترة صباحية');
  };

  const handleAddAfternoonRow = () => {
    const existing = new Set(gridRows.map((r) => r.time));
    const available = AFTERNOON_PERIODS.find((t) => !existing.has(t));
    if (!available) {
      displayUserAlert('جميع فترات المساء (13:30-17:30) ممتلئة');
      return;
    }
    const newRow: TimetableGridRow = {
      id: Math.random().toString(36).slice(2, 7),
      time: available,
      cells: createEmptyDayCells(),
    };
    setGridRows((prev) => [...prev, newRow].sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time)));
    showToast('تمت إضافة فترة مسائية');
  };

  const handleDeleteGridRow = (rowId: string) => {
    setGridRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleClearGrid = () => {
    setGridRows((prev) => prev.map((r) => ({ ...r, cells: createEmptyDayCells() })));
    showToast('تم مسح الجدول');
  };

  const handleAutoFillGrid = () => {
    setGridRows(
      AUTO_FILLED_TIMETABLE_ROWS.map((r) => ({
        ...r,
        id: Math.random().toString(36).slice(2, 6) + r.id,
      })).sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time))
    );
    showToast('تمت التعبئة التلقائية للجدول بجميع المستويات');
  };

  // إسناد سريع لمستوى محدد (مثلاً أستاذ يدرس 1م و 4م فقط)
  const handleQuickAssignPreset = (presetLevels: ('1م' | '2م' | '3م' | '4م')[]) => {
    const updated = gridRows.map((row) => {
      const newCells = { ...row.cells };
      WEEK_DAYS.forEach((day) => {
        const curSec = newCells[day]?.trim();
        if (curSec) {
          const lvl = detectLevelFromSection(curSec);
          if (lvl && !presetLevels.includes(lvl)) {
            newCells[day] = ''; // مسح الأقسام غير المسندة
          }
        }
      });
      return { ...row, cells: newCells };
    });
    setGridRows(updated);
    showToast(`تم ضبط الأقسام المسندة: ${presetLevels.join(' و ')}`);
  };

  const handleResetDefaultGrid = () => {
    setGridRows(
      EMPTY_TIMETABLE_ROWS.map((r) => ({
        ...r,
        id: Math.random().toString(36).slice(2, 6) + r.id,
      })).sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time))
    );
    showToast('تمت استعادة الجدول الافتراضي');
  };

  const handleAddHoliday = () => {
    if (!newHolidayStartDate) {
      displayUserAlert('يرجى تحديد تاريخ بداية العطلة أو المناسبة');
      return;
    }
    const end = newHolidayEndDate || newHolidayStartDate;
    if (end < newHolidayStartDate) {
      displayUserAlert('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }
    const defaultLabel =
      newHolidayType === 'test'
        ? 'فرض محروس'
        : newHolidayType === 'exam'
        ? 'اختبار فصلي'
        : newHolidayType === 'official_exam'
        ? 'امتحان رسمي'
        : 'عطلة رسمية';

    setHolidays((prev) =>
      [...prev, {
        id: Math.random().toString(36).slice(2, 7),
        startDate: newHolidayStartDate,
        endDate: end,
        label: newHolidayLabel.trim() || defaultLabel,
        type: newHolidayType,
      }].sort((a, b) => a.startDate.localeCompare(b.startDate))
    );
    setNewHolidayStartDate('');
    setNewHolidayEndDate('');
    setNewHolidayLabel('');
    showToast('تمت إضافة المناسبة بنجاح');
  };

  const handleLoadOfficialCalendar = () => {
    const yearMatch = (config.schoolYear || '2026-2027').match(/(20\d{2})/);
    const startYear = yearMatch ? Number(yearMatch[1]) : 2026;
    const nextYear = startYear + 1;

    const officialEvents: HolidayEntry[] = [
      { id: 'hol-autumn', startDate: `${startYear}-10-27`, endDate: `${startYear}-11-03`, label: 'عطلة الخريف', type: 'holiday' },
      { id: 'test-trim1', startDate: `${startYear}-11-10`, endDate: `${startYear}-11-14`, label: 'فروض الفصل الأول', type: 'test' },
      { id: 'exam-trim1', startDate: `${startYear}-12-01`, endDate: `${startYear}-12-05`, label: 'اختبارات الفصل الأول', type: 'exam' },
      { id: 'hol-winter', startDate: `${startYear}-12-19`, endDate: `${nextYear}-01-04`, label: 'عطلة الشتاء', type: 'holiday' },
      { id: 'test-trim2', startDate: `${nextYear}-02-08`, endDate: `${nextYear}-02-12`, label: 'فروض الفصل الثاني', type: 'test' },
      { id: 'exam-trim2', startDate: `${nextYear}-03-01`, endDate: `${nextYear}-03-05`, label: 'اختبارات الفصل الثاني', type: 'exam' },
      { id: 'hol-spring', startDate: `${nextYear}-03-19`, endDate: `${nextYear}-04-05`, label: 'عطلة الربيع', type: 'holiday' },
      { id: 'test-trim3', startDate: `${nextYear}-04-26`, endDate: `${nextYear}-04-30`, label: 'فروض الفصل الثالث', type: 'test' },
      { id: 'exam-trim3', startDate: `${nextYear}-05-24`, endDate: `${nextYear}-05-28`, label: 'اختبارات الفصل الثالث / شهادة BEM', type: 'exam' },
    ];

    setHolidays(officialEvents);
    showToast('✅ تم تحميل الرزنامة الرسمية (العطل، الفروض، والاختبارات) بنجاح');
  };

  const calculateOptimalFitZoom = (targetOrientation: 'portrait' | 'landscape' = orientation) => {
    if (typeof window === 'undefined') return 85;
    const screenW = window.innerWidth;
    const targetPx = targetOrientation === 'landscape' ? 1123 : 794;
    const availableW = screenW < 640 ? screenW - 24 : screenW < 1024 ? screenW - 48 : screenW - 96;
    const calculated = Math.floor((availableW / targetPx) * 100);
    return Math.min(100, Math.max(30, calculated));
  };

  const handleOpenPreview = (mode: 'all' | 'single') => {
    setPreviewMode(mode);
    setPreviewZoom(calculateOptimalFitZoom());
    setIsPreviewModalOpen(true);
    setShowEmptyWarning(false);
  };


  const previewPagesToDisplay = useMemo(() => {
    if (previewMode === 'single') return paginatedPages.slice(0, 1);
    return paginatedPages;
  }, [paginatedPages, previewMode]);

  const morningRows = useMemo(
    () => gridRows.filter((r) => isMorningTime(r.time)).sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time)),
    [gridRows]
  );
  const afternoonRows = useMemo(
    () => gridRows.filter((r) => isAfternoonTime(r.time)).sort((a, b) => getTimeRank(a.time) - getTimeRank(b.time)),
    [gridRows]
  );

  const renderLunchBreakRow = (key: string) => (
    <tr key={key} className="bg-[#fff6df]">
      <td
        colSpan={6}
        className="border border-amber-200 text-center py-1 text-[10px] font-extrabold text-amber-800 tracking-wide"
      >
        <span className="inline-flex items-center gap-1.5">
          <span>🍽️</span> استراحة الغداء 12:00 - 13:30 - فترة راحة
        </span>
      </td>
    </tr>
  );

  // صفحة تعريفية مستقلة للدفتر: أول صفحة في المعاينة والطباعة، بدون مربعات الكتابة.
  const renderNotebookIntroPage = (isPreview = false) => {
    const totalAssignedHours = levelStats.reduce((sum, item) => sum + item.slots, 0);

    return (
      <div
        id={isPreview ? "preview-page-intro" : "page-intro"}
        data-preview-export-page="true"
        className={isPreview ? "print-page notebook-intro-page shadow-[0_25px_80px_rgba(0,0,0,0.5)] bg-white overflow-hidden mx-auto mb-8 flex flex-col justify-between" : "print-page notebook-intro-page shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white overflow-hidden mx-auto mb-8 flex flex-col justify-between"}
        style={{ width: `${pageDimensions.w}mm`, height: `${pageDimensions.h}mm`, minHeight: `${pageDimensions.h}mm`, maxWidth: '100%' }}
        dir="rtl"
      >
        <div>
          {/* Top Algerian Flag Ribbon */}
          <div className="h-2 flex shrink-0">
            <div className="flex-1 bg-[#006233]" />
            <div className="flex-1 bg-[#D21034]" />
          </div>

          <div className="px-10 pt-6">
            {/* Header with Science Graphics and Official Republic text */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#bae6fd]">
              <ScienceHeaderRight />
              <div className="text-center px-4 space-y-1">
                <div className="text-[14px] font-extrabold text-zinc-900 flex items-center justify-center gap-1.5">
                  <span>🇩🇿</span> الجمهورية الجزائرية الديمقراطية الشعبية <span>🇩🇿</span>
                </div>
                <div className="text-[12px] font-extrabold text-[#0369a1]">وزارة التربية الوطنية</div>
                <div className="text-[11px] font-bold text-zinc-600">
                  مديرية التربية لولاية {wilaya || '—'} • متوسطة: {school || '—'}
                </div>
                <div className="text-[#0284c7] text-[13px] tracking-widest">◆ ◆ ◆</div>
              </div>
              <ScienceHeaderLeft />
            </div>

            {/* Title Banner */}
            <div className="my-6 text-center">
              <div className="inline-block bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#0369a1] text-white px-10 py-3 rounded-2xl shadow-sm border border-[#38bdf8]">
                <h1 className="text-[28px] font-black tracking-tight leading-tight">الدفتر اليومي للأستاذ</h1>
                <div className="text-[13px] font-bold opacity-95 mt-1 flex items-center justify-center gap-2">
                  <span>علوم الطبيعة والحياة</span>
                  <span>◆</span>
                  <span>مرحلة التعليم المتوسط</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] font-bold text-zinc-500">
                وثيقة بيداغوجية رسمية معتمدة لتدوين ومتابعة سير الحصص وفق التدرج السنوي
              </div>
            </div>

            {/* Teacher and School Info Cards */}
            <div className="grid grid-cols-2 gap-3.5 max-w-[170mm] mx-auto text-[12px]">
              <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3 flex items-center justify-between shadow-2xs">
                <span className="font-bold text-[#0369a1]">الأستاذ(ة):</span>
                <span className="font-extrabold text-zinc-900">{teacher || '—'}</span>
              </div>
              <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3 flex items-center justify-between shadow-2xs">
                <span className="font-bold text-[#0369a1]">المتوسطة:</span>
                <span className="font-extrabold text-zinc-900">{school || '—'}</span>
              </div>
              <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3 flex items-center justify-between shadow-2xs">
                <span className="font-bold text-[#0369a1]">المديرية الولائية:</span>
                <span className="font-extrabold text-zinc-900">ولاية {wilaya || '—'}</span>
              </div>
              <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3 flex items-center justify-between shadow-2xs">
                <span className="font-bold text-[#0369a1]">السنة الدراسية:</span>
                <span className="font-extrabold text-zinc-900 font-mono">{config.schoolYear || '2026-2027'}</span>
              </div>
              <div className="col-span-2 rounded-xl border-2 border-[#0284c7] bg-[#e1f0fa] px-4 py-3 flex items-center justify-between shadow-2xs">
                <span className="font-extrabold text-[#0369a1]">المستويات المسندة:</span>
                <div className="flex gap-2">
                  {assignedLevels.length > 0 ? (
                    assignedLevels.map((lvl) => (
                      <span key={lvl} className="bg-white border border-[#0284c7] text-[#0369a1] px-3 py-1 rounded-full font-black text-[11px] shadow-2xs">
                        {lvl}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500 font-bold">لم تُحدد بعد</span>
                  )}
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 flex items-center justify-between text-[11px]">
                <span className="font-bold text-zinc-500">تاريخ بداية الدفتر:</span>
                <span className="font-extrabold text-zinc-800 font-mono">{startDate || '—'}</span>
              </div>
            </div>

            {/* Timetable summary */}
            <div className="max-w-[170mm] mx-auto mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-black text-zinc-800">ملخص الحجم الساعي الأسبوعي للمستويات المسندة:</div>
                <div className="text-[10px] font-bold text-[#0369a1] bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-1 rounded-full">
                  {totalAssignedHours} حصة/ساعة أسبوعياً
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {levelStats.map((item) => (
                  <div key={item.level} className={`rounded-xl border px-2 py-2 text-center ${levelColors[item.level] || 'border-zinc-200 bg-zinc-50 text-zinc-700'}`}>
                    <div className="text-[15px] font-black">{item.level}</div>
                    <div className="text-[10px] font-bold mt-1">{item.slots} ساعة/أسبوع</div>
                    <div className="text-[9px] mt-0.5">{item.sections} قسم</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with botanical ornaments and numbering */}
        <div className="px-10 pb-4">
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
            <CornerLeaves />
            <div className="text-center text-[10px] text-zinc-500 space-y-1">
              <div>دفتر بيداغوجي لتدوين محتوى الدرس وسير الحصص اليومية وفق التدرج الرسمي</div>
              <div className="inline-block bg-[#f0f9ff] border border-[#bae6fd] text-[#0369a1] px-3 py-0.5 rounded-full font-bold">
                الصفحة التعريفية — 🇩🇿
              </div>
            </div>
            <CornerLeaves flip={true} />
          </div>

          <div className="h-1 flex shrink-0 mt-3 -mx-10">
            <div className="flex-1 bg-[#006233]" />
            <div className="flex-1 bg-[#D21034]" />
          </div>
        </div>
      </div>
    );
  };

  // مكون بطاقة/صفحة الغلاف واستعمال الزمن (بعد الصفحة التعريفية)
  const renderCoverFirstPage = () => (
    <div
      data-preview-export-page="true"
      className="print-page cover-page shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-[2px] border border-zinc-200 overflow-hidden mx-auto mb-8 flex flex-col justify-between"
      style={{
        width: `${pageDimensions.w}mm`,
        height: `${pageDimensions.h}mm`,
        minHeight: `${pageDimensions.h}mm`,
        maxWidth: '100%',
      }}
    >
      <div>
        {/* Header Flag */}
        <div className="h-1.5 flex -mx-[1px] mb-3">
          <div className="flex-1 bg-[#006233]" />
          <div className="flex-1 bg-[#D21034]" />
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Header with Science Graphics and Official Republic text */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#bae6fd]">
            <ScienceHeaderRight />
            <div className="text-center px-4 space-y-1">
              <div className="text-[13px] font-extrabold flex items-center justify-center gap-1.5 text-zinc-900">
                <span>🇩🇿</span> الجمهورية الجزائرية الديمقراطية الشعبية <span>🇩🇿</span>
              </div>
              <div className="text-[12px] font-bold text-[#0369a1]">وزارة التربية الوطنية</div>
              <div className="text-[11px] font-semibold text-zinc-600">مديرية التربية لولاية {wilaya || '—'}</div>
              <div className="text-[12px] font-extrabold text-zinc-800">متوسطة: {school || '—'}</div>
            </div>
            <ScienceHeaderLeft />
          </div>

          {/* Cover Title */}
          <div className="my-4 text-center bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#0369a1] text-white py-3 rounded-xl shadow-xs border border-[#38bdf8]">
            <div className="text-[10px] tracking-widest uppercase opacity-85 mb-0.5">وثيقة بيداغوجية رسمية معتمدة</div>
            <h1 className="text-[22px] font-[800] tracking-tight">الدفتر اليومي للأستاذ</h1>
            <div className="text-[12px] font-medium opacity-95 mt-1">
              مرحلة التعليم المتوسط {showSubjectInHeader && subject ? `• مادة ${subject}` : ''}
            </div>
            {showYearInHeader && config.schoolYear && (
              <div className="inline-block mt-1 bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold">
                السنة الدراسية: {config.schoolYear}
              </div>
            )}
          </div>

          {/* Teacher & Assignment Info Grid in Sky Blue */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 space-y-1.5">
              <div className="text-[11.5px] font-extrabold text-[#0369a1] border-b border-[#bae6fd] pb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>معلومات الأستاذ(ة) والإسناد التربوي:</span>
              </div>
              <div className="grid grid-cols-[75px_1fr] gap-1 text-zinc-800">
                <span className="text-zinc-500 font-medium">الأستاذ(ة):</span>
                <span className="font-bold">{teacher || '—'}</span>

                {showSubjectInHeader && subject && (
                  <>
                    <span className="text-zinc-500 font-medium">المادة:</span>
                    <span className="font-bold">{subject}</span>
                  </>
                )}

                {showYearInHeader && config.schoolYear && (
                  <>
                    <span className="text-zinc-500 font-medium">السنة الدراسية:</span>
                    <span className="font-bold">{config.schoolYear}</span>
                  </>
                )}

                <span className="text-zinc-500 font-medium">المستويات:</span>
                <span className="font-extrabold text-[#0284c7]">
                  {assignedLevels.length > 0 ? assignedLevels.join(' ، ') : '—'}
                </span>

                <span className="text-zinc-500 font-medium">الأقسام:</span>
                <span className="font-bold">
                  {assignedSectionsList.length > 0 ? assignedSectionsList.join(' • ') : '—'}
                </span>
              </div>
            </div>

            <div className="bg-[#e1f0fa] border border-[#7dd3fc] rounded-xl p-3 space-y-1.5">
              <div className="text-[11.5px] font-extrabold text-[#0369a1] border-b border-[#7dd3fc] pb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>ملخص الحجم الساعي والسنوات المسندة:</span>
              </div>
              <div className="space-y-1 text-[11px] text-zinc-800">
                <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-[#bae6fd]">
                  <span>إجمالي الحصص الأسبوعية:</span>
                  <b className="text-[#0369a1] font-mono text-[11px]">{totalFilledTimetableSlots} حصة/أسبوع</b>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {assignedLevels.map((lvl) => (
                    <span
                      key={lvl}
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                        lvl === '4م'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : lvl === '3م'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : lvl === '2م'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {lvl} ({CURRICULUM_DATABASE[lvl]?.length || 0} مورد بالمنهاج)
                    </span>
                  ))}
                </div>
                <div className="text-[9.5px] text-zinc-500 leading-tight pt-0.5">
                  • تُدون حصص المستويات المسندة حصراً وفق التدرج السنوي المعتمد.
                </div>
              </div>
            </div>
          </div>

          {/* Official Weekly Timetable */}
          <div className="rounded-xl border border-[#bae6fd] overflow-hidden mb-3">
            <div className="bg-[#0284c7] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5" />
                جدول استعمال الزمن الأسبوعي للأستاذ (من الأحد إلى الخميس)
              </span>
              <span className="text-[9.5px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                نظام الدوام بفترتين: صباحية ومسائية
              </span>
            </div>

            <table className="w-full border-collapse text-[10px] leading-4 text-center">
              <thead>
                <tr className="bg-[#f0f9ff] text-[#0369a1] font-bold border-b border-[#bae6fd]">
                  <th className="border border-[#bae6fd] px-2 py-1.5 w-[90px]">التوقيت</th>
                  {WEEK_DAYS.map((day) => (
                    <th key={day} className="border border-[#bae6fd] px-2 py-1.5 font-bold">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Morning Shift */}
                {morningRows.map((row) => (
                  <tr key={row.id} className="hover:bg-amber-50/30">
                    <td className="border border-zinc-200 px-1.5 py-1 font-mono font-bold bg-[#f8fafc] text-zinc-700">
                      {row.time}
                    </td>
                    {WEEK_DAYS.map((day) => {
                      const cellVal = row.cells[day] || '';
                      const lvl = detectLevelFromSection(cellVal);
                      return (
                        <td key={day} className="border border-zinc-200 px-1 py-1 font-bold">
                          {cellVal ? (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${
                                lvl === '4م'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : lvl === '3م'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : lvl === '2م'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {cellVal}
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Lunch break */}
                <tr className="bg-[#fffbeb] text-amber-900 font-bold text-[9px]">
                  <td colSpan={6} className="border border-amber-200 py-1 text-center">
                    🍽️ استراحة الغداء 12:00 - 13:30 (فترة راحة رسمية)
                  </td>
                </tr>

                {/* Afternoon Shift */}
                {afternoonRows.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50/30">
                    <td className="border border-zinc-200 px-1.5 py-1 font-mono font-bold bg-[#f8fafc] text-zinc-700">
                      {row.time}
                    </td>
                    {WEEK_DAYS.map((day) => {
                      const cellVal = row.cells[day] || '';
                      const lvl = detectLevelFromSection(cellVal);
                      return (
                        <td key={day} className="border border-zinc-200 px-1 py-1 font-bold">
                          {cellVal ? (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${
                                lvl === '4م'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : lvl === '3م'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : lvl === '2م'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {cellVal}
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cover Page Footer with 4 Signatures & Official Teacher Stamp */}
      <div style={{ padding: '0 16px' }} className="mt-auto pt-2 border-t-2 border-[#bae6fd]">
        <div className="grid grid-cols-4 gap-3 text-[10px] text-center mb-2">
          <div className="border border-dashed border-zinc-300 rounded-lg p-2 bg-[#f8fafc]">
            <div className="font-bold text-zinc-800">توقيع الأستاذ(ة)</div>
            <div className="mt-4 border-t border-dashed border-zinc-400 h-6" />
          </div>
          <div className="border border-dashed border-[#bae6fd] rounded-lg p-1 bg-[#f0f9ff] flex flex-col items-center justify-center">
            <div className="font-bold text-[#0369a1] text-[9.5px] mb-0.5">الختم الرسمي للأستاذ</div>
            <TeacherOfficialStamp config={config} size="sm" />
          </div>
          <div className="border border-dashed border-zinc-300 rounded-lg p-2 bg-[#f8fafc]">
            <div className="font-bold text-zinc-800">تأشيرة مدير المؤسسة</div>
            <div className="mt-4 border-t border-dashed border-zinc-400 h-6" />
          </div>
          <div className="border border-dashed border-zinc-300 rounded-lg p-2 bg-[#f8fafc]">
            <div className="font-bold text-zinc-800">تأشيرة مفتش المادة</div>
            <div className="mt-4 border-t border-dashed border-zinc-400 h-6" />
          </div>
        </div>

        <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-1 border-t border-zinc-100">
          <span>الغلاف الرسمي واستعمال الزمن</span>
          <span className="font-bold text-[#0369a1] bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-0.5 rounded-full">
            صفحة الغلاف — 🇩🇿
          </span>
          <span>الجمهورية الجزائرية الديمقراطية الشعبية 🇩🇿</span>
        </div>

        <div className="h-1.5 flex -mx-4 mt-2">
          <div className="flex-1 bg-[#006233]" />
          <div className="flex-1 bg-[#D21034]" />
        </div>
      </div>
    </div>
  );


  const renderFrontPage = (isPreview = false) => {
    return (
      <div
        key="front-page"
        className={
          isPreview 
            ? "print-page bg-white shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.1)] rounded-[2px] overflow-hidden shrink-0 flex flex-col" 
            : "print-page bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-[2px] border border-zinc-200 overflow-hidden mx-auto mb-8 flex flex-col"
        }
        style={{
          width: `${pageDimensions.w}mm`,
          minHeight: `${pageDimensions.h}mm`,
          maxWidth: isPreview ? undefined : '100%',
          backgroundColor: '#ffffff',
          // الصفحة الأولى بدون مربعات صغيرة؛ شبكة الكتابة تُستخدم فقط في الصفحات الداخلية.
        }}
      >
        <div style={{ padding: PAGE_INNER_PADDING }} className="h-full flex flex-col">
          <div className="w-full border-b border-zinc-200 mb-8">
            <div className="h-1 flex">
              <div className="flex-1 bg-[#006233]" />
              <div className="flex-1 bg-[#D21034]" />
            </div>
            <div className="px-5 py-4 text-center space-y-1">
              <div className="font-bold text-[12px] flex items-center justify-center gap-1 text-zinc-900">
                <span>🇩🇿</span> الجمهورية الجزائرية الديمقراطية الشعبية
              </div>
              <div className="text-zinc-700 font-medium text-[12px]">وزارة التربية الوطنية</div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[26px] font-extrabold text-zinc-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#006233] text-white grid place-items-center"><BookOpen className="w-4 h-4" /></div>
              الدفتر اليومي
              <div className="w-8 h-8 rounded-full bg-[#D21034] text-white grid place-items-center"><Calendar className="w-4 h-4" /></div>
            </div>

            <div className="w-full max-w-3xl text-[12px] mb-10 flex flex-wrap justify-center gap-x-6 gap-y-3 bg-[#f5fbf9] p-4 border border-zinc-200 rounded-[2px]">
              <span className="flex items-center gap-1.5"><span className="text-zinc-500 font-medium">الأستاذ(ة):</span> <span className="font-bold text-zinc-900">{teacher || '—'}</span></span>
              <span className="flex items-center gap-1.5"><span className="text-zinc-500 font-medium">المادة:</span> <span className="font-bold text-zinc-900">{subject || '—'}</span></span>
              <span className="flex items-center gap-1.5"><span className="text-zinc-500 font-medium">المتوسطة:</span> <span className="font-bold text-zinc-900">{school || '—'}</span></span>
              <span className="flex items-center gap-1.5"><span className="text-zinc-500 font-medium">السنة الدراسية:</span> <span className="font-bold text-zinc-900">{config.schoolYear || ''}</span></span>
              <span className="flex items-center gap-1.5"><span className="text-zinc-500 font-medium">المستويات المسندة:</span> <span className="font-bold text-zinc-900" dir="ltr">{assignedLevels.join(' ، ')}</span></span>
            </div>

            <div className="w-full mb-8">
              <div className="text-[13px] font-bold text-[#064e3b] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#006233] rounded-full" />
                جدول استعمال الزمن
              </div>
              <table className="w-full border-collapse border border-zinc-200">
                <thead>
                  <tr>
                    <th className="border border-zinc-200 px-2 py-2 text-center w-[80px] bg-[#f0fdf4] font-bold text-[#064e3b] text-[11px]">اليوم \ التوقيت</th>
                    {gridRows.map(r => (
                      <th key={r.id} className="border border-zinc-200 px-2 py-2 text-center font-bold text-[10px] text-zinc-700 bg-[#f9faf6] font-mono">{r.time}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WEEK_DAYS.map((day, idx) => (
                    <tr key={day} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9faf6]'}>
                      <td className="border border-zinc-200 px-2 py-2 text-center font-bold text-[11px] text-zinc-900 w-[80px]">{day}</td>
                      {gridRows.map(r => {
                        const cellVal = r.cells[day] || '';
                        const lvl = detectLevelFromSection(cellVal);
                        return (
                          <td key={r.id} className="border border-zinc-200 px-1 py-1 text-center font-bold">
                            {cellVal ? (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${
                                  lvl === '4م'
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : lvl === '3م'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : lvl === '2م'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {cellVal}
                              </span>
                            ) : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {holidays.length > 0 && (
              <div className="w-full max-w-3xl mx-auto">
                <div className="text-[13px] font-bold text-[#a34f6b] mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#D21034] rounded-full" />
                  جدول العطل
                </div>
                <table className="w-full border-collapse border border-zinc-200">
                  <thead>
                    <tr>
                      <th className="border border-zinc-200 px-2 py-2 text-center bg-[#fff0f5] font-bold text-[#991b1b] text-[11px] w-[50%]">العطلة</th>
                      <th className="border border-zinc-200 px-2 py-2 text-center bg-[#f9faf6] font-bold text-zinc-700 text-[11px] w-[25%]">من</th>
                      <th className="border border-zinc-200 px-2 py-2 text-center bg-[#f9faf6] font-bold text-zinc-700 text-[11px] w-[25%]">إلى</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((h, idx) => (
                      <tr key={h.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9faf6]'}>
                        <td className="border border-zinc-200 px-2 py-1.5 text-center font-bold text-[11px] text-zinc-900">{h.label}</td>
                        <td className="border border-zinc-200 px-2 py-1.5 text-center font-mono font-medium text-[10px] text-zinc-700" dir="ltr">{h.start}</td>
                        <td className="border border-zinc-200 px-2 py-1.5 text-center font-mono font-medium text-[10px] text-zinc-700" dir="ltr">{h.end}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ختم الأستاذ + توقيع في الصفحة الأولى — لضمان أن كل صفحة تحتوي الختم */}
          <div className="mt-auto pt-3 border-t border-zinc-200 flex items-end justify-between gap-6 text-[10px]">
            <div className="text-center min-w-[140px]">
              <div className="font-bold text-zinc-800">توقيع الأستاذ(ة)</div>
              <div className="mt-5 border-t border-dashed border-zinc-400 h-7" />
            </div>
            <div className="text-center">
              <div className="font-bold text-zinc-800 mb-1">ختم الأستاذ(ة)</div>
              <div className="flex justify-center">
                <TeacherOfficialStamp config={config} size="sm" />
              </div>
            </div>
            <div className="text-center min-w-[140px]">
              <div className="font-bold text-zinc-800">تأشيرة المؤسسة</div>
              <div className="mt-5 border-t border-dashed border-zinc-400 h-7" />
            </div>
            <div className="font-bold text-zinc-700 whitespace-nowrap">
              الغلاف
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#edf9f6] grid-paper-bg text-zinc-900 selection:bg-[#006233]/20"
      style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
    >
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="إضافة حصة أو تسجيل حالة">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 bg-[#064e3b] text-white px-5 py-4">
              <div>
                <h3 className="font-extrabold text-[16px]">إضافة حصة أو تسجيل تغيير</h3>
                <p className="text-[11px] text-emerald-100 mt-1">يُحفظ التعديل في سجل الدفتر فقط، ولا يغيّر البرنامج المرجعي.</p>
              </div>
              <button type="button" onClick={() => setIsAddLessonModalOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="إغلاق"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">التاريخ</label>
                <input type="date" value={manualLessonDate} onChange={(e) => setManualLessonDate(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[12px]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">التوقيت</label>
                <select value={manualLessonTime} onChange={(e) => setManualLessonTime(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[12px]">
                  {ALL_PERIODS.map((time) => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">القسم</label>
                <input value={manualLessonSection} onChange={(e) => setManualLessonSection(e.target.value)} placeholder="مثال: 2م1" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[12px]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">نوع الإضافة / الحالة</label>
                <select value={manualLessonStatus} onChange={(e) => setManualLessonStatus(e.target.value as typeof manualLessonStatus)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[12px]">
                  <option value="normal">حصة إضافية</option>
                  <option value="changed">تغيّر محتوى الحصة</option>
                  <option value="teacher_absent">غياب الأستاذ — لم تُنجز الحصة</option>
                  <option value="students_absent">غياب التلاميذ</option>
                  <option value="not_completed">لم يكتمل الدرس — متابعة لاحقاً</option>
                </select>
              </div>
              {(manualLessonStatus === 'normal' || manualLessonStatus === 'changed' || manualLessonStatus === 'not_completed') && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">{manualLessonStatus === 'not_completed' ? 'المحتوى المبرمج / الجزء المتبقي' : 'محتوى الحصة الفعلي'}</label>
                  <textarea value={manualLessonContent} onChange={(e) => setManualLessonContent(e.target.value)} rows={4} placeholder="اكتب محتوى الحصة كما نُفّذ فعلياً..." className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[12px] resize-y" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">ملاحظة (اختياري)</label>
                <textarea value={manualLessonNote} onChange={(e) => setManualLessonNote(e.target.value)} rows={2} placeholder="سبب التغيير، تاريخ التعويض، الجزء المتبقي..." className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-[12px] resize-y" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 p-4">
              <button type="button" onClick={() => setIsAddLessonModalOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-[12px] font-bold text-zinc-700">إلغاء</button>
              <button type="button" onClick={handleAddManualLesson} className="rounded-lg bg-[#064e3b] px-5 py-2 text-[12px] font-extrabold text-white hover:bg-[#042f24]">حفظ في الدفتر</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root, #root > div, .app-shell, main {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .grid-paper-bg {
            background-color: #ffffff !important;
            background-image: none !important;
            background-size: auto !important;
          }
          .print-preview-root {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            background: #ffffff !important;
            overflow: visible !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .preview-controls, .no-print, header, aside, nav, #toast-notification {
            display: none !important;
          }
          .preview-scroll {
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            width: 100% !important;
          }
          .preview-scroll > div {
            transform: none !important;
            width: 100% !important;
            gap: 0 !important;
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page, [data-preview-export-page="true"] {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            visibility: visible !important;
            box-sizing: border-box !important;
            flex: none !important;
            position: relative !important;
            color: #111827 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            page-break-before: auto !important;
            break-before: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            width: ${orientation === 'landscape' ? '297mm' : '210mm'} !important;
            height: ${orientation === 'landscape' ? '210mm' : '297mm'} !important;
            min-height: ${orientation === 'landscape' ? '210mm' : '297mm'} !important;
            max-height: ${orientation === 'landscape' ? '210mm' : '297mm'} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .logbook-content-page, [data-logbook-content-page="true"] {
            border: 2px solid #0284c7 !important;
            border-radius: 12px !important;
          }
          .notebook-intro-page {
            display: flex !important;
            visibility: visible !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            page-break-before: auto !important;
            break-before: auto !important;
          }
          .notebook-intro-page * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page:last-child, [data-preview-export-page="true"]:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .logbook-table { border-collapse: collapse !important; }
          .writing-grid-cell, .logbook-grid-cell { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen and (max-width: 820px) {
          .print-page {
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .logbook-content-page, .notebook-intro-page, .cover-page {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
          }
        }
        .cover-page { background-color: #fffdf7; background-image: radial-gradient(circle at 15% 10%, rgba(6,78,59,.08), transparent 28%), radial-gradient(circle at 85% 20%, rgba(210,16,52,.06), transparent 25%); }
        .logbook-table { border-collapse: collapse !important; }
        .logbook-table th, .logbook-table td { border: 1.5px solid #64748b !important; }
        .preview-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .preview-scroll::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        .preview-scroll::-webkit-scrollbar-track { background: #111827; }
        .grid-paper-bg {
          background-color: #ffffff;
          background-image: linear-gradient(rgba(148,163,184,.22) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148,163,184,.22) 1px, transparent 1px);
          background-size: 10px 10px;
        }
      `}</style>

      {/* Algerian Flag Ribbon at Top */}
      <div className="w-full h-1 flex no-print">
        <div className="flex-1 bg-[#006233]" />
        <div className="flex-1 bg-[#D21034]" />
      </div>

      {/* Header Banner */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[13px] md:text-[15px] font-bold text-zinc-700">
                <span className="text-[18px]">🇩🇿</span> الجمهورية الجزائرية الديمقراطية الشعبية
              </div>
              <div className="text-[13px] font-medium text-zinc-600 pr-7">وزارة التربية الوطنية</div>
              <div className="flex flex-wrap gap-2 mt-3 text-[12px] md:text-[13px] leading-6">
                <span className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded">
                  مديرية التربية لولاية:{' '}
                  <input
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    className="bg-transparent border-b border-dashed border-zinc-400 outline-none min-w-[90px] font-bold text-zinc-800"
                    placeholder="الولاية"
                  />
                </span>
                <span className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded">
                  المتوسطة:{' '}
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="bg-transparent border-b border-dashed border-zinc-400 outline-none min-w-[120px] font-bold text-zinc-800"
                    placeholder="المتوسطة"
                  />
                </span>
                <span className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded">
                  الأستاذ(ة):{' '}
                  <input
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    className="bg-transparent border-b border-dashed border-zinc-400 outline-none min-w-[110px] font-bold text-zinc-800"
                    placeholder="الاسم"
                  />
                </span>
                <span className="inline-flex items-center gap-1 bg-[#064e3b] text-white px-2 py-1 rounded font-bold">
                  المادة: العلوم الطبيعية
                </span>
                <span className="inline-flex items-center gap-1 bg-zinc-900 text-white px-2 py-1 rounded font-bold">
                  السنة: {config.schoolYear || ''}
                </span>
              </div>
            </div>

            <div className="text-right">
              <h1 className="text-[22px] md:text-[28px] font-[800] tracking-tight leading-none text-zinc-900">
                الدفتر اليومي - استعمال زمن جدولي
              </h1>
              <p className="text-[13px] font-bold text-[#159a8c] mt-1">
                ربط تلقائي بالمنهاج الرسمي والتدرج السنوي للمستويات المسندة للأستاذ
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                A4 • {ROWS_PER_PAGE} سطر • فلترة ذكية للسنوات المسندة • تسلسل بيداغوجي للموارد
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-1 flex">
          <div className="flex-1 bg-[#006233]" />
          <div className="flex-1 bg-[#D21034]" />
        </div>
      </header>

      {/* Main Grid: Sidebar + Printable Pages */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-0">
        {/* Sidebar Controls */}
        <aside className="no-print bg-white lg:border-l border-zinc-200 lg:min-h-[calc(100vh-120px)]">
          <div className="p-4 md:p-5 space-y-6">
            
            {/* Dynamic Assigned Levels Detection Banner */}
            <div className="rounded-xl border-2 border-[#064e3b]/20 bg-gradient-to-br from-[#f0fdf4] to-[#e8f5e9] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-200">
                <div className="flex items-center gap-2 text-[13px] font-extrabold text-[#064e3b]">
                  <GraduationCap className="w-4 h-4 text-[#16a34a]" />
                  <span>المستويات المسندة للأستاذ (مكتشفة تلقائياً):</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {assignedLevels.length} مستويات
                </span>
              </div>

              {assignedLevels.length === 0 ? (
                <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed font-medium">
                  ⚠️ لم يتم إسناد أي قسم بعد في استعمال الزمن أدناه. أدخل قسماً (مثل 1م1 أو 4م2) لتفعيله آلياً في الدفتر.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {assignedLevels.map((lvl) => (
                      <span
                        key={lvl}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold border shadow-2xs ${
                          lvl === '4م'
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : lvl === '3م'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : lvl === '2م'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{LEVEL_NAMES_MAP[lvl]}</span>
                        <span className="text-[10px] font-normal opacity-80">
                          ({CURRICULUM_DATABASE[lvl].length} مورد معتمد)
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Hidden / Unassigned Levels Notice */}
                  {(['1م', '2م', '3م', '4م'] as const).some((lvl) => !assignedLevels.includes(lvl)) && (
                    <div className="text-[11px] text-zinc-600 bg-white/70 rounded-lg p-2 border border-emerald-200 flex items-center justify-between">
                      <span>
                        المستويات غير المسندة (محجوبة تلقائياً من الدفتر):{' '}
                        <b>
                          {(['1م', '2م', '3م', '4م'] as const)
                            .filter((lvl) => !assignedLevels.includes(lvl))
                            .join('، ')}
                        </b>
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-600 font-medium">الأقسام الفعلية:</span>
                <span className="font-bold text-zinc-800 font-mono">
                  {assignedSectionsList.length > 0 ? assignedSectionsList.join(' • ') : '—'}
                </span>
              </div>
            </div>

            {/* Timetable Grid Card with Real-time Binding */}
            <div className="rounded-xl border-2 border-[#064e3b]/15 overflow-hidden shadow-sm">
              <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[13px] font-extrabold">
                  <TableIcon className="w-4 h-4 text-emerald-300" />
                  <span>استعمال الزمن - فترتين ثابتتين</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    {totalFilledTimetableSlots} حصة أسبوعياً
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveTimetable}
                    className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1 rounded-full text-[11px] font-black shadow-sm transition cursor-pointer"
                    title="حفظ جدول استعمال الزمن في المتصفح وتثبيت الأقسام المسندة"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ استعمال الزمن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTimetableModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] bg-white text-[#064e3b] hover:bg-emerald-50 px-2.5 py-1 rounded-full font-bold shadow-sm transition cursor-pointer"
                    title="معاينة وتصدير جدول استعمال الزمن كملف رسمي مستقل"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>تصدير / طباعة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsElementsModalOpen(true)}
                    className="text-[10px] bg-emerald-800/80 text-emerald-100 border border-emerald-700 px-2.5 py-1 rounded-full font-bold hover:bg-emerald-800 cursor-pointer"
                  >
                    المناهج ({assignedLevels.length})
                  </button>
                </div>
              </div>

              <div className="p-0 bg-[#fcfcf9]">


                {userAlert && (
                  <div className="m-2 bg-red-50 border border-red-200 text-red-800 text-[11px] font-bold rounded-lg px-3 py-2 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{userAlert}</span>
                  </div>
                )}

                {/* Morning Shift */}
                <div className="border-b-2 border-amber-200">
                  <div className="bg-gradient-to-l from-amber-50 to-orange-50 border-b border-amber-200 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-[12px] text-amber-900">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span>☀️ الفترة الصباحية (08:00-12:00)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMorningRow}
                      className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة صباح</span>
                    </button>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#c7832e] text-white">
                          <th className="border border-[#a86b24] px-2 py-1.5 font-bold w-[115px] sticky right-0 bg-[#92400e] z-10">
                            <Clock className="w-3 h-3 inline ml-1" /> التوقيت
                          </th>
                          {WEEK_DAYS.map((day) => (
                            <th
                              key={day}
                              className="border border-[#78350f] px-1 py-1.5 font-bold min-w-[68px] text-center text-[10px]"
                            >
                              {day}
                            </th>
                          ))}
                          <th className="border border-[#78350f] w-[28px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {morningRows.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-3 text-[11px] text-zinc-400">
                              لا توجد حصص صباحية - اضغط إضافة صباح
                            </td>
                          </tr>
                        )}
                        {morningRows.map((row) => (
                          <tr key={row.id} className="bg-white hover:bg-amber-50/60 transition-colors">
                            <td className="border border-zinc-200 p-0.5 sticky right-0 bg-inherit z-10">
                              <select
                                value={row.time}
                                onChange={(e) => handleTimeChange(row.id, e.target.value, 'morning')}
                                className="w-full bg-white border border-amber-200 rounded-md px-1 py-1.5 text-[11px] font-mono font-bold text-center outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                {MORNING_PERIODS.map((t) => (
                                  <option key={t} value={t}>
                                    {t.replace(/\s*-\s*/, ' ➔ ')}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {WEEK_DAYS.map((day) => {
                              const cellVal = row.cells[day] || '';
                              const lvl = detectLevelFromSection(cellVal);
                              let colorCls = 'bg-white border-zinc-200 text-zinc-700 placeholder:text-zinc-300';
                              if (cellVal) {
                                if (lvl === '4م') colorCls = 'bg-red-50 border-red-200 text-red-800';
                                else if (lvl === '3م') colorCls = 'bg-amber-50 border-amber-200 text-amber-800';
                                else if (lvl === '2م') colorCls = 'bg-blue-50 border-blue-200 text-blue-800';
                                else colorCls = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                              }
                              return (
                                <td key={day} className="border border-zinc-200 p-0.5">
                                  <input
                                    list="sections-list"
                                    value={cellVal}
                                    onChange={(e) => handleCellChange(row.id, day, e.target.value)}
                                    placeholder="—"
                                    className={`w-full rounded-md px-1 py-1.5 text-[11px] font-bold text-center outline-none border focus:ring-2 focus:ring-amber-200 transition ${colorCls}`}
                                  />
                                </td>
                              );
                            })}
                            <td className="border border-zinc-200 p-0.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteGridRow(row.id)}
                                className="w-6 h-6 grid place-items-center rounded hover:bg-white text-zinc-400 hover:text-red-600 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lunch Break Banner */}
                <div className="bg-[#fffbeb] border-y-2 border-amber-300 border-dashed py-1.5 px-3 flex items-center justify-center gap-2 text-[11px] font-extrabold text-amber-800">
                  <span>🍽️</span>
                  <span>استراحة الغداء 12:00 - 13:30 - الفترة محجوزة للراحة</span>
                  <span className="text-[9px] bg-white border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    لا يمكن إضافة 12:30 أو 13:00
                  </span>
                </div>

                {/* Afternoon Shift */}
                <div>
                  <div className="bg-gradient-to-l from-indigo-50 to-violet-50 border-b border-indigo-200 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-[12px] text-indigo-900">
                      <Moon className="w-4 h-4 text-indigo-600" />
                      <span>🌙 الفترة المسائية (13:30-17:30)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAfternoonRow}
                      className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة مساء</span>
                    </button>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#5b6fb5] text-white">
                          <th className="border border-[#465995] px-2 py-1.5 font-bold w-[115px] sticky right-0 bg-[#312e81] z-10">
                            <Clock className="w-3 h-3 inline ml-1" /> التوقيت
                          </th>
                          {WEEK_DAYS.map((day) => (
                            <th
                              key={day}
                              className="border border-[#1e1b4b] px-1 py-1.5 font-bold min-w-[68px] text-center text-[10px]"
                            >
                              {day}
                            </th>
                          ))}
                          <th className="border border-[#1e1b4b] w-[28px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {afternoonRows.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-3 text-[11px] text-zinc-400">
                              لا توجد حصص مسائية - اضغط إضافة مساء
                            </td>
                          </tr>
                        )}
                        {afternoonRows.map((row) => (
                          <tr key={row.id} className="bg-white hover:bg-[#eef2ff] transition-colors">
                            <td className="border border-zinc-200 p-0.5 sticky right-0 bg-inherit z-10">
                              <select
                                value={row.time}
                                onChange={(e) => handleTimeChange(row.id, e.target.value, 'afternoon')}
                                className="w-full bg-white border border-indigo-200 rounded-md px-1 py-1.5 text-[11px] font-mono font-bold text-center outline-none focus:ring-2 focus:ring-indigo-300"
                              >
                                {AFTERNOON_PERIODS.map((t) => (
                                  <option key={t} value={t}>
                                    {t.replace(/\s*-\s*/, ' ➔ ')}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {WEEK_DAYS.map((day) => {
                              const cellVal = row.cells[day] || '';
                              const lvl = detectLevelFromSection(cellVal);
                              let colorCls = 'bg-white border-zinc-200 text-zinc-700 placeholder:text-zinc-300';
                              if (cellVal) {
                                if (lvl === '4م') colorCls = 'bg-red-50 border-red-200 text-red-800';
                                else if (lvl === '3م') colorCls = 'bg-amber-50 border-amber-200 text-amber-800';
                                else if (lvl === '2م') colorCls = 'bg-blue-50 border-blue-200 text-blue-800';
                                else colorCls = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                              }
                              return (
                                <td key={day} className="border border-zinc-200 p-0.5">
                                  <input
                                    list="sections-list"
                                    value={cellVal}
                                    onChange={(e) => handleCellChange(row.id, day, e.target.value)}
                                    placeholder="—"
                                    className={`w-full rounded-md px-1 py-1.5 text-[11px] font-bold text-center outline-none border focus:ring-2 focus:ring-indigo-200 transition ${colorCls}`}
                                  />
                                </td>
                              );
                            })}
                            <td className="border border-zinc-200 p-0.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteGridRow(row.id)}
                                className="w-6 h-6 grid place-items-center rounded hover:bg-white text-zinc-400 hover:text-red-600 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Streamlined Quick Level Presets & Timetable Utilities */}
                <div className="p-2.5 bg-emerald-50/70 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[210px]">
                    <ListFilter className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                    <span className="font-bold text-emerald-900 shrink-0">نماذج إسناد:</span>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'auto15') handleAutoFillGrid();
                        else if (val === '1-4') handleQuickAssignPreset(['1م', '4م']);
                        else if (val === '2-3') handleQuickAssignPreset(['2م', '3م']);
                        else if (val === '4') handleQuickAssignPreset(['4م']);
                        else if (val === 'all') handleQuickAssignPreset(['1م', '2م', '3م', '4م']);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="bg-white border border-emerald-300 rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-900 outline-none w-full cursor-pointer focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="" disabled>⚡ اختر نموذج إسناد لتعبئة سريعة...</option>
                      <option value="auto15">⭐ نموذج 15 ساعة رسمي (جماعي + أفواج)</option>
                      <option value="1-4">1م + 4م فقط</option>
                      <option value="2-3">2م + 3م فقط</option>
                      <option value="4">4م (شهادة التعليم المتوسط) فقط</option>
                      <option value="all">كافة المستويات (1م إلى 4م)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleClearGrid}
                      className="inline-flex items-center gap-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer"
                      title="مسح جدول استعمال الزمن"
                    >
                      <Eraser className="w-3.5 h-3.5 text-zinc-400" />
                      <span>مسح</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaultGrid}
                      className="inline-flex items-center gap-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer"
                      title="استعادة الجدول الافتراضي"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                      <span>افتراضي</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Holidays Card */}
            <div className="rounded-xl border border-zinc-200 overflow-hidden">
              <div className="bg-zinc-50 px-4 py-2.5 flex items-center justify-between text-[13px] font-bold border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-700" />
                  <span>الرزنامة الرسمية (العطل والفروض والاختبارات)</span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadOfficialCalendar}
                  className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-300 font-bold px-2 py-0.5 rounded cursor-pointer"
                  title="تحميل العطل والفروض والاختبارات الرسمية بنقرة واحدة"
                >
                  تحميل الرزنامة الرسمية
                </button>
              </div>
              <div className="p-3 space-y-2 max-h-[220px] overflow-auto">
                <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  الجمعة عطلة تلقائية. الفروض والاختبارات تُدرج في الدفتر كتقويم، والعطل تُستثنى دون تقديم المنهاج.
                </div>
                {holidays.length === 0 && (
                  <div className="text-[11px] text-zinc-500 text-center py-2">
                    لا توجد مناسبات مضافة. انقر «تحميل الرزنامة الرسمية» لإضافتها فوراً.
                  </div>
                )}
                {holidays.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[11px] border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <span className="font-mono text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                      {h.startDate} {h.endDate && h.endDate !== h.startDate ? ' - ' + h.endDate : ''}
                    </span>
                    <span className="flex-1 font-medium text-zinc-800">{h.label}</span>
                    {h.type === 'test' ? (
                      <span className="text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">فرض</span>
                    ) : h.type === 'exam' ? (
                      <span className="text-[9.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded">اختبار</span>
                    ) : h.type === 'official_exam' ? (
                      <span className="text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded">امتحان رسمي</span>
                    ) : (
                      <span className="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">عطلة</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setHolidays((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newHolidayStartDate}
                    onChange={(e) => setNewHolidayStartDate(e.target.value)}
                    className="border border-zinc-200 rounded-lg px-2 py-1.5 text-[12px] bg-white outline-none"
                    title="تاريخ البداية"
                  />
                  <input
                    type="date"
                    value={newHolidayEndDate}
                    onChange={(e) => setNewHolidayEndDate(e.target.value)}
                    className="border border-zinc-200 rounded-lg px-2 py-1.5 text-[12px] bg-white outline-none"
                    title="تاريخ النهاية (اختياري)"
                  />
                </div>
                <div className="grid grid-cols-[110px_1fr_auto] gap-2">
                  <select
                    value={newHolidayType}
                    onChange={(e) => setNewHolidayType(e.target.value as CalendarEventType)}
                    className="border border-zinc-200 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white outline-none"
                  >
                    <option value="holiday">عطلة مدرسية</option>
                    <option value="test">فرض محروس</option>
                    <option value="exam">اختبار فصلي</option>
                    <option value="official_exam">امتحان رسمي</option>
                  </select>
                  <input
                    value={newHolidayLabel}
                    onChange={(e) => setNewHolidayLabel(e.target.value)}
                    placeholder="اسم المناسبة..."
                    className="border border-zinc-200 rounded-lg px-2 py-1.5 text-[12px] bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddHoliday}
                    className="bg-white border border-zinc-300 rounded-lg px-3 text-[11px] font-bold hover:bg-zinc-50 cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Generator Card */}
            <div className="rounded-xl border-2 border-[#064e3b]/20 bg-[#f0fdf4] overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 text-[13px] font-extrabold border-b border-emerald-100 text-[#064e3b]">
                <Sparkles className="w-4 h-4" />
                <span>المولد الذكي وفق المنهاج الوزاري</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">المدة المطلوبة</label>
                    <select
                      value={period}
                      onChange={(e) => {
                        const newPeriod = e.target.value;
                        setPeriod(newPeriod);
                        if (startDate) {
                          const fresh = generateAndApplyLogbook(startDate, newPeriod, sessionsPerActivity);
                          if (fresh.length > 0) {
                            showToast(`تم تحديث الدفتر لمدة ${newPeriod} انطلاقاً من ${startDate} 🇩🇿`);
                          }
                        }
                      }}
                      className="w-full border border-zinc-200 rounded-lg px-2 py-2 text-[12px] font-bold bg-white outline-none"
                    >
                      <option>أسبوع</option>
                      <option>أسبوعين</option>
                      <option>شهر</option>
                      <option>فصل</option>
                      <option>سنة</option>
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {period === 'سنة' ? '365 يوماً تقويمياً' : `${targetDaysCount} يوم تقويمي`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">الحصص المطلوبة لكل نشاط</label>
                    <select
                      value={sessionsPerActivity}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setSessionsPerActivity(val);
                        if (startDate) {
                          const fresh = generateAndApplyLogbook(startDate, period, val);
                          if (fresh.length > 0) {
                            showToast(`تم توزيع النشاط على ${val} حصة انطلاقاً من ${startDate} 🇩🇿`);
                          }
                        }
                      }}
                      className="w-full border border-zinc-200 rounded-lg px-2 py-2 text-[12px] font-bold bg-white outline-none"
                    >
                      <option value={1}>1 حصة لكل نشاط (افتراضي)</option>
                      <option value={2}>حصتان متتاليتان لكل نشاط (2)</option>
                      <option value={3}>3 حصص متتالية لكل نشاط (3)</option>
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      توزيع النشاط على حصص متتابعة
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">تاريخ الدخول المدرسي (مرجع تقدير تسلسل الدروس)</label>
                  <input type="date" value={sequenceStartDate} onChange={(e) => setSequenceStartDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-2 py-2 text-[12px] bg-white outline-none" />
                  <p className="text-[10px] text-zinc-500 mt-1">يُقدَّر تقدم الدروس وفق استعمال الزمن والعطل؛ اضغط توليد بعد تعديل المرجع.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">
                      📅 تاريخ بداية الدفتر (تاريخ الانطلاق الفعلي)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setStartDate(selectedDate);
                        if (selectedDate) {
                          const fresh = generateAndApplyLogbook(selectedDate, period, sessionsPerActivity);
                          if (fresh.length > 0) {
                            showToast(`تم توليد الدفتر انطلاقاً من: ${selectedDate} (${fresh.length} حصة) بنجاح 🇩🇿`);
                          } else {
                            showToast('لم تُولّد حصص لهذا التاريخ. تحقق من استعمال الزمن أو الرزنامة.');
                          }
                        }
                      }}
                      className="w-full border border-emerald-300 rounded-lg px-2 py-2 text-[12px] bg-white outline-none font-bold text-[#064e3b] focus:ring-2 focus:ring-emerald-400"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      تبدأ الحصص من التاريخ المحدد أو أول يوم مبرمج بعده، مع مراعاة العطل ({startDate || 'غير محدد'})
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">وضعية الصفحة</label>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                      className="w-full border border-zinc-200 rounded-lg px-2 py-2 text-[12px] bg-white outline-none font-bold"
                    >
                      <option value="portrait">عمودي</option>
                      <option value="landscape">أفقي</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-white p-3 space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[12px] font-extrabold text-[#064e3b] flex items-center gap-1.5">
                      <FileStack className="w-3.5 h-3.5" />
                      <span>إجراءات الدفتر</span>
                    </div>
                    {rows.length > 0 && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        {rows.length} حصة • {paginatedPages.length} صفحة
                      </span>
                    )}
                  </div>

                  {/* Primary Generation & Preview Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateSmartLogbook}
                      className="bg-gradient-to-r from-[#064e3b] to-emerald-800 hover:from-[#042f24] hover:to-emerald-900 text-white rounded-xl py-2.5 px-3 text-[12px] font-black flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>توليد الدفتر الذكي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPreview('all')}
                      className="bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl py-2.5 px-3 text-[12px] font-black flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-sky-200" />
                      <span>المعاينة والتصدير (A4)</span>
                    </button>
                  </div>

                  {/* Secondary Tools: Add manual, Merge labs, Clear */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-zinc-100 text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setManualLessonDate(startDate || getDefaultNotebookStartDate(config.schoolYear || '2026-2027')); setIsAddLessonModalOpen(true); }}
                      className="bg-zinc-50 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-900 border border-zinc-200 rounded-lg py-1.5 font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="إضافة حصة يدوية أو تسجيل غياب الأستاذ أو تغيير"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ حصة / غياب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!rows.length) {
                          showToast('الدفتر فارغ حالياً.');
                          return;
                        }
                        const beforeCount = rows.length;
                        const merged = mergeConsecutiveGroupEntries(rows);
                        setRows(merged);
                        const diff = beforeCount - merged.length;
                        if (diff > 0) showToast(`تم دمج ${diff} حصة للأفواج (ف1+ف2) ✅`);
                        else showToast('الحصص مدمجة بالفعل وفق نظام الأفواج ✅');
                      }}
                      className="bg-zinc-50 hover:bg-teal-50 text-zinc-700 hover:text-teal-900 border border-zinc-200 rounded-lg py-1.5 font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="دمج حصص الأفواج ف1 وف2 في خانة واحدة"
                    >
                      <TableIcon className="w-3.5 h-3.5 text-teal-600" />
                      <span>دمج الأفواج</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!rows.length && !archivedRows.length) return;
                        if (window.confirm('هل تريد مسح سجلات الدفتر والتعديلات اليدوية المؤرشفة؟')) {
                          setRows([]);
                          setArchivedRows([]);
                          showToast('تم مسح سجلات الدفتر اليومي');
                        }
                      }}
                      className="bg-zinc-50 hover:bg-red-50 text-zinc-500 hover:text-red-700 border border-zinc-200 rounded-lg py-1.5 font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="مسح سجلات الدفتر"
                    >
                      <Eraser className="w-3.5 h-3.5 text-zinc-400" />
                      <span>مسح الدفتر</span>
                    </button>
                  </div>
                </div>

                {showEmptyWarning && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[12px] font-bold rounded-xl px-3 py-2 text-center animate-pulse">
                    ⚠️ يجب توليد الدفتر أولاً قبل فتح المعاينة
                  </div>
                )}

                {rows.length > 0 && (
                  <div className="text-[11px] text-center bg-white border border-emerald-200 rounded-lg py-2 font-bold text-[#064e3b] space-y-1">
                    <div>
                      {rows.length} حصة • {paginatedPages.length} صفحة • A4 • تقسيم ذكي حسب عدد الحصص • حتى 12 حصة في الصفحة • {orientation === 'landscape' ? 'أفقي' : 'عمودي'}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-medium">
                      المستويات المسندة في الدفتر: {levelDistributionSummary}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* Main Printable Area */}
        <main className={`bg-[#edf9f6] p-2 md:p-6 lg:p-8 ${isPreviewModalOpen ? 'print:hidden' : ''}`}>
          <div id="pages-start" className="no-print mb-4 flex items-center justify-between gap-2 text-[12px] text-zinc-600">
            <div className="flex items-center gap-2">
              <FileStack className="w-4 h-4 text-[#064e3b]" />
              <span>
                معاينة الدفتر اليومي ({paginatedPages.length} صفحة) — A4 • تقسيم ذكي حسب عدد الحصص • حتى 12 حصة في الصفحة • {orientation === 'landscape' ? 'أفقي' : 'عمودي'} •{' '}
                {paginatedPages.length > 0 ? formatPageNumberLabel(0, paginatedPages.length) : 'جاهز للتوليد'}
              </span>
            </div>
            {assignedLevels.length > 0 && (
              <span className="bg-white border border-zinc-300 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#064e3b]">
                الأقسام المسندة: {assignedLevels.join('، ')}
              </span>
            )}
          </div>



          {/* Empty State Card */}
          {paginatedPages.length === 0 && (
            <div
              className="bg-white rounded-[20px] border-2 border-dashed border-zinc-300 p-10 text-center shadow-sm mx-auto"
              style={{ width: `${pageDimensions.w}mm`, maxWidth: '100%', minHeight: '340px' }}
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-[#064e3b] text-white grid place-items-center mb-4 text-[20px]">
                🇩🇿
              </div>
              <h3 className="font-extrabold text-[16px] text-zinc-900">
                الدفتر فارغ حالياً - بانتظار التوليد الذكي
              </h3>
              <p className="text-[12px] text-zinc-600 mt-2 leading-6 max-w-[480px] mx-auto font-medium">
                اضبط جدول الحصص في الشريط الجانبي (المستويات المسندة:{' '}
                <b>{assignedLevels.length > 0 ? assignedLevels.join('، ') : 'أدخل قسماً'}</b>)، ثم اختر المدة واضغط{' '}
                <b className="text-[#064e3b]">«توليد الدفتر الذكي»</b>. لن تظهر في الدفتر إلا السنوات المسندة لك فقط!
              </p>

              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-[11px] font-bold">
                  A4 • تقسيم ذكي حسب عدد الحصص
                </span>
                <span className="bg-white border border-zinc-300 px-3 py-1 rounded-full text-[11px] font-bold text-zinc-700">
                  وفق المنهاج والتدرج الوزاري الرسمي
                </span>
                <span className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-[11px] font-bold">
                  صباح 08-12 | مساء 13:30-17:30
                </span>
              </div>

              <div className="mt-4 inline-flex flex-wrap gap-2 text-[11px]">
                {(['1م', '2م', '3م', '4م'] as const).map((lvl) => {
                  const isAssigned = assignedLevels.includes(lvl);
                  return (
                    <span
                      key={lvl}
                      className={`px-3 py-1 rounded-full border font-bold transition ${
                        isAssigned
                          ? lvl === '4م'
                            ? 'bg-red-50 border-red-300 text-red-800 ring-2 ring-red-200'
                            : lvl === '3م'
                            ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-200'
                            : lvl === '2م'
                            ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-200'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-200'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-400 opacity-60'
                      }`}
                    >
                      {lvl}: {CURRICULUM_DATABASE[lvl].length} مورد{' '}
                      {isAssigned ? '(مسندة للأستاذ ✅)' : '(غير مسندة ⛔)'}
                    </span>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleGenerateSmartLogbook}
                  className="bg-gradient-to-r from-[#064e3b] to-emerald-700 hover:from-[#042f24] hover:to-emerald-800 text-white rounded-xl py-3 px-6 text-[13px] font-black flex items-center gap-2.5 shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>توليد الدفتر اليومي الذكي</span>
                </button>
              </div>
            </div>
          )}

          {/* Render Pages */}
          <div className="w-full overflow-x-auto flex flex-col items-center py-2 px-0 sm:px-2">
            <div className="w-full flex flex-col items-center space-y-6 sm:space-y-8 max-w-[210mm]">
              {renderNotebookIntroPage(false)}
              {renderCoverFirstPage()}
              {paginatedPages.map((pageRows, pageIdx) => (
                <DailyLogSheetTemplate
                  key={`page-${pageIdx}`}
                  pageRows={pageRows}
                  allRows={rows}
                  pageIndex={pageIdx}
                  totalPages={paginatedPages.length}
                  config={config}
                  assignedLevels={assignedLevels}
                  startDate={startDate}
                  pageDimensions={pageDimensions}
                  buildHierarchicalContent={buildHierarchicalContent}
                  findPreviousComparableCurriculumRow={findPreviousComparableCurriculumRow}
                  getSchoolWeekKey={getSchoolWeekKey}
                  getSchoolWeekNumber={getSchoolWeekNumber}
                  formatLogbookDateLabel={formatLogbookDateLabel}
                  onUpdateRow={handleUpdateLogbookRow}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Curriculum Database Elements Modal */}
      {isElementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setIsElementsModalOpen(false)} />
          <div className="relative bg-white rounded-[18px] shadow-2xl w-full max-w-[760px] max-h-[85vh] overflow-hidden border border-zinc-200">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#064e3b]" />
                <h3 className="font-extrabold text-[15px] text-zinc-900">
                  المناهج والموارد التعليمية المعتمدة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsElementsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-200/70 hover:bg-zinc-300 grid place-items-center text-zinc-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs inside Modal */}
            <div className="p-4 bg-[#f0fdf4] border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModalFilterLevel('assigned')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    modalFilterLevel === 'assigned'
                      ? 'bg-[#064e3b] text-white shadow-xs'
                      : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  المستويات المسندة فقط ({assignedLevels.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilterLevel('all')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    modalFilterLevel === 'all'
                      ? 'bg-[#064e3b] text-white shadow-xs'
                      : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  عرض كافة السنوات (1م، 2م، 3م، 4م)
                </button>
              </div>

              <div className="text-[11px] text-zinc-600 font-medium">
                إجمالي وحدات التعلم: <b>{(['1م', '2م', '3م', '4م'] as const).reduce((sum, lvl) => sum + CURRICULUM_DATABASE[lvl].length, 0)} وحدة</b>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-auto max-h-[60vh] space-y-5">
              {(['1م', '2م', '3م', '4م'] as const)
                .filter((lvl) => (modalFilterLevel === 'assigned' ? assignedLevels.includes(lvl) : true))
                .map((lvl) => {
                  const isAssigned = assignedLevels.includes(lvl);
                  return (
                    <div key={lvl} className="rounded-xl border border-zinc-200 overflow-hidden shadow-2xs">
                      <div
                        className={`px-4 py-2.5 font-extrabold text-[13px] flex items-center justify-between ${
                          lvl === '4م'
                            ? 'bg-red-50 text-red-900 border-b border-red-200'
                            : lvl === '3م'
                            ? 'bg-amber-50 text-amber-900 border-b border-amber-200'
                            : lvl === '2م'
                            ? 'bg-blue-50 text-blue-900 border-b border-blue-200'
                            : 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{LEVEL_NAMES_MAP[lvl]}</span>
                          {isAssigned ? (
                            <span className="text-[10px] bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              مسند للأستاذ ✅
                            </span>
                          ) : (
                            <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                              غير مسند ⛔
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] bg-white border px-2.5 py-0.5 rounded-full font-bold">
                          {CURRICULUM_DATABASE[lvl].length} مورد تعليمي
                        </span>
                      </div>

                      <div className="divide-y divide-zinc-100 max-h-[220px] overflow-auto">
                        {CURRICULUM_DATABASE[lvl].map((res, resIdx) => (
                          <div key={resIdx} className="px-4 py-2.5 text-[11px] leading-relaxed flex items-start gap-3 hover:bg-zinc-50 transition">
                            <span className="font-mono text-[10px] bg-zinc-900 text-white w-5 h-5 grid place-items-center rounded-full shrink-0 mt-0.5">
                              {resIdx + 1}
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <div className="font-bold text-zinc-900">{res.mawrid}</div>
                              <div className="text-[10px] text-zinc-600">الميدان: {res.midan}</div>
                              <div className="text-[10px] text-zinc-600">المقطع: {res.maqta}</div>
                              <div className="text-[10px] text-zinc-600">المورد التعلمي: {res.mawrid}</div>
                              <div className="text-[10px] text-zinc-600">تعلم المورد: {res.ta3alom}</div>
                              {res.activities.length > 0 && (
                                <div className="text-[10px] text-[#064e3b] font-medium">
                                  الأنشطة: {res.activities.slice(0, 2).join(' + ')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-zinc-600">
                <b>آلية التوليد البيداغوجي الذكي:</b> عند إدراج قسم في جدول التوقيت (مثل 1م1 أو 4م2)، يستخرج النظام المستوى التعليمي، ويسحب المورد التالي بالترتيب الرسمي وفق التدرج السنوي الرسمي للتعلمات لمادة علوم الطبيعة والحياة (الدفتر مستقل عن المذكرات).
                <b> السنوات التي لا تدرسها لن تظهر في دفترك اليومي إطلاقاً</b>، مما يحقق الدقة والتنظيم التام.
              </div>
            </div>

            <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsElementsModalOpen(false)}
                className="bg-zinc-900 text-white rounded-xl px-5 py-2 text-[12px] font-bold hover:bg-zinc-800 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Print & Preview Modal */}
      {isPreviewModalOpen && (
        <div className={`fixed inset-0 z-[100] flex flex-col bg-[#1f2937] print-preview-root print-orientation-${orientation}`} dir="rtl">
          {/* Preview Modal Header */}
          <div className="preview-controls h-[56px] bg-[#111827] border-b border-zinc-700 flex items-center justify-between px-3 md:px-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-[#111827] grid place-items-center font-extrabold text-[14px]">
                👁️
              </div>
              <div>
                <div className="text-white font-extrabold text-[13px] md:text-[14px] leading-none flex items-center gap-2">
                  <span>معاينة الطباعة الرسمية - {paginatedPages.length + 2} صفحات</span>
                  {previewMode === 'single' && (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      صفحة واحدة (عينة)
                    </span>
                  )}
                </div>
                <div className="text-zinc-400 text-[10px] mt-1 hidden md:block">
                  A4 • {ROWS_PER_PAGE} سطر • المستويات المسندة: {assignedLevels.join('، ') || '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              

              <button
                type="button"
                onClick={handleExportWord}
                className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-bold transition shadow-sm cursor-pointer"
                title="تصدير كملف Word كامل وطبق الأصل"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تصدير</span> Word
              </button>
              <button
                type="button"
                onClick={handlePrintLogbook}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-[#064e3b] px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-bold transition shadow-sm cursor-pointer"
                title="طباعة الدفتر مباشرة"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 bg-[#006233] hover:bg-[#0f7f74] text-white px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-bold transition shadow-sm cursor-pointer"
                title="تصدير كملف PDF عالي الجودة"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <div className="flex items-center bg-[#1f2937] border border-zinc-600 rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((v) => Math.max(25, v - 10))}
                  className="w-6 h-6 sm:w-7 sm:h-7 grid place-items-center rounded-full hover:bg-zinc-700 text-white transition cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10.5px] font-bold text-white min-w-[36px] text-center font-mono">
                  {previewZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((v) => Math.min(150, v + 10))}
                  className="w-6 h-6 sm:w-7 sm:h-7 grid place-items-center rounded-full hover:bg-zinc-700 text-white transition cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewZoom(calculateOptimalFitZoom())}
                className="hidden xs:inline-flex items-center text-[10.5px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 px-2 py-1 rounded-full font-bold transition cursor-pointer"
                title="ملاءمة حجم الصفحة تلقائياً مع شاشة جهازك"
              >
                ملاءمة
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 grid place-items-center bg-zinc-700 hover:bg-zinc-600 text-white rounded-full transition cursor-pointer"
                title="إغلاق المعاينة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview Scrollable Stage */}
          <div className="flex-1 overflow-auto preview-scroll p-4 md:p-8 bg-[#1f2937]">
            {paginatedPages.length === 0 ? (
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#111827] border border-zinc-700 grid place-items-center text-[32px] mb-4">
                  📄
                </div>
                <h3 className="text-white font-extrabold text-[18px]">لا يوجد دفتر للمعاينة</h3>
                <p className="text-zinc-400 text-[13px] mt-2 max-w-[320px] leading-6">
                  يجب توليد الدفتر أولاً من لوحة التحكم. اضبط استعمال الزمن والمدة ثم اضغط توليد الدفتر الذكي.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="mt-6 bg-white text-zinc-900 px-6 py-2 rounded-full text-[13px] font-bold cursor-pointer hover:bg-zinc-100"
                >
                  العودة وضبط الجدول
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-8 md:gap-10 w-full"
                style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
              >
                {renderNotebookIntroPage(true)}
                {React.cloneElement(renderCoverFirstPage(), { 'data-preview-export-page': 'true' })}
                {previewPagesToDisplay.map((pageRows, pageIdx) => (
                  <DailyLogSheetTemplate
                    key={`preview-page-${pageIdx}`}
                    pageRows={pageRows}
                    allRows={rows}
                    pageIndex={previewMode === 'single' ? 0 : pageIdx}
                    totalPages={paginatedPages.length}
                    config={config}
                    assignedLevels={assignedLevels}
                    startDate={startDate}
                    pageDimensions={pageDimensions}
                    buildHierarchicalContent={buildHierarchicalContent}
                    findPreviousComparableCurriculumRow={findPreviousComparableCurriculumRow}
                    getSchoolWeekKey={getSchoolWeekKey}
                    getSchoolWeekNumber={getSchoolWeekNumber}
                    formatLogbookDateLabel={formatLogbookDateLabel}
                    onUpdateRow={handleUpdateLogbookRow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timetable Standalone Official Modal */}
      {isTimetableModalOpen && (
        <div className="timetable-print-root fixed inset-0 z-[110] flex flex-col bg-[#1f2937]/90 backdrop-blur-sm print:bg-white print:p-0 print:m-0" dir="rtl">
          {/* Top Bar (hidden during print) */}
          <div className="no-print h-[56px] bg-[#111827] border-b border-zinc-700 flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white grid place-items-center font-extrabold text-[14px]">
                <TableIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-[14px]">
                  جدول استعمال الزمن الأسبوعي للأستاذ
                </h3>
                <p className="text-zinc-400 text-[11px]">
                  الوثيقة الرسمية المنظمة للحصص • {totalFilledTimetableSlots} حصة أسبوعياً
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveTimetable}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-full text-[11px] font-black shadow-sm transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ استعمال الزمن</span>
              </button>
              <button
                type="button"
                onClick={handlePrintTimetable}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-[#064e3b] px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
              <button
                type="button"
                onClick={handleExportTimetablePdf}
                className="inline-flex items-center gap-1.5 bg-[#006233] hover:bg-[#0f7f74] text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportTimetableWord}
                className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>تحميل Word</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTimetableModalOpen(false)}
                className="w-8 h-8 grid place-items-center bg-zinc-700 hover:bg-zinc-600 text-white rounded-full transition cursor-pointer mr-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timetable Document Sheet */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-[#1f2937] print:p-0 print:bg-white">
            <div
              id="official-printable-timetable"
              className="bg-white shadow-[0_25px_80px_rgba(0,0,0,0.5)] rounded-[2px] p-8 w-[297mm] min-h-[210mm] max-w-full print:shadow-none print:w-full print:min-h-0 print:p-6 text-zinc-900 flex flex-col justify-between border border-zinc-200"
            >
              <div>
                {/* Algerian Top Flag Bar */}
                <div className="h-1.5 flex -mx-[2px] mb-4">
                  <div className="flex-1 bg-[#006233]" />
                  <div className="flex-1 bg-[#D21034]" />
                </div>

                {/* Republic Header */}
                <div className="text-center pb-3 border-b-2 border-emerald-900/20">
                  <div className="text-[14px] font-black flex items-center justify-center gap-2 text-zinc-900">
                    <span>🇩🇿</span> الجمهورية الجزائرية الديمقراطية الشعبية
                  </div>
                  <div className="text-[12px] font-bold text-zinc-700 mt-0.5">وزارة التربية الوطنية</div>
                </div>

                {/* Teacher & Institution Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#f0fdf4] border border-emerald-200 rounded-xl p-3 my-4 text-[11px]">
                  <div>
                    <span className="text-zinc-500 font-medium">مديرية التربية لولاية:</span>{' '}
                    <b className="text-zinc-800">{wilaya || config.directorate || '—'}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">المتوسطة:</span>{' '}
                    <b className="text-zinc-800">{school || config.schoolName || '—'}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">الأستاذ(ة):</span>{' '}
                    <b className="text-zinc-800">{teacher || config.teacherName || '—'}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">المادة:</span>{' '}
                    <b className="text-emerald-900">علوم الطبيعة والحياة</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">الرتبة:</span>{' '}
                    <b className="text-zinc-800">{config.teacherGrade || 'أستاذ التعليم المتوسط'}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">السنة الدراسية:</span>{' '}
                    <b className="text-zinc-800">{config.schoolYear || '2026-2027'}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">المستويات المسندة:</span>{' '}
                    <b className="text-zinc-800">{assignedLevels.join(' • ') || '—'}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">الحجم الساعي الأسبوعي:</span>{' '}
                    <b className="text-[#064e3b] font-mono text-[12px]">{totalFilledTimetableSlots} ساعة</b>
                  </div>
                </div>

                {/* Document Title Banner */}
                <div className="bg-[#064e3b] text-white text-center py-2 px-4 rounded-lg font-black text-[14px] mb-4 shadow-sm flex items-center justify-between">
                  <span>جدول استعمال الزمن الأسبوعي الرسمي للأستاذ</span>
                  <span className="text-[11px] bg-white/20 px-3 py-0.5 rounded-full font-bold">
                    نظام الدوام بفترتين: صباحية ومسائية
                  </span>
                </div>

                {/* Timetable Table */}
                <table className="w-full border-collapse border-2 border-emerald-900/30 text-[11px] text-center mb-5">
                  <thead>
                    <tr className="bg-[#064e3b] text-white font-extrabold text-[11px]">
                      <th className="border border-emerald-800 px-3 py-2 w-[120px]">اليوم \ التوقيت</th>
                      {gridRows.map((r) => (
                        <th key={r.id} className="border border-emerald-800 px-2 py-2 font-mono">
                          {(r.time || '').replace(/\s*-\s*/, ' ➔ ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEK_DAYS.map((day, idx) => (
                      <tr key={day} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/70'}>
                        <td className="border border-zinc-300 font-black bg-emerald-50 text-emerald-950 px-3 py-2 text-[12px]">
                          {day}
                        </td>
                        {gridRows.map((r) => {
                          const val = r.cells[day] || '';
                          const lvl = detectLevelFromSection(val);
                          let colorStyle = 'text-zinc-300';
                          if (val) {
                            if (lvl === '4م') colorStyle = 'bg-red-50 text-red-900 font-black border-red-300';
                            else if (lvl === '3م') colorStyle = 'bg-amber-50 text-amber-900 font-black border-amber-300';
                            else if (lvl === '2م') colorStyle = 'bg-blue-50 text-blue-900 font-black border-blue-300';
                            else colorStyle = 'bg-emerald-50 text-emerald-900 font-black border-emerald-300';
                          }
                          return (
                            <td key={r.id} className={`border border-zinc-300 p-2 text-center text-[12px] font-bold ${colorStyle}`}>
                              {val || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Breakdown Summary */}
                <div className="grid grid-cols-5 gap-2 text-center text-[10px] mb-6">
                  {levelStats.map((item) => (
                    <div key={item.level} className={`rounded-lg border p-2 ${levelColors[item.level] || 'border-zinc-200 bg-zinc-50'}`}>
                      <div className="font-black text-[12px]">{item.level}</div>
                      <div className="font-bold mt-0.5">{item.slots} ساعة أسبوعياً</div>
                      <div className="text-[9px] text-zinc-500">{item.sections} قسم</div>
                    </div>
                  ))}
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2 text-emerald-950">
                    <div className="font-black text-[12px]">المجموع الكلي</div>
                    <div className="font-extrabold text-[13px] text-[#064e3b] mt-0.5 font-mono">{totalFilledTimetableSlots} ساعة</div>
                    <div className="text-[9px] text-emerald-700">{assignedSectionsList.length} أقسام مسندة</div>
                  </div>
                </div>
              </div>

              {/* Official Signatures Section */}
              <div className="border-t-2 border-dashed border-zinc-300 pt-4 mt-6">
                <div className="grid grid-cols-3 gap-6 text-center text-[11px]">
                  <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 min-h-[90px] flex flex-col justify-between">
                    <div className="font-extrabold text-zinc-800">تأشيرة وتوقيع الأستاذ(ة)</div>
                    <div className="text-[9px] text-zinc-400 mt-6">التاريخ: ........................</div>
                  </div>
                  <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 min-h-[90px] flex flex-col justify-between">
                    <div className="font-extrabold text-zinc-800">تأشيرة وتوقيع السيد مدير المؤسسة</div>
                    <div className="text-[9px] text-zinc-400 mt-6">التاريخ: ........................</div>
                  </div>
                  <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 min-h-[90px] flex flex-col justify-between">
                    <div className="font-extrabold text-zinc-800">تأشيرة السيد مفتش التعليم المتوسط</div>
                    <div className="text-[9px] text-zinc-400 mt-6">التاريخ: ........................</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-zinc-400 mt-4 pt-2 border-t border-zinc-100">
                  <span>وثيقة رسمية صادرة عن دفتر الأستاذ الرقمي 🇩🇿</span>
                  <span>الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Footer */}
      <footer className="no-print text-center text-[10px] text-zinc-500 py-6 border-t border-zinc-200 bg-white">
        الدفتر اليومي - استعمال زمن جدولي • A4 • {ROWS_PER_PAGE} سطر • علوم الطبيعة والحياة للطور المتوسط • 🇩🇿 •{' '}
        {totalFilledTimetableSlots} حصة أسبوعياً • {assignedLevels.length} مستويات مسندة
      </footer>
    </div>
  );
};