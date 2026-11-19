import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

import {
  HANDWRITING_FONTS,
  normalizeHandwritingSettings,
  type HandwritingFontId,
} from '../src/services/handwritingStyle';
import {
  DOCX_FONT_FILES,
  DOCX_FONT_FALLBACK_MESSAGE,
  DocxFontEmbedError,
  prepareDocxFonts,
  validateTrueTypeFontBytes,
} from '../src/utils/docxFontEmbed';
import { generateDocx } from '../src/utils/docxExport';
import { generateLogbookDocx, generateTimetableDocx } from '../src/utils/docxExportLogbook';
import { generateDistributionDocx } from '../src/utils/docxExportDistribution';
import { exportCorrectionMemoDataToDocx } from '../src/utils/correctionMemoExport';
import { createDefaultCorrectionMemo } from '../src/services/correctionMemoModel';
import type { LessonMemo, MemoConfig } from '../src/types';

const ALL_FONT_IDS: HandwritingFontId[] = [
  'playpen',
  'harmattan',
  'lateef',
  'marhey',
  'tajawal',
  'cairo',
];

function extractZipEntries(buf: Buffer): Map<string, Buffer> {
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  assert.ok(eocdOffset >= 0, 'ZIP End of Central Directory record not found');

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  const entries = new Map<string, Buffer>();
  let cursor = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    assert.equal(buf.readUInt32LE(cursor), 0x02014b50, 'Invalid Central Directory signature');
    const method = buf.readUInt16LE(cursor + 10);
    const compSize = buf.readUInt32LE(cursor + 20);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const localHeaderOffset = buf.readUInt32LE(cursor + 42);
    const fileName = buf.toString('utf8', cursor + 46, cursor + 46 + nameLen);

    assert.equal(buf.readUInt32LE(localHeaderOffset), 0x04034b50, `Invalid local header for ${fileName}`);
    const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    const data = method === 8 ? inflateRawSync(raw) : Buffer.from(raw);
    entries.set(fileName, data);

    cursor += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

function getTtfTableMap(ttf: Buffer): Map<string, { offset: number; length: number }> {
  const sfnt = ttf.readUInt32BE(0);
  assert.equal(sfnt, 0x00010000, `Expected TrueType sfnt 0x00010000, got 0x${sfnt.toString(16)}`);
  const numTables = ttf.readUInt16BE(4);
  const tables = new Map<string, { offset: number; length: number }>();
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = ttf.toString('ascii', rec, rec + 4);
    tables.set(tag, {
      offset: ttf.readUInt32BE(rec + 8),
      length: ttf.readUInt32BE(rec + 12),
    });
  }
  return tables;
}

function getTtfCmapCodepoints(ttf: Buffer): Set<number> {
  const tables = getTtfTableMap(ttf);
  const cmapTbl = tables.get('cmap');
  assert.ok(cmapTbl, 'Missing cmap table');
  const cmapBase = cmapTbl.offset;
  const numSubtables = ttf.readUInt16BE(cmapBase + 2);

  let format4Offset = -1;
  let format12Offset = -1;
  for (let i = 0; i < numSubtables; i++) {
    const rec = cmapBase + 4 + i * 8;
    const platformId = ttf.readUInt16BE(rec);
    const encodingId = ttf.readUInt16BE(rec + 2);
    const subOffset = cmapBase + ttf.readUInt32BE(rec + 4);
    const format = ttf.readUInt16BE(subOffset);
    if ((platformId === 3 && encodingId === 10) || format === 12) {
      if (format === 12) format12Offset = subOffset;
    } else if ((platformId === 3 && encodingId === 1) || (platformId === 0 && encodingId === 3)) {
      if (format === 4) format4Offset = subOffset;
    }
  }

  const cps = new Set<number>();
  if (format12Offset >= 0) {
    const numGroups = ttf.readUInt32BE(format12Offset + 12);
    for (let g = 0; g < numGroups; g++) {
      const rec = format12Offset + 16 + g * 12;
      const start = ttf.readUInt32BE(rec);
      const end = ttf.readUInt32BE(rec + 4);
      for (let cp = start; cp <= end && cp <= 0xffff; cp++) {
        cps.add(cp);
      }
    }
    return cps;
  }

  assert.ok(format4Offset >= 0, 'No cmap format 4 or 12 subtable found');
  const segCountX2 = ttf.readUInt16BE(format4Offset + 6);
  const segCount = segCountX2 / 2;
  const endCodeBase = format4Offset + 14;
  const startCodeBase = endCodeBase + segCountX2 + 2;
  for (let s = 0; s < segCount; s++) {
    const endCode = ttf.readUInt16BE(endCodeBase + s * 2);
    const startCode = ttf.readUInt16BE(startCodeBase + s * 2);
    if (startCode === 0xffff) continue;
    for (let cp = startCode; cp <= endCode; cp++) {
      cps.add(cp);
    }
  }
  return cps;
}

