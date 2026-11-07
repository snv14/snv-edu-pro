import type { LessonMemo } from '../types';

const EXPECTED_1AM_UNITS = [
  'مصدر الأغذية','تركيب الأغذية','دور الأغذية في الجسم','الرواتب الغذائية','التوازن الغذائي',
  'التغذية المعدنية عند النبات الأخضر','مقر الامتصاص عند النبات الأخضر','التركيب الضوئي',
  'أهمية التحكم في شروط التركيب الضوئي','انتقال النسغ','ظاهرة النتح','المبادلات الغازية التنفسية عند الإنسان',
  'تعريف التنفس','القواعد الصحية للتنفس','المبادلات الغازية التنفسية عند النبات الأخضر',
  'تعريف التنفس عند النبات الأخضر','التخمر','تعريف الإطراح','أجهزة الإطراح','القواعد الصحية للإطراح',
  'مراحل الإنتاش','الجهاز التكاثري عند الإنسان','الإلقاح','القواعد الصحية الجنسية عند الإنسان',
  'مكونات الجهاز التكاثري عند النباتات الزهرية','مميزات التكاثر الجنسي عند النباتات ذات الأزهار','بنية الخلية'
] as const;

/**
 * Source-review items that are intentionally not auto-merged into the master DB.
 * They require classification against the official curriculum/memo source before
 * they can be promoted to database activities.
 */
export const UNVERIFIED_CONFLICTS_1AM = [
  {
    code: 'UNVERIFIED_CONFLICT',
    sourcePages: '54-56',
    description: 'Supplementary fermentation worksheets contain activities 01-03; activity 03 (comparison between respiration and fermentation) is not present in the current official source activity set.',
  },
] as const;


const EXPECTED_1AM_ACTIVITY_COUNTS: Record<string, number> = {
  'مصدر الأغذية': 2,
  'تركيب الأغذية': 3,
  'دور الأغذية في الجسم': 2,
  'الرواتب الغذائية': 2,
  'التوازن الغذائي': 1,
  'التغذية المعدنية عند النبات الأخضر': 2,
  'مقر الامتصاص عند النبات الأخضر': 2,
  'التركيب الضوئي': 3,
  'أهمية التحكم في شروط التركيب الضوئي': 2,
  'انتقال النسغ': 2,
  'ظاهرة النتح': 1,
  'المبادلات الغازية التنفسية عند الإنسان': 2,
  'تعريف التنفس': 2,
  'القواعد الصحية للتنفس': 2,
  'المبادلات الغازية التنفسية عند النبات الأخضر': 3,
  'تعريف التنفس عند النبات الأخضر': 1,
  'التخمر': 2,
  'تعريف الإطراح': 1,
  'أجهزة الإطراح': 3,
  'القواعد الصحية للإطراح': 1,
  'مراحل الإنتاش': 2,
  'الجهاز التكاثري عند الإنسان': 2,
  'الإلقاح': 2,
  'القواعد الصحية الجنسية عند الإنسان': 1,
  'مكونات الجهاز التكاثري عند النباتات الزهرية': 3,
  'مميزات التكاثر الجنسي عند النباتات ذات الأزهار': 2,
  'بنية الخلية': 2,
};
const EXPECTED_1AM_SEQUENCES = [
  'التغذية عند الإنسان','التغذية عند النبات الأخضر','التحصل على الطاقة عند الإنسان',
  'التحصل على الطاقة عند النبات الأخضر','الإطراح عند الإنسان','مظاهر النمو والتطور عند النبات',
  'التكاثر عند الإنسان','التكاثر عند النباتات ذات الأزهار','وحدة بناء الكائنات الحية'
] as const;

