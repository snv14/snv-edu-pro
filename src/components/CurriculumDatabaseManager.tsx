import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2, Download, Search, Edit3, X, Database, Layers, Sparkles, AlertTriangle, ListChecks } from 'lucide-react';
import { LessonMemo, Activity } from '../types';
import { saveCurriculumDatabase, exportCurriculumDatabase } from '../data/memos/curriculumDb';

const normalizeKey = (v: string) => v.trim().replace(/\s+/g, ' ').toLowerCase();
const lessonKey = (l: LessonMemo) => l.sourceLearningUnitId || [l.level, l.maqta, l.mawrid, l.ta3alom].map(normalizeKey).join('|');

interface Props {
  lessons: LessonMemo[];
  setLessons: React.Dispatch<React.SetStateAction<LessonMemo[]>>;
  showToast: (msg: string) => void;
}

const LABELS: Record<LessonMemo['level'], string> = {
  '1am': 'السنة الأولى متوسط', '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط', '4am': 'السنة الرابعة متوسط'
};

/** معرّف فريد: كان Date.now() وحده ينتج معرّفات متطابقة لسجلات تُنشأ في نفس اللحظة. */
const uniqueId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const newActivity = (): Activity => ({
  title: 'نشاط جديد', asila: '', ajwiba: '', zaman: '', mola7adha: '', diagrams: [], tables: []
});

const newLesson = (level: LessonMemo['level']): LessonMemo => ({
  sourceLearningUnitId: uniqueId('custom_' + level),
  sourceOfficial: false, level, midan: '', maqta: '', mawrid: '', ta3alom: '',
  markaba: '', marifa: '', manhaji: '', mostalahat: '', wasail: '', wadiya: '',
  moshkila: '', faradiyat: '', anshita: [newActivity()], irsae: '', taqwim: '', memoNumber: ''
});

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const inputClass =
  'w-full rounded-xl border border-[#e2e8e5] bg-white px-3 py-2 text-[12px] font-medium text-[#0b1f1c] outline-none transition focus:border-[#0e7a68] focus:ring-2 focus:ring-[#0e7a68]/15';

