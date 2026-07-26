import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Shop, CheckIn, BoloItem } from './types';

const SHOPS_COLLECTION = 'shops';
const CHECKINS_COLLECTION = 'checkins';
const BOLO_COLLECTION = 'bolo';

// LocalStorage cache helpers
function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setCache(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or blocked
  }
}

function deserializeShop(d: Record<string, unknown>, id: string): Shop {
  // Handle Firestore timestamps which have a toDate() method
  const createdAtRaw = d.createdAt as { toDate?: () => Date } | string | undefined;
  const lastVisitRaw = d.lastVisit as { toDate?: () => Date } | string | undefined;

  return {
    id,
    name: d.name as string,
    lat: d.lat as number,
    lng: d.lng as number,
    address: d.address as string | undefined,
    createdAt: typeof createdAtRaw === 'object' && createdAtRaw?.toDate
      ? createdAtRaw.toDate()
      : new Date((createdAtRaw as string) || Date.now()),
    lastVisit: lastVisitRaw
      ? typeof lastVisitRaw === 'object' && lastVisitRaw?.toDate
        ? lastVisitRaw.toDate()
        : new Date(lastVisitRaw as string)
      : undefined,
    visitCount: (d.visitCount as number) || 0,
    dropped: (d.dropped as boolean) || false,
  };
}

// Shops
export async function getShops(): Promise<Shop[]> {
  if (!db) return getCached<Shop[]>('tt_shops') || [];

  try {
    const q = query(collection(db, SHOPS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    const shops = snapshot.docs.map((d) => deserializeShop(d.data() as Record<string, unknown>, d.id));
    setCache('tt_shops', shops);
    return shops;
  } catch {
    // Offline or error — use cache
    return getCached<Shop[]>('tt_shops') || [];
  }
}

export async function addShop(
  shop: Omit<Shop, 'id' | 'createdAt' | 'visitCount' | 'dropped'>
): Promise<string> {
  if (!db) return '';
  const docRef = await addDoc(collection(db, SHOPS_COLLECTION), {
    ...shop,
    createdAt: Timestamp.now(),
    visitCount: 0,
    dropped: false,
  });
  return docRef.id;
}

export async function updateShop(id: string, data: Partial<Shop>): Promise<void> {
  if (!db) return;
  const docRef = doc(db, SHOPS_COLLECTION, id);
  const updateData: Record<string, unknown> = { ...data };
  if (data.lastVisit) {
    updateData.lastVisit = Timestamp.fromDate(data.lastVisit);
  }
  delete updateData.id;
  delete updateData.createdAt;
  await updateDoc(docRef, updateData);
}

export async function deleteShop(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, SHOPS_COLLECTION, id));
}

// Check-ins
export async function addCheckIn(
  checkIn: Omit<CheckIn, 'id' | 'timestamp'>
): Promise<string> {
  if (!db) return '';

  const docRef = await addDoc(collection(db, CHECKINS_COLLECTION), {
    ...checkIn,
    timestamp: Timestamp.now(),
  });

  // Update shop's last visit and visit count
  const shopRef = doc(db, SHOPS_COLLECTION, checkIn.shopId);
  const shopDocs = await getDocs(
    query(collection(db, SHOPS_COLLECTION), where('__name__', '==', checkIn.shopId))
  );
  if (!shopDocs.empty) {
    const shopData = shopDocs.docs[0].data();
    await updateDoc(shopRef, {
      lastVisit: Timestamp.now(),
      visitCount: (shopData.visitCount || 0) + 1,
      dropped: checkIn.vibe === 'drop' ? true : shopData.dropped,
    });
  }

  return docRef.id;
}

export async function getCheckIns(shopId?: string): Promise<CheckIn[]> {
  if (!db) return [];

  try {
    let q;
    if (shopId) {
      q = query(
        collection(db, CHECKINS_COLLECTION),
        where('shopId', '==', shopId),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(collection(db, CHECKINS_COLLECTION), orderBy('timestamp', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate() || new Date(),
    })) as CheckIn[];
  } catch {
    return [];
  }
}

// BOLO Wishlist
export async function getBoloItems(): Promise<BoloItem[]> {
  if (!db) return getCached<BoloItem[]>('tt_bolo') || [];

  try {
    const q = query(collection(db, BOLO_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date(),
    })) as BoloItem[];
    setCache('tt_bolo', items);
    return items;
  } catch {
    return getCached<BoloItem[]>('tt_bolo') || [];
  }
}

export async function addBoloItem(text: string): Promise<string> {
  if (!db) return '';
  const docRef = await addDoc(collection(db, BOLO_COLLECTION), {
    text,
    createdAt: Timestamp.now(),
    checked: false,
  });
  return docRef.id;
}

export async function toggleBoloItem(id: string, checked: boolean): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, BOLO_COLLECTION, id), { checked });
}

export async function deleteBoloItem(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, BOLO_COLLECTION, id));
}

// Seed data initialization
export async function loadSeedDataIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const shops = await getShops();
  // Only load seed data if there are no shops yet
  if (shops.length > 0) return;

  const seedLoaded = getCached<boolean>('tt_seed_loaded');
  if (seedLoaded) return;

  try {
    const response = await fetch('/seed.csv');
    const text = await response.text();
    
    // Parse CSV manually (simple approach)
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return; // No data rows

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      if (values.length < 3) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const name = row.name || row.title;
      const lat = parseFloat(row.lat) || 0;
      const lng = parseFloat(row.lng) || 0;
      const address = row.address || '';

      if (name && lat !== 0 && lng !== 0) {
        try {
          await addShop({ name, lat, lng, address: address || undefined });
        } catch {
          // Continue on individual import errors
        }
      }
    }

    // Mark seed as loaded so we don't re-import on future visits
    setCache('tt_seed_loaded', true);
  } catch (err) {
    console.log('[v0] Failed to load seed data:', err);
  }
}

// Stats
export async function getStats(): Promise<{
  totalShops: number;
  totalCheckIns: number;
  droppedShops: number;
  fireShops: number;
  topShop: string | null;
  avgVisitGap: number;
}> {
  const shops = await getShops();
  const checkIns = await getCheckIns();

  const shopVisitCounts = new Map<string, number>();
  checkIns.forEach((c) => {
    shopVisitCounts.set(c.shopId, (shopVisitCounts.get(c.shopId) || 0) + 1);
  });

  let topShop: string | null = null;
  let maxVisits = 0;
  shopVisitCounts.forEach((count, shopId) => {
    if (count > maxVisits) {
      maxVisits = count;
      topShop = shops.find((s) => s.id === shopId)?.name || null;
    }
  });

  const fireCheckIns = checkIns.filter((c) => c.vibe === 'fire').length;

  // Average gap between visits (in days)
  let avgVisitGap = 0;
  const shopVisits = new Map<string, Date[]>();
  checkIns.forEach((c) => {
    if (!shopVisits.has(c.shopId)) shopVisits.set(c.shopId, []);
    shopVisits.get(c.shopId)!.push(c.timestamp);
  });

  let totalGap = 0;
  let gapCount = 0;
  shopVisits.forEach((visits) => {
    const sorted = visits.sort((a, b) => a.getTime() - b.getTime());
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      gapCount++;
    }
  });
  if (gapCount > 0) avgVisitGap = Math.round(totalGap / gapCount);

  return {
    totalShops: shops.length,
    totalCheckIns: checkIns.length,
    droppedShops: shops.filter((s) => s.dropped).length,
    fireShops: fireCheckIns,
    topShop,
    avgVisitGap,
  };
}
