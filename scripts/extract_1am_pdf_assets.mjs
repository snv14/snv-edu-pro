import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const PDF_PATH = path.resolve('public/assets/aistudio/________________________________e6f4ebb9.pdf');
const OUT_DIR = path.resolve('public/assets/1am_archive');
const MANIFEST_PATH = path.resolve('src/data/archive1am/extractedImagesManifest.json');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

// Minimal pure-Node PNG writer (no external native deps needed)
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(width, height, colorType, pixelBytes) {
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const rowLen = width * bpp;
  const scanlines = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    scanlines[y * (rowLen + 1)] = 0; // Filter None
    const srcOff = y * rowLen;
    if (srcOff + rowLen <= pixelBytes.length) {
      pixelBytes.copy(scanlines, y * (rowLen + 1) + 1, srcOff, srcOff + rowLen);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType; // 0=Gray, 2=RGB, 6=RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(scanlines, { level: 6 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Parse PDF
const buf = fs.readFileSync(PDF_PATH);
const text = buf.toString('latin1');

const objs = new Map();
const objRegex = /(\d+)\s+\d+\s+obj\b/g;
let m;
const starts = [];
while ((m = objRegex.exec(text)) !== null) {
  starts.push({ id: Number(m[1]), pos: m.index + m[0].length });
}
for (let i = 0; i < starts.length; i++) {
  const s = starts[i].pos;
  const endIdx = text.indexOf('endobj', s);
  objs.set(starts[i].id, { raw: text.slice(s, endIdx), byteStart: s, byteEnd: endIdx });
}

for (const [, o] of [...objs.entries()]) {
  if (!/\/Type\s*\/ObjStm\b/.test(o.raw)) continue;
  const n = Number(o.raw.match(/\/N\s+(\d+)/)?.[1] || 0);
  const first = Number(o.raw.match(/\/First\s+(\d+)/)?.[1] || 0);
  const sm = o.raw.match(/stream\r?\n/);
  const em = o.raw.lastIndexOf('endstream');
  if (!sm || em < 0) continue;
  const rawBytes = buf.subarray(o.byteStart + sm.index + sm[0].length, o.byteStart + em);
  try {
    const dec = zlib.inflateSync(rawBytes).toString('latin1');
    const header = dec.slice(0, first).trim().split(/\s+/).map(Number);
    const body = dec.slice(first);
    for (let j = 0; j < n; j++) {
      const objId = header[j * 2];
      const off = header[j * 2 + 1];
      const nextOff = j + 1 < n ? header[(j + 1) * 2 + 1] : body.length;
      objs.set(objId, { raw: body.slice(off, nextOff), fromStm: true });
    }
  } catch {
    // skip unreadable ObjStm
  }
}

const pagesOrder = [];
function walkPages(id) {
  const o = objs.get(id);
  if (!o) return;
  const raw = o.raw;
  if (/\/Type\s*\/Pages\b/.test(raw)) {
    const kidsMatch = raw.match(/\/Kids\s*\[([^\]]+)\]/);
    if (kidsMatch) {
      const refs = [...kidsMatch[1].matchAll(/(\d+)\s+\d+\s+R/g)].map((x) => Number(x[1]));
      for (const r of refs) walkPages(r);
    }
  } else if (/\/Type\s*\/Page\b/.test(raw)) {
    pagesOrder.push(id);
  }
}

for (const [, o] of objs) {
  if (/\/Type\s*\/Catalog\b/.test(o.raw)) {
    const pm = o.raw.match(/\/Pages\s+(\d+)\s+\d+\s+R/);
    if (pm) walkPages(Number(pm[1]));
    break;
  }
}

const smaskIds = new Set();
for (const [, o] of objs) {
  const sm = o.raw.match(/\/SMask\s+(\d+)\s+\d+\s+R/);
  if (sm) smaskIds.add(Number(sm[1]));
}

function getStreamBytes(objId) {
  const o = objs.get(objId);
  if (!o || o.fromStm) return null;
  const sm = o.raw.match(/stream\r?\n/);
  const em = o.raw.lastIndexOf('endstream');
  if (!sm || em < 0) return null;
  const start = o.byteStart + sm.index + sm[0].length;
  let end = o.byteStart + em;
  if (buf[end - 1] === 0x0a) end--;
  if (buf[end - 1] === 0x0d) end--;
  return buf.subarray(start, end);
}

function decodeImageObject(objId) {
  const o = objs.get(objId);
  if (!o) return null;
  const raw = o.raw;
  const w = Number(raw.match(/\/Width\s+(\d+)/)?.[1] || 0);
  const h = Number(raw.match(/\/Height\s+(\d+)/)?.[1] || 0);
  const bpc = Number(raw.match(/\/BitsPerComponent\s+(\d+)/)?.[1] || 8);
  const filter = raw.match(/\/Filter\s*(\[[^\]]+\]|\/[A-Za-z0-9]+)/)?.[1] || '';
  const streamBytes = getStreamBytes(objId);
  if (!streamBytes || !w || !h) return null;

  if (filter.includes('DCTDecode')) {
    return { ext: 'jpg', data: streamBytes, width: w, height: h };
  }

  if (filter.includes('FlateDecode')) {
    let decoded;
    try {
      decoded = zlib.inflateSync(streamBytes);
    } catch {
      return null;
    }

    // Handle Indexed ColorSpace [/Indexed /DeviceRGB hival lookupObj R]
    const indexedMatch = raw.match(/\/ColorSpace\s*\[\s*\/Indexed\s+\/DeviceRGB\s+(\d+)\s+(\d+)\s+\d+\s+R\s*\]/);
    if (indexedMatch && bpc === 8) {
      const lookupId = Number(indexedMatch[2]);
      const lookupStream = getStreamBytes(lookupId);
      let palette = lookupStream;
      if (palette && /\/Filter\s*\/FlateDecode/.test(objs.get(lookupId)?.raw || '')) {
        try { palette = zlib.inflateSync(palette); } catch { /* raw */ }
      }
      if (palette) {
        const rgb = Buffer.alloc(w * h * 3);
        const count = Math.min(decoded.length, w * h);
        for (let i = 0; i < count; i++) {
          const idx = decoded[i] * 3;
          rgb[i * 3] = palette[idx] ?? 0;
          rgb[i * 3 + 1] = palette[idx + 1] ?? 0;
          rgb[i * 3 + 2] = palette[idx + 2] ?? 0;
        }
        return { ext: 'png', data: encodePng(w, h, 2, rgb), width: w, height: h };
      }
    }

    // DeviceRGB + optional SMask
    if (/\/ColorSpace\s*\/DeviceRGB\b/.test(raw) && bpc === 8) {
      const smRef = raw.match(/\/SMask\s+(\d+)\s+\d+\s+R/);
      if (smRef) {
        const smBytesRaw = getStreamBytes(Number(smRef[1]));
        const smRawDict = objs.get(Number(smRef[1]))?.raw || '';
        const smW = Number(smRawDict.match(/\/Width\s+(\d+)/)?.[1] || 0);
        const smH = Number(smRawDict.match(/\/Height\s+(\d+)/)?.[1] || 0);
        if (smBytesRaw && smW === w && smH === h) {
          try {
            const alpha = zlib.inflateSync(smBytesRaw);
            const rgba = Buffer.alloc(w * h * 4);
            for (let i = 0; i < w * h; i++) {
              rgba[i * 4] = decoded[i * 3] ?? 255;
              rgba[i * 4 + 1] = decoded[i * 3 + 1] ?? 255;
              rgba[i * 4 + 2] = decoded[i * 3 + 2] ?? 255;
              rgba[i * 4 + 3] = alpha[i] ?? 255;
            }
            return { ext: 'png', data: encodePng(w, h, 6, rgba), width: w, height: h };
          } catch { /* fallback to RGB */ }
        }
      }
      if (decoded.length >= w * h * 3) {
        return { ext: 'png', data: encodePng(w, h, 2, decoded), width: w, height: h };
      }
    }

    if (/\/ColorSpace\s*\/DeviceGray\b/.test(raw) && bpc === 8 && decoded.length >= w * h) {
      return { ext: 'png', data: encodePng(w, h, 0, decoded), width: w, height: h };
    }
  }

  return null;
}

