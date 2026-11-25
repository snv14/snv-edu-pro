import React from 'react';
import { BookOpen, BookOpenCheck, CalendarDays, FileText, Layers } from 'lucide-react';

export type YearSubTab = 'memos' | 'source' | 'plans' | 'guide' | 'distribution';
export const YEAR_SECTION_TABS = [
  { id: 'memos', label: 'المذكرات', icon: FileText },
  { id: 'source', label: 'المحتوى المصدري', icon: BookOpen },
  { id: 'plans', label: 'المخططات', icon: Layers },
  { id: 'guide', label: 'دليل الأستاذ', icon: BookOpenCheck },
  { id: 'distribution', label: 'التدرج السنوي', icon: CalendarDays },
] as const;

interface Props {
  activeTab: YearSubTab;
  onChange: (tab: YearSubTab) => void;
  activeClassName: string;
  mobile?: boolean;
}

/** نفس الأقسام لكل السنوات، على الحاسوب والهاتف، دون إخفاء الدليل داخل المحتوى. */
export function YearSectionTabs({ activeTab, onChange, activeClassName, mobile = false }: Props) {
  return <nav aria-label={mobile ? 'أقسام السنة — الهاتف' : 'أقسام السنة'} className={mobile
    ? 'xl:hidden px-3 pb-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#eef2f0] pt-2'
    : 'hidden xl:flex items-center snv-segmented min-w-0 overflow-x-auto'}>
    {YEAR_SECTION_TABS.map(({ id, label, icon: Icon }) => <button
      key={id} type="button" id={`year-subtab-${id}${mobile ? '-mobile' : ''}`}
      aria-pressed={activeTab === id} onClick={() => onChange(id)}
      className={`flex items-center gap-1.5 px-3 ${mobile ? 'py-1.5 text-xs' : 'py-1 text-[12px]'} rounded-lg font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${activeTab === id
        ? activeClassName : mobile ? 'bg-white border border-[#e2e8e5] text-[#5c6f6a]' : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'}`}>
      <Icon className="w-3.5 h-3.5" /><span>{label}</span>
    </button>)}
  </nav>;
}
