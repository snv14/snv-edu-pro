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
  assert.equal(later[0].lessonType, expected?.lessonType);
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
  // الحصص التمهيدية والمحطات التقويمية لا تُمدد؛ التمديد خاص بأنشطة التعلم.
  const firstActivity = steps.findIndex((step) => !step.isIntroductory && !step.isReview);
  assert.ok(firstActivity >= 0);
  assert.match(steps[firstActivity + 2].fullContent, /الحصة 3/);
  const rows = generateLogbookEntries({ startDate: '2026-10-04', period: 'أسبوع', gridRows: grid,
    holidays: [{ startDate: '2026-10-05', label: 'فرض', type: 'test' }] });
  assert.equal(rows[1].lessonType, 'assessment');
  assert.equal(rows[2].resourceIndex, 2);
});

test('mergeConsecutiveGroupEntries and splitMergedGroupEntries work symmetrically and robustly', async () => {
  const { mergeConsecutiveGroupEntries, splitMergedGroupEntries, extractGroupInfo } = await import('../src/components/DailyLogbook');
  
  // Format parsing
  assert.equal(extractGroupInfo('4م 1 ف1').baseSection, '4م1');
  assert.equal(extractGroupInfo('1م1 (فوج 1 + فوج 2)').isMerged, true);
  assert.equal(extractGroupInfo('1م1 (فوج 1 + فوج 2)').baseSection, '1م1');

  // Same day merging
  const sameDayRows = [
    { id: 'a', dateStr: '2026-10-04', dayName: 'الأحد', time: '08:00 - 09:00', section: '1م1 ف1', level: '1م' as const, content: 'نشاط 1' },
    { id: 'b', dateStr: '2026-10-04', dayName: 'الأحد', time: '09:00 - 10:00', section: '1م1 ف2', level: '1م' as const, content: 'نشاط 1' },
  ];
  const merged = mergeConsecutiveGroupEntries(sameDayRows);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].section, '1م1 (فوج 1 + فوج 2)');
  assert.match(merged[0].time, /08:00.*ف1.*09:00.*ف2/);

  // Splitting back
  const split = splitMergedGroupEntries(merged);
  assert.equal(split.length, 2);
  assert.equal(split[0].section, '1م1 (فوج 1)');
  assert.equal(split[1].section, '1م1 (فوج 2)');
});

test('logbook sessions follow the official pedagogical progression stored in the logbook database', async () => {
  const { buildPedagogicalStepsForLevel, LEVEL_PROGRAMS } = await import('../src/utils/dailyLogbookGenerator');

  const levels = [
    ['1م', '1am'],
    ['2م', '2am'],
    ['3م', '3am'],
    ['4م', '4am'],
  ] as const;

  for (const [arabic, key] of levels) {
    const steps = buildPedagogicalStepsForLevel(arabic, 1);
    const program = LEVEL_PROGRAMS[arabic];
    assert.equal(program.length, (await import('../src/data/logbook')).LOGBOOK_PROGRAMS[key].length);

    const order = new Map(program.map((unit, index) => [unit.sourceLearningUnitId, index]));

    // 1) لا يُسقَط أي مورد من قاعدة الدفتر: كل الوحدات لها حصة واحدة على الأقل.
    const covered = new Set(
      steps.filter((step) => order.has(step.sourceLearningUnitId)).map((step) => step.sourceLearningUnitId)
    );
    assert.equal(covered.size, program.length, `${arabic}: كل موارد التدرج ممثلة في الحصص`);

    // 2) الترتيب تصاعدي صارم على ترتيب التدرج الرسمي، بلا رجوع إلى مقطع سابق.
    let lastIndex = -1;
    for (const step of steps) {
      const index = order.get(step.sourceLearningUnitId);
      if (index === undefined) continue;
      assert.ok(index >= lastIndex, `${arabic}: تراجع في الترتيب عند «${step.activityText}»`);
      lastIndex = index;
    }

    // 3) الحصة الأولى تمهيدية، وأول حصة تعليمية هي أول نشاط في أول مورد.
    assert.ok(steps[0].isIntroductory, `${arabic}: الحصة الأولى تمهيدية`);
    const firstCurricular = steps.find((step) => !step.isIntroductory && !step.isReview);
    assert.equal(firstCurricular?.sourceLearningUnitId, program[0].sourceLearningUnitId);
    assert.equal(firstCurricular?.activityText, program[0].activities[0]);

    // 4) المشكلة والتقويم والميدان والمقطع تأتي من قاعدة الدفتر نفسها.
    const firstStep = steps.find((step) => step.sourceLearningUnitId === program[0].sourceLearningUnitId);
    assert.equal(firstStep?.taqwim, program[0].taqwim);
    assert.equal(firstStep?.moshkila, program[0].moshkila);
    assert.equal(firstStep?.maqta, program[0].maqta);
    assert.equal(firstStep?.midan, program[0].midan);
  }

  // المحطات التقويمية تُحفظ في مواضعها: الفرض الأول للسنة الأولى بعد مورد «مقر الامتصاص»
  // وقبل «التركيب الضوئي»، كما في التدرج السنوي الوزاري.
  const steps1am = buildPedagogicalStepsForLevel('1م', 1);
  const absorbing = steps1am.findIndex((step) => /مقر الامتصاص/.test(step.ta3alom));
  const photosynthesis = steps1am.findIndex((step) => /التركيب الضوئي/.test(step.ta3alom));
  const firstTest = steps1am.findIndex((step) => /الفرض المحروس الأول/.test(step.activityText));
  assert.ok(absorbing >= 0 && photosynthesis > absorbing && firstTest > absorbing && firstTest < photosynthesis);
});

test('multi-level timetable progresses through the respective annual distributions concurrently', () => {
  const multiGrid: TimetableGridRow[] = [
    { id: '1', time: '08:00 - 09:00', cells: { الأحد: '2م1', الإثنين: '3م1', الثلاثاء: '4م1' } },
  ];
  const rows = generateLogbookEntries({
    startDate: '2026-09-20',
    gridRows: multiGrid,
    period: 'أسبوعين',
  });

  const row2am = rows.find(r => r.section === '2م1');
  const row3am = rows.find(r => r.section === '3م1');
  const row4am = rows.find(r => r.section === '4م1');

  assert.ok(row2am && row3am && row4am);
  assert.equal(row2am.level, '2م');
  assert.equal(row3am.level, '3م');
  assert.equal(row4am.level, '4م');
  assert.match(row2am.content, /استقبال التلاميذ/);
  assert.match(row3am.content, /التعارف/);
  assert.match(row4am.content, /التعارف/);
  // كل مستوى يبدأ بتدرجه الخاص لا بتدرج مستوى آخر
  assert.ok(row2am.sourceLearningUnitId !== row3am.sourceLearningUnitId);
});

