import { inflateRawSync, inflateSync } from 'node:zlib';
import { extractDocxText } from './attachmentText';

/**
 * قارئ المستندات المحلي للوكيل:
 * يستخرج نص PDF (بما فيه الخطوط ذات خرائط ToUnicode) وWord وTXT/HTML
 * دون أي مزوّد ذكاء اصطناعي. الصور لا تُقرأ محليًا لأن قراءتها تحتاج OCR،
 * ويُعلن ذلك صراحة بدل إرجاع نص مخترع.
 */

export type DocumentFormat = 'pdf' | 'docx' | 'text' | 'html' | 'image' | 'unsupported';

export interface DocumentQuality {
  score: number;
  letters: number;
  chars: number;
  arabicRatio: number;
  flags: string[];
}

export interface DocumentReadResult {
  format: DocumentFormat;
  text: string;
  chars: number;
  pages?: number;
  quality: DocumentQuality;
  needsVision: boolean;
  notes: string[];
  image?: { width?: number; height?: number; bytes: number };
}

const MAX_TEXT = 120_000;

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

export const detectDocumentFormat = (name: string, mime: string): DocumentFormat => {
  const extension = (name.split('.').pop() || '').toLowerCase();
  const type = (mime || MIME_BY_EXTENSION[extension] || '').toLowerCase();
  if (type === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (type.includes('wordprocessingml') || extension === 'docx') return 'docx';
  if (type.startsWith('image/')) return 'image';
  if (type === 'text/html') return 'html';
  if (type.startsWith('text/') || ['md', 'csv', 'json', 'xml', 'tsv'].includes(extension)) return 'text';
  return 'unsupported';
};

/* ─────────────────────────────── PDF ─────────────────────────────── */

interface PdfObject {
  dict: string;
  stream?: Buffer;
}

const decodePdfName = (value: string): string => value.replace(/#([0-9a-fA-F]{2})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));

function inflateStream(raw: Buffer): Buffer | null {
  const attempts = [
    () => inflateSync(raw),
    () => inflateRawSync(raw),
    () => inflateSync(raw.subarray(2)),
    () => inflateRawSync(raw.subarray(2)),
  ];
  for (const attempt of attempts) {
    try {
      const value = attempt();
      if (value.length) return value;
    } catch {
      /* جرّب الصيغة التالية */
    }
  }
  return null;
}

function extractObjects(latin: string): Map<number, PdfObject> {
  const objects = new Map<number, PdfObject>();
  const objectPattern = /(\d+)\s+(\d+)\s+obj\b([\s\S]*?)endobj/g;
  for (const match of latin.matchAll(objectPattern)) {
    const number = Number(match[1]);
    const body = match[3] || '';
    const streamIndex = body.search(/\bstream\r?\n/);
    if (streamIndex === -1) {
      objects.set(number, { dict: body });
      continue;
    }
    const dict = body.slice(0, streamIndex);
    const afterMarker = body.slice(streamIndex).replace(/^stream\r?\n/, '');
    const endIndex = afterMarker.lastIndexOf('endstream');
    const raw = Buffer.from(endIndex >= 0 ? afterMarker.slice(0, endIndex) : afterMarker, 'latin1');
    if (!raw.length) {
      objects.set(number, { dict });
      continue;
    }
    const filtered = /\/Filter\s*(?:\[\s*)?\/(FlateDecode|Fl)\b/.test(dict);
    const stream = filtered ? inflateStream(raw) : raw;
    if (!stream) {
      objects.set(number, { dict });
      continue;
    }
    objects.set(number, { dict, stream });
  }
  return objects;
}

const dictNumber = (dict: string, key: string): number | null => {
  const match = dict.match(new RegExp(`/${key}\\s+(\\d+)`));
  return match ? Number(match[1]) : null;
};

/** كائنات مخزّنة مضغوطة داخل /ObjStm (شائعة في PDF الحديثة). */
function expandObjectStreams(objects: Map<number, PdfObject>) {
  for (const object of Array.from(objects.values())) {
    if (!/\/Type\s*\/ObjStm\b/.test(object.dict) || !object.stream) continue;
    const count = dictNumber(object.dict, 'N');
    const first = dictNumber(object.dict, 'First');
    if (!count || first === null) continue;
    const content = object.stream.toString('latin1');
    const header = content.slice(0, first).trim().split(/\s+/).map(Number);
    for (let index = 0; index < count; index += 1) {
      const number = header[index * 2];
      const offset = header[index * 2 + 1];
      const nextOffset = index + 1 < count ? header[(index + 1) * 2 + 1] : content.length - first;
      if (!Number.isFinite(number) || !Number.isFinite(offset)) continue;
      const body = content.slice(first + offset, first + nextOffset);
      if (!objects.has(number)) objects.set(number, { dict: body });
    }
  }
}

function hexToUnicode(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (!clean) return '';
  if (clean.length % 4 === 0 && clean.length > 2) {
    let value = '';
    for (let index = 0; index < clean.length; index += 4) {
      value += String.fromCharCode(parseInt(clean.slice(index, index + 4), 16));
    }
    return value;
  }
  return String.fromCharCode(parseInt(clean, 16));
}

function parseToUnicode(cmap: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pair of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) {
      map.set(parseInt(pair[1], 16), hexToUnicode(pair[2]));
    }
  }
  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    const entryPattern = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(?:<([0-9a-fA-F]+)>|\[([\s\S]*?)\])/g;
    for (const entry of block[1].matchAll(entryPattern)) {
      const low = parseInt(entry[1], 16);
      const high = parseInt(entry[2], 16);
      if (!Number.isFinite(low) || !Number.isFinite(high) || high < low || high - low > 65_535) continue;
      if (entry[3]) {
        const base = hexToUnicode(entry[3]);
        for (let code = low; code <= high; code += 1) {
          map.set(code, base ? String.fromCharCode(base.charCodeAt(0) + (code - low)) : '');
        }
      } else if (entry[4]) {
        const destinations = Array.from(entry[4].matchAll(/<([0-9a-fA-F]*)>/g)).map(item => hexToUnicode(item[1]));
        destinations.forEach((value, index) => {
          if (low + index <= high) map.set(low + index, value);
        });
      }
    }
  }
  return map;
}

