import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
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
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SETTINGS_LOCAL_KEY = 'studypoint_settings';
const ADDONS_LOCAL_KEY = 'studypoint_addons';
const SHIFTS_LOCAL_KEY = 'studypoint_shifts';

export default function Settings() {
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
    // 1. Check LocalStorage first for instantaneous render
    const local = localStorage.getItem(SETTINGS_LOCAL_KEY);
    if (local) {
      try {
        setInfo((prev) => ({ ...prev, ...JSON.parse(local) }));
      } catch (e) {}
    }

    try {
      const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'ownerProfile'));
      if (settingsDoc.exists()) {
        const cloudData = settingsDoc.data();
        setInfo((prev) => ({ ...prev, ...cloudData }));
        localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(cloudData));
      }
    } catch (e) {
      console.warn('Settings fetch warning:', e.message);
    }

    // 2. Fetch Shifts Configuration
    try {
      const localShifts = localStorage.getItem(SHIFTS_LOCAL_KEY);
      if (localShifts) {
        setShifts(JSON.parse(localShifts));
      } else {
        const shiftDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'shiftTimings'));
        if (shiftDoc.exists() && shiftDoc.data().shifts) {
          setShifts(shiftDoc.data().shifts);
          localStorage.setItem(SHIFTS_LOCAL_KEY, JSON.stringify(shiftDoc.data().shifts));
        }
      }
    } catch (e) {
      console.warn('Shift settings fetch warning:', e.message);
    }

    // 3. Fetch Add-ons
    try {
      const localAddons = localStorage.getItem(ADDONS_LOCAL_KEY);
      if (localAddons) {
        try {
          setAddons(JSON.parse(localAddons));
        } catch (e) {}
      }

      const addonSnap = await getDocs(collection(db, COLLECTIONS.ADDON_PRICING));
      const addonsData = addonSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (addonsData.length === 0 && !localStorage.getItem('studypoint_addons_initialized')) {
        const seeded = [];
        for (const def of DEFAULT_ADDONS) {
          try {
            const added = await addDoc(collection(db, COLLECTIONS.ADDON_PRICING), {
              name: def.name,
              monthlyCharge: Number(def.monthlyCharge) || 0,
              isActive: true,
            });
            seeded.push({ id: added.id, name: def.name, monthlyCharge: def.monthlyCharge, isActive: true });
          } catch (err) {
            seeded.push({ id: 'addon_' + Math.random().toString(36).substr(2, 6), ...def });
          }
        }
        localStorage.setItem('studypoint_addons_initialized', 'true');
        localStorage.setItem(ADDONS_LOCAL_KEY, JSON.stringify(seeded));
        setAddons(seeded);
      } else {
        localStorage.setItem('studypoint_addons_initialized', 'true');
        localStorage.setItem(ADDONS_LOCAL_KEY, JSON.stringify(addonsData));
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

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInfo((prev) => ({ ...prev, logoUrl: reader.result }));
      showToast('Logo image selected! Click "Save Details & Signature" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setInfo((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Logo removed');
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Signature image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInfo((prev) => ({ ...prev, signatureUrl: reader.result }));
      showToast('Signature image selected! Click "Save Details & Signature" to apply.');
    };
    reader.readAsDataURL(file);
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
      localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(info));

      try {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'ownerProfile'), info);
      } catch (cloudErr) {
        console.warn('Cloud save warning:', cloudErr.message);
      }

      showToast('🎉 Library details, Logo & Signature saved successfully! All Bills will now display your Signature.');
    } catch (e) {
      console.error('Error saving settings:', e);
      showToast('Error saving settings: ' + e.message);
    }
    setIsSaving(false);
  };

  // Handle Shift Timing Edit
  const handleShiftChange = (shiftId, field, val) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== shiftId) return s;
        const updated = { ...s, [field]: val };
        // Auto update full timing label if start or end changes
        if (field === 'start' || field === 'end') {
          const start = field === 'start' ? val : (s.start || '6:00 AM');
          const end = field === 'end' ? val : (s.end || '2:00 PM');
          updated.timing = `${start} - ${end}`;
          updated.short = `${start.replace(':00', '')} - ${end.replace(':00', '')}`;
        }
        return updated;
      })
    );
  };

  // Save Shift Timings to Firestore & LocalStorage
  const handleSaveShifts = async (e) => {
    if (e) e.preventDefault();
    setIsSavingShifts(true);
    try {
      localStorage.setItem(SHIFTS_LOCAL_KEY, JSON.stringify(shifts));
      try {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'shiftTimings'), { shifts });
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

  // Add new Add-on Facility
  const handleAddAddon = async (e) => {
    if (e) e.preventDefault();
    if (!newAddon.name.trim()) return;

    const chargeNum = newAddon.monthlyCharge === '' ? 0 : Number(newAddon.monthlyCharge) || 0;
    try {
      let newDocId = 'addon_' + Date.now();
      try {
        const added = await addDoc(collection(db, COLLECTIONS.ADDON_PRICING), {
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
      localStorage.setItem(ADDONS_LOCAL_KEY, JSON.stringify(updated));
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

  // Save Edit of an Add-on
  const handleSaveEditAddon = async (id) => {
    if (!editAddonData.name.trim()) return;
    const chargeNum = editAddonData.monthlyCharge === '' ? 0 : Number(editAddonData.monthlyCharge) || 0;

    try {
      try {
        await updateDoc(doc(db, COLLECTIONS.ADDON_PRICING, id), {
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
      localStorage.setItem(ADDONS_LOCAL_KEY, JSON.stringify(updated));
      setEditingAddonId(null);
      showToast('Facility details updated successfully!');
    } catch (e) {
      console.error('Error updating addon:', e);
    }
  };

  // Delete an Add-on
  const handleDeleteAddon = async (id) => {
    try {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ADDON_PRICING, id));
      } catch (err) {
        console.warn('Cloud delete addon error:', err);
      }

      const updated = addons.filter((a) => a.id !== id);
      setAddons(updated);
      localStorage.setItem(ADDONS_LOCAL_KEY, JSON.stringify(updated));
      showToast('Facility Add-on removed');
    } catch (e) {
      console.error('Error deleting addon:', e);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
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

          {/* Seat Shift Timings Configuration */}
          <div className="space-y-6">
            <Card title="Seat Shift & Timing Settings (शिफ्ट व समय प्रबंधन)">
              <form onSubmit={handleSaveShifts} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Set library shift timings (e.g. Morning 6 AM - 1 PM or 6 AM - 2 PM). These timings will appear in admission forms & seat layout.
                </p>

                <div className="space-y-3">
                  {shifts.map((shift) => {
                    const getIcon = () => {
                      if (shift.id === 'full_day') return <Sun className="w-4 h-4 text-indigo-600 shrink-0" />;
                      if (shift.id === 'first_half') return <Sunrise className="w-4 h-4 text-amber-600 shrink-0" />;
                      if (shift.id === 'second_half') return <Sunset className="w-4 h-4 text-purple-600 shrink-0" />;
                      return <Clock className="w-4 h-4 text-teal-600 shrink-0" />;
                    };

                    return (
                      <div
                        key={shift.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getIcon()}
                            <span className="text-xs font-bold text-slate-800">{shift.label}</span>
                          </div>
                          <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {shift.timing}
                          </span>
                        </div>

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
                    );
                  })}
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
                                ₹{addon.monthlyCharge || addon.price || 0}/mo
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
        </div>
      </div>
    </Layout>
  );
}
