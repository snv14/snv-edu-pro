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
  ShieldAlert,
  Dna,
  HeartPulse,
  Brain,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { LessonMemo } from '../types';

interface Props {
  lessons: LessonMemo[];
}

interface MajorSequence4AM {
  id: string;
  num: number;
  code: string;
  title: string;
  hours: number;
  weeks: string;
  term: string;
  iconType: 'nutrition' | 'coordination' | 'genetics';
  targetCompetency: string;
  priorKnowledge: string[];
  resources: {
    code: string;
    title: string;
    hours: string;
    coreConcepts: string[];
    pedagogicalGuidance: string;
    evaluationCriteria: string[];
  }[];
}

const OFFICIAL_4AM_SEQUENCES: MajorSequence4AM[] = [
  {
    id: 'seq-1',
    num: 1,
    code: 'المقطع I',
    title: 'التغذية عند الإنسان',
    hours: 16,
    weeks: '8 أسابيع (الفصل الأول بالكامل)',
    term: 'الفصل الأول',
    iconType: 'nutrition',
    targetCompetency: 'يقدم تفسيراً علمياً لتحولات الأغذية في الأنبوب الهضمي ومسار ومصير المغذيات، ويتبنى سلوكات غذائية سليمة وقائية.',
    priorKnowledge: [
      'تصنيف الأغذية حسب التركيب والمصدر (السنة الأولى متوسط)',
      'الدعامة التشريحية للجهاز الهضمي والمفهوم الأولي للهضم (التعليم الابتدائي و1AM)',
      'الدم والدورة الدموية والتبرع بالدم (الابتدائي و1AM)',
      'الرواتب الغذائية والتوازن الغذائي (1AM)'
    ],
    resources: [
      {
        code: 'I-1',
        title: 'تحويل الأغذية في الأنبوب الهضمي',
        hours: '4 ساعات (أسبوعان)',
        coreConcepts: [
          'الهضم الكيميائي للغذاء بتدخل الأنزيمات المتخصصة',
          'العمل النوعي للأنزيمات (اللعابين/الأميلاز، البروتياز/البيبسين، الليباز)',
          'تعريف المغذيات الناتجة (جلوكوز، أحماض أمينية، أحماض دسمة وغليسيرول)',
          'المعنى البيولوجي للهضم بالهدم التدريجي للأغذية المعقدة'
        ],
        pedagogicalGuidance: 'إجراء تجربة الهضم الاصطناعي للنشاء باللعابين في حمام مائي 37°م، واستعمال كواشف ماء اليود وفهلنغ لإثبات تحلل النشاء إلى سكر شعير (مالتوز).',
        evaluationCriteria: ['يميز مختلف التحولات التي تطرأ على الأغذية', 'يصف خطوات تجربة الهضم الاصطناعي', 'يبين التأثير النوعي للأنزيم']
      },
      {
        code: 'I-2',
        title: 'امتصاص المغذيات',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'بنية الجدار الداخلي للمعي الدقيق والغشاء المخاطي',
          'بنية الزغابة المعوية كسطح تماس واسع وتبادل غني بالشعيرات الدموية والبلغمية',
          'تعريف الامتصاص كظاهرة مرور المغذيات من لمعة المعي الدقيق إلى الوسط الداخلي'
        ],
        pedagogicalGuidance: 'ملاحظة مقطع عرضي للمعي الدقيق بالمجهر الضوئي أو صور عالية الدقة، ورسم تخطيطي متقن لزغابة معوية بكامل بياناتها.',
        evaluationCriteria: ['يربط بين بنية الزغابة المعوية ووظيفة الامتصاص', 'يمثل برسم تخطيطي دقيق بنية الزغابة المعوية مع البيانات']
      },
      {
        code: 'I-3',
        title: 'نقل المغذيات في العضوية',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'مكونات الدم (المصورة، الكريات الحمر، الكريات البيض، الصفائح الدموية)',
          'دور مكونات الدم في نقل المغذيات والغازات التنفسية O2 و CO2 بواسطة خضاب الدم (الهيموغلوبين)',
          'طريقا الامتصاص (الطريق الدموي والطريق اللمفاوي) ودورهما في إيصال المغذيات للقلب',
          'العلاقة النسقية بين السائل البيني واللمف والدم كوسط داخلي'
        ],
        pedagogicalGuidance: 'فحص سحبة دموية مجهرياً، وتصميم نموذج مسار الدورة الدموية الكبرى والصغرى وحملات تحسيسية للتبرع بالدم.',
        evaluationCriteria: ['يحدد مسار المغذيات على رسم تخطيطي للدورة الدموية', 'يسمي مكونات الدم ويحدد وظيفة كل منها']
      },
      {
        code: 'I-4',
        title: 'استعمال المغذيات على المستوى الخلوي',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'مقر استعمال المغذيات داخل الخلايا الحية',
          'المعنى البيولوجي للتنفس الخلوي (أكسدة وهدم الجلوكوز في وجود O2 لإنتاج الطاقة اللازمة للنشاط)',
          'التخمر كمسلك استقلابي بديل لإنتاج الطاقة في غياب الأكسجين',
          'دور الأحماض الأمينية في بناء البروتينات وصيانة ونمو خلايا العضوية'
        ],
        pedagogicalGuidance: 'تحليل وثائق تجريبية لمقارنة تركيب الدم الشرياني الداخل لعضلة والدم الوريدي الخارج منها في حالتي الراحة والنشاط.',
        evaluationCriteria: ['يفسر ضرورة الإمداد المتواصل للخلية بالمغذيات وO2', 'يقدم تعريفاً فسيولوجياً للتنفس الخلوي']
      },
      {
        code: 'I-5',
        title: 'التوازن الغذائي والوقاية الصحية',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'عواقب التغذية غير الصحية (السمنة، السكري، فقر الدم، نخر الأسنان، ومرض الكواشيوركور)',
          'قواعد التغذية المتوازنة والسليمة (الكفاية، التنوع، الانتظام، والنظافة)'
        ],
        pedagogicalGuidance: 'حل وضعيات إدماجية تستند إلى حالات واقعية لمرضى وتصميم نصائح وتوجيهات وجيهة لتعديل السلوك الغذائي.',
        evaluationCriteria: ['يذكر أمثلة عن عواقب التغذية غير المتوازنة', 'يقترح سلوكات وقائية مؤسسة علمياً']
      }
    ]
  },
  {
    id: 'seq-2',
    num: 2,
    code: 'المقطع II',
    title: 'التنسيق الوظيفي في العضوية (الاتصال العصبي + النظام المناعي)',
    hours: 22,
    weeks: '11 أسبوعاً (4 أسابيع نهاية الفصل الأول + 7 أسابيع الفصل الثاني)',
    term: 'الفصلان الأول والثاني',
    iconType: 'coordination',
    targetCompetency: 'يفسر آليات التنسيق العصبي والاستجابة المناعية للذات، ويبرز أهمية حماية الجهاز العصبي والمناعي وسلوك التلقيح والتوعية ضد المخدرات.',
    priorKnowledge: [
      'الحواس الخمس وأعضاء الحس وعمل العضلات المتضادة (الابتدائي)',
      'الخصوصيات البنيوية لأنماط التنقل (السنة الثانية متوسط)',
      'مكونات الدم وخلايا الدم البيضاء والجلد (1AM و 4AM)'
    ],
    resources: [
      {
        code: 'II-أ-1',
        title: 'الارتباط التشريحي للاتصال العصبي',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'المستقبلات الحسية النوعية وبنية الجلد متعدد المستقبلات (جسيمات ميسنر، باسيني، ميركل، وركيني)',
          'الليف العصبي والعصب ومسار السيالة العصبية',
          'المظهر الكهربائي للرسالة العصبية (كمون الراحة والاستقطاب، وكمون العمل وإزالة الاستقطاب)',
          'المراكز العصبية: المخ وقشرته المخية، والنخاع الشوكي'
        ],
        pedagogicalGuidance: 'تسجيل السيالة العصبية بواسطة راسم الاهتزاز المهبطي (الأوسيلوسكوب)، وتحديد السطوح الحسية المتخصصة في القشرة المخية.',
        evaluationCriteria: ['يصف بنية الجلد ويحدد مستقبلاته', 'ينمذج الارتباط التشريحي بين المستقبل الحسي والمركز العصبي']
      },
      {
        code: 'II-أ-2',
        title: 'الحركة الإرادية والفعل اللاإرادي الحركي',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'العناصر التشريحية المتدخلة في الفعل الإرادي (القشرة المخية الحركية، النخاع الشوكي كناقل، والعضلة كعضو منفذ)',
          'العناصر التشريحية للقوس الانعكاسية في الفعل المنعكس الفطري (المستقبل الحسي، عصب حسي، النخاع الشوكي كمركز انعكاسي، عصب حركي، والعضلة)',
          'المقارنة الوظيفية بين الحركة الإرادية واللاإرادية'
        ],
        pedagogicalGuidance: 'إجراء تجارب المنعكسات الشوكية على الضفدع الأخضر بعد تخريب دماغه لبيان دور النخاع الشوكي.',
        evaluationCriteria: ['يميز خصوصيات الحركة الإرادية والمنعكس الفطري', 'يرسم مخطط القوس الانعكاسية الشوكية بدقة']
      },
      {
        code: 'II-أ-3',
        title: 'اختلال الاتصال العصبي والمخدرات',
        hours: '2 ساعتان (أسبوع واحد)',
        coreConcepts: [
          'تأثير المواد الكيميائية والمخدرات والتبغ والكحول على المشابك العصبية',
          'تدني سرعة المنعكسات الحركية وفقدان التوازن والإدراك الحسي وزيادة حوادث المرور',
          'التبعية النفسية والجسدية وطرق الوقاية'
        ],
        pedagogicalGuidance: 'مناقشة إحصائيات حوادث المرور الوطنية وتصميم مطويات وجداريات مدرسية للتوعية بمخاطر المخدرات.',
        evaluationCriteria: ['يحصي عواقب تناول المخدرات والمهدئات', 'يشارك بفعالية في حملات التوعية الصحية']
      },
      {
        code: 'II-ب-1',
        title: 'الحواجز الطبيعية والأجسام الغريبة',
        hours: '2 ساعتان (أسبوع واحد)',
        coreConcepts: [
          'الحواجز الطبيعية الميكانيكية (الجلد، الأهداب، والأجفان)',
          'الحواجز الطبيعية الكيميائية (الدموع، اللعاب، العرق، الإفرازات المخاطية وحموضة المعدة)',
          'عالم الميكروبات: البكتيريا، الفيروسات، الفطريات، والطفيليات ونشاطها التكاثري والسمي'
        ],
        pedagogicalGuidance: 'تصنيف الميكروبات إلى ممرضة وغير ممرضة، وتوضيح اختراق الخط الدفاعي الأول عبر الجروح والحروق.',
        evaluationCriteria: ['يحدد عناصر الخط الدفاعي الأول الخارجي', 'يقدم أمثلة عن الأجسام الغريبة والميكروبات']
      },
      {
        code: 'II-ب-2',
        title: 'الاستجابة المناعية اللانوعية (التفاعل الالتهابي والبلعمة)',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'مظاهر التفاعل الالتهابي الموضعي (الاحمرار، الحرارة، الانتفاخ، الألم، والقيح)',
          'مراحل البلعمة الأربعة بواسطة الكريات البيضاء البلعمية: 1) الانجذاب والالتصاق، 2) الإحاطة بالأرجل الكاذبة، 3) الابتلاع وتشكيل الفجوة البالعة، 4) الهضم بالإفرازات الأنزيمية وإطراح الفضلات'
        ],
        pedagogicalGuidance: 'تحليل شريط فيديو مجهري يوضح انسلال الكريات البيضاء البلعمية عبر جدار الشعيرات الدموية ومهاجمتها للبكتيريا.',
        evaluationCriteria: ['يشرح مراحل التفاعل الالتهابي والبلعمة برسم تخطيطي وظيفي', 'يبرز الطابع الفوري وغير النوعي للبلعمة']
      },
      {
        code: 'II-ب-3',
        title: 'الاستجابة المناعية النوعية (الخلطية والخلوية)',
        hours: '4 ساعات (أسبوعان)',
        coreConcepts: [
          'الاستجابة المناعية النوعية ذات الوساطة الخلطية بالخلايا اللمفاوية البائية (LB) وإفراز الأجسام المضادة النوعية وتشكيل المعقد المناعي (جسم مضاد - مولد ضد)',
          'الاستجابة المناعية النوعية ذات الوساطة الخلوية بالخلايا اللمفاوية التائية السمية (LTc) وتدمير الخلايا المصابة بالتماس المباشر (الصدمة السمية)',
          'الذاكرة المناعية ومقارنة الاستجابة الأولية البطيئة بالاستجابة الثانوية الفورية المكثفة'
        ],
        pedagogicalGuidance: 'تحليل تجارب العالم كيتاساتو على ذيفان الكزاز ومضاد الذيفان، وتفسير المنحنيات البيانية لكمية الأجسام المضادة في الاستجابة الأولية والثانوية.',
        evaluationCriteria: ['ينمذج المعقد المناعي جسم مضاد ومولد ضد', 'يعلل الفرق بين الاستجابة الأولية والثانوية', 'يميز بين الخلطية والخلوية']
      },
      {
        code: 'II-ب-4',
        title: 'الذات واللاذات ونقل الدم وزرع الطعوم',
        hours: '2 ساعتان (أسبوع واحد)',
        coreConcepts: [
          'مفهوم الذات واللاذات ومحددات الزمر الدموية ABO على غشاء الكريات الحمر، والأجسام المضادة في المصل',
          'عامل الريزوس Rh+ و Rh- وقواعد نقل الدم الآمن تجنباً لارتصاص الكريات الحمر وانحلالها',
          'شروط نجاح زرع الطعوم ورفض الطعم غير المتوافق نسيجياً'
        ],
        pedagogicalGuidance: 'إجراء محاكاة تجريبية لتحديد الزمرة الدموية باستعمال أمصال الاختبار، وتطبيق مخطط التوافق الدموي.',
        evaluationCriteria: ['يحدد شروط التوافق الدموي لنظامي ABO و Rh', 'يفسر أسباب رفض الطعوم غير المتوافقة']
      },
      {
        code: 'II-ب-5',
        title: 'الاعتلالات المناعية (الحساسية والتلقيح والاستمصال)',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'فرط الحساسية الفورية المفرطة ودور الأجسام المضادة IgE والخلايا الصارية (الماستوسيت) وإفراز الهستامين',
          'مفهوم التلقيح: حقن مولد ضد مخفف وغير ممرض لاكتساب مناعة نوعية نشطة وطويلة المدى (وقاية)',
          'مفهوم الاستمصال: حقن مصل جاهز يحتوي على أجسام مضادة نوعية لتوفير حماية سريعة مؤقتة (علاج فوري)'
        ],
        pedagogicalGuidance: 'إجراء مقارنة علمية جدولية بين التلقيح والاستمصال من حيث: المادة المحقونة، سرعة المفعول، مدة الحماية، والهدف الطبي.',
        evaluationCriteria: ['يعرف الحساسية ويذكر مسبباتها الشائعة', 'يميز بدقة بين خصائص التلقيح والاستمصال']
      }
    ]
  },
  {
    id: 'seq-3',
    num: 3,
    code: 'المقطع III',
    title: 'التكاثر وانتقال الصفات الوراثية',
    hours: 10,
    weeks: '5 أسابيع (الفصل الثالث)',
    term: 'الفصل الثالث',
    iconType: 'genetics',
    targetCompetency: 'يفسر دور الصبغيات في نقل الصفات الوراثية وثبات عدد صبغيات النوع عبر الأمشاج والإلقاح، ويثمن خطورة زواج الأقارب والإشعاعات.',
    priorKnowledge: [
      'مكونات الجهاز التكاثري الذكري والأنثوي ودور المناسل (1AM)',
      'ضرورة الإلقاح في التكاثر الجنسي ومفهوم النوع (1AM و 2AM)',
      'بنية الخلية والنواة (1AM)'
    ],
    resources: [
      {
        code: 'III-1',
        title: 'تشكل الأمشاج والإلقاح',
        hours: '4 ساعات (أسبوعان)',
        coreConcepts: [
          'مراحل تشكل النطاف في الأنابيب المنوية للخصية ومراحل تشكل البويضات في المبيض',
          'الانقسام المنصف والاختزال الصبغي من خلية أم ثنائية الصيغة الصبغية (2ن = 46) إلى أمشاج أحادية الصيغة (ن = 23 صبغياً)',
          'النمط النووي البشري الطبيعي (46 صبغياً مرتبة في 23 زوجاً متماثلاً: 22 زوجاً جسمياً + زوج جنسي XX عند الأنثى و XY عند الذكر)',
          'دور الإلقاح في اتحاد النواتين وإعادة جمع الصبغيات (ن + ن = 2ن) لضمان ثبات عدد صبغيات النوع البشري'
        ],
        pedagogicalGuidance: 'تحليل وثائق الأنماط النووية وترتيب الصبغيات حسب الطول وموقع الجزء المركزي، وحساب الصيغة الصبغية للأمشاج والبيضة الملقحة.',
        evaluationCriteria: ['يصف مراحل تشكل الأمشاج والانقسام المنصف', 'يقارن بين خلية جسمية وخلية جنسية', 'يعرف النمط النووي والإلقاح']
      },
      {
        code: 'III-2',
        title: 'الدعامة الوراثية لانتقال الصفات',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'النواة والصبغيات كحامل مادي للدعامة الوراثية ونقل المورثات',
          'مفهوم النمط الظاهري (مجموع الصفات الظاهرة والقابلة للملاحظة على مستوى العضوية والخلية والجزيء)',
          'مفهوم النمط الوراثي (مجموع المورثات التي يحملها الفرد على صبغياته والتي تتحكم في صفاته)'
        ],
        pedagogicalGuidance: 'دراسة تجارب النقل النووي عند البرمائيات (الضفادع) لإثبات أن النواة هي مقر المعلومات الوراثية المسؤولة عن الصفات.',
        evaluationCriteria: ['يحدد النواة كحامل للدعامة الوراثية', 'يميز بين النمط الظاهري والنمط الوراثي بتقديم أمثلة علمية']
      },
      {
        code: 'III-3',
        title: 'الاختلالات الوراثية والطفرات',
        hours: '3 ساعات (أسبوع ونصف)',
        coreConcepts: [
          'الشذوذ الصبغي العددي: تناذر داون (المنغولية) بوجود صبغي إضافي في الزوج 21 (2ن = 47 صبغياً)',
          'الأمراض الوراثية المرتبطة بالجنس مثل الناعور (الهيموفيليا) وعمى الألوان (الدالتونية)',
          'مفهوم الطفرة الوراثية وتأثير الإشعاعات النووية والملوثات الكيميائية على بنية الصبغيات',
          'مخاطر زواج الأقارب في رفع نسبة التقاء المورثات المرضية المتنحية وظهور التشوهات الخلقية'
        ],
        pedagogicalGuidance: 'قراءة وتحليل شجرة النسب الوراثية (Arbre généalogique) لتتبع انتقال مرض وراثي عبر الأجيال والتحسيس بالفحص الطبي قبل الزواج.',
        evaluationCriteria: ['يفسر أسباب الشذوذ الصبغي وتناذر داون', 'يقدم أمثلة عن تأثير الإشعاعات وعواقب زواج الأقارب']
      }
    ]
  }
];

