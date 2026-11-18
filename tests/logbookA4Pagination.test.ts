import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  paginateLogbookEntries,
  getAvailableBodyHeightPx,
  STANDARD_FILLER_ROW_HEIGHT_PX,
  type LogbookPaginatableRow,
} from '../src/utils/logbookA4Pagination';
import { DailyLogSheetTemplate } from '../src/components/DailyLogSheetTemplate';
import { TealLogSheetTemplate } from '../src/components/TealLogSheetTemplate';
import { LogbookPrintBook } from '../src/components/LogbookPrintBook';
import { generateLogbookDocx } from '../src/utils/docxExportLogbook';
import type { LogEntry } from '../src/components/DailyLogbook';
import type { MemoConfig } from '../src/types';

function makeSampleConfig(): MemoConfig {
  return {
    schoolName: 'متوسطة الأمير عبد القادر',
    directorate: 'الجزائر وسط',
    teacherName: 'أ. بن علي محمد',
    teacherGrade: 'أستاذ التعليم المتوسط',
    schoolYear: '2026-2027',
    subject: 'علوم الطبيعة والحياة',
  } as MemoConfig;
}

function getWeekKey(dateStr: string): string {
  const clean = (dateStr || '').split(' ')[0];
  const d = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - d.getDay());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildTestContent(row: LogbookPaginatableRow, prev?: LogbookPaginatableRow): string {
  if (row.manualContent) return row.manualContent;
  const parts: string[] = [];
  if (!prev || prev.midan !== row.midan) {
    if (row.midan) parts.push(`<u>الميدان:</u> ${row.midan}`);
  }
  if (!prev || prev.midan !== row.midan || prev.maqta !== row.maqta) {
    if (row.maqta) parts.push(`<u>المقطع:</u> ${row.maqta}`);
  }
  if (row.mawrid) parts.push(`<u>المورد التعلمي:</u> ${row.mawrid}`);
  if (row.ta3alom) parts.push(`<u>تعلم المورد:</u> ${row.ta3alom}`);
  if (row.content) parts.push(`<u>الأنشطة:</u> ${row.content}`);
  return parts.join('\n') || row.content || '';
}

function findPrev(all: LogEntry[], idx: number, row: LogEntry): LogEntry | undefined {
  for (let i = idx - 1; i >= 0; i--) {
    if (all[i].level === row.level && all[i].section.split(' ')[0] === row.section.split(' ')[0]) {
      return all[i];
    }
  }
  return undefined;
}

function createSampleRows(count: number, style: 'short' | 'medium' | 'long'): LogEntry[] {
  const baseDate = new Date('2026-09-20T12:00:00');
  const rows: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate.getTime() + i * 2 * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = style === 'long' && i % 3 === 0 ? `${y}-${m}-${day} / ${y}-${m}-${day}` : `${y}-${m}-${day}`;
    const time = style === 'long' && i % 3 === 0
      ? '08:00 - 09:00 (ف1) / 09:00 - 10:00 (ف2)'
      : '08:00 - 09:00';

    const content =
      style === 'short'
        ? `النشاط المختصر ${i + 1}`
        : style === 'medium'
        ? `النشاط العلمي رقم ${i + 1}: دراسة التركيب التجريبي وملاحظة النتائج المخبرية واستخلاص المفهوم العلمي بدقة.`
        : `النشاط التفصيلي رقم ${i + 1}: تحليل معطيات التجربة الأولى ومقارنة التركيب الكيميائي للعينة الشاهدة والعينة التجريبية مع تدوين الملاحظات الميكروسكوبية.\nاستغلال الوثائق البيداغوجية وصياغة الفرضيات التفسيرية والتحقق منها عبر المناولة المخبرية.\nالاستنتاج المرحلي للحصة رقم ${i + 1} وتوظيف المصطلحات العلمية الدقيقة.`;

    rows.push({
      id: `row-${style}-${i + 1}`,
      dayName: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][i % 5],
      dateStr,
      time,
      section: i % 2 === 0 ? '1م1' : '2م1 (فوج 1 + فوج 2)',
      level: i % 2 === 0 ? '1م' : '2م',
      midan: 'الإنسان والصحة',
      maqta: `المقطع البيداغوجي ${Math.floor(i / 4) + 1}`,
      mawrid: `المورد ${i + 1}: التغذية عند الكائن الحي`,
      ta3alom: `تعرف التلميذ على خصائص الظاهرة ${i + 1}`,
      content,
      note: style === 'long' && i % 2 === 1 ? 'عمل مخبري متقن للأفواج' : 'سير عادي',
    });
  }
  return rows;
}

