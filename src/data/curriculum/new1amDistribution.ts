import type { OfficialAnnualDistributionRow } from './officialAnnualDistributionData';

/**
 * التدرج السنوي الرسمي — السنة الأولى متوسط، علوم الطبيعة والحياة
 * منقول عن الوثيقة الورقية الرسمية:
 *   «التوزيع السنوي للأنشطة علوم الطبيعة والحياة / السنة الأولى متوسط»
 *   متوسطة حسناوي عبد القادر — السوقر، تيارت
 *   الأستاذ: جمال الدين أمين شعلال — الموسم الدراسي 2026-2027
 *
 * ═══════════ ما يجب معرفته قبل تعديل هذا الملف ═══════════
 *
 * 1) الميدانان **متناوبان**، وليسا كتلتين متعاقبتين كما كان سائداً في المنصة:
 *      الميدان الأول «الإنسان والصحة»   : المقطع 1 التغذية → 2 التحصل على الطاقة
 *                                        → 3 الإطراح → 4 التكاثر عند الإنسان
 *      الميدان الثاني «الإنسان والمحيط» : المقطع 1 التغذية عند النبات الأخضر
 *                                        → 2 التحصل على الطاقة عند النبات
 *                                        → 3 التكاثر عند النباتات ذات الأزهار
 *                                        → 4 الخلية
 *    أي أن الترقيم يُعاد من «الأول» عند كل ميدان، تبعاً لتسلسل الوثيقة نفسها.
 *    (في المخطط الوزاري المرقّم 1→8 يكون الإطراح هو المقطع 5، وفي هذه الوثيقة
 *     هو المقطع الثالث للميدان الأول. التسميتان تصفان المضمون نفسه.)
 *
 * 2) الوثيقة تعرض **حصتين في السطر الواحد**: العمود الأيمن هو الحصة الأولى
 *    (session1) والعمود الأيسر هو الحصة الثانية (session2). حين تتجاوز خلية
 *    سطرين (كما في «تركيب البول والدم والعرق») تُقرأ استمراراً في السطر الموالي.
 *
 * 3) الوثيقة لا تطبع تواريخ؛ تطبع الشهر ورقم الأسبوع داخله. التواريخ هنا
 *    **مشتقّة** من (الشهر، رقم الأسبوع) عبر أول اثنينات الشهر، وليست منقولة.
 *    انظر datesForMonthWeek أدناه.
 *
 * 4) النسب المئوية منقولة كما هي مطبوعة، وتتوقف عند 100 % في المورد الأخير
 *    (الخلية) ثم تُعاد 100 % على اختبار الفصل الثالث.
 *
 * 5) خلية النسبة فارغة في سطر «فيفري — الأسبوع 1» لأنها مقطوعة عند حدّ الصفحة
 *    في الأصل الورقي؛ لم تُقدَّر قيمة من عندنا (انظر ملاحظة الأسطر 18).
 *
 * المصدر المرجعي للمحتوى (الموارد والأنشطة): src/data/official/learningPlan1am.ts
 */

type Row = OfficialAnnualDistributionRow;

const MIDAN_1 = 'الميدان الأول: الإنسان والصحة';
const MIDAN_2 = 'الميدان الثاني: الإنسان والمحيط';

const MAQTA_1_1 = 'المقطع الأول: التغذية عند الإنسان';
const MAQTA_1_2 = 'المقطع الثاني: التحصل على الطاقة عند الإنسان';
const MAQTA_1_3 = 'المقطع الثالث: الإطراح عند الإنسان';
const MAQTA_1_4 = 'المقطع الرابع: التكاثر عند الإنسان';
const MAQTA_2_1 = 'المقطع الأول: التغذية عند النبات الأخضر';
const MAQTA_2_2 = 'المقطع الثاني: التحصل على الطاقة عند النبات الأخضر';
const MAQTA_2_3 = 'المقطع الثالث: التكاثر عند النباتات ذات الأزهار';
const MAQTA_2_4 = 'المقطع الرابع: الخلية';

/**
 * أحد الأحد الذي يبدأ به كل أسبوع دراسي، مشتقّاً من الأسبوع الأول.
 * الوثيقة الورقية تطبع (الشهر، رقم الأسبوع) فقط ولا تطبع تواريخ، فالتواريخ هنا
 * **مشتقة** لا منقولة — بنفس طريقة annualDistribution2am2026.ts.
 */
const WEEK_ONE_SUNDAY = '2026-09-21'; // الأسبوع 1 = 21 سبتمبر 2026 (الاثنين)

