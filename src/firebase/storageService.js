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


/**
 * Returns the active tenant ID for multi-tenant data isolation.
 * - 'geniuslibrary1526@gmail.com' -> 'genius_root' (mapped to root Firestore collections for 100% data preservation)
 * - Other owners (e.g. 'study@gmail.com') -> user.uid (stored in subcollection libraries/{uid}/...)
 * - Staff users -> staff.tenantId (inherited from the owner who created them)
 */
export const getActiveTenantId = () => {
  try {
    const sessionStr = localStorage.getItem('studypoint_auth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session) {
        if (session.tenantId) {
          return session.tenantId;
        }
        if (session.ownerId) {
          return session.ownerId;
        }
        const email = (session.email || '').toLowerCase().trim();
        if (email === 'geniuslibrary1526@gmail.com') {
          return 'genius_root';
        }
        // For staff users, never use staff doc ID as tenantId
        if (session.role && session.role !== 'owner') {
          return 'genius_root';
        }
        if (session.uid) {
          return session.uid;
        }
      }
    }
  } catch (e) {
    console.error('Error getting active tenant ID', e);
  }
  return 'genius_root';
};

/**
 * Get Firestore Collection Reference scoped to the active tenant.
 * For 'genius_root', uses the root collection directly.
 * For other tenants, uses subcollection under /libraries/{tenantId}/{collectionName}.
 */
export const getFirestoreCollectionRef = (collectionName, customTenantId = null) => {
  const tenantId = customTenantId || getActiveTenantId();
  if (tenantId === 'genius_root') {
    return collection(db, collectionName);
  }
  return collection(db, 'libraries', tenantId, collectionName);
};

/**
 * Get Firestore Document Reference scoped to the active tenant.
 */
export const getFirestoreDocRef = (collectionName, docId, customTenantId = null) => {
  const tenantId = customTenantId || getActiveTenantId();
  if (tenantId === 'genius_root') {
    return doc(db, collectionName, docId);
  }
  return doc(db, 'libraries', tenantId, collectionName, docId);
};

export const getTenantStorageKey = (baseKey) => {
  const tenantId = getActiveTenantId();
  return `studypoint_${tenantId}_${baseKey}`;
};

export const getTenantItem = (baseKey, defaultValue = null) => {
  try {
    const tenantKey = getTenantStorageKey(baseKey);
    const data = localStorage.getItem(tenantKey);
    if (data !== null) return data;

    // Backward compatibility for genius_root legacy un-prefixed keys
    if (getActiveTenantId() === 'genius_root') {
      const legacy = localStorage.getItem(`studypoint_${baseKey}`);
      if (legacy !== null) {
        localStorage.setItem(tenantKey, legacy);
        return legacy;
      }
    }
  } catch (e) {
    console.error('Error reading tenant localStorage item', e);
  }
  return defaultValue;
};

export const setTenantItem = (baseKey, value) => {
  try {
    const tenantKey = getTenantStorageKey(baseKey);
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(tenantKey, strVal);
  } catch (e) {
    console.error('Error setting tenant localStorage item', e);
  }
};

const getLocalKey = (coll) => {
  const tenantId = getActiveTenantId();
  return `studypoint_${tenantId}_db_${coll}`;
};

export const getLocalCollection = (coll) => {
  try {
    const key = getLocalKey(coll);
    let data = localStorage.getItem(key);

    // Backward compatibility for genius_root legacy keys (e.g. studypoint_db_students)
    if (!data && getActiveTenantId() === 'genius_root') {
      const legacyData = localStorage.getItem(`studypoint_db_${coll}`);
      if (legacyData) {
        data = legacyData;
        localStorage.setItem(key, legacyData);
      }
    }

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
const fetchWithTimeout = (promise, ms = 4000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore connection timeout')), ms)),
  ]);
};

export const fetchCollectionData = async (collectionName) => {
  const tenantId = getActiveTenantId();
  // 1. Try to read from Firestore
  try {
    const collRef = getFirestoreCollectionRef(collectionName, tenantId);
    const snap = await fetchWithTimeout(getDocs(collRef), 4000);
    if (snap && snap.docs) {
      const cloudItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (cloudItems.length > 0) {
        setLocalCollection(collectionName, cloudItems);
        return cloudItems;
      } else {
        // If cloud is empty but local cache already has items (e.g. freshly seeded), preserve local data
        const localData = getLocalCollection(collectionName);
        if (localData && localData.length > 0) {
          return localData;
        }
        setLocalCollection(collectionName, []);
        return [];
      }
    }
  } catch (err) {
    // Graceful fallback to local cache on timeout/offline
    console.warn(`Firestore read failed for ${collectionName} (tenant: ${tenantId}), using cache.`, err);
  }

  // 2. Return local collection data
  const localData = getLocalCollection(collectionName);
  return localData || [];
};

export const createDocument = async (collectionName, data, customId = null) => {
  const tenantId = getActiveTenantId();
  const docId = customId || 'doc_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  const now = new Date();
  const newRecord = {
    ...data,
    id: docId,
    tenantId: tenantId,
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
    await setDoc(getFirestoreDocRef(collectionName, docId, tenantId), {
      ...data,
      id: docId,
      tenantId: tenantId,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn(`Firestore save warning (${collectionName}):`, err.message);
  }

  return newRecord;
};

export const updateDocument = async (collectionName, docId, updates) => {
  const tenantId = getActiveTenantId();

  // 1. Update LocalStorage immediately
  const localList = getLocalCollection(collectionName);
  const index = localList.findIndex((i) => i.id === docId);
  if (index >= 0) {
    localList[index] = { ...localList[index], ...updates, updatedAt: new Date().toISOString() };
    setLocalCollection(collectionName, localList);
  }

  // 2. Update Firestore with setDoc merge
  try {
    await setDoc(getFirestoreDocRef(collectionName, docId, tenantId), {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn(`Firestore update warning (${collectionName}):`, err.message);
  }
};

export const removeDocument = async (collectionName, docId) => {
  const tenantId = getActiveTenantId();

  // 1. Remove from LocalStorage immediately
  const localList = getLocalCollection(collectionName);
  const filtered = localList.filter((i) => i.id !== docId);
  setLocalCollection(collectionName, filtered);

  // 2. Remove from Firestore
  try {
    await deleteDoc(getFirestoreDocRef(collectionName, docId, tenantId));
  } catch (err) {
    console.warn(`Firestore delete warning (${collectionName}):`, err.message);
  }
};

// Complete Database Cleaner (scoped strictly to current tenant)
export const clearAllDatabaseData = async () => {
  const tenantId = getActiveTenantId();
  const collectionsToClear = [
    COLLECTIONS.STUDENTS,
    COLLECTIONS.SECTIONS,
    COLLECTIONS.SEATS,
    COLLECTIONS.FEES,
    COLLECTIONS.EXPENSES,
    COLLECTIONS.MEMBERSHIP_PLANS,
  ];

  // 1. Clear LocalStorage for this tenant only
  collectionsToClear.forEach((coll) => {
    localStorage.removeItem(getLocalKey(coll));
    setLocalCollection(coll, []);
  });

  // 2. Clear Firestore for this tenant only
  try {
    for (const collName of collectionsToClear) {
      const snap = await fetchWithTimeout(getDocs(getFirestoreCollectionRef(collName, tenantId)), 4000).catch(() => null);
      if (snap && snap.docs) {
        for (const d of snap.docs) {
          deleteDoc(getFirestoreDocRef(collName, d.id, tenantId)).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('Firestore remote clean error:', err);
  }

  return { success: true, message: 'All student, seat, fee, expense and section data cleared for current library.' };
};
