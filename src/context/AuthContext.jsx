import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { fetchCollectionData } from '../firebase/storageService';
import { COLLECTIONS, ROLE_PRESETS } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const LOCAL_STORAGE_KEY = 'studypoint_auth_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage session
    const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    // 2. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          try {
            setUser(JSON.parse(local));
          } catch (e) {}
        } else {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Owner',
            role: 'owner',
            permissions: ROLE_PRESETS.owner.permissions,
          };
          setUser(userData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        }
      } else {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        // Only clear if not a staff session
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.role === 'owner') {
              // owner signed out
            }
          } catch (e) {}
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const hasPermission = (moduleName, action = 'view') => {
    if (!user) return false;
    if (!user.role || user.role === 'owner') return true;

    const modulePerms = user.permissions?.[moduleName];
    if (!modulePerms) return false;
    return !!modulePerms[action];
  };

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Please enter both email and password.');
    }

    // 1. Check if login matches a Staff User created by the Owner
    try {
      const staffList = await fetchCollectionData(COLLECTIONS.STAFF_USERS);
      const staffMember = staffList.find(
        (s) =>
          s.email?.trim().toLowerCase() === cleanEmail &&
          s.password?.trim() === cleanPass &&
          s.status !== 'inactive'
      );

      if (staffMember) {
        const staffSession = {
          uid: staffMember.id,
          email: staffMember.email,
          displayName: staffMember.name || 'Staff Member',
          role: staffMember.role || 'receptionist',
          permissions: staffMember.permissions || ROLE_PRESETS[staffMember.role]?.permissions || {},
          phone: staffMember.phone || '',
        };
        setUser(staffSession);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staffSession));
        return staffSession;
      }
    } catch (e) {
      console.warn('Staff lookup:', e);
    }

    // 2. Standard Firebase Authentication for Owner
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || 'Owner',
        role: 'owner',
        permissions: ROLE_PRESETS.owner.permissions,
      };
      setUser(userData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
      return userData;
    } catch (err) {
      // Friendly error messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        throw new Error('Invalid email or password. If you are a new owner, please sign up.');
      } else if (err.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      throw new Error(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  const signup = async (email, password, displayName = 'Owner') => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanPass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName || 'Owner',
      role: 'owner',
      permissions: ROLE_PRESETS.owner.permissions,
    };
    setUser(userData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error', e);
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
