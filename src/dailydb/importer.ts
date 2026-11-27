/**
 * ============================================================================
 *  قاعدة بيانات الدفتر اليومي — استيراد التدرجات
 * ============================================================================
 *
 * تستورد هذه الوحدة التدرجات البيداغوجية من الملفات المصدرية الأربعة
 * (1AM–4AM) وتُنظمها داخل Collections قاعدة الدفتر اليومي:
 *
 *   dailySourceFiles      ← معلومات الملف المصدري (يُحفظ مرة واحدة)
 *   dailyProgressions     ← تدرج واحد لكل مستوى
 *   dailyFields           ← الميادين
 *   dailyLearningSections ← المقاطع التعلمية
 *   dailyLearningResources ← الموارد التعلمية
 *   dailyLearningItems    ← تعلم الموارد (المشكلة، الإرساء، التقويم)
 *   dailyActivities       ← الأنشطة
 *
 * التدرج المستورد هو **مرجع ترتيب تعليمي** فقط:
 *   • لا يُسمح لل دفتر اليومي بتعديل نص التدرج أو حذف مورد أو تغيير ترتيبه.
 *   • أي تعديل على الحصة يؤثر على dailyLessons و dailyLessonHistory فقط.
 *
 * الاستيراد **متكرر الآثار** (idempotent): تشغيله مرة أخرى لا يُنتج
 * تكرارًا في الCollections، لأن المعرفات محددة حتمياً من المحتوى.
 */

import {
  LOGBOOK_PROGRESSIONS,
  LOGBOOK_PROGRESSION_SOURCES,
  type LogbookLevelCode,
  type PedagogicalUnitRecord,
} from '../data/logbook';
import {
  readCollection,
  writeCollection,
  DAILY_DB_KEYS,
} from './storage';
import {
  type DailyActivity,
  type DailyField,
  type DailyLearningItem,
  type DailyLearningResource,
  type DailyLearningSection,
  type DailyProgression,
  type DailySourceFile,
} from './schema';
import { inferActivityType } from './db';

/** تحويل كود المستوى من صيغة الProgression إلى صيغة القاعدة (1am → 1AM). */
function toDailyLevelCode(code: LogbookLevelCode): '1AM' | '2AM' | '3AM' | '4AM' {
  return `${code[0].toUpperCase()}AM` as '1AM' | '2AM' | '3AM' | '4AM';
}

/** معرف محدد حتمياً للملف المصدري. */
function sourceFileId(levelCode: string): string {
  return `srcfile_${levelCode}`;
}

/** معرف محدد حتمياً للتدرج. */
function progressionId(levelCode: string): string {
  return `progr_${levelCode}`;
}

/** معرف محدد حتمياً للميدان. */
function fieldId(progressionId: string, order: number, title: string): string {
  return `fld_${progressionId}_${order}_${slug(title)}`;
}

/** معرف محدد حتمياً للمقطع. */
function sectionId(progressionId: string, fieldId: string, order: number, title: string): string {
  return `sec_${progressionId}_${fieldId}_${order}_${slug(title)}`;
}

/** معرف محدد حتمياً للمورد. */
function resourceId(progressionId: string, sectionId: string, order: number, title: string): string {
  return `res_${progressionId}_${sectionId}_${order}_${slug(title)}`;
}

/** معرف محدد حتمياً لتعلم مورد. */
function learningItemId(progressionId: string, order: number, title: string): string {
  return `item_${progressionId}_${order}_${slug(title)}`;
}

/** معرف محدد حتمياً للنشاط. */
function activityId(learningItemId: string, order: number, title: string): string {
  return `act_${learningItemId}_${order}_${slug(title)}`;
}

/** تبسيط نص عربي إلى معرف حتمي. */
function slug(s: string): string {
  return (s || '')
    .replace(/[^\w]/g, '')
    .replace(/^0+/, '')
    .slice(0, 40);
}

