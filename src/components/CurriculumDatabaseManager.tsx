import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2, Download, Search, Edit3, X, Database, Sparkles } from 'lucide-react';
import { LessonMemo, Activity } from '../types';

const normalizeKey = (v: string) => v.trim().replace(/\s+/g, ' ').toLowerCase();
const lessonKey = (l: LessonMemo) => l.sourceLearningUnitId || [l.level, l.maqta, l.mawrid, l.ta3alom].map(normalizeKey).join('|');
import { saveCurriculumDatabase, exportCurriculumDatabase } from '../data/curriculumDb';

interface Props {
  lessons: LessonMemo[];
  setLessons: React.Dispatch<React.SetStateAction<LessonMemo[]>>;
  showToast: (msg: string) => void;
}

const LABELS: Record<LessonMemo['level'], string> = {
  '1am': 'السنة الأولى متوسط', '2am': 'السنة الثانية متوسط',
  '3am': 'السنة الثالثة متوسط', '4am': 'السنة الرابعة متوسط'
};

const newActivity = (): Activity => ({
  title: 'نشاط جديد', asila: '', ajwiba: '', zaman: '', mola7adha: '', diagrams: [], tables: []
});

const newLesson = (level: LessonMemo['level']): LessonMemo => ({
  sourceLearningUnitId: 'custom_' + level + '_' + Date.now(),
  sourceOfficial: false, level, midan: '', maqta: '', mawrid: '', ta3alom: '',
  markaba: '', marifa: '', manhaji: '', mostalahat: '', wasail: '', wadiya: '',
  moshkila: '', faradiyat: '', anshita: [newActivity()], irsae: '', taqwim: '', memoNumber: ''
});

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

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
      <span className="block text-[11px] font-bold text-gray-600 mb-1">{label}</span>
      <textarea value={String(editing?.[key] ?? '')}
        onChange={e => editing && setEditing({ ...editing, [key]: e.target.value } as LessonMemo)}
        className="w-full min-h-10 border rounded-lg p-2 text-xs resize-y focus:border-emerald-600 outline-none" />
    </label>
  );

  return (
    <main className="flex-1 p-4 md:p-7 bg-slate-50 overflow-y-auto" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border p-5 mb-5">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2"><Database className="w-5 h-5 text-emerald-700" /><h1 className="text-xl font-black">إدارة قاعدة البيانات التعليمية</h1></div>
            <div className="flex items-center gap-2">
              <button onClick={handleNewDatabase} className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>قاعدة بيانات جديدة</span>
              </button>
              <button onClick={exportDb} className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                <span>تصدير</span>
              </button>
            </div>
          </div>
          <div className="mt-3 grid sm:grid-cols-4 gap-2 text-[10px] font-bold">
            <div className="rounded-xl bg-slate-50 border p-2">السجلات: <b>{lessons.length}</b></div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2">مضاف/معدل: <b>{diagnostics.custom}</b></div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-2">تكرارات محتملة: <b>{diagnostics.duplicates}</b></div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-2">بدون نشاط: <b>{diagnostics.emptyActivities}</b></div>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>يمكنك إنشاء قاعدة بيانات جديدة أو إضافة وحفظ السجلات وتصديرها بصيغة JSON بكل سهولة.</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-5">
          <section className="bg-white rounded-2xl border overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <div className="grid grid-cols-4 gap-1 mb-3">
                {(['1am','2am','3am','4am'] as LessonMemo['level'][]).map(l =>
                  <button key={l} onClick={() => { setLevel(l); setEditing(null); setSelectedKey(''); }}
                    className={'py-2 rounded-lg text-[11px] font-black ' + (level === l ? 'bg-emerald-700 text-white' : 'bg-white border')}>{l.toUpperCase()}</button>
                )}
              </div>
              <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث في السجلات والأنشطة..."
                  className="w-full border rounded-xl py-2.5 pr-9 pl-3 text-xs" /></div>
            </div>
            <div className="max-h-[650px] overflow-y-auto p-2">
              {list.map(l => {
                const key = lessonKey(l);
                return <div key={key} className={'p-3 rounded-xl mb-1 border ' + (selectedKey === key ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:bg-gray-50')}>
                  <button className="w-full text-right" onClick={() => open(l)}>
                    <div className="text-[10px] text-gray-400">مذكرة {l.memoNumber || '—'} • {l.maqta || 'بدون مقطع'}</div>
                    <div className="text-[12px] font-black">{l.ta3alom || 'تعلم مورد بدون عنوان'}</div>
                    <div className="text-[10px] text-gray-500">{l.anshita.length} نشاط • {l.sourceOfficial ? 'مصدر رسمي' : 'مضاف/معدل'}</div>
                  </button>
                  <button onClick={() => remove(l)} className="mt-1 p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>;
              })}
            </div>
            <div className="p-3 border-t"><button onClick={add} className="w-full py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-black"><Plus className="w-4 h-4 inline" /> إضافة تعلم مورد</button></div>
          </section>

          <section className="bg-white rounded-2xl border p-5">
            {!editing ? <div className="min-h-[500px] flex flex-col items-center justify-center text-gray-400"><Edit3 className="w-10 h-10 mb-3" /><p className="font-bold">اختر سجلًا لتعديله</p><p className="text-xs">يمكن تعديل الحقول والأنشطة وإضافة أو حذف الأنشطة.</p></div> :
            <div>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div><h2 className="font-black">تعديل قاعدة البيانات</h2><p className="text-[10px] text-gray-500">{LABELS[editing.level]} • {editing.sourceOfficial ? 'مرتبط بالمصدر الرسمي' : 'سجل عمل'}</p></div>
                <div className="flex gap-2"><button onClick={() => setEditing(null)} className="px-3 py-2 rounded-xl border text-xs"><X className="w-4 h-4 inline" /> إلغاء</button><button onClick={save} className="px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black"><Save className="w-4 h-4 inline" /> حفظ</button></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {field('midan','الميدان')}{field('maqta','المقطع التعلمي')}{field('mawrid','المورد التعلمي')}{field('ta3alom','تعلم مورد')}
                {field('markaba','المركبة')}{field('marifa','المعرفة')}{field('manhaji','المنهجية')}{field('mostalahat','المصطلحات')}
                {field('wasail','الوسائل')}{field('wadiya','الوضعية')}{field('moshkila','المشكلة')}{field('faradiyat','الفرضيات')}
                {field('irsae','إرساء الموارد')}{field('taqwim','التقويم')}
              </div>
              <div className="mt-6 border-t pt-5">
                <div className="flex justify-between items-center mb-3"><h3 className="font-black">الأنشطة ({editing.anshita.length})</h3>
                  <button onClick={() => setEditing({ ...editing, anshita: [...editing.anshita, newActivity()] })} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"><Plus className="w-3.5 h-3.5 inline" /> إضافة نشاط</button>
                </div>
                <div className="space-y-4">
                  {editing.anshita.map((a, i) => <div key={i} className="rounded-xl border p-4 bg-gray-50">
                    <div className="flex justify-between mb-3"><span className="text-xs font-black">النشاط {i + 1}</span>
                      <button onClick={() => setEditing({ ...editing, anshita: editing.anshita.filter((_, j) => j !== i) })} className="text-red-600 text-[10px]"><Trash2 className="w-3 h-3 inline" /> حذف النشاط</button>
                    </div>
                    <label className="block mb-3"><span className="text-[11px] font-bold">عنوان النشاط</span><input value={a.title} onChange={e => { const x=[...editing.anshita]; x[i]={...a,title:e.target.value}; setEditing({...editing,anshita:x}); }} className="w-full border rounded-lg p-2 text-xs mt-1" /></label>
                    <div className="grid md:grid-cols-2 gap-3">
                      <label><span className="text-[11px] font-bold">نشاط الأستاذ / الأسئلة</span><textarea value={a.asila} onChange={e=>{const x=[...editing.anshita];x[i]={...a,asila:e.target.value};setEditing({...editing,anshita:x});}} className="w-full min-h-28 border rounded-lg p-2 text-xs mt-1" /></label>
                      <label><span className="text-[11px] font-bold">نشاط المتعلم / الأجوبة</span><textarea value={a.ajwiba} onChange={e=>{const x=[...editing.anshita];x[i]={...a,ajwiba:e.target.value};setEditing({...editing,anshita:x});}} className="w-full min-h-28 border rounded-lg p-2 text-xs mt-1" /></label>
                      <label><span className="text-[11px] font-bold">المدة</span><input value={a.zaman || ''} onChange={e=>{const x=[...editing.anshita];x[i]={...a,zaman:e.target.value};setEditing({...editing,anshita:x});}} className="w-full border rounded-lg p-2 text-xs mt-1" /></label>
                      <label><span className="text-[11px] font-bold">ملاحظات</span><textarea value={a.mola7adha || ''} onChange={e=>{const x=[...editing.anshita];x[i]={...a,mola7adha:e.target.value};setEditing({...editing,anshita:x});}} className="w-full border rounded-lg p-2 text-xs mt-1" /></label>
                    </div>
                  </div>)}
                </div>
              </div>
            </div>}
          </section>
        </div>
      </div>
    </main>
  );
};
