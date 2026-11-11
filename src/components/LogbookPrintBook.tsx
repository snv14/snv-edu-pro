import React from 'react';
import { MemoConfig } from '../types';
import type { LogEntry, TimetableGridRow } from './DailyLogbook';
import { TeacherOfficialStamp } from './TeacherOfficialStamp';
import {
  planLogbookWeeks,
  schoolWeekThursday,
  type BookletSourceRow,
  type WeekPlan,
} from '../utils/logbookBookletPagination';
import {
  OFFICIAL_1AM_DISTRIBUTION,
  OFFICIAL_2AM_DISTRIBUTION,
  OFFICIAL_3AM_DISTRIBUTION,
  OFFICIAL_4AM_DISTRIBUTION,
} from '../data/curriculum/officialAnnualDistributionData';

/**
 * كتاب الدفتر اليومي للطباعة — A4 عمودي:
 *  1) الغلاف الرسمي بالختم بحجمه الطبيعي (45mm)
 *  2) بطاقة المعلومات + استعمال الزمن
 *  3) الإحصائيات المشتقة من التدرج السنوي الرسمي ومن حصص الدفتر
 *  4) أسابيع الدراسة: صفحة أو صفحتان لكل أسبوع حسب حجم المحتوى
 *  5) محضر المعاينة والتوقيعات بالختم بحجمه الطبيعي
 */

const LEVEL_LABELS: Record<string, string> = {
  '1م': 'السنة الأولى متوسط',
  '2م': 'السنة الثانية متوسط',
  '3م': 'السنة الثالثة متوسط',
  '4م': 'السنة الرابعة متوسط',
};

const DAY_ORDER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'];

/** حجم الختم الفيزيائي الحقيقي على الورق (ميليمتر). */
export const STAMP_NATURAL_MM = 45;

const DISTRIBUTIONS: Record<string, any[]> = {
  '1م': OFFICIAL_1AM_DISTRIBUTION as any[],
  '2م': OFFICIAL_2AM_DISTRIBUTION as any[],
  '3م': OFFICIAL_3AM_DISTRIBUTION as any[],
  '4م': OFFICIAL_4AM_DISTRIBUTION as any[],
};

interface LogbookPrintBookProps {
  config: MemoConfig;
  gridRows: TimetableGridRow[];
  entries: LogEntry[];
  onClose?: () => void;
}

const entryText = (e: LogEntry): string => {
  const parts = [e.content || ''];
  if (e.activitiesList?.length) parts.push(e.activitiesList.join('\n'));
  if (e.wasail) parts.push(`الوسائل: ${e.wasail}`);
  if (e.note) parts.push(`ملاحظة: ${e.note}`);
  return parts.filter(Boolean).join('\n');
};

interface TermStat {
  label: string;
  weeks: number;
  sessions: number;
  fromPercent: string;
  toPercent: string;
}

function levelStats(level: string) {
  const dist = (DISTRIBUTIONS[level] ?? []) as any[];
  const terms: TermStat[] = [];
  let cur: TermStat = { label: 'الفصل الأول', weeks: 0, sessions: 0, fromPercent: '', toPercent: '' };
  const holidays: string[] = [];
  const maqta = new Map<string, { weeks: number; sessions: number }>();
  for (const r of dist) {
    if (r.isHoliday) {
      if (r.holidayLabel && !holidays.includes(r.holidayLabel)) holidays.push(r.holidayLabel);
      continue;
    }
    const sessions = (String(r.session1 || '').trim() ? 1 : 0) + (String(r.session2 || '').trim() ? 1 : 0);
    cur.weeks += 1;
    cur.sessions += sessions;
    if (r.percent) {
      if (!cur.fromPercent) cur.fromPercent = String(r.percent);
      cur.toPercent = String(r.percent);
    }
    const key = String(r.maqta || '').split(' / ')[0] || 'أنشطة عرضية';
    const m = maqta.get(key) ?? { weeks: 0, sessions: 0 };
    m.weeks += 1;
    m.sessions += sessions;
    maqta.set(key, m);
    if (r.isExam) {
      terms.push(cur);
      cur = { label: `الفصل ${['الثاني', 'الثالث'][terms.length - 1] ?? ''}`, weeks: 0, sessions: 0, fromPercent: '', toPercent: '' };
    }
  }
  if (cur.weeks > 0) terms.push(cur);
  return { terms, holidays, maqta: [...maqta.entries()], dist };
}

