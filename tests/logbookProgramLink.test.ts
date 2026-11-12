/**
 * اختبارات اقتران قاعدة بيانات الدفتر بجدول التدرج السنوي الرسمي.
 *
 * أغلى ما يُقفل هنا **حارس عدم الاختراع** (الاختبار الأخير): كل «تقويم» وكل
 * «مشكلة» تظهر في حصة مولَّدة يجب أن تكون إما نصاً وزارياً موجوداً حرفياً في
 * قاعدة الدفتر، أو أحد الاحتياطيات المعلومة، أو مأخوذاً من نص الحصة نفسه.
 * لا مجال ثالث — أي نصٍّ مُختلَق يُنسب إلى وثيقة رسمية سيسقط هنا.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeResourceTitle,
  segmentNumber,
  resourceTitlesIn,
  linkTitlesToProgram,
  resolveProgramFields,
  progressionProgramCoverage,
} from '../src/utils/logbookProgramLink';
import { LOGBOOK_PROGRAMS, type LogbookLevel } from '../src/data/logbook';
import { buildPedagogicalStepsForLevel } from '../src/utils/dailyLogbookGenerator';
import {
  OFFICIAL_1AM_DISTRIBUTION,
  OFFICIAL_2AM_DISTRIBUTION,
  OFFICIAL_3AM_DISTRIBUTION,
  OFFICIAL_4AM_DISTRIBUTION,
} from '../src/data/curriculum/officialAnnualDistributionData';

const PROGRAM_LEVELS: LogbookLevel[] = ['1am', '2am', '3am', '4am'];
const LOG_LEVELS = ['1م', '2م', '3م', '4م'] as const;
const DISTRIBUTIONS: Record<LogbookLevel, typeof OFFICIAL_1AM_DISTRIBUTION> = {
  '1am': OFFICIAL_1AM_DISTRIBUTION,
  '2am': OFFICIAL_2AM_DISTRIBUTION,
  '3am': OFFICIAL_3AM_DISTRIBUTION,
  '4am': OFFICIAL_4AM_DISTRIBUTION,
};

/** مفتاح المستوى في قاعدة البرامج ← مفتاحه في المولّد. */
const LOG_OF: Record<LogbookLevel, '1م' | '2م' | '3م' | '4م'> = {
  '1am': '1م', '2am': '2م', '3am': '3م', '4am': '4م',
};

/**
 * المقارنة بمسافات موحَّدة: `agreedField` في الرابط يوحّد المسافات قبل الإرجاع،
 * فبدون هذا التطبيع يسقط التطابق على نصوص المصدر السليمة.
 */
const collapse = (v: unknown): string => String(v ?? '').replace(/\s+/g, ' ').trim();

/** الاحتياطيات المعلومة في المولّد — كل ما ليس نصاً وزارياً يجب أن يكون منها. */
const FALLBACK_TAQWIM = new Set([
  'تقويم تكويني ومتابعة الإنجاز',
  'تقويم تشخيصي وتكويني لمعرفة مدى التحكم في التعلمات واستدراك الصعوبات.',
]);

// ───────────────────────────────────────────────────────────────── التطبيع
test('التطبيع يجعل تصنيفَي الوثيقتين قابلين للمقارنة', () => {
  // المخطط السنوي يجمّع، والتدرج البيداغوجي يفصل — والبوادئ والترقيم تختلف
  assert.equal(
    normalizeResourceTitle('المورد 1: خصائص الوسط الحي'),
    normalizeResourceTitle('المورد التعلمي 1: خصائص الوسط الحي'),
  );
  assert.equal(
    normalizeResourceTitle('المقطع الأول: الوسط الحي'),
    normalizeResourceTitle('المقطع التعلمي 01: الوسط الحي'),
  );
  assert.equal(normalizeResourceTitle('01-الزلازل ظاهرة طبيعية'), 'الزلازل ظاهرة طبيعية');
  assert.equal(normalizeResourceTitle('تعلم مورد 1-1: مصدر الأغذية'), 'مصدر الأغذية');
  assert.equal(normalizeResourceTitle('المورد التعلمي 2-4: هجرة الجراد'), 'هجرة الجراد');
});

