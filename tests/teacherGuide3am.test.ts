import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceGuide3AMViewer } from '../src/components/SourceGuide3AMViewer';
import { SourceGuide2AMViewer } from '../src/components/SourceGuide2AMViewer';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';
import { MAJOR_SEQUENCES_3AM, GUIDE_3AM_SEQUENCES, OFFICIAL_SOLUTIONS_3AM, PEDAGOGICAL_CONCEPTS_3AM, filterGuide3amSolutions, filterGuide3amConcepts } from '../src/data/teacherGuide3am';

const lessons = getOfficialCurriculumDatabase();
const third = renderToStaticMarkup(React.createElement(SourceGuide3AMViewer, { lessons }));
const second = renderToStaticMarkup(React.createElement(SourceGuide2AMViewer, { lessons }));

test('third year uses the common shell, resource cards, search and PDF controls', () => {
  const rootClass = (html: string) => html.match(/data-guide-level="[^"]+" class="([^"]+)"/)?.[1];
  const resourceClass = (html: string) => html.match(/data-guide-resource="1" class="([^"]+)"/)?.[1];
  assert.ok(rootClass(third));
  assert.equal(rootClass(third), rootClass(second));
  assert.ok(resourceClass(third));
  assert.equal(resourceClass(third), resourceClass(second));
  assert.equal((third.match(/data-guide-sequence=/g) || []).length, 4);
  for (const label of ['المقاطع والوحدات', 'المذكرات النموذجية والأنشطة', 'قارئ الـ PDF المدمج', 'تصحيحات التمارين والتقويم', 'معجم المفاهيم البيداغوجية (8)', 'الأنشطة التعلمية', '96 صفحة', 'دار القصبة']) assert.ok(third.includes(label), label);
  assert.ok(third.includes('siences3am_gen2-guide_book_2__12109d38.pdf'));
  assert.ok(third.includes('download="sciences3am-guide.pdf"'));
  assert.ok(!third.includes('<iframe'), 'PDF loads only after opening its tab');
  assert.ok(!third.includes('25 مصطلح'));
  assert.ok(readFileSync('src/components/SourceGuide3AMViewer.tsx', 'utf8').includes('<TeacherGuideViewer'));
});

test('third-year adapter preserves every activity, guidance, timetable and duration without inventing prerequisites', () => {
  assert.equal(GUIDE_3AM_SEQUENCES.reduce((sum, sequence) => sum + sequence.hours, 0), 64);
  assert.equal(GUIDE_3AM_SEQUENCES.reduce((sum, sequence) => sum + sequence.resources.length, 0), 16);
  assert.equal(GUIDE_3AM_SEQUENCES.reduce((sum, sequence) => sum + sequence.resources.reduce((n, resource) => n + resource.coreConcepts.length, 0), 0), 38);
  GUIDE_3AM_SEQUENCES.forEach((sequence, i) => {
    const original = MAJOR_SEQUENCES_3AM[i];
    assert.equal(sequence.id, original.id);
    assert.equal(sequence.number, original.num);
    assert.equal(sequence.title, original.title);
    assert.equal(sequence.hours, original.hours);
    assert.equal(sequence.weeks, original.weeks);
    assert.equal(sequence.targetCompetency, original.targetCompetency);
    assert.deepEqual(sequence.priorKnowledge, []);
    assert.equal(sequence.resources.length, original.subUnits.length);
    sequence.resources.forEach((resource, j) => {
      const unit = original.subUnits[j];
      assert.equal(resource.num, unit.num);
      assert.equal(resource.title, unit.title);
      assert.equal(resource.weeks, `الحجم: ${unit.hours} ساعات`);
      assert.deepEqual(resource.coreConcepts, unit.activities);
      assert.equal(resource.pedagogicalGuidance, unit.guidance);
    });
  });
});

test('all original third-year sequences, solutions and concept entries are unchanged by extraction', () => {
  // Snapshot verified against the original component before migrating its rendering.
  assert.equal(createHash('sha256').update(JSON.stringify([MAJOR_SEQUENCES_3AM, OFFICIAL_SOLUTIONS_3AM, PEDAGOGICAL_CONCEPTS_3AM])).digest('hex'), '6a9baf90b3402441c17dce147a7eae28848b10bf9d0edb13fc4aa9752d7a61f0');
  assert.equal(OFFICIAL_SOLUTIONS_3AM.length, 6);
  assert.equal(PEDAGOGICAL_CONCEPTS_3AM.length, 8);
});

test('solutions and concepts remain searchable across every field with Arabic normalization and empty states', () => {
  for (const item of OFFICIAL_SOLUTIONS_3AM) {
    for (const field of [item.unitTitle, item.exerciseTitle, item.question, item.solution]) assert.ok(filterGuide3amSolutions(field).includes(item));
  }
  for (const item of PEDAGOGICAL_CONCEPTS_3AM) {
    for (const field of [item.term, item.french, item.definition, item.classroomApplication]) assert.ok(filterGuide3amConcepts(field).includes(item));
  }
  assert.deepEqual(filterGuide3amSolutions('   '), OFFICIAL_SOLUTIONS_3AM);
  assert.deepEqual(filterGuide3amConcepts('   '), PEDAGOGICAL_CONCEPTS_3AM);
  assert.deepEqual(filterGuide3amConcepts('zz-no-match-994'), []);
  assert.deepEqual(filterGuide3amSolutions('zz-no-match-994'), []);
  assert.ok(filterGuide3amConcepts('الْكَفَاءَات').length > 0);
});
