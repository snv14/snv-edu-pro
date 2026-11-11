import { LessonMemo } from '../types';
import type { KnowledgeFacet, TeacherKnowledgeDoc } from '../types/knowledge';
import {
  buildKnowledgeContext,
  buildLocalKnowledgeAnswer,
  extractKnowledge,
  toKnowledgeReferences,
  type KnowledgeReference,
} from './knowledgeBase';
import { getCachedOfficialSources, preloadOfficialSources } from './knowledgeOfficialSources';
import { loadKnowledgeDocs, loadKnowledgeSettings, type KnowledgeSettings } from './knowledgeLibraryStore';

export interface SmartAiAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
}

export interface SmartAiSource {
  title: string;
  uri: string;
}

export interface SmartAiMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface SmartAiKnowledgeOptions {
  /** تفعيل/تعطيل البحث في قاعدة المعرفة. */
  enabled?: boolean;
  /** إعدادات محفوظة أو معدّلة لهذه الجلسة. */
  settings?: Partial<KnowledgeSettings>;
  /** وثائق إضافية تُفهرس مع القاعدة (مثل النص الخام OCR). */
  extraDocs?: TeacherKnowledgeDoc[];
  /** تقييد الاستخراج بأنواع معلومة محددة. */
  facets?: KnowledgeFacet[];
  /** عدد المقاطع المسترجعة. */
  topK?: number;
  /** الاعتماد على الاستخراج المباشر من القاعدة دون استدعاء مزود الذكاء الاصطناعي. */
  localOnly?: boolean;
}

export interface SmartAiRequest {
  question: string;
  lesson?: LessonMemo | null;
  curriculum: LessonMemo[];
  attachments?: SmartAiAttachment[];
  useWeb?: boolean;
  level?: string;
  expertMode?: boolean;
  history?: SmartAiMessage[];
  signal?: AbortSignal;
  knowledge?: SmartAiKnowledgeOptions;
}

export interface SmartAiLabBlock {
  id: string;
  type: 'experiment' | 'diagram' | 'activity' | 'image' | 'general';
  title: string;
  content: string;
  createdAt: string;
  sources?: SmartAiSource[];
}

export interface SmartAiExtractionSummary {
  scopeLabel: string;
  task: string;
  requestedFacets: string[];
  missing: string[];
  notes: string[];
  candidateCount: number;
}

export interface SmartAiResponse {
  text: string;
  sources: SmartAiSource[];
  webSearchQueries: string[];
  usedWeb: boolean;
  usedAttachments: string[];
  provider?: string;
  fallbackNotice?: string;
  /** مقاطع قاعدة المعرفة التي بُني عليها الجواب (المنهاج، الوثيقة المرافقة، دليل الأستاذ، المذكرات). */
  knowledge?: KnowledgeReference[];
  /** هل الجواب مستخرج محلياً من قاعدة المعرفة دون مزود ذكاء اصطناعي. */
  localAnswer?: boolean;
  extraction?: SmartAiExtractionSummary;
}

const compact = (value: unknown, max = 1800): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return text.length > max ? text.slice(0, max) + '…' : text;
};

/** حمولة مضغوطة لقاعدة الدروس بدل إرسال كل القاعدة في كل طلب. */
const compactCurriculumPayload = ({ lesson, curriculum, level }: SmartAiRequest) => {
  const targetLevel = level || lesson?.level;
  const pool = targetLevel ? curriculum.filter(item => item.level === targetLevel) : curriculum;
  const scoped = lesson?.maqta ? pool.filter(item => item.maqta === lesson.maqta) : pool;
  return scoped.slice(0, 30).map(item => ({
    level: item.level,
    midan: item.midan,
    maqta: item.maqta,
    mawrid: item.mawrid,
    ta3alom: item.ta3alom,
    markaba: item.markaba,
    moshkila: compact(item.moshkila, 220),
    irsae: compact(item.irsae, 220),
    activityTitles: (item.anshita || []).map(activity => activity.title).slice(0, 6),
  }));
};

