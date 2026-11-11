import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIAGRAM_ACTIVITY_BINDINGS_1AM,
  attachDiagrams1am,
  buildActivityDiagram,
  diagramCoverage1am,
  diagramKeysForActivityId,
  diagramTitleOf,
  diagramsForActivity,
  mergeOfficialDiagrams1am,
  normalizeActivityTitle,
  toHtmlSvg,
} from '../src/data/memos/diagrams1amAttach';
import { DIAGRAMS_1AM } from '../src/data/memos/diagrams1am';
import { DIAGRAM_SOURCES_1AM } from '../src/data/memos/diagramSources1am';
import { LESSONS_1AM, RAW_LESSONS_1AM } from '../src/data/memos/lessons1am';
import { LESSONS_2AM } from '../src/data/memos/lessons2am';
import { LESSONS_3AM } from '../src/data/memos/lessons3am';
import { memoDiagramList, activityLevelDiagrams, lessonLevelDiagrams } from '../src/utils/memoDiagrams';

const lessons1am = LESSONS_1AM as any[];
const rawLessons1am = RAW_LESSONS_1AM as any[];
const diagramKeys = Object.keys(DIAGRAMS_1AM as Record<string, string>);

/** كل الأنشطة التي صارت تحمل رسومات، مع مذكرة صاحبها. */
function boundActivities() {
  const rows: { memo: any; activity: any }[] = [];
  for (const memo of lessons1am) {
    for (const activity of memo.anshita ?? []) {
      if (Array.isArray(activity.diagrams) && activity.diagrams.length > 0) rows.push({ memo, activity });
    }
  }
  return rows;
}

test('تطبيع العناوين يجعل صيغة القاعدة مطابقة لصيغة خريطة المصدر', () => {
  assert.equal(
    normalizeActivityTitle('النشاط 01: التعرف على مصدر الأغذية'),
    normalizeActivityTitle('نشاط 01: التعرف على مصدر الأغذية'),
  );
  assert.equal(normalizeActivityTitle('  النَّشاط   02:  تصنيفُ  الأغذية  '), 'نشاط 02: تصنيف الأغذية');
  assert.equal(normalizeActivityTitle(''), '');
});

test('جدول الربط لا يشير إلى معرّف غير موجود ولا إلى رسم غير موجود', () => {
  const coverage = diagramCoverage1am(lessons1am);
  assert.deepEqual(coverage.missingActivityIds, [], 'كل معرّف معلن يجب أن يوجد في قاعدة س1');

  const knownIds = new Set<string>();
  for (const memo of rawLessons1am) {
    for (const activity of memo.anshita ?? []) knownIds.add(String(activity.sourceActivityId));
  }
  for (const [key, ids] of Object.entries(DIAGRAM_ACTIVITY_BINDINGS_1AM)) {
    assert.ok((DIAGRAMS_1AM as any)[key], `الرسم ${key} غير موجود في DIAGRAMS_1AM`);
    for (const id of ids) assert.ok(knownIds.has(id), `المعرّف ${id} (لرسم ${key}) غير موجود في القاعدة`);
  }
});

test('التغطية: 16 مذكرة من 22 و27 نشاطًا من 43 و10 رسومات من 11', () => {
  const coverage = diagramCoverage1am(lessons1am);
  assert.equal(coverage.memos, 22);
  assert.equal(coverage.memosWithDiagram, 16);
  assert.equal(coverage.activities, 43);
  assert.equal(coverage.activitiesWithDiagram, 27);
  assert.equal(coverage.diagramKeysUsed, 10);
  assert.equal(coverage.diagramKeysTotal, diagramKeys.length);
  assert.equal(boundActivities().length, 27);
});

test('رسم الإطراح يبقى غير مربوط لعدم وجود نشاط مطابق في قاعدة س1', () => {
  // الإطراح (الجهاز البولي والجلد) ليس وحدة تعلمية في مذكرات س1 الاثنتين والعشرين،
  // وإلحاقه بنشاط تنفسي أو تغذوي نسبة خاطئة للمصدر.
  assert.deepEqual(diagramCoverage1am(lessons1am).unboundDiagramKeys, ['urinarySystem']);
  assert.deepEqual(diagramKeysForActivityId('act_1am_3_1_1_2'), ['humanRespiratory']);
  assert.ok(diagramKeys.includes('urinarySystem'), 'الرسم نفسه يبقى متاحًا في DIAGRAMS_1AM');
});

