/**
 * قاعدة بيانات الدفتر الرقمي للأستاذ — خاصة ومعزولة تماماً عن بقية قواعد المنصة.
 *
 * تعتمد حصرياً على ملفات التدرج البيداغوجي الرسمية الأربعة المرفقة:
 *   • السنة الأولى متوسط  (1am / 1م) ← public/assets/aistudio/________1__1a954d9a.pdf
 *   • السنة الثانية متوسط (2am / 2م) ← public/assets/aistudio/_______69e62c45.pdf
 *   • السنة الثالثة متوسط (3am / 3م) ← public/assets/aistudio/_______3_3af5b876.pdf
 *   • السنة الرابعة متوسط (4am / 4م) ← public/assets/aistudio/_______4_e93589f8.pdf
 *
 * ملاحظات حوكمة البيانات:
 *   - لا تستنسخ ولا تغيّر قاعدة المنصة الموحدة (`src/data/platform/`).
 *   - لا تخلط بين السنوات ولا تختلق مدداً ساعية أو تواريخ غير منصوص عليها في ملفات التدرج.
 *   - إن لم يتوفر ملف تدرج لسنة ما، تُرجع الدالة `logbookProgressionOf` حالة عدم التوفر بوضوح دون اختلاق محتوى.
 */

export * from './schema';
export { PROGRESSION_1AM_PDF_PATH, PROGRESSION_1AM_SOURCE, PROGRESSION_1AM_UNITS } from './progression1am';
export { PROGRESSION_2AM_PDF_PATH, PROGRESSION_2AM_SOURCE, PROGRESSION_2AM_UNITS } from './progression2am';
export { PROGRESSION_3AM_PDF_PATH, PROGRESSION_3AM_SOURCE, PROGRESSION_3AM_UNITS } from './progression3am';
export { PROGRESSION_4AM_PDF_PATH, PROGRESSION_4AM_SOURCE, PROGRESSION_4AM_UNITS } from './progression4am';

import { PROGRESSION_1AM_SOURCE, PROGRESSION_1AM_UNITS } from './progression1am';
import { PROGRESSION_2AM_SOURCE, PROGRESSION_2AM_UNITS } from './progression2am';
import { PROGRESSION_3AM_SOURCE, PROGRESSION_3AM_UNITS } from './progression3am';
import { PROGRESSION_4AM_SOURCE, PROGRESSION_4AM_UNITS } from './progression4am';
import {
  arabicLevelToCode,
  levelCodeToArabic,
  type LogbookArabicLevel,
  type LogbookLevelCode,
  type PedagogicalSourceFileMeta,
  type PedagogicalUnitRecord,
  type ProgressionLookupResult,
} from './schema';

export const LOGBOOK_PROGRESSIONS: Record<LogbookLevelCode, PedagogicalUnitRecord[]> = {
  '1am': PROGRESSION_1AM_UNITS,
  '2am': PROGRESSION_2AM_UNITS,
  '3am': PROGRESSION_3AM_UNITS,
  '4am': PROGRESSION_4AM_UNITS,
};

export const LOGBOOK_PROGRESSION_SOURCES: Record<LogbookLevelCode, PedagogicalSourceFileMeta> = {
  '1am': PROGRESSION_1AM_SOURCE,
  '2am': PROGRESSION_2AM_SOURCE,
  '3am': PROGRESSION_3AM_SOURCE,
  '4am': PROGRESSION_4AM_SOURCE,
};

export const LOGBOOK_DATABASE = {
  /** قاعدة الدفتر الرقمي المملوكة والمنفصلة عن التدرج السنوي وبقية وحدات المنصة. */
  owned: {
    progressions: LOGBOOK_PROGRESSIONS,
    sources: LOGBOOK_PROGRESSION_SOURCES,
  },
} as const;

export function logbookProgressionOf(
  level: LogbookLevelCode | LogbookArabicLevel | string
): ProgressionLookupResult {
  const code = arabicLevelToCode(level);
  if (!code) {
    return {
      available: false,
      level: '1am',
      arabicLevel: '1م',
      source: null,
      units: [],
      unavailableReason: 'ملف التدرج البيداغوجي غير متوفر لهذه السنة',
    };
  }
  const units = LOGBOOK_PROGRESSIONS[code];
  const source = LOGBOOK_PROGRESSION_SOURCES[code] ?? null;
  if (!Array.isArray(units) || units.length === 0) {
    return {
      available: false,
      level: code,
      arabicLevel: levelCodeToArabic(code),
      source,
      units: [],
      unavailableReason: 'ملف التدرج البيداغوجي غير متوفر لهذه السنة',
    };
  }
  return {
    available: true,
    level: code,
    arabicLevel: levelCodeToArabic(code),
    source,
    units,
  };
}
