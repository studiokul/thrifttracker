'use client';

import { ReactNode, useEffect } from 'react';
import { haptic } from '@/lib/haptics';

interface BottomSheetProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export default function BottomSheet({ children, onClose, title }: BottomSheetProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bottom-sheet-overlay" />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bottom-sheet bg-white dark:bg-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <button
                onClick={() => {
                  haptic('light');
                  onClose();
                }}
                className="p-2 -m-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-4 max-h-[70dvh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
