import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLogbookEntries, isLogbookRowOnOrAfter } from '../src/utils/dailyLogbookGenerator';
import type { TimetableGridRow } from '../src/components/DailyLogbook';

const grid: TimetableGridRow[] = [
  { id: '1', time: '08:00 - 09:00', cells: { الأحد: '1م1', الإثنين: '1م1', الثلاثاء: '1م1', الأربعاء: '1م1', الخميس: '1م1' } },
];

test('generation begins on the selected date, not the school entry date', () => {
  for (const startDate of ['2026-10-06', '2027-01-05', '2027-03-10']) {
    const rows = generateLogbookEntries({ startDate, gridRows: grid, period: 'أسبوعين' });
    assert.equal(rows[0].dateStr, startDate);
    assert.ok(rows.every(row => isLogbookRowOnOrAfter(row.dateStr, startDate)));
  }
});

test('weekends and holidays advance to the next scheduled day', () => {
  const rows = generateLogbookEntries({
    startDate: '2026-10-09', gridRows: grid, period: 'أسبوع',
    holidays: [{ startDate: '2026-10-11', endDate: '2026-10-12', label: 'عطلة', type: 'holiday' }],
  });
  assert.equal(rows[0].dateStr, '2026-10-13');
  assert.ok(rows.every(row => isLogbookRowOnOrAfter(row.dateStr, '2026-10-09')));
});

test('groups are ordered by date even when group 2 meets first', () => {
  const groupGrid: TimetableGridRow[] = [
    { id: '1', time: '08:00 - 09:00', cells: { الأحد: '1م1 فوج 2', الخميس: '1م1 فوج 1' } },
  ];
  const rows = generateLogbookEntries({ startDate: '2026-10-04', gridRows: groupGrid, period: 'أسبوع' });
  assert.match(rows[0].dateStr, /^2026-10-04 .*2026-10-08/);
  const partialWeek = generateLogbookEntries({ startDate: '2026-10-06', gridRows: groupGrid, period: 'أسبوع' });
  assert.equal(partialWeek[0].dateStr, '2026-10-08');
});

test('all dates in a saved merged row must respect the selected date', () => {
  assert.equal(isLogbookRowOnOrAfter('2026-10-08 (ف1) / 2026-10-04 (ف2)', '2026-10-06'), false);
  assert.equal(isLogbookRowOnOrAfter('2026-10-08 (ف1) / 2026-10-11 (ف2)', '2026-10-06'), true);
});