/** Minimal Node-only ZIP reader using built-in zlib to inspect Word document.xml without extra npm packages */
function extractDocxFileText(buf: Buffer, targetName: string): string {
  let offset = 0;
  while (offset + 30 <= buf.length) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const flags = buf.readUInt16LE(offset + 6);
    const method = buf.readUInt16LE(offset + 8);
    let compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const fileName = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;

    // Handle streaming data descriptor flag (bit 3) emitted by JSZip/docx
    if ((flags & 0x08) !== 0 && compSize === 0) {
      let scan = dataStart;
      while (scan + 4 <= buf.length) {
        if (buf.readUInt32LE(scan) === 0x08074b50) {
          compSize = buf.readUInt32LE(scan + 8);
          break;
        }
        scan++;
      }
      if (fileName === targetName) {
        const compressed = buf.subarray(dataStart, dataStart + compSize);
        return (method === 8 ? inflateRawSync(compressed) : compressed).toString('utf8');
      }
      offset = scan + 16;
    } else {
      if (fileName === targetName) {
        const compressed = buf.subarray(dataStart, dataStart + compSize);
        return (method === 8 ? inflateRawSync(compressed) : compressed).toString('utf8');
      }
      offset = dataStart + compSize;
    }
  }
  throw new Error(`File ${targetName} not found inside .docx archive`);
}

test('short content fits cleanly on 1 A4 page with dynamic filler rows and all signatures', () => {
  const rows = createSampleRows(2, 'short');
  const pages = paginateLogbookEntries({
    rows,
    orientation: 'portrait',
    template: 'standard',
    buildContent: buildTestContent,
    findPreviousComparable: findPrev,
    getWeekKey,
  });

  assert.equal(pages.length, 1);
  assert.equal(pages[0].rows.length, 2);
  assert.ok(
    pages[0].usedHeightPx + pages[0].emptyFillerRows * STANDARD_FILLER_ROW_HEIGHT_PX <= pages[0].availableHeightPx + 1,
    'Filler rows must never exceed available A4 vertical body space'
  );

  const html = renderToStaticMarkup(
    React.createElement(DailyLogSheetTemplate, {
      pageRows: pages[0].rows,
      allRows: rows,
      pageIndex: 0,
      totalPages: pages.length,
      config: makeSampleConfig(),
      assignedLevels: ['1م', '2م'],
      startDate: '2026-09-20',
      pageDimensions: { w: 210, h: 297 },
      buildHierarchicalContent: buildTestContent,
      findPreviousComparableCurriculumRow: findPrev,
      getSchoolWeekKey: getWeekKey,
      getSchoolWeekNumber: () => 1,
      formatLogbookDateLabel: (d) => d,
      emptyFillerRows: pages[0].emptyFillerRows,
    })
  );

  assert.ok(html.includes('width:210mm'));
  assert.ok(html.includes('height:297mm'));
  assert.ok(html.includes('صفحة 1 من 1'));
  assert.ok(html.includes('توقيع الأستاذ(ة)'));
  assert.ok(html.includes('تأشيرة السيد المدير'));
  assert.ok(html.includes('تأشيرة السيد المفتش'));
  assert.ok(html.includes('النشاط المختصر 1'));
  assert.ok(html.includes('النشاط المختصر 2'));
});

