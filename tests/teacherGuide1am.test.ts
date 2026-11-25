import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceGuide1AMViewer } from '../src/components/SourceGuide1AMViewer';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';
import { pages } from '../src/data/official/annualPlan2023_1am';
import {
  TEACHER_GUIDE_1AM_SEQUENCES, filterTeacherGuide1am,
  getTeacherGuide1amLessons, getTeacherGuide1amSource,
} from '../src/data/teacherGuide1am';

const lessons = getOfficialCurriculumDatabase();

test('1AM guide references eight official sequences and their original pages and durations', () => {
  const sequences = TEACHER_GUIDE_1AM_SEQUENCES;
  assert.equal(sequences.length, 8);
  assert.equal(new Set(sequences.map(sequence => sequence.id)).size, 8);
  assert.equal(sequences.reduce((sum, sequence) => sum + sequence.hours, 0), 48);
  assert.deepEqual(sequences.map(sequence => sequence.hours), [12, 12, 5, 5, 4, 4, 4, 2]);
  assert.deepEqual(sequences.map(sequence => sequence.term), [1, 1, 2, 2, 2, 3, 3, 3]);
  for (const sequence of sequences) {
    assert.ok(sequence.priorKnowledge.length && sequence.resources.length && sequence.indicators.length);
    for (const page of sequence.pages) assert.ok(pages.some(p => p.page === page), `source page ${page} exists`);
    assert.ok(lessons.some(lesson => lesson.level === '1am' && lesson.maqta === sequence.lessonSequence));
  }
  const source = getTeacherGuide1amSource();
  assert.equal(source.id, 'annualPlan2023_1am');
  assert.equal(source.pages, 16);
  assert.ok(existsSync(`public${source.url}`));
});

test('1AM guide retains all current memos but does not label the extra archive sequence as an official ninth sequence', () => {
  const ownLessons = getTeacherGuide1amLessons(lessons);
  assert.equal(ownLessons.length, 27);
  assert.ok(ownLessons.every(lesson => lesson.level === '1am'));
  const sequences = new Set(TEACHER_GUIDE_1AM_SEQUENCES.map(sequence => sequence.lessonSequence));
  const archiveOnly = ownLessons.filter(lesson => !sequences.has(lesson.maqta));
  assert.deepEqual(archiveOnly.map(lesson => lesson.memoNumber), ['21']);
  const changed = { ...ownLessons[0], ta3alom: 'تعلم محدث من الأستاذ' };
  assert.equal(getTeacherGuide1amLessons([changed])[0].ta3alom, changed.ta3alom);
  assert.deepEqual(getTeacherGuide1amLessons([]), []);
});

test('guide search finds concepts, prerequisites, and activities with normalized Arabic', () => {
  assert.deepEqual(filterTeacherGuide1am('التخمّر').map(sequence => sequence.id), ['energy-plant']);
  assert.ok(filterTeacherGuide1am('الاملاح المعدنيه').length === 0, 'normalization does not invent spelling substitutions');
  assert.ok(filterTeacherGuide1am('الأَمْلاح المعدنية').some(sequence => sequence.id === 'nutrition-plant'));
  assert.equal(filterTeacherGuide1am('nonexistent-90817').length, 0);
  assert.equal(getTeacherGuide1amLessons(lessons, 'nonexistent-90817').length, 0);
  assert.ok(getTeacherGuide1amLessons(lessons, 'تحليل الحليب').length > 0);
});

test('redesigned guide restores the guide banner, four sections, actions and accessible sequence cards', () => {
  const html = renderToStaticMarkup(React.createElement(SourceGuide1AMViewer, { lessons, onOpenMemoUnit: () => {} }));
  for (const text of ['المخططات السنوية ودليل بناء التعلمات — السنة الأولى متوسط', 'المقاطع والوحدات', 'المذكرات النموذجية والأنشطة', 'الكفاءات والتقويم التكويني', 'قارئ الـ PDF المدمج', 'فتح المستند الرسمي', 'تحميل', 'طباعة', 'المكتسبات القبلية', 'الموارد التعلمية', 'المفاهيم الأساسية', 'سيرورة الأنشطة والتوجيه المنهجي']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('aria-label="البحث في دليل السنة الأولى"'));
  assert.ok(html.includes('aria-label="أقسام دليل الأستاذ للسنة الأولى"'));
  assert.ok(html.includes('aria-controls="guide-1am-nutrition-human"'));
  assert.ok(html.includes('aria-expanded="true"'));
  assert.ok(html.includes('ليست كتاب دليل مستقل'));
  assert.ok(html.includes('ليست نص الدليل'));
  assert.ok(html.includes(`${getTeacherGuide1amSource().url}#page=5`));
  assert.ok(!html.includes('<iframe'), 'PDF is only mounted after selecting its tab');
});

test('guide can display an empty or edited lesson database without substituting archive defaults', () => {
  const html = renderToStaticMarkup(React.createElement(SourceGuide1AMViewer, { lessons: [] }));
  assert.match(html, />0<\/div><div><div[^>]*>المذكرات المرتبطة/);
  assert.ok(html.includes('المقاطع البيداغوجية'), 'official outline remains available independently');
});

test('App uses the dedicated 1AM guide while preserving all other year sections', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  assert.ok(app.includes('<SourceGuide1AMViewer lessons={curriculumLessons} onOpenMemoUnit='));
  for (const year of [2, 3, 4]) assert.ok(app.includes(`<SourceGuide${year}AMViewer`));
  assert.ok(app.includes('<SourceMemo1AMViewer'));
  assert.ok(app.includes('<YearPlansViewer key={selectedLevel} level={selectedLevel}'));
});
