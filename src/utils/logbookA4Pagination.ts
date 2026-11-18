export type LogbookOrientation = 'portrait' | 'landscape';
export type LogbookTemplateKind = 'standard' | 'teal';

export interface LogbookPaginatableRow {
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
  lessonType?: string;
  taqwim?: string;
  moshkila?: string;
  manualContent?: string;
  [key: string]: any;
}

export interface PaginatedLogbookRow<T extends LogbookPaginatableRow = LogbookPaginatableRow> {
  row: T;
  /** Rendered content text computed with previousComparable context */
  estimatedHeightPx: number;
  /** True when a single oversized entry had to be split across pages */
  isSplitContinuation?: boolean;
  /** Non-empty when an oversized entry was split; template renders this instead of full row content */
  splitContentOverride?: string;
  /** Optional note override for split continuation slices */
  splitNoteOverride?: string;
}

export interface LogbookA4Page<T extends LogbookPaginatableRow = LogbookPaginatableRow> {
  pageIndex: number;
  rows: T[];
  usedHeightPx: number;
  availableHeightPx: number;
  emptyFillerRows: number;
  weekDividerCount: number;
}

export const A4_DIMENSIONS_MM: Record<LogbookOrientation, { w: number; h: number }> = {
  portrait: { w: 210, h: 297 },
  landscape: { w: 297, h: 210 },
};

const MM_TO_PX = 96 / 25.4;
export const STANDARD_FILLER_ROW_HEIGHT_PX = 28;
export const WEEK_DIVIDER_HEIGHT_PX = 24;

export function getAvailableBodyHeightPx(
  orientation: LogbookOrientation,
  template: LogbookTemplateKind
): number {
  const pageHeightPx = A4_DIMENSIONS_MM[orientation].h * MM_TO_PX;
  if (template === 'teal') {
    const chromePx = orientation === 'landscape' ? 165 : 185;
    return Math.max(320, Math.floor(pageHeightPx - chromePx));
  }
  const chromePx = orientation === 'landscape' ? 305 : 315;
  return Math.max(320, Math.floor(pageHeightPx - chromePx));
}

function getColumnCapacities(
  orientation: LogbookOrientation,
  template: LogbookTemplateKind
): { contentChars: number; noteChars: number; sectionChars: number } {
  if (template === 'teal') {
    return orientation === 'landscape'
      ? { contentChars: 72, noteChars: 34, sectionChars: 12 }
      : { contentChars: 50, noteChars: 24, sectionChars: 10 };
  }
  return orientation === 'landscape'
    ? { contentChars: 64, noteChars: 24, sectionChars: 12 }
    : { contentChars: 44, noteChars: 16, sectionChars: 10 };
}

export function estimateWrappedLines(value: unknown, charsPerLine: number): number {
  const plain = String(value ?? '').replace(/<[^>]*>/g, '');
  const normalized = plain.replace(/[^\S\n]+/g, ' ').trim();
  if (!normalized) return 1;
  return normalized
    .split('\n')
    .reduce((sum, part) => sum + Math.max(1, Math.ceil(part.trim().length / Math.max(1, charsPerLine))), 0);
}

export function estimateEntryHeightPx<T extends LogbookPaginatableRow>(
  row: T,
  renderedContent: string,
  orientation: LogbookOrientation,
  template: LogbookTemplateKind
): number {
  const { contentChars, noteChars, sectionChars } = getColumnCapacities(orientation, template);
  const contentLines = estimateWrappedLines(renderedContent, contentChars);
  const noteLines = estimateWrappedLines(row.note, noteChars);
  const sectionLines = estimateWrappedLines(row.section, sectionChars);

  const dateChips = String(row.dateStr || '').includes('/')
    ? String(row.dateStr).split('/').filter(Boolean).length
    : 1;
  const timeSlots = String(row.time || '').includes('/')
    ? String(row.time).split('/').filter(Boolean).length
    : 1;

  const lineHeightPx = template === 'teal' ? 14.5 : 15;
  const contentHeight = contentLines * lineHeightPx + (template === 'standard' && row.note?.includes('مخبري') ? 18 : 0);
  const noteHeight = noteLines * lineHeightPx;
  const metaHeight = Math.max(
    dateChips > 1 ? dateChips * 24 : 28,
    timeSlots > 1 ? timeSlots * 15 : 22,
    sectionLines * 15 + 8
  );

  const rowPaddingPx = 12;
  return Math.max(36, Math.ceil(Math.max(contentHeight, noteHeight, metaHeight) + rowPaddingPx));
}