test('medium and long multi-week content paginates cleanly across A4 pages without losing rows or overflowing', () => {
  const mediumRows = createSampleRows(16, 'medium');
  const longRows = createSampleRows(32, 'long');

  for (const [label, dataset] of [['medium', mediumRows], ['long', longRows]] as const) {
    for (const orientation of ['portrait', 'landscape'] as const) {
      for (const template of ['standard', 'teal'] as const) {
        const pages = paginateLogbookEntries({
          rows: dataset,
          orientation,
          template,
          buildContent: buildTestContent,
          findPreviousComparable: findPrev,
          getWeekKey,
        });

        assert.ok(pages.length >= 2, `${label} ${orientation} ${template} should split across multiple A4 pages`);

        const budget = getAvailableBodyHeightPx(orientation, template);
        const recoveredIds: string[] = [];

        pages.forEach((p, idx) => {
          assert.equal(p.pageIndex, idx);
          assert.ok(p.rows.length >= 1);
          assert.ok(p.usedHeightPx <= budget, `${label} ${orientation} ${template} page ${idx} overflowed: ${p.usedHeightPx} > ${budget}`);
          assert.ok(
            p.usedHeightPx + p.emptyFillerRows * STANDARD_FILLER_ROW_HEIGHT_PX <= budget + 1,
            `${label} ${orientation} ${template} page ${idx} filler overflow`
          );
          p.rows.forEach((r) => recoveredIds.push(r.id));
        });

        assert.deepEqual(recoveredIds, dataset.map((r) => r.id), `Zero lessons may be dropped (${label}/${orientation}/${template})`);
      }
    }
  }

  // With multi-line entries (explicit newlines), landscape (210mm height) must paginate into more A4 sheets than portrait (297mm height)
  const lineRichRows = Array.from({ length: 24 }, (_, i) => ({
    id: `lr-${i}`,
    dayName: 'الأحد',
    dateStr: `2026-09-${String(20 + (i % 10)).padStart(2, '0')}`,
    time: '08:00 - 09:00',
    section: '1م1',
    level: '1م',
    content: '',
    manualContent: `<u>المورد:</u> مورد ${i + 1}\nالنشاط 1\nالنشاط 2\nالنشاط 3\nالاستنتاج ${i + 1}`,
    note: '',
  }));
  const portraitPages = paginateLogbookEntries({
    rows: lineRichRows,
    orientation: 'portrait',
    template: 'standard',
    buildContent: buildTestContent,
    findPreviousComparable: findPrev,
    getWeekKey,
  });
  const landscapePages = paginateLogbookEntries({
    rows: lineRichRows,
    orientation: 'landscape',
    template: 'standard',
    buildContent: buildTestContent,
    findPreviousComparable: findPrev,
    getWeekKey,
  });
  assert.ok(landscapePages.length > portraitPages.length, 'Landscape (210mm tall) should paginate into more A4 sheets than Portrait (297mm tall)');
});

test('ultra-long single lesson splits safely across continuation pages with balanced <u> tags and no data loss', () => {
  const longLines = Array.from(
    { length: 95 },
    (_, i) => `السطر التعليمي رقم ${i + 1}: تفسير آلية الامتصاص المعوي ودور الزغابات المعوية في نقل المغذيات نحو الدم واللمف.`
  );
  const ultraRow: LogEntry = {
    id: 'ultra-1',
    dayName: 'الأحد',
    dateStr: '2026-09-27',
    time: '08:00 - 09:00',
    section: '4م1',
    level: '4م',
    content: '',
    manualContent: `<u>عنوان طويل جداً:</u> ${longLines.join('\n')}`,
    note: 'حصة موسعة',
  };

  const pages = paginateLogbookEntries({
    rows: [ultraRow],
    orientation: 'portrait',
    template: 'standard',
    buildContent: buildTestContent,
    findPreviousComparable: findPrev,
    getWeekKey,
  });

  assert.ok(pages.length >= 2, 'Ultra-long entry exceeding 1 full A4 page must split cleanly into multiple pages');
  const combinedSliceText = pages.flatMap((p) => p.rows.map((r) => r.manualContent || '')).join('\n');

  // Verify every single numbered line survived intact
  for (let i = 1; i <= 95; i++) {
    assert.ok(combinedSliceText.includes(`رقم ${i}:`), `Missing split line ${i}`);
  }

  // Verify continuation pages keep balanced <u> tags and disable broken direct contentEditable overwrites
  pages.forEach((p, idx) => {
    const slice = p.rows[0];
    const openU = (slice.manualContent?.match(/<u>/g) || []).length;
    const closeU = (slice.manualContent?.match(/<\/u>/g) || []).length;
    assert.equal(openU, closeU, `Unbalanced <u> tag on split page ${idx}`);
    if (idx > 0) {
      assert.equal(slice.__isSplitContinuation, true);
      assert.ok(slice.dayName.includes('(تابع)'));
    }

    const html = renderToStaticMarkup(
      React.createElement(DailyLogSheetTemplate, {
        pageRows: p.rows,
        allRows: [ultraRow],
        pageIndex: idx,
        totalPages: pages.length,
        config: makeSampleConfig(),
        assignedLevels: ['4م'],
        startDate: '2026-09-20',
        pageDimensions: { w: 210, h: 297 },
        buildHierarchicalContent: buildTestContent,
        findPreviousComparableCurriculumRow: findPrev,
        getSchoolWeekKey: getWeekKey,
        getSchoolWeekNumber: () => 2,
        formatLogbookDateLabel: (d) => d,
        emptyFillerRows: p.emptyFillerRows,
      })
    );
    assert.ok(!html.includes('contentEditable="plaintext-only"'), 'Split chunks must guard against overwriting the full lesson text');
    assert.ok(html.includes(`صفحة ${idx + 1} من ${pages.length}`));
  });
});

