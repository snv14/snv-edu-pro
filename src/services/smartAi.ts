import { LessonMemo } from '../types';

export interface SmartAiAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
}

export interface SmartAiSource {
  title: string;
  uri: string;
}

export interface SmartAiRequest {
  question: string;
  lesson?: LessonMemo | null;
  curriculum: LessonMemo[];
  attachments?: SmartAiAttachment[];
  useWeb?: boolean;
  level?: string;
  expertMode?: boolean;
}

export interface SmartAiLabBlock {
  id: string;
  type: 'experiment' | 'diagram' | 'activity' | 'image' | 'general';
  title: string;
  content: string;
  createdAt: string;
  sources?: SmartAiSource[];
}

export interface SmartAiResponse {
  text: string;
  sources: SmartAiSource[];
  webSearchQueries: string[];
  usedWeb: boolean;
  usedAttachments: string[];
}

const compact = (value: unknown, max = 1800): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return text.length > max ? text.slice(0, max) + '…' : text;
};

const buildContext = ({ lesson, curriculum }: SmartAiRequest) => {
  const level = lesson?.level;
  const sameLevel = level ? curriculum.filter(item => item.level === level) : curriculum;
  const sameMaqta = lesson?.maqta
    ? sameLevel.filter(item => item.maqta === lesson.maqta)
    : [];

  const relevantLessons = (lesson ? [lesson, ...sameMaqta.filter(x => x !== lesson)] : sameLevel)
    .slice(0, 80)
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

export async function askSmartAi(request: SmartAiRequest): Promise<SmartAiResponse | null> {
  try {
    const question = request.question.trim();
    const level = request.level || request.lesson?.level || 'غير محدد';
    const q = question.toLowerCase();

    const detectMode = () => {
      if (/رسم|مخطط|سكيما|schéma|diagram/.test(q)) return 'diagram';
      if (/تجربة|بروتوكول|مخبر|تجريبي|experiment/.test(q)) return 'experiment';
      if (/نشاط|أنشطة|نشاطين|نشاط تعليمي|مهمة/.test(q)) return 'activity';
      if (/صورة|صور|وثيقة|سند|ملف|pdf|word/.test(q)) return 'resources';
      if (/بديل|بدائل|بديل عن|بدائل للوسائل/.test(q)) return 'alternatives';
      if (/اختبار|فرض|تقويم|سؤال|أجب|إجابة|حل|اشرح|فسر|لماذا|كيف/.test(q)) return 'assessment-answer';
      return 'expert';
    };

    const mode = detectMode();

    const modeInstructions: Record<string, string> = {
      activity: [
        'وضع الأنشطة: افصل بين (1) عناوين الأنشطة المستخرجة حرفياً من المصادر و(2) أنشطة بديلة جديدة.',
        'لا تنسب نشاطاً إلى المنهاج أو مذكرة إلا إذا كان موجوداً فعلاً في السياق.',
        'لكل نشاط موثق: العنوان، المصدر، الهدف إن كان موثقاً، والسند/الأداة إن كانت موثقة.',
        'لكل اقتراح جديد: اكتب "اقتراح تربوي — يحتاج مراجعة الأستاذ" واذكر المستوى والموارد والمدة.',
        'إذا كان هناك أكثر من نشاط موثق مناسب، اذكرها دون اختراع نشاط ثالث على أنه رسمي.',
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
      resources: [
        'وضع الموارد: ابحث عن وثائق/صور/ملفات تعليمية مرتبطة مباشرة بالموضوع والمستوى.',
        'افصل: المصدر الأصلي، سبب ملاءمته، ما الذي يمكن استخراجُه منه، وكلمات البحث البديلة.',
        'عند استخدام الويب أدرج روابط المصادر التي أعادها البحث، ولا تعتبر نتيجة بحث واحدة دليلاً رسمياً.',
        'إذا طلب الأستاذ ملفاً جاهزاً ولم يوجد ملف متاح، أعطه بنية المحتوى المطلوبة وطريقة البحث عنه بدلاً من اختلاق رابط.',
      ].join('\n'),
      alternatives: [
        'وضع البدائل: اقترح 2–4 بدائل تربوية مختلفة عند الحاجة، مثل بديل تجريبي، وثائقي، رقمي، ورسم تخطيطي.',
        'لكل بديل: الهدف، الوسائل المطلوبة، الزمن التقريبي، مستوى الصعوبة، ومتى يستخدم.',
        'لا تخلط البدائل المقترحة مع النشاط الرسمي؛ ضعها في قسم مستقل بعنوان "بدائل مقترحة".',
      ].join('\n'),
      'assessment-answer': [
        'وضع الإجابة والتقويم: أجب عن السؤال مباشرة أولاً، ثم فسّر علمياً وبصياغة مناسبة للمستوى.',
        'إذا كان السؤال مأخوذاً من ورقة أو صورة مرفقة، حافظ على نصه وترتيبه ولا تغيّر المعطيات.',
        'عند طلب حل تمرين: المعطيات ← المطلوب ← الاستدلال/التحليل ← الجواب النهائي.',
        'عند اقتراح أسئلة تقويمية جديدة، وسمها "اقتراح تربوي" ولا تقدمها كسؤال رسمي من المنهاج.',
      ].join('\n'),
      expert: [
        'الوضع الخبير العام: حدد أولاً ما الذي يريده الأستاذ فعلياً، ثم أعطه نتيجة عملية قابلة للتطبيق.',
        'عند الحاجة، اجمع بين النشاط والرسم والسند والتجربة والتقويم والبدائل في خطة قصيرة.',
        'لا تملأ الإجابة بمحتوى لا علاقة له بالسؤال.',
      ].join('\n'),
    };

    const sourcePolicy = [
      'هرم المصادر الإلزامي:',
      '1. المنهاج الرسمي وبيانات المنصة والتدرج الرسمي.',
      '2. الوثيقة المرافقة.',
      '3. دليل الأستاذ والكتاب المدرسي الرسمي.',
      '4. المذكرات والموارد التي يرفعها الأستاذ.',
      '5. المنصات التعليمية الجزائرية وموارد المعلمين عند الحاجة.',
      '6. البحث على الويب للمعلومات الحديثة أو لاستكشاف موارد إضافية.',
      '7. الاستدلال التربوي والاقتراحات التي يولدها الذكاء الاصطناعي.',
      '',
      'قواعد الإثبات:',
      '- لا تحوّل نتيجة الويب أو رأي أستاذ إلى معلومة رسمية.',
      '- عند تعارض مصدرين، اعرض التعارض بوضوح وامنح الأولوية للمصدر الرسمي المتاح.',
      '- عند عدم كفاية الدليل اكتب: "يحتاج مراجعة الأستاذ".',
      '- ضع وسم "معلومة موثقة" للمحتوى المستخرج من المصدر، و"اقتراح تربوي" للمحتوى الجديد.',
      '- إذا استخدمت الويب، اذكر المصادر في نهاية الإجابة.',
    ].join('\n');

    const context = buildContext(request);
    const prompt = [
      'أنت الآن تعمل كمساعد خبير للأستاذ في تعليم علوم الطبيعة والحياة في التعليم المتوسط بالجزائر (1AM–4AM).',
      'مهمتك ليست مجرد الدردشة: ساعد الأستاذ على اتخاذ خطوة بيداغوجية عملية، مع احترام المنهاج ومصادره وعدم اختلاق البيانات.',
      '',
      'قدراتك المطلوبة:',
      '• تحديد المورد والمقطع والميدان وتعلم المورد من بيانات المنصة عند توفرها.',
      '• تحديد عناوين الأنشطة الموثقة، ثم اقتراح بدائل منفصلة.',
      '• اقتراح/وصف الرسومات والمخططات والسندات والصور التعليمية.',
      '• تحليل الملفات والصور وPDF/Word المرفقة واستخراج المعلومات اللازمة منها.',
      '• بناء تجارب مدرسية آمنة وبدائل للوسائل.',
      '• الإجابة عن أسئلة الأستاذ والأسئلة العلمية وتمارين التلاميذ خطوة بخطوة.',
      '• اقتراح تقويمات وفروض وأسئلة مع سلم إجابة عند الطلب.',
      '• البحث في الإنترنت عن موارد تعليمية عند الحاجة، مع إظهار المصادر.',
      '• تكييف النشاط حسب المستوى والزمن والوسائل المتاحة.',
      '',
      sourcePolicy,
      '',
      'نمط المهمة الحالي: ' + mode,
      modeInstructions[mode],
      '',
      'قالب الإجابة الافتراضي:',
      '1) الجواب/النتيجة المباشرة.',
      '2) المصدر أو درجة التوثيق.',
      '3) التطبيق البيداغوجي إن كان مفيداً.',
      '4) البدائل المقترحة عند الحاجة.',
      '5) تنبيه "يحتاج مراجعة الأستاذ" عند وجود عدم يقين.',
      '',
      'سياق المنهاج والمذكرات:',
      context,
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
        curriculum: request.curriculum,
        attachments: request.attachments || [],
        useWeb: request.useWeb !== false,
        expertMode: request.expertMode !== false,
        assistantMode: mode,
      }),
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
    return {
      text: String(data.text || '').trim(),
      sources: Array.isArray(data.sources) ? data.sources : [],
      webSearchQueries: Array.isArray(data.webSearchQueries) ? data.webSearchQueries : [],
      usedWeb: Boolean(data.usedWeb),
      usedAttachments: Array.isArray(data.usedAttachments) ? data.usedAttachments : [],
    };
  } catch (error) {
    console.error('[smart-ai] generation failed', error);
    throw error;
  }
}
