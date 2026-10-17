export interface MemoTable {
  table_id?: string;
  table_title?: string;
  headers: string[];
  rows: string[][];
}

export type DB_Table = MemoTable;

export interface Activity {
  /** Stable source identifier from the curriculum database. */
  sourceActivityId?: string;
  title: string;
  asila: string;
  ajwiba: string;
  zaman?: string;
  mola7adha?: string;
  diagrams?: any[];
  tables?: { headers: string[], rows: string[][] }[];
}

export interface LessonMemo {
  /** Stable source identifiers used for exact curriculum traceability. */
  sourceSequenceId?: string;
  sourceResourceId?: string;
  sourceLearningUnitId?: string;
  sourceOfficial?: boolean;
  sourceType?: string;
  sourceLabel?: string;
  level: '1am' | '2am' | '3am' | '4am';
  midan: string;
  maqta: string;
  mawrid: string;
  ta3alom: string;
  markaba?: string;
  kafaaKhitamiya?: string;
  ma3ayirTaqwim?: string;
  marifa?: string;
  manhaji?: string;
  mostalahat?: string;
  wasail?: string;
  marajie?: string;
  zamanKoli?: string;
  wadiya?: string;
  moshkila?: string;
  faradiyat?: string;
  anshita: Activity[];
  irsae?: string;
  irsaeTables?: { headers: string[], rows: string[][] }[];
  wadiyaTables?: { headers: string[], rows: string[][] }[];
  taqwimTables?: { headers: string[], rows: string[][] }[];
  taqwim?: string;
  memoNumber?: string;
  diagrams?: { title?: string; svg?: string; description?: string }[];
  diagramTitle?: string;
  diagramSvg?: string;
  diagramDescription?: string;
  diagram?: string | {
    title?: string;
    svg?: string;
    description?: string;
  };
  worksheetData?: {
    title: string;
    subtitle?: string;
    instructions: string[];
    tableOrContent?: string;
  };
  ustadhNashat?: {
    inilitaq?: string;
    taqasi?: string;
    irsae?: string;
    taqwim?: string;
  };
  mutaalimNashat?: {
    inilitaq?: string;
    taqasi?: string;
    irsae?: string;
    taqwim?: string;
  };
}

export interface MemoConfig {
  level: '1am' | '2am' | '3am' | '4am';
  memoFormat?: 'standard' | 'merged_teacher'; // 'standard': منفصل (أستاذ + متعلم) | 'merged_teacher': مدمج تحت نشاط الأستاذ (بدون خانة نشاط المتعلم)
  schoolName: string;
  directorate: string;
  inspectionDistrict?: string;
  teacherName: string;
  teacherGrade?: string;
  teacherPhone?: string;
  teacherEmail?: string;
  schoolYear: string;
  memoNumber: string;
  principalName: string;
  inspectorName?: string;
  signDate: string;
  teacherStamp: string | null;
  assignedClasses?: string[];
  weeklyHours?: number;
}

export interface DailyLogEntry {
  id: string;
  date: string;
  dayOfWeek: string;
  period: string; // e.g. '08:00 - 09:00'
  level: '1am' | '2am' | '3am' | '4am';
  className: string; // e.g. '1 م 1'
  midan: string;
  maqta: string;
  mawrid: string;
  ta3alom?: string;
  lessonTitle: string;
  activitiesList?: string[];
  taqwim?: string;
  sourceSequenceId?: string;
  sourceResourceId?: string;
  sourceLearningUnitId?: string;
  sourceActivityId?: string;
  sourceActivityId2?: string;
  activityType: 'درس نظري' | 'حصة مخبرية / تجريبية' | 'وضعية انطلاق' | 'إدماج وتقويم' | 'فرض محروس' | 'معالجة بيداغوجية';
  homework?: string;
  observations?: string;
  absentCount?: number;
  isCompleted: boolean;
}

export type LessonType = 'curriculum' | 'introductory' | 'opening' | 'health' | 'remediation' | 'assessment' | 'holiday';

export interface AnnualDistributionItem {
  id: string;
  level: '1am' | '2am' | '3am' | '4am';
  trimester: 1 | 2 | 3;
  month: string;
  weekNumber: number;
  weekDates?: string;
  midan: string;
  maqta: string;
  mawrid: string;
  learningContent: string;
  allocatedHours: number;
  notes?: string;
  status: 'completed' | 'in_progress' | 'pending';
  lessonType?: LessonType;
  sourceSequenceId?: string;
  sourceResourceId?: string;
  sourceLearningUnitId?: string;
  sourceActivityId?: string;
  /** Stable source identifier for the second scheduled activity/session. */
  sourceActivityId2?: string;
}
