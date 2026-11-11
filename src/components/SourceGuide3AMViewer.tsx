import React, { useMemo, useState } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Printer,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Compass,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Eye,
  BookMarked,
  CheckSquare,
  HelpCircle
} from 'lucide-react';
import { LessonMemo } from '../types';

interface Props {
  lessons: LessonMemo[];
}

interface MajorSequence3AM {
  id: string;
  num: number;
  title: string;
  hours: number;
  weeks: string;
  activitiesCount: number;
  pedagogicalUnitsCount: number;
  targetCompetency: string;
  subUnits: {
    num: number;
    title: string;
    hours: number;
    activities: string[];
    guidance: string;
  }[];
}

const MAJOR_SEQUENCES_3AM: MajorSequence3AM[] = [
  {
    id: 'seq-1',
    num: 1,
    title: 'المقطع التعلمي 01: الديناميكية الداخلية للكرة الأرضية',
    hours: 30,
    weeks: '15 أسبوعاً (الفصل الأول + أسبوعان من الفصل الثاني)',
    activitiesCount: 16,
    pedagogicalUnitsCount: 7,
    targetCompetency: 'يفسر الظواهر الجيولوجية المرتبطة بالديناميكية الداخلية للكرة الأرضية، ويساهم في حملات التوعية والتضامن والتصرف الوقائي في حالة الكوارث الطبيعية.',
    subUnits: [
      {
        num: 1,
        title: 'الزلازل ظاهرة طبيعية',
        hours: 5,
        activities: [
          'أصف آثار زلزال محلي (دراسة زلزال بومرداس وزموري وآثاره العمرانية والبشرية)',
          'أحدد خصائص الزلزال (المركز السطحي، البؤرة، شدة ومقدار الزلزال، ومسجل الزلازل السيزموغراف)',
          'أستعيد التاريخ الزلزالي لمنطقة شمال إفريقيا (حزام الزلازل وخط GLA من قابس إلى أغادير مرورا بشمال الجزائر)'
        ],
        guidance: 'الانطلاق من صور وفيديوهات زلزال بومرداس، وتحليل السجلات الزلزالية لتحديد البؤرة وعمقها بدقة.'
      },
      {
        num: 2,
        title: 'أسباب الزلازل',
        hours: 4,
        activities: [
          'أبين مناطق حدوث الزلازل (الفوالق والطيات وتشوهات صخور القشرة الأرضية بفعل قوى الانضغاط)',
          'أختبر فرضية تتعلق بمصدر الزلازل (النمذجة المخبرية باستعمال البوليستران لتجسيد انكسار الصخور الصلبة وتحرر الطاقة)'
        ],
        guidance: 'الربط المنهجي بين قوى الانضغاط الباطنية ونشأة الفوالق كبؤر لتوليد الموجات الزلزالية.'
      },
      {
        num: 3,
        title: 'نشاط الظهرات',
        hours: 5,
        activities: [
          'أبين الشواهد الدالة على زحزحة القارات (نظرية ألفريد فيجنر: الشواهد المورفولوجية، الجيولوجية والمستحاثية)',
          'أبرز العلاقة بين زحزحة القارات والبنية الجيولوجية في أعماق المحيطات (الخسف والتصدعات وتدفق الحمم البازلتية)',
          'أفسر زحزحة القارات بنشاط الظهرات (تيارات الحمل الحراري لأرثر هولمز كقوة محركة لتوسع قاع المحيط)'
        ],
        guidance: 'توظيف نظام التموضع العالمي GPS لتحقيق قياسات تباعد القارات، ودراسة مغناطيسية قاع المحيط.'
      },
      {
        num: 4,
        title: 'الغوص والظواهر الجيولوجية المرتبطة به',
        hours: 4,
        activities: [
          'أظهر آلية حركة تقارب الصفائح التكتونية (انزلاق اللوح المحيطي الكثيف تحت اللوح القاري الأقل كثافة ومستوى بينيوف المائل)',
          'أفسر بعض الظواهر الجيولوجية المرتبطة بالغوص (البراكين الانفجارية لزجة الماغما الغنية بالغازات، وتشكل سلاسل جبال الهيمالايا إثر اصطدام الهند بآسيا)'
        ],
        guidance: 'تفسير عدم زيادة حجم الكرة الأرضية بالتوازن الديناميكي بين تمدد الظهرات وابتلاع القشرة في مناطق الغوص.'
      },
      {
        num: 5,
        title: 'التكتونية العامة والبنية الداخلية للكرة الأرضية',
        hours: 4,
        activities: [
          'أدمج الآليات التفسيرية لأهم الظواهر الجيولوجية (تحليل سرعة الموجات الزلزالية وتحديد سمك الليتوسفير والأستينوسفير المائع)',
          'أصف البنية الداخلية للكرة الأرضية (الطبقات متراكزة المركز: القشرة، الرداء العلوي والسفلي، والنواة الخارجية السائلة والداخلية الصلبة)'
        ],
        guidance: 'مقارنة طبقات الأرض ببيضة مسلوقة لتسهيل الاستيعاب: القشرة كالصلبة، والزلال كالرداء، والصفار كالنواة.'
      },
      {
        num: 6,
        title: 'التكتونية في حوض البحر الأبيض المتوسط',
        hours: 2,
        activities: [
          'أحدد أسباب الظواهر الجيولوجية في حوض البحر الأبيض المتوسط (زحف الصفيحة الإفريقية نحو الصفيحة الأوراسيوية، وتشكل جبال الأطلس التلي والنشاط البركاني في إيطاليا)'
        ],
        guidance: 'دراسة حوض المتوسط كمنطقة تصادم نشطة تفسر الزلازل المستمرة على طول الساحل الجزائري.'
      },
      {
        num: 7,
        title: 'الإجراءات الوقائية والتنبؤية المتعلقة بالظواهر الجيولوجية',
        hours: 4,
        activities: [
          'أحدد الإجراءات التنبؤية والوقائية المرتبطة بالبركنة (قياس الغازات، انتفاخ البركان، ومخططات الإخلاء)',
          'أصف السلوكات الواجب تبنيها للتخفيف من عواقب زلزال (قواعد البناء المقاوم للزلازل والسلوك السليم أثناء وبعد الهزة)'
        ],
        guidance: 'التأكيد على أن الزلازل لا يمكن التنبؤ بزمنها، مما يجعل البناء المضاد للزلازل والسلوك الفردي الركيزة الأساسية للحماية.'
      }
    ]
  },
  {
    id: 'seq-2',
    num: 2,
    title: 'المقطع التعلمي 02: الديناميكية الخارجية للكرة الأرضية',
    hours: 18,
    weeks: 'بقية أسابيع الفصل الثاني',
    activitiesCount: 12,
    pedagogicalUnitsCount: 4,
    targetCompetency: 'يربط بين تطور المناظر الطبيعية وعمل العوامل المناخية ونشاط الإنسان، ويساهم في تثمين المناظر وحمايتها.',
    subUnits: [
      {
        num: 1,
        title: 'البنيات الجيولوجية الكبرى وخصائصها',
        hours: 4,
        activities: [
          'أظهر مكونات مناظر طبيعية محلية (التضاريس، الصخور، الغطاء النباتي، المجاري المائية ونشاط الإنسان)',
          'أفسر اختلاف مكاشف الصخور في المناظر الطبيعية (تأثير الحركات التكتونية الباطنية على استواء وميل الطيات والفوالق)',
          'أبين العلاقة بين المناظر الطبيعية ونشاط الإنسان (الاستغلال العمراني والصناعي والفلاحي)'
        ],
        guidance: 'تنظيم خرجة ميدانية استكشافية للمحيط القريب من المؤسسة لالتقاط صور ودراسة التضاريس المحلية.'
      },
      {
        num: 2,
        title: 'شكل المنظر الطبيعي وخصائص الصخور',
        hours: 4,
        activities: [
          'أظهر تنوع الصخور في المناظر الطبيعية (الغرانيت، البازلت، الغنيس، الحجر الكلسي، الغضار، الرمل)',
          'أظهر الخصائص الفيزيوكيميائية لبعض الصخور مخبرياً (التماسك، الصلابة، النفاذية، والتفاعل مع حمض كلور الماء HCl)',
          'أضع علاقة بين تنوع المناظر الطبيعية وخواص الصخور (مقاومة الصخور الصلبة للحت مقابل تآكل الصخور اللينة والمتفتتة)'
        ],
        guidance: 'إجراء تجارب عملية في المخبر لفحص عينات الصخور السائدة في الجزائر وتدوين نتائج التفاعل في جداول قياسية.'
      },
      {
        num: 3,
        title: 'أثر العوامل المناخية في تغير المنظر الطبيعي',
        hours: 4,
        activities: [
          'أتعرف على آليات التأثير الفيزيوكيميائي للعوامل المناخية (أثر التفاوت الحراري وتجمد الماء، وتجوية الكلس بحمض الفحم CO2)',
          'أبرز دور الماء في تغيير التضاريس (الحث الميكانيكي، نقل الحصى والرمال، وترسيبها في الأحواض المنخفضة)',
          'أتعرف على ملامح تغير تضاريس المناظر الطبيعية (نشأة الكثبان الرملية والوديان والمسلات الساحلية بفعل الرياح والأمطار)'
        ],
        guidance: 'توظيف تجارب مخبرية توضح أثر الماء المحمل بثاني أكسيد الكربون على الصخر الكلسي لتفسير تشكل المغارات والكهوف.'
      },
      {
        num: 4,
        title: 'دور الإنسان في تطور شكل المنظر الطبيعي',
        hours: 4,
        activities: [
          'أبرز تدخلات الإنسان السلبية (إزالة الغابات، الرعي الجائر، استغلال المقالع، وإحداث التعرية والانجراف)',
          'أبرز تدخلات الإنسان الإيجابية (إقامة السدود، مصاطب التلال، السد الأخضر، والمحميات الطبيعية)',
          'أتعرف على تطور منظر طبيعي عبر الزمن الجيولوجي (رسومات الطاسيلي بالصحراء الجزائرية كدليل على تحول المناخ من رطب غابي إلى صحراوي قاحل)'
        ],
        guidance: 'استثمار رسومات كهوف طاسيلي ناجر بالجنوب الجزائري كشاهد تاريخي وبيئي فريد في العالم.'
      }
    ]
  },
  {
    id: 'seq-3',
    num: 3,
    title: 'المقطع التعلمي 03: استغلال الموارد الطبيعية الباطنية',
    hours: 4,
    weeks: 'الأسبوعان الأولان من الفصل الثالث',
    activitiesCount: 4,
    pedagogicalUnitsCount: 2,
    targetCompetency: 'يحدد الثروات الباطنية بالجزائر، ويثمن استغلالها العقلاني المستدام، ويقترح حلولاً طاقوية بديلة كالشمسية والريحية.',
    subUnits: [
      {
        num: 1,
        title: 'الثروات الطبيعية الباطنية في الجزائر ومميزاتها',
        hours: 2,
        activities: [
          'أتعرف على أهم الموارد الباطنية بالجزائر (المحروقات كالبترول والغاز، خامات الحديد والفوسفات والزنك، والمياه الجوفية بالصحراء)',
          'أحدد مميزات بعض الموارد الباطنية (أصل البترول العضوي من العوالق البحرية البلانكتون عبر ملايين السنين، والصخرة الأم والصخرة الخازنة ومصيدة البترول)'
        ],
        guidance: 'التمييز الدقيق بين المورد الطبيعي المتجدد (كالطاقة الشمسية والمائية) وغير المتجدد (كالنفط والغاز والمناجم).'
      },
      {
        num: 2,
        title: 'استغلال الموارد الطبيعية',
        hours: 2,
        activities: [
          'أبين كيفية استغلال الموارد الباطنية (مراحل صناعة النفط: المسح الجيوفيزيائي، التنقيب، الحفر، الاستخراج، الضخ عبر الأنابيب، والتكرير)',
          'أبرز ضرورة الاستغلال العقلاني للموارد (مخاطر استنزاف الوقود الأحفوري، التلوث البيئي، وضرورة التوجه نحو الطاقات النظيفة المتجددة كالطاقة الشمسية)'
        ],
        guidance: 'تثمين الإمكانات الهائلة للجزائر في مجال الطاقة الشمسية في الصحراء بمعدل يزيد عن 3000 ساعة سطوع سنوياً.'
      }
    ]
  },
  {
    id: 'seq-4',
    num: 4,
    title: 'المقطع التعلمي 04: التربة ثروة طبيعية هشة',
    hours: 12,
    weeks: 'ستة أسابيع بالفصل الثالث لنهاية السنة الدراسية',
    activitiesCount: 6,
    pedagogicalUnitsCount: 3,
    targetCompetency: 'يعرف التربة كثروة طبيعية هشة ذات منشأ بيولوجي وجيولوجي، ويوضح آليات حمايتها من التدهور لضمان الأمن الغذائي.',
    subUnits: [
      {
        num: 1,
        title: 'التربة وسط حي وهش',
        hours: 6,
        activities: [
          'أعرف التربة تجريبياً (إثبات وجود الماء وبخاره، الهواء والفقاعات، والمادة العضوية بالاحتراق والتفحم)',
          'أبرز العلاقات بين بنية التربة ومكوناتها الحية (دور ديدان الأرض والكائنات الدقيقة في تفكيك البقايا العضوية وإنتاج الدبال الخصب)',
          'أبين الطابع الهش للتربة (تأثير نقص الغطاء النباتي على فقدان الدبال وتصلب التربة)'
        ],
        guidance: 'إجراء تجربة استخلاص كائنات التربة الدقيقة بواسطة جهاز برليز (Berlese) وملاحظتها بالمكبر.'
      },
      {
        num: 2,
        title: 'تشكل التربة',
        hours: 2,
        activities: [
          'أحدد منشأ التربة (التفكك الميكانيكي والكيميائي للصخرة الأم بفعل عوامل الطقس الحار والبارد والأمطار)',
          'أميز مراحل تشكل التربة (تراكم الرواسب المعدنية، اختلاطها بالدبال المتولد عن الكائنات الحية، وتشكل الآفاق المتتالية A وB وC)'
        ],
        guidance: 'التركيز على البعد الزمني البطيء جداً لتشكل التربة (سنتيمتر واحد يتطلب مئات وآلاف السنين) لإدراك قيمتها الاستراتيجية.'
      },
      {
        num: 3,
        title: 'حماية التربة',
        hours: 2,
        activities: [
          'أحدد العوامل المؤثرة سلباً على التربة الزراعية (التعرية المائية والريحية، التصحر، الرعي الجائر، التلوث الكيميائي بالأسمدة، وزحف الإسمنت)',
          'أبرز التدخلات الإيجابية للإنسان لحماية التربة (التشجير، مصدات الرياح، الدورة الزراعية، حراثة الأراضي المائلة بالمصاطب، وتسميدها العضوي)'
        ],
        guidance: 'تحليل نصوص قانونية جزائرية تحمي الأراضي الفلاحية من الاستغلال العقاري وتدعم الاستصلاح الفلاحي.'
      }
    ]
  }
];