const ISO_SUNDAYS: Record<string, string> = (() => {
  const anchors: Record<string, string> = {
    'سبتمبر/4': '2026-09-20',
    'أكتوبر/1': '2026-09-27', 'أكتوبر/2': '2026-10-04', 'أكتوبر/3': '2026-10-11', 'أكتوبر/4': '2026-10-18',
    'نوفمبر/1': '2026-10-25', 'نوفمبر/2': '2026-11-01', 'نوفمبر/3': '2026-11-08', 'نوفمبر/4': '2026-11-15',
    'ديسمبر/1': '2026-11-22', 'ديسمبر/2': '2026-11-29', 'ديسمبر/3': '2026-12-06', 'ديسمبر/4': '2026-12-13',
    'جانفي/1': '2027-01-03', 'جانفي/2': '2027-01-10', 'جانفي/3': '2027-01-17', 'جانفي/4': '2027-01-24',
    'فيفري/1': '2027-01-31', 'فيفري/2': '2027-02-07', 'فيفري/3': '2027-02-14', 'فيفري/4': '2027-02-21',
    'مارس/1': '2027-02-28', 'مارس/2': '2027-03-07', 'مارس/3': '2027-03-14', 'مارس/4': '2027-03-21',
    'أفريل/1': '2027-04-04', 'أفريل/2': '2027-04-11', 'أفريل/3': '2027-04-18', 'أفريل/4': '2027-04-25',
    'ماي/1': '2027-05-02', 'ماي/2': '2027-05-09', 'ماي/3': '2027-05-16', 'ماي/4': '2027-05-23',
    'جوان/1': '2027-05-30', 'جوان/2': '2027-06-06', 'جوان/3': '2027-06-13',
  };
  return anchors;
})();

const plusDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** الأحد ← الخميس بصيغة الوثيقة (dd − dd) — اشتقاق لا نقل. */
export function datesForMonthWeek(month: string, weekInMonth: number): string {
  const sunday = ISO_SUNDAYS[`${month}/${weekInMonth}`];
  if (!sunday) return '';
  const start = sunday.slice(8, 10);
  const end = plusDays(sunday, 4).slice(8, 10);
  return `${start} − ${end}`;
}

interface RawRow {
  n: number;
  week: number;
  weekInMonth: number;
  month: string;
  percent: string;
  midan?: string;
  maqta?: string;
  mawrid?: string;
  learningUnit?: string;
  session1: string;
  session2: string;
  sourceSequenceId?: string;
  sourceResourceId?: string;
  sourceLearningUnitId?: string;
  sourceActivityId?: string;
  sourceActivityId2?: string;
  taqwim?: string;
  isExam?: boolean;
  isHoliday?: boolean;
  isIntroductory?: boolean;
  isRemediation?: boolean;
  holidayLabel?: string;
  lessonType?: Row['lessonType'];
}