function collectXObjImages(resIdOrRaw, visited = new Set()) {
  let resRaw = typeof resIdOrRaw === 'number' ? (objs.get(resIdOrRaw)?.raw || '') : resIdOrRaw;
  const resRef = resRaw.match(/\/Resources\s+(\d+)\s+\d+\s+R/);
  if (resRef) resRaw = objs.get(Number(resRef[1]))?.raw || resRaw;
  const xb = resRaw.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if (!xb) return [];
  const refs = [...xb[1].matchAll(/\/([A-Za-z0-9_.-]+)\s+(\d+)\s+\d+\s+R/g)].map((x) => ({
    name: x[1],
    id: Number(x[2]),
  }));
  const found = [];
  for (const r of refs) {
    if (visited.has(r.id)) continue;
    visited.add(r.id);
    const ir = objs.get(r.id)?.raw || '';
    if (/\/Subtype\s*\/Image/.test(ir) && !smaskIds.has(r.id)) {
      found.push(r.id);
    } else if (/\/Subtype\s*\/Form/.test(ir)) {
      found.push(...collectXObjImages(ir, visited));
    }
  }
  return found;
}

const pageImagePairs = [];
const hashCounts = new Map();
const decodedCache = new Map();

for (let p = 1; p <= pagesOrder.length; p++) {
  const imgIds = collectXObjImages(objs.get(pagesOrder[p - 1]).raw);
  for (const imgId of imgIds) {
    if (!decodedCache.has(imgId)) {
      const dec = decodeImageObject(imgId);
      if (dec) {
        const hash = crypto.createHash('sha1').update(dec.data).digest('hex').slice(0, 12);
        decodedCache.set(imgId, { ...dec, hash });
      } else {
        decodedCache.set(imgId, null);
      }
    }
    const item = decodedCache.get(imgId);
    if (!item) continue;
    hashCounts.set(item.hash, (hashCounts.get(item.hash) || 0) + 1);
    pageImagePairs.push({ page: p, objId: imgId, ...item });
  }
}

