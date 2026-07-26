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

export function useGeolocation() {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Set default location and stop loading
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocation({ lat: 3.139, lng: 101.686 });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLocation({ lat: 3.139, lng: 101.686 });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, error, loading };
}
