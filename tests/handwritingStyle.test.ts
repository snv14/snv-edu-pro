import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import { Document, Packer, Paragraph } from 'docx';
import {
  DEFAULT_HANDWRITING_SETTINGS,
  DEFAULT_PEN_PALETTE,
  buildDocxTextRuns,
  formatSemanticHtml,
  getEffectiveExportFontFamily,
  isHandwritingActiveFor,
  normalizeHandwritingSettings,
  resetHandwritingSettings,
  tokenizePedagogicalLine,
  tokenizePedagogicalText,
  tokenizeScientificTerms,
} from '../src/services/handwritingStyle';

function extractDocxDocumentXml(buf: Buffer): string {
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

    if ((flags & 0x08) !== 0 && compSize === 0) {
      let scan = dataStart;
      while (scan + 4 <= buf.length) {
        if (buf.readUInt32LE(scan) === 0x08074b50) {
          compSize = buf.readUInt32LE(scan + 8);
          break;
        }
        scan++;
      }
      if (fileName === 'word/document.xml') {
        const compressed = buf.subarray(dataStart, dataStart + compSize);
        return (method === 8 ? inflateRawSync(compressed) : compressed).toString('utf8');
      }
      offset = scan + 16;
    } else {
      if (fileName === 'word/document.xml') {
        const compressed = buf.subarray(dataStart, dataStart + compSize);
        return (method === 8 ? inflateRawSync(compressed) : compressed).toString('utf8');
      }
      offset = dataStart + compSize;
    }
  }
  throw new Error('word/document.xml not found in generated .docx buffer');
}

test('tokenizers preserve 100% of original Arabic scientific text and chemical formulas (lossless)', () => {
  const sampleLines = [
    '<u>الميدان:</u> الإنسان والصحة',
    '<u>المورد التعلمي:</u> تحول الأغذية في الأنبوب الهضمي',
    'المشكلة: كيف يتحول النشاء إلى الغلوكوز بتدخل الأميلاز اللعابي؟',
    'يمتص الجسم المغذيات عبر الزغابة المعوية وينقل O2 و يتخلص من CO2 مع H2O.',
    'إرساء المورد: الأميلاز إنزيم نوعي يفكك النشاء إلى سكر الشعير ثم إلى الغلوكوز.',
    'ملاحظة: الرمز xCO2y لا يطابق CO2 المنفصل.',
    'مثال: هضم البروتينات يعطي الأحماض الأمينية.',
    'التقويم: اشرح دور البلعمة والاستجابة المناعية.',
  ];

  for (const line of sampleLines) {
    const lineTokens = tokenizePedagogicalLine(line);
    const reconstructedLine = lineTokens.map((t) => t.text).join('');
    assert.equal(
      reconstructedLine,
      line.replace(/<\/?u>/g, ''),
      `Line reconstruction failed for: ${line}`
    );

    const sciTokens = tokenizeScientificTerms(line);
    assert.equal(sciTokens.map((t) => t.text).join(''), line);
  }

  const fullText = sampleLines.join('\n');
  const multiLineTokens = tokenizePedagogicalText(fullText);
  assert.equal(multiLineTokens.length, sampleLines.length);
  assert.equal(
    multiLineTokens.map((row) => row.map((t) => t.text).join('')).join('\n'),
    fullText.replace(/<\/?u>/g, '')
  );
});

test('semantic 6-pen classifier assigns expected colors and protects word boundaries', () => {
  const titleTokens = tokenizePedagogicalLine('<u>الميدان:</u> الإنسان والصحة');
  assert.equal(titleTokens[0].role, 'titleBlue');
  assert.equal(titleTokens[0].underline, true);
  assert.equal(titleTokens[1].role, 'titleBlue');

  const mawridTokens = tokenizePedagogicalLine('المورد التعلمي: الهضم');
  assert.equal(mawridTokens[0].role, 'titleBlue');
  assert.equal(mawridTokens[1].role, 'titleBlue');

  const problemTokens = tokenizePedagogicalLine('المشكلة: كيف ينتقل الغلوكوز عبر الزغابة المعوية؟');
  assert.equal(problemTokens[0].role, 'subRed');
  assert.ok(problemTokens.some((t) => t.text === 'الغلوكوز' && t.role === 'termPurple'));
  assert.ok(problemTokens.some((t) => t.text === 'الزغابة المعوية' && t.role === 'termPurple'));

  const defTokens = tokenizePedagogicalLine('إرساء المورد: الأميلاز يفكك النشاء.');
  assert.equal(defTokens[0].role, 'defGreen');
  assert.ok(defTokens.some((t) => t.text === 'الأميلاز' && t.role === 'termPurple'));

  const noteTokens = tokenizePedagogicalLine('ملاحظة: غاز CO2 يطرح في الأسناخ الرئوية.');
  assert.equal(noteTokens[0].role, 'noteOrange');
  assert.ok(noteTokens.some((t) => t.text === 'CO2' && t.role === 'termPurple'));

  const boundaryTokens = tokenizeScientificTerms('test xCO2y and CO2 end');
  assert.equal(boundaryTokens.filter((t) => t.role === 'termPurple').length, 1);
  assert.equal(boundaryTokens.find((t) => t.role === 'termPurple')?.text, 'CO2');
});

