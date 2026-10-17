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
  PageOrientation
, Footer, PageNumber , ImageRun } from "docx";
import { LessonMemo, MemoConfig, Activity } from "../types";


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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  return base64ToUint8Array(canvas.toDataURL("image/png").split(",")[1]);
};

const svgToPngData = async (svg: string, width = 860, height = 590): Promise<Uint8Array> => {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("تعذر تحويل المخطط SVG إلى صورة"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas غير متاح");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const png = canvas.toDataURL("image/png");
    return base64ToUint8Array(png.split(",")[1]);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const buildTeacherStampSvg = (config: MemoConfig, size = 420) => {
  const name = (config.teacherName || "").replace(/[<>&"]/g, "");
  const school = (config.schoolName || "").slice(0, 30).replace(/[<>&"]/g, "");
  const grade = (config.teacherGrade || "أستاذ المادة").replace("للتعليم المتوسط", "").trim().replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="white"/>
    <circle cx="210" cy="210" r="170" fill="#eff6ff" fill-opacity=".55" stroke="#1d4ed8" stroke-width="7" stroke-dasharray="12 6"/>
    <circle cx="210" cy="210" r="132" fill="none" stroke="#1d4ed8" stroke-width="3"/>
    <text x="210" y="105" text-anchor="middle" font-family="Arial" font-size="25" font-weight="bold" fill="#1e40af">الجمهورية الجزائرية الديمقراطية الشعبية</text>
    <text x="210" y="150" text-anchor="middle" font-family="Arial" font-size="23" font-weight="bold" fill="#1e40af">وزارة التربية الوطنية</text>
    <text x="210" y="200" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="#1e40af">علوم الطبيعة والحياة</text>
    <text x="210" y="245" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900" fill="#1e40af">${name}</text>
    <text x="210" y="285" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#1e40af">${grade}</text>
    <text x="210" y="320" text-anchor="middle" font-family="Arial" font-size="17" fill="#1e40af">${school}</text>
  </svg>`;
};

const base64ToUint8Array = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const THEMES: Record<string, { hex: string, bg: string, text: string, bgSoft: string }> = {
  '1am': { hex: '0284c7', bg: 'e0f2fe', text: '0284c7', bgSoft: 'f0f9ff' },
  '2am': { hex: '7c3aed', bg: 'ede9fe', text: '7c3aed', bgSoft: 'f5f3ff' },
  '3am': { hex: 'ea580c', bg: 'ffedd5', text: 'ea580c', bgSoft: 'fff7ed' },
  '4am': { hex: 'c2185b', bg: 'fce4ec', text: 'c2185b', bgSoft: 'fff5f8' },
};

const createParagraph = (text: string, bold = false, color = "000000", size = 22, alignment: any = AlignmentType.RIGHT) => {
  return new Paragraph({
    
    alignment: alignment,
    children: text.split('\n').map((line, i, arr) => [
      new TextRun({
        text: line,
        bold: bold,
        color: color,
        rightToLeft: true,
        size: size,
        font: "Arial"
      }),
      ...(i < arr.length - 1 ? [new TextRun({ break: 1 })] : [])
    ]).flat()
  });
};

const createCell = (text: string, bold = false, color = "000000", bgColor?: string, columnSpan?: number, rowSpan?: number, size = 22, alignment: any = AlignmentType.RIGHT) => {
  return new TableCell({
    columnSpan,
    rowSpan,
    shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 150, bottom: 150, left: 150, right: 150 },
    verticalAlign: VerticalAlign.CENTER,
    children: [createParagraph(text, bold, color, size, alignment)]
  });
};

const renderTables = (tables?: { headers: string[], rows: string[][] }[]) => {
  if (!tables || tables.length === 0) return [];
  return tables.map(tbl => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" }
    },
    rows: [
      new TableRow({
        children: tbl.headers.map(h => new TableCell({
          shading: { fill: "f3f4f6", type: ShadingType.CLEAR, color: "auto" },
          children: [createParagraph(h, true, "000000", 20, AlignmentType.CENTER)]
        }))
      }),
      ...tbl.rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({
          children: [createParagraph(cell, false, "333333", 20, AlignmentType.CENTER)]
        }))
      }))
    ]
  }));
};

export const generateDocx = async (lesson: LessonMemo, config: MemoConfig, activeActivities: boolean[], isMergedFormat: boolean): Promise<Blob> => {
  const theme = THEMES[config.level];
  
  const levelLabel =
    config.level === '4am'
      ? 'السنة الرابعة متوسط'
      : config.level === '3am'
      ? 'السنة الثالثة متوسط'
      : config.level === '2am'
      ? 'السنة الثانية متوسط'
      : 'السنة الأولى متوسط';

  const teacherStampData = config.teacherStamp?.startsWith("data:image/")
    ? await imageDataUrlToPng(config.teacherStamp)
    : await svgToPngData(buildTeacherStampSvg(config), 420, 420);

  const teacherStampRun = new ImageRun({
    type: "png",
    data: teacherStampData,
    transformation: { width: 72, height: 72 }
  });

  const diagramParagraphs = lesson.diagrams && lesson.diagrams.length > 0
    ? (await Promise.all(
        lesson.diagrams.map(async (diagram) => [
          ...(diagram.title ? [createParagraph(diagram.title, true, theme.hex, 22, AlignmentType.CENTER)] : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({
              type: "png",
              data: await svgToPngData(diagram.svg || "", 860, 590),
              transformation: { width: 430, height: 295 }
            })]
          }),
          ...(diagram.description ? [createParagraph(diagram.description, false, "333333", 20)] : []),
          new Paragraph({ text: "", spacing: { after: 300 } })
        ])
      )).flat()
    : lesson.diagramSvg
      ? [
          createParagraph(lesson.diagramTitle || "المخطط", true, theme.hex, 22, AlignmentType.CENTER),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({
              type: "png",
              data: await svgToPngData(lesson.diagramSvg, 860, 590),
              transformation: { width: 430, height: 295 }
            })]
          }),
          ...(lesson.diagramDescription ? [createParagraph(lesson.diagramDescription, false, "333333", 20)] : []),
          new Paragraph({ text: "", spacing: { after: 300 } })
        ]
      : [];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { rightToLeft: true, font: "Arial" },
          paragraph: {  alignment: AlignmentType.RIGHT }
        }
      }
    },
    sections: [{
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                teacherStampRun,
                new TextRun({ text: "   الصفحة ", font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial" }),
                new TextRun({ text: " من ", font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial" })
              ]
            })
          ]
        })
      },
      properties: {
        page: {
          margin: { top: 720, bottom: 720, right: 720, left: 720 }
        }
      },
      children: [
        // 1. الترويسة العليا
        new Table({
          visuallyRightToLeft: true,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: theme.hex },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: theme.hex },
            left: { style: BorderStyle.SINGLE, size: 4, color: theme.hex },
            right: { style: BorderStyle.SINGLE, size: 4, color: theme.hex },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 3,
                  shading: { fill: theme.bgSoft, type: ShadingType.CLEAR, color: "auto" },
                  margins: { top: 150, bottom: 150, left: 150, right: 150 },
                  children: [
                    createParagraph("الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية", true, "666666", 20, AlignmentType.CENTER),
                    createParagraph(isMergedFormat ? "مذكرة بيداغوجية بنشاط الأستاذ المدمج (بدون خانة نشاط المتعلم)" : "مذكرة بيداغوجية لمادة علوم الطبيعة والحياة (النموذج المفصل)", true, theme.hex, 22, AlignmentType.CENTER),
                  ]
                })
              ]
            }),
            new TableRow({
              children: [
                createCell(`رقم المذكرة: ${config.memoNumber || ''}`, true, theme.hex, theme.bgSoft, 1, 1, 24, AlignmentType.RIGHT),
                createCell(`المستوى: ${levelLabel}`, true, theme.hex, theme.bgSoft, 1, 1, 26, AlignmentType.CENTER),
                createCell(`الأستاذ: ${config.teacherName}`, true, "000000", theme.bgSoft, 1, 1, 24, AlignmentType.LEFT),
              ]
            }),
            new TableRow({
              children: [
                createCell(`مديرية التربية: ${config.directorate}`, true, "333333", theme.bgSoft, 1, 1, 22, AlignmentType.RIGHT),
                createCell(`المتوسطة: ${config.schoolName}`, true, "333333", theme.bgSoft, 1, 1, 22, AlignmentType.CENTER),
                createCell(`الموسم: ${config.schoolYear}`, true, "333333", theme.bgSoft, 1, 1, 22, AlignmentType.LEFT),
              ]
            }),
          ]
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),
        
        // 2. الكفاءة الختامية
        ...(lesson.kafaaKhitamiya ? [
          new Table({
            visuallyRightToLeft: true,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" },
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    children: [
                      createParagraph(`الكفاءة الختامية: ${lesson.kafaaKhitamiya}`, true, "333333", 22)
                    ]
                  })
                ]
              })
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 200 } }),
        ] : []),

        // 3. شبكة بيانات المقطع والمورد والمركبة
        new Table({
          visuallyRightToLeft: true,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: theme.bg, type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الميدان", true, theme.text)] }),
                new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [createParagraph(lesson.midan, true, "000000")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("المقطع التعلمي", true, theme.hex)] }),
                new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [createParagraph(lesson.maqta, true, "333333")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: theme.bg, type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("المورد التعلمي", true, theme.text)] }),
                new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [createParagraph(lesson.mawrid, true, "000000")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("تعلم المورد", true, theme.hex)] }),
                new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [createParagraph(lesson.ta3alom, true, theme.hex, 24)] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: theme.bg, type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("مركبة الكفاءة", true, theme.text)] }),
                new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [createParagraph(lesson.markaba, true, "333333")] }),
              ]
            }),
          ]
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),

        // 4. معايير التقويم والموارد المعرفية
        new Table({
          visuallyRightToLeft: true,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 150, bottom: 150, left: 150, right: 150 },
                  children: [
                    createParagraph("معايير التقويم", true, theme.hex),
                    createParagraph(lesson.ma3ayirTaqwim || '', false, "333333")
                  ]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 150, bottom: 150, left: 150, right: 150 },
                  children: [
                    createParagraph("الموارد المعرفية والمصطلحات", true, theme.hex),
                    createParagraph(lesson.marifa, false, "333333"),
                    createParagraph(`المصطلحات: ${lesson.mostalahat}`, true, "666666", 20)
                  ]
                }),
              ]
            })
          ]
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),

        // شريط الوسائل والمراجع
        new Table({
          visuallyRightToLeft: true,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" },
                  margins: { top: 150, bottom: 150, left: 150, right: 150 },
                  children: [
                    createParagraph(`الوسائل: ${lesson.wasail}`, true, "333333")
                  ]
                }),
                new TableCell({
                  shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" },
                  margins: { top: 150, bottom: 150, left: 150, right: 150 },
                  children: [
                    createParagraph(`المراجع: ${lesson.marajie || ''}`, true, "333333")
                  ]
                }),
                new TableCell({
                  shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" },
                  margins: { top: 150, bottom: 150, left: 150, right: 150 },
                  children: [
                    createParagraph(`الزمن الكلي: ${lesson.zamanKoli || ''}`, true, "000000", 22, AlignmentType.LEFT)
                  ]
                }),
              ]
            })
          ]
        }),
        ...diagramParagraphs,
        new Paragraph({ text: "", spacing: { after: 400 } }),

        // 5. سير الحصة (جدول الأنشطة)
        new Table({
          visuallyRightToLeft: true,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
          },
          rows: [
            // Headings
            new TableRow({
              children: isMergedFormat 
                ? [
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("المراحل", true, "000000", 22, AlignmentType.CENTER)] }),
                    new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("نشاط الأستاذ (المهام وسيرورة بناء التعلمات)", true, "000000", 22, AlignmentType.CENTER)] }),
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الزمن", true, "000000", 22, AlignmentType.CENTER)] }),
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("ملاحظة", true, "000000", 22, AlignmentType.CENTER)] }),
                  ]
                : [
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("المراحل", true, "000000", 22, AlignmentType.CENTER)] }),
                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("نشاط الأستاذ", true, "000000", 22, AlignmentType.CENTER)] }),
                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("نشاط المتعلم", true, "000000", 22, AlignmentType.CENTER)] }),
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("الزمن", true, "000000", 22, AlignmentType.CENTER)] }),
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("ملاحظة", true, "000000", 22, AlignmentType.CENTER)] }),
                  ]
            }),
            // وضعية الانطلاق
            new TableRow({
              children: isMergedFormat
                ? [
                    new TableCell({ shading: { fill: theme.bg, type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("وضعية الانطلاق", true, theme.hex, 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph(`تقديم الوضعية وطرح المشكل العلمي:\n${lesson.wadiya}\n\nالمشكلة:\n${lesson.moshkila}\n\nالفرضيات:\n${lesson.faradiyat}`, false, "333333"), ...renderTables(lesson.wadiyaTables)] }),
                    new TableCell({ children: [createParagraph("10 د", true, "333333", 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph("جماعي", false, "666666", 20, AlignmentType.CENTER)] }),
                  ]
                : [
                    new TableCell({ shading: { fill: theme.bg, type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("وضعية الانطلاق", true, theme.hex, 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph(`تقديم الوضعية:\n${lesson.wadiya}\n\nالمشكلة:\n${lesson.moshkila}`, false, "333333")] }),
                    new TableCell({ children: [createParagraph(`يقرأ الوضعية ويحاول الفهم.\n\nالفرضيات:\n${lesson.faradiyat}`, false, "333333"), ...renderTables(lesson.wadiyaTables)] }),
                    new TableCell({ children: [createParagraph("10 د", true, "333333", 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph("جماعي", false, "666666", 20, AlignmentType.CENTER)] }),
                  ]
            }),
            // الأنشطة
            ...lesson.anshita.map((activity, idx) => {
              if (!activeActivities[idx]) return null;
              return new TableRow({
                children: isMergedFormat
                  ? [
                      new TableCell({ children: [
    createParagraph("مرحلة البحث والتقصي", true, theme.hex, 22, AlignmentType.CENTER),
    
  ] }),
                      new TableCell({
                        children: [
                          createParagraph(activity.title, true, "333333", 22, AlignmentType.RIGHT),
                          createParagraph(`المهمة والتعليمة:\n${activity.asila}\n\nالاستجابة والمنتوج المنتظر:\n${activity.ajwiba}`, false, "333333"),
                          ...renderTables(activity.tables)
                        ]
                      }),
                      new TableCell({ children: [createParagraph(activity.zaman || '', true, "333333", 22, AlignmentType.CENTER)] }),
                      new TableCell({ children: [createParagraph(activity.mola7adha || '', false, "666666", 20, AlignmentType.CENTER)] }),
                    ]
                  : [
                      new TableCell({ children: [
    createParagraph("مرحلة البحث والتقصي", true, theme.hex, 22, AlignmentType.CENTER),
    
  ] }),
                      new TableCell({ children: [createParagraph(activity.title, true, "333333", 22, AlignmentType.RIGHT), createParagraph(`التعليمة:\n${activity.asila}`, false, "333333")] }),
                      new TableCell({
                        children: [
                          createParagraph(`الاستجابة والمنتوج المنتظر:\n${activity.ajwiba}`, false, "333333"),
                          ...renderTables(activity.tables)
                        ]
                      }),
                      new TableCell({ children: [createParagraph(activity.zaman || '', true, "333333", 22, AlignmentType.CENTER)] }),
                      new TableCell({ children: [createParagraph(activity.mola7adha || '', false, "666666", 20, AlignmentType.CENTER)] }),
                    ]
              });
            }).filter(Boolean) as TableRow[],
            // إرساء الموارد
            new TableRow({
              children: isMergedFormat
                ? [
                    new TableCell({ shading: { fill: theme.bg, type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("إرساء الموارد", true, theme.hex, 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph(`توجيه وهيكلة التعلمات:\n${lesson.ustadhNashat?.irsae || "يوجه المناقشة لتلخيص المكتسبات، وتنسيق الإجابات وهيكلة المفاهيم لبناء الحصيلة المعرفية المشتركة للمورد."}\n\nالحصيلة المعرفية والمفاهيم المستخلصة:\n${lesson.irsae}`, false, "333333"), ...renderTables(lesson.irsaeTables)] }),
                    new TableCell({ children: [createParagraph("15 د", true, "333333", 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph("فردي / كراس", false, "666666", 20, AlignmentType.CENTER)] }),
                  ]
                : [
                    new TableCell({ shading: { fill: theme.bg, type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("إرساء الموارد", true, theme.hex, 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph(`توجيه وهيكلة التعلمات:\n${lesson.ustadhNashat?.irsae || "يوجه المناقشة لتلخيص المكتسبات، وتنسيق الإجابات وهيكلة المفاهيم لبناء الحصيلة المعرفية المشتركة للمورد."}`, false, "333333")] }),
                    new TableCell({ children: [createParagraph(`دور المتعلم:\n${lesson.mutaalimNashat?.irsae || "يشارك بنشاط في استخلاص النتائج وصياغة المفاهيم، ويدون حصيلة إرساء المورد في كراسه."}\n\nالحصيلة المعرفية والمفاهيم المستخلصة (إرساء المورد):\n${lesson.irsae}`, false, "333333"), ...renderTables(lesson.irsaeTables)] }),
                    new TableCell({ children: [createParagraph("15 د", true, "333333", 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph("فردي / كراس", false, "666666", 20, AlignmentType.CENTER)] }),
                  ]
            }),
            // تقويم الموارد
            new TableRow({
              children: isMergedFormat
                ? [
                    new TableCell({ shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("تقويم الموارد", true, theme.hex, 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph(`تطبيق وتحكم:\n${lesson.ustadhNashat?.taqwim || "يطرح تمرين تقويمي لقياس مدى تحقق معايير الكفاءة والتحكم في المورد."}\n\n${lesson.taqwim}`, false, "333333"), ...renderTables(lesson.taqwimTables)] }),
                    new TableCell({ children: [createParagraph("10 د", true, "333333", 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph("تقويم تكويني", false, "666666", 20, AlignmentType.CENTER)] }),
                  ]
                : [
                    new TableCell({ shading: { fill: "F9FAFB", type: ShadingType.CLEAR, color: "auto" }, children: [createParagraph("تقويم الموارد", true, theme.hex, 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph(lesson.ustadhNashat?.taqwim || "يطرح تمرين تقويمي لقياس مدى تحقق معايير الكفاءة والتحكم في المورد.", false, "333333")] }),
                    new TableCell({ children: [createParagraph(`تطبيق وتحكم:\n${lesson.taqwim}`, false, "333333"), ...renderTables(lesson.taqwimTables)] }),
                    new TableCell({ children: [createParagraph("10 د", true, "333333", 22, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createParagraph("تقويم تكويني", false, "666666", 20, AlignmentType.CENTER)] }),
                  ]
            })
          ]
        }),

        new Paragraph({ text: "", spacing: { after: 400 } }),
        new Table({
          visuallyRightToLeft: true,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    createParagraph("تأشيرة الإدارة / المفتش:", true, "000000", 22),
                    ...(config.principalName ? [createParagraph(`المدير(ة): ${config.principalName}`, true, "333333", 20)] : []),
                    ...(config.inspectorName ? [createParagraph(`المفتش(ة): ${config.inspectorName}`, true, "333333", 20)] : []),
                    new Paragraph({ text: "", spacing: { after: 600 } }),
                    createParagraph("مساحة الختم", false, "999999", 20, AlignmentType.CENTER)
                  ]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    createParagraph("ختم وتأشيرة الأستاذ:", true, "000000", 22),
                    createParagraph(`الأستاذ(ة): ${config.teacherName || ''}`, true, "333333", 20),
                    createParagraph(config.schoolName || '', false, "666666", 20),
                    new Paragraph({ text: "", spacing: { after: 600 } }),
(config.teacherStamp && config.teacherStamp.startsWith('data:image/'))
                      ? new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new ImageRun({ type: "png", data: await imageDataUrlToPng(config.teacherStamp), transformation: { width: 110, height: 110 } })]
                        })
                      : new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new ImageRun({ type: "png", data: await svgToPngData(buildTeacherStampSvg(config)), transformation: { width: 110, height: 110 } })]
                        })
                  ]
                }),
              ]
            })
          ]
        })

      ]
    }]
  });

  return Packer.toBlob(doc);
};