test('القاعدة الخام لا تُمسّ: النص الرسمي بلا حقل diagrams', () => {
  for (const memo of rawLessons1am) {
    for (const activity of memo.anshita ?? []) {
      assert.equal(activity.diagrams, undefined, `النشاط ${activity.sourceActivityId} في القاعدة الخام تغيّر`);
    }
  }
});

test('النص الرسمي للمذكرات (العنوان والأسئلة والأجوبة والزمن) مطابق تمامًا بعد الإلحاق', () => {
  assert.equal(rawLessons1am.length, lessons1am.length);
  const fields = ['title', 'asila', 'ajwiba', 'zaman', 'mola7adha'];
  for (let i = 0; i < rawLessons1am.length; i += 1) {
    const rawMemo = rawLessons1am[i];
    const memo = lessons1am[i];
    assert.equal(memo.memoNumber, rawMemo.memoNumber);
    assert.equal(memo.mawrid, rawMemo.mawrid);
    assert.equal(memo.moshkila, rawMemo.moshkila);
    assert.equal(memo.irsae, rawMemo.irsae);
    assert.equal(memo.taqwim, rawMemo.taqwim);
    assert.equal((memo.anshita ?? []).length, (rawMemo.anshita ?? []).length);
    for (let j = 0; j < (rawMemo.anshita ?? []).length; j += 1) {
      for (const field of fields) {
        assert.equal(memo.anshita[j][field], rawMemo.anshita[j][field], `${rawMemo.anshita[j].sourceActivityId}.${field}`);
      }
    }
  }
});

test('الإلحاق لا يعدّل المدخل: نسخة جديدة وكائنات الأنشطة الأصلية كما هي', () => {
  const input = JSON.parse(JSON.stringify(rawLessons1am));
  const before = JSON.stringify(input);
  const output = attachDiagrams1am(input);
  assert.notEqual(output, input);
  assert.equal(JSON.stringify(input), before, 'المدخل تغيّر أثناء الإلحاق');
  assert.equal(diagramCoverage1am(output).activitiesWithDiagram, 27);
});

test('كل رسم ملحق يحمل معرّفًا وعنوانًا عربيًا ووسم SVG صالحًا للحقن', () => {
  for (const { activity } of boundActivities()) {
    for (const diagram of activity.diagrams) {
      assert.match(diagram.diagram_id, /^diag_1am_[a-zA-Z]+$/);
      assert.ok(diagram.diagram_title.length > 5, `عنوان ${diagram.diagram_id} قصير`);
      assert.match(diagram.diagram_title, /[\u0600-\u06FF]/, 'العنوان يجب أن يكون عربيًا');
      const svg = diagram.diagram_svg;
      assert.ok(svg.startsWith('<svg'), `${diagram.diagram_id} لا يبدأ بـ <svg`);
      assert.ok(svg.trimEnd().endsWith('</svg>'), `${diagram.diagram_id} لا ينتهي بـ </svg>`);
      assert.ok(svg.includes('viewBox='), `${diagram.diagram_id} بلا viewBox`);
      assert.ok(!svg.includes('className='), `${diagram.diagram_id} ما زال يحمل className (خاصية JSX)`);
      assert.ok(diagram.diagram_source_pages.length > 0, `${diagram.diagram_id} بلا توثيق صفحات المصدر`);
      assert.equal(diagram.diagram_fidelity, 'reconstructed-svg');
    }
  }
});

test('توثيق المصدر: صفحات كل رسم مطابقة لخريطة المصدر', () => {
  for (const key of Object.keys(DIAGRAM_ACTIVITY_BINDINGS_1AM)) {
    const diagram = buildActivityDiagram(key);
    assert.ok(diagram, `تعذر بناء الرسم ${key}`);
    const source = DIAGRAM_SOURCES_1AM[key];
    assert.ok(source, `الرسم ${key} غير موثّق في DIAGRAM_SOURCES_1AM`);
    assert.deepEqual(diagram!.diagram_source_pages, source.sourcePages);
    assert.equal(diagram!.diagram_fidelity, source.fidelity);
  }
});

