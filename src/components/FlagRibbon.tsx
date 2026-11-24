import React from 'react';

export const FlagRibbon: React.FC<{ className?: string }> = ({ className = 'h-1' }) => (
  <div className={`w-full flex shrink-0 no-print print:hidden ${className}`} aria-hidden="true">
    <div className="flex-1 bg-[#006233]" />
    <div className="flex-1 bg-white" />
    <div className="flex-1 bg-[#D21034]" />
  </div>
);
