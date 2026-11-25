import localforage from 'localforage';
import { AssessmentExam, normalizeAssessmentExam } from './assessmentModel';

/**
 * مخزن «التقويم» المحلي: مسودات الاختبارات ونتائجها تُحفظ على جهاز الأستاذ
 * (localforage) فلا تضيع عند ضعف الاتصال، ولا تُرسل إلى أي مزوّد.
 */

export interface AssessmentLibrary {
  version: 1;
  exams: AssessmentExam[];
  lastActiveExamId: string;
  updatedAt: string;
}

const STORAGE_KEY = 'snv-edu-pro.assessment.v1';

export const emptyAssessmentLibrary = (): AssessmentLibrary => ({
  version: 1,
  exams: [],
  lastActiveExamId: '',
  updatedAt: new Date().toISOString(),
});

export async function loadAssessmentLibrary(): Promise<AssessmentLibrary> {
  try {
    const stored = await localforage.getItem<AssessmentLibrary>(STORAGE_KEY);
    if (!stored || stored.version !== 1 || !Array.isArray(stored.exams)) return emptyAssessmentLibrary();
    const exams = stored.exams.map(normalizeAssessmentExam);
    const lastActiveExamId = exams.some(exam => exam.id === stored.lastActiveExamId)
      ? stored.lastActiveExamId
      : (exams[0]?.id || '');
    return {
      version: 1,
      exams,
      lastActiveExamId,
      updatedAt: String(stored.updatedAt || new Date().toISOString()),
    };
  } catch (error) {
    console.warn('[assessment-store] load failed', error);
    return emptyAssessmentLibrary();
  }
}

export async function saveAssessmentLibrary(library: AssessmentLibrary): Promise<void> {
  try {
    await localforage.setItem(STORAGE_KEY, { ...library, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn('[assessment-store] save failed', error);
  }
}

export function upsertExam(library: AssessmentLibrary, exam: AssessmentExam): AssessmentLibrary {
  const exists = library.exams.some(item => item.id === exam.id);
  return {
    ...library,
    exams: exists
      ? library.exams.map(item => (item.id === exam.id ? exam : item))
      : [exam, ...library.exams],
    lastActiveExamId: exam.id,
    updatedAt: new Date().toISOString(),
  };
}

export function removeExam(library: AssessmentLibrary, examId: string): AssessmentLibrary {
  const exams = library.exams.filter(exam => exam.id !== examId);
  return {
    ...library,
    exams,
    lastActiveExamId: library.lastActiveExamId === examId ? (exams[0]?.id || '') : library.lastActiveExamId,
    updatedAt: new Date().toISOString(),
  };
}

export function findExam(library: AssessmentLibrary, examId: string): AssessmentExam | null {
  return library.exams.find(exam => exam.id === examId) || null;
}
