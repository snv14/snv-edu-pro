/**
 * اختبارات اكتمال قاعدة بيانات الدفتر اليومي (src/data/logbook).
 *
 * الغرض: أن تبقى كل وحدة تعلمية في برامج الدفتر كاملة الحقول
 * (ميدان/مقطع/مورد/تعلم مورد/مشكلة/أنشطة/تقويم) وبمعرّفات فريدة،
 * فلا تعود الحقول الفارغة صامتة كما كانت (9 تقويمات في س1 ومشكلة في س2).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LOGBOOK_DATABASE, LOGBOOK_PROGRAMS, logbookProgramOf } from '../src/data/logbook';
import { LEVEL_PROGRAMS } from '../src/utils/dailyLogbookGenerator';
import { buildCurriculumDatabase } from '../src/components/DailyLogbook';

const LEVELS = ['1am', '2am', '3am', '4am'] as const;

// التغطية الملتزمة: عدد الوحدات والأنشطة لكل مستوى (تتغير عمداً فقط عند إضافة محتوى).
const EXPECTED_COVERAGE: Record<string, { units: number; activities: number }> = {
  '1am': { units: 26, activities: 45 },
  '2am': { units: 20, activities: 29 },
  '3am': { units: 28, activities: 37 },
  '4am': { units: 23, activities: 43 },
};

test('قاعدة الدفتر مكتملة: كل وحدة تحمل كل الحقول غير فارغة', () => {
  for (const level of LEVELS) {
    const program = logbookProgramOf(level);
    assert.ok(program && program.length > 0, `برنامج ${level} غير فارغ`);
    for (const item of program) {
      const where = `${level} ← ${item.ta3alom || item.sourceLearningUnitId}`;
      assert.equal(item.level, level, `مستوى الوحدة يطابق مفتاحها: ${where}`);
      for (const field of ['midan', 'maqta', 'mawrid', 'ta3alom', 'moshkila', 'taqwim'] as const) {
        assert.ok(item[field]?.trim(), `حقل ${field} فارغ: ${where}`);
      }
      assert.ok(Array.isArray(item.activities) && item.activities.length > 0, `أنشطة فارغة: ${where}`);
      assert.ok(item.activities.every(activity => activity.trim()), `نشاط فارغ: ${where}`);
      assert.ok(item.sourceLearningUnitId.trim(), `معرّف وحدة فارغ: ${where}`);
      assert.ok(item.sourceActivityIds.length > 0, `معرّفات أنشطة فارغة: ${where}`);
    }
  }
});

test('معرّفات الوحدات والأنشطة فريدة داخل كل مستوى', () => {
  for (const level of LEVELS) {
    const program = logbookProgramOf(level)!;
    const units = program.map(item => item.sourceLearningUnitId);
    assert.equal(new Set(units).size, units.length, `وحدات مكررة في ${level}`);
    const activities = program.flatMap(item => item.sourceActivityIds);
    assert.equal(new Set(activities).size, activities.length, `أنشطة مكررة في ${level}`);
  }
});

test('التغطية الملتزمة: عدد الوحدات والأنشطة لكل مستوى', () => {
  for (const level of LEVELS) {
    const program = logbookProgramOf(level)!;
    assert.equal(program.length, EXPECTED_COVERAGE[level].units, `عدد وحدات ${level}`);
    assert.equal(
      program.reduce((sum, item) => sum + item.activities.length, 0),
      EXPECTED_COVERAGE[level].activities,
      `عدد أنشطة ${level}`,
    );
  }
});

test('المدخلات الأولية كاملة وبمعرّفات فريدة', () => {
  const seeded = LOGBOOK_DATABASE.owned.seededEntries;
  assert.ok(seeded.length > 0, 'المدخلات الأولية غير فارغة');
  const ids = seeded.map(entry => entry.id);
  assert.equal(new Set(ids).size, ids.length, 'معرّفات مدخلات مكررة');
  for (const entry of seeded) {
    assert.ok((LEVELS as readonly string[]).includes(entry.level), `مستوى مدخل غير معروف: ${entry.id}`);
    for (const field of ['date', 'dayOfWeek', 'period', 'className', 'midan', 'maqta', 'mawrid', 'ta3alom', 'lessonTitle'] as const) {
      assert.ok(entry[field]?.trim(), `حقل ${field} فارغ في المدخل ${entry.id}`);
    }
  }
});

test('المقاطع مفاتيح وحيدة ومرقّمة تصاعدياً بلا تكرار داخل كل مستوى', () => {
  for (const level of LEVELS) {
    const program = logbookProgramOf(level)!;
    const segments: string[] = [];
    for (const item of program) {
      if (segments[segments.length - 1] !== item.maqta) segments.push(item.maqta);
    }
    // كل مقطع يظهر كتلة واحدة متصلة، ولا يعود بعد مغادرته (مفتاح فرز سليم)
    assert.equal(new Set(segments).size, segments.length, `مقطع مكرر أو متقطع في ${level}`);
    for (const segment of segments) {
      assert.match(segment, /^المقطع التعلمي \d{2}: \S/, `صيغة مقطع غير موحّدة في ${level}: ${segment}`);
    }
    const numbers = segments.map(segment => Number(segment.match(/\d{2}/)![0]));
    assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b), `ترقيم مقاطع غير تصاعدي في ${level}`);
    assert.equal(new Set(numbers).size, numbers.length, `رقم مقطع مستعمل مرتين في ${level}`);
  }
});

test('نقطة الدخول الوحيدة: المولّد وواجهة الدفتر يقرآن من LOGBOOK_PROGRAMS', () => {
  const arabicLevel = { '1am': '1م', '2am': '2م', '3am': '3م', '4am': '4م' } as const;
  for (const level of LEVELS) {
    assert.deepEqual(LEVEL_PROGRAMS[arabicLevel[level]], LOGBOOK_PROGRAMS[level], `LEVEL_PROGRAMS[${level}]`);
  }
  const database = buildCurriculumDatabase();
  for (const level of LEVELS) {
    const rows = database[arabicLevel[level]];
    assert.equal(rows.length, LOGBOOK_PROGRAMS[level].length, `قاعدة الواجهة ${level}`);
    assert.ok(rows.every(row => row.level === arabicLevel[level]), `مستويات قاعدة الواجهة ${level}`);
  }
});
