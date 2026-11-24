const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><rect width="160" height="100" rx="8" fill="#f1f5f4"/><g fill="none" stroke="#94a3a0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="58" y="30" width="44" height="34" rx="4"/><circle cx="70" cy="41" r="4"/><path d="M60 60l12-11 9 8 7-6 12 11"/></g></svg>`;

export const IMAGE_PLACEHOLDER_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

/**
 * Some archive media referenced by the curriculum data is not shipped with the
 * repository. Swap any image that fails to load for a neutral placeholder so
 * cards never show the browser's broken-image icon.
 */
export function installImageFallback(root: Document = document): () => void {
  const handleError = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (target.dataset.fallbackApplied === 'true') return;
    target.dataset.fallbackApplied = 'true';
    target.dataset.missingSrc = target.getAttribute('src') ?? '';
    target.removeAttribute('srcset');
    target.src = IMAGE_PLACEHOLDER_SRC;
  };

  root.addEventListener('error', handleError, true);
  return () => root.removeEventListener('error', handleError, true);
}