const RAW: RawRow[] = [
  // ═══════════════════ الفصل الأول ═══════════════════
  {
    n: 1, week: 1, weekInMonth: 4, month: 'سبتمبر', percent: '0 %',
    mawrid: 'استقبال التلاميذ، توجيهات، أسبوع الصحة المدرسية',
    session1:
      'استقبال التلاميذ، توجيهات، أسبوع الصحة المدرسية (الدرس الافتتاحي: تأثير الإضرار بالصحة على الصحة/ ورشات حول: النظافة الشخصية، الغذاء المتوازن، مخاطر مشروبات الطاقة على صحة الإنسان، الرياضة وتأثيرها على صحة التلميذ، الصحة النفسية والعقلية؛ التنمر، مخاطر الإدمان على المخدرات)',
    session2: 'معالجة بيداغوجية',
    isIntroductory: true,
    lessonType: 'introductory',
  },
  {
    n: 2, week: 2, weekInMonth: 1, month: 'أكتوبر', percent: '0 %',
    mawrid: 'معالجة بيداغوجية',
    session1: 'معالجة بيداغوجية',
    session2: 'معالجة بيداغوجية',
    isRemediation: true,
    lessonType: 'remediation',
  },
  {
    n: 3, week: 3, weekInMonth: 2, month: 'أكتوبر', percent: '4 %',
    midan: MIDAN_1, maqta: `${MAQTA_1_1} / وضعية الانطلاق`,
    mawrid: 'المورد 1: مصدر الأغذية وتركيبها',
    learningUnit: 'تعلم مورد 1-1: تصنيف الأغذية حسب مصدرها',
    session1:
      'وضعية الانطلاق الشاملة — المورد 1: مصدر الأغذية وتركيبها — النشاط 1: اكشف تجريبيا عن مصدر الأغذية',
    session2:
      'المورد 1: مصدر الأغذية وتركيبها — النشاط 2: اقارن تركيب بعض الأغذية (تحليل الحليب، ...)',
    sourceSequenceId: 'seq_1am_1',
    sourceResourceId: 'res_1am_1_1',
    sourceLearningUnitId: 'lu_1am_1_1_1',
    sourceActivityId: 'act_1am_1_1_1_1',
    taqwim: 'تقويم وضعية الانطلاق',
  },
  {
    n: 4, week: 4, weekInMonth: 3, month: 'أكتوبر', percent: '8 %',
    midan: MIDAN_1, maqta: MAQTA_1_1,
    mawrid: 'المورد 1: مصدر الأغذية وتركيبها',
    learningUnit: 'تعلم مورد 1-2: تصنيف الأغذية حسب تركيبها',
    session1: 'المورد 1: مصدر الأغذية وتركيبها — النشاط 2 (تابع): اقارن تركيب بعض الأغذية (تحليل أغذية أخرى)',
    session2: 'المورد 1: مصدر الأغذية وتركيبها — الحوصلة',
    sourceSequenceId: 'seq_1am_1',
    sourceResourceId: 'res_1am_1_1',
    sourceLearningUnitId: 'lu_1am_1_1_2',
    sourceActivityId: 'act_1am_1_1_2_1',
    taqwim: 'حوصلة مصدر الأغذية وتركيبها',
  },
  {
    n: 5, week: 5, weekInMonth: 4, month: 'أكتوبر', percent: '12 %',
    midan: MIDAN_1, maqta: MAQTA_1_1,
    mawrid: 'المورد الثاني: دور الأغذية في الجسم',
    learningUnit: 'تعلم مورد 2-1: دور الأغذية في الجسم',
    session1:
      'المورد الثاني: دور الأغذية في الجسم — النشاط 1: استخرج العلاقة بين أعراض بعض أمراض سوء التغذية ومميزات الغذاء المستهلك',
    session2: 'المورد الثاني: دور الأغذية في الجسم — النشاط 2: الخص دور الأغذية في العضوية',
    sourceSequenceId: 'seq_1am_1',
    sourceResourceId: 'res_1am_1_2',
    sourceLearningUnitId: 'lu_1am_1_2_1',
    sourceActivityId: 'act_1am_1_2_1_1',
    sourceActivityId2: 'act_1am_1_2_1_2',
    taqwim: 'تلخيص دور الأغذية في العضوية',
  },
  {
    n: 6, week: 6, weekInMonth: 1, month: 'نوفمبر', percent: '16 %',
    midan: MIDAN_1, maqta: MAQTA_1_1,
    mawrid: 'المورد الثالث: الرواتب الغذائية والتوازن الغذائي',
    learningUnit: 'تعلم مورد 3-1: الرواتب الغذائية',
    session1:
      'المورد الثالث: الرواتب الغذائية والتوازن الغذائي — النشاط 1: احدد الحاجيات الغذائية للعضوية على أساس دورها',
    session2:
      'المورد الثالث: الرواتب الغذائية والتوازن الغذائي — النشاط 2: استنتج العوامل التي تتحكم في تغير الحاجيات الغذائية للإنسان',
    sourceSequenceId: 'seq_1am_1',
    sourceResourceId: 'res_1am_1_3',
    sourceLearningUnitId: 'lu_1am_1_3_1',
    sourceActivityId: 'act_1am_1_3_1_1',
    sourceActivityId2: 'act_1am_1_3_1_2',
    taqwim: 'تحديد الحاجيات الغذائية للعضوية',
  },
  {
    n: 7, week: 7, weekInMonth: 2, month: 'نوفمبر', percent: '20 %',
    midan: MIDAN_1, maqta: MAQTA_1_1,
    mawrid: 'المورد الثالث: الرواتب الغذائية والتوازن الغذائي',
    learningUnit: 'تعلم مورد 3-2: التوازن الغذائي',
    session1:
      'المورد الثالث: الرواتب الغذائية والتوازن الغذائي — النشاط 3: احل وضعية ادماج تخص التوازن الغذائي',
    session2: 'وضعية ادماج المقطع — حل وضعية الانطلاق',
    sourceSequenceId: 'seq_1am_1',
    sourceResourceId: 'res_1am_1_3',
    sourceLearningUnitId: 'lu_1am_1_3_2',
    sourceActivityId: 'act_1am_1_3_2_1',
    taqwim: 'إدماج موارد المقطع وحل وضعية الانطلاق',
  },
  {
    n: 8, week: 8, weekInMonth: 3, month: 'نوفمبر', percent: '24 %',
    midan: MIDAN_1, maqta: MAQTA_1_1,
    mawrid: 'تقويم المقطع الأول',
    learningUnit: 'وضعية تقويم من نفس عائلة وضعية الانطلاق',
    session1: 'اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، معالجة بيداغوجية محتملة',
    session2:
      `${MIDAN_2} — ${MAQTA_2_1} / وضعية الانطلاق — المورد الأول: أغذية النبات الأخضر — النشاط 1: أقترح بروتوكولا تجريبيا أو يحلل نتائج تجريبية`,
    isRemediation: true,
    lessonType: 'assessment',
  },
  {
    n: 9, week: 9, weekInMonth: 4, month: 'نوفمبر', percent: '28 %',
    midan: MIDAN_2, maqta: MAQTA_2_1,
    mawrid: 'المورد الأول: أغذية النبات الأخضر',
    learningUnit: 'تعلم مورد 1-1: الحاجيات الغذائية للنبات الأخضر',
    session1:
      'المورد الأول: أغذية النبات الأخضر — النشاط 2: استخرج العناصر الأساسية في محلول كنوب — استنتج عواقب الإفراط والتفريط في العناصر المعدنية للنبات الأخضر',
    session2: 'المورد الأول: أغذية النبات الأخضر — النشاط 3: أحدد مقر امتصاص المحلول المعدني',
    sourceSequenceId: 'seq_1am_2',
    sourceResourceId: 'res_1am_2_1',
    sourceLearningUnitId: 'lu_1am_2_1_1',
    sourceActivityId: 'act_1am_2_1_1_1',
    taqwim: 'مقر امتصاص المحلول المعدني',
  },
  {
    n: 10, week: 10, weekInMonth: 1, month: 'ديسمبر', percent: '32 %',
    mawrid: 'اختبارات الفصل الأول',
    session1: 'اختبارات الفصل الأول',
    session2: 'اختبارات الفصل الأول',
    isExam: true,
    lessonType: 'assessment',
  },
  {
    n: 11, week: 11, weekInMonth: 2, month: 'ديسمبر', percent: '36 %',
    midan: MIDAN_2, maqta: MAQTA_2_1,
    mawrid: 'المورد الثاني: التركيب الضوئي',
    learningUnit: 'تعلم مورد 1-2: المبادلات الغازية اليخضورية + مورد 2-1: التركيب الضوئي',
    session1:
      'المورد الأول: أغذية النبات الأخضر — النشاط 4: احلل نتائج تجريبية تظهر حدوث المبادلات الغازية اليخضورية عند النبات الأخضر',
    session2:
      'المورد الثاني: التركيب الضوئي — النشاط: أحوصّل شروط التركيب الضوئي — أبني مفهوم التركيب الضوئي',
    sourceSequenceId: 'seq_1am_2',
    sourceResourceId: 'res_1am_2_2',
    sourceLearningUnitId: 'lu_1am_2_2_1',
    sourceActivityId: 'act_1am_2_2_1_1',
    taqwim: 'بناء مفهوم التركيب الضوئي',
  },
  {
    n: 12, week: 12, weekInMonth: 3, month: 'ديسمبر', percent: '',
    mawrid: 'عطلة الشتاء',
    session1: 'عطلة الشتاء: من الخميس 17 ديسمبر 2026 مساء إلى الأحد 03 جانفي 2027 صباحا',
    session2: 'عطلة الشتاء',
    isHoliday: true, holidayLabel: 'عطلة الشتاء', lessonType: 'holiday',
  },
  {
    n: 13, week: 13, weekInMonth: 4, month: 'ديسمبر', percent: '',
    mawrid: 'عطلة الشتاء',
    session1: 'عطلة الشتاء (تابع): من الخميس 17 ديسمبر 2026 مساء إلى الأحد 03 جانفي 2027 صباحا',
    session2: 'عطلة الشتاء',
    isHoliday: true, holidayLabel: 'عطلة الشتاء', lessonType: 'holiday',
  },
  {
    n: 14, week: 14, weekInMonth: 1, month: 'جانفي', percent: '40 %',
    midan: MIDAN_2, maqta: MAQTA_2_1,
    mawrid: 'المورد الثالث: الاعتناء بالنبات الأخضر كمنتج للمادة العضوية',
    learningUnit: 'تعلم مورد 3-1: أهمية التحكم في شروط التركيب الضوئي',
    session1:
      'المورد الثالث: الاعتناء بالنبات الأخضر كمنتج للمادة العضوية — النشاط 1: أحلل نتائج تطبيقات فلاحية لا كثار الإنتاج النباتي بالتحكم في شروط التركيب الضوئي',
    session2: 'المورد الرابع: انتقال النسغ — النشاط 1: أحدّد مقر انتقال النسغ الخام في النبات الأخضر',
    sourceSequenceId: 'seq_1am_2',
    sourceResourceId: 'res_1am_2_3',
    sourceLearningUnitId: 'lu_1am_2_3_1',
    sourceActivityId: 'act_1am_2_3_1_1',
    taqwim: 'التحكم في شروط التركيب الضوئي',
  },
  {
    n: 15, week: 15, weekInMonth: 2, month: 'جانفي', percent: '44 %',
    midan: MIDAN_2, maqta: MAQTA_2_1,
    mawrid: 'المورد الرابع: انتقال النسغ',
    learningUnit: 'تعلم مورد 1-4 و2-4: انتقال النسغ وظاهرة النتح',
    session1: 'المورد الرابع: انتقال النسغ — النشاط 1 (تابع): أنمذج مسار النسغ في النبات الأخضر',
    session2:
      'المورد الرابع: انتقال النسغ — النشاط 2: أنجز تجربة أو يفسر نتائج تجريبية تبرز دور النتح في انتقال النسغ',
    sourceSequenceId: 'seq_1am_2',
    sourceResourceId: 'res_1am_2_4',
    sourceLearningUnitId: 'lu_1am_2_4_1',
    sourceActivityId: 'act_1am_2_4_1_1',
    taqwim: 'نمذجة مسار النسغ ودور النتح',
  },
  {
    n: 16, week: 16, weekInMonth: 3, month: 'جانفي', percent: '48 %',
    midan: MIDAN_2, maqta: MAQTA_2_1,
    mawrid: 'إدماج وتقويم المقطع',
    learningUnit: 'وضعية تعلم إدماج الموارد التي تم بناؤها',
    session1: 'وضعية تعلم إدماج الموارد التي تم بناؤها. حل وضعية الانطلاق',
    session2: 'اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، معالجة بيداغوجية محتملة',
    isRemediation: true,
    lessonType: 'assessment',
  },
  {
    n: 17, week: 17, weekInMonth: 4, month: 'جانفي', percent: '52 %',
    midan: MIDAN_1, maqta: `${MAQTA_1_2} / وضعية الانطلاق`,
    mawrid: 'المورد الأول: المبادلات الغازية التنفسية ومقرها',
    learningUnit: 'تعلم مورد 1-1: مقر المبادلات الغازية التنفسية عند الإنسان',
    session1:
      'المورد الأول: المبادلات الغازية التنفسية ومقرها — النشاط 1: أظهر المبادلات الغازية التنفسية عند الإنسان ومقرها',
    session2:
      'المورد الأول: المبادلات الغازية التنفسية ومقرها — النشاط 2: استخرج مميزات السنخ الرئوي التي تجعل منه سطح تبادل',
    sourceSequenceId: 'seq_1am_3',
    sourceResourceId: 'res_1am_3_1',
    sourceLearningUnitId: 'lu_1am_3_1_1',
    sourceActivityId: 'act_1am_3_1_1_1',
    sourceActivityId2: 'act_1am_3_1_1_2',
    taqwim: 'مميزات السنخ الرئوي كسطح تبادل',
  },
  {
    // ⚠️ خلية النسبة في الأصل الورقي مقطوعة عند حدّ الصفحة الأولى — لا تُقدَّر.
    n: 18, week: 18, weekInMonth: 1, month: 'فيفري', percent: '',
    midan: MIDAN_1, maqta: MAQTA_1_2,
    mawrid: 'المورد الثاني: تعريف التنفس',
    learningUnit: 'تعلم مورد 2-1: تعريف التنفس + مورد 3-1: القواعد الصحية للتنفس',
    session1:
      'المورد الثاني: تعريف التنفس — النشاط: أُفسّر زيادة استهلاك الغذاء والأكسجين عند زيادة نشاط العضوية لبناء المعنى البيولوجي للتنفس',
    session2:
      'المورد الثالث: القواعد الصحية للتنفس — النشاط: أناقش وضعيات مرتبطة باختلال وظيفة التنفس لإبراز أهمية التنفس الصحي',
    sourceSequenceId: 'seq_1am_3',
    sourceResourceId: 'res_1am_3_2',
    sourceLearningUnitId: 'lu_1am_3_2_1',
    sourceActivityId: 'act_1am_3_2_1_1',
    taqwim: 'البناء البيولوجي لمفهوم التنفس',
  },
  {
    n: 19, week: 19, weekInMonth: 2, month: 'فيفري', percent: '56 %',
    midan: MIDAN_2, maqta: `${MAQTA_2_2} / وضعية الانطلاق`,
    mawrid: 'المورد الأول: المبادلات الغازية التنفسية عند النبات الأخضر',
    learningUnit: 'تعلم مورد 1-1: المبادلات الغازية التنفسية عند النبات الأخضر',
    session1: 'وضعية الانطلاق، معالجة بيداغوجية محتملة',
    session2:
      'المقطع الثاني: التحصل على الطاقة عند النبات الأخضر / وضعية الانطلاق — المورد الأول: المبادلات الغازية التنفسية عند النبات الأخضر — النشاط الأول: أحدّد طبيعة المبادلات الغازية التنفسية عند النباتات الخضراء',
    sourceSequenceId: 'seq_1am_4',
    sourceResourceId: 'res_1am_4_1',
    sourceLearningUnitId: 'lu_1am_4_1_1',
    sourceActivityId: 'act_1am_4_1_1_1',
    taqwim: 'طبيعة المبادلات الغازية التنفسية عند النبات',
  },
  {
    n: 20, week: 20, weekInMonth: 3, month: 'فيفري', percent: '60 %',
    midan: MIDAN_2, maqta: MAQTA_2_2,
    mawrid: 'المورد الأول: المبادلات الغازية التنفسية عند النبات الأخضر',
    learningUnit: 'تعلم مورد 1-2: مقر المبادلات الغازية التنفسية عند النبات',
    session1:
      'المورد الأول: المبادلات الغازية التنفسية عند النبات الأخضر — النشاط الثاني: أظهر مقر المبادلات الغازية التنفسية عند النباتات الخضراء (فحص مجهريا بشرة عضو نباتي أو يستغل وثائق هادفة)',
    session2:
      'المورد الثاني: تعريف التنفس عند النبات كعملية للتحصل على الطاقة — النشاط: أضع علاقة سببية بين زيادة استهلاك الغذاء و O2 والنشاط الفيزيولوجي للنبات',
    sourceSequenceId: 'seq_1am_4',
    sourceResourceId: 'res_1am_4_1',
    sourceLearningUnitId: 'lu_1am_4_2_1',
    sourceActivityId: 'act_1am_4_2_1_1',
    taqwim: 'مقر المبادلات الغازية التنفسية عند النبات',
  },
  {
    n: 21, week: 21, weekInMonth: 4, month: 'فيفري', percent: '64 %',
    midan: MIDAN_2, maqta: MAQTA_2_2,
    mawrid: 'المورد الثالث: تعريف التخمر كنمط آخر للتحصل على الطاقة',
    learningUnit: 'المورد الثالث: التخمر',
    session1: 'المورد الثالث: تعريف التخمر كنمط آخر للتحصل على الطاقة — النشاط الأول: أعلل لجوء بعض الكائنات الحية إلى التخمر',
    session2:
      'المورد الثالث: تعريف التخمر كنمط آخر للتحصل على الطاقة — النشاط الثاني: أستخرج الفرق بين التخمر والتنفس. اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، معالجة بيداغوجية محتملة',
    sourceSequenceId: 'seq_1am_4',
    sourceResourceId: 'res_1am_4_3',
    sourceActivityId: 'act_1am_4_3_1_1',
    taqwim: 'الفرق بين التخمر والتنفس',
  },
  {
    n: 22, week: 22, weekInMonth: 1, month: 'مارس', percent: '68 %',
    mawrid: 'اختبارات الفصل الثاني',
    session1: 'اختبارات الفصل الثاني',
    session2: 'اختبارات الفصل الثاني',
    isExam: true,
    lessonType: 'assessment',
  },
  // ═══════════════════ الفصل الثالث ═══════════════════
  {
    n: 23, week: 23, weekInMonth: 2, month: 'مارس', percent: '72 %',
    midan: MIDAN_1, maqta: `${MAQTA_1_3} / وضعية الانطلاق`,
    mawrid: 'المورد الأول: الإطراح عند الإنسان',
    learningUnit: 'تعلم مورد 1-1: تعريف الإطراح ودوره في توازن الوسط الداخلي',
    session1:
      'المقطع الثالث: الإطراح وثبات توازن الوسط الداخلي عند الإنسان / وضعية الانطلاق — المورد الأول: الإطراح عند الإنسان — النشاط الأول: أقارن بين تركيب البول والدم والعرق لبناء مفهوم الإطراح',
    session2:
      'المورد الأول: الإطراح عند الإنسان — النشاط الثاني: أصف بنية الكلية وأحدد دورها في الإطراح، أصف بنية الجلد وأحدد دوره في الإطراح',
    sourceSequenceId: 'seq_1am_o5_',
    sourceResourceId: 'res_1am_o5_1',
    sourceLearningUnitId: 'lu_1am_o5_1_1',
    sourceActivityId: 'act_1am_o5_1_1_1',
    taqwim: 'مفهوم الإطراح وبنية الكلية والجلد',
  },
  {
    n: 24, week: 24, weekInMonth: 3, month: 'مارس', percent: '',
    mawrid: 'عطلة الربيع',
    session1: 'عطلة الربيع: من الخميس 18 مارس 2027 مساء إلى الأحد 04 أفريل 2027 صباحا',
    session2: 'عطلة الربيع',
    isHoliday: true, holidayLabel: 'عطلة الربيع', lessonType: 'holiday',
  },
  {
    n: 25, week: 25, weekInMonth: 4, month: 'مارس', percent: '',
    mawrid: 'عطلة الربيع',
    session1: 'عطلة الربيع (تابع): من الخميس 18 مارس 2027 مساء إلى الأحد 04 أفريل 2027 صباحا',
    session2: 'عطلة الربيع',
    isHoliday: true, holidayLabel: 'عطلة الربيع', lessonType: 'holiday',
  },
  {
    n: 26, week: 26, weekInMonth: 1, month: 'أفريل', percent: '76 %',
    midan: MIDAN_1, maqta: MAQTA_1_3,
    mawrid: 'المورد الثاني: القواعد الصحية للإطراح',
    learningUnit: 'تعلم مورد 2-1: القواعد الصحية للإطراح',
    session1: 'المورد الثاني: القواعد الصحية للإطراح — النشاط: أستخرج أهم القواعد الصحية للإطراح',
    session2: 'اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، معالجة بيداغوجية محتملة',
    sourceSequenceId: 'seq_1am_o5_',
    sourceResourceId: 'res_1am_o5_2',
    sourceLearningUnitId: 'lu_1am_o5_2_1',
    sourceActivityId: 'act_1am_o5_2_1_1',
    taqwim: 'القواعد الصحية للإطراح',
  },
  {
    n: 27, week: 27, weekInMonth: 2, month: 'أفريل', percent: '80 %',
    midan: MIDAN_1, maqta: `${MAQTA_1_4} / وضعية الانطلاق`,
    mawrid: 'المورد الأول: جهاز التكاثر عند الإنسان',
    learningUnit: 'تعلم مورد 1-1: البنية التشريحية للأجهزة التكاثرية عند الإنسان',
    session1:
      'المقطع الرابع: التكاثر عند الإنسان / وضعية الانطلاق — المورد الأول: جهاز التكاثر عند الإنسان — النشاط الأول: أميّز المجاري التناسلية والمناسل في الأجهزة التكاثرية عند الإنسان',
    session2:
      'المورد الأول: جهاز التكاثر عند الإنسان — النشاط الثاني: أبرز دور كل من المبيض والخصية في انتاج الخلايا التناسلية',
    sourceSequenceId: 'seq_1am_o6_',
    sourceResourceId: 'res_1am_o6_1',
    sourceLearningUnitId: 'lu_1am_o6_1_0',
    sourceActivityId: 'act_1am_o6_1_1_1',
    sourceActivityId2: 'act_1am_o6_1_1_2',
    taqwim: 'تمييز المجاري التناسلية من المناسل',
  },
  {
    n: 28, week: 28, weekInMonth: 3, month: 'أفريل', percent: '84 %',
    midan: MIDAN_1, maqta: MAQTA_1_4,
    mawrid: 'المورد الثاني: الإلقاح وشروطه',
    learningUnit: 'تعلم مورد 2-1: الإلقاح وشروطه + مورد 3-1: تبني سلوكات صحية سليمة',
    session1: 'المورد الثاني: الإلقاح وشروطه — النشاط: أستخرج مفهوما للإلقاح وأحدد شروطه',
    session2:
      'المورد الثالث: القواعد الصحية الجنسية عند الإنسان — النشاط: انجاز بحوث موجهة تخص الصحة الجنسية التي تضمن وظيفة التكاثر والحفاظ على النوع. اقتراح وضعية تقويم، معالجة بيداغوجية محتملة',
    sourceSequenceId: 'seq_1am_o6_',
    sourceResourceId: 'res_1am_o6_2',
    sourceLearningUnitId: 'lu_1am_o6_2_1',
    sourceActivityId: 'act_1am_o6_2_1_1',
    taqwim: 'مفهوم الإلقاح وشروطه',
  },
  {
    n: 29, week: 29, weekInMonth: 4, month: 'أفريل', percent: '88 %',
    midan: MIDAN_2, maqta: `${MAQTA_2_3} / وضعية الانطلاق`,
    mawrid: 'المورد الأول: الجهاز التكاثري عند النبات الزهري',
    learningUnit: 'تعلم مورد 1-1: البنية التشريحية للأجهزة التكاثرية عند النبات الزهري',
    session1:
      'المقطع الثالث: التكاثر عند النباتات ذات الأزهار / وضعية الانطلاق — المورد الأول: الجهاز التكاثري عند النبات الزهري — النشاط 1: اقارن بين زهرة ذكرية واخرى انثوية لإبراز الأعضاء الجنسية',
    session2: 'المورد الأول: الجهاز التكاثري عند النبات الزهري — النشاط 2: احدد دور كل من السداة والمدقة',
    sourceSequenceId: 'seq_1am_5',
    sourceResourceId: 'res_1am_5_1',
    sourceLearningUnitId: 'lu_1am_5_1_1',
    sourceActivityId: 'act_1am_5_1_1_1',
    sourceActivityId2: 'act_1am_5_1_2_1',
    taqwim: 'دور السداة والمدقة',
  },
  {
    n: 30, week: 30, weekInMonth: 1, month: 'ماي', percent: '92 %',
    midan: MIDAN_2, maqta: MAQTA_2_3,
    mawrid: 'المورد الثاني: الإلقاح وشروطه',
    learningUnit: 'تعلم مورد 2-1: الإلقاح وشروطه عند النباتات ذات الأزهار',
    session1:
      'المورد الثاني: الإلقاح وشروطه — النشاط: أستخرج مميزات التكاثر الجنسي عند النباتات ذات الأزهار، نمذجة دورة حياة نبات زهري',
    session2: 'اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، معالجة بيداغوجية محتملة',
    sourceSequenceId: 'seq_1am_5',
    sourceResourceId: 'res_1am_5_2',
    sourceLearningUnitId: 'lu_1am_5_2_1',
    sourceActivityId: 'act_1am_5_2_1_1',
    taqwim: 'نمذجة دورة حياة نبات زهري',
  },
  {
    n: 31, week: 31, weekInMonth: 2, month: 'ماي', percent: '96 %',
    midan: MIDAN_2, maqta: MAQTA_2_4,
    mawrid: 'المورد: تعريف الخلية كوحدة بنائية للكائنات الحية',
    learningUnit: 'تعلم مورد 1-1: الخلية',
    session1:
      'المقطع: الخلية / وضعية الانطلاق — المورد: تعريف الخلية كوحدة بنائية للكائنات الحية — النشاط 1: افحص مجهريا نسيجا حيوانيا واخر نباتيا',
    session2:
      'المورد: تعريف الخلية كوحدة بنائية للكائنات الحية — النشاط 2: استخرج المكونات الأساسية المشتركة للخلية من خلال الفحص المجهري. اقتراح وضعية تقويم، معالجة بيداغوجية محتملة',
    sourceSequenceId: 'seq_1am_6',
    sourceResourceId: 'res_1am_6_1',
    sourceLearningUnitId: 'lu_1am_6_1_1',
    sourceActivityId: 'act_1am_6_1_1_1',
    sourceActivityId2: 'act_1am_6_1_1_2',
    taqwim: 'مفهوم الخلية كوحدة بنائية',
  },
  {
    n: 32, week: 32, weekInMonth: 3, month: 'ماي', percent: '100 %',
    mawrid: 'اختبارات الفصل الثالث',
    session1: 'اختبارات الفصل الثالث',
    session2: 'اختبارات الفصل الثالث',
    isExam: true,
    lessonType: 'assessment',
  },
];

