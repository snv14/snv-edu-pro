import { jsPDF } from "jspdf";
import { safeHtml2Canvas, sanitizeOklchForHtml2Canvas } from "./html2canvasSanitizer";

export type LogbookOrientation = "portrait" | "landscape";

/**
 * الانتظار الحقيقي لاكتمال الموارد قبل الرسم:
 * - صور <img> (الشعارات، الختم، الصور المرفقة)
 * - صور CSS (background-image / mask / border-image) على شكل url(...)
 * - خطوط الويب عبر document.fonts.load لكل عائلة/وزن مستخدم فعلياً
 *
 * مهم: html2canvas v1 لا ينتظر تحميل الصور ولا الخطوط بنفسه؛ إن انتهى
 * الانتظار قبلها فتُرسم الأماكن فارغة، لذلك ننتظر هنا حتى
 * IMAGE_WAIT_TIMEOUT_MS بدل تجاهل الصور البطيئة بصمت (كما كان سابقاً 2.5s).
 */
const IMAGE_WAIT_TIMEOUT_MS = 20000;

const waitForImages = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll("img"));

  // صور الخلفية في CSS
  const cssUrlRe = /url\((['"]?)([^'")]+)\1\)/g;
  const cssImages: string[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage;
    if (!bg || bg === "none") return;
    let match: RegExpExecArray | null;
    while ((match = cssUrlRe.exec(bg)) !== null) {
      if (!match[2].startsWith("data:")) cssImages.push(match[2]);
    }
  });

  const preload = (src: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve();
      img.onerror = () => resolve();
      setTimeout(resolve, IMAGE_WAIT_TIMEOUT_MS);
      img.src = src;
    });

  await Promise.all([
    ...images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, IMAGE_WAIT_TIMEOUT_MS);
        })
    ),
    ...cssImages.map(preload),
  ]);
};

/**
 * انتظار الخطوط المستخدمة فعلياً في الصفحة (وليس فقط document.fonts.ready).
 * بدون ذلك قد يُرسم النص بخط احتياطي فتبدو العربية مختلفة عن المعاينة.
 */
const waitForFonts = async (root: HTMLElement): Promise<void> => {
  if (!document.fonts) return;
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  const faces = new Set<string>();
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (!el.textContent || !el.textContent.trim()) return;
    const cs = getComputedStyle(el);
    const weight = cs.fontWeight || "400";
    const family = (cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim();
    if (family) faces.add(`${cs.fontStyle || "normal"} ${weight} 16px "${family}"`);
  });

  await Promise.all(
    Array.from(faces).map(async (spec) => {
      try {
        await document.fonts.load(spec);
      } catch {
        /* ignore */
      }
    })
  );

  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
};


const preparePageForExport = (source: HTMLElement, orientation: LogbookOrientation): { page: HTMLElement; cleanup: () => void } => {
  const page = source.cloneNode(true) as HTMLElement;
  page.classList.add("export-clean-page");
  page.style.boxShadow = "none";
  page.style.margin = "0";
  page.style.transform = "none";
  page.style.backgroundColor = "#ffffff";
  // لا نفرض عائلة خط جديدة: القالب يحدد خطه بنفسه (Cairo/Tajawal)، وفرض
  // عائلة أخرى هنا كان يغيّر شكل النص عن المعاينة.
  page.style.direction = "rtl";
  page.style.color = "#18181b";

  const targetWidth = orientation === "landscape" ? "297mm" : "210mm";
  const targetHeight = orientation === "landscape" ? "210mm" : "297mm";

  page.style.width = targetWidth;
  // لا نثبّت height: الصفحات التي يتجاوز محتواها A4 كانت تُقصّ (overflow:hidden)
  // فتضيع أسطر كاملة. نترك الصفحة تنمو ثم نلائمها مع الصفحة في PDF.
  page.style.height = "auto";
  page.style.minHeight = targetHeight;
  page.style.maxHeight = "none";
  page.style.maxWidth = "none";
  page.style.setProperty("-webkit-print-color-adjust", "exact");
  page.style.setProperty("print-color-adjust", "exact");
  page.style.setProperty("box-sizing", "border-box");
  page.style.setProperty("direction", "rtl");
  page.style.setProperty("overflow", "visible");

  // نُبقي الإطار/الزوايا كما هي في المعاينة بدل فرض قيم ثابتة،
  // حتى تكون نسخة التصدير مطابقة لما يراه الأستاذ على الشاشة.
  page.style.borderRadius = getComputedStyle(source).borderRadius;
  page.style.border = getComputedStyle(source).border;

  // إصلاح جذري لعطل «الجمهوريةالجزائرية...»:
  // html2canvas v1 يجزّئ أي نص له letter-spacing غير صفري إلى حروف منفصلة
  // ويرسمها بـ fillText، فتفقد العربية وصلاتها وتشكيلاتها. نُبطل التباعد
  // على عنصر الصفحة نفسه حتى لو لم تُطبَّق ورقة الأنماط في النسخة المنسوخة.
  page.style.setProperty("letter-spacing", "normal", "important");

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.width = targetWidth;
  host.style.overflow = "visible";
  host.style.background = "#ffffff";
  host.style.zIndex = "999999";
  host.style.pointerEvents = "none";
  host.style.opacity = "1";
  host.style.direction = "rtl";
  host.style.color = "#18181b";
  host.style.display = "flex";
  host.style.flexDirection = "column";
  host.style.alignItems = "stretch";
  host.style.justifyContent = "space-between";
  host.setAttribute("aria-hidden", "true");
  host.appendChild(page);
  document.body.appendChild(host);

  return {
    page,
    cleanup: () => host.remove(),
  };
};

