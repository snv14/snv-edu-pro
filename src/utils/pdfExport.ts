import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { sanitizeOklchForHtml2Canvas } from './html2canvasSanitizer';
import type { MemoConfig } from '../types';

const waitForImages = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.complete) return;
      await new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );
};

const buildSafeFilename = (config: MemoConfig, title: string): string => {
  const raw = `مذكرة_${config.level || 'niveau'}_${config.teacherName || ''}_${title || 'بيداغوجية'}`;
  return raw.replace(/[^a-zA-Z0-9\\u0600-\\u06FF_-]/g, '_').replace(/_+/g, '_').slice(0, 100) + '.pdf';
};

const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

const prepareExportPage = (
  source: HTMLElement,
  children: HTMLElement[],
  pageNumber: number,
  totalPages: number,
  pageHeightPx: number
): { page: HTMLElement; cleanup: () => void } => {
  const page = source.cloneNode(false) as HTMLElement;

  const widthPx = Math.round(source.getBoundingClientRect().width) || 794;
  page.style.boxShadow = 'none';
  page.style.borderRadius = '0';
  page.style.margin = '0';
  page.style.width = widthPx + 'px';
  page.style.height = pageHeightPx + 'px';
  page.style.minHeight = pageHeightPx + 'px';
  page.style.maxWidth = 'none';
  page.style.overflow = 'hidden';
  page.style.transform = 'none';
  page.style.backgroundColor = '#ffffff';
  page.style.setProperty('-webkit-print-color-adjust', 'exact');
  page.style.setProperty('print-color-adjust', 'exact');

  children.forEach((child) => page.appendChild(child.cloneNode(true)));

  // ترقيم حقيقي لكل صفحة بدل بقاء "1 / 1" في كل نسخة.
  page.querySelectorAll<HTMLElement>('.memo-page-number').forEach((el) => {
    el.textContent = `الصفحة ${pageNumber} / ${totalPages}`;
    el.classList.remove('print:hidden');
  });

  // لا تسمح العناصر الكبيرة بالانقسام عشوائياً داخل الصفحة.
  page.querySelectorAll<HTMLElement>('table, tr, .page-break-inside-avoid, .break-inside-avoid, [data-pdf-keep="true"]').forEach((el) => {
    el.style.breakInside = 'avoid';
    el.style.pageBreakInside = 'avoid';
  });

  // تثبيت هندسة الرسومات عند تحويلها إلى صورة: لا نسمح للـ SVG أو
  // الحاوية المرنة بتغيير موضع الرسم مقارنة بالمعاينة.
  page.querySelectorAll<HTMLElement>('.memo-diagram-block, .memo-diagram-item, .memo-diagram-canvas').forEach((el) => {
    el.style.position = 'relative';
    el.style.top = 'auto';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = 'auto';
    el.style.transform = 'none';
    el.style.float = 'none';
    el.style.clear = 'both';
  });
  page.querySelectorAll<SVGElement>('.memo-diagram-canvas svg').forEach((svg) => {
    svg.style.display = 'block';
    svg.style.position = 'relative';
    svg.style.top = 'auto';
    svg.style.transform = 'none';
    svg.style.marginTop = '0';
    svg.style.marginBottom = '0';
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
  });

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = widthPx + 'px';
  host.style.height = pageHeightPx + 'px';
  host.style.overflow = 'hidden';
  host.style.background = '#ffffff';
  host.style.zIndex = '-9999';
  host.style.pointerEvents = 'none';
  host.style.opacity = '1';
  host.setAttribute('aria-hidden', 'true');
  host.appendChild(page);
  document.body.appendChild(host);

  return { page, cleanup: () => host.remove() };
};

const cloneWithRows = (
  source: HTMLElement,
  table: HTMLTableElement,
  rows: HTMLTableRowElement[],
  fragmentIndex: number,
  estimatedHeight: number
): HTMLElement => {
  const fragment = source.cloneNode(true) as HTMLElement;
  const targetTable = fragment.querySelector('table');
  if (!targetTable) return fragment;

  const targetBody = targetTable.tBodies[0];
  if (targetBody) {
    targetBody.replaceChildren(...rows.map((row) => row.cloneNode(true)));
  }

  // عند تقسيم جدول كبير نكرر رأس الجدول تلقائياً في كل جزء.
  targetTable.querySelectorAll('thead').forEach((thead) => {
    thead.style.display = 'table-header-group';
  });

  fragment.dataset.pdfTableFragment = String(fragmentIndex + 1);
  fragment.dataset.pdfFragmentHeight = String(Math.ceil(estimatedHeight));
  fragment.style.breakInside = 'avoid';
  fragment.style.pageBreakInside = 'avoid';
  return fragment;
};

