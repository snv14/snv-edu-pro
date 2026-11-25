import React from 'react';
import { AssessmentExam, levelLabelOf, partOneExercises } from '../services/assessmentModel';
import { formatPoints, toNumber } from '../services/correctionMemoModel';

/**
 * ورقة الاختبار كما ستُطبع: ترويسة رسمية، تمارين وأسئلة ونقاط، ووضعية إدماجية.
 * عرض فقط؛ كل تحرير يقع في لوحة المحرر ويظهر هنا فورًا (مصدر واحد للحقيقة).
 */
export const AssessmentExamPaper: React.FC<{ exam: AssessmentExam }> = ({ exam }) => {
  const exercises = partOneExercises(exam);
  const level = exam.memo.level || levelLabelOf(exam.level);
  const isExam = exam.examType === 'اختبار';

  return (
    <div
      dir="rtl"
      className="mx-auto bg-white text-slate-900"
      style={{ width: '100%', maxWidth: '210mm', minHeight: '260mm', padding: '13mm 11mm' }}
    >
      <header className="text-center leading-relaxed">
        <p className="text-[12px] font-extrabold">الجمهورية الجزائرية الديمقراطية الشعبية</p>
        <p className="text-[11.5px]">وزارة التربية الوطنية</p>
        <p className="text-[11px] text-slate-600">{exam.memo.directorate || 'مديرية التربية للولاية'}</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
          <span className="truncate">{exam.memo.schoolName || 'المتوسطة'}</span>
          <span className="shrink-0 tabular-nums">{exam.schoolYear || exam.memo.schoolYear || 'السنة الدراسية: .....'}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-300 pt-1.5 text-[10.5px] text-slate-700">
          <span>الأستاذ(ة): {exam.memo.teacherName || '................'}</span>
          <span>المستوى: {level || '................'}</span>
          <span>المادة: علوم الطبيعة والحياة</span>
          <span>المدة: {exam.duration || exam.memo.duration || '.....'}</span>
        </div>
      </header>

      <div className="my-3 border-y-2 border-slate-900 py-2 text-center">
        <h1 className="text-[14px] font-black leading-snug">{exam.title}</h1>
        {exam.className && <p className="mt-0.5 text-[10.5px] text-slate-600">القسم: {exam.className}</p>}
      </div>

      {exam.instructions && (
        <p className="mb-2 whitespace-pre-line rounded border border-slate-300 bg-slate-50/60 px-2 py-1.5 text-[10.5px] leading-relaxed">
          <span className="font-extrabold">تعليمات: </span>{exam.instructions}
        </p>
      )}

      <div className="space-y-3">
        {exercises.map((exercise, index) => {
          const total = exercise.questions.reduce((sum, question) => sum + (toNumber(question.points) || 0), 0);
          return (
            <section key={exercise.id} className="break-inside-avoid">
              <div className="flex items-baseline justify-between gap-2 border-b border-slate-400 pb-0.5">
                <h2 className="text-[12px] font-black">
                  {exercise.label || `التمرين ${index + 1}`}
                  {(exercise.maqta || exercise.knowledge) && (
                    <span className="mr-2 text-[9.5px] font-normal text-slate-500">
                      {[exercise.maqta ? `المقطع: ${exercise.maqta}` : '', exercise.knowledge].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </h2>
                <span className="shrink-0 text-[10.5px] font-bold tabular-nums">
                  ({formatPoints(total > 0 ? total : toNumber(exercise.declaredPoints))} ن)
                </span>
              </div>

              {exercise.questions.map((question, qIndex) => (
                <div key={question.id} className="mt-1 flex items-start gap-2 text-[11px] leading-relaxed">
                  <span className="w-4 shrink-0 font-bold tabular-nums">{question.number || qIndex + 1})</span>
                  <p className={`flex-1 whitespace-pre-line ${question.text.trim() ? '' : 'text-slate-300'}`}>
                    {question.text.trim() || 'سؤال لم يُحرَّر بعد…'}
                  </p>
                  <span className="shrink-0 text-[9.5px] font-bold tabular-nums text-slate-500">
                    {question.points.trim() ? `${question.points} ن` : '—'}
                  </span>
                </div>
              ))}
            </section>
          );
        })}
      </div>

      {isExam && (
        <section className="mt-4 break-inside-avoid border-t border-slate-400 pt-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[12px] font-black">الوضعية الإدماجية</h2>
            <span className="text-[10.5px] font-bold tabular-nums">
              ({exam.memo.integration.declaredPoints || '8'} ن)
            </span>
          </div>
          <p className={`mt-1 whitespace-pre-line text-[11px] leading-relaxed ${exam.integrationSituation.trim() ? '' : 'text-slate-300'}`}>
            {exam.integrationSituation.trim() || 'اكتب نص الوضعية الإدماجية والسند من لوحة المحرر…'}
          </p>
        </section>
      )}

      {exam.documents && (
        <section className="mt-3 rounded border border-dashed border-slate-300 px-2 py-1.5 text-[10px] leading-relaxed text-slate-600">
          <span className="font-extrabold text-slate-800">الوثائق والسندات: </span>
          <span className="whitespace-pre-line">{exam.documents}</span>
        </section>
      )}

      <footer className="mt-5 border-t border-slate-200 pt-1 text-center text-[9px] text-slate-400">
        ورقة تقويم — منصة SNV-EDU-PRO · علوم الطبيعة والحياة · التعليم المتوسط
      </footer>
    </div>
  );
};
