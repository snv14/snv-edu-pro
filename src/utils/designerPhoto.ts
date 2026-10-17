import defaultPortrait from '../assets/images/designer_portrait_1790463396414.jpg';

/**
 * الصورة الثابتة الأصلية لمصمم ومطور المنصة الأستاذ بغداد الطيب
 * يتم حفظها كمتغير ثابت لضمان بقائها دائمة وبجودتها الأصلية الكاملة
 */
export const FIXED_DESIGNER_PHOTO: string = defaultPortrait;
export const DESIGNER_PHOTO: string = defaultPortrait;
export const DESIGNER_NAME: string = 'الأستاذ بغداد الطيب';
export const DESIGNER_TITLE: string = 'تصميم وتطوير المنصة';

const STORAGE_KEY = 'algeria_sciences_designer_photo_v1';

export function getDesignerPhoto(): string {
  try {
    const customPhoto = localStorage.getItem(STORAGE_KEY);
    if (customPhoto && customPhoto.startsWith('data:image/') && customPhoto.length > 100) {
      return customPhoto;
    }
  } catch {
    // ignore
  }
  return FIXED_DESIGNER_PHOTO;
}

export function saveDesignerPhoto(dataUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    window.dispatchEvent(new CustomEvent('designer-photo-updated', { detail: dataUrl }));
  } catch (err) {
    console.error('Failed to save designer photo:', err);
  }
}

export function resetDesignerPhoto(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('designer-photo-updated', { detail: DESIGNER_PHOTO }));
  } catch {
    // ignore
  }
}

