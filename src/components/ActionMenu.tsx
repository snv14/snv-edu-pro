import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  PAGE_TEMPLATE_OPTIONS,
  type PageTemplate,
  usePageTemplate,
} from '../hooks/usePageTemplate';

export interface ActionMenuItem {
  id?: string;
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  title?: string;
}

export const PageTemplateSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { template, setTemplate } = usePageTemplate();
  return (
    <label
      className={`no-print print:hidden inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-slate-800 shadow-2xs ${className}`}
    >
      <span className="text-slate-600 whitespace-nowrap">نمط الصفحة:</span>
      <select
        aria-label="نمط الصفحة"
        data-page-template-select="true"
        value={template}
        onChange={(e) => setTemplate(e.target.value as PageTemplate)}
        className="bg-transparent font-extrabold text-slate-900 outline-none cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        {PAGE_TEMPLATE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
};

/** Groups secondary actions without changing their handlers. Native details keeps keyboard access. */
export const ActionMenu: React.FC<{ label: string; items: ActionMenuItem[] }> = ({ label, items }) => {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (details.current && !details.current.contains(event.target as Node)) details.current.open = false;
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && details.current?.open) {
        details.current.open = false;
        details.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('click', onOutsideClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <details ref={details} className="relative no-print print:hidden">
      <summary className="list-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-900 text-xs font-bold shadow-xs cursor-pointer hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden">
        {label}<ChevronDown className="w-4 h-4" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] max-w-[90vw] rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
        {items.map((item) => (
          <button key={item.label} id={item.id} type="button" title={item.title} onClick={() => {
            if (details.current) details.current.open = false;
            item.onSelect();
          }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700 cursor-pointer">
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
      </div>
    </details>
  );
};
