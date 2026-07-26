'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type {
  BoloItem,
  Shop,
  ShopWithDistance,
  SyncStatus,
  UserProfile,
} from '@/lib/types';
import {
  deleteShop,
  getActiveProfile,
  getBoloItems,
  getCachedBoloItems,
  getCachedShops,
  getShops,
  loadSeedDataIfNeeded,
  setActiveProfile,
  subscribeToBoloItems,
  subscribeToShops,
} from '@/lib/stores';
import { useGeolocation } from '@/lib/hooks';
import { daysSince, getDistance } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import CheckInModal from '@/components/CheckInModal';
import ShopPicker from '@/components/ShopPicker';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import ThemeToggle from '@/components/ThemeToggle';
import ProfileSwitcher from '@/components/ProfileSwitcher';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});
const Recommendations = dynamic(() => import('@/components/Recommendations'));
const Wishlist = dynamic(() => import('@/components/Wishlist'));
const ShopList = dynamic(() => import('@/components/ShopList'));
const AddShopForm = dynamic(() => import('@/components/AddShopForm'));
const CsvImport = dynamic(() => import('@/components/CsvImport'));
const CrawlPanel = dynamic(() => import('@/components/CrawlPanel'));
const StatsDashboard = dynamic(() => import('@/components/StatsDashboard'));
const AboutTab = dynamic(() => import('@/components/AboutTab'));
const VisitHistory = dynamic(() => import('@/components/VisitHistory'));
const SeedSyncPanel = dynamic(() => import('@/components/SeedSyncPanel'));

type Tab = 'home' | 'plan' | 'map' | 'more';
type MoreView = 'menu' | 'history' | 'bolo' | 'shops' | 'stats' | 'about';

const MORE_TITLES: Record<MoreView, string> = {
  menu: 'More',
  history: 'Visit history',
  bolo: 'BOLO wishlist',
  shops: 'Manage shops',
  stats: 'Visit stats',
  about: 'About',
};

const NAV_ITEMS: Array<{
  id: Tab;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'home',
    label: 'Check in',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="m14.8 9.2-1.7 3.9-3.9 1.7 1.7-3.9 3.9-1.7Z" />
      </svg>
    ),
  },
  {
    id: 'map',
    label: 'Map',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3.5 6 5-2.5 7 3 5-2.5v14l-5 2.5-7-3-5 2.5V6Z" />
        <path d="M8.5 3.5v14M15.5 6.5v14" />
      </svg>
    ),
  },
  {
    id: 'more',
    label: 'More',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </svg>
    ),
  },
];

