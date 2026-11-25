import type { LessonMemo } from '../types';
import type { TeacherKnowledgeDoc, KnowledgeLevel } from '../types/knowledge';
import {
  askSmartAi,
  type SmartAiAttachment,
  type SmartAiMessage,
} from './smartAi';
import { detectLevel, normalizeArabic, type KnowledgeReference } from './knowledgeBase';
import { loadKnowledgeSettings, type KnowledgeSettings } from './knowledgeLibraryStore';
import { preloadOfficialSources } from './knowledgeOfficialSources';
import { type KnowledgeSpace, type SpaceSearchHit } from './knowledgeSpaces';
import { collectConnectorEvidence } from './assistantConnectors';
import { detectAssistantContext, suggestFollowUps } from './assistantContext';
import { evidenceFromReferences, evidenceFromWeb } from './assistantEvidence';
import {
  ASSISTANT_INTENT_LABELS,
  type AssistantIntent,
  type AssistantOutcome,
  type AssistantPlan,
  type SpaceCitation,
} from './assistantTypes';

/* ───────────────────────────── فهم السؤال ───────────────────────────── */

const LEVEL_SUFFIX = /\b(1am|2am|3am|4am)\b/i;

/** استنتاج نية الأستاذ من صياغة السؤال؛ لا يختار الأستاذ أي Connector. */
export function detectAssistantIntent(question: string): AssistantIntent {
  const q = normalizeArabic(question);
  if (!q) return 'GENERAL_EDUCATIONAL_QUERY';
  if (/في الانترنت|علي الانترنت|الويب|بحث خارجي|مصادر خارجيه|روابط خارجيه|جوجل|google|معلومات حديثه/.test(q)) return 'WEB_RESEARCH';
  if (/قارن|مقارنه|الفرق بين|اوجه الشبه|اوجه الاختلاف/.test(q)) return 'COMPARE_DOCUMENTS';
  if (/لخص|تلخيص|ملخص|اجمع محتوي/.test(q)) return 'SUMMARIZE';
  if (/حلل|تحليل|اقرا|قراءه|استخرج النص|صوره|pdf|ملف مرفق/.test(q) && /وثيقه|ملف|صوره|pdf|مرفق/.test(q)) return 'ANALYZE_DOCUMENT';
  if (/استخرج|استخراج|جدول|معطيات|بيانات|تعليمات|اسئله موجوده/.test(q) && !/اقترح|صمم/.test(q)) return 'EXTRACT_CONTENT';
  if (/معالجه|علاج|اخطاء|خطا متكرر|نسبه النجاح|غير متحكم|ضعف التلاميذ/.test(q)) return 'REMEDIATION';
  if (/(اقترح|صمم|ابن|اعد|اعطني).*(اختبار|فرض|تمرين|تقييم|تقويم|سؤال|وضعيه ادماجيه)/.test(q)) return 'GENERATE_ASSESSMENT';
  if (/(اقترح|صمم|ابن|اعد|اعطني).*(نشاط|تجربه|وضعيه|سيناريو|حلقه|مهمه)/.test(q)) return 'GENERATE_ACTIVITY';
  if (/تجربه|بروتوكول|مخبر|تجريبي/.test(q)) return 'SEARCH_EXPERIMENT';
  if (/نشاط|انشطه|نشاطات/.test(q)) return 'SEARCH_ACTIVITY';
  if (/دليل الاستاذ|دليل المعلم/.test(q)) return 'SEARCH_TEACHER_GUIDE';
  if (/الوثيقه المرافقه|وثيقه مرافقه/.test(q)) return 'SEARCH_SUPPORTING_DOCUMENT';
  if (/التدرج|التدرج السنوي|التوزيع السنوي|توزيع الحصص/.test(q)) return 'SEARCH_ANNUAL_PROGRESSION';
  if (/مذكره|مذكرات|الوضعيه الانطلاقيه|الارساء|ارساء الموارد/.test(q)) return 'SEARCH_MEMO';
  if (/المنهاج|الكفاءه|الميدان|المقطع|المورد المعرفي/.test(q)) return 'SEARCH_CURRICULUM';
  return 'GENERAL_EDUCATIONAL_QUERY';
}

