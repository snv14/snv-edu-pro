import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OfficialAnnualDistribution } from '../src/components/OfficialAnnualDistribution';
import type { MemoConfig } from '../src/types';

const config = { schoolYear: '2025-2026', teacherName: 'الأستاذ', schoolName: 'المتوسطة', directorate: 'المديرية' } as MemoConfig;

test('four levels use the same screen and print headers while retaining their own data', () => {
  const labels = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'];
  const headers: string[] = [];
  for (const [index, level] of (['1am','2am','3am','4am'] as const).entries()) {
    const html = renderToStaticMarkup(React.createElement(OfficialAnnualDistribution, { level, config, showToast: () => {} }));
    assert.match(html, new RegExp(`السنة ${labels[index]} متوسط`));
    const screen = html.match(/<table class="distribution-screen-table[\s\S]*?<thead>([\s\S]*?)<\/thead>/);
    const print = html.match(/<table class="annual-distribution-print-table[\s\S]*?<thead>([\s\S]*?)<\/thead>/);
    assert.ok(screen); assert.ok(print);
    // Compare structure and headings, excluding the level-specific field title.
    headers.push(screen[1].replace(/الميدان: [\s\S]*?<\/th>/, 'الميدان: </th>'));
    assert.match(print[1], /الحصة الأولى/);
    assert.match(print[1], /الحصة الثانية/);
    assert.match(print[1], /المورد المعرفي/);
    if (level === '4am') assert.match(html, /الكفاءة الشاملة/);
    if (level === '2am') assert.match(html, /تصحيح الاختبار الأول/);
  }
  for (const header of headers) assert.equal(header, headers[0]);
});
