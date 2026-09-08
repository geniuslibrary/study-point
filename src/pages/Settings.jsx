import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { COLLECTIONS, DEFAULT_ADDONS, SHIFTS } from '../utils/constants';
import { getStoredShifts } from '../utils/helpers';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X,
  BookOpen,
  Edit2,
  Check,
  PenTool,
  Clock,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
  Database,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getActiveTenantId,
  getFirestoreCollectionRef,
  getFirestoreDocRef,
  getTenantItem,
  setTenantItem,
} from '../firebase/storageService';
import { seedOneYearDummyData } from '../utils/seedData';
import { useAuth } from '../context/AuthContext';

const getSettingsLocalKey = () => `studypoint_${getActiveTenantId()}_settings`;
const getAddonsLocalKey = () => `studypoint_${getActiveTenantId()}_addons`;
const getShiftsLocalKey = () => `studypoint_${getActiveTenantId()}_shifts`;

export default function Settings() {
  const { user, refreshUserSession } = useAuth();
  const fileInputRef = useRef(null);
  const signInputRef = useRef(null);

  const [info, setInfo] = useState({
    studyPointName: 'Royal Study Point & Library',
    ownerName: 'Manish',
    phone: '9876543210',
    email: 'study@gmail.com',
    address: 'Near Metro Station, Main Road, Study Zone',
    logoUrl: '',
    signatureUrl: '',
  });

  const [addons, setAddons] = useState([]);
  const [newAddon, setNewAddon] = useState({ name: '', monthlyCharge: '' });
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [editAddonData, setEditAddonData] = useState({ name: '', monthlyCharge: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Shift timings state
  const [shifts, setShifts] = useState(getStoredShifts());
  const [isSavingShifts, setIsSavingShifts] = useState(false);

  const fetchSettings = async () => {
    // 1. Check LocalStorage first for instantaneous render (tenant-scoped)
    const sKey = getSettingsLocalKey();
    let local = localStorage.getItem(sKey);
    if (!local && getActiveTenantId() === 'genius_root') {
      local = localStorage.getItem('studypoint_settings');
      if (local) localStorage.setItem(sKey, local);
    }
    if (local) {
      try {
        setInfo((prev) => ({ ...prev, ...JSON.parse(local) }));
      } catch (e) {}
    }

    try {
      const settingsDoc = await getDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'ownerProfile'));
      if (settingsDoc.exists()) {
        const cloudData = settingsDoc.data();
        setInfo((prev) => ({ ...prev, ...cloudData }));
        localStorage.setItem(sKey, JSON.stringify(cloudData));
      }
    } catch (e) {
      console.warn('Settings fetch warning:', e.message);
    }

    // 2. Fetch Shifts Configuration (tenant-scoped)
    try {
      const shKey = getShiftsLocalKey();
      let localShifts = localStorage.getItem(shKey);
      if (!localShifts && getActiveTenantId() === 'genius_root') {
        localShifts = localStorage.getItem('studypoint_shifts');
        if (localShifts) localStorage.setItem(shKey, localShifts);
      }
      if (localShifts) {
        setShifts(JSON.parse(localShifts));
      } else {
        const shiftDoc = await getDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'shiftTimings'));
        if (shiftDoc.exists() && shiftDoc.data().shifts) {
          setShifts(shiftDoc.data().shifts);
          localStorage.setItem(shKey, JSON.stringify(shiftDoc.data().shifts));
        }
      }
    } catch (e) {
      console.warn('Shift settings fetch warning:', e.message);
    }

    // 3. Fetch Add-ons (tenant-scoped)
    try {
      const adKey = getAddonsLocalKey();
      let localAddons = localStorage.getItem(adKey);
      if (!localAddons && getActiveTenantId() === 'genius_root') {
        localAddons = localStorage.getItem('studypoint_addons');
        if (localAddons) localStorage.setItem(adKey, localAddons);
      }
      if (localAddons) {
        try {
          setAddons(JSON.parse(localAddons));
        } catch (e) {}
      }

      const addonSnap = await getDocs(getFirestoreCollectionRef(COLLECTIONS.ADDON_PRICING));
      const addonsData = addonSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const initKey = `studypoint_${getActiveTenantId()}_addons_initialized`;
      if (addonsData.length === 0 && !localStorage.getItem(initKey)) {
        const seeded = [];
        for (const def of DEFAULT_ADDONS) {
          try {
            const added = await addDoc(getFirestoreCollectionRef(COLLECTIONS.ADDON_PRICING), {
              name: def.name,
              monthlyCharge: Number(def.monthlyCharge) || 0,
              isActive: true,
            });
            seeded.push({ id: added.id, name: def.name, monthlyCharge: def.monthlyCharge, isActive: true });
          } catch (err) {
            seeded.push({ id: 'addon_' + Math.random().toString(36).substr(2, 6), ...def });
          }
        }
        localStorage.setItem(initKey, 'true');
        localStorage.setItem(adKey, JSON.stringify(seeded));
        setAddons(seeded);
      } else {
        localStorage.setItem(initKey, 'true');
        localStorage.setItem(adKey, JSON.stringify(addonsData));
        setAddons(addonsData);
      }
    } catch (e) {
      console.warn('Addons fetch error:', e.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  const optimizeGraphicFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file selected'));

      // Keep SVG as raw data URL without rasterizing
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      let objectUrl = null;
      try {
        objectUrl = URL.createObjectURL(file);
      } catch (e) {
        objectUrl = null;
      }

      const finishWithCanvas = (img) => {
        try {
          const maxDim = 1200;
          let width = img.naturalWidth || img.width || 400;
          let height = img.naturalHeight || img.height || 400;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const quality = mimeType === 'image/jpeg' ? 0.9 : undefined;
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        } catch (err) {
          fallbackReader();
        } finally {
          if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch (_) {}
          }
        }
      };

      const fallbackReader = () => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };

      if (objectUrl) {
        const img = new Image();
        img.onload = () => finishWithCanvas(img);
        img.onerror = () => {
          if (objectUrl) try { URL.revokeObjectURL(objectUrl); } catch (_) {}
          fallbackReader();
        };
        img.src = objectUrl;
      } else {
        fallbackReader();
      }
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await optimizeGraphicFile(file);
      setInfo((prev) => ({ ...prev, logoUrl: dataUrl }));
      showToast('Logo image selected! Click "Save Details & Signature" to apply.');
    } catch (err) {
      console.error('Logo upload error:', err);
      showToast('Error reading logo file');
    }
  };

  const handleRemoveLogo = () => {
    setInfo((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Logo removed');
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await optimizeGraphicFile(file);
      setInfo((prev) => ({ ...prev, signatureUrl: dataUrl }));
      showToast('Signature image selected! Click "Save Details & Signature" to apply.');
    } catch (err) {
      console.error('Signature upload error:', err);
      showToast('Error reading signature file');
    }
  };

  const handleRemoveSignature = () => {
    setInfo((prev) => ({ ...prev, signatureUrl: '' }));
    if (signInputRef.current) signInputRef.current.value = '';
    showToast('Signature removed');
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const sKey = getSettingsLocalKey();
      localStorage.setItem(sKey, JSON.stringify(info));
      setTenantItem('library_name', info.studyPointName);
      setTenantItem('library_phone', info.phone);

      try {
        await setDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'ownerProfile'), info);
      } catch (cloudErr) {
        console.warn('Cloud save warning:', cloudErr.message);
      }

      if (user && user.role === 'owner' && info.ownerName && info.ownerName.trim()) {
        refreshUserSession({
          ...user,
          displayName: info.ownerName.trim(),
        });
      }

      showToast('🎉 Library details, Logo & Signature saved successfully! All Bills will now display your Signature.');
    } catch (e) {
      console.error('Error saving settings:', e);
      showToast('Error saving settings: ' + e.message);
    }
    setIsSaving(false);
  };

  // Add New Blank Shift Block
  const handleAddNewShiftBlock = () => {
    const newId = 'shift_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const newBlock = {
      id: newId,
      label: 'New Shift Slot',
      start: '',
      end: '',
      timing: '',
      short: '',
      color: 'indigo',
    };
    setShifts((prev) => [...prev, newBlock]);
    showToast('✨ New blank shift block generated! Enter timing details and save.');
  };

  // Delete Shift Block
  const handleDeleteShiftBlock = (shiftId) => {
    if (shifts.length <= 1) {
      alert('At least 1 shift must remain configured.');
      return;
    }
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    showToast('Shift block removed');
  };

  // Handle Shift Timing Edit
  const handleShiftChange = (shiftId, field, val) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== shiftId) return s;
        const updated = { ...s, [field]: val };
        if (field === 'start' || field === 'end') {
          const start = field === 'start' ? val : (s.start || '');
          const end = field === 'end' ? val : (s.end || '');
          if (start && end) {
            updated.timing = `${start} - ${end}`;
            if (!updated.short || updated.short === s.short) {
              updated.short = `${start.replace(':00', '')} - ${end.replace(':00', '')}`;
            }
          }
        }
        return updated;
      })
    );
  };

  // Save Shift Timings to Firestore & LocalStorage (tenant-scoped)
  const handleSaveShifts = async (e) => {
    if (e) e.preventDefault();
    setIsSavingShifts(true);
    try {
      localStorage.setItem(getShiftsLocalKey(), JSON.stringify(shifts));
      try {
        await setDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'shiftTimings'), { shifts });
      } catch (cloudErr) {
        console.warn('Cloud shift save warning:', cloudErr.message);
      }
      showToast('🎉 Shift Timings updated successfully! All Seat Grids & Student Admissions will use new timings.');
    } catch (err) {
      console.error('Error saving shifts:', err);
      showToast('Error saving shifts: ' + err.message);
    } finally {
      setIsSavingShifts(false);
    }
  };

  // Add new Add-on Facility (tenant-scoped)
  const handleAddAddon = async (e) => {
    if (e) e.preventDefault();
    if (!newAddon.name.trim()) return;

    const chargeNum = newAddon.monthlyCharge === '' ? 0 : Number(newAddon.monthlyCharge) || 0;
    try {
      let newDocId = 'addon_' + Date.now();
      try {
        const added = await addDoc(getFirestoreCollectionRef(COLLECTIONS.ADDON_PRICING), {
          name: newAddon.name.trim(),
          monthlyCharge: chargeNum,
          isActive: true,
        });
        newDocId = added.id;
      } catch (err) {
        console.warn('Addon add cloud error:', err);
      }

      const updated = [...addons, { id: newDocId, name: newAddon.name.trim(), monthlyCharge: chargeNum, isActive: true }];
      setAddons(updated);
      localStorage.setItem(getAddonsLocalKey(), JSON.stringify(updated));
      setNewAddon({ name: '', monthlyCharge: '' });
      showToast(`Facility "${newAddon.name.trim()}" added successfully!`);
    } catch (e) {
      console.error('Error adding addon:', e);
    }
  };

  // Start Editing an Add-on
  const handleStartEdit = (addon) => {
    setEditingAddonId(addon.id);
    setEditAddonData({
      name: addon.name || '',
      monthlyCharge: addon.monthlyCharge !== undefined && addon.monthlyCharge !== null ? String(addon.monthlyCharge) : '',
    });
  };

  // Save Edit of an Add-on (tenant-scoped)
  const handleSaveEditAddon = async (id) => {
    if (!editAddonData.name.trim()) return;
    const chargeNum = editAddonData.monthlyCharge === '' ? 0 : Number(editAddonData.monthlyCharge) || 0;

    try {
      try {
        await updateDoc(getFirestoreDocRef(COLLECTIONS.ADDON_PRICING, id), {
          name: editAddonData.name.trim(),
          monthlyCharge: chargeNum,
        });
      } catch (err) {
        console.warn('Cloud update addon error:', err);
      }

      const updated = addons.map((a) =>
        a.id === id ? { ...a, name: editAddonData.name.trim(), monthlyCharge: chargeNum } : a
      );
      setAddons(updated);
      localStorage.setItem(getAddonsLocalKey(), JSON.stringify(updated));
      setEditingAddonId(null);
      showToast('Facility details updated successfully!');
    } catch (e) {
      console.error('Error updating addon:', e);
    }
  };

  // Delete an Add-on (tenant-scoped)
  const handleDeleteAddon = async (id) => {
    try {
      try {
        await deleteDoc(getFirestoreDocRef(COLLECTIONS.ADDON_PRICING, id));
      } catch (err) {
        console.warn('Cloud delete addon error:', err);
      }

      const updated = addons.filter((a) => a.id !== id);
      setAddons(updated);
      localStorage.setItem(getAddonsLocalKey(), JSON.stringify(updated));
      showToast('Facility Add-on removed');
    } catch (e) {
      console.error('Error deleting addon:', e);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const getShiftIcon = (shiftId = '') => {
    const id = String(shiftId).toLowerCase();
    if (id.includes('full')) return <Sun className="w-4 h-4 text-indigo-600 shrink-0" />;
    if (id.includes('first') || id.includes('morn') || id.includes('1st')) return <Sunrise className="w-4 h-4 text-amber-600 shrink-0" />;
    if (id.includes('second') || id.includes('even') || id.includes('2nd')) return <Sunset className="w-4 h-4 text-purple-600 shrink-0" />;
    if (id.includes('night') || id.includes('rat')) return <Clock className="w-4 h-4 text-blue-600 shrink-0" />;
    return <Clock className="w-4 h-4 text-teal-600 shrink-0" />;
  };

  // --- FACTORY RESET (Strictly Tenant Scoped - Safe for multi-account) ---
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeInput, setWipeInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeData = async () => {
    if (wipeInput !== 'CONFIRM') return;
    setIsWiping(true);
    try {
      const tenantId = getActiveTenantId();
      const allColls = Object.values(COLLECTIONS);
      for (const collName of allColls) {
        const collRef = getFirestoreCollectionRef(collName, tenantId);
        const snap = await getDocs(collRef);
        for (const d of snap.docs) {
          await deleteDoc(getFirestoreDocRef(collName, d.id, tenantId));
        }
      }
      // Remove only this tenant's local data
      allColls.forEach((c) => {
        localStorage.removeItem(`studypoint_${tenantId}_db_${c}`);
      });
      localStorage.removeItem(getSettingsLocalKey());
      localStorage.removeItem(getAddonsLocalKey());
      localStorage.removeItem(getShiftsLocalKey());
      localStorage.removeItem(`studypoint_${tenantId}_whatsapp_templates`);
      localStorage.removeItem(`studypoint_${tenantId}_dashboard_config`);
      localStorage.removeItem(`studypoint_${tenantId}_dashboard_order`);
      window.location.href = '/';
    } catch (error) {
      console.error('Error wiping data:', error);
      alert('Error wiping data. Check console.');
      setIsWiping(false);
    }
  };

  // --- 1 YEAR DUMMY DATA GENERATOR MODAL STATE ---
  const [showDummyModal, setShowDummyModal] = useState(false);
  const [dummyStatus, setDummyStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [dummyErrorMsg, setDummyErrorMsg] = useState('');
  const [dummyStats, setDummyStats] = useState(null);

  const handleOpenDummyModal = () => {
    setDummyStatus('idle');
    setDummyErrorMsg('');
    setShowDummyModal(true);
  };

  const handleStartLoadingDummyData = async () => {
    setDummyStatus('loading');
    setDummyErrorMsg('');
    try {
      const res = await seedOneYearDummyData();
      setDummyStats(res);
      setDummyStatus('success');
      showToast('🎉 1 saal (12 mahine) ka dummy data successfully load ho gaya!');
    } catch (err) {
      console.error('Error loading 1 year dummy data:', err);
      setDummyErrorMsg(err.message || 'Data load karne me samasya aayi.');
      setDummyStatus('error');
    }
  };

  const handleGoToDashboard = () => {
    setShowDummyModal(false);
    window.location.href = '/';
  };

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Study Point Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage library profile, official logo, signature, shift timings & seat facility pricing
            </p>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3.5 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Study Point Info, Logo & Signature */}
          <Card title="Study Point / Library Information (Prints on Bill)">
            <form onSubmit={handleSaveInfo} className="space-y-5">
              {/* Logo & Signature Upload Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Logo Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Library Logo (लोगो)
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {info.logoUrl ? (
                        <img
                          src={info.logoUrl}
                          alt="Library Logo Preview"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center p-1">
                          <ImageIcon className="w-5 h-5 text-indigo-400 mx-auto" />
                          <span className="text-[8px] font-bold text-slate-400 block mt-0.5">No Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-file-input"
                        />
                        <label
                          htmlFor="logo-file-input"
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{info.logoUrl ? 'Change' : 'Upload'}</span>
                        </label>

                        {info.logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Remove logo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">Printed at top of bills</p>
                    </div>
                  </div>
                </div>

                {/* 2. Signature Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Signature / Stamp (हस्ताक्षर)</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {info.signatureUrl ? (
                        <img
                          src={info.signatureUrl}
                          alt="Signature Preview"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center p-1">
                          <PenTool className="w-5 h-5 text-indigo-400 mx-auto" />
                          <span className="text-[8px] font-bold text-slate-400 block mt-0.5">No Sign</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="file"
                          ref={signInputRef}
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleSignatureUpload}
                          className="hidden"
                          id="signature-file-input"
                        />
                        <label
                          htmlFor="signature-file-input"
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{info.signatureUrl ? 'Change' : 'Upload'}</span>
                        </label>

                        {info.signatureUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveSignature}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Remove signature"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">Printed at signatory line</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Study Point / Library Name * (बिल पर यही नाम छपेगा)
                </label>
                <input
                  type="text"
                  name="studyPointName"
                  value={info.studyPointName || ''}
                  onChange={handleInfoChange}
                  required
                  placeholder="e.g. Royal Study Point & Library"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={info.ownerName || ''}
                    onChange={handleInfoChange}
                    placeholder="e.g. Manish"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Phone (बिल व WhatsApp पर)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={info.phone || ''}
                    onChange={handleInfoChange}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Owner Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={info.email || ''}
                  onChange={handleInfoChange}
                  placeholder="study@gmail.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Library Address (बिल पर छपेगा)
                </label>
                <textarea
                  name="address"
                  value={info.address || ''}
                  onChange={handleInfoChange}
                  rows={2}
                  placeholder="e.g. Near Metro Station, Main Road, Study Zone"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" type="submit" disabled={isSaving}>
                  <span className="flex items-center gap-2">
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Details, Logo & Signature'}
                  </span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Seat Shift Timings Configuration (Exact Clean Layout + Header Add Button) */}
          <div className="space-y-6">
            <Card title="Seat Shift & Timing Settings (शिफ्ट व समय प्रबंधन)">
              <form onSubmit={handleSaveShifts} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Set library shift timings. These timings will appear in admission forms & seat layout.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddNewShiftBlock}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>Add Shift Slot</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative group"
                    >
                      {/* Top Row: Icon + Editable Name + Timing Badge + Delete Button */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getShiftIcon(shift.id || shift.label)}
                          <input
                            type="text"
                            value={shift.label || ''}
                            onChange={(e) => handleShiftChange(shift.id, 'label', e.target.value)}
                            placeholder="Shift Name (e.g. Night Shift)"
                            className="font-bold text-xs text-slate-800 bg-transparent border-b border-dashed border-slate-300 hover:border-indigo-400 focus:border-indigo-600 focus:bg-white px-1.5 py-0.5 rounded outline-none w-full max-w-xs transition-colors"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {shift.timing || (shift.start && shift.end ? `${shift.start} - ${shift.end}` : 'Custom')}
                          </span>

                          {shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteShiftBlock(shift.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete shift slot"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Inputs Row: Start Time, End Time, Short Badge */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Start Time</label>
                          <input
                            type="text"
                            value={shift.start || ''}
                            onChange={(e) => handleShiftChange(shift.id, 'start', e.target.value)}
                            placeholder="e.g. 6:00 AM"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">End Time</label>
                          <input
                            type="text"
                            value={shift.end || ''}
                            onChange={(e) => handleShiftChange(shift.id, 'end', e.target.value)}
                            placeholder="e.g. 1:00 PM or 2:00 PM"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Short Badge</label>
                          <input
                            type="text"
                            value={shift.short || ''}
                            onChange={(e) => handleShiftChange(shift.id, 'short', e.target.value)}
                            placeholder="e.g. 6 AM - 1 PM"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-indigo-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button variant="primary" type="submit" disabled={isSavingShifts}>
                    <span className="flex items-center gap-2">
                      <Save size={16} />
                      {isSavingShifts ? 'Saving...' : 'Save Shift Timings (समय सेव करें)'}
                    </span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Add-on Facility Pricing with Full Edit, Update & Delete */}
            <Card title="Seat Add-on Facility Pricing (Monthly Charges)">
              <div className="space-y-4">
                {/* Form to Add New Addon */}
                <form onSubmit={handleAddAddon} className="flex flex-col sm:flex-row gap-2.5 items-end bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex-grow w-full">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name</label>
                    <input
                      type="text"
                      value={newAddon.name}
                      onChange={(e) => setNewAddon((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Locker, Air Cooler, WiFi"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Monthly (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newAddon.monthlyCharge}
                      onChange={(e) => setNewAddon((prev) => ({ ...prev, monthlyCharge: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <Button variant="primary" type="submit">
                    <Plus size={18} />
                  </Button>
                </form>

                {/* List of Addons with Inline Edit & Delete */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Configured Facilities ({addons.length})
                  </h4>
                  {addons.length > 0 ? (
                    <ul className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      {addons.map((addon) => {
                        const isEditing = editingAddonId === addon.id;

                        if (isEditing) {
                          return (
                            <li key={addon.id} className="p-3 bg-indigo-50/60 flex flex-col sm:flex-row items-center gap-2">
                              <input
                                type="text"
                                value={editAddonData.name}
                                onChange={(e) => setEditAddonData((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full sm:w-1/2 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-white font-semibold"
                                placeholder="Facility Name"
                              />
                              <div className="flex items-center gap-1 w-full sm:w-1/3">
                                <span className="text-xs font-bold text-slate-500">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={editAddonData.monthlyCharge}
                                  onChange={(e) => setEditAddonData((prev) => ({ ...prev, monthlyCharge: e.target.value }))}
                                  className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-white font-bold text-indigo-700"
                                  placeholder="0"
                                />
                              </div>
                              <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditAddon(addon.id)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Save changes"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingAddonId(null)}
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </li>
                          );
                        }

                        return (
                          <li key={addon.id} className="flex justify-between items-center p-3.5 hover:bg-slate-50 transition-colors">
                            <span className="font-semibold text-slate-900 text-sm">{addon.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-indigo-700 font-black text-sm bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                ₹{addon.monthlyCharge || addon.price || 0}/month
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(addon)}
                                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Edit facility name / charge"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddon(addon.id)}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Delete facility"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic p-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      No add-on facilities defined. Add one above!
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
          
          {/* --- 1 YEAR DUMMY DATA GENERATOR --- */}
          <div className="mt-8 border-t border-indigo-100 pt-8">
            <Card title="⚡ Load 1 Year Dummy Data (1 साल का डमी डेटा लोड करें)">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Software ke sabhi features jaise <strong>12-Month Revenue Graphs, Daily/Monthly Reports, Admissions vs Exits Churn, Seat Occupancy</strong> aur <strong>Pending Dues & Expiries</strong> ko test karne ke liye 1 saal ka realistic dummy data load karein.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-center">
                    <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Time Span</p>
                    <p className="text-xl font-black text-indigo-900 mt-0.5">12 Months</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Full 1 Year History</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Students</p>
                    <p className="text-xl font-black text-emerald-900 mt-0.5">36 Students</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">24 Active + 12 Left</p>
                  </div>
                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Study Halls</p>
                    <p className="text-xl font-black text-blue-900 mt-0.5">3 Halls (50 Seats)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">AC & Cabin Zones</p>
                  </div>
                  <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl text-center">
                    <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Transactions</p>
                    <p className="text-xl font-black text-purple-900 mt-0.5">280+ Records</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">12 Mo Fees & Expenses</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-950 space-y-1">
                    <p className="font-bold">Yeh Dummy Data sirf aapki active logged-in ID me hi load hoga.</p>
                    <p className="text-slate-600">Genius Library ya kisi aur account ka data 100% safe rahega aur bilkul alag rahega.</p>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    onClick={handleOpenDummyModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 px-6 py-2.5 rounded-xl text-sm cursor-pointer"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Load 1 Year Dummy Data (1 साल का डेटा लोड करें)
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* --- DANGER ZONE --- */}
          <div className="mt-8 border-t border-rose-100 pt-8">
            <Card title="Danger Zone (Factory Reset)">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  This action will permanently delete <strong>ALL</strong> data across the entire software. All students, fees, seats, expenses, memberships, and configurations will be completely wiped out. The software will become brand new.
                </p>
                {!showWipeConfirm ? (
                  <Button
                    onClick={() => setShowWipeConfirm(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Wipe All Data & Factory Reset
                  </Button>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-3">
                    <p className="text-sm font-bold text-rose-800">
                      Are you absolutely sure? Type <strong className="font-mono bg-rose-100 px-1 py-0.5 rounded text-rose-900">CONFIRM</strong> below to delete everything permanently.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={wipeInput}
                        onChange={(e) => setWipeInput(e.target.value)}
                        placeholder="Type CONFIRM here"
                        className="px-3 py-2 border border-rose-300 rounded-xl text-sm font-bold w-full sm:w-64"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleWipeData}
                          disabled={wipeInput !== 'CONFIRM' || isWiping}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold whitespace-nowrap"
                          loading={isWiping}
                        >
                          Delete Everything
                        </Button>
                        <Button
                          onClick={() => {
                            setShowWipeConfirm(false);
                            setWipeInput('');
                          }}
                          className="bg-white border-rose-200 text-slate-700 hover:bg-slate-100 font-bold"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* --- 1 YEAR DUMMY DATA MODAL --- */}
      <Modal
        isOpen={showDummyModal}
        onClose={() => {
          if (dummyStatus !== 'loading') setShowDummyModal(false);
        }}
        title={
          dummyStatus === 'success'
            ? '🎉 1 Year Dummy Data Loaded!'
            : '⚡ Load 1 Year Dummy Data (12 Months)'
        }
        size="lg"
      >
        {dummyStatus === 'idle' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl">
              <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                Yeh feature aapki active ID me pure <strong>1 saal (12 mahine)</strong> ka realistic test data create karega, taaki aap sabhi <strong>Revenue Graphs, Reports, Shift Analytics, Fees Receipts</strong> aur <strong>Seat Grid</strong> ko check kar sakein.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold text-slate-700">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span><strong>3 Study Halls</strong> (50 Seats)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span><strong>36 Students</strong> (24 Active + 12 Left)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span><strong>200+ Fee Records</strong> (12 Months)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <span><strong>80+ Expenses</strong> (Rent, Bills, WiFi)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span><strong>7 Membership Plans</strong> (Days & Mo)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span><strong>Inquiries / Demo Leads</strong></span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>100% Multi-Tenant Safe:</strong> Yeh data sirf aapki current logged-in library me save hoga. Genius Library ya kisi aur library ka data bilkul safe rahega.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setShowDummyModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartLoadingDummyData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 cursor-pointer"
              >
                <Database className="w-4 h-4 mr-1.5" />
                Load 1 Year Data Now (डेटा लोड करें)
              </Button>
            </div>
          </div>
        )}

        {dummyStatus === 'loading' && (
          <div className="py-8 px-4 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              <Database className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">1 Saal Ka Dummy Data Load Ho Raha Hai...</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                350+ records (Halls, Seats, Students, 12 Months Fees & Expenses) ko Cloud Firestore aur Local Storage me batch-commit kiya ja raha hai. Kripya thoda intezar karein...
              </p>
            </div>
          </div>
        )}

        {dummyStatus === 'success' && (
          <div className="space-y-4">
            <div className="text-center py-2 space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Dummy Data Successfully Load Ho Gaya!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pura 1 saal (12 mahine) ka continuous data cloud aur local storage dono me safely save ho chuka hai.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-indigo-500">Students</p>
                <p className="text-base font-black text-indigo-900">{dummyStats?.totalStudents || 36}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-emerald-500">Seats</p>
                <p className="text-base font-black text-emerald-900">{dummyStats?.totalSeats || 50}</p>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-blue-500">Fee Records</p>
                <p className="text-base font-black text-blue-900">{dummyStats?.totalFees || 200}+</p>
              </div>
              <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-purple-500">Expenses</p>
                <p className="text-base font-black text-purple-900">{dummyStats?.totalExpenses || 80}+</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
              💡 Ab Dashboard par 12 mahine ke graphs, Students list me active/left students, aur Fees page par 12 mahine ke payment records live update ho chuke hain.
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                onClick={handleGoToDashboard}
                className="w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-100 cursor-pointer"
              >
                <span className="flex items-center gap-2 justify-center">
                  Dashboard Dekhein (Go to Dashboard)
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </div>
        )}

        {dummyStatus === 'error' && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error loading dummy data:</p>
                <p className="mt-0.5">{dummyErrorMsg}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDummyModal(false)}>
                Close
              </Button>
              <Button onClick={handleStartLoadingDummyData} className="bg-indigo-600 text-white">
                Retry
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