const buildContext = ({ lesson, curriculum }: SmartAiRequest) => {
  const level = lesson?.level;
  const sameLevel = level ? curriculum.filter(item => item.level === level) : curriculum;
  const sameMaqta = lesson?.maqta
    ? sameLevel.filter(item => item.maqta === lesson.maqta)
    : [];

  const relevantLessons = (lesson ? [lesson, ...sameMaqta.filter(x => x !== lesson)] : sameLevel)
    .slice(0, 40)
    .map(item => ({
      level: item.level,
      midan: item.midan,
      maqta: item.maqta,
      mawrid: item.mawrid,
      ta3alom: item.ta3alom,
      markaba: item.markaba,
      marifa: item.marifa,
      manhaji: item.manhaji,
      wadiya: item.wadiya,
      moshkila: item.moshkila,
      faradiyat: item.faradiyat,
      irsae: item.irsae,
      taqwim: item.taqwim,
      activities: item.anshita.map(a => ({
        sourceActivityId: a.sourceActivityId,
        title: a.title,
        asila: compact(a.asila, 700),
        ajwiba: compact(a.ajwiba, 700),
      })),
    }));

  return JSON.stringify({
    currentLesson: lesson || null,
    levelCount: sameLevel.length,
    sameMaqtaCount: sameMaqta.length,
    relevantLessons,
    sourcePolicy: [
      'بيانات المنصة والمنهاج الحالي هي المصدر الأول.',
      'المذكرات والوثائق المرفقة مصادر مباشرة عند إرفاقها.',
      'الاقتراحات الجديدة يجب وسمها بوضوح على أنها اقتراحات.',
      'لا تخترع أسماء موارد أو أنشطة غير موجودة في المصدر.',
    ],
  }, null, 2);
};

export type AssistantMode =
  | 'irsae'
  | 'problem-hypothesis'
  | 'exercise'
  | 'diagram'
  | 'experiment'
  | 'activity'
  | 'extraction'
  | 'resources'
  | 'alternatives'
  | 'assessment-answer'
  | 'expert';

export const ASSISTANT_MODE_LABELS: Record<AssistantMode, string> = {
  irsae: 'إرساء الموارد',
  'problem-hypothesis': 'المشكلة والفرضيات',
  exercise: 'التمارين والتقويم',
  diagram: 'الرسومات والمخططات',
  experiment: 'التجارب المخبرية',
  activity: 'الأنشطة',
  extraction: 'استخراج البيانات',
  resources: 'الوثائق والموارد',
  alternatives: 'البدائل التربوية',
  'assessment-answer': 'الإجابة والتقويم',
  expert: 'الوضع الخبير',
};

/** تحديد نمط المهمة من صيغة سؤال الأستاذ. */
export function detectAssistantMode(question: string): AssistantMode {
  const q = String(question || '').toLowerCase();
  if (/ارساء|إرساء|خلاصه|خلاصة|الحصيلة|التركيب النهائي/.test(q)) return 'irsae';
  if (/مشكل|إشكالي|اشكالي|فرضي|الوضعيه الانطلاقيه|الوضعية الانطلاقية/.test(q)) return 'problem-hypothesis';
  if (/(اقترح|اقتراح|صمم|ابن|أعطني|اعطني).*(تمرين|تطبيق|فرض|اختبار|تقويم|سؤال)/.test(q)
    || /تمرين|تمارين|فرض محروس|اختبار|وضعيه إدماجيه|وضعية إدماجية|سلم التنقيط|سلّم التنقيط/.test(q)) return 'exercise';
  if (/رسم|مخطط|سكيما|schéma|diagram/.test(q)) return 'diagram';
  if (/تجربة|تجربه|بروتوكول|مخبر|تجريبي|experiment/.test(q)) return 'experiment';
  if (/نشاط|أنشطة|انشطه|نشاطين|نشاط تعليمي|مهمة/.test(q)) return 'activity';
  if (/استخرج|استخراج|استخرج البيانات|جداول|بيانات|تعليمات|ما هي|ما هو|اذكر|حدد/.test(q)) return 'extraction';
  if (/صورة|صور|وثيقة|وثيقه|سند|ملف|pdf|word/.test(q)) return 'resources';
  if (/بديل|بدائل|بديل عن|بدائل للوسائل/.test(q)) return 'alternatives';
  if (/اختبار|فرض|تقويم|سؤال|أجب|اجب|إجابة|اجابه|حل|اشرح|فسر|لماذا|كيف/.test(q)) return 'assessment-answer';
  return 'expert';
}

