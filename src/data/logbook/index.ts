/**
 * قاعدة بيانات الدفتر اليومي — **خاصة ومعزولة** عن القاعدة الموحدة للمنصة.
 *
 * المنصة كلها تقرأ من عائلات `src/data/platform/` الأربع (المنهاج ← الوثيقة المرافقة ←
 * دليل الأستاذ ← المذكرات). الدفتر اليومي وحده له قاعدة خاصة، لأن بياناته تشغيلية
 * (برامج الحصص الجاهزة ومدخلات seeded) وليست مرجعاً تربوياً يُقتبس.
 *
 * ── حدود القاعدة ─────────────────────────────────────────────────────────────
 * خاص بالدفتر (هنا):
 *   • DAILY_LOGBOOK_PROGRAM_1AM…4AM — برامج الحصص لكل مستوى
 *   • INITIAL_DAILY_LOGS            — مدخلات بداية (بيانات تجريبية)
 *
 * مشترك مع القاعدة الموحدة (يُقرأ منها ولا يُنسخ):
 *   • التدرجات السنوية الرسمية  ← src/data/curriculum/officialAnnualDistributionData.ts
 *     (عائلة المنهاج، ترتيب 1). هي بيانات وزارية يستهلكها الدفتر لترتيب حصصه
 *     زمنياً، وتستهلكها قاعدة المعرفة كـ`progression`. نسخها هنا كان سيخلق
 *     مصدرَي حقيقة يتباعدان.
 *
 * ── الاقتران بالتدرج السنوي: منفَّذ ───────────────────────────────────────────
 * `src/utils/logbookProgramLink.ts` يربط صف التدرج بوحدة هذه القاعدة أو وحداتها،
 * فيأخذ المولّد منها «تعلم مورد» والمشكلة والتقويم بنصها الوزاري بدل الاحتياطي
 * العام. قاعدته **المطابقة الحرفية بعد التطبيع فقط**: الوثيقتان الرسميتان مختلفتا
 * التصنيف (المخطط السنوي يجمّع الموارد — «المورد 1: خصائص الوسط الحي» — والتدرج
 * البيداغوجي يفصلها «1-1: عناصر الوسط الحي» و«1-2: أنواع الأوساط الحية»)،
 * فالعلاقة واحد↔متعدد والعناوين مُعاد صياغتها أحياناً. التغطية المعلنة
 * (يقفلها tests/logbookProgramLink.test.ts): س1 72% · س2 47% · س3 61% · س4 38%،
 * وعلى مستوى الحصص 76/252 تقويماً وزارياً و68/252 مشكلة رسمية. وما لم يُربط يبقى
 * بسلوكه السابق — لا نصَّ مُختلَعاً يُنسب إلى وثيقة.
 *
 * ⚠️ الاعتماد على `curriculumDb` **غير قائم في هذه الطبقة**، وكان موثّقاً هنا
 *    قراراً معلَّقاً فصار الوصف قديماً: لا ملف في هذا المجلد يستورد من
 *    `src/data/memos/`. المسار المذكور في `sharedFrom` أدناه تسميةٌ مرجعية يختبر
 *    وجودها `tests/platformDatabase.test.ts` لا استيراداً. وما بقي من أثره أن
 *    `GenerateLogbookEntriesParams.curriculumDb?: any` (dailyLogbookGenerator.ts:372)
 *    مقبولٌ ولا يُقرأ قط، وأن `buildCurriculumDatabase()` (DailyLogbook.tsx:789)
 *    يعيد تغليف هذه البرامج نفسها لا قاعدة المذكرات. إزالتهما تنظيفٌ مستقل.
 */
export { DAILY_LOGBOOK_PROGRAM_1AM } from './dailyLogbookProgram1am';
export type { DailyLogbookProgramItem } from './dailyLogbookProgram1am';
export { DAILY_LOGBOOK_PROGRAM_2AM } from './dailyLogbookProgram2am';
export { DAILY_LOGBOOK_PROGRAM_3AM } from './dailyLogbookProgram3am';
export { DAILY_LOGBOOK_PROGRAM_4AM } from './dailyLogbookProgram4am';
export { INITIAL_DAILY_LOGS } from './dailyLogData';

import { DAILY_LOGBOOK_PROGRAM_1AM } from './dailyLogbookProgram1am';
import { DAILY_LOGBOOK_PROGRAM_2AM } from './dailyLogbookProgram2am';
import { DAILY_LOGBOOK_PROGRAM_3AM } from './dailyLogbookProgram3am';
import { DAILY_LOGBOOK_PROGRAM_4AM } from './dailyLogbookProgram4am';
import { INITIAL_DAILY_LOGS } from './dailyLogData';

export type LogbookLevel = '1am' | '2am' | '3am' | '4am';

/** برامج الدفتر لكل مستوى — نقطة الدخول الوحيدة بدل أربعة استيرادات. */
export const LOGBOOK_PROGRAMS: Record<LogbookLevel, typeof DAILY_LOGBOOK_PROGRAM_1AM> = {
  '1am': DAILY_LOGBOOK_PROGRAM_1AM,
  '2am': DAILY_LOGBOOK_PROGRAM_2AM,
  '3am': DAILY_LOGBOOK_PROGRAM_3AM,
  '4am': DAILY_LOGBOOK_PROGRAM_4AM,
};

/** قاعدة الدفتر الخاصة: ما يملكه وحده، وما يشاركه مع القاعدة الموحدة. */
export const LOGBOOK_DATABASE = {
  /** خاص بالدفتر. */
  owned: {
    programs: LOGBOOK_PROGRAMS,
    seededEntries: INITIAL_DAILY_LOGS,
  },
  /** مشترك — يُقرأ من القاعدة الموحدة ولا يُنسخ هنا. */
  sharedFrom: {
    annualDistributions: 'src/data/curriculum/officialAnnualDistributionData.ts',
    curriculumMemos: 'src/data/memos/curriculumDb.ts',
  },
} as const;

export function logbookProgramOf(level: string) {
  return LOGBOOK_PROGRAMS[level as LogbookLevel] ?? null;
}
