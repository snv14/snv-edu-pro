/**
 * أولوية مصادر الجواب — من الأقوى سلطة إلى الأضعف.
 *
 * الأرقام 1–4 **ليست معرَّفة هنا**: تُشتق من `PLATFORM_FAMILIES` في src/data/platform/،
 * وهي المرجع الوحيد لترتيب عائلات القاعدة الموحدة (المنهاج ← الوثيقة المرافقة ←
 * دليل الأستاذ ← المذكرات). فلو أعيد ترتيب العائلات هناك تغيّرت الأولوية هنا وفي
 * بحث قاعدة المعرفة معاً، بدل أن يتباعد تعريفان.
 *
 * وما بعد العائلات (وثائق الأستاذ، المرفقات، الويب، المكتبة، الذكاء الاصطناعي)
 * يُحسب تلقائياً من عدد العائلات، لأنه أدنى سلطة من أي مصدر وزاري.
 */
import { PLATFORM_FAMILIES } from '../data/platform';

export type AISourceType =
  | 'curriculum'
  | 'progression'
  | 'companionDocument'
  | 'teacherGuide'
  | 'memo'
  | 'teacherDocument'
  | 'attachment'
  | 'web'
  | 'library'
  | 'ai';

/** أولوية ما بعد العائلات الأربع: وثائق الأستاذ والمرفقات. */
const AFTER_FAMILIES = PLATFORM_FAMILIES.length + 1;

const FAMILY_PRIORITIES = Object.fromEntries(
  PLATFORM_FAMILIES.flatMap(family => family.kinds.map(kind => [kind, family.order])),
) as Record<AISourceType, number>;

export const AI_SOURCE_PRIORITY: Record<AISourceType, number> = {
  ...FAMILY_PRIORITIES,
  teacherDocument: AFTER_FAMILIES,
  attachment: AFTER_FAMILIES,
  web: AFTER_FAMILIES + 1,
  library: AFTER_FAMILIES + 2,
  ai: AFTER_FAMILIES + 3,
};

export const sourcePriorityOf = (type: string): number =>
  AI_SOURCE_PRIORITY[type as AISourceType] ?? AI_SOURCE_PRIORITY.ai;
