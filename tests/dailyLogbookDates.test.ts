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

test('late starts continue the projected curriculum rather than repeating school entry', () => {
  const full = generateLogbookEntries({ startDate: '2026-09-20', gridRows: grid, period: 'شهر' });
  const later = generateLogbookEntries({ startDate: '2026-09-23', sequenceStartDate: '2026-09-20', gridRows: grid, period: 'أسبوع' });
  const expected = full.find(row => row.dateStr === '2026-09-23');
  assert.equal(later[0].sourceLearningUnitId, expected?.sourceLearningUnitId);
  assert.equal(later[0].content, expected?.content);
  assert.equal(later[0].lessonType, 'curriculum');
});

test('activities are assigned in date order, not group-first order', () => {
  const rows = generateLogbookEntries({ startDate: '2026-10-04', period: 'أسبوع', gridRows: [
    { id: '1', time: '08:00 - 09:00', cells: { الأحد: '1م1', الخميس: '1م1 فوج 1' } },
  ] });
  assert.equal(rows[0].resourceIndex, 1);
  assert.equal(rows[1].resourceIndex, 2);
  assert.match(rows[0].content, /التعارف/);
});

test('week and month cover calendar days even when starting midweek', () => {
  const week = generateLogbookEntries({ startDate: '2026-10-08', period: 'أسبوع', gridRows: grid });
  assert.deepEqual(week.map(r => r.dateStr), ['2026-10-08', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']);
  const month = generateLogbookEntries({ startDate: '2026-10-06', period: 'شهر', gridRows: grid });
  assert.ok(month.every(row => row.dateStr < '2026-11-05'));
  assert.equal(month.at(-1)?.dateStr, '2026-11-04');
});

test('group crossing display start retains its assigned activity', () => {
  const groupGrid: TimetableGridRow[] = [{ id: '1', time: '08:00 - 09:00', cells: { الأحد: '1م1 فوج 1', الخميس: '1م1 فوج 2' } }];
  const full = generateLogbookEntries({ startDate: '2026-10-04', gridRows: groupGrid, period: 'أسبوع' });
  const later = generateLogbookEntries({ startDate: '2026-10-06', sequenceStartDate: '2026-10-04', gridRows: groupGrid, period: 'أسبوع' });
  assert.equal(later[0].dateStr, '2026-10-08');
  assert.equal(later[0].content, full[0].content);
  assert.match(later[0].section, /فوج 2/);
  assert.doesNotMatch(later[0].section, /فوج 1/);
});

test('exams pause curriculum progression and third session is labelled correctly', async () => {
  const { buildPedagogicalStepsForLevel } = await import('../src/utils/dailyLogbookGenerator');
  const steps = buildPedagogicalStepsForLevel('1م', 3);
  assert.match(steps[4].fullContent, /الحصة 3/);
  const rows = generateLogbookEntries({ startDate: '2026-10-04', period: 'أسبوع', gridRows: grid,
    holidays: [{ startDate: '2026-10-05', label: 'فرض', type: 'test' }] });
  assert.equal(rows[1].lessonType, 'assessment');
  assert.equal(rows[2].resourceIndex, 2);
});