const MODE_INSTRUCTIONS: Record<AssistantMode, string> = {
  irsae: [
    'وضع إرساء الموارد: اعرض أولاً خلاصة الإرساء الموثقة في المصدر حرفياً مع رقم المذكرة ومسارها.',
    'إذا وجدت أكثر من صياغة موثقة (مذكرة أخرى أو مورد مجاور)، اعرضها كاحتمالات مرقمة مع مصدر كل احتمال.',
    'أضف بعد الخلاصة: المورد المنهجي المرتبط بها، والمصطلحات الأساسية بمقابلاتها، وسؤال تقويم سريع للتحقق من تدوينها.',
    'إن لم توجد خلاصة موثقة، اقترح صياغة موسومة «اقتراح تربوي — يحتاج مراجعة الأستاذ» مبنية على المورد المعرفي للمذكرة.',
  ].join('\n'),
  'problem-hypothesis': [
    'وضع المشكلة والفرضيات: اعرض الوضعية الانطلاقية (السند والمعطيات) ثم المشكلة المطروحة حرفياً ثم الفرضيات كما وردت.',
    'قدم عدة احتمالات موثقة إن وجدت (مشكلات أو فرضيات من مذكرات/موارد مجاورة) مع مصدر كل احتمال.',
    'اذكر ما يختبر كل فرضية (وثيقة، تجربة، قياس) كما هو موثق في النشاط.',
    'إن غابت الفرضيات في المصدر، قل ذلك صراحة ثم اقترح فرضيتين (صحيحة وشائعة الخطأ) بوسم «اقتراح تربوي».',
  ].join('\n'),
  exercise: [
    'وضع التمارين والتقويم: ابدأ بما هو موثق في المصدر (تقويم المذكرة، تمارين الكتاب، وضعيات التقويم) مع ذكر المصدر.',
    'ثم اقترح 2–3 تمارين متدرجة الصعوبة: استرجاع، تطبيق (تصنيف/جدول/تسمية رسم)، تحليل سند أو وضعية إدماجية قصيرة.',
    'لكل تمرين: المورد المستهدف، السند، التعليمات المرقمة، الجواب المرتقب، والتنقيط المقترح مع مؤشرات النجاح.',
    'وسم كل تمرين جديد بـ«اقتراح تربوي — يحتاج مراجعة الأستاذ» ولا تنسبه إلى المنهاج أو الوثيقة المرافقة.',
  ].join('\n'),
  diagram: [
    'وضع الرسومات: اقترح أولاً الرسومات الموجودة أو المشار إليها في المصادر، ثم الرسومات البديلة المقترحة.',
    'لكل رسم: العنوان، الغرض البيداغوجي، العناصر التي يجب أن تظهر، الأسهم/العلاقات، والتسميات.',
    'أعط وصفاً جاهزاً لرسم تعليمي واضح بالأبيض والأسود عند الحاجة للطباعة.',
    'لا تدّعِ أن صورة موجودة أو مولدة ما لم تكن متاحة فعلاً؛ يمكن تقديم مخطط نصي ووصف جاهز للرسم.',
  ].join('\n'),
  experiment: [
    'وضع التجارب: الهدف، الإشكالية، الفرضية، المتغيرات، الأدوات، الخطوات، الشاهد/الضابط، الملاحظات المتوقعة، التفسير، والاستنتاج.',
    'اقترح بديلاً مدرسياً آمناً عند غياب أداة، مع بيان ما إذا كان البديل يغير قيمة التجربة.',
    'لا تقدم مادة خطرة أو بروتوكولاً غير مناسب للمدرسة؛ عند وجود خطر، اقترح محاكاة/وثيقة/تجربة آمنة.',
    'ميز بوضوح بين التجربة الموثقة في المصدر وبين الاقتراح الجديد.',
  ].join('\n'),
  activity: [
    'وضع الأنشطة: افصل بين (1) عناوين الأنشطة المستخرجة حرفياً من المصادر و(2) أنشطة بديلة جديدة.',
    'لا تنسب نشاطاً إلى المنهاج أو مذكرة إلا إذا كان موجوداً فعلاً في السياق.',
    'لكل نشاط موثق: العنوان، المصدر، الهدف إن كان موثقاً، والسند/الأداة إن كانت موثقة.',
    'لكل اقتراح جديد: اكتب «اقتراح تربوي — يحتاج مراجعة الأستاذ» واذكر المستوى والموارد والمدة.',
    'إذا كان هناك أكثر من نشاط موثق مناسب، اذكرها دون اختراع نشاط ثالث على أنه رسمي.',
  ].join('\n'),
  extraction: [
    'وضع الاستخراج: انقل المعلومة المطلوبة من قاعدة المعرفة كما هي دون إعادة صياغة تُغيّر المعنى أو الترقيم.',
    'لكل عنصر مستخرج: النص، نوع المعلومة (نشاط/تعليمات/مشكلة/فرضية/إرساء/تقويم/وسائل/جدول)، والمصدر بمساره الكامل.',
    'عند وجود أكثر من قيمة موثقة في النطاق، اعرضها كلها كاحتمالات مرقمة بدل اختيار واحدة.',
    'إذا كان المطلوب غير موجود في القاعدة، اكتب «غير موثق في قاعدة المعرفة» ثم اقترح بديلاً موسوماً.',
    'الجداول تُنقل برؤوسها وأسطرها، والمصطلحات بمقابلاتها إن وُجدت.',
  ].join('\n'),
  resources: [
    'وضع الموارد: ابحث عن وثائق/صور/ملفات تعليمية مرتبطة مباشرة بالموضوع والمستوى.',
    'افصل: المصدر الأصلي، سبب ملاءمته، ما الذي يمكن استخراجُه منه، وكلمات البحث البديلة.',
    'عند استخدام الويب أدرج روابط المصادر التي أعادها البحث، ولا تعتبر نتيجة بحث واحدة دليلاً رسمياً.',
    'إذا طلب الأستاذ ملفاً جاهزاً ولم يوجد ملف متاح، أعطه بنية المحتوى المطلوبة وطريقة البحث عنه بدلاً من اختلاق رابط.',
  ].join('\n'),
  alternatives: [
    'وضع البدائل: اقترح 2–4 بدائل تربوية مختلفة عند الحاجة، مثل بديل تجريبي، وثائقي، رقمي، ورسم تخطيطي.',
    'لكل بديل: الهدف، الوسائل المطلوبة، الزمن التقريبي، مستوى الصعوبة، ومتى يستخدم.',
    'لا تخلط البدائل المقترحة مع النشاط الرسمي؛ ضعها في قسم مستقل بعنوان «بدائل مقترحة».',
  ].join('\n'),
  'assessment-answer': [
    'وضع الإجابة والتقويم: أجب عن السؤال مباشرة أولاً، ثم فسّر علمياً وبصياغة مناسبة للمستوى.',
    'إذا كان السؤال مأخوذاً من ورقة أو صورة مرفقة، حافظ على نصه وترتيبه ولا تغيّر المعطيات.',
    'عند طلب حل تمرين: المعطيات ← المطلوب ← الاستدلال/التحليل ← الجواب النهائي.',
    'عند اقتراح أسئلة تقويمية جديدة، وسمها «اقتراح تربوي» ولا تقدمها كسؤال رسمي من المنهاج.',
  ].join('\n'),
  expert: [
    'الوضع الخبير العام: حدد أولاً ما الذي يريده الأستاذ فعلياً، ثم أعطه نتيجة عملية قابلة للتطبيق.',
    'عند الحاجة، اجمع بين النشاط والرسم والسند والتجربة والتقويم والبدائل في خطة قصيرة.',
    'لا تملأ الإجابة بمحتوى لا علاقة له بالسؤال.',
  ].join('\n'),
};

