export interface ExpertLabBlock {
  id: string;
  type: 'experiment' | 'diagram' | 'activity' | 'image' | 'general';
  title: string;
  content: string;
  createdAt: string;
  sources?: { title: string; uri: string }[];
}

let pending: ExpertLabBlock | null = null;
let listeners: Array<(block: ExpertLabBlock | null) => void> = [];

export const setPendingExpertLabBlock = (block: ExpertLabBlock) => {
  pending = block;
  listeners.forEach(listener => listener(block));
};

export const consumePendingExpertLabBlock = () => {
  const block = pending;
  pending = null;
  return block;
};

export const subscribeExpertLab = (listener: (block: ExpertLabBlock | null) => void) => {
  listeners = [...listeners, listener];
  return () => { listeners = listeners.filter(item => item !== listener); };
};
