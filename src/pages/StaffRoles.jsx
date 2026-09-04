import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  ShieldCheck,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Key,
  Sparkles,
  Loader2,
  Info,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  Layers,
  LayoutDashboard,
  Building2,
  Users,
  IndianRupee,
  BarChart3,
  CreditCard,
  Receipt,
  Settings,
} from 'lucide-react';
import { COLLECTIONS, PERMISSION_MODULES, ROLE_PRESETS } from '../utils/constants';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

const MODULE_META = {
  dashboard: {
    icon: LayoutDashboard,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    desc: 'Live occupancy, stats & quick overview',
  },
  sections: {
    icon: Building2,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    desc: 'Hall/Room seats, layouts & shift slots',
  },
  students: {
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    desc: 'Student admission, KYC & profile management',
  },
  fees: {
    icon: IndianRupee,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    desc: 'Collect fees, invoices, discounts & receipts',
  },
  reports: {
    icon: BarChart3,
    color: 'text-violet-600 bg-violet-50 border-violet-200',
    desc: 'Financial audits, monthly stats & exports',
  },
  memberships: {
    icon: CreditCard,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    desc: 'Plans, pricing durations & seat shift plans',
  },
  expenses: {
    icon: Receipt,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    desc: 'Utility bills, staff salaries & rent logs',
  },
  settings: {
    icon: Settings,
    color: 'text-slate-600 bg-slate-100 border-slate-200',
    desc: 'Library info, QR codes & seat add-on pricing',
  },
  staff: {
    icon: ShieldCheck,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    desc: 'Staff credentials, roles & access permissions',
  },
};

