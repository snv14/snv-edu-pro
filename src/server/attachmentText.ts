import { inflateRawSync } from 'node:zlib';

/**
 * استخراج نص ملف Word (.docx) دون مكتبات خارجية:
 * يقرأ فهرس ZIP المركزي، يفكّ ضغط word/document.xml، ثم يحوّل الفقرات إلى نص.
 * يُرجع نصاً فارغاً إذا لم يكن الملف DOCX صالحاً.
 */
export function extractDocxText(base64: string): string {
  try {
    const buffer = Buffer.from(base64, 'base64');
    const documentXml = readZipEntry(buffer, 'word/document.xml');
    if (!documentXml) return '';
    return xmlToText(documentXml);
  } catch {
    return '';
  }
}

function readZipEntry(buffer: Buffer, wanted: string): string | null {
  // البحث عن توقيع نهاية الفهرس المركزي (EOCD) من آخر الملف.
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 66_000); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) return null;

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) return null;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);

    if (name === wanted) {
      if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) return null;
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return data.toString('utf8');
      if (method === 8) return inflateRawSync(data).toString('utf8');
      return null;
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return null;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
};

function xmlToText(xml: string): string {
  return xml
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:tr\b[^>]*>/g, '\n')
    .replace(/<\/w:tc>/g, ' | ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|apos);/g, entity => ENTITIES[entity] || entity)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