function visitLabel(shop: Shop): string {
  const days = daysSince(shop.lastVisit);
  if (days === 9999) return 'Never checked in';
  if (days === 0) return 'Last visited today';
  if (days === 1) return 'Last visited yesterday';
  return `Last visited ${days} days ago`;
}

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [boloItems, setBoloItems] = useState<BoloItem[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [manualShop, setManualShop] = useState<Shop | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [moreView, setMoreView] = useState<MoreView>('menu');
  const [showShopPicker, setShowShopPicker] = useState(false);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showSeedSync, setShowSeedSync] = useState(false);
  const [activeProfile, setProfile] = useState<UserProfile>('amirul');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [crawlData, setCrawlData] = useState<{
    primary: ShopWithDistance;
    nearby: ShopWithDistance[];
  } | null>(null);

  const {
    location: userLocation,
    loading: locating,
    source: locationSource,
    retry: retryLocation,
  } = useGeolocation();

  const loadData = useCallback(async () => {
    setSyncStatus('loading');
    try {
      const [shopsData, boloData] = await Promise.all([getShops(), getBoloItems()]);
      setShops(shopsData);
      setBoloItems(boloData);
      setSyncStatus(navigator.onLine ? 'cached' : 'offline');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    const cachedShops = getCachedShops();
    const cachedBolo = getCachedBoloItems();
    // Restore browser-only state after hydration so the server and first client
    // render remain identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cachedShops.length > 0) setShops(cachedShops);
    if (cachedBolo.length > 0) setBoloItems(cachedBolo);
    setProfile(getActiveProfile());
    if (cachedShops.length > 0) setSyncStatus('cached');

    const unsubscribeShops = subscribeToShops(
      (nextShops, status) => {
        setShops(nextShops);
        setSyncStatus(status);
      },
      () => setSyncStatus(navigator.onLine ? 'error' : 'offline')
    );
    const unsubscribeBolo = subscribeToBoloItems(setBoloItems, () => {});
    const handleOnline = () => setSyncStatus('cached');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // New seed rows are reconciled by normalized name on every release.
    void loadSeedDataIfNeeded();
    return () => {
      unsubscribeShops();
      unsubscribeBolo();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const visibleShops = useMemo(
    () => shops.filter((shop) => !shop.archived),
    [shops]
  );
  const trustedLocation =
    locationSource === 'live' || locationSource === 'cached'
      ? userLocation
      : null;

  const nearestShop = useMemo(() => {
    if (!trustedLocation) return null;
    return visibleShops
      .filter((shop) => !shop.dropped)
      .map((shop) => ({
        shop,
        distance: getDistance(
          trustedLocation.lat,
          trustedLocation.lng,
          shop.lat,
          shop.lng
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0] || null;
  }, [visibleShops, trustedLocation]);

  const likelyShop = manualShop || nearestShop?.shop || null;
  const likelyDistance =
    likelyShop && trustedLocation
      ? getDistance(
          trustedLocation.lat,
          trustedLocation.lng,
          likelyShop.lat,
          likelyShop.lng
        )
      : null;

  const locationLabel =
    locationSource === 'live'
      ? 'Current location'
      : locationSource === 'cached'
        ? 'Recent location'
      : locationSource === 'fallback'
          ? 'Location unavailable'
          : 'Finding location';

  const handleTabChange = (tab: Tab) => {
    haptic('light');
    setActiveTab(tab);
    if (tab !== 'more') setMoreView('menu');
  };

  const handleCheckInComplete = () => {
    haptic('success');
    setSelectedShop(null);
    setManualShop(null);
  };

  const handleDeleteShop = async (id: string) => {
    await deleteShop(id);
    void loadData();
  };

  const handleShareCrawl = () => {
    if (!crawlData) return;
    const query = [crawlData.primary, ...crawlData.nearby]
      .map((shop) => `${shop.lat},${shop.lng}`)
      .join('/');
    window.open(`https://www.google.com/maps/dir/${query}`, '_blank');
  };

  return (
    <div className="app-stage">
      <ServiceWorkerRegistration />
      <div className="app-shell">
        <header className="app-header safe-area-top">
          <div>
            <p className="eyebrow">THRIFT TRACKER</p>
            <h1>
              {activeTab === 'home'
                ? 'Check in'
                : activeTab === 'plan'
                  ? 'Plan a run'
                  : activeTab === 'map'
                    ? 'Nearby shops'
                    : MORE_TITLES[moreView]}
            </h1>
          </div>
          <div className="header-actions">
            <ProfileSwitcher
              value={activeProfile}
              onChange={(profile) => {
                setProfile(profile);
                setActiveProfile(profile);
              }}
            />
            <ThemeToggle />
          </div>
        </header>

        <main className="app-content">
          {activeTab === 'home' && (
            <section className="checkin-home">
              <div className="location-line">
                <span
                  className={`location-dot ${
                    locationSource === 'live' ? 'is-live' : ''
                  }`}
                />
                <span>{locationLabel}</span>
                {locating && <span className="locating-pulse">updating</span>}
                {!locating && locationSource !== 'live' && (
                  <button type="button" onClick={retryLocation}>
                    Retry
                  </button>
                )}
              </div>

              <div className="hero-copy">
                <p className="eyebrow">MOST LIKELY HERE</p>
                <h2>
                  {likelyShop
                    ? likelyShop.name
                    : syncStatus === 'loading'
                      ? 'Loading your shops…'
                      : trustedLocation
                        ? 'No shops available'
                        : 'Choose a shop to check in'}
                </h2>
                {likelyShop && (
                  <>
                    <p className="shop-meta">
                      {likelyDistance !== null && `${likelyDistance.toFixed(1)} km away`}
                      {likelyDistance !== null && ' · '}
                      {visitLabel(likelyShop)}
                    </p>
                    {likelyShop.address && (
                      <p className="shop-address">{likelyShop.address}</p>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                className="checkin-button"
                disabled={!likelyShop}
                onClick={() => {
                  if (!likelyShop) return;
                  haptic('medium');
                  setSelectedShop(likelyShop);
                }}
              >
                <span>CHECK IN</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </button>

              <button
                type="button"
                className="change-shop-button"
                disabled={visibleShops.length === 0}
                onClick={() => setShowShopPicker(true)}
              >
                Not here? Choose another shop
              </button>

              <div className="quiet-status">
                <div>
                  <span>{visibleShops.filter((shop) => !shop.dropped).length}</span>
                  active shops
                </div>
                <div>
                  <span>{boloItems.filter((item) => !item.checked).length}</span>
                  BOLO items
                </div>
                <div>
                  <span className={`sync-${syncStatus}`}>
                    {syncStatus === 'live'
                      ? 'Live'
                      : syncStatus === 'cached'
                        ? 'Cached'
                        : syncStatus === 'offline'
                          ? 'Offline'
                          : syncStatus === 'error'
                            ? 'Failed'
                            : 'Syncing'}
                  </span>
                  database
                </div>
              </div>

              {(syncStatus === 'error' || syncStatus === 'offline') && (
                <button type="button" className="sync-notice" onClick={loadData}>
                  {syncStatus === 'offline'
                    ? 'Using saved data while offline'
                    : 'Database sync failed'}
                  <strong>Retry</strong>
                </button>
              )}

              {boloItems.some((item) => !item.checked) && (
                <button
                  type="button"
                  className="bolo-reminder"
                  onClick={() => {
                    setActiveTab('more');
                    setMoreView('bolo');
                  }}
                >
                  <span className="bolo-icon">◎</span>
                  <span>
                    <strong>Remember your BOLO</strong>
                    {boloItems
                      .filter((item) => !item.checked)
                      .slice(0, 2)
                      .map((item) => item.text)
                      .join(' · ')}
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              )}
            </section>
          )}

          {activeTab === 'plan' && (
            <div className="scroll-view page-padding">
              <Recommendations
                shops={visibleShops}
                userLocation={trustedLocation}
                onSelectShop={setSelectedShop}
                onFindNearby={(primary, nearby) =>
                  setCrawlData({ primary, nearby })
                }
              />
            </div>
          )}

          {activeTab === 'map' && (
            <div className="map-view">
              <MapComponent
                shops={visibleShops}
                userLocation={trustedLocation}
                onShopSelect={setSelectedShop}
                selectedShop={selectedShop}
              />
            </div>
          )}

          {activeTab === 'more' && moreView === 'menu' && (
            <div className="scroll-view page-padding">
              <div className="more-menu">
                {[
                  {
                    id: 'history' as const,
                    label: 'Visit history',
                    detail: 'Review, edit or undo check-ins',
                  },
                  {
                    id: 'bolo' as const,
                    label: 'BOLO wishlist',
                    detail: `${boloItems.filter((item) => !item.checked).length} active items`,
                  },
                  {
                    id: 'shops' as const,
                    label: 'Manage shops',
                    detail: `${visibleShops.length} saved locations`,
                  },
                  {
                    id: 'stats' as const,
                    label: 'Visit stats',
                    detail: 'Patterns and history',
                  },
                  {
                    id: 'about' as const,
                    label: 'About',
                    detail: 'App information',
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setMoreView(item.id)}
                  >
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
              <div className="more-actions">
                <button type="button" onClick={() => setShowAddShop(true)}>
                  Add a shop
                </button>
                <button type="button" onClick={() => setShowCsvImport(true)}>
                  Import CSV
                </button>
                <button type="button" onClick={() => setShowSeedSync(true)}>
                  Sync seed updates
                </button>
              </div>
            </div>
          )}

          {activeTab === 'more' && moreView !== 'menu' && (
            <div className="scroll-view page-padding">
              <button
                type="button"
                className="back-button"
                onClick={() => setMoreView('menu')}
              >
                ← More
              </button>
              {moreView === 'bolo' && (
                <Wishlist items={boloItems} onUpdate={() => {}} />
              )}
              {moreView === 'history' && <VisitHistory shops={shops} />}
              {moreView === 'shops' && (
                <ShopList
                  shops={visibleShops}
                  onSelectShop={setSelectedShop}
                  onDeleteShop={handleDeleteShop}
                />
              )}
              {moreView === 'stats' && <StatsDashboard />}
              {moreView === 'about' && <AboutTab />}
            </div>
          )}
        </main>

        <nav className="app-nav safe-area-bottom" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={activeTab === item.id ? 'page' : undefined}
              onClick={() => handleTabChange(item.id)}
              className={activeTab === item.id ? 'is-active' : ''}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {selectedShop && (
        <CheckInModal
          shop={selectedShop}
          boloItems={boloItems}
          activeProfile={activeProfile}
          onClose={() => setSelectedShop(null)}
          onComplete={handleCheckInComplete}
        />
      )}
      {showShopPicker && (
        <ShopPicker
          shops={visibleShops}
          userLocation={trustedLocation}
          onClose={() => setShowShopPicker(false)}
          onSelect={(shop) => {
            setManualShop(shop);
            setShowShopPicker(false);
          }}
        />
      )}
      {showAddShop && (
        <AddShopForm
          onClose={() => setShowAddShop(false)}
          onShopAdded={() => {
            setShowAddShop(false);
            void loadData();
          }}
          initialLocation={trustedLocation || undefined}
        />
      )}
      {showCsvImport && (
        <CsvImport
          onClose={() => setShowCsvImport(false)}
          onComplete={loadData}
        />
      )}
      {showSeedSync && (
        <SeedSyncPanel onClose={() => setShowSeedSync(false)} />
      )}
      {crawlData && (
        <CrawlPanel
          primary={crawlData.primary}
          nearby={crawlData.nearby}
          onSelectShop={setSelectedShop}
          onShare={handleShareCrawl}
          onClose={() => setCrawlData(null)}
        />
      )}
    </div>
  );
}