const SOURCE_POLICY = [
  'أنت المساعد البيداغوجي الذكي في محادثة دردشة تفاعلية (سؤال وجواب Q&A) للأستاذ في علوم الطبيعة والحياة بالتعليم المتوسط بالجزائر (1AM–4AM).',
  'أنت متصل بجميع المصادر الرسمية والبيداغوجية في المنصة ما عدا التدرج السنوي وتوزيع الحصص:',
  '1. المنهاج الرسمي العام وبيانات المنصة (الكفاءات، الميادين، المقاطع، الموارد المعرفية والمنهجية، الإرساء، التقويم).',
  '2. الوثيقة المرافقة للمنهاج.',
  '3. كتب دليل الأستاذ الرسمية لكل المستويات (1AM، 2AM، 3AM، 4AM) والمخططات السنوية للمفاهيم والتعلمات.',
  '4. قاعدة المذكرات المعتمدة ودفاتر الأنشطة والوضعيات الانطلاقية والأجوبة والتعليمات والرسوم التخطيطية.',
  '5. الرسوم التخطيطية والبيانات المخبرية والتجارب المدرسية التفاعلية.',
  '6. المذكرات والوثائق الإضافية للأستاذ.',
  '7. البحث على الويب للمعلومات الحديثة واستكشاف الموارد عند الحاجة.',
  '8. الاستدلال البيداغوجي والاقتراحات التربوية المبتكرة.',
  '',
  'قواعد الدردشة والتعامل البيداغوجي:',
  '- صيغة التعامل: دردشة حوارية تفاعلية (سؤال وجواب Q&A) واضحة ومباشرة ودقيقة مع الأستاذ.',
  '- استبعاد التدرج: لا تعرض توزيعات الأسابيع أو التدرج السنوي الزمني (تم استثناؤه بطلب الأستاذ)، وركز كلياً على المضامين البيداغوجية، المذكرات، التجارب، الرسوم، وحلول الأنشطة.',
  '- عند تعارض مصدرين، اعرض التعارض بوضوح وامنح الأولوية للمصدر الرسمي المتاح مع ذكر رقم الصفحة إن وُجد.',
  '- ضع وسم «معلومة موثقة» للمحتوى المستخرج من مصادر المنصة، و«اقتراح تربوي» للمحتوى الجديد.',
].join('\n');

