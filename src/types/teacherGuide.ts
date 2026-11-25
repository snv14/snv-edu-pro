import type { ReactNode } from 'react';
import type { LessonMemo } from '../types';

export interface TeacherGuideSequence {
  id: string;
  number: number;
  title: string;
  weeks: number | string;
  hours: number;
  targetCompetency: string;
  priorKnowledge: string[];
  sourcePages?: number[];
  lessonSequence?: string;
  resources: {
    num: number;
    title: string;
    weeks: string;
    coreConcepts: string[];
    pedagogicalGuidance: string;
  }[];
}

export interface TeacherGuideConfig {
  level: '1am' | '2am' | '3am';
  title: string;
  description: string;
  badge: string;
  pdfUrl: string;
  downloadFileName?: string;
  authorityLabel?: string;
  resourceConceptLabel?: string;
  assessmentTabLabel?: string;
  searchPlaceholder: string;
  searchLabel: string;
  navLabel: string;
  targetLabel: string;
  resourcesLabel: string;
  notice?: string;
  lessonNotice?: string;
  stats: { value: string | number; label: string; detail: string }[];
}

export interface TeacherGuideExtraTab {
  id: `extra-${string}`;
  label: string;
  render: (query: string) => ReactNode;
}

export interface TeacherGuideViewerProps {
  lessons: LessonMemo[];
  config: TeacherGuideConfig;
  sequences: TeacherGuideSequence[];
  assessment: ReactNode | ((query: string) => ReactNode);
  extraTabs?: TeacherGuideExtraTab[];
  onOpenMemoUnit?: (lesson: LessonMemo) => void;
}
