'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shop } from '@/lib/types';
import { daysSince } from '@/lib/utils';

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
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: L.LatLngExpression = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [3.139, 101.686]; // Default to KL

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
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const map = mapInstanceRef.current;

    // Add user location marker
    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 3,
      })
        .bindPopup('You are here')
        .addTo(map);
    }

    // Add shop markers
    shops.forEach((shop) => {
      const days = daysSince(shop.lastVisit);
      let color = '#22c55e'; // Green - never/long ago
      if (days < 7) color = '#ef4444'; // Red - recent
      else if (days < 30) color = '#f59e0b'; // Amber - somewhat recent

      if (shop.dropped) color = '#6b7280'; // Gray - dropped

      const marker = L.circleMarker([shop.lat, shop.lng], {
        radius: selectedShop?.id === shop.id ? 12 : 8,
        fillColor: color,
        fillOpacity: 0.9,
        color: '#ffffff',
        weight: 2,
      });

      const daysText =
        shop.lastVisit === undefined
          ? 'Never visited'
          : days === 0
          ? 'Visited today'
          : `${days} day${days > 1 ? 's' : ''} ago`;

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 150px;">
          <strong style="font-size: 14px;">${shop.name}</strong>
          <br />
          <span style="color: #666; font-size: 12px;">${daysText}</span>
          <br />
          <span style="color: #666; font-size: 12px;">${shop.visitCount} visit${shop.visitCount !== 1 ? 's' : ''}</span>
        </div>
      `);

      marker.on('click', () => onShopSelect(shop));
      marker.addTo(map);
      markersRef.current.set(shop.id, marker);
    });

    // Fit bounds to show all markers
    if (shops.length > 0) {
      const bounds = L.latLngBounds(
        shops.map((s) => [s.lat, s.lng] as L.LatLngExpression)
      );
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [shops, userLocation, selectedShop, mapReady, onShopSelect]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}
