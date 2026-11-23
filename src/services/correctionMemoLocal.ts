import { analyzeDocumentLocally } from './documentAgent';

/**
 * تحويل قراءة الوكيل المحلية إلى صيغة مذكرة التصحيح نفسها،
 * حتى تُستورد أوراق PDF النصية وWord دون أي مزوّد ذكاء اصطناعي.
 * لا تُخترع إجابة نموذجية ولا نقطة غير مكتوبة؛ ما لم يُقرأ يُعلن في ambiguities.
 */

export interface LocalCorrectionQuestion {
  number: string;
  text: string;
  points: number | null;
}

export interface LocalCorrectionExercise {
  number: string;
  kind: 'exercise' | 'integration';
  title: string;
  questions: LocalCorrectionQuestion[];
}

export interface LocalCorrectionSourceJson {
  title: string;
  meta: {
    level: string;
    midan: string;
    maqta: string;
    kafaa: string;
    mawrid: string;
    term: string;
    duration: string;
    title: string;
  };
  exercises: LocalCorrectionExercise[];
  totalPoints: number | null;
  documents: Array<{ id: string; description: string }>;
  ambiguities: string[];
  pointsSuggestion: Array<{ questionRef: string; points: number }>;
  source: 'local';
  confidence: 'مرتفعة' | 'متوسطة' | 'منخفضة';
}

export function buildLocalCorrectionSource(
  text: string,
  examType: string,
  fileName = '',
): LocalCorrectionSourceJson | null {
  const analysis = analyzeDocumentLocally(text, {
    examType: examType === 'فرض' || examType === 'اختبار' ? examType : '',
    fileName,
  });
  if (!analysis.exercises.length) return null;

  const bestMatch = analysis.matches[0];
  const documentIds = Array.from(
    new Set(
      Array.from(text.matchAll(/الوثيقة\s*(?:رقم\s*)?([0-9]+|[أ-ي])(?![\u0600-\u06FF])/g))
        .map(match => match[1])
        .filter(Boolean),
    ),
  ).slice(0, 8);

  const pointsSuggestion: Array<{ questionRef: string; points: number }> = [];
  if (analysis.expectedStructure) {
    const plain = analysis.exercises.filter(exercise => exercise.kind === 'exercise');
    plain.slice(0, analysis.expectedStructure.exercisePoints.length).forEach((exercise, index) => {
      pointsSuggestion.push({ questionRef: `exercise-${exercise.number}`, points: analysis.expectedStructure!.exercisePoints[index] });
    });
    const integration = analysis.exercises.find(exercise => exercise.kind === 'integration');
    if (integration && analysis.expectedStructure.integrationPoints) {
      const perQuestion = Math.round((analysis.expectedStructure.integrationPoints / Math.max(1, integration.questions.length)) * 2) / 2;
      integration.questions.forEach(question => {
        pointsSuggestion.push({ questionRef: `question-${integration.number}-${question.number}`, points: perQuestion });
      });
    }
  }

  const ambiguities = [...analysis.warnings, ...analysis.suggestions.map(item => item.message)];
  if (!analysis.pointsSum) ambiguities.push('لم تُقرأ نقاط مكتوبة؛ يمكن اقتراح توزيع من البنية المعتمدة.');

  return {
    title: fileName ? fileName.replace(/\.[^.]+$/, '') : analysis.title,
    meta: {
      level: analysis.levelLabel,
      midan: bestMatch?.midan || '',
      maqta: bestMatch?.maqta || '',
      kafaa: bestMatch?.kafaa || '',
      mawrid: bestMatch?.mawrid || '',
      term: '',
      duration: '',
      title: fileName ? fileName.replace(/\.[^.]+$/, '') : '',
    },
    exercises: analysis.exercises.map(exercise => ({
      number: exercise.number,
      kind: exercise.kind,
      title: exercise.title,
      questions: exercise.questions.map(question => ({
        number: question.number,
        text: question.text,
        points: question.points,
      })),
    })),
    totalPoints: analysis.totalPoints,
    documents: documentIds.map(id => ({ id, description: `الوثيقة ${id} المذكورة في الورقة` })),
    ambiguities,
    pointsSuggestion,
    source: 'local',
    confidence: analysis.pointsSum > 0 && bestMatch ? 'مرتفعة' : analysis.pointsSum > 0 ? 'متوسطة' : 'منخفضة',
  };
}