test('التطبيع يزيل التشكيل وضوابط الاتجاه وعلامات الترقيم ولا يغير الكلمة', () => {
  assert.equal(normalizeResourceTitle('المَورِدُ التعلميُّ 03: تأثيرُ العواملِ'), 'تأثير العوامل');
  assert.equal(normalizeResourceTitle('التربة، ثروة طبيعية هشة'), 'التربة ثروة طبيعية هشة');
  assert.equal(normalizeResourceTitle('\u200fالتغذية عند الإنسان\u200f'), 'التغذية عند الإنسان');
  assert.equal(normalizeResourceTitle(''), '');
  assert.equal(normalizeResourceTitle('المورد   5:   مكانة   الإنسان'), 'مكانة الإنسان');
});

test('رقم المقطع يُستخرج من الصيغ الثلاث المستعملة في المنصة', () => {
  assert.equal(segmentNumber('المقطع الأول: الوسط الحي'), '01');
  assert.equal(segmentNumber('المقطع التعلمي 01: الوسط الحي'), '01');
  assert.equal(segmentNumber('1- الديناميكية الداخلية للكرة الأرضية'), '01');
  assert.equal(segmentNumber('المقطع الخامس: المستحاثات'), '05');
  assert.equal(segmentNumber('المقطع التعلمي 08: وحدة بناء الكائنات الحية'), '08');
  assert.equal(segmentNumber('أسبوع الاستقبال: التعارف والصحة المدرسية'), '');
});

test('استخلاص عناوين الموارد: يقسّم المركّب ويستبعد ما ليس موردَ تعلم', () => {
  assert.deepEqual(
    resourceTitlesIn('المورد 1: خصائص الوسط الحي / المورد 2: العلاقات القائمة بين العناصر الحية في الوسط الحي'),
    ['خصائص الوسط الحي', 'العلاقات القائمة بين العناصر الحية في الوسط الحي'],
  );
  assert.deepEqual(resourceTitlesIn('01-تحولات الأغذية خلال الهضم'), ['تحولات الأغذية خلال الهضم']);
  // أسابيع الإدماج والمعالجة والاختبارات والعطل والتعارف ليست مواردَ تعلم
  for (const notResource of [
    'إدماج كلي', 'معالجة بيداغوجية', 'تصحيح الاختبارات', 'عطلة الشتاء',
    'تعارف وتوجيهات حول الصحة المدرسية', 'وضعية الانطلاق', 'مراجعة التعلمات',
  ]) {
    assert.deepEqual(resourceTitlesIn(notResource), [], `«${notResource}» ليس مورد تعلم`);
  }
  assert.deepEqual(resourceTitlesIn(''), []);
});

// ───────────────────────────────────────────────────────────────── الربط
test('الربط يحصر البحث في المقطع نفسه ويرجّح «تعلم مورد» الأدق على «المورد التعلمي»', () => {
  const program = LOGBOOK_PROGRAMS['2am'];
  const link = linkTitlesToProgram(['التفاعلات بين العناصر الحية في الوسط الحي'], program, 'المقطع الأول: الوسط الحي');
  assert.ok(link, 'وُجد ربط');
  assert.equal(link.units.length, 1);
  assert.equal(link.unique, true);
  // العنوان نفسه موجود كـ«تعلم مورد 01» لا كـ«مورد تعلمي»، فالحقل الأدق هو المطابق
  assert.equal(link.units[0].ta3alom, 'تعلم مورد 01: التفاعلات بين العناصر الحية في الوسط الحي');
});

