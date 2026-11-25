import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { YearSectionTabs, YEAR_SECTION_TABS } from '../src/components/YearSectionTabs';
import { YearPlansViewer } from '../src/components/YearPlansViewer';
import { getYearPlans, YEAR_REFERENCE_LABELS } from '../src/services/yearReferences';
import { loadOfficialSources } from '../src/services/knowledgeOfficialSources';

for (const level of ['1am', '2am', '3am', '4am'] as const) {
  test(`${level}: year plans contain both official editions, isolated from guides and other years`, async () => {
    const plans = getYearPlans(level);
    assert.deepEqual(plans.map(plan => plan.id), [`annualPlan2023_${level}`, `learningPlan${level}`]);
    assert.ok(plans.every(plan => plan.level === level && plan.kind === 'progression'));
    for (const plan of plans) {
      if (plan.url.startsWith('/assets/')) assert.ok(existsSync(`public${plan.url}`), plan.url);
    }
    if (level !== '3am') assert.ok(plans[0].url.startsWith('/assets/aistudio/plans_annuels2023-'));
    if (level === '1am' || level === '3am') assert.ok(plans[1].url.includes(`learning-plan-${level}-2021-2022.pdf`));
    const docs = await loadOfficialSources(plans.map(plan => plan.id));
    assert.equal(docs.length, 2);
    assert.ok(docs.every(doc => doc.level === level && doc.pages.length > 0));
  });

  test(`${level}: plans interface retains separate editions and exposes search and source links`, () => {
    const markup = renderToStaticMarkup(React.createElement(YearPlansViewer, { level }));
    assert.ok(markup.includes(`المخططات — ${YEAR_REFERENCE_LABELS[level]}`));
    assert.ok(markup.includes('2022/2023'));
    assert.ok(markup.includes('2021/2022'));
    assert.ok(markup.includes('لا يحل محل'));
    assert.ok(markup.includes('aria-label="البحث في المخطط"'));
    assert.ok(markup.includes('aria-label="اختيار المخطط"'));
    assert.ok(markup.includes(`href="${getYearPlans(level)[0].url}"`));
    assert.ok(markup.includes('جارٍ تحميل صفحات المخطط'));
  });
}

for (const mobile of [false, true]) {
  test(`year navigation exposes content, plans, and teacher guide together (${mobile ? 'mobile' : 'desktop'})`, () => {
    assert.deepEqual(YEAR_SECTION_TABS.map(tab => tab.id), ['memos', 'source', 'plans', 'guide', 'distribution']);
    for (const activeTab of ['source', 'plans', 'guide'] as const) {
      const markup = renderToStaticMarkup(React.createElement(YearSectionTabs, { activeTab, onChange: () => {}, activeClassName: 'active-test-class', mobile }));
      for (const tab of YEAR_SECTION_TABS) {
        assert.ok(markup.includes(tab.label));
        assert.ok(markup.includes(`id="year-subtab-${tab.id}${mobile ? '-mobile' : ''}"`));
      }
      assert.equal((markup.match(/aria-pressed="true"/g) || []).length, 1);
      assert.match(markup, new RegExp(`id="year-subtab-${activeTab}${mobile ? '-mobile' : ''}" aria-pressed="true"`));
    }
  });
}

test('1AM guide identifies the available integrated guidance rather than inventing a standalone book', () => {
  const markup = renderToStaticMarkup(React.createElement(YearPlansViewer, { level: '1am', guideMode: true }));
  assert.ok(markup.includes('دليل الأستاذ — السنة الأولى متوسط'));
  assert.ok(markup.includes('دليل بناء التعلمات'));
  assert.ok(markup.includes('لا يتوفر هنا ملف مستقل'));
  assert.ok(markup.includes('plans_annuels2023-sciences1am_6aafcda9.pdf'));
});

test('App keeps source viewers and routes independent plans and guides for all four years', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  assert.ok(app.includes("yearSubTab === 'source'"));
  assert.ok(app.includes("yearSubTab === 'plans'"));
  assert.ok(app.includes("yearSubTab === 'guide'"));
  assert.ok(app.includes('<SourceMemo1AMViewer'));
  assert.ok(app.includes('<SourceContentViewer'));
  assert.ok(app.includes('<YearPlansViewer key={selectedLevel} level={selectedLevel}'));
  assert.ok(app.includes('level="1am" guideMode'));
  for (const level of [2, 3, 4]) assert.ok(app.includes(`<SourceGuide${level}AMViewer`));
});
