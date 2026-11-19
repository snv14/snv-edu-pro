import type { OfficialAnnualDistributionRow } from './officialAnnualDistributionData';

// Transcribed from the official two-page annual distribution for 2026–2027 (1AM)
// (متوسطة حسناوي عبد القادر — السوقر، تيارت؛ الأستاذ جمال الدين أمين شعلال؛
//  موقَّعة من السيد المدير والسيد المفتش).
// The sheet prints weeks within each month; the ISO ranges below follow the
// Sunday→Thursday school week anchored on the two official holiday spans printed
// in the document (winter: Thu 2026-12-17 evening → Sun 2027-01-03 morning;
// spring: Thu 2027-03-18 evening → Sun 2027-04-04 morning).
const MIDAN_1 = 'الإنسان والصحة';
const MIDAN_2 = 'الإنسان والمحيط';

const M1_1 = 'المقطع الأول: التغذية عند الإنسان';
const M2_1 = 'المقطع الأول: التغذية عند النبات الأخضر';
const M1_2 = 'المقطع الثاني: التحصل على الطاقة عند الإنسان';
const M2_2 = 'المقطع الثاني: التحصل على الطاقة عند النبات الأخضر';
const M1_3 = 'المقطع الثالث: الإطراح وثبات توازن الوسط الداخلي عند الإنسان';
const M1_4 = 'المقطع الرابع: التكاثر الجنسي عند الإنسان';
const M2_3 = 'المقطع الثالث: التكاثر عند النباتات ذات الازهار';
const M_CELL = 'المقطع: الخلية';

const R_1_1_1 = 'المورد 1: مصدر الأغذية وتركيبها';
const R_1_1_2 = 'المورد الثاني: دور الأغذية في الجسم';
const R_1_1_3 = 'المورد الثالث: الرواتب الغذائية والتوازن الغذائي';

const R_2_1_1 = 'المورد الأول: أغذية النبات الأخضر';
const R_2_1_2 = 'المورد الثاني: التركيب الضوئي';
const R_2_1_3 = 'المورد الثالث: الاعتناء بالنبات الأخضر كمنتج للمادة العضوية';
const R_2_1_4 = 'المورد الرابع: انتقال النسغ';

const R_1_2_1 = 'المورد الأول: المبادلات الغازية التنفسية ومقرها';
const R_1_2_2 = 'المورد الثاني: تعريف التنفس';
const R_1_2_3 = 'المورد الثالث: القواعد الصحية للتنفس';

const R_2_2_1 = 'المورد الأول: المبادلات الغازية التنفسية عند النبات الأخضر';
const R_2_2_2 = 'المورد الثاني: تعريف التنفس عند النبات كعملية للتحصل على الطاقة';
const R_2_2_3 = 'المورد الثالث: تعريف التخمر كنمط آخر للتحصل على الطاقة';

const R_1_3_1 = 'المورد الأول: الإطراح عند الإنسان';
const R_1_3_2 = 'المورد الثاني: القواعد الصحية للإطراح عند الإنسان';

const R_1_4_1 = 'المورد الأول: جهاز التكاثر الجنسي عند الإنسان';
const R_1_4_2 = 'المورد الثاني: الإلقاح عند الإنسان';
const R_1_4_3 = 'المورد الثالث: القواعد الصحية الجنسية عند الإنسان';

const R_2_3_1 = 'المورد الأول: الجهاز التكاثري عند النبات الزهري';
const R_2_3_2 = 'المورد الثاني: الالقاح وشروطه';

const R_CELL_1 = 'المورد: تعريف الخلية كوحدة بنائية للكائنات الحية';

const EVAL_PARTIAL = 'اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، معالجة بيداغوجية محتملة';
const EVAL_FULL = 'اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، حل وضعية الانطلاق، معالجة بيداغوجية محتملة';
const activity = (resource: string, text: string) => `${resource}\n${text}`;

type Input = Omit<OfficialAnnualDistributionRow, 'id' | 'week' | 'dates' | 'sourceYear' | 'referenceMonthlySchedule'>;

