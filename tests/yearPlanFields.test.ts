import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { YEAR_PLAN_FIELD_LOCATORS } from '../src/data/yearPlanFields';
import { getYearPlanOutline } from '../src/data/yearPlanOutlines';
import { getYearPlans } from '../src/services/yearReferences';
import { loadOfficialSources } from '../src/services/knowledgeOfficialSources';
import { getYearPlanFields, PLAN_FIELD_LABELS, PLAN_FIELD_ORDER, planSourcePageHash } from '../src/services/yearPlanFields';
import { filterYearPlanUnits } from '../src/services/yearPlanContent';
import { YearPlanUnitFields } from '../src/components/YearPlanUnitFields';
import { YearPlansViewer } from '../src/components/YearPlansViewer';

for (const level of ['1am', '2am', '3am', '4am'] as const) {
  test(`${level}: both editions have verified resource, execution and assessment excerpts for every unit`, async () => {
    for (const plan of getYearPlans(level)) {
      const [doc] = await loadOfficialSources([plan.id]);
      const units = getYearPlanOutline(level, plan.id);
      assert.deepEqual(Object.keys(YEAR_PLAN_FIELD_LOCATORS[plan.id]), units.map(unit => unit.id));
      for (const unit of units) {
        const fields = getYearPlanFields(plan.id, unit, doc);
        assert.deepEqual(fields.map(field => field.key), PLAN_FIELD_ORDER);
        for (const field of fields) {
          assert.notEqual(field.status, 'source-changed', `${plan.id} ${unit.id}: ${field.key}`);
          assert.notEqual(field.status, 'source-unavailable');
          if (['resources', 'execution', 'assessment'].includes(field.key)) assert.equal(field.status, 'ready', `${plan.id} ${unit.id}: ${field.key}`);
          const locators = YEAR_PLAN_FIELD_LOCATORS[plan.id][unit.id][field.key] || [];
          assert.equal(field.excerpts.length, locators.length);
          for (let i = 0; i < field.excerpts.length; i++) {
            const excerpt = field.excerpts[i];
            const [page, from, to, hash] = locators[i];
            const original = doc.pages.find(item => item.page === page)!;
            assert.equal(planSourcePageHash(original.text), hash);
            assert.equal(excerpt.page, page);
            assert.ok(unit.pages.includes(page));
            assert.ok(excerpt.text.length > 0);
            assert.equal(excerpt.text, original.text.split('\n').slice(from, to + 1).join('\n').trim());
            assert.ok(original.text.includes(excerpt.text), 'no invented or rewritten quotations');
          }
        }
      }
    }
  });

  test(`${level}: default schedule exposes the five official field labels and no invented notes`, () => {
    const html = renderToStaticMarkup(React.createElement(YearPlansViewer, { level }));
    for (const key of PLAN_FIELD_ORDER) assert.ok(html.includes(PLAN_FIELD_LABELS[key]), key);
    assert.ok(html.includes('مقتطفات موثقة'));
    assert.ok(html.includes('لم يُفهرس لهذا المقطع مقتطف مستقل لهذا الحقل'));
    assert.ok(html.includes('هذا لا يعني غيابه عن الوثيقة'));
  });
}

test('source guards reject wrong editions and changed pages instead of silently shifting columns', async () => {
  const unit = getYearPlanOutline('1am', 'learningPlan1am')[0];
  const [older] = await loadOfficialSources(['learningPlan1am']);
  const [newer] = await loadOfficialSources(['annualPlan2023_1am']);
  assert.ok(getYearPlanFields('learningPlan1am', unit, newer).every(field => field.status === 'source-unavailable'));
  const changed = { ...older, pages: older.pages.map(page => ({ ...page, text: `new heading\n${page.text}` })) };
  assert.ok(getYearPlanFields('learningPlan1am', unit, changed).every(field => field.status === 'source-changed' && !field.excerpts.length));
  const missing = { ...older, pages: [] };
  assert.ok(getYearPlanFields('learningPlan1am', unit, missing).every(field => field.status === 'source-changed'));
  assert.ok(getYearPlanFields('learningPlan1am', unit, null).every(field => field.status === 'source-unavailable'));
  assert.ok(getYearPlanFields('unknown', unit, newer).every(field => field.status === 'unindexed'));
});

test('legacy notes and durations are actual edition-specific excerpts, not newer guide summaries', async () => {
  const unit = getYearPlanOutline('2am', 'learningPlan2am')[0];
  const [doc] = await loadOfficialSources(['learningPlan2am']);
  const fields = getYearPlanFields('learningPlan2am', unit, doc);
  assert.equal(fields.find(field => field.key === 'duration')!.excerpts[0].text, '12 أسبوع');
  const notes = fields.find(field => field.key === 'notes')!;
  assert.equal(notes.status, 'ready');
  assert.ok(notes.excerpts[0].text.includes('تكييف'));
  assert.equal(unit.hours, undefined, 'excerpt durations do not imply computed aggregate hours');
  const currentUnit = getYearPlanOutline('2am', 'annualPlan2023_2am')[0];
  const [current] = await loadOfficialSources(['annualPlan2023_2am']);
  assert.equal(getYearPlanFields('annualPlan2023_2am', currentUnit, current).find(field => field.key === 'notes')!.status, 'unindexed');
});

test('shared field renderer exposes sourced excerpts, page actions and honest loading/failure states', async () => {
  const unit = getYearPlanOutline('1am', 'learningPlan1am')[0];
  const [doc] = await loadOfficialSources(['learningPlan1am']);
  const props = { planId: 'learningPlan1am', unit, doc, loading: false, onShowSource: () => {} };
  const html = renderToStaticMarkup(React.createElement(YearPlanUnitFields, props));
  assert.equal((html.match(/data-plan-field="/g) || []).length, 5);
  assert.ok(html.includes('نشاط: يكشف تجريبيا'));
  assert.ok(html.includes('06 أسابيع'));
  assert.ok(html.includes('بإمكان الأساتذة تكييف'));
  assert.ok(html.includes('عرض الصفحة الأصلية — ص 4'));
  const loading = renderToStaticMarkup(React.createElement(YearPlanUnitFields, { ...props, doc: null, loading: true }));
  assert.ok(loading.includes('جارٍ تحميل المقتطف الموثق'));
  assert.ok(!loading.includes('نشاط: يكشف تجريبيا'));
  const failed = renderToStaticMarkup(React.createElement(YearPlanUnitFields, { ...props, doc: null }));
  assert.ok(failed.includes('تعذر تحميل مقتطف هذا الحقل'));
  assert.ok(failed.includes('النص الكامل — ص 4'));
  const code = readFileSync('src/components/YearPlansViewer.tsx', 'utf8');
  assert.equal((code.match(/<YearPlanUnitFields /g) || []).length, 2, 'schedule and unit cards use the same renderer');
});

test('source-excerpt content remains searchable without a second copy of the official text', async () => {
  const units = getYearPlanOutline('4am', 'learningPlan4am');
  const [doc] = await loadOfficialSources(['learningPlan4am']);
  assert.ok(filterYearPlanUnits(units, 'تكييف', '', doc).some(unit => unit.sequence === 1));
  assert.ok(filterYearPlanUnits(units, 'الْمَنَاعَة', '2', doc).some(unit => unit.id === '2-2'));
});
