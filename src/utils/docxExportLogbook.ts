import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  AlignmentType, 
  WidthType, 
  BorderStyle, 
  VerticalAlign,
  ShadingType,
  PageOrientation,
  Header,
  Footer,
  ImageRun,
  PageNumber
} from "docx";
import { MemoConfig } from "../types";
import { LogEntry, getBaseSection } from "../components/DailyLogbook";
import { safeHtml2Canvas } from "./html2canvasSanitizer";

const createParagraph = (text: string, bold = false, color = "000000", size = 20, alignment: any = AlignmentType.CENTER) => {
  return new Paragraph({
    alignment: alignment,
    children: (text || "").split('\n').map((line, i, arr) => {
      const parts = line.split(/(<u>.*?<\/u>)/g);
      const runs = parts.map(part => {
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
          return new TextRun({
            text: part.slice(3, -4),
            bold: bold,
            underline: { type: "single", color: color },
            color: color,
            rightToLeft: true,
            size: size,
            font: "Tajawal"
          });
        }
        return new TextRun({
          text: part,
          bold: bold,
          color: color,
          rightToLeft: true,
          size: size,
          font: "Tajawal"
        });
      });
      return [ ...runs, ...(i < arr.length - 1 ? [new TextRun({ break: 1 })] : []) ];
    }).flat()
  });
};

const createCell = (text: string, bold = false, bgColor?: string, columnSpan?: number, rowSpan?: number, size = 20, alignment: any = AlignmentType.CENTER, widthPercent?: number) => {
  const fill = bgColor === "000000" ? "064E3B" : (bgColor || "FFFFFF");
  const textColor = fill === "064E3B" || fill === "006233" ? "FFFFFF" : "000000";
  return new TableCell({
    columnSpan,
    rowSpan,
    shading: { fill, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    children: [createParagraph(text, bold, textColor, size, alignment)]
  });
};

const LEVEL_THEMES: Record<string, { header: string; border: string; soft: string; ink: string }> = {
  '1م': { header: '047857', border: '10B981', soft: 'ECFDF5', ink: '065F46' },
  '2م': { header: '2563EB', border: '60A5FA', soft: 'EFF6FF', ink: '1E3A8A' },
  '3م': { header: 'D97706', border: 'F59E0B', soft: 'FFFBEB', ink: '92400E' },
  '4م': { header: 'E11D48', border: 'FB7185', soft: 'FFF1F2', ink: '9F1239' },
};
const getLevelTheme = (levels: string[]) => LEVEL_THEMES[levels[0]] || LEVEL_THEMES['1م'];

const WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

const findPreviousComparableCurriculumLog = (logs: LogEntry[], currentIndex: number, log: LogEntry): LogEntry | undefined => {
  const baseSection = getBaseSection(log.section);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const candidate = logs[i];
    if (
      candidate.level === log.level &&
      getBaseSection(candidate.section) === baseSection &&
      (!candidate.lessonType || candidate.lessonType === 'curriculum')
    ) {
      return candidate;
    }
  }
  return undefined;
};

const getExportLessonContent = (log: LogEntry, previous?: LogEntry): string => {
  void previous;
  const parts: string[] = [];
  if (log.midan) parts.push(`الميدان: ${log.midan}`);
  if (log.maqta) parts.push(`المقطع: ${log.maqta}`);
  if (log.mawrid) parts.push(`المورد التعلمي: ${log.mawrid}`);
  if (log.ta3alom) parts.push(`تعلم المورد: ${log.ta3alom}`);
  if (log.content) parts.push(log.content);
  else if (log.manualContent) parts.push(log.manualContent);
  return parts.length ? parts.join('\n') : (log.content || log.manualContent || '').trim();
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const imageDataUrlToPng = async (dataUrl: string): Promise<Uint8Array> => {
  if (!dataUrl.startsWith("data:image/")) throw new Error("Unsupported image data");
  const image = new Image();
  image.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("تعذر تحميل صورة الختم"));
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || 512;
  canvas.height = image.naturalHeight || 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas غير متاح");
  ctx.drawImage(image, 0, 0);
  return base64ToUint8Array(canvas.toDataURL("image/png").split(",")[1]);
};

