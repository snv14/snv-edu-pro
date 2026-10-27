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
      setTimeout(() => resolve(), 2500);
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

  const targetWidth = orientation === "landscape" ? "297mm" : "210mm";
  const targetHeight = orientation === "landscape" ? "210mm" : "297mm";

  page.style.width = targetWidth;
  page.style.height = targetHeight;
  page.style.minHeight = targetHeight;
  page.style.maxHeight = targetHeight;
  page.style.maxWidth = "none";
  page.style.setProperty("-webkit-print-color-adjust", "exact");
  page.style.setProperty("print-color-adjust", "exact");
  page.style.setProperty("box-sizing", "border-box");
  page.style.setProperty("direction", "rtl");
  page.style.setProperty("overflow", "hidden");

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
  host.style.direction = "rtl";
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
  if (document.fonts?.ready) await document.fonts.ready;
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
        const pixelHeight = Math.round(rect.height) || (orientation === "landscape" ? 794 : 1123);

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
  } finally {
    window.scrollTo(origScrollX, origScrollY);
  }
};
