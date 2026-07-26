'use client';

import { useEffect, useRef, useState } from 'react';
import type { Shop, Vibe, BoloItem } from '@/lib/types';
import { addCheckIn } from '@/lib/stores';
import { haptic } from '@/lib/haptics';

interface CheckInModalProps {
  shop: Shop;
  boloItems: BoloItem[];
  onClose: () => void;
  onComplete: () => void;
}

const VIBE_OPTIONS: { vibe: Vibe; emoji: string; label: string; color: string }[] = [
  { vibe: 'fire', emoji: '🔥', label: 'Fire', color: 'bg-orange-500 hover:bg-orange-600' },
  { vibe: 'mid', emoji: '😐', label: 'Mid', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { vibe: 'drop', emoji: '🗑️', label: 'Drop', color: 'bg-slate-500 hover:bg-slate-600' },
];

export default function CheckInModal({
  shop,
  boloItems,
  onClose,
  onComplete,
}: CheckInModalProps) {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const handleCheckIn = async () => {
    if (!selectedVibe) return;
    setLoading(true);
    haptic('success');

    try {
      await addCheckIn({
        shopId: shop.id,
        userId: 'user1',
        vibe: selectedVibe,
        notes: notes || undefined,
      });
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const uncheckedBolo = boloItems.filter((b) => !b.checked);

  return (
    <div className="fixed inset-0 bottom-sheet-overlay z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 bottom-sheet sm:rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center sm:hidden pb-3">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 id="checkin-title" className="text-xl font-bold text-slate-900 dark:text-white">{shop.name}</h2>
            {shop.address && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{shop.address}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close check-in"
            onClick={() => {
              haptic('light');
              onClose();
            }}
            className="min-w-11 min-h-11 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            How was the vibe?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {VIBE_OPTIONS.map((option) => (
              <button
                type="button"
                aria-pressed={selectedVibe === option.vibe}
                key={option.vibe}
                onClick={() => {
                  haptic('medium');
                  setSelectedVibe(option.vibe);
                }}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  selectedVibe === option.vibe
                    ? `${option.color} border-transparent text-white scale-105`
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="text-3xl mb-1">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedVibe === 'drop' && (
          <p className="mb-5 rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
            This will hide the shop from future recommendations. It will remain
            available in your shop list.
          </p>
        )}

        {uncheckedBolo.length > 0 && (
          <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
              🎯 BOLO - Look for:
            </p>
            <ul className="space-y-1">
              {uncheckedBolo.slice(0, 5).map((item) => (
                <li
                  key={item.id}
                  className="text-sm text-purple-800 dark:text-purple-200 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any finds, prices, thoughts..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handleCheckIn}
          disabled={!selectedVibe || loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Checking in...' : 'Check In'}
        </button>
      </div>
    </div>
  );
}
