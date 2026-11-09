import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_2AM_DISTRIBUTION, OFFICIAL_1AM_DISTRIBUTION } from '../src/data/officialAnnualDistributionData';
import { getDefaultCalendarSettings, recalculateDistributionRows } from '../src/utils/annualDistributionDateUtils';
import { annualDistributionVersion, migrateSecondYearDistribution, SECOND_YEAR_BACKUP_KEY } from '../src/utils/annualDistributionMigration';

const find = (month: string, week: number) => {
  const row = OFFICIAL_2AM_DISTRIBUTION.find(r => r.month === month && r.weekInMonth === week);
  assert.ok(row, `missing ${month} week ${week}`);
  return row;
};

test('the second-year schedule follows the supplied monthly reference', () => {
  assert.equal(OFFICIAL_2AM_DISTRIBUTION.length, 36);
  assert.equal(find('سبتمبر', 4).isIntroductory, true);
  assert.match(find('أكتوبر', 1).session1, /وضعية الانطلاق الشاملة/);
  assert.match(find('أكتوبر', 1).session2, /وسطا حيا قريبا \(2\)/);
  assert.match(find('أكتوبر', 2).session1, /أوساط حية مختلفة/);
  assert.match(find('أكتوبر', 2).session2, /التفاعلات/);
  assert.match(find('جانفي', 3).session1, /وضعية تقويم/);
  assert.match(find('جانفي', 3).session2, /المقطع الثاني/);
  assert.match(find('فيفري', 2).session1, /المياه القذرة/);
  assert.match(find('فيفري', 4).session2, /استراتيجيات التكاثر/);
  assert.match(find('ماي', 3).session2, /المستحاثة/);
  assert.equal(find('جوان', 3).percent, '100%');
  assert.ok(!OFFICIAL_2AM_DISTRIBUTION.some(r => /عطلة الخريف|فرض الثلاثي/.test(r.session1)));
});

test('holiday dates and mixed correction/lesson rows are retained', () => {
  for (const week of [3,4]) {
    assert.match(find('ديسمبر', week).holidayLabel!, /17 ديسمبر 2026.*03 جانفي 2027/);
    assert.match(find('مارس', week).holidayLabel!, /18 مارس 2027.*04 أفريل 2027/);
  }
  for (const month of ['ديسمبر', 'مارس']) {
    const row = find(month, 2);
    assert.equal(row.isExam, false);
    assert.match(row.session1, /تصحيح الاختبار/);
    assert.match(row.session2, /النشاط/);
  }
  assert.equal(find('ديسمبر', 1).isExam, true);
  assert.equal(find('مارس', 1).isExam, true);
  assert.equal(find('جوان', 3).isExam, true);
});

test('recalculation never invents dates or moves the reference sessions', () => {
  for (const format of ['short','spaced','withMonth','isoShort'] as const) {
    const settings = {...getDefaultCalendarSettings('2027-2028', '2027-10-01'), dateFormat:format};
    assert.deepEqual(recalculateDistributionRows(OFFICIAL_2AM_DISTRIBUTION, settings), OFFICIAL_2AM_DISTRIBUTION);
  }
});

test('only old second-year data is replaced and its prior edits are backed up', () => {
  const old = { curriculumDataVersion: 'old', items: [{ session1: 'تعديل الأستاذ' }] };
  const stored = { '2am': old, '1am': { curriculumDataVersion: annualDistributionVersion('1am'), items: OFFICIAL_1AM_DISTRIBUTION } };
  assert.equal(migrateSecondYearDistribution(stored, OFFICIAL_2AM_DISTRIBUTION), true);
  assert.deepEqual((stored as any)[SECOND_YEAR_BACKUP_KEY], old);
  assert.equal(stored['2am'].items.length, 36);
  assert.equal(stored['2am'].curriculumDataVersion, annualDistributionVersion('2am'));
  assert.strictEqual(stored['1am'].items, OFFICIAL_1AM_DISTRIBUTION);
  assert.equal(migrateSecondYearDistribution(stored, OFFICIAL_2AM_DISTRIBUTION), false);
});

test('calendar sync leaves second-year saved work untouched, including an old version', async () => {
  const { syncCalendarToAllLevels, ANNUAL_STORAGE_KEY } = await import('../src/utils/annualDistributionDateUtils');
  const values = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  const old = { curriculumDataVersion: 'old', items: [{ session1: 'بيانات الأستاذ', dates: 'تاريخ يدوي' }] };
  values.set(ANNUAL_STORAGE_KEY, JSON.stringify({ '2am': old }));
  assert.equal(syncCalendarToAllLevels(getDefaultCalendarSettings('2026-2027')), true);
  assert.deepEqual(JSON.parse(values.get(ANNUAL_STORAGE_KEY)!)['2am'], old);
  delete (globalThis as any).localStorage;
});

test('cloud restoration keeps local second-year edits and backup copies', async () => {
  const { mergeSecondYearOnCloudRestore } = await import('../src/utils/annualDistributionMigration');
  const newer = { curriculumDataVersion: annualDistributionVersion('2am'), items: [{ session1: 'تعديل حديث' }] };
  const older = { curriculumDataVersion: 'old', items: [{ session1: 'سحابي قديم' }] };
  const backup = { items: [{ session1: 'نسخة سابقة' }] };
  const merged = mergeSecondYearOnCloudRestore({ '2am': newer, [SECOND_YEAR_BACKUP_KEY]: backup }, { '2am': older, '3am': { items: [] } });
  assert.deepEqual(merged['2am'], newer);
  assert.deepEqual(merged[SECOND_YEAR_BACKUP_KEY], backup);
  assert.deepEqual(merged.secondYearAdditionalBackups, [older]);
  assert.deepEqual(merged['3am'], { items: [] });
});
