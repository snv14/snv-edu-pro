import React from 'react';
import {
  CorrectionMemoData,
  CorrectionExercise,
  MemoFieldSource,
  SOURCE_LABEL,
  criterionTotal,
  exerciseTotal,
  formatPoints,
  integrationTotal,
  part1Total,
  overallTotal,
  toNumber,
} from '../services/correctionMemoModel';

const SOURCE_COLOR: Record<MemoFieldSource, string> = {
  platform: '#0f766e',
  imported: '#2563eb',
  ai: '#b45309',
  teacher: '#334155',
  template: 'transparent',
};

interface SheetProps {
  data: CorrectionMemoData;
  editable?: boolean;
  onChange?: (updater: (draft: CorrectionMemoData) => void) => void;
}

const cellInputClass =
  'w-full bg-transparent text-[12px] leading-6 outline-none focus:bg-emerald-50/70 px-1 py-0.5 print:bg-transparent';

const Cell: React.FC<{
  value: string;
  onChange?: (value: string) => void;
  editable?: boolean;
  source?: MemoFieldSource;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  align?: 'right' | 'center';
  bold?: boolean;
}> = ({ value, onChange, editable, source = 'template', placeholder, className = '', multiline, align = 'right', bold }) => {
  const style: React.CSSProperties = {
    borderRight: source === 'template' ? undefined : `2px solid ${SOURCE_COLOR[source]}`,
    textAlign: align,
    fontWeight: bold ? 700 : undefined,
  };
  if (!editable) {
    return (
      <div className={`w-full whitespace-pre-wrap px-1 py-0.5 ${className}`} style={style}>
        {value || <span className="text-slate-300"> </span>}
      </div>
    );
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={event => onChange?.(event.target.value)}
        placeholder={placeholder}
        rows={Math.min(6, Math.max(1, Math.ceil((value.length || placeholder?.length || 10) / 34)))}
        className={`${cellInputClass} resize-y ${className}`}
        style={style}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={event => onChange?.(event.target.value)}
      placeholder={placeholder}
      className={`${cellInputClass} ${className}`}
      style={style}
    />
  );
};

const HeaderLine = ({ label, value, onChange, editable, wide }: { label: string; value: string; onChange?: (value: string) => void; editable?: boolean; wide?: boolean }) => (
  <div className={`flex items-baseline gap-1 ${wide ? 'sm:col-span-2' : ''}`}>
    <span className="font-bold text-[12px] whitespace-nowrap">{label}:</span>
    <span className="flex-1 border-b border-dotted border-slate-500 min-w-[60px]">
      <Cell value={value} onChange={onChange} editable={editable} source="teacher" align="center" />
    </span>
  </div>
);

