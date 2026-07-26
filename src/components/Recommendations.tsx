'use client';

import { useState, useMemo } from 'react';
import type { Shop, ShopWithDistance, RecommendationMode } from '@/lib/types';
import { getShopsWithScore, getNearbyShops } from '@/lib/utils';

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Where to go?</h2>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('adventure')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            mode === 'adventure'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🧭 Adventure
        </button>
        <button
          onClick={() => setMode('lazy')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            mode === 'lazy'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🛋️ Lazy
        </button>
      </div>

      {!userLocation && (
        <p className="text-sm text-gray-500 text-center py-4">
          Enable location for recommendations
        </p>
      )}

      <div className="space-y-3">
        {recommendations.slice(0, 10).map((shop, index) => (
          <div
            key={shop.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
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
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectShop(shop)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Check In
                </button>
                <button
                  onClick={() => handleFindCrawl(shop)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
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