interface FontMap {
  cmap: Map<number, string>;
  twoByte: boolean;
}

function collectFontMaps(objects: Map<number, PdfObject>): { byName: Map<string, FontMap[]>; all: FontMap[] } {
  const fontObjects = new Map<number, FontMap>();
  for (const [number, object] of objects) {
    const match = object.dict.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
    if (!match) continue;
    const target = objects.get(Number(match[1]));
    if (!target?.stream) continue;
    const cmap = parseToUnicode(target.stream.toString('latin1'));
    if (!cmap.size) continue;
    const codes = Array.from(cmap.keys());
    const twoByte = codes.some(code => code > 255) || /\/Subtype\s*\/Type0\b/.test(object.dict);
    fontObjects.set(number, { cmap, twoByte });
  }

  const byName = new Map<string, FontMap[]>();
  for (const object of objects.values()) {
    const fontDictPattern = /\/Font\s*<<([\s\S]*?)>>/g;
    for (const dict of object.dict.matchAll(fontDictPattern)) {
      for (const reference of dict[1].matchAll(/\/([A-Za-z0-9#_.-]+)\s+(\d+)\s+\d+\s+R/g)) {
        const font = fontObjects.get(Number(reference[2]));
        if (!font) continue;
        const name = decodePdfName(reference[1]);
        const list = byName.get(name) || [];
        if (!list.includes(font)) list.push(font);
        byName.set(name, list);
      }
    }
  }

  return { byName, all: Array.from(fontObjects.values()) };
}

const byteToLatin = (byte: number): string => (byte >= 32 && byte !== 127 ? String.fromCharCode(byte) : byte === 10 || byte === 13 ? ' ' : '');

function decodeBytes(bytes: number[], font?: FontMap): string {
  if (font) {
    let value = '';
    if (font.twoByte) {
      for (let index = 0; index + 1 < bytes.length; index += 2) {
        const code = (bytes[index] << 8) | bytes[index + 1];
        value += font.cmap.get(code) ?? '';
      }
    } else {
      for (const byte of bytes) value += font.cmap.get(byte) ?? byteToLatin(byte);
    }
    return value;
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let value = '';
    for (let index = 2; index + 1 < bytes.length; index += 2) value += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    return value;
  }
  const buffer = Buffer.from(bytes);
  const utf8 = buffer.toString('utf8');
  if (!utf8.includes('\uFFFD') && /[\u0600-\u06FF]/.test(utf8)) return utf8;
  return bytes.map(byteToLatin).join('');
}

/** نص مشفّر داخل PDF: أقواس مع هروب، أو سلسلة سداسية. */
function readPdfString(source: string, start: number, hex: boolean): { bytes: number[]; end: number } {
  const bytes: number[] = [];
  if (hex) {
    let index = start + 1;
    let digits = '';
    while (index < source.length && source[index] !== '>') {
      if (/[0-9a-fA-F]/.test(source[index])) digits += source[index];
      index += 1;
    }
    if (digits.length % 2) digits += '0';
    for (let cursor = 0; cursor < digits.length; cursor += 2) bytes.push(parseInt(digits.slice(cursor, cursor + 2), 16));
    return { bytes, end: index + 1 };
  }

  let depth = 1;
  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      const next = source[index + 1];
      if (next === undefined) break;
      if (/[0-7]/.test(next)) {
        const octal = source.slice(index + 1, index + 4).match(/^[0-7]{1,3}/)?.[0] || '0';
        bytes.push(parseInt(octal, 8) & 0xff);
        index += 1 + octal.length;
        continue;
      }
      const escapes: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12, '(': 40, ')': 41, '\\': 92 };
      if (next in escapes) bytes.push(escapes[next]);
      else if (next === '\n') { /* استمرار سطر */ }
      else if (next === '\r') { if (source[index + 2] === '\n') index += 1; }
      else bytes.push(next.charCodeAt(0));
      index += 2;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return { bytes, end: index + 1 };
    }
    bytes.push(char.charCodeAt(0) & 0xff);
    index += 1;
  }
  return { bytes, end: source.length };
}

