// مرجع مصدر الرسومات للسنة الأولى متوسط.
// لا تعتبر الرسومات الحالية في diagrams1am.ts نسخًا حرفية من صفحات المصدر.
// هذه الخريطة تحفظ موضع المصدر الأصلي الذي يجب الرجوع إليه عند استبدال
// الرسم المعاد بناؤه بصورة المصدر الأصلية.
//
// المصدر: «مذكرات السنة الأولى متوسط كاملة.pdf» (98 صفحة).
// القاعدة: لا اعتماد لمطابقة بصرية 100% إلا بعد إدراج صورة المصدر نفسها.

export type DiagramSource1AM = {
  key: string;
  sourcePages: number[];
  sourceActivities: string[];
  fidelity: 'source-page-reference' | 'reconstructed-svg';
};

export const DIAGRAM_SOURCES_1AM: Record<string, DiagramSource1AM> = {
  foodClassification: {
    key: 'foodClassification',
    sourcePages: [2, 3],
    sourceActivities: ['نشاط 01: التعرف على مصدر الأغذية', 'نشاط 02: تصنيف الأغذية حسب الأصل'],
    fidelity: 'reconstructed-svg',
  },
  milkAnalysis: {
    key: 'milkAnalysis',
    sourcePages: [5, 6],
    sourceActivities: ['نشاط 01: تحليل الحليب', 'نشاط 02: تحليل أغذية أخرى', 'نشاط 03: المقارنة بين تركيب الأغذية'],
    fidelity: 'reconstructed-svg',
  },
  nutritionRations: {
    key: 'nutritionRations',
    sourcePages: [11, 12, 13, 15],
    sourceActivities: ['نشاط 01: الحاجيات الغذائية حسب النشاط', 'نشاط 02: الحاجيات الغذائية حسب العمر', 'نشاط: عواقب سوء التغذية'],
    fidelity: 'reconstructed-svg',
  },
  plantMineralNutrition: {
    key: 'plantMineralNutrition',
    sourcePages: [19, 20],
    sourceActivities: ['نشاط 01: شروط نمو النبات الأخضر', 'نشاط 02: إظهار أهمية العناصر المعدنية لنمو النبات الأخضر'],
    fidelity: 'reconstructed-svg',
  },
  plantAbsorption: {
    key: 'plantAbsorption',
    sourcePages: [23, 24],
    sourceActivities: ['نشاط 01: تحديد مقر امتصاص المحلول المعدني', 'نشاط 02: مقر امتصاص غاز CO2 عند النبات الأخضر'],
    fidelity: 'reconstructed-svg',
  },
  photosynthesisSap: {
    key: 'photosynthesisSap',
    sourcePages: [27, 28, 30, 31, 32, 34],
    sourceActivities: ['نشاط 01: إظهار وجود النشاء في أوراق النبات الأخضر', 'نشاط 02: إظهار تركيب النبات الأخضر لمواد عضوية أخرى', 'نشاط 01: أهمية التحكم في شروط التركيب الضوئي', 'نشاط 02: سلوكات الإنسان تجاه النبات الأخضر', 'نشاط 01: دراسة الأوعية الناقلة للنسغ', 'نشاط: النتح وعلاقته بانتقال النسغ'],
    fidelity: 'reconstructed-svg',
  },
  humanRespiratory: {
    key: 'humanRespiratory',
    sourcePages: [37, 41, 43, 46],
    sourceActivities: ['نشاط 01: مقارنة تركيب هواء الشهيق وهواء الزفير', 'نشاط 02: الحاجة لغاز ثنائي الأكسجين', 'نشاط 01: الأمراض التنفسية وأسبابها', 'نشاط 02: القواعد الصحية للتنفس'],
    fidelity: 'reconstructed-svg',
  },
  urinarySystem: {
    key: 'urinarySystem',
    sourcePages: [58, 61, 62, 63],
    sourceActivities: ['نشاط: تركيب البول والعرق', 'نشاط 01: تركيب الجهاز البولي', 'نشاط 02: دور الكلية في الإطراح', 'نشاط 03: دور الجلد في الإطراح', 'نشاط: إبراز أهم القواعد الصحية للإطراح'],
    fidelity: 'reconstructed-svg',
  },
  seedGermination: {
    key: 'seedGermination',
    sourcePages: [66, 67],
    sourceActivities: ['نشاط 01: تركيب بذرة الفاصولياء', 'نشاط 02: المراحل الأساسية للإنتاش'],
    fidelity: 'reconstructed-svg',
  },
  flowerReproduction: {
    key: 'flowerReproduction',
    sourcePages: [82, 83, 84, 86, 87],
    sourceActivities: ['نشاط 01: مكونات الزهرة', 'نشاط 02: إبراز المناسل ودورها', 'نشاط 03: تصنيف الأزهار حسب الجنس', 'نشاط 01: عملية التأبير', 'نشاط 02: عملية الإلقاح وشروطها'],
    fidelity: 'reconstructed-svg',
  },
  cellStructure: {
    key: 'cellStructure',
    sourcePages: [90, 91, 92, 93],
    sourceActivities: ['نشاط 01: مكونات الخلية الحيوانية', 'نشاط 02: مكونات الخلية النباتية'],
    fidelity: 'reconstructed-svg',
  },
};
