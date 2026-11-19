import { CharacterSet } from 'docx';
import {
  HANDWRITING_FONTS,
  isHandwritingActiveFor,
  loadHandwritingSettings,
  type HandwritingFontId,
  type HandwritingStyleSettings,
} from '../services/handwritingStyle';

export const DOCX_FONT_FALLBACK_MESSAGE =
  'تعذر تضمين الخط في Word، سيظهر بخط بديل. لتحافظ على الخط نفسه صدّر PDF';

export interface DocxFontAssetSpec {
  id: HandwritingFontId;
  familyName: string;
  regularFile: string;
  boldFile: string;
}

export const DOCX_FONT_FILES: Record<HandwritingFontId, DocxFontAssetSpec> = {
  playpen: {
    id: 'playpen',
    familyName: HANDWRITING_FONTS.playpen.wordFontName,
    regularFile: 'PlaypenSansArabic-Regular.ttf',
    boldFile: 'PlaypenSansArabic-Bold.ttf',
  },
  harmattan: {
    id: 'harmattan',
    familyName: HANDWRITING_FONTS.harmattan.wordFontName,
    regularFile: 'Harmattan-Regular.ttf',
    boldFile: 'Harmattan-Bold.ttf',
  },
  lateef: {
    id: 'lateef',
    familyName: HANDWRITING_FONTS.lateef.wordFontName,
    regularFile: 'Lateef-Regular.ttf',
    boldFile: 'Lateef-Bold.ttf',
  },
  marhey: {
    id: 'marhey',
    familyName: HANDWRITING_FONTS.marhey.wordFontName,
    regularFile: 'Marhey-Regular.ttf',
    boldFile: 'Marhey-Bold.ttf',
  },
  tajawal: {
    id: 'tajawal',
    familyName: HANDWRITING_FONTS.tajawal.wordFontName,
    regularFile: 'Tajawal-Regular.ttf',
    boldFile: 'Tajawal-Bold.ttf',
  },
  cairo: {
    id: 'cairo',
    familyName: HANDWRITING_FONTS.cairo.wordFontName,
    regularFile: 'Cairo-Regular.ttf',
    boldFile: 'Cairo-Bold.ttf',
  },
};

export type DocxFontEmbedFailureReason =
  | 'missing_file'
  | 'fetch_failed'
  | 'invalid_ttf'
  | 'restricted_fstype';

export class DocxFontEmbedError extends Error {
  readonly reason: DocxFontEmbedFailureReason;
  readonly fontId: HandwritingFontId;
  readonly fontName: string;
  readonly fallbackFontName: string;
  readonly userMessage: string;

  constructor(args: {
    reason: DocxFontEmbedFailureReason;
    fontId: HandwritingFontId;
    fontName: string;
    fallbackFontName: string;
    details?: string;
  }) {
    super(args.details || DOCX_FONT_FALLBACK_MESSAGE);
    this.name = 'DocxFontEmbedError';
    this.reason = args.reason;
    this.fontId = args.fontId;
    this.fontName = args.fontName;
    this.fallbackFontName = args.fallbackFontName;
    this.userMessage = DOCX_FONT_FALLBACK_MESSAGE;
  }
}

export interface DocxEmbeddedFontEntry {
  name: string;
  data: Buffer;
  bold?: Buffer;
  characterSet: (typeof CharacterSet)[keyof typeof CharacterSet];
}

export interface DocxFontAttrs {
  ascii: string;
  hAnsi: string;
  cs: string;
  hint: string;
}

export interface PreparedDocxFonts {
  fontId: HandwritingFontId;
  wordFont: string;
  fontAttrs: DocxFontAttrs;
  fonts: DocxEmbeddedFontEntry[];
  regularEmbedded: boolean;
  boldEmbedded: boolean;
  usedFallback: boolean;
}

export interface PrepareDocxFontsOptions {
  settings?: HandwritingStyleSettings;
  area?: 'memos' | 'logbook' | 'general' | 'all';
  allowFallback?: boolean;
  fontLoader?: (filename: string) => Promise<Uint8Array>;
}

const fontBytesCache = new Map<string, Uint8Array>();

