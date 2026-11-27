/**
 * التصدير للنظام الجديد: معاينة الدفتر، تصدير PDF، تصدير Word، طباعة.
 *
 * يُصدّر **جميع الصفحات** وليس الصفحة الأولى فقط. يُعاد استخدام مكتبات
 * `docx` و `jspdf`/`html2canvas` الموجودة في المنصة.
 */
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  TextRun,
  HeadingLevel,
  BorderStyle,
  WidthType,
} from 'docx';
import { jsPDF } from 'jspdf';
import { safeHtml2Canvas } from '../utils/html2canvasSanitizer';
import { waitForImages } from '../utils/exportDom';
import {
  formatDateArabic,
  dayNameOf,
  getPeriodRange,
  schoolDaysInRange,
} from './dateUtils';
import {
  CANCELLATION_REASON_LABELS,
  LESSON_TYPE_LABELS,
  LEVEL_LABELS,
  type Lesson,
  type LogbookPeriod,
} from './types';

export interface ExportContext {
  teacherName: string;
  level: string;
  className: string;
  subject: string;
}

/** تنظيم الحصص حسب التاريخ ثم الوقت. */
export function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });
}

/** الحصص ضمن المدى الزمني للفترة حول التاريخ المحدد. */
export function lessonsInPeriod(lessons: Lesson[], selectedDate: string, period: LogbookPeriod): Lesson[] {
  const { start, end } = getPeriodRange(selectedDate, period);
  return sortLessons(lessons.filter((l) => l.date >= start && l.date <= end));
}

// ---------------------------------------------------------------------------
// PDF via html2canvas + jsPDF (يعرض جميع الصفحات)
// ---------------------------------------------------------------------------

/**
 * تصدير الدفتر إلى PDF عبر أخذ لقطات لكل صفحة من DOM.
 * يدعم التقسيم إلى صفحات A4 متعددة.
 */
export async function exportLogbookPdf(
  container: HTMLElement,
  fileName: string,
  ctx: ExportContext
): Promise<void> {
  await waitForImages(container);
  const canvas = await safeHtml2Canvas(container, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  void ctx;
  pdf.save(fileName);
}

/** طباعة الدفتر مباشرة عبر المتصفح. */
export function printLogbook(container: HTMLElement): void {
  const printArea = document.createElement('div');
  printArea.innerHTML = container.innerHTML;
  printArea.style.position = 'fixed';
  printArea.style.left = '-9999px';
  printArea.style.top = '0';
  document.body.appendChild(printArea);
  window.print();
  setTimeout(() => document.body.removeChild(printArea), 500);
}

// ---------------------------------------------------------------------------
// Word (docx) — صفحات متعددة، كل حصة بطاقة
// ---------------------------------------------------------------------------

const PALETTE = {
  teal: '0F766E',
  tealDark: '115E59',
  gray: '6B7280',
  light: 'F1F5F9',
  red: 'B91C1C',
  green: '15803D',
};

function run(text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    size: opts.size ?? 20,
    color: opts.color,
    font: { name: 'Tajawal', eastAsia: 'Tajawal' },
  });
}

function cell(text: string, opts: { bold?: boolean; color?: string; fill?: string; size?: number; width?: number } = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [run(text, { bold: opts.bold, color: opts.color, size: opts.size })],
      }),
    ],
    shading: opts.fill ? { fill: opts.fill, type: 'clear', color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function labelCell(label: string, fill = PALETTE.light) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [run(label, { bold: true, color: PALETTE.tealDark, size: 18 })],
      }),
    ],
    shading: { fill, type: 'clear', color: 'auto' },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

function fieldCell(text: string) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [run(text || '—', { size: 19 })],
      }),
    ],
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

