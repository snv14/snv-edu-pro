import type { LessonMemo } from '../types';
import { normalizeArabic } from './knowledgeBase';
import type {
  AssistantContext,
  AssistantIntent,
  ConnectorId,
  ContextNode,
} from './assistantTypes';

/**
 * استخراج السياق التربوي قبل البحث: المستوى، المقطع، الكفاءة، المورد،
 * نوع السؤال، الإجراء المطلوب، ونطاق المصادر. لا يطلب من الأستاذ إدخالها.
 */

const LEVEL_LABELS: Record<string, string> = {
  '1am': 'السنة الأولى متوسط',
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
  all: 'كل المستويات',
};

const ACTION_LABELS: Record<AssistantIntent, string> = {
  SEARCH_CURRICULUM: 'استرجاع معلومة من المنهاج',
  SEARCH_ANNUAL_PROGRESSION: 'استرجاع من التدرج السنوي',
  SEARCH_TEACHER_GUIDE: 'استرجاع من دليل الأستاذ',
  SEARCH_SUPPORTING_DOCUMENT: 'استرجاع من الوثيقة المرافقة',
  SEARCH_ACTIVITY: 'العثور على نشاط',
  SEARCH_EXPERIMENT: 'العثور على تجربة',
  SEARCH_MEMO: 'استرجاع من المذكرة',
  ANALYZE_DOCUMENT: 'تحليل وثيقة',
  SUMMARIZE: 'تلخيص المصادر',
  COMPARE_DOCUMENTS: 'مقارنة المصادر',
  EXTRACT_CONTENT: 'استخراج محتوى',
  GENERATE_ACTIVITY: 'تصميم نشاط',
  GENERATE_ASSESSMENT: 'تصميم تقويم',
  REMEDIATION: 'تصميم معالجة تربوية',
  WEB_RESEARCH: 'بحث خارجي',
  GENERAL_EDUCATIONAL_QUERY: 'إجابة تربوية',
};

const clean = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

const extractAfter = (question: string, keywords: string[]): string | undefined => {
  const raw = clean(question);
  for (const keyword of keywords) {
    const match = raw.match(new RegExp(`${keyword}\\s+(.+?)(?:\\s+(?:للسنة|في السنة|من فضلك)|[.،؟!]|$)`));
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
};

export interface ContextArgs {
  question: string;
  level?: string;
  lesson?: LessonMemo | null;
  intent: AssistantIntent;
  intentLabel: string;
  topic: string;
  connectors: ConnectorId[];
}

export function detectAssistantContext({
  question,
  level,
  lesson,
  intent,
  intentLabel,
  topic,
  connectors,
}: ContextArgs): AssistantContext {
  const sequence = clean(lesson?.maqta)
    || extractAfter(question, ['المقطع', 'مقطع', 'الوحدة', 'وحدة'])
    || (/(?:المقطع|مقطع)\s+([^.،؟!]+)/.test(question) ? question.match(/(?:المقطع|مقطع)\s+([^.،؟!]+)/)?.[1] : undefined);
  const resource = clean(lesson?.mawrid)
    || extractAfter(question, ['المورد', 'مورد', 'درس', 'موضوع'])
    || topic;
  const competency = clean(lesson?.markaba) || clean(lesson?.kafaaKhitamiya) || undefined;
  const subject = 'علوم الطبيعة والحياة';
  const questionType = intentLabel || 'سؤال تربوي';
  const requestedAction = ACTION_LABELS[intent] || 'إجابة تربوية';
  const levelLabel = LEVEL_LABELS[level || 'all'] || (level ? level : 'كل المستويات');

  // احتياط: إن لم يوجد مورد صريح، استعمل الموضوع ما دام ليس سؤالًا عامًا.
  const safeResource = resource && !/^(ما|كيف|لماذا|هل)\b/.test(normalizeArabic(resource)) ? resource : undefined;

  return {
    level: level || 'all',
    levelLabel,
    subject,
    topic: topic || safeResource || 'سؤال عام',
    sequence: sequence || undefined,
    competency,
    resource: safeResource,
    questionType,
    requestedAction,
    sourceScope: connectors.slice(),
  };
}

/** سلسلة المعرفة التربوية المعروضة للأستاذ: مستوى ← ميدان ← مقطع ← كفاءة ← مورد. */
export function contextGraph(context: AssistantContext, lesson?: LessonMemo | null): ContextNode[] {
  const nodes: ContextNode[] = [
    { label: 'المستوى', value: context.levelLabel },
    { label: 'المادة', value: context.subject },
    { label: 'الميدان', value: clean(lesson?.midan) },
    { label: 'المقطع', value: context.sequence || '' },
    { label: 'الكفاءة', value: context.competency || '' },
    { label: 'المورد', value: context.resource || '' },
  ];
  return nodes.filter(node => Boolean(node.value));
}

/** اقتراحات متابعة قصيرة (سؤالان أو ثلاثة) بدل عشرات الأزرار. */
export function suggestFollowUps(intent: AssistantIntent, topic: string): string[] {
  const subject = topic || 'هذا الموضوع';
  switch (intent) {
    case 'SEARCH_ACTIVITY':
    case 'GENERATE_ACTIVITY':
      return [
        `حوّل نشاط «${subject}» إلى وضعية إدماجية قصيرة.`,
        `اقترح تقويمًا من 20 لهذا المورد.`,
        `كيف أعالج الأخطاء المتوقعة في «${subject}»؟`,
      ];
    case 'GENERATE_ASSESSMENT':
      return [
        `أعد توزيع نقاط هذا التقويم على 20.`,
        `اقترح سلم تنقيط ومؤشرات نجاح.`,
        `اقترح معالجة للأخطاء المتوقعة.`,
      ];
    case 'REMEDIATION':
      return [
        `صمّم نشاطًا علاجيًا بديلًا حول «${subject}» بالوسائل المتاحة.`,
        `اقترح تقويمًا مصغّرًا بعد معالجة «${subject}».`,
        `اذكر الأخطاء الشائعة الأخرى في «${subject}».`,
      ];
    case 'COMPARE_DOCUMENTS':
    case 'SUMMARIZE':
      return [
        `استخرج الأنشطة المشتركة بين المصادر.`,
        `اعرض الفروق في جدول مختصر.`,
        `اقترح نشاطًا بناءً على هذه المصادر.`,
      ];
    case 'SEARCH_EXPERIMENT':
      return [
        `اقترح بديلًا آمنًا لهذه التجربة.`,
        `صغ أسئلة التقويم المرتبطة بالتجربة.`,
      ];
    default:
      return [
        `اقترح نشاطًا تربويًا لهذا المورد.`,
        `استخرج الأنشطة والتقويم من المصادر.`,
      ];
  }
}
