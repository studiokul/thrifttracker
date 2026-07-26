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
  writeBatch,
} from 'firebase/firestore';
import Papa from 'papaparse';
import { db } from './firebase';
import type { Shop, CheckIn, BoloItem } from './types';

const SHOPS_COLLECTION = 'shops';
const CHECKINS_COLLECTION = 'checkins';
const BOLO_COLLECTION = 'bolo';

interface SeedShopRow {
  name?: string;
  address?: string;
  lat?: string;
  lng?: string;
}

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

export function getCachedShops(): Shop[] {
  const shops = getCached<Array<Omit<Shop, 'createdAt' | 'lastVisit'> & {
    createdAt: string | Date;
    lastVisit?: string | Date;
  }>>('tt_shops') || [];

  return shops.map((shop) => ({
    ...shop,
    createdAt: new Date(shop.createdAt),
    lastVisit: shop.lastVisit ? new Date(shop.lastVisit) : undefined,
  }));
}

export function getCachedBoloItems(): BoloItem[] {
  const items = getCached<Array<Omit<BoloItem, 'createdAt'> & {
    createdAt: string | Date;
  }>>('tt_bolo') || [];

  return items.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
  }));
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
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 3500)
    );
    const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
    const shops = snapshot.docs.map((d) => deserializeShop(d.data() as Record<string, unknown>, d.id));
    setCache('tt_shops', shops);
    return shops;
  } catch (err) {
    console.warn('getShops fallback:', err);
    // Offline, timeout or error — use cache
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
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 3500)
    );
    const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date(),
    })) as BoloItem[];
    setCache('tt_bolo', items);
    return items;
  } catch (err) {
    console.warn('getBoloItems fallback:', err);
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
export async function loadSeedDataIfNeeded(existingShopCount?: number): Promise<void> {
  if (typeof window === 'undefined') return;

  const shops = existingShopCount === undefined ? await getShops() : null;
  // Only load seed data if there are no shops yet
  if ((shops?.length || existingShopCount || 0) > 0) return;

  const seedLoaded = getCached<boolean>('tt_seed_loaded');
  if (seedLoaded) return;

  try {
    const response = await fetch('/seed.csv');
    if (!response.ok) {
      throw new Error(`Seed CSV request failed with ${response.status}`);
    }
    const text = await response.text();

    const parsed = Papa.parse<SeedShopRow>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim().toLowerCase(),
    });
    if (parsed.errors.length > 0) {
      throw new Error(`Seed CSV parse failed: ${parsed.errors[0].message}`);
    }

    const rows = parsed.data.map((row) => ({
      name: row.name?.trim() || '',
      address: row.address?.trim() || '',
      lat: Number(row.lat),
      lng: Number(row.lng),
    }));
    const invalidRows = rows.filter(
      (row) =>
        !row.name ||
        !Number.isFinite(row.lat) ||
        !Number.isFinite(row.lng) ||
        Math.abs(row.lat) > 90 ||
        Math.abs(row.lng) > 180
    );
    if (rows.length === 0 || invalidRows.length > 0) {
      throw new Error(
        `Seed CSV contains ${invalidRows.length} invalid row(s)`
      );
    }
    if (!db) {
      throw new Error('Firestore is not configured');
    }
    const firestore = db;

    // One atomic commit prevents partial imports and only marks success after
    // every shop has been accepted by Firestore.
    const batch = writeBatch(firestore);
    const createdAt = Timestamp.now();
    rows.forEach((row) => {
      const shopRef = doc(collection(firestore, SHOPS_COLLECTION));
      batch.set(shopRef, {
        name: row.name,
        address: row.address || undefined,
        lat: row.lat,
        lng: row.lng,
        createdAt,
        visitCount: 0,
        dropped: false,
      });
    });
    await batch.commit();

    setCache('tt_seed_loaded', true);
  } catch (err) {
    console.warn('Failed to load seed data:', err);
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
