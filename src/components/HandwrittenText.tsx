import React from 'react';
import {
  HandwritingStyleSettings,
  PEN_ROLE_META,
  PenRole,
  applyPenColorToSelection,
  clearPenFormattingInSelection,
  formatSemanticHtml,
} from '../services/handwritingStyle';

interface HandwrittenTextProps {
  text?: string | null;
  settings: HandwritingStyleSettings;
  active?: boolean;
  defaultRole?: PenRole;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'span' | 'p';
  editable?: boolean;
}

export const HandwrittenText: React.FC<HandwrittenTextProps> = ({
  text,
  settings,
  active = true,
  defaultRole = 'bodyBlack',
  className = '',
  style,
  as = 'span',
  editable = false,
}) => {
  const safeText = String(text ?? '');
  const html = React.useMemo(
    () =>
      active && settings.enabled
        ? formatSemanticHtml(safeText, settings, { defaultRole, allowUTags: false })
        : formatSemanticHtml(safeText, { ...settings, enabled: false }, { defaultRole, allowUTags: false }),
    [safeText, settings, active, defaultRole]
  );

  const Tag = as;
  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    const plain = e.clipboardData?.getData('text/plain') || '';
    if (typeof document.execCommand === 'function') {
      document.execCommand('insertText', false, plain);
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(plain));
        range.collapse(false);
      }
    }
  };
  const editableProps = editable
    ? { contentEditable: 'plaintext-only' as const, suppressContentEditableWarning: true, onPaste: handlePaste }
    : {};

  return (
    <Tag
      className={className}
      style={style}
      {...editableProps}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface SelectionPenStripProps {
  settings: HandwritingStyleSettings;
  onNotify?: (msg: string) => void;
  onOpenCustomizer?: () => void;
  compact?: boolean;
}

const ROLES: PenRole[] = ['titleBlue', 'subRed', 'defGreen', 'bodyBlack', 'termPurple', 'noteOrange'];

export const SelectionPenStrip: React.FC<SelectionPenStripProps> = ({
  settings,
  onNotify,
  onOpenCustomizer,
  compact = false,
}) => {
  const handlePen = (role: PenRole) => {
    const ok = applyPenColorToSelection(role, settings.palette, role === 'titleBlue' || role === 'subRed');
    if (ok) {
      onNotify?.(`تم تلوين النص المحدد بقلم: ${PEN_ROLE_META[role].shortLabel}`);
    } else {
      onNotify?.('ظلّل كلمة أو جملة أولاً لتلوينها بالقلم المختار');
    }
  };

  const handleClear = () => {
    const ok = clearPenFormattingInSelection();
    if (ok) onNotify?.('تمت إزالة التلوين عن النص المحدد');
    else onNotify?.('ظلّل النص المراد مسح تلوينه أولاً');
  };

  return (
    <div
      className={`no-print inline-flex flex-wrap items-center gap-1 bg-white/95 border border-slate-200 rounded-xl shadow-2xs ${
        compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
      }`}
      dir="rtl"
    >
      <span className="text-[10.5px] font-bold text-slate-600 ml-1">أقلام التحديد:</span>
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handlePen(role)}
          title={`تلوين النص المحدد بـ ${PEN_ROLE_META[role].label}`}
          className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: settings.palette[role] }}
          aria-label={PEN_ROLE_META[role].label}
        />
      ))}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClear}
        title="إرجاع النص المحدد للتنسيق العادي"
        className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
      >
        مسح
      </button>
      {onOpenCustomizer && (
        <button
          type="button"
          onClick={onOpenCustomizer}
          className="mr-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10.5px] font-extrabold cursor-pointer"
        >
          تخصيص الخط والأقلام
        </button>
      )}
    </div>
  );
};
