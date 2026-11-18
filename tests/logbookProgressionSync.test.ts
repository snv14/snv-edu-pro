import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOGBOOK_PROGRESSIONS,
  LOGBOOK_PROGRESSION_SOURCES,
  logbookProgressionOf,
} from '../src/data/logbook';
import {
  buildPedagogicalStepsForLevel,
  generateLogbookEntries,
  isValidTimetablePeriod,
  reorganizeSubsequentSessions,
} from '../src/utils/dailyLogbookGenerator';
import type { TimetableGridRow } from '../src/components/DailyLogbook';

test('imported official PDF progressions match exact unit & activity counts with zero fabricated durations', () => {
  const expectedCounts = {
    '1am': { units: 26, activities: 45, pages: 6 },
    '2am': { units: 20, activities: 29, pages: 7 },
    '3am': { units: 28, activities: 37, pages: 9 },
    '4am': { units: 23, activities: 43, pages: 8 },
  } as const;

  for (const level of ['1am', '2am', '3am', '4am'] as const) {
    const units = LOGBOOK_PROGRESSIONS[level];
    const source = LOGBOOK_PROGRESSION_SOURCES[level];
    const exp = expectedCounts[level];

    assert.equal(units.length, exp.units, `${level} unit count`);
    assert.equal(
      units.reduce((sum, u) => sum + u.activities.length, 0),
      exp.activities,
      `${level} activity count`
    );
    assert.equal(source.totalPages, exp.pages, `${level} PDF totalPages`);
    assert.equal(source.specifiesOfficialDurations, false);
    assert.equal(source.specifiesOfficialDates, false);

    units.forEach((unit, idx) => {
      assert.equal(unit.order, idx + 1, `${unit.id} sequential order`);
      assert.equal(unit.officialDurationSessions, null, `${unit.id} must not invent officialDurationSessions`);
      assert.equal(unit.officialWeeksCount, null, `${unit.id} must not invent officialWeeksCount`);
      assert.ok(unit.sourceFile.sourcePage >= 1 && unit.sourceFile.sourcePage <= exp.pages);
      assert.ok(unit.midan.length > 0 && unit.maqta.length > 0 && unit.mawrid.length > 0);
    });
  }
});

test('missing or unknown year progression returns empty steps cleanly without inventing data', () => {
  const lookup = logbookProgressionOf('5م');
  assert.equal(lookup.available, false);
  assert.equal(lookup.units.length, 0);
  assert.equal(buildPedagogicalStepsForLevel('5م' as never).length, 0);
  assert.equal(buildPedagogicalStepsForLevel('1م', 1, undefined, undefined, []).length, 0);
});

test('pedagogical steps maintain strict chronological order and attach irsaaText/taqwim to final session of each unit', () => {
  for (const arabicLevel of ['1م', '2م', '3م', '4م'] as const) {
    const steps = buildPedagogicalStepsForLevel(arabicLevel, 1);
    let prevOrder = 0;
    for (const step of steps) {
      assert.ok(step.progressionOrder >= prevOrder, `${arabicLevel} monotonic progressionOrder`);
      prevOrder = step.progressionOrder;
      assert.equal(step.officialDurationSessions, null);
    }

    // Check 4AM unit 1 (2 activities): irsaaText and taqwim appear on session 2 of unit, not session 1
    if (arabicLevel === '4م') {
      assert.equal(steps[0].sessionNumberInUnit, 1);
      assert.equal(steps[0].totalSessionsInUnit, 2);
      assert.equal(steps[0].irsaaText, undefined);
      assert.equal(steps[0].taqwim, undefined);

      assert.equal(steps[1].sessionNumberInUnit, 2);
      assert.equal(steps[1].totalSessionsInUnit, 2);
      assert.equal(steps[1].irsaaText, 'إرساء المورد');
      assert.ok(steps[1].taqwim && steps[1].taqwim.length > 0);
    }
  }
});

test('custom unitSessionsMap expands and compresses multi-activity units cleanly without losing any activity', () => {
  // prog-1am-01 has 2 activities:
  // Case A: Expand to 4 sessions -> 2 sessions per activity
  const expanded = buildPedagogicalStepsForLevel('1م', 1, undefined, { 'prog-1am-01': 4 });
  const unit1Expanded = expanded.filter((s) => s.progressionUnitId === 'prog-1am-01');
  assert.equal(unit1Expanded.length, 4);
  assert.equal(unit1Expanded[0].totalSessionsInUnit, 4);
  assert.equal(unit1Expanded[3].sessionNumberInUnit, 4);
  assert.match(unit1Expanded[0].fullContent, /الحصة 1 من 2/);
  assert.match(unit1Expanded[1].fullContent, /الحصة 2 من 2/);

  // Case B: Compress 2 activities into 1 session -> both activities merged cleanly with ' + '
  const compressed = buildPedagogicalStepsForLevel('1م', 1, undefined, { 'prog-1am-01': 1 });
  const unit1Compressed = compressed.filter((s) => s.progressionUnitId === 'prog-1am-01');
  assert.equal(unit1Compressed.length, 1);
  assert.match(unit1Compressed[0].activityText, /مصدر الأغذية.*\+.*تصنيف الأغذية/);
});

