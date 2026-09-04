import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { fetchCollectionData, getLocalCollection } from '../firebase/storageService';
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
        // Only clear if owner session
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

  const login = async (identifier, password) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      throw new Error('Please enter both Email/ID and Password.');
    }

    // 1. Check if login matches a Staff User created by the Owner
    try {
      let staffList = getLocalCollection(COLLECTIONS.STAFF_USERS);

      // Always also fetch latest from Firestore
      try {
        const cloudStaff = await fetchCollectionData(COLLECTIONS.STAFF_USERS);
        if (cloudStaff && cloudStaff.length > 0) {
          staffList = cloudStaff;
        }
      } catch (err) {
        console.warn('Live staff fetch error during login:', err);
      }

      if (staffList && staffList.length > 0) {
        const staffMember = staffList.find((s) => {
          const sEmail = (s.email || '').trim().toLowerCase();
          const sName = (s.name || '').trim().toLowerCase();
          const sPhone = (s.phone || '').trim().toLowerCase();
          const sUsername = sEmail.includes('@') ? sEmail.split('@')[0] : sEmail;

          return (
            sEmail === cleanId ||
            sName === cleanId ||
            sPhone === cleanId ||
            sUsername === cleanId
          );
        });

        if (staffMember) {
          // Compare password
          if (String(staffMember.password || '').trim() !== cleanPass) {
            throw new Error('Incorrect staff password. Please re-enter or check with owner.');
          }

          if (staffMember.status === 'inactive') {
            throw new Error('This staff account is currently inactive (disabled). Please contact the Owner.');
          }

          // Build staff session
          const fallbackPerms = ROLE_PRESETS[staffMember.role]?.permissions || ROLE_PRESETS.receptionist.permissions;
          const defaultLabel =
            staffMember.role === 'receptionist'
              ? '🛎️ Receptionist'
              : staffMember.role === 'manager'
              ? '👔 Branch Manager'
              : staffMember.role || 'Staff Member';

          const staffSession = {
            uid: staffMember.id,
            email: staffMember.email,
            displayName: staffMember.name || 'Staff Member',
            role: staffMember.role || 'receptionist',
            roleLabel: staffMember.roleLabel || defaultLabel,
            permissions: staffMember.permissions || fallbackPerms,
            phone: staffMember.phone || '',
          };

          setUser(staffSession);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staffSession));
          return staffSession;
        }
      }
    } catch (e) {
      if (
        e.message.includes('Incorrect staff password') ||
        e.message.includes('inactive')
      ) {
        throw e;
      }
      console.warn('Staff lookup error:', e);
    }

    // 2. Standard Firebase Authentication for Owner
    if (cleanId.includes('@')) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanId, cleanPass);
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
        if (
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-login-credentials'
        ) {
          throw new Error('Invalid email or password. If you are logging in as staff, verify your ID/Password in Staff & Roles.');
        } else if (err.code === 'auth/wrong-password') {
          throw new Error('Incorrect password. Please try again.');
        } else if (err.code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw new Error(err.message || 'Authentication failed. Please check credentials.');
      }
    } else {
      throw new Error('No staff account found with this ID or Username. Please check your spelling or contact the owner.');
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

