'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Shop, ShopWithDistance, BoloItem } from '@/lib/types';
import { getShops, getBoloItems, deleteShop } from '@/lib/stores';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

import CheckInModal from '@/components/CheckInModal';
import Recommendations from '@/components/Recommendations';
import Wishlist from '@/components/Wishlist';
import ShopList from '@/components/ShopList';
import AddShopForm from '@/components/AddShopForm';
import CsvImport from '@/components/CsvImport';
import CrawlPanel from '@/components/CrawlPanel';

type Tab = 'map' | 'recommend' | 'wishlist' | 'shops';

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [boloItems, setBoloItems] = useState<BoloItem[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [showAddShop, setShowAddShop] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [crawlData, setCrawlData] = useState<{
    primary: ShopWithDistance;
    nearby: ShopWithDistance[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [shopsData, boloData] = await Promise.all([
      getShops(),
      getBoloItems(),
    ]);
    setShops(shopsData);
    setBoloItems(boloData);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Default to KL if location not available
        setUserLocation({ lat: 3.139, lng: 101.686 });
      }
    );
  }, []);

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
  };

  const handleCheckInComplete = () => {
    setSelectedShop(null);
    loadData();
  };

  const handleDeleteShop = async (id: string) => {
    await deleteShop(id);
    loadData();
  };

  const handleFindNearby = (
    primary: ShopWithDistance,
    nearby: ShopWithDistance[]
  ) => {
    setCrawlData({ primary, nearby });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0 safe-area-top z-20">
        <h1 className="text-lg font-bold tracking-tight">🏪 Thrift Tracker</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvImport(true)}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-sm font-medium rounded-lg"
          >
            Import
          </button>
          <button
            onClick={() => setShowAddShop(true)}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-sm font-medium rounded-lg"
          >
            + Add
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'map' && (
          <div className="h-full">
            <MapComponent
              shops={shops}
              userLocation={userLocation}
              onShopSelect={handleShopSelect}
              selectedShop={selectedShop}
            />
          </div>
        )}

        {activeTab === 'recommend' && (
          <div className="p-4">
            <Recommendations
              shops={shops}
              userLocation={userLocation}
              onSelectShop={handleShopSelect}
              onFindNearby={handleFindNearby}
            />
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="p-4">
            <Wishlist items={boloItems} onUpdate={loadData} />
          </div>
        )}

        {activeTab === 'shops' && (
          <div className="p-4">
            <ShopList
              shops={shops}
              onSelectShop={handleShopSelect}
              onDeleteShop={handleDeleteShop}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-2 py-1.5 flex justify-around items-center shrink-0 safe-area-bottom shadow-lg z-20">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${
            activeTab === 'map'
              ? 'text-blue-600 bg-blue-50 font-semibold scale-105'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-xl sm:text-2xl">🗺️</span>
          <span className="text-[11px] sm:text-xs mt-0.5">Map</span>
        </button>
        <button
          onClick={() => setActiveTab('recommend')}
          className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${
            activeTab === 'recommend'
              ? 'text-blue-600 bg-blue-50 font-semibold scale-105'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-xl sm:text-2xl">🧭</span>
          <span className="text-[11px] sm:text-xs mt-0.5">Go</span>
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${
            activeTab === 'wishlist'
              ? 'text-blue-600 bg-blue-50 font-semibold scale-105'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-xl sm:text-2xl">🎯</span>
          <span className="text-[11px] sm:text-xs mt-0.5">BOLO</span>
        </button>
        <button
          onClick={() => setActiveTab('shops')}
          className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${
            activeTab === 'shops'
              ? 'text-blue-600 bg-blue-50 font-semibold scale-105'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-xl sm:text-2xl">📋</span>
          <span className="text-[11px] sm:text-xs mt-0.5">Shops</span>
        </button>
      </nav>

      {/* Modals */}
      {selectedShop && (
        <CheckInModal
          shop={selectedShop}
          boloItems={boloItems}
          onClose={() => setSelectedShop(null)}
          onComplete={handleCheckInComplete}
        />
      )}

      {showAddShop && (
        <AddShopForm
          onClose={() => setShowAddShop(false)}
          onShopAdded={() => {
            setShowAddShop(false);
            loadData();
          }}
          initialLocation={userLocation || undefined}
        />
      )}

      {showCsvImport && (
        <CsvImport
          onClose={() => setShowCsvImport(false)}
          onComplete={loadData}
        />
      )}

      {crawlData && (
        <CrawlPanel
          primary={crawlData.primary}
          nearby={crawlData.nearby}
          onSelectShop={handleShopSelect}
          onClose={() => setCrawlData(null)}
        />
      )}
    </div>
  );
}
