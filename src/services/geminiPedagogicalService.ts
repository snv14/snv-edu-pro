import { PedagogicalNote, GradeLevel } from '../types/pedagogicalNote';
import { buildGeminiSystemPrompt } from './geminiPrompts';
import { sourcePriorityOf } from './aiSourcePriority';

/**
 * معالجة وتدقيق كود الـ JSON القادم من نموذج Gemini API مع المعالجة التلقائية للأخطاء (Error Handling & Validation)
 */
export function validateAndRepairPedagogicalNote(rawInput: string, fallbackLevel: GradeLevel = '4AM', fallbackTopic: string = '', sourceContext: Record<string, unknown> = {}): PedagogicalNote {
  let cleaned = String(rawInput || '').trim();

  // إزالة وسوم Markdown (```json ... ```) إن وُجدت
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // محاولة استخراج أول كائن JSON صالح داخل النص في حال وجود مقدمات أو مؤخرات نصية
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseError) {
    console.warn('[Validation Warning] فشل تحليل الـ JSON المباشر، جاري محاولة الترميم:', parseError);
    // محاولة تصحيح الفواصل الزائدة أو الأقواس غير المغلقة
    try {
      const sanitized = cleaned
        .replace(/,\s*([}\]])/g, '$1') // حذف الفاصلة الأخيرة قبل القوس
        .replace(/[\u0000-\u001F]+/g, ' '); // حذف محارف التحكم
      parsed = JSON.parse(sanitized);
    } catch {
      throw new Error('تعذر معالجة مخرجات الذكاء الاصطناعي كـ JSON صالح. يرجى إعادة المحاولة.');
    }
  }

  // التحقق والترميم الصارم (Schema Validation & Default Fallbacks)
  const meta = parsed.meta || {};
  const pedagogicalTriad = parsed.pedagogicalTriad || {};
  const requirements = parsed.requirements || {};
  const studentWorksheet = parsed.studentWorksheet || {};
  const bemEvaluationGrid = parsed.bemEvaluationGrid || {};
  const visualPlan = parsed.visualPlan || {};
  const progression = Array.isArray((sourceContext as any).progression) ? (sourceContext as any).progression : [];
  const memo = Array.isArray((sourceContext as any).memo) ? (sourceContext as any).memo : [];
  const topicNorm = String(fallbackTopic || '').toLowerCase().replace(/[\u064B-\u065F\u0670]/g, '').replace(/\s+/g, ' ').trim();
  const matchesTopic = (row: any) => {
    const values = [row?.midan, row?.maqta, row?.mawrid, row?.session1, row?.session2].map((v: any) => String(v || '').toLowerCase().replace(/[\u064B-\u065F\u0670]/g, '').replace(/\s+/g, ' ').trim());
    return topicNorm && values.some((v: string) => v && (v.includes(topicNorm) || topicNorm.includes(v)));
  };
  const officialRow = progression.find((row: any) => row && !row.isHoliday && !row.isExam && row.midan && row.maqta && row.mawrid && matchesTopic(row))
    || progression.find((row: any) => row && !row.isHoliday && !row.isExam && row.midan && row.maqta && row.mawrid)
    || {};
  const memoRow = memo.find((row: any) => row && matchesTopic(row) && (row.midan || row.maqta || row.mawrid || row.ta3alom))
    || memo.find((row: any) => row && (row.midan || row.maqta || row.mawrid || row.ta3alom))
    || {};
  const sourceField = (field: string, value: string, type: 'progression'|'memo') => ({
    field, value, sourceType: type,
    sourceLabel: type === 'progression' ? 'التدرج الرسمي' : 'قاعدة المذكرات/المنهاج',
    ...(type === 'progression' && officialRow.id ? { sourceId: String(officialRow.id) } : {}),
    ...(type === 'memo' && memoRow.id ? { sourceId: String(memoRow.id) } : {}),
  });
  const lockedField = String(officialRow.midan || memoRow.midan || meta.field || '').trim();
  const lockedUnit = String(officialRow.maqta || memoRow.maqta || meta.learningUnit || '').trim();
  const lockedResource = String(officialRow.mawrid || memoRow.mawrid || meta.learningResource || fallbackTopic || '').trim();
  const lockedLearning = String(memoRow.ta3alom || '').trim();
  const sourceActivityRow = memo.find((row: any) => (Array.isArray(row.activityTitles) && row.activityTitles.length > 0) || row.taqwim) || {};
  const sourceActivityRows = Array.isArray(memo) ? memo.filter((row: any) =>
    (Array.isArray(row.activityTitles) && row.activityTitles.length > 0) || row.taqwim
  ).slice(0, 2) : [];
  const primaryActivitySource = sourceActivityRows[0] || sourceActivityRow;
  const activityTitles = Array.isArray(primaryActivitySource.activityTitles)
    ? primaryActivitySource.activityTitles.map((x: any) => String(x || '').trim()).filter(Boolean).slice(0, 2)
    : [];
  const sourceAssessment = String(primaryActivitySource.taqwim || '').trim();
  const sourceActivityKind = ['curriculum','companionDocument','teacherGuide','memo'].includes(String(primaryActivitySource.sourceType))
    ? String(primaryActivitySource.sourceType) as any
    : 'memo';
  const activitySourceId1 = primaryActivitySource.activitySources?.[0]?.id ? String(primaryActivitySource.activitySources[0].id) : '';
  const activitySourceId2 = primaryActivitySource.activitySources?.[1]?.id ? String(primaryActivitySource.activitySources[1].id) : '';
  const assessmentSourceId = primaryActivitySource.id ? String(primaryActivitySource.id) : '';
  const sourceActivities = {
    title1: activityTitles[0] || '',
    title2: activityTitles[1] || '',
    assessment: sourceAssessment,
    sourceType: (activityTitles.length || sourceAssessment) ? sourceActivityKind : 'ai' as const,
    sourceLabel: (activityTitles.length || sourceAssessment)
      ? String(primaryActivitySource.sourceLabel || 'مصدر تربوي')
      : 'غير متوفر في المصدر',
    ...(activitySourceId1 ? { sourceId: activitySourceId1 } : {}),
    ...(activitySourceId2 ? { sourceId2: activitySourceId2 } : {}),
    ...(assessmentSourceId ? { assessmentSourceId } : {}),
  };

  const activityTraceType = ['curriculum','companionDocument','teacherGuide','memo'].includes(String(sourceActivityRow.sourceType)) ? String(sourceActivityRow.sourceType) as any : 'memo';
  const activityTraceLabel = String(sourceActivityRow.sourceLabel || 'مصدر تربوي');
  const activityTrace = [
    activityTitles[0] && { field: 'عنوان النشاط 1', value: activityTitles[0], sourceType: activityTraceType, sourceLabel: activityTraceLabel, ...(sourceActivityRow.id ? { sourceId: String(sourceActivityRow.id) } : {}) },
    activityTitles[1] && { field: 'عنوان النشاط 2', value: activityTitles[1], sourceType: activityTraceType, sourceLabel: activityTraceLabel, ...(activitySourceId2 ? { sourceId: activitySourceId2 } : {}) },
    sourceAssessment && { field: 'التقويم', value: sourceAssessment, sourceType: activityTraceType, sourceLabel: activityTraceLabel, ...(assessmentSourceId ? { sourceId: assessmentSourceId } : {}) },
  ].filter(Boolean) as any[];

  const sourceDocuments = Array.isArray((sourceContext as any).sourceDocuments) ? (sourceContext as any).sourceDocuments : [];
  const sourceDocumentTrace = sourceDocuments.map((doc: any) => {
    const sourceType = String(doc?.type || 'attachment');
    return {
      field: 'مصدر مرفق',
      value: String(doc?.name || '').trim(),
      sourceType: ['curriculum','progression','companionDocument','teacherGuide','memo','attachment'].includes(sourceType) ? sourceType : 'attachment',
      sourceLabel: String(doc?.name || 'مرفق تربوي').trim(),
      ...(doc?.id ? { sourceId: String(doc.id) } : {}),
    };
  }).filter((x: any) => x.value).sort((a: any, b: any) => sourcePriorityOf(a.sourceType) - sourcePriorityOf(b.sourceType));

  const lockedTrace = [
    lockedField && sourceField('الميدان', lockedField, officialRow.midan ? 'progression' : 'memo'),
    lockedUnit && sourceField('المقطع', lockedUnit, officialRow.maqta ? 'progression' : 'memo'),
    lockedResource && sourceField('المورد التعلمي', lockedResource, officialRow.mawrid ? 'progression' : 'memo'),
    lockedLearning && sourceField('تعلم المورد', lockedLearning, 'memo'),
  ].filter(Boolean) as any[];

  const sourceSequence = Array.isArray(parsed.sequence) ? parsed.sequence : [];
  const cleanedSequence = sourceSequence.map((stage: any, index: number) => ({
    stageName: String(stage.stageName || `المرحلة ${index + 1}`).trim(),
    timeMinutes: typeof stage.timeMinutes === 'number' && stage.timeMinutes >= 0 ? stage.timeMinutes : 0,
    teacherInstructions: String(stage.teacherInstructions || '').trim(),
    studentActivities: String(stage.studentActivities || '').trim(),
    didacticSupports: Array.isArray(stage.didacticSupports) ? stage.didacticSupports.map(String).filter(Boolean) : [],
  })).filter((stage: any) => stage.teacherInstructions || stage.studentActivities || stage.stageName);
  const hasStandaloneAssessmentStage = cleanedSequence.some((stage: any) => /^(تقويم|التقويم|تقويم الموارد)$/u.test(stage.stageName.trim()));

  const validatedNote: PedagogicalNote = {
    meta: {
      gradeLevel: (['1AM', '2AM', '3AM', '4AM'].includes(meta.gradeLevel) ? meta.gradeLevel : fallbackLevel) as GradeLevel,
      field: lockedField || String(meta.field || '').trim(),
      learningUnit: lockedUnit || String(meta.learningUnit || '').trim(),
      learningResource: lockedResource || String(meta.learningResource || fallbackTopic || '').trim(),
      lessonTitle: String(meta.lessonTitle || fallbackTopic || 'عنوان الحصة التعليمية').trim(),
      durationHours: typeof meta.durationHours === 'number' ? meta.durationHours : 1,
      targetedCompetence: String(meta.targetedCompetence || 'اقتراح AI — يحتاج مراجعة الأستاذ').trim(),
    },
    pedagogicalTriad: {
      knowledgeResource: String(pedagogicalTriad.knowledgeResource || 'اقتراح AI — يحتاج مراجعة الأستاذ').trim(),
      methodologicalResource: String(pedagogicalTriad.methodologicalResource || 'اقتراح AI — يحتاج مراجعة الأستاذ').trim(),
      valuesResource: String(pedagogicalTriad.valuesResource || 'اقتراح AI — يحتاج مراجعة الأستاذ').trim(),
    },
    requirements: {
      prerequisites: Array.isArray(requirements.prerequisites) && requirements.prerequisites.length > 0
        ? requirements.prerequisites.map((p: any) => String(p).trim()).filter(Boolean)
        : ['اقتراح AI — يحتاج مراجعة الأستاذ'],
      didacticMeans: Array.isArray(requirements.didacticMeans) && requirements.didacticMeans.length > 0
        ? requirements.didacticMeans.map((d: any) => String(d).trim()).filter(Boolean)
        : ['اقتراح AI — يحتاج مراجعة الأستاذ'],
      scientificTerms: Array.isArray(requirements.scientificTerms)
        ? requirements.scientificTerms.map((t: any) => ({
            arabic: String(t.arabic || '').trim(),
            french: String(t.french || '').trim(),
            english: String(t.english || '').trim(),
          })).filter((t: any) => t.arabic || t.french || t.english)
        : [],
    },
    experiments: Array.isArray(parsed.experiments)
      ? parsed.experiments.map((exp: any) => ({
          substanceTested: String(exp.substanceTested || '').trim(),
          reagentUsed: String(exp.reagentUsed || '').trim(),
          expectedObservation: String(exp.expectedObservation || '').trim(),
          scientificConclusion: String(exp.scientificConclusion || '').trim(),
        }))
      : [],
    sequence: cleanedSequence.length > 0 && !hasStandaloneAssessmentStage ? cleanedSequence
      : [
          {
            stageName: 'وضعية الانطلاق',
            timeMinutes: 10,
            teacherInstructions: 'إثارة الدافعية وطرح المشكل العلمي المرتبط بالمورد',
            studentActivities: 'استدعاء المكتسبات القبلية وصياغة الفرضيات الأولية',
            didacticSupports: ['سندات بيداغوجية، صور وأفلام قصيرة'],
          },
          {
            stageName: 'وضعية البحث والتقصي',
            timeMinutes: 35,
            teacherInstructions: 'تنظيم الأفواج وتوجيه مسعى التجريب والتحليل',
            studentActivities: 'معالجة الوثائق وإجراء التجارب واستنتاج النتائج',
            didacticSupports: ['بطاقة العمل الفوجي، تجهيزات مخبرية'],
          },
          {
            stageName: 'إرساء الموارد / التركيب',
            timeMinutes: 10,
            teacherInstructions: 'إدارة المناقشة الجماعية ومصادقة الحلول الصحيحة',
            studentActivities: 'صياغة خلاصة شاملة تدون في كراس المتعلم',
            didacticSupports: ['السبورة ومخططات الحوصلة'],
          },
          {
            stageName: 'تقويم الموارد',
            timeMinutes: 5,
            teacherInstructions: 'اقتراح نشاط تقويمي سريع للتأكد من التحكم في المورد',
            studentActivities: 'الإجابة الفردية عن الوضعية التقويمية المعيارية',
            didacticSupports: ['شبكة التقويم الذاتي'],
          },
        ],
    studentWorksheet: {
      instructions: Array.isArray(studentWorksheet.instructions) && studentWorksheet.instructions.length > 0
        ? studentWorksheet.instructions.map(String)
        : ['العمل في فوج تعاوني وفق المهام الموزعة'],
      questionsToAnswer: Array.isArray(studentWorksheet.questionsToAnswer) && studentWorksheet.questionsToAnswer.length > 0
        ? studentWorksheet.questionsToAnswer.map(String)
        : ['حلل السندات المقدمة واستخلص النتيجة العلمية المستهدفة'],
    },
    researchSources: Array.isArray(parsed.researchSources) ? parsed.researchSources.map((x:any)=>({title:String(x.title||''),url:String(x.url||''),purpose:String(x.purpose||'')})).filter((x:any)=>x.title||x.url) : [],
    sourceActivities,
    sourceTrace: [...lockedTrace, ...activityTrace, ...sourceDocumentTrace, ...(Array.isArray(parsed.sourceTrace)
      ? parsed.sourceTrace.map((x:any)=>({
          field: String(x.field || '').trim(),
          value: String(x.value || '').trim(),
          sourceType: ['curriculum','progression','companionDocument','teacherGuide','memo','library','attachment','web','ai'].includes(x.sourceType) ? x.sourceType : 'ai',
          sourceLabel: String(x.sourceLabel || (x.sourceType === 'ai' ? 'اقتراح AI — يحتاج مراجعة الأستاذ' : 'مصدر غير محدد')).trim(),
          ...(x.sourceId ? { sourceId: String(x.sourceId).trim() } : {}),
          ...(x.uri && /^https?:\/\//i.test(String(x.uri)) ? { uri: String(x.uri).trim() } : {}),
        }))
        .filter((x:any)=>x.field && x.value)
        .slice(0, 80)
      : [])].filter((x:any, i:number, arr:any[]) => arr.findIndex((y:any) => y.field === x.field && y.value === x.value) === i).slice(0, 80),
    visualPlan: {
      diagramType: String(visualPlan.diagramType || '').trim(),
      description: String(visualPlan.description || '').trim(),
      imageSuggestions: Array.isArray(visualPlan.imageSuggestions) ? visualPlan.imageSuggestions.map(String).filter(Boolean) : [],
    },
    bemEvaluationGrid: {
      relevance: String(bemEvaluationGrid.relevance || 'مؤشر الوجاهة والتقيد بالمهمة المركبة المطلوبة').trim(),
      correctUseOfTools: String(bemEvaluationGrid.correctUseOfTools || 'الاستعمال السليم لمفاهيم علوم الطبيعة والحياة والمصطلحات العلمية').trim(),
      coherence: String(bemEvaluationGrid.coherence || 'تسلسل منطقي وتفسير علمي منسجم ومبرر').trim(),
    },
  };

  return validatedNote;
}

