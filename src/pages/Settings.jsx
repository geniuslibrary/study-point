import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { COLLECTIONS, DEFAULT_ADDONS } from '../utils/constants';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X,
  BookOpen,
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SETTINGS_LOCAL_KEY = 'studypoint_settings';

export default function Settings() {
  const fileInputRef = useRef(null);
  const [info, setInfo] = useState({
    studyPointName: 'Royal Study Point & Library',
    ownerName: 'Manish',
    phone: '9876543210',
    email: 'study@gmail.com',
    address: 'Near Metro Station, Main Road, Study Zone',
    logoUrl: '',
  });

  const [addons, setAddons] = useState([]);
  const [newAddon, setNewAddon] = useState({ name: '', monthlyCharge: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchSettings = async () => {
    // 1. Check LocalStorage first
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

    try {
      const addonSnap = await getDocs(collection(db, COLLECTIONS.ADDON_PRICING));
      const addonsData = addonSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (addonsData.length === 0) {
        setAddons(DEFAULT_ADDONS.map((a, i) => ({ id: 'addon_' + i, ...a })));
      } else {
        setAddons(addonsData);
      }
    } catch (e) {
      console.warn('Addons fetch warning:', e.message);
      setAddons(DEFAULT_ADDONS.map((a, i) => ({ id: 'addon_' + i, ...a })));
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

    // Check size (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInfo((prev) => ({ ...prev, logoUrl: reader.result }));
      showToast('Logo image uploaded! Click "Save" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setInfo((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Logo removed');
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

      showToast('🎉 Library details & Logo saved successfully! All Bills will now display your Logo.');
    } catch (e) {
      console.error('Error saving settings:', e);
      showToast('Error saving settings: ' + e.message);
    }
    setIsSaving(false);
  };

  const handleAddAddon = async () => {
    if (newAddon.name && newAddon.monthlyCharge !== '') {
      try {
        await addDoc(collection(db, COLLECTIONS.ADDON_PRICING), {
          name: newAddon.name,
          monthlyCharge: Number(newAddon.monthlyCharge),
          isActive: true,
        });
        setNewAddon({ name: '', monthlyCharge: '' });
        await fetchSettings();
        showToast('Facility Add-on added!');
      } catch (e) {
        console.error('Error adding addon:', e);
      }
    }
  };

  const handleDeleteAddon = async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ADDON_PRICING, id));
      await fetchSettings();
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
              Manage library profile, official logo for bills & facility pricing
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
          {/* General Study Point Info & Logo */}
          <Card title="Study Point / Library Information (Prints on Bill)">
            <form onSubmit={handleSaveInfo} className="space-y-5">
              {/* Logo Upload Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Library Official Logo (बिल व रसीद पर लोगो)
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {info.logoUrl ? (
                      <img
                        src={info.logoUrl}
                        alt="Library Logo Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-6 h-6 text-indigo-400 mx-auto" />
                        <span className="text-[9px] font-bold text-slate-400 block mt-1">No Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
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
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{info.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                      </label>

                      {info.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Remove logo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Upload PNG/JPG logo. It will be printed at the top of all Fee Bills & Receipts.
                    </p>
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
                    {isSaving ? 'Saving...' : 'Save Study Point Details & Logo'}
                  </span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Add-on Facility Pricing */}
          <Card title="Seat Add-on Facility Pricing (Monthly Charges)">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2.5 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex-grow w-full">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={newAddon.name}
                    onChange={(e) => setNewAddon((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Locker, Air Cooler, WiFi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Monthly (₹)</label>
                  <input
                    type="number"
                    value={newAddon.monthlyCharge}
                    onChange={(e) => setNewAddon((prev) => ({ ...prev, monthlyCharge: e.target.value }))}
                    placeholder="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <Button variant="primary" onClick={handleAddAddon} type="button">
                  <Plus size={18} />
                </Button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Configured Facility Rates
                </h4>
                {addons.length > 0 ? (
                  <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                    {addons.map((addon) => (
                      <li key={addon.id} className="flex justify-between items-center p-3.5 hover:bg-gray-50 bg-white">
                        <span className="font-medium text-gray-900 text-sm">{addon.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-indigo-600 font-bold text-sm">
                            ₹{addon.monthlyCharge || addon.price || 0}/mo
                          </span>
                          <button
                            onClick={() => handleDeleteAddon(addon.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="Delete facility"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-xl">
                    No add-on facilities defined.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