export default function StaffRoles() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'receptionist',
    status: 'active',
    permissions: ROLE_PRESETS.receptionist.permissions,
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await fetchCollectionData(COLLECTIONS.STAFF_USERS);
      setStaffList(data);
    } catch (e) {
      console.error('Error fetching staff list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAdd = () => {
    setEditStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'receptionist',
      status: 'active',
      permissions: JSON.parse(JSON.stringify(ROLE_PRESETS.receptionist.permissions)),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (staff) => {
    setEditStaff(staff);
    const initialRole = staff.role || 'custom';
    const fallbackPerms = ROLE_PRESETS[initialRole]?.permissions || ROLE_PRESETS.receptionist.permissions;

    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: staff.password || '',
      phone: staff.phone || '',
      role: initialRole,
      status: staff.status || 'active',
      permissions: staff.permissions ? JSON.parse(JSON.stringify(staff.permissions)) : JSON.parse(JSON.stringify(fallbackPerms)),
    });
    setShowModal(true);
  };

  const handleRolePresetChange = (presetKey) => {
    const preset = ROLE_PRESETS[presetKey];
    if (preset && presetKey !== 'custom') {
      setFormData((prev) => ({
        ...prev,
        role: presetKey,
        permissions: JSON.parse(JSON.stringify(preset.permissions)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        role: 'custom',
      }));
    }
  };

  const handlePermissionToggle = (moduleKey, actionKey) => {
    setFormData((prev) => {
      const currentModulePerms = prev.permissions[moduleKey] || {};
      const updatedModule = { ...currentModulePerms };
      updatedModule[actionKey] = !updatedModule[actionKey];

      return {
        ...prev,
        role: 'custom',
        permissions: {
          ...prev.permissions,
          [moduleKey]: updatedModule,
        },
      };
    });
  };

  const handleModuleToggleAll = (moduleKey, actions) => {
    setFormData((prev) => {
      const currentModulePerms = prev.permissions[moduleKey] || {};
      const allEnabled = actions.every((act) => !!currentModulePerms[act]);
      const newModulePerms = {};
      actions.forEach((act) => {
        newModulePerms[act] = !allEnabled;
      });

      return {
        ...prev,
        role: 'custom',
        permissions: {
          ...prev.permissions,
          [moduleKey]: newModulePerms,
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      showToast('Please fill Staff Name, Email and Password');
      return;
    }

    try {
      if (editStaff) {
        await updateDocument(COLLECTIONS.STAFF_USERS, editStaff.id, formData);
        showToast(`Staff member "${formData.name}" updated successfully!`);
      } else {
        await createDocument(COLLECTIONS.STAFF_USERS, formData);
        showToast(`New staff member "${formData.name}" created successfully!`);
      }
      setShowModal(false);
      await fetchStaff();
    } catch (err) {
      console.error(err);
      showToast('Error saving staff member: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeDocument(COLLECTIONS.STAFF_USERS, deleteTarget.id);
      setDeleteTarget(null);
      await fetchStaff();
      showToast('Staff account deleted');
    } catch (e) {
      console.error(e);
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (staff) => {
    const text = `Study Point Staff Login Details:\n• Name: ${staff.name}\n• User ID / Email: ${staff.email}\n• Password: ${staff.password}\n• Role: ${staff.role?.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    showToast(`Copied ${staff.name}'s Login ID & Password!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Helper to get active permission badges
  const getActivePermissionLabels = (permissions = {}) => {
    const active = [];
    PERMISSION_MODULES.forEach((mod) => {
      const modPerms = permissions[mod.id] || {};
      const actions = Object.keys(modPerms).filter((k) => modPerms[k]);
      if (actions.length > 0) {
        active.push({
          id: mod.id,
          module: mod.label || mod.id,
          actions: actions.join(', '),
        });
      }
    });
    return active;
  };

  if (loading) {
    return (
      <Layout title="Staff & Roles">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Staff & Role Permissions">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff & Role Permissions</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage staff accounts, login credentials & granular module permissions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button icon={<UserPlus className="w-4 h-4" />} onClick={handleOpenAdd}>
              Add New Staff Member
            </Button>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3.5 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Roles Presets Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
              <span className="text-base">👑</span>
              <span>Owner Role (Master Admin)</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Full access to everything: collections, financial audit, staff control, deletions & library settings.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
              <span className="text-base">🛎️</span>
              <span>Receptionist Role</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Can view dashboard, seat grid, register students, collect fees & print receipts. Financials/expenses are hidden.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
              <span className="text-base">👔</span>
              <span>Branch Manager Role</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Can manage students, seats, fees, view operational reports & record utility expenses.
            </p>
          </div>
        </div>

        {/* Staff Members List Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base">
              Configured Staff Accounts ({staffList.length})
            </h3>
            <span className="text-xs text-gray-500">Visible ID, Passwords & Access Controls</span>
          </div>

          {staffList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {staffList.map((staff) => {
                const activePerms = getActivePermissionLabels(staff.permissions);
                const isPasswordShown = !!visiblePasswords[staff.id];

                return (
                  <div
                    key={staff.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    {/* Top Row: Avatar, Name, Role & Action Buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shrink-0">
                          {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                              {staff.name}
                            </h4>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                staff.status !== 'inactive'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {staff.status !== 'inactive' ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {staff.role === 'receptionist'
                                ? '🛎️ Receptionist'
                                : staff.role === 'manager'
                                ? '👔 Branch Manager'
                                : '⚙️ Custom Role'}
                            </span>
                            {staff.phone && (
                              <span className="text-xs text-slate-500 font-medium">
                                📞 {staff.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit & Delete Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit staff details & permissions"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(staff)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete staff account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: ID & Password Credentials Box with 1-Click Copy */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Login Credentials (आईडी व पासवर्ड):
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(staff)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-2xs shrink-0"
                          title="Copy credentials to clipboard"
                        >
                          {copiedId === staff.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === staff.id ? 'Copied!' : 'Copy Login Details'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Email / ID */}
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium text-[11px] shrink-0">User ID / Email:</span>
                          <span className="font-mono font-bold text-slate-900 truncate text-[11px]">{staff.email}</span>
                        </div>

                        {/* Password with Eye Toggle */}
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium text-[11px] shrink-0">Password:</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-bold text-indigo-700 truncate text-[11px]">
                              {isPasswordShown ? staff.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(staff.id)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer shrink-0"
                              title={isPasswordShown ? 'Hide Password' : 'Show Password'}
                            >
                              {isPasswordShown ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Assigned Permissions Matrix */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Assigned Module Access ({activePerms.length} Modules Allowed):
                      </span>

                      {activePerms.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activePerms.map((perm) => (
                            <span
                              key={perm.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{perm.module}</span>
                              <span className="text-[9px] text-emerald-700 font-medium">({perm.actions})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-rose-500 font-bold italic">No module permissions granted.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <UserPlus size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-base">No Staff Members Added Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click <strong>"Add New Staff Member"</strong> above to create login accounts with custom permissions for your receptionists.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editStaff ? `Edit Staff Account: ${editStaff.name}` : 'Add New Staff Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Selector */}
          <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Quick Role Preset (भूमिका चुनें)
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">Select preset or customize below</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: 'receptionist', label: '🛎️ Receptionist' },
                { key: 'manager', label: '👔 Branch Manager' },
                { key: 'custom', label: '⚙️ Custom Matrix' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => handleRolePresetChange(r.key)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    formData.role === r.key
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pooja Sharma"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Login Email, Password & Account Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>User ID / Email *</span>
              </label>
              <input
                type="text"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. recep@studypoint.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Login Password *</span>
              </label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="e.g. recep123"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Account Status</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">🟢 Active (चालू)</option>
                <option value="inactive">🔴 Inactive (बंद)</option>
              </select>
            </div>
          </div>

          {/* Granular Module-by-Module Permission Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Module Permissions Matrix (एक्सेस टिक करें)
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold">Check allowed actions</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-72 overflow-y-auto">
              {PERMISSION_MODULES.map((module) => {
                const modPerms = formData.permissions[module.id] || {};
                const meta = MODULE_META[module.id] || {
                  icon: Layers,
                  color: 'text-slate-600 bg-slate-50 border-slate-200',
                  desc: 'Module operations',
                };
                const IconComponent = meta.icon;

                return (
                  <div
                    key={module.id}
                    className="p-3 sm:p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    {/* Left: Icon, Module Name & Subtitle */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                          {module.label || module.id}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{meta.desc}</p>
                      </div>
                    </div>

                    {/* Right: Action Checkboxes */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-12 sm:ml-0">
                      {module.actions.map((act) => {
                        const isChecked = !!modPerms[act];

                        return (
                          <label
                            key={act}
                            className={`flex items-center gap-1 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-lg border transition-all select-none ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-extrabold'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePermissionToggle(module.id, act)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="capitalize">{act}</span>
                          </label>
                        );
                      })}

                      {/* Quick Module Toggle All button */}
                      {module.actions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleModuleToggleAll(module.id, module.actions)}
                          className="text-[10px] font-bold px-1.5 py-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
                          title="Toggle all actions for this module"
                        >
                          All
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editStaff ? 'Save Staff Permissions' : 'Create Staff Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Staff Account"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? They will no longer be able to log in.`}
        confirmText="Delete Account"
        variant="danger"
      />
    </Layout>
  );
}

