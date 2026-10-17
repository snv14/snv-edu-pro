import React, { useState } from 'react';
import { LessonMemo, MemoConfig } from '../types';
import { Layers, Columns } from 'lucide-react';
import { TeacherOfficialStamp } from './TeacherOfficialStamp';

interface MemoSheetProps {
  lesson: LessonMemo | null;
  config: MemoConfig;
  activeActivities: boolean[];
  onToggleActivity: (idx: number) => void;
  onFormatChange?: (format: 'standard' | 'merged_teacher') => void;
  editable?: boolean;
}

const THEMES: Record<string, {
  hex: string;
  headerGrad: string;
  badgeBg: string;
  boxBg: string;
  tableHeadBg: string;
  cellHeaderBg: string;
  borderSoft: string;
}> = {
  '1am': {
    hex: '#159a8c',
    headerGrad: 'from-[#f0f9ff]/80 to-white',
    badgeBg: 'bg-[#0284c7]/10 text-[#0284c7]',
    boxBg: 'bg-[#f0f9ff]/60 border-[#0284c7]/25',
    tableHeadBg: 'bg-[#0284c7]',
    cellHeaderBg: 'bg-[#e0f2fe]/70 text-[#0284c7]',
    borderSoft: 'border-[#0284c7]/30',
  },
  '2am': {
    hex: '#5b82c4',
    headerGrad: 'from-[#f5f3ff]/80 to-white',
    badgeBg: 'bg-[#7c3aed]/10 text-[#7c3aed]',
    boxBg: 'bg-[#f5f3ff]/60 border-[#7c3aed]/25',
    tableHeadBg: 'bg-[#7c3aed]',
    cellHeaderBg: 'bg-[#ede9fe]/70 text-[#7c3aed]',
    borderSoft: 'border-[#7c3aed]/30',
  },
  '3am': {
    hex: '#159a8c',
    headerGrad: 'from-[#f0fdfa]/90 via-[#e6fffa]/80 to-white',
    badgeBg: 'bg-teal-100 text-teal-900 border border-teal-300',
    boxBg: 'bg-[#f0fdfa]/70 border-teal-300/40',
    tableHeadBg: 'bg-[#0f766e]',
    cellHeaderBg: 'bg-[#ccfbf1]/80 text-[#0f766e]',
    borderSoft: 'border-[#0f766e]/30',
  },
  '4am': {
    hex: '#d46a91',
    headerGrad: 'from-[#fff0f5]/80 to-white',
    badgeBg: 'bg-[#c2185b]/10 text-[#c2185b]',
    boxBg: 'bg-[#fff5f8]/60 border-[#c2185b]/25',
    tableHeadBg: 'bg-[#c2185b]',
    cellHeaderBg: 'bg-[#ffe4ec]/70 text-[#c2185b]',
    borderSoft: 'border-[#c2185b]/30',
  },
};


