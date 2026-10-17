export type GradeLevel = '1AM' | '2AM' | '3AM' | '4AM';

export interface ScientificTerm {
  arabic: string;
  french: string;
  english: string;
}

export interface ExperimentItem {
  substanceTested: string;
  reagentUsed: string;
  expectedObservation: string;
  scientificConclusion: string;
}

export interface LessonSequenceStage {
  stageName: string;
  timeMinutes: number;
  teacherInstructions: string;
  studentActivities: string;
  didacticSupports: string[];
}

export interface SourceActivityTitles {
  title1: string;
  title2: string;
  assessment: string;
  sourceType: MemoSourceType;
  sourceLabel: string;
  sourceId?: string;
  sourceId2?: string;
  assessmentSourceId?: string;
}

export interface StudentWorksheet {
  instructions: string[];
  questionsToAnswer: string[];
}

export type MemoSourceType = 'curriculum' | 'progression' | 'companionDocument' | 'teacherGuide' | 'memo' | 'library' | 'attachment' | 'web' | 'ai';

export interface MemoSourceTrace {
  field: string;
  value: string;
  sourceType: MemoSourceType;
  sourceLabel: string;
  sourceId?: string;
  uri?: string;
}

export interface ResearchSource { title: string; url: string; purpose: string; }
export interface VisualPlan { diagramType: string; description: string; imageSuggestions: string[]; }

export interface BemEvaluationGrid {
  relevance: string;
  correctUseOfTools: string;
  coherence: string;
}

export interface PedagogicalNote {
  meta: {
    gradeLevel: GradeLevel;
    field: string;
    learningUnit: string;
    learningResource: string;
    lessonTitle: string;
    durationHours: number;
    targetedCompetence: string;
  };
  pedagogicalTriad: {
    knowledgeResource: string;
    methodologicalResource: string;
    valuesResource: string;
  };
  requirements: {
    prerequisites: string[];
    didacticMeans: string[];
    scientificTerms: ScientificTerm[];
  };
  experiments: ExperimentItem[];
  sequence: LessonSequenceStage[];
  studentWorksheet: StudentWorksheet;
  researchSources: ResearchSource[];
  sourceTrace: MemoSourceTrace[];
  sourceActivities: SourceActivityTitles;
  visualPlan: VisualPlan;
  bemEvaluationGrid: BemEvaluationGrid;
}
