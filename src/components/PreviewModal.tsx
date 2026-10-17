import React, { useEffect, useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { LessonMemo, MemoConfig } from '../types';
import { MemoSheet } from './MemoSheet';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: LessonMemo | null;
  config: MemoConfig;
  activeActivities: boolean[];
  onPrint: () => void;
  onExportWord: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  lesson,
  config,
  activeActivities,
  onPrint,
  onExportWord,
}) => {
  
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && previewRef.current) {
      // Find the first memo-paper on the page (the main one)
      const original = document.getElementById('memo-paper');
      if (original) {
        // Clone the HTML
        previewRef.current.innerHTML = original.innerHTML;
        
        // Remove contentEditable from the cloned version
        const editables = previewRef.current.querySelectorAll('[contenteditable]');
        editables.forEach(el => {
          el.removeAttribute('contenteditable');
          el.removeAttribute('suppresscontenteditablewarning');
          // Also remove outline styles if they were applied directly, though they shouldn't be
          el.classList.remove('editable-cell');
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;


  return (
    <div
      id="preview-modal"
      className="print:hidden fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 z-50 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c2185b] flex items-center justify-center text-white font-bold text-[14px]">
              ط
            </div>
            <div>
              <h2 className="font-extrabold text-[16px] text-gray-900">
                معاينة المذكرة قبل الطباعة والتصدير
              </h2>
              <p className="text-[12px] text-gray-500">
                {config.level === '4am'
                  ? 'السنة الرابعة متوسط'
                  : config.level === '3am'
                  ? 'السنة الثالثة متوسط'
                  : config.level === '2am'
                  ? 'السنة الثانية متوسط'
                  : 'السنة الأولى متوسط'}{' '}
                — {lesson?.ta3alom}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="modal-btn-print"
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c2185b] text-white text-[13px] font-bold hover:bg-[#ad1457] shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              طباعة / PDF
            </button>
            <button
              id="modal-btn-word"
              type="button"
              onClick={onExportWord}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              تصدير Word
            </button>
            <button
              id="modal-btn-close"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-8 overflow-y-auto bg-gray-100 flex-1">
          <div className="shadow-lg mx-auto max-w-[900px]">
            
            <div ref={previewRef} className="bg-white text-gray-900 shadow-xl rounded-sm mx-auto p-7 md:p-9 max-w-[960px] border border-gray-300 font-sans leading-relaxed text-[13.5px]">
              {/* Cloned content will be injected here */}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
