import React, { useMemo, useState, useEffect } from 'react';
import { generateDistributionDocx } from "../utils/docxExportDistribution";
import { LessonMemo, MemoConfig } from '../types';
import { TeacherOfficialStamp } from './TeacherOfficialStamp';
import { LESSONS_1AM } from '../data/lessons1am';
import { LESSONS_2AM } from '../data/lessons2am';
import { LESSONS_3AM } from '../data/lessons3am';
import { LESSONS_4AM } from '../data/lessons4am';
import { generateAnnualDistribution, AnnualCalendarEvent } from '../utils/annualDistributionGenerator';
import { 
  OFFICIAL_1AM_DISTRIBUTION, 
  OFFICIAL_2AM_DISTRIBUTION, 
  OFFICIAL_3AM_DISTRIBUTION, 
  OFFICIAL_4AM_DISTRIBUTION,
  OfficialAnnualDistributionRow 
} from '../data/officialAnnualDistributionData';
import { CalendarAdjustmentModal } from './CalendarAdjustmentModal';
import { 
  SchoolCalendarSettings, 
  getDefaultCalendarSettings, 
  recalculateDistributionRows, 
  syncCalendarToDailyLogbook,
  syncCalendarToAllLevels,
  deriveDefaultSchoolEntryDate,
  deriveSchoolYearFromDate,
  ANNUAL_SCHEDULE_DATA_VERSION,
  ANNUAL_STORAGE_KEY
} from '../utils/annualDistributionDateUtils';

import { Printer, FileDown, Eye, X, RotateCcw, Sparkles, CalendarDays, Clock, Settings2, CalendarCheck, Check } from 'lucide-react';

interface Props {
  level: "1am" | "2am" | "3am" | "4am";
  config: MemoConfig;
  setConfig?: React.Dispatch<React.SetStateAction<MemoConfig>>;
  showToast: (msg: string) => void;
  curriculumLessons?: LessonMemo[];
  curriculumBackground?: string;
}

