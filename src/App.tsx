import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import {
  FileDown,
  FileText,
  Eye,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  BookOpenCheck,
  Database,
  ArrowRight,
  Menu,
  Bell,
  Settings,
  Microscope,
  PenTool,
} from 'lucide-react';
import { useHandwritingStyle } from './hooks/useHandwritingStyle';
import { usePageTemplate } from './hooks/usePageTemplate';
import { HandwritingStylePanel } from './components/HandwritingStylePanel';
import { SelectionPenStrip } from './components/HandwrittenText';
import {
  DocxFontFallbackModal,
  useDocxFontFallbackDialog,
} from './components/DocxFontFallbackModal';
import { DocxFontEmbedError } from './utils/docxFontEmbed';
import { LessonMemo, MemoConfig } from './types';
import { LEVELS } from './data/memos/lessonsData';
import { SidebarControls } from './components/SidebarControls';
import { MemoSheet } from './components/MemoSheet';
import { YearSectionTabs, type YearSubTab } from './components/YearSectionTabs';
import { PreviewModal } from './components/PreviewModal';
import { LevelsHomePage } from './components/LevelsHomePage';
import { PlatformNavigationDrawer } from './components/PlatformNavigationDrawer';
import { ActionMenu, PageTemplateSwitcher } from './components/ActionMenu';
import { PlatformInfoModal } from './components/PlatformInfoModal';
import { UserProfile } from './components/UserProfile';
import { FirebaseDataSync } from './components/FirebaseDataSync';
import { FlagRibbon } from './components/FlagRibbon';
import { useAuth } from './components/Auth';
import { getFirebaseConfigStatus } from './firebase';
import { loadCurriculumDatabase } from './data/memos/curriculumDb';
import heroScienceLabImg from './assets/images/hero_science_lab.jpg';

const AIAssistantChat = lazy(() => import('./components/AIAssistantChat').then(module => ({ default: module.AIAssistantDrawer })));
const AssessmentHub = lazy(() => import('./components/AssessmentHub').then(module => ({ default: module.AssessmentHub })));

const AnnualDistribution = lazy(() => import('./components/AnnualDistribution').then(module => ({ default: module.AnnualDistribution })));
const DailyLogbook = lazy(() => import('./components/DailyLogbook').then(module => ({ default: module.DailyLogbook })));
const AccountSettings = lazy(() => import('./components/AccountSettings').then(module => ({ default: module.AccountSettings })));
const SourceMemo1AMViewer = lazy(() => import('./components/SourceMemo1AMViewer').then(module => ({ default: module.SourceMemo1AMViewer })));
const YearPlansViewer = lazy(() => import('./components/YearPlansViewer').then(module => ({ default: module.YearPlansViewer })));
const SourceContentViewer = lazy(() => import('./components/SourceContentViewer').then(module => ({ default: module.SourceContentViewer })));
const SourceGuide1AMViewer = lazy(() => import('./components/SourceGuide1AMViewer').then(module => ({ default: module.SourceGuide1AMViewer })));
const SourceGuide2AMViewer = lazy(() => import('./components/SourceGuide2AMViewer').then(module => ({ default: module.SourceGuide2AMViewer })));
const SourceGuide3AMViewer = lazy(() => import('./components/SourceGuide3AMViewer').then(module => ({ default: module.SourceGuide3AMViewer })));
const SourceGuide4AMViewer = lazy(() => import('./components/SourceGuide4AMViewer').then(module => ({ default: module.SourceGuide4AMViewer })));
const CurriculumDatabaseManager = lazy(() => import('./components/CurriculumDatabaseManager').then(module => ({ default: module.CurriculumDatabaseManager })));

const SectionLoading = () => (
  <div dir="rtl" role="status" className="flex-1 flex items-center justify-center p-8 text-sm font-bold text-emerald-800">
    جاري تحميل القسم…
  </div>
);

export type MainSectionType = 'home' | '1am' | '2am' | '3am' | '4am' | 'logbook' | 'settings' | 'database' | 'assessment' | 'assistant';

interface AssistantLaunchContext {
  prompt?: string;
  level?: string;
  maqta?: string;
  mawrid?: string;
  label?: string;
  error?: string;
  successRate?: string | number;
}

