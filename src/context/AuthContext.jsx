import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { collectionGroup, getDocs, getDoc } from 'firebase/firestore';
import { fetchCollectionData, getLocalCollection, getFirestoreDocRef } from '../firebase/storageService';
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
        if (!parsed.tenantId) {
          const emailLower = (parsed.email || '').toLowerCase().trim();
          parsed.tenantId = emailLower === 'geniuslibrary1526@gmail.com' ? 'genius_root' : parsed.uid;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    // 2. Refresh staff session from database on startup
    const syncStaffSession = async (currUser) => {
      if (!currUser || currUser.role === 'owner') return;
      try {
        let staffList = getLocalCollection(COLLECTIONS.STAFF_USERS);
        const cloudStaff = await fetchCollectionData(COLLECTIONS.STAFF_USERS);
        if (cloudStaff && cloudStaff.length > 0) staffList = cloudStaff;

        const staffMember = staffList.find(
          (s) => s.id === currUser.uid || s.email?.toLowerCase() === currUser.email?.toLowerCase()
        );

        if (staffMember) {
          if (staffMember.status === 'inactive') {
            console.warn('Staff account has been deactivated by owner. Logging out.');
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setUser(null);
            return;
          }

          const roleLabel =
            staffMember.roleLabel ||
            (staffMember.role === 'receptionist'
              ? '🛎️ Receptionist'
              : staffMember.role === 'manager'
              ? '👔 Branch Manager'
              : '⚙️ Custom Role');

          const updated = {
            ...currUser,
            displayName: staffMember.name || currUser.displayName,
            role: staffMember.role || 'receptionist',
            roleLabel,
            permissions: staffMember.permissions || currUser.permissions,
            dashboardWidgets: staffMember.dashboardWidgets || currUser.dashboardWidgets,
            phone: staffMember.phone || currUser.phone,
          };
          setUser(updated);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } else if (staffList.length > 0 && cloudStaff && cloudStaff.length > 0) {
          // Staff member was deleted
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setUser(null);
        }
      } catch (e) {
        console.warn('Session sync error:', e);
      }
    };

    // Sync owner session with configured ownerName from settings
    const syncOwnerSession = async (currUser) => {
      if (!currUser || currUser.role !== 'owner') return;
      try {
        const tenantId = currUser.tenantId || 'genius_root';
        const sKey = `studypoint_${tenantId}_settings`;
        let local = localStorage.getItem(sKey);
        if (!local && tenantId === 'genius_root') {
          local = localStorage.getItem('studypoint_settings');
        }
        let ownerName = '';
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.ownerName && parsed.ownerName.trim() && parsed.ownerName.toLowerCase() !== 'owner') {
              ownerName = parsed.ownerName.trim();
            }
          } catch (_) {}
        }

        if (!ownerName) {
          const docSnap = await getDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'ownerProfile'));
          if (docSnap && docSnap.exists()) {
            const cloudData = docSnap.data();
            if (cloudData.ownerName && cloudData.ownerName.trim() && cloudData.ownerName.toLowerCase() !== 'owner') {
              ownerName = cloudData.ownerName.trim();
              if (local) {
                try {
                  const p = JSON.parse(local);
                  localStorage.setItem(sKey, JSON.stringify({ ...p, ownerName }));
                } catch (_) {}
              }
            }
          }
        }

        if (ownerName && currUser.displayName !== ownerName) {
          const updated = {
            ...currUser,
            displayName: ownerName,
          };
          setUser(updated);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Owner session sync warning:', err);
      }
    };

    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.role !== 'owner') {
          syncStaffSession(parsed);
        } else {
          syncOwnerSession(parsed);
        }
      } catch (e) {}
    }

    // Periodic staff session check every 30 seconds
    const staffSyncInterval = setInterval(() => {
      const liveSession = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (liveSession) {
        try {
          const parsed = JSON.parse(liveSession);
          if (parsed && parsed.role !== 'owner') {
            syncStaffSession(parsed);
          }
        } catch (e) {}
      }
    }, 30000);

    // 3. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const emailLower = (firebaseUser.email || '').toLowerCase().trim();
        const tenantId = emailLower === 'geniuslibrary1526@gmail.com' ? 'genius_root' : firebaseUser.uid;

        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (!parsed.tenantId) {
              parsed.tenantId = tenantId;
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
            }
            setUser(parsed);
            if (parsed.role !== 'owner') {
              syncStaffSession(parsed);
            } else {
              syncOwnerSession(parsed);
            }
          } catch (e) {}
        } else {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Owner',
            role: 'owner',
            roleLabel: '👑 Owner',
            tenantId: tenantId,
            permissions: ROLE_PRESETS.owner.permissions,
          };
          setUser(userData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
          syncOwnerSession(userData);
        }
      } else {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.role === 'owner') {
              // owner signed out
            } else {
              syncStaffSession(parsed);
            }
          } catch (e) {}
        }
      }
      setLoading(false);
    });

    return () => {
      clearInterval(staffSyncInterval);
      unsubscribe();
    };
  }, []);

  const refreshUserSession = (updatedSession) => {
    setUser(updatedSession);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSession));
  };

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

      let staffMember = (staffList || []).find((s) => {
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

      // If staff not found in active tenant, search across all libraries using collectionGroup
      if (!staffMember) {
        try {
          const groupSnap = await getDocs(collectionGroup(db, COLLECTIONS.STAFF_USERS));
          if (groupSnap && groupSnap.docs) {
            for (const d of groupSnap.docs) {
              const s = { id: d.id, ...d.data() };
              const sEmail = (s.email || '').trim().toLowerCase();
              const sName = (s.name || '').trim().toLowerCase();
              const sPhone = (s.phone || '').trim().toLowerCase();
              const sUsername = sEmail.includes('@') ? sEmail.split('@')[0] : sEmail;

              if (sEmail === cleanId || sName === cleanId || sPhone === cleanId || sUsername === cleanId) {
                staffMember = s;
                break;
              }
            }
          }
        } catch (cgErr) {
          console.warn('Cross-library staff search warning:', cgErr);
        }
      }

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
          tenantId: staffMember.tenantId || staffMember.ownerId || 'genius_root',
          permissions: staffMember.permissions || fallbackPerms,
          dashboardWidgets: staffMember.dashboardWidgets || null,
          phone: staffMember.phone || '',
        };

        setUser(staffSession);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staffSession));
        return staffSession;
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
        const emailLower = (userCredential.user.email || '').toLowerCase().trim();
        const tenantId = emailLower === 'geniuslibrary1526@gmail.com' ? 'genius_root' : userCredential.user.uid;
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || 'Owner',
          role: 'owner',
          roleLabel: '👑 Owner',
          tenantId: tenantId,
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
    const tenantId = cleanEmail === 'geniuslibrary1526@gmail.com' ? 'genius_root' : userCredential.user.uid;
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName || 'Owner',
      role: 'owner',
      roleLabel: '👑 Owner',
      tenantId: tenantId,
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

  const userRole = user?.role || 'owner';

  const value = {
    user,
    userRole,
    loading,
    login,
    signup,
    logout,
    hasPermission,
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

