import React from 'react';
import { Calendar, Clock, Users, BookOpen, FileEdit } from 'lucide-react';
import { LogEntry } from './DailyLogbook';
import { MemoConfig } from '../types';
import { TeacherOfficialStamp } from './TeacherOfficialStamp';

export const formatTimingWithArrow = (timeStr: string) => {
  if (!timeStr) return '—';
  
  const formatSingleSlot = (str: string) => {
    // If slot has arrow or hyphen: e.g. "08:00 ➔ 09:00 (ف1)" or "08:00 - 09:00 (ف1)"
    const arrowParts = str.split(/\s*➔\s*/);
    if (arrowParts.length >= 2) {
      return (
        <span className="inline-flex items-center justify-center gap-1">
          <span>{arrowParts[0]}</span>
          <span className="text-[#0284c7] font-black text-[11px] leading-none">➔</span>
          <span>{arrowParts[1]}</span>
        </span>
      );
    }
    const hyphenParts = str.split(/\s*[-–—→←]\s*/);
    if (hyphenParts.length >= 2) {
      return (
        <span className="inline-flex items-center justify-center gap-1">
          <span>{hyphenParts[0]}</span>
          <span className="text-[#0284c7] font-black text-[11px] leading-none">➔</span>
          <span>{hyphenParts[1]}</span>
        </span>
      );
    }
    return <span>{str}</span>;
  };

  if (timeStr.includes('/')) {
    const parts = timeStr.split(/\s*\/\s*/);
    return (
      <div className="flex flex-col items-center justify-center gap-0.5 text-[9.5px] leading-tight">
        {parts.map((p, idx) => (
          <span key={idx} className="inline-flex items-center justify-center">
            {formatSingleSlot(p)}
          </span>
        ))}
      </div>
    );
  }

  return formatSingleSlot(timeStr);
};

interface DailyLogSheetProps {
  pageRows: LogEntry[];
  allRows: LogEntry[];
  pageIndex: number;
  totalPages: number;
  config: MemoConfig;
  assignedLevels: string[];
  startDate?: string;
  pageDimensions: { w: number; h: number };
  buildHierarchicalContent: (row: LogEntry, previous?: LogEntry) => string;
  findPreviousComparableCurriculumRow: (allRows: LogEntry[], currentIndex: number, row: LogEntry) => LogEntry | undefined;
  getSchoolWeekKey: (dateStr: string) => string;
  getSchoolWeekNumber: (dateStr: string, startDate: string) => number;
  formatLogbookDateLabel: (dateStr: string) => string;
  useOfficialImageBackground?: boolean;
}

