import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const useFirestore = (collectionName) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async (queryConstraints = []) => {
    setLoading(true);
    try {
      const ref = collection(db, collectionName);
      const q = queryConstraints.length > 0
        ? query(ref, ...queryConstraints)
        : ref;
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDocuments(docs);
      setError(null);
      return docs;
    } catch (err) {
      setError(err.message);
      console.error('Firestore fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getDocument = async (docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const addDocument = async (data) => {
    try {
      const ref = collection(db, collectionName);
      const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
      });
      await fetchDocuments();
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument,
  };
};

export default useFirestore;
