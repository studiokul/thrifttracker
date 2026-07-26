export interface Shop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  createdAt: Date;
  lastVisit?: Date;
  visitCount: number;
  dropped: boolean;
  archived?: boolean;
  source?: 'seed' | 'manual' | 'csv';
}

export interface CheckIn {
  id: string;
  shopId: string;
  userId: string;
  shopName?: string;
  timestamp: Date;
  vibe: 'fire' | 'mid' | 'drop';
  notes?: string;
}

export interface BoloItem {
  id: string;
  text: string;
  createdAt: Date;
  checked: boolean;
}

export type Vibe = 'fire' | 'mid' | 'drop';

export type RecommendationMode = 'adventure' | 'lazy';

export type UserProfile = 'amirul' | 'barbie' | 'together';

export type SyncStatus = 'loading' | 'live' | 'cached' | 'offline' | 'error';

export interface ShopWithDistance extends Shop {
  distance?: number;
  daysSinceVisit?: number;
  score?: number;
  recommendationReason?: string;
  nearbyCount?: number;
}