// Left Science Graphic (Books + DNA Helix + Erlenmeyer Flask + Plant Sprout)
const ScienceHeaderLeft: React.FC = () => (
  <svg viewBox="0 0 130 115" className="w-[110px] h-[95px] select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id="bookBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <linearGradient id="bookCyan" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
    {/* Green decorative leaves */}
    <path d="M22 45 C15 30 25 15 40 18 C38 32 30 42 22 45 Z" fill="#22c55e" opacity="0.85" />
    <path d="M42 35 C55 22 72 28 68 44 C56 46 46 42 42 35 Z" fill="#16a34a" opacity="0.75" />
    <path d="M30 60 C18 52 22 38 34 38 C36 48 34 56 30 60 Z" fill="#4ade80" opacity="0.8" />
    
    {/* Stack of 3 Books */}
    {/* Book 1 (Bottom) */}
    <path d="M12 95 L56 108 L98 96 L54 84 Z" fill="url(#bookBlue)" />
    <path d="M12 95 L12 101 L56 114 L56 108 Z" fill="#1d4ed8" />
    <path d="M56 108 L56 114 L98 102 L98 96 Z" fill="#60a5fa" />
    {/* Book 2 (Middle) */}
    <path d="M16 88 L58 99 L96 89 L54 78 Z" fill="url(#bookCyan)" />
    <path d="M16 88 L16 93 L58 104 L58 99 Z" fill="#0369a1" />
    <path d="M58 99 L58 104 L96 94 L96 89 Z" fill="#93c5fd" />
    {/* Book 3 (Top) */}
    <path d="M22 81 L60 91 L94 82 L56 72 Z" fill="#1e3a8a" />
    <path d="M22 81 L22 85 L60 95 L60 91 Z" fill="#172554" />
    <path d="M60 91 L60 95 L94 86 L94 82 Z" fill="#bfdbfe" />

    {/* DNA Helix rising from books */}
    <g stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round">
      <path d="M48 30 Q54 42 48 54 Q42 66 48 76" fill="none" />
      <path d="M56 30 Q50 42 56 54 Q62 66 56 76" fill="none" />
      {/* Rungs */}
      <line x1="48" y1="34" x2="56" y2="34" stroke="#0284c7" strokeWidth="2" />
      <line x1="49" y1="42" x2="55" y2="42" stroke="#22c55e" strokeWidth="2" />
      <line x1="48" y1="50" x2="56" y2="50" stroke="#0284c7" strokeWidth="2" />
      <line x1="47" y1="58" x2="57" y2="58" stroke="#22c55e" strokeWidth="2" />
      <line x1="49" y1="66" x2="55" y2="66" stroke="#0284c7" strokeWidth="2" />
      <line x1="48" y1="74" x2="56" y2="74" stroke="#22c55e" strokeWidth="2" />
    </g>

    {/* Conical Erlenmeyer Flask */}
    <path d="M92 48 L100 48 L100 58 L114 86 C116 90 112 94 106 94 L86 94 C80 94 76 90 78 86 L92 58 Z" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2.2" strokeLinejoin="round" />
    {/* Liquid inside flask */}
    <path d="M82 82 L110 82 L113 88 C114 91 111 93 106 93 L86 93 C81 93 78 91 79 88 Z" fill="url(#flaskGrad)" />
    {/* Sprout rising from flask */}
    <path d="M96 50 Q96 38 98 28" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M98 28 C92 24 92 16 102 18 C102 24 99 27 98 28 Z" fill="#22c55e" />
    <path d="M97 34 C104 32 108 38 102 42 C99 40 98 36 97 34 Z" fill="#4ade80" />
    {/* Bubbles */}
    <circle cx="94" cy="74" r="2" fill="#bae6fd" />
    <circle cx="102" cy="78" r="2.5" fill="#bae6fd" />
    <circle cx="97" cy="84" r="1.5" fill="#bae6fd" />
  </svg>
);

// Right Science Graphic (Microscope + Atom Model + Leaves)
const ScienceHeaderRight: React.FC = () => (
  <svg viewBox="0 0 130 115" className="w-[110px] h-[95px] select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="microscopeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    {/* Green decorative leaves */}
    <path d="M108 42 C118 28 108 14 94 16 C95 30 102 40 108 42 Z" fill="#22c55e" opacity="0.85" />
    <path d="M88 32 C76 20 60 25 63 40 C75 42 84 38 88 32 Z" fill="#16a34a" opacity="0.75" />
    <path d="M102 58 C112 50 110 36 98 36 C95 45 98 54 102 58 Z" fill="#4ade80" opacity="0.8" />
    <path d="M115 72 C125 65 120 52 110 54 C108 62 111 69 115 72 Z" fill="#22c55e" opacity="0.7" />

    {/* Modern Blue Microscope */}
    {/* Horseshoe/circular base */}
    <path d="M68 96 C68 88 88 84 96 84 C104 84 124 88 124 96 L68 96 Z" fill="#1e3a8a" />
    <rect x="74" y="94" width="44" height="4" rx="2" fill="#0284c7" />
    {/* Arm / Pillar */}
    <path d="M110 86 Q122 62 108 44 Q98 32 86 38" stroke="url(#microscopeGrad)" strokeWidth="6.5" strokeLinecap="round" fill="none" />
    {/* Stage */}
    <rect x="76" y="66" width="28" height="4.5" rx="1.5" fill="#1e293b" />
    <rect x="84" y="64" width="12" height="2" fill="#38bdf8" />
    {/* Body tube */}
    <g transform="rotate(24 82 42)">
      {/* Eyepiece */}
      <rect x="76" y="14" width="10" height="12" rx="2" fill="#0284c7" />
      <rect x="74" y="11" width="14" height="3" rx="1" fill="#1e3a8a" />
      {/* Main cylinder */}
      <rect x="78" y="26" width="6.5" height="24" fill="#1d4ed8" />
      {/* Revolving nosepiece */}
      <ellipse cx="81" cy="52" rx="7" ry="3.5" fill="#0f172a" />
      {/* Objective lenses */}
      <rect x="76" y="55" width="4" height="9" fill="#0284c7" />
      <rect x="83" y="55" width="3.5" height="7" fill="#38bdf8" />
    </g>
    {/* Focus adjustment knob */}
    <circle cx="110" cy="62" r="5" fill="#38bdf8" stroke="#1d4ed8" strokeWidth="2" />

    {/* Atom Model in lower corner */}
    <g stroke="#0284c7" strokeWidth="1.5" fill="none" opacity="0.85">
      <ellipse cx="36" cy="80" rx="22" ry="7" />
      <ellipse cx="36" cy="80" rx="22" ry="7" transform="rotate(60 36 80)" />
      <ellipse cx="36" cy="80" rx="22" ry="7" transform="rotate(120 36 80)" />
      <circle cx="36" cy="80" r="3.5" fill="#0284c7" />
    </g>
  </svg>
);

