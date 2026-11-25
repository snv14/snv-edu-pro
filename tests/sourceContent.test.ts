import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceContentViewer } from '../src/components/SourceContentViewer';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';
import { loadOfficialSources } from '../src/services/knowledgeOfficialSources';
import {
  buildSourceContent, buildSourceContentExport, filterSourceContent, getSourceContentDocuments, getSourceContentLinks,
  normalizeSourceQuery, SOURCE_CONTENT_LEVEL_LABELS, type SourceContentKind,
} from '../src/services/sourceContent';
import type { LessonMemo } from '../src/types';

const lessons = getOfficialCurriculumDatabase();
const kinds: SourceContentKind[] = ['memos', 'activities', 'tables', 'diagrams', 'evaluations'];

for (const level of ['2am', '3am', '4am'] as const) {
  test(`${level}: source index is derived from current lessons without mixing years or mutating data`, () => {
    const before = JSON.stringify(lessons);
    const records = buildSourceContent(level, lessons);
    const own = lessons.filter(lesson => lesson.level === level);
    assert.ok(own.length > 0);
    assert.deepEqual(records.filter(r => r.kind === 'memos').map(r => r.lesson), own);
    assert.equal(records.filter(r => r.kind === 'activities').length, own.reduce((sum, lesson) => sum + lesson.anshita.length, 0));
    assert.equal(records.filter(r => r.kind === 'evaluations').length, own.filter(l => l.taqwim?.trim() || l.taqwimTables?.length).length);
    assert.equal(new Set(records.map(r => r.id)).size, records.length);
    assert.ok(records.every(r => r.lesson.level === level));
    assert.ok(records.filter(r => r.kind === 'diagrams').every(r => r.diagram?.svg || r.diagram?.imageUrl));
    const exported = JSON.parse(JSON.stringify(buildSourceContentExport(level, lessons)));
    assert.equal(exported.format, 'snv-source-content');
    assert.equal(exported.version, 1);
    assert.deepEqual(exported.lessons, JSON.parse(JSON.stringify(own)), 'export retains all serializable lesson data, not just search results');
    assert.ok(exported.officialDocumentManifest.every(entry => entry.level === level));
    assert.match(exported.provenance, /ليس نصاً حرفياً/);
    assert.equal(JSON.stringify(lessons), before);
    assert.deepEqual(buildSourceContent(level, lessons).map(r => r.id), records.map(r => r.id));
    const sequence = own[0].maqta;
    for (const kind of kinds) {
      assert.ok(filterSourceContent(records, kind, '', sequence).every(r => r.kind === kind && r.lesson.maqta === sequence));
      assert.equal(filterSourceContent(records, kind, 'unmatchable-query-918273').length, 0);
    }
  });

  test(`${level}: official pages keep their source, level, and original page numbers`, async () => {
    const manifest = getSourceContentDocuments(level);
    assert.ok(manifest.length >= 2);
    assert.ok(manifest.every(entry => entry.level === level));
    const docs = await loadOfficialSources(manifest.map(entry => entry.id));
    assert.equal(docs.length, manifest.length);
    for (const doc of docs) {
      const entry = manifest.find(entry => doc.id === `kb-official-${entry.id}`)!;
      assert.equal(doc.source, 'official');
      assert.equal(doc.level, level);
      assert.equal(doc.pages.length, entry.pages);
      const pageNumbers = doc.pages.map(page => page.page);
      assert.equal(new Set(pageNumbers).size, pageNumbers.length);
      assert.ok(pageNumbers.every((page, i) => Number.isInteger(page) && page >= 1 && (!i || page > pageNumbers[i - 1])));
      if (entry.id === 'teacherGuide4am') {
        // الصفحات الفارغة لا تُفهرس؛ نحافظ على أرقام PDF ولا نعيد ترقيمها.
        assert.equal(pageNumbers[23], 25);
        assert.equal(pageNumbers.at(-1), 155);
      }
    }
    const links = getSourceContentLinks(level);
    assert.ok(links.some(link => link.url.startsWith('/assets/')), 'an original PDF is available');
    for (const link of links.filter(link => link.url.startsWith('/assets/'))) {
      assert.ok(existsSync(`public${link.url}`), link.url);
    }
    if (level === '3am') {
      assert.ok(links.some(link => link.url.includes('siences3am_gen2-guide_book')));
      assert.ok(links.some(link => link.url.includes('learning-plan-3am-2021-2022')));
    }
  });

  test(`${level}: common source interface exposes real counts and distinguishes organized content from original text`, () => {
    const html = renderToStaticMarkup(React.createElement(SourceContentViewer, {
      level, lessons, guide: React.createElement('p', null, 'legacy-guide-sentinel'), onOpenMemoUnit: () => {},
    }));
    assert.ok(html.includes(`المحتوى المصدري — ${SOURCE_CONTENT_LEVEL_LABELS[level]}`));
    for (const label of ['المذكرات', 'الأنشطة', 'الجداول', 'الرسوم والمخططات', 'التقويمات', 'المصادر والصفحات', 'الدليل البيداغوجي']) assert.ok(html.includes(label), label);
    assert.ok(html.includes('تصدير محتوى السنة JSON'));
    assert.ok(html.includes('ليس نقلاً حرفياً'));
    assert.ok(html.includes('فتح المذكرة المرتبطة'));
    assert.ok(html.includes('aria-label="البحث في المحتوى المصدري"'));
    assert.ok(html.includes('aria-label="تصفية حسب المقطع"'));
    assert.ok(!html.includes('legacy-guide-sentinel'), 'legacy guide is deferred until selected');
    assert.ok(!html.includes('<iframe'), 'no eager PDF load');
  });
}