function getTtfFamilyNames(ttf: Buffer): string[] {
  const tables = getTtfTableMap(ttf);
  const nameTbl = tables.get('name');
  assert.ok(nameTbl, 'Missing name table');
  const base = nameTbl.offset;
  const count = ttf.readUInt16BE(base + 2);
  const strOffset = ttf.readUInt16BE(base + 4);
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const rec = base + 6 + i * 12;
    const platformId = ttf.readUInt16BE(rec);
    const nameId = ttf.readUInt16BE(rec + 6);
    const length = ttf.readUInt16BE(rec + 8);
    const offset = ttf.readUInt16BE(rec + 10);
    if (nameId !== 1) continue;
    const raw = Buffer.from(ttf.subarray(base + strOffset + offset, base + strOffset + offset + length));
    if (platformId === 3 || platformId === 0) {
      raw.swap16();
      results.push(raw.toString('utf16le'));
    } else {
      results.push(raw.toString('latin1'));
    }
  }
  return results;
}

function makeSampleConfig(): MemoConfig {
  return {
    level: '4am',
    schoolName: 'متوسطة الشهيد بن بولعيد',
    directorate: 'مديرية التربية لولاية تيارت',
    inspectionDistrict: 'المقاطعة 02',
    teacherName: 'جمال الدين أمين شعلال',
    teacherGrade: 'أستاذ التعليم المتوسط',
    teacherPhone: '',
    teacherEmail: '',
    schoolYear: '2026-2027',
    memoNumber: '01',
    principalName: 'السيد المدير',
    inspectorName: 'السيد المفتش',
    signDate: '2026-10-01',
    teacherStamp: null,
    assignedClasses: ['4م1', '4م2'],
    memoFormat: 'detailed',
    memoPageBorderStyle: 'none',
    memoCustomBorderImage: null,
    memoFontSizeScale: 1,
    memoShowHeaderInfo: true,
    memoShowObjectives: true,
    memoShowSituation: true,
    memoShowFooter: true,
    memoShowStamp: false,
    memoRowPaddingScale: 1,
    memoColumnWidths: { activity: 28, scenario: 44, duration: 14, criteria: 14 },
  };
}

function makeSampleLesson(): LessonMemo {
  return {
    level: '4am',
    midan: 'الإنسان والصحة',
    maqta: 'التغذية عند الإنسان',
    mawrid: 'تحويل الأغذية في الأنبوب الهضمي',
    ta3alom: 'تبسيط النشاء إلى غلوكوز',
    wasail: 'أنابيب اختبار، ماء اليود، محلول فهلينغ',
    kafaaKhitamiya: 'إبراز التحول الكيميائي للنشاء في الفم (CO2 و 37°C)',
    wadiya: 'يتغير طعم قطعة الخبز عند مضغها مطولاً في الفم.',
    moshkila: 'كيف يتحول النشاء في الفم إلى سكر؟',
    faradiyat: 'ربما يتدخل اللعاب في تفكيك النشاء.',
    anshita: [
      {
        title: 'النشاط 1: الهضم الآلي والكيميائي للنشاء',
        asila: 'ضع مطبوخ النشاء في أنبوبي اختبار (1) و(2) مع لعاب طازج.',
        ajwiba: '<u>المورد التعلمي:</u> الأميلاز اللعابي يفكك النشاء إلى مالتوز.',
        zaman: '20 د',
        mola7adha: 'عمل بالأفواج',
      },
    ],
    irsae: '<u>إرساء المورد:</u> يتبسط النشاء كيميائياً بتدخل إنزيم الأميلاز اللعابي.',
    taqwim: '<u>تقويم:</u> اشرح دور الإنزيم النوعي.',
  };
}

