import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, LineRuleType } from 'docx';
import type { CorrectionMemoData } from '../services/correctionMemoModel';
import { criterionTotal, exerciseTotal, formatPoints, integrationTotal, part1Total, overallTotal } from '../services/correctionMemoModel';
import jsPDF from 'jspdf';
import { safeHtml2Canvas, sanitizeOklchForHtml2Canvas } from './html2canvasSanitizer';
import { MemoConfig } from '../types';
import {
  applyHandwritingCssVars,
  buildDocxTextRuns,
  getDocxLineSpacing,
  getEffectiveExportFontFamily,
  isHandwritingActiveFor,
  loadHandwritingSettings,
  scaleDocxFontSize,
  type HandwritingStyleSettings,
  type PenRole,
} from '../services/handwritingStyle';
import {
  prepareDocxFonts,
  type DocxFontAttrs,
  type PrepareDocxFontsOptions,
} from './docxFontEmbed';

const safe = (s: string) => (s || 'مذكرة_تصحيح').replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '_').slice(0, 80);
const stripHash = (hex: string) => hex.replace(/^#/, '').toUpperCase();

export type CorrectionMemoDocxOptions = Pick<
  PrepareDocxFontsOptions,
  'allowFallback' | 'fontLoader' | 'settings'
>;

export async function exportCorrectionMemoToDocx(args: {
  title: string;
  text: string;
  config?: MemoConfig;
  level?: string;
  allowFallback?: boolean;
  fontLoader?: PrepareDocxFontsOptions['fontLoader'];
}) {
  const hwStyle = loadHandwritingSettings();
  const hwActive = isHandwritingActiveFor('memos', hwStyle);
  const embeddedFonts = await prepareDocxFonts({
    settings: hwStyle,
    area: 'memos',
    allowFallback: args.allowFallback,
    fontLoader: args.fontLoader,
  });
  const wordFont = embeddedFonts.wordFont;
  const fontAttrs = embeddedFonts.fontAttrs;
  const lineSpacing = getDocxLineSpacing(hwStyle, 'memos');
  const titleColor = hwActive ? stripHash(hwStyle.palette.titleBlue) : '000000';
  const sz = (n: number) => scaleDocxFontSize(n, hwStyle, 'memos');

  const lines = (args.text || '').split(/\r?\n/);
  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: 'الجمهورية الجزائرية الديمقراطية الشعبية', bold: true, boldComplexScript: true, font: fontAttrs, size: sz(28), sizeComplexScript: sz(28), rightToLeft: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: 'وزارة التربية الوطنية', bold: true, boldComplexScript: true, font: fontAttrs, size: sz(24), sizeComplexScript: sz(24), rightToLeft: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240, line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: args.title, bold: true, boldComplexScript: true, font: fontAttrs, color: titleColor, size: sz(32), sizeComplexScript: sz(32), rightToLeft: true })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: `المستوى: ${args.level?.toUpperCase() || '—'}    المادة: علوم الطبيعة والحياة    المؤسسة: ${args.config?.schoolName || '—'}    الأستاذ(ة): ${args.config?.teacherName || '—'}`, font: fontAttrs, size: sz(22), sizeComplexScript: sz(22), rightToLeft: true })] }),
    ...lines.map(line => new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { after: 100, line: lineSpacing, lineRule: LineRuleType.AUTO },
      children: hwActive
        ? buildDocxTextRuns(line || ' ', hwStyle, { size: 22, fontName: wordFont, area: 'memos' })
        : [new TextRun({ text: line || ' ', font: fontAttrs, size: sz(22), sizeComplexScript: sz(22), rightToLeft: true })],
    })),
  ];
  const doc = new Document({
    fonts: embeddedFonts.fonts,
    styles: {
      default: {
        document: {
          run: { rightToLeft: true, font: fontAttrs, size: sz(22), sizeComplexScript: sz(22) },
          paragraph: { alignment: AlignmentType.RIGHT, spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }]
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = safe(args.title) + '.docx'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function exportCorrectionMemoToPdf(element: HTMLElement, title: string) {
  const hwStyle = loadHandwritingSettings();
  applyHandwritingCssVars(hwStyle);
  if (document.fonts?.ready) await document.fonts.ready;

  const canvas = await safeHtml2Canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fff',
    onclone: (clonedDoc, clonedEl) => {
      sanitizeOklchForHtml2Canvas(clonedDoc);
      if (clonedEl instanceof HTMLElement) {
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.border = 'none';
        clonedEl.style.borderRadius = '0';
        clonedEl.style.backgroundColor = '#ffffff';
      }
    },
  });
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = 210, pageH = 297;
  const pxPerMm = canvas.width / pageW;
  const pagePx = Math.floor(pageH * pxPerMm);
  let offset = 0, page = 0;
  while (offset < canvas.height) {
    if (page) pdf.addPage();
    const slice = document.createElement('canvas');
    slice.width = canvas.width; slice.height = Math.min(pagePx, canvas.height - offset);
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, offset, canvas.width, slice.height, 0, 0, slice.width, slice.height);
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pageW, slice.height / pxPerMm);
    offset += slice.height; page++;
  }
  pdf.save(safe(title) + '.pdf');
}