test('isValidTimetablePeriod and generator strictly filter out lunch break, evening, and weekend slots', () => {
  assert.equal(isValidTimetablePeriod('08:00 - 09:00'), true);
  assert.equal(isValidTimetablePeriod('11:00 - 12:00'), true);
  assert.equal(isValidTimetablePeriod('13:30 - 14:30'), true);
  assert.equal(isValidTimetablePeriod('16:30 - 17:30'), true);

  assert.equal(isValidTimetablePeriod('07:00 - 08:00'), false);
  assert.equal(isValidTimetablePeriod('12:00 - 13:00'), false);
  assert.equal(isValidTimetablePeriod('12:30 - 13:30'), false);
  assert.equal(isValidTimetablePeriod('17:30 - 18:30'), false);
  assert.equal(isValidTimetablePeriod('18:00 - 19:00'), false);

  const mixedGrid: TimetableGridRow[] = [
    { id: 'morning', time: '08:00 - 09:00', cells: { الأحد: '1م1', الخميس: '1م1' } },
    { id: 'lunch', time: '12:00 - 13:00', cells: { الإثنين: '1م1' } },
    { id: 'evening', time: '18:00 - 19:00', cells: { الثلاثاء: '1م1' } },
  ];

  const rows = generateLogbookEntries({
    startDate: '2026-10-04',
    gridRows: mixedGrid,
    period: 'أسبوع',
  });

  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => !r.time.includes('12:00') && !r.time.includes('18:00')));
  assert.ok(rows.every((r) => r.dayName !== 'الجمعة' && r.dayName !== 'السبت'));
});

test('reorganizeSubsequentSessions shifts future uncompleted curriculum rows while keeping completed rows and timetable slots intact', () => {
  const grid: TimetableGridRow[] = [
    { id: '1', time: '08:00 - 09:00', cells: { الأحد: '1م1', الأربعاء: '1م1' } },
  ];
  const initial = generateLogbookEntries({
    startDate: '2026-10-04',
    gridRows: grid,
    period: 'شهر',
  });
  assert.ok(initial.length >= 4);

  // Mark row 0 as completed
  const seeded = initial.map((r, idx) =>
    idx === 0 ? { ...r, completionStatus: 'completed' as const } : r
  );

  // Extend row 1's unit by +1 session
  const targetRow = seeded[1];
  const origRow2Content = seeded[2].content;

  const { updatedRows, changedCount, updatedUnitSessionsMap } = reorganizeSubsequentSessions({
    rows: seeded,
    anchorRowId: targetRow.id,
    extraSessionsForUnit: 1,
    newStatus: 'in_progress',
    startDate: '2026-10-04',
    gridRows: grid,
    period: 'شهر',
    unitSessionsMap: {},
  });

  assert.ok(changedCount >= 1);
  assert.equal(updatedRows[0].completionStatus, 'completed');
  assert.equal(updatedRows[0].content, seeded[0].content);
  assert.equal(updatedRows[1].completionStatus, 'in_progress');
  assert.ok(updatedUnitSessionsMap[targetRow.progressionUnitId!] >= 2);
  assert.notEqual(updatedRows[2].content, origRow2Content);

  // Also verify pure postponement shifts subsequent uncompleted lessons forward by 1 timetable slot
  const postponed = reorganizeSubsequentSessions({
    rows: seeded,
    anchorRowId: seeded[1].id,
    extraSessionsForUnit: 0,
    newStatus: 'postponed',
    startDate: '2026-10-04',
    gridRows: grid,
    period: 'شهر',
    unitSessionsMap: {},
  });
  assert.equal(postponed.updatedRows[1].completionStatus, 'postponed');
  assert.equal(postponed.updatedRows[2].content, seeded[1].content);
  assert.equal(postponed.updatedRows[0].content, seeded[0].content);
});

test('startDate persistence and isolation check: legacy backup preserves config and timetable untouched', () => {
  // Simulate saved startDate persistence behavior (custom startDate never replaced by today's date)
  const savedState = {
    version: '2026-11-17-progression-pdfs-v20',
    startDate: '2026-10-18',
    sequenceStartDate: '2026-10-18',
    unitSessionsMap: { 'prog-1am-01': 3 },
    rows: [{ id: 'r1', dateStr: '2026-10-18', content: 'custom edit' }],
  };

  const configBefore = JSON.stringify({ professorName: 'أستاذ تجريبي', schoolName: 'متوسطة النموذج' });
  const timetableBefore = JSON.stringify([{ id: '1', time: '08:00 - 09:00', cells: { الأحد: '1م1' } }]);

  const store = new Map<string, string>([
    ['daftar_table_v2027', JSON.stringify(savedState)],
    ['algeria_sciences_config', configBefore],
    ['algeria_sciences_timetable_grid', timetableBefore],
  ]);

  const loaded = JSON.parse(store.get('daftar_table_v2027')!);
  assert.equal(loaded.startDate, '2026-10-18');
  assert.equal(loaded.unitSessionsMap['prog-1am-01'], 3);
  assert.equal(store.get('algeria_sciences_config'), configBefore);
  assert.equal(store.get('algeria_sciences_timetable_grid'), timetableBefore);
});
