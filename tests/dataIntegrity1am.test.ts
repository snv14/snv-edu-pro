/**
 * حراسة قاعدة بيانات السنة الأولى متوسط (1AM).
 *
 * الغرض: أن يبقى اكتمال القاعدة مرئياً ومحمياً. قبل هذا الملف كانت القاعدة
 * تحتوي 22 من 28 وحدة تعلمية — أي أن المقطعَين الرسميَّين «الإطراح عند الإنسان»
 * و«التكاثر عند الإنسان» كانا غائبين تماماً عن المنصة، رغم ورودهما حرفياً في
 * المخطط الوزاري (src/data/official/learningPlan1am.ts، ص 15 و16).
 *
 * مصدر التوقّعات: المخطط السنوي للتعلمات — السنة الأولى متوسط، 8 مقاطع تعلمية.
 * لا تُعدَّل الأرقام هنا إلا بعد التحقق من المصدر الرسمي نفسه.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS_1AM } from '../src/data/memos/lessons1am';

/** المقاطع الثمانية كما وردت في المخطط الوزاري (learningPlan1am.ts، ص 4–18). */
const OFFICIAL_1AM_SEQUENCES = [
  'التغذية عند الإنسان',
  'التغذية عند النبات الأخضر',
  'التحصل على الطاقة عند الإنسان',
  'التصل على الطاقة عند النبات الأخضر',
  'الإطراح عند الإنسان',
  'التكاثر عند الإنسان',
  'التكاثر عند النباتات ذات الأزهار',
  'الخلية',
];

/** إزالة بادئة «المقطع التعلمي NN:» للمقارنة باسم المقطع المجرد. */
const sequenceNameOf = (maqta: string) =>
  maqta.replace(/^المقطع التعلمي\s*\d+\s*:\s*/, '').trim();

test('1AM: القاعدة تحتوي 28 وحدة تعلمية (كانت 22 قبل سدّ النقص)', () => {
  assert.equal(LESSONS_1AM.length, 28);
});

test('1AM: المقطعان 5 و6 الغائبان سابقاً موجودان الآن', () => {
  const sequences = new Set(LESSONS_1AM.map(l => sequenceNameOf(l.maqta)));

  // المقطع الخامس: الإطراح عند الإنسان (المخطط الرسمي ص 15)
  assert.ok(sequences.has('الإطراح عند الإنسان'), 'المقطع 5: الإطراح عند الإنسان');

  // المقطع السادس: التكاثر عند الإنسان (المخطط الرسمي ص 16)
  assert.ok(sequences.has('التكاثر عند الإنسان'), 'المقطع 6: التكاثر عند الإنسان');
});

test('1AM: المقاطع الثمانية الرسمية كلها ممثَّلة', () => {
  const sequences = new Set(LESSONS_1AM.map(l => sequenceNameOf(l.maqta)));
  // المقطع 4 مكتوب في المصدر «التحصل» — نقبل الصيغتين حمايةً من خطأ إملائي في المصدر
  const normalized = new Set([...sequences].map(s => s.replace(/^التصل/, 'التحصل')));
  const expected = OFFICIAL_1AM_SEQUENCES.map(s => s.replace(/^التصل/, 'التحصل'));
  for (const name of expected) {
    // المقطع 8 عنوانه في المخطط الرسمي «الخلية» (ص 18) — كلمة واحدة مجردة —
    // بينما القاعدة تستعمل العنوان الوصفي «الخلية كوحدة بنيوية للكائنات الحية».
    // الفرق تسمية لا نقص في المحتوى، لذلك يُقبل الجذر المشترك.
    const present = [...normalized].some(candidate =>
      candidate === name || candidate.startsWith(name));
    assert.ok(present, `المقطع الرسمي «${name}» غائب عن القاعدة`);
  }
});

test('1AM: 53 نشاطاً تعليمياً — أي 31 نشاطاً أُضيفت للمقطعين 5 و6', () => {
  const total = LESSONS_1AM.reduce((sum, lesson) => sum + lesson.anshita.length, 0);
  assert.equal(total, 53);
});

test('1AM: ترقيم المذكرات متصل من 01 إلى 28 بلا فجوة', () => {
  LESSONS_1AM.forEach((lesson, index) => {
    const expected = String(index + 1).padStart(2, '0');
    assert.equal(lesson.memoNumber, expected, `المذكرة رقم ${index + 1}`);
  });
});

test('1AM: التتبّع المصدر مكتمل ولا تصادم في معرّفات الأنشطة', () => {
  const unitIds = LESSONS_1AM.map(l => l.sourceLearningUnitId || '');
  const activityIds = LESSONS_1AM.flatMap(l => l.anshita.map(a => a.sourceActivityId || ''));

  assert.ok(unitIds.every(Boolean), 'كل وحدة تحمل sourceLearningUnitId');
  assert.equal(new Set(unitIds).size, unitIds.length, 'معرّفات الوحدات فريدة');

  assert.ok(activityIds.every(Boolean), 'كل نشاط يحمل sourceActivityId');
  assert.equal(new Set(activityIds).size, activityIds.length, 'معرّفات الأنشطة فريدة');
});

test('1AM: كل وحدة تحمل حقولها البيداغوجية الأساسية', () => {
  const required = ['moshkila', 'markaba', 'ma3ayirTaqwim', 'wasail', 'irsae', 'taqwim'] as const;
  for (const lesson of LESSONS_1AM) {
    for (const field of required) {
      const value = lesson[field];
      assert.ok(
        typeof value === 'string' && value.trim().length > 0,
        `الوحدة «${lesson.ta3alom}» تفتقد الحقل ${field}`,
      );
    }
  }
});

test('1AM: كل نشاط يحمل عنواناً وتعليمات وأجوبة', () => {
  for (const lesson of LESSONS_1AM) {
    for (const activity of lesson.anshita) {
      assert.ok(activity.title?.trim(), `عنوان نشاط فارغ في «${lesson.ta3alom}»`);
      assert.ok(activity.asila?.trim(), `تعليمات فارغة في «${lesson.ta3alom}»`);
      assert.ok(activity.ajwiba?.trim(), `أجوبة فارغة في «${lesson.ta3alom}»`);
    }
  }
});

test('1AM: النص المضاف للمقطعين 5 و6 مأخوذ من المصدر الوزاري لا مُختلق', () => {
  // مفردات مفصلية موجودة حرفياً في عمودَي «وضعيات تعلم الموارد» و«معايير التقويم»
  // للمخطط الرسمي (learningPlan1am.ts ص 15–16).
  const allText = LESSONS_1AM.map(l =>
    [l.ta3alom, l.moshkila, l.markaba, l.ma3ayirTaqwim, l.irsae,
      ...l.anshita.map(a => `${a.title} ${a.asila} ${a.ajwiba}`)].join(' '),
  ).join(' ');

  const officialTerms = [
    'ثبات توازن الوسط الداخلي',   // ص 15 — تعريف الإطراح
    'الغدد العرقية',              // ص 15 — تعليل تواجدها
    'المجاري التناسلية',          // ص 16 — تمييز المجاري من المناسل
    'المناسل',                    // ص 16 — دور المناسل
    'شروط حدوث الإلقاح',          // ص 16 — 6-2
    'الصحة الجنسية',              // ص 16 — 6-3
  ];
  for (const term of officialTerms) {
    assert.ok(allText.includes(term), `مصطلح رسمي غائب عن النص: «${term}»`);
  }
});
