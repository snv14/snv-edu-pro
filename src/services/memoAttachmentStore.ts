import localforage from 'localforage';

export interface MemoAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  source: 'file' | 'paste';
  category?: 'exam' | 'curriculum' | 'companion' | 'teacher-guide' | 'memo';
  createdAt: number;
}

const STORE = localforage.createInstance({
  name: 'snv-edu-pro',
  storeName: 'memo_attachments',
});

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_BYTES = 24 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

function extensionForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
  };
  return map[mime] || 'bin';
}

export function validateMemoAttachment(file: File): void {
  const normalizedType = file.type || (() => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', txt: 'text/plain' } as Record<string,string>)[ext] || '';
  })();
  if (!ALLOWED_ATTACHMENT_TYPES.has(normalizedType)) {
    throw new Error('نوع الملف غير مسموح. المدعوم: JPG/PNG/WEBP/GIF/PDF/TXT.');
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('حجم الملف يتجاوز 15MB.');
  }
}

export async function fileToMemoAttachment(file: File, source: 'file' | 'paste' = 'file'): Promise<MemoAttachment> {
  validateMemoAttachment(file);
  const normalizedType = file.type || (() => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', txt: 'text/plain' } as Record<string,string>)[ext] || '';
  })();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الملف.'));
    reader.readAsDataURL(file);
  });

  const safeBase = (file.name || 'مرفق').replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(0, 100) || 'مرفق';
  const name = safeBase.includes('.') ? safeBase : `${safeBase}.${extensionForMime(normalizedType)}`;

  return {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    name,
    mimeType: normalizedType,
    size: file.size,
    dataUrl,
    source,
    createdAt: Date.now(),
  };
}

export async function saveMemoAttachment(attachment: MemoAttachment): Promise<void> {
  const all = await listMemoAttachments();
  const total = all.filter(a => a.id !== attachment.id).reduce((sum, a) => sum + a.size, 0);
  if (total + attachment.size > MAX_TOTAL_ATTACHMENT_BYTES) {
    throw new Error('المساحة المحلية للمرفقات ممتلئة. احذف مرفقًا قديمًا ثم أعد المحاولة.');
  }
  await STORE.setItem(attachment.id, attachment);
}

export async function listMemoSourceDocuments(): Promise<MemoAttachment[]> {
  const all = await listMemoAttachments();
  return all.filter(item => item.category && item.category !== 'exam');
}

export async function listMemoAttachments(): Promise<MemoAttachment[]> {
  const result: MemoAttachment[] = [];
  await STORE.iterate<MemoAttachment, void>((value) => {
    if (value && typeof value.id === 'string') result.push(value);
  });
  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMemoAttachment(id: string): Promise<MemoAttachment | null> {
  return STORE.getItem<MemoAttachment>(id);
}

export async function deleteMemoAttachment(id: string): Promise<void> {
  await STORE.removeItem(id);
}
