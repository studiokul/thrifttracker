'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Shop, ShopWithDistance, BoloItem } from '@/lib/types';
import { getShops, getBoloItems, deleteShop, loadSeedDataIfNeeded } from '@/lib/stores';
import { useGeolocation, useGeofence } from '@/lib/hooks';
import { haptic } from '@/lib/haptics';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="skeleton w-full h-full rounded-lg" />,
});

import CheckInModal from '@/components/CheckInModal';
import Recommendations from '@/components/Recommendations';
import Wishlist from '@/components/Wishlist';
import ShopList from '@/components/ShopList';
import AddShopForm from '@/components/AddShopForm';
import CsvImport from '@/components/CsvImport';
import CrawlPanel from '@/components/CrawlPanel';
import BottomSheet from '@/components/BottomSheet';
import PullToRefresh from '@/components/PullToRefresh';
import StatsDashboard from '@/components/StatsDashboard';
import ThemeToggle from '@/components/ThemeToggle';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import AboutTab from '@/components/AboutTab';
import { RecommendationSkeleton } from '@/components/Skeletons';

type Tab = 'map' | 'recommend' | 'wishlist' | 'shops' | 'stats' | 'about';

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [boloItems, setBoloItems] = useState<BoloItem[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [showAddShop, setShowAddShop] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [crawlData, setCrawlData] = useState<{
    primary: ShopWithDistance;
    nearby: ShopWithDistance[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [geofenceShop, setGeofenceShop] = useState<Shop | null>(null);

  const { location: userLocation } = useGeolocation();

  const loadData = useCallback(async () => {
    // Load seed data on first app launch if no shops exist
    await loadSeedDataIfNeeded();

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

  // Geofencing
  useGeofence(
    shops,
    (shop) => {
      haptic('medium');
      setGeofenceShop(shop);
    },
    !!userLocation
  );

  const handleShopSelect = (shop: Shop) => {
    haptic('light');
    setSelectedShop(shop);
  };

  const handleCheckInComplete = () => {
    haptic('success');
    setSelectedShop(null);
    setGeofenceShop(null);
    loadData();
  };

  const handleDeleteShop = async (id: string) => {
    haptic('light');
    await deleteShop(id);
    loadData();
  };

  const handleFindNearby = (
    primary: ShopWithDistance,
    nearby: ShopWithDistance[]
  ) => {
    haptic('light');
    setCrawlData({ primary, nearby });
  };

  const handleShareCrawl = () => {
    if (!crawlData) return;
    const allShops = [crawlData.primary, ...crawlData.nearby];
    const query = allShops
      .map((s) => `${s.lat},${s.lng}`)
      .join('/');
    const url = `https://www.google.com/maps/dir/${query}`;
    window.open(url, '_blank');
    haptic('light');
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-slate-900">
        <div className="bg-blue-600 px-4 py-3 safe-area-top shrink-0" />
        <div className="flex-1 p-4 space-y-4">
          <div className="skeleton h-10 w-full rounded-lg" />
          <RecommendationSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
      <ServiceWorkerRegistration />

      {/* Header */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 safe-area-top z-20 transition-colors">
        <h1 className="text-lg font-bold tracking-tight">🏪 Thrift Tracker</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => {
              haptic('light');
              setShowCsvImport(true);
            }}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-sm font-medium rounded-lg"
          >
            Import
          </button>
          <button
            onClick={() => {
              haptic('light');
              setShowAddShop(true);
            }}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-sm font-medium rounded-lg"
          >
            + Add
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
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
          <PullToRefresh onRefresh={loadData}>
            <div className="p-4">
              <Recommendations
                shops={shops}
                userLocation={userLocation}
                onSelectShop={handleShopSelect}
                onFindNearby={handleFindNearby}
              />
            </div>
          </PullToRefresh>
        )}

        {activeTab === 'wishlist' && (
          <PullToRefresh onRefresh={loadData}>
            <div className="p-4">
              <Wishlist items={boloItems} onUpdate={loadData} />
            </div>
          </PullToRefresh>
        )}

        {activeTab === 'shops' && (
          <PullToRefresh onRefresh={loadData}>
            <div className="p-4">
              <ShopList
                shops={shops}
                onSelectShop={handleShopSelect}
                onDeleteShop={handleDeleteShop}
              />
            </div>
          </PullToRefresh>
        )}

        {activeTab === 'stats' && (
          <PullToRefresh onRefresh={loadData}>
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">📊 Stats</h2>
              <StatsDashboard />
            </div>
          </PullToRefresh>
        )}

        {activeTab === 'about' && (
          <div className="p-4">
            <AboutTab />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-2 py-1.5 flex justify-around items-center shrink-0 safe-area-bottom shadow-lg z-20 transition-colors">
        {(
          [
            { id: 'map', emoji: '🗺️', label: 'Map' },
            { id: 'recommend', emoji: '🧭', label: 'Go' },
            { id: 'wishlist', emoji: '🎯', label: 'BOLO' },
            { id: 'shops', emoji: '📋', label: 'Shops' },
            { id: 'stats', emoji: '📊', label: 'Stats' },
            { id: 'about', emoji: 'ℹ️', label: 'About' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              haptic('light');
              setActiveTab(tab.id);
            }}
            className={`flex flex-col items-center px-3 py-1 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 font-semibold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl sm:text-2xl">{tab.emoji}</span>
            <span className="text-[10px] sm:text-xs mt-0.5">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Sheets */}
      {selectedShop && (
        <CheckInModal
          shop={selectedShop}
          boloItems={boloItems}
          onClose={() => setSelectedShop(null)}
          onComplete={handleCheckInComplete}
        />
      )}

      {geofenceShop && !selectedShop && (
        <BottomSheet
          onClose={() => setGeofenceShop(null)}
          title="📍 You're nearby!"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Looks like you&apos;re near <strong>{geofenceShop.name}</strong>. Check in?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleShopSelect(geofenceShop);
                  setGeofenceShop(null);
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Check In
              </button>
              <button
                onClick={() => setGeofenceShop(null)}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Nope
              </button>
            </div>
          </div>
        </BottomSheet>
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
          onShare={handleShareCrawl}
          onClose={() => setCrawlData(null)}
        />
      )}
    </div>
  );
}