const rows: Input[] = [
  {
    month: 'سبتمبر',
    weekInMonth: 4,
    midan: '',
    maqta: '',
    mawrid: 'الافتتاح',
    session1: 'استقبال التلاميذ، توجيهات، أسبوع الصحة المدرسية (الدرس الافتتاحي: تأثير الإضرار بالغابة على الصحة/ ورشات حول: النظافة الشخصية، الغذاء المتوازن، مخاطر مشروبات الطاقة على صحة الإنسان، الرياضة وتأثيرها على صحة التلميذ، الصحة النفسية والعقلية، التنمر، مخاطر الإدمان على المخدرات)',
    session2: 'معالجة بيداغوجية',
    isIntroductory: true,
    percent: '',
  },
  {
    month: 'أكتوبر',
    weekInMonth: 1,
    midan: '',
    maqta: '',
    mawrid: 'معالجة بيداغوجية',
    session1: 'معالجة بيداغوجية',
    session2: 'معالجة بيداغوجية',
    isRemediation: true,
    percent: '',
  },
  {
    month: 'أكتوبر',
    weekInMonth: 2,
    midan: MIDAN_1,
    maqta: M1_1,
    mawrid: R_1_1_1,
    session1: `وضعية الانطلاق الشاملة،\nالميدان الأول: ${MIDAN_1}\n${M1_1} / وضعية الانطلاق\n${activity(R_1_1_1, 'النشاط 1: اكشف تجريبيا عن مصدر الاغذية')}`,
    session2: activity(R_1_1_1, 'النشاط 2: اقارن تركيب بعض الأغذية (تحليل الحليب)'),
    percent: '4%',
  },
  {
    month: 'أكتوبر',
    weekInMonth: 3,
    midan: MIDAN_1,
    maqta: M1_1,
    mawrid: R_1_1_1,
    session1: activity(R_1_1_1, 'النشاط 2 (تابع): اقارن تركيب بعض الأغذية (تحليل أغذية أخرى)'),
    session2: activity(R_1_1_1, 'الحوصلة'),
    percent: '8%',
  },
  {
    month: 'أكتوبر',
    weekInMonth: 4,
    midan: MIDAN_1,
    maqta: M1_1,
    mawrid: R_1_1_2,
    session1: activity(R_1_1_2, 'النشاط 1: استخرج العلاقة بين اعراض بعض امراض سوء التغذية ومميزات الغذاء المستهلك'),
    session2: activity(R_1_1_2, 'النشاط 2: الخص دور الأغذية في العضوية'),
    percent: '12%',
  },
  {
    month: 'نوفمبر',
    weekInMonth: 1,
    midan: MIDAN_1,
    maqta: M1_1,
    mawrid: R_1_1_3,
    session1: activity(R_1_1_3, 'النشاط 1: احدد الحاجيات الغذائية للعضوية على أساس دورها'),
    session2: activity(R_1_1_3, 'النشاط 2: استنتج العوامل التي تتحكم في تغير الحاجيات الغذائية للإنسان'),
    percent: '16%',
  },
  {
    month: 'نوفمبر',
    weekInMonth: 2,
    midan: MIDAN_1,
    maqta: M1_1,
    mawrid: R_1_1_3,
    session1: activity(R_1_1_3, 'النشاط 3: احل وضعية ادماج تخص التوازن الغذائي'),
    session2: 'وضعية ادماج المقطع- حل وضعية الانطلاق',
    percent: '20%',
  },
  {
    month: 'نوفمبر',
    weekInMonth: 3,
    midan: `${MIDAN_1} / ${MIDAN_2}`,
    maqta: `${M1_1} / ${M2_1}`,
    mawrid: R_2_1_1,
    session1: EVAL_PARTIAL,
    session2: `الميدان الثاني: ${MIDAN_2}\n${M2_1} / وضعية الانطلاق\n${activity(R_2_1_1, 'النشاط 1: أقترح بروتوكولا تجريبيا او يحلل نتائج تجريبية')}`,
    percent: '24%',
  },
  {
    month: 'نوفمبر',
    weekInMonth: 4,
    midan: MIDAN_2,
    maqta: M2_1,
    mawrid: R_2_1_1,
    session1: activity(R_2_1_1, 'النشاط 2: استخرج العناصر الأساسية في محلول كنوب – استنتج عواقب الإفراط والتفريط في العناصر المعدنية للنبات الأخضر'),
    session2: activity(R_2_1_1, 'النشاط 3: أحدد مقر امتصاص المحلول المعدني'),
    percent: '28%',
  },
  {
    month: 'ديسمبر',
    weekInMonth: 1,
    midan: '',
    maqta: '',
    mawrid: 'اختبارات الفصل الأول',
    session1: 'اختبارات الفصل الأول',
    session2: 'اختبارات الفصل الأول',
    isExam: true,
    percent: '32%',
  },
  {
    month: 'ديسمبر',
    weekInMonth: 2,
    midan: MIDAN_2,
    maqta: M2_1,
    mawrid: `${R_2_1_1} / ${R_2_1_2}`,
    session1: activity(R_2_1_1, 'النشاط 4: احلل نتائج تجريبية تظهر حدوث المبادلات الغازية اليخضورية عند النبات الأخضر'),
    session2: activity(R_2_1_2, 'النشاط: أحوصل شروط التركيب الضوئي – أبني مفهوم التركيب الضوئي'),
    percent: '36%',
  },
  ...[3, 4].map((weekInMonth) => ({
    month: 'ديسمبر',
    weekInMonth,
    midan: '',
    maqta: '',
    mawrid: 'عطلة الشتاء',
    session1: 'عطلة الشتاء',
    session2: 'عطلة الشتاء',
    isHoliday: true,
    holidayLabel: 'عطلة الشتاء؛ من الخميس 17 ديسمبر 2026 مساء إلى الأحد 03 جانفي 2027 صباحا',
    percent: '',
  })),
  {
    month: 'جانفي',
    weekInMonth: 1,
    midan: MIDAN_2,
    maqta: M2_1,
    mawrid: `${R_2_1_3} / ${R_2_1_4}`,
    session1: activity(R_2_1_3, 'النشاط 1: أحلّل نتائج تطبيقات فلاحية لاكثار الإنتاج النباتي بالتحكم في شروط التركيب الضوئي'),
    session2: activity(R_2_1_4, 'النشاط 1: أحدّد مقر انتقال النسغ الخام في النبات الأخضر'),
    percent: '40%',
  },
  {
    month: 'جانفي',
    weekInMonth: 2,
    midan: MIDAN_2,
    maqta: M2_1,
    mawrid: R_2_1_4,
    session1: activity(R_2_1_4, 'النشاط 1 (تابع): أنمذج مسار النسغ في النبات الأخضر'),
    session2: activity(R_2_1_4, 'النشاط 2: أنجز تجربة او يفسر نتائج تجريبية تبرز دور النتح في انتقال النسغ'),
    percent: '44%',
  },
  {
    month: 'جانفي',
    weekInMonth: 3,
    midan: MIDAN_2,
    maqta: M2_1,
    mawrid: 'إدماج الموارد / تقويم ومعالجة',
    session1: 'وضعية تعلّم إدماج الموارد التي تم بناؤها.\nحل وضعية الانطلاق',
    session2: EVAL_PARTIAL,
    percent: '48%',
  },
  {
    month: 'جانفي',
    weekInMonth: 4,
    midan: MIDAN_1,
    maqta: M1_2,
    mawrid: R_1_2_1,
    session1: `الميدان الأول: ${MIDAN_1}\n${M1_2} / وضعية الانطلاق\n${activity(R_1_2_1, 'النشاط 1: أظهر المبادلات الغازية التنفسية عند الانسان ومقرها')}`,
    session2: activity(R_1_2_1, 'النشاط 2: استخرج مميزات السنخ الرئوي التي تجعل منه سطح تبادل'),
    percent: '52%',
  },
  {
    month: 'فيفري',
    weekInMonth: 1,
    midan: MIDAN_1,
    maqta: M1_2,
    mawrid: `${R_1_2_2} / ${R_1_2_3}`,
    session1: activity(R_1_2_2, 'النشاط: أفسّر زيادة استهلاك الغذاء والأكسجين عند زيادة نشاط العضوية لبناء المعنى البيولوجي للتنفس'),
    session2: activity(R_1_2_3, 'النشاط: أناقش وضعيات مرتبطة باختلال وظيفة التنفس لإبراز أهمية التنفس الصحي'),
    percent: '',
  },
  {
    month: 'فيفري',
    weekInMonth: 2,
    midan: `${MIDAN_1} / ${MIDAN_2}`,
    maqta: `${M1_2} / ${M2_2}`,
    mawrid: R_2_2_1,
    session1: EVAL_FULL,
    session2: `الميدان الثاني: ${MIDAN_2}\n${M2_2} / وضعية الانطلاق\n${activity(R_2_2_1, 'النشاط الأول: أحدّد طبيعة المبادلات الغازية التنفسية عند النباتات الخضراء')}`,
    percent: '56%',
  },
  {
    month: 'فيفري',
    weekInMonth: 3,
    midan: MIDAN_2,
    maqta: M2_2,
    mawrid: `${R_2_2_1} / ${R_2_2_2}`,
    session1: activity(R_2_2_1, 'النشاط الثاني: أظهر مقر المبادلات الغازية التنفسية عند النباتات الخضراء (فحص مجهريا بشرة عضو نباتي أو يستغل وثائق هادفة)'),
    session2: activity(R_2_2_2, 'النشاط: أضع علاقة سببية بين زيادة استهلاك الغذاء وO2 والنشاط الفيزيولوجي للنبات'),
    percent: '60%',
  },
  {
    month: 'فيفري',
    weekInMonth: 4,
    midan: MIDAN_2,
    maqta: M2_2,
    mawrid: R_2_2_3,
    session1: activity(R_2_2_3, 'النشاط الأول: أعلل لجوء بعض الكائنات الحية إلى التخمر'),
    session2: `${activity(R_2_2_3, 'النشاط الثاني: أستخرج الفرق بين التخمر والتنفس')}\n${EVAL_PARTIAL}`,
    percent: '64%',
  },
  {
    month: 'مارس',
    weekInMonth: 1,
    midan: '',
    maqta: '',
    mawrid: 'اختبارات الفصل الثاني',
    session1: 'اختبارات الفصل الثاني',
    session2: 'اختبارات الفصل الثاني',
    isExam: true,
    percent: '68%',
  },
  {
    month: 'مارس',
    weekInMonth: 2,
    midan: MIDAN_1,
    maqta: M1_3,
    mawrid: R_1_3_1,
    session1: `الميدان الأول: ${MIDAN_1}\n${M1_3} / وضعية الانطلاق\n${activity(R_1_3_1, 'النشاط الأول: أقارن بين تركيب البول والدم والعرق لبناء مفهوم الإطراح')}`,
    session2: activity(R_1_3_1, 'النشاط الثاني: أصف بنية الكلية وأحدّد دورها في الإطراح،\nأصف بنية الجلد وأحدّد دوره في الإطراح'),
    percent: '72%',
  },
  ...[3, 4].map((weekInMonth) => ({
    month: 'مارس',
    weekInMonth,
    midan: '',
    maqta: '',
    mawrid: 'عطلة الربيع',
    session1: 'عطلة الربيع',
    session2: 'عطلة الربيع',
    isHoliday: true,
    holidayLabel: 'عطلة الربيع: من الخميس 18 مارس 2027 مساء إلى الأحد 04 أفريل 2027 صباحا',
    percent: '',
  })),
  {
    month: 'أفريل',
    weekInMonth: 1,
    midan: MIDAN_1,
    maqta: M1_3,
    mawrid: R_1_3_2,
    session1: activity(R_1_3_2, 'النشاط: أستخرج أهم القواعد الصحية للإطراح'),
    session2: EVAL_FULL,
    percent: '76%',
  },
  {
    month: 'أفريل',
    weekInMonth: 2,
    midan: MIDAN_1,
    maqta: M1_4,
    mawrid: R_1_4_1,
    session1: `الميدان الأول: ${MIDAN_1}\n${M1_4} / وضعية الانطلاق\n${activity(R_1_4_1, 'النشاط الأول: أميّز المجاري التناسلية والمناسل في الأجهزة التكاثرية عند الإنسان')}`,
    session2: activity(R_1_4_1, 'النشاط الثاني: أبرز دور كل من المبيض والخصية في إنتاج الخلايا التناسلية'),
    percent: '80%',
  },
  {
    month: 'أفريل',
    weekInMonth: 3,
    midan: MIDAN_1,
    maqta: M1_4,
    mawrid: `${R_1_4_2} / ${R_1_4_3}`,
    session1: activity(R_1_4_2, 'النشاط: أستخرج مفهوما للإلقاح وأحدّد شروطه'),
    session2: `${activity(R_1_4_3, 'النشاط: انجاز بحوث موجهة تخص الصحة الجنسية التي تضمن وظيفة التكاثر والحفاظ على النوع')}\n${EVAL_FULL}`,
    percent: '84%',
  },
  {
    month: 'أفريل',
    weekInMonth: 4,
    midan: MIDAN_2,
    maqta: M2_3,
    mawrid: R_2_3_1,
    session1: `الميدان الثاني: ${MIDAN_2}\n${M2_3} / وضعية الانطلاق\n${activity(R_2_3_1, 'النشاط 1: اقارن بين زهرة ذكرية واخرى انثوية لإبراز الأعضاء الجنسية')}`,
    session2: activity(R_2_3_1, 'النشاط 2: احدد دور كل من السداة والمدقة'),
    percent: '88%',
  },
  {
    month: 'ماي',
    weekInMonth: 1,
    midan: MIDAN_2,
    maqta: M2_3,
    mawrid: R_2_3_2,
    session1: `${activity(R_2_3_2, 'النشاط: أستخرج مميزات التكاثر الجنسي عند النباتات ذات الازهار')}\nنمذجة دورة حياة نبات زهري`,
    session2: EVAL_FULL,
    percent: '92%',
  },
  {
    month: 'ماي',
    weekInMonth: 2,
    midan: MIDAN_2,
    maqta: M_CELL,
    mawrid: R_CELL_1,
    session1: `${M_CELL}\nاقتراح وضعية انطلاق لمقطع الخلية\n${activity(R_CELL_1, 'النشاط 1: افحص مجهريا نسيجا حيوانيا واخر نباتيا')}`,
    session2: `${activity(R_CELL_1, 'النشاط 2: استخرج المكونات الأساسية المشتركة للخلية من خلال الفحص المجهري')}\n${EVAL_FULL}`,
    percent: '96%',
  },
  {
    month: 'ماي',
    weekInMonth: 3,
    midan: '',
    maqta: '',
    mawrid: 'اختبارات الفصل الثالث',
    session1: 'اختبارات الفصل الثالث',
    session2: 'اختبارات الفصل الثالث',
    isExam: true,
    percent: '100%',
  },
];