export const OFFICIAL_1AM_DISTRIBUTION: OfficialAnnualDistributionRow[] = RAW.map((r) => ({
  id: `1am-official-${r.n}`,
  week: r.week,
  weekInMonth: r.weekInMonth,
  month: r.month,
  dates: datesForMonthWeek(r.month, r.weekInMonth),
  midan: r.midan || '',
  maqta: r.maqta || '',
  mawrid: r.mawrid || '',
  learningUnit: r.learningUnit || r.mawrid || '',
  session1: r.session1,
  session2: r.session2,
  taqwim: r.taqwim,
  sourceSequenceId: r.sourceSequenceId,
  sourceResourceId: r.sourceResourceId,
  sourceLearningUnitId: r.sourceLearningUnitId,
  sourceActivityId: r.sourceActivityId,
  sourceActivityId2: r.sourceActivityId2,
  percent: r.percent,
  isExam: r.isExam,
  isHoliday: r.isHoliday,
  isIntroductory: r.isIntroductory,
  isRemediation: r.isRemediation,
  holidayLabel: r.holidayLabel,
  lessonType: r.lessonType || 'curriculum',
  sourceYear: '2026-2027',
  // الوثيقة تطبع (الشهر، رقم الأسبوع) لا تواريخ؛ نمنع محرّك التواريخ من الكتابة فوقها.
  referenceMonthlySchedule: true,
}));