test('حل الحقول يعيد النص الوزاري حرفياً مع معرف الوحدة للمساءلة', () => {
  const got = resolveProgramFields(
    'المورد 3: تأثير العوامل الفيزيوكيميائية على توزع الكائنات الحية ونشاطها',
    'المقطع الأول: الوسط الحي',
    '2am',
    'المورد 3: تأثير العوامل الفيزيوكيميائية على توزع الكائنات الحية ونشاطها\nالنشاط 1: أميز العوامل المناخية',
  );
  assert.equal(got.unique, true);
  assert.deepEqual(got.sourceLearningUnitIds, ['program_2am_unit_05']);
  const unit = LOGBOOK_PROGRAMS['2am'].find((u) => u.sourceLearningUnitId === 'program_2am_unit_05')!;
  assert.equal(got.moshkila, unit.moshkila, 'المشكلة نص الوحدة حرفياً');
  assert.equal(got.taqwim, unit.taqwim, 'التقويم نص الوحدة حرفياً');
  assert.equal(got.ta3alom, unit.ta3alom);
});

test('عند التعدد لا تُختار وحدة: يُؤخذ الحقل فقط إن اتفقت عليه الوحدات كلها', () => {
  // س3 «01-الزلازل ظاهرة طبيعية» مورد مجمَّع يقابله أربع وحدات في التدرج البيداغوجي
  const got = resolveProgramFields(
    '01-الزلازل ظاهرة طبيعية',
    '1- الديناميكية الداخلية للكرة الأرضية',
    '3am',
  );
  assert.equal(got.unique, false);
  assert.ok(got.sourceLearningUnitIds.length > 1, 'الوحدات المطابقة مُبلَّغ عنها كلها');
  const units = LOGBOOK_PROGRAMS['3am'].filter((u) =>
    got.sourceLearningUnitIds.includes(u.sourceLearningUnitId));
  // كل حقل أعاده الرابط يجب أن تتطابق عليه الوحدات كلها — وإلا لما أعاده
  for (const field of ['ta3alom', 'moshkila', 'taqwim'] as const) {
    const value = got[field];
    if (!value) continue;
    const distinct = new Set(units.map((u) => String(u[field] || '').trim()).filter(Boolean));
    assert.equal(distinct.size, 1, `${field} متفَق عليه، فلم يُختر من وحدة واحدة`);
    assert.equal(value, [...distinct][0]);
  }
});

test('ما لا يطابق شيئاً يُعيد ربطاً فارغاً فيبقى السلوك السابق', () => {
  const got = resolveProgramFields('إدماج كلي', 'المقطع الثالث: التكاثر وإعمار الأوساط', '2am');
  assert.deepEqual(got.sourceLearningUnitIds, []);
  assert.equal(got.ta3alom, undefined);
  assert.equal(got.moshkila, undefined);
  assert.equal(got.taqwim, undefined);
});

// ─────────────────────────────────────────────────────────────── التغطية
test('تغطية الربط مقفلة بالأعداد المقاسة — لا تتحسن ولا تسوء صامتةً', () => {
  const expected: Record<LogbookLevel, [number, number, number, number]> = {
    // titles, unique, ambiguous, unlinked
    '1am': [18, 6, 7, 5],
    '2am': [32, 9, 6, 17],
    '3am': [23, 7, 7, 9],
    '4am': [26, 5, 5, 16],
  };
  for (const lv of PROGRAM_LEVELS) {
    const c = progressionProgramCoverage(lv);
    assert.deepEqual(
      [c.titles, c.unique, c.ambiguous, c.unlinked],
      expected[lv],
      `تغطية ${lv} — أي تغيير هنا يعني أن عنواناً ربط أو انفك، فليكن مقصوداً وموثقاً`,
    );
    assert.equal(c.titles, c.unique + c.ambiguous + c.unlinked, 'العدّ شامل');
    assert.ok(c.unlinkedSamples.length <= 6, 'الأمثلة للتقرير فلا تُغرق السجل');
  }
});

