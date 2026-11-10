export interface KnowledgeQuickTask {
  id: string;
  label: string;
  hint: string;
  /** قالب السؤال؛ يُستبدل {النطاق} بمسار المورد الحالي. */
  template: string;
}

/** مهام الاستخراج والاقتراح الجاهزة في شريط المساعد. */
export const KNOWLEDGE_QUICK_TASKS: KnowledgeQuickTask[] = [
  {
    id: 'activities',
    label: 'استخرج الأنشطة',
    hint: 'عناوين الأنشطة الموثقة مع زمن كل نشاط',
    template: 'استخرج الأنشطة الموثقة (العناوين والزمن والسند) لـ{النطاق}، واعرض كل الاحتمالات الموجودة في المصادر مع مصدر كل نشاط.',
  },
  {
    id: 'instructions',
    label: 'التعليمات والأسئلة',
    hint: 'تعليمات النشاط وأسئلته مع الأجوبة المرتقبة',
    template: 'استخرج تعليمات وأسئلة الأنشطة مع الأجوبة المرتقبة لـ{النطاق}، وحافظ على ترقيمها كما وردت في المصدر.',
  },
  {
    id: 'problem-hypothesis',
    label: 'المشكلة والفرضية',
    hint: 'الوضعية المشكلة، السؤال المشكل، والفرضيات',
    template: 'استخرج الوضعية الانطلاقية والمشكلة المطروحة والفرضيات لـ{النطاق}، وقدّم عدة صيغ موثقة إن وجدت.',
  },
  {
    id: 'irsae',
    label: 'إرساء الموارد',
    hint: 'خلاصة إرساء المورد وجداوله',
    template: 'استخرج إرساء الموارد (الخلاصة المعرفية وجداول الإرساء) لـ{النطاق}، ثم اذكر المورد المنهجي المرتبط به.',
  },
  {
    id: 'exercise',
    label: 'اقترح تمريناً',
    hint: 'تمرين تطبيقي بحل وسلّم تنقيط',
    template: 'اقترح تمريناً تطبيقياً لـ{النطاق} مع السند والتعليمات والجواب المرتقب وسلّم التنقيط، بناءً على تقويم المصدر إن وُجد.',
  },
  {
    id: 'alternative-activity',
    label: 'اقترح نشاطاً بديلاً',
    hint: 'بديل بالوسائل المتاحة',
    template: 'اقترح نشاطاً بديلاً لـ{النطاق} يمكن إنجازه بالوسائل المتاحة، مع بيان الفرق بينه وبين النشاط الموثق في المصدر.',
  },
  {
    id: 'data',
    label: 'استخرج البيانات والجداول',
    hint: 'المعطيات والجداول والمصطلحات والوسائل',
    template: 'استخرج البيانات الموثقة لـ{النطاق}: الجداول والمعطيات الرقمية والمصطلحات والوسائل.',
  },
  {
    id: 'session-plan',
    label: 'سيناريو الحصة',
    hint: 'نشاط الأستاذ والمتعلم مرحلة بمرحلة',
    template: 'ابنِ سيناريو الحصة لـ{النطاق} من المصادر: نشاط الأستاذ ونشاط المتعلم في كل مرحلة، مع الزمن والمشكلة والفرضيات والإرساء والتقويم.',
  },
];

export interface QuickTaskScope {
  level?: string;
  midan?: string;
  maqta?: string;
  mawrid?: string;
  ta3alom?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  '1am': 'السنة الأولى متوسط',
  '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط',
  '4am': 'السنة الرابعة متوسط',
  all: 'كل المستويات',
};

/** بناء وصف النطاق من المورد المفتوح أو المستوى المحدد. */
export function describeScope(scope: QuickTaskScope): string {
  const parts = [
    scope.ta3alom,
    scope.mawrid,
    scope.maqta,
    scope.level ? LEVEL_LABELS[scope.level] || scope.level : '',
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (!parts.length) return 'المستوى الحالي';
  return parts.join(' — ');
}

export function buildQuickTaskPrompt(task: KnowledgeQuickTask, scope: QuickTaskScope): string {
  return task.template.replace('{النطاق}', describeScope(scope));
}

export function getQuickTask(id: string): KnowledgeQuickTask | undefined {
  return KNOWLEDGE_QUICK_TASKS.find(task => task.id === id);
}
