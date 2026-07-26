'use client';

import type { ShopWithDistance } from '@/lib/types';
import { haptic } from '@/lib/haptics';

interface CrawlPanelProps {
  primary: ShopWithDistance;
  nearby: ShopWithDistance[];
  onSelectShop: (shop: ShopWithDistance) => void;
  onShare?: () => void;
  onClose: () => void;
}

export default function CrawlPanel({
  primary,
  nearby,
  onSelectShop,
  onShare,
  onClose,
}: CrawlPanelProps) {
  return (
    <div className="fixed inset-0 bottom-sheet-overlay z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 bottom-sheet sm:rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center sm:hidden pb-3">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">🗺️ Thrift Crawl</h2>
          <button
            onClick={() => {
              haptic('light');
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Starting at <strong>{primary.name}</strong>
            {primary.distance !== undefined && (
              <span className="text-purple-600 dark:text-purple-300">
                {' '}
                ({primary.distance.toFixed(1)} km away)
              </span>
            )}
          </p>
        </div>

        {nearby.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No other shops within 5km
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Nearby stops to make it a crawl:
            </p>
            <div className="space-y-3">
              {nearby.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl"
                >
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{shop.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {shop.distance?.toFixed(1)} km from start
                      {shop.daysSinceVisit !== undefined &&
                        shop.daysSinceVisit !== 9999 && (
                          <span> · {shop.daysSinceVisit}d ago</span>
                        )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      haptic('light');
                      onSelectShop(shop);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 mt-4">
          {onShare && nearby.length > 0 && (
            <button
              onClick={() => {
                haptic('light');
                onShare();
              }}
              className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Maps
            </button>
          )}
          <button
            onClick={() => {
              haptic('light');
              onClose();
            }}
            className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