test('تحويل SVG إلى HTML صالح يستبدل كل className بـ class', () => {
  const raw = String((DIAGRAMS_1AM as any).cellStructure);
  const occurrences = raw.match(/className=/g) ?? [];
  assert.ok(occurrences.length > 0, 'العينة المفحوصة يجب أن تحمل className');
  const html = toHtmlSvg(raw);
  assert.ok(!html.includes('className='));
  assert.equal((html.match(/class=/g) ?? []).length, occurrences.length);
  assert.equal(toHtmlSvg(''), '');
});

test('عنوان الرسم مأخوذ من أول نص عربي داخل الرسم ومميّز لكل مفتاح', () => {
  const titles = new Set<string>();
  for (const key of diagramKeys) {
    const title = diagramTitleOf(key);
    assert.match(title, /[\u0600-\u06FF]/, `عنوان ${key} ليس عربيًا`);
    titles.add(title);
  }
  assert.equal(titles.size, diagramKeys.length, 'عنوانان لرسمين مختلفين');
  assert.equal(diagramTitleOf('مفتاح_غير_موجود'), 'مفتاح_غير_موجود');
});

test('كل نشاط مربوط يستقبل رسمه حسب معرّفه، وغير المربوط لا يستقبل شيئًا', () => {
  for (const [key, ids] of Object.entries(DIAGRAM_ACTIVITY_BINDINGS_1AM)) {
    for (const id of ids) {
      const diagrams = diagramsForActivity({ sourceActivityId: id, title: 'عنوان' });
      assert.ok(diagrams.some((diagram) => diagram.diagram_id === `diag_1am_${key}`), `${id} ← ${key}`);
    }
  }
  assert.deepEqual(diagramsForActivity({ sourceActivityId: 'act_1am_9_9_9_9', title: 'نشاط غير مربوط' }), []);
  assert.deepEqual(diagramsForActivity({}), []);
});

test('القارئ الموحّد يقرأ الشكلين: مستوى المذكرة ومستوى النشاط', () => {
  // مستوى النشاط (شكل قاعدة البيانات كما في س1 وس2/س3/س4)
  assert.equal(activityLevelDiagrams(lessons1am[0]).length, 2, 'نشاطا المذكرة 01 يحملان الرسم');
  assert.deepEqual(lessonLevelDiagrams(lessons1am[0]), [], 'س1 لا تحمل رسومات على مستوى المذكرة');
  assert.equal(memoDiagramList(lessons1am[0]).length, 1, 'الرسم نفسه في نشاطين يُعرض مرة واحدة');

  // مستوى المذكرة ({title, svg})
  const lessonShaped = { diagrams: [{ title: 'رسم أ', svg: '<svg id="a"></svg>' }] };
  const fromLesson = memoDiagramList(lessonShaped);
  assert.equal(fromLesson.length, 1);
  assert.equal(fromLesson[0].title, 'رسم أ');
  assert.equal(fromLesson[0].svg, '<svg id="a"></svg>');

  // الحقول المفردة القديمة
  const legacy = { diagramTitle: 'رسم قديم', diagramSvg: '<svg id="legacy"></svg>' };
  assert.equal(memoDiagramList(legacy).length, 1);
  assert.equal(memoDiagramList(legacy)[0].svg, '<svg id="legacy"></svg>');
  assert.equal(memoDiagramList({ diagram: '<svg id="string"></svg>' })[0].svg, '<svg id="string"></svg>');
  assert.deepEqual(memoDiagramList(null), []);
  assert.deepEqual(memoDiagramList({}), []);
});

test('القارئ الموحّد يمرّر توثيق المصدر ويزيل المكرر حسب العنوان', () => {
  const memo = lessons1am.find((item) => item.memoNumber === '01');
  const merged = memoDiagramList(memo);
  assert.equal(merged.length, 1);
  const diagram = merged[0];
  assert.ok(diagram.title && diagram.title.length > 5);
  assert.ok(diagram.svg && diagram.svg.startsWith('<svg'));
  assert.equal(diagram.fidelity, 'reconstructed-svg');
  assert.deepEqual(diagram.sourcePages, DIAGRAM_SOURCES_1AM.foodClassification.sourcePages);

  const duplicated = {
    diagrams: [{ title: 'رسم مكرر', svg: '<svg id="a"></svg>' }],
    anshita: [
      { title: 'نشاط', diagrams: [{ diagram_id: 'x', diagram_title: 'رسم مكرر', diagram_svg: '<svg id="b"></svg>' }] },
    ],
  };
  assert.equal(memoDiagramList(duplicated).length, 1);
});