const writtenHashes = new Set();
const manifest = [];

for (let i = 0; i < pageImagePairs.length; i++) {
  const item = pageImagePairs[i];
  const repeatCount = hashCounts.get(item.hash) || 1;
  // Filter tiny spacer/bullet images < 48x48
  if (item.width < 48 && item.height < 48) continue;

  const isRepeatedBadge = repeatCount >= 4;
  const pageItems = manifest.filter((x) => x.page === item.page);
  const figIndex = pageItems.length + 1;
  const fileName = isRepeatedBadge
    ? `shared_badge_${item.hash}.${item.ext}`
    : `p${String(item.page).padStart(2, '0')}_fig${String(figIndex).padStart(2, '0')}_${item.hash}.${item.ext}`;

  if (!writtenHashes.has(item.hash)) {
    fs.writeFileSync(path.join(OUT_DIR, fileName), item.data);
    writtenHashes.add(item.hash);
  }
  // Find canonical written filename for this hash
  const existingForHash = manifest.find((m) => m.hash === item.hash);
  const finalFile = existingForHash ? existingForHash.fileName : fileName;

  manifest.push({
    id: `img_1am_p${String(item.page).padStart(2, '0')}_${figIndex}`,
    page: item.page,
    objId: item.objId,
    width: item.width,
    height: item.height,
    ext: item.ext,
    hash: item.hash,
    repeatCount,
    isRepeatedBadge,
    fileName: finalFile,
    url: `/assets/1am_archive/${finalFile}`,
  });
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
const uniqueFiles = new Set(manifest.filter((x) => !x.isRepeatedBadge).map((x) => x.fileName)).size;
const skippedTotal = pageImagePairs.filter((x) => x.width < 48 && x.height < 48).length;
console.log({
  totalOccurrences: pageImagePairs.length,
  manifestEntries: manifest.length,
  uniqueScientificAssets: uniqueFiles,
  repeatedBadgeOccurrences: manifest.filter((x) => x.isRepeatedBadge).length,
  skippedTiny: skippedTotal,
  outputDir: OUT_DIR,
});
