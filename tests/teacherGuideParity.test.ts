import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceGuide1AMViewer } from '../src/components/SourceGuide1AMViewer';
import { SourceGuide2AMViewer } from '../src/components/SourceGuide2AMViewer';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';
import { TEACHER_GUIDE_1AM_SEQUENCES } from '../src/data/teacherGuide1am';
import { GUIDE_1AM_RESOURCE_DETAILS, OFFICIAL_1AM_GUIDE_SEQUENCES } from '../src/data/teacherGuide1amResources';
import { OFFICIAL_2AM_SEQUENCES } from '../src/data/teacherGuide2am';

const lessons = getOfficialCurriculumDatabase();
const first = renderToStaticMarkup(React.createElement(SourceGuide1AMViewer, { lessons }));
const second = renderToStaticMarkup(React.createElement(SourceGuide2AMViewer, { lessons }));

test('first and second year use the same guide shell, tabs, statistic cards and resource cards', () => {
  const rootClass = (html: string) => html.match(/data-guide-level="[^"]+" class="([^"]+)"/)?.[1];
  assert.ok(rootClass(first));
  assert.equal(rootClass(first), rootClass(second));
  const nav = (html: string) => html.match(/<nav[^>]*class="([^"]+)"[^>]*>([\s\S]*?)<\/nav>/)!;
  assert.equal(nav(first)[1], nav(second)[1]);
  const buttonClasses = (html: string) => [...nav(html)[2].matchAll(/<button[^>]*class="([^"]+)"/g)].map(match => match[1]);
  assert.equal(buttonClasses(first).length, 4);
  assert.deepEqual(buttonClasses(first), buttonClasses(second));
  const cardClasses = (html: string) => html.match(/data-guide-resource="1" class="([^"]+)"/)?.[1];
  assert.ok(cardClasses(first));
  assert.equal(cardClasses(first), cardClasses(second));
  for (const html of [first, second]) {
    for (const label of ['المقاطع والوحدات', 'المذكرات النموذجية والأنشطة', 'قارئ الـ PDF المدمج', 'الكفاءات والتقويم التكويني', 'المكتسبات القبلية المجندة', 'المفاهيم الأساسية', 'سيرورة الأنشطة والتوجيه المنهجي', 'الحجم الساعي الإجمالي']) assert.ok(html.includes(label), label);
    assert.ok(!html.includes('<iframe'), 'PDF remains lazy for both years');
  }
});

test('shared layout retains distinct year content, PDF links and sequence counts', () => {
  assert.equal((first.match(/data-guide-sequence=/g) || []).length, 8);
  assert.equal((second.match(/data-guide-sequence=/g) || []).length, 5);
  assert.ok(first.includes('plans_annuels2023-sciences1am_6aafcda9.pdf'));
  assert.ok(second.includes('plans_annuels2023-sciences2am_97a62a5b.pdf'));
  assert.ok(first.includes('مصدر الأغذية وتركيبها'));
  assert.ok(!first.includes('المقطع التعلمي 01: الوسط الحي'));
  assert.ok(second.includes('المقطع التعلمي 01: الوسط الحي'));
  assert.ok(!second.includes('المقطع التعلمي 01: التغذية عند الإنسان'));
  assert.ok(!first.includes('100%'), 'editorial 1AM summaries do not claim verbatim official fidelity');
});

test('all 21 first-year resources have their own concepts and guidance without invented resource durations', () => {
  assert.equal(OFFICIAL_1AM_GUIDE_SEQUENCES.reduce((sum, sequence) => sum + sequence.resources.length, 0), 21);
  OFFICIAL_1AM_GUIDE_SEQUENCES.forEach((sequence, i) => {
    const source = TEACHER_GUIDE_1AM_SEQUENCES[i];
    assert.equal(sequence.number, i + 1);
    assert.deepEqual(sequence.sourcePages, source.pages);
    assert.equal(sequence.hours, source.hours);
    assert.equal(typeof sequence.weeks, 'number');
    assert.equal(Number(sequence.weeks) * 2, source.hours);
    assert.equal(sequence.resources.length, GUIDE_1AM_RESOURCE_DETAILS[sequence.id].length);
    assert.deepEqual(sequence.resources.map(resource => resource.title), source.resources);
    const guidance = new Set<string>();
    sequence.resources.forEach((resource, n) => {
      assert.equal(resource.num, n + 1);
      assert.ok(resource.coreConcepts.length > 0);
      assert.ok(resource.pedagogicalGuidance.length > 40);
      assert.ok(resource.weeks.includes('لا مدة مستقلة مثبتة'));
      guidance.add(resource.pedagogicalGuidance);
    });
    assert.equal(guidance.size, sequence.resources.length, 'resource guidance is not a repeated sequence paragraph');
  });
});

test('second-year extracted data preserves five sequences and their resource structure', () => {
  assert.equal(OFFICIAL_2AM_SEQUENCES.length, 5);
  assert.deepEqual(OFFICIAL_2AM_SEQUENCES.map(sequence => sequence.number), [1, 2, 3, 4, 5]);
  assert.ok(OFFICIAL_2AM_SEQUENCES.every(sequence => sequence.resources.every(resource => resource.coreConcepts.length && resource.pedagogicalGuidance)));
  for (const year of [1, 2]) {
    const code = readFileSync(`src/components/SourceGuide${year}AMViewer.tsx`, 'utf8');
    assert.ok(code.includes('<TeacherGuideViewer'), 'the wrappers cannot drift into different layouts');
  }
});
