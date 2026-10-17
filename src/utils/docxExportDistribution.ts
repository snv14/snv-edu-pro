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
  Footer,
  PageNumber,
  ImageRun
} from "docx";
import { MemoConfig } from "../types";
import { GeneratedSession as CurriculumSession } from "./annualDistributionGenerator";

const base64ToUint8Array = (base64: string) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
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
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas غير متاح");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return base64ToUint8Array(canvas.toDataURL("image/png").split(",")[1]);
  } finally { URL.revokeObjectURL(url); }
};

const buildTeacherStampSvg = (config: MemoConfig, size = 420) => {
  const esc = (v: string) => v.replace(/[<>&"]/g, "");
  const name = esc(config.teacherName || "");
  const school = esc((config.schoolName || "").slice(0, 30));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="white"/>
    <circle cx="210" cy="210" r="170" fill="#eff6ff" fill-opacity=".55" stroke="#1d4ed8" stroke-width="7" stroke-dasharray="12 6"/>
    <circle cx="210" cy="210" r="132" fill="none" stroke="#1d4ed8" stroke-width="3"/>
    <text x="210" y="105" text-anchor="middle" font-family="Arial" font-size="25" font-weight="bold" fill="#1e40af">الجمهورية الجزائرية الديمقراطية الشعبية</text>
    <text x="210" y="150" text-anchor="middle" font-family="Arial" font-size="23" font-weight="bold" fill="#1e40af">وزارة التربية الوطنية</text>
    <text x="210" y="205" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="#1e40af">علوم الطبيعة والحياة</text>
    <text x="210" y="250" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900" fill="#1e40af">${name}</text>
    <text x="210" y="292" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#1e40af">${school}</text>
  </svg>`;
};


const createParagraph = (text: string, bold = false, color = "000000", size = 20, alignment: any = AlignmentType.CENTER) => {
  return new Paragraph({
    
    alignment: alignment,
    children: (text || "").split('\n').map((line, i, arr) => [
      new TextRun({
        text: line,
        bold: bold,
        color: color,
        rightToLeft: true,
        size: size,
        font: "Cairo"
      }),
      ...(i < arr.length - 1 ? [new TextRun({ break: 1 })] : [])
    ]).flat()
  });
};

const createCell = (text: string, bold = false, bgColor?: string, columnSpan?: number, rowSpan?: number, size = 20, alignment: any = AlignmentType.CENTER, vertical = false) => {
  return new TableCell({
    columnSpan,
    rowSpan,
    shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    textDirection: vertical ? ("tbRl" as any) : undefined,
    children: [createParagraph(text, bold, "000000", size, alignment)]
  });
};

const normalized = (value: unknown) => String(value ?? "").trim();

const isMergeableDistributionRow = (row: CurriculumSession | undefined) =>
  !!row && !row.isHoliday && !row.isExam;

const mergedSpan = (page: CurriculumSession[], index: number, field: "midan" | "maqta" | "mawrid") => {
  const current = page[index];
  if (!isMergeableDistributionRow(current)) return 1;
  const value = normalized((current as any)[field]);
  if (!value) return 1;

  let span = 1;
  for (let j = index + 1; j < page.length; j++) {
    const next = page[j];
    if (!isMergeableDistributionRow(next)) break;
    const sameHierarchy =
      field === "midan"
        ? true
        : field === "maqta"
          ? normalized(next.midan) === normalized(current.midan)
          : normalized(next.midan) === normalized(current.midan) &&
            normalized(next.maqta) === normalized(current.maqta);
    if (!sameHierarchy || normalized((next as any)[field]) !== value) break;
    span++;
  }
  return span;
};

const samePreviousMerged = (page: CurriculumSession[], index: number, field: "midan" | "maqta" | "mawrid") => {
  const current = page[index];
  const previous = page[index - 1];
  if (!isMergeableDistributionRow(current) || !isMergeableDistributionRow(previous)) return false;
  if (!normalized((current as any)[field]) || normalized((current as any)[field]) !== normalized((previous as any)[field])) return false;
  if (field === "midan") return true;
  if (field === "maqta") return normalized(current.midan) === normalized(previous.midan);
  return normalized(current.midan) === normalized(previous.midan) && normalized(current.maqta) === normalized(previous.maqta);
};

export const generateDistributionDocx = async (
  pages: CurriculumSession[][], 
  config: MemoConfig, 
  level: "1am" | "2am" | "3am" | "4am",
  orientation: 'portrait' | 'landscape'
): Promise<Blob> => {

  const levelLabel =
    level === '4am' ? 'السنة الرابعة متوسط'
      : level === '3am' ? 'السنة الثالثة متوسط'
      : level === '2am' ? 'السنة الثانية متوسط'
      : 'السنة الأولى متوسط';

  const teacherStampData = config.teacherStamp?.startsWith("data:image/")
    ? await imageDataUrlToPng(config.teacherStamp)
    : await svgToPngData(buildTeacherStampSvg(config));

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { rightToLeft: true, font: "Cairo" },
          paragraph: {  alignment: AlignmentType.RIGHT }
        }
      }
    },
    sections: pages.map((page, index) => {
      const pageItems = page;
      const uniqueFields = [...new Set(pageItems.map((item) => item.midan).filter(Boolean))];
      const uniqueSequences = [...new Set(pageItems.map((item) => item.maqta).filter(Boolean))];
      const pageTitle = uniqueFields.length === 1
        ? uniqueFields[0]
        : uniqueSequences.length === 1
          ? uniqueSequences[0]
          : '';

      const rows: TableRow[] = [];

      // Header row: exactly mirrors the on-screen table.
      if (level !== '3am' && pageTitle && level !== '4am') {
        rows.push(new TableRow({
          children: [
            createCell(`الميدان: ${pageTitle}`, true, "ECFDF5", 8, 1, 24)
          ]
        }));
      }

      rows.push(new TableRow({
        children: [
          new TableCell({ width: { size: 7, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الشهر", true, "000000", 20)] }),
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الأسابيع", true, "000000", 20)] }),
          new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: "ECFDF5", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الميدان", true, "065F46", 20)] }),
          new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: "FFFBEB", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("المقطع التعلمي", true, "92400E", 20)] }),
          new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph(level === '4am' ? "المقطع البيداغوجي" : "المورد المعرفي", true, "000000", 20)] }),
          new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الحصة الأولى", true, "000000", 20)] }),
          new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الحصة الثانية", true, "000000", 20)] }),
          new TableCell({ width: { size: 7, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("النسبة", true, "000000", 20)] }),
        ]
      }));

      // Content rows: same order, colors and repetition rules as the preview.
      page.forEach((item, rowIndex) => {
        const previous = page[rowIndex - 1];
        const sameMidan = !!previous && previous.midan === item.midan;
        const sameMaqta = sameMidan && previous.maqta === item.maqta;
        const weekDisplay = item.week ? `${item.week} (${item.dates})` : (item.dates || '—');

        if (item.isHoliday) {
          const isFull = item.session1 === 'عطلة الشتاء' || item.session1 === 'عطلة الربيع' || !item.session1 || item.session1 === item.session2;
          if (isFull) {
            rows.push(new TableRow({
              children: [
                createCell(item.month, true, "DCFCE7"),
                createCell(weekDisplay, true, "DCFCE7"),
                createCell(item.holidayLabel || item.session1 || 'عطلة', true, "DCFCE7", 5),
                createCell((item as any).percent || '', true, "DCFCE7")
              ]
            }));
          } else {
            rows.push(new TableRow({
              children: [
                createCell(item.month, false, "FFFFFF"),
                createCell(weekDisplay, false, "FFFFFF"),
                createCell(item.midan || '', true, "ECFDF5"),
                createCell(item.maqta || '', true, "FFFBEB"),
                createCell(item.mawrid || '', true, "FFFFFF"),
                createCell(item.session1 || '', false, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT),
                createCell(item.session2 || item.holidayLabel || 'عطلة', true, "DCFCE7", 1, 1, 20, AlignmentType.CENTER),
                createCell((item as any).percent || '', true, "FFFFFF")
              ]
            }));
          }
        } else if (item.isExam) {
          rows.push(new TableRow({
            children: [
              createCell(item.month, true, "FDF2F8"),
              createCell(weekDisplay, true, "FDF2F8"),
              createCell(item.session1 || item.mawrid || 'إختبارات الفصل', true, "DCFCE7", 5),
              createCell((item as any).percent || '', true, "FDF2F8")
            ]
          }));
        } else {
          const rowBg = rowIndex % 2 === 0 ? "FFFFFF" : "F0FDF4";
          rows.push(new TableRow({
            children: [
              createCell(item.month, false, rowBg),
              createCell(weekDisplay, false, rowBg),
              ...(!samePreviousMerged(page, rowIndex, "midan") ? [createCell(item.midan || '', true, "ECFDF5", undefined, mergedSpan(page, rowIndex, "midan"), 20, AlignmentType.CENTER, true)] : []),
              ...(!samePreviousMerged(page, rowIndex, "maqta") ? [createCell(item.maqta || '', true, "FFFBEB", undefined, mergedSpan(page, rowIndex, "maqta"), 20, AlignmentType.CENTER, true)] : []),
              ...(!samePreviousMerged(page, rowIndex, "mawrid") ? [createCell(item.mawrid || '', true, rowBg, undefined, mergedSpan(page, rowIndex, "mawrid"), 20, AlignmentType.CENTER, true)] : []),
              createCell(item.session1 || '', false, rowBg, 1, 1, 20, AlignmentType.RIGHT),
              createCell(item.session2 || '', false, rowBg, 1, 1, 20, AlignmentType.RIGHT),
              createCell((item as any).percent || '', true, rowBg)
            ]
          }));
        }
      });

      return {
        properties: {
          page: {
            size: {
              orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: { top: 720, bottom: 720, right: 720, left: 720 }
          }
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'الصفحة ', font: "Cairo", rightToLeft: true }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Cairo" })
              ]
            })]
          })
        },
        children: [
          // Header info
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
                  createCell(`المستوى: ${levelLabel}`, true, undefined, 1, 1, 24, AlignmentType.RIGHT),
                  createCell(`التدرج السنوي لبناء التعلمات`, true, undefined, 1, 1, 28, AlignmentType.CENTER),
                  createCell(`الأستاذ: ${config.teacherName}`, true, undefined, 1, 1, 24, AlignmentType.LEFT),
                ]
              })
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          
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
          
          // Signatures table
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
                  new TableCell({ children: [
                    createParagraph("إمضاء الأستاذ(ة):", true, "000000", 22, AlignmentType.RIGHT),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: teacherStampData, transformation: { width: 90, height: 90 } })] })
                  ] }),
                  createCell("السيد(ة) المدير(ة):", true, undefined, 1, 1, 22, AlignmentType.CENTER),
                  createCell("السيد(ة) المفتش(ة):", true, undefined, 1, 1, 22, AlignmentType.LEFT),
                ]
              })
            ]
          }),
          // Page break handled inherently by having multiple sections (one for each page)
        ]
      };
    })
  });

  return Packer.toBlob(doc);
};
