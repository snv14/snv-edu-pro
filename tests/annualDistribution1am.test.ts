import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_1AM_DISTRIBUTION, OFFICIAL_2AM_DISTRIBUTION } from '../src/data/curriculum/officialAnnualDistributionData';
import { getDefaultCalendarSettings, recalculateDistributionRows } from '../src/utils/annualDistributionDateUtils';
import {
  annualDistributionVersion,
  FIRST_YEAR_BACKUP_KEY,
  migrateFirstYearDistribution,
  mergeReferenceYearsOnCloudRestore,
} from '../src/utils/annualDistributionMigration';

const find = (month: string, week: number) => {
  const row = OFFICIAL_1AM_DISTRIBUTION.find(r => r.month === month && r.weekInMonth === week);
  assert.ok(row, `missing ${month} week ${week}`);
  return row;
};

test('the first-year schedule follows the supplied 2026-2027 monthly reference', () => {
  assert.equal(OFFICIAL_1AM_DISTRIBUTION.length, 32);
  assert.equal(find('سبتمبر', 4).isIntroductory, true);
  assert.match(find('سبتمبر', 4).session1, /استقبال التلاميذ/);
  assert.match(find('سبتمبر', 4).session2, /معالجة بيداغوجية/);

  assert.equal(find('أكتوبر', 1).isRemediation, true);
  assert.equal(find('أكتوبر', 1).session1, 'معالجة بيداغوجية');

  assert.equal(find('أكتوبر', 2).percent, '4%');
  assert.match(find('أكتوبر', 2).session1, /وضعية الانطلاق الشاملة/);
  assert.match(find('أكتوبر', 2).session2, /تحليل الحليب/);

  assert.equal(find('نوفمبر', 3).percent, '24%');
  assert.match(find('نوفمبر', 3).session1, /وضعية تقويم/);
  assert.match(find('نوفمبر', 3).session2, /التغذية عند النبات الأخضر/);

  assert.equal(find('جانفي', 4).percent, '52%');
  assert.match(find('جانفي', 4).session1, /المبادلات الغازية التنفسية ومقرها/);

  assert.equal(find('فيفري', 1).percent, '');
  assert.match(find('فيفري', 1).session1, /تعريف التنفس/);

  assert.equal(find('فيفري', 2).percent, '56%');
  assert.match(find('فيفري', 2).session2, /التحصل على الطاقة عند النبات الأخضر/);

  assert.equal(find('مارس', 2).percent, '72%');
  assert.match(find('مارس', 2).session1, /الإطراح وثبات توازن الوسط الداخلي/);

  assert.equal(find('أفريل', 2).percent, '80%');
  assert.match(find('أفريل', 2).session1, /التكاثر الجنسي عند الإنسان/);

  assert.equal(find('أفريل', 4).percent, '88%');
  assert.match(find('أفريل', 4).session1, /التكاثر عند النباتات ذات الازهار/);

  assert.equal(find('ماي', 2).percent, '96%');
  assert.match(find('ماي', 2).session1, /المقطع: الخلية/);

  assert.equal(find('ماي', 3).percent, '100%');
  assert.equal(find('ماي', 3).isExam, true);
  assert.ok(!OFFICIAL_1AM_DISTRIBUTION.some(r => /عطلة الخريف|فرض الثلاثي/.test(r.session1)));
});

test('first-year holiday dates and exams are retained accurately', () => {
  for (const week of [3, 4]) {
    assert.equal(find('ديسمبر', week).isHoliday, true);
    assert.match(find('ديسمبر', week).holidayLabel!, /17 ديسمبر 2026.*03 جانفي 2027/);
    assert.equal(find('مارس', week).isHoliday, true);
    assert.match(find('مارس', week).holidayLabel!, /18 مارس 2027.*04 أفريل 2027/);
  }
  assert.equal(find('ديسمبر', 1).isExam, true);
  assert.equal(find('ديسمبر', 1).percent, '32%');
  assert.equal(find('مارس', 1).isExam, true);
  assert.equal(find('مارس', 1).percent, '68%');
  assert.equal(find('ماي', 3).isExam, true);
  assert.equal(find('ماي', 3).percent, '100%');
});

test('recalculation never invents dates or moves 1am reference sessions', () => {
  for (const format of ['short', 'spaced', 'withMonth', 'isoShort'] as const) {
    const settings = { ...getDefaultCalendarSettings('2027-2028', '2027-10-01'), dateFormat: format };
    assert.deepEqual(recalculateDistributionRows(OFFICIAL_1AM_DISTRIBUTION, settings), OFFICIAL_1AM_DISTRIBUTION);
  }
});

test('only old first-year data is replaced and its prior edits are backed up', () => {
  const old = { curriculumDataVersion: '2026-10-14-1am-exact-user-v1', items: [{ session1: 'تعديل قديم' }] };
  const stored = { '1am': old, '2am': { curriculumDataVersion: annualDistributionVersion('2am'), items: OFFICIAL_2AM_DISTRIBUTION } };
  assert.equal(migrateFirstYearDistribution(stored, OFFICIAL_1AM_DISTRIBUTION), true);
  assert.deepEqual((stored as any)[FIRST_YEAR_BACKUP_KEY], old);
  assert.equal(stored['1am'].items.length, 32);
  assert.equal(stored['1am'].curriculumDataVersion, annualDistributionVersion('1am'));
  assert.strictEqual(stored['2am'].items, OFFICIAL_2AM_DISTRIBUTION);
  assert.equal(migrateFirstYearDistribution(stored, OFFICIAL_1AM_DISTRIBUTION), false);
});

test('calendar sync leaves first-year saved work untouched, including an old version', async () => {
  const { syncCalendarToAllLevels, ANNUAL_STORAGE_KEY } = await import('../src/utils/annualDistributionDateUtils');
  const values = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  const old = { curriculumDataVersion: 'old', items: [{ session1: 'بيانات الأستاذ', dates: 'تاريخ يدوي' }] };
  values.set(ANNUAL_STORAGE_KEY, JSON.stringify({ '1am': old }));
  assert.equal(syncCalendarToAllLevels(getDefaultCalendarSettings('2026-2027')), true);
  assert.deepEqual(JSON.parse(values.get(ANNUAL_STORAGE_KEY)!)['1am'], old);
  delete (globalThis as any).localStorage;
});

test('cloud restoration keeps local first-year and second-year reference edits and backup copies', () => {
  const newer1am = { curriculumDataVersion: annualDistributionVersion('1am'), items: [{ session1: 'تعديل حديث 1م' }] };
  const older1am = { curriculumDataVersion: 'old', items: [{ session1: 'سحابي قديم 1م' }] };
  const backup1am = { items: [{ session1: 'نسخة سابقة 1م' }] };
  const merged = mergeReferenceYearsOnCloudRestore(
    { '1am': newer1am, [FIRST_YEAR_BACKUP_KEY]: backup1am },
    { '1am': older1am, '3am': { items: [] } },
  );
  assert.deepEqual(merged['1am'], newer1am);
  assert.deepEqual(merged[FIRST_YEAR_BACKUP_KEY], backup1am);
  assert.deepEqual(merged.firstYearAdditionalBackups, [older1am]);
  assert.deepEqual(merged['3am'], { items: [] });
});
