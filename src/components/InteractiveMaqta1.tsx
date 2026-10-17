import React, { useState, useEffect } from 'react';
import { MAQTA_1_DATA } from '../data/interactiveMaqta1Data';
import { BookOpen, Target, Image as ImageIcon, Save, CheckCircle2, FlaskConical, Beaker, FileText, ClipboardList } from 'lucide-react';

export const InteractiveMaqta1: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem('maqta1_interactive_answers');
    if (saved) {
      setAnswers(JSON.parse(saved));
    }
  }, []);

  const handleAnswerChange = (id: string, val: string) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
    setSaveStatus('saving');
  };

  useEffect(() => {
    if (saveStatus === 'saving') {
      const timer = setTimeout(() => {
        localStorage.setItem('maqta1_interactive_answers', JSON.stringify(answers));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [answers, saveStatus]);

  const renderTextarea = (id: string, placeholder: string) => (
    <textarea
      className="w-full min-h-[100px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-800 bg-gray-50 focus:bg-white"
      placeholder={placeholder}
      value={answers[id] || ''}
      onChange={(e) => handleAnswerChange(id, e.target.value)}
      dir="rtl"
    />
  );

  const renderTable = (q: any) => {
    return (
      <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-right bg-white">
          <thead className="bg-green-50">
            <tr>
              {q.headers.map((h: string, idx: number) => (
                <th key={idx} className="p-4 font-bold text-green-900 border-b border-gray-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.rows.map((row: any, rIdx: number) => (
              <tr key={rIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                {row.cols.map((colVal: string, cIdx: number) => {
                  const inputId = `${row.id}_c${cIdx}`;
                  return (
                    <td key={cIdx} className="p-2 border-l border-gray-100 last:border-0">
                      {colVal ? (
                        <span className="p-2 block font-medium text-gray-700">{colVal}</span>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                          placeholder="أدخل الإجابة هنا..."
                          value={answers[inputId] || ''}
                          onChange={(e) => handleAnswerChange(inputId, e.target.value)}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPrintable = (resource: any) => (
    <div className="my-12 bg-amber-50 rounded-2xl p-6 md:p-10 border-2 border-amber-200 shadow-md print:bg-white print:border-gray-300">
      <div className="flex items-center gap-4 mb-8 border-b-2 border-amber-200 pb-4">
        <div className="p-3 bg-amber-200 rounded-xl text-amber-800">
          <FileText size={28} />
        </div>
        <h2 className="text-2xl font-black text-amber-900">{resource.title}</h2>
      </div>
      
      <p className="text-lg leading-relaxed text-amber-900 mb-8 bg-amber-100/50 p-4 rounded-xl">
        {resource.content}
      </p>

      {resource.documents.map((doc: any, dIdx: number) => (
        <div key={dIdx} className="mb-10 bg-white rounded-xl p-6 shadow-sm border border-amber-100">
          <h3 className="text-xl font-bold text-amber-800 mb-6 flex items-center gap-2">
            <ClipboardList size={20} />
            {doc.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doc.items.map((item: any, iIdx: number) => (
              <div key={iIdx} className="bg-amber-50/50 rounded-xl p-5 border border-amber-100/50 flex flex-col gap-4">
                <p className="text-gray-800 leading-relaxed font-medium">{item.text}</p>
                <div className="mt-auto flex items-center justify-center bg-gray-100 rounded-lg h-32 border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                    <span className="text-sm font-bold">{item.image}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-12 bg-white rounded-xl p-6 md:p-8 shadow-inner border border-amber-200">
        <h3 className="text-xl font-bold text-amber-900 mb-6 border-b border-amber-100 pb-2">التعليمات وأسئلة العمل الفوجي:</h3>
        <div className="space-y-8">
          {resource.questions.map((q: any) => (
            <div key={q.id}>
              <p className="font-bold text-lg text-gray-800 mb-4">{q.text}</p>
              {renderTextarea(q.id, "اكتب إجابة الفوج هنا...")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 py-8 px-4 font-[Tajawal] relative" dir="rtl">
      {/* Floating Save Indicator */}
      <div className={`fixed top-6 left-6 px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all duration-300 z-50 ${
        saveStatus === 'saved' ? 'bg-green-100 text-green-700 shadow-md opacity-100 translate-y-0' :
        saveStatus === 'saving' ? 'bg-amber-100 text-amber-700 shadow-md opacity-100 translate-y-0' :
        'opacity-0 -translate-y-4'
      }`}>
        {saveStatus === 'saved' ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />}
        <span>{saveStatus === 'saved' ? 'تم الحفظ تلقائياً' : 'جاري الحفظ...'}</span>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <header className="bg-gradient-to-l from-green-700 to-green-600 rounded-3xl p-8 md:p-12 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-sm">{MAQTA_1_DATA.title}</h1>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-green-50 mb-4 flex items-center gap-3">
                <Target size={24} className="text-green-200" />
                {MAQTA_1_DATA.intro.title}
              </h2>
              <p className="text-lg leading-relaxed text-green-50 mb-6 whitespace-pre-wrap font-medium">
                {MAQTA_1_DATA.intro.text}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {MAQTA_1_DATA.intro.images.map((img, idx) => (
                  <div key={idx} className="bg-black/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3 border border-white/10 hover:bg-black/30 transition-colors">
                    <ImageIcon className="text-green-200 opacity-80" size={32} />
                    <span className="text-sm font-bold text-green-100">{img}</span>
                  </div>
                ))}
              </div>

              <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                <h3 className="font-bold text-green-100 mb-4 text-lg border-b border-white/10 pb-2">التعليمات الانطلاقية:</h3>
                <ul className="space-y-3">
                  {MAQTA_1_DATA.intro.instructions.map((inst, idx) => (
                    <li key={idx} className="flex gap-3 text-white font-medium">
                      <span className="text-green-300 font-black">•</span> {inst}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </header>

        {/* Resources Loop */}
        <div className="space-y-12">
          {MAQTA_1_DATA.resources.map((resource: any, rIdx: number) => (
            <div key={rIdx}>
              {resource.isPrintable ? (
                renderPrintable(resource)
              ) : (
                <section className="space-y-8">
                  <div className="flex items-center gap-4 border-b-4 border-green-200 pb-4">
                    <div className="bg-green-100 text-green-700 p-3 rounded-xl">
                      <BookOpen size={28} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-800">{resource.title}</h2>
                  </div>

                  {resource.lessons.map((lesson: any, lIdx: number) => (
                    <div key={lIdx} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
                      <h3 className="text-2xl font-bold text-green-700 mb-8">{lesson.title}</h3>
                      
                      {/* Situation */}
                      <div className="bg-blue-50/50 rounded-2xl p-6 border-r-4 border-blue-400 mb-8">
                        <p className="text-lg leading-relaxed text-gray-700 mb-6 font-medium whitespace-pre-wrap">{lesson.situation.text}</p>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                          <p className="font-black text-blue-900 text-lg flex items-center gap-2">
                            <span className="bg-blue-100 p-1.5 rounded-lg text-blue-700"><Target size={20} /></span>
                            المشكلة: {lesson.situation.problem}
                          </p>
                        </div>
                        {lesson.situation.hasHypotheses && (
                          <div className="mt-6">
                            <p className="font-bold text-gray-800 mb-3">الفرضيات:</p>
                            {renderTextarea(`hypotheses_${rIdx}_${lIdx}`, "اكتب فرضياتك هنا...")}
                          </div>
                        )}
                      </div>

                      {/* Activities */}
                      <div className="space-y-8 mb-10">
                        <h4 className="text-xl font-black text-gray-800 flex items-center gap-2 border-b-2 border-gray-100 pb-3">
                          <FlaskConical className="text-amber-500" />
                          مرحلة البحث والتقصي
                        </h4>
                        
                        {lesson.activities.map((activity: any, aIdx: number) => (
                          <div key={aIdx} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                            <h5 className="font-bold text-lg text-gray-800 mb-4">{activity.title}</h5>
                            
                            {activity.context && (
                              <p className="text-gray-700 mb-4 leading-relaxed bg-white p-4 rounded-xl border border-gray-100">{activity.context}</p>
                            )}

                            {activity.images && activity.images.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {activity.images.map((img: string, iIdx: number) => (
                                  <div key={iIdx} className="bg-gray-200 rounded-xl h-32 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                                    <ImageIcon size={32} className="mb-2 opacity-50" />
                                    <span className="font-bold text-sm">{img}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {activity.instructions && (
                              <p className="font-bold text-amber-700 mb-6 bg-amber-50 p-3 rounded-lg">{activity.instructions}</p>
                            )}

                            <div className="space-y-8">
                              {activity.questions.map((q: any) => (
                                <div key={q.id}>
                                  <p className="font-bold text-gray-800 mb-4 text-lg">{q.text}</p>
                                  {q.type === 'textarea' && renderTextarea(q.id, "إجابة النشاط...")}
                                  {q.type === 'table' && renderTable(q)}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Conclusion */}
                      <div className="bg-green-50 rounded-2xl p-6 md:p-8 border border-green-200 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                        <h4 className="text-xl font-black text-green-800 mb-4 flex items-center gap-2">
                          <CheckCircle2 /> إرساء المورد
                        </h4>
                        <p className="text-lg leading-relaxed text-gray-800 font-medium whitespace-pre-wrap">
                          {lesson.conclusion}
                        </p>
                      </div>

                      {/* Evaluation */}
                      <div className="bg-purple-50 rounded-2xl p-6 md:p-8 border border-purple-200">
                        <h4 className="text-xl font-black text-purple-800 mb-6 flex items-center gap-2">
                          <Beaker /> تقويم المورد
                        </h4>
                        <p className="text-gray-800 font-medium mb-6 bg-white p-4 rounded-xl border border-purple-100">{lesson.evaluation.text}</p>
                        
                        {lesson.evaluation.images && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {lesson.evaluation.images.map((img: string, iIdx: number) => (
                              <div key={iIdx} className="bg-white rounded-xl h-24 flex items-center justify-center border-2 border-dashed border-purple-200 text-purple-400">
                                <span className="font-bold text-sm text-center px-2">{img}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-6">
                          {lesson.evaluation.questions.map((q: any) => (
                            <div key={q.id}>
                              <p className="font-bold text-gray-800 mb-3">{q.text}</p>
                              {q.type === 'textarea' && renderTextarea(q.id, "إجابة التقويم...")}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </section>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
