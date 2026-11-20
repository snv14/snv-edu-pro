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
  LineRuleType,
  Footer,
  PageNumber,
  ImageRun
} from "docx";
import { MemoConfig } from "../types";
import { GeneratedSession as CurriculumSession } from "./annualDistributionGenerator";
import {
  buildDocxTextRuns,
  getDocxLineSpacing,
  isHandwritingActiveFor,
  loadHandwritingSettings,
  scaleDocxFontSize,
  type HandwritingStyleSettings,
} from "../services/handwritingStyle";
import {
  buildDocxFontAttrs,
  prepareDocxFonts,
  type DocxFontAttrs,
  type PrepareDocxFontsOptions,
} from "./docxFontEmbed";

import { FALLBACK_1X1_PNG, base64ToUint8Array } from './exportDom';

const imageDataUrlToPng = async (dataUrl: string): Promise<Uint8Array> => {
  try {
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return FALLBACK_1X1_PNG;
    if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
      return FALLBACK_1X1_PNG;
    }
    const image = new Image();
    image.src = dataUrl;
    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => resolve();
      setTimeout(() => resolve(), 2500);
    });
    if (!image.naturalWidth) return FALLBACK_1X1_PNG;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || 512;
    canvas.height = image.naturalHeight || 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return FALLBACK_1X1_PNG;
    ctx.drawImage(image, 0, 0);
    return base64ToUint8Array(canvas.toDataURL("image/png").split(",")[1]);
  } catch (err) {
    console.warn("imageDataUrlToPng fallback:", err);
    return FALLBACK_1X1_PNG;
  }
};

const svgToPngData = async (svg: string, width = 420, height = 420): Promise<Uint8Array> => {
  if (!svg || !svg.trim()) return FALLBACK_1X1_PNG;
  if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    return FALLBACK_1X1_PNG;
  }
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => resolve();
      setTimeout(() => resolve(), 2500);
    });
    if (!image.naturalWidth && !image.width) return FALLBACK_1X1_PNG;
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return FALLBACK_1X1_PNG;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return base64ToUint8Array(canvas.toDataURL("image/png").split(",")[1]);
  } catch (err) {
    console.warn("svgToPngData fallback:", err);
    return FALLBACK_1X1_PNG;
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


interface DistHwContext {
  hwStyle: HandwritingStyleSettings;
  hwActive: boolean;
  wordFont: string;
  fontAttrs: DocxFontAttrs;
  lineSpacing: number;
}

const createParagraph = (
  text: string,
  bold = false,
  color = "000000",
  size = 20,
  alignment: any = AlignmentType.CENTER,
  semantic = false,
  hwContext?: DistHwContext
) => {
  const hwStyle = hwContext?.hwStyle ?? loadHandwritingSettings();
  const hwActive = hwContext?.hwActive ?? isHandwritingActiveFor("general", hwStyle);
  const wordFont = hwContext?.wordFont ?? "Playpen Sans Arabic";
  const fontAttrs = hwContext?.fontAttrs ?? buildDocxFontAttrs(wordFont);
  const scaledSize = scaleDocxFontSize(size, hwStyle, "general");
  const lineSpacing = hwContext?.lineSpacing ?? getDocxLineSpacing(hwStyle, "general");

  if (semantic && hwActive) {
    return new Paragraph({
      alignment,
      bidirectional: true,
      spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO },
      children: buildDocxTextRuns(text || "", hwStyle, {
        size,
        bold,
        defaultRole: "bodyBlack",
        fallbackColorHex: color,
        fontName: wordFont,
        area: "general",
      }),
    });
  }

  return new Paragraph({
    alignment: alignment,
    bidirectional: true,
    spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO },
    children: (text || "").split('\n').map((line, i, arr) => [
      new TextRun({
        text: line,
        bold: bold,
        boldComplexScript: bold,
        color: color,
        rightToLeft: true,
        size: scaledSize,
        sizeComplexScript: scaledSize,
        font: fontAttrs
      }),
      ...(i < arr.length - 1 ? [new TextRun({ break: 1 })] : [])
    ]).flat()
  });
};