function splitLongTextIntoSlices(
  text: string,
  maxLinesPerSlice: number,
  charsPerLine: number
): string[] {
  const rawLines = String(text || '').split('\n');
  const slices: string[] = [];
  let currentLines: string[] = [];
  let currentVisualLines = 0;

  const flush = () => {
    if (currentLines.length > 0) {
      slices.push(currentLines.join('\n'));
      currentLines = [];
      currentVisualLines = 0;
    }
  };

  for (const rawLine of rawLines) {
    const clean = rawLine.trimEnd();
    const needed = Math.max(1, Math.ceil(clean.replace(/<[^>]*>/g, '').length / Math.max(1, charsPerLine)));

    if (needed <= maxLinesPerSlice) {
      if (currentVisualLines > 0 && currentVisualLines + needed > maxLinesPerSlice) {
        flush();
      }
      currentLines.push(clean);
      currentVisualLines += needed;
    } else {
      // Split an extra-long single paragraph by words so no text is ever clipped.
      flush();
      const words = clean.split(/\s+/).filter(Boolean);
      const maxCharsSlice = Math.max(charsPerLine, maxLinesPerSlice * charsPerLine - 20);
      let chunk = '';
      for (const word of words) {
        if (chunk && chunk.length + 1 + word.length > maxCharsSlice) {
          slices.push(chunk);
          chunk = word;
        } else {
          chunk = chunk ? `${chunk} ${word}` : word;
        }
      }
      if (chunk) slices.push(chunk);
    }
  }
  flush();
  const safeSlices = (slices.length > 0 ? slices : [text]).map((s) => {
    const openCount = (s.match(/<u>/g) || []).length;
    const closeCount = (s.match(/<\/u>/g) || []).length;
    return openCount > closeCount ? `${s}</u>` : s;
  });
  return safeSlices;
}

export interface PaginateLogbookOptions<T extends LogbookPaginatableRow> {
  rows: T[];
  orientation: LogbookOrientation;
  template: LogbookTemplateKind;
  buildContent: (row: T, previousComparable?: T) => string;
  findPreviousComparable: (allRows: T[], index: number, row: T) => T | undefined;
  getWeekKey: (dateStr: string) => string;
}

/**
 * Distributes chronological logbook entries cleanly across fixed A4 pages
 * based on real estimated content height, preventing mid-page overflow,
 * orphan week dividers, or clipped text in Preview, Print, PDF, and Word.
 */
export function paginateLogbookEntries<T extends LogbookPaginatableRow>(
  options: PaginateLogbookOptions<T>
): LogbookA4Page<T>[] {
  const { rows, orientation, template, buildContent, findPreviousComparable, getWeekKey } = options;
  if (!rows.length) return [];

  const availableHeightPx = getAvailableBodyHeightPx(orientation, template);
  const { contentChars } = getColumnCapacities(orientation, template);
  const maxContentLinesPerPage = Math.max(6, Math.floor((availableHeightPx - 28) / 15));

  const pages: LogbookA4Page<T>[] = [];
  let currentRows: T[] = [];
  let usedHeightPx = 0;
  let weekDividerCount = 0;

  const commitPage = () => {
    if (currentRows.length === 0) return;
    const remaining = Math.max(0, availableHeightPx - usedHeightPx);
    const emptyFillerRows =
      template === 'standard'
        ? Math.min(10, Math.max(0, Math.floor(remaining / STANDARD_FILLER_ROW_HEIGHT_PX)))
        : 0;
    pages.push({
      pageIndex: pages.length,
      rows: currentRows,
      usedHeightPx,
      availableHeightPx,
      emptyFillerRows,
      weekDividerCount,
    });
    currentRows = [];
    usedHeightPx = 0;
    weekDividerCount = 0;
  };

  rows.forEach((row, index) => {
    const previousComparable = findPreviousComparable(rows, index, row);
    const renderedContent = buildContent(row, previousComparable);
    const rowHeightPx = estimateEntryHeightPx(row, renderedContent, orientation, template);

    // If a single entry by itself exceeds an entire A4 page, split its content into continuation slices
    if (rowHeightPx > availableHeightPx) {
      commitPage();
      const slices = splitLongTextIntoSlices(renderedContent, maxContentLinesPerPage, contentChars);
      slices.forEach((sliceText, sliceIdx) => {
        const chunkRow: T = {
          ...row,
          id: sliceIdx === 0 ? row.id : `${row.id}__part_${sliceIdx + 1}`,
          manualContent: sliceText,
          dayName: sliceIdx === 0 ? row.dayName : `${row.dayName} (تابع)`,
          note: sliceIdx === 0 ? row.note : '',
          __isSplitContinuation: sliceIdx > 0,
          __isSplitChunk: slices.length > 1,
        };
        const chunkHeight = estimateEntryHeightPx(chunkRow, sliceText, orientation, template);
        const remaining = Math.max(0, availableHeightPx - chunkHeight);
        pages.push({
          pageIndex: pages.length,
          rows: [chunkRow],
          usedHeightPx: Math.min(availableHeightPx, chunkHeight),
          availableHeightPx,
          emptyFillerRows:
            template === 'standard'
              ? Math.min(8, Math.max(0, Math.floor(remaining / STANDARD_FILLER_ROW_HEIGHT_PX)))
              : 0,
          weekDividerCount: 0,
        });
      });
      return;
    }

    const prevOnPage = currentRows[currentRows.length - 1];
    const needsWeekDivider =
      template === 'standard' &&
      Boolean(prevOnPage) &&
      getWeekKey(row.dateStr) !== getWeekKey(prevOnPage.dateStr);

    const addedHeightPx = rowHeightPx + (needsWeekDivider ? WEEK_DIVIDER_HEIGHT_PX : 0);

    if (currentRows.length > 0 && usedHeightPx + addedHeightPx > availableHeightPx) {
      commitPage();
      // On the fresh page there is no previous row, so no intra-page week divider is needed
      currentRows.push(row);
      usedHeightPx += rowHeightPx;
    } else {
      if (needsWeekDivider) {
        weekDividerCount += 1;
      }
      currentRows.push(row);
      usedHeightPx += addedHeightPx;
    }
  });

  commitPage();
  return pages;
}