export const App: React.FC = () => {
  // 0. Primary Navigation State: 'home' (Home page of levels) | '1am' | '2am' | '3am' | '4am' | 'logbook' | 'settings'
  const [activeSection, setActiveSection] = useState<MainSectionType>('home');

  // Sub-view inside the active year: 'memos' (المذكرات البيداغوجية) | 'distribution' (تدرج التعلمات)
  const [yearSubTab, setYearSubTab] = useState<YearSubTab>('memos');

  // Drawers and Modals
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState<boolean>(false);
  const [assistantContext, setAssistantContext] = useState<AssistantLaunchContext | null>(null);
  const [assistantContextKey, setAssistantContextKey] = useState('');
  const [infoModalTab, setInfoModalTab] = useState<'about' | 'contact' | 'guide' | null>(null);
  const [logbookInitialTimetable, setLogbookInitialTimetable] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [isHandwritingModalOpen, setIsHandwritingModalOpen] = useState<boolean>(false);
  const { settings: hwStyle } = useHandwritingStyle();
  const { template: pageStyleTemplate } = usePageTemplate();
  const {
    pendingError: pendingWordFontError,
    askFallbackChoice: askWordFallbackChoice,
    confirmFallback: confirmWordFallback,
    exportPdfInstead: exportWordPdfInstead,
    cancelFallback: cancelWordFallback,
  } = useDocxFontFallbackDialog();

  const { user } = useAuth();
  const firebaseStatus = useMemo(() => getFirebaseConfigStatus(), []);

  // Is current section a school year?
  const isYearSection = activeSection === '1am' || activeSection === '2am' || activeSection === '3am' || activeSection === '4am';

  const [curriculumLessons, setCurriculumLessons] = useState<LessonMemo[]>(() => loadCurriculumDatabase());

  useEffect(() => {
    const refresh = () => setCurriculumLessons(loadCurriculumDatabase());
    window.addEventListener('curriculum-db-updated', refresh);
    return () => window.removeEventListener('curriculum-db-updated', refresh);
  }, []);
  
  // Selected Level mapped to active year (default to '4am' if on home/logbook/settings)
  const selectedLevel: '1am' | '2am' | '3am' | '4am' = isYearSection ? activeSection : '4am';

  // Filter lessons by level
  const lessonsForLevel = useMemo(() => {
    return curriculumLessons.filter((l) => l.level === selectedLevel);
  }, [curriculumLessons, selectedLevel]);

  const maqatiForLevel = useMemo(() => Array.from(new Set(lessonsForLevel.map(l => l.maqta).filter(Boolean))), [lessonsForLevel]);

  // 2. Selection states for Memos
  const [selectedMaqta, setSelectedMaqta] = useState<string>('');
  const [selectedMawrid, setSelectedMawrid] = useState<string>('');
  const [selectedTa3alom, setSelectedTa3alom] = useState<string>('');
  // مستوى وضوح خلفية القسم: عالي الوضوح، متوازن، هادئ
  const [bgClarity, setBgClarity] = useState<'vivid' | 'medium' | 'soft'>('vivid');

  // 3. Configuration / Teacher Profile State (Stored in sessionStorage for privacy & auto-cleanup on exit)
  const [config, setConfig] = useState<MemoConfig>(() => {
    try {
      const sessionSaved = sessionStorage.getItem('algeria_sciences_session_config_v3');
      if (sessionSaved) {
        return JSON.parse(sessionSaved);
      }
    } catch {
      // ignore
    }
    return {
      level: '4am',
      schoolName: '',
      directorate: '',
      inspectionDistrict: '',
      teacherName: '',
      teacherGrade: '',
      teacherPhone: '',
      teacherEmail: '',
      schoolYear: '',
      memoNumber: '',
      principalName: '',
      inspectorName: '',
      signDate: new Date().toISOString().split('T')[0],
      teacherStamp: null,
      assignedClasses: [],
      weeklyHours: 0,
    };
  });

  // Sync config to sessionStorage whenever updated
  useEffect(() => {
    try {
      sessionStorage.setItem('algeria_sciences_session_config_v3', JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  // Keep config.level in sync with selectedLevel
  useEffect(() => {
    if (isYearSection) {
      setConfig((prev) => ({ ...prev, level: selectedLevel }));
    }
  }, [selectedLevel, isYearSection]);

  // When level changes, reset selections to first valid item for this level
  useEffect(() => {
    const defaultLesson = lessonsForLevel[0];
    if (defaultLesson) {
      setSelectedMaqta(defaultLesson.maqta);
      setSelectedMawrid(defaultLesson.mawrid);
      setSelectedTa3alom(defaultLesson.ta3alom);
    } else if (maqatiForLevel.length > 0) {
      setSelectedMaqta(maqatiForLevel[0]);
      setSelectedMawrid('');
      setSelectedTa3alom('');
    }
  }, [selectedLevel, lessonsForLevel, maqatiForLevel]);

  // 4. Derived lists based on selection
  const mawridList = useMemo(() => {
    const list = lessonsForLevel
      .filter((l) => l.maqta === selectedMaqta)
      .map((l) => l.mawrid);
    return Array.from(new Set(list));
  }, [lessonsForLevel, selectedMaqta]);

  // Auto-select first mawrid when maqta changes
  useEffect(() => {
    if (mawridList.length > 0 && !mawridList.includes(selectedMawrid)) {
      setSelectedMawrid(mawridList[0]);
    }
  }, [mawridList, selectedMawrid]);

  const ta3alomList = useMemo(() => {
    const list = lessonsForLevel
      .filter((l) => l.maqta === selectedMaqta && l.mawrid === selectedMawrid)
      .map((l) => l.ta3alom);
    return Array.from(new Set(list));
  }, [lessonsForLevel, selectedMaqta, selectedMawrid]);

  // Auto-select first ta3alom when mawrid changes
  useEffect(() => {
    if (ta3alomList.length > 0 && !ta3alomList.includes(selectedTa3alom)) {
      setSelectedTa3alom(ta3alomList[0]);
    }
  }, [ta3alomList, selectedTa3alom]);

  // 5. Current Selected Lesson
  const currentLesson = useMemo<LessonMemo | null>(() => {
    const found = lessonsForLevel.find(
      (l) =>
        l.maqta === selectedMaqta &&
        l.mawrid === selectedMawrid &&
        l.ta3alom === selectedTa3alom
    );
    return found || lessonsForLevel[0] || null;
  }, [lessonsForLevel, selectedMaqta, selectedMawrid, selectedTa3alom]);

  // Derived current active midan based on the active lesson or level
  const activeMidan = useMemo(() => {
    if (currentLesson?.midan) return currentLesson.midan;
    return '';
  }, [currentLesson, selectedLevel]);

  // 6. Activities selection state
  const [activeActivities, setActiveActivities] = useState<boolean[]>([]);

  useEffect(() => {
    if (currentLesson) {
      setActiveActivities(new Array(currentLesson.anshita.length).fill(true));
    } else {
      setActiveActivities([]);
    }
  }, [currentLesson]);

  const handleToggleActivity = (index: number) => {
    setActiveActivities((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const handleSelectAllActivities = () => {
    if (currentLesson) {
      setActiveActivities(new Array(currentLesson.anshita.length).fill(true));
    }
  };

  const handleDeselectAllActivities = () => {
    if (currentLesson) {
      setActiveActivities(new Array(currentLesson.anshita.length).fill(false));
    }
  };

  // 7. Preview Modal & Toast
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // المساعد الذكي قسم مستقل؛ قد يُفتح بسياق قادم من التقويم (مورد/خطأ/نتيجة).
  const openAssistant = (context?: AssistantLaunchContext) => {
    setAssistantContext(context || null);
    setAssistantContextKey(context ? `${Date.now()}-${context.prompt?.slice(0, 24) || ''}` : '');
    setActiveSection('assistant');
  };

  // 8. طباعة مباشرة عبر المتصفح
  const handleDirectPrint = () => {
    window.print();
  };

  // 9. Export as real PDF file (with graceful print fallback)
  const handlePrint = async () => {
    if (!currentLesson) {
      showToast('الرجاء اختيار مورد تعلمي للتصدير');
      return;
    }

    try {
      showToast('جاري إنشاء وتحميل ملف PDF للمذكرة...');
      const { generateMemoPdf } = await import('./utils/pdfExport');
      await generateMemoPdf(config, currentLesson.ta3alom || 'مذكرة_بيداغوجية');
      showToast('✅ تم تنزيل ملف PDF بنجاح');
    } catch (error) {
      console.warn('PDF export error, offering browser print:', error);
      showToast('⚠️ تعذر التحميل المباشر. جاري فتح نافذة الطباعة كبديل...');
      try {
        window.print();
      } catch (printErr) {
        showToast('❌ تعذر إنشاء PDF أو فتح الطباعة');
      }
    }
  };

  // 9. Export as Word document (.docx) - محسّن
  const handleExportWord = async () => {
    if (!currentLesson) {
      showToast('الرجاء اختيار مورد تعلمي للتصدير');
      return;
    }

    const runExport = async (allowFallback: boolean) => {
      showToast('جاري التصدير إلى Word...');
      const { generateDocx } = await import('./utils/docxExport');
      const blob = await generateDocx(
        currentLesson,
        config,
        activeActivities,
        config.memoFormat === 'merged_teacher',
        { allowFallback }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const safeTitle = (currentLesson?.ta3alom || 'مذكرة_بيداغوجية')
        .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 40);

      link.download = `مذكرة_${config.level}_${config.teacherName}_${safeTitle}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);

      showToast(
        allowFallback
          ? '⚠️ تم تصدير المذكرة بخط بديل لعدم تضمين الخط'
          : '✅ تم تصدير المذكرة بنجاح'
      );
    };

    try {
      await runExport(false);
    } catch (error) {
      if (error instanceof DocxFontEmbedError) {
        const choice = await askWordFallbackChoice(error);
        if (choice === 'fallback') {
          try {
            await runExport(true);
          } catch (fallbackErr) {
            console.error('Fallback Word export error:', fallbackErr);
            showToast('❌ حدث خطأ في التصدير. حاول مرة أخرى');
          }
        } else if (choice === 'pdf') {
          await handlePrint();
        } else {
          showToast('تم إلغاء تصدير Word');
        }
        return;
      }
      console.error('Export error:', error);
      showToast('❌ حدث خطأ في التصدير. حاول مرة أخرى');
    }
  };

  const handleResetDefaults = () => {
    const defaultData: MemoConfig = {
      level: selectedLevel,
      schoolName: '',
      directorate: '',
      inspectionDistrict: '',
      teacherName: '',
      teacherGrade: '',
      teacherPhone: '',
      teacherEmail: '',
      schoolYear: '',
      memoNumber: '',
      principalName: '',
      inspectorName: '',
      signDate: new Date().toISOString().split('T')[0],
      teacherStamp: null,
      assignedClasses: [],
      weeklyHours: 0,
    };
    setConfig(defaultData);
  };

  const midanTheme = useMemo(() => {
    switch (selectedLevel) {
      case '1am':
        return {
          midanName: '',
          levelLabel: 'السنة الأولى متوسط (1AM)',
          accentColor: '#0284c7',
          subbarBg: 'from-sky-50/90 via-white to-emerald-50/70 border-sky-200',
          badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
          activeTabBg: 'bg-sky-600 text-white shadow-xs',
          hoverTabClass: 'text-gray-700 hover:text-sky-700 hover:bg-white/80',
          pulseBg: 'bg-sky-600',
          canvasBg: 'bg-gradient-to-br from-sky-50/50 via-[#f8fafc] to-emerald-50/30',
          titleColor: 'text-sky-700',
        };
      case '2am':
        return {
          midanName: '',
          levelLabel: 'السنة الثانية متوسط (2AM)',
          accentColor: '#7c3aed',
          subbarBg: 'from-purple-50/90 via-white to-indigo-50/70 border-purple-200',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
          activeTabBg: 'bg-purple-600 text-white shadow-xs',
          hoverTabClass: 'text-gray-700 hover:text-purple-700 hover:bg-white/80',
          pulseBg: 'bg-purple-600',
          canvasBg: 'bg-gradient-to-br from-purple-50/50 via-[#f8fafc] to-indigo-50/30',
          titleColor: 'text-purple-700',
        };
      case '3am':
        return {
          midanName: 'الدينامية الداخلية للأرض والظواهر الجيولوجية',
          levelLabel: 'السنة الثالثة متوسط (3AM)',
          accentColor: '#0f766e', // لون الزمردي التيل المطابق لتصميم الصورة
          subbarBg: 'from-teal-50/95 via-cyan-50/80 to-amber-50/60 border-teal-300',
          badgeBg: 'bg-teal-100 text-teal-900 border-teal-300 shadow-2xs',
          activeTabBg: 'bg-teal-700 text-white shadow-xs border border-amber-300/40',
          hoverTabClass: 'text-teal-900 hover:text-teal-700 hover:bg-teal-100/70',
          pulseBg: 'bg-teal-600',
          canvasBg: 'bg-gradient-to-br from-teal-50/60 via-[#f0fdfa] to-emerald-50/40',
          titleColor: 'text-teal-800',
        };
      case '4am':
      default:
        return {
          midanName: '',
          levelLabel: 'السنة الرابعة متوسط (4AM - BEM)',
          accentColor: '#c2185b',
          subbarBg: 'from-pink-50/90 via-white to-rose-50/70 border-pink-200',
          badgeBg: 'bg-rose-100 text-[#c2185b] border-rose-300',
          activeTabBg: 'bg-[#c2185b] text-white shadow-xs',
          hoverTabClass: 'text-gray-700 hover:text-[#c2185b] hover:bg-white/80',
          pulseBg: 'bg-[#c2185b]',
          canvasBg: 'bg-gradient-to-br from-rose-50/50 via-[#f8fafc] to-pink-50/30',
          titleColor: 'text-[#c2185b]',
        };
    }
  }, [selectedLevel]);

  const currentLevelLabel = midanTheme.levelLabel;

  // Explicit visual map: each level has its own local/scientific background.
  const curriculumBackground = useMemo(() => {
    if (selectedLevel === '1am') {
      return '/backgrounds/2am-ecosystem.svg';
    }
    if (selectedLevel === '2am') {
      return '/backgrounds/2am-ecosystem.svg';
    }
    if (selectedLevel === '3am') {
      return '/backgrounds/3am-earth.svg';
    }
    if (selectedLevel === '4am') {
      return '/backgrounds/4am-genetics.svg';
    }
    return heroScienceLabImg;
  }, [selectedLevel]);

  const platformNotifications = useMemo(() => {
    const items: Array<{ id: string; title: string; detail: string; actionLabel: string; onAction: () => void }> = [];

    if (!config.teacherName?.trim() || !config.schoolName?.trim()) {
      items.push({
        id: 'profile-incomplete',
        title: 'إكمال بيانات الأستاذ والمؤسسة',
        detail: 'أدخل اسم الأستاذ والمتوسطة والولاية لتظهر تلقائياً في المذكرات والدفتر اليومي.',
        actionLabel: 'فتح الإعدادات',
        onAction: () => {
          setIsNotificationsOpen(false);
          setActiveSection('settings');
        },
      });
    }

    if (!config.teacherStamp) {
      items.push({
        id: 'stamp-missing',
        title: 'تفعيل الخاتم الرسمي للأستاذ',
        detail: 'يمكنك إنشاء أو رفع الختم الرسمي لاعتماده في مطبوعات التدرج والدفتر.',
        actionLabel: 'إعداد الخاتم',
        onAction: () => {
          setIsNotificationsOpen(false);
          setActiveSection('settings');
        },
      });
    }

    items.push({
      id: 'curriculum-ready',
      title: `قاعدة البيانات محدثة (${curriculumLessons.length} مذكرة)`,
      detail: 'جميع مذكرات وتدرجات السنوات الأربع متاحة للتعديل والتصدير إلى Word وPDF.',
      actionLabel: 'إدارة الموارد',
      onAction: () => {
        setIsNotificationsOpen(false);
        setActiveSection('database');
      },
    });

    items.push({
      id: 'sync-status',
      title: user ? 'المزامنة السحابية مفعلة' : 'الحفظ المحلي نشط في المتصفح',
      detail: user
        ? `تم تسجيل الدخول بحساب ${user.email || user.displayName || 'Google'}.`
        : firebaseStatus.isValid
          ? 'يمكنك تسجيل الدخول بحساب Google لمزامنة بياناتك عبر الأجهزة.'
          : 'يتم حفظ التعديلات محلياً مع إمكانية التصدير والنسخ الاحتياطي في أي وقت.',
      actionLabel: 'عرض الدفتر',
      onAction: () => {
        setIsNotificationsOpen(false);
        setLogbookInitialTimetable(false);
        setActiveSection('logbook');
      },
    });

    return items.filter((item) => !dismissedNotifications.includes(item.id));
  }, [config.teacherName, config.schoolName, config.teacherStamp, curriculumLessons.length, user, firebaseStatus.isValid, dismissedNotifications]);

  return (
    <div className="min-h-screen flex flex-col font-sans app-shell overflow-x-clip" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-5 left-5 bg-[#0b1f1c] text-white px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl text-[12.5px] font-bold z-50 flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* Main Streamlined Sticky Header */}
      <header className="app-header sticky top-0 z-30">
        <FlagRibbon />
        <div className="px-3 sm:px-4 md:px-6 min-h-14 sm:h-16 py-2 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 max-w-[1400px] mx-auto w-full">
          {/* Right Section: Drawer Trigger + Brand or Active Context */}
          <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
            <button
              type="button"
              id="btn-open-nav-drawer"
              onClick={() => setIsNavDrawerOpen(true)}
              className="icon-button inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-700 transition cursor-pointer shrink-0"
              title="القائمة الشاملة للمنصة"
              aria-label="القائمة الشاملة للمنصة"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeSection === 'home' ? (
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 sm:gap-2.5 text-right cursor-pointer min-w-0"
              >
                <div className="brand-mark w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0">
                  <Microscope className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="font-extrabold text-[13px] sm:text-[15px] text-slate-900 whitespace-nowrap truncate">
                  المنصة البيداغوجية لعلوم الطبيعة والحياة
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  id="header-btn-back-home"
                  type="button"
                  onClick={() => {
                    setLogbookInitialTimetable(false);
                    setActiveSection('home');
                    showToast('العودة إلى الصفحة الرئيسية');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0b1f1c] text-white text-[11.5px] font-bold hover:bg-[#16302b] shadow-sm transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>الرئيسية</span>
                </button>

                {isYearSection ? (
                  <>
                    <div className="hidden xl:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#e2e8e5] shadow-[0_1px_2px_rgba(11,31,28,0.04)] whitespace-nowrap shrink-0">
                      <span className="text-[12.5px] font-extrabold text-slate-900">{currentLevelLabel}</span>
                    </div>

                    <YearSectionTabs activeTab={yearSubTab} onChange={setYearSubTab} activeClassName={midanTheme.activeTabBg} />
                  </>
                ) : activeSection === 'logbook' ? (
                  <div className="flex items-center gap-2 bg-[#eef5f2] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#cfe3dc] text-[#0a5f51] font-extrabold text-xs sm:text-[13px] whitespace-nowrap truncate">
                    <BookOpenCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">الدفتر الرقمي</span>
                  </div>
                ) : activeSection === 'database' ? (
                  <div className="flex items-center gap-2 bg-[#eef5f2] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#cfe3dc] text-[#0a5f51] font-extrabold text-xs sm:text-[13px] whitespace-nowrap truncate">
                    <Database className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">الموارد التعليمية</span>
                  </div>
                ) : activeSection === 'assessment' ? (
                  <div className="flex items-center gap-2 bg-[#eef5f2] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#cfe3dc] text-[#0a5f51] font-extrabold text-xs sm:text-[13px] whitespace-nowrap truncate">
                    <BookOpenCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">التقويم</span>
                  </div>
                ) : activeSection === 'assistant' ? (
                  <div className="flex items-center gap-2 bg-[#eef5f2] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#cfe3dc] text-[#0a5f51] font-extrabold text-xs sm:text-[13px] whitespace-nowrap truncate">
                    <Microscope className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">المساعد الذكي</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#e2e8e5] text-[#0b1f1c] font-extrabold text-xs sm:text-[13px] whitespace-nowrap truncate">
                    <Settings className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="truncate">الإعدادات والخاتم</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Navigation Links (Home Desktop) */}
          {activeSection === 'home' && (
            <nav aria-label="التنقل السريع" className="hidden xl:flex items-center gap-1 text-[12.5px] font-bold text-slate-600 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('levels-strip');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="rounded-full px-3 py-1.5 text-[#5c6f6a] transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#eef5f2] hover:text-[#0a5f51]"
              >
                السنوات الدراسية
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogbookInitialTimetable(false);
                  setActiveSection('logbook');
                }}
                className="rounded-full px-3 py-1.5 text-[#5c6f6a] transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#eef5f2] hover:text-[#0a5f51]"
              >
                الدفتر الرقمي
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogbookInitialTimetable(true);
                  setActiveSection('logbook');
                }}
                className="rounded-full px-3 py-1.5 text-[#5c6f6a] transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#eef5f2] hover:text-[#0a5f51]"
              >
                استعمال الزمن
              </button>
              <button
                type="button"
                onClick={() => openAssistant()}
                className="rounded-full px-3 py-1.5 text-[#5c6f6a] transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#eef5f2] hover:text-[#0a5f51]"
              >
                المساعد الذكي
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('database')}
                className="rounded-full px-3 py-1.5 text-[#5c6f6a] transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#eef5f2] hover:text-[#0a5f51]"
              >
                الموارد التعليمية
              </button>
            </nav>
          )}

          {/* Left Section: Export Actions (when in memos) + Notifications + Settings + Account */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {isYearSection && yearSubTab === 'memos' && (
              <>
                <button
                  id="btn-preview-memo"
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-[12px] font-bold hover:bg-slate-50 shadow-2xs transition cursor-pointer whitespace-nowrap"
                  title="معاينة المذكرة والطباعة"
                >
                  <Eye className="w-4 h-4 text-teal-700" />
                  <span className="hidden lg:inline">معاينة وطباعة</span>
                </button>
                <ActionMenu label="التصدير والإعدادات" compactLabel="تصدير" items={[
                  { id: 'btn-print-memo', label: 'تصدير PDF', title: 'تحميل ملف PDF حقيقي', onSelect: handlePrint, icon: <FileDown className="w-4 h-4" /> },
                  { id: 'btn-export-word', label: 'تصدير Word', title: 'تصدير كملف Word', onSelect: handleExportWord, icon: <FileDown className="w-4 h-4" /> },
                  { id: 'btn-reset-defaults', label: 'استعادة الإعدادات الافتراضية', onSelect: handleResetDefaults, icon: <RotateCcw className="w-4 h-4" /> },
                ]} />
              </>
            )}

            {/* Notifications Button & Popover */}
            <div className="relative">
              <button
                type="button"
                id="header-btn-notifications"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-expanded={isNotificationsOpen}
                aria-label="الإشعارات والتنبيهات"
                title="الإشعارات والتنبيهات"
                className="icon-button relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-700 transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {platformNotifications.length > 0 && (
                  <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0e7a68] text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-sm">
                    {platformNotifications.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  role="dialog"
                  aria-label="إشعارات المنصة"
                  className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 space-y-2"
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-slate-900">التنبيهات وحالة المنصة</span>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>

                  {platformNotifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      لا توجد تنبيهات جديدة حالياً.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {platformNotifications.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 transition space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-900">{item.title}</span>
                            <button
                              type="button"
                              onClick={() => setDismissedNotifications((prev) => [...prev, item.id])}
                              className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="إخفاء التنبيه"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-[11.5px] text-slate-600 leading-relaxed">{item.detail}</p>
                          <button
                            type="button"
                            onClick={item.onAction}
                            className="text-[11.5px] font-bold text-[#0a5f51] hover:text-[#0b1f1c] cursor-pointer"
                          >
                            {item.actionLabel} ←
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Handwriting & Colored Pens Button */}
            <button
              type="button"
              id="header-btn-handwriting"
              onClick={() => {
                setIsNotificationsOpen(false);
                setIsHandwritingModalOpen(true);
              }}
              aria-label="الكتابة اليدوية والأقلام الملونة"
              title="تخصيص الخط اليدوي وألوان الأقلام"
              className={`icon-button hidden sm:inline-flex items-center justify-center gap-1.5 h-10 px-2.5 rounded-xl transition cursor-pointer ${
                hwStyle.enabled ? 'text-blue-700 border-blue-200 bg-blue-50/70' : 'text-slate-700'
              }`}
            >
              <PenTool className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline text-xs font-extrabold whitespace-nowrap">خط اليد</span>
            </button>

            {/* Settings Button */}
            <button
              type="button"
              id="header-btn-settings"
              onClick={() => {
                setIsNotificationsOpen(false);
                setActiveSection('settings');
              }}
              aria-label="إعدادات الحساب والمؤسسة"
              title="إعدادات الحساب والخاتم والمؤسسة"
              className={`icon-button hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-xl transition cursor-pointer ${
                activeSection === 'settings' ? 'bg-[#eef5f2] text-[#0a5f51] border-[#cfe3dc]' : 'text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Account / Cloud Sync */}
            <UserProfile />
          </div>
        </div>

        {/* Mobile/Tablet Secondary Year Sub-tabs (prevents header horizontal crowding) */}
        {isYearSection && (
          <YearSectionTabs mobile activeTab={yearSubTab} onChange={setYearSubTab} activeClassName={midanTheme.activeTabBg} />
        )}
      </header>

      {/* Main Dynamic Workspace Views */}
      {activeSection === 'home' && (
        <LevelsHomePage
          onSelectYear={(lvl, subTab = 'memos') => {
            setActiveSection(lvl);
            setYearSubTab(subTab);
          }}
          onOpenLogbook={() => {
            setLogbookInitialTimetable(false);
            setActiveSection('logbook');
          }}
          onOpenTimetable={() => {
            setLogbookInitialTimetable(true);
            setActiveSection('logbook');
          }}
          onOpenDatabase={() => setActiveSection('database')}
          onOpenAssessment={() => setActiveSection('assessment')}
          onOpenAssistant={() => openAssistant()}
          onOpenInfoModal={(tab) => setInfoModalTab(tab)}
          config={config}
          curriculumLessons={curriculumLessons}
        />
      )}

      {isYearSection && yearSubTab === 'memos' && (
        <div
          className="flex-1 flex flex-col lg:flex-row relative overflow-x-clip page-desk page-desk--memos"
          style={
            pageStyleTemplate === 'classic'
              ? {
                  backgroundImage: `url(${curriculumBackground})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'scroll',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: selectedLevel === '3am' ? '#f0fdfa' : '#f8fafc',
                }
              : undefined
          }
        >
          {/* طبقة الخلفية التعليمية الهادئة والمريحة للقراءة (تظهر في النمط الكلاسيكي فقط) */}
          {pageStyleTemplate === 'classic' && (
            <div
              key={curriculumBackground + bgClarity}
              className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 overflow-hidden"
              aria-hidden="true"
              style={{
                backgroundImage: "url(" + curriculumBackground + ")",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: selectedLevel === '3am'
                  ? (bgClarity === 'vivid' ? 0.38 : bgClarity === 'medium' ? 0.22 : 0.12)
                  : 0.25,
                mixBlendMode: 'multiply',
              }}
            >
              {selectedLevel === '1am' && (
                <>
                  <img
                    src="https://www.svgrepo.com/download/16219/healthy-nutrition.svg"
                    alt=""
                    className="absolute left-[7%] top-[14%] w-28 md:w-40 lg:w-52 opacity-35"
                  />
                  <img
                    src="https://www.svgrepo.com/download/159364/digestive-system.svg"
                    alt=""
                    className="absolute right-[7%] bottom-[10%] w-24 md:w-36 lg:w-48 opacity-25"
                  />
                </>
              )}
            </div>
          )}
          {/* Sidebar Controls for Memos */}
          <div className="relative z-10 w-full flex flex-col lg:flex-row">
          <SidebarControls
            selectedLevel={selectedLevel}
            setSelectedLevel={(lvl) => setActiveSection(lvl)}
            selectedMidan={activeMidan}
            setSelectedMidan={() => {}}
            selectedMaqta={selectedMaqta}
            setSelectedMaqta={setSelectedMaqta}
            selectedMawrid={selectedMawrid}
            setSelectedMawrid={setSelectedMawrid}
            selectedTa3alom={selectedTa3alom}
            setSelectedTa3alom={setSelectedTa3alom}
            currentLesson={currentLesson}
            activeActivities={activeActivities}
            onToggleActivity={handleToggleActivity}
            onSelectAllActivities={handleSelectAllActivities}
            onDeselectAllActivities={handleDeselectAllActivities}
            config={config}
            setConfig={setConfig}
            mawridList={mawridList}
            ta3alomList={ta3alomList}
            maqatiList={maqatiForLevel}
            showToast={showToast}
            onOpen1amArchive={() => setYearSubTab('source')}
          />

          {/* Paper Canvas */}
          <main id="main-content" className="relative z-10 flex-1 p-4 md:p-8 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-[960px] mb-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-gray-500">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('home')}
                  className="text-gray-700 hover:text-black font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>الرئيسية</span>
                </button>
                <span>/</span>
                <span>المستوى الدراسي:</span>
                <strong className={midanTheme.titleColor}>
                  {currentLevelLabel}
                </strong>
              </div>

              {/* أداة التحكم السريعة في وضوح خلفية القسم */}
              {pageStyleTemplate === 'classic' && selectedLevel === '3am' && (
                <label className="flex items-center gap-2 bg-white/95 px-3 py-1 rounded-full border border-teal-300 text-[11.5px] font-bold shadow-xs no-print text-teal-900">
                  <span>وضوح الخلفية:</span>
                  <select value={bgClarity} onChange={(event) => setBgClarity(event.target.value as 'vivid' | 'medium' | 'soft')} className="bg-transparent text-teal-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700">
                    <option value="vivid">عالي (100%)</option>
                    <option value="medium">متوازن</option>
                    <option value="soft">هادئ</option>
                  </select>
                </label>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <PageTemplateSwitcher />
                <SelectionPenStrip
                  settings={hwStyle}
                  onNotify={showToast}
                  onOpenCustomizer={() => setIsHandwritingModalOpen(true)}
                  compact
                />
              </div>
            </div>

            <MemoSheet
              lesson={currentLesson}
              config={config}
              activeActivities={activeActivities}
              onToggleActivity={handleToggleActivity}
              onFormatChange={(fmt) => {
                setConfig((prev) => ({ ...prev, memoFormat: fmt }));
                showToast(
                  fmt === 'merged_teacher'
                    ? 'تم تفعيل نموذج المذكرة المدمجة (بدون خانة نشاط المتعلم)'
                    : 'تم تفعيل النموذج المفصل (أستاذ + متعلم)'
                );
              }}
              editable={true}
            />
          </main>
          </div>
        </div>
      )}

      {isYearSection && yearSubTab === 'source' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          {selectedLevel === '1am' ? (
            <Suspense fallback={<SectionLoading />}>
              <SourceMemo1AMViewer
                lessons={curriculumLessons}
                onOpenMemoUnit={(lesson) => {
                  setSelectedMaqta(lesson.maqta);
                  setSelectedMawrid(lesson.mawrid);
                  setSelectedTa3alom(lesson.ta3alom);
                  setYearSubTab('memos');
                  showToast(`تم فتح مذكرة ${lesson.memoNumber || ''}: ${lesson.ta3alom}`);
                }}
                onRecallToLogbook={() => {
                  setActiveSection('logbook');
                  showToast('تم الانتقال إلى الدفتر اليومي لاستدعاء موارد الحصة');
                }}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<SectionLoading />}>
              <SourceContentViewer
                key={selectedLevel}
                level={selectedLevel as '2am' | '3am' | '4am'}
                lessons={curriculumLessons}
                onOpenMemoUnit={(lesson) => {
                  setSelectedMaqta(lesson.maqta);
                  setSelectedMawrid(lesson.mawrid);
                  setSelectedTa3alom(lesson.ta3alom);
                  setYearSubTab('memos');
                  showToast(`تم فتح مذكرة ${lesson.memoNumber || ''}: ${lesson.ta3alom}`);
                }}

              />
            </Suspense>
          )}
        </div>
      )}

      {isYearSection && yearSubTab === 'plans' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <Suspense fallback={<SectionLoading />}>
            <YearPlansViewer key={selectedLevel} level={selectedLevel} lessons={curriculumLessons} onOpenMemoUnit={(lesson) => {
              setSelectedMaqta(lesson.maqta);
              setSelectedMawrid(lesson.mawrid);
              setSelectedTa3alom(lesson.ta3alom);
              setYearSubTab('memos');
              showToast(`تم فتح مذكرة ${lesson.memoNumber || ''}: ${lesson.ta3alom}`);
            }} />
          </Suspense>
        </div>
      )}

      {isYearSection && yearSubTab === 'guide' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <Suspense fallback={<SectionLoading />}>
            {selectedLevel === '1am' ? <SourceGuide1AMViewer lessons={curriculumLessons} onOpenMemoUnit={(lesson) => {
                setSelectedMaqta(lesson.maqta);
                setSelectedMawrid(lesson.mawrid);
                setSelectedTa3alom(lesson.ta3alom);
                setYearSubTab('memos');
                showToast(`تم فتح مذكرة ${lesson.memoNumber || ''}: ${lesson.ta3alom}`);
              }} />
              : selectedLevel === '2am' ? <SourceGuide2AMViewer lessons={curriculumLessons} />
              : selectedLevel === '3am' ? <SourceGuide3AMViewer lessons={curriculumLessons} />
              : <SourceGuide4AMViewer lessons={curriculumLessons} />}
          </Suspense>
        </div>
      )}

      {isYearSection && yearSubTab === 'distribution' && (
        <div
          className="flex-1 flex flex-col relative overflow-hidden page-desk page-desk--distribution-shell"
          style={
            pageStyleTemplate === 'classic'
              ? {
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.16)), url(${curriculumBackground})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'scroll',
                  backgroundRepeat: 'no-repeat',
                }
              : undefined
          }
        >
          {pageStyleTemplate === 'classic' && (
            <div
              key={curriculumBackground}
              className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
              aria-hidden="true"
              style={{
                backgroundImage: "url(" + curriculumBackground + ")",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.20,
                mixBlendMode: 'multiply',
              }}
            >
              {selectedLevel === '1am' && (
                <>
                  <img
                    src="https://www.svgrepo.com/download/16219/healthy-nutrition.svg"
                    alt=""
                    className="absolute left-[6%] top-[12%] w-28 md:w-40 lg:w-52 opacity-35"
                  />
                  <img
                    src="https://www.svgrepo.com/download/159364/digestive-system.svg"
                    alt=""
                    className="absolute right-[6%] bottom-[10%] w-24 md:w-36 lg:w-48 opacity-25"
                  />
                </>
              )}
            </div>
          )}
          <div className="relative z-10 w-full min-h-full">
            <Suspense fallback={<SectionLoading />}>
              <AnnualDistribution
                selectedLevel={selectedLevel}
                setSelectedLevel={(lvl) => setActiveSection(lvl)}
                config={config}
                setConfig={setConfig}
                showToast={showToast}
                curriculumLessons={curriculumLessons}
                curriculumBackground={curriculumBackground}
              />
            </Suspense>
          </div>
        </div>
      )}

      {activeSection === 'logbook' && (
        <Suspense fallback={<SectionLoading />}>
          <DailyLogbook
            selectedLevel={selectedLevel}
            setSelectedLevel={(lvl) => {
              if (lvl) {
                setConfig((prev) => ({ ...prev, level: lvl }));
              }
            }}
            config={config}
            setConfig={setConfig}
            showToast={showToast}
            initialOpenTimetable={logbookInitialTimetable}
          />
        </Suspense>
      )}

      {activeSection === 'database' && (
        <Suspense fallback={<SectionLoading />}>
          <CurriculumDatabaseManager
            lessons={curriculumLessons}
            setLessons={setCurriculumLessons}
            showToast={showToast}
          />
        </Suspense>
      )}

      {activeSection === 'settings' && (
        <Suspense fallback={<SectionLoading />}>
          <AccountSettings
            config={config}
            setConfig={setConfig}
            showToast={showToast}
          />
        </Suspense>
      )}

      {activeSection === 'assessment' && (
        <Suspense fallback={<SectionLoading />}>
          <AssessmentHub
            config={config}
            curriculumLessons={curriculumLessons}
            initialLevel={selectedLevel}
            onOpenAssistant={(context) => openAssistant({
              prompt: context.prompt,
              level: context.level || selectedLevel,
              maqta: context.maqta,
              mawrid: context.mawrid,
              error: context.error,
              successRate: context.successRate,
              label: [context.level, context.maqta, context.mawrid].filter(Boolean).join(' · ') || 'تحليل التقويم',
            })}
            showToast={showToast}
          />
        </Suspense>
      )}

      {activeSection === 'assistant' && (
        <Suspense fallback={<SectionLoading />}>
          <AIAssistantChat
            isOpen
            mode="section"
            selectedLevel={assistantContext?.level || selectedLevel}
            currentLesson={isYearSection ? currentLesson : null}
            curriculumLessons={curriculumLessons}
            context={assistantContext}
            contextKey={assistantContextKey}
          />
        </Suspense>
      )}

      {/* Global Navigation Drawer */}
      <PlatformNavigationDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        activeSection={activeSection}
        onNavigate={(sec) => {
          setLogbookInitialTimetable(false);
          setActiveSection(sec as MainSectionType);
          setYearSubTab('memos');
        }}
        onOpenTimetable={() => {
          setLogbookInitialTimetable(true);
          setActiveSection('logbook');
        }}
        onOpenInfoModal={(tab) => setInfoModalTab(tab)}
        config={config}
      />

      {/* Platform Info and Contact Modal */}
      <PlatformInfoModal
        isOpen={infoModalTab !== null}
        defaultTab={infoModalTab || 'about'}
        onClose={() => setInfoModalTab(null)}
      />

      {/* Modal for Print Preview of Memos */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        lesson={currentLesson}
        config={config}
        activeActivities={activeActivities}
        onPrint={handlePrint}
        onExportWord={handleExportWord}
        onDirectPrint={handleDirectPrint}
      />
      <HandwritingStylePanel
        isOpen={isHandwritingModalOpen}
        onClose={() => setIsHandwritingModalOpen(false)}
        showToast={showToast}
      />
      <DocxFontFallbackModal
        error={pendingWordFontError}
        onConfirmFallback={confirmWordFallback}
        onExportPdf={exportWordPdfInstead}
        onCancel={cancelWordFallback}
      />
      <FirebaseDataSync />
    </div>
  );
};

export default App;
