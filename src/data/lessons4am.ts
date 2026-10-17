import { LessonMemo } from '../types';
import { LESSONS_4AM_MAQTA1 } from './lessons4am_maqta1';
import { LESSONS_4AM_MAQTA2 } from './lessons4am_maqta2';
import { LESSONS_4AM_MAQTA3 } from './lessons4am_maqta3';

// تجميع كافة مذكرات السنة الرابعة متوسط (26 مذكرة شاملة وفق المنهاج والوثيقة المرافقة الرسمية)
export const LESSONS_4AM: LessonMemo[] = [
  ...LESSONS_4AM_MAQTA1,
  ...LESSONS_4AM_MAQTA2,
  ...LESSONS_4AM_MAQTA3,
];