export function printCorrectionMemo(element: HTMLElement, title: string) {
  const hwStyle = loadHandwritingSettings();
  const printFont = getEffectiveExportFontFamily('pdf', hwStyle, 'memos');
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
  if (!win) return;
  win.document.write(`<!doctype html><html dir="rtl"><head><title>${title}</title><style>@page{size:A4;margin:12mm}body{margin:0;background:#fff;font-family:${printFont};color:#172033;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{width:100%}</style></head><body><div class="sheet">${element.innerHTML}</div><script>window.onload=function(){window.print();}</script></body></html>`);
  win.document.close();
}

const DOC_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
};

interface CorrectionDocCtx {
  hwStyle: HandwritingStyleSettings;
  hwActive: boolean;
  wordFont: string;
  fontAttrs: DocxFontAttrs;
  lineSpacing: number;
}

const docCell = (
  text: string,
  opts: {
    bold?: boolean;
    shade?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    width?: number;
    semantic?: boolean;
    defaultRole?: PenRole;
    hwStyle?: HandwritingStyleSettings;
    hwActive?: boolean;
    wordFont?: string;
    fontAttrs?: DocxFontAttrs;
    lineSpacing?: number;
  } = {}
) => {
  const hwStyle = opts.hwStyle ?? loadHandwritingSettings();
  const hwActive = opts.hwActive ?? isHandwritingActiveFor('memos', hwStyle);
  const wordFont = opts.wordFont ?? 'Playpen Sans Arabic';
  const fontAttrs = opts.fontAttrs ?? { ascii: wordFont, hAnsi: wordFont, cs: wordFont, hint: 'cs' };
  const scaled20 = scaleDocxFontSize(20, hwStyle, 'memos');
  const lineSpacing = opts.lineSpacing ?? getDocxLineSpacing(hwStyle, 'memos');

  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: 'auto' } : undefined,
    borders: DOC_BORDER,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO },
      children: opts.semantic && hwActive
        ? buildDocxTextRuns(text || ' ', hwStyle, { size: 20, bold: opts.bold, defaultRole: opts.defaultRole || 'bodyBlack', fontName: wordFont, area: 'memos' })
        : [new TextRun({ text: text || ' ', bold: opts.bold, boldComplexScript: opts.bold, font: fontAttrs, size: scaled20, sizeComplexScript: scaled20, rightToLeft: true })],
    })],
  });
};

const docTable = (
  headers: string[],
  rows: string[][],
  widths?: number[],
  ctx?: CorrectionDocCtx
) =>
  new Table({
    visuallyRightToLeft: true,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((header, index) => docCell(header, { bold: true, shade: 'DBE4F2', align: AlignmentType.CENTER, width: widths?.[index], ...ctx })),
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, index) => docCell(cell, { width: widths?.[index], semantic: true, ...ctx })),
      })),
    ],
  });

const docHeading = (
  text: string,
  size = 22,
  spacing = 120,
  role: PenRole = 'titleBlue',
  ctx?: CorrectionDocCtx
) => {
  const hwStyle = ctx?.hwStyle ?? loadHandwritingSettings();
  const hwActive = ctx?.hwActive ?? isHandwritingActiveFor('memos', hwStyle);
  const wordFont = ctx?.wordFont ?? 'Playpen Sans Arabic';
  const fontAttrs = ctx?.fontAttrs ?? { ascii: wordFont, hAnsi: wordFont, cs: wordFont, hint: 'cs' };
  const color = hwActive ? stripHash(hwStyle.palette[role]) : '000000';
  const scaled = scaleDocxFontSize(size, hwStyle, 'memos');
  const lineSpacing = ctx?.lineSpacing ?? getDocxLineSpacing(hwStyle, 'memos');
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { before: spacing, after: 60, line: lineSpacing, lineRule: LineRuleType.AUTO },
    children: [new TextRun({ text, bold: true, boldComplexScript: true, color, font: fontAttrs, size: scaled, sizeComplexScript: scaled, rightToLeft: true })],
  });
};