test('all 12 local public/fonts TTFs are genuine embeddable TrueType with Arabic + Latin codepoints and OpenType tables', async () => {
  for (const fontId of ALL_FONT_IDS) {
    const spec = DOCX_FONT_FILES[fontId];
    for (const [label, file] of [
      ['regular', spec.regularFile],
      ['bold', spec.boldFile],
    ] as const) {
      const fullPath = path.resolve(process.cwd(), 'public', 'fonts', file);
      const ttf = await fs.readFile(fullPath);

      const meta = validateTrueTypeFontBytes(ttf, {
        fontId,
        fontName: spec.familyName,
        fallbackFontName: HANDWRITING_FONTS[fontId].wordArabicFallback,
        label: `${fontId}:${label}`,
      });
      assert.equal(meta.sfntVersion, 0x00010000);
      assert.equal(meta.fsType, 0, `${file} must have OS/2.fsType = 0`);

      const tables = getTtfTableMap(ttf);
      assert.ok(tables.has('glyf'), `${file} must have glyf table`);
      assert.ok(!tables.has('CFF ') && !tables.has('CFF2'), `${file} must not be CFF/OTF`);
      assert.ok(tables.has('GSUB'), `${file} must preserve GSUB shaping table`);
      assert.ok(tables.has('GPOS'), `${file} must preserve GPOS positioning table`);

      const familyNames = getTtfFamilyNames(ttf);
      assert.ok(
        familyNames.includes(spec.familyName),
        `${file} name table (${familyNames.join(', ')}) must match wordFontName "${spec.familyName}"`
      );

      const cps = getTtfCmapCodepoints(ttf);
      for (const ch of ['ا', 'ب', 'م', '0', '9', 'A', '(', ':']) {
        assert.ok(
          cps.has(ch.codePointAt(0)!),
          `${file} merged cmap missing character "${ch}" (U+${ch.codePointAt(0)!.toString(16).toUpperCase()})`
        );
      }
    }
  }
});