test('source content handles real tables, activity diagram aliases, legacy media and duplicate SVGs', () => {
  const table = { table_title: 'جدول فعلي', headers: ['متغير', 'نتيجة'], rows: [['ضوء', 'نمو']] };
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>نبات</text></svg>';
  const lesson: LessonMemo = {
    level: '2am', maqta: 'مقطع تجريبي', mawrid: 'المورد', midan: 'الميدان', ta3alom: 'التعلم', memoNumber: '01',
    anshita: [
      { title: 'نشاط أول', asila: 'الأسئلة', ajwiba: 'استنتاج الأوبار', tables: [table], diagrams: [{ diagram_title: 'رسم النشاط', diagram_svg: svg }] },
      { title: 'نشاط ثان', asila: 'اختبار مستقل', ajwiba: 'إجابة مستقلة' },
    ],
    diagrams: [{ title: 'نسخة للرسم', svg }],
    diagram: { title: 'صورة أخرى', imageUrl: '/assets/example.png' },
    wadiyaTables: [table], irsaeTables: [table], taqwimTables: [table],
  };
  const records = buildSourceContent('2am', [lesson]);
  assert.equal(records.filter(r => r.kind === 'tables').length, 4);
  assert.equal(records.filter(r => r.kind === 'diagrams').length, 2, 'duplicate activity/lesson SVG appears once');
  assert.equal(records.filter(r => r.kind === 'evaluations').length, 1, 'table-only evaluation is retained');
  const matches = filterSourceContent(records, 'activities', 'استنتاج الاوبار');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].title, 'نشاط أول', 'sibling content does not cause a false match');
  assert.equal(filterSourceContent(records, 'tables', 'نمو').length, 4);
  assert.equal(filterSourceContent(records, 'memos', '', 'مقطع آخر').length, 0);
  assert.equal(buildSourceContent('3am', [lesson]).length, 0);
});

test('Arabic source search ignores diacritics, tatweel, hamza forms and extra whitespace', () => {
  assert.equal(normalizeSourceQuery('  إِرْسَاءُ   المَـوَارِدِ '), 'ارساء الموارد');
  assert.equal(normalizeSourceQuery('أعلى'), 'اعلي');
});

test('empty data has an honest empty state and no fabricated records', () => {
  assert.deepEqual(buildSourceContent('4am', []), []);
  const html = renderToStaticMarkup(React.createElement(SourceContentViewer, { level: '4am', lessons: [] }));
  assert.match(html, /لا يوجد محتوى مطابق/);
});

test('all years share the source entry point while keeping the original 1AM archive and existing guides', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  assert.match(app, /<YearSectionTabs activeTab=\{yearSubTab\}/);
  assert.match(app, /<YearSectionTabs mobile activeTab=\{yearSubTab\}/);
  assert.match(app, /<SourceMemo1AMViewer/);
  assert.match(app, /<SourceContentViewer[\s\S]*?key=\{selectedLevel\}/);
  for (const year of ['2', '3', '4']) assert.ok(app.includes(`<SourceGuide${year}AMViewer`));
});