// Botanical leaves ornament for bottom corners
const CornerLeaves: React.FC<{ flip?: boolean }> = ({ flip = false }) => (
  <svg
    viewBox="0 0 65 65"
    className={`w-12 h-12 select-none shrink-0 ${flip ? '-scale-x-100' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 54 C10 38 24 24 40 26 C41 42 27 54 12 54 Z" fill="#0284c7" />
    <path d="M26 56 C26 44 38 34 50 36 C50 48 38 58 26 56 Z" fill="#0369a1" />
    <path d="M10 40 C6 26 18 14 30 16 C30 28 20 38 10 40 Z" fill="#38bdf8" />
    <path d="M4 26 C4 16 14 8 22 10 C22 18 14 26 4 26 Z" fill="#0284c7" opacity="0.85" />
    <circle cx="14" cy="52" r="2.5" fill="#0369a1" />
  </svg>
);

export const DailyLogSheetTemplate: React.FC<DailyLogSheetProps> = ({
  pageRows,
  allRows,
  pageIndex,
  totalPages,
  config,
  assignedLevels,
  startDate = '',
  pageDimensions,
  buildHierarchicalContent,
  findPreviousComparableCurriculumRow,
  getSchoolWeekKey,
  getSchoolWeekNumber,
  formatLogbookDateLabel,
}) => {
  const ROWS_PER_PAGE_CAP = 10;
  const emptyRowsCount = Math.max(0, ROWS_PER_PAGE_CAP - pageRows.length);

  return (
    <div
      data-preview-export-page="true"
      data-logbook-content-page="true"
      className="print-page logbook-content-page relative shadow-[0_16px_50px_rgba(2,132,199,0.14)] rounded-[14px] border-2 md:border-[2.5px] border-[#0284c7] overflow-hidden mx-auto mb-8 bg-[#ffffff] text-zinc-900"
      style={{
        width: `${pageDimensions.w}mm`,
        height: `${pageDimensions.h}mm`,
        minHeight: `${pageDimensions.h}mm`,
        maxWidth: 'none',
      }}
    >
      <div className="h-full flex flex-col justify-between p-3.5 md:p-4">
        {/* TOP OFFICIAL HEADER */}
        <div>
          <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
            {/* Top Left Science Graphic */}
            <ScienceHeaderLeft />

            {/* Central Official Title & Ministry */}
            <div className="flex-1 text-center px-1">
              <div className="text-[12px] font-bold text-zinc-900 tracking-wide">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </div>
              <div className="text-[11px] font-extrabold text-[#0369a1] mt-0.5">
                وزارة التربية الوطنية
              </div>
              
              <div className="flex items-center justify-center my-0.5">
                <span className="w-1.5 h-1.5 rotate-45 bg-[#0284c7]"></span>
              </div>

              {/* Main Badge Pill matching user template */}
              <div className="relative mx-auto mt-1 max-w-[340px] bg-gradient-to-r from-[#e0f2fe] via-[#bae6fd] to-[#e0f2fe] border-2 border-[#0284c7] rounded-3xl py-1.5 px-6 shadow-xs">
                <h2 className="text-[#0369a1] font-black text-[20px] md:text-[22px] tracking-wide leading-none">
                  الدفتر اليومي للأستاذ
                </h2>
                <div className="mt-1 inline-block bg-white border border-[#0284c7] px-4 py-0.5 rounded-full text-[10px] md:text-[11px] font-black text-[#0369a1] shadow-2xs">
                  التعليم المتوسط - علوم الطبيعة والحياة
                </div>
              </div>
            </div>

            {/* Top Right Science Graphic */}
            <ScienceHeaderRight />
          </div>

          {/* Sub Header / Teacher & School Details Bar */}
          <div className="mt-1 mb-1.5 px-3 py-1 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg flex flex-wrap items-center justify-between text-[10px] font-bold text-zinc-800">
            <div className="flex items-center gap-3">
              <span>الأستاذ(ة): <b className="text-[#0369a1]">{config.teacherName || '—'}</b></span>
              <span>المتوسطة: <b className="text-[#0369a1]">{config.schoolName || '—'}</b></span>
              <span>مديرية التربية: <b className="text-[#0369a1]">{config.directorate || '—'}</b></span>
            </div>
            <div className="flex items-center gap-3">
              <span>السنة الدراسية: <b className="text-[#0369a1]">{config.schoolYear || '2026-2027'}</b></span>
              <span>المستويات: <b className="text-[#0369a1]">{assignedLevels.join('، ') || '1م'}</b></span>
            </div>
          </div>

          {/* 5-COLUMN MAIN TABLE (MATCHING UPLOADED TEMPLATE & USER SPECIFICATIONS) */}
          <div className="mt-1 border-2 border-[#0284c7] rounded-t-xl overflow-hidden bg-white">
            <table className="w-full border-collapse text-[11px] leading-snug table-fixed">
              <thead>
                <tr className="bg-[#e1f0fa] border-b-2 border-[#0284c7] text-[#0369a1]">
                  {/* Column 1 (RTL Rightmost): التاريخ واليوم */}
                  <th className="border-l-2 border-[#0284c7] py-2 px-1 text-center font-black w-[16%]">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Calendar className="w-4 h-4 text-[#0284c7]" />
                      <span className="text-[12px]">التاريخ واليوم</span>
                    </div>
                  </th>

                  {/* Column 2: التوقيت */}
                  <th className="border-l-2 border-[#0284c7] py-2 px-1 text-center font-black w-[15%]">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Clock className="w-4 h-4 text-[#0284c7]" />
                      <span className="text-[12px]">التوقيت</span>
                    </div>
                  </th>

                  {/* Column 3: القسم */}
                  <th className="border-l-2 border-[#0284c7] py-2 px-1 text-center font-black w-[13%]">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Users className="w-4 h-4 text-[#0284c7]" />
                      <span className="text-[12px]">القسم</span>
                    </div>
                  </th>

                  {/* Column 4: المحتوى الدرس */}
                  <th className="border-l-2 border-[#0284c7] py-2 px-2 text-center font-black w-[41%]">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <BookOpen className="w-4 h-4 text-[#0284c7]" />
                      <span className="text-[12px]">المحتوى الدرس</span>
                    </div>
                  </th>

                  {/* Column 5 (RTL Leftmost): الملاحظات */}
                  <th className="py-2 px-1 text-center font-black w-[15%]">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <FileEdit className="w-4 h-4 text-[#0284c7]" />
                      <span className="text-[12px]">الملاحظات</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, rowIdx) => {
                  const globalRowIndex = allRows.findIndex((item) => item.id === r.id);
                  const previousRow = findPreviousComparableCurriculumRow(allRows, globalRowIndex, r);
                  const displayContent = buildHierarchicalContent(r, previousRow);
                  const isNewWeek =
                    rowIdx > 0 &&
                    getSchoolWeekKey(r.dateStr) !== getSchoolWeekKey(pageRows[rowIdx - 1].dateStr);

                  return (
                    <React.Fragment key={r.id}>
                      {isNewWeek && (
                        <tr className="bg-[#f0f9ff]">
                          <td colSpan={5} className="border-b border-dashed border-[#7dd3fc] px-3 py-1 text-right text-[10px] font-black text-[#0369a1]">
                            بداية أسبوع دراسي جديد — الأسبوع {getSchoolWeekNumber(r.dateStr, startDate)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-white hover:bg-sky-50/40 transition">
                        {/* Col 1: التاريخ واليوم */}
                        <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-1.5 py-1.5 text-center align-middle">
                          {r.dateStr.includes('/') ? (
                            <div className="flex flex-col gap-1 text-[10px] leading-tight font-bold">
                              {(() => {
                                const dateParts = r.dateStr.split('/');
                                const dayParts = (r.dayName || '').split('/');
                                return dateParts.map((dp, idx) => {
                                  const day = dayParts[idx]?.trim() || dayParts[0]?.trim() || '';
                                  const formatted = formatLogbookDateLabel(dp.trim());
                                  return (
                                    <div key={idx} className="bg-sky-50 border border-sky-200 rounded px-1 py-0.5">
                                      <span className="font-black text-[#0369a1]">{day} </span>
                                      <span className="text-zinc-700 font-bold font-mono text-[9px]">{formatted}</span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <div className="font-black text-[12px] text-[#0369a1] leading-tight">
                                {r.dayName || 'الأحد'}
                              </div>
                              <div className="font-mono text-[10px] font-bold text-zinc-700 mt-0.5" dir="rtl">
                                {formatLogbookDateLabel(r.dateStr)}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Col 2: التوقيت مع سهم */}
                        <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-1 py-2 text-center align-middle font-mono text-[10px] font-bold text-zinc-800" dir="ltr">
                          {formatTimingWithArrow(r.time)}
                        </td>

                        {/* Col 3: القسم */}
                        <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-1 py-2 text-center align-middle">
                          <span className="inline-block bg-[#0284c7] text-white px-2 py-0.5 rounded text-[11px] font-black shadow-2xs">
                            {r.section}
                          </span>
                          {r.level && !r.section.includes(r.level) && (
                            <div className="text-[9px] font-bold text-[#0369a1] mt-0.5">
                              {r.level}
                            </div>
                          )}
                        </td>

                        {/* Col 4: المحتوى الدرس */}
                        <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-2.5 py-2 text-right align-top leading-relaxed">
                          {r.note && r.note.includes('مخبري') && (
                            <div className="mb-1">
                              <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                عمل مخبري (أفواج)
                              </span>
                            </div>
                          )}
                          <div
                            className="text-[10.5px] text-zinc-900 leading-normal"
                            dangerouslySetInnerHTML={{ __html: displayContent }}
                          />
                        </td>

                        {/* Col 5: الملاحظات */}
                        <td className="border-b border-dashed border-[#7dd3fc] px-1.5 py-2 text-right align-top text-[10px] text-zinc-800">
                          {r.note || ''}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Empty dashed rows filling up remainder of page like notebook paper */}
                {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => (
                  <tr key={`empty-line-${emptyIdx}`} className="bg-white">
                    <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc] h-[34px]" />
                    <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc]" />
                    <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc]" />
                    <td className="border-l-2 border-[#0284c7] border-b border-dashed border-[#7dd3fc]" />
                    <td className="border-b border-dashed border-[#7dd3fc]" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM SECTION WITH ORNAMENT AND SIGNATURES */}
        <div className="mt-auto pt-2">
          {/* Ornamental Center Divider */}
          <div className="flex items-center justify-between px-2">
            <CornerLeaves flip={false} />
            <div className="flex-1 flex items-center justify-center gap-2 px-4">
              <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-[#0284c7]" />
              <span className="w-2.5 h-2.5 rotate-45 bg-[#0284c7]" />
              <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-[#0284c7]" />
            </div>
            <CornerLeaves flip={true} />
          </div>

          {/* Official Signatures Row */}
          <div className="mt-1 px-4 py-2 border-t border-b border-[#bae6fd] bg-[#f8fafc] grid grid-cols-4 gap-2 text-[10.5px]">
            <div className="text-center">
              <div className="font-extrabold text-zinc-900">توقيع الأستاذ(ة)</div>
              <div className="mt-4 border-t border-dashed border-zinc-400 h-6" />
            </div>
            <div className="text-center relative">
              <div className="font-extrabold text-zinc-900">ختم الأستاذ(ة)</div>
              <div className="mt-1 flex justify-center">
                <TeacherOfficialStamp config={config} size="sm" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-extrabold text-zinc-900">تأشيرة السيد المدير</div>
              <div className="mt-4 border-t border-dashed border-zinc-400 h-6" />
            </div>
            <div className="text-center">
              <div className="font-extrabold text-zinc-900">تأشيرة السيد المفتش</div>
              <div className="mt-4 border-t border-dashed border-zinc-400 h-6" />
            </div>
          </div>

          {/* Page Counter Badge */}
          <div className="flex items-center justify-center pt-2">
            <span className="bg-[#0369a1] text-white px-4 py-0.5 rounded-full font-black text-[10px] shadow-2xs">
              صفحة {pageIndex + 1} من {totalPages} — 🇩🇿
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
