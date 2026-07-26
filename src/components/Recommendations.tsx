'use client';

import { useState, useMemo } from 'react';
import type { Shop, ShopWithDistance, RecommendationMode } from '@/lib/types';
import { getShopsWithScore, getNearbyShops } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface RecommendationsProps {
  shops: Shop[];
  userLocation: { lat: number; lng: number } | null;
  onSelectShop: (shop: Shop) => void;
  onFindNearby: (shop: ShopWithDistance, nearby: ShopWithDistance[]) => void;
}

export default function Recommendations({
  shops,
  userLocation,
  onSelectShop,
  onFindNearby,
}: RecommendationsProps) {
  const [mode, setMode] = useState<RecommendationMode>('adventure');

  const recommendations = useMemo(() => {
    if (!userLocation) return [];
    return getShopsWithScore(shops, userLocation.lat, userLocation.lng, mode);
  }, [shops, userLocation, mode]);

  const handleFindCrawl = (shop: ShopWithDistance) => {
    if (!userLocation) return;
    const nearby = getNearbyShops(shop, shops, userLocation.lat, userLocation.lng);
    onFindNearby(shop, nearby);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Where to go?</h2>

      <div className="flex gap-2">
        <button
          onClick={() => {
            haptic('light');
            setMode('adventure');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
            mode === 'adventure'
              ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          🧭 Adventure
        </button>
        <button
          onClick={() => {
            haptic('light');
            setMode('lazy');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
            mode === 'lazy'
              ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          🛋️ Lazy
        </button>
      </div>

      {!userLocation && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Enable location for recommendations
        </p>
      )}

      <div className="space-y-3">
        {recommendations.slice(0, 10).map((shop, index) => (
          <div
            key={shop.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    #{index + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{shop.name}</h3>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {shop.distance !== undefined && (
                    <span>{shop.distance.toFixed(1)} km</span>
                  )}
                  {shop.daysSinceVisit !== undefined && (
                    <span>
                      {shop.daysSinceVisit === 9999
                        ? 'Never'
                        : `${shop.daysSinceVisit}d ago`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-3">
                <button
                  onClick={() => {
                    haptic('light');
                    onSelectShop(shop);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
                >
                  Check In
                </button>
                <button
                  onClick={() => {
                    haptic('light');
                    handleFindCrawl(shop);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Crawl
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
