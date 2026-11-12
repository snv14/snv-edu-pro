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
 *     (عائلة المنهاج، ترتيب 1). تُستهلك كمحطات زمنية فقط: التعارف والتقويم
 *     التشخيصي، الفروض والاختبارات، التصحيح والمعالجة، ومواضعها في السنة.
 *     أما **ترتيب حصص التعلم ومحتواها** فيأتي من LOGBOOK_PROGRAMS وحدها
 *     (المطابقة مع التدرجات البيداغوجية الرسمية المرفقة)، لأن التدرج السنوي
 *     يدمج الموارد في خلايا مشتركة ويُسقط مقاطع كاملة (مثل «الإطراح عند الإنسان»).
 *   • عناوين الدروس ومساراتها ← src/data/memos/curriculumDb.ts (عائلة المذكرات، ترتيب 4).
 *     (مسار مرجعي موثَّق؛ الدفتر لا يقرأ منه فعلياً — أُلغي الربط بالمذكرات،
 *     ويعتمد الدفتر على برامجه الخاصة والتدرجات الرسمية فقط.)
 *
 * ترتيب الحصص (src/utils/dailyLogbookGenerator.ts): وحدات كل مستوى تُقرأ بترتيبها
 * في هذا الملف (وهو ترتيب التدرج البيداغوجي الرسمي: ميدان ← مقطع ← مورد ←
 * تعلم مورد ← نشاط)، وتُحقن محطات التدرج السنوي في مواضعها بمطابقة نصية
 * متسلسلة، فيُضمن عدم إسقاط أي مورد وعدم الرجوع إلى مقطع سابق.
 * المقاطع مفاتيح وحيدة داخل كل مستوى (`المقطع التعلمي 01…`).
 *
 * التغطية (محروسة باختبار tests/logbookDatabase.test.ts):
 *   1am: 26 وحدة · 45 نشاطاً · 9 مقاطع — كاملة الحقول (مشكلة + تقويم لكل وحدة)
 *   2am: 20 وحدة · 29 نشاطاً · 5 مقاطع — كاملة الحقول
 *   3am: 28 وحدة · 37 نشاطاً · 4 مقاطع — كاملة الحقول
 *   4am: 23 وحدة · 43 نشاطاً · 3 مقاطع — كاملة الحقول
 *   مدخلات أولية: 5 مدخلات مرجعية (INITIAL_DAILY_LOGS).
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
