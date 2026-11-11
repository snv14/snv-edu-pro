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
  Maximize2,
  Minimize2,
  Table2,
  Image as ImageIcon
} from 'lucide-react';
import { LessonMemo, DB_Table } from '../types';

interface Props {
  lessons: LessonMemo[];
}

interface OfficialSequenceInfo {
  id: string;
  number: number;
  title: string;
  weeks: number;
  hours: number;
  targetCompetency: string;
  priorKnowledge: string[];
  resources: {
    num: number;
    title: string;
    weeks: string;
    coreConcepts: string[];
    pedagogicalGuidance: string;
  }[];
}

const OFFICIAL_2AM_SEQUENCES: OfficialSequenceInfo[] = [
  {
    id: 'seq-1',
    number: 1,
    title: 'المقطع التعلمي 01: الوسط الحي',
    weeks: 11,
    hours: 22,
    targetCompetency: 'يحدد خصائص الوسط الحي، ويوضح العلاقات بين عناصره الحية واللاحية وتأثيرها على استقرار وتوازن الأنظمة البيئية مع تثمين الممارسات البيئية الإيجابية.',
    priorKnowledge: [
      'مفهوم الكائن الحي والحاجة الغذائية (مكتسبات الابتدائي ومقطع التغذية في 1AM)',
      'التنفس كظاهرة حيوية للتزوّد بالطاقة',
      'التكاثر كآلية لضمان بقاء النوع'
    ],
    resources: [
      {
        num: 1,
        title: 'خصائص الوسط الحي',
        weeks: 'الأسابيع 1 - 3 (6 ساعات)',
        coreConcepts: ['العناصر الحيوية (الوحدة الحياتية Biocénose)', 'العناصر اللاحيوية (المدى الحيوي الجغرافي Biotope)', 'معايير التمييز بين الأوساط الحية: غابي، صحراوي، مائي'],
        pedagogicalGuidance: 'ينطلق الأستاذ من خرجة ميدانية استكشافية لمعاينة وسط طبيعي قريب، أو توظيف سندات وصور رقمية لوسط غابي وصحراوي ومائي، مع تدريب المتعلم على الفصل المنهجي بين العناصر الحية واللاحية.'
      },
      {
        num: 2,
        title: 'العلاقات القائمة بين الكائنات الحية وتعديلاتها',
        weeks: 'الأسابيع 4 - 5 (4 ساعات)',
        coreConcepts: ['العلاقات الغذائية (افتراس، تطفل، تعايش، تنافس)', 'السلاسل والشبكات الغذائية والمستويات الغذائية', 'انتقال الكتلة الحية وضياع المادة والطاقة'],
        pedagogicalGuidance: 'بناء مفهوم السلسلة الغذائية انطلاقاً من كائنات الوسط المشاهد، حساب الكتلة الحية ونسبة التحويل (10% منتج إلى مستهلك)، واستنتاج سبب تناقص الكتلة الحية عبر المستويات.'
      },
      {
        num: 3,
        title: 'تأثير العوامل الفيزيوكيميائية على توزع الكائنات الحية ونشاطها',
        weeks: 'الأسابيع 6 - 7 (4 ساعات)',
        coreConcepts: ['الإضاءة، درجة الحرارة، الرطوبة ونوعية التربة', 'المقاومة واستراتيجيات التكيف (الحياة البطيئة، السبات الشتوي والصيفي، الهجرة)', 'توزع النباتات والحيوانات بحسب التدرج المناخي'],
        pedagogicalGuidance: 'استغلال أمثلة واقعية من البيئة الجزائرية (الشمال الرطب، الهضاب العليا، الصحراء)، وتحليل وثائق تجريبية توضح أثر تغير عامل فيزيوكيميائي واحد على نشاط نوع معين.'
      },
      {
        num: 4,
        title: 'النظام البيئي وشروط توازنه',
        weeks: 'الأسابيع 8 - 9 (4 ساعات)',
        coreConcepts: ['مفهوم النظام البيئي (Ecosystème = Biotope + Biocénose)', 'شروط استقرار وتوازن النظام البيئي', 'العوامل المخلة بالتوازن الطبيعي'],
        pedagogicalGuidance: 'التركيز على ديناميكية الشبكات الغذائية وكيف يؤدي اختفاء نوع رئيسي (مفترس علوي أو منتج) إلى انهيار التوازن، مع توظيف نماذج المحاكاة والرسوم التخطيطية.'
      },
      {
        num: 5,
        title: 'مكانة الإنسان في استقرار النظام البيئي',
        weeks: 'الأسابيع 10 - 11 (4 ساعات)',
        coreConcepts: ['التدخلات السلبية (التلوث، الرعي الجائر، إزالة الغابات، الصيد العشوائي)', 'التدخلات الإيجابية (التشجير، المحميات الطبيعية، الطاقات المتجددة، تدوير النفايات)', 'السد الأخضر والمحميات الوطنية في الجزائر'],
        pedagogicalGuidance: 'تبني استراتيجية حل المشكلات ومناقشة مشروع حماية بيئية محلي، واستخلاص المسؤولية المدنية والأخلاقية تجاه استدامة الموارد الطبيعية والتنوع الحيوي.'
      }
    ]
  },
  {
    id: 'seq-2',
    number: 2,
    title: 'المقطع التعلمي 02: توزع الكائنات الحية في أوساطها',
    weeks: 4,
    hours: 8,
    targetCompetency: 'يربط بين الخصائص المورفولوجية والوظيفية للكائنات الحية وقدرتها على شغل أوساطها المختلفة ومقاومة الظروف القاسية.',
    priorKnowledge: [
      'وظائف التغذية والتنفس والتكاثر المكتسبة',
      'العوامل الفيزيوكيميائية للوسط الحي'
    ],
    resources: [
      {
        num: 1,
        title: 'تحورات البنية الإعاشية عند النباتات',
        weeks: 'الأسبوع 12 (ساعتان)',
        coreConcepts: ['تحورات المجموع الخضري (تقليص المساحة الورقية، تحول الأوراق إلى أشواك، السيقان اللحمية الادخارية)', 'تحورات المجموع الجذري (الامتداد العميق والأفقي للبحث عن الماء)', 'الحد من النتح والادخار المائي'],
        pedagogicalGuidance: 'مقارنة عينات نباتية حية أو صور لنباتات شائعة (الشيح، الحلفاء، التين الشوكي، النخيل) وتحديد نمط التحور الوظيفي المناسب لبيئتها.'
      },
      {
        num: 2,
        title: 'التنفس عند الكائنات الحية وشغل الأوساط',
        weeks: 'الأسبوع 13 (ساعتان)',
        coreConcepts: ['أنماط الأجهزة التنفسية: رئوي، غلصمي، جلدي، قصبي', 'علاقة نمط التنفس بوسط العيش وكمية الأكسجين المذاب أو الجوي', 'العضوية والوسط المائي والبرمائي'],
        pedagogicalGuidance: 'إجراء تشريح أو ملاحظة مجهرية للأغلاصم عند السمك، وتتبع حركة فتح وغلق الفم والأغطية الغلصمية، ومقارنتها بالقصبات التنفسية عند الحشرات والرئات عند الثدييات.'
      },
      {
        num: 3,
        title: 'تأثير ممارسات الإنسان على تنفس وتوزع الحيوانات',
        weeks: 'الأسبوع 14 (ساعتان)',
        coreConcepts: ['تلوث المجاري المائية والمسطحات بالملوثات الكيميائية والعضوية', 'تغير نسبة الأكسجين المنحل في الماء وتأثيره على الثروة السمكية', 'مؤشرات التلوث البيولوجي'],
        pedagogicalGuidance: 'دراسة حالة لرافد أو واد ملوث وتحليل منحنيات تغير نسبة O2 المذاب وتوزع أنواع الأسماك واللافقاريات المائية قبل وبعد نقطة صب النفايات.'
      },
      {
        num: 4,
        title: 'أنماط التنقل عند الحيوانات واحتلال الأوساط',
        weeks: 'الأسبوع 15 (ساعتان)',
        coreConcepts: ['المشي، الركض، القفز، الطيران، السباحة', 'الملاءمة البنيوية لأعضاء الحركة مع نمط التنقل (مساحة الإسناد، الأجنحة، الزعانف)', 'دور التنقل في التغذية والهروب واحتلال موائل جديدة'],
        pedagogicalGuidance: 'مقارنة الهيكل العظمي والطرفي لأطراف حيوانات مختلفة (أرنب، حصان، طائر، ضفدع) واستخلاص قاعدة التكيف البنيوي الحركي.'
      }
    ]
  },
  {
    id: 'seq-3',
    number: 3,
    title: 'المقطع التعلمي 03: التكاثر وإعمار الأوساط',
    weeks: 5,
    hours: 10,
    targetCompetency: 'يفسر آليات التكاثر الجنسي والخضري واستراتيجيات غزو وإعمار الأوساط لضمان استمرار وبقاء الأنواع.',
    priorKnowledge: [
      'مفهوم التكاثر عند النباتات والحيوانات من التعليم الابتدائي',
      'دورة الحياة ومراحل التطور'
    ],
    resources: [
      {
        num: 1,
        title: 'أنماط التكاثر واستراتيجياته عند الحيوانات',
        weeks: 'الأسابيع 16 - 17 (4 ساعات)',
        coreConcepts: ['استراتيجية العدد (إنتاج هائل دون رعاية)', 'استراتيجية النوعية (عدد محدود مع حماية ورعاية الأبوين)', 'الإلقاح الداخلي والخارجي وتطور الجنين (بيوض، ولود)'],
        pedagogicalGuidance: 'مقارنة استراتيجية التكاثر عند الأسماك والضفادع (إلقاح خارجي، آلاف البيوض) مع الثدييات والطيور (إلقاح داخلي، رعاية وحضانة)، وربطها بنسبة نجاة الصغار.'
      },
      {
        num: 2,
        title: 'أنماط التكاثر عند النباتات وإعمار الأوساط',
        weeks: 'الأسابيع 18 - 19 (4 ساعات)',
        coreConcepts: ['التكاثر الجنسي بالأبواغ (الحزازيات، السرخسيات)', 'التكاثر الجنسي بالبذور وانتشارها (عوامل الانتشار: الرياح، الماء، الحيوان)', 'التكاثر الخضري واللاجنسي (الدرنات، الأبصال، الجذامير، الافتسال، الترقيد)'],
        pedagogicalGuidance: 'فحص عينات لنباتات زهرية ولازهرية، دراسة تحورات البذور لتسهيل انتشارها (الأجنحة، المظلات الهوائية، الخطاطيف)، وممارسة تجارب الافتسال والتطعيم مخبرياً.'
      },
      {
        num: 3,
        title: 'تأثير الإنسان على التكاثر وإعمار الأوساط',
        weeks: 'الأسبوع 20 (ساعتان)',
        coreConcepts: ['الاستغلال المفرط في مواسم التكاثر والصيد غير القانوني', 'التحكم الإيجابي في التكاثر: التلقيح الاصطناعي، الاستزراع السمكي، بنوك البذور', 'إعادة إدخال الأنواع المهددة بالانقراض إلى بيئاتها الطبيعية'],
        pedagogicalGuidance: 'مناقشة التشريعات الوطنية لتنظيم مواسم الصيد البري والبحري، وتثمين جهود المحميات الوطنية وحظائر التكاثر.'
      }
    ]
  },
  {
    id: 'seq-4',
    number: 4,
    title: 'المقطع التعلمي 04: تصنيف الكائنات الحية',
    weeks: 2,
    hours: 4,
    targetCompetency: 'يصنف الكائنات الحية اعتماداً على معايير علمية دقيقة ويدرك أهمية التنوع البيولوجي في الحفاظ على الحياة.',
    priorKnowledge: [
      'التمييز بين النباتات والحيوانات',
      'الصفات المورفولوجية المشتركة'
    ],
    resources: [
      {
        num: 1,
        title: 'معايير تصنيف الكائنات الحية',
        weeks: 'الأسبوع 21 (ساعتان)',
        coreConcepts: ['مفهوم النوع (التشابه المورفولوجي + التلاقح وإنجاب أفراد خصبة جنسياً)', 'تصنيف الحيوانات: فقاريات (ثدييات، طيور، زواحف، برمائيات، أسماك) ولافقاريات', 'تصنيف النباتات: ذات أزهار وبذور (كاسيات وعاريات البذور) وعديمة الأزهار'],
        pedagogicalGuidance: 'تدريب المتعلمين على استخدام مفتاح التصنيف ثنائي التفرع (Clé dichotomique) لتحديد المجموعة التي ينتمي إليها كائن مجهول.'
      },
      {
        num: 2,
        title: 'التنوع البيولوجي وأهميته البيئية',
        weeks: 'الأسبوع 22 (ساعتان)',
        coreConcepts: ['مستويات التنوع الحيوي: التنوع الوراثي، تنوع الأنواع، تنوع الأنظمة البيئية', 'مخاطر فقدان التنوع الحيوي وتأثيره على السلاسل الغذائية واستقرار الأرض'],
        pedagogicalGuidance: 'بناء ملصقات جدارية توعوية تسلط الضوء على الكائنات النادرة في الجزائر (الفهد الصحراوي، الأيل البربري، شجرة السرو الطاسيلي).'
      }
    ]
  },
  {
    id: 'seq-5',
    number: 5,
    title: 'المقطع التعلمي 05: المستحاثات وشواهد التاريخ الجيولوجي',
    weeks: 2,
    hours: 4,
    targetCompetency: 'يستغل المستحاثات كشواهد علمية لتحديد البيئات الجغرافية القديمة وتتبع تطور الكائنات الحية عبر الأزمنة.',
    priorKnowledge: [
      'طبقات الأرض والتربة',
      'بقايا الكائنات الحية ومفهوم الزمن الجيولوجي'
    ],
    resources: [
      {
        num: 1,
        title: 'مفهوم المستحاثة وظروف الاستحاثة',
        weeks: 'الأسبوع 23 (ساعتان)',
        coreConcepts: ['تعريف المستحاثة (بقايا كائنات حية أو قوالب أو آثار محفوظة في الصخور الرسوبية)', 'مراحل الاستحاثة: الموت، الطمر السريع في الرواسب، التمعدن والتصلب'],
        pedagogicalGuidance: 'ملاحظة عينات حقيقية لمستحاثات (أمونيت، ثلاثية الفصوص، أوراق نباتية متحجرة) أو صور عالية الدقة، مع صنع قالب جبسي لمستحاثة لتجسيد مراحل التشكل.'
      },
      {
        num: 2,
        title: 'أهمية المستحاثات ومكانتها في إعادة تشكيل البيئات القديمة',
        weeks: 'الأسبوع 24 (ساعتان)',
        coreConcepts: ['المستحاثات المرشدة وبيئات الترسيب', 'إعادة تصور المناخ والمناظر الطبيعية القديمة لمنطقة معينة (مثل وجود مستحاثات بحرية في جبال الأطلس الصحراوي)', 'تطور الكائنات الحية عبر الحقب الجيولوجية'],
        pedagogicalGuidance: 'استنتاج أن منطقة الصحراء الكبرى كانت قديماً مغطاة بالبحار والغابات الخضراء بفضل المستحاثات المكتشفة فيها، وتوظيف مبدأ الحالية الجيولوجي.'
      }
    ]
  }
];