const LEVEL_LABELS: Record<string, string> = {
  '1am': 'السنة الأولى متوسط',
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
};

export const assistantLevelLabel = (level: string): string => LEVEL_LABELS[level] || (level ? level : 'كل المستويات');

const ARABIC_LEVEL_PATTERNS: Array<[RegExp, string]> = [
  [/(?:ال|ل)?سنه\s*(?:ال)?(اولي|اول)(?=\s|$)/, '1am'],
  [/(?:ال|ل)?سنه\s*(?:ال)?(ثانيه|ثاني)(?=\s|$)/, '2am'],
  [/(?:ال|ل)?سنه\s*(?:ال)?(ثالثه|ثالث)(?=\s|$)/, '3am'],
  [/(?:ال|ل)?سنه\s*(?:ال)?(رابعه|رابع)(?=\s|$)/, '4am'],
];

/** استنتاج المستوى من السؤال ثم من سياق المنصة. */
export function detectAssistantLevel(question: string, fallback = ''): string {
  const direct = String(question || '').match(LEVEL_SUFFIX)?.[1]?.toLowerCase();
  if (direct) return direct;
  const normalized = normalizeArabic(question);
  const arabic = ARABIC_LEVEL_PATTERNS.find(([pattern]) => pattern.test(normalized))?.[1];
  if (arabic) return arabic;
  const level = detectLevel(question, (fallback || 'all') as KnowledgeLevel);
  return level || fallback || 'all';
}

const SOURCE_REQUEST = /(?:ما|ماذا|اذكر|أذكر|ارني|أرني|اظهر|أظهر|عين|حدد|من اين|من وين)\s+(?:هي\s+|هو\s+)?(?:ال)?(?:مصدر|مصادر|مرجع|مراجع)|من اين|من وين|معرفه (?:ال)?(?:مصدر|مصادر)|مصادرك|مراجعك|رقم الصفحه|اي صفحه|الوثيقه التي/;
const LEVEL_REQUEST = /اي مستوي|أي مستوي|اي سنه|أي سنه|المستوي الدراسي|مستوي دراسي|اي صف/;

/** هل طلب الأستاذ صراحةً رؤية المصادر؟ */
export const wantsSources = (question: string): boolean => SOURCE_REQUEST.test(normalizeArabic(question));

/** هل طلب الأستاذ صراحةً معرفة المستوى الدراسي؟ */
export const wantsLevel = (question: string): boolean => LEVEL_REQUEST.test(normalizeArabic(question));

const FOLLOW_UP = /^(اجعله|اجعلها|اضف|أضف|ادخله|أدخله|حوله|حولها|عدل|عدله|نفسه|نفسها|هذا|هذه|قصير|اعد|أعد|طبقه|طبّقه)/;

/**
 * توسيع سؤال متابعة قصير بآخر سؤال للأستاذ حتى يبحث المساعد في الموضوع نفسه
 * (مثال: «اجعله أكثر تفاعلية» بعد «أريد نشاطًا حول الهضم»).
 */
export function expandConversationQuery(question: string, history: SmartAiMessage[] = []): string {
  const clean = String(question || '').trim();
  if (!clean || !history.length) return clean;
  const lastUser = [...history].reverse().find(message => message.role === 'user' && message.text?.trim());
  if (!lastUser || lastUser.text.trim() === clean) return clean;
  const isFollowUp = FOLLOW_UP.test(normalizeArabic(clean));
  if (!isFollowUp) return clean;
  const anchor = lastUser.text.replace(/\s+/g, ' ').trim().slice(0, 180);
  return anchor && !anchor.includes(clean) ? `${anchor} — ${clean}` : clean;
}