test('TealLogSheetTemplate renders page numbering, signatures, and content cleanly in A4', () => {
  const rows = createSampleRows(3, 'medium');
  const html = renderToStaticMarkup(
    React.createElement(TealLogSheetTemplate, {
      pageRows: rows,
      allRows: rows,
      pageIndex: 1,
      totalPages: 4,
      config: makeSampleConfig(),
      assignedLevels: ['1م'],
      pageDimensions: { w: 297, h: 210 },
      buildHierarchicalContent: buildTestContent,
      findPreviousComparableCurriculumRow: findPrev,
      getSchoolWeekKey: getWeekKey,
      getSchoolWeekNumber: () => 1,
      formatLogbookDateLabel: (d) => d,
    })
  );
  assert.ok(html.includes('صفحة 2 من 4'));
  assert.ok(html.includes('المدير(ة)'));
  assert.ok(html.includes('الأستاذ(ة)'));
  assert.ok(html.includes('المفتش(ة)'));
  assert.ok(html.includes('width:297mm'));
  assert.ok(html.includes('height:210mm'));
});

test('LogbookPrintBook enforces A4 print pagination CSS rules', () => {
  const entries = createSampleRows(4, 'short');
  const html = renderToStaticMarkup(
    React.createElement(LogbookPrintBook, {
      entries,
      config: makeSampleConfig(),
      gridRows: [],
    })
  );
  assert.ok(html.includes('size: A4 portrait'));
  assert.ok(html.includes('table-header-group'));
  assert.ok(html.includes('break-inside: avoid'));
  assert.ok(html.includes('الدفتر اليومي'));
});

test('editable Word (.docx) export aligns with smart A4 pagination for short, medium, and long datasets', async () => {
  const config = makeSampleConfig();

  for (const [label, rows, orientation, template] of [
    ['short-portrait-standard', createSampleRows(2, 'short'), 'portrait', 'standard'],
    ['medium-landscape-standard', createSampleRows(14, 'medium'), 'landscape', 'standard'],
    ['long-portrait-teal', createSampleRows(24, 'long'), 'portrait', 'teal'],
  ] as const) {
    const pages = paginateLogbookEntries({
      rows,
      orientation,
      template,
      buildContent: buildTestContent,
      findPreviousComparable: findPrev,
      getWeekKey,
    });

    const blob = await generateLogbookDocx(
      rows,
      config,
      [],
      [],
      ['1م', '2م'],
      orientation,
      pages,
      template
    );

    assert.ok(blob.size > 4000, `${label} .docx Blob should be non-empty valid OOXML archive`);
    const buf = Buffer.from(await blob.arrayBuffer());
    const documentXml = extractDocxFileText(buf, 'word/document.xml');

    // Verify Word export preserves every lesson and enforces A4 + cantSplit + signatures + page numbering
    for (const row of rows) {
      assert.ok(
        documentXml.includes(row.mawrid || row.content.slice(0, 20)),
        `${label} word/document.xml missing entry ${row.id}`
      );
    }

    assert.ok(documentXml.includes('<w:cantSplit/>'), `${label} Word export should prevent row mid-splits`);
    assert.ok(documentXml.includes(`صفحة 1 من ${pages.length}`), `${label} Word export should match page total ${pages.length}`);
    assert.ok(documentXml.includes('الأستاذ(ة)'), `${label} Word export missing teacher signature`);
    assert.ok(
      orientation === 'landscape'
        ? documentXml.includes('w:orient="landscape"') && documentXml.includes('16838') && documentXml.includes('11906')
        : documentXml.includes('w:w="11906"') && documentXml.includes('w:h="16838"'),
      `${label} Word export must set exact A4 page size and orientation`
    );
  }
});
