/**
 * أدوات DOM مشتركة بين مصدّرات PDF وWord.
 * كانت هذه الدوال منسوخة في ستة ملفات تصدير، فجُمعت هنا مرة واحدة.
 */

/** 1×1 transparent PNG used whenever an image cannot be rasterized. */
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = typeof atob === 'function'
    ? atob(base64)
    : typeof window !== 'undefined' && typeof window.atob === 'function'
    ? window.atob(base64)
    : typeof Buffer !== 'undefined'
    ? Buffer.from(base64, 'base64').toString('binary')
    : '';
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

export const FALLBACK_1X1_PNG: Uint8Array = base64ToUint8Array(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
);

/** Waits for every <img> inside the root to settle (2.5s guard per image). */
export const waitForImages = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.complete) return;
      await new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
        setTimeout(() => resolve(), 2500);
      });
    })
  );
};