const RenderTable = ({ tables, themeHex }: { tables: any[], themeHex: string }) => {
  if (!tables || tables.length === 0) return null;
  return (
    <div className="mt-2 space-y-3">
      {tables.map((tbl, i) => (
        <table key={i} className="w-full border-collapse border border-gray-300 text-[12px] text-center mb-2" style={{ borderColor: themeHex + '40' }}>
          {tbl.headers && tbl.headers.length > 0 && (
            <thead>
              <tr style={{ backgroundColor: themeHex + '15' }}>
                {tbl.headers.map((h: string, j: number) => (
                  <th key={j} className="border p-1.5 font-bold" style={{ borderColor: themeHex + '40', color: '#1f2937' }}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tbl.rows.map((row: string[], r: number) => (
              <tr key={r} className="hover:bg-gray-50 bg-white">
                {row.map((cell: string, c: number) => (
                  <td key={c} className="border p-1.5 text-gray-800" style={{ borderColor: themeHex + '40' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
};

export const MemoSheet: React.FC<MemoSheetProps> = ({
  lesson,
  config,
  activeActivities,
  onToggleActivity,
  onFormatChange,
  editable = true,
}) => {
  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-[500px] text-gray-400 font-bold">
        الرجاء اختيار مورد تعلمي لعرض المذكرة
      </div>
    );
  }

  const isMergedFormat = config.memoFormat === 'merged_teacher';
  const theme = THEMES[config.level || '2am'] || THEMES['2am'];

  // حالات التحكم في تنسيقات كتابة الوضعية
  const [situationFontSize, setSituationFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [situationBold, setSituationBold] = useState<boolean>(false);
  const [situationAlign, setSituationAlign] = useState<'right' | 'center' | 'justify'>('right');
  const [situationCardTheme, setSituationCardTheme] = useState<'theme' | 'classic' | 'white'>('theme');
  const [situationLineHeight, setSituationLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');

  const situationTextClass = `
    ${situationFontSize === 'sm' ? 'text-[12px]' : situationFontSize === 'lg' ? 'text-[15.5px]' : situationFontSize === 'xl' ? 'text-[17.5px]' : 'text-[13.5px]'}
    ${situationBold ? 'font-bold' : 'font-medium'}
    ${situationAlign === 'center' ? 'text-center' : situationAlign === 'justify' ? 'text-justify' : 'text-right'}
    ${situationLineHeight === 'normal' ? 'leading-normal' : situationLineHeight === 'loose' ? 'leading-loose' : 'leading-relaxed'}
  `.trim();

  const situationBoxClass = `
    p-2.5 rounded-lg border transition-all
    ${situationCardTheme === 'classic' ? 'bg-gray-50/90 border-gray-200 text-gray-800' :
      situationCardTheme === 'white' ? 'bg-white border-gray-300 text-gray-900 shadow-2xs' :
      `${theme.boxBg} text-gray-900`}
  `.trim();

  const levelLabel =
    config.level === '4am'
      ? 'السنة الرابعة متوسط'
      : config.level === '3am'
      ? 'السنة الثالثة متوسط'
      : config.level === '2am'
      ? 'السنة الثانية متوسط'
      : 'السنة الأولى متوسط';

  return (
    <div
      id="memo-paper"
      className="print-document bg-[#fffdf8]/96 backdrop-blur-[2px] text-gray-900 shadow-[0_14px_45px_rgba(20,110,100,0.10)] rounded-sm mx-auto p-7 md:p-9 max-w-[960px] border border-[#d8eee9] font-sans leading-relaxed text-[13.5px] print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
      style={{ minHeight: '1120px' }}
      dir="rtl"
    >
      <style>{` .editable-cell { padding: 2px; border-radius: 4px; min-height: 1.5em; white-space: pre-wrap; word-break: break-word; outline: none; } .editable-cell:hover { background-color: rgba(0,0,0,0.03); } .editable-cell:focus { outline: 1px dashed ${theme.hex}; background-color: rgba(255,255,255,0.9); } `}</style>
      
      {/* شريط التحكم في تنسيقات كتابة الوضعية وتخطيط المذكرة */}
      {editable && (
        <div className="print:hidden mb-4 p-3 bg-white border border-teal-200/80 rounded-xl shadow-xs space-y-2.5">
          {/* سطر 1: نموذج التخطيط وزر الاستعادة */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-[12.5px] font-black text-gray-800">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.hex }} />
              <span>التحكم في تنسيقات كتابة الوضعية ({levelLabel}):</span>
              <span className="text-[11.5px] font-normal text-gray-500">
                (تخصيص نصوص الوضعيات والمشكل العلمي والفرضيات)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onFormatChange && (
                <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => onFormatChange('standard')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      !isMergedFormat ? 'bg-gray-900 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Columns className="w-3 h-3" />
                    <span>مفصلة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onFormatChange('merged_teacher')}
                    style={isMergedFormat ? { backgroundColor: theme.hex, color: '#fff' } : undefined}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      isMergedFormat ? 'shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>مدمجة</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setSituationFontSize('base');
                  setSituationBold(false);
                  setSituationAlign('right');
                  setSituationCardTheme('theme');
                  setSituationLineHeight('relaxed');
                }}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                title="استعادة إعدادات التنسيق الافتراضية"
              >
                استعادة الافتراضي
              </button>
            </div>
          </div>

          {/* سطر 2: أدوات تنسيق نص الوضعية */}
          <div className="flex flex-wrap items-center gap-2.5 text-[11.5px]">
            {/* حجم الخط */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-bold px-1">حجم الخط:</span>
              <button
                type="button"
                onClick={() => setSituationFontSize('sm')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationFontSize === 'sm' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                صغير (12)
              </button>
              <button
                type="button"
                onClick={() => setSituationFontSize('base')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationFontSize === 'base' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                عادي (14)
              </button>
              <button
                type="button"
                onClick={() => setSituationFontSize('lg')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationFontSize === 'lg' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                متوسط (16)
              </button>
              <button
                type="button"
                onClick={() => setSituationFontSize('xl')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationFontSize === 'xl' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                كبير (18)
              </button>
            </div>

            {/* سمك الخط */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-bold px-1">السمك:</span>
              <button
                type="button"
                onClick={() => setSituationBold(false)}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${!situationBold ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                عادي
              </button>
              <button
                type="button"
                onClick={() => setSituationBold(true)}
                className={`px-2 py-0.5 rounded font-black transition cursor-pointer ${situationBold ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                عريض (B)
              </button>
            </div>

            {/* محاذاة النص */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-bold px-1">المحاذاة:</span>
              <button
                type="button"
                onClick={() => setSituationAlign('right')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationAlign === 'right' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                يمين
              </button>
              <button
                type="button"
                onClick={() => setSituationAlign('center')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationAlign === 'center' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                توسيط
              </button>
              <button
                type="button"
                onClick={() => setSituationAlign('justify')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationAlign === 'justify' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                ضبط الأسطر
              </button>
            </div>

            {/* مظهر بطاقة الوضعية */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-bold px-1">مظهر الصندوق:</span>
              <button
                type="button"
                onClick={() => setSituationCardTheme('theme')}
                style={situationCardTheme === 'theme' ? { backgroundColor: theme.hex, color: '#fff' } : undefined}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationCardTheme === 'theme' ? '' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                ملون بالسمة
              </button>
              <button
                type="button"
                onClick={() => setSituationCardTheme('classic')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationCardTheme === 'classic' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                رمادي
              </button>
              <button
                type="button"
                onClick={() => setSituationCardTheme('white')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationCardTheme === 'white' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                أبيض ناصع
              </button>
            </div>

            {/* تباعد الأسطر */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-bold px-1">تباعد الأسطر:</span>
              <button
                type="button"
                onClick={() => setSituationLineHeight('normal')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationLineHeight === 'normal' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                عادي
              </button>
              <button
                type="button"
                onClick={() => setSituationLineHeight('relaxed')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationLineHeight === 'relaxed' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                مريح
              </button>
              <button
                type="button"
                onClick={() => setSituationLineHeight('loose')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${situationLineHeight === 'loose' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                واسع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. الترويسة العليا للمذكرة */}
      <div
        className={`border-2 rounded-lg p-3.5 mb-4 bg-gradient-to-l ${theme.headerGrad}`}
        style={{ borderColor: theme.hex }}
      >
        <div className="text-center font-extrabold text-[12px] text-gray-500 pb-1 mb-1.5 border-b border-gray-200">
          الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية
          <span className="block text-[13px] mt-0.5" style={{ color: theme.hex }}>
            {isMergedFormat
              ? 'مذكرة بيداغوجية بنشاط الأستاذ المدمج (بدون خانة نشاط المتعلم)'
              : 'مذكرة بيداغوجية لمادة علوم الطبيعة والحياة (النموذج المفصل)'}
          </span>
        </div>

        <div className={`grid grid-cols-3 items-center text-center font-bold text-[13px] text-gray-800 pb-2 border-b ${theme.borderSoft}`}>
          <div className="text-right flex items-center gap-1.5">
            <span className="font-extrabold text-[14px]" style={{ color: theme.hex }}>رقم المذكرة:</span>
            <span className={`font-extrabold text-[15px] px-2.5 py-0.5 rounded ${theme.badgeBg}`}>
              {config.memoNumber || '01'}
            </span>
          </div>
          <div className="font-extrabold text-[15px]" style={{ color: theme.hex }}>
            المستوى: {levelLabel}
          </div>
          <div className="text-left font-bold">
            الأستاذ: <span className="editable-cell text-gray-900 font-extrabold" contentEditable="plaintext-only" suppressContentEditableWarning>{config.teacherName}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center text-center text-[12.5px] text-gray-700 pt-2 font-medium">
          <div className="text-right">
            <span className="font-bold text-gray-900">مديرية التربية:</span> {config.directorate}
          </div>
          <div>
            <span className="font-bold text-gray-900">المتوسطة:</span> {config.schoolName}
          </div>
          <div className="text-left">
            <span className="font-bold text-gray-900">الموسم:</span> {config.schoolYear}
          </div>
        </div>
      </div>

      {/* 2. الكفاءة الختامية */}
      {lesson.kafaaKhitamiya && (
        <div className="mb-3.5 border border-[#cfe7e2] rounded-lg p-2.5 bg-[#f1faf7]/80 text-[12.5px]">
          <span className="font-extrabold ml-1.5" style={{ color: theme.hex }}>الكفاءة الختامية:</span>
          <span className="editable-cell text-gray-800 leading-snug font-medium" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.kafaaKhitamiya}</span>
        </div>
      )}

      {/* 3. شبكة بيانات المقطع والمورد والمركبة */}
      <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-right text-[12.5px] border-collapse">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className={`w-28 p-2 font-extrabold border-l border-gray-300 ${theme.cellHeaderBg}`}>
                الميدان
              </td>
              <td className="editable-cell p-2 font-bold text-gray-900" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.midan}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="w-28 p-2 font-extrabold border-l border-gray-300 bg-gray-50" style={{ color: theme.hex }}>
                المقطع التعلمي
              </td>
              <td className="editable-cell p-2 font-bold text-gray-800" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.maqta}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className={`w-28 p-2 font-extrabold border-l border-gray-300 ${theme.cellHeaderBg}`}>
                المورد التعلمي
              </td>
              <td className="editable-cell p-2 font-bold text-gray-900" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.mawrid}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="w-28 p-2 font-extrabold border-l border-gray-300 bg-gray-50" style={{ color: theme.hex }}>
                تعلم المورد
              </td>
              <td className="editable-cell p-2 font-extrabold text-[13.5px]" style={{ color: theme.hex }} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.ta3alom}</td>
            </tr>
            <tr>
              <td className={`w-28 p-2 font-extrabold border-l border-gray-300 ${theme.cellHeaderBg}`}>
                مركبة الكفاءة
              </td>
              <td className="editable-cell p-2 text-gray-800 font-medium leading-snug" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.markaba}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. معايير التقويم والموارد المعرفية والوسائل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-[12.5px]">
        {/* معايير التقويم */}
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <div className="font-extrabold mb-1.5 pb-1 border-b border-gray-200" style={{ color: theme.hex }}>
            معايير التقويم
          </div>
          <div className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
            {lesson.ma3ayirTaqwim || '• يحدد المفاهيم الأساسية\n• يحلل الظواهر العلمية بدقة\n• يقترح حلولا علمية مؤسسة'}
          </div>
        </div>

        {/* الموارد المعرفية والمصطلحات */}
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <div className="font-extrabold mb-1.5 pb-1 border-b border-gray-200" style={{ color: theme.hex }}>
            الموارد المعرفية والمصطلحات
          </div>
          <p className="editable-cell text-gray-700 leading-relaxed font-medium mb-1.5" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.marifa}</p>
          <div className="text-[11.5px] text-gray-600">
            <span className="font-bold text-gray-900">المصطلحات: </span>
            {lesson.mostalahat}
          </div>
        </div>
      </div>

      {/* شريط الوسائل والمراجع والزمن الكلي */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2.5 mb-4 bg-[#f1faf7] border border-[#cfe7e2] rounded-lg text-[12px]">
        <div>
          <span className="font-extrabold" style={{ color: theme.hex }}>الوسائل: </span>
          <span className="editable-cell text-gray-800" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.wasail}</span>
        </div>
        <div>
          <span className="font-extrabold" style={{ color: theme.hex }}>المراجع: </span>
          <span className="text-gray-800">{lesson.marajie || 'المنهاج، الوثيقة المرافقة، دليل الأستاذ'}</span>
        </div>
        <div className="text-left font-bold">
          <span className="font-extrabold" style={{ color: theme.hex }}>الزمن الكلي: </span>
          <span className="text-gray-900">{lesson.zamanKoli || '6 ساعات'}</span>
        </div>
      </div>

      {/* 5. سير الحصة (جدول الأنشطة وسيرورة التعلمات) */}
      <div className="mb-5">
        <div
          className="text-white font-extrabold text-[14px] px-3.5 py-1.5 rounded-t-lg text-center flex items-center justify-between"
          style={{ backgroundColor: theme.hex }}
        >
          <span>
            سير الحصة والنشاطات التعلمية {isMergedFormat ? '(نشاط الأستاذ المدمج)' : ''}
          </span>
          <span className="text-[11.5px] font-normal opacity-90">
            {isMergedFormat ? 'مخطط بناء التعلمات (بدون خانة نشاط المتعلم)' : 'مخطط بناء التعلمات'}
          </span>
        </div>

        {isMergedFormat ? (
          /* نموذج 2: المذكرة المدمجة - بدون خانة نشاط المتعلم (دمج نشاط الأستاذ والمتعلم تحت نشاط الأستاذ) */
          <table className="w-full border-collapse border border-gray-300 text-[12.5px] text-right">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-900 font-extrabold text-center">
                <th className="p-2 border-l border-gray-300 w-24">المراحل</th>
                <th className="p-2 border-l border-gray-300">نشاط الأستاذ (المهام وسيرورة بناء التعلمات)</th>
                <th className="p-2 border-l border-gray-300 w-16">الزمن</th>
                <th className="p-2 w-20">ملاحظة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {/* مرحلة 1: الانطلاق المدمجة */}
              <tr className="bg-white">
                <td
                  className="p-2.5 font-extrabold border-l border-gray-300 align-top text-center"
                  style={{ color: theme.hex, backgroundColor: `${theme.hex}10` }}
                >
                  وضعية الانطلاق
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed">
                  <div className="mb-2">
                    <span className="font-extrabold block mb-1 text-[13px]" style={{ color: theme.hex }}>تقديم الوضعية وطرح المشكل العلمي:</span>
                    <div className={`editable-cell ${situationBoxClass} ${situationTextClass}`} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.wadiya}</div>
                    <div className={`editable-cell font-bold mt-1.5 p-2 rounded border border-teal-200/50 bg-teal-50/40 ${situationTextClass}`} style={{ color: theme.hex }} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.moshkila}</div>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1 text-[12.5px]">المهمة وصياغة الفرضيات:</span>
                    <div className={`editable-cell whitespace-pre-line ${situationBoxClass} ${situationTextClass}`} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.faradiyat}</div>
                    <RenderTable tables={lesson.wadiyaTables || []} themeHex={theme.hex} />
                  </div>
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                  10 د
                </td>
                <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                  جماعي
                </td>
              </tr>

              {/* مرحلة 2: البحث والتقصي المدمجة */}
              {lesson.anshita.map((activity, idx) => {
                const isSelected = activeActivities[idx] !== false;
                if (!isSelected && !editable) return null;

                return (
                  <tr
                    key={idx}
                    className={`transition ${isSelected ? 'bg-white' : 'bg-gray-50 opacity-40 print:hidden'}`}
                  >
                    <td className="p-2.5 font-bold text-gray-900 border-l border-gray-300 bg-gray-50 align-top text-center">
                      {editable && (
                        <div className="print:hidden mb-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleActivity(idx)}
                            style={{ accentColor: theme.hex }}
                            className="cursor-pointer"
                            title="تضمين في الطباعة"
                          />
                        </div>
                      )}
                      <span className="text-[12px] font-extrabold block mb-1" style={{ color: theme.hex }}>
    مرحلة البحث والتقصي
  </span>
                      <span className="text-[11px] text-gray-600 block mt-0.5">
                        نشاط {idx + 1}
                      </span>
                    </td>
                    <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed">
                      <div className="editable-cell font-extrabold mb-1.5 text-[13.5px] pb-1 border-b border-gray-200" style={{ color: theme.hex }} contentEditable="plaintext-only" suppressContentEditableWarning>{activity.title}</div>
                      <div className="mb-2">
                        <span className="font-bold text-gray-900 text-[12.5px] block mb-0.5">المهمة والتعليمات المسندة:</span>
                        <p className="editable-cell text-gray-700 font-medium bg-gray-50/70 p-2 rounded border border-gray-200 leading-relaxed" contentEditable="plaintext-only" suppressContentEditableWarning>{activity.asila}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[12.5px] block mb-0.5" style={{ color: theme.hex }}>المنتوج والاستجابة المنتظرة:</span>
                        <p className={`editable-cell ` + `text-gray-800 font-medium p-2 rounded border leading-relaxed ${theme.boxBg}`} contentEditable="plaintext-only" suppressContentEditableWarning>{activity.ajwiba}</p>
                      </div>
                    </td>
                    <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                      {activity.zaman || '25 د'}
                    </td>
                    <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                      {activity.mola7adha || 'أفواج'}
                    </td>
                  </tr>
                );
              })}

              {/* مرحلة 3: إرساء الموارد المدمجة */}
              <tr className="bg-white">
                <td
                  className="p-2.5 font-extrabold border-l border-gray-300 align-top text-center"
                  style={{ color: theme.hex, backgroundColor: `${theme.hex}10` }}
                >
                  إرساء الموارد
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed">
                  <div className="mb-2 text-[12px] text-gray-600 font-bold bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-900 font-extrabold">توجيه الأستاذ: </span>
                    {lesson.ustadhNashat?.irsae || 'يوجه المناقشة لتلخيص المكتسبات، وتنسيق الإجابات وهيكلة المفاهيم لبناء الحصيلة المعرفية المشتركة للمورد.'}
                  </div>
                  <div className="font-extrabold mb-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: theme.hex }}>
                    <span>الحصيلة المعرفية والمفاهيمية المهيكلة (إرساء الموارد):</span>
                  </div>
                  <div className={`editable-cell ` + `text-gray-900 font-medium leading-relaxed p-3 rounded-lg border shadow-2xs whitespace-pre-line ${theme.boxBg}`} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.irsae}</div>
                  <RenderTable tables={lesson.irsaeTables || []} themeHex={theme.hex} />
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                  15 د
                </td>
                <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                  فردي / كراس
                </td>
              </tr>

              {/* مرحلة 4: تقويم الموارد المدمجة */}
              <tr className="bg-white">
                <td
                  className="p-2.5 font-extrabold border-l border-gray-300 align-top text-center bg-gray-50"
                  style={{ color: theme.hex }}
                >
                  تقويم الموارد
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed">
                  <div className="mb-1 text-[12px] text-gray-600 font-medium">
                    {lesson.ustadhNashat?.taqwim || 'يطرح تمرين تقويمي لقياس مدى تحقق معايير الكفاءة والتحكم في المورد.'}
                  </div>
                  <div className="font-bold text-gray-900 mb-1 text-[12.5px]">المهمة التقويمية والتحكم:</div>
                  <div className="editable-cell text-gray-800 leading-relaxed bg-gray-50 p-2 rounded border border-gray-200" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.taqwim}</div>
                  <RenderTable tables={lesson.taqwimTables || []} themeHex={theme.hex} />
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                  10 د
                </td>
                <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                  تقويم تكويني
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          /* نموذج 1: المذكرة المفصلة (عمودان للأستاذ والمتعلم) */
          <table className="w-full border-collapse border border-gray-300 text-[12.5px] text-right">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-900 font-extrabold text-center">
                <th className="p-2 border-l border-gray-300 w-24">المراحل</th>
                <th className="p-2 border-l border-gray-300">نشاط الأستاذ</th>
                <th className="p-2 border-l border-gray-300">نشاط المتعلم</th>
                <th className="p-2 border-l border-gray-300 w-16">الزمن</th>
                <th className="p-2 w-20">ملاحظة</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-300">
              {/* مرحلة 1: الانطلاق */}
              <tr className="bg-white">
                <td
                  className="p-2.5 font-extrabold border-l border-gray-300 align-top text-center"
                  style={{ color: theme.hex, backgroundColor: `${theme.hex}10` }}
                >
                  وضعية الانطلاق
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed font-medium">
                  {lesson.ustadhNashat?.inilitaq || (
                    <div>
                      <div className="font-bold text-gray-900 mb-1 text-[13px]">تقديم الوضعية وطرح المشكل العلمي:</div>
                      <div className={`editable-cell ${situationBoxClass} ${situationTextClass}`} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.wadiya}</div>
                      <div className={`editable-cell font-bold mt-1.5 p-2 rounded border border-teal-200/50 bg-teal-50/40 ${situationTextClass}`} style={{ color: theme.hex }} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.moshkila}</div>
                    </div>
                  )}
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed font-medium">
                  {lesson.mutaalimNashat?.inilitaq || (
                    <div>
                      <div className="font-bold text-gray-900 mb-1 text-[12.5px]">الملاحظة وصياغة الفرضيات:</div>
                      <div className={`editable-cell whitespace-pre-line ${situationBoxClass} ${situationTextClass}`} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.faradiyat}</div>
                    </div>
                  )}
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                  10 د
                </td>
                <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                  جماعي
                </td>
              </tr>

              {/* مرحلة 2: البحث والتقصي (الأنشطة المحددة) */}
              {lesson.anshita.map((activity, idx) => {
                const isSelected = activeActivities[idx] !== false;
                if (!isSelected && !editable) return null;

                return (
                  <tr
                    key={idx}
                    className={`transition ${isSelected ? 'bg-white' : 'bg-gray-50 opacity-40 print:hidden'}`}
                  >
                    <td className="p-2.5 font-bold text-gray-900 border-l border-gray-300 bg-gray-50 align-top text-center">
                      {editable && (
                        <div className="print:hidden mb-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleActivity(idx)}
                            style={{ accentColor: theme.hex }}
                            className="cursor-pointer"
                            title="تضمين في الطباعة"
                          />
                        </div>
                      )}
                      <span className="text-[12px] font-extrabold block mb-1" style={{ color: theme.hex }}>
    مرحلة البحث والتقصي
  </span>
                      <span className="text-[11px] text-gray-600 block mt-0.5">
                        نشاط {idx + 1}
                      </span>
                    </td>
                    <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed">
                      <div className="editable-cell font-extrabold mb-1 text-[13px]" style={{ color: theme.hex }} contentEditable="plaintext-only" suppressContentEditableWarning>{activity.title}</div>
                      <div className="font-bold text-gray-800 text-[12px] mb-0.5">المهمة والتعليمات:</div>
                      <p className="editable-cell text-gray-700 font-medium" contentEditable="plaintext-only" suppressContentEditableWarning>{activity.asila}</p>
                    </td>
                    <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed font-medium">
                      <div className="font-bold text-gray-800 text-[12px] mb-0.5">الاستجابة والمنتوج المنتظر:</div>
                      <p className="editable-cell text-gray-700 leading-relaxed" contentEditable="plaintext-only" suppressContentEditableWarning>{activity.ajwiba}</p>
                    </td>
                    <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                      {activity.zaman || '25 د'}
                    </td>
                    <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                      {activity.mola7adha || 'أفواج'}
                    </td>
                  </tr>
                );
              })}

              {/* مرحلة 3: إرساء الموارد */}
              <tr className="bg-white">
                <td
                  className="p-2.5 font-extrabold border-l border-gray-300 align-top text-center"
                  style={{ color: theme.hex, backgroundColor: `${theme.hex}10` }}
                >
                  إرساء الموارد
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed font-medium">
                  <div className="font-bold text-gray-900 mb-1">توجيه وهيكلة التعلمات:</div>
                  <p className="text-gray-700 leading-relaxed">
                    {lesson.ustadhNashat?.irsae || 'يوجه المناقشة لتلخيص المكتسبات، وتنسيق الإجابات وهيكلة المفاهيم لبناء الحصيلة المعرفية المشتركة للمورد.'}
                  </p>
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed">
                  <div className="text-[12px] text-gray-600 font-bold mb-1.5 pb-1 border-b border-gray-200">
                    <span className="text-gray-900 font-extrabold">دور المتعلم: </span>
                    {lesson.mutaalimNashat?.irsae || 'يشارك بنشاط في استخلاص النتائج وصياغة المفاهيم، ويدون حصيلة إرساء المورد في كراسه.'}
                  </div>
                  <div className="font-extrabold mb-1 text-[12.5px] flex items-center gap-1" style={{ color: theme.hex }}>
                    <span>📌</span>
                    <span>الحصيلة المعرفية والمفاهيم المستخلصة (إرساء المورد):</span>
                  </div>
                  <div className={`editable-cell ` + `text-gray-900 font-medium leading-relaxed p-2.5 rounded-lg border shadow-2xs whitespace-pre-line text-[12.5px] ${theme.boxBg}`} contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.irsae}</div>
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                  15 د
                </td>
                <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                  فردي / كراس
                </td>
              </tr>

              {/* مرحلة 4: تقويم الموارد */}
              <tr className="bg-white">
                <td
                  className="p-2.5 font-extrabold border-l border-gray-300 bg-gray-50 align-top text-center"
                  style={{ color: theme.hex }}
                >
                  تقويم الموارد
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed font-medium">
                  {lesson.ustadhNashat?.taqwim || 'يطرح تمرين تقويمي لقياس مدى تحقق معايير الكفاءة والتحكم في المورد.'}
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-gray-800 leading-relaxed font-medium">
                  <div className="font-bold text-gray-900 mb-0.5">تطبيق وتحكم:</div>
                  <div className="editable-cell text-gray-800 leading-relaxed" contentEditable="plaintext-only" suppressContentEditableWarning>{lesson.taqwim}</div>
                </td>
                <td className="p-2.5 border-l border-gray-300 align-top text-center font-bold text-gray-700">
                  10 د
                </td>
                <td className="p-2.5 align-top text-center text-gray-500 text-[11px]">
                  تقويم تكويني
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* 5.5. الرسومات والسندات العلمية المرفقة بالمذكرة */}
      {((lesson.diagrams && lesson.diagrams.length > 0) || lesson.diagramSvg || lesson.diagram) && (
        <div
          className="memo-diagram-block mt-6 p-4 rounded-xl border border-[#cfe7e2] bg-[#f1faf7]/80 print:border-gray-400 print:bg-white page-break-inside-avoid break-inside-avoid"
          style={{ position: 'relative', top: 'auto', bottom: 'auto', transform: 'none', float: 'none', clear: 'both' }}
          data-pdf-keep="true"
        >
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.hex }}></span>
              <span className="font-extrabold text-[13px] text-gray-900">
                السندات العلمية والرسومات التخطيطية للمورد
              </span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 print:hidden">
              وثائق المذكرة
            </span>
          </div>

          <div className="space-y-4">
            {(lesson.diagrams && lesson.diagrams.length > 0
              ? lesson.diagrams
              : [{
                  title: lesson.diagramTitle,
                  svg: typeof lesson.diagram === 'string'
                    ? lesson.diagram
                    : (lesson.diagramSvg || lesson.diagram?.svg || ''),
                  description: lesson.diagramDescription || (typeof lesson.diagram === 'object' ? lesson.diagram?.description : undefined)
                }]
            ).map((diagram, index) => (
              <div
                key={index}
                className="memo-diagram-item page-break-inside-avoid break-inside-avoid"
                style={{ position: 'relative', top: 'auto', bottom: 'auto', transform: 'none', float: 'none' }}
              >
                {diagram.title && (
                  <div className="font-extrabold text-[12.5px] text-center mb-2" style={{ color: theme.hex }}>
                    {diagram.title}
                  </div>
                )}
                <div
                  className="memo-diagram-canvas w-full flex items-center justify-center p-2 bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-2xs"
                  style={{ position: 'relative', top: 'auto', bottom: 'auto', transform: 'none', float: 'none', minHeight: '0' }}
                  dangerouslySetInnerHTML={{ __html: diagram.svg || '' }}
                />
                {diagram.description && (
                  <p className="mt-2 text-[12px] text-gray-600 leading-relaxed font-medium text-center">
                    {diagram.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. التوقيعات والختم وأسفل الصفحة */}
      <div className="mt-8 pt-4 border-t-2 border-gray-300 flex items-center justify-between page-break-inside-avoid break-inside-avoid">
        <div className="text-right flex items-center gap-4">
          <div>
            <div className="font-extrabold text-[13px] text-gray-800 mb-0.5">
              ختم وتأشيرة الأستاذ:
            </div>
            <div className="text-[12px] text-gray-700 font-bold">
              الأستاذ(ة): <span className="text-gray-900">{config.teacherName || 'أستاذ المادة'}</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {config.schoolName || 'المتوسطة'}
            </div>
          </div>

          <div className="mr-2">
            <TeacherOfficialStamp
              config={config}
              size="sm"
              color={config.level === '1am' ? 'blue' : config.level === '2am' ? 'purple' : config.level === '3am' ? 'teal' : 'red'}
            />
          </div>
        </div>

        <div className="memo-page-number text-center font-bold text-[12.5px] text-gray-500 editable-cell print:hidden" contentEditable="plaintext-only" suppressContentEditableWarning>الصفحة 1 / 1</div>

        <div className="text-left">
          <div className="font-extrabold text-[13px] text-gray-800 mb-1">
            تأشيرة الإدارة / المفتش:
          </div>
          <div className="w-32 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[10.5px] text-gray-400">
            تاريخ والتأشيرة
          </div>
        </div>
      </div>
    </div>
  );
};

