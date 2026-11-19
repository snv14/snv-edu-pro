import { useCallback, useEffect, useState } from 'react';

export type PageTemplate = 'word' | 'classic' | 'plain';

export const PAGE_TEMPLATE_STORAGE_KEY = 'page_template_v1';
export const PAGE_TEMPLATE_UPDATED_EVENT = 'page-template-updated';

export const PAGE_TEMPLATE_OPTIONS: ReadonlyArray<{ value: PageTemplate; label: string }> = [
  { value: 'word', label: 'صفحة Word' },
  { value: 'classic', label: 'كلاسيكي' },
  { value: 'plain', label: 'سادة (طباعة)' },
];

export function isValidPageTemplate(value: unknown): value is PageTemplate {
  return value === 'word' || value === 'classic' || value === 'plain';
}

export function loadPageTemplate(): PageTemplate {
  try {
    if (typeof localStorage === 'undefined') return 'word';
    const stored = localStorage.getItem(PAGE_TEMPLATE_STORAGE_KEY);
    return isValidPageTemplate(stored) ? stored : 'word';
  } catch {
    return 'word';
  }
}

export function applyPageTemplateToDom(template: PageTemplate): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.pageTemplate = template;
}

if (typeof document !== 'undefined') {
  applyPageTemplateToDom(loadPageTemplate());
}

export function usePageTemplate(): {
  template: PageTemplate;
  setTemplate: (next: PageTemplate) => void;
} {
  const [template, setTemplateState] = useState<PageTemplate>(() => loadPageTemplate());

  useEffect(() => {
    applyPageTemplateToDom(template);
  }, [template]);

  useEffect(() => {
    const onCustomUpdate = (event: Event) => {
      const detail = (event as CustomEvent<PageTemplate>).detail;
      if (isValidPageTemplate(detail)) {
        setTemplateState(detail);
        applyPageTemplateToDom(detail);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === PAGE_TEMPLATE_STORAGE_KEY) {
        const next = isValidPageTemplate(event.newValue) ? event.newValue : 'word';
        setTemplateState(next);
        applyPageTemplateToDom(next);
      }
    };

    window.addEventListener(PAGE_TEMPLATE_UPDATED_EVENT, onCustomUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PAGE_TEMPLATE_UPDATED_EVENT, onCustomUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setTemplate = useCallback((next: PageTemplate) => {
    const safeNext: PageTemplate = isValidPageTemplate(next) ? next : 'word';
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PAGE_TEMPLATE_STORAGE_KEY, safeNext);
      }
    } catch {
      // ignore storage quota errors
    }
    applyPageTemplateToDom(safeNext);
    setTemplateState(safeNext);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PAGE_TEMPLATE_UPDATED_EVENT, { detail: safeNext }));
    }
  }, []);

  return { template, setTemplate };
}