test('Memo and Logbook Word exports embed selected font (Regular + Bold + B2 + settings) for ALL 6 fonts', async () => {
  const config = makeSampleConfig();
  const lesson = makeSampleLesson();

  for (const fontId of ALL_FONT_IDS) {
    const fontMeta = HANDWRITING_FONTS[fontId];
    const settings = normalizeHandwritingSettings({
      enabled: true,
      fontId,
      fontSizeScale: 1.1,
      scope: 'all',
    });

    // 1. Memo (.docx)
    const memoBlob = await generateDocx(lesson, config, [true], false, { settings });
    const memoEntries = extractZipEntries(Buffer.from(await memoBlob.arrayBuffer()));
    assert.ok(memoEntries.has('word/fonts/font1.odttf'), `${fontId} memo missing word/fonts/font1.odttf`);
    assert.ok(memoEntries.has('word/fonts/font2.odttf'), `${fontId} memo missing word/fonts/font2.odttf`);
    assert.ok(memoEntries.get('word/fonts/font1.odttf')!.length > 20_000);
    assert.ok(memoEntries.get('word/fonts/font2.odttf')!.length > 20_000);

    const memoFontTable = memoEntries.get('word/fontTable.xml')!.toString('utf8');
    assert.ok(
      memoFontTable.includes(`w:name="${fontMeta.wordFontName}"`),
      `${fontId} memo fontTable missing w:name="${fontMeta.wordFontName}"`
    );
    assert.ok(memoFontTable.includes('w:embedRegular'), `${fontId} memo fontTable missing w:embedRegular`);
    assert.ok(memoFontTable.includes('w:embedBold'), `${fontId} memo fontTable missing w:embedBold`);
    assert.ok(memoFontTable.includes('w:val="B2"'), `${fontId} memo fontTable missing Arabic charset B2`);

    const memoSettingsXml = memoEntries.get('word/settings.xml')!.toString('utf8');
    assert.ok(memoSettingsXml.includes('w:embedTrueTypeFonts'), `${fontId} memo settings missing w:embedTrueTypeFonts`);

    const memoDocXml = memoEntries.get('word/document.xml')!.toString('utf8');
    assert.ok(memoDocXml.includes(fontMeta.wordFontName), `${fontId} memo document.xml missing font name`);
    assert.ok(!memoDocXml.includes(fontMeta.wordArabicFallback) || fontMeta.wordArabicFallback === fontMeta.wordFontName);
    const expectedLine = String(Math.round(fontMeta.lineHeight * 240));
    assert.ok(memoDocXml.includes(`w:line="${expectedLine}"`), `${fontId} memo document.xml missing line spacing ${expectedLine}`);
    assert.ok(memoDocXml.includes('w:szCs w:val="24"'), `${fontId} memo document.xml missing scaled szCs for 1.1x`);

    // 2. Daily Logbook (.docx)
    const logBlob = await generateLogbookDocx(
      [
        {
          id: 'r1',
          level: '1م',
          date: '2026-10-05',
          dayName: 'الاثنين',
          section: '1م1',
          time: '08:00 - 09:00',
          mawrid: 'مصدر الأغذية وتركيبها',
          content: 'النشاط 1: الكشف عن مكونات الحليب والخبز',
        },
      ],
      config,
      [],
      [],
      ['1م'],
      'portrait',
      undefined,
      'standard',
      { settings }
    );
    const logEntries = extractZipEntries(Buffer.from(await logBlob.arrayBuffer()));
    assert.ok(logEntries.has('word/fonts/font1.odttf'), `${fontId} logbook missing word/fonts/font1.odttf`);
    assert.ok(logEntries.has('word/fonts/font2.odttf'), `${fontId} logbook missing word/fonts/font2.odttf`);

    const logFontTable = logEntries.get('word/fontTable.xml')!.toString('utf8');
    assert.ok(logFontTable.includes(`w:name="${fontMeta.wordFontName}"`), `${fontId} logbook fontTable missing ${fontMeta.wordFontName}`);
    assert.ok(logFontTable.includes('w:embedRegular'));
    assert.ok(logFontTable.includes('w:embedBold'));
    assert.ok(logFontTable.includes('w:val="B2"'));
  }
});

test('Distribution, Correction Memo, and Timetable Word exports also embed the selected TrueType fonts', async () => {
  const settings = normalizeHandwritingSettings({ enabled: true, fontId: 'harmattan' });
  const config = makeSampleConfig();

  const distBlob = await generateDistributionDocx(
    [
      [
        {
          id: 'd1',
          month: 'أكتوبر',
          weekNum: 2,
          midan: 'الإنسان والصحة',
          maqta: 'التغذية عند الإنسان',
          mawrid: 'مصدر الأغذية',
          activity: 'تحليل الحليب',
          progress: 4,
        },
      ],
    ],
    config,
    '1am',
    'portrait',
    { settings }
  );
  const distEntries = extractZipEntries(Buffer.from(await distBlob.arrayBuffer()));
  assert.ok(distEntries.has('word/fonts/font1.odttf'));
  assert.ok(distEntries.has('word/fonts/font2.odttf'));
  assert.ok(distEntries.get('word/fontTable.xml')!.toString('utf8').includes('w:name="Harmattan"'));

  const correctionBlob = await exportCorrectionMemoDataToDocx(
    createDefaultCorrectionMemo(),
    { settings }
  );
  const corrEntries = extractZipEntries(Buffer.from(await correctionBlob.arrayBuffer()));
  assert.ok(corrEntries.has('word/fonts/font1.odttf'));
  assert.ok(corrEntries.has('word/fonts/font2.odttf'));
  assert.ok(corrEntries.get('word/fontTable.xml')!.toString('utf8').includes('w:name="Harmattan"'));

  const timetableBlob = await generateTimetableDocx(
    [
      {
        time: '08:00 - 09:00',
        cells: { 'الأحد': '1م1 (مخبر 1)' },
      },
    ],
    config,
    ['1م'],
    ['1م1'],
    { settings }
  );
  const ttEntries = extractZipEntries(Buffer.from(await timetableBlob.arrayBuffer()));
  assert.ok(ttEntries.has('word/fonts/font1.odttf'));
  assert.ok(ttEntries.has('word/fonts/font2.odttf'));
  assert.ok(ttEntries.get('word/fontTable.xml')!.toString('utf8').includes('w:name="Harmattan"'));
});

