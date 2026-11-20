import { jsPDF } from "jspdf";
import { safeHtml2Canvas, sanitizeOklchForHtml2Canvas } from "./html2canvasSanitizer";
import {
  applyHandwritingCssVars,
  getEffectiveExportFontFamily,
  isHandwritingActiveFor,
  loadHandwritingSettings,
  type HandwritingStyleSettings,
} from "../services/handwritingStyle";

export type LogbookOrientation = "portrait" | "landscape";

import { waitForImages } from './exportDom';


const preparePageForExport = (
  source: HTMLElement,
  orientation: LogbookOrientation,
  hwStyle: HandwritingStyleSettings
): { page: HTMLElement; cleanup: () => void } => {
  const hwActive = isHandwritingActiveFor("logbook", hwStyle);
  const exportFont = getEffectiveExportFontFamily("pdf", hwStyle, "logbook");

  const page = source.cloneNode(true) as HTMLElement;
  page.classList.add("export-clean-page");
  if (hwActive) {
    page.classList.add("hw-notebook-scope");
  }
  page.style.boxShadow = "none";
  page.style.margin = "0";
  page.style.transform = "none";
  page.style.backgroundColor = "#ffffff";
  page.style.fontFamily = exportFont;
  page.style.setProperty("--hw-font", exportFont);
  page.style.setProperty("--hw-blue", hwStyle.palette.titleBlue);
  page.style.setProperty("--hw-red", hwStyle.palette.subRed);
  page.style.setProperty("--hw-green", hwStyle.palette.defGreen);
  page.style.setProperty("--hw-black", hwStyle.palette.bodyBlack);
  page.style.setProperty("--hw-purple", hwStyle.palette.termPurple);
  page.style.setProperty("--hw-orange", hwStyle.palette.noteOrange);
  page.style.direction = "rtl";
  page.style.color = "#18181b";

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

  // اتباع نمط الصفحة المختار: الإطار الأزرق الدائري في الكلاسيكي فقط، وبلا إطار في Word والسادة
  const pageStyle = document.documentElement.dataset.pageTemplate || "word";
  if (source.classList.contains("teal-logbook-page")) {
    page.style.border = "none";
    page.style.borderRadius = "0";
  } else if (
    pageStyle === "classic" &&
    (source.classList.contains("logbook-content-page") || source.hasAttribute("data-logbook-content-page"))
  ) {
    page.style.border = "2px solid #0284c7";
    page.style.borderRadius = "14px";
  } else {
    page.style.border = "none";
    page.style.borderRadius = "0";
  }

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
  host.style.fontFamily = exportFont;
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
  const hwStyle = loadHandwritingSettings();
  applyHandwritingCssVars(hwStyle);
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
      const prepared = preparePageForExport(element, orientation, hwStyle);
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
