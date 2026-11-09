import type { LogEntry } from '../components/DailyLogbook';
import { getLogbookPeriodEnd, isLogbookRowOnOrAfter } from './dailyLogbookGenerator';

/** Retain explicitly edited records even when the visible date range changes. */
export function collectPreservedRows(archived: LogEntry[], current: LogEntry[]): LogEntry[] {
  const byKey = new Map<string, LogEntry>();
  for (const row of [...archived, ...current]) {
    if (String(row.id || '').startsWith('manual-') || !row.sourceLearningUnitId || row.manualContent || row.attendance || row.manualEdited) {
      byKey.set(`${row.dateStr}|${row.time}|${row.section}`, row);
    }
  }
  return [...byKey.values()];
}

export function preservedRowsInPeriod(rows: LogEntry[], start: string, period: string): LogEntry[] {
  const end = getLogbookPeriodEnd(start, period);
  return rows.filter(row => isLogbookRowOnOrAfter(row.dateStr || '', start)
    && (row.dateStr.match(/\d{4}-\d{2}-\d{2}/g) || [] as string[]).every(date => date < end));
}