interface ExerciseSolution {
  unitTitle: string;
  exerciseTitle: string;
  question: string;
  solution: string;
}

const OFFICIAL_SOLUTIONS_3AM: ExerciseSolution[] = [
  {
    unitTitle: 'المقطع 01: الديناميكية الداخلية - تمرين أسئلة الاختيار من متعدد',
    exerciseTitle: 'التمرين 01: اختبار معارف الزلازل والصفائح (ص 72)',
    question: '1. الموجات الزلزالية تنتشر انطلاقاً من؟ 2. تتشكل الصفائح في؟ 3. يتعلق نمط الثوران البركاني بـ؟ 4. الأستينوسفير هو؟',
    solution: '1. تنتشر في كل الاتجاهات انطلاقاً من نقطة انكسار الصخور (البؤرة).\n2. تتشكل الصفائح في محاور الظهرات.\n3. يتعلق نمط الثوران بسيولة أو لزوجة الماغما ونسبة الغازات المحبوسة.\n4. الأستينوسفير هو طبقة مطاطية مائعة أقل صلابة تتوضع عليها الصفائح التكتونية (الليتوسفير الصلب).'
  },
  {
    unitTitle: 'المقطع 01: دراسة حالة واقعية لزلزال ميهوب (ولاية المدية)',
    exerciseTitle: 'التمرين 02: استخراج معلومات من نص زلزال ميهوب (ص 73)',
    question: 'ضرب زلزال بقوة 5.3 درجات بمقياس ريشتر بلدية ميهوب ليلة 29 ماي 2016. استخرج الموقع الدقيق، المقدار، صف الخسائر، وبرر نشاط المنطقة.',
    solution: '1. الموقع الدقيق للمركز السطحي: 10 كم شمال شرق ميهوب (العمودي فوق البؤرة).\n2. مقدار الزلزال: 5.3 درجات على سلم ريشتر، وأكبر هزة ارتدادية بلغت 4.4 درجات.\n3. الخسائر: 80 جريحاً وانهيار جزئي وكلي للأبنية التقليدية القديمة وتشقق المباني العمومية.\n4. ميهوب منطقة نشطة زلزالياً لأنها تقع ضمن سلسلة جبال الأطلس التلي الخاضعة لقوى انضغاط تكتونية ناتجة عن زحف الصفيحة الإفريقية نحو أوروبا.'
  },
  {
    unitTitle: 'المقطع 01: مقارنة نمطي البراكين الانفجارية والطفحية',
    exerciseTitle: 'التمرين 03: دراسة بركاني تامبورا ونيراجونجو (ص 74)',
    question: 'قارن بين بركان تامبورا (Tambora بأندونيسيا) وبركان نيراجونجو (Nyiragongo بالكونغو) من حيث الشكل، نمط الماغما، ودرجة الخطورة.',
    solution: '• بركان تامبورا: نمط انفجاري، شكله قبة (Dôme)، ماغما لزجة غنية بالغازات ومقذوفات رماد وحمم عنيفة، تسبب في وفاة 50 ألف ضحية عام 1815 بسبب تدفق الرماد الحارق.\n• بركان نيراجونجو: نمط طفحي، شكله مخروطي، ماغما سائلة فقيرة بالغازات تنساب في شكل ألسنة حمم طويلة.\n• بركان تامبورا أشد خطورة لأن لزوجة الماغما تحبس الغازات حتى تتراكم بضغط هائل مسببة انفجارات كارثية تسحق المناطق المجاورة.'
  },
  {
    unitTitle: 'المقطع 02: الديناميكية الخارجية - خواص الصخور والمناظر الطبيعية',
    exerciseTitle: 'التمرين 02: مطابقة المصطلحات الجيولوجية (ص 78)',
    question: 'اربط بين التضاريس، المكشف، الصخر، التعرية، النفاذية، والراسب بتعريفاتها الدقيقة.',
    solution: '1. التضاريس: مظهر سطح الأرض وتنوع أشكاله وارتفاعاته.\n2. المكشف: موقع يمكن من الملاحظة المباشرة للصخور على سطح الأرض.\n3. الصخر: مادة تشكل الوحدة الأساسية لبناء القشرة وتضاريسها.\n4. التعرية: جملة من الظواهر تزيل كلا أو جزءاً من الأراضي وتغير التضاريس بالحت والنقل.\n5. النفاذية: خاصية الأجسام التي تسمح للسوائل بالمرور عبر مساماتها.\n6. الراسب: جملة من الجزيئات المتفاوتة الحجم التي تعرضت للنقل ثم توضعت في الأحواض.'
  },
  {
    unitTitle: 'المقطع 03: استغلال الموارد الباطنية - البترول والمياه الجوفية',
    exerciseTitle: 'التمرين 01: مصطلحات الموارد الباطنية (ص 82)',
    question: 'حدد الفروق بين الخامات المعدنية، المياه الجوفية، صخور الخزان، صخور الأم، والموارد المتجددة وغير المتجددة.',
    solution: '• خامات معدنية: مادة مستخلصة من تحت التربة لصناعة المعادن كالحديد والفوسفات والزنك.\n• صخور خازنة: صخور مسامية متشققة كالحجر الرملي والكلسي تحتفظ بالهيدروكربونات.\n• صخرة أم: صخور غضارية دقيقة في الأعماق تشكل فيها البترول عبر تحلل العوالق بمعزل عن الهواء.\n• مورد متجدد: مورد طبيعي يتجدد ذاتياً كالطاقة الشمسية ومياه الأمطار، بخلاف الوقود الأحفوري الذي ينفد بالاستهلاك.'
  },
  {
    unitTitle: 'المقطع 04: التربة ثروة طبيعية هشة - حماية التربة وتجددها',
    exerciseTitle: 'التمرين 01: تصحيح المفاهيم الخاطئة عن التربة (ص 86)',
    question: 'صوّب العبارات: هل ينتج الدبال عن تجوية الصخرة الأم؟ هل الأراضي الزراعية سريعة التجدد؟ ما شروط تشكل التربة؟',
    solution: '1. عبارة خاطئة: الدبال لا ينتج عن تجوية الصخرة الأم، بل ينتج عن تفكك وتحلل بقايا الكائنات الحية النباتية والحيوانية بفعل محللات التربة.\n2. عبارة خاطئة: الأراضي الفلاحية موارد بطيئة التجدد جداً وتكاد تكون غير متجددة بالنسبة لعمر الإنسان، إذ يتطلب تشكل سنتيمتر واحد من التربة الزراعية مئات السنين.\n3. تشكل التربة يشترط تفاعل العوامل المناخية (التجوية) مع العوامل الحيوية (الدبال وغاز CO2 وديدان الأرض).'
  }
];

