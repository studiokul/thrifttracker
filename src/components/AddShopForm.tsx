'use client';

import { useState } from 'react';
import { addShop } from '@/lib/stores';
import { haptic } from '@/lib/haptics';
import BottomSheet from './BottomSheet';

interface AddShopFormProps {
  onClose: () => void;
  onShopAdded: () => void;
  initialLocation?: { lat: number; lng: number };
}

export default function AddShopForm({
  onClose,
  onShopAdded,
  initialLocation,
}: AddShopFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(initialLocation?.lat?.toString() || '');
  const [lng, setLng] = useState(initialLocation?.lng?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lat || !lng) {
      setError('Name and coordinates are required');
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (
      isNaN(latNum) ||
      isNaN(lngNum) ||
      Math.abs(latNum) > 90 ||
      Math.abs(lngNum) > 180
    ) {
      setError('Invalid coordinates');
      return;
    }

    setLoading(true);
    setError('');
    haptic('medium');

    try {
      await addShop({
        name: name.trim(),
        address: address.trim() || undefined,
        lat: latNum,
        lng: lngNum,
        source: 'manual',
      });
      haptic('success');
      onShopAdded();
    } catch (nextError) {
      haptic('error');
      setError(nextError instanceof Error ? nextError.message : 'Could not add shop');
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    haptic('light');
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
        haptic('success');
      },
      () => {
        setError('Could not get location');
        haptic('error');
      }
    );
  };

  return (
    <BottomSheet onClose={onClose} title="Add New Shop">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Shop Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bundle Paradise"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Address (optional)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., 123 Main St"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Latitude *
            </label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="3.139"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Longitude *
            </label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="101.686"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          className="w-full py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          📍 Use Current Location
        </button>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Adding...' : 'Add Shop'}
        </button>
      </form>
    </BottomSheet>
  );
}