const createCell = (
  text: string,
  bold = false,
  bgColor?: string,
  columnSpan?: number,
  rowSpan?: number,
  size = 20,
  alignment: any = AlignmentType.CENTER,
  vertical = false,
  semantic = false,
  hwContext?: DistHwContext
) => {
  return new TableCell({
    columnSpan,
    rowSpan,
    shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    textDirection: vertical ? ("tbRl" as any) : undefined,
    children: [createParagraph(text, bold, "000000", size, alignment, semantic, hwContext)]
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

export type GenerateDistributionDocxOptions = Pick<
  PrepareDocxFontsOptions,
  'allowFallback' | 'fontLoader' | 'settings'
>;

export const generateDistributionDocx = async (
  pages: CurriculumSession[][], 
  config: MemoConfig, 
  level: "1am" | "2am" | "3am" | "4am",
  orientation: 'portrait' | 'landscape',
  exportOptions?: GenerateDistributionDocxOptions
): Promise<Blob> => {

  const hwStyle = exportOptions?.settings ?? loadHandwritingSettings();
  const hwActive = isHandwritingActiveFor("general", hwStyle);
  const embeddedFonts = await prepareDocxFonts({
    settings: hwStyle,
    area: "general",
    allowFallback: exportOptions?.allowFallback,
    fontLoader: exportOptions?.fontLoader,
  });
  const wordFont = embeddedFonts.wordFont;
  const wordFontAttrs = embeddedFonts.fontAttrs;
  const lineSpacing = getDocxLineSpacing(hwStyle, "general");
  const defaultBodySize = scaleDocxFontSize(20, hwStyle, "general");
  const hwContext: DistHwContext = { hwStyle, hwActive, wordFont, fontAttrs: wordFontAttrs, lineSpacing };

  const levelLabel =
    level === '4am' ? 'السنة الرابعة متوسط'
      : level === '3am' ? 'السنة الثالثة متوسط'
      : level === '2am' ? 'السنة الثانية متوسط'
      : 'السنة الأولى متوسط';

  const teacherStampData = config.teacherStamp?.startsWith("data:image/")
    ? await imageDataUrlToPng(config.teacherStamp)
    : await svgToPngData(buildTeacherStampSvg(config));

  const doc = new Document({
    fonts: embeddedFonts.fonts,
    styles: {
      default: {
        document: {
          run: {
            rightToLeft: true,
            font: wordFontAttrs,
            size: defaultBodySize,
            sizeComplexScript: defaultBodySize,
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            spacing: { line: lineSpacing, lineRule: LineRuleType.AUTO },
          }
        }
      }
    },
    sections: pages.filter(p => p && p.length > 0).map((page, index) => {
      const pageItems = page;
      const uniqueFields = [...new Set(pageItems.map((item) => item.midan).filter(Boolean))];
      const rows: TableRow[] = [];

      // The same field banner and column structure are used for all levels.
      rows.push(new TableRow({
        children: [createCell(`الميدان: ${uniqueFields.join('  |  ') || '—'}`, true, "ECFDF5", 8, 1, 24, AlignmentType.CENTER, false, false, hwContext)]
      }));

      rows.push(new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 7, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الشهر", true, "000000", 20, AlignmentType.CENTER, false, hwContext)] }),
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("التاريخ", true, "000000", 20, AlignmentType.CENTER, false, hwContext)] }),
          new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: "ECFDF5", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الميدان", true, "065F46", 20, AlignmentType.CENTER, false, hwContext)] }),
          new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: "FFFBEB", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("المقطع التعلمي", true, "92400E", 20, AlignmentType.CENTER, false, hwContext)] }),
          new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("المورد المعرفي", true, "000000", 20, AlignmentType.CENTER, false, hwContext)] }),
          new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الحصة الأولى", true, "000000", 20, AlignmentType.CENTER, false, hwContext)] }),
          new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الحصة الثانية", true, "000000", 20, AlignmentType.CENTER, false, hwContext)] }),
          new TableCell({ width: { size: 7, type: WidthType.PERCENTAGE }, shading: { fill: "F8F8F8", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("النسبة", true, "000000", 20, AlignmentType.CENTER, false, hwContext)] }),
        ]
      }));

      // Content rows: same order, colors and repetition rules as the preview.
      page.forEach((item, rowIndex) => {
        const previous = page[rowIndex - 1];
        const sameMidan = !!previous && previous.midan === item.midan;
        const sameMaqta = sameMidan && previous.maqta === item.maqta;
        const displayWeek = item.weekInMonth ?? item.week;
        const weekDisplay = displayWeek ? `${displayWeek}${item.dates ? ` (${item.dates})` : ''}` : (item.dates || '—');

        if (item.isHoliday) {
          const isFull = item.session1 === 'عطلة الشتاء' || item.session1 === 'عطلة الربيع' || !item.session1 || item.session1 === item.session2;
          if (isFull) {
            rows.push(new TableRow({
              children: [
                createCell(item.month, true, "DCFCE7", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell(weekDisplay, true, "DCFCE7", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell(item.holidayLabel || item.session1 || 'عطلة', true, "DCFCE7", 5, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell((item as any).percent || '', true, "DCFCE7", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext)
              ]
            }));
          } else {
            rows.push(new TableRow({
              children: [
                createCell(item.month, false, "FFFFFF", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell(weekDisplay, false, "FFFFFF", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell(item.midan || '', true, "ECFDF5", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell(item.maqta || '', true, "FFFBEB", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell(item.mawrid || '', true, "FFFFFF", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell(item.session1 || '', false, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, false, false, hwContext),
                createCell(item.session2 || item.holidayLabel || 'عطلة', true, "DCFCE7", 1, 1, 20, AlignmentType.CENTER, false, false, hwContext),
                createCell((item as any).percent || '', true, "FFFFFF", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext)
              ]
            }));
          }
        } else if (item.isExam) {
          rows.push(new TableRow({
            children: [
              createCell(item.month, true, "FDF2F8", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
              createCell(weekDisplay, true, "FDF2F8", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
              createCell(item.session1 || item.mawrid || 'إختبارات الفصل', true, "DCFCE7", 5, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
              createCell((item as any).percent || '', true, "FDF2F8", undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext)
            ]
          }));
        } else {
          const rowBg = rowIndex % 2 === 0 ? "FFFFFF" : "F0FDF4";
          rows.push(new TableRow({
            children: [
              createCell(item.month, false, rowBg, undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
              createCell(weekDisplay, false, rowBg, undefined, undefined, 20, AlignmentType.CENTER, false, false, hwContext),
              ...(!samePreviousMerged(page, rowIndex, "midan") ? [createCell(item.midan || '', true, "ECFDF5", undefined, mergedSpan(page, rowIndex, "midan"), 20, AlignmentType.CENTER, true, false, hwContext)] : []),
              ...(!samePreviousMerged(page, rowIndex, "maqta") ? [createCell(item.maqta || '', true, "FFFBEB", undefined, mergedSpan(page, rowIndex, "maqta"), 20, AlignmentType.CENTER, true, false, hwContext)] : []),
              ...(!samePreviousMerged(page, rowIndex, "mawrid") ? [createCell(item.mawrid || '', true, rowBg, undefined, mergedSpan(page, rowIndex, "mawrid"), 20, AlignmentType.CENTER, true, false, hwContext)] : []),
              createCell(item.session1 || '', false, rowBg, 1, 1, 20, AlignmentType.RIGHT, false, true, hwContext),
              createCell(item.session2 || '', false, rowBg, 1, 1, 20, AlignmentType.RIGHT, false, true, hwContext),
              createCell((item as any).percent || '', true, rowBg, 1, 1, 20, AlignmentType.CENTER, false, false, hwContext)
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
                new TextRun({ text: 'الصفحة ', font: wordFontAttrs, rightToLeft: true, size: defaultBodySize, sizeComplexScript: defaultBodySize }),
                new TextRun({ children: [PageNumber.CURRENT], font: wordFontAttrs, size: defaultBodySize, sizeComplexScript: defaultBodySize })
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
                  createCell(`المستوى: ${levelLabel}`, true, undefined, 1, 1, 24, AlignmentType.RIGHT, false, false, hwContext),
                  createCell(`التدرج السنوي لبناء التعلمات`, true, undefined, 1, 1, 28, AlignmentType.CENTER, false, false, hwContext),
                  createCell(`الأستاذ: ${config.teacherName}`, true, undefined, 1, 1, 24, AlignmentType.LEFT, false, false, hwContext),
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
                    createParagraph("إمضاء الأستاذ(ة):", true, "000000", 22, AlignmentType.RIGHT, false, hwContext),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: teacherStampData, transformation: { width: 90, height: 90 } })] })
                  ] }),
                  createCell("السيد(ة) المدير(ة):", true, undefined, 1, 1, 22, AlignmentType.CENTER, false, false, hwContext),
                  createCell("السيد(ة) المفتش(ة):", true, undefined, 1, 1, 22, AlignmentType.LEFT, false, false, hwContext),
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
