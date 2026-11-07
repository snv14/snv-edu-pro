import { LessonMemo } from '../types';
import { LESSONS_1AM } from './lessons1am';
import { LESSONS_2AM } from './lessons2am';
import { LESSONS_3AM } from './lessons3am';
import { LESSONS_4AM } from './lessons4am';

export const CURRICULUM_DB_STORAGE_KEY = 'mizaniyati_curriculum_db_v2027_1am_exact_v1';

export const getOfficialCurriculumDatabase = (): LessonMemo[] => [
  ...LESSONS_1AM, ...LESSONS_2AM, ...LESSONS_3AM, ...LESSONS_4AM,
];

export const loadCurriculumDatabase = (): LessonMemo[] => {
  if (typeof window === 'undefined') return getOfficialCurriculumDatabase();
  try {
    const raw = localStorage.getItem(CURRICULUM_DB_STORAGE_KEY);
    if (!raw) return getOfficialCurriculumDatabase();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getOfficialCurriculumDatabase();
    const oneAmUnits = parsed.filter(p => p.level === '1am');
    if (oneAmUnits.length !== 22 || !oneAmUnits.some(u => u.sourceLearningUnitId === 'lu_1am_1_1_1')) {
      return resetCurriculumDatabase();
    }
    return parsed as LessonMemo[];
  } catch { return getOfficialCurriculumDatabase(); }
};

export const saveCurriculumDatabase = (lessons: LessonMemo[]): void => {
  localStorage.setItem(CURRICULUM_DB_STORAGE_KEY, JSON.stringify(lessons));
  try { if ((window as any).syncToCloud) void (window as any).syncToCloud('curriculum', lessons); } catch { /* local copy remains */ }
};

export const resetCurriculumDatabase = (): LessonMemo[] => {
  const official = getOfficialCurriculumDatabase();
  localStorage.setItem(CURRICULUM_DB_STORAGE_KEY, JSON.stringify(official));
  try {
    if ((window as any).syncToCloud) {
      void (window as any).syncToCloud('curriculum', official);
    }
  } catch {
    // The local official copy remains available even if cloud sync is unavailable.
  }
  window.dispatchEvent(new CustomEvent('curriculum-db-updated'));
  return official;
};

export const exportCurriculumDatabase = (lessons: LessonMemo[]): string => JSON.stringify({
  format: 'mizaniyati-curriculum-db', version: 1, exportedAt: new Date().toISOString(), lessons
}, null, 2);

export const importCurriculumDatabase = async (file: File): Promise<LessonMemo[]> => {
  const parsed = JSON.parse(await file.text());
  const lessons = Array.isArray(parsed) ? parsed : parsed?.lessons;
  if (!Array.isArray(lessons)) throw new Error('Invalid curriculum database file');
  return lessons as LessonMemo[];
};