'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shop } from '@/lib/types';
import { daysSince } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface MapComponentProps {
  shops: Shop[];
  userLocation: { lat: number; lng: number } | null;
  onShopSelect: (shop: Shop) => void;
  selectedShop: Shop | null;
}

export default function MapComponent({
  shops,
  userLocation,
  onShopSelect,
  selectedShop,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: L.LatLngExpression = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [3.139, 101.686];

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 4,
        className: 'pulse-new',
      })
        .bindPopup('📍 You are here')
        .addTo(mapInstanceRef.current);
    }
  }, [userLocation, mapReady]);

  // Update shop markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    shops.forEach((shop) => {
      const days = daysSince(shop.lastVisit);
      let color = '#22c55e'; // Green - never/long ago
      if (shop.dropped) color = '#6b7280'; // Gray - dropped
      else if (days < 7) color = '#ef4444'; // Red - recent
      else if (days < 30) color = '#f59e0b'; // Amber - somewhat recent

      const isSelected = selectedShop?.id === shop.id;
      const marker = L.circleMarker([shop.lat, shop.lng], {
        radius: isSelected ? 14 : 10,
        fillColor: color,
        fillOpacity: isSelected ? 1 : 0.85,
        color: isSelected ? '#1e40af' : '#ffffff',
        weight: isSelected ? 3 : 2,
      });

      const daysText =
        shop.lastVisit === undefined
          ? 'Never visited'
          : days === 0
          ? 'Visited today'
          : `${days} day${days > 1 ? 's' : ''} ago`;

      const statusEmoji = shop.dropped ? '🗑️' : days < 7 ? '🔴' : days < 30 ? '🟡' : '🟢';

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 160px; padding: 4px;">
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">${shop.name}</div>
          <div style="color: #64748b; font-size: 13px; margin-bottom: 2px;">${statusEmoji} ${daysText}</div>
          <div style="color: #64748b; font-size: 13px;">📍 ${shop.visitCount} visit${shop.visitCount !== 1 ? 's' : ''}</div>
        </div>
      `);

      marker.on('click', () => {
        haptic('light');
        onShopSelect(shop);
      });
      marker.addTo(map);
      markersRef.current.set(shop.id, marker);
    });

    // Fit bounds
    if (shops.length > 0) {
      const bounds = L.latLngBounds(
        shops.map((s) => [s.lat, s.lng] as L.LatLngExpression)
      );
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [shops, userLocation, selectedShop, mapReady, onShopSelect]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