test('16 مذكرة س1 تعرض رسمًا، والست الباقية معروفة ومبرَّرة', () => {
  const withDiagrams = lessons1am.filter((memo) => memoDiagramList(memo).length > 0);
  assert.equal(withDiagrams.length, 16);
  assert.equal(
    lessons1am.reduce((total, memo) => total + memoDiagramList(memo).length, 0),
    16,
  );
  // مذكرات بلا رسم: 05 (سوء التغذية)، 09 (البيوت البلاستيكية)، 13 (الخميرة والتخمر)،
  // 14 (العوامل المضرة والقواعد الصحية)، 15 و16 (المبادلات الغازية عند النبات).
  const without = lessons1am.filter((memo) => memoDiagramList(memo).length === 0).map((memo) => memo.memoNumber);
  assert.deepEqual(without, ['05', '09', '13', '14', '15', '16']);
});

test('المستويات الأخرى تبقى مقروءة عبر القارئ الموحّد', () => {
  const count2 = (LESSONS_2AM as any[]).filter((memo) => memoDiagramList(memo).length > 0).length;
  const count3 = (LESSONS_3AM as any[]).filter((memo) => memoDiagramList(memo).length > 0).length;
  assert.ok(count2 > 0, 'س2 فقدت رسوماتها');
  assert.ok(count3 > 0, 'س3 فقدت رسوماتها');
  // رسم من س2 يبقى بشكل قاعدة البيانات (diagram_title / diagram_svg)
  const memo2 = (LESSONS_2AM as any[]).find((item) => memoDiagramList(item).length > 0);
  const first = memoDiagramList(memo2)[0];
  assert.ok(first.title && first.svg);
});

test('إثراء النسخ المحفوظة يحافظ على تعديلات الأستاذ ولا يكرر الرسومات', () => {
  const stored = JSON.parse(JSON.stringify(rawLessons1am));
  stored[0].anshita[0].asila = 'تعديل الأستاذ على السؤال';
  stored[0].anshita[0].diagrams = [
    { diagram_id: 'diag_1am_foodClassification', diagram_title: 'رسم الأستاذ', diagram_svg: '<svg id="teacher"></svg>' },
  ];
  stored[3].memoNumber = '04-معدل';

  const enriched = mergeOfficialDiagrams1am(stored) as any[];

  assert.equal(enriched[0].anshita[0].asila, 'تعديل الأستاذ على السؤال');
  assert.equal(enriched[0].anshita[0].diagrams.length, 1, 'لا يجوز تكرار رسم موجود');
  assert.equal(enriched[0].anshita[0].diagrams[0].diagram_title, 'رسم الأستاذ');
  assert.equal(enriched[0].anshita[1].diagrams.length, 1, 'النشاط الثاني يُثرى بالرسم الرسمي');
  assert.equal(enriched[3].memoNumber, '04-معدل');
  assert.equal(diagramCoverage1am(enriched).memosWithDiagram, 16);

  // المستويات الأخرى تُترك كما هي (نفس المرجع).
  const others = [{ level: '2am', anshita: [{ sourceActivityId: 'act_2am_1', title: 'نشاط' }] }];
  assert.equal(mergeOfficialDiagrams1am(others as any)[0], others[0]);
});

test('إعادة الإثراء آمنة (idempotent) ولا تُنشئ نسخًا زائدة', () => {
  const once = mergeOfficialDiagrams1am(lessons1am) as any[];
  const twice = mergeOfficialDiagrams1am(once) as any[];
  const total = (set: any[]) =>
    set.reduce(
      (sum, memo) => sum + (memo.anshita ?? []).reduce((inner: number, activity: any) => inner + (activity.diagrams?.length ?? 0), 0),
      0,
    );
  assert.equal(total(once), 27);
  assert.equal(total(twice), total(once));
  for (let i = 0; i < once.length; i += 1) assert.equal(once[i], twice[i], 'إعادة الإثراء أنشأت نسخة جديدة');
});