/** ترتيب النص العربي المستخرج من PDF عند صفّه بصريًا. */
const scoreReadable = (value: string): number => {
  const letters = (value.match(/[\u0600-\u06FFa-zA-Z]/g) || []).length;
  const weird = (value.match(/[\uFFFD\u0000-\u0008\u000E-\u001F]/g) || []).length;
  return letters - weird * 3;
};

function decodePdfChunk(bytes: number[], fonts: FontMap[]): string {
  if (!fonts.length) return decodeBytes(bytes);
  let best = '';
  for (const font of fonts) {
    const candidate = decodeBytes(bytes, font);
    if (scoreReadable(candidate) > scoreReadable(best)) best = candidate;
  }
  return best;
}

function contentStreamToText(content: string, fontByName: Map<string, FontMap[]>, allFonts: FontMap[]): string {
  let output = '';
  let activeFonts: FontMap[] = allFonts;
  let index = 0;
  const pushSpace = () => {
    if (output && !/\s$/.test(output)) output += ' ';
  };

  while (index < content.length) {
    const char = content[index];
    if (char === '/' ) {
      const nameMatch = content.slice(index).match(/^\/([A-Za-z0-9#_.-]+)\s+[-\d.]+\s+Tf/);
      if (nameMatch) {
        activeFonts = fontByName.get(decodePdfName(nameMatch[1])) || allFonts;
        index += nameMatch[0].length;
        continue;
      }
      index += 1;
      continue;
    }
    if (char === '(' ) {
      const string = readPdfString(content, index, false);
      const tail = content.slice(string.end, string.end + 12);
      if (/^\s*(Tj|'|")/.test(tail)) output += decodePdfChunk(string.bytes, activeFonts);
      index = string.end;
      continue;
    }
    if (char === '<' && content[index + 1] !== '<') {
      const string = readPdfString(content, index, true);
      const tail = content.slice(string.end, string.end + 12);
      if (/^\s*Tj/.test(tail)) output += decodePdfChunk(string.bytes, activeFonts);
      index = string.end;
      continue;
    }
    if (char === 'B' && /^BI\b/.test(content.slice(index))) {
      const inlineEnd = content.indexOf('EI', index + 2);
      index = inlineEnd === -1 ? content.length : inlineEnd + 2;
      continue;
    }
    if (char === '[') {
      let cursor = index + 1;
      let chunk = '';
      while (cursor < content.length && content[cursor] !== ']') {
        if (content[cursor] === '(') {
          const string = readPdfString(content, cursor, false);
          chunk += decodePdfChunk(string.bytes, activeFonts);
          cursor = string.end;
          continue;
        }
        if (content[cursor] === '<') {
          const string = readPdfString(content, cursor, true);
          chunk += decodePdfChunk(string.bytes, activeFonts);
          cursor = string.end;
          continue;
        }
        const numberMatch = content.slice(cursor).match(/^([-+]?\d+(?:\.\d+)?)/);
        if (numberMatch) {
          if (Number(numberMatch[1]) <= -120) chunk += ' ';
          cursor += numberMatch[0].length;
          continue;
        }
        cursor += 1;
      }
      output += chunk;
      index = cursor + 1;
      continue;
    }
    const operator = content.slice(index).match(/^(T\*|Td|TD|Tm|ET|BT)/);
    if (operator) {
      if (operator[1] !== 'BT') pushSpace();
      if (operator[1] === 'Td' || operator[1] === 'TD' || operator[1] === 'Tm' || operator[1] === 'T*' || operator[1] === 'ET') {
        if (output && !/\n$/.test(output)) output += '\n';
      }
      index += operator[0].length;
      continue;
    }
    index += 1;
  }

  return output;
}

/**
 * بعض ملفات PDF تخزّن الحروف العربية بترتيب بصري (من اليسار إلى اليمين).
 * نكشف ذلك من مواضع «ال» التعريف ثم نعكس السطر مع حماية الأرقام واللاتينية.
 */
const reverseRun = (run: string): string => Array.from(run).reverse().join('');

const reverseVisualLine = (line: string): string =>
  reverseRun(line)
    .replace(/[A-Za-z0-9][A-Za-z0-9.,:%/\-]*/g, run => reverseRun(run))
    // عكس «ال» التعريف يفصل الهمزة عن اللام في «الأول/الإنسان/الآليات»؛ نعيد ترتيبها.
    .replace(/ا([أإآ])ل/g, 'ال$1');

function fixArabicVisualOrder(input: string): string {
  const lines = input.split('\n');
  const arabicLines = lines.filter(line => /[\u0600-\u06FF]/.test(line));
  if (!arabicLines.length) return input;

  let startAl = 0;
  let endAl = 0;
  for (const line of arabicLines) {
    for (const token of line.split(/\s+/)) {
      if (!/[\u0600-\u06FF]/.test(token)) continue;
      if (token.startsWith('ال')) startAl += 1;
      if (token.endsWith('لا')) endAl += 1;
    }
  }
  if (endAl <= startAl) return input;

  return lines.map(line => (/[\u0600-\u06FF]/.test(line) ? reverseVisualLine(line) : line)).join('\n');
}

export function extractPdfText(buffer: Buffer): { text: string; pages: number } {
  const latin = buffer.toString('latin1');
  const objects = extractObjects(latin);
  expandObjectStreams(objects);
  const { byName, all } = collectFontMaps(objects);
  const pages = Math.max(1, (latin.match(/\/Type\s*\/Page\b/g) || []).length);

  const segments: string[] = [];
  for (const object of objects.values()) {
    if (!object.stream || object.stream.length < 8) continue;
    const content = object.stream.toString('latin1');
    if (!/\bBT\b/.test(content) || !/(Tj|TJ|'|")/.test(content)) continue;
    const text = contentStreamToText(content, byName, all)
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!text) continue;
    // نرفض المقاطع الثنائية (خطوط بلا خريطة) بدل حشو النص برموز تالفة:
    // النص الحقيقي فيه مسافات وكلمات قصيرة، والبيانات المضغوطة ليست كذلك.
    const tokens = text.split(/\s+/).filter(Boolean);
    const whitespaceRatio = (text.match(/\s/g) || []).length / text.length;
    const averageWord = tokens.reduce((sum, token) => sum + token.length, 0) / Math.max(1, tokens.length);
    if (text.length > 400 && (whitespaceRatio < 0.025 || averageWord > 16)) continue;
    segments.push(text);
  }

  const merged = segments.join('\n\n').trim();
  return { text: fixArabicVisualOrder(merged).normalize('NFKC'), pages };
}

/* ─────────────────────────────── الصور ─────────────────────────────── */

function imageDimensions(buffer: Buffer, mime: string): { width: number; height: number } | null {
  try {
    if (mime.includes('png') && buffer.length > 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mime.includes('jpeg') || mime.includes('jpg')) {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        offset += 2 + length;
      }
    }
  } catch {
    /* لا أبعاد معروفة */
  }
  return null;
}

/* ─────────────────────────────── القياس ─────────────────────────────── */

export function measureText(text: string): DocumentQuality {
  const chars = text.length;
  const letters = (text.match(/[\p{L}]/gu) || []).length;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const replacement = (text.match(/[\uFFFD]/g) || []).length;
  const flags: string[] = [];
  if (chars < 20) flags.push('empty');
  if (chars >= 20 && letters / Math.max(1, chars) < 0.35) flags.push('garbled');
  if (replacement > chars * 0.02) flags.push('broken-encoding');
  const score = Math.max(0, Math.min(100, Math.round((letters / Math.max(1, chars)) * 100 - flags.length * 20)));
  return {
    score,
    letters,
    chars,
    arabicRatio: letters ? Math.round((arabic / letters) * 100) : 0,
    flags,
  };
}

export function readDocument(input: { buffer: Buffer; name: string; mime?: string }): DocumentReadResult {
  const name = input.name || 'document';
  const mime = input.mime || MIME_BY_EXTENSION[(name.split('.').pop() || '').toLowerCase()] || '';
  const format = detectDocumentFormat(name, mime);
  const base = { format, chars: 0, quality: measureText(''), needsVision: false, notes: [] as string[] };

  if (format === 'pdf') {
    const { text, pages } = extractPdfText(input.buffer);
    const quality = measureText(text);
    const notes: string[] = [];
    const thin = text.trim().length < 120;
    if (!text.trim() || thin) notes.push('لا توجد طبقة نص كافية في هذا PDF (ورق مصوَّر أو خطوط بلا خريطة)؛ يحتاج قراءة بصرية أو إدخال النص يدويًا.');
    else if (quality.flags.includes('garbled')) notes.push('النص المستخرج مشوّش؛ غالبًا خطوط بلا خريطة ToUnicode. أعد تصدير PDF من Word أو استعمل OCR.');
    if (quality.flags.includes('broken-encoding')) notes.push('توجد أحرف تالفة في الاستخراج؛ راجع النص قبل الاعتماد.');
    return { ...base, text: text.slice(0, MAX_TEXT), chars: text.length, pages, quality, needsVision: thin, notes };
  }

  if (format === 'docx') {
    const text = extractDocxText(input.buffer.toString('base64'));
    const quality = measureText(text);
    return {
      ...base,
      text: text.slice(0, MAX_TEXT),
      chars: text.length,
      quality,
      needsVision: false,
      notes: text.trim() ? [] : ['تعذر استخراج نص Word؛ تأكد أن الملف .docx سليم (وليس .doc القديم).'],
    };
  }

  if (format === 'text' || format === 'html') {
    let text = input.buffer.toString('utf8');
    if (format === 'html') {
      text = text
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    }
    text = text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const quality = measureText(text);
    return { ...base, text: text.slice(0, MAX_TEXT), chars: text.length, quality, needsVision: false, notes: text ? [] : ['الملف النصي فارغ.'] };
  }

  if (format === 'image') {
    const size = imageDimensions(input.buffer, mime);
    return {
      ...base,
      text: '',
      chars: 0,
      quality: measureText(''),
      needsVision: true,
      notes: [
        `صورة ${size ? `${size.width}×${size.height}` : ''}${mime ? ` (${mime})` : ''}: قراءتها تحتاج OCR أو مزوّد رؤية.`,
        'يمكنك لصق النص في خانة «نص بديل» ليكمّل الوكيل التحليل محليًا.',
      ],
      image: size ? { ...size, bytes: input.buffer.length } : { bytes: input.buffer.length },
    };
  }

  return { ...base, text: '', chars: 0, quality: measureText(''), notes: ['صيغة غير مدعومة. المدعوم: PDF نصي، DOCX، TXT، HTML، وصور (بمراجعة بصرية).'] };
}