/**
 * استدعاء Gemini API لتوليد مذكرة بيداغوجية متكاملة وفق المنهاج الجزائري
 */
export interface PedagogicalAttachmentInput {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

export async function generatePedagogicalNote(
  gradeLevel: GradeLevel,
  topic: string,
  attachments: PedagogicalAttachmentInput[] = [],
  useWebResearch: boolean = true,
  modelSections: string[] = [],
  sourceContext: Record<string, unknown> = {}
): Promise<PedagogicalNote> {
  const cleanTopic = (topic || '').trim();
  if (!cleanTopic) {
    throw new Error('يرجى تحديد المورد أو موضوع الدرس المراد توليد المذكرات حوله');
  }

  try {
    const res = await fetch('/api/gemini/generate-pedagogical-note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gradeLevel,
        topic: cleanTopic,
        attachments: attachments.map(({ name, mimeType, size, dataUrl }) => ({
          name,
          mimeType,
          size,
          dataUrl,
        })),
        useWebResearch,
        modelSections,
        sourceContext,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `فشل الاتصال بخدمة الذكاء الاصطناعي (${res.status})`);
    }

    const data = await res.json();
    const rawJson = data.json || data.text || '';
    if (!rawJson) {
      throw new Error('استجاب النموذج بدون محتوى صالح');
    }

    return validateAndRepairPedagogicalNote(rawJson, gradeLevel, cleanTopic, sourceContext);
  } catch (error) {
    console.error('[Generate Pedagogical Note Error]:', error);
    throw error;
  }
}