interface PreparedKnowledge {
  context: string;
  references: KnowledgeReference[];
  scopeLabel: string;
  summary: SmartAiExtractionSummary;
  localAnswer: string;
  candidateCount: number;
}

/** البحث في قاعدة المعرفة وتحضير سياقها للاستشهاد أو للجواب المحلي. */
export function prepareKnowledge(request: SmartAiRequest): PreparedKnowledge | null {
  if (request.knowledge?.enabled === false) return null;
  const stored = loadKnowledgeSettings();
  const settings: KnowledgeSettings = { ...stored, ...(request.knowledge?.settings || {}) };
  const teacherDocs = [
    ...(settings.includeTeacherDocs ? loadKnowledgeDocs() : []),
    ...(request.knowledge?.extraDocs || []),
  ];
  // النسخة المتزامنة من المصادر الرسمية؛ تكون جاهزة لأن askSmartAi ينتظر
  // preloadOfficialSources قبل استدعاء هذه الدالة.
  const officialDocs = settings.includeOfficialSources === false ? [] : getCachedOfficialSources();

  try {
    const extraction = extractKnowledge(request.question, {
      lessons: request.curriculum && request.curriculum.length ? request.curriculum : undefined,
      lesson: request.lesson || null,
      level: request.level || request.lesson?.level,
      teacherDocs,
      officialDocs,
      includeCorpus: settings.includeCorpus,
      // مستثنى من المساعد بطلب صريح من الأستاذ: ربط المساعد بجميع المصادر ما عدا التدرج
      includeProgression: false,
      facets: request.knowledge?.facets,
      topK: request.knowledge?.topK || settings.topK,
    });

    const scopeLabel = [
      extraction.scope.midan,
      extraction.scope.maqta,
      extraction.scope.mawrid,
      extraction.scope.ta3alom,
    ].filter(Boolean).join(' ← ');

    return {
      context: buildKnowledgeContext(extraction),
      references: toKnowledgeReferences(extraction.hits, 8),
      scopeLabel,
      candidateCount: extraction.facets.reduce((sum, group) => sum + group.candidates.length, 0),
      summary: {
        scopeLabel,
        task: extraction.task,
        requestedFacets: extraction.requestedFacets.slice(),
        missing: extraction.missing.slice(),
        notes: extraction.notes.slice(),
        candidateCount: extraction.facets.reduce((sum, group) => sum + group.candidates.length, 0),
      },
      localAnswer: buildLocalKnowledgeAnswer(extraction),
    };
  } catch (error) {
    console.warn('[smart-ai] knowledge retrieval failed', error);
    return null;
  }
}

