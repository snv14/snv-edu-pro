import test from 'node:test';
import assert from 'node:assert/strict';
import type { LogEntry } from '../src/components/DailyLogbook';
import { collectPreservedRows, preservedRowsInPeriod } from '../src/utils/logbookPreservation';

const base: LogEntry = { id: 'manual-1', dateStr: '2026-10-05', dayName: 'الإثنين', time: '08:00', section: '1م1', level: '1م', content: 'ملاحظة', note: '' };

test('manual work remains archived across period changes and can be restored', () => {
  const archive = collectPreservedRows([], [base]);
  assert.deepEqual(preservedRowsInPeriod(archive, '2026-11-01', 'أسبوع'), []);
  assert.deepEqual(preservedRowsInPeriod(archive, '2026-10-04', 'أسبوع'), [base]);
});

test('newer edits replace archived versions without preserving unedited generated rows', () => {
  const edited = { ...base, content: 'تعديل جديد' };
  const automatic = { ...base, id: 'auto', dateStr: '2026-10-06', sourceLearningUnitId: 'unit' };
  assert.deepEqual(collectPreservedRows([base], [edited, automatic]), [edited]);
  assert.deepEqual(collectPreservedRows([], [{ ...automatic, manualEdited: true }]).length, 1);
});
