import React from 'react';
import { Calendar, Clock, Users, BookOpen, FileEdit } from 'lucide-react';
import { LogEntry } from './DailyLogbook';
import { MemoConfig } from '../types';
import { TeacherOfficialStamp } from './TeacherOfficialStamp';
import { useHandwritingStyle } from '../hooks/useHandwritingStyle';
import {
  formatSemanticHtml,
  getEffectiveExportFontFamily,
  isHandwritingActiveFor,
} from '../services/handwritingStyle';

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

export interface DailyLogSheetProps {
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
  onUpdateRow?: (rowId: string, updates: Partial<LogEntry>) => void;
  idPrefix?: string;
  emptyFillerRows?: number;
}

// Left Science Graphic (Books + DNA Helix + Erlenmeyer Flask + Plant Sprout)
export const ScienceHeaderLeft: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <svg
    width={compact ? 68 : 88}
    height={compact ? 58 : 76}
    viewBox="0 0 130 115"
    style={{ width: '100%', height: '100%', maxWidth: compact ? '68px' : '88px', maxHeight: compact ? '58px' : '76px' }}
    className={`select-none shrink-0 ${compact ? 'w-12 h-10 sm:w-[68px] sm:h-[58px]' : 'w-14 h-12 sm:w-[76px] sm:h-[66px] md:w-[88px] md:h-[76px]'}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
export const ScienceHeaderRight: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <svg
    width={compact ? 68 : 88}
    height={compact ? 58 : 76}
    viewBox="0 0 130 115"
    style={{ width: '100%', height: '100%', maxWidth: compact ? '68px' : '88px', maxHeight: compact ? '58px' : '76px' }}
    className={`select-none shrink-0 ${compact ? 'w-12 h-10 sm:w-[68px] sm:h-[58px]' : 'w-14 h-12 sm:w-[76px] sm:h-[66px] md:w-[88px] md:h-[76px]'}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
export const CornerLeaves: React.FC<{ flip?: boolean; compact?: boolean }> = ({ flip = false, compact = false }) => (
  <svg
    width={compact ? 28 : 36}
    height={compact ? 28 : 36}
    viewBox="0 0 65 65"
    style={compact ? { width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' } : { width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
    className={`select-none shrink-0 ${flip ? '-scale-x-100' : ''}`}
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
  onUpdateRow,
  idPrefix = 'page-content',
  emptyFillerRows,
}) => {
  const { settings: hwStyle } = useHandwritingStyle();
  const hwActive = isHandwritingActiveFor('logbook', hwStyle);
  const pageFontFamily = getEffectiveExportFontFamily('pdf', hwStyle, 'logbook');

  const emptyRowsCount =
    typeof emptyFillerRows === 'number'
      ? Math.max(0, emptyFillerRows)
      : Math.max(0, 6 - pageRows.length);

  return (
    <div
      id={`${idPrefix}-${pageIndex}`}
      data-preview-export-page="true"
      data-logbook-content-page="true"
      className={`print-page logbook-content-page ${hwActive ? 'hw-notebook-scope' : ''} relative shadow-[0_14px_40px_rgba(2,132,199,0.12)] rounded-[12px] border-2 border-[#0284c7] overflow-hidden mx-auto mb-6 bg-[#ffffff] text-zinc-900`}
      style={{
        width: `${pageDimensions.w}mm`,
        height: `${pageDimensions.h}mm`,
        minHeight: `${pageDimensions.h}mm`,
        maxWidth: '100%',
        fontFamily: pageFontFamily,
        direction: 'rtl',
      }}
    >
      <div className="h-full flex flex-col justify-between p-2.5 sm:p-3">
        {/* TOP OFFICIAL HEADER */}
        <div className="min-h-0 flex flex-col">
          <div className="relative flex items-center justify-between px-1.5 pt-0.5 pb-0.5">
            {/* Top Left Science Graphic */}
            <ScienceHeaderLeft compact />

            {/* Central Official Title & Ministry */}
            <div className="flex-1 text-center px-1">
              <div className="text-[11px] font-bold text-zinc-900 leading-tight">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </div>
              <div className="text-[10px] font-extrabold text-[#0369a1] mt-0.5 leading-tight">
                وزارة التربية الوطنية
              </div>

              {/* Main Badge Pill matching user template */}
              <div className="relative mx-auto mt-1 max-w-[310px] bg-gradient-to-r from-[#e0f2fe] via-[#bae6fd] to-[#e0f2fe] border-[1.5px] border-[#0284c7] rounded-2xl py-1 px-4 shadow-2xs">
                <h2 className="text-[#0369a1] font-black text-[16px] md:text-[17px] tracking-wide leading-tight">
                  الدفتر اليومي للأستاذ
                </h2>
                <div className="mt-0.5 inline-block bg-white border border-[#0284c7] px-3 py-0 rounded-full text-[9.5px] md:text-[10px] font-black text-[#0369a1]">
                  التعليم المتوسط - علوم الطبيعة والحياة
                </div>
              </div>
            </div>

            {/* Top Right Science Graphic */}
            <ScienceHeaderRight compact />
          </div>

          {/* Sub Header / Teacher & School Details Bar */}
          <div className="mt-1 mb-1 px-2.5 py-0.5 bg-[#f0f9ff] border border-[#bae6fd] rounded-md flex flex-wrap items-center justify-between gap-x-2 text-[9.5px] font-bold text-zinc-800">
            <div className="flex flex-wrap items-center gap-x-2.5">
              <span>الأستاذ(ة): <b className="text-[#0369a1]">{config.teacherName || '—'}</b></span>
              <span>المتوسطة: <b className="text-[#0369a1]">{config.schoolName || '—'}</b></span>
              <span>مديرية التربية: <b className="text-[#0369a1]">{config.directorate || '—'}</b></span>
            </div>
            <div className="flex items-center gap-2.5">
              <span>السنة الدراسية: <b className="text-[#0369a1]">{config.schoolYear || '2026-2027'}</b></span>
              <span>المستويات: <b className="text-[#0369a1]">{assignedLevels.join('، ') || '1م'}</b></span>
            </div>
          </div>

          {/* 5-COLUMN MAIN TABLE (MATCHING UPLOADED TEMPLATE & USER SPECIFICATIONS) */}
          <div className="mt-0.5 border-[1.5px] border-[#0284c7] rounded-t-lg overflow-hidden bg-white">
            <table className="w-full border-collapse text-[10px] leading-[1.42] table-fixed">
              <thead className="table-header-group">
                <tr className="bg-[#e1f0fa] border-b-[1.5px] border-[#0284c7] text-[#0369a1]">
                  {/* Column 1 (RTL Rightmost): التاريخ واليوم */}
                  <th className="border-l-[1.5px] border-[#0284c7] py-1 px-1 text-center font-black w-[16%]">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span className="text-[10.5px]">التاريخ واليوم</span>
                    </div>
                  </th>

                  {/* Column 2: التوقيت */}
                  <th className="border-l-[1.5px] border-[#0284c7] py-1 px-1 text-center font-black w-[15%]">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span className="text-[10.5px]">التوقيت</span>
                    </div>
                  </th>

                  {/* Column 3: القسم */}
                  <th className="border-l-[1.5px] border-[#0284c7] py-1 px-1 text-center font-black w-[13%]">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span className="text-[10.5px]">القسم</span>
                    </div>
                  </th>

                  {/* Column 4: المحتوى الدرس */}
                  <th className="border-l-[1.5px] border-[#0284c7] py-1 px-1.5 text-center font-black w-[41%]">
                    <div className="flex items-center justify-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span className="text-[10.5px]">المحتوى الدرس</span>
                    </div>
                  </th>

                  {/* Column 5 (RTL Leftmost): الملاحظات */}
                  <th className="py-1 px-1 text-center font-black w-[15%]">
                    <div className="flex items-center justify-center gap-1">
                      <FileEdit className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span className="text-[10.5px]">الملاحظات</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, rowIdx) => {
                  const globalRowIndex = allRows.findIndex((item) => item.id === r.id);
                  const previousRow = findPreviousComparableCurriculumRow(allRows, globalRowIndex, r);
                  const rawDisplayContent = buildHierarchicalContent(r, previousRow);
                  const displayContent = formatSemanticHtml(
                    rawDisplayContent,
                    hwActive ? hwStyle : { ...hwStyle, enabled: false },
                    { allowUTags: true }
                  );
                  const noteHtml = formatSemanticHtml(
                    r.note || '',
                    hwActive ? hwStyle : { ...hwStyle, enabled: false },
                    { defaultRole: 'noteOrange', allowUTags: false }
                  );
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
                      <tr className="bg-white hover:bg-sky-50/40 transition break-inside-avoid">
                        {/* Col 1: التاريخ واليوم */}
                        <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-1 py-1 text-center align-middle">
                          {r.dateStr.includes('/') ? (
                            <div className="flex flex-col gap-0.5 text-[9.5px] leading-tight font-bold">
                              {(() => {
                                const dateParts = r.dateStr.split('/');
                                const dayParts = (r.dayName || '').split('/');
                                return dateParts.map((dp, idx) => {
                                  const day = dayParts[idx]?.trim() || dayParts[0]?.trim() || '';
                                  const formatted = formatLogbookDateLabel(dp.trim());
                                  return (
                                    <div key={idx} className="bg-sky-50 border border-sky-200 rounded px-1 py-0.5">
                                      <span className="font-black text-[#0369a1]">{day} </span>
                                      <span className="text-zinc-700 font-bold font-mono text-[8.5px]">{formatted}</span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <div className="font-black text-[11px] text-[#0369a1] leading-tight">
                                {r.dayName || 'الأحد'}
                              </div>
                              <div className="font-mono text-[9.5px] font-bold text-zinc-700 mt-0.5" dir="rtl">
                                {formatLogbookDateLabel(r.dateStr)}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Col 2: التوقيت مع سهم */}
                        <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-1 py-1 text-center align-middle font-mono text-[9.5px] font-bold text-zinc-800" dir="ltr">
                          {formatTimingWithArrow(r.time)}
                        </td>

                        {/* Col 3: القسم */}
                        <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-1 py-1 text-center align-middle">
                          <span className="inline-block bg-[#0284c7] text-white px-2 py-0.5 rounded text-[10px] font-black shadow-2xs">
                            {r.section}
                          </span>
                          {r.level && !r.section.includes(r.level) && (
                            <div className="text-[8.5px] font-bold text-[#0369a1] mt-0.5">
                              {r.level}
                            </div>
                          )}
                        </td>

                        {/* Col 4: المحتوى الدرس */}
                        <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc] px-2 py-1 text-right align-top leading-[1.45]">
                          {r.note && r.note.includes('مخبري') && (
                            <div className="mb-0.5">
                              <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0 rounded text-[8.5px] font-bold">
                                عمل مخبري (أفواج)
                              </span>
                            </div>
                          )}
                          <div
                            className={`text-[10px] ${hwActive ? 'hw-scaled-body hw-ruled-paper' : ''} text-zinc-900 leading-[1.45] outline-none focus:bg-sky-50/80 focus:p-0.5 focus:rounded transition cursor-text whitespace-pre-line`}
                            style={hwActive ? { color: hwStyle.palette.bodyBlack } : undefined}
                            contentEditable={(r as any).__isSplitChunk ? false : 'plaintext-only'}
                            suppressContentEditableWarning
                            title={(r as any).__isSplitChunk ? 'حصة ممتدة عبر صفحتين — عدّلها من الجدول المصدر' : undefined}
                            onFocus={(e) => { e.currentTarget.dataset.originalText = e.currentTarget.innerText.trim(); }}
                            onBlur={(e) => {
                              if ((r as any).__isSplitChunk) return;
                              const val = e.currentTarget.innerText.trim();
                              if (onUpdateRow && val !== e.currentTarget.dataset.originalText) {
                                onUpdateRow(r.id, { content: val, manualContent: val });
                              }
                            }}
                            dangerouslySetInnerHTML={{ __html: displayContent }}
                          />
                        </td>

                        {/* Col 5: الملاحظات */}
                        <td
                          className={`border-b border-dashed border-[#7dd3fc] px-1.5 py-1 text-right align-top text-[9.5px] leading-[1.4] ${hwActive ? 'hw-scaled-body hw-ruled-paper' : ''} text-zinc-800 outline-none focus:bg-sky-50/80 focus:p-0.5 focus:rounded transition cursor-text whitespace-pre-line`}
                          contentEditable={(r as any).__isSplitChunk ? false : 'plaintext-only'}
                          suppressContentEditableWarning
                          onFocus={(e) => { e.currentTarget.dataset.originalText = e.currentTarget.innerText.trim(); }}
                          onBlur={(e) => {
                            if ((r as any).__isSplitChunk) return;
                            const val = e.currentTarget.innerText.trim();
                            if (onUpdateRow && val !== e.currentTarget.dataset.originalText) {
                              onUpdateRow(r.id, { note: val });
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: noteHtml }}
                        />
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Empty dashed rows filling up remaining available A4 vertical space */}
                {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => (
                  <tr key={`empty-line-${emptyIdx}`} className="bg-white">
                    <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc] h-[27px]" />
                    <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc]" />
                    <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc]" />
                    <td className="border-l-[1.5px] border-[#0284c7] border-b border-dashed border-[#7dd3fc]" />
                    <td className="border-b border-dashed border-[#7dd3fc]" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM SECTION WITH ORNAMENT AND SIGNATURES */}
        <div className="mt-auto pt-1 shrink-0 break-inside-avoid">
          {/* Ornamental Center Divider */}
          <div className="flex items-center justify-between px-1">
            <CornerLeaves flip={false} compact />
            <div className="flex-1 flex items-center justify-center gap-2 px-3">
              <span className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent to-[#0284c7]" />
              <span className="w-2 h-2 rotate-45 bg-[#0284c7]" />
              <span className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent to-[#0284c7]" />
            </div>
            <CornerLeaves flip={true} compact />
          </div>

          {/* Official Signatures Row */}
          <div className="mt-0.5 px-3 py-1 border-t border-b border-[#bae6fd] bg-[#f8fafc] grid grid-cols-4 gap-2 text-[9.5px] items-center">
            <div className="text-center">
              <div className="font-extrabold text-zinc-900">توقيع الأستاذ(ة)</div>
              <div className="mt-3 border-t border-dashed border-zinc-400 h-4" />
            </div>
            <div className="text-center relative">
              <div className="font-extrabold text-zinc-900">ختم الأستاذ(ة)</div>
              <div className="mt-0.5 flex justify-center">
                <TeacherOfficialStamp config={config} size="sm" sizeMm={15} />
              </div>
            </div>
            <div className="text-center">
              <div className="font-extrabold text-zinc-900">تأشيرة السيد المدير</div>
              <div className="mt-3 border-t border-dashed border-zinc-400 h-4" />
            </div>
            <div className="text-center">
              <div className="font-extrabold text-zinc-900">تأشيرة السيد المفتش</div>
              <div className="mt-3 border-t border-dashed border-zinc-400 h-4" />
            </div>
          </div>

          {/* Page Counter Badge */}
          <div className="flex items-center justify-center pt-1">
            <span className="bg-[#0369a1] text-white px-3.5 py-0.5 rounded-full font-black text-[9.5px] shadow-2xs">
              صفحة {pageIndex + 1} من {totalPages} — 🇩🇿
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
