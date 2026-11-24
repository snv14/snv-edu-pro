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
      className={`no-print print:hidden inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8e5] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#0b1f1c] shadow-[0_1px_2px_rgba(11,31,28,0.04)] ${className}`}
    >
      <span className="text-[#6b7d78] whitespace-nowrap">نمط الصفحة:</span>
      <select
        aria-label="نمط الصفحة"
        data-page-template-select="true"
        value={template}
        onChange={(e) => setTemplate(e.target.value as PageTemplate)}
        className="bg-transparent font-extrabold text-[#0b1f1c] outline-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0e7a68]"
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
export const ActionMenu: React.FC<{ label: string; compactLabel?: string; items: ActionMenuItem[]; triggerIcon?: React.ReactNode }> = ({ label, compactLabel, items, triggerIcon }) => {
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
      {triggerIcon ? (
        <summary
          aria-label={label}
          title={label}
          className="list-none flex items-center justify-center w-8 h-8 rounded-full border border-[#cfe3dc] bg-white text-zinc-600 shadow-[0_1px_2px_rgba(11,31,28,0.04)] cursor-pointer hover:bg-[#eef5f2] hover:text-[#064e3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e7a68] [&::-webkit-details-marker]:hidden"
        >
          {triggerIcon}
        </summary>
      ) : (
      <summary className="list-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#cfe3dc] bg-white text-[#0a5f51] text-xs font-bold shadow-[0_1px_2px_rgba(11,31,28,0.04)] cursor-pointer hover:bg-[#eef5f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e7a68] [&::-webkit-details-marker]:hidden">
        {compactLabel && compactLabel !== label ? (
          <>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{compactLabel}</span>
          </>
        ) : (
          label
        )}
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </summary>
      )}
      <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] max-w-[90vw] rounded-xl border border-[#e2e8e5] bg-white p-1 shadow-xl">
        {items.map((item) => (
          <button key={item.label} id={item.id} type="button" title={item.title} onClick={() => {
            if (details.current) details.current.open = false;
            item.onSelect();
          }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-bold text-[#334842] hover:bg-[#eef5f2] hover:text-[#0a5f51] focus-visible:outline-2 focus-visible:outline-[#0e7a68] cursor-pointer">
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
      </div>
    </details>
  );
};