// ─────────────────────────────────────────── الأثر على المولّد (عدم الاختراع)
test('عدد الخطوات لم يتغير بالربط — الترتيب الزمني للتدرج خط أحمر', () => {
  const counts: Record<string, number> = {};
  for (const lv of LOG_LEVELS) counts[lv] = buildPedagogicalStepsForLevel(lv).length;
  assert.deepEqual(counts, { '1م': 58, '2م': 66, '3م': 64, '4م': 64 });
});

test('حارس عدم الاختلاق: كل تقويم مولَّد نص وزاري أو احتياطي معلوم', () => {
  for (const lv of PROGRAM_LEVELS) {
    const official = new Set(
      LOGBOOK_PROGRAMS[lv].map((u) => String(u.taqwim || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
    );
    const fromRows = new Set(
      DISTRIBUTIONS[lv].map((r: any) => String(r.taqwim || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
    );
    const logLv = lv === '1am' ? '1م' : lv === '2am' ? '2م' : lv === '3am' ? '3م' : '4م';
    for (const step of buildPedagogicalStepsForLevel(logLv)) {
      const value = String(step.taqwim || '').replace(/\s+/g, ' ').trim();
      if (!value) continue;
      const allowed = official.has(value) || fromRows.has(value) || FALLBACK_TAQWIM.has(value);
      assert.ok(allowed, `${lv}: تقويم ليس من المصدر ولا من الاحتياطيات — «${value.slice(0, 70)}»`);
    }
  }
});

test('حارس عدم الاختلاق: كل مشكلة مولَّدة نص وزاري أو مقتبسة من نص الحصة', () => {
  for (const lv of PROGRAM_LEVELS) {
    const official = new Set(
      LOGBOOK_PROGRAMS[lv].map((u) => String(u.moshkila || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
    );
    const sessions = DISTRIBUTIONS[lv].flatMap((r: any) => [r.session1, r.session2]
      .map((s: string) => String(s || '')));
    const logLv = lv === '1am' ? '1م' : lv === '2am' ? '2م' : lv === '3am' ? '3م' : '4م';
    let linked = 0;
    for (const step of buildPedagogicalStepsForLevel(logLv)) {
      const value = String(step.moshkila || '').replace(/\s+/g, ' ').trim();
      if (!value) continue;
      if (official.has(value)) { linked++; continue; }
      // وإلا فلا بد أن نص الحصة نفسه ذكر «المشكلة» — وإلا فهي مُختلَعة
      assert.ok(
        sessions.some((s) => /المشكلة/.test(s) && value.length > 3 && s.includes(value.slice(0, 12))),
        `${lv}: مشكلة ليست من المصدر ولا من نص الحصة — «${value.slice(0, 70)}»`,
      );
    }
    assert.ok(linked > 0, `${lv}: الربط أثمر مشكلات رسمية فعلاً`);
  }
});

test('حارس عدم الاختلاق: «تعلم مورد» المولَّد من المصدر أو من صف التدرج نفسه', () => {
  // ثابتا المولّد: احتياطي الحقل، ونص المحطة الختامية للإدماج والمعالجة
  const GENERATOR_CONSTANTS = new Set([
    'تعلم المورد',
    'تثبيت المكتسبات ومعالجة الصعوبات المسجلة أثناء التعلمات.',
  ]);
  for (const lv of PROGRAM_LEVELS) {
    const official = new Set(
      LOGBOOK_PROGRAMS[lv].map((u) => collapse(u.ta3alom)).filter(Boolean),
    );
    const fromRows = new Set<string>();
    for (const r of DISTRIBUTIONS[lv] as any[]) {
      for (const f of [r.learningUnit, r.mawrid]) {
        const v = collapse(f);
        if (v) fromRows.add(v);
      }
    }
    for (const step of buildPedagogicalStepsForLevel(LOG_OF[lv])) {
      const value = collapse(step.ta3alom);
      if (!value || GENERATOR_CONSTANTS.has(value)) continue;
      assert.ok(
        official.has(value) || fromRows.has(value),
        `${lv}: «تعلم مورد» ليس من المصدر ولا من صف التدرج — «${value.slice(0, 70)}»`,
      );
    }
  }
});

test('الربط أثمر فعلاً: تركيب الحقول في 252 حصة مولَّدة', () => {
  const GENERIC = 'تقويم تكويني ومتابعة الإنجاز';
  const FINAL_REVIEW = 'تقويم تشخيصي وتكويني لمعرفة مدى التحكم في التعلمات واستدراك الصعوبات.';
  const totals = {
    steps: 0, taqwimFromDb: 0, taqwimFromRow: 0, taqwimGeneric: 0, taqwimFinalReview: 0,
    moshkilaFromDb: 0, ta3alomFromDb: 0,
  };
  for (const lv of PROGRAM_LEVELS) {
    const dbT = new Set(LOGBOOK_PROGRAMS[lv].map((u) => collapse(u.taqwim)).filter(Boolean));
    const dbM = new Set(LOGBOOK_PROGRAMS[lv].map((u) => collapse(u.moshkila)).filter(Boolean));
    const dbA = new Set(LOGBOOK_PROGRAMS[lv].map((u) => collapse(u.ta3alom)).filter(Boolean));
    const rowT = new Set((DISTRIBUTIONS[lv] as any[]).map((r) => collapse(r.taqwim)).filter(Boolean));
    for (const step of buildPedagogicalStepsForLevel(LOG_OF[lv])) {
      totals.steps++;
      const t = collapse(step.taqwim);
      if (t === FINAL_REVIEW) totals.taqwimFinalReview++;
      else if (dbT.has(t)) totals.taqwimFromDb++;
      else if (rowT.has(t)) totals.taqwimFromRow++;
      else {
        assert.equal(t, GENERIC, `${lv}: تقويم ليس من مصدر ولا احتياطي — «${t.slice(0, 60)}»`);
        totals.taqwimGeneric++;
      }
      if (dbM.has(collapse(step.moshkila))) totals.moshkilaFromDb++;
      if (dbA.has(collapse(step.ta3alom))) totals.ta3alomFromDb++;
    }
  }
  assert.deepEqual(totals, {
    steps: 252,
    // قبل الربط كان هذا صفراً في المستويات الأربعة: كل حصة تأخذ النص العام
    taqwimFromDb: 40,
    // س1 وحدها تحمل تقويماً في صفوف تدرجها، وهو يتقدم على الربط لأنه نص وثيقتها
    taqwimFromRow: 36,
    taqwimGeneric: 168,
    taqwimFinalReview: 8,
    // المشكلة كانت فارغة دائماً قبل الربط
    moshkilaFromDb: 60,
    ta3alomFromDb: 54,
  });
  assert.equal(
    totals.taqwimFromDb + totals.taqwimFromRow + totals.taqwimGeneric + totals.taqwimFinalReview,
    totals.steps,
    'التركيب شامل: كل حصة محسوبة مرة واحدة',
  );
});

test('س2/س3/س4 لا تحمل تقويماً في صفوفها، فكل تقويم رسمي فيها من قاعدة الدفتر', () => {
  for (const lv of ['2am', '3am', '4am'] as LogbookLevel[]) {
    const fromRows = (DISTRIBUTIONS[lv] as any[]).filter((r) => collapse(r.taqwim));
    assert.equal(fromRows.length, 0, `${lv}: صفوف التدرج بلا حقل تقويم`);
    const dbT = new Set(LOGBOOK_PROGRAMS[lv].map((u) => collapse(u.taqwim)).filter(Boolean));
    const linked = buildPedagogicalStepsForLevel(LOG_OF[lv])
      .filter((s) => dbT.has(collapse(s.taqwim))).length;
    assert.ok(linked >= 10, `${lv}: ${linked} حصة أخذت تقويمها الوزاري من الربط`);
  }
});