const weekMeta = (weekKey: string): string => {
  for (const [lvl, dist] of Object.entries(DISTRIBUTIONS)) {
    const row = (dist as any[]).find((r) => String(r.dates || '').startsWith(weekKey));
    if (row) return `${LEVEL_LABELS[lvl]}: ${row.month} · الأسبوع ${row.weekInMonth}${row.percent ? ` · ${row.percent}` : ''}`;
  }
  return '';
};

const Page: React.FC<{ children: React.ReactNode; footer?: React.ReactNode }> = ({ children, footer }) => (
  <section className="book-page">
    {children}
    <div className="book-foot">{footer}</div>
  </section>
);

const Th: React.FC<{ children?: React.ReactNode; wide?: boolean }> = ({ children, wide }) => (
  <th className={wide ? 'lb-th lb-wide' : 'lb-th'}>{children}</th>
);

export const LogbookPrintBook: React.FC<LogbookPrintBookProps> = ({ config, gridRows, entries, onClose }) => {
  const sourceRows: BookletSourceRow[] = entries.map((e) => ({ id: e.id, dateStr: e.dateStr, text: entryText(e) }));
  const weeks: WeekPlan[] = planLogbookWeeks(sourceRows);
  const levels = [...new Set(entries.map((e) => e.level).filter((l) => LEVEL_LABELS[l]))];
  const usedLevels = levels.length ? levels : [config.level === '1am' ? '1م' : config.level === '2am' ? '2م' : config.level === '3am' ? '3م' : '4م'];
  const days = DAY_ORDER.filter((d) => gridRows.some((g) => Object.keys(g.cells).includes(d)));
  const firstDate = entries.map((e) => e.dateStr.match(/\d{4}-\d{2}-\d{2}/)?.[0]).find(Boolean) ?? '';
  const lastDate = [...entries].reverse().map((e) => e.dateStr.match(/\d{4}-\d{2}-\d{2}/)?.[0]).find(Boolean) ?? '';

  const weekPagesCount = weeks.reduce((s, w) => s + w.pages.length, 0);
  const totalPages = 3 + weekPagesCount + 1;

  const stamp = (
    <TeacherOfficialStamp config={config} sizeMm={STAMP_NATURAL_MM} color="blue" />
  );

  let pageCursor = 0;
  const foot = (extra?: string) => {
    pageCursor += 1;
    return (
      <span>
        {config.schoolName} — {config.schoolYear} — دفتر النصوص اليومي{extra ? ` — ${extra}` : ''} — صفحة {pageCursor}/{totalPages}
      </span>
    );
  };

  return (
    <div className="logbook-booklet-root">
      <div className="booklet-toolbar no-print">
        <strong>📖 كتاب الدفتر اليومي — {totalPages} صفحة A4</strong>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="lb-btn lb-btn-primary">🖨️ طباعة</button>
          {onClose && <button type="button" onClick={onClose} className="lb-btn">✖ إغلاق</button>}
        </div>
      </div>

      <div className="logbook-booklet">
        {/* ─────────── 1) الغلاف ─────────── */}
        <Page footer={foot('الغلاف')}>
          <header className="lb-head">
            <div>الجمهورية الجزائرية الديمقراطية الشعبية</div>
            <div>وزارة التربية الوطنية</div>
            <div>{config.directorate}</div>
            {config.inspectionDistrict ? <div>{config.inspectionDistrict}</div> : null}
            <div className="lb-school">{config.schoolName}</div>
          </header>
          <div className="lb-cover-frame">
            <div className="lb-cover-kicker">دفتر النصوص اليومي</div>
            <div className="lb-cover-title">مادة علوم الطبيعة والحياة</div>
            <div className="lb-cover-levels">
              {(usedLevels.length ? usedLevels : ['1م']).map((l) => LEVEL_LABELS[l]).join(' · ')}
            </div>
            {config.assignedClasses?.length ? (
              <div className="lb-cover-classes">الأفواج: {config.assignedClasses.join(' ، ')}</div>
            ) : null}
            <div className="lb-cover-year">الموسم الدراسي {config.schoolYear}</div>
            <div className="lb-cover-dates">
              {firstDate ? `من ${firstDate} إلى ${lastDate}` : 'يُملأ تاريخ الفتح والختام عند المعاينة'}
            </div>
          </div>
          <div className="lb-cover-bottom">
            <div className="lb-sign-block">
              {stamp}
              <div className="lb-sign-label">الأستاذ(ة): {config.teacherName}</div>
              <div className="lb-sign-line">التوقيع والختم</div>
            </div>
            <div className="lb-cover-note">
              ختم الأستاذ مطبوع هنا <b>بحجمه الطبيعي ({STAMP_NATURAL_MM} مم)</b> كما يُبصم به الدفتر الورقي.
            </div>
          </div>
        </Page>

        {/* ─────────── 2) المعلومات واستعمال الزمن ─────────── */}
        <Page footer={foot('المعلومات واستعمال الزمن')}>
          <h2 className="lb-h2">بطاقة المعلومات</h2>
          <table className="lb-table">
            <tbody>
              {[
                ['المؤسسة', config.schoolName],
                ['مديرية التربية', config.directorate],
                ['مقاطعة التفتيش', config.inspectionDistrict || '—'],
                ['الأستاذ(ة)', config.teacherName + (config.teacherGrade ? ` (${config.teacherGrade})` : '')],
                ['الهاتف', config.teacherPhone || '—'],
                ['البريد الإلكتروني', config.teacherEmail || '—'],
                ['الأفواج المكلفة', config.assignedClasses?.join(' ، ') || '—'],
                ['الحجم الساعي الأسبوعي', config.weeklyHours ? `${config.weeklyHours} سا` : '—'],
                ['الموسم الدراسي', config.schoolYear],
                ['السيد المدير', config.principalName || '—'],
                ['السيد المفتش', config.inspectorName || '—'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="lb-k">{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="lb-h2">استعمال الزمن</h2>
          <table className="lb-table lb-grid-table">
            <thead>
              <tr>
                <Th>التوقيت</Th>
                {days.map((d) => <Th key={d}>{d}</Th>)}
              </tr>
            </thead>
            <tbody>
              {gridRows.map((g) => (
                <tr key={g.id}>
                  <td className="lb-k lb-time">{g.time}</td>
                  {days.map((d) => (
                    <td key={d} className={g.cells?.[d] ? 'lb-cell' : 'lb-empty'}>{g.cells?.[d] || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Page>

        {/* ─────────── 3) الإحصائيات ─────────── */}
        <Page footer={foot('الإحصائيات')}>
          <h2 className="lb-h2">إحصائيات البرمجة السنوية</h2>
          {usedLevels.map((lvl) => {
            const st = levelStats(lvl);
            return (
              <div key={lvl} className="lb-stat-block">
                <h3 className="lb-h3">{LEVEL_LABELS[lvl]}</h3>
                <table className="lb-table">
                  <thead>
                    <tr><Th>الفصل</Th><Th>أسابيع</Th><Th>حصص</Th><Th>من %</Th><Th>إلى %</Th></tr>
                  </thead>
                  <tbody>
                    {st.terms.map((t) => (
                      <tr key={t.label}>
                        <td>{t.label}</td><td>{t.weeks}</td><td>{t.sessions}</td>
                        <td>{t.fromPercent || '—'}</td><td>{t.toPercent || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="lb-table lb-mt">
                  <thead>
                    <tr><Th wide>المقطع التعلمي</Th><Th>أسابيع</Th><Th>حصص</Th></tr>
                  </thead>
                  <tbody>
                    {st.maqta.map(([m, v]) => (
                      <tr key={m}><td>{m}</td><td>{v.weeks}</td><td>{v.sessions}</td></tr>
                    ))}
                  </tbody>
                </table>
                {st.holidays.length ? (
                  <div className="lb-holidays">
                    {st.holidays.map((h) => <div key={h}>🟩 {h}</div>)}
                  </div>
                ) : null}
              </div>
            );
          })}

          <h2 className="lb-h2 lb-mt">إحصائيات الدفتر المسجل</h2>
          <table className="lb-table">
            <tbody>
              <tr><td className="lb-k">أسابيع مبرمجة في الدفتر</td><td>{weeks.length}</td></tr>
              <tr><td className="lb-k">صفحات الأسابيع</td><td>{weekPagesCount} (صفحة أو صفحتان حسب حجم المحتوى)</td></tr>
              <tr><td className="lb-k">حصص مسجلة</td><td>{entries.length}</td></tr>
              <tr><td className="lb-k">حسب اليوم</td><td>{DAY_ORDER.map((d) => `${d}: ${entries.filter((e) => e.dayName === d).length}`).join(' · ')}</td></tr>
              <tr><td className="lb-k">حسب المستوى</td><td>{usedLevels.map((l) => `${LEVEL_LABELS[l]}: ${entries.filter((e) => e.level === l).length}`).join(' · ') || '—'}</td></tr>
            </tbody>
          </table>
        </Page>

        {/* ─────────── 4) الأسابيع ─────────── */}
        {weeks.map((w, wi) =>
          w.pages.map((pg, pi) => (
            <Page key={`${w.weekKey}-${pi}`} footer={foot(`الأسبوع ${wi + 1}${pi ? ' (تابع)' : ''}`)}>
              <div className="lb-week-head">
                <div className="lb-week-title">
                  الأسبوع الدراسي {wi + 1} — من {w.weekKey} إلى {schoolWeekThursday(w.weekKey)}
                  {pi ? ' (تابع)' : ''}
                </div>
                <div className="lb-week-meta">{weekMeta(w.weekKey) || `${pg.rows.length} حصة في هذه الصفحة`}</div>
              </div>
              <table className="lb-table lb-week-table">
                <thead>
                  <tr>
                    <Th>اليوم</Th><Th>التاريخ</Th><Th>التوقيت</Th><Th>الفوج</Th><Th wide>محتوى الحصة وأنشطتها</Th><Th>الإمضاء</Th>
                  </tr>
                </thead>
                <tbody>
                  {pg.rows.map((r) => {
                    const e = entries.find((x) => x.id === r.id)!;
                    return (
                      <tr key={r.id}>
                        <td className="lb-day">{e.dayName}</td>
                        <td className="lb-date">{e.dateStr}</td>
                        <td className="lb-time">{e.time}</td>
                        <td className="lb-sec">{e.section}<div className="lb-sec-level">{LEVEL_LABELS[e.level] ?? e.level}</div></td>
                        <td className="lb-content">{r.text.split('\n').map((line, i) => <div key={i}>{line}</div>)}</td>
                        <td className="lb-sign"></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Page>
          ))
        )}

        {/* ─────────── 5) المعاينة والتوقيعات ─────────── */}
        <Page footer={foot('المعاينة والتوقيعات')}>
          <h2 className="lb-h2">محضر المعاينة والتوقيعات</h2>
          <p className="lb-p">
            وُقّف هذا الدفتر في {weeks.length} أسبوعاً دراسياً و{entries.length} حصة مسجلة، موزعة على {weekPagesCount} صفحة
            أسبوعية (صفحة أو صفحتان حسب حجم المحتوى)، خلال الموسم الدراسي {config.schoolYear} بمؤسسة {config.schoolName}.
          </p>
          <div className="lb-visa-grid">
            <div className="lb-visa">
              <div className="lb-visa-role">الأستاذ(ة)</div>
              <div className="lb-visa-name">{config.teacherName}</div>
              <div className="lb-visa-stamp">{stamp}</div>
              <div className="lb-sign-line">التوقيع والختم</div>
            </div>
            <div className="lb-visa">
              <div className="lb-visa-role">السيد المدير</div>
              <div className="lb-visa-name">{config.principalName || '—'}</div>
              <div className="lb-visa-space"></div>
              <div className="lb-sign-line">التوقيع والختم</div>
            </div>
            <div className="lb-visa">
              <div className="lb-visa-role">السيد المفتش</div>
              <div className="lb-visa-name">{config.inspectorName || '—'}</div>
              <div className="lb-visa-space"></div>
              <div className="lb-sign-line">التوقيع والختم</div>
            </div>
          </div>
          <div className="lb-end-note">
            انتهى الدفتر — عدد الصفحات الكلي {totalPages} صفحة A4. الختم ظاهر بحجمه الطبيعي ({STAMP_NATURAL_MM} مم) في الغلاف وهذا المحضر.
          </div>
        </Page>
      </div>

      <style>{`
        .logbook-booklet-root { position: fixed; inset: 0; z-index: 95; background: #3f3f46; overflow: auto; padding: 56px 12px 40px; }
        .booklet-toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 96; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; background: #18181b; color: #fafafa; box-shadow: 0 6px 24px rgba(0,0,0,.4); }
        .lb-btn { background: #fff; color: #18181b; border: 0; border-radius: 999px; padding: 7px 14px; font-size: 12px; font-weight: 800; cursor: pointer; }
        .lb-btn-primary { background: #006233; color: #fff; }
        .logbook-booklet { direction: rtl; font-family: 'Tajawal', 'Segoe UI', system-ui, sans-serif; color: #111; }
        .book-page { width: 210mm; min-height: 296mm; margin: 0 auto 16px; background: #fff; padding: 9mm 8mm 12mm; box-sizing: border-box; position: relative; display: flex; flex-direction: column; box-shadow: 0 16px 44px rgba(0,0,0,.5); }
        .book-foot { margin-top: auto; padding-top: 4mm; border-top: 1px solid #999; font-size: 9px; color: #444; text-align: center; }
        .lb-head { text-align: center; font-size: 11px; font-weight: 700; line-height: 1.75; border-bottom: 2px solid #006233; padding-bottom: 3mm; }
        .lb-school { font-size: 12.5px; font-weight: 900; color: #006233; }
        .lb-cover-frame { margin: 12mm auto; border: 3px double #006233; border-radius: 4px; padding: 12mm 8mm; text-align: center; background: #f8fdf9; }
        .lb-cover-kicker { font-size: 15px; font-weight: 900; letter-spacing: .5px; }
        .lb-cover-title { font-size: 26px; font-weight: 900; color: #006233; margin: 5mm 0 3mm; }
        .lb-cover-levels { font-size: 13px; font-weight: 800; }
        .lb-cover-classes { font-size: 11px; margin-top: 3mm; color: #333; }
        .lb-cover-year { font-size: 14px; font-weight: 900; margin-top: 6mm; }
        .lb-cover-dates { font-size: 10.5px; color: #555; margin-top: 2mm; }
        .lb-cover-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8mm; }
        .lb-sign-block { text-align: center; }
        .lb-sign-label { font-size: 11px; font-weight: 800; margin-top: 2mm; }
        .lb-sign-line { font-size: 9px; color: #666; border-top: 1px dashed #888; margin-top: 3mm; padding-top: 1mm; }
        .lb-cover-note { font-size: 9.5px; color: #555; max-width: 78mm; line-height: 1.7; }
        .lb-h2 { font-size: 14px; font-weight: 900; color: #006233; border-right: 4px solid #006233; padding-right: 3mm; margin: 4mm 0 3mm; }
        .lb-h3 { font-size: 12px; font-weight: 900; margin: 3mm 0 2mm; color: #14532d; }
        .lb-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .lb-table td, .lb-th { border: 1px solid #444; padding: 1.6mm 2mm; text-align: right; vertical-align: top; }
        .lb-th { background: #e7f4ea; font-weight: 900; text-align: center; font-size: 9.5px; }
        .lb-k { background: #f4f4f5; font-weight: 800; width: 42mm; }
        .lb-wide { width: 60%; }
        .lb-mt { margin-top: 3mm; }
        .lb-time { direction: ltr; text-align: center; font-weight: 700; white-space: nowrap; }
        .lb-cell { font-weight: 700; text-align: center; font-size: 9.5px; }
        .lb-empty { background: #fafafa; }
        .lb-grid-table td { height: 9mm; }
        .lb-stat-block { margin-bottom: 2mm; }
        .lb-holidays { font-size: 9.5px; margin-top: 2mm; color: #166534; line-height: 1.8; }
        .lb-week-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; border-bottom: 2px solid #006233; padding-bottom: 2mm; margin-bottom: 3mm; }
        .lb-week-title { font-size: 13px; font-weight: 900; color: #006233; }
        .lb-week-meta { font-size: 9px; color: #555; }
        .lb-week-table td { min-height: 12mm; }
        .lb-day { font-weight: 800; text-align: center; white-space: nowrap; }
        .lb-date { direction: ltr; text-align: center; white-space: nowrap; font-size: 9px; }
        .lb-sec { font-weight: 700; text-align: center; font-size: 9.5px; }
        .lb-sec-level { font-weight: 500; color: #666; font-size: 8px; }
        .lb-content { line-height: 1.65; font-size: 9.8px; }
        .lb-sign { width: 16mm; }
        .lb-p { font-size: 10.5px; line-height: 1.9; }
        .lb-visa-grid { display: flex; gap: 6mm; margin-top: 8mm; }
        .lb-visa { flex: 1; border: 1px solid #666; border-radius: 3px; padding: 4mm; text-align: center; min-height: 62mm; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
        .lb-visa-role { font-size: 11px; font-weight: 900; }
        .lb-visa-name { font-size: 10px; color: #333; }
        .lb-visa-stamp { margin: 4mm 0; }
        .lb-visa-space { flex: 1; }
        .lb-end-note { margin-top: 8mm; font-size: 9.5px; color: #555; text-align: center; border-top: 1px dashed #999; padding-top: 3mm; }
        @media print {
          body * { visibility: hidden !important; }
          .logbook-booklet-root, .logbook-booklet-root * { visibility: visible !important; }
          .logbook-booklet-root { position: static !important; overflow: visible !important; background: #fff !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .book-page { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .book-page:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>
    </div>
  );
};

export default LogbookPrintBook;