export const SourceGuide4AMViewer: React.FC<Props> = ({ lessons }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'plans' | 'lessons' | 'bem' | 'prior' | 'pdf'>('plans');
  const [openSeqId, setOpenSeqId] = useState<string>('seq-1');
  const [openLessonIds, setOpenLessonIds] = useState<Set<string>>(new Set());

  const lessons4am = useMemo(() => {
    return lessons.filter(l => l.level === '4am');
  }, [lessons]);

  const filteredSequences = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OFFICIAL_4AM_SEQUENCES;
    return OFFICIAL_4AM_SEQUENCES.filter(seq => {
      const matchSeq = seq.title.toLowerCase().includes(q) ||
        seq.code.toLowerCase().includes(q) ||
        seq.targetCompetency.toLowerCase().includes(q) ||
        seq.resources.some(r =>
          r.title.toLowerCase().includes(q) ||
          r.pedagogicalGuidance.toLowerCase().includes(q) ||
          r.coreConcepts.some(c => c.toLowerCase().includes(q))
        );
      return matchSeq;
    });
  }, [query]);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons4am;
    return lessons4am.filter(l => {
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
  }, [lessons4am, query]);

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

  const pdfUrl = '/assets/aistudio/plans_annuels2023-sciences4am_43b4c173.pdf';

  return (
    <div dir="rtl" className="h-full flex flex-col bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-5 shadow-md border-b-4 border-indigo-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-indigo-300 text-xs font-black tracking-wide">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </span>
              <span>•</span>
              <span>وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط</span>
              <span>•</span>
              <span>مخططات سبتمبر 2022 الرسمية</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2.5 text-white">
              <Award className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>المخططات السنوية ودليل بناء التعلمات — السنة الرابعة متوسط (4AM)</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500 text-white font-black shadow">
                المرجع الوزاري لشهادة BEM (13 صفحة)
              </span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              السند المرجعي المعتمد لبناء وتقويم الكفاءات لميدان: <strong className="text-indigo-200">الإنسان والصحة (التغذية، التنسيق الوظيفي العصبي والمناعي، والتكاثر والوراثة)</strong> — يشمل معايير بناء مواضيع واختبارات شهادة التعليم المتوسط.
            </p>
          </div>

          {/* Quick PDF Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح المستند الرسمي (PDF)</span>
            </a>

            <a
              href={pdfUrl}
              download="plans_annuels2023-sciences4am.pdf"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition"
            >
              <Download className="w-4 h-4" />
              <span>تحميل</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition"
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
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'plans'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>المخططات السنوية والمقاطع الثلاثة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'lessons'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المذكرات النموذجية والأنشطة ({lessons4am.length} مذكرة)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bem')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'bem'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>منهجية تقويم شهادة BEM ومعايير التصحيح</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prior')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'prior'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>المكتسبات القبلية المجندة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'pdf'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>قارئ الـ PDF المدمج (13 صفحة)</span>
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
              placeholder="ابحث في دليل ومخططات 4AM: زغابة، بلعمة، أنزيم، منعكس فطري، ذات ولاذات، صبغيات، نمط نووي..."
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

        {/* TAB 1: ANNUAL PLANS & SEQUENCES */}
        {activeTab === 'plans' && (
          <div className="space-y-5">
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
                  3
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">المقاطع التعلمية الكبرى</div>
                  <div className="text-base font-black text-slate-900">ميدان الإنسان والصحة</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                  48
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">الحجم الساعي الإجمالي</div>
                  <div className="text-base font-black text-slate-900">24 أسبوعاً دراسياً</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  13
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">الموارد المستهدفة بالبناء</div>
                  <div className="text-base font-black text-slate-900">معايير ومؤشرات BEM</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                  100%
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">مطابقة الوزارة الرسمية</div>
                  <div className="text-base font-black text-slate-900">مخططات سبتمبر 2022</div>
                </div>
              </div>
            </div>

            {/* Sequence Accordions */}
            <div className="space-y-4">
              {filteredSequences.map(seq => {
                const isOpen = openSeqId === seq.id;
                return (
                  <div
                    key={seq.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-300 transition shadow-sm overflow-hidden"
                  >
                    <div
                      onClick={() => toggleSequence(seq.id)}
                      className="p-4 md:p-5 flex items-start justify-between cursor-pointer bg-gradient-to-l from-slate-50 to-white"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 text-sm shadow">
                          {seq.code}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-base md:text-lg font-black text-slate-900">
                              {seq.title}
                            </h2>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <Clock className="w-3 h-3" />
                              {seq.hours} ساعة
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              <Calendar className="w-3 h-3" />
                              {seq.weeks}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {seq.term}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            <strong className="text-slate-900">الكفاءة الختامية للمقطع:</strong> {seq.targetCompetency}
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
                        {/* Prior Knowledge */}
                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950">
                          <span className="font-black flex items-center gap-1.5 mb-1.5 text-amber-900">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>المكتسبات القبلية المشخصة قبل الشروع في المقطع:</span>
                          </span>
                          <ul className="list-disc list-inside space-y-1 font-medium pr-1">
                            {seq.priorKnowledge.map((pk, idx) => (
                              <li key={idx}>{pk}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Resources List */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-700 tracking-wide">
                            هيكلة الموارد المستهدفة بالبناء وتوجيهات الوضعيات:
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {seq.resources.map(res => (
                              <div
                                key={res.code}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                  <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono text-xs">
                                      {res.code}
                                    </span>
                                    <span>{res.title}</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                                    {res.hours}
                                  </span>
                                </div>

                                <div>
                                  <div className="text-[11px] font-black text-slate-500 mb-1">المفاهيم الأساسية المستهدفة:</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {res.coreConcepts.map((concept, i) => (
                                      <span
                                        key={i}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200"
                                      >
                                        {concept}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="text-xs bg-indigo-50/70 border border-indigo-200 rounded-lg p-2.5 text-indigo-950 leading-relaxed font-medium">
                                  <strong className="font-black text-indigo-900">سيرورة الأنشطة والتوجيه البيداغوجي:</strong>{' '}
                                  {res.pedagogicalGuidance}
                                </div>

                                <div>
                                  <div className="text-[11px] font-black text-emerald-800 mb-1">معايير ومؤشرات التقويم:</div>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {res.evaluationCriteria.map((crit, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>{crit}</span>
                                      </span>
                                    ))}
                                  </div>
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
                عدد مذكرات السنة الرابعة المطابقة: <span className="text-indigo-700 font-black">{filteredLessons.length}</span> من أصل {lessons4am.length}
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
                    className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm transition overflow-hidden"
                  >
                    <div
                      onClick={() => toggleLesson(id)}
                      className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-black text-xs">
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
                              <span className="font-black text-indigo-900 block mb-1">المركبة المعرفية:</span>
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
                                    <div className="text-indigo-950 bg-indigo-50/50 p-2 rounded border border-indigo-200">
                                      <strong className="text-indigo-900">نشاط وإجابة المتعلم:</strong> {act.ajwiba}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Structuring */}
                        {lesson.irsae && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5">
                            <span className="font-black text-emerald-950 block mb-1">إرساء الموارد (النتيجة والخلاصة):</span>
                            <p className="text-emerald-900 leading-relaxed font-bold whitespace-pre-line">{lesson.irsae}</p>
                          </div>
                        )}

                        {/* Assessment */}
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

        {/* TAB 3: BEM METHODOLOGY & ASSESSMENT CRITERIA */}
        {activeTab === 'bem' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>دليل بناء وتقويم مواضيع شهادة التعليم المتوسط (BEM) — علوم الطبيعة والحياة</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                تعتمد وزارة التربية الوطنية والمفتشية العامة للتربية الوطنية هيكلة موحدة لمواضيع امتحان شهادة التعليم المتوسط تهدف لقياس تملك الموارد ونماء الكفاءة الشاملة والختامية.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-black text-slate-900 text-sm">الجزء الأول: تقويم الموارد المعرفية</span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">12 نقطة</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">التمرين الأول (06 نقاط):</strong>
                    استرجاع منظم للمعارف وتطبيق مباشر لمعارف أساسية في وضعية بسيطة دون تعقيد سياقي (مثل: مراحل الهضم، مسار الرسالة العصبية، مراحل البلعمة، أو النمط النووي).
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">التمرين الثاني (06 نقاط):</strong>
                    تطبيق المسعى العلمي الاستقصائي والتجريبي، تحليل وثائق وجداول ومنحنيات، تفسير نتائج مخبرية وتبرير فرضيات علمية (مثل: تجارب المناعة، رفض الطعوم، أو سلوك الصبغيات).
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-black text-slate-900 text-sm">الجزء الثاني: الوضعية الإدماجية المركبة</span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800">08 نقاط</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <p className="leading-relaxed font-medium">
                    وضعية دالة مستمدة من الواقع الصحي للمواطن تطرح مشكلاً صحياً أو وراثياً مركباً، يعتمد التلميذ في حلها على تجنيد موارده واستغلال السندات المرفقة (سياق، سندات، وتعليمات دقيقة).
                  </p>
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-1">
                    <strong className="text-indigo-950 block">شبكة المعايير المعتمدة في التصحيح:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-indigo-900 font-bold">
                      <li>معيار الوجاهة (احترام التعليمات والسندات) — 2.5 ن</li>
                      <li>معيار الاستعمال السليم لأدوات المادة (المفاهيم العلمية) — 3 ن</li>
                      <li>معيار الانسجام (التسلسل المنطقي والتبرير العلمي) — 2 ن</li>
                      <li>معيار الإتقان والتميز (تنظيم الورقة ووضوح الطرح) — 0.5 ن</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria Detailed Cards */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-black text-slate-900 text-sm">شرح معايير ومؤشرات شبكة تصحيح الوضعية الإدماجية:</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block mb-1">1. الوجاهة (Pertinence):</strong>
                  <p className="text-slate-600">عدم الخروج عن الموضوع، فهم المشكل الصحي، والإجابة عن التعليمات المطلوبة واستثمار السندات المناسبة.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block mb-1">2. أدوات المادة (Outils):</strong>
                  <p className="text-slate-600">التوظيف السليم والدقيق للمصطلحات البيولوجية والفسيولوجية، والرموز، والرسوم التخطيطية الصحيحة.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block mb-1">3. الانسجام (Cohérence):</strong>
                  <p className="text-slate-600">تسلسل منطقي في الأفكار، ربط الأسباب بالنتائج، وعدم التناقض بين الخطوات المقترحة.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block mb-1">4. الإتقان (Perfectionnement):</strong>
                  <p className="text-slate-600">نظافة الورقة، وضوح الخط والتنظيم، وتقديم حلول ونصائح وقائية وجيهة وإبداعية.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRIOR KNOWLEDGE */}
        {activeTab === 'prior' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>المكتسبات القبلية المجندة لبناء موارد السنة الرابعة متوسط</span>
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                توضح المخططات السنوية الرسمية ضرورة تشخيص وحصر المكتسبات القبلية من التعليم الابتدائي ومن المستويات السابقة للتعليم المتوسط قبل الشروع في بناء الموارد، تفادياً للتكرار غير المجدي.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <h3 className="font-black text-slate-900 text-sm border-b pb-2">مكتسبات التعليم الابتدائي</h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-medium">
                  <li>مؤشرات النمو السليم عند الطفل والقواعد الصحية.</li>
                  <li>الدعامة التشريحية الأولية للجهاز الهضمي والهضم كعملية هدم.</li>
                  <li>الدم والدورة الدموية وأهمية التبرع بالدم.</li>
                  <li>الحواس الخمس وأعضاء الحس لحماية المحيط.</li>
                  <li>مناطق انثناء الجسم والتنسيق بين العظام والعضلات.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <h3 className="font-black text-slate-900 text-sm border-b pb-2">مكتسبات السنة الأولى متوسط</h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-medium">
                  <li>تصنيف الأغذية حسب المصدر والتركيب الكيميائي.</li>
                  <li>الرواتب الغذائية والتوازن الغذائي والقواعد الصحية.</li>
                  <li>التنفس كظاهرة حيوية ومصدر للطاقة وسطوح التبادل.</li>
                  <li>الإطراح وثبات توازن الوسط الداخلي والعناية بالكلى.</li>
                  <li>الجهاز التكاثري والتكاثر الجنسي وبنية الخلية.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <h3 className="font-black text-slate-900 text-sm border-b pb-2">مكتسبات السنة الثانية متوسط</h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-medium">
                  <li>مفهوم النوع وتصنيف الكائنات الحية.</li>
                  <li>علاقة وسط حياة الحيوان بنمط تنقله وخصائص أطرافه.</li>
                  <li>أنماط واستراتيجيات التكاثر الجنسي عند الحيوانات.</li>
                  <li>تأثير الإنسان على استقرار وتوازن الأنظمة البيئية.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EMBEDDED PDF VIEWER */}
        {activeTab === 'pdf' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className="font-black text-slate-900 text-sm">
                  المخططات السنوية الرسمية — علوم الطبيعة والحياة (4AM) — 13 صفحة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في نافذة كاملة</span>
                </a>
                <a
                  href={pdfUrl}
                  download="plans_annuels2023-sciences4am.pdf"
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
                title="المخططات السنوية ودليل بناء التعلمات - علوم الطبيعة والحياة - سنة رابعة متوسط"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
