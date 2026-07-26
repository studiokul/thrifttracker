'use client';

import { useState } from 'react';
import { addShop } from '@/lib/stores';

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

    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Invalid coordinates');
      return;
    }

    setLoading(true);
    setError('');

    await addShop({
      name: name.trim(),
      address: address.trim() || undefined,
      lat: latNum,
      lng: lngNum,
    });

    setLoading(false);
    onShopAdded();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
      },
      () => {
        setError('Could not get location');
      }
    );
  };

  return (
    <div className="fixed inset-0 mobile-modal-overlay z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[88dvh] overflow-y-auto safe-area-bottom">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add New Shop</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bundle Paradise"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address (optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 Main St"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude *
              </label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="3.139"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude *
              </label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="101.686"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            className="w-full py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            📍 Use Current Location
          </button>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Shop'}
          </button>
        </form>
      </div>
    </div>
  );
}
