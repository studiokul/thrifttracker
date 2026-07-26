'use client';

import { useState } from 'react';
import type { BoloItem } from '@/lib/types';
import {
  addBoloItem,
  toggleBoloItem,
  deleteBoloItem,
} from '@/lib/stores';

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
    await addBoloItem(newItem.trim());
    setNewItem('');
    setLoading(false);
    onUpdate();
  };

  const handleToggle = async (id: string, checked: boolean) => {
    await toggleBoloItem(id, !checked);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await deleteBoloItem(id);
    onUpdate();
  };

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">🎯 BOLO Wishlist</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add item to hunt for..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newItem.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {uncheckedItems.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No items on your list yet
        </p>
      )}

      <div className="space-y-2">
        {uncheckedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
          >
            <button
              onClick={() => handleToggle(item.id, item.checked)}
              className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 hover:border-blue-500"
            />
            <span className="flex-1 text-sm text-gray-800">{item.text}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-gray-400 hover:text-red-500 text-sm"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {checkedItems.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Completed ({checkedItems.length})
          </summary>
          <div className="space-y-2 mt-2">
            {checkedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <button
                  onClick={() => handleToggle(item.id, item.checked)}
                  className="w-5 h-5 border-2 border-blue-500 bg-blue-500 rounded flex-shrink-0 flex items-center justify-center"
                >
                  <span className="text-white text-xs">✓</span>
                </button>
                <span className="flex-1 text-sm text-gray-500 line-through">
                  {item.text}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
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