// ── الترتيب الزمني: أيام الأحد البداية لكل أسبوع مطبوع في الورقة الرسمية ──
const WEEK_SUNDAYS: Record<string, string> = {
  'سبتمبر/4': '2026-09-27',
  'أكتوبر/1': '2026-10-04', 'أكتوبر/2': '2026-10-11', 'أكتوبر/3': '2026-10-18', 'أكتوبر/4': '2026-10-25',
  'نوفمبر/1': '2026-11-08', 'نوفمبر/2': '2026-11-15', 'نوفمبر/3': '2026-11-22', 'نوفمبر/4': '2026-11-29',
  'ديسمبر/1': '2026-12-06', 'ديسمبر/2': '2026-12-13', 'ديسمبر/3': '2026-12-20', 'ديسمبر/4': '2026-12-27',
  'جانفي/1': '2027-01-03', 'جانفي/2': '2027-01-10', 'جانفي/3': '2027-01-17', 'جانفي/4': '2027-01-24',
  'فيفري/1': '2027-01-31', 'فيفري/2': '2027-02-07', 'فيفري/3': '2027-02-14', 'فيفري/4': '2027-02-21',
  'مارس/1': '2027-02-28', 'مارس/2': '2027-03-07', 'مارس/3': '2027-03-14', 'مارس/4': '2027-03-21',
  'أفريل/1': '2027-04-04', 'أفريل/2': '2027-04-11', 'أفريل/3': '2027-04-18', 'أفريل/4': '2027-04-25',
  'ماي/1': '2027-05-02', 'ماي/2': '2027-05-09', 'ماي/3': '2027-05-16',
};

const plusDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const weekRange = (month: string, weekInMonth: number | undefined): string => {
  const sunday = weekInMonth ? WEEK_SUNDAYS[`${month}/${weekInMonth}`] : undefined;
  return sunday ? `${sunday} → ${plusDays(sunday, 4)}` : '';
};

export const OFFICIAL_1AM_DISTRIBUTION: OfficialAnnualDistributionRow[] = rows.map((row, index) => ({
  ...row,
  id: `1am-reference-2026-${index + 1}`,
  week: index + 1,
  dates: weekRange(row.month, row.weekInMonth),
  sourceYear: '2026-2027',
  referenceMonthlySchedule: true,
  isExam: row.isExam ?? false,
  isHoliday: row.isHoliday ?? false,
}));
