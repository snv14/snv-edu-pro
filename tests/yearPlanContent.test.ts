import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getYearPlans } from '../src/services/yearReferences';
import { getYearPlanOutline, getYearPlanTermPages } from '../src/data/yearPlanOutlines';
import { getYearPlanStats, filterYearPlanUnits, getYearPlanMemos } from '../src/services/yearPlanContent';
import { loadOfficialSources } from '../src/services/knowledgeOfficialSources';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';
import { YearPlansViewer } from '../src/components/YearPlansViewer';

const counts = { '1am': 8, '2am': 5, '3am': 4, '4am': 3 };
const hours = { '1am': 48, '2am': 48, '3am': 46, '4am': 48 };
for (const level of ['1am', '2am', '3am', '4am'] as const) {
  test(`${level}: both plan outlines point only to real original pages and retain separate editions`, async () => {
    for (const plan of getYearPlans(level)) {
      const units = getYearPlanOutline(level, plan.id);
      const [doc] = await loadOfficialSources([plan.id]);
      assert.equal(getYearPlanStats(units).sequences, counts[level]);
      assert.equal(new Set(units.map(unit => unit.id)).size, units.length);
      assert.deepEqual([...new Set(units.map(unit => unit.term))], [1, 2, 3]);
      for (const unit of units) {
        assert.ok(unit.pages.length);
        assert.ok(unit.pages.every(page => doc.pages.some(source => source.page === page)), `${plan.id}: ${unit.title}`);
        if (unit.hours !== undefined) {
          const text = doc.pages.filter(page => unit.pages.includes(page.page)).map(page => page.text).join(' ');
          assert.match(text, new RegExp(`${unit.hours}\\s*[()]*سا`), `duration is actually in ${plan.id}: ${unit.title}`);
        }
      }
      if (plan.id.startsWith('annualPlan')) {
        assert.equal(getYearPlanStats(units).hours, hours[level]);
        assert.ok(units.every(unit => unit.resources.length > 0));
      } else {
        assert.equal(getYearPlanStats(units).hours, null, 'do not infer legacy durations from newer edition');
        assert.equal(getYearPlanStats(units).resources, 0, 'do not copy newer resource summaries into the legacy edition');
        assert.ok(units.every(unit => !unit.memoSequence));
      }
      assert.equal(filterYearPlanUnits(units, '', '', doc).length, units.length);
      assert.ok(filterYearPlanUnits(units, '', '2', doc).every(unit => unit.term === 2));
      assert.deepEqual(filterYearPlanUnits(units, 'zz-no-match-987', '', doc), []);
      const query = units[0].title;
      assert.ok(filterYearPlanUnits(units, `  ${query}  `, '', doc).some(unit => unit.id === units[0].id));
    }
  });

  test(`${level}: annual plan defaults to responsive schedule and keeps all four view controls`, () => {
    const html = renderToStaticMarkup(React.createElement(YearPlansViewer, { level }));
    for (const label of ['التوزيع السنوي', 'المقاطع والموارد', 'الوثيقة الأصلية', 'قارئ PDF', 'ساعات بناء الموارد', 'عرض الصفحة الأصلية', 'تصفية حسب الفصل']) assert.ok(html.includes(label), label);
    assert.ok(html.includes(`data-year-plans="${level}"`));
    assert.ok(html.includes('md:grid-cols-'));
    assert.ok(html.includes('دون الإدماج والاختبارات'));
    assert.ok(!html.includes('<iframe'), 'PDF loads only when selected');
    if (level === '3am') {
      assert.ok(html.includes('ملف PDF غير مرفق محلياً'));
      assert.ok(!html.includes('download='), 'never offer ministry category page as a PDF download');
      assert.ok(!html.includes('>64<'), 'do not substitute third-year guide hours for annual plan hours');
    } else assert.ok(html.includes('download=""'));
  });
}

test('fourth-year coordination stays one sequence split across two terms without double-counting', () => {
  const units = getYearPlanOutline('4am', 'annualPlan2023_4am');
  assert.equal(units.length, 4);
  assert.equal(getYearPlanStats(units).sequences, 3);
  assert.deepEqual(units.filter(unit => unit.sequence === 2).map(unit => unit.term), [1, 2]);
});

test('wrong-year and unknown plan IDs never borrow another year outline', () => {
  assert.deepEqual(getYearPlanOutline('1am', 'annualPlan2023_3am'), []);
  assert.deepEqual(getYearPlanOutline('3am', 'unknown'), []);
  assert.equal(getYearPlanStats([]).hours, null);
});

test('memo links use explicit exact sequence mappings and remain isolated from the official content', () => {
  const lessons = getOfficialCurriculumDatabase();
  for (const level of ['1am', '2am', '3am', '4am'] as const) {
    for (const unit of getYearPlanOutline(level, `annualPlan2023_${level}`)) {
      const memos = getYearPlanMemos(unit, level, lessons);
      assert.ok(memos.every(memo => memo.level === level && memo.maqta === unit.memoSequence));
      if (unit.memoSequence) assert.ok(memos.length > 0);
      else assert.deepEqual(memos, []);
    }
  }
  const units = getYearPlanOutline('1am', 'annualPlan2023_1am');
  assert.ok(getYearPlanMemos(units[0], '1am', lessons).length > 0);
  assert.deepEqual(getYearPlanMemos(units[0], '3am', lessons), []);
});

test('full-source search supplements curated resource headings without changing the content', async () => {
  const units = getYearPlanOutline('1am', 'annualPlan2023_1am');
  const [doc] = await loadOfficialSources(['annualPlan2023_1am']);
  assert.ok(filterYearPlanUnits(units, 'تَجْرِيبِيًّا', '', doc).some(unit => unit.sequence === 1));
  assert.deepEqual(filterYearPlanUnits(units, 'zz-no-match-987', '1', doc), []);
  assert.ok(filterYearPlanUnits(units, 'اَلْإِطْرَاح', '2', null).some(unit => unit.sequence === 5));
  assert.deepEqual(filterYearPlanUnits(units, 'اَلْإِطْرَاح', '1', null), []);
});


test('source term ranges include integration and assessment pages without including front matter', () => {
  assert.deepEqual(getYearPlanTermPages('annualPlan2023_1am', '2'), [8, 9, 10, 11, 12]);
  assert.ok(getYearPlanTermPages('annualPlan2023_1am', '3').includes(16));
  assert.ok(getYearPlanTermPages('learningPlan1am', '1').includes(10));
  assert.deepEqual(getYearPlanTermPages('unknown', '1'), []);
  assert.deepEqual(getYearPlanTermPages('annualPlan2023_1am', ''), []);
});

test('source week durations are preserved literally, not recalculated from hours', () => {
  const units = getYearPlanOutline('3am', 'annualPlan2023_3am');
  assert.equal(units[2].hours, 6);
  assert.equal(units[2].weeksLabel, '4 أسابيع');
  assert.ok(getYearPlanOutline('1am', 'annualPlan2023_1am').every(unit => unit.weeksLabel));
  assert.ok(getYearPlanOutline('1am', 'learningPlan1am').every(unit => !unit.weeksLabel));
});
