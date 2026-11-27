/**
 * الدفتر اليومي — النظام المُعاد تصميمه.
 *
 * يتكون من:
 *   1. **الشريط الجانبي**: ثابت، يضم جميع عمليات الدفتر (التاريخ، التوليد،
 *      إدارة الحصص، المحتوى التعليمي، التحرير، البحث، السجل، التصدير).
 *   2. **مساحة الدفتر**: صفحة بيضاء بتنسيق احترافي تشبه ورقة Word، تعرض
 *      محتوى اليوم أو الأسبوع أو الشهر.
 *
 * القاعدة الأساسية: التاريخ الذي يختاره الأستاذ هو المرجع الوحيد.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarRange,
  Sparkles,
  Plus,
  Pencil,
  ArrowLeftRight,
  Ban,
  RotateCcw,
  GraduationCap,
  BookMarked,
  ListChecks,
  FlaskConical,
  Library,
  PenLine,
  Search,
  History,
  Printer,
  FileText,
  FileDown,
  Eye,
  X,
  Check,
  ChevronRight,
  Clock,
  Users,
  Layers,
  ClipboardList,
  NotebookPen,
  Info,
  AlertTriangle,
  Undo2,
  Copy,
  Repeat,
  MoreHorizontal,
} from 'lucide-react';
import { useLogbookStore } from './useLogbookStore';
import {
  CANCELLATION_REASON_LABELS,
  LESSON_TYPE_LABELS,
  LEVEL_LABELS,
  PERIOD_LABELS,
  type Lesson,
  type LogbookLevel,
  type CancellationReason,
} from './types';
import {
  ARABIC_MONTH_NAMES,
  ARABIC_WEEK_DAYS,
  SCHOOL_WEEK_DAYS,
  addDays,
  dayNameOf,
  formatDateArabic,
  formatDateToIsoString,
  getPeriodRange,
  isSchoolDay,
  startOfMonth,
  startOfWeek,
  todayIso,
} from './dateUtils';
import { getCurriculumUnits } from './generation';
import { LessonFormModal } from './LessonFormModal';
import { exportLogbookPdf, exportLogbookWord, buildExportName } from './exporters';

interface LogbookStudioProps {
  teacherId: string;
  schoolYear: string;
  teacherName: string;
  configLevel: '1am' | '2am' | '3am' | '4am';
  showToast: (msg: string) => void;
}

type SidebarSection =
  | 'lessons'
  | 'content'
  | 'edit'
  | 'search'
  | 'log'
  | 'export';

export function LogbookStudio({ teacherId, schoolYear, teacherName, configLevel, showToast }: LogbookStudioProps) {
  const store = useLogbookStore(teacherId, schoolYear);
  const level: LogbookLevel = (`${configLevel[0]}م` as LogbookLevel);

  const [activeSection, setActiveSection] = useState<SidebarSection>('lessons');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(85);
  const [lastAction, setLastAction] = useState<{ label: string; undo: () => void } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const notebookRef = useRef<HTMLDivElement>(null);

  const selectedLesson = useMemo(
    () => store.lessons.find((l) => l.id === selectedLessonId) || null,
    [store.lessons, selectedLessonId]
  );

  const flash = (label: string, undo: () => void) => {
    setLastAction({ label, undo });
    showToast(label);
  };

  const handleSaveLesson = (lesson: Lesson) => {
    const isEdit = store.lessons.some((l) => l.id === lesson.id);
    store.addOrUpdateLesson(
      lesson,
      isEdit ? `تم تعديل الحصة: ${lesson.activity || lesson.className}` : `تمت إضافة الحصة إلى ${formatDateArabic(lesson.date)}`,
      isEdit ? 'edited' : 'created'
    );
    setIsFormOpen(false);
    setEditing(null);
    flash(isEdit ? 'تم حفظ التعديلات' : 'تمت إضافة الحصة إلى الدفتر', () =>
      store.removeLessonPermanently(lesson.id)
    );
    setSelectedLessonId(lesson.id);
  };

  const handleCancel = (reason: CancellationReason, detail: string) => {
    if (!selectedLessonId) return;
    store.cancelLesson(selectedLessonId, reason, detail);
    const lesson = store.lessons.find((l) => l.id === selectedLessonId);
    flash(`تم إلغاء الحصة — السبب: ${CANCELLATION_REASON_LABELS[reason]}`, () =>
      store.restoreLesson(selectedLessonId)
    );
    void lesson;
    setIsCancelModalOpen(false);
  };

  const handleRestore = (id: string) => {
    store.restoreLesson(id);
    flash('تم استعادة الحصة إلى البرنامج', () => store.cancelLesson(id, 'holiday', ''));
    setSelectedLessonId(id);
  };

  const handleCopy = (lesson: Lesson) => {
    store.copyLessonTo(lesson, store.selectedDate);
    flash(`تم نسخ الحصة إلى ${formatDateArabic(store.selectedDate)}`, () => {});
    setSelectedLessonId(lesson.id);
  };

  const handleRepeat = (lesson: Lesson, dates: string[]) => {
    store.repeatLessonTo(lesson, dates);
    flash(`تم تكرار الحصة إلى ${dates.length} تواريخ`, () => {});
    setIsRepeatModalOpen(false);
  };

  const handleGenerate = (p: 'day' | 'week' | 'month') => {
    const { added, skipped } = store.generateForPeriod(store.selectedDate, p, level);
    store.setPeriod(p);
    if (added > 0) flash(`تم توليد ${added} حصة لـ ${PERIOD_LABELS[p]}`, () => {});
    else showToast('لا توجد حصص جديدة للتوريد — كل الحصص موجودة بالفعل');
    if (skipped > 0) showToast(`تم تجاوز ${skipped} حصة موجودة`);
  };

  const handleExportPdf = async () => {
    if (!notebookRef.current) return;
    showToast('جاري تصدير PDF…');
    try {
      await exportLogbookPdf(
        notebookRef.current,
        buildExportName(store.selectedDate, store.period, 'pdf'),
        { teacherName, level: LEVEL_LABELS[level], className: '', subject: 'علوم الطبيعة والحياة' }
      );
      showToast('✅ تم تصدير PDF بنجاح');
    } catch {
      showToast('❌ تعذر تصدير PDF');
    }
  };

  const handleExportWord = async () => {
    showToast('جاري تصدير Word…');
    try {
      await exportLogbookWord(
        store.lessons,
        store.selectedDate,
        store.period,
        { teacherName, level: LEVEL_LABELS[level], className: '', subject: 'علوم الطبيعة والحياة' },
        buildExportName(store.selectedDate, store.period, 'docx')
      );
      showToast('✅ تم تصدير Word بنجاح');
    } catch {
      showToast('❌ تعذر تصدير Word');
    }
  };

  const handlePrint = () => {
    if (notebookRef.current) {
      // طباعة محتوى الصحيفة فقط (جميع الصفحات).
      const el = notebookRef.current;
      const printCss = '@media print{.no-print{display:none!important}}';
      const style = document.createElement('style');
      style.textContent = printCss;
      document.head.appendChild(style);
      window.print();
      setTimeout(() => document.head.removeChild(style), 1000);
      void el;
    }
  };

  const periodRange = getPeriodRange(store.selectedDate, store.period);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-[#f6faf9]">
      {/* ============ الشريط الجانبي ============ */}
      <aside
        className={`no-print ${mobileSidebarOpen ? 'fixed inset-y-0 right-0 z-50 w-80' : 'hidden'} lg:static lg:flex lg:w-80 lg:z-auto lg:shrink-0`}
        dir="rtl"
      >
        <div className="h-full w-full flex flex-col bg-white border-l border-slate-200 overflow-y-auto">
          {/* Title */}
          <div className="px-5 py-5 border-b border-slate-100 bg-gradient-to-b from-teal-50/60 to-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">📘 الدفتر اليومي</h2>
                <p className="text-[11px] text-slate-500">إدارة الحصص اليومية</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {/* 📅 التاريخ والفترة — معروض مباشرة داخل الشريط */}
            <InlineSectionTitle icon={<Calendar className="w-4 h-4" />} title="📅 التاريخ والفترة" />
            <DateInline
              selectedDate={store.selectedDate}
              setSelectedDate={store.setSelectedDate}
              period={store.period}
              setPeriod={store.setPeriod}
            />

            {/* ⚡ التوليد — معروض مباشرة داخل الشريط */}
            <InlineSectionTitle icon={<Sparkles className="w-4 h-4" />} title="⚡ التوليد" />
            <GenerateInline onGenerate={handleGenerate} period={store.period} />

            <div className="my-3 px-3 text-[10px] font-black uppercase tracking-wide text-slate-400">إدارة الحصص</div>
            <NavButton icon={<Clock className="w-4 h-4" />} label="🕐 حصص اليوم" active={activeSection === 'lessons'} onClick={() => { setActiveSection('lessons'); setMobileSidebarOpen(false); }} badge={store.visibleLessons.length || undefined} />
            <NavButton icon={<Plus className="w-4 h-4" />} label="➕ إضافة حصة" onClick={() => { setEditing(null); setIsFormOpen(true); }} />
            <NavButton icon={<Pencil className="w-4 h-4" />} label="✏️ تعديل الحصة" disabled={!selectedLesson} onClick={() => { if (selectedLesson) { setEditing(selectedLesson); setIsFormOpen(true); } }} />
            <NavButton icon={<ArrowLeftRight className="w-4 h-4" />} label="🔄 نقل الحصة" disabled={!selectedLesson} onClick={() => selectedLesson && setIsMoveModalOpen(true)} />
            <NavButton icon={<Ban className="w-4 h-4" />} label="🚫 إلغاء الحصة" disabled={!selectedLesson || selectedLesson?.status === 'cancelled'} onClick={() => selectedLesson && setIsCancelModalOpen(true)} />
            <NavButton icon={<RotateCcw className="w-4 h-4" />} label="↩️ استعادة حصة" disabled={!selectedLesson || selectedLesson?.status !== 'cancelled'} onClick={() => selectedLesson && handleRestore(selectedLesson.id)} />

            <div className="my-3 px-3 text-[10px] font-black uppercase tracking-wide text-slate-400">المحتوى والأدوات</div>
            <NavButton icon={<Library className="w-4 h-4" />} label="📚 المحتوى التعليمي" active={activeSection === 'content'} onClick={() => { setActiveSection('content'); setMobileSidebarOpen(false); }} />
            <NavButton icon={<PenLine className="w-4 h-4" />} label="✏️ تحرير الدفتر" active={activeSection === 'edit'} onClick={() => { setActiveSection('edit'); setMobileSidebarOpen(false); }} />
            <NavButton icon={<Search className="w-4 h-4" />} label="🔎 البحث" active={activeSection === 'search'} onClick={() => { setActiveSection('search'); setMobileSidebarOpen(false); }} />
            <NavButton icon={<History className="w-4 h-4" />} label="🕘 السجل" active={activeSection === 'log'} onClick={() => { setActiveSection('log'); setMobileSidebarOpen(false); }} badge={store.logs.length || undefined} />
            <NavButton icon={<Printer className="w-4 h-4" />} label="🖨️ المعاينة والتصدير" active={activeSection === 'export'} onClick={() => { setActiveSection('export'); setMobileSidebarOpen(false); }} />
          </nav>

          {/* Undo */}
          {lastAction && (
            <div className="px-3 pb-3 no-print">
              <button
                onClick={() => { lastAction.undo(); setLastAction(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[12px] font-bold hover:bg-amber-100 cursor-pointer transition"
              >
                <Undo2 className="w-4 h-4" />
                {lastAction.label} — إلغاء
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="no-print fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ============ مساحة الدفتر ============ */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <div className="no-print lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer">
            <MoreHorizontal className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <span className="font-black text-slate-900">📘 الدفتر اليومي</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Workspace content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {/* Notebook paper */}
          <div ref={notebookRef} className="mx-auto bg-white shadow-xl shadow-slate-300/50 rounded-sm sm:rounded-lg border border-slate-200 w-full max-w-[820px] min-h-[600px] print:shadow-none print:border-0">
            {/* Header */}
            <NotebookHeader
              teacherName={teacherName}
              selectedDate={store.selectedDate}
              period={store.period}
              level={level}
            />

            {/* Period tabs */}
            <div className="no-print flex items-center gap-2 px-6 py-3 border-b border-dashed border-slate-200">
              {(['day', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => store.setPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition flex items-center gap-1.5 ${
                    store.period === p
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p === 'day' ? <CalendarDays className="w-3.5 h-3.5" /> : p === 'week' ? <CalendarRange className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                  {PERIOD_LABELS[p]}
                </button>
              ))}
              <div className="ml-auto text-[11px] text-slate-400">
                {formatDateArabic(periodRange.start)}{store.period !== 'day' ? ` — ${formatDateArabic(periodRange.end)}` : ''}
              </div>
            </div>

            {/* Lessons */}
            <div className="px-6 py-5 space-y-5">
              {store.lessonsByDay.length === 0 ? (
                <EmptyState onAdd={() => { setEditing(null); setIsFormOpen(true); }} onGenerate={() => handleGenerate(store.period)} />
              ) : (
                store.lessonsByDay.map((day) => (
                  <div key={day.date} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-lg">
                        {day.label}
                      </h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    {day.lessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        selected={lesson.id === selectedLessonId}
                        onSelect={() => { setSelectedLessonId(lesson.id); setActiveSection('lessons'); }}
                        onEdit={() => { setEditing(lesson); setIsFormOpen(true); }}
                        onCancel={() => { setSelectedLessonId(lesson.id); setIsCancelModalOpen(true); }}
                        onRestore={() => handleRestore(lesson.id)}
                        onMove={() => { setSelectedLessonId(lesson.id); setIsMoveModalOpen(true); }}
                        onCopy={() => handleCopy(lesson)}
                        onRepeat={() => { setSelectedLessonId(lesson.id); setIsRepeatModalOpen(true); }}
                        onComplete={() => { store.completeLesson(lesson.id); flash('تم تحديد الحصة مكتملة', () => store.completeLesson(lesson.id)); }}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <footer className="no-print text-center text-[10px] text-slate-400 py-6 border-t border-slate-100">
              الدفتر اليومي — {PERIOD_LABELS[store.period]} • {formatDateArabic(periodRange.start)} • 🇩🇿
            </footer>
          </div>
        </div>
      </main>

      {/* ============ Panels overlay ============ */}
      <SectionPanel
        section={activeSection}
        onClose={() => setActiveSection('lessons')}
        store={store}
        level={level}
        selectedLesson={selectedLesson}
        setSelectedLessonId={setSelectedLessonId}
        showToast={showToast}
        flash={flash}
        onEdit={(l) => { setEditing(l); setIsFormOpen(true); }}
        onAdd={() => { setEditing(null); setIsFormOpen(true); }}
        onGenerate={handleGenerate}
        onExportPdf={handleExportPdf}
        onExportWord={handleExportWord}
        onPrint={handlePrint}
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      {/* Preview modal (all pages) */}
      {isPreviewOpen && (
        <PreviewModal
          onClose={() => setIsPreviewOpen(false)}
          zoom={previewZoom}
          setZoom={setPreviewZoom}
          onExportPdf={handleExportPdf}
          onExportWord={handleExportWord}
          onPrint={handlePrint}
        />
      )}

      {/* Lesson form */}
      <LessonFormModal
        isOpen={isFormOpen}
        initial={editing}
        defaultDate={store.selectedDate}
        defaultLevel={level}
        onClose={() => { setIsFormOpen(false); setEditing(null); }}
        onSave={handleSaveLesson}
      />

      {/* Cancel confirm */}
      {isCancelModalOpen && selectedLesson && (
        <CancelLessonModal
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancel}
        />
      )}

      {/* Move lesson */}
      {isMoveModalOpen && selectedLesson && (
        <MoveLessonModal
          lesson={selectedLesson}
          onClose={() => setIsMoveModalOpen(false)}
          onConfirm={(date, start, end, className) => {
            store.moveLessonTo(selectedLesson.id, date, start, end, className);
            flash(`تم نقل الحصة إلى ${formatDateArabic(date)}`, () => store.moveLessonTo(selectedLesson.id, selectedLesson.date, selectedLesson.startTime, selectedLesson.endTime, selectedLesson.className));
            setIsMoveModalOpen(false);
          }}
        />
      )}

      {/* Repeat lesson */}
      {isRepeatModalOpen && selectedLesson && (
        <RepeatLessonModal
          lesson={selectedLesson}
          onClose={() => setIsRepeatModalOpen(false)}
          onConfirm={(dates) => handleRepeat(selectedLesson, dates)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nav button
// ---------------------------------------------------------------------------
function NavButton({
  icon,
  label,
  active,
  onClick,
  disabled,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold transition group ${
        active
          ? 'bg-teal-50 text-teal-800'
          : 'text-slate-700 hover:bg-slate-50'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={active ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}>{icon}</span>
      <span className="flex-1 text-right">{label}</span>
      {badge != null && (
        <span className="text-[10px] font-black bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">{badge}</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Notebook header
// ---------------------------------------------------------------------------
function NotebookHeader({ teacherName, selectedDate, period, level }: { teacherName: string; selectedDate: string; period: 'day' | 'week' | 'month'; level: LogbookLevel }) {
  const range = getPeriodRange(selectedDate, period);
  return (
    <div className="px-6 pt-7 pb-5 border-b-2 border-slate-900 text-center">
      <h1 className="text-xl font-black text-slate-900 tracking-tight">الدفتر اليومي</h1>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-slate-700">
        <Field label="الأستاذ" value={teacherName || '—'} />
        <Field label="المستوى" value={LEVEL_LABELS[level]} />
        <Field label="التاريخ" value={formatDateArabic(range.start)} />
        <Field label="الفترة" value={PERIOD_LABELS[period]} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="font-bold text-slate-500">{label}:</span>
      <span className="font-black text-slate-900 text-right">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lesson card
// ---------------------------------------------------------------------------
function LessonCard({
  lesson,
  selected,
  onSelect,
  onEdit,
  onCancel,
  onRestore,
  onMove,
  onCopy,
  onRepeat,
  onComplete,
}: {
  lesson: Lesson;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onRestore: () => void;
  onMove: () => void;
  onCopy: () => void;
  onRepeat: () => void;
  onComplete: () => void;
}) {
  const cancelled = lesson.status === 'cancelled';
  const completed = lesson.status === 'completed';

  if (cancelled) {
    return (
      <div
        onClick={onSelect}
        className={`rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 p-4 transition cursor-pointer ${selected ? 'ring-2 ring-red-400' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚫</span>
            <div>
              <div className="font-black text-red-800 text-sm">حصة ملغاة</div>
              <div className="text-[11px] text-red-600">
                {lesson.startTime} — {lesson.endTime} · {lesson.className || '—'}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-[12px] text-red-700 font-bold">
          سبب الإلغاء: {lesson.cancellationReason ? CANCELLATION_REASON_LABELS[lesson.cancellationReason] : 'غير محدد'}
          {lesson.cancellationDetail ? ` (${lesson.cancellationDetail})` : ''}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="no-print px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> استعادة الحصة
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="no-print px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold">
            عرض التفاصيل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border bg-white p-4 transition cursor-pointer ${
        selected ? 'border-teal-500 ring-2 ring-teal-500/30 shadow-md' : 'border-slate-200 hover:border-teal-300 hover:shadow-sm'
      }`}
    >
      {/* Top row: time + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg text-[13px]">
            <Clock className="w-3.5 h-3.5" />
            {lesson.startTime} — {lesson.endTime}
          </div>
          {completed && (
            <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> مكتملة
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <GraduationCap className="w-3 h-3 inline mr-0.5" />
            {lesson.level}
          </span>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <Users className="w-3 h-3 inline mr-0.5" />
            {lesson.className || '—'}
          </span>
        </div>
      </div>

      {/* Section row */}
      <div className="mt-3 space-y-1 text-[13px]">
        {lesson.unit && (
          <Row icon={<Layers className="w-3.5 h-3.5" />} label="المقطع" value={lesson.unit} />
        )}
        {lesson.activity && (
          <Row icon={<Sparkles className="w-3.5 h-3.5" />} label="النشاط" value={lesson.activity} />
        )}
        <Row icon={<BookMarked className="w-3.5 h-3.5" />} label="نوع الحصة" value={LESSON_TYPE_LABELS[lesson.type]} />
      </div>

      {lesson.competency && (
        <div className="mt-2 text-[12px] text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
          <span className="font-bold text-teal-700">الكفاءة المستهدفة:</span> {lesson.competency}
        </div>
      )}

      {/* Actions (appear on hover / selection) */}
      <div className={`no-print mt-3 flex items-center gap-2 transition ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button onClick={(e) => { e.stopPropagation(); onComplete(); }} className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-[12px] font-bold flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> مكتملة
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-[12px] font-bold flex items-center gap-1">
          <Pencil className="w-3.5 h-3.5" /> تعديل
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMove(); }} className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[12px] font-bold flex items-center gap-1">
          <ArrowLeftRight className="w-3.5 h-3.5" /> نقل
        </button>
        <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[12px] font-bold flex items-center gap-1">
          <Copy className="w-3.5 h-3.5" /> نسخ
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRepeat(); }} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[12px] font-bold flex items-center gap-1">
          <Repeat className="w-3.5 h-3.5" /> تكرار
        </button>
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-[12px] font-bold flex items-center gap-1">
          <Ban className="w-3.5 h-3.5" /> إلغاء
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-700">
      <span className="text-teal-500">{icon}</span>
      <span className="font-bold text-slate-500 text-[12px]">{label}:</span>
      <span className="font-black text-slate-900 text-right flex-1">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onAdd, onGenerate }: { onAdd: () => void; onGenerate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-3xl mb-4">📄</div>
      <h3 className="font-black text-slate-800">لا توجد حصص في هذه الفترة</h3>
      <p className="text-[13px] text-slate-500 mt-1 max-w-sm">
        يمكنك إضافة حصة يدويًا أو توليد الفترة الحالية تلقائيًا من التاريخ المحدد.
      </p>
      <div className="flex flex-wrap gap-2 mt-5 justify-center">
        <button onClick={onAdd} className="no-print px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center gap-1.5 shadow-lg shadow-teal-600/30">
          <Plus className="w-4 h-4" /> إضافة حصة
        </button>
        <button onClick={onGenerate} className="no-print px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-sm flex items-center gap-1.5 hover:bg-slate-50">
          <Sparkles className="w-4 h-4" /> توليد الفترة
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cancel lesson modal
// ---------------------------------------------------------------------------
function CancelLessonModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: CancellationReason, detail: string) => void }) {
  const [reason, setReason] = useState<CancellationReason>('teacher_absent');
  const [detail, setDetail] = useState('');
  return (
    <Modal onClose={onClose} title="إلغاء الحصة" icon={<Ban className="w-5 h-5 text-red-600" />}>
      <div className="text-[13px] text-slate-600 mb-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        ستتحول الحصة إلى <strong className="text-red-700">ملغاة</strong> وتبقى في السجل. يمكنك استعادتها لاحقًا.
      </div>
      <div className="space-y-2">
        {(Object.keys(CANCELLATION_REASON_LABELS) as CancellationReason[]).map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-[13px] font-bold transition ${
              reason === r ? 'border-red-400 bg-red-50 text-red-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {CANCELLATION_REASON_LABELS[r]}
            {reason === r && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
      {reason === 'other' && (
        <input
          type="text"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="اكتب سبب الإلغاء…"
          className="w-full mt-4 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
        />
      )}
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer">
          إلغاء
        </button>
        <button onClick={() => onConfirm(reason, detail)} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-1.5">
          <Ban className="w-4 h-4" /> تأكيد الإلغاء
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Move lesson modal
// ---------------------------------------------------------------------------
function MoveLessonModal({ lesson, onClose, onConfirm }: { lesson: Lesson; onClose: () => void; onConfirm: (date: string, start: string, end: string, className: string) => void }) {
  const [date, setDate] = useState(lesson.date);
  const [start, setStart] = useState(lesson.startTime);
  const [end, setEnd] = useState(lesson.endTime);
  const [className, setClassName] = useState(lesson.className);
  return (
    <Modal onClose={onClose} title="نقل الحصة" icon={<ArrowLeftRight className="w-5 h-5 text-blue-600" />}>
      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">التاريخ الجديد</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
          <div className="text-[11px] text-slate-500 mt-1">{dayNameOf(date)} — {formatDateArabic(date)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">البداية</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">النهاية</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
          </div>
        </div>
        <div>
          <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">القسم (نقل إلى قسم آخر)</label>
          <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
        </div>
        <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> سيتم تحديث تاريخ الحصة وقسمها في قاعدة البيانات أيضاً.
        </p>
      </div>
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer">
          إلغاء
        </button>
        <button onClick={() => onConfirm(date, start, end, className)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-1.5">
          <ArrowLeftRight className="w-4 h-4" /> تأكيد النقل
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Repeat lesson modal
// ---------------------------------------------------------------------------
function RepeatLessonModal({ lesson, onClose, onConfirm }: { lesson: Lesson; onClose: () => void; onConfirm: (dates: string[]) => void }) {
  const [count, setCount] = useState(3);
  const dates = useMemo(() => {
    const result: string[] = [];
    let cursor = addDays(lesson.date, 1);
    let guard = 0;
    while (result.length < count && guard < 400) {
      if (isSchoolDay(cursor)) result.push(cursor);
      cursor = addDays(cursor, 1);
      guard++;
    }
    return result;
  }, [lesson.date, count]);

  return (
    <Modal onClose={onClose} title="تكرار الحصة" icon={<Repeat className="w-5 h-5 text-teal-600" />}>
      <p className="text-[12px] text-slate-500 mb-3">سيتم تكرار الحصة على تواريخ أيام الدراسة التالية:</p>
      <div className="flex items-center justify-between mb-3">
        <label className="text-[13px] font-bold text-slate-700">عدد المرات</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 font-black cursor-pointer">-</button>
          <span className="font-black text-lg w-10 text-center">{count}</span>
          <button onClick={() => setCount((c) => Math.min(10, c + 1))} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 font-black cursor-pointer">+</button>
        </div>
      </div>
      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
        {dates.map((d) => (
          <div key={d} className="px-3 py-2 rounded-lg bg-teal-50 border border-teal-100 text-[12px] font-bold text-teal-800 flex items-center justify-between">
            <span>{dayNameOf(d)}</span>
            <span>{formatDateArabic(d)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer">
          إلغاء
        </button>
        <button onClick={() => onConfirm(dates)} disabled={dates.length === 0} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-1.5">
          <Repeat className="w-4 h-4" /> تأكيد التكرار
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Preview modal (all pages)
// ---------------------------------------------------------------------------
function PreviewModal({ onClose, zoom, setZoom, onExportPdf, onExportWord, onPrint }: { onClose: () => void; zoom: number; setZoom: (n: number) => void; onExportPdf: () => void; onExportWord: () => void; onPrint: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-sm flex flex-col no-print" dir="rtl" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-slate-200 rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-600" />
          <h3 className="font-black text-slate-900">معاينة الدفتر</h3>
          <span className="text-[11px] text-slate-400">— جميع الصفحات</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 rounded-md hover:bg-slate-200 cursor-pointer text-slate-700">-</button>
            <span className="text-[12px] font-bold text-slate-600 w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="p-1.5 rounded-md hover:bg-slate-200 cursor-pointer text-slate-700">+</button>
          </div>
          <button onClick={onPrint} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold flex items-center gap-1"><Printer className="w-4 h-4" /> طباعة</button>
          <button onClick={onExportPdf} className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[12px] font-bold flex items-center gap-1"><FileDown className="w-4 h-4" /> PDF</button>
          <button onClick={onExportWord} className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-bold flex items-center gap-1"><FileText className="w-4 h-4" /> Word</button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-800 p-6 flex justify-center" onClick={(e) => e.stopPropagation()}>
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', width: 820, background: 'white', minHeight: 600 }} className="rounded shadow-2xl">
          <div className="p-8 text-center">
            <div className="text-3xl mb-3">📘</div>
            <h2 className="text-2xl font-black text-slate-900">الدفتر اليومي</h2>
            <p className="text-[13px] text-slate-500 mt-2">معاينة جميع صفحات الدفتر قبل التصدير</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared modal wrapper
// ---------------------------------------------------------------------------
function Modal({ children, onClose, title, icon }: { children: React.ReactNode; onClose: () => void; title: string; icon: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print" dir="rtl" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">{icon}</div>
            <h3 className="font-black text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section panel (content for each sidebar section)
// ---------------------------------------------------------------------------
function SectionPanel(props: {
  section: SidebarSection;
  onClose: () => void;
  store: ReturnType<typeof useLogbookStore>;
  level: LogbookLevel;
  selectedLesson: Lesson | null;
  setSelectedLessonId: (id: string | null) => void;
  showToast: (m: string) => void;
  flash: (label: string, undo: () => void) => void;
  onEdit: (l: Lesson) => void;
  onAdd: () => void;
  onGenerate: (p: 'day' | 'week' | 'month') => void;
  onExportPdf: () => void;
  onExportWord: () => void;
  onPrint: () => void;
  onOpenPreview: () => void;
}) {
  const { section, onClose, store, level, selectedLesson } = props;
  if (section === 'lessons') {
    return (
      <FloatingPanel title="🕐 حصص اليوم" onClose={onClose}>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {store.visibleLessons.length === 0 ? (
            <p className="text-[13px] text-slate-500 text-center py-6">لا توجد حصص في الفترة الحالية.</p>
          ) : (
            store.visibleLessons.map((l) => (
              <button
                key={l.id}
                onClick={() => props.setSelectedLessonId(l.id)}
                className={`w-full text-right px-3 py-2.5 rounded-xl border flex items-center gap-2 transition ${
                  selectedLesson?.id === l.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-black text-slate-800 truncate">{l.activity || l.className || 'حصة'}</div>
                  <div className="text-[11px] text-slate-500">{formatDateArabic(l.date)} · {l.startTime}</div>
                </div>
                {l.status === 'cancelled' && <span className="text-[10px] text-red-600 font-bold">ملغاة</span>}
                {l.status === 'completed' && <span className="text-[10px] text-green-600 font-bold">مكتملة</span>}
              </button>
            ))
          )}
        </div>
        <button onClick={props.onAdd} className="w-full mt-4 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold flex items-center justify-center gap-1.5">
          <Plus className="w-4 h-4" /> إضافة حصة
        </button>
      </FloatingPanel>
    );
  }
  if (section === 'content') {
    const units = getCurriculumUnits(level);
    return (
      <FloatingPanel title="📚 المحتوى التعليمي" onClose={onClose}>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {['التدرج السنوي', 'المخطط', 'المذكرات', 'الأنشطة', 'التجارب', 'الموارد التعليمية'].map((t) => (
            <div key={t} className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-700 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-teal-500" /> {t}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="text-[12px] font-bold text-slate-700 mb-2">وحدات المستوى المتاح للربط</div>
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            {units.map((u) => (
              <button
                key={u.id}
                onClick={() => props.onAdd()}
                className="w-full text-right px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-teal-400 text-[12px] text-slate-700 cursor-pointer"
              >
                <div className="font-black text-slate-800">{u.ta3alom}</div>
                <div className="text-[11px] text-slate-500">{u.mawrid} · {u.midan}</div>
              </button>
            ))}
          </div>
        </div>
      </FloatingPanel>
    );
  }
  if (section === 'edit') {
    return (
      <FloatingPanel title="✏️ تحرير الدفتر" onClose={onClose}>
        {selectedLesson ? (
          <div className="space-y-2">
            <p className="text-[12px] text-slate-500">الحصة المحددة للتعديل:</p>
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-[13px]">
              <div className="font-black text-teal-800">{selectedLesson.activity || selectedLesson.className}</div>
              <div className="text-[11px] text-teal-600">{formatDateArabic(selectedLesson.date)} · {selectedLesson.startTime}</div>
            </div>
            <button onClick={() => props.onEdit(selectedLesson)} className="w-full px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold flex items-center justify-center gap-1.5">
              <Pencil className="w-4 h-4" /> تعديل محتوى الحصة
            </button>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500 text-center py-6">حدد حصة من دفتر اليوم لتعديل محتواها.</p>
        )}
      </FloatingPanel>
    );
  }
  if (section === 'search') {
    return <SearchSection store={store} />;
  }
  if (section === 'log') {
    return <LogSection logs={store.logs} />;
  }
  return (
    <FloatingPanel title="🖨️ المعاينة والتصدير" onClose={onClose}>
      <div className="space-y-2">
        <button onClick={props.onOpenPreview} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-[13px] font-bold text-slate-700 cursor-pointer transition">
          <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-teal-600" /> معاينة الدفتر</span>
          <span className="text-[11px] text-slate-400">جميع الصفحات</span>
        </button>
        <button onClick={props.onExportPdf} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-[13px] font-bold text-rose-700 cursor-pointer transition">
          <span className="flex items-center gap-2"><FileDown className="w-4 h-4" /> تصدير PDF</span>
        </button>
        <button onClick={props.onExportWord} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-[13px] font-bold text-blue-700 cursor-pointer transition">
          <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> تصدير Word</span>
        </button>
        <button onClick={props.onPrint} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[13px] font-bold text-slate-700 cursor-pointer transition">
          <span className="flex items-center gap-2"><Printer className="w-4 h-4 text-teal-600" /> طباعة</span>
        </button>
      </div>
      <div className="mt-3 text-[11px] text-slate-400 text-center">التصدير يشمل جميع الصفحات، وليس الصفحة الأولى فقط.</div>
    </FloatingPanel>
  );
}

// ---------------------------------------------------------------------------
// Floating panel
// ---------------------------------------------------------------------------
function FloatingPanel({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/30 pointer-events-none no-print" dir="rtl">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto w-[min(92vw,380px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline section title (للأقسام المعروض داخل الشريط)
// ---------------------------------------------------------------------------
function InlineSectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-2 pb-1.5">
      <span className="text-teal-600">{icon}</span>
      <h3 className="text-[13px] font-black text-slate-800">{title}</h3>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date — معروض مباشرة داخل الشريط الجانبي
// ---------------------------------------------------------------------------
function DateInline({ selectedDate, setSelectedDate, period, setPeriod }: { selectedDate: string; setSelectedDate: (d: string) => void; period: 'day' | 'week' | 'month'; setPeriod: (p: 'day' | 'week' | 'month') => void }) {
  const [viewDate, setViewDate] = useState(selectedDate);
  const year = new Date(`${startOfMonth(viewDate)}T12:00:00`).getFullYear();
  const month = new Date(`${startOfMonth(viewDate)}T12:00:00`).getMonth();

  const cells: (string | null)[] = [];
  const startOffset = new Date(year, month, 1).getDay();
  for (let i = 0; i < startOffset; i++) cells.push(null);
  let d = 1;
  while (d <= new Date(year, month + 1, 0).getDate()) {
    cells.push(formatDateToIsoString(new Date(year, month, d)));
    d++;
  }

  return (
    <div className="px-1 space-y-2.5">
      {/* Period selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {(['day', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-1 py-1.5 rounded-lg text-[11px] font-bold transition ${period === p ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/40">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setViewDate(formatDateToIsoString(new Date(year, month - 1, 1)))} className="w-6 h-6 rounded-md hover:bg-slate-200 cursor-pointer text-slate-600 font-bold">‹</button>
          <span className="font-black text-slate-800 text-[12px]">{ARABIC_MONTH_NAMES[month]} {year}</span>
          <button onClick={() => setViewDate(formatDateToIsoString(new Date(year, month + 1, 1)))} className="w-6 h-6 rounded-md hover:bg-slate-200 cursor-pointer text-slate-600 font-bold">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {ARABIC_WEEK_DAYS.slice(0, 5).map((day) => (
            <div key={day} className="text-[9px] font-bold text-slate-400 py-0.5">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const isSelected = iso === selectedDate;
            const isSchool = isSchoolDay(iso);
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(iso)}
                className={`aspect-square rounded-md text-[11px] font-bold transition flex items-center justify-center ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                    : isSchool
                    ? 'bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                    : 'bg-slate-50 text-slate-300'
                }`}
              >
                {iso.split('-')[2]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date */}
      <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100 text-[11px] text-teal-700">
        ✅ تم اختيار: <strong>{formatDateArabic(selectedDate)}</strong> ({dayNameOf(selectedDate)})
        <br />هذا التاريخ هو المرجع الوحيد لمحتوى الدفتر.
      </div>
      <div className="flex justify-between gap-1.5">
        <button onClick={() => setSelectedDate(todayIso())} className="flex-1 px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200">اليوم</button>
        <button onClick={() => setSelectedDate(startOfWeek(selectedDate))} className="flex-1 px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200">بداية الأسبوع</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generation — معروض مباشرة داخل الشريط الجانبي
// ---------------------------------------------------------------------------
function GenerateInline({ onGenerate, period }: { onGenerate: (p: 'day' | 'week' | 'month') => void; period: 'day' | 'week' | 'month' }) {
  return (
    <div className="px-1 space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {(['day', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => onGenerate(p)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition border ${
              p === period
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/30'
                : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black leading-tight">توليد<br />{PERIOD_LABELS[p]}</span>
          </button>
        ))}
      </div>
      <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100 text-[10px] text-teal-700 leading-relaxed">
        💡 التوليد يعتمد حصرياً على التاريخ المحدد، ويبدأ من الأسبوع / الشهر الذي يحتوي عليه.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search section
// ---------------------------------------------------------------------------
function SearchSection({ store }: { store: ReturnType<typeof useLogbookStore> }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return store.lessons.filter((l) =>
      [l.date, l.className, l.level, l.activity, l.unit, l.notes, l.competency, l.flow, l.memoTitle || '']
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(query))
    );
  }, [q, store.lessons]);

  return (
    <FloatingPanel title="🔎 البحث" onClose={() => {}}>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث: التغذية عند الإنسان"
          className="w-full pl-3 pr-9 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
        />
      </div>
      <div className="space-y-1.5 max-h-[44vh] overflow-y-auto">
        {q.trim() === '' ? (
          <p className="text-[12px] text-slate-400 text-center py-4">اكتب للبحث داخل التاريخ، القسم، المستوى، عنوان الحصة، الوحدة، الملاحظات.</p>
        ) : results.length === 0 ? (
          <p className="text-[12px] text-slate-400 text-center py-4">لا توجد نتائج مطابقة.</p>
        ) : (
          results.map((l) => (
            <button
              key={l.id}
              onClick={() => { store.setSelectedDate(l.date); }}
              className="w-full text-right px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-teal-400 text-[12px] cursor-pointer"
            >
              <div className="font-black text-slate-800">{l.activity || l.className}</div>
              <div className="text-[11px] text-slate-500">{formatDateArabic(l.date)} · {l.unit}</div>
            </button>
          ))
        )}
      </div>
    </FloatingPanel>
  );
}

// ---------------------------------------------------------------------------
// Log section
// ---------------------------------------------------------------------------
function LogSection({ logs }: { logs: ReturnType<typeof useLogbookStore>['logs'] }) {
  const sorted = useMemo(() => [...logs].sort((a, b) => b.at.localeCompare(a.at)), [logs]);
  return (
    <FloatingPanel title="🕘 سجل الدفتر" onClose={() => {}}>
      <div className="space-y-2 max-h-[56vh] overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-[12px] text-slate-400 text-center py-6">لا توجد سجلات بعد.</p>
        ) : (
          sorted.slice(0, 60).map((e) => (
            <div key={e.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-black shrink-0">
                {e.action === 'cancelled' ? 'م' : e.action === 'restored' ? 'س' : e.action === 'created' ? 'ج' : 'م'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-slate-800 truncate">{e.label}</div>
                <div className="text-[10px] text-slate-400">{new Date(e.at).toLocaleString('ar-DZ')}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </FloatingPanel>
  );
}
