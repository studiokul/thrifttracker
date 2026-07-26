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

  const featured = recommendations[0];
  const alternatives = recommendations.slice(1, 4);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Where should we go?
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {mode === 'adventure'
            ? 'Prioritises places you have not visited in a while.'
            : 'Prioritises the shortest trip from your current position.'}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            haptic('light');
            setMode('adventure');
          }}
          className={`flex-1 min-h-11 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
            mode === 'adventure'
              ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Adventure
        </button>
        <button
          onClick={() => {
            haptic('light');
            setMode('lazy');
          }}
          className={`flex-1 min-h-11 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
            mode === 'lazy'
              ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Nearby
        </button>
      </div>

      {!userLocation && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Enable location for recommendations
        </p>
      )}

      {featured && (
        <article className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:border-teal-900 dark:bg-slate-800">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-teal-700 dark:text-teal-400">
            BEST MATCH
          </p>
          <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 dark:text-white">
            {featured.name}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {featured.daysSinceVisit === 9999
              ? 'Never visited'
              : `${featured.daysSinceVisit} days since last visit`}
            {featured.distance !== undefined &&
              ` · ${featured.distance.toFixed(1)} km away`}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                haptic('light');
                onSelectShop(featured);
              }}
              className="min-h-12 rounded-xl bg-teal-700 px-3 font-bold text-white hover:bg-teal-800"
            >
              Check in
            </button>
            <button
              type="button"
              onClick={() => {
                haptic('light');
                handleFindCrawl(featured);
              }}
              className="min-h-12 rounded-xl border border-slate-300 px-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Build a crawl
            </button>
          </div>
        </article>
      )}

      {alternatives.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold tracking-[0.12em] text-slate-500">
            OTHER GOOD OPTIONS
          </h3>
          {alternatives.map((shop) => (
          <div
            key={shop.id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold leading-snug text-slate-900 dark:text-white">
                  {shop.name}
                </h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {shop.distance?.toFixed(1)} km
                  {' · '}
                  {shop.daysSinceVisit === 9999
                    ? 'Never visited'
                    : `${shop.daysSinceVisit}d ago`}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Check in at ${shop.name}`}
                onClick={() => onSelectShop(shop)}
                className="min-h-11 shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Check in
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