/**
 * استيراد كل التدرجات الأربعة إلى قاعدة الدفتر اليومي.
 * يُعيد ملخص الاستيراد.
 */
export function importAllProgressions(): {
  progressions: number;
  fields: number;
  sections: number;
  resources: number;
  learningItems: number;
  activities: number;
  sourceFiles: number;
} {
  let progressions = 0;
  let fields = 0;
  let sections = 0;
  let resources = 0;
  let learningItems = 0;
  let activities = 0;
  let sourceFiles = 0;

  for (const levelCode of ['1am', '2am', '3am', '4am'] as LogbookLevelCode[]) {
    const result = importProgression(levelCode);
    progressions += result.progression;
    fields += result.fields;
    sections += result.sections;
    resources += result.resources;
    learningItems += result.learningItems;
    activities += result.activities;
    sourceFiles += result.sourceFiles;
  }

  return { progressions, fields, sections, resources, learningItems, activities, sourceFiles };
}

/** استيراد تدرج مستوى واحد. */
function importProgression(levelCode: LogbookLevelCode): {
  progression: number;
  fields: number;
  sections: number;
  resources: number;
  learningItems: number;
  activities: number;
  sourceFiles: number;
} {
  const units: PedagogicalUnitRecord[] = LOGBOOK_PROGRESSIONS[levelCode] || [];
  const source = LOGBOOK_PROGRESSION_SOURCES[levelCode];
  const dailyCode = toDailyLevelCode(levelCode);
  const progId = progressionId(dailyCode);
  const nowIso = new Date().toISOString();
  const academicYear = deriveAcademicYear(levelCode);

  let progression = 0;
  let fields = 0;
  let sections = 0;
  let resources = 0;
  let learningItems = 0;
  let activities = 0;
  let sourceFiles = 0;

  // 1. الملف المصدري (يُحفظ مرة واحدة لكل مستوى، ولا يُكرر في كل عنصر).
  const existingFiles = readCollection<DailySourceFile>(DAILY_DB_KEYS.sourceFiles);
  if (!existingFiles.some((f) => f.id === sourceFileId(dailyCode))) {
    const file: DailySourceFile = {
      id: sourceFileId(dailyCode),
      fileName: source?.pdfPath?.split('/').pop() || `program_${dailyCode}.pdf`,
      levelCode: dailyCode,
      fileType: 'pdf',
      sourceType: 'progression',
      version: source?.pdfPath || undefined,
      importedAt: nowIso,
    };
    existingFiles.push(file);
    writeCollection(DAILY_DB_KEYS.sourceFiles, existingFiles);
    sourceFiles = 1;
  }

  // 2. التدرج نفسه.
  const existingProgressions = readCollection<DailyProgression>(DAILY_DB_KEYS.progressions);
  if (!existingProgressions.some((p) => p.id === progId)) {
    const progressionRecord: DailyProgression = {
      id: progId,
      levelCode: dailyCode,
      academicYear,
      sourceFileId: sourceFileId(dailyCode),
      sourceVersion: source?.pdfPath || dailyCode,
      status: 'official',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    existingProgressions.push(progressionRecord);
    writeCollection(DAILY_DB_KEYS.progressions, existingProgressions);
    progression = 1;
  }

  // 3. الهياكل التعليمية.
  const existingFields = readCollection<DailyField>(DAILY_DB_KEYS.fields);
  const existingSections = readCollection<DailyLearningSection>(DAILY_DB_KEYS.learningSections);
  const existingResources = readCollection<DailyLearningResource>(DAILY_DB_KEYS.learningResources);
  const existingItems = readCollection<DailyLearningItem>(DAILY_DB_KEYS.learningItems);
  const existingActivities = readCollection<DailyActivity>(DAILY_DB_KEYS.activities);

  const fieldOrderMap = new Map<string, number>();
  const sectionOrderMap = new Map<string, number>();
  const resourceOrderMap = new Map<string, number>();
  let globalSeq = 0;

  // ترتيب الميادين، المقاطع، الموارد حسب التسلسل الوارد في الملفات.
  for (const unit of units) {
    // --- الميدان ---
    const fTitle = unit.midan || '';
    if (!fieldOrderMap.has(fTitle)) fieldOrderMap.set(fTitle, fieldOrderMap.size + 1);
    const fId = fieldId(progId, fieldOrderMap.get(fTitle)!, fTitle);
    if (!existingFields.some((f) => f.id === fId)) {
      existingFields.push({ id: fId, progressionId: progId, title: fTitle, order: fieldOrderMap.get(fTitle)! });
      fields++;
    }

    // --- المقطع ---
    const sTitle = unit.maqta || '';
    if (!sectionOrderMap.has(sTitle)) sectionOrderMap.set(sTitle, sectionOrderMap.size + 1);
    const sId = sectionId(progId, fId, sectionOrderMap.get(sTitle)!, sTitle);
    if (!existingSections.some((s) => s.id === sId)) {
      existingSections.push({ id: sId, progressionId: progId, fieldId: fId, title: sTitle, order: sectionOrderMap.get(sTitle)! });
      sections++;
    }

    // --- المورد ---
    const rTitle = unit.mawrid || '';
    if (!resourceOrderMap.has(rTitle)) resourceOrderMap.set(rTitle, resourceOrderMap.size + 1);
    const rId = resourceId(progId, sId, resourceOrderMap.get(rTitle)!, rTitle);
    if (!existingResources.some((r) => r.id === rId)) {
      existingResources.push({ id: rId, progressionId: progId, fieldId: fId, sectionId: sId, title: rTitle, order: resourceOrderMap.get(rTitle)! });
      resources++;
    }

    // --- تعلم مورد ---
    globalSeq++;
    const itemTitle = unit.ta3alom || rTitle;
    const itemId = learningItemId(progId, globalSeq, itemTitle);
    if (!existingItems.some((i) => i.id === itemId)) {
      existingItems.push({
        id: itemId,
        progressionId: progId,
        fieldId: fId,
        sectionId: sId,
        resourceId: rId,
        title: itemTitle,
        order: globalSeq,
        globalSequence: globalSeq,
        problem: unit.moshkila,
        establishment: unit.irsaaText,
        evaluation: unit.taqwim,
      });
      learningItems++;
    }

    // --- الأنشطة ---
    unit.activities.forEach((actTitle, idx) => {
      const aId = activityId(itemId, idx + 1, actTitle);
      if (!existingActivities.some((a) => a.id === aId)) {
        existingActivities.push({
          id: aId,
          progressionId: progId,
          learningItemId: itemId,
          title: actTitle,
          order: idx + 1,
          type: inferActivityType(actTitle),
          sourcePage: unit.sourceFile.sourcePage,
        });
        activities++;
      }
    });
  }

  writeCollection(DAILY_DB_KEYS.fields, existingFields);
  writeCollection(DAILY_DB_KEYS.learningSections, existingSections);
  writeCollection(DAILY_DB_KEYS.learningResources, existingResources);
  writeCollection(DAILY_DB_KEYS.learningItems, existingItems);
  writeCollection(DAILY_DB_KEYS.activities, existingActivities);

  return { progression, fields, sections, resources, learningItems, activities, sourceFiles };
}

/** اشتقاق السنة الدراسية من كود المستوى (للحفظ في سجل التدرج). */
function deriveAcademicYear(levelCode: LogbookLevelCode): string {
  // السنة الدراسية الجارية افتراضياً؛ الترتيب لا يعتمد عليها.
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

/**
 * تهيئة قاعدة الدفتر اليومي باستيراد التدرجات الأربعة.
 * تُستخدم عند أول تشغيل أو عند الحاجة لإعادة الاستيراد.
 */
export function initializeDailyDatabase(): ReturnType<typeof importAllProgressions> {
  return importAllProgressions();
}