interface PedagogicalConcept {
  term: string;
  french: string;
  definition: string;
  classroomApplication: string;
}

const PEDAGOGICAL_CONCEPTS_3AM: PedagogicalConcept[] = [
  {
    term: 'المقاربة بالكفاءات',
    french: 'Approche par compétences',
    definition: 'خطة عمل واستراتيجية تربوية تجعل المتعلم محور الفعل التعليمي، بحيث يُجنّد معارفه ومهاراته وقيمه لمعالجة وضعية مشكلة دالة ومركبة من واقع الحياة.',
    classroomApplication: 'عدم الاكتفاء بسرد المعلومات الجيولوجية كحقائق جاهزة، بل جعل التلميذ يبحث عن مبررات الظواهر في وثائق وسندات.'
  },
  {
    term: 'الوضعية الانطلاقية',
    french: 'Situation-problème de départ',
    definition: 'وضعية تعليمية يواجهها المتعلم في مستهل المقطع أو الحصة، ترتبط بسياق واقعي ومحفز، تثير لديه صراعاً معرفياً لا تكفي مكتسباته السابقة لحله.',
    classroomApplication: 'عرض صور لآثار زلزال بومرداس وتشوهات الطرقات لطرح المشكل: كيف نفسر انكسار الصخور وحدوث الهزات؟'
  },
  {
    term: 'المشكلة العلمية',
    french: 'Problème scientifique',
    definition: 'صياغة استفهامية دقيقة تنطوي على تناقض ظاهري أو عقبة تحول دون الفهم، تتطلب صياغة فرضيات قابلة للاختبار التجريبي أو التوثيقي.',
    classroomApplication: 'لماذا لا يزيد حجم الكرة الأرضية رغم التوسع المستمر لقاع المحيطات على مستوى الظهرات؟'
  },
  {
    term: 'الفرضيات وتصورات المتعلم',
    french: 'Hypothèses & Conceptions',
    definition: 'تفسيرات أولية محتملة يقترحها المتعلمون مبنية على بنيتهم المعرفية السابقة، وتصاغ بصيغة شرطية قابلة للتجريب والتمحيص (إذا كان... فإن...).',
    classroomApplication: 'افتراض المتعلمين أن الزلازل تحدث بفعل تصادم الجبال، ثم غربلة هذه التصورات بالوثائق وسجلات السيزموغراف.'
  },
  {
    term: 'النموذج والنمذجة',
    french: 'Modèle & Modélisation',
    definition: 'تمثيل تركيبي مبسط لظاهرة طبيعية معقدة غير قابلة للملاحظة المباشرة بالعين المجردة، يستهدف تيسير الفهم وتفسير الآليات الباطنية.',
    classroomApplication: 'استعمال نموذج البوليستران لتجسيد قوى الانضغاط وتولد الفوالق، ونموذج حركة تيارات الحمل الحراري بالماء الملون والحرارة.'
  },
  {
    term: 'الحواجز الإبستمولوجية',
    french: 'Obstacles épistémologiques',
    definition: 'أفكار مسبقة وتفسيرات راسخة لدى التلميذ تعيق وصوله إلى المعرفة العلمية الصحيحة وتفرض نفسها رغم عدم صحتها.',
    classroomApplication: 'اعتقاد التلاميذ أن سطح الأرض صلب وثابت لا يتحرك، والتغلب على هذا الحاجز بنظام GPS ومستحاثات فيجنر وتكتونية الصفائح.'
  },
  {
    term: 'معايير التقويم التكويني',
    french: 'Critères d’évaluation formative',
    definition: 'صفات منتظرة ومعايير موضوعية يقاس بها إنجاز المتعلم: معيار الوجاهة، معيار الاستعمال السليم لأدوات المادة، معيار الانسجام، ومعيار الإتقان والتميز.',
    classroomApplication: 'تصحيح شبكة وضعية إدماجية دون معاقبة التلميذ مرتين على نفس الخطأ، وتوزيع النقاط على المؤشرات بإنصاف.'
  },
  {
    term: 'البيداغوجيا الفارقية',
    french: 'Pédagogie différenciée',
    definition: 'تنويع المسارات التعليمية والأنشطة والوسائل لتلائم الفروق الفردية في وتيرة التعلم وأنماط الإدراك بين التلاميذ داخل القسم الواحد.',
    classroomApplication: 'مرافقة الأفواج المتعثرة بسندات إضافية مبسطة أثناء العمل بالمجموعات مع تحفيز المتفوقين بمهمات استنتاجية مركبة.'
  }
];

