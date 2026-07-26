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

// Shops
export async function getShops(): Promise<Shop[]> {
  if (!db) return [];
  const q = query(collection(db, SHOPS_COLLECTION), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() || new Date(),
    lastVisit: d.data().lastVisit?.toDate(),
  })) as Shop[];
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

export async function updateShop(
  id: string,
  data: Partial<Shop>
): Promise<void> {
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
  let q;
  if (shopId) {
    q = query(
      collection(db, CHECKINS_COLLECTION),
      where('shopId', '==', shopId),
      orderBy('timestamp', 'desc')
    );
  } else {
    q = query(
      collection(db, CHECKINS_COLLECTION),
      orderBy('timestamp', 'desc')
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toDate() || new Date(),
  })) as CheckIn[];
}

// BOLO Wishlist
export async function getBoloItems(): Promise<BoloItem[]> {
  if (!db) return [];
  const q = query(collection(db, BOLO_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() || new Date(),
  })) as BoloItem[];
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
