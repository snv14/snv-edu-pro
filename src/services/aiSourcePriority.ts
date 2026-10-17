export type AISourceType =
  | 'curriculum'
  | 'progression'
  | 'companionDocument'
  | 'teacherGuide'
  | 'memo'
  | 'attachment'
  | 'web'
  | 'library'
  | 'ai';

export const AI_SOURCE_PRIORITY: Record<AISourceType, number> = {
  curriculum: 1,
  progression: 1,
  companionDocument: 2,
  teacherGuide: 3,
  memo: 4,
  attachment: 5,
  web: 6,
  library: 7,
  ai: 8,
};

export const sourcePriorityOf = (type: string): number =>
  AI_SOURCE_PRIORITY[type as AISourceType] ?? AI_SOURCE_PRIORITY.ai;
