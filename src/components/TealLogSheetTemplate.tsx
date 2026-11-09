import React from 'react';
import type { DailyLogSheetProps } from './DailyLogSheetTemplate';
import type { LogEntry } from './DailyLogbook';
import { splitLogbookTime } from '../utils/logbookPageTemplate';

/** An editable interpretation of the teacher's striped, ruled page. */
export const TealLogSheetTemplate: React.FC<DailyLogSheetProps> = ({
  pageRows, allRows, pageIndex, pageDimensions, buildHierarchicalContent,
  findPreviousComparableCurriculumRow, formatLogbookDateLabel, onUpdateRow,
  idPrefix = 'teal-page-content',
}) => {
  const saveText = (event: React.FocusEvent<HTMLElement>, row: LogEntry, field: 'content' | 'note') => {
    const value = event.currentTarget.innerText.trim();
    if (onUpdateRow && value !== event.currentTarget.dataset.originalText) {
      onUpdateRow(row.id, field === 'content' ? { content: value, manualContent: value } : { note: value });
    }
  };
  const focus = (event: React.FocusEvent<HTMLElement>) => { event.currentTarget.dataset.originalText = event.currentTarget.innerText.trim(); };
  const rule = 'border-l border-b border-[#86bec3] px-1 py-1 align-top';
  return (
    <div id={`${idPrefix}-${pageIndex}`} data-preview-export-page="true" data-logbook-content-page="true"
      className="print-page logbook-content-page teal-logbook-page relative mx-auto mb-8 overflow-hidden shadow-lg bg-white text-zinc-900"
      style={{ width: `${pageDimensions.w}mm`, height: `${pageDimensions.h}mm`, minHeight: `${pageDimensions.h}mm`, maxWidth: '100%', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      <svg aria-hidden="true" viewBox="0 0 1200 850" preserveAspectRatio="none" style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
        <defs><pattern id={`teal-stripes-${idPrefix}-${pageIndex}`} patternUnits="userSpaceOnUse" width="110" height="110" patternTransform="rotate(45)">
          <rect width="110" height="110" fill="#f6fafb"/><rect width="36" height="110" fill="#c8eaed"/><rect x="55" width="24" height="110" fill="#91c6cb"/>
        </pattern></defs>
        <rect width="1200" height="850" fill={`url(#teal-stripes-${idPrefix}-${pageIndex})`}/>
      </svg>
      <div className="relative h-full flex flex-col" style={{padding:'4%'}}>
        <div className="flex justify-between gap-4 px-3 text-[12px] font-bold text-zinc-900">
          <span className="bg-white border-2 border-[#76acb1] rounded-full px-4 py-0.5">التاريخ: ........................</span>
          <span className="bg-white border-2 border-[#76acb1] rounded-full px-4 py-0.5">الموافق لـ: ........................</span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col rounded-md border-2 border-[#8ac1c5] overflow-hidden bg-[#f9fcfc]">
          <table className="w-full border-collapse table-fixed text-[10px]" aria-label="نموذج الدفتر المخطط">
            <colgroup><col style={{width:'13%'}}/><col style={{width:'5%'}}/><col style={{width:'5%'}}/><col style={{width:'9%'}}/><col style={{width:'47%'}}/><col style={{width:'21%'}}/></colgroup>
            <thead className="bg-[#deeff1] text-[12px] text-black">
              <tr><th rowSpan={2} className={rule}>التاريخ<br/><span className="text-[9px]">من　　إلى</span></th><th colSpan={2} className={rule}>الوقت</th><th rowSpan={2} className={rule}>القسم</th><th rowSpan={2} className={rule}>سير الحصة و الأنشطة</th><th rowSpan={2} className="border-b border-[#86bec3]">ملاحظات</th></tr>
              <tr><th className={rule}>من</th><th className={rule}>إلى</th></tr>
            </thead>
            <tbody>{pageRows.map(row => {
              const previous = findPreviousComparableCurriculumRow(allRows, allRows.findIndex(item => item.id === row.id), row);
              const html = buildHierarchicalContent(row, previous).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;u&gt;/g, '<u>').replace(/&lt;\/u&gt;/g, '</u>');
              const [from, to] = splitLogbookTime(row.time);
              return <tr key={row.id}>
                <td className={`${rule} text-center`}><div>{row.dayName}</div><div dir="ltr">{(row.dateStr || '').split('/').map(d => formatLogbookDateLabel(d.trim())).join(' / ')}</div></td>
                <td className={`${rule} text-center`} dir="ltr">{from}</td><td className={`${rule} text-center`} dir="ltr">{to}</td>
                <td className={`${rule} text-center font-bold`}>{row.section}</td>
                <td className={`${rule} text-right whitespace-pre-line outline-none focus:bg-teal-50`} contentEditable="plaintext-only" suppressContentEditableWarning onFocus={focus} onBlur={e => saveText(e, row, 'content')} dangerouslySetInnerHTML={{__html: html}} />
                <td className="border-b border-[#86bec3] px-1 py-1 text-right align-top whitespace-pre-line outline-none focus:bg-teal-50" contentEditable="plaintext-only" suppressContentEditableWarning onFocus={focus} onBlur={e => saveText(e, row, 'note')}>{row.note || ''}</td>
              </tr>;
            })}</tbody>
          </table>
          <div className="flex-1 min-h-[60px]" aria-hidden="true">
            <svg width="100%" height="100%" preserveAspectRatio="none">
              <defs><pattern id={`teal-dots-${idPrefix}-${pageIndex}`} width="5" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="19" r="0.75" fill="#425f62" /></pattern></defs>
              <rect width="100%" height="100%" fill={`url(#teal-dots-${idPrefix}-${pageIndex})`} />
              {[21, 68, 77, 82, 87].map(position => <line key={position} x1={`${position}%`} x2={`${position}%`} y1="0" y2="100%" stroke="#86bec3" strokeWidth="1" />)}
            </svg>
          </div>
        </div>
        <div className="flex justify-between px-8 pt-1 font-bold text-[11px] text-black"><span>المدير(ة)</span><span>الأستاذ(ة)</span><span>المفتش(ة)</span></div>
      </div>
    </div>
  );
};
