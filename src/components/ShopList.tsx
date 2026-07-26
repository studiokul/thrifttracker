'use client';

import { useState } from 'react';
import type { Shop } from '@/lib/types';
import { daysSince } from '@/lib/utils';

interface ShopListProps {
  shops: Shop[];
  onSelectShop: (shop: Shop) => void;
  onDeleteShop: (id: string) => void;
}

export default function ShopList({
  shops,
  onSelectShop,
  onDeleteShop,
}: ShopListProps) {
  const [search, setSearch] = useState('');

  const filteredShops = shops.filter(
    (shop) =>
      shop.name.toLowerCase().includes(search.toLowerCase()) ||
      shop.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">All Shops</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search shops..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <div className="space-y-2">
        {filteredShops.map((shop) => {
          const days = daysSince(shop.lastVisit);
          let statusColor = 'bg-green-100 text-green-800';
          if (shop.dropped) statusColor = 'bg-gray-100 text-gray-500';
          else if (days < 7) statusColor = 'bg-red-100 text-red-800';
          else if (days < 30) statusColor = 'bg-yellow-100 text-yellow-800';

          return (
            <div
              key={shop.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {shop.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}
                  >
                    {shop.dropped
                      ? 'Dropped'
                      : days === 0
                      ? 'Today'
                      : days === 9999
                      ? 'Never'
                      : `${days}d ago`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {shop.visitCount} visit{shop.visitCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => onSelectShop(shop)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Check In
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${shop.name}"?`)) {
                      onDeleteShop(shop.id);
                    }
                  }}
                  className="px-2 py-1.5 text-gray-400 hover:text-red-500 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
