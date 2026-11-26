/** Printing from a dedicated iframe keeps editor controls out and preserves Arabic fonts and RTL. */
export async function printAssessment(element: HTMLElement) {
  const frame = document.createElement("iframe");
  frame.title = "طباعة التقويم";
  frame.style.cssText =
    "position:fixed;width:1px;height:1px;left:-10000px;border:0";
  document.body.append(frame);
  const target = frame.contentDocument;
  if (!target) {
    frame.remove();
    throw new Error("تعذر فتح معاينة الطباعة.");
  }
  const fontUrl = new URL("/fonts/Cairo-Regular.ttf", window.location.href)
    .href;
  target.open();
  target.write(
    `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>التقويم</title><style>@font-face{font-family:AssessmentArabic;src:url("${fontUrl}")}@page{size:A4;margin:12mm}body{font-family:AssessmentArabic,Cairo,Tahoma,sans-serif;direction:rtl;margin:0}section{break-inside:avoid}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body></body></html>`,
  );
  target.close();
  target.body.append(target.importNode(element, true));
  await target.fonts?.ready;
  const cleanup = () => frame.remove();
  frame.contentWindow?.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 120000);
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
}
/** Render each question as a block, avoiding arbitrary cuts through lines on PDF page boundaries. */
export async function exportAssessmentPdf(element: HTMLElement) {
  const [{ default: JsPDF }, { safeHtml2Canvas }] = await Promise.all([
    import("jspdf"),
    import("../utils/html2canvasSanitizer"),
  ]);
  await document.fonts?.ready;
  const pdf = new JsPDF({ unit: "mm", format: "a4" });
  let y = 15;
  const sheet =
    element.querySelector('[aria-label="معاينة التقويم"]') || element;
  const blocks = [...sheet.children] as HTMLElement[];
  for (const block of blocks) {
    const canvas = await safeHtml2Canvas(block, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const width = 180,
      height = (canvas.height * width) / canvas.width;
    if (y + height > 282 && y > 15) {
      pdf.addPage();
      y = 15;
    }
    // Oversized questions are split into page-sized slices; normal questions stay intact.
    const pagePixels = Math.floor((267 * canvas.width) / width);
    let offset = 0;
    while (offset < canvas.height) {
      if (offset) {
        pdf.addPage();
        y = 15;
      }
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.min(pagePixels, canvas.height - offset);
      const ctx = slice.getContext("2d");
      if (!ctx) throw new Error("تعذر إنشاء ملف PDF.");
      ctx.drawImage(
        canvas,
        0,
        offset,
        canvas.width,
        slice.height,
        0,
        0,
        slice.width,
        slice.height,
      );
      const sliceHeight = (slice.height * width) / slice.width;
      pdf.addImage(
        slice.toDataURL("image/png"),
        "PNG",
        15,
        y,
        width,
        sliceHeight,
      );
      y += sliceHeight + 6;
      offset += slice.height;
    }
  }
  pdf.save("التقويم.pdf");
}
