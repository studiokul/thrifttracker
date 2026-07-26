'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shop } from '@/lib/types';
import { daysSince } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

type MarkerStatus = 'unvisited' | 'recent' | 'aging' | 'dropped';

function markerStatus(shop: Shop, days: number): MarkerStatus {
  if (shop.dropped) return 'dropped';
  if (days < 7) return 'recent';
  if (days < 30) return 'aging';
  return 'unvisited';
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] || character
  );
}

function shopIcon(status: MarkerStatus, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: 'thrift-marker-host',
    html: `
      <span class="thrift-marker thrift-marker--${status}${
        selected ? ' is-selected' : ''
      }" aria-hidden="true">
        <span class="thrift-marker__core"></span>
      </span>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18],
  });
}

function userIcon(): L.DivIcon {
  return L.divIcon({
    className: 'thrift-user-marker-host',
    html: `
      <span class="thrift-user-marker" aria-hidden="true">
        <span class="thrift-user-marker__pulse"></span>
        <span class="thrift-user-marker__core"></span>
      </span>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -19],
  });
}

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
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
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
    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      )
      .addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      className: 'thrift-map-tile',
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const observer = new ResizeObserver(() => map.invalidateSize(false));
    observer.observe(mapRef.current);
    const frame = requestAnimationFrame(() => map.invalidateSize(false));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [mapReady]);

  // Update user marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker(
        [userLocation.lat, userLocation.lng],
        {
          icon: userIcon(),
          keyboard: true,
          title: 'Your current location',
          zIndexOffset: 1000,
        }
      )
        .bindPopup(
          '<div class="map-popup map-popup--user"><p class="map-popup__eyebrow">CURRENT LOCATION</p><h3>You are here</h3></div>',
          {
            className: 'thrift-popup',
            closeButton: false,
            keepInView: true,
            autoPanPaddingTopLeft: [18, 110],
            autoPanPaddingBottomRight: [18, 92],
          }
        )
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
      const status = markerStatus(shop, days);
      const isSelected = selectedShop?.id === shop.id;
      const marker = L.marker([shop.lat, shop.lng], {
        icon: shopIcon(status, isSelected),
        keyboard: true,
        title: shop.name,
        riseOnHover: true,
        zIndexOffset: isSelected ? 500 : 0,
      });

      const daysText =
        shop.lastVisit === undefined
          ? 'Never visited'
          : days === 0
          ? 'Visited today'
          : `${days} day${days > 1 ? 's' : ''} ago`;

      const statusLabel =
        status === 'dropped'
          ? 'Dropped'
          : status === 'recent'
            ? 'Recently visited'
            : status === 'aging'
              ? 'Ready soon'
              : 'Ready to explore';

      marker.bindPopup(
        `
        <div class="map-popup">
          <p class="map-popup__eyebrow map-popup__eyebrow--${status}">${statusLabel}</p>
          <h3>${escapeHtml(shop.name)}</h3>
          <p>${daysText}</p>
          <p>${shop.visitCount} visit${shop.visitCount !== 1 ? 's' : ''}</p>
          <button type="button" class="map-popup__action">Check in here</button>
        </div>
        `,
        {
          className: 'thrift-popup',
          closeButton: false,
          keepInView: true,
          autoPanPaddingTopLeft: [18, 110],
          autoPanPaddingBottomRight: [18, 92],
        }
      );

      marker.on('click', () => {
        haptic('light');
      });
      marker.on('popupopen', () => {
        const action = marker
          .getPopup()
          ?.getElement()
          ?.querySelector<HTMLButtonElement>('.map-popup__action');
        action?.addEventListener(
          'click',
          () => {
            haptic('medium');
            onShopSelect(shop);
          },
          { once: true }
        );
      });
      marker.addTo(map);
      markersRef.current.set(shop.id, marker);
    });

  }, [shops, userLocation, selectedShop, mapReady, onShopSelect]);

  return (
    <div
      ref={mapRef}
      className="thrift-map w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