function toDocxBinaryBuffer(bytes: Uint8Array): Buffer {
  if (typeof Buffer !== 'undefined') {
    return Buffer.isBuffer(bytes)
      ? bytes
      : Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  return bytes as unknown as Buffer;
}

export function validateTrueTypeFontBytes(
  bytes: Uint8Array,
  context: { fontId: HandwritingFontId; fontName: string; fallbackFontName: string; label: string }
): { sfntVersion: number; fsType: number } {
  if (!bytes || bytes.byteLength < 12) {
    throw new DocxFontEmbedError({
      reason: 'invalid_ttf',
      fontId: context.fontId,
      fontName: context.fontName,
      fallbackFontName: context.fallbackFontName,
      details: `[${context.label}] ملف الخط فارغ أو غير مكتمل.`,
    });
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sfntVersion = view.getUint32(0, false);
  if (sfntVersion !== 0x00010000) {
    throw new DocxFontEmbedError({
      reason: 'invalid_ttf',
      fontId: context.fontId,
      fontName: context.fontName,
      fallbackFontName: context.fallbackFontName,
      details: `[${context.label}] صيغة الخط ليست TrueType صالحة (0x${sfntVersion.toString(16)}).`,
    });
  }

  const numTables = view.getUint16(4, false);
  if (bytes.byteLength < 12 + numTables * 16) {
    throw new DocxFontEmbedError({
      reason: 'invalid_ttf',
      fontId: context.fontId,
      fontName: context.fontName,
      fallbackFontName: context.fallbackFontName,
      details: `[${context.label}] جدول الخط TrueType تالف.`,
    });
  }

  let hasGlyf = false;
  let hasCff = false;
  let os2Offset = -1;
  let os2Length = 0;

  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(
      bytes[rec],
      bytes[rec + 1],
      bytes[rec + 2],
      bytes[rec + 3]
    );
    const offset = view.getUint32(rec + 8, false);
    const length = view.getUint32(rec + 12, false);
    if (tag === 'glyf') hasGlyf = true;
    if (tag === 'CFF ' || tag === 'CFF2') hasCff = true;
    if (tag === 'OS/2') {
      os2Offset = offset;
      os2Length = length;
    }
  }

  if (!hasGlyf || hasCff || os2Offset < 0 || os2Offset + 10 > bytes.byteLength || os2Length < 10) {
    throw new DocxFontEmbedError({
      reason: 'invalid_ttf',
      fontId: context.fontId,
      fontName: context.fontName,
      fallbackFontName: context.fallbackFontName,
      details: `[${context.label}] الخط لا يحتوي جداول TrueType (glyf / OS/2) المطلوبة لتضمين Word.`,
    });
  }

  const fsType = view.getUint16(os2Offset + 8, false);
  if (fsType !== 0) {
    throw new DocxFontEmbedError({
      reason: 'restricted_fstype',
      fontId: context.fontId,
      fontName: context.fontName,
      fallbackFontName: context.fallbackFontName,
      details: `[${context.label}] إذن التضمين OS/2 fsType=${fsType} يمنع التضمين الحر (المطلوب 0).`,
    });
  }

  return { sfntVersion, fsType };
}

async function defaultLoadFontBytes(
  filename: string,
  context: { fontId: HandwritingFontId; fontName: string; fallbackFontName: string }
): Promise<Uint8Array> {
  const cached = fontBytesCache.get(filename);
  if (cached) return cached;

  let loaded: Uint8Array;
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    const baseUrl =
      typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL
        ? (import.meta as unknown as { env?: { BASE_URL?: string } }).env!.BASE_URL!
        : '/';
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const url = `${normalizedBase}fonts/${filename}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new DocxFontEmbedError({
        reason: 'fetch_failed',
        fontId: context.fontId,
        fontName: context.fontName,
        fallbackFontName: context.fallbackFontName,
        details: `تعذر جلب ملف الخط (${filename}) من المسار ${url}.`,
      });
    }

    if (!response.ok) {
      throw new DocxFontEmbedError({
        reason: response.status === 404 ? 'missing_file' : 'fetch_failed',
        fontId: context.fontId,
        fontName: context.fontName,
        fallbackFontName: context.fallbackFontName,
        details: `ملف الخط غير متوفر (${filename}: HTTP ${response.status}).`,
      });
    }

    loaded = new Uint8Array(await response.arrayBuffer());
  } else {
    const fsModName = 'node:fs/promises';
    const pathModName = 'node:path';
    const fsPromises = (await import(/* @vite-ignore */ fsModName)) as typeof import('node:fs/promises');
    const pathMod = (await import(/* @vite-ignore */ pathModName)) as typeof import('node:path');
    const fontPath = pathMod.resolve(process.cwd(), 'public', 'fonts', filename);
    try {
      const buf = await fsPromises.readFile(fontPath);
      loaded = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      throw new DocxFontEmbedError({
        reason: code === 'ENOENT' ? 'missing_file' : 'fetch_failed',
        fontId: context.fontId,
        fontName: context.fontName,
        fallbackFontName: context.fallbackFontName,
        details: `ملف الخط غير موجود على القرص (${fontPath}). شغّل npm run prepare:fonts.`,
      });
    }
  }

  fontBytesCache.set(filename, loaded);
  return loaded;
}

export function resolveExportFontId(
  settings: HandwritingStyleSettings = loadHandwritingSettings(),
  area: 'memos' | 'logbook' | 'general' | 'all' = 'all'
): HandwritingFontId {
  const active = area === 'all' ? settings.enabled : isHandwritingActiveFor(area, settings);
  if (!active) return 'cairo';
  return settings.fontId in HANDWRITING_FONTS ? settings.fontId : 'playpen';
}

export function buildDocxFontAttrs(fontName: string): DocxFontAttrs {
  return {
    ascii: fontName,
    hAnsi: fontName,
    cs: fontName,
    hint: 'cs',
  };
}

/**
 * Prepares the selected font (Regular + Bold TrueType `.ttf` files) for
 * mandatory embedding inside exported `.docx` documents.
 *
 * Throws `DocxFontEmbedError` unless `allowFallback: true` was explicitly
 * confirmed by the user.
 */
export async function prepareDocxFonts(
  options: PrepareDocxFontsOptions = {}
): Promise<PreparedDocxFonts> {
  const settings = options.settings ?? loadHandwritingSettings();
  const area = options.area ?? 'all';
  const fontId = resolveExportFontId(settings, area);
  const fontMeta = HANDWRITING_FONTS[fontId] || HANDWRITING_FONTS.playpen;
  const spec = DOCX_FONT_FILES[fontId] || DOCX_FONT_FILES.playpen;
  const fallbackFontName = fontMeta.wordArabicFallback;

  const loadBytes = (filename: string) =>
    options.fontLoader
      ? options.fontLoader(filename)
      : defaultLoadFontBytes(filename, {
          fontId,
          fontName: spec.familyName,
          fallbackFontName,
        });

  try {
    const [regularBytes, boldBytes] = await Promise.all([
      loadBytes(spec.regularFile),
      loadBytes(spec.boldFile),
    ]);

    validateTrueTypeFontBytes(regularBytes, {
      fontId,
      fontName: spec.familyName,
      fallbackFontName,
      label: spec.regularFile,
    });
    validateTrueTypeFontBytes(boldBytes, {
      fontId,
      fontName: spec.familyName,
      fallbackFontName,
      label: spec.boldFile,
    });

    const regularBuf = toDocxBinaryBuffer(regularBytes);
    const boldBuf = toDocxBinaryBuffer(boldBytes);

    return {
      fontId,
      wordFont: spec.familyName,
      fontAttrs: buildDocxFontAttrs(spec.familyName),
      fonts: [
        {
          name: spec.familyName,
          data: regularBuf,
          bold: boldBuf,
          characterSet: CharacterSet.ARABIC,
        },
      ],
      regularEmbedded: true,
      boldEmbedded: true,
      usedFallback: false,
    };
  } catch (err) {
    const embedError =
      err instanceof DocxFontEmbedError
        ? err
        : new DocxFontEmbedError({
            reason: 'fetch_failed',
            fontId,
            fontName: spec.familyName,
            fallbackFontName,
            details: err instanceof Error ? err.message : String(err),
          });

    if (options.allowFallback === true) {
      return {
        fontId,
        wordFont: fallbackFontName,
        fontAttrs: buildDocxFontAttrs(fallbackFontName),
        fonts: [],
        regularEmbedded: false,
        boldEmbedded: false,
        usedFallback: true,
      };
    }

    throw embedError;
  }
}
