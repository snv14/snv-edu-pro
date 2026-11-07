import { LessonMemo } from '../types';
import { EXACT_LESSONS_1AM } from './official_1am_exact_db';

/**
 * قاعدة بيانات السنة الأولى متوسط الرسمية
 * مطابقة 100% لإدخال الأستاذ دون زيادة أو نقصان:
 * - 22 وحدة تعلمية رسمية
 * - المشكلات المطروحة، الأنشطة بالتفصيل، والتقويم
 */
export const LESSONS_1AM: LessonMemo[] = EXACT_LESSONS_1AM;