export const SourceGuide2AMViewer: React.FC<Props> = ({ lessons }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'guide' | 'lessons' | 'pdf' | 'assessment'>('guide');
  const [openSeqIds, setOpenSeqIds] = useState<Set<string>>(new Set(['seq-1']));
  const [openLessonIds, setOpenLessonIds] = useState<Set<string>>(new Set());
  const [previewSvg, setPreviewSvg] = useState<{ title: string; svg: string } | null>(null);

  const lessons2am = useMemo(() => {
    return lessons.filter(l => l.level === '2am');
  }, [lessons]);

  const filteredSequences = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OFFICIAL_2AM_SEQUENCES;
    return OFFICIAL_2AM_SEQUENCES.map(seq => {
      const matchSeq = seq.title.toLowerCase().includes(q) ||
        seq.targetCompetency.toLowerCase().includes(q) ||
        seq.priorKnowledge.some(p => p.toLowerCase().includes(q));
      
      const filteredRes = seq.resources.filter(r => 
        r.title.toLowerCase().includes(q) ||
        r.pedagogicalGuidance.toLowerCase().includes(q) ||
        r.coreConcepts.some(c => c.toLowerCase().includes(q))
      );

      if (matchSeq || filteredRes.length > 0) {
        return {
          ...seq,
          resources: filteredRes.length > 0 ? filteredRes : seq.resources
        };
      }
      return null;
    }).filter(Boolean) as OfficialSequenceInfo[];
  }, [query]);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons2am;
    return lessons2am.filter(l => {
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
  }, [lessons2am, query]);

  const toggleSequence = (id: string) => {
    setOpenSeqIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const pdfUrl = '/assets/aistudio/plans_annuels2023-sciences2am_97a62a5b.pdf';

  return (
    <div dir="rtl" className="h-full flex flex-col bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 shadow-md border-b-4 border-emerald-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-black tracking-wide">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </span>
              <span>•</span>
              <span>وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2.5 text-white">
              <BookOpen className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>المخططات السنوية ودليل بناء التعلمات — السنة الثانية متوسط</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black">
                وثيقة 2022/2023 الرسمية (13 صفحة)
              </span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              السند المرجعي الشامل لتخطيط وتدرج التعلمات في مادة علوم الطبيعة والحياة لميدان: <strong className="text-emerald-200">الإنسان والمحيط (توازن الأنظمة البيئية وتنوع الكائنات الحية)</strong>.
            </p>
          </div>

          {/* Quick PDF Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح المستند الرسمي (PDF)</span>
            </a>

            <a
              href={pdfUrl}
              download="plans_annuels2023-sciences2am.pdf"
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
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>المقاطع والوحدات الرسمية (5 مقاطع)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'lessons'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المذكرات النموذجية والأنشطة ({lessons2am.length} مذكرة)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'pdf'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>قارئ الـ PDF المدمج</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
              activeTab === 'assessment'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>الكفاءات والتقويم التكويني</span>
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
              placeholder="ابحث في دليل ومذكرات 2AM: بالموارد، المفاهيم، التحورات، السلاسل الغذائية، المستحاثات..."
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

        {/* TAB 1: OFFICIAL SEQUENCES GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  5
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">المقاطع البيداغوجية</div>
                  <div className="text-base font-black text-slate-900">ميدان الإنسان والمحيط</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black">
                  16
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">إجمالي الموارد التعلمية</div>
                  <div className="text-base font-black text-slate-900">مفاهيم وأنشطة متسلسلة</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-black">
                  48
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">الحجم الساعي الإجمالي</div>
                  <div className="text-base font-black text-slate-900">24 أسبوعاً دراسياً</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center font-black">
                  100%
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">التطابق الوزاري الرسمي</div>
                  <div className="text-base font-black text-slate-900">مخططات سبتمبر 2022</div>
                </div>
              </div>
            </div>

            {/* Sequence Cards */}
            <div className="space-y-4">
              {filteredSequences.map(seq => {
                const isOpen = openSeqIds.has(seq.id);
                return (
                  <div
                    key={seq.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 transition shadow-sm overflow-hidden"
                  >
                    <div
                      onClick={() => toggleSequence(seq.id)}
                      className="p-4 md:p-5 flex items-start justify-between cursor-pointer bg-gradient-to-l from-slate-50 to-white"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-sm shadow">
                          {seq.number}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-base md:text-lg font-black text-slate-900">
                              {seq.title}
                            </h2>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Calendar className="w-3 h-3" />
                              {seq.weeks} أسابيع
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                              <Clock className="w-3 h-3" />
                              {seq.hours} ساعة
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
                        {/* Prior Knowledge */}
                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                          <div className="font-black mb-1.5 flex items-center gap-1.5 text-amber-950">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>المكتسبات القبلية المجندة لبناء موارد المقطع:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 font-medium pr-1">
                            {seq.priorKnowledge.map((pk, idx) => (
                              <li key={idx}>{pk}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Resources Table/List */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-700 tracking-wide">
                            الموارد التعلمية والتوجيهات البيداغوجية الرسمية:
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {seq.resources.map(res => (
                              <div
                                key={res.num}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                  <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs flex items-center justify-center font-bold">
                                      {res.num}
                                    </span>
                                    <span>المورد {res.num}: {res.title}</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                    {res.weeks}
                                  </span>
                                </div>

                                <div>
                                  <div className="text-[11px] font-black text-slate-500 mb-1">المفاهيم الأساسية:</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {res.coreConcepts.map((cc, i) => (
                                      <span
                                        key={i}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200"
                                      >
                                        {cc}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="text-xs bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-emerald-950 leading-relaxed font-medium">
                                  <strong className="font-black text-emerald-900">سيرورة الأنشطة والتوجيه المنهجي:</strong>{' '}
                                  {res.pedagogicalGuidance}
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

        {/* TAB 2: LESSON MEMOS EXPLORER */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600 font-bold">
                عدد المذكرات المطابقة: <span className="text-emerald-700 font-black">{filteredLessons.length}</span> من أصل {lessons2am.length}
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
                    className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-sm transition overflow-hidden"
                  >
                    <div
                      onClick={() => toggleLesson(id)}
                      className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-xs">
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
                              <span className="font-black text-emerald-800 block mb-1">المركبة المعرفية:</span>
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

                        {/* Problematic & Hypothesis */}
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
                            <span className="font-black text-slate-900 block">سيرورة النشاطات التعليمية التعلمية:</span>
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
                                    <div className="text-emerald-900 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                                      <strong className="text-emerald-950">نشاط وإجابة المتعلم:</strong> {act.ajwiba}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Structuring / Conclusion */}
                        {lesson.irsae && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5">
                            <span className="font-black text-emerald-950 block mb-1">إرساء الموارد (النتيجة / الاستخلاص):</span>
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

        {/* TAB 3: EMBEDDED PDF VIEWER */}
        {activeTab === 'pdf' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-slate-900 text-sm">
                  المخطط السنوي الرسمي — علوم الطبيعة والحياة (2AM) — 13 صفحة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في علامة تبويب كاملة</span>
                </a>
                <a
                  href={pdfUrl}
                  download="plans_annuels2023-sciences2am.pdf"
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
                title="المخططات السنوية لمادة علوم الطبيعة والحياة - سنة ثانية متوسط"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        )}

        {/* TAB 4: PEDAGOGICAL ASSESSMENT & COMPETENCIES */}
        {activeTab === 'assessment' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>الإطار المرجعي للكفاءات والتقويم البيداغوجي لمرحلة التعليم المتوسط — 2AM</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-black text-emerald-950 text-sm">الكفاءة الشاملة للطور الأول (1AM + 2AM)</h3>
                  <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                    يحل مشكلات متعلقة بوظائف الكائنات الحية وتفاعلها الإيجابي مع محيطها، انطلاقاً من ملاحظات ووثائق علمية، ويقترح حلولاً ملموسة للحفاظ على الصحة والبيئة.
                  </p>
                </div>

                <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-black text-teal-950 text-sm">الكفاءة الختامية لميدان الإنسان والمحيط (2AM)</h3>
                  <p className="text-xs text-teal-900 leading-relaxed font-medium">
                    يقترح سلوكات إيجابية للمحافظة على التنوع البيولوجي وتوازن الأنظمة البيئية اعتماداً على معارفه حول تنظيم الأوساط وتكيف وتكاثر الكائنات الحية وتاريخ الأرض الجيولوجي.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-black text-slate-900 text-sm">معايير ومؤشرات التقويم التكويني المعتمدة:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-black text-slate-900 text-xs">مع 1: الوجاهة (الملائمة)</div>
                    <p className="text-[11px] text-slate-600">فهم الوضعية بدقة، تحديد المشكل العلمي، واستعمال السندات المقترحة بشكل مناسب.</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-black text-slate-900 text-xs">مع 2: الاستعمال السليم لأدوات المادة</div>
                    <p className="text-[11px] text-slate-600">توظيف المصطلحات العلمية الدقيقة، الملاحظة المجهرية، رسم المخططات وقراءة الجداول.</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-black text-slate-900 text-xs">مع 3: الانسجام والمنطق</div>
                    <p className="text-[11px] text-slate-600">تسلسل الأفكار والتعليل العلمي المنطقي وربط الأسباب بالنتائج بوضوح.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
