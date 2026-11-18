import type { ArchivedMediaItem } from '../memos/archiveSchema';

const m = (
  id: string,
  title: string,
  mediaType: ArchivedMediaItem['mediaType'],
  file: string,
  sourcePage: number,
  description: string,
  links: {
    memoNumber?: string;
    relatedLessonId?: string;
    relatedActivityId?: string;
    relatedExperimentId?: string;
    relatedWorksheetId?: string;
    tags?: string[];
  } = {}
): ArchivedMediaItem => ({
  id,
  level: '1am',
  title,
  mediaType,
  imageUrl: `/assets/1am_archive/${file}`,
  description,
  sourcePage,
  memoNumber: links.memoNumber,
  relatedLessonId: links.relatedLessonId,
  relatedActivityId: links.relatedActivityId,
  relatedExperimentId: links.relatedExperimentId,
  relatedWorksheetId: links.relatedWorksheetId,
  canReuseInMemos: true,
  tags: links.tags || [],
});

/**
 * مكتبة الوسائط العلمية المستخرجة حرفياً من ملف: «مذكرات السنة الأولى متوسط كاملة.pdf» (98 صفحة)
 * تحتوي على جميع الصور والوثائق والتركيبات التجريبية والمخططات والرسومات وأدوات المختبر الأصلية
 * بدون استبدالها أو اختصارها (مع استبعاد الإطارات الفارغة والأختام المتكررة < 1KB).
 */
