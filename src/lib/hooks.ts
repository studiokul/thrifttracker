'use client';

import { useEffect, useRef, useState } from 'react';
import type { Shop } from './types';
import { getDistance } from './utils';

const GEOFENCE_RADIUS = 0.1; // 100 meters
const CHECK_INTERVAL = 10000; // 10 seconds

export function useGeofence(
  shops: Shop[],
  onNearShop: (shop: Shop) => void,
  enabled = true
) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const lastPromptedRef = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const onNearShopRef = useRef(onNearShop);
  // eslint-disable-next-line react-hooks/refs
  onNearShopRef.current = onNearShop;

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!userLocation || shops.length === 0) return;

    const check = () => {
      for (const shop of shops) {
        if (shop.dropped) continue;
        const dist = getDistance(
          userLocation.lat,
          userLocation.lng,
          shop.lat,
          shop.lng
        );
        if (dist <= GEOFENCE_RADIUS && shop.id !== lastPromptedRef.current) {
          lastPromptedRef.current = shop.id;
          onNearShopRef.current(shop);
          break;
        }
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [userLocation, shops]);

  return userLocation;
}

const DEFAULT_LOCATION = { lat: 3.139, lng: 101.686 };
const LOCATION_CACHE_KEY = 'tt_last_location';

type LocationSource = 'live' | 'cached' | 'fallback';

export function useGeolocation() {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(DEFAULT_LOCATION);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<LocationSource | null>('fallback');

  const locate = () => {
    setLoading(true);
    setError(null);
    let settled = false;
    const finishFallback = (message: string) => {
      if (settled) return;
      settled = true;
      setError(message);
      setLocation((current) => current || DEFAULT_LOCATION);
      setSource((current) => current || 'fallback');
      setLoading(false);
    };

    if (!navigator.geolocation) {
      finishFallback('Location is not available on this device.');
      return;
    }

    const fallbackTimer = window.setTimeout(
      () => finishFallback('Location lookup timed out.'),
      4000
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        const nextLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(nextLocation);
        setSource('live');
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(nextLocation));
        setLoading(false);
      },
      (err) => {
        window.clearTimeout(fallbackTimer);
        finishFallback(err.message);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 15 * 60 * 1000,
        timeout: 3500,
      }
    );
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { lat?: number; lng?: number };
        if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLocation({ lat: parsed.lat!, lng: parsed.lng! });
          setSource('cached');
        }
      }
    } catch {
      // Ignore malformed or unavailable local storage.
    }

    locate();
    // A location attempt is intentionally made only once on startup.
  }, []);

  return { location, error, loading, source, retry: locate };
}
