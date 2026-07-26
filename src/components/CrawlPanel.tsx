'use client';

import type { ShopWithDistance } from '@/lib/types';

interface CrawlPanelProps {
  primary: ShopWithDistance;
  nearby: ShopWithDistance[];
  onSelectShop: (shop: ShopWithDistance) => void;
  onClose: () => void;
}

export default function CrawlPanel({
  primary,
  nearby,
  onSelectShop,
  onClose,
}: CrawlPanelProps) {
  return (
    <div className="fixed inset-0 mobile-modal-overlay z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[88dvh] overflow-y-auto safe-area-bottom">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">🗺️ Thrift Crawl</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            Starting at <strong>{primary.name}</strong>
            {primary.distance !== undefined && (
              <span className="text-purple-600">
                {' '}
                ({primary.distance.toFixed(1)} km away)
              </span>
            )}
          </p>
        </div>

        {nearby.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No other shops within 5km
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Nearby stops to make it a crawl:
            </p>
            <div className="space-y-3">
              {nearby.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{shop.name}</h3>
                    <p className="text-sm text-gray-500">
                      {shop.distance?.toFixed(1)} km from start
                      {shop.daysSinceVisit !== undefined &&
                        shop.daysSinceVisit !== 9999 && (
                          <span> · {shop.daysSinceVisit}d ago</span>
                        )}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectShop(shop)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}
