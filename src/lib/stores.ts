import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
  runTransaction,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import Papa from 'papaparse';
import { db } from './firebase';
import type { Shop, CheckIn, BoloItem, SyncStatus, UserProfile, Vibe } from './types';

const SHOPS_COLLECTION = 'shops';
const CHECKINS_COLLECTION = 'checkins';
const BOLO_COLLECTION = 'bolo';

interface SeedShopRow {
  name?: string;
  address?: string;
  lat?: string;
  lng?: string;
}

export interface SeedSyncPreview {
  missing: Array<{ name: string; address?: string; lat: number; lng: number }>;
  changed: Array<{
    id: string;
    name: string;
    current: { address?: string; lat: number; lng: number };
    seed: { address?: string; lat: number; lng: number };
  }>;
  unchanged: number;
}

const ACTIVE_PROFILE_KEY = 'tt_active_profile';

export function getActiveProfile(): UserProfile {
  if (typeof window === 'undefined') return 'amirul';
  const value = localStorage.getItem(ACTIVE_PROFILE_KEY);
  return value === 'barbie' || value === 'together' ? value : 'amirul';
}

export function setActiveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, profile);
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
    archived: (d.archived as boolean) || false,
    source: d.source as Shop['source'],
  };
}

function deserializeCheckIn(d: Record<string, unknown>, id: string): CheckIn {
  const timestamp = d.timestamp as { toDate?: () => Date } | string | undefined;
  return {
    id,
    shopId: d.shopId as string,
    shopName: d.shopName as string | undefined,
    userId: (d.userId as string) || 'amirul',
    timestamp:
      typeof timestamp === 'object' && timestamp?.toDate
        ? timestamp.toDate()
        : new Date((timestamp as string) || Date.now()),
    vibe: d.vibe as Vibe,
    notes: d.notes as string | undefined,
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

export function subscribeToShops(
  onData: (shops: Shop[], status: SyncStatus) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    queueMicrotask(() => onError(new Error('Firestore is not configured')));
    return () => {};
  }

  const q = query(collection(db, SHOPS_COLLECTION), orderBy('name'));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const shops = snapshot.docs.map((item) =>
        deserializeShop(item.data() as Record<string, unknown>, item.id)
      );
      setCache('tt_shops', shops);
      const status: SyncStatus = snapshot.metadata.fromCache
        ? navigator.onLine
          ? 'cached'
          : 'offline'
        : 'live';
      onData(shops, status);
    },
    (error) => onError(error)
  );
}

export async function addShop(
  shop: Omit<
    Shop,
    'id' | 'createdAt' | 'visitCount' | 'dropped' | 'archived'
  >
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = await addDoc(collection(db, SHOPS_COLLECTION), {
    ...shop,
    createdAt: serverTimestamp(),
    visitCount: 0,
    dropped: false,
    archived: false,
  });
  return docRef.id;
}

export async function importShops(
  shops: Array<{ name: string; address?: string; lat: number; lng: number }>
): Promise<{ added: number; skipped: number }> {
  if (!db) throw new Error('Firestore is not configured');
  const firestore = db;
  const snapshot = await getDocs(collection(firestore, SHOPS_COLLECTION));
  const knownNames = new Set(
    snapshot.docs.map((item) =>
      normalizeShopName((item.data().name as string) || '')
    )
  );
  const unique: typeof shops = [];
  let skipped = 0;
  shops.forEach((shop) => {
    const key = normalizeShopName(shop.name);
    if (!key || knownNames.has(key)) {
      skipped += 1;
      return;
    }
    knownNames.add(key);
    unique.push(shop);
  });

  if (unique.length > 450) {
    throw new Error('Import is limited to 450 new shops at a time');
  }
  const batch = writeBatch(firestore);
  const createdAt = Timestamp.now();
  unique.forEach((shop) => {
    batch.set(
      doc(firestore, SHOPS_COLLECTION, seedDocumentId(`csv:${shop.name}`)),
      {
      ...shop,
      createdAt,
      visitCount: 0,
      dropped: false,
      archived: false,
      source: 'csv',
      }
    );
  });
  if (unique.length > 0) await batch.commit();
  return { added: unique.length, skipped };
}

export async function updateShop(id: string, data: Partial<Shop>): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
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
  if (!db) throw new Error('Firestore is not configured');
  await updateDoc(doc(db, SHOPS_COLLECTION, id), {
    archived: true,
    archivedAt: serverTimestamp(),
  });
}

