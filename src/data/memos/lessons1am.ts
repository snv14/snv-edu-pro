import { LessonMemo } from '../../types';
import { EXACT_LESSONS_1AM } from './official_1am_exact_db';

/**
 * قاعدة بيانات السنة الأولى متوسط الرسمية
 * مطابقة 100% لإدخال الأستاذ دون زيادة أو نقصان:
 * - 27 وحدة تعلمية رسمية كاملة (مذكرات 01 إلى 27)
 * - المشكلات المطروحة، الأنشطة بالتفصيل، الجداول، الرسومات، والتقويم
 */
export const LESSONS_1AM: LessonMemo[] = EXACT_LESSONS_1AM;
