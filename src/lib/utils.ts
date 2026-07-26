import type { Shop, ShopWithDistance, RecommendationMode } from './types';

// Haversine formula for distance between two coordinates
export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function daysSince(date: Date | undefined): number {
  if (!date) return 9999; // Never visited
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getShopsWithScore(
  shops: Shop[],
  userLat: number,
  userLng: number,
  mode: RecommendationMode
): ShopWithDistance[] {
  const shopsWithDistance = shops
    .filter((s) => !s.dropped)
    .map((shop) => {
      const distance = getDistance(userLat, userLng, shop.lat, shop.lng);
      const days = daysSince(shop.lastVisit);

      let score: number;
      if (mode === 'adventure') {
        // Adventure: heavily weight time since visit, distance is secondary
        score = days * 2 - distance * 0.5;
      } else {
        // Lazy: heavily weight proximity, penalize recent visits
        const recentPenalty = days < 7 ? (7 - days) * 10 : 0;
        score = 100 - distance * 5 - recentPenalty;
      }

      return {
        ...shop,
        distance,
        daysSinceVisit: days,
        score,
      };
    });

  return shopsWithDistance.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function getNearbyShops(
  shop: ShopWithDistance,
  allShops: Shop[],
  userLat: number,
  userLng: number,
  radiusKm: number = 5
): ShopWithDistance[] {
  return allShops
    .filter((s) => s.id !== shop.id && !s.dropped)
    .map((s) => ({
      ...s,
      distance: getDistance(shop.lat, shop.lng, s.lat, s.lng),
      daysSinceVisit: daysSince(s.lastVisit),
    }))
    .filter((s) => (s.distance || 0) <= radiusKm)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 2);
}