// Check-ins
export async function addCheckIn(
  checkIn: Omit<CheckIn, 'id' | 'timestamp'> & { timestamp?: Date }
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const firestore = db;

  const checkInRef = doc(collection(firestore, CHECKINS_COLLECTION));
  const shopRef = doc(firestore, SHOPS_COLLECTION, checkIn.shopId);
  const visitTime = checkIn.timestamp || new Date();

  await runTransaction(firestore, async (transaction) => {
    const shopSnapshot = await transaction.get(shopRef);
    if (!shopSnapshot.exists()) throw new Error('Shop no longer exists');
    const shopData = shopSnapshot.data();
    const previousLastVisit = shopData.lastVisit?.toDate?.() as Date | undefined;

    transaction.set(checkInRef, {
      shopId: checkIn.shopId,
      shopName: checkIn.shopName || shopData.name,
      userId: checkIn.userId,
      vibe: checkIn.vibe,
      notes: checkIn.notes || null,
      timestamp: Timestamp.fromDate(visitTime),
      createdAt: serverTimestamp(),
    });
    transaction.update(shopRef, {
      lastVisit:
        !previousLastVisit || visitTime > previousLastVisit
          ? Timestamp.fromDate(visitTime)
          : shopData.lastVisit,
      visitCount: increment(1),
      dropped: checkIn.vibe === 'drop' ? true : Boolean(shopData.dropped),
    });
  });

  return checkInRef.id;
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
    return snapshot.docs.map((item) =>
      deserializeCheckIn(item.data() as Record<string, unknown>, item.id)
    );
  } catch (error) {
    console.warn('getCheckIns failed:', error);
    return [];
  }
}

export function subscribeToCheckIns(
  onData: (checkIns: CheckIn[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    queueMicrotask(() => onError(new Error('Firestore is not configured')));
    return () => {};
  }
  const q = query(collection(db, CHECKINS_COLLECTION), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          deserializeCheckIn(item.data() as Record<string, unknown>, item.id)
        )
      ),
    (error) => onError(error)
  );
}

async function rebuildShopVisitSummary(shopId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const [shopSnapshot, checkInSnapshot] = await Promise.all([
    getDoc(doc(db, SHOPS_COLLECTION, shopId)),
    getDocs(query(collection(db, CHECKINS_COLLECTION), where('shopId', '==', shopId))),
  ]);
  if (!shopSnapshot.exists()) return;

  const visits = checkInSnapshot.docs.map((item) =>
    deserializeCheckIn(item.data() as Record<string, unknown>, item.id)
  );
  const latest = visits.reduce<Date | undefined>(
    (current, visit) =>
      !current || visit.timestamp > current ? visit.timestamp : current,
    undefined
  );
  const latestDrop = visits
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.vibe === 'drop';

  await updateDoc(doc(db, SHOPS_COLLECTION, shopId), {
    visitCount: visits.length,
    lastVisit: latest ? Timestamp.fromDate(latest) : null,
    dropped: latestDrop,
  });
}

export async function updateCheckIn(
  id: string,
  data: Pick<CheckIn, 'timestamp' | 'vibe' | 'notes' | 'userId'>
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const checkInRef = doc(db, CHECKINS_COLLECTION, id);
  const current = await getDoc(checkInRef);
  if (!current.exists()) throw new Error('Check-in no longer exists');
  const shopId = current.data().shopId as string;
  await updateDoc(checkInRef, {
    timestamp: Timestamp.fromDate(data.timestamp),
    vibe: data.vibe,
    notes: data.notes || null,
    userId: data.userId,
    updatedAt: serverTimestamp(),
  });
  await rebuildShopVisitSummary(shopId);
}

export async function deleteCheckIn(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const checkInRef = doc(db, CHECKINS_COLLECTION, id);
  const current = await getDoc(checkInRef);
  if (!current.exists()) return;
  const shopId = current.data().shopId as string;
  await deleteDoc(checkInRef);
  await rebuildShopVisitSummary(shopId);
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
  if (!db) throw new Error('Firestore is not configured');
  const docRef = await addDoc(collection(db, BOLO_COLLECTION), {
    text,
    createdAt: Timestamp.now(),
    checked: false,
  });
  return docRef.id;
}