export const SourceGuide3AMViewer: React.FC<Props> = ({ lessons }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'plan' | 'lessons' | 'solutions' | 'concepts' | 'pdf'>('plan');
  const [openSeqId, setOpenSeqId] = useState<string>('seq-1');
  const [openLessonIds, setOpenLessonIds] = useState<Set<string>>(new Set());

  const lessons3am = useMemo(() => {
    return lessons.filter(l => l.level === '3am');
  }, [lessons]);

  const filteredSequences = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MAJOR_SEQUENCES_3AM;
    return MAJOR_SEQUENCES_3AM.filter(seq => {
      const matchSeq = seq.title.toLowerCase().includes(q) ||
        seq.targetCompetency.toLowerCase().includes(q) ||
        seq.subUnits.some(sub => 
          sub.title.toLowerCase().includes(q) ||
          sub.guidance.toLowerCase().includes(q) ||
          sub.activities.some(a => a.toLowerCase().includes(q))
        );
      return matchSeq;
    });
  }, [query]);

  const filteredSolutions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OFFICIAL_SOLUTIONS_3AM;
    return OFFICIAL_SOLUTIONS_3AM.filter(s => 
      s.exerciseTitle.toLowerCase().includes(q) ||
      s.unitTitle.toLowerCase().includes(q) ||
      s.question.toLowerCase().includes(q) ||
      s.solution.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredConcepts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PEDAGOGICAL_CONCEPTS_3AM;
    return PEDAGOGICAL_CONCEPTS_3AM.filter(c => 
      c.term.toLowerCase().includes(q) ||
      c.french.toLowerCase().includes(q) ||
      c.definition.toLowerCase().includes(q) ||
      c.classroomApplication.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons3am;
    return lessons3am.filter(l => {
      const hay = [
        l.memoNumber || '',
        l.midan || '',
        l.maqta || '',
        l.mawrid || '',
        l.ta3alom || '',
        l.marifa || '',
        l.manhaji || '',
        l.wasail || '',
        l.wadiya || '',
        l.moshkila || '',
        l.irsae || '',
        l.taqwim || '',
        ...l.anshita.map(a => `${a.title} ${a.asila} ${a.ajwiba}`)
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [lessons3am, query]);

  const toggleSequence = (id: string) => {
    setOpenSeqId(prev => prev === id ? '' : id);
  };

  const toggleLesson = (id: string) => {
    setOpenLessonIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const pdfUrl = '/assets/aistudio/siences3am_gen2-guide_book_2__12109d38.pdf';

  return (
    <div dir="rtl" className="h-full flex flex-col bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 text-white p-5 shadow-md border-b-4 border-amber-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-amber-300 text-xs font-black tracking-wide">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </span>
              <span>•</span>
              <span>وزارة التربية الوطنية — دار القصبة للنشر</span>
              <span>•</span>
              <span>إشراف أ.د. فريدة خمار وتأليف مفتشي وأساتذة التعليم المتوسط</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2.5 text-white">
              <BookOpen className="w-6 h-6 text-amber-400 shrink-0" />
              <span>دليل استعمال الكتاب المدرسي ودليل الأستاذ — السنة الثالثة متوسط</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black">
                المرجع الوزاري الكامل (96 صفحة)
              </span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              تخطيط منهاج الجيل الثاني لميدان <strong className="text-amber-200">الإنسان والمحيط (الجيولوجيا، الديناميكية، الموارد الطبيعية والتربة)</strong> — 64 ساعة دراسية، 38 نشاطاً، حلول تمارين الكتاب، وشبكات التصحيح المعتمدة.
            </p>
          </div>

          {/* Quick PDF Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح الدليل الكامل (PDF)</span>
            </a>

            <a
              href={pdfUrl}
              download="siences3am_gen2-guide_book_official.pdf"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition"
            >
              <Download className="w-4 h-4" />
              <span>تحميل</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'plan'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>المقاطع والمخطط الساعي (64 ساعة / 4 مقاطع)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'lessons'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المذكرات النموذجية والأنشطة ({lessons3am.length} مذكرة)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solutions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'solutions'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>حلول تمارين الكتاب وشبكات التصحيح</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('concepts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'concepts'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>معجم المفاهيم البيداغوجية الـ 25</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'pdf'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>قارئ الـ PDF المدمج (96 صفحة)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Search Bar */}
        {activeTab !== 'pdf' && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ابحث في دليل ومذكرات 3AM: زلازل، بينيوف، ظهرات، فيجنر، تيارات الحمل، صخور، بترول، تربة..."
              className="flex-1 text-sm bg-transparent outline-none font-bold placeholder-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
              >
                مسح
              </button>
            )}
          </div>
        )}

        {/* TAB 1: CURRICULUM & TIME DISTRIBUTION */}
        {activeTab === 'plan' && (
          <div className="space-y-5">
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  4
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">المقاطع الكبرى</div>
                  <div className="text-base font-black text-slate-900">ميدان الإنسان والمحيط</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  64
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">الحجم الساعي الإجمالي</div>
                  <div className="text-base font-black text-slate-900">32 أسبوع دراسة فعلي</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                  16
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">المقاطع البيداغوجية</div>
                  <div className="text-base font-black text-slate-900">38 نشاطاً تعليمياً</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                  96
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">صفحات الدليل الرسمي</div>
                  <div className="text-base font-black text-slate-900">حلول وشبكات تقويم</div>
                </div>
              </div>
            </div>

            {/* Major Sequences Cards */}
            <div className="space-y-4">
              {filteredSequences.map(seq => {
                const isOpen = openSeqId === seq.id;
                return (
                  <div
                    key={seq.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-300 transition shadow-sm overflow-hidden"
                  >
                    <div
                      onClick={() => toggleSequence(seq.id)}
                      className="p-4 md:p-5 flex items-start justify-between cursor-pointer bg-gradient-to-l from-slate-50 to-white"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black shrink-0 text-base shadow">
                          0{seq.num}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-base md:text-lg font-black text-slate-900">
                              {seq.title}
                            </h2>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              {seq.hours} ساعة
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              <Calendar className="w-3 h-3" />
                              {seq.weeks}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            <strong className="text-slate-900">الكفاءة المستهدفة:</strong> {seq.targetCompetency}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="p-4 md:p-6 border-t border-slate-200 space-y-4 bg-slate-50/50">
                        <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-700 tracking-wide">
                            المقاطع البيداغوجية والأنشطة والتوجيهات المنهجية (الدليل الرسمي):
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {seq.subUnits.map(sub => (
                              <div
                                key={sub.num}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                  <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs flex items-center justify-center font-bold">
                                      {sub.num}
                                    </span>
                                    <span>المقطع البيداغوجي {sub.num}: {sub.title}</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                                    الحجم: {sub.hours} ساعات
                                  </span>
                                </div>

                                <div>
                                  <div className="text-[11px] font-black text-slate-500 mb-1">الأنشطة التعليمية التعلمية:</div>
                                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 font-bold pr-1">
                                    {sub.activities.map((act, i) => (
                                      <li key={i}>{act}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="text-xs bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-amber-950 leading-relaxed font-medium">
                                  <strong className="font-black text-amber-900">التوجيه البيداغوجي وسيرورة المسعى:</strong>{' '}
                                  {sub.guidance}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LESSON MEMOS */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600 font-bold">
                عدد مذكرات السنة الثالثة المطابقة: <span className="text-amber-700 font-black">{filteredLessons.length}</span> من أصل {lessons3am.length}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (openLessonIds.size > 0) {
                    setOpenLessonIds(new Set());
                  } else {
                    setOpenLessonIds(new Set(filteredLessons.map(l => l.sourceLearningUnitId || l.memoNumber)));
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 transition"
              >
                {openLessonIds.size > 0 ? 'طي كل المذكرات' : 'توسيع كل المذكرات'}
              </button>
            </div>

            <div className="space-y-3">
              {filteredLessons.map(lesson => {
                const id = lesson.sourceLearningUnitId || lesson.memoNumber;
                const isOpen = openLessonIds.has(id);

                return (
                  <div
                    key={id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-amber-300 shadow-sm transition overflow-hidden"
                  >
                    <div
                      onClick={() => toggleLesson(id)}
                      className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-black text-xs">
                            مذكرة {lesson.memoNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {lesson.maqta}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            المورد: {lesson.mawrid}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 pt-1">
                          {lesson.ta3alom}
                        </h3>
                        {lesson.moshkila && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            <strong className="text-slate-700">المشكلة:</strong> {lesson.moshkila}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 shrink-0"
                      >
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="p-4 md:p-5 border-t border-slate-200 bg-slate-50/60 space-y-4 text-xs">
                        {/* Objectives Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {lesson.marifa && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-black text-amber-900 block mb-1">المركبة المعرفية:</span>
                              <p className="text-slate-700 leading-relaxed font-medium">{lesson.marifa}</p>
                            </div>
                          )}
                          {lesson.manhaji && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <span className="font-black text-teal-800 block mb-1">المركبة المنهجية:</span>
                              <p className="text-slate-700 leading-relaxed font-medium">{lesson.manhaji}</p>
                            </div>
                          )}
                        </div>

                        {/* Problematic */}
                        {lesson.wadiya && (
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                            <div>
                              <span className="font-black text-slate-900 block mb-0.5">الوضعية الانطلاقية:</span>
                              <p className="text-slate-700 leading-relaxed">{lesson.wadiya}</p>
                            </div>
                            {lesson.moshkila && (
                              <div className="pt-2 border-t border-slate-100">
                                <span className="font-black text-rose-700 block mb-0.5">المشكلة العلمية:</span>
                                <p className="text-slate-800 font-bold">{lesson.moshkila}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Activities */}
                        {lesson.anshita && lesson.anshita.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-black text-slate-900 block">سيرورة النشاطات التعليمية:</span>
                            <div className="space-y-2.5">
                              {lesson.anshita.map((act, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                                  <div className="flex items-center justify-between font-black text-slate-800">
                                    <span>النشاط {idx + 1}: {act.title}</span>
                                    {act.zaman && <span className="text-slate-400 font-bold">{act.zaman}</span>}
                                  </div>
                                  {act.asila && (
                                    <div className="text-slate-700">
                                      <strong className="text-slate-900">مهمة الأستاذ/السند:</strong> {act.asila}
                                    </div>
                                  )}
                                  {act.ajwiba && (
                                    <div className="text-amber-950 bg-amber-50/50 p-2 rounded border border-amber-200">
                                      <strong className="text-amber-900">نشاط وإجابة المتعلم:</strong> {act.ajwiba}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Conclusion / Structuring */}
                        {lesson.irsae && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5">
                            <span className="font-black text-emerald-950 block mb-1">إرساء الموارد (الخلاصة والنتيجة):</span>
                            <p className="text-emerald-900 leading-relaxed font-bold whitespace-pre-line">{lesson.irsae}</p>
                          </div>
                        )}

                        {/* Formative Assessment */}
                        {lesson.taqwim && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <span className="font-black text-blue-950 block mb-1">التقويم التكويني:</span>
                            <p className="text-blue-900 leading-relaxed font-medium">{lesson.taqwim}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EXERCISES SOLUTIONS & ASSESSMENT GRIDS */}
        {activeTab === 'solutions' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                <CheckSquare className="w-5 h-5 text-amber-600" />
                <span>تصحيحات نموذجية لأدوات قياس الموارد (تمارين الكتاب المدرسي) وشبكات تصحيح الكفاءات</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                مستخلصة حرفياً من المحور التاسع في دليل استعمال الكتاب المدرسي (الصفحات 72 إلى 89) لمساعدة الأستاذ في بناء الواجبات المنزلية وشبكات التقويم بالمعايير.
              </p>
            </div>

            <div className="space-y-4">
              {filteredSolutions.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      {item.unitTitle}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {item.exerciseTitle}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="font-black text-slate-900 block mb-1">السؤال والتعليمات:</span>
                    <p className="text-slate-700 font-bold leading-relaxed">{item.question}</p>
                  </div>

                  <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200 text-xs">
                    <span className="font-black text-emerald-950 block mb-1">الحل النموذجي المعتمد في دليل الأستاذ:</span>
                    <p className="text-emerald-900 leading-relaxed font-bold whitespace-pre-line">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PEDAGOGICAL CONCEPTS LEXICON */}
        {activeTab === 'concepts' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                <BookMarked className="w-5 h-5 text-amber-600" />
                <span>معجم المفاهيم البيداغوجية الأساسية — دليل الأستاذ (الصفحات 90 إلى 95)</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                تعريفات منهجية موثقة ومعتمدة من المفتشية العامة للبيداغوجيا لتوضيح منطق المقاربة بالكفاءات والمصطلحات المهنية للمدرس.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConcepts.map((c, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-slate-900 text-sm">{c.term}</span>
                    <span className="text-xs font-mono font-bold text-slate-400">{c.french}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {c.definition}
                  </p>
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-950">
                    <strong className="font-black text-amber-900 block mb-0.5">التطبيق الميداني في القسم:</strong>
                    {c.classroomApplication}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: EMBEDDED PDF VIEWER */}
        {activeTab === 'pdf' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-black text-slate-900 text-sm">
                  دليل استعمال الكتاب المدرسي — علوم الطبيعة والحياة (3AM) — 96 صفحة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في علامة تبويب كاملة</span>
                </a>
                <a
                  href={pdfUrl}
                  download="siences3am_gen2-guide_book_official.pdf"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الملف</span>
                </a>
              </div>
            </div>

            <div className="w-full h-[750px] bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-lg">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1`}
                title="دليل استعمال الكتاب المدرسي ودليل الأستاذ - علوم الطبيعة والحياة - سنة ثالثة متوسط"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
