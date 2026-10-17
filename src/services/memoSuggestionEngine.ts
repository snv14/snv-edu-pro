import { PedagogicalNote, GradeLevel } from '../types/pedagogicalNote';
import { sourcePriorityOf } from './aiSourcePriority';

export type SuggestionCategory =
  | 'missing-source'
  | 'conflict'
  | 'lesson'
  | 'assessment'
  | 'experiment'
  | 'visual'
  | 'source';

export interface MemoSuggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  description: string;
  reason: string;
  sourceType: string;
  sourceLabel: string;
  sourceId?: string;
  uri?: string;
  requiresApproval: boolean;
}

export interface MemoSuggestionReport {
  suggestions: MemoSuggestion[];
  verificationStatus: 'verified' | 'review' | 'blocked';
}

const text = (value: unknown) => String(value || '').trim();

export function buildMemoSuggestionReport(
  gradeLevel: GradeLevel,
  topic: string,
  note: PedagogicalNote,
  sourceContext: Record<string, unknown> = {},
): MemoSuggestionReport {
  const suggestions: MemoSuggestion[] = [];
  const progression = Array.isArray(sourceContext.progression) ? sourceContext.progression as any[] : [];
  const memo = Array.isArray(sourceContext.memo) ? sourceContext.memo as any[] : [];
  const sourceDocuments = Array.isArray(sourceContext.sourceDocuments) ? sourceContext.sourceDocuments as any[] : [];

  const add = (category: SuggestionCategory, title: string, description: string, reason: string, sourceType: string, sourceLabel: string, sourceId?: string, uri?: string) => {
    suggestions.push({
      id: `suggestion-${category}-${suggestions.length + 1}`,
      category, title, description, reason, sourceType, sourceLabel, sourceId, uri,
      requiresApproval: true,
    });
  };

  const officialRows = progression.filter(row => !row?.isHoliday && !row?.isExam && (row?.midan || row?.maqta || row?.mawrid));
  const officialRow = officialRows[0];
  if (!officialRow) {
    add('missing-source', 'مصدر التدرج غير متوفر', `لم يتم العثور على صف رسمي مطابق للمورد «${topic}» في التدرج المحدد للسنة ${gradeLevel}.`, 'لا يجوز تثبيت الميدان أو المقطع أو المورد التعلمي اعتماداً على تخمين AI.', 'progression', 'التدرج الرسمي');
  }

  if (sourceDocuments.length === 0) {
    add('missing-source', 'إضافة مصادر تربوية أصلية', 'أضف المنهاج/التدرج أو الوثيقة المرافقة أو دليل الأستاذ أو مذكرة موثوقة قبل اعتماد التفاصيل البيداغوجية.', 'المصادر المرفوعة تزيد قابلية التحقق وتمنع اختلاق الأنشطة.', 'curriculum', 'المصادر الرسمية');
  }

  const officialValues = [text(officialRow?.midan), text(officialRow?.maqta), text(officialRow?.mawrid)].filter(Boolean);
  const noteValues = [note.meta.field, note.meta.learningUnit, note.meta.learningResource].map(text);
  const conflicts = officialValues.filter((value, i) => noteValues[i] && noteValues[i] !== value);
  conflicts.forEach((value, i) => {
    const labels = ['الميدان', 'المقطع', 'المورد التعلمي'];
    add('conflict', `تعارض في ${labels[i]}`, `القيمة الرسمية هي «${value}» بينما الناتج يحتوي قيمة مختلفة.`, 'تم تقديم المصدر الرسمي على ناتج النموذج ويجب مراجعة التعارض قبل الاعتماد.', 'progression', 'التدرج الرسمي', officialRow?.id ? String(officialRow.id) : undefined);
  });

  const activityCount = [note.sourceActivities?.title1, note.sourceActivities?.title2].filter(Boolean).length;
  if (activityCount === 0) {
    const sourceMemo = memo.find(row => Array.isArray(row?.activityTitles) && row.activityTitles.length);
    add('lesson', 'اقتراح مراجعة عناوين الأنشطة', sourceMemo
      ? `توجد أنشطة في المصدر «${text(sourceMemo.sourceLabel) || 'قاعدة المذكرات'}» ويمكن مراجعتها قبل إدراجها.`
      : 'لم توجد عناوين أنشطة موثقة مرتبطة بالموضوع في البيانات الحالية؛ لا تُنشئ عنواناً رسمياً تلقائياً.',
      'عنوان النشاط يجب أن يُستخرج من المصدر عند توفره، وليس اختراعه.', sourceMemo ? text(sourceMemo.sourceType) || 'memo' : 'memo', text(sourceMemo?.sourceLabel) || 'المذكرات');
  }

  if (!note.sourceActivities?.assessment) {
    add('assessment', 'اقتراح التحقق من التقويم', 'لا يوجد تقويم موثق في المصادر المطابقة؛ يمكن للأستاذ إدخال تقويم بعد مراجعة المورد والأنشطة.', 'التقويم جزء من محتوى الدرس لكنه لا يُنسب إلى مصدر غير موجود.', 'memo', 'المذكرات/المصادر التربوية');
  }

  if (note.experiments?.length === 0 && /تجرب|تجريب|كاشف|مخبر|وثيقة|تحليل/u.test(`${topic} ${note.meta.learningResource}`)) {
    add('experiment', 'مراجعة التجارب والسندات', 'الموضوع قد يحتاج سنداً تجريبياً أو وثائقياً؛ ابحث في الوثيقة المرافقة ودليل الأستاذ قبل إضافة تجربة.', 'اقتراح تربوي للمراجعة فقط، وليس إضافة رسمية تلقائية.', 'companionDocument', 'الوثيقة المرافقة');
  }

  if (!note.visualPlan?.description) {
    add('visual', 'اقتراح سند بصري', 'يمكن اقتراح مخطط أو صورة تعليمية بعد تحديد ما ورد في المصادر الأصلية.', 'السند البصري يجب أن يخدم المورد وألا يحل محل المصدر العلمي.', 'teacherGuide', 'دليل الأستاذ');
  }

  const hasAi = (note.sourceTrace || []).some(trace => trace.sourceType === 'ai');
  if (hasAi) {
    add('conflict', 'مراجعة عناصر الذكاء الاصطناعي', 'توجد عناصر موسومة «اقتراح AI — يحتاج مراجعة الأستاذ».', 'المحتوى غير الموثق لا يصبح رسمياً بمجرد توليده.', 'ai', 'اقتراح AI');
  }

  suggestions.sort((a, b) => sourcePriorityOf(a.sourceType) - sourcePriorityOf(b.sourceType));
  const verificationStatus = suggestions.some(s => s.category === 'conflict')
    ? 'review'
    : suggestions.length
      ? 'review'
      : 'verified';

  return { suggestions: suggestions.slice(0, 20), verificationStatus };
}
