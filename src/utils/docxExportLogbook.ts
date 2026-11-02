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

  // Keep the hierarchy readable without repeating the field and segment on every row.
  if (currentMidan && (!previous || currentMidan !== previousMidan)) parts.push(`الميدان: ${currentMidan}`);
  if (currentMaqta && (currentMidan !== previousMidan || !previous || currentMaqta !== previousMaqta)) {
    parts.push(`المقطع: ${currentMaqta}`);
  }
  if (clean(log.mawrid)) parts.push(`المورد التعلمي: ${clean(log.mawrid)}`);

  const activities = Array.from(new Set([
    ...(log.activitiesList || []),
    content,
  ].map(clean).filter(Boolean)));

  if (learningOutcome && !activities.includes(learningOutcome)) {
    parts.push(`تعلم المورد: ${learningOutcome}`);
  }
  if (activities.length) parts.push(`الأنشطة: ${activities.join(' + ')}`);

  const assessment = clean(log.taqwim);
  if (assessment && !activities.includes(assessment) && assessment !== learningOutcome) {
    parts.push(`التقويم: ${assessment}`);
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
  paginatedPages?: LogEntry[][]
): Promise<Blob> => {
  // 1. استخراج الختم الرسمي كصورة PNG لإدراجه في ترويسة وتوقيعات كل صفحة
  const stampPngBytes = config.teacherStamp?.startsWith("data:image/")
    ? await imageDataUrlToPng(config.teacherStamp)
    : await svgToPngData(buildTeacherStampSvg(config, 200), 200, 200);

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
  const pageMargin = { top: 400, bottom: 400, left: 500, right: 500 };

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
    new Paragraph({ text: "", spacing: { after: 200 } }),
    createParagraph("الجمهورية الجزائرية الديمقراطية الشعبية", true, "18181B", 24),
    createParagraph("وزارة التربية الوطنية", true, "0369A1", 22),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createParagraph("الدفتر اليومي للأستاذ", true, "0369A1", 38),
    createParagraph("علوم الطبيعة والحياة — التعليم المتوسط", true, "0284C7", 24),
    createParagraph("صفحة تعريفية رسمية", false, "71717A", 18),
    new Paragraph({ text: "", spacing: { after: 250 } }),

    // بطاقة معلومات الأستاذ والإسناد التربوي
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
            createCell("المؤسسة:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(config.schoolName || '—', true, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, 25),
          ]
        }),
        new TableRow({
          children: [
            createCell("مديرية التربية:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(config.directorate || '—', true, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, 25),
            createCell("السنة الدراسية:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(config.schoolYear || '2026-2027', true, "FFFFFF", 1, 1, 20, AlignmentType.RIGHT, 25),
          ]
        }),
        new TableRow({
          children: [
            createCell("المستويات المسندة:", true, "F0F9FF", 1, 1, 20, AlignmentType.RIGHT, 25, "0369A1"),
            createCell(assignedLevels.join(' • ') || '1م', true, "FFFFFF", 3, 1, 20, AlignmentType.RIGHT, 75),
          ]
        }),
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 300 } }),
    createParagraph("وثيقة بيداغوجية لمتابعة إنجاز المنهاج وتوثيق سير الحصص والأنشطة التعلمية", false, "71717A", 16),
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
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createParagraph("الجمهورية الجزائرية الديمقراطية الشعبية", true, "18181B", 22),
    createParagraph("وزارة التربية الوطنية", true, "0369A1", 20),
    createParagraph(`مديرية التربية لولاية ${config.directorate || '—'} • متوسطة ${config.schoolName || '—'}`, true, "18181B", 18),
    new Paragraph({ text: "", spacing: { after: 150 } }),

    // شارة الغلاف
    new Table({
      visuallyRightToLeft: true,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder, insideHorizontal: noneBorder, insideVertical: noneBorder },
      rows: [
        new TableRow({
          children: [
            createCell([
              createParagraph("الدفتر اليومي للأستاذ", true, "0369A1", 32),
              createParagraph(`مرحلة التعليم المتوسط • مادة علوم الطبيعة والحياة • الموسم ${config.schoolYear || '2026-2027'}`, true, "0284C7", 18),
            ], false, "E1F0FA", 1, 1, 20, AlignmentType.CENTER, 100)
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
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
      new Paragraph({ text: "", spacing: { after: 100 } }),
      new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: skyBorder, bottom: skyBorder, left: skyBorder, right: skyBorder,
          insideHorizontal: dashedBorder, insideVertical: dashedBorder
        },
        rows: timetableRows
      }),
      new Paragraph({ text: "", spacing: { after: 200 } })
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
  // قسم مستقل لكل صفحة يطابق قالَب المعاينة الرسمي بدقة
  // ==========================================
  const contentSections = pages.map((pageRows, pageIdx) => {
    const pageChildren: any[] = [];

    // 1. الترويسة الرسمية
    pageChildren.push(
      createParagraph("الجمهورية الجزائرية الديمقراطية الشعبية", true, "18181B", 18),
      createParagraph("وزارة التربية الوطنية", true, "0369A1", 16),
      new Paragraph({ text: "", spacing: { after: 60 } })
    );

    // 2. الشارة الرسمية: الدفتر اليومي للأستاذ
    pageChildren.push(
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
      new Paragraph({ text: "", spacing: { after: 80 } })
    );

    // 3. شريط معلومات الأستاذ والمؤسسة
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
      new Paragraph({ text: "", spacing: { after: 100 } })
    );

    // 4. الجدول الرئيسي بـ 5 أعمدة
    const tableRows: TableRow[] = [];

    // رأس الجدول
    tableRows.push(
      new TableRow({
        tableHeader: true,
        children: [
          createCell("التاريخ واليوم", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 16, "0369A1"),
          createCell("التوقيت", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 15, "0369A1"),
          createCell("القسم", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 13, "0369A1"),
          createCell("المحتوى الدرس", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 41, "0369A1"),
          createCell("الملاحظات", true, "E1F0FA", 1, 1, 18, AlignmentType.CENTER, 15, "0369A1"),
        ]
      })
    );

    // صفوف الحصص لهذه الصفحة
    pageRows.forEach((log, rowIdx) => {
      const globalIdx = logs.findIndex((l) => l.id === log.id);
      const previousLog = findPreviousComparableCurriculumLog(logs, globalIdx >= 0 ? globalIdx : 0, log);
      const content = getExportLessonContent(log, previousLog);
      const rowBg = rowIdx % 2 === 0 ? "FFFFFF" : "F8FAFC";
      const timeWithArrow = (log.time || '').replace(/\s*[-–—→←➔]\s*/g, ' ➔ ').replace(/\s*➔\s*/g, ' ➔ ');

      const dateText = (log.dateStr || '').includes('/')
        ? (log.dateStr || '')
            .split('/')
            .map((dp, i) => `${((log.dayName || '').split('/')[i] || (log.dayName || '')).trim()} ${dp.trim()}`)
            .join('\n')
        : `${log.dayName || ''}\n${log.dateStr || ''}`.trim();

      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createCell(dateText, true, rowBg, 1, 1, 16, AlignmentType.CENTER, 16, "0369A1"),
            createCell(timeWithArrow, false, rowBg, 1, 1, 15, AlignmentType.CENTER, 15),
            createCell(log.section || '', true, rowBg, 1, 1, 16, AlignmentType.CENTER, 13, "0284C7"),
            createCell(content, false, rowBg, 1, 1, 16, AlignmentType.RIGHT, 41),
            createCell(log.note || '', false, rowBg, 1, 1, 15, AlignmentType.RIGHT, 15),
          ]
        })
      );
    });

    // صفوف فارغة مكملة حتى 10 صفوف لكل صفحة
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
      new Paragraph({ text: "", spacing: { after: 120 } })
    );

    // 5. جدول التواقيع الأربعة في كل صفحة
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
      new Paragraph({ text: "", spacing: { after: 80 } }),
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

