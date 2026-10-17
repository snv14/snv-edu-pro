import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation } from 'docx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { sanitizeOklchForHtml2Canvas } from './html2canvasSanitizer';
import { MemoConfig } from '../types';

const safe = (s: string) => (s || 'مذكرة_تصحيح').replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '_').slice(0, 80);

export async function exportCorrectionMemoToDocx(args: {
  title: string; text: string; config?: MemoConfig; level?: string;
}) {
  const lines = args.text.split(/\r?\n/);
  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'الجمهورية الجزائرية الديمقراطية الشعبية', bold: true, font: 'Tajawal', size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'وزارة التربية الوطنية', bold: true, font: 'Tajawal', size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: args.title, bold: true, font: 'Tajawal', size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `المستوى: ${args.level?.toUpperCase() || '—'}    المادة: علوم الطبيعة والحياة    المؤسسة: ${args.config?.schoolName || '—'}    الأستاذ(ة): ${args.config?.teacherName || '—'}`, font: 'Tajawal', size: 22 })] }),
    ...lines.map(line => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 100 }, children: [new TextRun({ text: line || ' ', font: 'Tajawal', size: 22 })] }))
  ];
  const doc = new Document({
    sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }]
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = safe(args.title) + '.docx'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function exportCorrectionMemoToPdf(element: HTMLElement, title: string) {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#fff', onclone: sanitizeOklchForHtml2Canvas });
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = 210, pageH = 297;
  const pxPerMm = canvas.width / pageW;
  const pagePx = Math.floor(pageH * pxPerMm);
  let offset = 0, page = 0;
  while (offset < canvas.height) {
    if (page) pdf.addPage();
    const slice = document.createElement('canvas');
    slice.width = canvas.width; slice.height = Math.min(pagePx, canvas.height - offset);
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, offset, canvas.width, slice.height, 0, 0, slice.width, slice.height);
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pageW, slice.height / pxPerMm);
    offset += slice.height; page++;
  }
  pdf.save(safe(title) + '.pdf');
}

export function printCorrectionMemo(element: HTMLElement, title: string) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
  if (!win) return;
  win.document.write(`<!doctype html><html dir="rtl"><head><title>${title}</title><style>@page{size:A4;margin:12mm}body{margin:0;background:#fff;font-family:Tajawal,Arial,sans-serif;color:#172033}.sheet{width:100%}</style></head><body><div class="sheet">${element.innerHTML}</div><script>window.onload=function(){window.print();}</script></body></html>`);
  win.document.close();
}