export async function toggleBoloItem(id: string, checked: boolean): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await updateDoc(doc(db, BOLO_COLLECTION, id), { checked });
}

export async function deleteBoloItem(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await deleteDoc(doc(db, BOLO_COLLECTION, id));
}

export function subscribeToBoloItems(
  onData: (items: BoloItem[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    queueMicrotask(() => onError(new Error('Firestore is not configured')));
    return () => {};
  }
  const q = query(collection(db, BOLO_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAt: item.data().createdAt?.toDate() || new Date(),
      })) as BoloItem[];
      setCache('tt_bolo', items);
      onData(items);
    },
    (error) => onError(error)
  );
}

function normalizeShopName(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function seedDocumentId(name: string): string {
  const slug = normalizeShopName(name).replace(/\s+/g, '-').slice(0, 80);
  let hash = 2166136261;
  for (const character of name) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `seed-${slug}-${(hash >>> 0).toString(36)}`;
}

async function readSeedRows(): Promise<
  Array<{ name: string; address?: string; lat: number; lng: number }>
> {
  const response = await fetch('/seed.csv', { cache: 'no-store' });
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
    address: row.address?.trim() || undefined,
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
    throw new Error(`Seed CSV contains ${invalidRows.length} invalid row(s)`);
  }

  const uniqueNames = new Set(rows.map((row) => normalizeShopName(row.name)));
  if (uniqueNames.size !== rows.length) {
    throw new Error('Seed CSV contains duplicate shop names');
  }
  return rows;
}

export async function previewSeedSync(): Promise<SeedSyncPreview> {
  if (!db) throw new Error('Firestore is not configured');
  const [rows, snapshot] = await Promise.all([
    readSeedRows(),
    getDocs(collection(db, SHOPS_COLLECTION)),
  ]);
  const existing = snapshot.docs.map((item) =>
    deserializeShop(item.data() as Record<string, unknown>, item.id)
  );
  const byName = new Map(
    existing.map((shop) => [normalizeShopName(shop.name), shop])
  );
  const preview: SeedSyncPreview = { missing: [], changed: [], unchanged: 0 };

  rows.forEach((row) => {
    const match = byName.get(normalizeShopName(row.name));
    if (!match) {
      preview.missing.push(row);
      return;
    }
    const changed =
      match.address !== row.address ||
      Math.abs(match.lat - row.lat) > 0.000001 ||
      Math.abs(match.lng - row.lng) > 0.000001;
    if (changed) {
      preview.changed.push({
        id: match.id,
        name: match.name,
        current: { address: match.address, lat: match.lat, lng: match.lng },
        seed: { address: row.address, lat: row.lat, lng: row.lng },
      });
    } else {
      preview.unchanged += 1;
    }
  });
  return preview;
}

export async function applySeedSync(
  preview: SeedSyncPreview,
  includeUpdates = false
): Promise<{ added: number; updated: number }> {
  if (!db) throw new Error('Firestore is not configured');
  const firestore = db;
  const batch = writeBatch(firestore);
  const createdAt = Timestamp.now();

  preview.missing.forEach((row) => {
    batch.set(doc(firestore, SHOPS_COLLECTION, seedDocumentId(row.name)), {
      ...row,
      createdAt,
      visitCount: 0,
      dropped: false,
      archived: false,
      source: 'seed',
    });
  });
  if (includeUpdates) {
    preview.changed.forEach((change) => {
      batch.update(doc(firestore, SHOPS_COLLECTION, change.id), {
        ...change.seed,
        seedSyncedAt: serverTimestamp(),
      });
    });
  }
  if (preview.missing.length > 0 || (includeUpdates && preview.changed.length > 0)) {
    await batch.commit();
  }
  return {
    added: preview.missing.length,
    updated: includeUpdates ? preview.changed.length : 0,
  };
}

// Adds new seed rows automatically. Existing shops are never overwritten here;
// coordinate/address changes require explicit confirmation in the seed sync UI.
export async function loadSeedDataIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const preview = await previewSeedSync();
    await applySeedSync(preview, false);
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
    totalShops: shops.filter((s) => !s.archived).length,
    totalCheckIns: checkIns.length,
    droppedShops: shops.filter((s) => s.dropped).length,
    fireShops: fireCheckIns,
    topShop,
    avgVisitGap,
  };
}