/** إزالة أثر الاستشهادات والمصادر من الرد العادي. */
export function stripSourceDetails(text: string): string {
  return String(text || '')
    .replace(/\n{2,}#{1,4}\s*(?:📘\s*)?(?:وارد في المصادر|المصادر|المراجع)[\s\S]*$/i, '')
    .replace(/^\s*>\s*مقتطفات حرفية.*$/gm, '')
    .replace(/\[(\d{1,2})\]/g, '')
    .replace(/^\s*(?:المصدر|المصادر|المرجع|المراجع)\s*:.*$/gm, '')
    .replace(/(?:وفق(?:ًا|ا)|حسب|طبق(?:ًا|ا))\s+(?:للمنهاج|للوثيقة المرافقة|لدليل الأستاذ|للمذكرة|للتدرج)[^،.؛\n]*[،.؛]?/g, '')
    .replace(/\((?:ص|صفحة)\s*\d+[^)]*\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** عنوان موضوع مختصر يُعرض في خطة المساعد. */
export function topicFromQuestion(question: string): string {
  const clean = String(question || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'سؤال عام';
  const match = clean.match(/(?:درس|مورد|مقطع|موضوع|نشاط|وحدة)\s+(.+?)(?:\s+(?:للسنة|في السنة|من فضلك)|[.،؟!]|$)/);
  const topic = (match?.[1] || clean).replace(/^(ابحث|أبحث|أريد|اريد|اقترح|أعطني|اعطني|لخص|قارن)\s+/, '').trim();
  return topic.length > 72 ? `${topic.slice(0, 72)}…` : topic;
}

/* ───────────────────────────── خطة التنفيذ ───────────────────────────── */

export interface PlanArgs {
  question: string;
  level?: string;
  lesson?: LessonMemo | null;
  curriculum?: LessonMemo[];
  space?: KnowledgeSpace | null;
  hasAttachments?: boolean;
  webAllowed?: boolean;
}

export function planAssistantQuery({
  question,
  level,
  lesson,
  curriculum = [],
  space,
  hasAttachments,
  webAllowed = true,
}: PlanArgs): AssistantPlan {
  const detectedIntent = detectAssistantIntent(question);
  const intent = hasAttachments && detectedIntent === 'GENERAL_EDUCATIONAL_QUERY' ? 'ANALYZE_DOCUMENT' : detectedIntent;
  const resolvedLevel = detectAssistantLevel(question, level || '');
  const topic = topicFromQuestion(question);
  const spaceReady = Boolean(space && space.sources.some(source => source.status === 'ready'));
  const connectors: AssistantPlan['connectors'] = ['platform'];
  if (spaceReady) connectors.push('space');
  const webMode: AssistantPlan['webMode'] = intent === 'WEB_RESEARCH'
    ? (webAllowed ? 'explicit' : 'off')
    : (webAllowed ? 'fallback' : 'off');
  if (webMode === 'explicit') connectors.push('web');

  const stages = [
    '🔎 أفهم طلبك…',
    '📚 أبحث في مراجع المنصة…',
    spaceReady ? '📄 أقرأ وثائق مساحة المعرفة…' : '',
    webMode === 'explicit' ? '🌐 أتحقق من المصادر الخارجية…' : '',
    '🤖 أرتب المعلومات وأتحقق من المصادر…',
  ].filter(Boolean);

  const context = detectAssistantContext({
    question,
    level: resolvedLevel,
    lesson,
    intent,
    intentLabel: ASSISTANT_INTENT_LABELS[intent],
    topic,
    connectors,
  });

  return {
    intent,
    intentLabel: ASSISTANT_INTENT_LABELS[intent],
    level: resolvedLevel,
    topic,
    connectors,
    webMode,
    webReason: webMode === 'explicit' ? 'طلب الأستاذ البحث في الإنترنت أو مصادر خارجية.' : undefined,
    stages,
    context,
  };
}

/* ───────────────────────────── تحويل النتائج إلى مصادر ───────────────────────────── */

const spaceCitationsOf = (hits: SpaceSearchHit[]): SpaceCitation[] =>
  hits.map(hit => ({
    sourceId: hit.source.id,
    sourceName: hit.source.name,
    page: hit.chunk.page,
    snippet: hit.snippet,
    score: hit.score,
  }));

/* ───────────────────────────── صياغة محلية موثقة ───────────────────────────── */

const clip = (value: string, max = 320): string => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
};

export const NO_CONFIRMED_INFORMATION = 'لم أجد معلومة مؤكدة في المصادر المتاحة حاليًا.';

const localizedSuggestions = (plan: AssistantPlan): string[] => {
  const topic = plan.topic || 'الموضوع';
  switch (plan.intent) {
    case 'GENERATE_ACTIVITY':
    case 'SEARCH_ACTIVITY':
      return [
        `نشاط تشخيصي قصير حول «${topic}»: سند واحد + سؤالان يستعيدان التمثلات الأولية (5 دقائق).`,
        'نشاط استكشافي في مجموعات: توزيع وثيقة/تجربة، تعليمات مرقمة، ثم عرض النتائج ومناقشة الفرضيات.',
        'نشاط إدماجي: وضعية جديدة يعيد فيها التلميذ توظيف المورد، مع سلّم تنقيط مختصر ومؤشرات نجاح.',
      ];
    case 'GENERATE_ASSESSMENT':
      return [
        'سؤال استرجاع مباشر للتحقق من المصطلحات الأساسية.',
        'سؤال تطبيق على سند جديد (جدول/رسم/تجربة) يقيس توظيف المورد.',
        'وضعية إدماجية قصيرة مع ثلاثة مؤشرات نجاح وسلّم تنقيط من 20.',
      ];
    case 'REMEDIATION':
      return [
        'تشخيص موضع الخلل: هل هو مصطلح، قراءة سند، أم ربط سبب/نتيجة؟',
        'إعادة بناء المفهوم بسند مبسّط ثم تمرين قصير فوري مع تصحيح جماعي.',
        'تقويم مصغّر بعد أسبوع لقياس استقرار المعالجة وتسجيل من لم يتجاوز بعد.',
      ];
    case 'COMPARE_DOCUMENTS':
      return [
        'وحّد محاور المقارنة أولًا: الهدف، السند، التعليمات، الجواب المرتقب، والمستوى المستهدف.',
        'أشر إلى موضع الاتفاق وموضع الاختلاف في كل محور، ولا تعمّم من وثيقة واحدة.',
      ];
    default:
      return [
        'استعمل المقتطفات أعلاه كما هي في التحضير، وأضف من عندك فقط ما وُسم صراحةً كاقتراح.',
        'راجع المصدر الأصلي قبل الاعتماد النهائي، خصوصًا أرقام الصفحات والتعليمات.',
      ];
  }
};

/** جواب محلي بأسلوب محادثة: النتيجة أولًا دون أسماء وثائق أو مستويات أو صفحات. */
export function buildConversationalLocalAnswer(plan: AssistantPlan, references: KnowledgeReference[]): string {
  if (!references.length) {
    return [
      'لم أجد معلومة مؤكدة كافية للإجابة عن هذا الطلب.',
      '',
      'جرّب إعادة صياغة الطلب أو تفصيله أكثر، وسأتابع معك.',
    ].join('\n');
  }

  const points = references.slice(0, 3).map(reference => `- ${clip(reference.snippet, 300)}`);
  const suggestions = localizedSuggestions(plan)
    .filter(item => !/مصدر|مقتطف|صفح|وثيق|المستوى/.test(item))
    .slice(0, 3);
  const nextSteps = suggestions.length ? suggestions : [
    'أخبرني إن أردت تحويل الإجابة إلى نشاط أو تجربة أو مذكرة جاهزة.',
    'يمكنك طلب التعديل أو التوضيح، وسأتابع نفس الموضوع دون إعادة الشرح.',
  ];
  return [
    '### الإجابة',
    ...points,
    '',
    '### 🤖 اقتراح المساعد',
    ...nextSteps.map(item => `- ${item}`),
  ].join('\n');
}

/** بناء جواب محلي يستند حرفيًا إلى المقاطع المسترجعة، بلا اختراع معلومات. */
export function buildGroundedLocalAnswer(
  plan: AssistantPlan,
  references: KnowledgeReference[],
  spaceTitle = '',
): string {
  if (!references.length) {
    return [
      NO_CONFIRMED_INFORMATION,
      '',
      '- لم تُطابق المصادر الرسمية ولا وثائق مساحة المعرفة سؤالك بدرجة كافية.',
      spaceTitle
        ? `- أضف وثيقة أدق إلى مساحة «${spaceTitle}»، أو أعد صياغة السؤال بمصطلح المورد.`
        : '- أضف وثيقة إلى مساحة معرفة، أو اسمح بالبحث الخارجي عند الحاجة.',
      '- لن أخترع صفحة أو وثيقة غير موجودة.',
    ].join('\n');
  }

  const lines: string[] = [];
  lines.push('### 📘 وارد في المصادر');
  lines.push('> مقتطفات حرفية من المصادر المسترجعة، دون إضافة معلومات من عندي.');
  lines.push('');
  references.slice(0, 6).forEach((reference, index) => {
    const page = reference.page ? ` — ص ${reference.page}` : '';
    lines.push(`**[${index + 1}] ${reference.title}** — ${reference.section}${page}`);
    lines.push(clip(reference.snippet));
    lines.push('');
  });

  lines.push('### 🤖 اقتراح المساعد — يحتاج مراجعة الأستاذ');
  localizedSuggestions(plan).forEach(item => lines.push(`- ${item}`));
  lines.push('');
  lines.push('### المصادر');
  references.slice(0, 8).forEach((reference, index) => {
    const page = reference.page ? ` — ص ${reference.page}` : '';
    const origin = reference.status === 'teacher' || reference.kind === 'teacherDocument' ? 'وثيقة الأستاذ' : 'قاعدة المنصة';
    lines.push(`[${index + 1}] ${reference.title} — ${reference.section}${page} · ${origin}`);
  });

  return lines.join('\n');
}

/* ───────────────────────────── التحقق من الاستشهادات ───────────────────────────── */

/** حذف أي إشارة استشهاد تتجاوز عدد المصادر الحقيقية. */
export function validateCitationMarkers(text: string, referenceCount: number): string {
  return String(text || '').replace(/\[(\d{1,2})\]/g, (match, value) => {
    const index = Number(value);
    return index >= 1 && index <= referenceCount ? match : '';
  });
}

const hasSourcesSection = (text: string): boolean =>
  /(^|\n)#{1,4}\s*المصادر(?=\s|$)/.test(text) || /(^|\n)\*\*المصادر\*\*/.test(text) || /(^|\n)المصادر\s*:/.test(text);

export function ensureSourcesSection(text: string, references: KnowledgeReference[]): string {
  const clean = String(text || '').trim();
  if (!references.length || hasSourcesSection(clean)) return clean;
  const lines = references.slice(0, 8).map((reference, index) => {
    const page = reference.page ? ` — ص ${reference.page}` : '';
    const origin = reference.status === 'teacher' || reference.kind === 'teacherDocument' ? 'وثيقة الأستاذ' : 'قاعدة المنصة';
    return `[${index + 1}] ${reference.title} — ${reference.section}${page} · ${origin}`;
  });
  return `${clean}\n\n### المصادر\n${lines.join('\n')}`;
}

/* ───────────────────────────── تنفيذ الطلب ───────────────────────────── */

export interface RunAssistantArgs {
  question: string;
  level?: string;
  lesson?: LessonMemo | null;
  curriculum: LessonMemo[];
  space?: KnowledgeSpace | null;
  attachments?: SmartAiAttachment[];
  history?: SmartAiMessage[];
  signal?: AbortSignal;
  settings?: Partial<KnowledgeSettings>;
  extraDocs?: TeacherKnowledgeDoc[];
  webAllowed?: boolean;
}

export async function runAssistantQuery(args: RunAssistantArgs): Promise<AssistantOutcome> {
  const settings = { ...loadKnowledgeSettings(), ...(args.settings || {}) };
  const retrievalQuestion = expandConversationQuery(args.question, args.history || []);
  const revealSources = wantsSources(args.question);
  const revealLevel = wantsLevel(args.question);
  // لا نقيّد البحث بمستوى مفتوح في المنصة؛ نستخدم المورد فقط إذا طابق المستوى المطلوب صراحةً.
  const requestedLevel = detectAssistantLevel(retrievalQuestion, '');
  const scopedLesson = args.lesson && requestedLevel !== 'all' && args.lesson.level === requestedLevel ? args.lesson : null;
  const plan = planAssistantQuery({
    question: retrievalQuestion,
    level: args.level,
    lesson: scopedLesson,
    curriculum: args.curriculum,
    space: args.space,
    hasAttachments: Boolean(args.attachments && args.attachments.length),
    webAllowed: args.webAllowed !== false,
  });

  if (settings.includeOfficialSources !== false) {
    await preloadOfficialSources();
  }

  const collected = await collectConnectorEvidence({
    question: retrievalQuestion,
    plan,
    lesson: scopedLesson,
    curriculum: args.curriculum,
    space: args.space,
    settings,
    extraDocs: args.extraDocs,
  });
  const spaceHits = collected.spaceHits;
  let references = collected.references;

  let webUsed = plan.webMode === 'explicit';
  const hasAttachments = Boolean(args.attachments && args.attachments.length);
  if (!webUsed && !references.length && !hasAttachments && args.webAllowed !== false) {
    webUsed = true;
    plan.webMode = 'fallback';
    plan.webReason = 'لا توجد نتائج كافية في قاعدة المنصة أو مساحة المعرفة.';
    if (!plan.connectors.includes('web')) plan.connectors.push('web');
    const stage = '🌐 أتحقق من المصادر الخارجية…';
    if (!plan.stages.includes(stage)) plan.stages.splice(Math.max(1, plan.stages.length - 1), 0, stage);
  }

  const allFollowUps = suggestFollowUps(plan.intent, plan.topic);
  const followUps = revealSources
    ? allFollowUps
    : allFollowUps.filter(item => !/مصدر|مرجع|وثيق|صفح/.test(item));
  const buildFallback = (notice?: string): AssistantOutcome => ({
    text: revealSources
      ? buildGroundedLocalAnswer(plan, references, args.space?.title || '')
      : buildConversationalLocalAnswer(plan, references),
    references,
    evidence: evidenceFromReferences(references),
    followUps,
    revealSources,
    revealLevel,
    spaceCitations: spaceCitationsOf(spaceHits),
    webSources: [],
    plan,
    usedLocal: true,
    fallbackNotice: notice,
    provider: 'knowledge-base',
  });

  if (settings.localFirst && !hasAttachments) {
    return buildFallback();
  }

  if (!references.length && !hasAttachments && !webUsed) {
    return buildFallback();
  }

  const platformCount = references.filter(reference => reference.kind !== 'teacherDocument').length;
  const extraContext = spaceHits.length
    ? [
      `مقتطفات من مساحة المعرفة «${args.space?.title || ''}» (وثائق الأستاذ) — استشهد بها بأسماء الملفات وأرقام صفحاتها ولا تنسبها إلى المنهاج:`,
      ...spaceHits.map((hit, index) => {
        const number = platformCount + index + 1;
        return `[${number}] ${hit.source.name}${hit.chunk.page ? ` — ص ${hit.chunk.page}` : ''}: ${clip(hit.chunk.text, 900)}`;
      }),
    ].join('\n')
    : '';

  try {
    const reply = await askSmartAi({
      question: retrievalQuestion,
      lesson: scopedLesson,
      curriculum: args.curriculum,
      attachments: args.attachments || [],
      useWeb: webUsed,
      level: plan.level === 'all' ? undefined : plan.level,
      expertMode: true,
      conversationMode: true,
      sourcesAllowed: revealSources,
      history: args.history || [],
      signal: args.signal,
      knowledge: {
        enabled: true,
        settings,
        extraDocs: args.extraDocs || [],
        extraContext,
        extraReferences: references.filter(reference => reference.kind === 'teacherDocument'),
      },
    });

    if (!reply) return buildFallback();

    if (reply.knowledge?.length) {
      const seen = new Set<string>();
      const merged = [...reply.knowledge, ...references].filter(reference => {
        if (!reference?.id || seen.has(reference.id)) return false;
        seen.add(reference.id);
        return true;
      });
      references = merged;
    }

    if (reply.localAnswer) {
      return {
        ...buildFallback(reply.fallbackNotice),
        references,
        provider: reply.provider || 'knowledge-base',
      };
    }

    const text = String(reply.text || '').trim();
    if (!text) return buildFallback();

    const answerText = !revealSources && reply.localAnswer
      ? buildConversationalLocalAnswer(plan, references)
      : text;
    let validated = revealSources
      ? ensureSourcesSection(validateCitationMarkers(answerText, Math.max(1, references.length)), references)
      : stripSourceDetails(validateCitationMarkers(answerText, 0));
    const generative: AssistantIntent[] = ['GENERATE_ACTIVITY', 'GENERATE_ASSESSMENT', 'REMEDIATION', 'SEARCH_ACTIVITY'];
    if (generative.includes(plan.intent) && !/اقتراح/.test(validated)) {
      validated += '\n\n> 🤖 الاقتراحات أعلاه مولّدة للمساعدة، والقرار النهائي للأستاذ.';
    }
    if (!references.length && !(reply.sources || []).length && revealSources) {
      validated = `> 🤖 إجابة عامة لا تستند إلى مصدر موثق في المنصة.\n\n${validated}`;
    }
    const webSources = (reply.sources || []).filter(source => source && source.uri);
    return {
      text: validated,
      references,
      evidence: [...evidenceFromReferences(references), ...evidenceFromWeb(webSources)],
      followUps,
      revealSources,
      revealLevel,
      spaceCitations: spaceCitationsOf(spaceHits),
      webSources,
      plan,
      usedLocal: false,
      fallbackNotice: reply.fallbackNotice,
      provider: reply.provider,
    };
  } catch (error) {
    if (args.signal?.aborted) throw error;
    console.error('[assistant] generation failed', error);
    if (references.length || spaceHits.length) {
      return buildFallback(revealSources
        ? 'تعذر تشغيل التحليل الذكي مؤقتًا، لكن تم العثور على نتائج موثقة في المصادر وعُرضت كما هي.'
        : 'تعذر تشغيل التحليل الذكي مؤقتًا، لكن وجدت مقاطع مناسبة وعرضتها كما هي.');
    }
    return {
      ...buildFallback(revealSources
        ? 'تعذر تشغيل التحليل الذكي مؤقتًا، ولم أجد نتائج موثقة كافية.'
        : 'تعذر تشغيل التحليل الذكي مؤقتًا، ولم أجد نتائج كافية.'),
      text: revealSources
        ? [
          NO_CONFIRMED_INFORMATION,
          '',
          'تعذر تشغيل التحليل الذكي مؤقتًا، ولم أجد نتائج موثقة كافية في المصادر المتاحة.',
          'يمكنك إعادة المحاولة، أو إضافة الوثيقة إلى مساحة معرفة، أو السماح بالبحث الخارجي.',
        ].join('\n')
        : [
          'لم أجد معلومة مؤكدة كافية للإجابة عن هذا الطلب.',
          '',
          'تعذر تشغيل التحليل الذكي مؤقتًا. يمكنك إعادة المحاولة أو تفصيل طلبك أكثر.',
        ].join('\n'),
    };
  }
}
