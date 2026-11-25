import React from 'react';
import { getYearPlanFields } from '../services/yearPlanFields';
import type { YearPlanUnit } from '../data/yearPlanOutlines';
import type { OfficialKnowledgeDoc } from '../types/knowledge';

interface Props {
  planId: string;
  unit: YearPlanUnit;
  doc: OfficialKnowledgeDoc | null;
  loading: boolean;
  onShowSource: (page: number) => void;
}

/** نفس الحقول في التوزيع السنوي وفي بطاقات المقاطع، دون خلط المقتطف بالنص الكامل. */
export function YearPlanUnitFields({ planId, unit, doc, loading, onShowSource }: Props) {
  const fields = getYearPlanFields(planId, unit, doc);
  return <div data-plan-fields={unit.id} className="space-y-3">
    <p className="text-xs leading-6 text-slate-500">مقتطفات موثقة من حقول المخطط، وليست تفريغاً كاملاً للأعمدة. قد يضم العمود تتمة في صفحات أخرى؛ افتح الصفحات الأصلية لقراءة السياق الكامل. أُبقيت أخطاء الاستخراج الآلي كما في النص المفهرس.</p>
    <dl className="grid gap-3 lg:grid-cols-2">
      {fields.map(field => <div key={field.key} data-plan-field={field.key} className={`rounded-xl border p-3.5 space-y-2 ${field.key === 'resources' ? 'bg-emerald-50/50 border-emerald-200 lg:col-span-2' : 'bg-white border-slate-200'}`}>
        <dt className="font-black text-xs text-slate-900 leading-6">{field.label}</dt>
        <dd className="space-y-3 text-xs leading-7 text-slate-700">
          {field.key === 'resources' && unit.resources.length > 0 && <div className="space-y-1"><p className="font-bold text-emerald-800">عناوين الموارد — ملخص العرض:</p><ol className="list-decimal list-inside">{unit.resources.map(resource => <li key={resource}>{resource}</li>)}</ol></div>}
          {field.key === 'duration' && unit.hours !== undefined && <p className="font-bold text-emerald-800">ملخص المدة: {unit.hours} ساعة{unit.weeksLabel ? ` · ${unit.weeksLabel} حسب الوثيقة` : ''}، دون حصص الإدماج والاختبارات.</p>}
          {field.excerpts.map((excerpt, index) => <div key={`${excerpt.page}-${index}`} className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-500">مقتطف من النص المفهرس — ص {excerpt.page}</p>
            <p className="whitespace-pre-wrap" data-plan-field-excerpt>{excerpt.text}</p>
            <button type="button" onClick={() => onShowSource(excerpt.page)} className="font-bold text-emerald-800 underline underline-offset-4 print:hidden">عرض الصفحة الأصلية — ص {excerpt.page}</button>
          </div>)}
          {field.status !== 'ready' && <p className="text-slate-500" data-plan-field-status={field.status}>
            {field.status === 'unindexed'
              ? 'لم يُفهرس لهذا المقطع مقتطف مستقل لهذا الحقل؛ هذا لا يعني غيابه عن الوثيقة. راجع الصفحات الأصلية، ولا تُستعار بيانات من طبعة أخرى.'
              : field.status === 'source-changed'
                ? 'تعذر التحقق من حدود هذا الحقل في النسخة المفهرسة؛ أُوقف عرضه لتجنب خلط الأعمدة. راجع الصفحة الأصلية.'
                : loading ? 'جارٍ تحميل المقتطف الموثق من الوثيقة المختارة…' : 'تعذر تحميل مقتطف هذا الحقل. يمكنك الرجوع إلى الصفحات الأصلية أو ملف المصدر المتاح.'}
          </p>}
        </dd>
      </div>)}
    </dl>
    <div className="flex flex-wrap gap-2 print:hidden" aria-label="صفحات المقطع كاملة">{unit.pages.map(page => <button key={page} type="button" onClick={() => onShowSource(page)} className="text-xs font-bold text-emerald-800 underline underline-offset-4">النص الكامل — ص {page}</button>)}</div>
  </div>;
}