const line = (label: string, value: string, fontAttrs: DocxFontAttrs, size: number, lineSpacing: number) =>
  new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: `${label}: ${value || '................'}`, font: fontAttrs, size, sizeComplexScript: size, rightToLeft: true })] });

/**
 * تصدير Word بجداول حقيقية مطابقة لشكل المذكرة، مع تضمين الخط المختار.
 */
export async function exportCorrectionMemoDataToDocx(
  data: CorrectionMemoData,
  exportOptions?: CorrectionMemoDocxOptions
): Promise<Blob> {
  const hwStyle = exportOptions?.settings ?? loadHandwritingSettings();
  const hwActive = isHandwritingActiveFor('memos', hwStyle);
  const embeddedFonts = await prepareDocxFonts({
    settings: hwStyle,
    area: 'memos',
    allowFallback: exportOptions?.allowFallback,
    fontLoader: exportOptions?.fontLoader,
  });
  const wordFont = embeddedFonts.wordFont;
  const fontAttrs = embeddedFonts.fontAttrs;
  const lineSpacing = getDocxLineSpacing(hwStyle, 'memos');
  const ctx: CorrectionDocCtx = { hwStyle, hwActive, wordFont, fontAttrs, lineSpacing };
  const sz = (n: number) => scaleDocxFontSize(n, hwStyle, 'memos');

  const titleColor = hwActive ? stripHash(hwStyle.palette.titleBlue) : '000000';
  const subColor = hwActive ? stripHash(hwStyle.palette.subRed) : '000000';
  const noteColor = hwActive ? stripHash(hwStyle.palette.noteOrange) : '000000';

  const children: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: 'الجمهورية الجزائرية الديمقراطية الشعبية', bold: true, boldComplexScript: true, font: fontAttrs, size: sz(24), sizeComplexScript: sz(24), rightToLeft: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120, line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: 'وزارة التربية الوطنية', bold: true, boldComplexScript: true, font: fontAttrs, size: sz(24), sizeComplexScript: sz(24), rightToLeft: true })] }),
    line('مديرية التربية لولاية', data.directorate, fontAttrs, sz(20), lineSpacing),
    line('المتوسطة', data.schoolName, fontAttrs, sz(20), lineSpacing),
    line('المستوى', data.level, fontAttrs, sz(20), lineSpacing),
    line('السنة الدراسية', data.schoolYear, fontAttrs, sz(20), lineSpacing),
    line('المادة', 'علوم الطبيعة والحياة', fontAttrs, sz(20), lineSpacing),
    line('الأستاذ(ة)', data.teacherName, fontAttrs, sz(20), lineSpacing),
    line('المدة', data.duration, fontAttrs, sz(20), lineSpacing),
    line('الفصل', data.term, fontAttrs, sz(20), lineSpacing),
    line('الميدان', data.midan, fontAttrs, sz(20), lineSpacing),
    line('الكفاءة الختامية', data.competence, fontAttrs, sz(20), lineSpacing),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 40, line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: data.title, bold: true, boldComplexScript: true, color: titleColor, font: fontAttrs, size: sz(30), sizeComplexScript: sz(30), rightToLeft: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160, line: lineSpacing, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: `${data.examType} ${data.term} في مادة علوم الطبيعة والحياة`, bold: true, boldComplexScript: true, color: subColor, font: fontAttrs, size: sz(22), sizeComplexScript: sz(22), rightToLeft: true })] }),
  ];

  children.push(docHeading(`الموارد المعرفية المستهدفة في ${data.examType}`, 22, 120, 'titleBlue', ctx));
  children.push(docTable(
    ['التمرين', 'المقطع التعلمي', 'الموارد المعرفية', 'معايير ومؤشرات التقويم'],
    data.resources
      .filter(row => data.examType === 'اختبار' || !row.exerciseLabel.includes('الإدماجية'))
      .map(row => [row.exerciseLabel, row.maqta, row.knowledge, row.criteria]),
    [16, 22, 32, 30],
    ctx
  ));

  children.push(docHeading(`الجزء الأول: ${data.part1DeclaredPoints || '…'} نقطة (المجموع المحسوب: ${formatPoints(part1Total(data))} ن)`, 22, 120, 'titleBlue', ctx));
  data.exercises.filter(exercise => exercise.part === 1).forEach((exercise, index) => {
    children.push(docHeading(`التمرين ${index === 0 ? 'الأول' : index === 1 ? 'الثاني' : index + 1}: ${exercise.declaredPoints || '…'} نقطة`, 22, 80, 'subRed', ctx));
    children.push(docTable(
      ['السؤال', 'عناصر الإجابة', 'ت. الجزئي', 'المجموع'],
      [
        ...exercise.questions.map(question => [question.number, question.expected, question.points ? `${question.points} ن` : '', question.points ? `${question.points} ن` : '']),
        ['مجموع النقاط', '', '', `${formatPoints(exerciseTotal(exercise))} ن`],
      ],
      [14, 62, 12, 12],
      ctx
    ));
  });

  if (data.examType === 'اختبار') {
    children.push(docHeading(`الجزء الثاني: الوضعية الإدماجية (${data.integration.declaredPoints || '…'} نقطة)`, 22, 120, 'titleBlue', ctx));
    children.push(docTable(
      ['المعيار', 'مؤشرات التصحيح (عناصر الإجابة المنتظرة)', 'ت. الجزئي', 'المجموع'],
      [
        ...data.integration.criteria.flatMap(criterion => criterion.indicators.map((indicator, index) => [
          index === 0 ? criterion.label : '',
          indicator.text,
          indicator.points ? `${indicator.points} ن` : '',
          index === 0 ? formatPoints(criterionTotal(criterion)) : '',
        ])),
        ['مجموع نقاط الوضعية الإدماجية', '', '', `${formatPoints(integrationTotal(data))} ن`],
        ['المجموع العام للمذكرة', '', '', `${formatPoints(overallTotal(data))} ن`],
      ],
      [22, 54, 12, 12],
      ctx
    ));
  } else {
    children.push(docHeading(`المجموع العام للفرض: ${formatPoints(part1Total(data))} ن`, 22, 120, 'titleBlue', ctx));
  }

  children.push(docHeading('التصحيح البعدي وتحليل النتائج', 22, 120, 'defGreen', ctx));
  children.push(docTable(
    ['عدد المتعلمين', 'المتحصلون على 10/20 فأكثر', 'نسبة النجاح', 'معدل القسم'],
    [[data.results.learners, data.results.above10, data.results.passRate, data.results.average]],
    [25, 25, 25, 25],
    ctx
  ));

  children.push(docHeading('الأخطاء المتكررة', 22, 80, 'subRed', ctx));
  children.push(docTable(
    ['التمرين / السؤال', 'الخطأ المتكرر', 'نوعه', 'عدد المتعلمين', 'سببه المحتمل'],
    data.errors.map(row => [row.exercise, row.error, row.kind, row.learners, row.cause]),
    [16, 30, 18, 14, 22],
    ctx
  ));

  children.push(docHeading('خطة المعالجة (حلول المعالجة البيداغوجية)', 22, 80, 'defGreen', ctx));
  children.push(docTable(
    ['الهدف المعالج', 'النشاط العلاجي المقترح', 'الوسيلة / السند', 'المتعلمون المعنيون'],
    data.remediation.map(row => [row.objective, row.activity, row.support, row.learners]),
    [26, 30, 24, 20],
    ctx
  ));

  children.push(docHeading('ملاحظات خاصة بالتصحيح', 22, 160, 'noteOrange', ctx));
  data.notes.forEach(note => {
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO },
      children: [new TextRun({ text: `– ${note || '................................................................'}`, color: noteColor, font: fontAttrs, size: sz(20), sizeComplexScript: sz(20), rightToLeft: true })],
    }));
  });

  children.push(new Paragraph({ spacing: { before: 240, line: lineSpacing, lineRule: LineRuleType.AUTO }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `الأستاذ(ة) المصحح(ة): ${data.teacherName || '................'}    السيد(ة) المفتش(ة): ................    السيد(ة) المدير(ة): ................`, font: fontAttrs, size: sz(20), sizeComplexScript: sz(20), rightToLeft: true })] }));

  const doc = new Document({
    fonts: embeddedFonts.fonts,
    styles: {
      default: {
        document: {
          run: { rightToLeft: true, font: fontAttrs, size: sz(20), sizeComplexScript: sz(20) },
          paragraph: { alignment: AlignmentType.RIGHT, spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  if (typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safe(`${data.title}_${data.level || ''}`) + '.docx';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  return blob;
}