/** بطاقة حصة واحدة كجدول docx. */
function lessonTable(lesson: Lesson): Table {
  const status = lesson.status;
  const cancelled = status === 'cancelled';
  const headerFill = cancelled ? 'FEE2E2' : 'CCFBF1';
  const statusColor = cancelled ? PALETTE.red : PALETTE.green;
  const statusText = cancelled
    ? `🚫 حصة ملغاة${lesson.cancellationReason ? ` — السبب: ${CANCELLATION_REASON_LABELS[lesson.cancellationReason]}` : ''}${lesson.cancellationDetail ? ` (${lesson.cancellationDetail})` : ''}`
    : status === 'completed'
    ? '✓ مكتملة'
    : '✓ مُجدولة';

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                run(`${lesson.startTime} — ${lesson.endTime}`, { bold: true, size: 22, color: PALETTE.tealDark }),
              ],
            }),
          ],
          shading: { fill: headerFill, type: 'clear', color: 'auto' },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [run(statusText, { bold: true, size: 18, color: statusColor })],
            }),
          ],
          shading: { fill: headerFill, type: 'clear', color: 'auto' },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
        }),
      ],
    }),
    new TableRow({
      children: [
        labelCell('المستوى'),
        fieldCell(LEVEL_LABELS[lesson.level]),
        labelCell('القسم'),
        fieldCell(lesson.className),
      ],
    }),
    new TableRow({
      children: [
        labelCell('المادة'),
        fieldCell(lesson.subject),
        labelCell('المقطع / الوحدة'),
        fieldCell(lesson.unit),
      ],
    }),
    new TableRow({
      children: [labelCell('عنوان النشاط'), fieldCell(lesson.activity)],
    }),
    new TableRow({
      children: [labelCell('نوع الحصة'), fieldCell(LESSON_TYPE_LABELS[lesson.type])],
    }),
    new TableRow({
      children: [labelCell('الكفاءة المستهدفة'), fieldCell(lesson.competency)],
    }),
    new TableRow({
      children: [labelCell('سير الحصة'), fieldCell(lesson.flow)],
    }),
    lesson.activities.length
      ? new TableRow({
          children: [labelCell('الأنشطة'), fieldCell(lesson.activities.join('  •  '))],
        })
      : new TableRow({ children: [labelCell('الأنشطة'), fieldCell('')] }),
    lesson.experiments.length
      ? new TableRow({
          children: [labelCell('التجارب'), fieldCell(lesson.experiments.join('  •  '))],
        })
      : new TableRow({ children: [labelCell('التجارب'), fieldCell('')] }),
    lesson.homework
      ? new TableRow({ children: [labelCell('الواجب'), fieldCell(lesson.homework)] })
      : new TableRow({ children: [labelCell('الواجب'), fieldCell('')] }),
    lesson.notes
      ? new TableRow({ children: [labelCell('ملاحظات'), fieldCell(lesson.notes)] })
      : new TableRow({ children: [labelCell('ملاحظات'), fieldCell('')] }),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    },
  });
}

/**
 * توليد ملف Word للدفتر. كل حصة بطاقة، وكل يوم عنوان، بحيث يُصدّر
 * **جميع الصفحات** وليس الصفحة الأولى فقط.
 */
export async function exportLogbookWord(
  lessons: Lesson[],
  selectedDate: string,
  period: LogbookPeriod,
  ctx: ExportContext,
  fileName: string
): Promise<void> {
  const { start, end } = getPeriodRange(selectedDate, period);
  const rangeLessons = lessonsInPeriod(lessons, selectedDate, period);
  const days = schoolDaysInRange(start, end);

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [run('الدفتر اليومي', { bold: true, size: 36, color: PALETTE.tealDark })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        run(`الأستاذ: ${ctx.teacherName || '—'}`, { size: 20, color: PALETTE.gray }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        run(
          `التاريخ: ${formatDateArabic(start)}${period !== 'day' ? `  —  ${formatDateArabic(end)}` : ''}`,
          { size: 20, color: PALETTE.gray }
        ),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        run(`المستوى: ${ctx.level || '—'}    القسم: ${ctx.className || '—'}`, {
          size: 20,
          color: PALETTE.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  let hasContent = false;
  for (const day of days) {
    const dayLessons = rangeLessons.filter((l) => l.date === day);
    if (dayLessons.length === 0) continue;
    hasContent = true;
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [run(`${dayNameOf(day)} — ${formatDateArabic(day)}`, { bold: true, size: 26, color: PALETTE.teal })],
        spacing: { before: 240, after: 120 },
      })
    );
    for (const lesson of dayLessons) {
      children.push(lessonTable(lesson));
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }
  }

  if (!hasContent) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run('لا توجد حصص في هذه الفترة.', { size: 22, color: PALETTE.gray })],
        spacing: { before: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** اسم ملف آمن حسب الفترة والتاريخ. */
export function buildExportName(selectedDate: string, period: LogbookPeriod, ext: 'pdf' | 'docx'): string {
  const { start } = getPeriodRange(selectedDate, period);
  const stamp = formatDateArabic(start).replace(/\s/g, '_');
  return `الدفتر_اليومي_${stamp}.${ext}`;
}