const buildTeacherStampSvg = (config: MemoConfig, size = 420): string => {
  const name = (config.teacherName || "").replace(/[<>&"]/g, "");
  const school = (config.schoolName || "").slice(0, 30).replace(/[<>&"]/g, "");
  const grade = (config.teacherGrade || "أستاذ المادة").replace("للتعليم المتوسط", "").trim().replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="white"/>
    <circle cx="210" cy="210" r="170" fill="white" fill-opacity=".55" stroke="#000000" stroke-width="7" stroke-dasharray="12 6"/>
    <circle cx="210" cy="210" r="132" fill="none" stroke="#000000" stroke-width="3"/>
    <text x="210" y="105" text-anchor="middle" font-family="Arial" font-size="25" font-weight="bold" fill="#000000">الجمهورية الجزائرية الديمقراطية الشعبية</text>
    <text x="210" y="150" text-anchor="middle" font-family="Arial" font-size="23" font-weight="bold" fill="#000000">وزارة التربية الوطنية</text>
    <text x="210" y="200" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="#000000">علوم الطبيعة والحياة</text>
    <text x="210" y="245" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900" fill="#000000">${name}</text>
    <text x="210" y="285" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#000000">${grade}</text>
    <text x="210" y="320" text-anchor="middle" font-family="Arial" font-size="17" fill="#000000">${school}</text>
  </svg>`;
};

const svgToPngData = async (svg: string, width = 420, height = 420): Promise<Uint8Array> => {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("تعذر تحويل الختم إلى صورة"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas غير متاح");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return base64ToUint8Array(canvas.toDataURL("image/png").split(",")[1]);
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const generateLogbookDocx = async (
  logs: LogEntry[],
  config: MemoConfig,
  gridRows: any[] = [],
  holidays: any[] = [],
  assignedLevels: string[] = [],
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<Blob> => {

  const theme = getLevelTheme(assignedLevels);
  const rows: TableRow[] = [];
  let previousWeekKey = '';
  rows.push(new TableRow({
    tableHeader: true,
    children: [
      createCell("التاريخ واليوم", true, theme.header, 1, 1, 20, AlignmentType.CENTER, 16),
      createCell("التوقيت", true, theme.header, 1, 1, 20, AlignmentType.CENTER, 15),
      createCell("القسم", true, theme.header, 1, 1, 20, AlignmentType.CENTER, 13),
      createCell("المحتوى الدرس", true, theme.header, 1, 1, 20, AlignmentType.CENTER, 41),
      createCell("الملاحظات", true, theme.header, 1, 1, 20, AlignmentType.CENTER, 15),
    ]
  }));

  logs.forEach((log, index) => {
    const currentWeekKey = (() => {
      const d = new Date(`${log.dateStr}T12:00:00`);
      if (Number.isNaN(d.getTime())) return log.dateStr;
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    })();

    if (previousWeekKey && currentWeekKey !== previousWeekKey) {
      for (let weekSpaceIdx = 0; weekSpaceIdx < 2; weekSpaceIdx++) {
        rows.push(new TableRow({
          children: [
            createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.CENTER, 16),
            createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.CENTER, 15),
            createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.CENTER, 13),
            createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.RIGHT, 41),
            createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.CENTER, 15)
          ]
        }));
      }
    }

    previousWeekKey = currentWeekKey;
    const bgColor = index % 2 === 0 ? "FFFFFF" : theme.soft;
    const timeWithArrow = (log.time || '').replace(/\s*[-–—→←➔]\s*/g, ' ➔ ').replace(/\s*➔\s*/g, ' ➔ ');
    const fullContent = getExportLessonContent(log, findPreviousComparableCurriculumLog(logs, index, log));
    rows.push(new TableRow({
      cantSplit: true,
      children: [
        createCell(
          (log.dateStr || '').includes('/')
            ? (log.dateStr || '')
                .split('/')
                .map((dp, i) => `${((log.dayName || '').split('/')[i] || (log.dayName || '')).trim()} ${dp.trim()}`)
                .join('\n')
            : `${log.dayName || ''}\n${log.dateStr || ''}`.trim(),
          false,
          bgColor,
          1,
          1,
          18,
          AlignmentType.CENTER,
          16
        ),
        createCell(timeWithArrow, false, bgColor, 1, 1, 18, AlignmentType.CENTER, 15),
        createCell(log.section || '', true, bgColor, 1, 1, 18, AlignmentType.CENTER, 13),
        createCell(fullContent, false, bgColor, 1, 1, 18, AlignmentType.RIGHT, 41),
        createCell(log.note || '', false, bgColor, 1, 1, 18, AlignmentType.RIGHT, 15),
      ]
    }));
  });

  // صفوف إضافية فارغة داخل جدول Word نفسه؛ تبقى خلاياها قابلة للنقر والكتابة والتعديل.
  for (let blankRow = 0; blankRow < 3; blankRow++) {
    rows.push(new TableRow({
      cantSplit: true,
      children: [
        createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.CENTER, 16),
        createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.CENTER, 15),
        createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.CENTER, 13),
        createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.RIGHT, 41),
        createCell("", false, "FFFFFF", 1, 1, 18, AlignmentType.RIGHT, 15),
      ],
    }));
  }

  // Front Page Content
  const frontPageChildren: any[] = [
    // Same red/green small header
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      rows: [
        new TableRow({
          children: [
            createCell(`الجمهورية الجزائرية الديمقراطية الشعبية\nوزارة التربية الوطنية`, true, undefined, 1, 1, 18, AlignmentType.RIGHT),
            createCell(`الدفتر اليومي - الأستاذ(ة): ${config.teacherName}`, true, undefined, 1, 1, 28, AlignmentType.CENTER),
            createCell(`الموسم: ${config.schoolYear}\nالمتوسطة: ${config.schoolName}`, true, undefined, 1, 1, 18, AlignmentType.LEFT),
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 600 } }),
    createParagraph("الدفتر اليومي", true, "000000", 40),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    
    // Info Block (Simple border)
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      rows: [
        new TableRow({ children: [ createCell("الأستاذ(ة):", true, undefined, 1, 1, 20, AlignmentType.RIGHT), createCell(config.teacherName || '—', true, undefined, 1, 1, 20, AlignmentType.RIGHT) ] }),
        new TableRow({ children: [ createCell("المادة:", true, undefined, 1, 1, 20, AlignmentType.RIGHT), createCell("علوم الطبيعة والحياة", true, undefined, 1, 1, 20, AlignmentType.RIGHT) ] }),
        new TableRow({ children: [ createCell("المتوسطة:", true, undefined, 1, 1, 20, AlignmentType.RIGHT), createCell(config.schoolName || '—', true, undefined, 1, 1, 20, AlignmentType.RIGHT) ] }),
        new TableRow({ children: [ createCell("السنة الدراسية:", true, undefined, 1, 1, 20, AlignmentType.RIGHT), createCell(config.schoolYear || '', true, undefined, 1, 1, 20, AlignmentType.RIGHT) ] }),
        new TableRow({ children: [ createCell("المستويات المسندة:", true, undefined, 1, 1, 20, AlignmentType.RIGHT), createCell(assignedLevels.join(' ، '), true, undefined, 1, 1, 20, AlignmentType.RIGHT) ] }),
      ]
    }),
    
    new Paragraph({ text: "", spacing: { after: 600 } }),
    createParagraph("جدول استعمال الزمن", true, "000000", 24, AlignmentType.RIGHT),
    new Paragraph({ text: "", spacing: { after: 100 } }),
  ];

  // Timetable
  if (gridRows.length > 0) {
    const timetableRows: TableRow[] = [];
    timetableRows.push(new TableRow({
      children: [
        createCell("اليوم \ التوقيت", true, "FFFFFF", 1, 1, 16),
        ...gridRows.map((r: any) => createCell(r.time, true, "FFFFFF", 1, 1, 14))
      ]
    }));
    
    WEEK_DAYS.forEach((day, index) => {
      const bgColor = index % 2 === 0 ? "FFFFFF" : "FFFFFF";
      timetableRows.push(new TableRow({
        children: [
          createCell(day, true, bgColor, 1, 1, 16),
          ...gridRows.map((r: any) => createCell(r.cells[day] || '', true, bgColor, 1, 1, 14))
        ]
      }));
    });

    frontPageChildren.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        },
        rows: timetableRows
      })
    );
  }

  // Holidays
  if (holidays.length > 0) {
    frontPageChildren.push(new Paragraph({ text: "", spacing: { after: 600 } }));
    frontPageChildren.push(createParagraph("جدول العطل", true, "000000", 24, AlignmentType.RIGHT));
    frontPageChildren.push(new Paragraph({ text: "", spacing: { after: 100 } }));
    
    const holidayRows: TableRow[] = [];
    holidayRows.push(new TableRow({
      children: [
        createCell("العطلة", true, "FFFFFF", 1, 1, 18),
        createCell("من", true, "FFFFFF", 1, 1, 18),
        createCell("إلى", true, "FFFFFF", 1, 1, 18),
      ]
    }));
    holidays.forEach((h: any, index) => {
      const bgColor = index % 2 === 0 ? "FFFFFF" : "FFFFFF";
      holidayRows.push(new TableRow({
        children: [
          createCell(h.label, true, bgColor, 1, 1, 16),
          createCell(h.startDate || h.start || '', false, bgColor, 1, 1, 16),
          createCell(h.endDate || h.end || '', false, bgColor, 1, 1, 16),
        ]
      }));
    });
    
    frontPageChildren.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 80, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.RIGHT,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        },
        rows: holidayRows
      })
    );
  }



  const teacherStampData = config.teacherStamp?.startsWith("data:image/")
    ? await imageDataUrlToPng(config.teacherStamp)
    : await svgToPngData(buildTeacherStampSvg(config), 420, 420);

  const teacherStampRun = () => new ImageRun({
    type: "png",
    data: teacherStampData,
    transformation: { width: 82, height: 82 }
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { rightToLeft: true, font: "Tajawal" },
          paragraph: {  alignment: AlignmentType.RIGHT }
        }
      }
    },
    sections: [
      {
        // First Section: Front Page (Portrait or Landscape, let's keep Landscape to be consistent)
        properties: {
          page: {
            size: {
            width: orientation === 'landscape' ? 16838 : 11906,
            height: orientation === 'landscape' ? 11906 : 16838,
            orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
          },
            margin: { top: 720, bottom: 900, right: 720, left: 720 }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  teacherStampRun(),
                  new TextRun({ text: "   الصفحة ", font: "Arial", rightToLeft: true }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Arial" }),
                  new TextRun({ text: " من ", font: "Arial", rightToLeft: true }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial" })
                ]
              })
            ]
          })
        },
        children: [
          ...frontPageChildren
        ]
      },
      {
        // Second Section: Main Logbook Entries
        properties: {
          page: {
            size: {
            width: orientation === 'landscape' ? 16838 : 11906,
            height: orientation === 'landscape' ? 11906 : 16838,
            orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
          },
            margin: { top: 720, bottom: 900, right: 720, left: 720 }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  teacherStampRun(),
                  new TextRun({ text: "   الصفحة ", font: "Arial", rightToLeft: true }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Arial" }),
                  new TextRun({ text: " من ", font: "Arial", rightToLeft: true }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial" })
                ]
              })
            ]
          })
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                visuallyRightToLeft: true,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                rows: [
                  new TableRow({
                    children: [
                      createCell(`الجمهورية الجزائرية الديمقراطية الشعبية\nوزارة التربية الوطنية`, true, undefined, 1, 1, 18, AlignmentType.RIGHT),
                      createCell(`الدفتر اليومي - الأستاذ(ة): ${config.teacherName}`, true, undefined, 1, 1, 28, AlignmentType.CENTER),
                      createCell(`الموسم: ${config.schoolYear}\nالمتوسطة: ${config.schoolName}`, true, undefined, 1, 1, 18, AlignmentType.LEFT),
                    ]
                  })
                ]
              }),
              new Paragraph({ text: "", spacing: { after: 200 } }),
            ]
          })
        },
        children: [
          new Table({
            visuallyRightToLeft: true,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
            },
            rows: rows
          }),
          new Paragraph({ text: "", spacing: { after: 400 } }),
          new Table({
            visuallyRightToLeft: true,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  createCell("إمضاء الأستاذ(ة):", true, undefined, 1, 1, 22, AlignmentType.RIGHT),
                  createCell("إمضاء المدير(ة):", true, undefined, 1, 1, 22, AlignmentType.CENTER),
                  createCell("إمضاء المفتش(ة):", true, undefined, 1, 1, 22, AlignmentType.LEFT),
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  return Packer.toBlob(doc);
};



const preparePageForExport = (source: HTMLElement): { page: HTMLElement; cleanup: () => void } => {
  const page = source.cloneNode(true) as HTMLElement;
  page.classList.add("export-clean-page");
  page.style.boxShadow = "none";
  page.style.borderRadius = "0";
  page.style.margin = "0";
  page.style.transform = "none";
  page.style.backgroundColor = "#ffffff";
  page.style.setProperty("-webkit-print-color-adjust", "exact");
  page.style.setProperty("print-color-adjust", "exact");

  page.querySelectorAll<HTMLElement>(".grid-paper-bg, .writing-grid-cell, .logbook-grid-cell").forEach((cell) => {
    cell.style.backgroundImage = "none";
    cell.style.backgroundColor = "#ffffff";
  });

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.width = source.getBoundingClientRect().width + "px";
  host.style.height = source.getBoundingClientRect().height + "px";
  host.style.overflow = "hidden";
  host.style.background = "#ffffff";
  host.style.zIndex = "-1";
  host.setAttribute("aria-hidden", "true");
  host.appendChild(page);
  document.body.appendChild(host);

  return {
    page,
    cleanup: () => host.remove(),
  };
};

/**
 * Creates a DOCX whose pages are exact raster captures of the on-screen
 * print preview. This intentionally preserves the visual layout, colors,
 * borders, RTL placement and stamp exactly as the preview shows them.
 */
export const generatePreviewMatchDocx = async (
  pageElements: HTMLElement[],
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<Blob> => {
  if (!pageElements.length) throw new Error("لا توجد صفحات للمعاينة");

  if (document.fonts?.ready) await document.fonts.ready;

  const pageWidthPx = orientation === 'landscape' ? 1123 : 794;
  const pageHeightPx = orientation === 'landscape' ? 794 : 1123;
  const pageImages: Uint8Array[] = [];

  for (const element of pageElements) {
    const prepared = preparePageForExport(element);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await safeHtml2Canvas(prepared.page, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        width: prepared.page.scrollWidth,
        height: prepared.page.scrollHeight,
        windowWidth: Math.max(document.documentElement.clientWidth, prepared.page.scrollWidth),
        windowHeight: Math.max(document.documentElement.clientHeight, prepared.page.scrollHeight),
      });
      const data = canvas.toDataURL("image/png");
      pageImages.push(base64ToUint8Array(data.split(",")[1]));
    } finally {
      prepared.cleanup();
    }
  }

  const doc = new Document({
    sections: pageImages.map((data, index) => ({
      properties: {
        page: {
          size: {
            width: orientation === 'landscape' ? 16838 : 11906,
            height: orientation === 'landscape' ? 11906 : 16838,
            orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0, line: 240 },
          children: [
            new ImageRun({
              type: "png",
              data,
              transformation: { width: pageWidthPx, height: pageHeightPx },
            }),
          ],
        }),
      ],
    })),
  });

  return Packer.toBlob(doc);
};

export const generateTimetableDocx = async (
  gridRows: any[] = [],
  config: MemoConfig,
  assignedLevels: string[] = [],
  assignedSections: string[] = []
): Promise<Blob> => {
  const children: any[] = [
    // Official Algerian Header
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      rows: [
        new TableRow({
          children: [
            createCell(`الجمهورية الجزائرية الديمقراطية الشعبية\nوزارة التربية الوطنية\nمديرية التربية لولاية: ${config.directorate || (config as any).wilaya || '....................'}\nالمتوسطة: ${config.schoolName || '....................'}`, true, undefined, 1, 1, 18, AlignmentType.RIGHT),
            createCell(`السنة الدراسية: ${config.schoolYear || '2026-2027'}\nالمادة: علوم الطبيعة والحياة\nالأستاذ(ة): ${config.teacherName || '....................'}\nالرتبة: ${config.teacherGrade || 'أستاذ التعليم المتوسط'}`, true, undefined, 1, 1, 18, AlignmentType.LEFT),
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 300 } }),
    createParagraph("جدول استعمال الزمن الأسبوعي الرسمي للأستاذ", true, "064E3B", 36),
    createParagraph(`الأقسام المسندة: ${assignedSections.join(' • ') || '—'} | الحجم الساعي الأسبوعي: ${gridRows.reduce((acc, r) => acc + Object.values(r.cells || {}).filter(Boolean).length, 0)} ساعة`, true, "000000", 20),
    new Paragraph({ text: "", spacing: { after: 200 } }),
  ];

  if (gridRows.length > 0) {
    const timetableRows: TableRow[] = [];
    timetableRows.push(new TableRow({
      tableHeader: true,
      children: [
        createCell("اليوم \\ التوقيت", true, "064E3B", 1, 1, 18),
        ...gridRows.map((r: any) => createCell(r.time, true, "064E3B", 1, 1, 16))
      ]
    }));

    WEEK_DAYS.forEach((day, index) => {
      const bgColor = index % 2 === 0 ? "FFFFFF" : "F9FAFB";
      timetableRows.push(new TableRow({
        children: [
          createCell(day, true, "E2E8F0", 1, 1, 18),
          ...gridRows.map((r: any) => {
            const val = r.cells[day] || '';
            let cellColor = bgColor;
            if (val) {
              if (val.includes('4م')) cellColor = "FEE2E2";
              else if (val.includes('3م')) cellColor = "FEF3C7";
              else if (val.includes('2م')) cellColor = "DBEAFE";
              else cellColor = "D1FAE5";
            }
            return createCell(val || '—', !!val, cellColor, 1, 1, 16);
          })
        ]
      }));
    });

    children.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: "064E3B" },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "064E3B" },
          left: { style: BorderStyle.SINGLE, size: 2, color: "064E3B" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "064E3B" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        },
        rows: timetableRows
      })
    );
  }

  children.push(
    new Paragraph({ text: "", spacing: { after: 500 } }),
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      rows: [
        new TableRow({
          children: [
            createCell("تأشيرة وتوقيع الأستاذ(ة)\n\n\n................................", true, undefined, 1, 1, 18, AlignmentType.CENTER),
            createCell("تأشيرة وتوقيع السيد مدير المؤسسة\n\n\n................................", true, undefined, 1, 1, 18, AlignmentType.CENTER),
            createCell("تأشيرة السيد مفتش التعليم المتوسط\n\n\n................................", true, undefined, 1, 1, 18, AlignmentType.CENTER),
          ]
        })
      ]
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: 16838,
            height: 11906,
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
};

