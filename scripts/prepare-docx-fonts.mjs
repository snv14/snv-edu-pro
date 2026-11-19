#!/usr/bin/env node
/**
 * Extracts and merges TrueType (.ttf) fonts from local `@fontsource/*` `.woff2`
 * packages into `public/fonts/` for mandatory Word (.docx) font embedding.
 *
 * Guarantees:
 * - Zero external downloads (reads only from `node_modules/@fontsource/*`).
 * - Decompresses `.woff2` using `wawoff2`.
 * - Validates TrueType sfnt signature (`0x00010000`), `glyf` table, no `CFF`/`OTTO`.
 * - Enforces `OS/2.fsType === 0` (embeddable without restrictions); aborts otherwise.
 * - Merges `arabic` + `latin` (+ `latin-ext` if present) into a single TTF while
 *   keeping base Arabic GIDs & `GSUB`/`GPOS`/`GDEF` shaping tables 100% intact.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import wawoff2 from 'wawoff2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'fonts');

const FONT_SPECS = [
  {
    id: 'playpen',
    pkg: 'playpen-sans-arabic',
    familyName: 'Playpen Sans Arabic',
    normalizeFamilyFrom: null,
    weights: [
      { weight: 400, style: 'Regular', outFile: 'PlaypenSansArabic-Regular.ttf' },
      { weight: 700, style: 'Bold', outFile: 'PlaypenSansArabic-Bold.ttf' },
    ],
  },
  {
    id: 'harmattan',
    pkg: 'harmattan',
    familyName: 'Harmattan',
    normalizeFamilyFrom: null,
    weights: [
      { weight: 400, style: 'Regular', outFile: 'Harmattan-Regular.ttf' },
      { weight: 700, style: 'Bold', outFile: 'Harmattan-Bold.ttf' },
    ],
  },
  {
    id: 'lateef',
    pkg: 'lateef',
    familyName: 'Lateef',
    normalizeFamilyFrom: null,
    weights: [
      { weight: 400, style: 'Regular', outFile: 'Lateef-Regular.ttf' },
      { weight: 700, style: 'Bold', outFile: 'Lateef-Bold.ttf' },
    ],
  },
  {
    id: 'marhey',
    pkg: 'marhey',
    familyName: 'Marhey',
    normalizeFamilyFrom: ['Marhey Light', 'MarheyLight'],
    weights: [
      { weight: 400, style: 'Regular', outFile: 'Marhey-Regular.ttf' },
      { weight: 700, style: 'Bold', outFile: 'Marhey-Bold.ttf' },
    ],
  },
  {
    id: 'tajawal',
    pkg: 'tajawal',
    familyName: 'Tajawal',
    normalizeFamilyFrom: null,
    weights: [
      { weight: 400, style: 'Regular', outFile: 'Tajawal-Regular.ttf' },
      { weight: 700, style: 'Bold', outFile: 'Tajawal-Bold.ttf' },
    ],
  },
  {
    id: 'cairo',
    pkg: 'cairo',
    familyName: 'Cairo',
    normalizeFamilyFrom: null,
    weights: [
      { weight: 400, style: 'Regular', outFile: 'Cairo-Regular.ttf' },
      { weight: 700, style: 'Bold', outFile: 'Cairo-Bold.ttf' },
    ],
  },
];

// ================= Low-level TrueType Binary Helpers =================

function calcTableChecksum(buf) {
  let sum = 0;
  const paddedLen = (buf.length + 3) & ~3;
  for (let i = 0; i < paddedLen; i += 4) {
    const b0 = i < buf.length ? buf[i] : 0;
    const b1 = i + 1 < buf.length ? buf[i + 1] : 0;
    const b2 = i + 2 < buf.length ? buf[i + 2] : 0;
    const b3 = i + 3 < buf.length ? buf[i + 3] : 0;
    sum = (sum + (((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0)) >>> 0;
  }
  return sum >>> 0;
}

function parseSfnt(buf, label) {
  if (buf.length < 12) {
    throw new Error(`[${label}] Font buffer too short (${buf.length} bytes)`);
  }
  const sfntVersion = buf.readUInt32BE(0);
  if (sfntVersion !== 0x00010000) {
    throw new Error(
      `[${label}] Invalid TrueType signature 0x${sfntVersion.toString(16)} (expected 0x00010000, not CFF/OTTO)`
    );
  }
  const numTables = buf.readUInt16BE(4);
  const tables = new Map();
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = buf.toString('ascii', rec, rec + 4);
    const offset = buf.readUInt32BE(rec + 8);
    const length = buf.readUInt32BE(rec + 12);
    tables.set(tag, Buffer.from(buf.subarray(offset, offset + length)));
  }

  if (tables.has('CFF ') || tables.has('CFF2')) {
    throw new Error(`[${label}] OpenType CFF outlines are not accepted by Word; TrueType glyf required`);
  }
  for (const req of ['head', 'hhea', 'maxp', 'hmtx', 'loca', 'glyf', 'cmap', 'OS/2', 'name', 'post']) {
    if (!tables.has(req)) {
      throw new Error(`[${label}] Missing required TrueType table '${req}'`);
    }
  }

  const os2 = tables.get('OS/2');
  const fsType = os2.readUInt16BE(8);
  if (fsType !== 0) {
    throw new Error(
      `[${label}] Font OS/2.fsType=${fsType} (must be 0 for unrestricted embedding in Word)`
    );
  }

  return tables;
}

function parseHead(head) {
  return {
    unitsPerEm: head.readUInt16BE(18),
    indexToLocFormat: head.readInt16BE(50),
  };
}

function parseMaxp(maxp) {
  const version = maxp.readUInt32BE(0);
  return {
    version,
    numGlyphs: maxp.readUInt16BE(4),
    maxPoints: version >= 0x00010000 && maxp.length >= 32 ? maxp.readUInt16BE(6) : 0,
    maxContours: version >= 0x00010000 && maxp.length >= 32 ? maxp.readUInt16BE(8) : 0,
    maxCompositePoints: version >= 0x00010000 && maxp.length >= 32 ? maxp.readUInt16BE(10) : 0,
    maxCompositeContours: version >= 0x00010000 && maxp.length >= 32 ? maxp.readUInt16BE(12) : 0,
    maxComponentElements: version >= 0x00010000 && maxp.length >= 32 ? maxp.readUInt16BE(28) : 0,
    maxComponentDepth: version >= 0x00010000 && maxp.length >= 32 ? maxp.readUInt16BE(30) : 0,
  };
}

function parseLoca(loca, numGlyphs, indexToLocFormat) {
  const offsets = new Array(numGlyphs + 1);
  if (indexToLocFormat === 0) {
    for (let i = 0; i <= numGlyphs; i++) {
      offsets[i] = loca.readUInt16BE(i * 2) * 2;
    }
  } else {
    for (let i = 0; i <= numGlyphs; i++) {
      offsets[i] = loca.readUInt32BE(i * 4);
    }
  }
  return offsets;
}

function parseHmtx(hmtx, numGlyphs, numHMetrics) {
  const metrics = new Array(numGlyphs);
  const lastAdvance = hmtx.readUInt16BE((numHMetrics - 1) * 4);
  let cursor = numHMetrics * 4;
  for (let i = 0; i < numGlyphs; i++) {
    if (i < numHMetrics) {
      metrics[i] = {
        advanceWidth: hmtx.readUInt16BE(i * 4),
        lsb: hmtx.readInt16BE(i * 4 + 2),
      };
    } else {
      metrics[i] = {
        advanceWidth: lastAdvance,
        lsb: cursor + 2 <= hmtx.length ? hmtx.readInt16BE(cursor) : 0,
      };
      cursor += 2;
    }
  }
  return metrics;
}

function parseCmap(cmap) {
  const numSubtables = cmap.readUInt16BE(2);
  const charToGid = new Map();

  // Collect all subtables (prefer Unicode format 4 & 12)
  for (let i = 0; i < numSubtables; i++) {
    const recOff = 4 + i * 8;
    const platformId = cmap.readUInt16BE(recOff);
    const encodingId = cmap.readUInt16BE(recOff + 2);
    const subOff = cmap.readUInt32BE(recOff + 4);
    if (!((platformId === 3 && (encodingId === 1 || encodingId === 10)) || platformId === 0)) {
      continue;
    }
    const format = cmap.readUInt16BE(subOff);
    if (format === 4) {
      const segCount = cmap.readUInt16BE(subOff + 6) / 2;
      const endCodesOff = subOff + 14;
      const startCodesOff = endCodesOff + segCount * 2 + 2;
      const idDeltasOff = startCodesOff + segCount * 2;
      const idRangeOffsetsOff = idDeltasOff + segCount * 2;
      for (let s = 0; s < segCount; s++) {
        const endCode = cmap.readUInt16BE(endCodesOff + s * 2);
        const startCode = cmap.readUInt16BE(startCodesOff + s * 2);
        if (startCode === 0xffff && endCode === 0xffff) continue;
        const idDelta = cmap.readInt16BE(idDeltasOff + s * 2);
        const idRangeOffset = cmap.readUInt16BE(idRangeOffsetsOff + s * 2);
        for (let cp = startCode; cp <= endCode; cp++) {
          let gid = 0;
          if (idRangeOffset === 0) {
            gid = (cp + idDelta) & 0xffff;
          } else {
            const addr = idRangeOffsetsOff + s * 2 + idRangeOffset + (cp - startCode) * 2;
            const raw = cmap.readUInt16BE(addr);
            gid = raw === 0 ? 0 : (raw + idDelta) & 0xffff;
          }
          if (gid !== 0 && !charToGid.has(cp)) {
            charToGid.set(cp, gid);
          }
        }
      }
    } else if (format === 12) {
      const numGroups = cmap.readUInt32BE(subOff + 12);
      for (let g = 0; g < numGroups; g++) {
        const gOff = subOff + 16 + g * 12;
        const startCharCode = cmap.readUInt32BE(gOff);
        const endCharCode = cmap.readUInt32BE(gOff + 4);
        const startGlyphId = cmap.readUInt32BE(gOff + 8);
        for (let cp = startCharCode; cp <= endCharCode; cp++) {
          const gid = startGlyphId + (cp - startCharCode);
          if (gid !== 0) {
            charToGid.set(cp, gid);
          }
        }
      }
    }
  }
  return charToGid;
}

function buildCmapFormat4(bmpEntries) {
  // Build contiguous segments where gid - cp is constant
  const sorted = [...bmpEntries].sort((a, b) => a[0] - b[0]);
  const segments = [];
  for (const [cp, gid] of sorted) {
    const delta = (gid - cp) & 0xffff;
    const prev = segments[segments.length - 1];
    if (prev && prev.end + 1 === cp && prev.delta === delta) {
      prev.end = cp;
    } else {
      segments.push({ start: cp, end: cp, delta });
    }
  }
  segments.push({ start: 0xffff, end: 0xffff, delta: 1 });

  const segCount = segments.length;
  const segCountX2 = segCount * 2;
  const maxPow2 = 1 << Math.floor(Math.log2(segCount));
  const searchRange = maxPow2 * 2;
  const entrySelector = Math.floor(Math.log2(segCount));
  const rangeShift = segCountX2 - searchRange;

  const length = 14 + segCount * 8 + 2;
  const buf = Buffer.alloc(length);
  buf.writeUInt16BE(4, 0); // format
  buf.writeUInt16BE(length, 2);
  buf.writeUInt16BE(0, 4); // language
  buf.writeUInt16BE(segCountX2, 6);
  buf.writeUInt16BE(searchRange, 8);
  buf.writeUInt16BE(entrySelector, 10);
  buf.writeUInt16BE(rangeShift, 12);

  const endOff = 14;
  const reservedOff = endOff + segCount * 2;
  buf.writeUInt16BE(0, reservedOff);
  const startOff = reservedOff + 2;
  const deltaOff = startOff + segCount * 2;
  const rangeOff = deltaOff + segCount * 2;

  for (let i = 0; i < segCount; i++) {
    const seg = segments[i];
    buf.writeUInt16BE(seg.end, endOff + i * 2);
    buf.writeUInt16BE(seg.start, startOff + i * 2);
    buf.writeUInt16BE(seg.delta & 0xffff, deltaOff + i * 2);
    buf.writeUInt16BE(0, rangeOff + i * 2);
  }
  return buf;
}

function buildCmapFormat12(allEntries) {
  const sorted = [...allEntries].sort((a, b) => a[0] - b[0]);
  const groups = [];
  for (const [cp, gid] of sorted) {
    const prev = groups[groups.length - 1];
    if (prev && prev.end + 1 === cp && prev.startGid + (cp - prev.start) === gid) {
      prev.end = cp;
    } else {
      groups.push({ start: cp, end: cp, startGid: gid });
    }
  }
  const length = 16 + groups.length * 12;
  const buf = Buffer.alloc(length);
  buf.writeUInt16BE(12, 0);
  buf.writeUInt16BE(0, 2);
  buf.writeUInt32BE(length, 4);
  buf.writeUInt32BE(0, 8);
  buf.writeUInt32BE(groups.length, 12);
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const off = 16 + i * 12;
    buf.writeUInt32BE(g.start, off);
    buf.writeUInt32BE(g.end, off + 4);
    buf.writeUInt32BE(g.startGid, off + 8);
  }
  return buf;
}

function buildCmapTable(charToGid) {
  const allEntries = [...charToGid.entries()].filter(([cp]) => cp >= 0 && cp <= 0x10ffff);
  const bmpEntries = allEntries.filter(([cp]) => cp <= 0xffff);
  const hasNonBmp = allEntries.some(([cp]) => cp > 0xffff);

  const fmt4 = buildCmapFormat4(bmpEntries);
  const fmt12 = hasNonBmp ? buildCmapFormat12(allEntries) : null;

  // Encoding records:
  // (0, 3) -> fmt4
  // (3, 1) -> fmt4
  // plus (0, 4) & (3, 10) -> fmt12 when non-BMP codepoints exist
  const records = [
    { platformId: 0, encodingId: 3, subtable: fmt4 },
    { platformId: 3, encodingId: 1, subtable: fmt4 },
  ];
  if (fmt12) {
    records.push({ platformId: 0, encodingId: 4, subtable: fmt12 });
    records.push({ platformId: 3, encodingId: 10, subtable: fmt12 });
  }

  const headerSize = 4 + records.length * 8;
  const fmt4Off = headerSize;
  const fmt12Off = fmt4Off + fmt4.length;
  const totalLen = headerSize + fmt4.length + (fmt12 ? fmt12.length : 0);

  const out = Buffer.alloc(totalLen);
  out.writeUInt16BE(0, 0); // version
  out.writeUInt16BE(records.length, 2);

  records.forEach((rec, i) => {
    const rOff = 4 + i * 8;
    out.writeUInt16BE(rec.platformId, rOff);
    out.writeUInt16BE(rec.encodingId, rOff + 2);
    out.writeUInt32BE(rec.subtable === fmt4 ? fmt4Off : fmt12Off, rOff + 4);
  });

  fmt4.copy(out, fmt4Off);
  if (fmt12) fmt12.copy(out, fmt12Off);
  return out;
}

function parsePostFormat2(postBuf, numGlyphs) {
  const version = postBuf.readUInt32BE(0);
  if (version !== 0x00020000) return null;
  const count = postBuf.readUInt16BE(32);
  const indices = [];
  for (let i = 0; i < Math.min(count, numGlyphs); i++) {
    indices.push(postBuf.readUInt16BE(34 + i * 2));
  }
  const extraStrings = [];
  let cursor = 34 + count * 2;
  while (cursor < postBuf.length) {
    const len = postBuf[cursor];
    cursor += 1;
    if (cursor + len > postBuf.length) break;
    extraStrings.push(postBuf.toString('latin1', cursor, cursor + len));
    cursor += len;
  }
  return {
    header: Buffer.from(postBuf.subarray(0, 32)),
    indices,
    extraStrings,
  };
}

function buildPostFormat2(basePost, totalGlyphs, addedNames) {
  const indices = [...basePost.indices];
  const extraStrings = [...basePost.extraStrings];
  while (indices.length < basePost.indices.length) {
    indices.push(0);
  }
  for (const name of addedNames) {
    const idx = 258 + extraStrings.length;
    extraStrings.push(name);
    indices.push(idx);
  }
  while (indices.length < totalGlyphs) {
    indices.push(0);
  }

  const stringBytes = extraStrings.reduce((acc, s) => acc + 1 + Buffer.byteLength(s, 'latin1'), 0);
  const out = Buffer.alloc(34 + totalGlyphs * 2 + stringBytes);
  basePost.header.copy(out, 0, 0, 32);
  out.writeUInt16BE(totalGlyphs, 32);
  for (let i = 0; i < totalGlyphs; i++) {
    out.writeUInt16BE(indices[i] ?? 0, 34 + i * 2);
  }
  let cursor = 34 + totalGlyphs * 2;
  for (const s of extraStrings) {
    const bytes = Buffer.from(s, 'latin1');
    const len = Math.min(255, bytes.length);
    out[cursor] = len;
    bytes.copy(out, cursor + 1, 0, len);
    cursor += 1 + len;
  }
  return out;
}

function rewriteNameTable(nameBuf, replaceFromList, familyName) {
  if (!replaceFromList || replaceFromList.length === 0) return nameBuf;
  const format = nameBuf.readUInt16BE(0);
  const count = nameBuf.readUInt16BE(2);
  const stringOffset = nameBuf.readUInt16BE(4);
  const records = [];

  for (let i = 0; i < count; i++) {
    const recOff = 6 + i * 12;
    const platformId = nameBuf.readUInt16BE(recOff);
    const encodingId = nameBuf.readUInt16BE(recOff + 2);
    const languageId = nameBuf.readUInt16BE(recOff + 4);
    const nameId = nameBuf.readUInt16BE(recOff + 6);
    const len = nameBuf.readUInt16BE(recOff + 8);
    const off = nameBuf.readUInt16BE(recOff + 10);
    const raw = Buffer.from(nameBuf.subarray(stringOffset + off, stringOffset + off + len));

    const isUtf16 = platformId === 3 || platformId === 0;
    let text = isUtf16
      ? Buffer.from(raw).swap16().toString('utf16le')
      : raw.toString('latin1');

    if ([1, 3, 4, 6, 16, 18, 21].includes(nameId)) {
      for (const target of replaceFromList) {
        const noSpaceFamily = familyName.replace(/\s+/g, '');
        const replacement = target.includes(' ') ? familyName : noSpaceFamily;
        text = text.split(target).join(replacement);
      }
    }

    const encoded = isUtf16
      ? Buffer.from(text, 'utf16le').swap16()
      : Buffer.from(text, 'latin1');

    records.push({ platformId, encodingId, languageId, nameId, encoded });
  }

  const headerSize = 6 + records.length * 12;
  const storageSize = records.reduce((sum, r) => sum + r.encoded.length, 0);
  const extraTail = format === 1 ? Buffer.from(nameBuf.subarray(6 + count * 12, stringOffset)) : Buffer.alloc(0);
  const finalStorageOffset = headerSize + extraTail.length;
  const out = Buffer.alloc(finalStorageOffset + storageSize);

  out.writeUInt16BE(format, 0);
  out.writeUInt16BE(records.length, 2);
  out.writeUInt16BE(finalStorageOffset, 4);

  let cursor = 0;
  records.forEach((rec, i) => {
    const recOff = 6 + i * 12;
    out.writeUInt16BE(rec.platformId, recOff);
    out.writeUInt16BE(rec.encodingId, recOff + 2);
    out.writeUInt16BE(rec.languageId, recOff + 4);
    out.writeUInt16BE(rec.nameId, recOff + 6);
    out.writeUInt16BE(rec.encoded.length, recOff + 8);
    out.writeUInt16BE(cursor, recOff + 10);
    rec.encoded.copy(out, finalStorageOffset + cursor);
    cursor += rec.encoded.length;
  });

  if (extraTail.length > 0) {
    extraTail.copy(out, headerSize);
  }
  return out;
}

function pad4(buf) {
  const rem = buf.length % 4;
  if (rem === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - rem)]);
}

function assembleSfnt(tablesMap) {
  const tags = [...tablesMap.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const numTables = tags.length;
  const maxPow2 = 1 << Math.floor(Math.log2(numTables));
  const searchRange = maxPow2 * 16;
  const entrySelector = Math.floor(Math.log2(numTables));
  const rangeShift = numTables * 16 - searchRange;

  const headerAndDirSize = 12 + numTables * 16;
  let totalSize = headerAndDirSize;
  const tableData = new Map();
  for (const tag of tags) {
    const raw = tablesMap.get(tag);
    if (tag === 'head') {
      // Zero checkSumAdjustment before computing checksums
      raw.writeUInt32BE(0, 8);
    }
    const padded = pad4(raw);
    tableData.set(tag, { raw, padded, offset: totalSize, checksum: calcTableChecksum(raw) });
    totalSize += padded.length;
  }

  const out = Buffer.alloc(totalSize);
  out.writeUInt32BE(0x00010000, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(rangeShift, 10);

  tags.forEach((tag, i) => {
    const info = tableData.get(tag);
    const rec = 12 + i * 16;
    out.write(tag, rec, 4, 'ascii');
    out.writeUInt32BE(info.checksum, rec + 4);
    out.writeUInt32BE(info.offset, rec + 8);
    out.writeUInt32BE(info.raw.length, rec + 12);
    info.padded.copy(out, info.offset);
  });

  const headInfo = tableData.get('head');
  const fullChecksum = calcTableChecksum(out);
  const checkSumAdjustment = (0xb1b0afba - fullChecksum) >>> 0;
  out.writeUInt32BE(checkSumAdjustment, headInfo.offset + 8);

  return out;
}

// ================= Font Merger (Arabic Base + Latin Subsets) =================

function mergeTrueTypeSubsets(baseBuf, extraBufs, options) {
  const baseTables = parseSfnt(baseBuf, `${options.label}:arabic`);
  const baseHead = parseHead(baseTables.get('head'));
  const baseMaxp = parseMaxp(baseTables.get('maxp'));
  const baseNumHMetrics = baseTables.get('hhea').readUInt16BE(34);

  const baseLoca = parseLoca(
    baseTables.get('loca'),
    baseMaxp.numGlyphs,
    baseHead.indexToLocFormat
  );
  const baseGlyf = baseTables.get('glyf');
  const baseHmtx = parseHmtx(baseTables.get('hmtx'), baseMaxp.numGlyphs, baseNumHMetrics);
  const charToGid = parseCmap(baseTables.get('cmap'));

  const glyphSlices = [];
  for (let g = 0; g < baseMaxp.numGlyphs; g++) {
    const slice = Buffer.from(baseGlyf.subarray(baseLoca[g], baseLoca[g + 1]));
    glyphSlices.push(pad4(slice));
  }
  const hmtxEntries = [...baseHmtx];

  const basePostVer = baseTables.get('post').readUInt32BE(0);
  const parsedPost2 = basePostVer === 0x00020000
    ? parsePostFormat2(baseTables.get('post'), baseMaxp.numGlyphs)
    : null;
  const addedGlyphNames = [];

  const mergedMaxp = { ...baseMaxp };
  const os2Out = Buffer.from(baseTables.get('OS/2'));
  let unicodeRange1 = os2Out.readUInt32BE(42);
  let unicodeRange2 = os2Out.readUInt32BE(46);
  let unicodeRange3 = os2Out.readUInt32BE(50);
  let unicodeRange4 = os2Out.readUInt32BE(54);

  for (const extra of extraBufs) {
    const extTables = parseSfnt(extra.buf, `${options.label}:${extra.subset}`);
    const extHead = parseHead(extTables.get('head'));
    if (extHead.unitsPerEm !== baseHead.unitsPerEm) {
      throw new Error(
        `[${options.label}] unitsPerEm mismatch between arabic (${baseHead.unitsPerEm}) and ${extra.subset} (${extHead.unitsPerEm})`
      );
    }
    const extMaxp = parseMaxp(extTables.get('maxp'));
    const extNumHMetrics = extTables.get('hhea').readUInt16BE(34);
    const extLoca = parseLoca(extTables.get('loca'), extMaxp.numGlyphs, extHead.indexToLocFormat);
    const extGlyf = extTables.get('glyf');
    const extHmtx = parseHmtx(extTables.get('hmtx'), extMaxp.numGlyphs, extNumHMetrics);
    const extCmap = parseCmap(extTables.get('cmap'));

    const extOs2 = extTables.get('OS/2');
    unicodeRange1 = (unicodeRange1 | extOs2.readUInt32BE(42)) >>> 0;
    unicodeRange2 = (unicodeRange2 | extOs2.readUInt32BE(46)) >>> 0;
    unicodeRange3 = (unicodeRange3 | extOs2.readUInt32BE(50)) >>> 0;
    unicodeRange4 = (unicodeRange4 | extOs2.readUInt32BE(54)) >>> 0;

    mergedMaxp.maxPoints = Math.max(mergedMaxp.maxPoints, extMaxp.maxPoints);
    mergedMaxp.maxContours = Math.max(mergedMaxp.maxContours, extMaxp.maxContours);
    mergedMaxp.maxCompositePoints = Math.max(mergedMaxp.maxCompositePoints, extMaxp.maxCompositePoints);
    mergedMaxp.maxCompositeContours = Math.max(mergedMaxp.maxCompositeContours, extMaxp.maxCompositeContours);
    mergedMaxp.maxComponentElements = Math.max(mergedMaxp.maxComponentElements, extMaxp.maxComponentElements);
    mergedMaxp.maxComponentDepth = Math.max(mergedMaxp.maxComponentDepth, extMaxp.maxComponentDepth);

    const srcToDstGid = new Map();

    const copyGlyphRecursive = (srcGid, hintName) => {
      if (srcToDstGid.has(srcGid)) return srcToDstGid.get(srcGid);
      const dstGid = glyphSlices.length;
      srcToDstGid.set(srcGid, dstGid);

      const raw = Buffer.from(extGlyf.subarray(extLoca[srcGid], extLoca[srcGid + 1]));
      glyphSlices.push(pad4(raw));
      hmtxEntries.push(extHmtx[srcGid] ?? { advanceWidth: 0, lsb: 0 });
      addedGlyphNames.push(hintName || `gid_${dstGid}`);

      // If composite glyph (numberOfContours === -1), recursively copy & remap component GIDs
      if (raw.length >= 10 && raw.readInt16BE(0) === -1) {
        let pos = 10;
        let hasMore = true;
        while (hasMore && pos + 4 <= raw.length) {
          const flags = raw.readUInt16BE(pos);
          const compSrcGid = raw.readUInt16BE(pos + 2);
          const compDstGid = copyGlyphRecursive(compSrcGid, `comp_${compSrcGid}_${dstGid}`);
          raw.writeUInt16BE(compDstGid, pos + 2);

          pos += 4;
          pos += flags & 0x0001 ? 4 : 2; // ARG_1_AND_2_ARE_WORDS
          if (flags & 0x0008) pos += 2; // WE_HAVE_A_SCALE
          else if (flags & 0x0040) pos += 4; // WE_HAVE_AN_X_AND_Y_SCALE
          else if (flags & 0x0080) pos += 8; // WE_HAVE_A_TWO_BY_TWO
          hasMore = Boolean(flags & 0x0020); // MORE_COMPONENTS
        }
        glyphSlices[dstGid] = pad4(raw);
      }

      return dstGid;
    };

    for (const [cp, srcGid] of extCmap.entries()) {
      if (charToGid.has(cp)) continue;
      const dstGid = copyGlyphRecursive(
        srcGid,
        `uni${cp.toString(16).toUpperCase().padStart(4, '0')}`
      );
      charToGid.set(cp, dstGid);
    }
  }

  const totalGlyphs = glyphSlices.length;

  // Build new glyf + long loca (format 1)
  const glyfOut = Buffer.concat(glyphSlices);
  const locaOut = Buffer.alloc((totalGlyphs + 1) * 4);
  let glyfCursor = 0;
  for (let i = 0; i < totalGlyphs; i++) {
    locaOut.writeUInt32BE(glyfCursor, i * 4);
    glyfCursor += glyphSlices[i].length;
  }
  locaOut.writeUInt32BE(glyfCursor, totalGlyphs * 4);

  // Build hmtx & update hhea.numberOfHMetrics
  const hmtxOut = Buffer.alloc(totalGlyphs * 4);
  for (let i = 0; i < totalGlyphs; i++) {
    hmtxOut.writeUInt16BE(hmtxEntries[i].advanceWidth & 0xffff, i * 4);
    hmtxOut.writeInt16BE(hmtxEntries[i].lsb, i * 4 + 2);
  }
  const hheaOut = Buffer.from(baseTables.get('hhea'));
  hheaOut.writeUInt16BE(totalGlyphs, 34);

  // Update head.indexToLocFormat = 1 (long offsets)
  const headOut = Buffer.from(baseTables.get('head'));
  headOut.writeInt16BE(1, 50);

  // Update maxp
  const maxpOut = Buffer.from(baseTables.get('maxp'));
  maxpOut.writeUInt16BE(totalGlyphs, 4);
  if (maxpOut.length >= 32) {
    maxpOut.writeUInt16BE(mergedMaxp.maxPoints, 6);
    maxpOut.writeUInt16BE(mergedMaxp.maxContours, 8);
    maxpOut.writeUInt16BE(mergedMaxp.maxCompositePoints, 10);
    maxpOut.writeUInt16BE(mergedMaxp.maxCompositeContours, 12);
    maxpOut.writeUInt16BE(mergedMaxp.maxComponentElements, 28);
    maxpOut.writeUInt16BE(mergedMaxp.maxComponentDepth, 30);
  }

  // Update OS/2 unicode ranges & first/last char indices while preserving fsType = 0
  const allCodepoints = [...charToGid.keys()];
  const minCp = Math.min(...allCodepoints);
  const maxCp = Math.min(0xffff, Math.max(...allCodepoints));
  os2Out.writeUInt32BE(unicodeRange1, 42);
  os2Out.writeUInt32BE(unicodeRange2, 46);
  os2Out.writeUInt32BE(unicodeRange3, 50);
  os2Out.writeUInt32BE(unicodeRange4, 54);
  os2Out.writeUInt16BE(Math.max(0, minCp), 64);
  os2Out.writeUInt16BE(Math.max(0, maxCp), 66);

  const cmapOut = buildCmapTable(charToGid);

  const outTables = new Map(baseTables);
  outTables.set('head', headOut);
  outTables.set('hhea', hheaOut);
  outTables.set('maxp', maxpOut);
  outTables.set('hmtx', hmtxOut);
  outTables.set('loca', locaOut);
  outTables.set('glyf', glyfOut);
  outTables.set('cmap', cmapOut);
  outTables.set('OS/2', os2Out);

  if (parsedPost2) {
    outTables.set('post', buildPostFormat2(parsedPost2, totalGlyphs, addedGlyphNames));
  }

  if (options.normalizeFamilyFrom) {
    outTables.set(
      'name',
      rewriteNameTable(baseTables.get('name'), options.normalizeFamilyFrom, options.familyName)
    );
  }

  // Drop stale signature or vertical metrics tables that may not match expanded glyph count
  outTables.delete('DSIG');
  outTables.delete('vhea');
  outTables.delete('vmtx');

  return assembleSfnt(outTables);
}

// ================= Main Runner =================

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const spec of FONT_SPECS) {
    const pkgDir = path.join(ROOT_DIR, 'node_modules', '@fontsource', spec.pkg, 'files');

    for (const w of spec.weights) {
      const arabicFile = path.join(pkgDir, `${spec.pkg}-arabic-${w.weight}-normal.woff2`);
      const latinFile = path.join(pkgDir, `${spec.pkg}-latin-${w.weight}-normal.woff2`);
      const latinExtFile = path.join(pkgDir, `${spec.pkg}-latin-ext-${w.weight}-normal.woff2`);

      const label = `${spec.familyName} (${w.weight})`;
      const arabicWoff2 = await fs.readFile(arabicFile);
      const arabicTtf = Buffer.from(await wawoff2.decompress(arabicWoff2));

      const extraSubsets = [];
      for (const candidate of [
        { subset: 'latin', file: latinFile, required: true },
        { subset: 'latin-ext', file: latinExtFile, required: false },
      ]) {
        try {
          const woff2Bytes = await fs.readFile(candidate.file);
          const ttfBytes = Buffer.from(await wawoff2.decompress(woff2Bytes));
          extraSubsets.push({ subset: candidate.subset, buf: ttfBytes });
        } catch (err) {
          if (candidate.required) throw err;
        }
      }

      const mergedTtf = mergeTrueTypeSubsets(arabicTtf, extraSubsets, {
        label,
        familyName: spec.familyName,
        normalizeFamilyFrom: spec.normalizeFamilyFrom,
      });

      // Strict post-merge verification
      const outTables = parseSfnt(mergedTtf, `${label}:output`);
      const outCmap = parseCmap(outTables.get('cmap'));
      for (const sampleCp of [0x0627, 0x0628, 0x0645, 0x0030, 0x0039, 0x0041, 0x0028, 0x003a]) {
        if (!outCmap.has(sampleCp)) {
          throw new Error(
            `[${label}] Merged TTF is missing expected codepoint U+${sampleCp.toString(16).toUpperCase()}`
          );
        }
      }

      const outPath = path.join(OUTPUT_DIR, w.outFile);
      await fs.writeFile(outPath, mergedTtf);
      const numGlyphs = outTables.get('maxp').readUInt16BE(4);
      console.log(
        `[prepare-docx-fonts] OK ${w.outFile} (${(mergedTtf.length / 1024).toFixed(1)} KB, ${numGlyphs} glyphs, ${outCmap.size} codepoints, fsType=0)`
      );
    }
  }
}

main().catch((err) => {
  console.error('[prepare-docx-fonts] FAILED:', err?.message || err);
  process.exit(1);
});