const splitOversizedTable = (
  source: HTMLElement,
  maxHeight: number
): HTMLElement[] => {
  const table = source.querySelector('table');
  if (!table || !table.tBodies.length) return [source];

  const sourceRect = source.getBoundingClientRect();
  if (sourceRect.height <= maxHeight) return [source];

  const rows = Array.from(table.tBodies[0].rows);
  if (!rows.length) return [source];

  const headerHeight = table.tHead?.getBoundingClientRect().height || 0;
  const tableRect = table.getBoundingClientRect();
  const fixedHeight = Math.max(0, sourceRect.height - tableRect.height);
  const usableTableHeight = Math.max(120, maxHeight - fixedHeight);

  const fragments: HTMLElement[] = [];
  let current: HTMLTableRowElement[] = [];
  let currentHeight = headerHeight;

  rows.forEach((row, index) => {
    const rowHeight = Math.max(18, row.getBoundingClientRect().height);
    if (current.length > 0 && currentHeight + rowHeight > usableTableHeight) {
      fragments.push(cloneWithRows(source, table, current, fragments.length, fixedHeight + currentHeight));
      current = [];
      currentHeight = headerHeight;
    }

    // إذا كان الصف نفسه أكبر من الصفحة، نضعه منفرداً بدلاً من فقدانه.
    current.push(row);
    currentHeight += rowHeight;

    if (index === rows.length - 1 && current.length) {
      fragments.push(cloneWithRows(source, table, current, fragments.length, fixedHeight + currentHeight));
    }
  });

  return fragments.length ? fragments : [source];
};

const buildSmartPages = (paper: HTMLElement): { children: HTMLElement[]; pageHeightPx: number }[] => {
  const paperRect = paper.getBoundingClientRect();
  const pageWidthPx = paperRect.width;
  const pageHeightPx = Math.round(pageWidthPx * (297 / 210));
  const computed = getComputedStyle(paper);
  const paddingTop = parseFloat(computed.paddingTop) || 0;
  const paddingBottom = parseFloat(computed.paddingBottom) || 0;
  const availableHeight = pageHeightPx - paddingTop - paddingBottom;

  const sourceChildren = Array.from(paper.children) as HTMLElement[];
  if (!sourceChildren.length) return [{ children: [], pageHeightPx }];

  // نحول الجدول الكبير إلى أجزاء مستقلة مع تكرار رأسه.
  const expandedChildren = sourceChildren.flatMap((child) =>
    splitOversizedTable(child, availableHeight)
  );

  const measured = expandedChildren.map((child) => {
    const estimated = Number(child.dataset.pdfFragmentHeight);
    const rect = child.getBoundingClientRect();
    const styles = getComputedStyle(child);
    const marginTop = parseFloat(styles.marginTop) || 0;
    const marginBottom = parseFloat(styles.marginBottom) || 0;
    const height = Number.isFinite(estimated) && estimated > 0 ? estimated : rect.height;

    // احتساب الهوامش الفعلية يمنع وضع الرسم/الجدول أعلى الصفحة
    // عند انتقاله إلى صفحة جديدة بسبب تجاهل margin في الحساب السابق.
    return {
      child,
      height: height + marginTop + marginBottom,
      keepTogether: child.matches('[data-pdf-keep="true"], .memo-diagram-block, .page-break-inside-avoid, .break-inside-avoid'),
    };
  });

  const pages: { children: HTMLElement[]; pageHeightPx: number }[] = [];
  let current: HTMLElement[] = [];
  let currentHeight = paddingTop;

  for (const item of measured) {
    const gap = current.length ? 0 : 0;

    // كتلة الرسم/الجدول المحمية تنتقل كاملة إلى الصفحة التالية إذا لم
    // تتسع في المساحة المتبقية، بدلاً من محاولة حشرها أو تغيير موضعها.
    if (current.length > 0 && currentHeight + gap + item.height > availableHeight) {
      pages.push({ children: current, pageHeightPx });
      current = [];
      currentHeight = paddingTop;
    }

    current.push(item.child);
    currentHeight += gap + item.height;
  }

  if (current.length) pages.push({ children: current, pageHeightPx });

  return pages;
};

export const generateMemoPdf = async (
  config: MemoConfig,
  title = 'مذكرة بيداغوجية'
): Promise<void> => {
  const paper = document.getElementById('memo-paper');
  if (!paper) throw new Error('لم يتم العثور على المذكرة للتصدير');

  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages(paper);
  await nextFrame();

  const smartPages = buildSmartPages(paper);
  if (!smartPages.length) throw new Error('تعذر إنشاء صفحات المذكرة');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;

  for (let index = 0; index < smartPages.length; index += 1) {
    const prepared = prepareExportPage(
      paper,
      smartPages[index].children,
      index + 1,
      smartPages.length,
      smartPages[index].pageHeightPx
    );

    try {
      await waitForImages(prepared.page);
      await nextFrame();

      const canvas = await html2canvas(prepared.page, {
        scale: Math.min(1.6, Math.max(1.2, window.devicePixelRatio || 1.4)),
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000,
        scrollX: 0,
        scrollY: 0,
        onclone: sanitizeOklchForHtml2Canvas,
        width: prepared.page.scrollWidth,
        height: prepared.page.scrollHeight,
        windowWidth: prepared.page.scrollWidth,
        windowHeight: prepared.page.scrollHeight,
      });

      if (index > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        'FAST'
      );
    } finally {
      prepared.cleanup();
    }
  }

  pdf.save(buildSafeFilename(config, title));
};
