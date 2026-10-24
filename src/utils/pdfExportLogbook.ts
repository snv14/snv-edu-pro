import { jsPDF } from "jspdf";
import { safeHtml2Canvas, sanitizeOklchForHtml2Canvas } from "./html2canvasSanitizer";

export type LogbookOrientation = "portrait" | "landscape";

const waitForImages = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map(async (img) => {
    if (img.complete) return;
    await new Promise<void>((resolve) => {
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    });
  }));
};


const preparePageForExport = (source: HTMLElement, orientation: LogbookOrientation): { page: HTMLElement; cleanup: () => void } => {
  const page = source.cloneNode(true) as HTMLElement;
  page.classList.add("export-clean-page");
  page.style.boxShadow = "none";
  page.style.borderRadius = "0";
  page.style.margin = "0";
  page.style.transform = "none";
  page.style.backgroundColor = "#ffffff";
  page.style.width = orientation === "landscape" ? "297mm" : "210mm";
  page.style.height = orientation === "landscape" ? "210mm" : "297mm";
  page.style.minHeight = page.style.height;
  page.style.maxWidth = "none";
  page.style.setProperty("-webkit-print-color-adjust", "exact");
  page.style.setProperty("print-color-adjust", "exact");
  page.style.setProperty("box-sizing", "border-box");
  page.style.setProperty("direction", "rtl");
  page.style.setProperty("overflow", "hidden");
  const targetWidth = orientation === "landscape" ? "297mm" : "210mm";
  const targetHeight = orientation === "landscape" ? "210mm" : "297mm";
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.width = targetWidth;
  host.style.height = targetHeight;
  host.style.overflow = "hidden";
  host.style.background = "#ffffff";
  host.style.zIndex = "999999";
  host.style.pointerEvents = "none";
  host.style.opacity = "1";
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
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(pageElements.map((page) => waitForImages(page)));

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

      const canvas = await safeHtml2Canvas(prepared.page, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 10000,
        scrollX: 0,
        scrollY: 0,
        onclone: sanitizeOklchForHtml2Canvas,
        width: prepared.page.scrollWidth,
        height: prepared.page.scrollHeight,
        windowWidth: Math.max(document.documentElement.clientWidth, prepared.page.scrollWidth),
        windowHeight: Math.max(document.documentElement.clientHeight, prepared.page.scrollHeight),
      });

      if (index > 0) pdf.addPage();

      const imageData = canvas.toDataURL("image/png");

      pdf.addImage(
        imageData,
        "PNG",
        0,
        0,
        pageWidth,
        pageHeight,
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
};
