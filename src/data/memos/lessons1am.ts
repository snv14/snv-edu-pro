import { LessonMemo } from '../../types';
import { EXACT_LESSONS_1AM } from './official_1am_exact_db';
import { attachDiagrams1am } from './diagrams1amAttach';

/**
 * قاعدة بيانات السنة الأولى متوسط الرسمية
 * مطابقة 100% لإدخال الأستاذ دون زيادة أو نقصان:
 * - 22 وحدة تعلمية رسمية
 * - المشكلات المطروحة، الأنشطة بالتفصيل، والتقويم
 *
 * النص الرسمي لا يُمسّ: تُضاف إليه الرسومات التخطيطية داخل الأنشطة المطابقة
 * (diagrams1amAttach.ts) بنفس شكل قاعدة البيانات المستعمل في س2/س3/س4،
 * مع توثيق صفحة المصدر ودرجة أمانة كل رسم.
 */
export const LESSONS_1AM: LessonMemo[] = attachDiagrams1am(EXACT_LESSONS_1AM);

/** القاعدة الخام بلا رسومات — للتحقق من أن النص الرسمي لم يتغير. */
export const RAW_LESSONS_1AM: LessonMemo[] = EXACT_LESSONS_1AM;
