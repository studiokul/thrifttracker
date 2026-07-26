'use client';

import { useState, useEffect } from 'react';
import { getStats } from '@/lib/stores';

interface Stats {
  totalShops: number;
  totalCheckIns: number;
  droppedShops: number;
  fireShops: number;
  topShop: string | null;
  avgVisitGap: number;
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Shops', value: stats.totalShops, icon: '🏪' },
    { label: 'Check-ins', value: stats.totalCheckIns, icon: '📍' },
    { label: 'Dropped', value: stats.droppedShops, icon: '🗑️' },
    { label: 'Fire Ratings', value: stats.fireShops, icon: '🔥' },
    { label: 'Avg Gap', value: `${stats.avgVisitGap}d`, icon: '📅' },
    { label: 'Top Shop', value: stats.topShop || '—', icon: '⭐', small: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{card.icon}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{card.label}</span>
          </div>
          <p
            className={`font-bold text-slate-900 dark:text-white ${
              card.small ? 'text-sm' : 'text-xl'
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