export async function askSmartAi(request: SmartAiRequest): Promise<SmartAiResponse | null> {
  const question = request.question.trim();
  const level = request.level || request.lesson?.level || 'غير محدد';
  // تُحمَّل النصوص الرسمية الحرفية مرة واحدة قبل أول تحضير؛ الدالة تُعيد
  // الوعد نفسه في الاستدعاءات التالية فلا كلفة تكرار.
  if (request.knowledge?.enabled !== false && loadKnowledgeSettings().includeOfficialSources !== false) {
    await preloadOfficialSources();
  }
  const knowledge = prepareKnowledge(request);

  // وضع الاستخراج المباشر: جواب موثق من القاعدة دون انتظار مزود الذكاء الاصطناعي.
  // المرفقات تحتاج مزوداً يدعم الرؤية، لذلك تتجاوز هذا الوضع.
  const hasAttachments = Boolean(request.attachments && request.attachments.length);
  const localOnly = (request.knowledge?.localOnly === true || loadKnowledgeSettings().localFirst) && !hasAttachments;
  if (localOnly) {
    if (!knowledge) throw new Error('قاعدة المعرفة غير متاحة في هذا الوضع.');
    return {
      text: knowledge.localAnswer,
      sources: [],
      webSearchQueries: [],
      usedWeb: false,
      usedAttachments: [],
      provider: 'knowledge-base',
      knowledge: knowledge.references,
      localAnswer: true,
      extraction: knowledge.summary,
    };
  }

  try {
    const mode = detectAssistantMode(question);

    const history = Array.isArray(request.history)
      ? request.history
          .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string' && item.text.trim())
          .slice(-12)
          .map(item => ({ role: item.role, text: item.text.slice(0, 4000) }))
      : [];
    const conversationBlock = history.length
      ? ['سجل المحادثة السابق (الأقدم أولاً، استعمله كسياق متتابع وأكمل عليه):', JSON.stringify(history, null, 2)].join('\n')
      : 'هذه أول رسالة في المحادثة.';

    const knowledgeBlock = knowledge
      ? [
        '',
        'قاعدة معرفة المنصة (المنهاج، الوثيقة المرافقة، دليل الأستاذ، المذكرات، وثائق الأستاذ) — مقتطفات مسترجعة لهذا السؤال:',
        knowledge.context,
        '',
        `النطاق المستنتج: ${knowledge.scopeLabel || 'غير محدد'}`,
        'قواعد استعمال قاعدة المعرفة:',
        '- هذه المقتطفات هي مصدرك الأول: انقل منها النصوص الرسمية كما هي واستشهد برقمها [1]، [2]…',
        '- إذا وُجدت أكثر من قيمة موثقة، اعرضها كاحتمالات مرقمة مع مصدر كل احتمال، ولا تختر واحدة بصمت.',
        '- إذا لم تكفِ المقتطفات، اكتب ذلك صراحة ثم قدّم اقتراحاً موسوماً «اقتراح تربوي — يحتاج مراجعة الأستاذ».',
        '- لا تعتبر المقتطفات بديلاً عن نص الوثيقة الرسمية الكامل عند طلب نص حرفي كامل.',
      ].join('\n')
      : '';

    const prompt = [
      'أنت الآن تعمل كمساعد بيداغوجي خبير في صيغة دردشة تفاعلية (سؤال وجواب Q&A) للأستاذ في علوم الطبيعة والحياة للتعليم المتوسط بالجزائر (1AM–4AM).',
      'مهمتك: إجراء محادثة بيداغوجية تفاعلية حية، تجيب فيها على أي سؤال للأستاذ بدقة بالاستناد إلى جميع مصادر المنصة (ما عدا التدرج المستثنى)، بأسلوب محاورة علمي سلس ومباشر.',
      '',
      'المصادر المتصل بها المساعد (كل مصادر المنصة ما عدا التدرج):',
      '• المنهاج الرسمي الكامل (1AM، 2AM، 3AM، 4AM): الكفاءات الشاملة والختامية، الميادين، المقاطع، والموارد المعرفية والمنهجية.',
      '• الوثائق المرافقة الرسمية وتوجيهاتها البيداغوجية.',
      '• كتب دليل الأستاذ الرسمية لكل المستويات الأربعة مع أرقام الصفحات والحلول.',
      '• قاعدة مذكرات الدروس الكاملة (الوضعيات الانطلاقية، الإشكاليات، الفرضيات، الأنشطة، التعليمات، الأجوبة المرتقبة، الإرساء، والتقويم).',
      '• الرسومات والمخططات التفاعلية والتجارب المخبرية المعتمدة.',
      '• المعجم التربوي والمفاهيم الرسمية.',
      '• تنبيه هام: تم استبعاد التدرج السنوي والتوزيع الزمني للحصص من هذه المحادثة تلبية لرغبة الأستاذ؛ ركز على الإجابة العلمية والبيداغوجية الصافية.',
      '',
      'أسلوب المحادثة (دردشة سؤال وجواب):',
      '• أجب مباشرة عن السؤال المطروح بأسلوب حواري تربوي مهني ومشجع.',
      '• اربط الجواب بالمصادر الرسمية بوضوح (المنهاج، دليل الأستاذ ص..، المذكرة المعتمدة).',
      '• إذا طرح الأستاذ سؤالاً متابعاً أو توضيحياً، ابنِ على سياق الرسائل السابقة في المحادثة.',
      '',
      SOURCE_POLICY,
      '',
      'نمط المهمة الحالي: ' + mode,
      MODE_INSTRUCTIONS[mode],
      knowledgeBlock,
      '',
      'قالب الإجابة الافتراضي:',
      '1) الجواب/النتيجة المباشرة (مع الاحتمالات الموثقة مرقمة إن وُجد أكثر من احتمال).',
      '2) المصدر أو درجة التوثيق لكل عنصر.',
      '3) التطبيق البيداغوجي إن كان مفيداً.',
      '4) البدائل أو الاقتراحات الجديدة في قسم مستقل.',
      '5) تنبيه «يحتاج مراجعة الأستاذ» عند وجود عدم يقين.',
      '',
      conversationBlock,
      '',
      'سياق المنهاج والمذكرات:',
      buildContext(request),
      '',
      'المستوى الحالي: ' + level,
      'نمط الأستاذ الخبير: ' + (request.expertMode !== false ? 'مفعل' : 'متوقف'),
      '',
      'سؤال الأستاذ:',
      question,
    ].join('\n');

    const res = await fetch('/api/gemini/smart-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        prompt,
        level,
        currentLesson: request.lesson || null,
        curriculum: compactCurriculumPayload(request),
        attachments: request.attachments || [],
        useWeb: request.useWeb !== false,
        expertMode: request.expertMode !== false,
        assistantMode: mode,
        history,
        knowledge: knowledge?.references.map(reference => ({
          id: reference.id,
          kind: reference.kind,
          title: reference.title,
          section: reference.section,
          facet: reference.facet,
          level: reference.level,
          status: reference.status,
          sourceLabel: reference.sourceLabel,
          scopeLabel: reference.scopeLabel,
          url: reference.url,
          text: reference.snippet,
        })) || [],
        knowledgeContext: knowledge?.context || '',
        knowledgeScope: knowledge?.scopeLabel || '',
        knowledgeSummary: knowledge?.summary || null,
      }),
      signal: request.signal,
    });

    if (!res.ok) {
      let message = '';
      try {
        const body = await res.json();
        message = body.error || '';
      } catch { /* ignore */ }
      throw new Error(message || `Smart Assistant HTTP ${res.status}`);
    }

    const data = await res.json();
    const serverKnowledge: KnowledgeReference[] = Array.isArray(data.knowledgeUsed) ? data.knowledgeUsed : [];
    return {
      text: String(data.text || '').trim(),
      sources: Array.isArray(data.sources) ? data.sources : [],
      webSearchQueries: Array.isArray(data.webSearchQueries) ? data.webSearchQueries : [],
      usedWeb: Boolean(data.usedWeb),
      usedAttachments: Array.isArray(data.usedAttachments) ? data.usedAttachments : [],
      provider: data.provider,
      fallbackNotice: data.fallbackNotice,
      knowledge: knowledge?.references.length ? knowledge.references : serverKnowledge,
      localAnswer: false,
      extraction: knowledge?.summary,
    };
  } catch (error) {
    const aborted = request.signal?.aborted;
    if (aborted) throw error;
    // عند تعذّر المزود: نقدّم جواباً موثقاً من قاعدة المعرفة بدل ترك الأستاذ بلا نتيجة.
    if (knowledge && (knowledge.candidateCount > 0 || knowledge.references.length > 0)) {
      console.warn('[smart-ai] provider unavailable, answering from the knowledge base', error);
      const reason = error instanceof Error ? error.message : 'تعذر الاتصال بالمزود';
      return {
        text: knowledge.localAnswer,
        sources: [],
        webSearchQueries: [],
        usedWeb: false,
        usedAttachments: [],
        provider: 'knowledge-base',
        fallbackNotice: `تعذر الوصول إلى مزود الذكاء الاصطناعي (${reason})، فعُرِضت نتائج البحث الموثقة في قاعدة المعرفة مباشرة. أعد المحاولة للحصول على تحليل أعمق.`,
        knowledge: knowledge.references,
        localAnswer: true,
        extraction: knowledge.summary,
      };
    }
    console.error('[smart-ai] generation failed', error);
    throw error;
  }
}