test('missing, invalid OTTO, or restricted fsType fonts throw DocxFontEmbedError without silent fallback unless explicitly approved', async () => {
  const settings = normalizeHandwritingSettings({ enabled: true, fontId: 'playpen' });
  const lesson = makeSampleLesson();
  const config = makeSampleConfig();

  // 1. Missing file -> rejects with DocxFontEmbedError
  await assert.rejects(
    () =>
      generateDocx(lesson, config, [true], false, {
        settings,
        fontLoader: async (filename) => {
          throw new DocxFontEmbedError({
            reason: 'missing_file',
            fontId: 'playpen',
            fontName: 'Playpen Sans Arabic',
            fallbackFontName: 'Sakkal Majalla',
            details: `Missing ${filename}`,
          });
        },
      }),
    (err: unknown) =>
      err instanceof DocxFontEmbedError &&
      err.reason === 'missing_file' &&
      err.userMessage === DOCX_FONT_FALLBACK_MESSAGE
  );

  // 2. OTTO (CFF OpenType) rejected cleanly
  const validTtf = await fs.readFile(path.resolve(process.cwd(), 'public', 'fonts', 'PlaypenSansArabic-Regular.ttf'));
  const ottoBytes = new Uint8Array(validTtf);
  ottoBytes[0] = 0x4f;
  ottoBytes[1] = 0x54;
  ottoBytes[2] = 0x54;
  ottoBytes[3] = 0x4f;

  await assert.rejects(
    () =>
      prepareDocxFonts({
        settings,
        fontLoader: async () => ottoBytes,
      }),
    (err: unknown) => err instanceof DocxFontEmbedError && err.reason === 'invalid_ttf'
  );

  // 3. Restricted OS/2 fsType !== 0 rejected cleanly
  const restrictedBytes = new Uint8Array(validTtf);
  const view = new DataView(restrictedBytes.buffer);
  const numTables = view.getUint16(4, false);
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(
      restrictedBytes[rec],
      restrictedBytes[rec + 1],
      restrictedBytes[rec + 2],
      restrictedBytes[rec + 3]
    );
    if (tag === 'OS/2') {
      const os2Offset = view.getUint32(rec + 8, false);
      view.setUint16(os2Offset + 8, 2, false);
      break;
    }
  }
  await assert.rejects(
    () =>
      prepareDocxFonts({
        settings,
        fontLoader: async () => restrictedBytes,
      }),
    (err: unknown) => err instanceof DocxFontEmbedError && err.reason === 'restricted_fstype'
  );

  // 4. Explicit allowFallback: true succeeds with wordArabicFallback and NO embedded font binary
  const fallbackBlob = await generateDocx(lesson, config, [true], false, {
    settings,
    allowFallback: true,
    fontLoader: async () => {
      throw new Error('offline');
    },
  });
  const fallbackEntries = extractZipEntries(Buffer.from(await fallbackBlob.arrayBuffer()));
  assert.ok(!fallbackEntries.has('word/fonts/font1.odttf'));
  assert.ok(
    fallbackEntries
      .get('word/document.xml')!
      .toString('utf8')
      .includes(HANDWRITING_FONTS.playpen.wordArabicFallback)
  );
});
