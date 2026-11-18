// مرجع مصدر الرسومات للسنة الأولى متوسط مرتبطاً بالصور الأصلية المستخرجة من الملف المصدري.
// المصدر: «مذكرات السنة الأولى متوسط كاملة.pdf» (98 صفحة) — الأستاذ موسى حمزة.

export type DiagramSource1AM = {
  key: string;
  sourcePages: number[];
  sourceActivities: string[];
  fidelity: 'source-page-reference' | 'reconstructed-svg';
  imageUrls: string[];
};

export const DIAGRAM_SOURCES_1AM: Record<string, DiagramSource1AM> = {
  foodClassification: {
    key: 'foodClassification',
    sourcePages: [2, 3, 4],
    sourceActivities: ['نشاط 01: التعرف على مصدر الأغذية', 'نشاط 02: تصنيف الأغذية حسب الأصل'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p03_fig01_2b28ea2e208f.jpg',
      '/assets/1am_archive/p03_fig02_fccb9addead6.jpg',
      '/assets/1am_archive/p03_fig03_5f84d4c8f83b.jpg',
      '/assets/1am_archive/p03_fig04_4aff29c62e12.jpg',
    ],
  },
  milkAnalysis: {
    key: 'milkAnalysis',
    sourcePages: [5, 6, 7, 9],
    sourceActivities: ['نشاط 01: تحليل الحليب', 'نشاط 02: تحليل أغذية أخرى', 'نشاط 03: المقارنة بين تركيب الأغذية'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p05_fig01_ef49890ee47c.jpg',
      '/assets/1am_archive/p07_fig02_2739d4ef1342.jpg',
      '/assets/1am_archive/p07_fig03_3d192a363d7c.jpg',
    ],
  },
  nutritionRations: {
    key: 'nutritionRations',
    sourcePages: [11, 12, 13, 14, 15, 16, 17],
    sourceActivities: ['نشاط 01: الحاجيات الغذائية حسب النشاط', 'نشاط 02: الحاجيات الغذائية حسب العمر', 'نشاط: عواقب سوء التغذية'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p12_fig01_e33359bc1c2e.jpg',
      '/assets/1am_archive/p14_fig01_ad3ec5ca113f.jpg',
      '/assets/1am_archive/p16_fig01_0bfb87a44017.jpg',
    ],
  },
  plantMineralNutrition: {
    key: 'plantMineralNutrition',
    sourcePages: [19, 20, 21, 22],
    sourceActivities: ['نشاط 01: شروط نمو النبات الأخضر', 'نشاط 02: إظهار أهمية العناصر المعدنية لنمو النبات الأخضر'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p20_fig01_6cd771252009.jpg',
      '/assets/1am_archive/p21_fig01_1eef5607ff23.png',
    ],
  },
  plantAbsorption: {
    key: 'plantAbsorption',
    sourcePages: [23, 24, 25],
    sourceActivities: ['نشاط 01: تحديد مقر امتصاص المحلول المعدني', 'نشاط 02: مقر امتصاص غاز CO2 عند النبات الأخضر'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p23_fig03_9c9a05d9f216.jpg',
      '/assets/1am_archive/p24_fig01_bd9f91f2d5e3.png',
      '/assets/1am_archive/p24_fig02_d4d41b1ae69f.png',
    ],
  },
  photosynthesisSap: {
    key: 'photosynthesisSap',
    sourcePages: [27, 28, 32, 33, 34, 35],
    sourceActivities: ['نشاط 01: إظهار وجود النشاء في أوراق النبات الأخضر', 'نشاط 01: دراسة الأوعية الناقلة للنسغ', 'نشاط: النتح وعلاقته بانتقال النسغ'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p27_fig01_7ed2d104a037.jpg',
      '/assets/1am_archive/p28_fig02_a7836045fed1.jpg',
      '/assets/1am_archive/p33_fig01_abb7965a729f.jpg',
      '/assets/1am_archive/p35_fig01_abe321d98e9f.jpg',
    ],
  },
  humanRespiratory: {
    key: 'humanRespiratory',
    sourcePages: [37, 38, 41, 43],
    sourceActivities: ['نشاط 01: مقارنة تركيب هواء الشهيق وهواء الزفير', 'نشاط 02: الحاجة لغاز ثنائي الأكسجين'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p38_fig01_0d92c4c52efb.jpg',
      '/assets/1am_archive/p38_fig02_e39fb9e8c2e7.jpg',
    ],
  },
  urinarySystem: {
    key: 'urinarySystem',
    sourcePages: [58, 59, 61, 62],
    sourceActivities: ['نشاط 01: تركيب الجهاز البولي', 'نشاط 02: دور الكلية في الإطراح', 'نشاط 03: دور الجلد في الإطراح'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p61_fig01_be1d5c0f8c36.jpg',
      '/assets/1am_archive/p62_fig01_e4ce3d70c934.png',
      '/assets/1am_archive/p62_fig02_0967c442c9b7.jpg',
    ],
  },
  seedGermination: {
    key: 'seedGermination',
    sourcePages: [66, 67, 68, 69],
    sourceActivities: ['نشاط 01: تركيب بذرة الفاصولياء', 'نشاط 02: المراحل الأساسية للإنتاش'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p66_fig01_7a074bb5978c.jpg',
      '/assets/1am_archive/p67_fig01_b6dac4d92fc8.jpg',
    ],
  },
  flowerReproduction: {
    key: 'flowerReproduction',
    sourcePages: [82, 83, 84, 86, 87],
    sourceActivities: ['نشاط 01: مكونات الزهرة', 'نشاط 01: عملية التأبير', 'نشاط 02: عملية الإلقاح وشروطها'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p82_fig02_84ca919367c6.jpg',
      '/assets/1am_archive/p83_fig01_b163a4e777c3.jpg',
      '/assets/1am_archive/p87_fig01_bdeac19254a6.jpg',
    ],
  },
  cellStructure: {
    key: 'cellStructure',
    sourcePages: [90, 91, 92, 93],
    sourceActivities: ['نشاط 01: مكونات الخلية الحيوانية', 'نشاط 02: مكونات الخلية النباتية'],
    fidelity: 'source-page-reference',
    imageUrls: [
      '/assets/1am_archive/p91_fig01_8ce4434f79e6.jpg',
      '/assets/1am_archive/p91_fig02_0f979cf78ec8.jpg',
      '/assets/1am_archive/p92_fig05_8f098421e545.jpg',
      '/assets/1am_archive/p93_fig03_44239163a9db.jpg',
    ],
  },
};
