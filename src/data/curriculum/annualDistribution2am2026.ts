import type { OfficialAnnualDistributionRow } from './officialAnnualDistributionData';

// Transcribed from the two-page 2026–2027 schedule supplied by the teacher.
// The source gives weeks within each month, not date ranges for each row.
const MIDAN = 'الإنسان والمحيط';
const M1 = 'المقطع الأول: الوسط الحي';
const M2 = 'المقطع الثاني: توزع الكائنات الحية في أوساطها';
const M3 = 'المقطع الثالث: التكاثر وإعمار الأوساط';
const M4 = 'المقطع الرابع: تصنيف الكائنات الحية';
const M5 = 'المقطع الخامس: المستحاثات';
const R11 = 'المورد 1: خصائص الوسط الحي';
const R12 = 'المورد 2: العلاقات القائمة بين العناصر الحية في الوسط الحي';
const R13 = 'المورد 3: تأثير العوامل الفيزيوكيميائية على توزع الكائنات الحية ونشاطها';
const R14 = 'المورد 4: النظام البيئي وشروط توازنه';
const R15 = 'المورد 5: مكانة الإنسان في استقرار النظام البيئي';
const R21 = 'المورد 1: مظاهر تكيف النباتات مع أوساطها';
const R22 = 'المورد 2: تنفس الحيوانات واحتلال الأوساط';
const R23 = 'المورد 3: تأثير الإنسان على التوزع الطبيعي للحيوانات';
const R24 = 'المورد 4: العلاقة بين وسط حياة حيوان ونمط تنقله';
const R31 = 'المورد 1: أنماط التكاثر عند الحيوانات';
const R32 = 'المورد 2: أنماط التكاثر عند النباتات';
const R33 = 'المورد 3: تأثير الإنسان على إعمار الأوساط';
const R41 = 'المورد 1: مفهوم النوع عند الكائنات الحية';
const R42 = 'المورد 2: استخدام معايير التصنيف';
const R51 = 'المورد 1: مفهوم المستحاثة وشروط الاستحاثة';
const R52 = 'المورد 2: مكانة المستحاثات في تصور الأوساط القديمة';
const evaluation = 'اقتراح وضعية تقويم من نفس عائلة وضعية الانطلاق، حل وضعية الانطلاق، معالجة بيداغوجية محتملة';
const activity = (resource: string, text: string) => `${resource}\n${text}`;

