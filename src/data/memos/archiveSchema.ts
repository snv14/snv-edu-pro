import type { DB_Table, LessonMemo } from '../../types';

export type CurriculumLevel = '1am' | '2am' | '3am' | '4am';

/** مرجع التتبع المصدري لملفات المنهاج والأرشيف البيداغوجي */
export interface ArchiveSourceTrace {
  sourceFile: string;
  sourceAuthor?: string;
  sourceSchool?: string;
  sourcePage: number;
  sourcePageEnd?: number;
  memoNumber?: string;
  midan: string;
  maqtaNumber?: string;
  maqtaTitle: string;
  mawridNumber?: string;
  mawridTitle: string;
  ta3alomTitle: string;
  activityNumber?: string;
}

/** سجل نشاط مستقل في بنك الأنشطة البيداغوجية */
export interface ArchivedActivity {
  id: string;
  level: CurriculumLevel;
  memoNumber: string;
  lessonId: string;
  maqtaId: string;
  maqtaTitle: string;
  mawridId: string;
  mawridTitle: string;
  ta3alom: string;
  activityNumber: string;
  title: string;
  instructions: string;
  questions: string[];
  answersAndConclusions: string;
  duration: string;
  workMode: string;
  sourcePage: number;
  experimentIds: string[];
  mediaIds: string[];
  tableIds: string[];
  evaluationIds: string[];
  worksheetIds: string[];
  trace: ArchiveSourceTrace;
}

/** سجل تجربة علمية مخبرية متكاملة */
export interface ArchivedExperiment {
  id: string;
  level: CurriculumLevel;
  memoNumber: string;
  title: string;
  goal: string;
  tools: string[];
  materials: string[];
  steps: string[];
  observation: string;
  conclusion: string;
  originalPhotoIds: string[];
  diagramIds: string[];
  relatedLessonId: string;
  relatedActivityId: string;
  trace: ArchiveSourceTrace;
}

export type ArchiveMediaType =
  | 'صورة'
  | 'تجربة'
  | 'مخطط'
  | 'رسم'
  | 'وثيقة'
  | 'أداة مخبر';

/** سجل وسائط علمية مستخرجة حرفياً من صفحات الملف المصدري */
export interface ArchivedMediaItem {
  id: string;
  level: CurriculumLevel;
  title: string;
  mediaType: ArchiveMediaType;
  imageUrl: string;
  description: string;
  sourcePage: number;
  memoNumber?: string;
  relatedLessonId?: string;
  relatedActivityId?: string;
  relatedExperimentId?: string;
  relatedWorksheetId?: string;
  canReuseInMemos: boolean;
  tags: string[];
}

/** سجل جدول رقمي حقيقي (عبر صفوف وأعمدة مهيكلة) */
export interface ArchivedTableRecord {
  id: string;
  level: CurriculumLevel;
  title: string;
  table: DB_Table;
  section: 'wadiya' | 'activity' | 'irsae' | 'taqwim' | 'worksheet' | 'appendix';
  memoNumber?: string;
  relatedLessonId?: string;
  relatedActivityId?: string;
  sourcePage: number;
  digitizedFromImage?: boolean;
  originalImageId?: string;
}

/** سجل تقويم مورد مع نصه وسنداته والحل النموذجي */
export interface ArchivedEvaluation {
  id: string;
  level: CurriculumLevel;
  memoNumber: string;
  title: string;
  prompt: string;
  modelAnswer: string;
  tableIds: string[];
  mediaIds: string[];
  relatedLessonId: string;
  relatedActivityIds: string[];
  sourcePage: number;
  trace: ArchiveSourceTrace;
}

/** سجل ورقة عمل أو ملحق بيداغوجي أو فاصل مقطع */
export interface ArchivedWorksheet {
  id: string;
  level: CurriculumLevel;
  title: string;
  category:
    | 'ورقة عمل تلميذ'
    | 'فاصل مقطع'
    | 'وسائل ومختبر'
    | 'رموز السلامة المخبرية'
    | 'خاتمة وتوثيق';
  memoNumber?: string;
  relatedLessonId?: string;
  content: string;
  instructions: string[];
  tableIds: string[];
  mediaIds: string[];
  sourcePage: number;
  sourcePageEnd?: number;
}

/** فهرس الصفحة المفردة لضمان تغطية 100% من صفحات الملف (98/98) */
export interface ArchivedPageRecord {
  pageNumber: number;
  category:
    | 'مذكرة تعليمية'
    | 'ورقة عمل ومستند تطبيقي'
    | 'فاصل مقطع تعلمي'
    | 'وسائل وأدوات المخبر'
    | 'رموز السلامة المخبرية'
    | 'خاتمة وتوثيق الأستاذ';
  title: string;
  memoNumber?: string;
  relatedLessonId?: string;
  relatedWorksheetIds: string[];
  mediaIds: string[];
  tableIds: string[];
  summary: string;
}

export interface ArchiveSearchResultGroup {
  lessons: LessonMemo[];
  activities: ArchivedActivity[];
  experiments: ArchivedExperiment[];
  media: ArchivedMediaItem[];
  tables: ArchivedTableRecord[];
  evaluations: ArchivedEvaluation[];
  worksheets: ArchivedWorksheet[];
}

export interface ActivityRecallBundle {
  lesson: LessonMemo;
  activity: ArchivedActivity;
  experiments: ArchivedExperiment[];
  media: ArchivedMediaItem[];
  tables: ArchivedTableRecord[];
  evaluations: ArchivedEvaluation[];
  worksheets: ArchivedWorksheet[];
}

export interface CurriculumArchiveDatabase {
  level: CurriculumLevel;
  sourceTitle: string;
  sourceFile: string;
  sourcePdfUrl: string;
  totalPages: number;
  author: string;
  school: string;
  location: string;
  lessons: LessonMemo[];
  activities: ArchivedActivity[];
  experiments: ArchivedExperiment[];
  media: ArchivedMediaItem[];
  tables: ArchivedTableRecord[];
  evaluations: ArchivedEvaluation[];
  worksheets: ArchivedWorksheet[];
  pages: ArchivedPageRecord[];
}