export const ARCHIVE_1AM_MEDIA: ArchivedMediaItem[] = [
  // ─── المقطع 01: التغذية عند الإنسان (ص 1–17) ────────────────────────────
  m('med_1am_p01_01', 'غلاف المقطع 01: التغذية عند الإنسان (أيقونة غذائية 1)', 'صورة', 'p01_fig01_1b2c0e15dc87.png', 1, 'عنصر بصري من غلاف المقطع الأول: التغذية عند الإنسان.', { tags: ['غلاف', 'التغذية عند الإنسان'] }),
  m('med_1am_p01_02', 'غلاف المقطع 01: التغذية عند الإنسان (أيقونة غذائية 2)', 'صورة', 'p01_fig02_e3b5088a6bdc.png', 1, 'عنصر بصري من غلاف المقطع الأول.', { tags: ['غلاف'] }),
  m('med_1am_p01_04', 'صورة توضيحية لمصادر الأغذية المتنوعة (غلاف المقطع 01)', 'صورة', 'p01_fig04_60130972150f.jpg', 1, 'صورة أصلية لأغذية متنوعة من صفحة عنوان التغذية عند الإنسان.', { tags: ['غلاف', 'أغذية'] }),
  m('med_1am_p01_05', 'صورة توضيحية إضافية لغلاف التغذية عند الإنسان', 'صورة', 'p01_fig05_633ccf4c0f66.jpg', 1, 'صورة غذائية مرفقة بصفحة المقطع الأول.', { tags: ['غلاف', 'أغذية'] }),

  m('med_1am_p03_01', 'تجربة تسخين قطعة خبز (الكشف عن الأصل العضوي)', 'تجربة', 'p03_fig01_2b28ea2e208f.jpg', 3, 'تفحم قطعة الخبز عند التسخين دلالة على احتوائها على الكربون (أصل عضوي).', { memoNumber: '01', relatedLessonId: 'lu_1am_1_1_1', relatedActivityId: 'act_1am_1_1_1_2', relatedExperimentId: 'exp_1am_01_bread', tags: ['خبز', 'تفحم', 'أصل عضوي'] }),
  m('med_1am_p03_02', 'تجربة تسخين السكر الأبيض (أصل عضوي)', 'تجربة', 'p03_fig02_fccb9addead6.jpg', 3, 'انصهار وتفحم السكر الأبيض عند تعريضه لموقد حراري.', { memoNumber: '01', relatedLessonId: 'lu_1am_1_1_1', relatedActivityId: 'act_1am_1_1_1_2', relatedExperimentId: 'exp_1am_01_sugar', tags: ['سكر', 'تفحم', 'أصل عضوي'] }),
  m('med_1am_p03_03', 'تجربة تسخين الملح (أصل معدني)', 'تجربة', 'p03_fig03_5f84d4c8f83b.jpg', 3, 'عدم تفحم ملح الطعام عند التسخين دليل على أصله المعدني.', { memoNumber: '01', relatedLessonId: 'lu_1am_1_1_1', relatedActivityId: 'act_1am_1_1_1_2', relatedExperimentId: 'exp_1am_01_salt', tags: ['ملح', 'أصل معدني'] }),
  m('med_1am_p03_04', 'تجربة تسخين الماء (أصل معدني)', 'تجربة', 'p03_fig04_4aff29c62e12.jpg', 3, 'تبخر الماء وعدم تفحمه عند التسخين (أصل معدني).', { memoNumber: '01', relatedLessonId: 'lu_1am_1_1_1', relatedActivityId: 'act_1am_1_1_1_2', relatedExperimentId: 'exp_1am_01_water', tags: ['ماء', 'أصل معدني'] }),

  m('med_1am_p05_01', 'تجربة فصل مكونات الحليب والكشف عن السكر والبروتين والدسم', 'تجربة', 'p05_fig01_ef49890ee47c.jpg', 5, 'فصل الحليب إلى مصل وقشدة والكشف بالكواشف النوعية.', { memoNumber: '02', relatedLessonId: 'lu_1am_1_1_2', relatedActivityId: 'act_1am_1_1_2_1', relatedExperimentId: 'exp_1am_02_milk_org', tags: ['الحليب', 'فهلينغ', 'حمض الآزوت'] }),
  m('med_1am_p07_01', 'رسم توضيحي لمكونات الحليب وتصنيف الأغذية', 'وثيقة', 'p07_fig01_c2c3e191579f.jpg', 7, 'وثيقة مرفقة بمذكرة تركيب الأغذية.', { memoNumber: '02', relatedLessonId: 'lu_1am_1_1_2', relatedActivityId: 'act_1am_1_1_2_3', tags: ['تركيب الأغذية'] }),
  m('med_1am_p07_02', 'تجربة الكشف عن أملاح الكلورور بنترات الفضة', 'تجربة', 'p07_fig02_2739d4ef1342.jpg', 7, 'أنبوبان مع نترات الفضة: أ صافي، ب راسب أبيض للكلورور.', { memoNumber: '02', relatedLessonId: 'lu_1am_1_1_2', relatedActivityId: 'act_1am_1_1_2_1', relatedExperimentId: 'exp_1am_02_milk_min', tags: ['نترات الفضة', 'الكلورور'] }),
  m('med_1am_p07_03', 'تجربة الكشف عن النشاء بماء اليود (EAU IODEE)', 'تجربة', 'p07_fig03_3d192a363d7c.jpg', 7, 'تلوّن الخبز والبطاطا بالأزرق البنفسجي بوجود ماء اليود.', { memoNumber: '02', relatedLessonId: 'lu_1am_1_1_2', relatedActivityId: 'act_1am_1_1_2_2', relatedExperimentId: 'exp_1am_03_starch', tags: ['ماء اليود', 'النشاء'] }),
  m('med_1am_p09_ws', 'ورقة عمل التلميذ: جدول خطوات وملاحظات تحليل الحليب (ص 9)', 'وثيقة', 'p09_worksheet_page.png', 9, 'نموذج ورقة العمل الموجهة للتلاميذ في نشاط تحليل الحليب (6 تجارب).', { memoNumber: '02', relatedLessonId: 'lu_1am_1_1_2', relatedActivityId: 'act_1am_1_1_2_1', relatedWorksheetId: 'ws_1am_p09', tags: ['ورقة عمل', 'تحليل الحليب'] }),

  m('med_1am_p12_01', 'صورة الكتاكيت في مختلف مراحل النمو (دور البروتينات)', 'صورة', 'p12_fig01_e33359bc1c2e.jpg', 12, 'صورة توضيحية مرافقة لنشاط الحاجيات الغذائية للكتاكيت حسب العمر.', { memoNumber: '03', relatedLessonId: 'lu_1am_1_2_1', relatedActivityId: 'act_1am_1_2_1_2', tags: ['نمو', 'بروتينات'] }),
  m('med_1am_p14_01', 'رسم توضيحي للوجبات اليومية: الصباح، الغداء، العشاء', 'رسم', 'p14_fig01_ad3ec5ca113f.jpg', 14, 'وثيقة تنظيم الوجبات اليومية في الراتب الغذائي.', { memoNumber: '04', relatedLessonId: 'lu_1am_1_3_1', relatedActivityId: 'act_1am_1_3_1_1', tags: ['الراتب الغذائي', 'وجبات'] }),

  m('med_1am_p16_01', 'صورة مرافقة لجدول أمراض سوء التغذية (السلعة الدرقية)', 'صورة', 'p16_fig01_0bfb87a44017.jpg', 16, 'صورة توضيحية لتضخم الغدة الدرقية بسبب نقص اليود.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedActivityId: 'act_1am_1_3_2_1', tags: ['السلعة الدرقية', 'اليود'] }),
  m('med_1am_p16_02', 'صورة مرافقة لمرض الأسقربوط (نزيف اللثة)', 'صورة', 'p16_fig02_606b0d3afc5f.jpg', 16, 'صورة توضيحية لأعراض نقص فيتامين C.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedActivityId: 'act_1am_1_3_2_1', tags: ['الأسقربوط', 'فيتامين C'] }),
  m('med_1am_p16_03', 'صورة مرافقة لمرض الكواشيوركور', 'صورة', 'p16_fig03_2c0f13c06d21.jpg', 16, 'أعراض نقص البروتين الحيواني (انتفاخ البطن).', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedActivityId: 'act_1am_1_3_2_1', tags: ['الكواشيوركور'] }),
  m('med_1am_p16_04', 'صورة مرافقة لمرض الكساح وتقوس العظام', 'صورة', 'p16_fig04_aba1a507829d.jpg', 16, 'تأثير نقص فيتامين D على صلابة العظام.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedActivityId: 'act_1am_1_3_2_1', tags: ['الكساح', 'فيتامين D'] }),
  m('med_1am_p17_01', 'وثيقة مطبوعة التوازن الغذائي — السلعة الدرقية', 'وثيقة', 'p17_fig01_fb1444a1e1fc.jpg', 17, 'بطاقة مطبوعة التلميذ لمرض السلعة الدرقية.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedWorksheetId: 'ws_1am_p17', tags: ['مطبوعة', 'سوء التغذية'] }),
  m('med_1am_p17_02', 'وثيقة مطبوعة التوازن الغذائي — داء الأسقربوط', 'وثيقة', 'p17_fig02_73252634beb0.jpg', 17, 'بطاقة مطبوعة التلميذ لداء الأسقربوط.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedWorksheetId: 'ws_1am_p17', tags: ['مطبوعة', 'الأسقربوط'] }),
  m('med_1am_p17_03', 'وثيقة مطبوعة التوازن الغذائي — الكواشيوركور', 'وثيقة', 'p17_fig03_31e04bf1c9dc.jpg', 17, 'بطاقة مطبوعة التلميذ لمرض الكواشيوركور.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedWorksheetId: 'ws_1am_p17', tags: ['مطبوعة', 'الكواشيوركور'] }),
  m('med_1am_p17_04', 'وثيقة مطبوعة التوازن الغذائي — الكساح', 'وثيقة', 'p17_fig04_1c4217750a72.jpg', 17, 'بطاقة مطبوعة التلميذ لمرض الكساح.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedWorksheetId: 'ws_1am_p17', tags: ['مطبوعة', 'الكساح'] }),
  m('med_1am_p17_05', 'وثيقة مطبوعة التوازن الغذائي — السمنة', 'وثيقة', 'p17_fig05_828a61b5f2b5.jpg', 17, 'بطاقة مطبوعة التلميذ لمرض السمنة.', { memoNumber: '05', relatedLessonId: 'lu_1am_1_3_2', relatedWorksheetId: 'ws_1am_p17', tags: ['مطبوعة', 'السمنة'] }),

  // ─── المقطع 02: التغذية عند النبات الأخضر (ص 18–35) ──────────────────────
  m('med_1am_p18_02', 'غلاف المقطع: التغذية عند النبات الأخضر (عنصر زخرفي 1)', 'صورة', 'p18_fig02_64ba72894dca.png', 18, 'من صفحة عنوان التغذية عند النبات الأخضر.', { tags: ['غلاف'] }),
  m('med_1am_p18_03', 'غلاف المقطع: التغذية عند النبات الأخضر (عنصر زخرفي 2)', 'صورة', 'p18_fig03_f0068908e451.png', 18, 'من صفحة عنوان التغذية عند النبات الأخضر.', { tags: ['غلاف'] }),
  m('med_1am_p18_04', 'صورة نبات أخضر في غلاف المقطع التعلمي', 'صورة', 'p18_fig04_33899ad3cf37.jpg', 18, 'نبات أخضر من صفحة فاصل المقطع 02.', { tags: ['غلاف', 'نبات أخضر'] }),

  m('med_1am_p20_01', 'وثيقة 1: جدول تركيب محلول كنوب المعدني', 'وثيقة', 'p20_fig01_6cd771252009.jpg', 20, 'مكونات محلول كنوب بالغرام في اللتر من الماء المقطر.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedActivityId: 'act_1am_2_1_1_2', tags: ['محلول كنوب', 'NPK'] }),
  m('med_1am_p21_01', 'وثيقة 2: تجارب سقي نباتات القمح بمحاليل كنوب المختلفة', 'تجربة', 'p21_fig01_1eef5607ff23.png', 21, 'مقارنة نمو القمح في: NPK كامل، -N، -P، -K، وتركيز 20%.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedActivityId: 'act_1am_2_1_1_2', relatedExperimentId: 'exp_1am_04_knop', tags: ['محلول كنوب', 'القمح'] }),
  m('med_1am_p21_02', 'رسم توضيحي لنبات القمح في الوسط الشاهد (محلول كامل)', 'تجربة', 'p21_fig02_423848716e3a.png', 21, 'نمو جيد للنبات الأخضر عند توفر كل الشروط.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedActivityId: 'act_1am_2_1_1_1', tags: ['نمو النبات'] }),
  m('med_1am_p21_03', 'وثيقة تكميلية لمحلول كنوب 3', 'صورة', 'p21_fig03_accc142653bc.jpg', 21, 'رسم مرافق لنشاط العناصر المعدنية.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', tags: ['نبات'] }),
  m('med_1am_p21_04', 'وثيقة تكميلية لمحلول كنوب 4', 'صورة', 'p21_fig04_90b6a44d3836.jpg', 21, 'رسم مرافق لنشاط العناصر المعدنية.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', tags: ['نبات'] }),
  m('med_1am_p22_01', 'تجربة 1 (مطبوعة ص 22): غياب الماء', 'تجربة', 'p22_fig01_4253cc07d667.png', 22, 'ورقة عمل شروط نمو النبات الأخضر — التجربة 1.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedWorksheetId: 'ws_1am_p22', relatedExperimentId: 'exp_1am_04_conditions', tags: ['ورقة عمل', 'ماء'] }),
  m('med_1am_p22_02', 'تجربة 2 (مطبوعة ص 22): ماء مقطر', 'تجربة', 'p22_fig02_f946d50ea558.jpg', 22, 'ورقة عمل شروط نمو النبات الأخضر — التجربة 2.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedWorksheetId: 'ws_1am_p22', tags: ['ورقة عمل', 'ماء مقطر'] }),
  m('med_1am_p22_03', 'تجربة 3 (مطبوعة ص 22): ناقوس ورائق الكلس', 'تجربة', 'p22_fig03_e84b994095ef.jpg', 22, 'ورقة عمل شروط نمو النبات الأخضر — التجربة 3.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedWorksheetId: 'ws_1am_p22', tags: ['ورقة عمل', 'CO2'] }),
  m('med_1am_p22_04', 'تجربة 4 (مطبوعة ص 22): غياب الضوء', 'تجربة', 'p22_fig04_217350075ca6.jpg', 22, 'ورقة عمل شروط نمو النبات الأخضر — التجربة 4.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedWorksheetId: 'ws_1am_p22', tags: ['ورقة عمل', 'الضوء'] }),
  m('med_1am_p22_05', 'تجربة 5 (مطبوعة ص 22): كل الشروط متوفرة', 'تجربة', 'p22_fig05_0492ea3995c4.jpg', 22, 'ورقة عمل شروط نمو النبات الأخضر — التجربة 5.', { memoNumber: '06', relatedLessonId: 'lu_1am_2_1_1', relatedWorksheetId: 'ws_1am_p22', tags: ['ورقة عمل', 'نمو جيد'] }),

  m('med_1am_p23_02', 'وثيقة 1: تجربة نقصان الماء في الأنبوب بعد 48 ساعة', 'تجربة', 'p23_fig02_3803ccb75bb2.jpg', 23, 'نبات جذوره في الماء بعد 48 ساعة لإثبات الامتصاص الجذري.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_1', relatedExperimentId: 'exp_1am_05_root_abs', tags: ['الامتصاص', 'الجذر'] }),
  m('med_1am_p23_03', 'وثيقة 2: بنية الجذر ومناطقه الأربع والأوبار الماصة', 'رسم', 'p23_fig03_9c9a05d9f216.jpg', 23, 'رسم مناطق الجذر: المنطقة الفلينية، المنطقة الوبرية، منطقة النمو، القلنسوة.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_1', tags: ['مناطق الجذر', 'وبرة ماصة'] }),
  m('med_1am_p24_01', 'تجارب تحديد مقر الامتصاص الجذري (أنابيب الماء والزيت 1–3)', 'تجربة', 'p24_fig01_bd9f91f2d5e3.png', 24, 'إثبات أن المنطقة الوبرية هي مقر امتصاص المحلول المعدني.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_1', relatedExperimentId: 'exp_1am_05_root_zones', tags: ['الأوبار الماصة', 'الماء والزيت'] }),
  m('med_1am_p24_02', 'تجربة الإيلوديا لامتصاص CO2 وطرح O2 في الضوء', 'تجربة', 'p24_fig02_d4d41b1ae69f.png', 24, 'مقارنة انطلاق فقاعات الغاز في الماء المغلى وماء الحنفية وماء سلتز.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_2', relatedExperimentId: 'exp_1am_06_elodea', tags: ['الإيلوديا', 'CO2'] }),
  m('med_1am_p24_03', 'رسم تجربة أ للإيلوديا', 'تجربة', 'p24_fig03_ec1ac50c4f04.jpg', 24, 'تركيب الإيلوديا تحت قمع.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_2', tags: ['الإيلوديا'] }),
  m('med_1am_p24_04', 'رسم تجربة ب للإيلوديا (الظلام)', 'تجربة', 'p24_fig04_b7f0b2d181b1.png', 24, 'الإيلوديا في غياب الضوء.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_2', tags: ['الإيلوديا', 'الضوء'] }),
  m('med_1am_p24_05', 'رسم تجربة ج للإيلوديا (ماء سلتز)', 'تجربة', 'p24_fig05_4750926d5d6c.jpg', 24, 'الإيلوديا في ماء غني بغاز CO2.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_2', tags: ['الإيلوديا', 'CO2'] }),
  m('med_1am_p25_01', 'تجربة د: الكشف عن غاز O2 المنطلق بتقريب عود ثقاب متوهج', 'تجربة', 'p25_fig01_1005124039b9.jpg', 25, 'اشتعال العود من جديد يؤكد انطلاق غاز ثنائي الأكسجين O2.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_2', relatedExperimentId: 'exp_1am_06_elodea', tags: ['O2', 'عود متوهج'] }),
  m('med_1am_p25_03', 'صورة الثغور الورقية تحت المجهر (مقر المبادلات الغازية)', 'صورة', 'p25_fig03_df6151d59343.jpg', 25, 'صورة مجهرية للثغور الورقية.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_2', tags: ['الثغور', 'Stomate'] }),
  m('med_1am_p25_04', 'تركيب تجريبي 1 لتحديد مقر المبادلات على وجهي الورقة', 'تجربة', 'p25_fig04_63b878fa29bc.jpg', 25, 'مقارنة المبادلات الغازية في الورقة.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', relatedActivityId: 'act_1am_2_1_2_2', tags: ['الورقة'] }),
  m('med_1am_p25_05', 'تركيب تجريبي 2 للثغور', 'تجربة', 'p25_fig05_85e079b90c08.jpg', 25, 'تفاصيل تجربة الثغور.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', tags: ['الثغور'] }),
  m('med_1am_p25_06', 'تركيب تجريبي 3 للثغور', 'تجربة', 'p25_fig06_5edaf5c48cb1.jpg', 25, 'مقارنة نتائج المبادلات اليخضورية.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', tags: ['الثغور'] }),
  m('med_1am_p26_01', 'توضيح تمرين تقويم المورد (ت 1 ص 51)', 'وثيقة', 'p26_fig01_1bb326dd6f97.jpg', 26, 'سند مرفق بتقويم مقر الامتصاص.', { memoNumber: '07', relatedLessonId: 'lu_1am_2_1_2', tags: ['تقويم'] }),

  m('med_1am_p27_01', 'وثيقة 1: تجربة أوراق نبات الجيرانيوم الأربع (التركيب الضوئي)', 'تجربة', 'p27_fig01_7ed2d104a037.jpg', 27, 'إعداد الأوراق: شاهدة، مغطاة بأسود، معزولة عن CO2، ومبرقشة.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_1', relatedExperimentId: 'exp_1am_07_photosynthesis', tags: ['الجيرانيوم', 'التركيب الضوئي'] }),
  m('med_1am_p28_01', 'وثيقة 2: مراحل معالجة الأوراق لإزالة اليخضور والكشف بماء اليود', 'تجربة', 'p28_fig01_46cedd36df14.jpg', 28, 'الخطوات 1–4: ماء مغلي ← كحول مغلي 5د ← غسل ← ماء اليود 30د.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_1', relatedExperimentId: 'exp_1am_07_photosynthesis', tags: ['كحول مغلي', 'ماء اليود'] }),
  m('med_1am_p28_02', 'وثيقة 3: نتائج تلوّن أوراق الجيرانيوم الأربعة بماء اليود', 'تجربة', 'p28_fig02_a7836045fed1.jpg', 28, 'ظهور اللون الأزرق البنفسجي فقط في المناطق الخضراء المعرضة للضوء وCO2.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_2', relatedExperimentId: 'exp_1am_07_photosynthesis', tags: ['نشاء', 'جيرانيوم'] }),
  m('med_1am_p29_01', 'تجربة الكشف عن السكر في عصير البرتقال', 'تجربة', 'p29_fig01_2464ebd6bab7.jpg', 29, 'البرتقال + فهلينغ بالتسخين.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_3', relatedExperimentId: 'exp_1am_08_plant_organics', tags: ['برتقال', 'سكر'] }),
  m('med_1am_p29_02', 'نتيجة راسب أحمر آجوري في عصير البرتقال', 'تجربة', 'p29_fig02_829e0ca977dc.jpg', 29, 'تشكل راسب أحمر آجوري.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_3', tags: ['فهلينغ'] }),
  m('med_1am_p29_03', 'تجربة حك حبة لوز على ورقة بيضاء (الدسم)', 'تجربة', 'p29_fig03_b11d3b4d19ff.jpg', 29, 'الكشف عن الدسم في النبات.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_3', tags: ['لوز', 'دسم'] }),
  m('med_1am_p29_04', 'بقعة شفافة لا تزول بالتسخين في اللوز', 'تجربة', 'p29_fig04_67a1e86bc6e5.jpg', 29, 'دليل احتواء اللوز على الدسم.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_3', tags: ['دسم'] }),
  m('med_1am_p29_05', 'تجربة الكشف عن البروتين في بذور الفاصولياء', 'تجربة', 'p29_fig05_a3c4bcbb2ed5.jpg', 29, 'الفاصولياء + حمض الآزوت.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_3', tags: ['فاصولياء', 'بروتين'] }),
  m('med_1am_p29_06', 'ظهور اللون الأصفر في بذور الفاصولياء', 'تجربة', 'p29_fig06_e2e8e4f7a843.jpg', 29, 'دليل احتواء الفاصولياء على البروتين.', { memoNumber: '08', relatedLessonId: 'lu_1am_2_2_1', relatedActivityId: 'act_1am_2_2_1_3', tags: ['بروتين'] }),

  m('med_1am_p31_01', 'صورة سلوكات الإنسان تجاه النبات الأخضر (حرق وقطع الأشجار)', 'صورة', 'p31_fig01_7d8e83fd2257.jpg', 31, 'السلوكات السلبية المؤثرة على الغطاء النباتي.', { memoNumber: '09', relatedLessonId: 'lu_1am_2_3_1', relatedActivityId: 'act_1am_2_3_1_2', tags: ['البيئة', 'تشجير'] }),
  m('med_1am_p31_02', 'صورة البيوت البلاستيكية وزراعة الخضر في غير مواسمها', 'صورة', 'p31_fig02_5228e397b4fd.jpg', 31, 'التحكم في شروط التركيب الضوئي داخل البيوت البلاستيكية.', { memoNumber: '09', relatedLessonId: 'lu_1am_2_3_1', relatedActivityId: 'act_1am_2_3_1_1', tags: ['بيوت بلاستيكية'] }),
  m('med_1am_p31_03', 'صورة حملات التشجير والاعتناء بالنبات الأخضر', 'صورة', 'p31_fig03_2f987bf81516.jpg', 31, 'السلوكات الإيجابية تجاه النبات الأخضر.', { memoNumber: '09', relatedLessonId: 'lu_1am_2_3_1', relatedActivityId: 'act_1am_2_3_1_2', tags: ['التشجير'] }),

  m('med_1am_p32_01', 'تجربة نبات الكرفس في المحلول الملون الأحمر (90 د)', 'تجربة', 'p32_fig01_71827080cc28.jpg', 32, 'غصن الكرفس المورق في كأس به محلول ملون أحمر.', { memoNumber: '10', relatedLessonId: 'lu_1am_2_4_1', relatedActivityId: 'act_1am_2_4_1_1', relatedExperimentId: 'exp_1am_09_celery_sap', tags: ['الكرفس', 'النسغ الناقص'] }),
  m('med_1am_p33_01', 'مقطع طولي وعرضي في ساق الكرفس يبرز الأوعية الخشبية الحمراء', 'صورة', 'p33_fig01_abb7965a729f.jpg', 33, 'تلوّن الأوعية الخشبية الناقلة للنسغ الناقص.', { memoNumber: '10', relatedLessonId: 'lu_1am_2_4_1', relatedActivityId: 'act_1am_2_4_1_1', relatedExperimentId: 'exp_1am_09_celery_sap', tags: ['الأوعية الخشبية'] }),
  m('med_1am_p34_02', 'تجربة الكيس الشفاف على النبات الأخضر (ظاهرة النتح)', 'تجربة', 'p34_fig02_06956cd4faae.png', 34, 'تشكّل ضباب وقطرات مائية على الجدار الداخلي للكيس.', { memoNumber: '11', relatedLessonId: 'lu_1am_2_4_2', relatedActivityId: 'act_1am_2_4_2_1', relatedExperimentId: 'exp_1am_10_transpiration', tags: ['النتح'] }),
  m('med_1am_p35_01', 'مخطط مسار النسغ الناقص والكامل ودور النتح (مرقم 1 إلى 7)', 'مخطط', 'p35_fig01_abe321d98e9f.jpg', 35, 'توضيح الامتصاص بالأوبار الماصة، الصعود في الأوعية الخشبية، التركيب الضوئي، النسغ الكامل، والنتح.', { memoNumber: '11', relatedLessonId: 'lu_1am_2_4_2', relatedActivityId: 'act_1am_2_4_2_1', tags: ['النسغ', 'مخطط', 'النتح'] }),
  m('med_1am_p35_02', 'نبات مسقي في تربة مشبعة بالماء تحت كيس شفاف', 'تجربة', 'p35_fig02_11b0544871e9.png', 35, 'كثرة القطرات المائية عند توفر الماء في التربة.', { memoNumber: '11', relatedLessonId: 'lu_1am_2_4_2', relatedExperimentId: 'exp_1am_10_transpiration', tags: ['النتح'] }),
  m('med_1am_p35_03', 'نبات في تربة جافة تحت كيس شفاف', 'تجربة', 'p35_fig03_410a5848785c.jpg', 35, 'قلة القطرات المائية في التربة الجافة.', { memoNumber: '11', relatedLessonId: 'lu_1am_2_4_2', relatedExperimentId: 'exp_1am_10_transpiration', tags: ['النتح'] }),
  m('med_1am_p35_04', 'رسم تقويمي لانتقال النسغ والنتح', 'رسم', 'p35_fig04_34d1128f4445.png', 35, 'سند مرفق بتقويم المورد (ص 35).', { memoNumber: '11', relatedLessonId: 'lu_1am_2_4_2', tags: ['تقويم'] }),

  // ─── المقطع 03: التحصل على الطاقة عند الإنسان (ص 36–44) ──────────────────
  m('med_1am_p36_02', 'غلاف المقطع: التحصل على الطاقة عند الإنسان (أيقونة 1)', 'صورة', 'p36_fig02_7dbc75d483c5.png', 36, 'من صفحة عنوان التحصل على الطاقة عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p36_03', 'غلاف المقطع: التحصل على الطاقة عند الإنسان (أيقونة 2)', 'صورة', 'p36_fig03_6c31c5a1fcb1.png', 36, 'من صفحة عنوان التحصل على الطاقة عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p36_04', 'صورة توضيحية للجهاز التنفسي في غلاف المقطع', 'صورة', 'p36_fig04_958d924eb8f8.jpg', 36, 'غلاف مقطع التحصل على الطاقة عند الإنسان.', { tags: ['غلاف', 'الجهاز التنفسي'] }),
  m('med_1am_p36_06', 'شعار صفحة المقطع التعلمي التحصل على الطاقة', 'صورة', 'p36_fig06_97354adde623.png', 36, 'عنصر تصميمي لصفحة العنوان.', { tags: ['غلاف'] }),

  m('med_1am_p38_01', 'وثيقة 1: الجهاز التنفسي عند الإنسان ومسار الهواء', 'رسم', 'p38_fig01_0d92c4c52efb.jpg', 38, 'الأنف، الفم، الرغامى، القصبتان الهوائيتان، القصيبات والحويصلات الرئوية.', { memoNumber: '12', relatedLessonId: 'lu_1am_3_1_1', relatedActivityId: 'act_1am_3_1_1_2', tags: ['الجهاز التنفسي'] }),
  m('med_1am_p38_02', 'وثيقة 2 و 3: بنية السنخ الرئوي ومقارنة الدم الداخل والخارج', 'مخطط', 'p38_fig02_e39fb9e8c2e7.jpg', 38, 'رسم تخطيطي للسنخ الرئوي الغني بالشعيرات الدموية وجدول الغازات.', { memoNumber: '12', relatedLessonId: 'lu_1am_3_1_1', relatedActivityId: 'act_1am_3_1_1_2', tags: ['السنخ الرئوي', 'CO2', 'O2'] }),
  m('med_1am_p39_01', 'رسم توضيحي لمبادلات الغازات بين السنخ والدم', 'مخطط', 'p39_fig01_ef2d2c8a9427.jpg', 39, 'مقر المبادلات الغازية التنفسية عند الإنسان.', { memoNumber: '12', relatedLessonId: 'lu_1am_3_1_1', tags: ['تقويم', 'السنخ'] }),
  m('med_1am_p41_01', 'وثيقة توضيحية لعلاقة الجهد البدني بالتنفس وإنتاج الطاقة', 'صورة', 'p41_fig01_d8903235e669.jpg', 41, 'مقارنة استهلاك الأغذية وO2 بين الراحة والجري.', { memoNumber: '13', relatedLessonId: 'lu_1am_3_2_1', relatedActivityId: 'act_1am_3_2_1_2', tags: ['التنفس', 'الطاقة'] }),

  m('med_1am_p43_01', 'صورة مقارنة رئة سليمة مع رئة مصابة بسبب التدخين', 'صورة', 'p43_fig01_84599d2f0330.jpg', 43, 'أضرار التبغ وترسب القطران في الرئتين.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedActivityId: 'act_1am_3_3_1_1', tags: ['التدخين', 'سرطان الرئة'] }),
  m('med_1am_p43_02', 'وثيقة مصورة للسلوكات الوقائية لحماية الجهاز التنفسي', 'صورة', 'p43_fig02_475abc9f1a59.jpg', 43, 'الرياضة والهواء النقي والتهوية.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedActivityId: 'act_1am_3_3_1_2', tags: ['القواعد الصحية'] }),
  m('med_1am_p44_01', 'صورة 1 مطبوعة التلميذ (ص 44): التدخين', 'صورة', 'p44_fig01_3b0cd2d0b40e.jpg', 44, 'مطبوعة القواعد الصحية للتنفس.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedWorksheetId: 'ws_1am_p44', tags: ['ورقة عمل'] }),
  m('med_1am_p44_02', 'صورة 2 مطبوعة التلميذ (ص 44): التلوث الهوائي', 'صورة', 'p44_fig02_ade0350bcba0.jpg', 44, 'دخان المصانع والسيارات.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedWorksheetId: 'ws_1am_p44', tags: ['ورقة عمل'] }),
  m('med_1am_p44_03', 'صورة 3 مطبوعة التلميذ (ص 44): تسرب غاز CO', 'صورة', 'p44_fig03_f400da7b3b57.jpg', 44, 'الاختناق بغاز أول أكسيد الكربون.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedWorksheetId: 'ws_1am_p44', tags: ['ورقة عمل'] }),
  m('med_1am_p44_04', 'صورة 4 مطبوعة التلميذ (ص 44): مسببات الحساسية والربو', 'صورة', 'p44_fig04_60ff41552480.jpg', 44, 'الغبار وغبار الطلع.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedWorksheetId: 'ws_1am_p44', tags: ['ورقة عمل'] }),
  m('med_1am_p44_05', 'صورة 5 مطبوعة التلميذ (ص 44): ممارسة الرياضة', 'صورة', 'p44_fig05_fd51339f6086.jpg', 44, 'الوقاية بممارسة الرياضة.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedWorksheetId: 'ws_1am_p44', tags: ['ورقة عمل'] }),
  m('med_1am_p44_06', 'صورة 6 مطبوعة التلميذ (ص 44): التهوية', 'صورة', 'p44_fig06_5d6b87532eec.jpg', 44, 'تهوية الغرف والمحلات.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedWorksheetId: 'ws_1am_p44', tags: ['ورقة عمل'] }),
  m('med_1am_p44_07', 'صورة 7 مطبوعة التلميذ (ص 44): الابتعاد عن التدخين', 'صورة', 'p44_fig07_4475060bb400.jpg', 44, 'تجنب التبغ والهواء الملوث.', { memoNumber: '14', relatedLessonId: 'lu_1am_3_3_1', relatedWorksheetId: 'ws_1am_p44', tags: ['ورقة عمل'] }),

  // ─── المقطع 04: التحصل على الطاقة عند النبات الأخضر (ص 45–56) ────────────
  m('med_1am_p45_01', 'غلاف التحصل على الطاقة عند النبات الأخضر (عنصر 1)', 'صورة', 'p45_fig01_264aa3d0b087.png', 45, 'فاصل المقطع 04.', { tags: ['غلاف'] }),
  m('med_1am_p45_02', 'صورة غلاف التنفس والتخمر عند النبات', 'صورة', 'p45_fig02_f850130ee0a9.jpg', 45, 'صورة مرافقة لفاصل المقطع 04.', { tags: ['غلاف'] }),
  m('med_1am_p45_03', 'صورة بستان نباتي لغلاف المقطع 04', 'صورة', 'p45_fig03_36b55023415e.jpg', 45, 'فاصل المقطع 04.', { tags: ['غلاف'] }),
  m('med_1am_p45_04', 'زخرفة غلاف المقطع 04 (4)', 'صورة', 'p45_fig04_0811403716ac.png', 45, 'فاصل المقطع 04.', { tags: ['غلاف'] }),
  m('med_1am_p45_05', 'زخرفة غلاف المقطع 04 (5)', 'صورة', 'p45_fig05_1c9388fed431.png', 45, 'فاصل المقطع 04.', { tags: ['غلاف'] }),
  m('med_1am_p45_06', 'زخرفة غلاف المقطع 04 (6)', 'صورة', 'p45_fig06_05fd5ee894f9.png', 45, 'فاصل المقطع 04.', { tags: ['غلاف'] }),
  m('med_1am_p45_07', 'زخرفة غلاف المقطع 04 (7)', 'صورة', 'p45_fig07_f0049e81ddb2.png', 45, 'فاصل المقطع 04.', { tags: ['غلاف'] }),
  m('med_1am_p45_08', 'زخرفة غلاف المقطع 04 (8)', 'صورة', 'p45_fig08_b951aeee6b82.png', 45, 'فاصل المقطع 04.', { tags: ['غلاف'] }),

  m('med_1am_p48_ws', 'ورقة تقويم المورد (ص 48): مقارنة المبادلات اليخضورية والتنفسية', 'وثيقة', 'p48_worksheet_page.png', 48, 'نموذج الجداول الجاهزة للتوزيع على التلاميذ في الصفحة 48.', { memoNumber: '15', relatedLessonId: 'lu_1am_4_1_1', relatedWorksheetId: 'ws_1am_p48', tags: ['ورقة عمل', 'تقويم'] }),
  m('med_1am_p50_01', 'وثيقة تجربة مقارنة التنفس بين البذور الجافة والبذور المنتشة', 'تجربة', 'p50_fig01_8306c5f36dea.png', 50, 'ارتفاع مستوى المحلول الملون وتعكر رائق الكلس عند البذور المنتشة.', { memoNumber: '16', relatedLessonId: 'lu_1am_4_2_1', relatedActivityId: 'act_1am_4_2_1_1', relatedExperimentId: 'exp_1am_11_seed_resp', tags: ['إنتاش', 'تنفس النبات'] }),
  m('med_1am_p51_02', 'فطر خميرة الخبز والمجهر الضوئي والصورة المجهرية للخميرة', 'صورة', 'p51_fig02_51278cd58ed5.jpg', 51, 'الملاحظة المجهرية لخميرة الخبز في قطرة ماء دافئ.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedActivityId: 'act_1am_4_3_1_1', relatedExperimentId: 'exp_1am_12_yeast_micro', tags: ['الخميرة', 'مجهر'] }),
  m('med_1am_p52_01', 'التركيب التجريبي لظاهرة التخمر الكحولي لدى الخميرة', 'تجربة', 'p52_fig01_dc130661622e.png', 52, 'قارورة بها محلول سكري دافئ + خميرة مع أنبوبة توصيل وماء الجير.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedActivityId: 'act_1am_4_3_1_2', relatedExperimentId: 'exp_1am_13_fermentation', tags: ['التخمر', 'ماء الجير'] }),
  m('med_1am_p53_01', 'جدول مقارنة التنفس والتخمر المصور (ص 53)', 'وثيقة', 'p53_fig01_304c1f60a424.png', 53, 'نموذج جدول المقارنة بين طريقتي التحصل على الطاقة.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedWorksheetId: 'ws_1am_p53', tags: ['التنفس', 'التخمر'] }),
  m('med_1am_p53_02', 'صورة مرافقة لدرس التخمر (ص 53)', 'صورة', 'p53_fig02_570df585015b.jpg', 53, 'وثيقة إضافية في تقويم التخمر.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', tags: ['التخمر'] }),
  m('med_1am_p54_01', 'مطبوعة العمل الفوجي 1 (ص 54): العجينة 1 بدون خميرة', 'تجربة', 'p54_fig01_ff549e32a833.jpg', 54, 'عدم انتفاخ العجينة لغياب الخميرة.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedWorksheetId: 'ws_1am_p54_56', tags: ['عمل فوجي', 'خميرة'] }),
  m('med_1am_p54_02', 'مطبوعة العمل الفوجي 1 (ص 54): العجينة 2 مع الخميرة', 'تجربة', 'p54_fig02_69e5b2e39a57.jpg', 54, 'انتفاخ العجينة بسبب غاز CO2 الناتج عن نشاط الخميرة.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedWorksheetId: 'ws_1am_p54_56', tags: ['عمل فوجي', 'تخمر'] }),
  m('med_1am_p54_03', 'رسم الخميرة في مطبوعة العمل الفوجي 1 (ص 54)', 'صورة', 'p54_fig03_90abe94829cb.jpg', 54, 'ملاحظة مجهرية للخميرة.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedWorksheetId: 'ws_1am_p54_56', tags: ['خميرة'] }),
  m('med_1am_p55_01', 'مطبوعة العمل الفوجي 2 (ص 55): تركيب التخمر في وسط لاهوائي', 'تجربة', 'p55_fig01_178e33ea0eaa.jpg', 55, 'انطلاق فقاعات CO2 وتعكر رائق الكلس ورائحة كحولية.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedWorksheetId: 'ws_1am_p54_56', tags: ['عمل فوجي', 'تخمر'] }),
  m('med_1am_p55_02', 'رسم إضافي بمطبوعة العمل الفوجي 2 (ص 55)', 'وثيقة', 'p55_fig02_b1d652f103ac.png', 55, 'مستند مطبوعة العمل الفوجي للخميرة.', { memoNumber: '17', relatedLessonId: 'lu_1am_4_3_1', relatedWorksheetId: 'ws_1am_p54_56', tags: ['عمل فوجي'] }),

  // ─── المقطع 05: الإطراح عند الإنسان (ص 57–64) ───────────────────────────
  m('med_1am_p57_02', 'غلاف المقطع: الإطراح عند الإنسان (أيقونة 1)', 'صورة', 'p57_fig02_bee57852a05b.png', 57, 'عنصر غلاف مقطع الإطراح عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p57_03', 'غلاف المقطع: الإطراح عند الإنسان (أيقونة 2)', 'صورة', 'p57_fig03_30c04826e43f.png', 57, 'عنصر غلاف مقطع الإطراح عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p57_04', 'صورة غلاف مقطع الإطراح عند الإنسان', 'صورة', 'p57_fig04_362a963289a2.jpg', 57, 'صورة الجهاز البولي والغلاف الرسمي.', { tags: ['غلاف', 'الإطراح'] }),
  m('med_1am_p59_01', 'وثيقة 2: مقارنة ألوان البول الثلاثة ودلالتها على شرب الماء', 'وثيقة', 'p59_fig01_c61bee59b92c.jpg', 59, 'شفاف/فاتح/غامق + سؤالا الاستغلال.', { memoNumber: '18', relatedLessonId: 'lu_1am_5_1_1', relatedActivityId: 'act_1am_5_1_1_1', tags: ['البول', 'الإطراح'] }),
  m('med_1am_p61_01', 'وثيقة 1: مكونات الجهاز البولي عند الإنسان', 'رسم', 'p61_fig01_be1d5c0f8c36.jpg', 61, 'كلية، شريان كلوي، وريد كلوي، حالب، مثانة، إحليل.', { memoNumber: '19', relatedLessonId: 'lu_1am_5_2_1', relatedActivityId: 'act_1am_5_2_1_1', tags: ['الجهاز البولي', 'الكلية'] }),
  m('med_1am_p62_01', 'وثيقة 2 و 3: مقطع طولي في الكلية وغناها بالأوعية الدموية', 'رسم', 'p62_fig01_e4ce3d70c934.png', 62, 'تصفية الدم من اليوريا وحمض البول داخل الكلية.', { memoNumber: '19', relatedLessonId: 'lu_1am_5_2_1', relatedActivityId: 'act_1am_5_2_1_2', tags: ['الكلية', 'البولة'] }),
  m('med_1am_p62_02', 'وثيقة 4: مقطع عرضي في الجلد يظهر البشرة والأدمة والغدة العرقية', 'رسم', 'p62_fig02_0967c442c9b7.jpg', 62, 'دور الغدد العرقية المحاطة بالشعيرات الدموية في الإطراح.', { memoNumber: '19', relatedLessonId: 'lu_1am_5_2_1', relatedActivityId: 'act_1am_5_2_1_3', tags: ['الجلد', 'الغدة العرقية'] }),
  m('med_1am_p64_01', 'وثيقة تقويم المورد (ص 64): وضعية أحمد وأهمية شرب الماء', 'وثيقة', 'p64_fig01_1a5fe761ca19.png', 64, 'السند والتعليمة التقويمية لحماية الكليتين.', { memoNumber: '20', relatedLessonId: 'lu_1am_5_3_1', tags: ['تقويم', 'القواعد الصحية'] }),

  // ─── المقطع 06: مظاهر النمو والتطور عند النبات — الإنتاش (ص 65–70) ────────
  m('med_1am_p65_01', 'غلاف المقطع: مظاهر النمو والتطور عند النبات (الإنتاش)', 'صورة', 'p65_fig01_c2cfa5dc8a21.jpg', 65, 'فاصل مقطع النمو والتطور عند النبات.', { tags: ['غلاف', 'الإنتاش'] }),
  m('med_1am_p66_01', 'وثيقة 1: بنية بذرة الفاصولياء ومكونات الرشيم', 'رسم', 'p66_fig01_7a074bb5978c.jpg', 66, 'اللحافة، الفلقتان، الرشيم (سويقة، جذير، ورقتان أوليتان).', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedActivityId: 'act_1am_6_1_1_1', relatedExperimentId: 'exp_1am_14_seed_anat', tags: ['البذرة', 'الرشيم'] }),
  m('med_1am_p66_03', 'رسم تفصيلي لبذرة الفاصولياء المشرحة', 'رسم', 'p66_fig03_9e528ffa74d1.jpg', 66, 'مقارنة الفلقتين والرشيم.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedActivityId: 'act_1am_6_1_1_1', tags: ['الفلقتان'] }),
  m('med_1am_p67_01', 'وثيقة المراحل الأساسية لإنتاش بذرة الفاصولياء', 'مخطط', 'p67_fig01_b6dac4d92fc8.jpg', 67, 'المراحل الزمنية الخمس لنمو الرشيم.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedActivityId: 'act_1am_6_1_1_2', relatedExperimentId: 'exp_1am_15_germination', tags: ['مراحل الإنتاش'] }),
  m('med_1am_p68_01', 'وثيقة البذور الأربعة في تقويم المورد (أيها تنتش؟)', 'تجربة', 'p68_fig01_8acefed422e2.jpg', 68, 'بذرة منزوعة الرشيم، منزوعة الفلقتين، بفلقة واحدة، وكاملة.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', tags: ['تقويم', 'الإنتاش'] }),
  m('med_1am_p69_01', 'ورقة عمل الإنتاش ص 69 — مرحلة 1: بعد 6 أيام', 'رسم', 'p69_fig01_eeb416ef4acb.jpg', 69, 'انتفاخ البذرة وبروز الجذير.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedWorksheetId: 'ws_1am_p69_70', tags: ['ورقة عمل'] }),
  m('med_1am_p69_02', 'ورقة عمل الإنتاش ص 69 — مرحلة 2: بعد 9 أيام', 'رسم', 'p69_fig02_35366ec2db33.jpg', 69, 'نمو السويقة نحو الأعلى.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedWorksheetId: 'ws_1am_p69_70', tags: ['ورقة عمل'] }),
  m('med_1am_p69_03', 'ورقة عمل الإنتاش ص 69 — مرحلة 3: بعد 12 يوما', 'رسم', 'p69_fig03_dbd55d5ecfa6.jpg', 69, 'نمو الجذير وتثبيته في التربة.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedWorksheetId: 'ws_1am_p69_70', tags: ['ورقة عمل'] }),
  m('med_1am_p69_04', 'ورقة عمل الإنتاش ص 69 — مرحلة 4: بعد 15 يوما', 'رسم', 'p69_fig04_f42b294616ce.jpg', 69, 'نمو العجز والأوراق الأولية.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedWorksheetId: 'ws_1am_p69_70', tags: ['ورقة عمل'] }),
  m('med_1am_p69_05', 'ورقة عمل الإنتاش ص 69 — مرحلة 5: بعد 20 يوما', 'رسم', 'p69_fig05_db430bb1d86d.jpg', 69, 'سقوط الفلقتين واكتمال النبتة.', { memoNumber: '21', relatedLessonId: 'lu_1am_6_1_1', relatedWorksheetId: 'ws_1am_p69_70', tags: ['ورقة عمل'] }),

  // ─── المقطع 07: التكاثر عند الإنسان (ص 71–80) ───────────────────────────
  m('med_1am_p71_01', 'غلاف التكاثر عند الإنسان (عنصر 1)', 'صورة', 'p71_fig01_1f3bd459b9ac.png', 71, 'فاصل مقطع التكاثر عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p71_02', 'غلاف التكاثر عند الإنسان (عنصر 2)', 'صورة', 'p71_fig02_b3713f31c205.png', 71, 'فاصل مقطع التكاثر عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p71_03', 'غلاف التكاثر عند الإنسان (عنصر 3)', 'صورة', 'p71_fig03_f3d5a95d124f.png', 71, 'فاصل مقطع التكاثر عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p71_04', 'غلاف التكاثر عند الإنسان (عنصر 4)', 'صورة', 'p71_fig04_0102e01fd611.png', 71, 'فاصل مقطع التكاثر عند الإنسان.', { tags: ['غلاف'] }),
  m('med_1am_p71_05', 'صورة غلاف مقطع التكاثر عند الإنسان', 'صورة', 'p71_fig05_79badf526110.jpg', 71, 'فاصل مقطع التكاثر عند الإنسان.', { tags: ['غلاف', 'التكاثر'] }),

  m('med_1am_p72_02', 'تشريح الجهاز التكاثري عند الفأر الذكر', 'صورة', 'p72_fig02_d5cd85b7cd96.jpg', 72, 'الخصيتان والمجاري التناسلية عند الذكر.', { memoNumber: '22', relatedLessonId: 'lu_1am_7_1_1', relatedActivityId: 'act_1am_7_1_1_1', tags: ['الجهاز الذكري'] }),
  m('med_1am_p72_03', 'تشريح الجهاز التكاثري عند الفأر الأنثى', 'صورة', 'p72_fig03_1f5592f9f9c1.jpg', 72, 'المبيضان والرحم والمجاري التناسلية عند الأنثى.', { memoNumber: '22', relatedLessonId: 'lu_1am_7_1_1', relatedActivityId: 'act_1am_7_1_1_1', tags: ['الجهاز الأنثوي'] }),
  m('med_1am_p73_01', 'وثيقة (ب): رسم تخطيطي للجهاز التكاثري الذكري (1–4)', 'رسم', 'p73_fig01_f2a14acb2f69.jpg', 73, '1- خصية، 2- بربخ، 3- قناة ناقلة للنطاف، 4- إحليل.', { memoNumber: '22', relatedLessonId: 'lu_1am_7_1_1', relatedActivityId: 'act_1am_7_1_1_1', tags: ['الجهاز الذكري'] }),
  m('med_1am_p73_02', 'وثيقة (د): رسم تخطيطي للجهاز التكاثري الأنثوي (1–4)', 'رسم', 'p73_fig02_93eca9ee9b96.jpg', 73, '1- مبيض، 2- قناة ناقلة للبويضات، 3- رحم، 4- مهبل.', { memoNumber: '22', relatedLessonId: 'lu_1am_7_1_1', relatedActivityId: 'act_1am_7_1_1_1', tags: ['الجهاز الأنثوي'] }),
  m('med_1am_p74_01', 'نموذج جدول التقويم للذكر والأنثى (ص 74)', 'وثيقة', 'p74_fig01_38571f7d3d6d.png', 74, 'الجدول التطبيقي لتقويم المناسل والمجاري والأعراس.', { memoNumber: '22', relatedLessonId: 'lu_1am_7_1_1', tags: ['تقويم', 'جدول'] }),

  m('med_1am_p76_02', 'تجربة الإلقاح عند قنافذ البحر (الأوعية أ، ب، ج)', 'تجربة', 'p76_fig02_db87dd5f4548.jpg', 76, 'ظهور اليرقات في الوعاء أ فقط لوجود النطاف والبويضات معا.', { memoNumber: '23', relatedLessonId: 'lu_1am_7_2_1', relatedActivityId: 'act_1am_7_2_1_1', relatedExperimentId: 'exp_1am_16_fertilization', tags: ['الإلقاح', 'قنافذ البحر'] }),
  m('med_1am_p77_01', 'مخطط مسار النطاف والبويضة وموقع الإلقاح في قناة فالوب', 'مخطط', 'p77_fig01_561e81994fa1.jpg', 77, 'الإباضة، الإلقاح في قناة فالوب، والانغراس في الرحم.', { memoNumber: '23', relatedLessonId: 'lu_1am_7_2_1', relatedActivityId: 'act_1am_7_2_1_2', tags: ['الإلقاح', 'قناة فالوب'] }),
  m('med_1am_p78_01', 'مطبوعة التلميذ ص 78: رسم تجربة قنافذ البحر', 'تجربة', 'p78_fig01_fcbae64a59fb.jpg', 78, 'نسخة التلميذ للنشاط 1 في الإلقاح.', { memoNumber: '23', relatedLessonId: 'lu_1am_7_2_1', relatedWorksheetId: 'ws_1am_p78', tags: ['ورقة عمل'] }),
  m('med_1am_p78_02', 'مطبوعة التلميذ ص 78: رسم الجهاز التناسلي ومسار الأمشاج', 'رسم', 'p78_fig02_ae9981bb992a.jpg', 78, 'نسخة التلميذ للنشاط 2 في الإلقاح.', { memoNumber: '23', relatedLessonId: 'lu_1am_7_2_1', relatedWorksheetId: 'ws_1am_p78', tags: ['ورقة عمل'] }),
  m('med_1am_p79_01', 'مستند النص العلمي للأمراض المتنقلة جنسيا (ص 79)', 'وثيقة', 'p79_fig01_978f9a1b11b3.png', 79, 'وثيقة القواعد الصحية للتكاثر.', { memoNumber: '24', relatedLessonId: 'lu_1am_7_3_1', relatedActivityId: 'act_1am_7_3_1_1', tags: ['الأمراض الجنسية'] }),
  m('med_1am_p80_01', 'مستند طرق العدوى بفيروس السيدا والوقاية منها (ص 80)', 'وثيقة', 'p80_fig01_b0e1f5dd0b7a.png', 80, 'الوقاية من داء فقدان المناعة المكتسبة.', { memoNumber: '24', relatedLessonId: 'lu_1am_7_3_1', relatedActivityId: 'act_1am_7_3_1_1', tags: ['السيدا', 'الوقاية'] }),

  // ─── المقطع 08: التكاثر عند النباتات ذات الأزهار (ص 81–88) ────────────────
  m('med_1am_p81_01', 'صورة زهرة نموذجية من غلاف مقطع التكاثر عند النباتات الزهرية', 'صورة', 'p81_fig01_d1ba04d87a3a.jpg', 81, 'فاصل المقطع 08.', { tags: ['غلاف', 'الزهرة'] }),
  m('med_1am_p81_02', 'عنصر غلاف التكاثر عند النباتات الزهرية (2)', 'صورة', 'p81_fig02_368de397c5af.png', 81, 'فاصل المقطع 08.', { tags: ['غلاف'] }),
  m('med_1am_p81_03', 'عنصر غلاف التكاثر عند النباتات الزهرية (3)', 'صورة', 'p81_fig03_abd03c2d59a4.png', 81, 'فاصل المقطع 08.', { tags: ['غلاف'] }),
  m('med_1am_p81_04', 'عنصر غلاف التكاثر عند النباتات الزهرية (4)', 'صورة', 'p81_fig04_93a6eac07fd8.png', 81, 'فاصل المقطع 08.', { tags: ['غلاف'] }),
  m('med_1am_p81_05', 'عنصر غلاف التكاثر عند النباتات الزهرية (5)', 'صورة', 'p81_fig05_47e0d214eec2.png', 81, 'فاصل المقطع 08.', { tags: ['غلاف'] }),
  m('med_1am_p81_06', 'عنصر غلاف التكاثر عند النباتات الزهرية (6)', 'صورة', 'p81_fig06_befb978f4f1a.png', 81, 'فاصل المقطع 08.', { tags: ['غلاف'] }),

  m('med_1am_p82_02', 'تشريح الزهرة الكاملة واستخراج مكوناتها (ص 82)', 'تجربة', 'p82_fig02_84ca919367c6.jpg', 82, 'السبلات، البتلات، الأسدية، والمدقة.', { memoNumber: '25', relatedLessonId: 'lu_1am_8_1_1', relatedActivityId: 'act_1am_8_1_1_1', relatedExperimentId: 'exp_1am_17_flower_dissect', tags: ['تشريح الزهرة'] }),
  m('med_1am_p82_03', 'رسم تخطيطي (ب) للزهرة لوضع البيانات', 'رسم', 'p82_fig03_67e6099527aa.png', 82, 'مكونات الزهرة النموذجية.', { memoNumber: '25', relatedLessonId: 'lu_1am_8_1_1', relatedActivityId: 'act_1am_8_1_1_1', tags: ['الزهرة'] }),
  m('med_1am_p83_01', 'وثيقة تفتح وانغلاق البتلات والسبلات ومقطع المبيض والمئبر', 'رسم', 'p83_fig01_b163a4e777c3.jpg', 83, 'إبراز حبوب الطلع في المئبر والبويضات في المبيض.', { memoNumber: '25', relatedLessonId: 'lu_1am_8_1_1', relatedActivityId: 'act_1am_8_1_1_2', tags: ['المئبر', 'المبيض'] }),
  m('med_1am_p83_02', 'صورة حقيقية لتشريح المبيض والمئبر بالمكبرة', 'صورة', 'p83_fig02_0fa963565f77.jpg', 83, 'حبوب الطلع الصفراء والبويضات.', { memoNumber: '25', relatedLessonId: 'lu_1am_8_1_1', relatedActivityId: 'act_1am_8_1_1_2', tags: ['المناسل'] }),
  m('med_1am_p84_01', 'وثيقة تصنيف الأزهار 1 و 2 و 3 حسب الجنس', 'رسم', 'p84_fig01_0c3cc1892e6b.png', 84, 'أنثوية (المدقة فقط)، ذكرية (الأسدية فقط)، وخنثى (معا).', { memoNumber: '25', relatedLessonId: 'lu_1am_8_1_1', relatedActivityId: 'act_1am_8_1_1_3', tags: ['أزهار أحادية وثنائية الجنس'] }),
  m('med_1am_p84_02', 'رسم توضيحي للزهرة الثنائية الجنس', 'صورة', 'p84_fig02_2e62012e27f7.jpg', 84, 'مقارنة الأزهار حسب الأعضاء التناسلية.', { memoNumber: '25', relatedLessonId: 'lu_1am_8_1_1', relatedActivityId: 'act_1am_8_1_1_3', tags: ['الزهرة'] }),
  m('med_1am_p85_04', 'وثيقة مطبوعة التلميذ (ص 85): تفتح الأزهار وانغلاقها', 'صورة', 'p85_fig04_40ab6e6c2ad9.jpg', 85, 'الأعضاء 1 و 2 (السبلات والبتلات).', { memoNumber: '25', relatedLessonId: 'lu_1am_8_1_1', relatedWorksheetId: 'ws_1am_p85', tags: ['ورقة عمل'] }),

  m('med_1am_p86_02', 'وثيقة 1: عملية التأبير الذاتي وغير الذاتي وعوامله', 'رسم', 'p86_fig02_eb5b5c856a3b.jpg', 86, 'انتقال حبوب الطلع إلى الميسم عبر الحشرات والرياح والإنسان.', { memoNumber: '26', relatedLessonId: 'lu_1am_8_2_1', relatedActivityId: 'act_1am_8_2_1_1', tags: ['التأبير'] }),
  m('med_1am_p87_01', 'مخطط دورة حياة النبات الزهري: التأبير والأنبوب الطلعي والإلقاح', 'مخطط', 'p87_fig01_bdeac19254a6.jpg', 87, 'تشكل البيضة الملقحة فالثمرة والبذرة فالإنتاش.', { memoNumber: '26', relatedLessonId: 'lu_1am_8_2_1', relatedActivityId: 'act_1am_8_2_1_2', tags: ['دورة الحياة', 'الإلقاح'] }),

  // ─── المقطع 09: وحدة بناء الكائنات الحية — الخلية (ص 89–93) ───────────────
  m('med_1am_p89_01', 'غلاف المقطع: وحدة بناء الكائنات الحية (عنصر 1)', 'صورة', 'p89_fig01_93f43ddb7953.png', 89, 'فاصل المقطع 09.', { tags: ['غلاف'] }),
  m('med_1am_p89_02', 'غلاف المقطع: وحدة بناء الكائنات الحية (عنصر 2)', 'صورة', 'p89_fig02_46c97dea3c63.png', 89, 'فاصل المقطع 09.', { tags: ['غلاف'] }),
  m('med_1am_p89_03', 'صورة مجهرية لخلية من غلاف المقطع 09', 'صورة', 'p89_fig03_0c3fa7e9c5bb.jpg', 89, 'صورة خلايا في صفحة العنوان.', { tags: ['غلاف', 'خلية'] }),
  m('med_1am_p89_04', 'صورة خلايا نباتية في غلاف المقطع 09', 'صورة', 'p89_fig04_cd1ef9fbb581.jpg', 89, 'صورة نسيج خلوي.', { tags: ['غلاف', 'خلية'] }),
  m('med_1am_p89_06', 'صورة مجهرية إضافية في غلاف المقطع 09', 'صورة', 'p89_fig06_01554ffc83b8.jpg', 89, 'غلاف مقطع الخلية.', { tags: ['غلاف', 'خلية'] }),
  m('med_1am_p89_07', 'صورة مجهر ضوئي من غلاف المقطع 09', 'صورة', 'p89_fig07_ade013fdfa15.jpg', 89, 'أدوات الفحص المجهري للخلية.', { tags: ['غلاف', 'مجهر'] }),

  m('med_1am_p90_02', 'صورة مجهرية لنسيج بطانة الفم (مكبر 600 مرة)', 'صورة', 'p90_fig02_93d13ed61edc.jpg', 90, 'فحص خلايا بطانة الفم الملونة بأزرق الميثيلين.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedActivityId: 'act_1am_9_1_1_1', relatedExperimentId: 'exp_1am_18_animal_cell', tags: ['بطانة الفم', 'خلية حيوانية'] }),
  m('med_1am_p91_01', 'وثيقة 1: رسم تخطيطي للخلية الحيوانية (1 غشاء، 2 هيولى، 3 نواة)', 'رسم', 'p91_fig01_8ce4434f79e6.jpg', 91, 'البيانات الثلاثة الأساسية للخلية الحيوانية.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedActivityId: 'act_1am_9_1_1_1', tags: ['خلية حيوانية'] }),
  m('med_1am_p91_02', 'وثيقة 2: رسم تخطيطي للخلية النباتية (1–5)', 'رسم', 'p91_fig02_0f979cf78ec8.jpg', 91, 'غشاء هيولي، هيولى، نواة، فجوة عصارية، جدار سيليلوزي.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedActivityId: 'act_1am_9_1_1_2', tags: ['خلية نباتية'] }),
  m('med_1am_p92_02', 'ملاحظة مجهرية للخلية الحيوانية في مطبوعة التلميذ (ص 92)', 'صورة', 'p92_fig02_a6aa48b14146.jpg', 92, 'صورة مطبوعة نشاط الخلية الحيوانية.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedWorksheetId: 'ws_1am_p92_93', tags: ['ورقة عمل', 'خلية حيوانية'] }),
  m('med_1am_p92_05', 'مراحل التحضير المجهري لخلايا بطانة الفم (الخطوات 1 إلى 6)', 'تجربة', 'p92_fig05_8f098421e545.jpg', 92, 'كشط باطن الخد ← فرد ← تلوين بأزرق الميثيلين ← غطاء الشريحة ← الفحص المجهري.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedActivityId: 'act_1am_9_1_1_1', relatedExperimentId: 'exp_1am_18_animal_cell', relatedWorksheetId: 'ws_1am_p92_93', tags: ['بروتوكول', 'تحضير مجهري'] }),
  m('med_1am_p92_06', 'صورة مجهرية لخلايا لب الكلية عند الإنسان (ص 92)', 'صورة', 'p92_fig06_d36640780a70.jpg', 92, 'ملاحظة مجهرية إضافية للخلايا الحيوانية.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedWorksheetId: 'ws_1am_p92_93', tags: ['خلايا حيوانية'] }),
  m('med_1am_p92_07', 'صورة مجهرية لخلايا البنكرياس للإنسان (ص 92)', 'صورة', 'p92_fig07_1e5a0ed6bfa5.jpg', 92, 'مقارنة أشكال الخلايا الحيوانية.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedWorksheetId: 'ws_1am_p92_93', tags: ['خلايا حيوانية'] }),
  m('med_1am_p93_01', 'صورة مجهرية لبشرة حرشفة البصل (تكبير ضعيف 52x)', 'صورة', 'p93_fig01_37624c91ee44.jpg', 93, 'انتظام الخلايا النباتية المضلعة.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedActivityId: 'act_1am_9_1_1_2', relatedExperimentId: 'exp_1am_19_plant_cell', relatedWorksheetId: 'ws_1am_p92_93', tags: ['بصل', 'خلية نباتية'] }),
  m('med_1am_p93_02', 'صورة مجهرية لخلية نباتية مكبرة (650x) ملونة بالأحمر المعتدل', 'صورة', 'p93_fig02_e684abe313d5.jpg', 93, 'وضوح الفجوة العصارية والجدار السيليلوزي والنواة.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedActivityId: 'act_1am_9_1_1_2', relatedExperimentId: 'exp_1am_19_plant_cell', relatedWorksheetId: 'ws_1am_p92_93', tags: ['خلية نباتية', 'أحمر معتدل'] }),
  m('med_1am_p93_03', 'مراحل تحضير بشرة البصل ورسم بيانات الخلية النباتية (1–5)', 'تجربة', 'p93_fig03_44239163a9db.jpg', 93, 'نزع بشرة البصل وتلوينها بالأحمر المعتدل وفحصها.', { memoNumber: '27', relatedLessonId: 'lu_1am_9_1_1', relatedActivityId: 'act_1am_9_1_1_2', relatedExperimentId: 'exp_1am_19_plant_cell', relatedWorksheetId: 'ws_1am_p92_93', tags: ['بصل', 'بروتوكول'] }),

  // ─── الملاحق: أدوات المختبر (ص 94–96) ورموز السلامة (ص 97) ───────────────
  m('med_1am_p94_lab1', 'ملحق أدوات المختبر — الصفحة 94 (الزجاجيات وأدوات القياس)', 'أداة مخبر', 'p94_lab_tools_1.png', 94, 'طبق بتري، قمع زجاجي، زجاجة ساعة، مخبار مدرج، كأس زجاجية، دورق، أنابيب اختبار، ماسك وحامل وفرشاة وسدادات.', { relatedWorksheetId: 'ws_1am_p94_96', tags: ['أدوات المختبر', 'زجاجيات'] }),
  m('med_1am_p95_lab2', 'ملحق أدوات المختبر — الصفحة 95 (أدوات التسخين والقياس والمناولة)', 'أداة مخبر', 'p95_lab_tools_2.png', 95, 'شبكة تسخين، قطارة، ملعقة، ساق زجاجية، سحاحة، محرار، حامل معدني، موقد بنزن، سخان كهربائي، مدق (هاون)، قادح لهب.', { relatedWorksheetId: 'ws_1am_p94_96', tags: ['أدوات المختبر', 'تسخين'] }),
  m('med_1am_p96_lab3', 'ملحق أدوات المختبر — الصفحة 96 (المجهر وأدوات التشريح والقياس)', 'أداة مخبر', 'p96_lab_tools_3.png', 96, 'شريحة وغطاء، عروة زراعة، إبرة تشريح، ميزان رقمي، مشرط، ملقط، مجهر ضوئي مركب.', { relatedWorksheetId: 'ws_1am_p94_96', tags: ['أدوات المختبر', 'مجهر'] }),
  m('med_1am_p97_safety', 'ملحق رموز السلامة في المختبر الكامل (الصفحة 97)', 'وثيقة', 'p97_safety_symbols.png', 97, 'جدول رموز السلامة (11 صفاً + 5 تنبيهات سفلية): المخاطر والأمثلة والاحتياطات والعلاج.', { relatedWorksheetId: 'ws_1am_p97', tags: ['السلامة المخبرية', 'رموز'] }),
];
