'use client';

import { useState } from 'react';
import type { Shop } from '@/lib/types';
import { daysSince } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { updateShop } from '@/lib/stores';

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
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Shops</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search shops..."
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <div className="space-y-2">
        {filteredShops.map((shop) => {
          const days = daysSince(shop.lastVisit);
          let statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
          if (shop.dropped) statusColor = 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
          else if (days < 7) statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
          else if (days < 30) statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';

          return (
            <div
              key={shop.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 dark:text-white truncate">
                  {shop.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}
                  >
                    {shop.dropped
                      ? 'Dropped'
                      : days === 0
                      ? 'Today'
                      : days === 9999
                      ? 'Never'
                      : `${days}d ago`}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {shop.visitCount} visit{shop.visitCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-3">
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
                  aria-label={
                    shop.dropped
                      ? `Reactivate ${shop.name}`
                      : `Archive ${shop.name}`
                  }
                  onClick={async () => {
                    if (shop.dropped) {
                      haptic('light');
                      await updateShop(shop.id, { dropped: false });
                      return;
                    }
                    if (
                      confirm(
                        `Archive "${shop.name}"? Its visit history will be preserved.`
                      )
                    ) {
                      haptic('light');
                      onDeleteShop(shop.id);
                    }
                  }}
                  className={`min-h-11 px-2 py-1.5 text-sm ${
                    shop.dropped
                      ? 'font-bold text-teal-700 dark:text-teal-400'
                      : 'text-slate-400 hover:text-red-500'
                  }`}
                >
                  {shop.dropped ? 'Restore' : 'Archive'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