export function validate1AMDatabase(lessons: LessonMemo[]): string[] {
  const errors: string[] = [];
  const units = lessons.map(l => l.ta3alom);
  const sequenceNames = lessons.map(l => l.maqta);
  const sourceUnitIds = lessons.map(l => l.sourceLearningUnitId || '');
  const sourceActivityIds = lessons.flatMap(l => l.anshita.map(a => a.sourceActivityId || ''));

  if (lessons.length !== EXPECTED_1AM_UNITS.length) errors.push(`Expected 27 1AM learning units, found ${lessons.length}.`);

  const missingUnits = EXPECTED_1AM_UNITS.filter(name => !units.includes(name));
  const unexpectedUnits = units.filter(name => !EXPECTED_1AM_UNITS.includes(name as typeof EXPECTED_1AM_UNITS[number]));
  if (missingUnits.length) errors.push(`Missing 1AM units: ${missingUnits.join(' | ')}`);
  if (unexpectedUnits.length) errors.push(`Unexpected 1AM units: ${unexpectedUnits.join(' | ')}`);

  if (new Set(sourceUnitIds).size !== sourceUnitIds.length || sourceUnitIds.some(id => !id)) {
    errors.push('1AM source learning-unit IDs are missing or duplicated.');
  }
  if (new Set(sourceActivityIds).size !== sourceActivityIds.length || sourceActivityIds.some(id => !id)) {
    errors.push('1AM source activity IDs are missing or duplicated.');
  }

  const totalActivities = lessons.reduce((sum, lesson) => sum + lesson.anshita.length, 0);
  const totalDiagrams = lessons.reduce((sum, lesson) =>
    sum + lesson.anshita.reduce((n, activity) => n + (activity.diagrams?.length || 0), 0), 0);
  const totalTables = lessons.reduce((sum, lesson) =>
    sum + lesson.anshita.reduce((n, activity) => n + (activity.tables?.length || 0), 0)
      + (lesson.wadiyaTables?.length || 0)
      + (lesson.irsaeTables?.length || 0)
      + (lesson.taqwimTables?.length || 0), 0);

  // Structural counts verified against the current 1AM official source modules.
  if (totalActivities !== 53) errors.push(`Expected 53 1AM activities, found ${totalActivities}.`);
  if (totalDiagrams !== 11) errors.push(`Expected 11 1AM activity diagrams, found ${totalDiagrams}.`);
  if (totalTables !== 48) errors.push(`Expected 48 1AM tables, found ${totalTables}.`);

  lessons.forEach((lesson) => {
    lesson.anshita.forEach((activity) => {
      if (!activity.title.trim()) {
        errors.push(`Empty 1AM activity title in unit "${lesson.ta3alom}".`);
      }
      if (!activity.sourceActivityId) {
        errors.push(`Missing source activity ID in unit "${lesson.ta3alom}".`);
      }
      if (activity.sourceActivityId && !activity.sourceActivityId.startsWith('act_1am_')) {
        errors.push(`Invalid 1AM source activity ID "${activity.sourceActivityId}" in unit "${lesson.ta3alom}".`);
      }
    });
  });

  for (const lesson of lessons) {
    const expected = EXPECTED_1AM_ACTIVITY_COUNTS[lesson.ta3alom];
    if (expected === undefined) {
      errors.push(`Unexpected 1AM learning unit activity map entry: "${lesson.ta3alom}".`);
    } else if (lesson.anshita.length !== expected) {
      errors.push(`Activity count mismatch for "${lesson.ta3alom}": expected ${expected}, got ${lesson.anshita.length}.`);
    }
  }

  const missingSequences = EXPECTED_1AM_SEQUENCES.filter(name => !sequenceNames.includes(name));
  if (missingSequences.length) errors.push(`Missing 1AM sequences: ${missingSequences.join(' | ')}`);

  lessons.forEach((lesson, index) => {
    const expectedMemo = String(index + 1).padStart(2, '0');
    if (lesson.memoNumber !== expectedMemo) {
      errors.push(`Memo numbering mismatch at index ${index}: expected ${expectedMemo}, found ${lesson.memoNumber || '(empty)'}.`);
    }
    if (!lesson.sourceSequenceId || !lesson.sourceResourceId || !lesson.sourceLearningUnitId) {
      errors.push(`Missing source traceability for 1AM unit "${lesson.ta3alom}".`);
    }
    if (!lesson.sourceOfficial) errors.push(`1AM unit "${lesson.ta3alom}" is not marked as official source data.`);
  });

  return errors;
}