export const generatePreviewMatchPdf = async (
  pageElements: HTMLElement[],
  orientation: LogbookOrientation = "portrait",
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  if (!pageElements.length) throw new Error("لا توجد صفحات للمعاينة");

  // 1) انتظار الخطوط المستخدمة فعلياً + كل الصور (شعارات، ختم، خلفيات CSS)
  await Promise.all(pageElements.map((page) => waitForFonts(page)));
  await Promise.all(pageElements.map((page) => waitForImages(page)));

  const origScrollX = window.scrollX;
  const origScrollY = window.scrollY;
  // Reset window scroll position so html2canvas coordinate math never offsets the captured canvas
  window.scrollTo(0, 0);

  try {
    const pdf = new jsPDF({
      orientation: orientation === "landscape" ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
    });

    const pageWidth = orientation === "landscape" ? 297 : 210;
    const pageHeight = orientation === "landscape" ? 210 : 297;

    for (let index = 0; index < pageElements.length; index += 1) {
      if (onProgress) {
        onProgress(index + 1, pageElements.length);
      }
      const element = pageElements[index];
      const prepared = preparePageForExport(element, orientation);
      try {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        const rect = prepared.page.getBoundingClientRect();
        const pixelWidth = Math.round(rect.width) || (orientation === "landscape" ? 1123 : 794);
        const pixelHeight =
          Math.max(Math.round(rect.height), prepared.page.scrollHeight, prepared.page.offsetHeight) ||
          (orientation === "landscape" ? 794 : 1123);

        const canvas = await safeHtml2Canvas(prepared.page, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width: pixelWidth,
          height: pixelHeight,
          windowWidth: pixelWidth,
          windowHeight: pixelHeight,
          onclone: sanitizeOklchForHtml2Canvas,
        });

        if (index > 0) {
          pdf.addPage("a4", orientation === "landscape" ? "landscape" : "portrait");
        }

        const imageData = canvas.toDataURL("image/png");

        // تحجيم الصورة مع الحفاظ على النسبة تماماً حتى لا تُقطّع الصفحة
        // (سابقاً كانت الصورة تُمدَّد إلى 210x297mm مهما كانت نسبتها).
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const ratio = Math.min(pageWidth / imgWidthPx, pageHeight / imgHeightPx);
        const drawWidth = imgWidthPx * ratio;
        const drawHeight = imgHeightPx * ratio;
        const offsetX = (pageWidth - drawWidth) / 2;
        const offsetY = (pageHeight - drawHeight) / 2;

        pdf.addImage(
          imageData,
          "PNG",
          offsetX,
          offsetY,
          drawWidth,
          drawHeight,
          undefined,
          "FAST"
        );

        // Clean up canvas memory immediately
        canvas.width = 1;
        canvas.height = 1;
      } finally {
        prepared.cleanup();
      }
    }

    pdf.save(`الدفتر-اليومي-${orientation === "landscape" ? "أفقي" : "عمودي"}.pdf`);
  } finally {
    window.scrollTo(origScrollX, origScrollY);
  }
};
