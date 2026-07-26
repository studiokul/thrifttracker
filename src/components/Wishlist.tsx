'use client';

import { useState } from 'react';
import type { BoloItem } from '@/lib/types';
import { addBoloItem, toggleBoloItem, deleteBoloItem } from '@/lib/stores';
import { haptic } from '@/lib/haptics';

interface WishlistProps {
  items: BoloItem[];
  onUpdate: () => void;
}

export default function Wishlist({ items, onUpdate }: WishlistProps) {
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setLoading(true);
    haptic('light');
    await addBoloItem(newItem.trim());
    setNewItem('');
    setLoading(false);
    onUpdate();
  };

  const handleToggle = async (id: string, checked: boolean) => {
    haptic('light');
    await toggleBoloItem(id, !checked);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    haptic('light');
    await deleteBoloItem(id);
    onUpdate();
  };

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">🎯 BOLO Wishlist</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add item to hunt for..."
          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newItem.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {uncheckedItems.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          No items on your list yet
        </p>
      )}

      <div className="space-y-2">
        {uncheckedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <button
              onClick={() => handleToggle(item.id, item.checked)}
              className="w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded flex-shrink-0 hover:border-blue-500 transition-colors"
            />
            <span className="flex-1 text-sm text-slate-800 dark:text-slate-100">{item.text}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-slate-400 hover:text-red-500 text-sm p-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {checkedItems.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
            Completed ({checkedItems.length})
          </summary>
          <div className="space-y-2 mt-2">
            {checkedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <button
                  onClick={() => handleToggle(item.id, item.checked)}
                  className="w-5 h-5 border-2 border-blue-500 bg-blue-500 rounded flex-shrink-0 flex items-center justify-center"
                >
                  <span className="text-white text-xs">✓</span>
                </button>
                <span className="flex-1 text-sm text-slate-500 dark:text-slate-400 line-through">
                  {item.text}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-slate-400 hover:text-red-500 text-sm p-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
