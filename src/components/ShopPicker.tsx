'use client';

import { useMemo, useState } from 'react';
import type { Shop } from '@/lib/types';
import { getDistance } from '@/lib/utils';
import BottomSheet from './BottomSheet';

interface ShopPickerProps {
  shops: Shop[];
  userLocation: { lat: number; lng: number } | null;
  onSelect: (shop: Shop) => void;
  onClose: () => void;
}

export default function ShopPicker({
  shops,
  userLocation,
  onSelect,
  onClose,
}: ShopPickerProps) {
  const [search, setSearch] = useState('');

  const options = useMemo(() => {
    const query = search.trim().toLowerCase();
    return shops
      .filter((shop) => !shop.dropped)
      .filter(
        (shop) =>
          !query ||
          shop.name.toLowerCase().includes(query) ||
          shop.address?.toLowerCase().includes(query)
      )
      .map((shop) => ({
        shop,
        distance: userLocation
          ? getDistance(userLocation.lat, userLocation.lng, shop.lat, shop.lng)
          : null,
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, 30);
  }, [search, shops, userLocation]);

  return (
    <BottomSheet title="Choose a shop" onClose={onClose}>
      <div className="space-y-3">
        <label className="sr-only" htmlFor="shop-search">
          Search shops
        </label>
        <input
          id="shop-search"
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by shop or area"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <div className="space-y-2">
          {options.map(({ shop, distance }) => (
            <button
              key={shop.id}
              type="button"
              onClick={() => onSelect(shop)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-left transition hover:border-teal-600 active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="block font-semibold text-stone-950 dark:text-white">
                {shop.name}
              </span>
              <span className="mt-1 block text-sm text-stone-500 dark:text-slate-400">
                {distance !== null ? `${distance.toFixed(1)} km away` : shop.address}
              </span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
