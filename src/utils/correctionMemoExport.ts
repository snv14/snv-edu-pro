import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import type { CorrectionMemoData } from '../services/correctionMemoModel';
import { criterionTotal, exerciseTotal, formatPoints, integrationTotal, part1Total, overallTotal } from '../services/correctionMemoModel';
import jsPDF from 'jspdf';
import { safeHtml2Canvas, sanitizeOklchForHtml2Canvas } from './html2canvasSanitizer';
import { MemoConfig } from '../types';

const safe = (s: string) => (s || 'مذكرة_تصحيح').replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '_').slice(0, 80);

export async function exportCorrectionMemoToDocx(args: {
  title: string; text: string; config?: MemoConfig; level?: string;
}) {
  const lines = (args.text || '').split(/\r?\n/);
  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'الجمهورية الجزائرية الديمقراطية الشعبية', bold: true, font: 'Tajawal', size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'وزارة التربية الوطنية', bold: true, font: 'Tajawal', size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: args.title, bold: true, font: 'Tajawal', size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `المستوى: ${args.level?.toUpperCase() || '—'}    المادة: علوم الطبيعة والحياة    المؤسسة: ${args.config?.schoolName || '—'}    الأستاذ(ة): ${args.config?.teacherName || '—'}`, font: 'Tajawal', size: 22 })] }),
    ...lines.map(line => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 100 }, children: [new TextRun({ text: line || ' ', font: 'Tajawal', size: 22 })] }))
  ];
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }]
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = safe(args.title) + '.docx'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function exportCorrectionMemoToPdf(element: HTMLElement, title: string) {
  const canvas = await safeHtml2Canvas(element, { scale: 2, useCORS: true, backgroundColor: '#fff', onclone: sanitizeOklchForHtml2Canvas });
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
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
  if (!win) return;
  win.document.write(`<!doctype html><html dir="rtl"><head><title>${title}</title><style>@page{size:A4;margin:12mm}body{margin:0;background:#fff;font-family:Tajawal,Arial,sans-serif;color:#172033}.sheet{width:100%}</style></head><body><div class="sheet">${element.innerHTML}</div><script>window.onload=function(){window.print();}</script></body></html>`);
  win.document.close();
}

const DOC_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '555555' },
};

const docCell = (text: string, opts: { bold?: boolean; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; width?: number } = {}) =>
  new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: 'auto' } : undefined,
    borders: DOC_BORDER,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.RIGHT,
      bidirectional: true,
      children: [new TextRun({ text: text || ' ', bold: opts.bold, font: 'Tajawal', size: 20 })],
    })],
  });

const docTable = (headers: string[], rows: string[][], widths?: number[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((header, index) => docCell(header, { bold: true, shade: 'DBE4F2', align: AlignmentType.CENTER, width: widths?.[index] })),
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, index) => docCell(cell, { width: widths?.[index] })),
      })),
    ],
  });

const docHeading = (text: string, size = 22, spacing = 120) =>
  new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { before: spacing, after: 60 }, children: [new TextRun({ text, bold: true, font: 'Tajawal', size })] });

const line = (label: string, value: string) =>
  new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: `${label}: ${value || '................'}`, font: 'Tajawal', size: 20 })] });

/** تصدير Word بجداول حقيقية مطابقة لشكل المذكرة، لا نص مسطح. */
export async function exportCorrectionMemoDataToDocx(data: CorrectionMemoData) {
  const children: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'الجمهورية الجزائرية الديمقراطية الشعبية', bold: true, font: 'Tajawal', size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'وزارة التربية الوطنية', bold: true, font: 'Tajawal', size: 24 })] }),
    line('مديرية التربية لولاية', data.directorate),
    line('المتوسطة', data.schoolName),
    line('المستوى', data.level),
    line('السنة الدراسية', data.schoolYear),
    line('المادة', 'علوم الطبيعة والحياة'),
    line('الأستاذ(ة)', data.teacherName),
    line('المدة', data.duration),
    line('الفصل', data.term),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 40 }, children: [new TextRun({ text: data.title, bold: true, font: 'Tajawal', size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: `${data.examType} ${data.term} في مادة علوم الطبيعة والحياة`, bold: true, font: 'Tajawal', size: 22 })] }),
  ];

  children.push(docHeading('الموارد المعرفية المستهدفة في الاختبار'));
  children.push(docTable(
    ['التمرين', 'المقطع التعلمي', 'الموارد المعرفية', 'معايير ومؤشرات التقويم'],
    data.resources.map(row => [row.exerciseLabel, row.maqta, row.knowledge, row.criteria]),
    [16, 22, 32, 30]
  ));

  children.push(docHeading(`الجزء الأول: ${data.part1DeclaredPoints || '…'} نقطة (المجموع المحسوب: ${formatPoints(part1Total(data))} ن)`));
  data.exercises.filter(exercise => exercise.part === 1).forEach((exercise, index) => {
    children.push(docHeading(`التمرين ${index === 0 ? 'الأول' : index === 1 ? 'الثاني' : index + 1}: ${exercise.declaredPoints || '…'} نقطة`, 22, 80));
    children.push(docTable(
      ['السؤال', 'عناصر الإجابة', 'ت. الجزئي', 'المجموع'],
      [
        ...exercise.questions.map(question => [question.number, question.expected, question.points ? `${question.points} ن` : '', question.points ? `${question.points} ن` : '']),
        ['مجموع النقاط', '', '', `${formatPoints(exerciseTotal(exercise))} ن`],
      ],
      [14, 62, 12, 12]
    ));
  });

  children.push(docHeading(`الجزء الثاني: الوضعية الإدماجية (${data.integration.declaredPoints || '…'} نقطة)`));
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
    [22, 54, 12, 12]
  ));

  children.push(docHeading('التصحيح البعدي وتحليل النتائج'));
  children.push(docTable(
    ['عدد المتعلمين', 'المتحصلون على 10/20 فأكثر', 'نسبة النجاح', 'معدل القسم'],
    [[data.results.learners, data.results.above10, data.results.passRate, data.results.average]],
    [25, 25, 25, 25]
  ));

  children.push(docHeading('الأخطاء المتكررة', 22, 80));
  children.push(docTable(
    ['التمرين / السؤال', 'الخطأ المتكرر', 'نوعه', 'عدد المتعلمين', 'سببه المحتمل'],
    data.errors.map(row => [row.exercise, row.error, row.kind, row.learners, row.cause]),
    [16, 30, 18, 14, 22]
  ));

  children.push(docHeading('خطة المعالجة (حلول المعالجة البيداغوجية)', 22, 80));
  children.push(docTable(
    ['الهدف المعالج', 'النشاط العلاجي المقترح', 'الوسيلة / السند', 'المتعلمون المعنيون'],
    data.remediation.map(row => [row.objective, row.activity, row.support, row.learners]),
    [26, 30, 24, 20]
  ));

  children.push(docHeading('ملاحظات خاصة بالتصحيح', 22, 160));
  data.notes.forEach(note => {
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: `– ${note || '................................................................'}`, font: 'Tajawal', size: 20 })] }));
  });

  children.push(new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `الأستاذ(ة) المصحح(ة): ${data.teacherName || '................'}    السيد(ة) المفتش(ة): ................    السيد(ة) المدير(ة): ................`, font: 'Tajawal', size: 20 })] }));

  const doc = new Document({
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
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safe(`${data.title}_${data.level || ''}`) + '.docx';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