export const CurriculumDatabaseManager: React.FC<Props> = ({ lessons, setLessons, showToast }) => {
  const [level, setLevel] = useState<LessonMemo['level']>('1am');
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [editing, setEditing] = useState<LessonMemo | null>(null);

  const diagnostics = useMemo(() => {
    const counts = new Map<string, number>();
    lessons.forEach(l => counts.set(lessonKey(l), (counts.get(lessonKey(l)) || 0) + 1));
    return {
      duplicates: Array.from(counts.values()).filter(n => n > 1).length,
      emptyActivities: lessons.filter(l => l.anshita.length === 0).length,
      custom: lessons.filter(l => !l.sourceOfficial).length,
    };
  }, [lessons]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter(l => l.level === level && (!q ||
      [l.midan, l.maqta, l.mawrid, l.ta3alom, ...l.anshita.map(a => a.title)].join(' ').toLowerCase().includes(q)));
  }, [lessons, level, query]);

  const persist = (next: LessonMemo[]) => {
    setLessons(next);
    saveCurriculumDatabase(next);
    window.dispatchEvent(new CustomEvent('curriculum-db-updated'));
  };

  const open = (lesson: LessonMemo) => {
    setSelectedKey(lessonKey(lesson));
    setEditing(clone(lesson));
  };

  const save = () => {
    if (!editing || !editing.ta3alom.trim()) {
      showToast('أدخل عنوان تعلم المورد قبل الحفظ');
      return;
    }
    const key = lessonKey(editing);
    const index = lessons.findIndex(l => lessonKey(l) === key);
    const next = [...lessons];
    if (index >= 0) next[index] = editing; else next.push(editing);
    persist(next);
    setEditing(null);
    showToast('تم حفظ التعديل في قاعدة العمل');
  };

  const add = () => {
    const l = newLesson(level);
    l.memoNumber = String(lessons.filter(x => x.level === level).length + 1).padStart(2, '0');
    persist([...lessons, l]);
    open(l);
    showToast('تمت إضافة سجل جديد');
  };

  const remove = (lesson: LessonMemo) => {
    if (!window.confirm('حذف «' + (lesson.ta3alom || lesson.mawrid || 'السجل') + '» من قاعدة العمل؟')) return;
    persist(lessons.filter(x => x !== lesson));
    setEditing(null);
    setSelectedKey('');
    showToast('تم الحذف');
  };

  const handleNewDatabase = () => {
    if (!window.confirm('هل تريد إنشاء قاعدة بيانات جديدة؟ يمكنك إضافة سجلاتك وتعديلها بحرية.')) return;
    const initialBlank: LessonMemo[] = [
      newLesson('1am'),
      newLesson('2am'),
      newLesson('3am'),
      newLesson('4am')
    ];
    persist(initialBlank);
    setEditing(null);
    setSelectedKey('');
    showToast('تم إنشاء وتفعيل قاعدة بيانات جديدة بنجاح ✨');
  };

  const exportDb = () => {
    const url = URL.createObjectURL(new Blob([exportCurriculumDatabase(lessons)], { type: 'application/json;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'قاعدة_بيانات_المنصة.json'; a.click(); URL.revokeObjectURL(url);
  };

  const field = (key: keyof LessonMemo, label: string) => (
    <label className="block" key={String(key)}>
      <span className="mb-1 block text-[11px] font-bold text-[#5c6f6a]">{label}</span>
      <textarea
        value={String(editing?.[key] ?? '')}
        onChange={e => editing && setEditing({ ...editing, [key]: e.target.value } as LessonMemo)}
        className={`${inputClass} min-h-16 resize-y leading-relaxed`}
      />
    </label>
  );

  const stats = [
    { id: 'records', label: 'السجلات', value: lessons.length, icon: Database, tint: '#eef5f2', ink: '#0a5f51' },
    { id: 'custom', label: 'مضاف / معدّل', value: diagnostics.custom, icon: Sparkles, tint: '#f7f2e2', ink: '#8a6a14' },
    { id: 'dupes', label: 'تكرارات محتملة', value: diagnostics.duplicates, icon: AlertTriangle, tint: '#fbeeee', ink: '#a33b3b' },
    { id: 'empty', label: 'بدون نشاط', value: diagnostics.emptyActivities, icon: ListChecks, tint: '#eef2f5', ink: '#3f5a6b' },
  ];

  return (
    <main className="flex-1 overflow-y-auto overflow-x-clip p-3.5 sm:p-5" dir="rtl">
      <div className="mx-auto max-w-[1400px] space-y-4">

        {/* ترويسة القسم */}
        <section className="snv-service-panel !p-4 sm:!p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="snv-icon-tile !h-10 !w-10">
                <Database className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <span className="snv-kicker">قاعدة العمل</span>
                <h1 className="text-base font-extrabold text-[#0b1f1c] sm:text-lg">
                  إدارة قاعدة البيانات والموارد التعليمية
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleNewDatabase}
                className="snv-btn !bg-[#0e7a68] !px-3.5 !py-2 !text-[11.5px] !text-white hover:!brightness-110"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>قاعدة بيانات جديدة</span>
              </button>
              <button
                type="button"
                onClick={exportDb}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#e2e8e5] bg-white px-3.5 py-2 text-[11.5px] font-bold text-[#334842] transition hover:border-[#0e7a68]/35 hover:text-[#0a5f51]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>تصدير JSON</span>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map(({ id, label, value, icon: Icon, tint, ink }) => (
              <div
                key={id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#e2e8e5] px-3 py-2.5"
                style={{ backgroundColor: tint }}
              >
                <div>
                  <div className="text-[10.5px] font-bold" style={{ color: ink }}>{label}</div>
                  <div className="text-lg font-extrabold tabular-nums text-[#0b1f1c]">{value}</div>
                </div>
                <Icon className="h-4 w-4 opacity-50" style={{ color: ink }} aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* قائمة السجلات */}
          <section className="snv-service-panel !gap-0 overflow-hidden !p-0">
            <div className="space-y-2.5 border-b border-[#eef2f0] p-3">
              <div className="grid grid-cols-4 gap-1 rounded-xl border border-[#e2e8e5] bg-[#f4f7f6] p-1">
                {(['1am', '2am', '3am', '4am'] as LessonMemo['level'][]).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => { setLevel(l); setEditing(null); setSelectedKey(''); }}
                    className={`cursor-pointer rounded-lg py-1.5 text-[11px] font-extrabold tabular-nums transition ${
                      level === l ? 'bg-[#0e7a68] text-white shadow-sm' : 'text-[#5c6f6a] hover:bg-white'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-[#9db3ad]" aria-hidden="true" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="بحث في السجلات والأنشطة..."
                  className={`${inputClass} !py-2.5 pr-9`}
                />
              </div>

              <div className="flex items-center justify-between px-1 text-[10.5px] font-bold text-[#7b8d88]">
                <span>{LABELS[level]}</span>
                <span className="tabular-nums">{list.length} سجل</span>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto p-2">
              {list.length === 0 ? (
                <div className="px-4 py-10 text-center text-[11.5px] font-bold text-[#8fa39d]">
                  لا توجد سجلات مطابقة في هذه السنة.
                </div>
              ) : list.map(l => {
                const key = lessonKey(l);
                const isActive = selectedKey === key;
                return (
                  <div
                    key={key}
                    className={`mb-1 flex items-start gap-1 rounded-xl border px-2 py-2 transition ${
                      isActive ? 'border-[#0e7a68]/40 bg-[#eef5f2]' : 'border-transparent hover:bg-[#f6faf8]'
                    }`}
                  >
                    <button type="button" className="w-full cursor-pointer text-right" onClick={() => open(l)}>
                      <div className="text-[10px] text-[#9db3ad] tabular-nums">
                        مذكرة {l.memoNumber || '—'} • {l.maqta || 'بدون مقطع'}
                      </div>
                      <div className="mt-0.5 text-[12px] font-extrabold text-[#0b1f1c]">
                        {l.ta3alom || 'تعلم مورد بدون عنوان'}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#7b8d88]">
                        {l.anshita.length} نشاط • {l.sourceOfficial ? 'مصدر رسمي' : 'مضاف/معدل'}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(l)}
                      aria-label="حذف السجل"
                      title="حذف السجل"
                      className="cursor-pointer rounded-lg p-1.5 text-[#b4576a] transition hover:bg-[#fbeeee]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#eef2f0] p-2.5">
              <button
                type="button"
                onClick={add}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0e7a68] py-2.5 text-[11.5px] font-extrabold text-white transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                إضافة تعلم مورد
              </button>
            </div>
          </section>

          {/* محرر السجل */}
          <section className="snv-service-panel !p-4 sm:!p-5">
            {!editing ? (
              <div className="flex min-h-[460px] flex-col items-center justify-center text-center text-[#9db3ad]">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-[#eef5f2] text-[#0e7a68]">
                  <Edit3 className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="text-[13px] font-extrabold text-[#334842]">اختر سجلًا لتعديله</p>
                <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed">
                  يمكن تعديل الحقول والأنشطة وإضافة أو حذف الأنشطة، ثم الحفظ في قاعدة العمل.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-[#eef2f0] pb-3">
                  <div className="flex items-start gap-2.5">
                    <span className="snv-icon-tile !h-9 !w-9">
                      <Layers className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-[13.5px] font-extrabold text-[#0b1f1c]">تعديل قاعدة البيانات</h2>
                      <p className="text-[10.5px] text-[#7b8d88]">
                        {LABELS[editing.level]} • {editing.sourceOfficial ? 'مرتبط بالمصدر الرسمي' : 'سجل عمل'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#e2e8e5] bg-white px-3 py-2 text-[11.5px] font-bold text-[#5c6f6a] transition hover:bg-[#f6faf8]"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-[#0e7a68] px-3.5 py-2 text-[11.5px] font-extrabold text-white transition hover:brightness-110"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      حفظ
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {field('midan', 'الميدان')}{field('maqta', 'المقطع التعلمي')}{field('mawrid', 'المورد التعلمي')}{field('ta3alom', 'تعلم مورد')}
                  {field('markaba', 'المركبة')}{field('marifa', 'المعرفة')}{field('manhaji', 'المنهجية')}{field('mostalahat', 'المصطلحات')}
                  {field('wasail', 'الوسائل')}{field('wadiya', 'الوضعية')}{field('moshkila', 'المشكلة')}{field('faradiyat', 'الفرضيات')}
                  {field('irsae', 'إرساء الموارد')}{field('taqwim', 'التقويم')}
                </div>

                <div className="mt-5 border-t border-[#eef2f0] pt-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[12.5px] font-extrabold text-[#0b1f1c]">
                      الأنشطة <span className="tabular-nums text-[#7b8d88]">({editing.anshita.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, anshita: [...editing.anshita, newActivity()] })}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#cfe3dc] bg-[#eef5f2] px-3 py-1.5 text-[11px] font-extrabold text-[#0a5f51] transition hover:bg-[#e3efe9]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      إضافة نشاط
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editing.anshita.map((a, i) => (
                      <div key={i} className="rounded-xl border border-[#e2e8e5] bg-[#f9fbfa] p-3.5">
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <span className="rounded-md bg-white px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums text-[#334842] border border-[#e2e8e5]">
                            النشاط {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditing({ ...editing, anshita: editing.anshita.filter((_, j) => j !== i) })}
                            className="inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-bold text-[#b4576a] transition hover:text-[#8f3348]"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            حذف النشاط
                          </button>
                        </div>

                        <label className="mb-3 block">
                          <span className="mb-1 block text-[11px] font-bold text-[#5c6f6a]">عنوان النشاط</span>
                          <input
                            value={a.title}
                            onChange={e => { const x = [...editing.anshita]; x[i] = { ...a, title: e.target.value }; setEditing({ ...editing, anshita: x }); }}
                            className={inputClass}
                          />
                        </label>

                        <div className="grid gap-3 md:grid-cols-2">
                          <label>
                            <span className="mb-1 block text-[11px] font-bold text-[#5c6f6a]">نشاط الأستاذ / الأسئلة</span>
                            <textarea
                              value={a.asila}
                              onChange={e => { const x = [...editing.anshita]; x[i] = { ...a, asila: e.target.value }; setEditing({ ...editing, anshita: x }); }}
                              className={`${inputClass} min-h-28 resize-y leading-relaxed`}
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-[11px] font-bold text-[#5c6f6a]">نشاط المتعلم / الأجوبة</span>
                            <textarea
                              value={a.ajwiba}
                              onChange={e => { const x = [...editing.anshita]; x[i] = { ...a, ajwiba: e.target.value }; setEditing({ ...editing, anshita: x }); }}
                              className={`${inputClass} min-h-28 resize-y leading-relaxed`}
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-[11px] font-bold text-[#5c6f6a]">المدة</span>
                            <input
                              value={a.zaman || ''}
                              onChange={e => { const x = [...editing.anshita]; x[i] = { ...a, zaman: e.target.value }; setEditing({ ...editing, anshita: x }); }}
                              className={inputClass}
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-[11px] font-bold text-[#5c6f6a]">ملاحظات</span>
                            <textarea
                              value={a.mola7adha || ''}
                              onChange={e => { const x = [...editing.anshita]; x[i] = { ...a, mola7adha: e.target.value }; setEditing({ ...editing, anshita: x }); }}
                              className={`${inputClass} min-h-16 resize-y leading-relaxed`}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};