export const CorrectionMemoSheet: React.FC<SheetProps> = ({ data, editable = true, onChange }) => {
  const update = (mutate: (draft: CorrectionMemoData) => void) => {
    if (!editable || !onChange) return;
    onChange(draft => mutate(draft));
  };

  const updateExercise = (exerciseId: string, mutate: (exercise: CorrectionExercise) => void) => {
    update(draft => {
      const exercise = draft.exercises.find(item => item.id === exerciseId);
      if (exercise) mutate(exercise);
    });
  };

  const total = overallTotal(data);

  return (
    <div dir="rtl" className="cm-sheet text-slate-900" style={{ fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <div className="text-center leading-6">
        <div className="font-bold text-[13px]">الجمهورية الجزائرية الديمقراطية الشعبية</div>
        <div className="font-bold text-[13px]">وزارة التربية الوطنية</div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
        <HeaderLine label="مديرية التربية لولاية" value={data.directorate} editable={editable} onChange={value => update(draft => { draft.directorate = value; })} />
        <HeaderLine label="المتوسطة" value={data.schoolName} editable={editable} onChange={value => update(draft => { draft.schoolName = value; })} />
        <HeaderLine label="المستوى" value={data.level} editable={editable} onChange={value => update(draft => { draft.level = value; })} />
        <HeaderLine label="السنة الدراسية" value={data.schoolYear} editable={editable} onChange={value => update(draft => { draft.schoolYear = value; })} />
        <HeaderLine label="المادة" value="علوم الطبيعة والحياة" editable={false} />
        <HeaderLine label="الأستاذ(ة)" value={data.teacherName} editable={editable} onChange={value => update(draft => { draft.teacherName = value; })} />
        <HeaderLine label="المدة" value={data.duration} editable={editable} onChange={value => update(draft => { draft.duration = value; })} />
        <HeaderLine label="الفصل" value={data.term} editable={editable} onChange={value => update(draft => { draft.term = value; })} />
      </div>

      <div className="mt-3 text-center">
        <div className="text-[16px] font-black">{data.title}</div>
        <div className="text-[12.5px] font-bold">{data.examType} {data.term} في مادة علوم الطبيعة والحياة</div>
      </div>

      <h3 className="mt-4 mb-1 text-[12.5px] font-black">الموارد المعرفية المستهدفة في الاختبار</h3>
      <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="bg-[#dbe4f2]">
            <th className="border border-slate-600 px-1 py-1 w-[16%]">التمرين</th>
            <th className="border border-slate-600 px-1 py-1 w-[22%]">المقطع التعلمي</th>
            <th className="border border-slate-600 px-1 py-1 w-[32%]">الموارد المعرفية</th>
            <th className="border border-slate-600 px-1 py-1 w-[30%]">معايير ومؤشرات التقويم</th>
          </tr>
        </thead>
        <tbody>
          {data.resources.map(row => (
            <tr key={row.id}>
              <td className="border border-slate-600 px-1 py-0.5 align-middle">
                <Cell value={row.exerciseLabel} editable={editable} onChange={value => update(draft => { const target = draft.resources.find(item => item.id === row.id); if (target) target.exerciseLabel = value; })} align="center" bold />
              </td>
              <td className="border border-slate-600 px-1 py-0.5 align-middle">
                <Cell value={row.maqta} editable={editable} source={row.maqtaSource} onChange={value => update(draft => { const target = draft.resources.find(item => item.id === row.id); if (target) { target.maqta = value; target.maqtaSource = 'teacher'; } })} placeholder="..........." />
              </td>
              <td className="border border-slate-600 px-1 py-0.5 align-middle">
                <Cell value={row.knowledge} editable={editable} source={row.knowledgeSource} onChange={value => update(draft => { const target = draft.resources.find(item => item.id === row.id); if (target) { target.knowledge = value; target.knowledgeSource = 'teacher'; } })} placeholder="..........." multiline />
              </td>
              <td className="border border-slate-600 px-1 py-0.5 align-middle">
                <Cell value={row.criteria} editable={editable} source={row.criteriaSource} onChange={value => update(draft => { const target = draft.resources.find(item => item.id === row.id); if (target) { target.criteria = value; target.criteriaSource = 'teacher'; } })} placeholder="..........." multiline />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between text-[12.5px] font-black">
        <div className="flex items-baseline gap-1">
          <span>الجزء الأول:</span>
          <span className="w-16 inline-block">
            <Cell value={data.part1DeclaredPoints} editable={editable} onChange={value => update(draft => { draft.part1DeclaredPoints = value; })} align="center" source="teacher" />
          </span>
          <span>نقطة</span>
        </div>
        <div className="text-[11.5px] font-bold text-slate-600">مجموع محسوب: {formatPoints(part1Total(data))} ن</div>
      </div>

      <div className="mt-2 space-y-3">
        {data.exercises.filter(exercise => exercise.part === 1).map((exercise, index) => {
          const computed = exerciseTotal(exercise);
          const declared = toNumber(exercise.declaredPoints);
          const mismatch = declared !== null && computed > 0 && declared !== computed;
          return (
            <section key={exercise.id} className="break-inside-avoid">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-[12.5px] font-black">التمرين {index === 0 ? 'الأول' : index === 1 ? 'الثاني' : index === 2 ? 'الثالث' : `رقم ${index + 1}`}:</span>
                  <span className="w-14 inline-block">
                    <Cell value={exercise.declaredPoints} editable={editable} onChange={value => updateExercise(exercise.id, target => { target.declaredPoints = value; })} align="center" source="teacher" placeholder="06" />
                  </span>
                  <span className="text-[12px] font-bold">نقطة</span>
                </div>
                <span className={`text-[10.5px] font-bold ${mismatch ? 'text-red-700' : 'text-slate-500'}`}>
                  مجموع الأسئلة: {formatPoints(computed)} ن{mismatch ? ' — لا يطابق المعلن' : ''}
                </span>
              </div>

              <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-[#dbe4f2]">
                    <th className="border border-slate-600 px-1 py-1 w-[14%]">السؤال</th>
                    <th className="border border-slate-600 px-1 py-1">عناصر الإجابة</th>
                    <th className="border border-slate-600 px-1 py-1 w-[12%]">ت. الجزئي</th>
                    <th className="border border-slate-600 px-1 py-1 w-[12%]">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.questions.map(question => (
                    <tr key={question.id}>
                      <td className="border border-slate-600 px-1 py-0.5 align-middle">
                        <Cell value={question.number} editable={editable} onChange={value => updateExercise(exercise.id, target => { const item = target.questions.find(entry => entry.id === question.id); if (item) item.number = value; })} align="center" />
                      </td>
                      <td className="border border-slate-600 px-1 py-0.5 align-middle">
                        <Cell
                          value={question.expected}
                          editable={editable}
                          source={question.source}
                          multiline
                          onChange={value => updateExercise(exercise.id, target => { const item = target.questions.find(entry => entry.id === question.id); if (item) { item.expected = value; item.source = 'teacher'; item.needsReview = false; } })}
                          placeholder={question.text ? `الإجابة المنتظرة عن: ${question.text.slice(0, 60)}` : '...........'}
                        />
                        {question.needsReview && <span className="text-[9px] font-bold text-amber-700">يحتاج مراجعة الأستاذ</span>}
                      </td>
                      <td className="border border-slate-600 px-1 py-0.5 align-middle">
                        <Cell value={question.points} editable={editable} onChange={value => updateExercise(exercise.id, target => { const item = target.questions.find(entry => entry.id === question.id); if (item) item.points = value; })} align="center" placeholder="… ن" />
                      </td>
                      <td className="border border-slate-600 px-1 py-0.5 align-middle text-center">
                        {question.points ? `${question.points} ن` : ''}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100">
                    <td className="border border-slate-600 px-1 py-0.5 text-center font-black" colSpan={2}>مجموع النقاط</td>
                    <td className="border border-slate-600 px-1 py-0.5 text-center font-bold" colSpan={2}>{formatPoints(computed)} ن</td>
                  </tr>
                </tbody>
              </table>
            </section>
          );
        })}
      </div>

      <div className="cm-page-break" />

      <div className="mt-3 flex items-center justify-between text-[12.5px] font-black">
        <div className="flex items-baseline gap-1">
          <span>الجزء الثاني: الوضعية الإدماجية (</span>
          <span className="w-14 inline-block">
            <Cell value={data.integration.declaredPoints} editable={editable} onChange={value => update(draft => { draft.integration.declaredPoints = value; })} align="center" source="teacher" />
          </span>
          <span>نقطة)</span>
        </div>
        <div className="text-[11.5px] font-bold text-slate-600">مجموع محسوب: {formatPoints(integrationTotal(data))} ن</div>
      </div>

      <table className="mt-1 w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="bg-[#dbe4f2]">
            <th className="border border-slate-600 px-1 py-1 w-[22%]">المعيار</th>
            <th className="border border-slate-600 px-1 py-1">مؤشرات التصحيح (عناصر الإجابة المنتظرة)</th>
            <th className="border border-slate-600 px-1 py-1 w-[14%]">ت. الجزئي</th>
            <th className="border border-slate-600 px-1 py-1 w-[12%]">المجموع</th>
          </tr>
        </thead>
        <tbody>
          {data.integration.criteria.map(criterion => {
            const criterionPoints = criterionTotal(criterion);
            return (
              <React.Fragment key={criterion.id}>
                {criterion.indicators.map((indicator, index) => (
                  <tr key={indicator.id}>
                    {index === 0 && (
                      <td className="border border-slate-600 px-1 py-0.5 text-center align-middle font-bold" rowSpan={criterion.indicators.length}>
                        {criterion.label}
                      </td>
                    )}
                    <td className="border border-slate-600 px-1 py-0.5 align-middle">
                      <Cell
                        value={indicator.text}
                        editable={editable}
                        onChange={value => update(draft => {
                          const target = draft.integration.criteria.find(item => item.id === criterion.id)?.indicators.find(item => item.id === indicator.id);
                          if (target) target.text = value;
                        })}
                        placeholder="..................................."
                        multiline
                      />
                    </td>
                    <td className="border border-slate-600 px-1 py-0.5 align-middle">
                      <Cell
                        value={indicator.points}
                        editable={editable}
                        onChange={value => update(draft => {
                          const target = draft.integration.criteria.find(item => item.id === criterion.id)?.indicators.find(item => item.id === indicator.id);
                          if (target) target.points = value;
                        })}
                        align="center"
                        placeholder="… ن"
                      />
                    </td>
                    {index === 0 && (
                      <td className="border border-slate-600 px-1 py-0.5 text-center align-middle font-bold" rowSpan={criterion.indicators.length}>
                        {criterionPoints ? `${formatPoints(criterionPoints)} ن` : ''}
                      </td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
          <tr className="bg-slate-100">
            <td className="border border-slate-600 px-1 py-0.5 text-center font-black" colSpan={2}>مجموع نقاط الوضعية الإدماجية</td>
            <td className="border border-slate-600 px-1 py-0.5 text-center font-black" colSpan={2}>{formatPoints(integrationTotal(data))} ن</td>
          </tr>
          <tr className="bg-[#eef2f8]">
            <td className="border border-slate-600 px-1 py-0.5 text-center font-black" colSpan={2}>المجموع العام للمذكرة</td>
            <td className="border border-slate-600 px-1 py-0.5 text-center font-black" colSpan={2}>{formatPoints(total)} ن</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4">
        <h3 className="text-[12.5px] font-black mb-1">التصحيح البعدي وتحليل النتائج</h3>
        <div className="text-[12px] font-bold mb-1">1) نتائج القسم:</div>
        <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-[#dbe4f2]">
              <th className="border border-slate-600 px-1 py-1 w-[25%]">عدد المتعلمين</th>
              <th className="border border-slate-600 px-1 py-1 w-[25%]">المتحصلون على 10/20 فأكثر</th>
              <th className="border border-slate-600 px-1 py-1 w-[25%]">نسبة النجاح</th>
              <th className="border border-slate-600 px-1 py-1 w-[25%]">معدل القسم</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {(['learners', 'above10', 'passRate', 'average'] as const).map(key => (
                <td key={key} className="border border-slate-600 px-1 py-0.5 align-middle">
                  <Cell value={data.results[key]} editable={editable} source={data.results[key] ? 'teacher' : 'template'} onChange={value => update(draft => { draft.results[key] = value; })} align="center" placeholder={key === 'passRate' ? '% ......' : key === 'average' ? '... / 20' : ''} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className="text-[12px] font-bold mt-3 mb-1">2) الأخطاء المتكررة (تُسجّل بعد تصحيح أوراق المتعلمين):</div>
        <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-[#dbe4f2]">
              <th className="border border-slate-600 px-1 py-1 w-[16%]">التمرين / السؤال</th>
              <th className="border border-slate-600 px-1 py-1 w-[30%]">الخطأ المتكرر</th>
              <th className="border border-slate-600 px-1 py-1 w-[18%]">نوعه (معرفي / منهجي / لغوي)</th>
              <th className="border border-slate-600 px-1 py-1 w-[14%]">عدد المتعلمين</th>
              <th className="border border-slate-600 px-1 py-1 w-[22%]">سببه المحتمل</th>
            </tr>
          </thead>
          <tbody>
            {data.errors.map(row => (
              <tr key={row.id}>
                {(['exercise', 'error', 'kind', 'learners', 'cause'] as const).map(key => (
                  <td key={key} className="border border-slate-600 px-1 py-0.5 align-middle">
                    <Cell value={row[key]} editable={editable} onChange={value => update(draft => { const target = draft.errors.find(item => item.id === row.id); if (target) target[key] = value; })} multiline={key === 'error' || key === 'cause'} align={key === 'learners' ? 'center' : 'right'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-[12px] font-bold mt-3 mb-1">3) خطة المعالجة (حلول المعالجة البيداغوجية):</div>
        <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-[#dbe4f2]">
              <th className="border border-slate-600 px-1 py-1 w-[26%]">الهدف المعالج (المورد المستهدف)</th>
              <th className="border border-slate-600 px-1 py-1 w-[30%]">النشاط العلاجي المقترح</th>
              <th className="border border-slate-600 px-1 py-1 w-[24%]">الوسيلة / السند</th>
              <th className="border border-slate-600 px-1 py-1 w-[20%]">المتعلمون المعنيون</th>
            </tr>
          </thead>
          <tbody>
            {data.remediation.map(row => (
              <tr key={row.id}>
                {(['objective', 'activity', 'support', 'learners'] as const).map(key => (
                  <td key={key} className="border border-slate-600 px-1 py-0.5 align-middle">
                    <Cell value={row[key]} editable={editable} onChange={value => update(draft => { const target = draft.remediation.find(item => item.id === row.id); if (target) target[key] = value; })} multiline />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 border-t-2 border-slate-700 pt-2">
        <div className="text-[12.5px] font-black mb-1">ملاحظات خاصة بالتصحيح</div>
        {data.notes.map((note, index) => (
          <div key={index} className="flex items-baseline gap-1 text-[12px]">
            <span className="font-bold">–</span>
            <span className="flex-1 border-b border-dotted border-slate-400">
              <Cell value={note} editable={editable} onChange={value => update(draft => { draft.notes[index] = value; })} />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[12px] font-bold">
        <div>
          <div>الأستاذ(ة) المصحح(ة)</div>
          <div className="mt-3 text-[11.5px]">{data.teacherName || '................'}</div>
        </div>
        <div>
          <div>السيد(ة) المفتش(ة)</div>
          <div className="mt-3 text-[11.5px]">................</div>
        </div>
        <div>
          <div>السيد(ة) المدير(ة)</div>
          <div className="mt-3 text-[11.5px]">................</div>
        </div>
      </div>
    </div>
  );
};

export const SourceLegend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-bold text-slate-600">
    {(Object.keys(SOURCE_LABEL) as MemoFieldSource[]).filter(key => key !== 'template').map(key => (
      <span key={key} className="inline-flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: SOURCE_COLOR[key] }} />
        {SOURCE_LABEL[key]}
      </span>
    ))}
  </div>
);
