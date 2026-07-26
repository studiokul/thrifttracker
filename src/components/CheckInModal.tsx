'use client';

import { useState } from 'react';
import type { Shop, Vibe, BoloItem } from '@/lib/types';
import { addCheckIn } from '@/lib/stores';

interface CheckInModalProps {
  shop: Shop;
  boloItems: BoloItem[];
  onClose: () => void;
  onComplete: () => void;
}

const VIBE_OPTIONS: { vibe: Vibe; emoji: string; label: string; color: string }[] = [
  { vibe: 'fire', emoji: '🔥', label: 'Fire', color: 'bg-orange-500 hover:bg-orange-600' },
  { vibe: 'mid', emoji: '😐', label: 'Mid', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { vibe: 'drop', emoji: '🗑️', label: 'Drop', color: 'bg-gray-500 hover:bg-gray-600' },
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

  const handleCheckIn = async () => {
    if (!selectedVibe) return;
    setLoading(true);

    await addCheckIn({
      shopId: shop.id,
      userId: 'user1', // Single user for now
      vibe: selectedVibe,
      notes: notes || undefined,
    });

    setLoading(false);
    onComplete();
  };

  const uncheckedBolo = boloItems.filter((b) => !b.checked);

  return (
    <div className="fixed inset-0 mobile-modal-overlay z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[88dvh] overflow-y-auto safe-area-bottom">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{shop.name}</h2>
            {shop.address && (
              <p className="text-sm text-gray-500">{shop.address}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            How was the vibe?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {VIBE_OPTIONS.map((option) => (
              <button
                key={option.vibe}
                onClick={() => setSelectedVibe(option.vibe)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  selectedVibe === option.vibe
                    ? `${option.color} border-transparent text-white`
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="text-3xl mb-1">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {uncheckedBolo.length > 0 && (
          <div className="mb-6 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs font-medium text-purple-700 mb-2">
              🎯 BOLO - Look for:
            </p>
            <ul className="space-y-1">
              {uncheckedBolo.slice(0, 5).map((item) => (
                <li
                  key={item.id}
                  className="text-sm text-purple-800 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any finds, prices, thoughts..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={2}
          />
        </div>

        <button
          onClick={handleCheckIn}
          disabled={!selectedVibe || loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Checking in...' : 'Check In'}
        </button>
      </div>
    </div>
  );
}
