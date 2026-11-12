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
  // النية: الانطلاق المتأخر يُكمل ما وصل إليه الإسقاط الكامل ولا يُعيد حصة
  // التعارف/الاستقبال. لا يُربط بنوع حصة بعينه لأن التدرج الرسمي قابل للتعديل
  // (الأسبوع الثاني في س1 معالجة بيداغوجية بقرار الأستاذ).
  assert.equal(later[0].lessonType, expected?.lessonType);
  assert.notEqual(later[0].lessonType, 'introductory');
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
  // النية: النشاط المنهجي يُمدَّد إلى عدد الحصص المطلوب وتُوسم حصته الأخيرة،
  // بينما حصص التعارف والمعالجة والاختبارات لا تُمدَّد. لا يُربط بفهرس ثابت
  // لأن ترتيب الأسطر يتغير مع أي تعديل في التدرج الرسمي.
  const lastSession = steps.find(step => step.totalSessionsForActivity === 3 && step.sessionIndexInActivity === 3);
  assert.ok(lastSession, 'يوجد نشاط منهجي ممدَّد إلى ثلاث حصص');
  assert.match(lastSession!.fullContent, /الحصة 3/);
  assert.equal(lastSession!.isIntroductory, false);
  assert.equal(lastSession!.isReview, false);
  assert.ok(
    steps.filter(step => step.isIntroductory || step.isReview).every(step => step.totalSessionsForActivity === 1),
    'حصص التعارف والمعالجة لا تُمدَّد'
  );
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

test('daily logbook steps strictly respect the official annual distribution chronological sequence for all 4 levels', async () => {
  const { buildPedagogicalStepsForLevel } = await import('../src/utils/dailyLogbookGenerator');
  const {
    OFFICIAL_1AM_DISTRIBUTION,
    OFFICIAL_2AM_DISTRIBUTION,
    OFFICIAL_3AM_DISTRIBUTION,
    OFFICIAL_4AM_DISTRIBUTION,
  } = await import('../src/data/curriculum/officialAnnualDistributionData');

  // Level 1AM
  const steps1am = buildPedagogicalStepsForLevel('1م', 1);
  assert.match(steps1am[0].fullContent, /التعارف/);
  assert.match(steps1am[1].fullContent, /تقويم تشخيصي/);
  assert.equal(steps1am[2].fullContent, OFFICIAL_1AM_DISTRIBUTION[1].session1);
  assert.equal(steps1am[3].fullContent, OFFICIAL_1AM_DISTRIBUTION[1].session2);
  assert.equal(steps1am[4].fullContent, OFFICIAL_1AM_DISTRIBUTION[2].session1);
  assert.equal(steps1am[6].fullContent, OFFICIAL_1AM_DISTRIBUTION[3].session1);
  assert.match(steps1am[6].fullContent, /مصدر الأغذية/);

  // Level 2AM — the official 2026-2027 sheet opens with «استقبال التلاميذ…» (not «تعارف»),
  // and its week-1 merged cell is split: session1 = الافتتاح، session2 = التقويم التشخيصي.
  const steps2am = buildPedagogicalStepsForLevel('2م', 1);
  assert.match(steps2am[0].fullContent, /استقبال التلاميذ/);
  assert.match(steps2am[1].fullContent, /التقويم التشخيصي/);
  assert.equal(steps2am[2].fullContent, OFFICIAL_2AM_DISTRIBUTION[1].session1); // W2s1
  assert.match(steps2am[2].fullContent, /أعاين وسطا حيا قريبا/);
  assert.equal(steps2am[3].fullContent, OFFICIAL_2AM_DISTRIBUTION[1].session2); // W2s2
  assert.match(steps2am[3].fullContent, /أعاين وسطا حيا قريبا \(2\)/);
  assert.equal(steps2am[4].fullContent, OFFICIAL_2AM_DISTRIBUTION[2].session1); // W3s1
  assert.match(steps2am[4].fullContent, /أميز بين أوساط حية مختلفة/);

  // Level 3AM
  const steps3am = buildPedagogicalStepsForLevel('3م', 1);
  assert.match(steps3am[0].fullContent, /التعارف/);
  assert.equal(steps3am[2].fullContent, OFFICIAL_3AM_DISTRIBUTION[1].session1);
  assert.match(steps3am[2].fullContent, /أصف آثار الزلزال/);
  assert.equal(steps3am[3].fullContent, OFFICIAL_3AM_DISTRIBUTION[1].session2);
  assert.match(steps3am[3].fullContent, /خصائص الزلازل/);

  // Level 4AM
  const steps4am = buildPedagogicalStepsForLevel('4م', 1);
  assert.match(steps4am[0].fullContent, /التعارف/);
  assert.equal(steps4am[2].fullContent, OFFICIAL_4AM_DISTRIBUTION[1].session1);
  assert.match(steps4am[2].fullContent, /التحولات التي تطرأ على إحدى مكونات الخبز/);
  assert.equal(steps4am[3].fullContent, OFFICIAL_4AM_DISTRIBUTION[1].session2);
  assert.match(steps4am[3].fullContent, /أنبوب|المعدة/);
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
});

