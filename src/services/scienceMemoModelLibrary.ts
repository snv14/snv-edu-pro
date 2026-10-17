import library from '../../data/scienceMemoModelLibrary.json';

export type MemoModelStatus = 'referenceModel' | 'officialSource' | 'aiSuggestion';
export interface ScienceMemoModel {
  id: string; level: '1AM'|'2AM'|'3AM'|'4AM'; domain: string; type: string; title: string;
  status: MemoModelStatus; sections: string[]; note?: string;
}

export const getScienceMemoModels = (level?: ScienceMemoModel['level']) => {
  const models = library.templates as ScienceMemoModel[];
  return level ? models.filter(model => model.level === level) : models;
};

export const getScienceMemoModel = (id: string) => getScienceMemoModels().find(model => model.id === id) || null;

export const getMemoModelStatusLabel = (status: MemoModelStatus) => ({
  officialSource: 'مصدر رسمي', referenceModel: 'نموذج استرشادي', aiSuggestion: 'اقتراح AI — يحتاج مراجعة الأستاذ',
}[status]);
