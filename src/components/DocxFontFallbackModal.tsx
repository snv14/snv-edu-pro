import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle, FileDown, X } from 'lucide-react';
import {
  DOCX_FONT_FALLBACK_MESSAGE,
  DocxFontEmbedError,
} from '../utils/docxFontEmbed';

export interface DocxFontFallbackModalProps {
  error: DocxFontEmbedError | null;
  onConfirmFallback: () => void;
  onCancel: () => void;
  onExportPdf?: () => void;
}

export const DocxFontFallbackModal: React.FC<DocxFontFallbackModalProps> = ({
  error,
  onConfirmFallback,
  onCancel,
  onExportPdf,
}) => {
  if (!error) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px] print:hidden"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="docx-font-fallback-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="docx-font-fallback-title"
                className="text-sm font-black text-slate-900"
              >
                تعذر تضمين الخط في Word
              </h3>
              <p className="text-[11px] font-bold text-slate-500">
                الخط المختار: {error.fontName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="إلغاء"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-3 text-xs font-bold leading-relaxed text-amber-950">
          {DOCX_FONT_FALLBACK_MESSAGE}
        </p>

        <p className="mt-2.5 text-[11px] font-semibold text-slate-600">
          الخط البديل في حال المتابعة:{' '}
          <span className="font-black text-slate-800">{error.fallbackFontName}</span>
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            إلغاء
          </button>
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-black text-white hover:bg-teal-800"
            >
              <FileDown className="h-3.5 w-3.5" />
              تصدير PDF
            </button>
          )}
          <button
            type="button"
            onClick={onConfirmFallback}
            className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-black text-white hover:bg-amber-700"
          >
            متابعة بالبديل
          </button>
        </div>
      </div>
    </div>
  );
};

export function useDocxFontFallbackDialog() {
  const [pendingError, setPendingError] = useState<DocxFontEmbedError | null>(null);
  const resolverRef = useRef<((choice: 'fallback' | 'pdf' | 'cancel') => void) | null>(null);

  const askFallbackChoice = useCallback(
    (error: DocxFontEmbedError): Promise<'fallback' | 'pdf' | 'cancel'> => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setPendingError(error);
      });
    },
    []
  );

  const resolveChoice = useCallback((choice: 'fallback' | 'pdf' | 'cancel') => {
    setPendingError(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(choice);
  }, []);

  return {
    pendingError,
    askFallbackChoice,
    confirmFallback: () => resolveChoice('fallback'),
    exportPdfInstead: () => resolveChoice('pdf'),
    cancelFallback: () => resolveChoice('cancel'),
  };
}
