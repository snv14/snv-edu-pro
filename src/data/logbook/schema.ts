export type LogbookLevelCode = '1am' | '2am' | '3am' | '4am';
export type LogbookArabicLevel = '1م' | '2م' | '3م' | '4م';

export interface PedagogicalSourceFileMeta {
  level: LogbookLevelCode;
  arabicLevel: LogbookArabicLevel;
  title: string;
  pdfPath: string;
  totalPages: number;
  specifiesOfficialDurations: boolean;
  specifiesOfficialDates: boolean;
}

export interface PedagogicalUnitRecord {
  id: string;
  order: number;
  level: LogbookLevelCode;
  arabicLevel: LogbookArabicLevel;
  midan: string;
  maqta: string;
  sectionGroup?: string;
  mawrid: string;
  ta3alom: string;
  moshkila?: string;
  activities: string[];
  hasIrsaaMawrid: boolean;
  irsaaText?: string;
  taqwim?: string;
  /** Non-null only if explicitly stipulated in the official source PDF; otherwise null (teacher-configurable). */
  officialDurationSessions: number | null;
  officialWeeksCount: number | null;
  sourceFile: {
    pdfPath: string;
    sourcePage: number;
  };
}

export interface ProgressionLookupResult {
  available: boolean;
  level: LogbookLevelCode;
  arabicLevel: LogbookArabicLevel;
  source: PedagogicalSourceFileMeta | null;
  units: PedagogicalUnitRecord[];
  unavailableReason?: string;
}

export function levelCodeToArabic(code: LogbookLevelCode): LogbookArabicLevel {
  if (code === '1am') return '1م';
  if (code === '2am') return '2م';
  if (code === '3am') return '3م';
  return '4م';
}

export function arabicLevelToCode(lvl: LogbookArabicLevel | string): LogbookLevelCode | null {
  if (lvl === '1م' || lvl === '1am') return '1am';
  if (lvl === '2م' || lvl === '2am') return '2am';
  if (lvl === '3م' || lvl === '3am') return '3am';
  if (lvl === '4م' || lvl === '4am') return '4am';
  return null;
}
