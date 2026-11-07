import { LessonMemo } from '../types';
import { PedagogicalAttachmentInput } from './geminiPedagogicalService';

export interface CorrectionMemoRequest {
  examType: 'فرض' | 'اختبار';
  examText: string;
  lesson?: LessonMemo | null;
  curriculum: LessonMemo[];
  attachments?: PedagogicalAttachmentInput[];
  sourceAnalysis?: CorrectionSourceAnalysis;
  sourceDocuments?: Array<{ name: string; type: 'curriculum' | 'companion' | 'teacher-guide' | 'memo' | 'teacher-attachment'; text?: string; url?: string }>;
}

const compact = (value: unknown, max = 1200): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return text.length > max ? text.slice(0, max) + '…' : text;
};

const buildCurriculumContext = ({ lesson, curriculum }: CorrectionMemoRequest) => {
  const sameLevel = lesson ? curriculum.filter(item => item.level === lesson.level) : curriculum;
  const sameMaqta = lesson?.maqta
    ? sameLevel.filter(item => item.maqta === lesson.maqta)
    : [];

  const relevant = (lesson ? [lesson, ...sameMaqta.filter(x => x !== lesson)] : sameLevel)
    .slice(0, 16)
    .map(item => ({
      level: item.level,
      midan: item.midan,
      maqta: item.maqta,
      mawrid: item.mawrid,
      ta3alom: item.ta3alom,
      markaba: item.markaba,
      kafaaKhitamiya: item.kafaaKhitamiya,
      ma3ayirTaqwim: item.ma3ayirTaqwim,
      activities: item.anshita.map(activity => ({
        sourceActivityId: activity.sourceActivityId,
        title: activity.title,
        asila: compact(activity.asila, 700),
        ajwiba: compact(activity.ajwiba, 700),
      })),
    }));

  return JSON.stringify(relevant, null, 2);
};

export interface CorrectionMemoResult {
  text: string;
  sources: Array<{ title: string; uri: string }>;
  usedWeb: boolean;
  webSearchQueries: string[];
}

export interface CorrectionSourceAnalysis {
  title?: string;
  exercises: Array<{
    number: string;
    title?: string;
    questions: Array<{ number: string; text: string; points?: number | string; documentRefs?: string[] }>;
  }>;
  totalPoints?: number | string;
  documents: Array<{ id: string; description: string }>;
  ambiguities: string[];
}

export async function analyzeCorrectionSource(request: CorrectionMemoRequest): Promise<CorrectionSourceAnalysis | null> {
  try {
    const response = await fetch('/api/gemini/analyze-correction-source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examType: request.examType,
        examText: request.examText,
        attachments: (request.attachments || []).map(({ name, mimeType, size, dataUrl }) => ({ name, mimeType, size, dataUrl })),
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.json !== 'string') return null;
    return JSON.parse(data.json) as CorrectionSourceAnalysis;
  } catch (error) {
    console.error('[correction-source-analysis] failed', error);
    return null;
  }
}

export async function generateCorrectionMemo(request: CorrectionMemoRequest): Promise<CorrectionMemoResult | null> {
  const prompt = [
    'أنت أداة مستقلة متخصصة فقط في إعداد مذكرة تصحيح لأساتذة علوم الطبيعة والحياة في التعليم المتوسط بالجزائر.',
    'هذه الأداة ليست المساعد الذكي العام ولا تستعمل طلباته أو واجهته.',
    'ترتيب مصادر التصحيح إلزامي: (1) ورقة الفرض/الاختبار نفسها، (2) المنهاج الرسمي والتدرج، (3) الوثيقة المرافقة، (4) كتاب دليل الأستاذ، (5) المذكرات/الموارد التربوية، (6) الويب عند الحاجة فقط، (7) الذكاء الاصطناعي للاقتراحات التي تحتاج مراجعة الأستاذ.',
    'لا تعتبر معلومة مثبتة لمجرد معرفة النموذج بها؛ إذا لم يمكن ربطها بمصدر، وسمها: «اقتراح AI — يحتاج مراجعة الأستاذ».',
    'إذا كان نص السؤال أو الوثيقة غير واضح، لا تخمّن واكتب «يحتاج مراجعة الأستاذ».',
    'إذا تعارض سياق المنصة مع نص الورقة فلا تغيّر نص الورقة؛ نبّه إلى التعارض فقط.',
    '',
    'قواعد صارمة:',
    '1. حافظ على ترتيب التمارين والأسئلة كما وردت في الورقة.',
    '2. لا تخترع سؤالاً أو نقطة أو مرجعاً غير موجود في الورقة.',
    '3. احترم سلم التنقيط الموجود في الورقة، وإن لم يوجد فاقترح توزيعاً واضحاً وموسوماً بأنه «اقتراح للمراجعة».',
    '4. لكل سؤال: اكتب الإجابة النموذجية، عناصر الإجابة المنتظرة، وسلّم النقاط.',
    '5. في أسئلة الوثائق أو الرسوم: اذكر ما يجب ملاحظته ثم الاستنتاج العلمي المنتظر.',
    '6. في السؤال غير الواضح أو الذي لا تكفي معطياته: اكتب «يحتاج مراجعة الأستاذ» ولا تخمّن.',
    '7. في النهاية: مجموع النقاط، الأخطاء الشائعة، ملاحظات التصحيح، ومؤشرات الكفاءة عند توفرها في سياق المنصة.',
    '8. اكتب نصاً عربياً منظماً قابلاً للطباعة والتحرير في Word، بدون جداول Markdown أو رموز معقدة.',
    '',
    'السياق الرسمي من قاعدة المنصة:',
    buildCurriculumContext(request),
    '',
    'نوع التقييم: ' + request.examType,
    'نص ورقة التقييم:',
    request.examText.trim() || 'لا يوجد نص ملصوق؛ ورقة التقييم موجودة في المرفقات ويجب استخراج الأسئلة والنقاط والوثائق منها دون تخمين.',
    '',
    'المصادر الإضافية المتاحة للتصحيح:',
    JSON.stringify(request.sourceDocuments || [], null, 2),
    '',
    'نتيجة تحليل المصدر الأولي (إن وُجدت):',
    request.sourceAnalysis
      ? JSON.stringify(request.sourceAnalysis, null, 2)
      : (request.attachments?.length
        ? 'فشل التحليل الأولي، لذلك اقرأ المصدر المرفق مباشرة ولا توقف التوليد.'
        : 'لا يوجد مصدر بصري مرفق.'),
  ].join('\n');

  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        attachments: (request.attachments || []).map(({ name, mimeType, size, dataUrl }) => ({
          name, mimeType, size, dataUrl,
        })),
        useWeb: true,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.text === 'string' && data.text.trim()
      ? { text: data.text.trim(), sources: Array.isArray(data.sources) ? data.sources : [], usedWeb: Boolean(data.usedWeb), webSearchQueries: Array.isArray(data.webSearchQueries) ? data.webSearchQueries : [] }
      : null;
  } catch (error) {
    console.error('[correction-memo] generation failed', error);
    return null;
  }
}
