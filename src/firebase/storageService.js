import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '../utils/constants';

const getLocalKey = (coll) => `studypoint_db_${coll}`;

export const getLocalCollection = (coll) => {
  try {
    const data = localStorage.getItem(getLocalKey(coll));
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading localStorage', e);
  }
  return [];
};

export const setLocalCollection = (coll, items) => {
  try {
    localStorage.setItem(getLocalKey(coll), JSON.stringify(items));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
};

// Fast timeout helper to prevent hanging on blocked/pending Firestore network calls
const fetchWithTimeout = (promise, ms = 1500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore connection timeout')), ms)),
  ]);
};

export const fetchCollectionData = async (collectionName) => {
  // 1. Try to read from Firestore
  try {
    const snap = await fetchWithTimeout(getDocs(collection(db, collectionName)), 1500);
    if (snap && snap.docs) {
      const cloudItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (cloudItems.length > 0) {
        setLocalCollection(collectionName, cloudItems);
        return cloudItems;
      }
    }
  } catch (err) {
    // Graceful fallback to local cache on timeout/offline
  }

  // 2. Return local collection data
  const localData = getLocalCollection(collectionName);
  if (localData && localData.length > 0) {
    return localData;
  }

  return [];
};

export const createDocument = async (collectionName, data, customId = null) => {
  const docId = customId || 'doc_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  const now = new Date();
  const newRecord = {
    ...data,
    id: docId,
    createdAt: now.toISOString(),
  };

  // 1. Save to LocalStorage immediately for instant UI response
  const localList = getLocalCollection(collectionName);
  const existingIdx = localList.findIndex((i) => i.id === docId);
  if (existingIdx >= 0) {
    localList[existingIdx] = { ...localList[existingIdx], ...newRecord };
  } else {
    localList.push(newRecord);
  }
  setLocalCollection(collectionName, localList);

  // 2. Save to Firestore with guaranteed matching ID
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      id: docId,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn(`Firestore save warning (${collectionName}):`, err.message);
  }

  return newRecord;
};

export const updateDocument = async (collectionName, docId, updates) => {
  // 1. Update LocalStorage immediately
  const localList = getLocalCollection(collectionName);
  const index = localList.findIndex((i) => i.id === docId);
  if (index >= 0) {
    localList[index] = { ...localList[index], ...updates, updatedAt: new Date().toISOString() };
    setLocalCollection(collectionName, localList);
  }

  // 2. Update Firestore with setDoc merge
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn(`Firestore update warning (${collectionName}):`, err.message);
  }
};

export const removeDocument = async (collectionName, docId) => {
  // 1. Remove from LocalStorage immediately
  const localList = getLocalCollection(collectionName);
  const filtered = localList.filter((i) => i.id !== docId);
  setLocalCollection(collectionName, filtered);

  // 2. Remove from Firestore
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (err) {
    console.warn(`Firestore delete warning (${collectionName}):`, err.message);
  }
};

// Complete Database Cleaner
export const clearAllDatabaseData = async () => {
  const collectionsToClear = [
    COLLECTIONS.STUDENTS,
    COLLECTIONS.SECTIONS,
    COLLECTIONS.SEATS,
    COLLECTIONS.FEES,
    COLLECTIONS.EXPENSES,
    COLLECTIONS.MEMBERSHIP_PLANS,
  ];

  // 1. Clear LocalStorage
  collectionsToClear.forEach((coll) => {
    localStorage.removeItem(getLocalKey(coll));
    setLocalCollection(coll, []);
  });

  // 2. Clear Firestore in background
  try {
    for (const collName of collectionsToClear) {
      const snap = await fetchWithTimeout(getDocs(collection(db, collName)), 1500).catch(() => null);
      if (snap && snap.docs) {
        for (const d of snap.docs) {
          deleteDoc(doc(db, collName, d.id)).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('Firestore remote clean error:', err);
  }

  return { success: true, message: 'All student, seat, fee, expense and section data cleared.' };
};
