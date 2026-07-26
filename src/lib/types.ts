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
}

export interface CheckIn {
  id: string;
  shopId: string;
  userId: string;
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

export interface ShopWithDistance extends Shop {
  distance?: number;
  daysSinceVisit?: number;
  score?: number;
}
