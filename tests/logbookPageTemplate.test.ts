import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TealLogSheetTemplate } from '../src/components/TealLogSheetTemplate';
import { splitLogbookTime } from '../src/utils/logbookPageTemplate';
import type { LogEntry } from '../src/components/DailyLogbook';
import type { MemoConfig } from '../src/types';

test('times are split only when no information will be lost', () => {
  assert.deepEqual(splitLogbookTime('08:00 - 09:00'), ['08:00', '09:00']);
  assert.deepEqual(splitLogbookTime('08:00 ➔ 09:00'), ['08:00', '09:00']);
  assert.deepEqual(splitLogbookTime('08:00 - 09:00 / 09:00 - 10:00'), ['08:00 - 09:00 / 09:00 - 10:00', '']);
  assert.deepEqual(splitLogbookTime(''), ['', '']);
});

test('alternative page displays the saved lesson and is available for preview/export', () => {
  const row: LogEntry = { id: 'a', dayName: 'الأحد', dateStr: '2026-09-20', time: '08:00 - 09:00', section: '2م1', level: '2م', content: 'نشاط تجريبي', note: 'ملاحظة خاصة' };
  const before = structuredClone(row);
  const html = renderToStaticMarkup(React.createElement(TealLogSheetTemplate, {
    pageRows: [row], allRows: [row], pageIndex: 0, totalPages: 1, config: {} as MemoConfig,
    assignedLevels: ['2م'], pageDimensions: {w: 297, h: 210},
    buildHierarchicalContent: r => r.content, findPreviousComparableCurriculumRow: () => undefined,
    getSchoolWeekKey: () => '', getSchoolWeekNumber: () => 1,
    formatLogbookDateLabel: date => date, onUpdateRow: () => {},
  }));
  for (const phrase of ['سير الحصة و الأنشطة', 'التاريخ', 'الوقت', 'ملاحظات', 'الأحد', '2026-09-20', '08:00', '09:00', '2م1', 'نشاط تجريبي', 'ملاحظة خاصة', 'المفتش(ة)']) assert.ok(html.includes(phrase), phrase);
  assert.match(html, /data-preview-export-page="true"/);
  assert.match(html, /contentEditable="plaintext-only"/);
  assert.deepEqual(row, before);
});
