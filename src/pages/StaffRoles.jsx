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
} from 'lucide-react';
import { COLLECTIONS, PERMISSION_MODULES, ROLE_PRESETS } from '../utils/constants';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

export default function StaffRoles() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

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
      console.error(e);
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
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: staff.password || '',
      phone: staff.phone || '',
      role: staff.role || 'custom',
      status: staff.status || 'active',
      permissions: staff.permissions || {},
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
      const updatedModule = { ...(prev.permissions[moduleKey] || {}) };
      updatedModule[actionKey] = !updatedModule[actionKey];

      return {
        ...prev,
        role: 'custom', // custom matrix whenever manually checked
        permissions: {
          ...prev.permissions,
          [moduleKey]: updatedModule,
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    try {
      if (editStaff) {
        await updateDocument(COLLECTIONS.STAFF_USERS, editStaff.id, formData);
        showToast('Staff member updated successfully!');
      } else {
        await createDocument(COLLECTIONS.STAFF_USERS, formData);
        showToast('New staff member added successfully!');
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
      showToast('Staff user deleted');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDemoReceptionist = async () => {
    const demoRecep = {
      name: 'Pooja (Receptionist)',
      email: 'reception@studypoint.com',
      password: 'recep123',
      phone: '9876543210',
      role: 'receptionist',
      status: 'active',
      permissions: ROLE_PRESETS.receptionist.permissions,
    };
    await createDocument(COLLECTIONS.STAFF_USERS, demoRecep);
    await fetchStaff();
    showToast('🎉 Demo Receptionist account (reception@studypoint.com / recep123) created!');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
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
              Control which pages, actions (Add, Edit, Delete) your staff & receptionists can access
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button icon={<UserPlus className="w-4 h-4" />} onClick={handleOpenAdd}>
              Add Staff Member
            </Button>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3.5 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Roles Explanation Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
              <span className="text-base">👑</span>
              <span>Owner Role</span>
            </div>
            <p className="text-xs text-gray-500">
              Full access to view, edit, delete, financial revenue, expenses, reports & database settings.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
              <span className="text-base">🛎️</span>
              <span>Receptionist Role</span>
            </div>
            <p className="text-xs text-gray-500">
              Can view dashboard, seat grid, register students, collect fees & print receipts. Financials/expenses are hidden.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
              <span className="text-base">👔</span>
              <span>Branch Manager Role</span>
            </div>
            <p className="text-xs text-gray-500">
              Can manage students, seats, fees, view reports & record utility expenses. Cannot reset database.
            </p>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Configured Staff Accounts ({staffList.length})</h3>
            <span className="text-xs text-gray-500">Owner has full master control</span>
          </div>

          {staffList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Staff Name</th>
                    <th className="px-5 py-3.5">Login Email</th>
                    <th className="px-5 py-3.5">Assigned Role</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {staff.name?.charAt(0) || 'S'}
                        </div>
                        <span>{staff.name}</span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-gray-600 font-mono">
                        {staff.email}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                          {staff.role === 'receptionist'
                            ? '🛎️ Receptionist'
                            : staff.role === 'manager'
                            ? '👔 Manager'
                            : '⚙️ Custom'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {staff.phone || '—'}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            staff.status !== 'inactive'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {staff.status !== 'inactive' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg mr-2 cursor-pointer transition-colors"
                          title="Edit staff permissions"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(staff)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete staff account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400 text-xs">
              No staff members added yet. Click <strong>"Add Staff Member"</strong> to create login accounts for your receptionists.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editStaff ? `Edit Permissions: ${editStaff.name}` : 'Add New Staff Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Staff Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pooja Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Staff Login Email *
              </label>
              <input
                type="email"
                required
                placeholder="reception@studypoint.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Login Password *
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Role Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Role Template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['receptionist', 'manager', 'custom'].map((rKey) => (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => handleRolePresetChange(rKey)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    formData.role === rKey
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {rKey === 'receptionist'
                    ? '🛎️ Receptionist'
                    : rKey === 'manager'
                    ? '👔 Manager'
                    : '⚙️ Custom Permissions'}
                </button>
              ))}
            </div>
          </div>

          {/* Granular Permission Checkboxes Matrix */}
          <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Module Permission Matrix
              </span>
              <span className="text-[11px] text-gray-500">Check actions this staff member is allowed to do</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {PERMISSION_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white p-2.5 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <span className="font-bold text-gray-900 w-44">{mod.label}</span>

                  <div className="flex flex-wrap items-center gap-3">
                    {mod.actions.map((act) => {
                      const isChecked = !!formData.permissions?.[mod.id]?.[act];
                      return (
                        <label
                          key={act}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                            isChecked ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(mod.id, act)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="capitalize">{act}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">
              {editStaff ? 'Update Staff Member' : 'Save Staff Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Staff User?"
        message={`Are you sure you want to remove ${deleteTarget?.name}? They will no longer be able to log into the software.`}
        confirmText="Delete Staff"
        variant="danger"
      />
    </Layout>
  );
}
