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
  Plus,
  Camera,
  Calendar,
  FileText,
} from 'lucide-react';
import { COLLECTIONS, PERMISSION_MODULES, ROLE_PRESETS } from '../utils/constants';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
  getActiveTenantId,
} from '../firebase/storageService';
import { compressImageFile, formatDate, formatCurrency } from '../utils/helpers';
import {
  DEFAULT_STAFF_DASHBOARD_WIDGETS,
  DASHBOARD_WIDGET_OPTIONS,
} from '../utils/templateHelpers';

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

const DEFAULT_OWNER_ROLE = {
  id: 'role_owner',
  name: 'Owner (Super Admin)',
  emoji: '👑',
  label: '👑 Owner (Super Admin)',
  description: 'Full access to all revenue, expenses, audit reports & library settings.',
  permissions: JSON.parse(JSON.stringify(ROLE_PRESETS.owner.permissions)),
  dashboardWidgets: { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
  isOwner: true,
};

const DEFAULT_SYSTEM_ROLES = [
  {
    id: 'role_receptionist',
    name: 'Receptionist',
    emoji: '🛎️',
    label: '🛎️ Receptionist',
    description: 'Front desk: seat grid, student admission, fee collection & receipts.',
    permissions: JSON.parse(JSON.stringify(ROLE_PRESETS.receptionist.permissions)),
    dashboardWidgets: { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
  },
  {
    id: 'role_manager',
    name: 'Branch Manager',
    emoji: '👔',
    label: '👔 Branch Manager',
    description: 'Branch management: seats, admissions, fees, operational reports & expenses.',
    permissions: JSON.parse(JSON.stringify(ROLE_PRESETS.manager.permissions)),
    dashboardWidgets: { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
  },
];

export default function StaffRoles() {
  const [staffList, setStaffList] = useState([]);
  const [rolesList, setRolesList] = useState(DEFAULT_SYSTEM_ROLES);
  const [ownerRole, setOwnerRole] = useState(DEFAULT_OWNER_ROLE);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' (Tab 1: Role & Permission) | 'staff' (Tab 2: Staff)

  // Tab 2: Staff Members State
  const [staffMembers, setStaffMembers] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editStaffMember, setEditStaffMember] = useState(null);
  const [deleteStaffTarget, setDeleteStaffTarget] = useState(null);
  const [staffMemberFormData, setStaffMemberFormData] = useState({
    name: '',
    phone: '',
    role: 'Receptionist',
    status: 'active',
    salary: '',
    joinDate: new Date().toISOString().split('T')[0],
    photo: '',
    aadharPhoto: '',
  });
  const [previewAadhar, setPreviewAadhar] = useState(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isCompressingAadhar, setIsCompressingAadhar] = useState(false);

  // Staff modal states
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Role Preset modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    emoji: '💼',
    description: '',
    permissions: JSON.parse(JSON.stringify(ROLE_PRESETS.receptionist.permissions)),
    dashboardWidgets: { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
  });

  const [toastMessage, setToastMessage] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Staff Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'role_receptionist',
    roleLabel: '🛎️ Receptionist',
    status: 'active',
    permissions: JSON.parse(JSON.stringify(ROLE_PRESETS.receptionist.permissions)),
    dashboardWidgets: { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
  });

  const fetchData = async (showFullLoader = true) => {
    if (showFullLoader) setLoading(true);
    try {
      const [staffData, rolesData, staffMembersData] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STAFF_USERS),
        fetchCollectionData(COLLECTIONS.ROLE_PRESETS),
        fetchCollectionData(COLLECTIONS.STAFF_MEMBERS),
      ]);

      const ownerDoc = (rolesData || []).find((r) => r.id === 'role_owner' || r.isOwner);
      if (ownerDoc) {
        setOwnerRole({
          ...DEFAULT_OWNER_ROLE,
          ...ownerDoc,
          id: 'role_owner',
          isOwner: true,
        });
      } else {
        setOwnerRole(DEFAULT_OWNER_ROLE);
      }

      let regularRoles = (rolesData || []).filter((r) => r.id !== 'role_owner' && !r.isOwner);

      // ALWAYS guarantee all default system roles (Receptionist and Branch Manager) are present
      const roleMap = new Map();
      DEFAULT_SYSTEM_ROLES.forEach((defRole) => {
        roleMap.set(defRole.id, { ...defRole });
      });

      // Overlay with any saved customizations or user-created roles
      regularRoles.forEach((dbRole) => {
        if (dbRole && dbRole.id) {
          roleMap.set(dbRole.id, {
            ...(roleMap.get(dbRole.id) || {}),
            ...dbRole,
          });
        }
      });

      const finalRolesList = Array.from(roleMap.values());

      const activeTenantId = getActiveTenantId();
      if (staffData && staffData.length > 0 && activeTenantId) {
        staffData.forEach((s) => {
          if (!s.tenantId) {
            updateDocument(COLLECTIONS.STAFF_USERS, s.id, { tenantId: activeTenantId, ownerId: activeTenantId }).catch(console.warn);
          }
        });
      }

      setStaffList(staffData || []);
      setRolesList(finalRolesList);
      setStaffMembers(staffMembersData || []);
    } catch (e) {
      console.error('Error fetching staff data:', e);
    } finally {
      if (showFullLoader) setLoading(false);
    }
  };

  const fetchStaffMembersData = async () => {
    try {
      const data = await fetchCollectionData(COLLECTIONS.STAFF_MEMBERS);
      setStaffMembers(data || []);
    } catch (err) {
      console.error('Error fetching staff members:', err);
    }
  };

  // Tab 2 Staff Member Handlers
  const handleStaffPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 480, 0.86);
      setStaffMemberFormData((prev) => ({ ...prev, photo: compressed }));
    } catch (err) {
      console.error('Error compressing staff photo:', err);
      showToast('फोटो लोड नहीं हो सकी');
    } finally {
      setIsCompressingPhoto(false);
      try { e.target.value = ''; } catch (_) {}
    }
  };

  const handleStaffAadharChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingAadhar(true);
    try {
      const compressed = await compressImageFile(file, 900, 0.86);
      setStaffMemberFormData((prev) => ({ ...prev, aadharPhoto: compressed }));
    } catch (err) {
      console.error('Error compressing aadhar photo:', err);
      showToast('आधार कार्ड फोटो लोड नहीं हो सकी');
    } finally {
      setIsCompressingAadhar(false);
      try { e.target.value = ''; } catch (_) {}
    }
  };

  const handleOpenAddStaffMember = () => {
    setEditStaffMember(null);
    setStaffMemberFormData({
      name: '',
      phone: '',
      role: 'Receptionist',
      status: 'active',
      salary: '',
      joinDate: new Date().toISOString().split('T')[0],
      photo: '',
      aadharPhoto: '',
    });
    setShowStaffModal(true);
  };

  const handleOpenEditStaffMember = (staff) => {
    setEditStaffMember(staff);
    setStaffMemberFormData({
      name: staff.name || '',
      phone: staff.phone || '',
      role: staff.role || 'Receptionist',
      status: staff.status || 'active',
      salary: staff.salary !== undefined && staff.salary !== null ? String(staff.salary) : '',
      joinDate: staff.joinDate || new Date().toISOString().split('T')[0],
      photo: staff.photo || '',
      aadharPhoto: staff.aadharPhoto || '',
    });
    setShowStaffModal(true);
  };

  const handleStaffMemberSubmit = async (e) => {
    e.preventDefault();
    if (!staffMemberFormData.name.trim()) {
      showToast('कृपया स्टाफ का नाम दर्ज करें');
      return;
    }

    const payload = {
      name: staffMemberFormData.name.trim(),
      phone: staffMemberFormData.phone.trim(),
      role: staffMemberFormData.role.trim() || 'Staff',
      status: staffMemberFormData.status || 'active',
      salary: staffMemberFormData.salary !== '' ? Number(staffMemberFormData.salary) || 0 : 0,
      joinDate: staffMemberFormData.joinDate || new Date().toISOString().split('T')[0],
      photo: staffMemberFormData.photo || '',
      aadharPhoto: staffMemberFormData.aadharPhoto || '',
      leftDate: staffMemberFormData.status === 'left' ? (editStaffMember?.leftDate || new Date().toISOString().split('T')[0]) : null,
    };

    try {
      if (editStaffMember) {
        const updatedMember = { ...editStaffMember, ...payload };
        setStaffMembers((prev) =>
          prev.map((s) => (s.id === editStaffMember.id ? updatedMember : s))
        );
        await updateDocument(COLLECTIONS.STAFF_MEMBERS, editStaffMember.id, payload);
        showToast(`Staff "${payload.name}" updated successfully!`);
      } else {
        const newMember = await createDocument(COLLECTIONS.STAFF_MEMBERS, payload);
        setStaffMembers((prev) => [newMember, ...prev.filter((s) => s.id !== newMember.id)]);
        showToast(`New staff "${payload.name}" added successfully!`);
      }
      setShowStaffModal(false);
      fetchStaffMembersData();
    } catch (err) {
      console.error(err);
      showToast('Error saving staff member: ' + err.message);
    }
  };

  const handleQuickToggleStaffStatus = async (staff, targetStatus) => {
    try {
      await updateDocument(COLLECTIONS.STAFF_MEMBERS, staff.id, {
        status: targetStatus,
        leftDate: targetStatus === 'left' ? new Date().toISOString().split('T')[0] : null,
      });
      showToast(
        targetStatus === 'left'
          ? `${staff.name} को 'Left' मार्क किया गया (अब Expense add होना बंद हो गया)`
          : `${staff.name} को पुनः 'Active' कर दिया गया`
      );
      await fetchStaffMembersData();
    } catch (err) {
      console.error(err);
      showToast('Error updating staff status');
    }
  };



  const handleDeleteStaffMemberConfirm = async () => {
    if (!deleteStaffTarget) return;
    try {
      await removeDocument(COLLECTIONS.STAFF_MEMBERS, deleteStaffTarget.id);
      setDeleteStaffTarget(null);
      await fetchStaffMembersData();
      showToast('Staff member deleted');
    } catch (e) {
      console.error(e);
      showToast('Error deleting staff member');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRoleLabel = (roleId, customLabel) => {
    if (customLabel && customLabel !== 'custom') return customLabel;
    if (roleId === 'role_owner' || roleId === 'owner') return ownerRole.label || `👑 ${ownerRole.name}`;
    const found = rolesList.find((r) => r.id === roleId || r.name?.toLowerCase() === roleId?.toLowerCase());
    if (found) return found.label || `${found.emoji || '💼'} ${found.name}`;
    if (roleId === 'receptionist' || roleId === 'role_receptionist') return '🛎️ Receptionist';
    if (roleId === 'manager' || roleId === 'role_manager') return '👔 Branch Manager';
    return roleId || 'Staff';
  };

  // Staff Modal Handlers
  const handleOpenAdd = () => {
    setEditStaff(null);
    const defaultRole = rolesList.find((r) => r.id === 'role_receptionist') || rolesList[0] || DEFAULT_SYSTEM_ROLES[0];
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: defaultRole.id,
      roleLabel: defaultRole.label || `${defaultRole.emoji || '💼'} ${defaultRole.name}`,
      status: 'active',
      permissions: JSON.parse(JSON.stringify(defaultRole.permissions || ROLE_PRESETS.receptionist.permissions)),
      dashboardWidgets: defaultRole.dashboardWidgets
        ? { ...DEFAULT_STAFF_DASHBOARD_WIDGETS, ...defaultRole.dashboardWidgets }
        : { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
    });
    setShowModal(true);
  };

  const handleOpenEdit = (staff) => {
    setEditStaff(staff);
    const allRoles = [ownerRole, ...rolesList];
    const matchedRole = allRoles.find(
      (r) =>
        r.id === staff.role ||
        r.name?.toLowerCase() === staff.role?.toLowerCase() ||
        (r.isOwner && (staff.role === 'owner' || staff.role === 'role_owner'))
    ) || rolesList[0] || DEFAULT_SYSTEM_ROLES[0];

    const initialRole = staff.role || matchedRole.id;
    const initialRoleLabel = staff.roleLabel || getRoleLabel(initialRole, staff.roleLabel);
    const fallbackPerms = matchedRole.permissions || ROLE_PRESETS.receptionist.permissions;

    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: staff.password || '',
      phone: staff.phone || '',
      role: initialRole,
      roleLabel: initialRoleLabel,
      status: staff.status || 'active',
      permissions: staff.permissions
        ? JSON.parse(JSON.stringify(staff.permissions))
        : JSON.parse(JSON.stringify(fallbackPerms)),
      dashboardWidgets: staff.dashboardWidgets
        ? { ...DEFAULT_STAFF_DASHBOARD_WIDGETS, ...staff.dashboardWidgets }
        : matchedRole.dashboardWidgets
        ? { ...DEFAULT_STAFF_DASHBOARD_WIDGETS, ...matchedRole.dashboardWidgets }
        : { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
    });
    setShowModal(true);
  };

  const handleRolePresetChange = (presetId) => {
    const allRoles = [ownerRole, ...rolesList];
    const preset = allRoles.find((r) => r.id === presetId);
    if (preset) {
      const permissions = preset.permissions
        ? JSON.parse(JSON.stringify(preset.permissions))
        : JSON.parse(JSON.stringify(ROLE_PRESETS.receptionist.permissions));

      if (!permissions.students) {
        permissions.students = { view: true, create: true, edit: true, delete: false };
      }

      setFormData((prev) => ({
        ...prev,
        role: preset.id,
        roleLabel: preset.label || `${preset.emoji || '💼'} ${preset.name}`,
        permissions,
        dashboardWidgets: preset.dashboardWidgets
          ? { ...DEFAULT_STAFF_DASHBOARD_WIDGETS, ...preset.dashboardWidgets }
          : prev.dashboardWidgets,
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
      showToast('Please fill Staff Name, Email/ID and Password');
      return;
    }

    try {
      const activeTenantId = getActiveTenantId();
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        phone: formData.phone ? formData.phone.trim() : '',
        role: formData.role || 'role_receptionist',
        roleLabel: formData.roleLabel || getRoleLabel(formData.role || 'role_receptionist'),
        status: formData.status || 'active',
        tenantId: activeTenantId,
        ownerId: activeTenantId,
      };

      if (editStaff) {
        const updatedStaff = { ...editStaff, ...payload };
        setStaffList((prev) =>
          prev.map((s) => (s.id === editStaff.id ? updatedStaff : s))
        );
        await updateDocument(COLLECTIONS.STAFF_USERS, editStaff.id, payload);
        showToast(`Staff member "${formData.name}" updated successfully!`);
      } else {
        const newStaff = await createDocument(COLLECTIONS.STAFF_USERS, payload);
        setStaffList((prev) => [newStaff, ...prev.filter((s) => s.id !== newStaff.id)]);
        showToast(`New staff member "${formData.name}" created successfully!`);
      }
      setShowModal(false);
      fetchData(false);
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
      await fetchData();
      showToast('Staff account deleted');
    } catch (e) {
      console.error(e);
    }
  };

  // Role Presets Management Handlers
  const handleOpenAddRole = () => {
    setEditRole(null);
    setRoleFormData({
      name: '',
      emoji: '💼',
      description: '',
      permissions: JSON.parse(JSON.stringify(ROLE_PRESETS.receptionist.permissions)),
      dashboardWidgets: { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
    });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role) => {
    setEditRole(role);
    setRoleFormData({
      name: role.name || '',
      emoji: role.emoji || (role.isOwner ? '👑' : '💼'),
      description: role.description || '',
      permissions: role.permissions
        ? JSON.parse(JSON.stringify(role.permissions))
        : JSON.parse(JSON.stringify(ROLE_PRESETS.receptionist.permissions)),
      dashboardWidgets: role.dashboardWidgets
        ? { ...DEFAULT_STAFF_DASHBOARD_WIDGETS, ...role.dashboardWidgets }
        : { ...DEFAULT_STAFF_DASHBOARD_WIDGETS },
    });
    setShowRoleModal(true);
  };

  const handleRoleFormPermissionToggle = (moduleKey, actionKey) => {
    setRoleFormData((prev) => {
      const currentModulePerms = prev.permissions[moduleKey] || {};
      const updatedModule = { ...currentModulePerms };
      updatedModule[actionKey] = !updatedModule[actionKey];

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: updatedModule,
        },
      };
    });
  };

  const handleRoleFormModuleToggleAll = (moduleKey, actions) => {
    setRoleFormData((prev) => {
      const currentModulePerms = prev.permissions[moduleKey] || {};
      const allEnabled = actions.every((act) => !!currentModulePerms[act]);
      const newModulePerms = {};
      actions.forEach((act) => {
        newModulePerms[act] = !allEnabled;
      });

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: newModulePerms,
        },
      };
    });
  };

  const handleSaveRolePreset = async (e) => {
    e.preventDefault();
    if (!roleFormData.name.trim()) {
      showToast('Please enter a Role Name');
      return;
    }

    const isOwnerRole = editRole?.isOwner || editRole?.id === 'role_owner';

    const payload = {
      name: roleFormData.name.trim(),
      emoji: roleFormData.emoji || (isOwnerRole ? '👑' : '💼'),
      label: `${roleFormData.emoji || (isOwnerRole ? '👑' : '💼')} ${roleFormData.name.trim()}`,
      description: roleFormData.description.trim() || 'Staff role template',
      permissions: roleFormData.permissions,
      dashboardWidgets: roleFormData.dashboardWidgets || DEFAULT_STAFF_DASHBOARD_WIDGETS,
      isOwner: isOwnerRole,
    };

    try {
      if (editRole) {
        const docId = isOwnerRole ? 'role_owner' : editRole.id;
        if (isOwnerRole) {
          setOwnerRole({ ...payload, id: 'role_owner', isOwner: true });
        } else {
          setRolesList((prev) =>
            prev.map((r) => (r.id === editRole.id ? { ...r, ...payload } : r))
          );
        }
        await updateDocument(COLLECTIONS.ROLE_PRESETS, docId, payload);
        showToast(`Role "${payload.label}" updated successfully!`);
      } else {
        const newRole = await createDocument(COLLECTIONS.ROLE_PRESETS, payload);
        setRolesList((prev) => [...prev, newRole]);
        showToast(`New Role "${payload.label}" created!`);
      }
      setShowRoleModal(false);
      fetchData(false);
    } catch (err) {
      console.error(err);
      showToast('Error saving role: ' + err.message);
    }
  };

  const handleDeleteRoleConfirm = async () => {
    if (!deleteRoleTarget) return;
    if (['role_owner', 'role_receptionist', 'role_manager'].includes(deleteRoleTarget.id)) {
      showToast('डिफ़ॉल्ट सिस्टम रोल डिलीट नहीं किया जा सकता (Default system role cannot be deleted)');
      setDeleteRoleTarget(null);
      return;
    }
    try {
      await removeDocument(COLLECTIONS.ROLE_PRESETS, deleteRoleTarget.id);
      setRolesList((prev) => prev.filter((r) => r.id !== deleteRoleTarget.id));
      setDeleteRoleTarget(null);
      fetchData(false);
      showToast('Role deleted successfully');
    } catch (e) {
      console.error(e);
      showToast('Error deleting role');
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (staff) => {
    const roleTitle = getRoleLabel(staff.role, staff.roleLabel);
    const text = `Study Point Staff Login Details:\n• Name: ${staff.name}\n• User ID / Email: ${staff.email}\n• Password: ${staff.password}\n• Role: ${roleTitle}`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    showToast(`Copied ${staff.name}'s Login ID & Password!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

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
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Role & Permission</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {staffMembers.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Role & Permission */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Role & Permission</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage staff accounts, edit role templates & configure module permissions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={<Sparkles className="w-4 h-4 text-purple-600" />}
              onClick={handleOpenAddRole}
            >
              + Create New Role
            </Button>
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

        {/* Roles Presets Banner - All Roles are Editable & Updatable */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Configured Roles & Permissions ({rolesList.length + 1})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Owner Master Card (Now Fully Editable & Updatable) */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs space-y-1 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                    <span className="text-base">{ownerRole.emoji || '👑'}</span>
                    <span className="truncate">{ownerRole.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditRole(ownerRole)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                      title="Edit Owner Role & Permissions"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-2">
                  {ownerRole.description || 'Full access to all revenue, expenses, audit reports & library settings.'}
                </p>
              </div>
            </div>

            {/* All Configured Roles with Full Edit & Delete Options */}
            {rolesList.map((r) => (
              <div
                key={r.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1 flex flex-col justify-between hover:border-indigo-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                      <span className="text-base">{r.emoji || '💼'}</span>
                      <span className="truncate">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditRole(r)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                        title="Edit Role & Permissions"
                      >
                        <Edit size={14} />
                      </button>
                      {!['role_owner', 'role_receptionist', 'role_manager'].includes(r.id) ? (
                        <button
                          onClick={() => setDeleteRoleTarget(r)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Role"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">
                          Standard
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-2">
                    {r.description || 'Configured staff role template'}
                  </p>
                </div>
              </div>
            ))}
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
                const displayRole = getRoleLabel(staff.role, staff.roleLabel);

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
                              {displayRole}
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
    )}

        {/* TAB 2: Staff */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Header Bar for Staff */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Members</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  स्टाफ की फोटो, मोबाइल नंबर, आधार कार्ड, मासिक वेतन व जॉइनिंग डेट प्रबंधित करें
                </p>
              </div>

              <Button
                icon={<UserPlus className="w-4 h-4" />}
                onClick={handleOpenAddStaffMember}
              >
                + Add Staff
              </Button>
            </div>

            {/* Staff Members List */}
            {staffMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffMembers.map((staff) => {
                  const joinDay = staff.joinDate ? parseInt(staff.joinDate.split('-')[2], 10) : null;
                  const isLeft = staff.status === 'left';
                  const roleLabel = staff.role || 'Staff';

                  return (
                    <div
                      key={staff.id}
                      className={`bg-white rounded-2xl p-5 border shadow-xs space-y-4 transition-all flex flex-col justify-between ${
                        isLeft ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top: Photo, Name, Role, Status & Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {staff.photo ? (
                              <img
                                src={staff.photo}
                                alt={staff.name}
                                className="w-14 h-14 rounded-2xl object-cover border border-indigo-200 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl shrink-0">
                                {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                                  {staff.name}
                                </h4>
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    isLeft
                                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {isLeft ? '🔴 Left' : '🟢 Active'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {roleLabel}
                                </span>
                                {staff.phone && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                    <Phone size={11} className="text-slate-400" />
                                    <span>{staff.phone}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStaffMember(staff)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                              title="Edit Staff"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteStaffTarget(staff)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Staff"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Salary & Joining Date row */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Salary:</span>
                            <span className="font-extrabold text-emerald-700 text-sm">
                              {staff.salary ? formatCurrency(staff.salary) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Joining Date:</span>
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                              <Calendar size={12} className="text-indigo-600" />
                              <span>{formatDate(staff.joinDate)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Aadhaar card button */}
                        <div>
                          {staff.aadharPhoto ? (
                            <button
                              type="button"
                              onClick={() => setPreviewAadhar(staff.aadharPhoto)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              <FileText size={14} className="text-blue-600" />
                              <span>Aadhaar Card (Click to View)</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic block text-center py-1 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              Aadhaar photo not uploaded
                            </span>
                          )}
                        </div>

                        {/* Expense auto-sync or Left alert */}
                        {isLeft ? (
                          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                            <span className="shrink-0 font-bold">⚠️</span>
                            <span>स्टाफ छोड़ चुका है (Left) — Expenses में सैलरी जुड़ना बंद है।</span>
                          </div>
                        ) : (
                          Number(staff.salary) > 0 && (
                            <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-medium leading-relaxed">
                              🔄 हर महीने {joinDay ? `${joinDay} तारीख` : 'जॉइनिंग डेट'} को Expenses में स्वतः जुड़ेगा।
                            </div>
                          )
                        )}

                        {/* Action Buttons: Active / Left Status Toggle */}
                        <div className="pt-2 border-t border-slate-100">
                          {isLeft ? (
                            <button
                              type="button"
                              onClick={() => handleQuickToggleStaffStatus(staff, 'active')}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span>🟢 Reactivate Staff (चालू करें)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickToggleStaffStatus(staff, 'left')}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              title="Mark this staff as Left"
                            >
                              <span>🚪 Mark Left (छोड़ दिया)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Users size={26} />
                </div>
                <h4 className="font-bold text-slate-800 text-base">No Staff Members Added Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click <strong>"+ Add Staff"</strong> to register staff with photo, mobile number, Aadhaar card, monthly salary & joining date.
                </p>
                <div className="pt-2">
                  <Button icon={<UserPlus className="w-4 h-4" />} onClick={handleOpenAddStaffMember}>
                    + Add Staff
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
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
              <button
                type="button"
                onClick={handleOpenAddRole}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Create New Role</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[ownerRole, ...rolesList].map((r) => {
                const isSelected =
                  formData.role === r.id ||
                  (r.isOwner && (formData.role === 'owner' || formData.role === 'role_owner'));
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => handleRolePresetChange(r.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {r.label || `${r.emoji || '💼'} ${r.name}`}
                  </button>
                );
              })}
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
                    className="p-3 sm:p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

                    {/* Dashboard specific custom widgets selector */}
                    {module.id === 'dashboard' && modPerms.view && (
                      <div className="mt-1 pt-2.5 border-t border-slate-100 sm:ml-12 bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span>🎛️</span>
                            <span>Dashboard Sections for this Staff (डैशबोर्ड पर क्या-क्या दिखे):</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-bold">Tick allowed sections</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {DASHBOARD_WIDGET_OPTIONS.map((opt) => {
                            const isWidgetChecked = formData.dashboardWidgets?.[opt.id] !== false;
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                                  isWidgetChecked
                                    ? 'bg-white border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                                    : 'bg-slate-100/60 border-slate-200 text-slate-400 font-medium'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isWidgetChecked}
                                  onChange={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      dashboardWidgets: {
                                        ...prev.dashboardWidgets,
                                        [opt.id]: !isWidgetChecked,
                                      },
                                    }));
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span className="truncate">{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

      {/* Add / Edit Role Preset Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={editRole ? `Edit Role Preset: ${editRole.name}` : 'Create New Role Preset (नया रोल बनाएं)'}
        size="lg"
      >
        <form onSubmit={handleSaveRolePreset} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Emoji / Icon
              </label>
              <select
                value={roleFormData.emoji}
                onChange={(e) => setRoleFormData({ ...roleFormData, emoji: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base bg-white focus:ring-2 focus:ring-indigo-500 text-center font-bold"
              >
                {['💼', '📊', '🌙', '🛎️', '👔', '📚', '🔑', '🛡️', '⚡', '🧹', '👨‍🏫', '🎯'].map(
                  (em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Role Name (पद का नाम) *
              </label>
              <input
                type="text"
                required
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="e.g. Accountant, Night Incharge, Assistant"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Role Description (भूमिका विवरण)
            </label>
            <input
              type="text"
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              placeholder="e.g. Manages fees, admissions & daily seat allocations"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Role Default Permissions Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Default Role Permissions (डिफ़ॉल्ट अनुमतियाँ)
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold">
                Set allowed module access for this role
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-64 overflow-y-auto">
              {PERMISSION_MODULES.map((module) => {
                const modPerms = roleFormData.permissions[module.id] || {};
                const meta = MODULE_META[module.id] || {
                  icon: Layers,
                  color: 'text-slate-600 bg-slate-50 border-slate-200',
                  desc: 'Module operations',
                };
                const IconComponent = meta.icon;

                return (
                  <div
                    key={module.id}
                    className="p-3 sm:p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-900 leading-tight">
                            {module.label || module.id}
                          </p>
                          <p className="text-[10px] text-slate-400">{meta.desc}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 ml-11 sm:ml-0">
                        {module.actions.map((act) => {
                          const isChecked = !!modPerms[act];

                          return (
                            <label
                              key={act}
                              className={`flex items-center gap-1 text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-lg border transition-all select-none ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold'
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleRoleFormPermissionToggle(module.id, act)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                              />
                              <span className="capitalize">{act}</span>
                            </label>
                          );
                        })}

                        {module.actions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRoleFormModuleToggleAll(module.id, module.actions)}
                            className="text-[10px] font-bold px-1.5 py-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                            title="Toggle all actions for this module"
                          >
                            All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dashboard specific custom widgets selector for role */}
                    {module.id === 'dashboard' && modPerms.view && (
                      <div className="mt-1 pt-2.5 border-t border-slate-100 sm:ml-11 bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span>🎛️</span>
                            <span>Dashboard Sections for this Role (इस रोल को क्या-क्या दिखे):</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-bold">Tick allowed sections</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {DASHBOARD_WIDGET_OPTIONS.map((opt) => {
                            const isWidgetChecked = roleFormData.dashboardWidgets?.[opt.id] !== false;
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                                  isWidgetChecked
                                    ? 'bg-white border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                                    : 'bg-slate-100/60 border-slate-200 text-slate-400 font-medium'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isWidgetChecked}
                                  onChange={() => {
                                    setRoleFormData((prev) => ({
                                      ...prev,
                                      dashboardWidgets: {
                                        ...prev.dashboardWidgets,
                                        [opt.id]: !isWidgetChecked,
                                      },
                                    }));
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span className="truncate">{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowRoleModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editRole ? 'Save Role Preset' : 'Create Role Preset'}
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

      {/* Delete Role Preset Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteRoleTarget}
        onClose={() => setDeleteRoleTarget(null)}
        onConfirm={handleDeleteRoleConfirm}
        title="Delete Role Preset"
        message={`Are you sure you want to delete the role preset "${deleteRoleTarget?.name}"?`}
        confirmText="Delete Role"
        variant="danger"
      />

      {/* Tab 2: Add / Edit Staff Member Modal */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title={editStaffMember ? `Edit Staff: ${editStaffMember.name}` : 'Add New Staff Member (स्टाफ जोड़ें)'}
        size="md"
      >
        <form onSubmit={handleStaffMemberSubmit} className="space-y-4">
          {/* Photo & Aadhaar uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Staff Photo */}
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
                {staffMemberFormData.photo ? (
                  <img src={staffMemberFormData.photo} alt="Staff" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
                {isCompressingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-bold">
                    ...
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="block text-xs font-bold text-slate-800">
                  Staff Photo
                </span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors">
                    <Camera size={12} />
                    <span>{staffMemberFormData.photo ? 'Change' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStaffPhotoChange}
                      className="hidden"
                    />
                  </label>
                  {staffMemberFormData.photo && (
                    <button
                      type="button"
                      onClick={() => setStaffMemberFormData((prev) => ({ ...prev, photo: '' }))}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Aadhaar Photo */}
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
                {staffMemberFormData.aadharPhoto ? (
                  <img src={staffMemberFormData.aadharPhoto} alt="Aadhaar" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-6 h-6 text-blue-400" />
                )}
                {isCompressingAadhar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-bold">
                    ...
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="block text-xs font-bold text-slate-800">
                  Aadhaar Card
                </span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors">
                    <FileText size={12} />
                    <span>{staffMemberFormData.aadharPhoto ? 'Change' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStaffAadharChange}
                      className="hidden"
                    />
                  </label>
                  {staffMemberFormData.aadharPhoto && (
                    <button
                      type="button"
                      onClick={() => setStaffMemberFormData((prev) => ({ ...prev, aadharPhoto: '' }))}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Name & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Name (स्टाफ का नाम) *
              </label>
              <input
                type="text"
                required
                value={staffMemberFormData.name}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number (मोबाइल नंबर)
              </label>
              <input
                type="tel"
                value={staffMemberFormData.phone}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Role / Designation & Account Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Role (पद / कार्य) *
              </label>
              <select
                value={staffMemberFormData.role}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Receptionist">🛎️ Receptionist (रिसेप्शनिस्ट)</option>
                <option value="Worker / Cleaner">🧹 Worker / Cleaner (सफाई / वर्कर)</option>
                <option value="Branch Manager">👔 Branch Manager (मैनेजर)</option>
                <option value="Security Guard">🛡️ Security Guard (सुरक्षा गार्ड)</option>
                <option value="Helper / Peon">🤝 Helper / Peon (हेल्पर)</option>
                <option value="Night Incharge">🌙 Night Incharge (नाईट इंचार्ज)</option>
                <option value="Other">💼 Other (अन्य)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Status (कार्यरत / छोड़ दिया)
              </label>
              <select
                value={staffMemberFormData.status}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">🟢 Active (कार्यरत - सैलरी चालू)</option>
                <option value="left">🔴 Left (छोड़ दिया - खर्च बंद)</option>
              </select>
            </div>
          </div>

          {/* Monthly Salary & Join Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <IndianRupee size={13} className="text-emerald-600" />
                <span>Monthly Salary (मासिक वेतन ₹)</span>
              </label>
              <input
                type="number"
                min="0"
                value={staffMemberFormData.salary}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, salary: e.target.value })}
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-indigo-600" />
                <span>Joining Date (जॉइनिंग तारीख) *</span>
              </label>
              <input
                type="date"
                required
                value={staffMemberFormData.joinDate}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, joinDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              />
            </div>
          </div>

          {Number(staffMemberFormData.salary) > 0 && staffMemberFormData.joinDate && (
            <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-200 text-xs font-medium leading-relaxed">
              💡 यह वेतन <strong>₹{Number(staffMemberFormData.salary).toLocaleString('en-IN')}/month</strong> हर महीने <strong>{staffMemberFormData.joinDate.split('-')[2]} तारीख</strong> को Expenses & Utility में स्वतः (automatically) सैलरी खर्च के रूप में जुड़ेगा।
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowStaffModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editStaffMember ? 'Update Staff' : 'Save Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Member Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteStaffTarget}
        onClose={() => setDeleteStaffTarget(null)}
        onConfirm={handleDeleteStaffMemberConfirm}
        title="Delete Staff Member"
        message={`Are you sure you want to remove "${deleteStaffTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Aadhaar Card Photo Preview Modal */}
      <Modal
        isOpen={!!previewAadhar}
        onClose={() => setPreviewAadhar(null)}
        title="Aadhaar Card Photo (आधार कार्ड)"
        size="md"
      >
        <div className="space-y-4 text-center">
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
            {previewAadhar && (
              <img
                src={previewAadhar}
                alt="Aadhaar Card"
                className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setPreviewAadhar(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}