export const OfficialAnnualDistribution: React.FC<Props> = ({ level, config, setConfig, showToast, curriculumLessons, curriculumBackground }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // تنظيف أي تدرجات قديمة من التخزين المحلي لضمان استبدالها الكامل بالتدرج الوزاري الجديد
  useEffect(() => {
    try {
      const oldKeys = [
        'algeria_sciences_annual_dist_v5',
        'algeria_sciences_annual_dist_v4',
        'algeria_sciences_annual_dist_v3',
        'algeria_sciences_annual_dist_v2',
        'algeria_sciences_annual_dist_v1',
        'algeria_sciences_annual_dist',
        'annual_distribution_table',
      ];
      oldKeys.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }, []);

  // مصدر الصفوف الوزارية الافتراضية المعتمدة
  const officialBaseRows = useMemo<OfficialAnnualDistributionRow[]>(() => {
    const raw =
      level === '1am' ? OFFICIAL_1AM_DISTRIBUTION :
      level === '2am' ? OFFICIAL_2AM_DISTRIBUTION :
      level === '3am' ? OFFICIAL_3AM_DISTRIBUTION :
      OFFICIAL_4AM_DISTRIBUTION;

    return raw.map((row, idx) => {
      const text = [row.maqta, row.mawrid, row.session1, row.session2].join(' ');
      const isHoliday = row.isHoliday || /عطلة/.test(text);
      const isExam = row.isExam || /إ?ختبار|اختبارات|الفرض المحروس|الفرض/.test(text);
      return {
        ...row,
        week: typeof row.week === 'number' ? row.week : (idx + 1),
        isHoliday,
        isExam,
        lessonType: isHoliday ? 'holiday' as const : isExam ? 'assessment' as const : 'curriculum' as const,
        holidayLabel: isHoliday ? row.holidayLabel || row.mawrid || row.maqta || 'عطلة' : undefined,
      };
    });
  }, [level]);

  // إعدادات الرزنامة وتاريخ الدخول المدرسي والعطل والاختبارات
  const [calendarSettings, setCalendarSettings] = useState<SchoolCalendarSettings>(() => {
    let initialStart = '';
    let initialYear = config.schoolYear;

    try {
      const stored = JSON.parse(localStorage.getItem(ANNUAL_STORAGE_KEY) || '{}');
      if (stored.globalCalendarSettings) {
        return stored.globalCalendarSettings;
      }
      if (stored[level]?.calendarSettings) {
        return stored[level].calendarSettings;
      }
      if (stored[level]?.startDate) {
        initialStart = stored[level].startDate;
      }
    } catch {}

    try {
      const logbook = JSON.parse(localStorage.getItem('daftar_table_v2027') || '{}');
      if (logbook.startDate && !initialStart) {
        initialStart = logbook.startDate;
      }
    } catch {}

    if (initialStart && !initialYear) {
      initialYear = deriveSchoolYearFromDate(initialStart);
    }

    return getDefaultCalendarSettings(initialYear, initialStart);
  });

  // الصفوف النشطة للتدرج: تُحسب فورياً بناءً على تاريخ الدخول المدرسي لضمان التطابق التام 100%
  const [customRows, setCustomRows] = useState<OfficialAnnualDistributionRow[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(ANNUAL_STORAGE_KEY) || '{}');
      const isFresh = stored[level]?.curriculumDataVersion === ANNUAL_SCHEDULE_DATA_VERSION;
      const base = (isFresh && stored[level]?.items && Array.isArray(stored[level].items) && stored[level].items.length > 0)
        ? stored[level].items
        : officialBaseRows;
      const initialSettings = stored.globalCalendarSettings || stored[level]?.calendarSettings || getDefaultCalendarSettings(config.schoolYear);
      return recalculateDistributionRows(base, initialSettings);
    } catch {}
    return recalculateDistributionRows(officialBaseRows, getDefaultCalendarSettings(config.schoolYear));
  });

  // عند تغيير المستوى الدراسي، تحميل التدرج الخاص به ومحاذاته مع الرزنامة الحالية
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(ANNUAL_STORAGE_KEY) || '{}');
      const isFresh = stored[level]?.curriculumDataVersion === ANNUAL_SCHEDULE_DATA_VERSION;
      const base = (isFresh && stored[level]?.items && Array.isArray(stored[level].items) && stored[level].items.length > 0)
        ? stored[level].items
        : officialBaseRows;
      const recalculated = recalculateDistributionRows(base, calendarSettings);
      setCustomRows(recalculated);
    } catch {
      setCustomRows(recalculateDistributionRows(officialBaseRows, calendarSettings));
    }
  }, [level, officialBaseRows, calendarSettings]);

  // الاستماع لحدث تحديث الرزنامة من أي مكان في التطبيق (دفتر النصوص، الشريط الجانبي، أو نافذة الضبط)
  useEffect(() => {
    const handleCalendarUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ startDate?: string; settings?: SchoolCalendarSettings }>;
      const newSettings = customEvent.detail?.settings;
      if (newSettings && newSettings.startDate) {
        setCalendarSettings(newSettings);
        setCustomRows(prev => {
          const base = prev.length > 0 ? prev : officialBaseRows;
          return recalculateDistributionRows(base, newSettings);
        });
      }
    };
    window.addEventListener('school-calendar-updated', handleCalendarUpdated);
    return () => window.removeEventListener('school-calendar-updated', handleCalendarUpdated);
  }, [officialBaseRows]);

  // عند تغيير السنة الدراسية خارجياً (الشريط الجانبي / إعدادات الحساب)، إعادة حساب وتحديث التدرج فورياً
  useEffect(() => {
    if (!config.schoolYear) return;
    const cleanYear = config.schoolYear.replace(/\s+/g, '');
    const currentClean = (calendarSettings.schoolYear || '').replace(/\s+/g, '');
    if (cleanYear && cleanYear !== currentClean) {
      const derivedStart = deriveDefaultSchoolEntryDate(cleanYear);
      const newSettings = getDefaultCalendarSettings(cleanYear, derivedStart);
      setCalendarSettings(newSettings);
      const currentBase = customRows.length > 0 ? customRows : officialBaseRows;
      const recalculated = recalculateDistributionRows(currentBase, newSettings);
      setCustomRows(recalculated);
      persistRows(recalculated, newSettings);
      syncCalendarToAllLevels(newSettings, getLevelBaseRows);
    }
  }, [config.schoolYear, officialBaseRows]);

  // دالة مساعدة لتوفير التدرج الوزاري الأصلي لأي مستوى
  const getLevelBaseRows = (lvl: '1am' | '2am' | '3am' | '4am'): OfficialAnnualDistributionRow[] => {
    if (lvl === '1am') return OFFICIAL_1AM_DISTRIBUTION;
    if (lvl === '2am') return OFFICIAL_2AM_DISTRIBUTION;
    if (lvl === '3am') return OFFICIAL_3AM_DISTRIBUTION;
    return OFFICIAL_4AM_DISTRIBUTION;
  };

  // حفظ التدرج المحدث في التخزين المحلي والمزامنة
  const persistRows = (rowsToSave: OfficialAnnualDistributionRow[], currentCal: SchoolCalendarSettings) => {
    try {
      const existing = JSON.parse(localStorage.getItem(ANNUAL_STORAGE_KEY) || '{}');
      existing.globalCalendarSettings = currentCal;
      existing[level] = {
        startDate: currentCal.startDate,
        orientation,
        items: rowsToSave,
        calendarSettings: currentCal,
        generatedFromCurriculum: true,
        curriculumDataVersion: ANNUAL_SCHEDULE_DATA_VERSION,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(ANNUAL_STORAGE_KEY, JSON.stringify(existing));
      if ((window as any).syncToCloud) {
        (window as any).syncToCloud('annualDist', existing);
      }
    } catch (error) {
      console.error('تعذر حفظ التدرج السنوي للربط الذكي:', error);
    }
  };

  // تغيير فوري وسريع للسنة الدراسية مع إعادة حساب التدرج والرزنامة كلياً عبر كل المستويات
  const handleQuickSchoolYearChange = (newYear: string) => {
    if (!newYear) return;
    const derivedStart = deriveDefaultSchoolEntryDate(newYear);
    const newSettings: SchoolCalendarSettings = {
      ...calendarSettings,
      schoolYear: newYear,
      startDate: derivedStart,
    };
    setCalendarSettings(newSettings);
    if (setConfig) {
      setConfig(prev => ({ ...prev, schoolYear: newYear }));
    }
    const currentBase = customRows.length > 0 ? customRows : officialBaseRows;
    const recalculated = recalculateDistributionRows(currentBase, newSettings);
    setCustomRows(recalculated);
    persistRows(recalculated, newSettings);
    syncCalendarToAllLevels(newSettings, getLevelBaseRows);
    showToast(`تم تغيير الموسم الدراسي إلى ${newYear} وتحديث كافة التواريخ والعطل تلقائياً 📅`);
  };

  // تغيير فوري لتاريخ الدخول المدرسي مع إعادة حساب التدرج وتحديث السنة الدراسية
  const handleQuickStartDateChange = (newStartDate: string) => {
    if (!newStartDate) return;
    const derivedYear = deriveSchoolYearFromDate(newStartDate);
    const newSettings: SchoolCalendarSettings = {
      ...calendarSettings,
      startDate: newStartDate,
      schoolYear: derivedYear || calendarSettings.schoolYear,
    };
    setCalendarSettings(newSettings);
    if (setConfig && derivedYear) {
      setConfig(prev => ({ ...prev, schoolYear: derivedYear }));
    }
    const currentBase = customRows.length > 0 ? customRows : officialBaseRows;
    const recalculated = recalculateDistributionRows(currentBase, newSettings);
    setCustomRows(recalculated);
    persistRows(recalculated, newSettings);
    syncCalendarToAllLevels(newSettings, getLevelBaseRows);
    showToast(`تم اعتماد تاريخ الدخول ${newStartDate} وتحديث مواعيد كافة الأسابيع والعطل في التدرج 📅`);
  };

  // تغيير صيغة عرض التاريخ في التدرج
  const handleDateFormatChange = (fmt: SchoolCalendarSettings['dateFormat']) => {
    const newSettings: SchoolCalendarSettings = { ...calendarSettings, dateFormat: fmt };
    setCalendarSettings(newSettings);
    const currentBase = customRows.length > 0 ? customRows : officialBaseRows;
    const recalculated = recalculateDistributionRows(currentBase, newSettings);
    setCustomRows(recalculated);
    persistRows(recalculated, newSettings);
    syncCalendarToAllLevels(newSettings, getLevelBaseRows);
    showToast(`تم تحديث صيغة عرض التواريخ في التدرج`);
  };

  // تطبيق تعديلات التواريخ بناءً على الدخول المدرسي والعطل والاختبارات
  const handleApplyCalendarSettings = (newSettings: SchoolCalendarSettings, syncWithLogbook: boolean) => {
    setCalendarSettings(newSettings);
    if (setConfig && newSettings.schoolYear) {
      setConfig(prev => ({ ...prev, schoolYear: newSettings.schoolYear }));
    }

    // إعادة حساب تواريخ وأشهر التدرج السنوي بدقة
    const currentBase = customRows.length > 0 ? customRows : officialBaseRows;
    const recalculated = recalculateDistributionRows(currentBase, newSettings);
    
    setCustomRows(recalculated);
    persistRows(recalculated, newSettings);
    syncCalendarToAllLevels(newSettings, getLevelBaseRows);

    if (syncWithLogbook) {
      syncCalendarToDailyLogbook(newSettings.startDate, newSettings);
    }

    showToast(`تم تعديل وحساب تواريخ التدرج السنوي (${newSettings.schoolYear}) بنجاح وفق الدخول والعطل والاختبارات 📅`);
  };

  // مصدر موحّد للمنهاج: يُستخدم نفسه في التدرج والإحصائيات حتى لا يحدث اختلاف بينهما
  const baseLessons = useMemo<LessonMemo[]>(() => {
    const fromCurriculum = curriculumLessons?.filter(l => l.level === level) || [];
    if (fromCurriculum.length > 0) return fromCurriculum;
    if (level === '1am') return LESSONS_1AM;
    if (level === '2am') return LESSONS_2AM;
    if (level === '3am') return LESSONS_3AM;
    return LESSONS_4AM;
  }, [curriculumLessons, level]);

  // تقسيم الصفحات حسب المعيار الوزاري الرسمي
  const pages = useMemo(() => {
    const rows = customRows.length > 0 ? customRows : officialBaseRows;

    if (level === '4am') {
      // تطابق الصفحات الثلاث الرسمية في وثيقة وزارة التربية الوطنية:
      // الصفحة 1: الفصل الأول (من الأسبوع 1 إلى الأسبوع 15: عطلة الشتاء)
      // الصفحة 2: الفصل الثاني (من الأسبوع 16 إلى الأسبوع 27: عطلة الربيع)
      // الصفحة 3: الفصل الثالث (من الأسبوع 28 إلى الأسبوع 34: نهاية السنة والاختبارات + التأشيرات)
      const page1 = rows.slice(0, 15);
      const page2 = rows.slice(15, 27);
      const page3 = rows.slice(27);
      return [page1, page2, page3];
    }

    const pageSize = 11;
    return Array.from({ length: Math.ceil(rows.length / pageSize) }, (_, index) =>
      rows.slice(index * pageSize, index * pageSize + pageSize)
    ).filter(page => page.length > 0);
  }, [customRows, officialBaseRows, level]);

  const distributionStats = useMemo(() => {
    const rows = (customRows.length > 0 ? customRows : officialBaseRows).filter((row: any) => !row.isHoliday && !row.isExam);
    const unique = (values: string[]) =>
      Array.from(new Set(values.map(v => String(v || '').trim()).filter(Boolean)));

    const maqtaCount = unique(rows.map((r: any) => r.maqta)).length;
    const resourceCount = unique(rows.map((r: any) => r.mawrid)).length;
    const ta3alomCount = unique(rows.map((r: any) => r.ta3alom)).length;

    // الأنشطة مأخوذة من قاعدة المنهاج المرتبطة بالمستوى، مع منع التكرار
    const activityValues = baseLessons.flatMap((lesson: any) =>
      Array.isArray(lesson.activities) ? lesson.activities : []
    );
    const activityCount = unique(activityValues).length;

    return { maqtaCount, resourceCount, ta3alomCount, activityCount };
  }, [customRows, officialBaseRows, baseLessons]);

  // تعديل مباشر لمحتوى الخلية من قبل الأستاذ
  const handleCellBlur = (rowId: string | undefined, field: keyof OfficialAnnualDistributionRow, value: string) => {
    if (!rowId) return;
    const current = customRows.length > 0 ? [...customRows] : [...officialBaseRows];
    const targetIdx = current.findIndex(r => r.id === rowId);
    if (targetIdx === -1) return;

    if ((current[targetIdx] as any)[field] === value) return; // لا يوجد تغيير

    current[targetIdx] = {
      ...current[targetIdx],
      [field]: value
    };

    setCustomRows(current);
    persistRows(current, calendarSettings);
  };

  // إعادة ضبط واستعادة التدرج الوزاري الأصلي
  const handleResetToOfficial = () => {
    try {
      const existing = JSON.parse(localStorage.getItem(ANNUAL_STORAGE_KEY) || '{}');
      delete existing[level];
      localStorage.setItem(ANNUAL_STORAGE_KEY, JSON.stringify(existing));
      if ((window as any).syncToCloud) {
        (window as any).syncToCloud('annualDist', existing);
      }
      const defaultSettings = getDefaultCalendarSettings(config.schoolYear);
      setCalendarSettings(defaultSettings);
      setCustomRows(officialBaseRows);
      showToast('تمت استعادة واستبدال التدرج بالتوزيع الوزاري الأصلي المعتمد بنجاح');
    } catch {
      showToast('تمت استعادة التدرج الوزاري الجديد');
    }
  };

  const waitForAnnualPrintFonts = async () => {
    if (document.fonts?.load) {
      await Promise.all([
        document.fonts.load('400 16px "Cairo"', 'العلوم الطبيعية والحياة'),
        document.fonts.load('700 16px "Cairo"', 'التدرج السنوي لبناء التعلمات'),
      ]);
    }
    if (document.fonts?.ready) await document.fonts.ready;
  };

  const printAnnualDistribution = async () => {
    await waitForAnnualPrintFonts();
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      await printAnnualDistribution();
      showToast("تم فتح معاينة الطباعة: اختر حفظ كـ PDF");
    } catch (error) {
      console.error(error);
      showToast("حدث خطأ أثناء تجهيز الطباعة/PDF");
    }
  };

  const handlePrint = async () => {
    try {
      await printAnnualDistribution();
    } catch (error) {
      console.error(error);
      showToast("حدث خطأ أثناء تجهيز الطباعة");
    }
  };

  const handleExportWord = async () => {
    try {
      const blob = await generateDistributionDocx(pages, config, level, orientation);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `التدرج_السنوي_${level}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("تم تصدير التدرج السنوي بنجاح (Word)");
    } catch (error) {
      console.error(error);
      showToast("حدث خطأ أثناء التصدير");
    }
  };

  const DocumentPages = () => (
    <div id="official-distribution-content" dir="rtl" className={`relative bg-transparent flex flex-col items-center p-4 print:p-0 print:bg-white w-full ${orientation === 'landscape' ? 'print-orientation-landscape' : ''}`}>
      {curriculumBackground && (
        <div
          className="absolute inset-0 pointer-events-none z-0 rounded-2xl overflow-hidden print:hidden"
          aria-hidden="true"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.16)), url(" + curriculumBackground + ")",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      <style>{`
        .editable-cell:hover { background-color: rgba(0,0,0,0.02); }
        .editable-cell:focus { outline: 1px dashed #c2185b; background-color: rgba(255,255,255,0.9); }
      `}</style>

      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className={`print-document annual-export-page relative z-10 bg-[#fffdf8]/95 backdrop-blur-[1px] p-[10mm] mb-8 shadow-[0_14px_40px_rgba(20,110,100,0.10)] border border-[#d8eee9] print:bg-white print:border-none print:shadow-none print:m-0 ${orientation === 'portrait' ? 'w-[210mm] min-h-[297mm]' : 'w-[297mm] min-h-[210mm]'}`} style={{ pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto' }}>
          
          {/* Header */}
          <div className="text-center mb-3">
            {level === '4am' ? (
              <div className="space-y-2 mb-2">
                {/* Official 4AM Header Banner as in Ministry Document */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-2 border-[#16a34a] bg-[#ecfdf5] p-2 rounded-xl font-bold text-[12px] sm:text-[13px] text-gray-900 gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="bg-white border border-[#16a34a] px-3 py-1 rounded-lg shadow-2xs hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5"
                    title="انقر لتعديل السنة الدراسية وتواريخ الرزنامة"
                  >
                    الســــنة الــــدراســـيــة: <span className="font-black text-[#15803d]">{calendarSettings.schoolYear || config.schoolYear || '2024-2025'}</span>
                    <Settings2 size={13} className="text-[#16a34a] print:hidden" />
                  </button>
                  <div className="bg-[#16a34a] text-white px-5 py-1 rounded-lg shadow-xs text-base sm:text-lg font-black tracking-wide">
                    التــــدرج الســــنوي لبناء التعلمات لمـــــادة علوم الطبيــــــــــــــــعة والحياة
                  </div>
                  <div className="bg-white border border-[#16a34a] px-3 py-1 rounded-lg shadow-2xs">
                    المـــــستــــوى: <span className="font-black text-[#15803d]">السنة الـــرابعة متــــوســــط</span>
                  </div>
                </div>

                {/* Teacher / School Meta info */}
                <div className="flex justify-between items-center border border-[#b8dcd6] bg-[#f7fcfa] px-3 py-1 font-bold text-[11.5px] rounded-lg">
                  <div>الأستاذ(ة): <span className="font-black text-[#075e57]">{config.teacherName}</span></div>
                  <div>متوسطة: <span className="font-black text-[#075e57]">{config.schoolName}</span></div>
                  <div>مديرية التربية: <span className="font-black text-[#075e57]">{config.directorate}</span></div>
                </div>

                {/* Competencies Box */}
                <div className="text-right bg-[#f0fdf4] p-2 rounded-xl border border-[#86efac] space-y-0.5 text-[11px] leading-relaxed">
                  <div className="text-gray-900">
                    <strong className="text-emerald-800 ml-1.5">الكفاءة الشاملة:</strong>
                    يقترح حلولاً مؤسسة علمياً إستجابة لمشاكل متعلقة بالصحة و يشارك في حوارات مفتوحة حول المسائل الراهنة في المجال العلمي
                  </div>
                  <div className="text-gray-900">
                    <strong className="text-emerald-800 ml-1.5">الكفاءة الختامية:</strong>
                    أمام إختلال وظيفي أو وراثي، يقدم إرشادات وجيهة بتجنيد موارده المتعلقة بالتنسيق الوظيفي للعضوية، التكاثر و انتقال الصفات الوراثية
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-sm font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
                <h2 className="text-sm font-bold mb-2">وزارة التربية الوطنية</h2>
                
                <div className="flex justify-center items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-[#e9f8f5] rounded-full flex items-center justify-center border border-[#bfe7df] print:hidden">
                    <span className="text-xl">🔬</span>
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-[#075e57] drop-shadow-sm">التدرج السنوي لبناء التعلمات</h1>
                    <h3 className="text-sm font-bold text-[#28756f] mt-1">مادة علوم الطبيعة والحياة - السنة {level === "3am" ? "الثالثة" : level === "2am" ? "الثانية" : "الأولى"} متوسط</h3>
                  </div>
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100 print:hidden">
                    <span className="text-xl">🧠</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border border-[#b8dcd6] bg-[#f7fcfa] p-2 font-bold text-[12px]">
                  <div>الأستاذ(ة): <span>{config.teacherName}</span></div>
                  <div 
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-700 transition"
                    title="انقر لتعديل السنة الدراسية وتواريخ الرزنامة"
                  >
                    <span>السنة الدراسية:</span>
                    <span className="font-black text-emerald-800 underline decoration-dotted">{calendarSettings.schoolYear || config.schoolYear}</span>
                    <Settings2 size={13} className="text-emerald-600 print:hidden" />
                  </div>
                  <div>متوسطة: <span>{config.schoolName}</span></div>
                </div>
              </>
            )}
          </div>

          {/* Table */}
          <table className="distribution-screen-table w-full border-collapse border border-black text-center text-[10.5px] leading-tight">
            <thead>
              {level === '4am' ? (
                <>
                  <tr className="bg-[#f0fdf4] text-gray-900 font-black">
                    <th rowSpan={2} className="border border-black p-1 w-[7%] text-center">الأشهر</th>
                    <th rowSpan={2} className="border border-black p-1 w-[9%] text-center">الأسابيع</th>
                    <th rowSpan={2} className="border border-black p-1 w-[12%] text-center bg-[#e5f7f3] text-[#075e57]">الميدان</th>
                    <th rowSpan={2} className="border border-black p-1 w-[14%] text-center bg-[#fff1d6] text-[#8a5a00]">المقطع التعلمي</th>
                    <th rowSpan={2} className="border border-black p-1 w-[15%] text-center">المورد المعرفي</th>
                    <th colSpan={2} className="border border-black p-1 w-[36%] text-center bg-[#ecfdf5] text-emerald-950 font-black">سير الحصص</th>
                    <th rowSpan={2} className="border border-black p-1 w-[7%] text-center">النسبة</th>
                  </tr>
                  <tr className="bg-[#f8fafc] text-gray-800 font-bold">
                    <th className="border border-black p-1 w-[18%] text-center">الحصة الأولى</th>
                    <th className="border border-black p-1 w-[18%] text-center">الحصة الثانية</th>
                  </tr>
                </>
              ) : (
                <>
                  <tr className="bg-[#f0f0f0]">
                    <th colSpan={8} className="border border-[#b8dcd6] p-2 text-sm font-black bg-[#dff6f0] text-[#075e57]">
                      الميدان: {Array.from(new Set(page.map(row => row.midan).filter(Boolean))).join('  |  ') || '—'}
                    </th>
                  </tr>
                  <tr className="bg-[#f8f8f8]">
                    <th className="border border-black p-1 w-[8%]">الشهر</th>
                    <th className="border border-black p-1 w-[12%]">التاريخ</th>
                    <th className="border border-black p-1 w-[13%] bg-[#e5f7f3] text-[#075e57]">الميدان</th>
                    <th className="border border-black p-1 w-[17%] bg-[#fff1d6] text-[#8a5a00]">المقطع التعلمي</th>
                    <th className="border border-black p-1 w-[15%]">المورد المعرفي</th>
                    <th className="border border-black p-1 w-[20%]">الحصة الأولى</th>
                    <th className="border border-black p-1 w-[17%]">الحصة الثانية</th>
                    <th className="border border-black p-1 w-[8%]">النسبة</th>
                  </tr>
                </>
              )}
            </thead>
            <tbody>
              {page.map((row, i) => {
                const weekDisplay = row.week ? `${row.week} (${row.dates})` : (row.dates || '—');

                // Full-width holiday row (e.g. Winter / Spring vacation spanning the sessions)
                const isFullWeekHoliday = row.isHoliday && (
                  row.session1 === 'عطلة الشتاء' || 
                  row.session1 === 'عطلة الربيع' || 
                  (!row.session1 && !row.session2) ||
                  row.session1 === row.session2
                );

                if (isFullWeekHoliday) {
                  return (
                    <tr key={row.id || i} className="bg-[#fef9c3] print:bg-[#f0f0f0] font-black text-amber-900">
                      <td 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={(e) => handleCellBlur(row.id, 'month', e.currentTarget.textContent || '')}
                        className="border border-black p-1 editable-cell outline-none"
                      >
                        {row.month}
                      </td>
                      <td className="border border-black p-1 align-middle">
                        <div className="flex flex-col items-center justify-center leading-tight">
                          {row.week && <span className="font-black text-[11px] text-amber-950">{row.week}</span>}
                          <span 
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={(e) => handleCellBlur(row.id, 'dates', (e.currentTarget.textContent || '').trim())}
                            className="editable-cell outline-none font-mono text-[10px] text-amber-900 font-bold px-1 rounded hover:bg-amber-200/60"
                            title="تاريخ العطلة (انقر للتعديل اليدوي)"
                          >
                            {row.dates || '—'}
                          </span>
                        </div>
                      </td>
                      <td 
                        colSpan={5} 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={(e) => handleCellBlur(row.id, 'holidayLabel', e.currentTarget.textContent || '')}
                        className="border border-black p-1.5 text-center text-[12px] tracking-wider editable-cell outline-none bg-amber-100/80"
                      >
                        {row.holidayLabel || row.session1 || 'عطلة'}
                      </td>
                      <td 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={(e) => handleCellBlur(row.id, 'percent', e.currentTarget.textContent || '')}
                        className="border border-black p-1 font-black text-center align-middle editable-cell outline-none"
                      >
                        {(row as any).percent || '—'}
                      </td>
                    </tr>
                  );
                }

                // Full-width exam row (e.g. Trimester 1, 2, 3 Exams)
                if (row.isExam) {
                  return (
                    <tr key={row.id || i} className="bg-[#f0fdf4] print:bg-transparent font-black text-[#166534]">
                      <td 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={(e) => handleCellBlur(row.id, 'month', e.currentTarget.textContent || '')}
                        className="border border-black p-1 editable-cell outline-none"
                      >
                        {row.month}
                      </td>
                      <td className="border border-black p-1 align-middle">
                        <div className="flex flex-col items-center justify-center leading-tight">
                          {row.week && <span className="font-black text-[11px] text-emerald-950">{row.week}</span>}
                          <span 
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={(e) => handleCellBlur(row.id, 'dates', (e.currentTarget.textContent || '').trim())}
                            className="editable-cell outline-none font-mono text-[10px] text-emerald-950 font-bold px-1 rounded hover:bg-emerald-100"
                            title="تاريخ الاختبار (انقر للتعديل اليدوي)"
                          >
                            {row.dates || '—'}
                          </span>
                        </div>
                      </td>
                      <td 
                        colSpan={5} 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={(e) => handleCellBlur(row.id, 'session1', e.currentTarget.textContent || '')}
                        className="border border-black p-1.5 text-center text-[13px] tracking-widest editable-cell outline-none bg-[#dcfce7]"
                      >
                        {row.session1 || row.mawrid || 'إختبارات الفصل'}
                      </td>
                      <td 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={(e) => handleCellBlur(row.id, 'percent', e.currentTarget.textContent || '')}
                        className="border border-black p-1 font-black text-center align-middle editable-cell outline-none"
                      >
                        {(row as any).percent || '—'}
                      </td>
                    </tr>
                  );
                }

                const isNormalRow = !row.isHoliday && !row.isExam;
                const isMergeable = (idx: number) => {
                  const candidate = page[idx];
                  return !!candidate && !candidate.isHoliday && !candidate.isExam;
                };
                const normalized = (value: unknown) => String(value ?? '').trim();
                const mergedSpan = (field: 'midan' | 'maqta' | 'mawrid', idx: number) => {
                  if (!isMergeable(idx)) return 1;
                  const current = normalized((page[idx] as any)[field]);
                  if (!current) return 1;
                  let span = 1;
                  for (let j = idx + 1; j < page.length; j++) {
                    if (!isMergeable(j)) break;
                    const sameHierarchy =
                      field === 'midan'
                        ? true
                        : field === 'maqta'
                          ? normalized((page[j] as any).midan) === normalized((page[idx] as any).midan)
                          : normalized((page[j] as any).midan) === normalized((page[idx] as any).midan) &&
                            normalized((page[j] as any).maqta) === normalized((page[idx] as any).maqta);
                    if (!sameHierarchy || normalized((page[j] as any)[field]) !== current) break;
                    span++;
                  }
                  return span;
                };
                const samePrevious = (field: 'midan' | 'maqta' | 'mawrid') => {
                  if (!isNormalRow || i === 0 || !isMergeable(i - 1)) return false;
                  const currentValue = normalized((row as any)[field]);
                  const previousValue = normalized((page[i - 1] as any)[field]);
                  if (!currentValue || currentValue !== previousValue) return false;
                  if (field === 'midan') return true;
                  if (field === 'maqta') {
                    return normalized(row.midan) === normalized(page[i - 1].midan);
                  }
                  return normalized(row.midan) === normalized(page[i - 1].midan) &&
                    normalized(row.maqta) === normalized(page[i - 1].maqta);
                };

                return (
                  <tr key={row.id || i} className="hover:bg-gray-50 print:bg-transparent">
                    <td className="border border-black p-1 font-black whitespace-nowrap align-middle">
                      <span 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={(e) => handleCellBlur(row.id, 'month', e.currentTarget.textContent || '')}
                        className="editable-cell outline-none font-bold text-gray-900"
                      >
                        {row.month}
                      </span>
                    </td>
                    <td className="border border-black p-1 align-middle">
                      <div className="flex flex-col items-center justify-center leading-tight">
                        {row.week && <span className="font-black text-[11px] text-gray-900">{row.week}</span>}
                        <span 
                          contentEditable 
                          suppressContentEditableWarning 
                          onBlur={(e) => handleCellBlur(row.id, 'dates', (e.currentTarget.textContent || '').trim())}
                          className="editable-cell outline-none font-mono text-[10px] text-emerald-950 font-bold px-1 rounded hover:bg-emerald-50"
                          title="تاريخ الأسبوع (انقر للتعديل اليدوي)"
                        >
                          {row.dates || '—'}
                        </span>
                      </div>
                    </td>
                    {!samePrevious('midan') && (
                      <td
                        rowSpan={mergedSpan('midan', i)}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleCellBlur(row.id, 'midan', e.currentTarget.textContent || '')}
                        className="border border-black p-1 font-bold align-middle editable-cell outline-none bg-[#e5f7f3]/70 text-[#075e57] text-center"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', minWidth: '34px', whiteSpace: 'normal' }}
                        title="الميدان المدمج حسب تتابع الأسابيع"
                      >
                        {row.midan}
                      </td>
                    )}
                    {!samePrevious('maqta') && (
                      <td
                        rowSpan={mergedSpan('maqta', i)}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleCellBlur(row.id, 'maqta', e.currentTarget.textContent || '')}
                        className="border border-black p-1 font-bold align-middle editable-cell outline-none bg-[#fff1d6]/70 text-[#8a5a00] text-center"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', minWidth: '34px', whiteSpace: 'normal' }}
                        title="المقطع التعلمي المدمج حسب تتابع الأسابيع"
                      >
                        {row.maqta}
                      </td>
                    )}
                    {!samePrevious('mawrid') && (
                      <td
                        rowSpan={mergedSpan('mawrid', i)}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleCellBlur(row.id, 'mawrid', e.currentTarget.textContent || '')}
                        className="border border-black p-1 font-bold align-middle editable-cell outline-none text-gray-900 text-center"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', minWidth: '40px', whiteSpace: 'normal' }}
                        title="المورد التعلمي المدمج حسب تتابع الأسابيع"
                      >
                        {row.mawrid}
                      </td>
                    )}
                    <td 
                      contentEditable 
                      suppressContentEditableWarning 
                      onBlur={(e) => handleCellBlur(row.id, 'session1', e.currentTarget.textContent || '')}
                      className="border border-black p-1.5 text-right font-medium align-middle editable-cell outline-none text-gray-900 leading-normal"
                    >
                      {(row.session1 || '').trim() || (row.taqwim ? `تقويم: ${row.taqwim}` : '—')}
                    </td>
                    <td 
                      contentEditable 
                      suppressContentEditableWarning 
                      onBlur={(e) => handleCellBlur(row.id, 'session2', e.currentTarget.textContent || '')}
                      className={`border border-black p-1.5 text-right font-medium align-middle editable-cell outline-none leading-normal ${row.isHoliday ? 'bg-amber-100/70 font-black text-amber-900 text-center' : 'text-gray-900'}`}
                    >
                      {(row.session2 || '').trim() || (row.taqwim ? `تقويم: ${row.taqwim}` : '—')}
                    </td>
                    <td 
                      contentEditable 
                      suppressContentEditableWarning 
                      onBlur={(e) => handleCellBlur(row.id, 'percent', e.currentTarget.textContent || '')}
                      className="border border-black p-1 font-black text-center align-middle editable-cell outline-none text-emerald-950 font-mono"
                    >
                      {(row as any).percent || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* نسخة الطباعة: جدول مسطح بدون rowspan/كتابة عمودية، حتى يبقى تشكيل العربية أصلياً عند window.print(). */}
          <table
            className="annual-distribution-print-table distribution-print-rtl"
            dir="rtl"
            aria-label="التدرج السنوي للطباعة"
          >
            <thead>
              {level === '4am' ? (
                <tr className="bg-[#f0fdf4] text-gray-900 font-black">
                  <th className="border border-black p-1">الأشهر</th>
                  <th className="border border-black p-1">الأسابيع</th>
                  <th className="border border-black p-1 bg-[#e5f7f3] text-[#075e57]">الميدان</th>
                  <th className="border border-black p-1 bg-[#fff1d6] text-[#8a5a00]">المقطع التعلمي</th>
                  <th className="border border-black p-1">المورد المعرفي</th>
                  <th className="border border-black p-1">الحصة الأولى</th>
                  <th className="border border-black p-1">الحصة الثانية</th>
                  <th className="border border-black p-1">النسبة</th>
                </tr>
              ) : (
                <>
                  <tr className="bg-[#dff6f0] text-[#075e57] font-black">
                    <th colSpan={8} className="border border-[#b8dcd6] p-2 text-center">
                      الميدان: {Array.from(new Set(page.map(row => row.midan).filter(Boolean))).join('  |  ') || '—'}
                    </th>
                  </tr>
                  <tr className="bg-[#f8f8f8] font-black">
                    <th className="border border-black p-1">الشهر</th>
                    <th className="border border-black p-1">التاريخ</th>
                    <th className="border border-black p-1 bg-[#e5f7f3] text-[#075e57]">الميدان</th>
                    <th className="border border-black p-1 bg-[#fff1d6] text-[#8a5a00]">المقطع التعلمي</th>
                    <th className="border border-black p-1">المورد المعرفي</th>
                    <th className="border border-black p-1">الحصة الأولى</th>
                    <th className="border border-black p-1">الحصة الثانية</th>
                    <th className="border border-black p-1">النسبة</th>
                  </tr>
                </>
              )}
            </thead>
            <tbody>
              {page.map((row, i) => {
                const weekDisplay = row.week ? String(row.week) : '—';
                const holidayText = row.holidayLabel || row.session1 || row.session2 || 'عطلة';
                // في نسخة الطباعة كل عطلة صف واحد كامل، حتى لا تدخل أي خلية عربية داخل تقسيم الصفوف.
                const isFullWeekHoliday = !!row.isHoliday;

                if (isFullWeekHoliday) {
                  return (
                    <tr key={`print-holiday-${row.id || i}`}>
                      <td colSpan={8} className="distribution-print-holiday border border-black p-2">
                        {row.month} — {weekDisplay} — {row.dates || '—'} — {holidayText}
                      </td>
                    </tr>
                  );
                }

                if (row.isExam) {
                  return (
                    <tr key={`print-exam-${row.id || i}`}>
                      <td colSpan={8} className="distribution-print-exam border border-black p-2">
                        {row.month} — {weekDisplay} — {row.dates || '—'} — {row.session1 || row.mawrid || 'إختبارات الفصل'}
                      </td>
                    </tr>
                  );
                }

                const cellBase = "distribution-print-rtl border border-black p-1 align-middle text-center";
                return (
                  <tr key={`print-row-${row.id || i}`}>
                    <td className={`${cellBase}`}>{row.month || '—'}</td>
                    <td className={`${cellBase}`}>{row.dates || '—'}{row.week ? ` — ${row.week}` : ''}</td>
                    <td className={`${cellBase} bg-[#e5f7f3]/70 text-[#075e57] font-bold`}>{row.midan || '—'}</td>
                    <td className={`${cellBase} bg-[#fff1d6]/70 text-[#8a5a00] font-bold`}>{row.maqta || '—'}</td>
                    <td className={`${cellBase} font-bold text-gray-900`}>{row.mawrid || '—'}</td>
                    <td className={`${cellBase} text-right`}>{(row.session1 || '').trim() || (row.taqwim ? `تقويم: ${row.taqwim}` : '—')}</td>
                    <td className={`${cellBase} text-right`}>{(row.session2 || '').trim() || (row.taqwim ? `تقويم: ${row.taqwim}` : '—')}</td>
                    <td className={`${cellBase} font-black`}>{(row as any).percent || (row.isHoliday ? 'عطلة' : '—')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer with Signatures on the last page or when explicitly rendered */}
          {(pageIndex === pages.length - 1 || level !== '4am') && (
            <div className="mt-6 flex justify-between items-start pt-2 px-8 font-black text-[12px] text-gray-900">
              <div className="text-center w-48">
                <p className="border-b-2 border-black pb-1.5">إمضاء الأستاذ (ة)</p>
                <div className="h-20 flex justify-center items-center mt-1">
                  <TeacherOfficialStamp config={config} />
                </div>
              </div>
              <div className="text-center w-48">
                <p className="border-b-2 border-black pb-1.5">تأشيرة السيد المدير</p>
                <div className="h-20 flex justify-center items-center mt-1">
                  <div className="w-24 h-16 border border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-400 text-xs font-normal">
                    الختم والتأشيرة
                  </div>
                </div>
              </div>
              <div className="text-center w-48">
                <p className="border-b-2 border-black pb-1.5">تأشيرة السيد المفتش</p>
                <div className="h-20 flex justify-center items-center mt-1">
                  <div className="w-24 h-16 border border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-400 text-xs font-normal">
                    الختم والتأشيرة
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      ))}
      {/* إحصائيات التدرج */}
      <div className="relative z-10 w-full max-w-[1100px] mt-2 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
        {[
          ['عدد المقاطع', distributionStats.maqtaCount],
          ['عدد موارد التعلم', distributionStats.resourceCount],
          ['عدد تعلم المورد', distributionStats.ta3alomCount],
          ['عدد الأنشطة', distributionStats.activityCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border-2 border-[#bfe7df] bg-[#e5f7f3] px-4 py-3 text-center">
            <div className="text-[11px] font-bold text-emerald-700">{label}</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{value}</div>
          </div>
        ))}
      </div>

    </div>
  );

  return (
    <div className="flex flex-col gap-4 relative w-full max-w-7xl mx-auto py-6 px-4" dir="rtl">
      
      {/* Control Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        
        <div>
          <h2 className="text-xl font-bold text-[#c2185b]">
            التدرج السنوي - {level === "4am" ? "4" : level === "3am" ? "3" : level === "2am" ? "2" : "1"} متوسط (الوثيقة الرسمية)
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            التدرج مرتبط مباشرة بقاعدة المنهاج الوزارية، وتعديل التواريخ محسوب وفق الدخول المدرسي والعطل والاختبارات.
          </p>
        </div>
        
        {/* Quick Date Display & Controls */}
        <div className="flex flex-wrap items-center gap-2 border-r pr-4">
          <div 
            onClick={() => setIsCalendarModalOpen(true)}
            className="flex flex-col gap-0.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-xl px-3 py-1.5 cursor-pointer transition shadow-2xs group"
            title="انقر لفتح نافذة تعديل التواريخ والرزنامة حسب الدخول المدرسي والعطل واختبارات"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
              <CalendarDays size={14} className="text-emerald-700 group-hover:scale-110 transition" />
              <span>الدخول المدرسي:</span>
            </div>
            <div className="text-xs font-black text-emerald-950 font-mono">
              {calendarSettings.startDate || 'غير محدد'}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">اتجاه الورقة</label>
            <select 
              value={orientation} 
              onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
              className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
            >
              <option value="portrait">عمودي (Portrait)</option>
              <option value="landscape">أفقي (Landscape)</option>
            </select>
          </div>
        </div>
        
        {/* Main Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Highlighted Calendar Button */}
          <button 
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-800 shadow-sm transition cursor-pointer"
            title="تعديل تاريخ الدخول المدرسي، العطل المدرسية، وفترات الاختبارات"
          >
            <CalendarDays size={17} />
            <span>تعديل التواريخ والرزنامة</span>
            <span className="bg-white/20 text-white text-[11px] px-1.5 py-0.2 rounded-full font-sans font-bold">
              عطل / اختبارات
            </span>
          </button>

          <button 
            onClick={handleResetToOfficial} 
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-bold hover:bg-gray-100 shadow-2xs transition cursor-pointer"
            title="استعادة التدرج والتواريخ الوزارية الأصلية"
          >
            <RotateCcw size={15} /> استعادة الأصلي
          </button>

          <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 border border-gray-200 p-1.5">
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition cursor-pointer">
              <Eye size={17} /> معاينة
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 shadow-sm transition cursor-pointer">
              <Printer size={17} /> طباعة
            </button>
            <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 bg-[#159a8c] text-white rounded-lg font-bold hover:bg-[#0f7f74] shadow-sm transition cursor-pointer">
              <FileDown size={17} /> PDF
            </button>
            <button onClick={handleExportWord} className="flex items-center gap-1.5 px-3 py-2 bg-[#4f86c6] text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm transition cursor-pointer">
              <FileDown size={17} /> Word
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Quick Calendar & School Year Master Bar */}
      <div className="bg-gradient-to-r from-[#f0fdf9] via-[#f7fcfb] to-[#ecfdf5] border-2 border-emerald-300/80 rounded-2xl p-4 shadow-xs space-y-3.5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                <span>تحديث السنة الدراسية والرزنامة الوزارية</span>
                <span className="text-[10.5px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  تحديث فوري وتلقائي لكافة الأسابيع (35 أسبوعاً)
                </span>
              </h3>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                تغيير السنة الدراسية أو تاريخ الدخول المدرسي يُعيد حساب كافة أسابيع التدرج، العطل، والاختبارات ومزامنتها فورياً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
            >
              <Settings2 size={14} />
              <span>ضبط العطل والاختبارات (متقدم)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                syncCalendarToDailyLogbook(calendarSettings.startDate, calendarSettings);
                showToast('تمت مزامنة الرزنامة وتواريخ العطل مع دفتر النصوص اليومي بنجاح 📋');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
              title="مزامنة التواريخ وتحديث دفتر النصوص"
            >
              <Clock size={14} className="text-emerald-700" />
              <span>مزامنة دفتر النصوص</span>
            </button>
          </div>
        </div>

        {/* Quick controls row: Presets, Date, and Format */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* 1. المواسم السريعة */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
              <span>السنة الدراسية (الموسم):</span>
              <span className="text-[10.5px] text-emerald-800 font-mono font-black">
                {calendarSettings.schoolYear || config.schoolYear}
              </span>
            </label>
            <div className="flex items-center gap-1.5">
              {['2024-2025', '2025-2026', '2026-2027'].map((yearOption) => {
                const isSelected = (calendarSettings.schoolYear || '').replace(/\s+/g, '') === yearOption.replace(/\s+/g, '');
                return (
                  <button
                    key={yearOption}
                    type="button"
                    onClick={() => handleQuickSchoolYearChange(yearOption)}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-500/30'
                        : 'bg-white hover:bg-emerald-100 text-emerald-950 border-emerald-200'
                    }`}
                  >
                    {yearOption}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. تاريخ الدخول المدرسي */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
              <span>تاريخ الدخول المدرسي (الأحد):</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">
                {calendarSettings.startDate}
              </span>
            </label>
            <input
              type="date"
              value={calendarSettings.startDate}
              onChange={(e) => handleQuickStartDateChange(e.target.value)}
              className="w-full bg-white border-2 border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-emerald-950 focus:border-emerald-600 outline-none transition"
            />
          </div>

          {/* 3. صيغة عرض التواريخ */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-950">
              صيغة كتابة التواريخ في الجدول:
            </label>
            <select
              value={calendarSettings.dateFormat}
              onChange={(e) => handleDateFormatChange(e.target.value as any)}
              className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition"
            >
              <option value="short">وزاري رسمي مختصر (22-26)</option>
              <option value="spaced">متباعد بفاصلة واضحة (22 − 26)</option>
              <option value="withMonth">تفصيلي باسم الشهر (22 سبتمبر إلى 26 سبتمبر)</option>
              <option value="isoShort">رقمي كامل بالأشهر (22/09 - 26/09)</option>
            </select>
          </div>
        </div>

        {/* Badges of calculated periods */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="font-bold text-gray-500 ml-1">محطات الموسم المحسوبة:</span>
          <span className="bg-amber-100/90 text-amber-950 font-bold px-2 py-0.5 rounded-lg border border-amber-200">
            🍂 الخريف: الأسبوع {calendarSettings.holidays.autumnWeek}
          </span>
          <span className="bg-purple-100/90 text-purple-950 font-bold px-2 py-0.5 rounded-lg border border-purple-200">
            📝 اختبار 1: الأسبوع {calendarSettings.exams.exam1Week}
          </span>
          <span className="bg-sky-100/90 text-sky-950 font-bold px-2 py-0.5 rounded-lg border border-sky-200">
            ❄️ الشتاء: الأسبوعان {calendarSettings.holidays.winterWeeks.join(' و ')}
          </span>
          <span className="bg-indigo-100/90 text-indigo-950 font-bold px-2 py-0.5 rounded-lg border border-indigo-200">
            📝 اختبار 2: الأسبوع {calendarSettings.exams.exam2Week}
          </span>
          <span className="bg-emerald-100/90 text-emerald-950 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
            🌸 الربيع: الأسبوعان {calendarSettings.holidays.springWeeks.join(' و ')}
          </span>
          <span className="bg-rose-100/90 text-rose-950 font-bold px-2 py-0.5 rounded-lg border border-rose-200">
            🏆 اختبار 3: الأسبوع {calendarSettings.exams.exam3Week}
          </span>
        </div>
      </div>

      {/* Warning banner if empty session exists */}
      {pages.flat().some(row => !row.session1 && !row.session2 && !row.isHoliday) && (
        <div className="rounded-xl border border-amber-200 bg-[#fff6df] p-3 text-xs font-bold text-[#8a5a00]">
          تنبيه: توجد حصة بلا محتوى. لم يتم اختراع محتوى؛ راجع المورد/النشاط في قاعدة البيانات.
        </div>
      )}

      {/* Main Pages Table Container */}
      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 print:border-none print:shadow-none print:overflow-visible">
        <DocumentPages />
      </div>

      {/* Calendar Adjustment Modal */}
      <CalendarAdjustmentModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentSettings={calendarSettings}
        onApply={handleApplyCalendarSettings}
        onReset={handleResetToOfficial}
        totalWeeks={customRows.length || 35}
      />

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col print:hidden">
          {/* Modal Header */}
          <div className="bg-white p-4 flex justify-between items-center shadow-md shrink-0">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Eye className="text-indigo-600" /> معاينة التدرج السنوي
            </h2>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition cursor-pointer">
                <Printer size={18} /> طباعة
              </button>
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 flex items-center gap-2 transition cursor-pointer">
                <X size={18} /> إغلاق
              </button>
            </div>
          </div>
          
          {/* Modal Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            <div className="origin-top scale-[0.85] md:scale-100 transition-transform">
              <DocumentPages />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
