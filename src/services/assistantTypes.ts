import type { KnowledgeReference } from './knowledgeBase';

/** نوايا المساعد الذكي: تُستنتج من السؤال ولا يختارها الأستاذ. */
export type AssistantIntent =
  | 'SEARCH_CURRICULUM'
  | 'SEARCH_ANNUAL_PROGRESSION'
  | 'SEARCH_TEACHER_GUIDE'
  | 'SEARCH_SUPPORTING_DOCUMENT'
  | 'SEARCH_ACTIVITY'
  | 'SEARCH_EXPERIMENT'
  | 'SEARCH_MEMO'
  | 'ANALYZE_DOCUMENT'
  | 'SUMMARIZE'
  | 'COMPARE_DOCUMENTS'
  | 'EXTRACT_CONTENT'
  | 'GENERATE_ACTIVITY'
  | 'GENERATE_ASSESSMENT'
  | 'REMEDIATION'
  | 'WEB_RESEARCH'
  | 'GENERAL_EDUCATIONAL_QUERY';

export const ASSISTANT_INTENT_LABELS: Record<AssistantIntent, string> = {
  SEARCH_CURRICULUM: 'بحث في المنهاج',
  SEARCH_ANNUAL_PROGRESSION: 'بحث في التدرج السنوي',
  SEARCH_TEACHER_GUIDE: 'بحث في دليل الأستاذ',
  SEARCH_SUPPORTING_DOCUMENT: 'بحث في الوثيقة المرافقة',
  SEARCH_ACTIVITY: 'بحث عن نشاط',
  SEARCH_EXPERIMENT: 'بحث عن تجربة',
  SEARCH_MEMO: 'بحث في المذكرات',
  ANALYZE_DOCUMENT: 'تحليل وثيقة',
  SUMMARIZE: 'تلخيص',
  COMPARE_DOCUMENTS: 'مقارنة مصادر',
  EXTRACT_CONTENT: 'استخراج محتوى',
  GENERATE_ACTIVITY: 'اقتراح نشاط',
  GENERATE_ASSESSMENT: 'اقتراح تقويم',
  REMEDIATION: 'معالجة بيداغوجية',
  WEB_RESEARCH: 'بحث خارجي',
  GENERAL_EDUCATIONAL_QUERY: 'سؤال تربوي عام',
};

export type ConnectorId = 'platform' | 'space' | 'web';

export const CONNECTOR_LABELS: Record<ConnectorId, string> = {
  platform: 'SNV Platform',
  space: 'Knowledge Spaces',
  web: 'Web Search',
};

export interface AssistantContext {
  level: string;
  levelLabel: string;
  subject: string;
  topic: string;
  sequence?: string;
  competency?: string;
  resource?: string;
  questionType: string;
  requestedAction: string;
  sourceScope: ConnectorId[];
}

export interface ContextNode {
  label: string;
  value: string;
}

export interface AssistantPlan {
  intent: AssistantIntent;
  intentLabel: string;
  level: string;
  topic: string;
  connectors: ConnectorId[];
  webMode: 'off' | 'explicit' | 'fallback';
  webReason?: string;
  stages: string[];
  context: AssistantContext;
}

export type EvidenceOrigin = 'official' | 'teacher' | 'web' | 'generated';

/** عنصر من مجموعة الأدلة التي تُبنى قبل الإجابة. */
export interface EvidenceItem {
  id: string;
  origin: EvidenceOrigin;
  title: string;
  section: string;
  page?: number;
  snippet: string;
  url?: string;
  relevance: number;
  /** سلطة المصدر: 100 رسمي، 60 وثيقة أستاذ، 30 ويب. */
  authority: number;
  confidenceLabel: string;
  referenceId?: string;
}

export interface SpaceCitation {
  sourceId: string;
  sourceName: string;
  page?: number;
  snippet: string;
  score: number;
}

export interface AssistantOutcome {
  text: string;
  references: KnowledgeReference[];
  spaceCitations: SpaceCitation[];
  webSources: Array<{ title: string; uri: string }>;
  plan: AssistantPlan;
  evidence: EvidenceItem[];
  followUps: string[];
  /** هل طلب الأستاذ صراحةً رؤية المصادر/المراجع. */
  revealSources: boolean;
  /** هل طلب الأستاذ صراحةً معرفة المستوى الدراسي. */
  revealLevel: boolean;
  usedLocal: boolean;
  fallbackNotice?: string;
  provider?: string;
}