test('formatSemanticHtml renders 6-pen styled spans when enabled, restores plain <u> when disabled, and escapes XSS', () => {
  const input = '<u>المورد التعلمي:</u> <script>alert(1)</script> الغلوكوز';

  const enabledHtml = formatSemanticHtml(input, DEFAULT_HANDWRITING_SETTINGS);
  assert.ok(enabledHtml.includes('class="hw-pen-titleBlue"'));
  assert.ok(enabledHtml.includes(`color:${DEFAULT_PEN_PALETTE.titleBlue}`));
  assert.ok(enabledHtml.includes(`text-decoration-color:${DEFAULT_PEN_PALETTE.subRed}`));
  assert.ok(!enabledHtml.includes('<script>'));
  assert.ok(enabledHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));

  const disabledSettings = normalizeHandwritingSettings({ enabled: false, fontId: 'cairo' });
  const disabledHtml = formatSemanticHtml(input, disabledSettings);
  assert.ok(disabledHtml.startsWith('<u>المورد التعلمي:</u>'));
  assert.ok(!disabledHtml.includes('hw-pen-'));
  assert.ok(!disabledHtml.includes('<script>'));
  assert.ok(disabledHtml.includes('&lt;script&gt;'));
});

test('buildDocxTextRuns produces valid OOXML with RTL font attributes and 6-pen hex colors', async () => {
  const enabledRuns = buildDocxTextRuns(
    '<u>الميدان:</u> الإنسان والصحة\nملاحظة: الغلوكوز و CO2',
    DEFAULT_HANDWRITING_SETTINGS
  );
  const enabledDoc = new Document({
    sections: [{ children: [new Paragraph({ children: enabledRuns })] }],
  });
  const enabledBuf = await Packer.toBuffer(enabledDoc);
  const enabledXml = extractDocxDocumentXml(enabledBuf);

  assert.ok(enabledXml.includes('Playpen Sans Arabic'));
  assert.ok(enabledXml.includes('1D4ED8'));
  assert.ok(enabledXml.includes('B91C1C'));
  assert.ok(enabledXml.includes('C2410C'));
  assert.ok(enabledXml.includes('6D28D9'));
  assert.ok(enabledXml.includes('الميدان:'));
  assert.ok(enabledXml.includes('CO2'));

  const disabledSettings = normalizeHandwritingSettings({ enabled: false, fontId: 'cairo' });
  const disabledRuns = buildDocxTextRuns('<u>الميدان:</u> الإنسان والصحة', disabledSettings);
  const disabledDoc = new Document({
    sections: [{ children: [new Paragraph({ children: disabledRuns })] }],
  });
  const disabledBuf = await Packer.toBuffer(disabledDoc);
  const disabledXml = extractDocxDocumentXml(disabledBuf);
  assert.ok(disabledXml.includes('Cairo'));
  assert.ok(!disabledXml.includes('6D28D9'));
});

test('normalizeHandwritingSettings clamps scale, validates palette hex & scope, and reset restores original mode', () => {
  const clamped = normalizeHandwritingSettings({
    fontId: 'invalid_font' as any,
    fontSizeScale: 2.5,
    scope: 'unknown' as any,
    palette: {
      titleBlue: 'not-a-color',
      subRed: '#ff0000',
      defGreen: '',
      bodyBlack: '#111111',
      termPurple: '123456',
      noteOrange: '#cc5500',
    },
  });

  assert.equal(clamped.fontId, 'playpen');
  assert.equal(clamped.fontSizeScale, 1.12);
  assert.equal(clamped.scope, 'all');
  assert.equal(clamped.palette.titleBlue, DEFAULT_PEN_PALETTE.titleBlue);
  assert.equal(clamped.palette.subRed, '#ff0000');
  assert.equal(clamped.palette.defGreen, DEFAULT_PEN_PALETTE.defGreen);
  assert.equal(clamped.palette.noteOrange, '#cc5500');

  const smallClamped = normalizeHandwritingSettings({ fontSizeScale: 0.5 });
  assert.equal(smallClamped.fontSizeScale, 0.92);

  const logbookOnly = normalizeHandwritingSettings({ enabled: true, scope: 'logbook', fontId: 'harmattan' });
  assert.equal(isHandwritingActiveFor('logbook', logbookOnly), true);
  assert.equal(isHandwritingActiveFor('memos', logbookOnly), false);
  assert.equal(isHandwritingActiveFor('general', logbookOnly), false);
  assert.equal(getEffectiveExportFontFamily('docx', logbookOnly, 'logbook'), 'Harmattan');
  assert.equal(getEffectiveExportFontFamily('docx', logbookOnly, 'memos'), 'Cairo');

  const original = resetHandwritingSettings(true);
  assert.equal(original.enabled, false);
  assert.equal(original.fontId, 'cairo');
});
