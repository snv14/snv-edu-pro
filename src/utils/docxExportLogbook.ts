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
import { splitLogbookTime } from "./logbookPageTemplate";

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

const createCell = (
  text: string | Paragraph[],
  bold = false,
  bgColor?: string,
  columnSpan?: number,
  rowSpan?: number,
  size = 20,
  alignment: any = AlignmentType.CENTER,
  widthPercent?: number,
  customTextColor?: string,
  borders?: any
) => {
  const fill = bgColor === "000000" ? "064E3B" : (bgColor || "FFFFFF");
  let textColor = customTextColor;
  if (!textColor) {
    if (fill === "064E3B" || fill === "006233" || fill === "0284C7" || fill === "0369A1" || fill === "1D4ED8") {
      textColor = "FFFFFF";
    } else if (fill === "E1F0FA" || fill === "E0F2FE") {
      textColor = "0369A1";
    } else {
      textColor = "18181B";
    }
  }

  const children = Array.isArray(text)
    ? text
    : [createParagraph(text, bold, textColor, size, alignment)];

  return new TableCell({
    columnSpan,
    rowSpan,
    shading: { fill, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    borders: borders || undefined,
    children,
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

const SCIENCE_HEADER_LEFT_SVG = `<svg viewBox="0 0 130 115" width="130" height="115" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="flaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="bookBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <linearGradient id="bookCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>
  <path d="M22 45 C15 30 25 15 40 18 C38 32 30 42 22 45 Z" fill="#22c55e" opacity="0.85" />
  <path d="M42 35 C55 22 72 28 68 44 C56 46 46 42 42 35 Z" fill="#16a34a" opacity="0.75" />
  <path d="M30 60 C18 52 22 38 34 38 C36 48 34 56 30 60 Z" fill="#4ade80" opacity="0.8" />
  <path d="M12 95 L56 108 L98 96 L54 84 Z" fill="url(#bookBlue)" />
  <path d="M12 95 L12 101 L56 114 L56 108 Z" fill="#1d4ed8" />
  <path d="M56 108 L56 114 L98 102 L98 96 Z" fill="#60a5fa" />
  <path d="M16 88 L58 99 L96 89 L54 78 Z" fill="url(#bookCyan)" />
  <path d="M16 88 L16 93 L58 104 L58 99 Z" fill="#0369a1" />
  <path d="M58 99 L58 104 L96 94 L96 89 Z" fill="#93c5fd" />
  <path d="M22 81 L60 91 L94 82 L56 72 Z" fill="#1e3a8a" />
  <path d="M22 81 L22 85 L60 95 L60 91 Z" fill="#172554" />
  <path d="M60 91 L60 95 L94 86 L94 82 Z" fill="#bfdbfe" />
  <g stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round">
    <path d="M48 30 Q54 42 48 54 Q42 66 48 76" fill="none" />
    <path d="M56 30 Q50 42 56 54 Q62 66 56 76" fill="none" />
    <line x1="48" y1="34" x2="56" y2="34" stroke="#0284c7" stroke-width="2" />
    <line x1="49" y1="42" x2="55" y2="42" stroke="#22c55e" stroke-width="2" />
    <line x1="48" y1="50" x2="56" y2="50" stroke="#0284c7" stroke-width="2" />
    <line x1="47" y1="58" x2="57" y2="58" stroke="#22c55e" stroke-width="2" />
    <line x1="49" y1="66" x2="55" y2="66" stroke="#0284c7" stroke-width="2" />
    <line x1="48" y1="74" x2="56" y2="74" stroke="#22c55e" stroke-width="2" />
  </g>
  <path d="M92 48 L100 48 L100 58 L114 86 C116 90 112 94 106 94 L86 94 C80 94 76 90 78 86 L92 58 Z" fill="#f0f9ff" stroke="#0284c7" stroke-width="2.2" stroke-linejoin="round" />
  <path d="M82 82 L110 82 L113 88 C114 91 111 93 106 93 L86 93 C81 93 78 91 79 88 Z" fill="url(#flaskGrad)" />
  <path d="M96 50 Q96 38 98 28" stroke="#16a34a" stroke-width="2" fill="none" stroke-linecap="round" />
  <path d="M98 28 C92 24 92 16 102 18 C102 24 99 27 98 28 Z" fill="#22c55e" />
  <path d="M97 34 C104 32 108 38 102 42 C99 40 98 36 97 34 Z" fill="#4ade80" />
  <circle cx="94" cy="74" r="2" fill="#bae6fd" />
  <circle cx="102" cy="78" r="2.5" fill="#bae6fd" />
  <circle cx="97" cy="84" r="1.5" fill="#bae6fd" />
</svg>`;

const SCIENCE_HEADER_RIGHT_SVG = `<svg viewBox="0 0 130 115" width="130" height="115" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="microscopeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
  </defs>
  <path d="M108 42 C118 28 108 14 94 16 C95 30 102 40 108 42 Z" fill="#22c55e" opacity="0.85" />
  <path d="M88 32 C76 20 60 25 63 40 C75 42 84 38 88 32 Z" fill="#16a34a" opacity="0.75" />
  <path d="M102 58 C112 50 110 36 98 36 C95 45 98 54 102 58 Z" fill="#4ade80" opacity="0.8" />
  <path d="M115 72 C125 65 120 52 110 54 C108 62 111 69 115 72 Z" fill="#22c55e" opacity="0.7" />
  <path d="M68 96 C68 88 88 84 96 84 C104 84 124 88 124 96 L68 96 Z" fill="#1e3a8a" />
  <rect x="74" y="94" width="44" height="4" rx="2" fill="#0284c7" />
  <path d="M110 86 Q122 62 108 44 Q98 32 86 38" stroke="url(#microscopeGrad)" stroke-width="6.5" stroke-linecap="round" fill="none" />
  <rect x="76" y="66" width="28" height="4.5" rx="1.5" fill="#1e293b" />
  <rect x="84" y="64" width="12" height="2" fill="#38bdf8" />
  <g transform="rotate(24 82 42)">
    <rect x="76" y="14" width="10" height="12" rx="2" fill="#0284c7" />
    <rect x="74" y="11" width="14" height="3" rx="1" fill="#1e3a8a" />
    <rect x="78" y="26" width="6.5" height="24" fill="#1d4ed8" />
    <ellipse cx="81" cy="52" rx="7" ry="3.5" fill="#0f172a" />
    <rect x="76" y="55" width="4" height="9" fill="#0284c7" />
    <rect x="83" y="55" width="3.5" height="7" fill="#38bdf8" />
  </g>
  <circle cx="110" cy="62" r="5" fill="#38bdf8" stroke="#1d4ed8" stroke-width="2" />
  <g stroke="#0284c7" stroke-width="1.5" fill="none" opacity="0.85">
    <ellipse cx="36" cy="80" rx="22" ry="7" />
    <ellipse cx="36" cy="80" rx="22" ry="7" transform="rotate(60 36 80)" />
    <ellipse cx="36" cy="80" rx="22" ry="7" transform="rotate(120 36 80)" />
    <circle cx="36" cy="80" r="3.5" fill="#0284c7" />
  </g>
</svg>`;

const CORNER_LEAVES_SVG = `<svg viewBox="0 0 65 65" width="65" height="65" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 54 C10 38 24 24 40 26 C41 42 27 54 12 54 Z" fill="#0284c7" />
  <path d="M26 56 C26 44 38 34 50 36 C50 48 38 58 26 56 Z" fill="#0369a1" />
  <path d="M10 40 C6 26 18 14 30 16 C30 28 20 38 10 40 Z" fill="#38bdf8" />
  <path d="M4 26 C4 16 14 8 22 10 C22 18 14 26 4 26 Z" fill="#0284c7" opacity="0.85" />
  <circle cx="14" cy="52" r="2.5" fill="#0369a1" />
</svg>`;

const getExportLessonContent = (log: LogEntry, previous?: LogEntry): string => {
  const clean = (value?: string) => String(value || '').trim();
  const content = clean(log.manualContent || log.content);
  const learningOutcome = clean(log.ta3alom);
  if (clean(log.manualContent)) return clean(log.manualContent);
  if (log.lessonType && log.lessonType !== 'curriculum') return content || learningOutcome;

  const parts: string[] = [];
  const currentMidan = clean(log.midan);
  const previousMidan = clean(previous?.midan);
  const currentMaqta = clean(log.maqta);
  const previousMaqta = clean(previous?.maqta);
  const currentMawrid = clean(log.mawrid);
  const currentTa3alom = clean(log.ta3alom);

  const isNewMidan = !!currentMidan && (!previous || !previousMidan || previousMidan !== currentMidan);
  const isNewMaqta = !!currentMaqta && (isNewMidan || !previous || !previousMaqta || previousMaqta !== currentMaqta);

  if (isNewMidan) parts.push(`<u>الميدان:</u> ${currentMidan}`);
  if (isNewMaqta) parts.push(`<u>المقطع:</u> ${currentMaqta}`);
  if (currentMawrid) parts.push(`<u>المورد التعلمي:</u> ${currentMawrid}`);
  if (currentTa3alom) parts.push(`<u>تعلم المورد:</u> ${currentTa3alom}`);
  if (log.moshkila) parts.push(`<u>المشكلة المطروحة:</u> ${clean(log.moshkila)}`);

  const activities = Array.from(new Set([
    ...(log.activitiesList || []),
    content,
  ].map(clean).filter(Boolean)));

  if (activities.length) parts.push(`<u>الأنشطة:</u> ${activities.join(' + ')}`);

  const assessment = clean(log.taqwim);
  if (assessment && !activities.includes(assessment) && assessment !== learningOutcome) {
    parts.push(`<u>التقويم:</u> ${assessment}`);
  }

  return parts.join('\n') || content || learningOutcome || clean(log.mawrid);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = typeof atob === 'function'
    ? atob(base64)
    : typeof window !== 'undefined' && typeof window.atob === 'function'
    ? window.atob(base64)
    : typeof Buffer !== 'undefined'
    ? Buffer.from(base64, 'base64').toString('binary')
    : '';
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const FALLBACK_1X1_PNG = base64ToUint8Array("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

const imageDataUrlToPng = async (dataUrl: string): Promise<Uint8Array> => {
  try {
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return FALLBACK_1X1_PNG;
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

const buildTeacherStampSvg = (config: MemoConfig, size = 420): string => {
  const name = (config.teacherName || "").replace(/[<>&"]/g, "");
  const school = (config.schoolName || "").slice(0, 30).replace(/[<>&"]/g, "");
  const grade = (config.teacherGrade || "أستاذ التعليم المتوسط").replace("للتعليم المتوسط", "").trim().replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="white"/>
    <circle cx="210" cy="210" r="185" fill="#eff6ff" fill-opacity=".7" stroke="#1d4ed8" stroke-width="7" stroke-dasharray="14 6"/>
    <circle cx="210" cy="210" r="148" fill="none" stroke="#1d4ed8" stroke-width="3"/>
    <text x="210" y="85" text-anchor="middle" font-family="Arial, Tahoma, sans-serif" font-size="21" font-weight="900" fill="#1e40af">الجمهورية الجزائرية الديمقراطية الشعبية</text>
    <text x="210" y="125" text-anchor="middle" font-family="Arial, Tahoma, sans-serif" font-size="19" font-weight="bold" fill="#0369a1">★ وزارة التربية الوطنية ★</text>
    <text x="210" y="170" text-anchor="middle" font-family="Arial, Tahoma, sans-serif" font-size="20" font-weight="bold" fill="#0284c7">علوم الطبيعة والحياة</text>
    <line x1="80" y1="185" x2="340" y2="185" stroke="#1d4ed8" stroke-width="1.5" stroke-dasharray="4 2"/>
    <text x="210" y="235" text-anchor="middle" font-family="Arial, Tahoma, sans-serif" font-size="28" font-weight="900" fill="#1e3a8a">${name}</text>
    <text x="210" y="275" text-anchor="middle" font-family="Arial, Tahoma, sans-serif" font-size="20" font-weight="bold" fill="#1d4ed8">${grade}</text>
    <text x="210" y="315" text-anchor="middle" font-family="Arial, Tahoma, sans-serif" font-size="18" font-weight="bold" fill="#475569">${school}</text>
    <text x="210" y="350" text-anchor="middle" font-family="Arial, Tahoma, sans-serif" font-size="15" fill="#64748b">تأشيرة الأستاذ(ة) وختمه الرقمي</text>
  </svg>`;
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
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return FALLBACK_1X1_PNG;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return base64ToUint8Array(canvas.toDataURL("image/png").split(",")[1]);
  } catch (err) {
    console.warn("svgToPngData fallback:", err);
    return FALLBACK_1X1_PNG;
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
  orientation: 'portrait' | 'landscape' = 'portrait',
  paginatedPages?: LogEntry[][],
  pageTemplate: 'standard' | 'teal' = 'standard'
): Promise<Blob> => {
  // 1. استخراج الختم الرسمي وكافة الرسومات البيداغوجية والزخارف كصور PNG عالية الدقة
  const [stampPngBytes, scienceLeftPngBytes, scienceRightPngBytes, cornerLeavesPngBytes] = await Promise.all([
    config.teacherStamp?.startsWith("data:image/")
      ? imageDataUrlToPng(config.teacherStamp)
      : svgToPngData(buildTeacherStampSvg(config, 220), 220, 220),
    svgToPngData(SCIENCE_HEADER_LEFT_SVG, 130, 115),
    svgToPngData(SCIENCE_HEADER_RIGHT_SVG, 130, 115),
    svgToPngData(CORNER_LEAVES_SVG, 65, 65),
  ]);

  // 2. تحديد صفحات الدفتر: إما من paginatedPages أو بتقسيم الحصص بمعدل 10 أسطر
  const pages: LogEntry[][] = paginatedPages && paginatedPages.length > 0
    ? paginatedPages
    : (() => {
        const chunks: LogEntry[][] = [];
        for (let i = 0; i < logs.length; i += 10) {
          chunks.push(logs.slice(i, i + 10));
        }
        return chunks.length > 0 ? chunks : [[]];
      })();

  const totalPages = pages.length;

  // أبعاد الصفحة بوحدات twips (1 مم ≈ 56.7 twips)
  const pageWidthTwips = orientation === 'landscape' ? 16838 : 11906;
  const pageHeightTwips = orientation === 'landscape' ? 11906 : 16838;
  const pageMargin = { top: 380, bottom: 380, left: 450, right: 450 };

  const skyBorder = { style: BorderStyle.SINGLE, size: 2, color: "0284C7" };
  const dashedBorder = { style: BorderStyle.DASHED, size: 1, color: "7DD3FC" };
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  // ==========================================
  // الصفحة 1: الصفحة التعريفية (Introductory Page)
  // ==========================================
  const introChildren: any[] = [
    // شريط العلم الوطني الجزائري
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder, insideHorizontal: noneBorder, insideVertical: noneBorder },
      rows: [
        new TableRow({
          children: [
            createCell("", false, "006233", 1, 1, 10, AlignmentType.CENTER, 50),
            createCell("", false, "D21034", 1, 1, 10, AlignmentType.CENTER, 50),
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 180 } }),
    createParagraph("الجمهورية الجزائرية الديمقراطية الشعبية", true, "18181B", 24),
    createParagraph("وزارة التربية الوطنية", true, "0369A1", 22),
    createParagraph("◆", true, "0284C7", 18),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createParagraph("الدفتر اليومي للأستاذ", true, "0369A1", 38),
    createParagraph("علوم الطبيعة والحياة — مرحلة التعليم المتوسط", true, "0284C7", 24),
    createParagraph("وثيقة بيداغوجية رسمية معتمدة", false, "71717A", 18),
    new Paragraph({ text: "", spacing: { after: 220 } }),

    // بطاقة معلومات الأستاذ والإسناد التربوي باللون السماوي الرسمي
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder,
        insideHorizontal: dashedBorder, insideVertical: dashedBorder
      },
      rows: [
        new TableRow({
          children: [
            createCell("الأستاذ(ة):", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(config.teacherName || '—', true, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, 25),
            createCell("المؤسسة التعليمية:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(config.schoolName || '—', true, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, 25),
          ]
        }),
        new TableRow({
          children: [
            createCell("مديرية التربية لولاية:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(config.directorate || '—', true, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, 25),
            createCell("السنة الدراسية:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(config.schoolYear || '2026-2027', true, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, 25),
          ]
        }),
        new TableRow({
          children: [
            createCell("المستويات المسندة:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(assignedLevels.join(' • ') || '1م', true, "FFFFFF", 3, 1, 20, AlignmentType.RIGHT, 75, "0284C7"),
          ]
        }),
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 240 } }),
    createParagraph("وثيقة لمتابعة وتوثيق سير الحصص اليومية والأنشطة التعلمية وفق التدرج السنوي الرسمي", false, "71717A", 16),
  ];

  // ==========================================
  // الصفحة 2: الغلاف واستعمال الزمن الرسمي
  // ==========================================
  const coverChildren: any[] = [
    // شريط العلم الوطني
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder, insideHorizontal: noneBorder, insideVertical: noneBorder },
      rows: [
        new TableRow({
          children: [
            createCell("", false, "006233", 1, 1, 10, AlignmentType.CENTER, 50),
            createCell("", false, "D21034", 1, 1, 10, AlignmentType.CENTER, 50),
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createParagraph("الجمهورية الجزائرية الديمقراطية الشعبية", true, "18181B", 22),
    createParagraph("وزارة التربية الوطنية", true, "0369A1", 20),
    createParagraph(`مديرية التربية لولاية ${config.directorate || '—'} • متوسطة ${config.schoolName || '—'}`, true, "18181B", 18),
    new Paragraph({ text: "", spacing: { after: 140 } }),

    // شارة الغلاف الرسمية
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder, insideHorizontal: noneBorder, insideVertical: noneBorder },
      rows: [
        new TableRow({
          children: [
            createCell([
              createParagraph("الدفتر اليومي للأستاذ", true, "0369A1", 32),
              createParagraph(`مرحلة التعليم المتوسط • مادة علوم الطبيعة والحياة • الموسم الدراسي ${config.schoolYear || '2026-2027'}`, true, "0284C7", 18),
            ], false, "E1F0FA", 1, 1, 20, AlignmentType.CENTER, 100)
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 160 } }),
  ];

  // جدول استعمال الزمن في صفحة الغلاف
  if (gridRows.length > 0) {
    const timetableRows: TableRow[] = [];
    timetableRows.push(new TableRow({
      tableHeader: true,
      children: [
        createCell("اليوم \\ التوقيت", true, "E1F0FA", 1, 1, 17, AlignmentType.CENTER, 15, "0369A1"),
        ...gridRows.map((r: any) => createCell(r.time, true, "E1F0FA", 1, 1, 15, AlignmentType.CENTER, undefined, "0369A1"))
      ]
    }));

    const WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    WEEK_DAYS.forEach((day, index) => {
      const bgColor = index % 2 === 0 ? "FFFFFF" : "F8FAFC";
      timetableRows.push(new TableRow({
        children: [
          createCell(day, true, "F0F9FF", 1, 1, 17, AlignmentType.CENTER, 15, "0369A1"),
          ...gridRows.map((r: any) => {
            const val = r.cells[day] || '';
            let cellBg = bgColor;
            if (val) {
              if (val.includes('4م')) cellBg = "FEE2E2";
              else if (val.includes('3م')) cellBg = "FEF3C7";
              else if (val.includes('2م')) cellBg = "DBEAFE";
              else cellBg = "E0F2FE";
            }
            return createCell(val || '—', !!val, cellBg, 1, 1, 16, AlignmentType.CENTER);
          })
        ]
      }));
    });

    coverChildren.push(
      createParagraph("جدول استعمال الزمن الأسبوعي الرسمي للأستاذ", true, "0369A1", 20, AlignmentType.RIGHT),
      new Paragraph({ text: "", spacing: { after: 80 } }),
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder,
          insideHorizontal: dashedBorder, insideVertical: dashedBorder
        },
        rows: timetableRows
      }),
      new Paragraph({ text: "", spacing: { after: 160 } })
    );
  }

  // التوقيعات الأربعة في صفحة الغلاف
  coverChildren.push(
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder,
        insideHorizontal: dashedBorder, insideVertical: dashedBorder
      },
      rows: [
        new TableRow({
          children: [
            createCell("توقيع الأستاذ(ة)\n\n\n....................", true, "F8FAFC", 1, 1, 16, AlignmentType.CENTER, 25),
            createCell([
              createParagraph("ختم الأستاذ(ة)", true, "18181B", 16),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    type: "png",
                    data: stampPngBytes,
                    transformation: { width: 50, height: 50 },
                  }),
                ],
              }),
            ], false, "F8FAFC", 1, 1, 16, AlignmentType.CENTER, 25),
            createCell("تأشيرة مدير المؤسسة\n\n\n....................", true, "F8FAFC", 1, 1, 16, AlignmentType.CENTER, 25),
            createCell("تأشيرة مفتش المادة\n\n\n....................", true, "F8FAFC", 1, 1, 16, AlignmentType.CENTER, 25),
          ]
        })
      ]
    })
  );

  // ==========================================
  // صفحات الدفتر اليومي (Content Pages)
  // قسم مستقل لكل صفحة يطابق قالَب المعاينة الرسمي بدقة طبق الأصل
  // ==========================================
  const contentSections = pages.map((pageRows, pageIdx) => {
    const pageChildren: any[] = [];
    if (pageTemplate === 'teal') {
      const border = { style: BorderStyle.SINGLE, size: 4, color: "8AC1C5" };
      const cells = [13, 6, 6, 9, 45, 21];
      const header = new TableRow({ tableHeader: true, children: [
        createCell('التاريخ\nمن   إلى', true, 'DEEFF1', 1, 1, 18, AlignmentType.CENTER, cells[0]),
        createCell('الوقت\nمن', true, 'DEEFF1', 1, 1, 18, AlignmentType.CENTER, cells[1]),
        createCell('الوقت\nإلى', true, 'DEEFF1', 1, 1, 18, AlignmentType.CENTER, cells[2]),
        createCell('القسم', true, 'DEEFF1', 1, 1, 18, AlignmentType.CENTER, cells[3]),
        createCell('سير الحصة و الأنشطة', true, 'DEEFF1', 1, 1, 18, AlignmentType.CENTER, cells[4]),
        createCell('ملاحظات', true, 'DEEFF1', 1, 1, 18, AlignmentType.CENTER, cells[5]),
      ] });
      const body = pageRows.map(log => {
        const previous = findPreviousComparableCurriculumLog(logs, logs.findIndex(item => item.id === log.id), log);
        const [from, to] = splitLogbookTime(log.time);
        return new TableRow({ cantSplit: true, children: [
          createCell(`${log.dayName || ''}\n${log.dateStr || ''}`.trim(), false, 'FFFFFF', 1, 1, 16, AlignmentType.CENTER, cells[0]),
          createCell(from, false, 'FFFFFF', 1, 1, 16, AlignmentType.CENTER, cells[1]),
          createCell(to, false, 'FFFFFF', 1, 1, 16, AlignmentType.CENTER, cells[2]),
          createCell(log.section || '', true, 'FFFFFF', 1, 1, 16, AlignmentType.CENTER, cells[3]),
          createCell(getExportLessonContent(log, previous), false, 'FFFFFF', 1, 1, 16, AlignmentType.RIGHT, cells[4]),
          createCell(log.note || '', false, 'FFFFFF', 1, 1, 16, AlignmentType.RIGHT, cells[5]),
        ] });
      });
      return {
        properties: { page: { size: { width: pageWidthTwips, height: pageHeightTwips, orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin: pageMargin } },
        children: [
          createParagraph('التاريخ: ........................                         الموافق لـ: ........................', true, '255960', 20),
          new Table({ visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: dashedBorder, insideVertical: border }, rows: [header, ...body] }),
          new Paragraph({ text: '', spacing: { after: 240 } }),
          createParagraph('المدير(ة)                               الأستاذ(ة)                               المفتش(ة)', true, '000000', 20),
        ],
      };
    }

    // 1. الترويسة العلوية الرسمية متضمنة الرسومات البيداغوجية والشعارات العلمية
    pageChildren.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder,
          insideHorizontal: noneBorder, insideVertical: noneBorder
        },
        rows: [
          new TableRow({
            children: [
              // رسم المجهر والذرة والشتلات على اليمين (Science Header Right)
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: scienceRightPngBytes,
                        transformation: { width: 75, height: 65 },
                      }),
                    ],
                  }),
                ],
              }),
              // العنوان المركزي والشارة الرسمية المزدوجة
              new TableCell({
                width: { size: 64, type: WidthType.PERCENTAGE },
                borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  createParagraph("الجمهورية الجزائرية الديمقراطية الشعبية", true, "18181B", 18),
                  createParagraph("وزارة التربية الوطنية", true, "0369A1", 16),
                  createParagraph("◆", true, "0284C7", 13),
                  new Table({
                    visuallyRightToLeft: true,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                      top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder,
                      insideHorizontal: noneBorder, insideVertical: noneBorder
                    },
                    rows: [
                      new TableRow({
                        children: [
                          createCell([
                            createParagraph("الدفتر اليومي للأستاذ", true, "0369A1", 24),
                            createParagraph("التعليم المتوسط - علوم الطبيعة والحياة", true, "0284C7", 15),
                          ], false, "E1F0FA", 1, 1, 20, AlignmentType.CENTER, 100)
                        ]
                      })
                    ]
                  }),
                ],
              }),
              // رسم الكتب والـ DNA والأنبوب والشتلة على اليسار (Science Header Left)
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: scienceLeftPngBytes,
                        transformation: { width: 75, height: 65 },
                      }),
                    ],
                  }),
                ],
              }),
            ]
          })
        ]
      }),
      new Paragraph({ text: "", spacing: { after: 60 } })
    );

    // 2. شريط معلومات الأستاذ والمؤسسة باللون السماوي الهادئ
    pageChildren.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          insideHorizontal: noneBorder, insideVertical: noneBorder
        },
        rows: [
          new TableRow({
            children: [
              createCell(
                `الأستاذ(ة): ${config.teacherName || '—'}   |   المتوسطة: ${config.schoolName || '—'}   |   مديرية التربية: ${config.directorate || '—'}   |   الموسم: ${config.schoolYear || '2026-2027'}   |   المستويات: ${assignedLevels.join('، ') || '1م'}`,
                true,
                "F0F9FF",
                1,
                1,
                14,
                AlignmentType.CENTER,
                100,
                "0369A1"
              )
            ]
          })
        ]
      }),
      new Paragraph({ text: "", spacing: { after: 90 } })
    );

    // 3. الجدول الرئيسي بـ 5 أعمدة مع الرموز والأيقونات
    const tableRows: TableRow[] = [];

    // رأس الجدول مع الأيقونات الرسمية
    tableRows.push(
      new TableRow({
        tableHeader: true,
        children: [
          createCell("📅 التاريخ واليوم", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 16, "0369A1"),
          createCell("⏰ التوقيت", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 15, "0369A1"),
          createCell("👥 القسم", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 13, "0369A1"),
          createCell("📖 المحتوى الدرس", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 41, "0369A1"),
          createCell("📝 الملاحظات", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 15, "0369A1"),
        ]
      })
    );

    // صفوف الحصص لهذه الصفحة
    pageRows.forEach((log, rowIdx) => {
      const globalIdx = logs.findIndex((l) => l.id === log.id);
      const previousLog = findPreviousComparableCurriculumLog(logs, globalIdx >= 0 ? globalIdx : 0, log);
      let content = getExportLessonContent(log, previousLog);
      if (log.note && log.note.includes('مخبري')) {
        content = `<u>عمل مخبري (أفواج):</u>\n${content}`;
      }

      const rowBg = rowIdx % 2 === 0 ? "FFFFFF" : "F8FAFC";
      const timeWithArrow = (log.time || '').replace(/\s*[-–—→←➔]\s*/g, ' ➔ ').replace(/\s*➔\s*/g, ' ➔ ');

      const dateText = (log.dateStr || '').includes('/')
        ? (log.dateStr || '')
            .split('/')
            .map((dp, i) => `${((log.dayName || '').split('/')[i] || (log.dayName || '')).trim()}\n${dp.trim()}`)
            .join('\n')
        : `${log.dayName || ''}\n${log.dateStr || ''}`.trim();

      // سطر فاصل عند بداية أسبوع دراسي جديد
      if (rowIdx > 0 && pageRows[rowIdx - 1]?.dateStr && log.dateStr) {
        const prevWeek = pageRows[rowIdx - 1].dateStr.slice(0, 10);
        const currWeek = log.dateStr.slice(0, 10);
        // فحص تقريبي لتغير الأسبوع إذا اختلفت التواريخ بأكثر من يومين
        const prevD = new Date(prevWeek).getTime();
        const currD = new Date(currWeek).getTime();
        if (currD - prevD > 2 * 24 * 3600 * 1000) {
          tableRows.push(
            new TableRow({
              cantSplit: true,
              children: [
                createCell(
                  `بداية أسبوع دراسي جديد`,
                  true,
                  "F0F9FF",
                  5,
                  1,
                  15,
                  AlignmentType.RIGHT,
                  100,
                  "0369A1"
                )
              ]
            })
          );
        }
      }

      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createCell(dateText, true, rowBg, 1, 1, 16, AlignmentType.CENTER, 16, "0369A1"),
            createCell(timeWithArrow, false, rowBg, 1, 1, 15, AlignmentType.CENTER, 15),
            createCell(log.section || '', true, "0284C7", 1, 1, 16, AlignmentType.CENTER, 13, "FFFFFF"),
            createCell(content, false, rowBg, 1, 1, 16, AlignmentType.RIGHT, 41),
            createCell(log.note || '', false, rowBg, 1, 1, 15, AlignmentType.RIGHT, 15),
          ]
        })
      );
    });

    // صفوف فارغة منقطة مكملة حتى 10 صفوف لكل صفحة كأوراق الدفتر المدرسي
    const emptyCount = Math.max(0, 10 - pageRows.length);
    for (let e = 0; e < emptyCount; e++) {
      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createCell("", false, "FFFFFF", 1, 1, 16, AlignmentType.CENTER, 16),
            createCell("", false, "FFFFFF", 1, 1, 16, AlignmentType.CENTER, 15),
            createCell("", false, "FFFFFF", 1, 1, 16, AlignmentType.CENTER, 13),
            createCell("", false, "FFFFFF", 1, 1, 16, AlignmentType.CENTER, 41),
            createCell("", false, "FFFFFF", 1, 1, 16, AlignmentType.CENTER, 15),
          ]
        })
      );
    }

    pageChildren.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder,
          insideHorizontal: dashedBorder, insideVertical: skyBorder
        },
        rows: tableRows
      }),
      new Paragraph({ text: "", spacing: { after: 80 } })
    );

    // 4. الزخرفة السفلية النباتية والمقسّم الجمالي
    pageChildren.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder, insideHorizontal: noneBorder, insideVertical: noneBorder },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: cornerLeavesPngBytes,
                        transformation: { width: 32, height: 32 },
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  createParagraph("―――――― ◆ ――――――", true, "0284C7", 14, AlignmentType.CENTER),
                ],
              }),
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: cornerLeavesPngBytes,
                        transformation: { width: 32, height: 32 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ text: "", spacing: { after: 60 } })
    );

    // 5. جدول التواقيع الأربعة الرسمية مدمجاً بها الختم الرقمي للأستاذ
    pageChildren.push(
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "BAE6FD" },
          insideHorizontal: dashedBorder, insideVertical: dashedBorder
        },
        rows: [
          new TableRow({
            children: [
              createCell("توقيع الأستاذ(ة)\n\n....................", true, "F8FAFC", 1, 1, 15, AlignmentType.CENTER, 25),
              createCell([
                createParagraph("ختم الأستاذ(ة)", true, "18181B", 15),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      type: "png",
                      data: stampPngBytes,
                      transformation: { width: 45, height: 45 },
                    }),
                  ],
                }),
              ], false, "F8FAFC", 1, 1, 15, AlignmentType.CENTER, 25),
              createCell("تأشيرة السيد المدير\n\n....................", true, "F8FAFC", 1, 1, 15, AlignmentType.CENTER, 25),
              createCell("تأشيرة السيد المفتش\n\n....................", true, "F8FAFC", 1, 1, 15, AlignmentType.CENTER, 25),
            ]
          })
        ]
      }),
      new Paragraph({ text: "", spacing: { after: 60 } }),
      // 6. شارة ترقيم الصفحة الوطنية
      createParagraph(`صفحة ${pageIdx + 1} من ${totalPages} — 🇩🇿`, true, "0369A1", 16)
    );

    return {
      properties: {
        page: {
          size: {
            width: pageWidthTwips,
            height: pageHeightTwips,
            orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
          margin: pageMargin,
        },
      },
      children: pageChildren,
    };
  });

  // تجميع المستند بالكامل بجميع أقسامه
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { rightToLeft: true, font: "Tajawal" },
          paragraph: { alignment: AlignmentType.RIGHT }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidthTwips,
              height: pageHeightTwips,
              orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: pageMargin,
          },
        },
        children: introChildren,
      },
      {
        properties: {
          page: {
            size: {
              width: pageWidthTwips,
              height: pageHeightTwips,
              orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: pageMargin,
          },
        },
        children: coverChildren,
      },
      ...contentSections,
    ],
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