type Input = Omit<OfficialAnnualDistributionRow, 'id' | 'week' | 'dates' | 'midan' | 'sourceYear' | 'referenceMonthlySchedule'>;
const rows: Input[] = [
  { month:'سبتمبر', weekInMonth:4, maqta:'', mawrid:'الافتتاح', session1:'استقبال التلاميذ، توجيهات، أسبوع الصحة المدرسية (الدرس الافتتاحي: تأثير الإضرار بالغابة على الصحة؛ ورشات حول النظافة الشخصية، الغذاء المتوازن، مخاطر مشروبات الطاقة على صحة الإنسان، الرياضة وتأثيرها على صحة التلميذ، الصحة النفسية والعقلية، التنمر، مخاطر الإدمان على المخدرات)، التقويم التشخيصي', session2:'', isIntroductory:true },
  { month:'أكتوبر', weekInMonth:1, percent:'3.2%', maqta:M1, mawrid:R11, session1:`وضعية الانطلاق الشاملة، ${M1} / وضعية الانطلاق\n${activity(R11, 'النشاط 1: أعاين وسطا حيا قريبا (1)')}`, session2:activity(R11,'النشاط 1: أعاين وسطا حيا قريبا (2)') },
  { month:'أكتوبر', weekInMonth:2, percent:'6.4%', maqta:M1, mawrid:`${R11} / ${R12}`, session1:activity(R11,'النشاط 2: أميز بين أوساط حية مختلفة'), session2:activity(R12,'النشاط 1: أحدد مختلف التفاعلات بين العناصر الحية في الأوساط الحية (1)') },
  { month:'أكتوبر', weekInMonth:3, percent:'9.7%', maqta:M1, mawrid:R12, session1:activity(R12,'النشاط 1: أحدد مختلف التفاعلات بين العناصر الحية في الأوساط الحية (2)'), session2:activity(R12,'النشاط 2: أبين تنظيم العلاقات الغذائية في أوساط حية (1)') },
  { month:'أكتوبر', weekInMonth:4, percent:'12.9%', maqta:M1, mawrid:R12, session1:activity(R12,'النشاط 2: أبين تنظيم العلاقات الغذائية في أوساط حية (2)'), session2:activity(R12,'النشاط 3: أحلل بنية مجتمع النحل وكيفية عمله') },
  { month:'نوفمبر', weekInMonth:1, percent:'16.1%', maqta:M1, mawrid:R13, session1:activity(R13,'النشاط 1: أميز العوامل المناخية المؤثرة على توزع الكائنات الحية ونشاطها'), session2:activity(R13,'النشاط 2: أبرز العلاقة بين تغير الإنارة والحرارة وتوزع الكائنات الحية (1)') },
  { month:'نوفمبر', weekInMonth:2, percent:'19.3%', maqta:M1, mawrid:R13, session1:activity(R13,'النشاط 2: أبرز العلاقة بين تغير الإنارة والحرارة وتوزع الكائنات الحية (2)'), session2:activity(R13,'النشاط 3: أظهر العلاقة بين توزع الكائنات الحية النباتية وخصائص التربة') },
  { month:'نوفمبر', weekInMonth:3, percent:'22.5%', maqta:M1, mawrid:`${R13} / ${R14}`, session1:activity(R13,'النشاط 4: أتعرف على أشكال مقاومة الكائنات الحية للتغيرات الموسمية'), session2:activity(R14,'النشاط 1: أعرف النظام البيئي') },
  { month:'نوفمبر', weekInMonth:4, percent:'25.8%', maqta:M1, mawrid:R14, session1:activity(R14,'النشاط 2: أحدد شروط توازن النظام البيئي'), session2:activity(R14,'النشاط 3: أميز بين الأنواع البيئية') },
  { month:'ديسمبر', weekInMonth:1, percent:'29%', maqta:'', mawrid:'اختبارات الفصل الأول', session1:'اختبارات الفصل الأول', session2:'اختبارات الفصل الأول', isExam:true },
  { month:'ديسمبر', weekInMonth:2, percent:'32.2%', maqta:M1, mawrid:R14, session1:'تصحيح الاختبار الأول', session2:activity(R14,'النشاط 4: أنجز وسطا بيئيا'), isExam:false },
  ...[3,4].map(weekInMonth => ({ month:'ديسمبر', weekInMonth, maqta:'', mawrid:'عطلة الشتاء', session1:'عطلة الشتاء', session2:'عطلة الشتاء', isHoliday:true, holidayLabel:'عطلة الشتاء: من الخميس 17 ديسمبر 2026 مساء إلى الأحد 03 جانفي 2027 صباحا' })),
  { month:'جانفي', weekInMonth:1, percent:'35.4%', maqta:M1, mawrid:R15, session1:activity(R15,'النشاط 1: أعاين بعض الآثار الهدامة لنشاطات الإنسان على الأنظمة البيئية (1)'), session2:activity(R15,'النشاط 1: أعاين بعض الآثار الهدامة لنشاطات الإنسان على الأنظمة البيئية (2)') },
  { month:'جانفي', weekInMonth:2, percent:'38.6%', maqta:M1, mawrid:R15, session1:activity(R15,'النشاط 2: أبين التدخل الإيجابي للإنسان للحفاظ على التوازن البيئي أو لاستعادته (1)'), session2:activity(R15,'النشاط 2: أبين التدخل الإيجابي للإنسان للحفاظ على التوازن البيئي أو لاستعادته (2)') },
  { month:'جانفي', weekInMonth:3, percent:'41.9%', maqta:`${M1} / ${M2}`, mawrid:R21, session1:evaluation, session2:`${M2} / وضعية الانطلاق\n${activity(R21,'النشاط 1: أظهر التحورات البنيوية تحت الترابية')}` },
  { month:'جانفي', weekInMonth:4, percent:'45%', maqta:M2, mawrid:`${R21} / ${R22}`, session1:activity(R21,'النشاط 2: أبين العلاقة بين التحورات البنيوية للمجموع الخضري وقدرة النباتات على مقاومة الجفاف'), session2:activity(R22,'النشاط 1: أظهر العلاقة بين أنماط التنفس عند الحيوانات وبين الأوساط التي تعيش فيها') },
  { month:'فيفري', weekInMonth:1, percent:'48.3%', maqta:M2, mawrid:R22, session1:activity(R22,'النشاط 1: أحدد الخصوصيات البنيوية لنمطين من أنماط التنفس (1)'), session2:activity(R22,'النشاط 1: أحدد الخصوصيات البنيوية لنمطين من أنماط التنفس (2)') },
  { month:'فيفري', weekInMonth:2, percent:'51.5%', maqta:M2, mawrid:R23, session1:activity(R23,'النشاط الأول: أحلل عواقب صب المياه القذرة في الوديان'), session2:activity(R23,'النشاط الثاني: أبرر الإجراءات المتخذة لضمان بقاء نوع حيواني (التونة الحمراء)') },
  { month:'فيفري', weekInMonth:3, percent:'54.7%', maqta:M2, mawrid:R24, session1:activity(R24,'النشاط 1: أبين العلاقة بين أنماط تنقل الحيوانات والأوساط التي تعيش فيها'), session2:activity(R24,'النشاط 2: أحلل بعض أنماط التنقل') },
  { month:'فيفري', weekInMonth:4, percent:'58%', maqta:`${M2} / ${M3}`, mawrid:R31, session1:evaluation, session2:`${M3} / وضعية الانطلاق\n${activity(R31,'النشاط 1: أعرف استراتيجيات التكاثر الجنسي عند الحيوانات')}` },
  { month:'مارس', weekInMonth:1, percent:'61.2%', maqta:'', mawrid:'اختبارات الفصل الثاني', session1:'اختبارات الفصل الثاني', session2:'اختبارات الفصل الثاني', isExam:true },
  { month:'مارس', weekInMonth:2, percent:'64.4%', maqta:M3, mawrid:R31, session1:'تصحيح الاختبار الثاني', session2:activity(R31,'النشاط 2: أميز تطور الجنين حسب نمط الإلقاح (1)'), isExam:false },
  ...[3,4].map(weekInMonth => ({ month:'مارس', weekInMonth, maqta:'', mawrid:'عطلة الربيع', session1:'عطلة الربيع', session2:'عطلة الربيع', isHoliday:true, holidayLabel:'عطلة الربيع: من الخميس 18 مارس 2027 مساء إلى الأحد 04 أفريل 2027 صباحا' })),
  { month:'أفريل', weekInMonth:1, percent:'67.6%', maqta:M3, mawrid:R31, session1:activity(R31,'النشاط 2: أميز تطور الجنين حسب نمط الإلقاح (2)'), session2:activity(R31,'النشاط 3: أضع علاقة بين استراتيجية التكاثر وأشكال غزو الحيوانات للأوساط') },
  { month:'أفريل', weekInMonth:2, percent:'70.8%', maqta:M3, mawrid:R32, session1:activity(R32,'النشاط 1: أحدد مميزات إعمار وغزو الأوساط من طرف النباتات بتدخل نواتج التكاثر'), session2:activity(R32,'النشاط 2: أظهر إمكانية إعمار الأوساط دون تدخل التكاثر الجنسي') },
  { month:'أفريل', weekInMonth:3, percent:'74%', maqta:M3, mawrid:R33, session1:activity(R33,'النشاط 1: أعلل ضرورة تنظيم فترات الصيد'), session2:activity(R33,'النشاط 2: أتعرف على بعض ممارسات الإنسان المرتبطة بتكاثر الحيوانات') },
  { month:'أفريل', weekInMonth:4, percent:'77.3%', maqta:M3, mawrid:R33, session1:activity(R33,'النشاط 3: أبرز ضرورة المحافظة على تنوع النباتات'), session2:evaluation },
  { month:'ماي', weekInMonth:1, percent:'80.5%', maqta:M4, mawrid:`${R41} / ${R42}`, session1:`${M4} / وضعية الانطلاق\n${activity(R41,'النشاط: أحدد شروط الانتماء إلى نفس النوع')}`, session2:activity(R42,'النشاط 1: أبرز بعض أسس التنظيم في مجموعات عند الحيوانات والنباتات') },
  { month:'ماي', weekInMonth:2, percent:'83.7%', maqta:M4, mawrid:R42, session1:activity(R42,'النشاط 2: أستعمل معايير التصنيف داخل مجموعات فرعية حيوانية ونباتية (1)'), session2:activity(R42,'النشاط 2: أستعمل معايير التصنيف داخل مجموعات فرعية حيوانية ونباتية (2)') },
  { month:'ماي', weekInMonth:3, percent:'86.9%', maqta:`${M4} / ${M5}`, mawrid:R51, session1:evaluation, session2:`${M5} / وضعية الانطلاق\n${activity(R51,'النشاط 1: أتعرف على المستحاثة')}` },
  { month:'ماي', weekInMonth:4, percent:'90.2%', maqta:M5, mawrid:`${R51} / ${R52}`, session1:activity(R51,'النشاط 2: أظهر شروط الاستحاثة'), session2:activity(R52,'النشاط 1: أبرز العلاقة بين المستحاثة ونوع الوسط قبل الاستحاثة') },
  { month:'جوان', weekInMonth:1, percent:'93.4%', maqta:M5, mawrid:R52, session1:activity(R52,'النشاط 2: أحافظ على بيئتي'), session2:evaluation },
  { month:'جوان', weekInMonth:2, percent:'96.6%', maqta:'', mawrid:'إدماج كلي', session1:'إدماج كلي / مناقشة وضعية الانطلاق الشاملة', session2:'إدماج كلي / مناقشة وضعية الانطلاق الشاملة' },
  { month:'جوان', weekInMonth:3, percent:'100%', maqta:'', mawrid:'اختبارات الفصل الثالث', session1:'اختبارات الفصل الثالث', session2:'اختبارات الفصل الثالث', isExam:true },
];

export const OFFICIAL_2AM_DISTRIBUTION: OfficialAnnualDistributionRow[] = rows.map((row, index) => ({
  ...row, id: `2am-reference-2026-${index + 1}`, week: index + 1,
  dates: '', midan: row.maqta ? MIDAN : '', sourceYear: '2026-2027', referenceMonthlySchedule: true,
  isExam: row.isExam ?? false, isHoliday: row.isHoliday ?? false,
}));
