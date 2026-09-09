import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Calculator,
  Wallet,
  Clock,
  TrendingUp,
  Filter,
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
  const location = useLocation();
  const navigate = useNavigate();

  const isStaffPath = location.pathname.startsWith('/staff');
  const [activeTab, setActiveTab] = useState(isStaffPath ? 'staff' : 'roles');

  useEffect(() => {
    if (location.pathname.startsWith('/staff')) {
      setActiveTab('staff');
    } else if (location.pathname.startsWith('/roles')) {
      setActiveTab('roles');
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'staff') {
      navigate('/staff');
    } else {
      navigate('/roles');
    }
  };

  const [staffList, setStaffList] = useState([]);
  const [rolesList, setRolesList] = useState(DEFAULT_SYSTEM_ROLES);
  const [ownerRole, setOwnerRole] = useState(DEFAULT_OWNER_ROLE);
  const [loading, setLoading] = useState(true);

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

  // Staff Salary History & Calculator State
  const [salaryExpenses, setSalaryExpenses] = useState([]);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryMonthFilter, setSalaryMonthFilter] = useState('');
  const [salaryStaffFilter, setSalaryStaffFilter] = useState('');
  const [deleteSalaryTarget, setDeleteSalaryTarget] = useState(null);
  const [salaryFormData, setSalaryFormData] = useState({
    staffId: '',
    staffName: '',
    role: '',
    baseSalary: '',
    daysInMonth: 30,
    daysWorked: 30,
    bonus: '',
    deductions: '',
    netSalary: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    amount: '',
    description: '',
  });

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
      const [staffData, rolesData, staffMembersData, expensesData] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STAFF_USERS),
        fetchCollectionData(COLLECTIONS.ROLE_PRESETS),
        fetchCollectionData(COLLECTIONS.STAFF_MEMBERS),
        fetchCollectionData(COLLECTIONS.EXPENSES),
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

      // Filter and sort staff salary expense records
      const staffSalaryList = (expensesData || [])
        .filter(
          (e) =>
            e.type === 'salary' ||
            e.category === 'Staff Salary' ||
            e.isStaffSalaryAuto ||
            e.salaryDetails
        )
        .sort((a, b) => {
          const dateA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date || a.createdAt || 0).getTime();
          const dateB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

      setStaffList(staffData || []);
      setRolesList(finalRolesList);
      setStaffMembers(staffMembersData || []);
      setSalaryExpenses(staffSalaryList);
    } catch (e) {
      console.error('Error fetching staff data:', e);
    } finally {
      if (showFullLoader) setLoading(false);
    }
  };

  const fetchStaffMembersData = async () => {
    try {
      const [members, expenses] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STAFF_MEMBERS),
        fetchCollectionData(COLLECTIONS.EXPENSES),
      ]);
      setStaffMembers(members || []);
      if (expenses) {
        const staffSalaryList = expenses
          .filter(
            (e) =>
              e.type === 'salary' ||
              e.category === 'Staff Salary' ||
              e.isStaffSalaryAuto ||
              e.salaryDetails
          )
          .sort((a, b) => {
            const dateA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date || a.createdAt || 0).getTime();
            const dateB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        setSalaryExpenses(staffSalaryList);
      }
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
      showToast('Failed to load staff photo');
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
      showToast('Failed to load Aadhaar card image');
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
      showToast('Please enter staff name');
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
          ? `${staff.name} marked as Left (Expense auto-add paused)`
          : `${staff.name} reactivated as Active`
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

  // Staff Salary Calculator & Payment Handlers
  const handleOpenPaySalary = (staff = null) => {
    const defaultStaff = staff || staffMembers.find((s) => s.status !== 'left') || staffMembers[0];
    const base = defaultStaff ? Number(defaultStaff.salary) || 0 : 0;
    const name = defaultStaff ? defaultStaff.name : '';
    const role = defaultStaff ? (defaultStaff.role || 'Staff') : '';
    const daysInMonth = 30;
    const daysWorked = 30;
    const bonus = '';
    const deductions = '';
    const net = base;
    const date = new Date().toISOString().split('T')[0];
    const desc = `Salary for ${name || 'Staff'} (${role || 'Role'}) [${daysWorked}/${daysInMonth} days + Bonus ₹0 - Deduct ₹0]`;

    setSalaryFormData({
      staffId: defaultStaff ? defaultStaff.id : '',
      staffName: name,
      role: role,
      baseSalary: base || '',
      daysInMonth: 30,
      daysWorked: 30,
      bonus: '',
      deductions: '',
      netSalary: net,
      date,
      paymentMode: 'cash',
      amount: String(net || ''),
      description: desc,
    });
    setShowSalaryModal(true);
  };

  const updateSalaryCalculation = (updates) => {
    setSalaryFormData((prev) => {
      const next = { ...prev, ...updates };
      const base = Number(next.baseSalary) || 0;
      const daysTotal = Number(next.daysInMonth) || 30;
      const worked = Number(next.daysWorked) || 0;
      const bonus = Number(next.bonus) || 0;
      const deductions = Number(next.deductions) || 0;

      const perDay = daysTotal > 0 ? base / daysTotal : 0;
      const earned = Math.round(perDay * worked) + bonus - deductions;
      const net = Math.max(0, earned);

      const desc = `Salary for ${next.staffName || 'Staff'} (${next.role || 'Role'}) [${worked}/${daysTotal} days + Bonus ₹${bonus} - Deduct ₹${deductions}]`;

      return {
        ...next,
        netSalary: net,
        amount: String(net),
        description: desc,
      };
    });
  };

  const handleSaveSalaryExpense = async (e) => {
    e.preventDefault();
    if (!salaryFormData.staffName.trim()) {
      showToast('Please enter or select staff name');
      return;
    }
    const finalAmount = Number(salaryFormData.amount) || salaryFormData.netSalary || 0;
    if (finalAmount <= 0) {
      showToast('Salary amount must be greater than 0');
      return;
    }

    const activeTenantId = getActiveTenantId();
    const payload = {
      title: `Salary - ${salaryFormData.staffName}`,
      category: 'Staff Salary',
      type: 'salary',
      amount: finalAmount,
      date: salaryFormData.date,
      month: salaryFormData.date.slice(0, 7),
      paymentMode: salaryFormData.paymentMode || 'cash',
      description: salaryFormData.description || `Staff Salary for ${salaryFormData.staffName}`,
      staffId: salaryFormData.staffId || null,
      isStaffSalaryAuto: false,
      tenantId: activeTenantId,
      ownerId: activeTenantId,
      salaryDetails: {
        staffId: salaryFormData.staffId,
        staffName: salaryFormData.staffName,
        role: salaryFormData.role,
        baseSalary: Number(salaryFormData.baseSalary) || 0,
        daysInMonth: Number(salaryFormData.daysInMonth) || 30,
        daysWorked: Number(salaryFormData.daysWorked) || 30,
        bonus: Number(salaryFormData.bonus) || 0,
        deductions: Number(salaryFormData.deductions) || 0,
        netSalary: finalAmount,
        paymentMode: salaryFormData.paymentMode || 'cash',
      },
    };

    try {
      const savedDoc = await createDocument(COLLECTIONS.EXPENSES, payload);
      setSalaryExpenses((prev) => [savedDoc, ...prev]);
      setShowSalaryModal(false);
      showToast(`₹${finalAmount.toLocaleString('en-IN')} salary recorded in Expenses successfully!`);
      fetchData(false);
    } catch (err) {
      console.error(err);
      showToast('Error saving salary expense: ' + err.message);
    }
  };

  const handleDeleteSalaryConfirm = async () => {
    if (!deleteSalaryTarget) return;
    try {
      await removeDocument(COLLECTIONS.EXPENSES, deleteSalaryTarget.id);
      setSalaryExpenses((prev) => prev.filter((s) => s.id !== deleteSalaryTarget.id));
      setDeleteSalaryTarget(null);
      showToast('Salary record deleted successfully');
      fetchData(false);
    } catch (err) {
      console.error(err);
      showToast('Error deleting salary record');
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
      showToast('Default system role cannot be deleted');
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
      <Layout title={activeTab === 'staff' ? 'Staff Members' : 'Role & Permission'}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={activeTab === 'staff' ? 'Staff' : 'Role & Permission'}>
      <div className="space-y-6">
        {/* SECTION 1: Role & Permission */}
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
                          Login Credentials (ID & Password):
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
        {activeTab === 'staff' && (() => {
          const currentMonthStr = new Date().toISOString().slice(0, 7);
          const activeStaffList = staffMembers.filter((s) => s.status !== 'left');
          const leftStaffList = staffMembers.filter((s) => s.status === 'left');
          const totalBasePayroll = activeStaffList.reduce((acc, s) => acc + (Number(s.salary) || 0), 0);

          const thisMonthSalaryExpenses = salaryExpenses.filter((e) => {
            return e.month === currentMonthStr || (e.date && e.date.startsWith(currentMonthStr));
          });
          const totalPaidThisMonth = thisMonthSalaryExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
          const paidStaffCount = new Set(thisMonthSalaryExpenses.map((e) => e.staffId || e.salaryDetails?.staffId || e.salaryDetails?.staffName)).size;
          const pendingPayrollStaff = Math.max(0, activeStaffList.length - paidStaffCount);

          // Filtered salary expenses for the table
          const filteredSalaryExpenses = salaryExpenses.filter((e) => {
            const matchMonth = salaryMonthFilter ? (e.month === salaryMonthFilter || (e.date && e.date.startsWith(salaryMonthFilter))) : true;
            const matchStaff = salaryStaffFilter ? (e.staffId === salaryStaffFilter || e.salaryDetails?.staffId === salaryStaffFilter || (e.salaryDetails?.staffName && e.salaryDetails.staffName.toLowerCase().includes(salaryStaffFilter.toLowerCase()))) : true;
            return matchMonth && matchStaff;
          });

          const filteredSalaryTotal = filteredSalaryExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

          return (
            <div className="space-y-6">
              {/* Top Header Bar for Staff */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span>Staff & Payroll Management</span>
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Manage staff profiles, monthly salary calculation & payment history
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="secondary"
                    icon={<Calculator className="w-4 h-4 text-blue-600" />}
                    onClick={() => handleOpenPaySalary()}
                  >
                    + Calculate & Pay Salary
                  </Button>
                  <Button
                    icon={<UserPlus className="w-4 h-4" />}
                    onClick={handleOpenAddStaffMember}
                  >
                    + Add Staff Member
                  </Button>
                </div>
              </div>

              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Users size={14} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{staffMembers.length}</span>
                    <span className="text-[11px] font-bold text-emerald-600">({activeStaffList.length} Active)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {leftStaffList.length > 0 ? `${leftStaffList.length} staff left` : 'All staff active'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Base Payroll</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Wallet size={14} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{formatCurrency(totalBasePayroll)}</div>
                  <p className="text-[11px] text-slate-400 font-medium">Total monthly base salary of active staff</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid This Month</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <IndianRupee size={14} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">{formatCurrency(totalPaidThisMonth)}</div>
                  <p className="text-[11px] text-emerald-600 font-medium">{thisMonthSalaryExpenses.length} salary vouchers recorded</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payroll</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Clock size={14} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-700">{pendingPayrollStaff} Staff</div>
                  <p className="text-[11px] text-slate-400 font-medium">Salary pending this month</p>
                </div>
              </div>

              {/* Staff Members Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Staff Profiles ({staffMembers.length})</span>
                  </h3>
                </div>

                {staffMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staffMembers.map((staff) => {
                      const joinDay = staff.joinDate ? parseInt(staff.joinDate.split('-')[2], 10) : null;
                      const isLeft = staff.status === 'left';
                      const roleLabel = staff.role || 'Staff';

                      const paidRecord = salaryExpenses.find((e) => {
                        const matchStaff = e.staffId === staff.id || e.salaryDetails?.staffId === staff.id || (e.salaryDetails?.staffName && e.salaryDetails.staffName.toLowerCase() === staff.name.toLowerCase());
                        const matchMonth = e.month === currentMonthStr || (e.date && e.date.startsWith(currentMonthStr));
                        return matchStaff && matchMonth;
                      });

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
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Base:</span>
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

                            {/* This Month Payment Status Pill */}
                            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl border border-slate-100 bg-slate-50/60">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">This Month Status:</span>
                              {paidRecord ? (
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] border border-emerald-200">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  <span>Paid: {formatCurrency(paidRecord.amount)}</span>
                                </span>
                              ) : (
                                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] border border-amber-200">
                                  <Clock size={12} className="text-amber-600" />
                                  <span>Pending</span>
                                </span>
                              )}
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
                          </div>

                          {/* Action Buttons: Pay Salary & Active / Left Status Toggle */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            {!isLeft && (
                              <button
                                type="button"
                                onClick={() => handleOpenPaySalary(staff)}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                              >
                                <Calculator size={13} />
                                <span>Pay / Calculate Salary</span>
                              </button>
                            )}

                            {isLeft ? (
                              <button
                                type="button"
                                onClick={() => handleQuickToggleStaffStatus(staff, 'active')}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                <span>🟢 Reactivate Staff</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickToggleStaffStatus(staff, 'left')}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                title="Mark this staff as Left"
                              >
                                <span>🚪 Mark Left</span>
                              </button>
                            )}
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

              {/* NEW SECTION: Staff Monthly Salary & Expense History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Table Header with Filters */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 shrink-0">
                      <Calculator size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Staff Salary & Expense Records
                      </h3>
                      <p className="text-xs text-slate-500">
                        Monthly attendance, bonus, deductions and payout records
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Month Picker Filter */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                      <Calendar size={13} className="text-slate-400" />
                      <input
                        type="month"
                        value={salaryMonthFilter}
                        onChange={(e) => setSalaryMonthFilter(e.target.value)}
                        className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                      />
                      {salaryMonthFilter && (
                        <button
                          onClick={() => setSalaryMonthFilter('')}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer"
                          title="Clear month filter"
                        >
                          ✕ All
                        </button>
                      )}
                    </div>

                    {/* Staff Member Filter Dropdown */}
                    <select
                      value={salaryStaffFilter}
                      onChange={(e) => setSalaryStaffFilter(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-2xs"
                    >
                      <option value="">All Staff</option>
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    {/* Calculate & Pay Salary Button */}
                    <Button
                      variant="primary"
                      icon={<Plus size={14} />}
                      onClick={() => handleOpenPaySalary()}
                    >
                      + Record Salary
                    </Button>
                  </div>
                </div>

                {/* Sub-strip with Summary Stats for Filtered Records */}
                <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-600 font-medium">
                    <span>Records: <strong className="text-slate-900 font-extrabold">{filteredSalaryExpenses.length}</strong></span>
                    <span>Total Paid: <strong className="text-emerald-700 font-black text-sm">{formatCurrency(filteredSalaryTotal)}</strong></span>
                  </div>
                  <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                    💡 Salary recorded here automatically syncs with Expenses & Utility.
                  </span>
                </div>

                {/* Table Data */}
                {filteredSalaryExpenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Date / Month</th>
                          <th className="py-3 px-4">Staff Member</th>
                          <th className="py-3 px-4 text-right">Monthly Base</th>
                          <th className="py-3 px-4 text-center">Days Worked</th>
                          <th className="py-3 px-4 text-right">Bonus</th>
                          <th className="py-3 px-4 text-right">Deduction</th>
                          <th className="py-3 px-4 text-right">Net Paid</th>
                          <th className="py-3 px-4">Notes / Description</th>
                          <th className="py-3 px-4 text-center">Source</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredSalaryExpenses.map((rec) => {
                          const details = rec.salaryDetails || {};
                          const staffName = details.staffName || rec.staffName || rec.title?.replace('Salary - ', '') || 'Staff';
                          const role = details.role || rec.role || 'Staff';
                          const base = details.baseSalary || rec.amount || 0;
                          const daysTotal = details.daysInMonth || 30;
                          const daysWorked = details.daysWorked !== undefined ? details.daysWorked : 30;
                          const bonus = details.bonus || 0;
                          const deduction = details.deductions || 0;
                          const net = rec.amount || 0;
                          const paymentMode = details.paymentMode || rec.paymentMode || 'cash';

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-bold text-slate-900">{formatDate(rec.date)}</div>
                                <div className="text-[10px] text-slate-400 font-mono font-semibold">{rec.month || rec.date?.slice(0, 7) || '—'}</div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-100">
                                    {staffName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-900 leading-tight">{staffName}</div>
                                    <div className="text-[11px] text-indigo-600 font-bold">{role}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-700">
                                {formatCurrency(base)}
                              </td>

                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                                  daysWorked < daysTotal
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {daysWorked}/{daysTotal} Days
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                                {bonus > 0 ? (
                                  <span className="text-emerald-600">+{formatCurrency(bonus)}</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                                {deduction > 0 ? (
                                  <span className="text-rose-600">-{formatCurrency(deduction)}</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="font-black text-slate-900 text-sm">{formatCurrency(net)}</div>
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-600">
                                  {paymentMode}
                                </span>
                              </td>

                              <td className="py-3 px-4 max-w-xs truncate text-slate-600 text-xs font-normal" title={rec.description}>
                                {rec.description || 'Staff Salary Payment'}
                              </td>

                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  <CheckCircle2 size={10} />
                                  <span>Expenses</span>
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setDeleteSalaryTarget(rec)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Salary Expense Record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <Calculator size={22} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">No Salary Payment Records Found</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click <strong>"+ Record Salary"</strong> above to calculate attendance and record salary payment.
                    </p>
                    <div className="pt-2">
                      <Button variant="secondary" icon={<Calculator size={13} />} onClick={() => handleOpenPaySalary()}>
                        Open Calculator
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
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
                Quick Role Preset
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
                <option value="active">🟢 Active</option>
                <option value="inactive">🔴 Inactive</option>
              </select>
            </div>
          </div>

          {/* Granular Module-by-Module Permission Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Module Permissions Matrix
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
                            <span>Dashboard Sections for this Staff:</span>
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
        title={editRole ? `Edit Role Preset: ${editRole.name}` : 'Create New Role Preset'}
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
                Role Name *
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
              Role Description
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
                Default Role Permissions
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
                            <span>Dashboard Sections for this Role:</span>
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
        title={editStaffMember ? `Edit Staff: ${editStaffMember.name}` : 'Add New Staff Member'}
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
                Staff Name *
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
                Mobile Number
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
                Staff Role *
              </label>
              <select
                value={staffMemberFormData.role}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Receptionist">🛎️ Receptionist</option>
                <option value="Worker / Cleaner">🧹 Worker / Cleaner</option>
                <option value="Branch Manager">👔 Branch Manager</option>
                <option value="Security Guard">🛡️ Security Guard</option>
                <option value="Helper / Peon">🤝 Helper / Peon</option>
                <option value="Night Incharge">🌙 Night Incharge</option>
                <option value="Other">💼 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Status
              </label>
              <select
                value={staffMemberFormData.status}
                onChange={(e) => setStaffMemberFormData({ ...staffMemberFormData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">🟢 Active</option>
                <option value="left">🔴 Left</option>
              </select>
            </div>
          </div>

          {/* Monthly Salary & Join Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <IndianRupee size={13} className="text-emerald-600" />
                <span>Monthly Salary (₹)</span>
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
                <span>Joining Date *</span>
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
              💡 This salary of <strong>₹{Number(staffMemberFormData.salary).toLocaleString('en-IN')}/month</strong> will be scheduled on day <strong>{staffMemberFormData.joinDate.split('-')[2]}</strong> of each month in Expenses.
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

      {/* Staff Salary & Attendance Calculator Modal */}
      <Modal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title="💸 Staff Salary & Attendance Calculator"
        size="lg"
      >
        <form onSubmit={handleSaveSalaryExpense} className="space-y-4">
          {/* Blue Calculator Container */}
          <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Staff Salary & Attendance Calculator
                </h4>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                Monthly Auto-Schedule
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Staff Name *
                </label>
                {staffMembers.length > 0 && (
                  <select
                    value={salaryFormData.staffId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selected = staffMembers.find((s) => s.id === selectedId);
                      if (selected) {
                        const base = Number(selected.monthlySalary) || 0;
                        updateSalaryCalculation({
                          staffId: selected.id,
                          staffName: selected.name,
                          role: selected.role || '',
                          baseSalary: base ? String(base) : salaryFormData.baseSalary,
                        });
                      } else {
                        updateSalaryCalculation({
                          staffId: '',
                          staffName: '',
                        });
                      }
                    }}
                    className="w-full mb-1.5 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Staff Member --</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role || 'Staff'}) {s.monthlySalary ? `- ₹${Number(s.monthlySalary).toLocaleString('en-IN')}/mo` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  required
                  value={salaryFormData.staffName}
                  onChange={(e) => updateSalaryCalculation({ staffName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  value={salaryFormData.role}
                  onChange={(e) => updateSalaryCalculation({ role: e.target.value })}
                  placeholder="e.g. Caretaker, Receptionist"
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Monthly Base (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={salaryFormData.baseSalary}
                  onChange={(e) => updateSalaryCalculation({ baseSalary: e.target.value })}
                  placeholder="e.g. 8000"
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Days Worked
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={salaryFormData.daysWorked}
                    onChange={(e) => updateSalaryCalculation({ daysWorked: e.target.value })}
                    placeholder="30"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">/</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={salaryFormData.daysInMonth}
                    onChange={(e) => updateSalaryCalculation({ daysInMonth: e.target.value })}
                    placeholder="30"
                    title="Total days in month"
                    className="w-14 px-1.5 py-1.5 bg-slate-100 border border-blue-200 rounded-lg text-xs text-center font-bold text-slate-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Bonus / Incentive (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={salaryFormData.bonus}
                  onChange={(e) => updateSalaryCalculation({ bonus: e.target.value })}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-emerald-700 font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Deduction (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={salaryFormData.deductions}
                  onChange={(e) => updateSalaryCalculation({ deductions: e.target.value })}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-rose-700 font-bold focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs bg-white/90 p-3 rounded-lg border border-blue-200 font-bold text-blue-950">
              <span>Calculated Net Payable Salary:</span>
              <span className="text-blue-700 text-base font-black">
                {formatCurrency(salaryFormData.netSalary || 0)}
              </span>
            </div>
          </div>

          {/* Standard Expense Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={salaryFormData.date}
                onChange={(e) => setSalaryFormData({ ...salaryFormData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Payment Mode *
              </label>
              <select
                value={salaryFormData.paymentMode}
                onChange={(e) => setSalaryFormData({ ...salaryFormData, paymentMode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI / Online</option>
                <option value="bank">🏦 Bank Transfer (NEFT/IMPS)</option>
                <option value="cheque">📜 Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Total Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={salaryFormData.amount}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, amount: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-black text-blue-900 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This amount will be directly recorded under the <b>Staff Salary</b> category in Expenses & Reports.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={salaryFormData.description}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, description: e.target.value })}
              placeholder="e.g. Paid salary for August month with overtime"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowSalaryModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<Wallet size={14} />}>
              Save & Add to Expenses
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Salary Expense Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteSalaryTarget}
        onClose={() => setDeleteSalaryTarget(null)}
        onConfirm={handleDeleteSalaryConfirm}
        title="Delete Salary Record"
        message={`Are you sure you want to delete this salary payment record of ₹${Number(deleteSalaryTarget?.amount || 0).toLocaleString('en-IN')} for "${deleteSalaryTarget?.salaryDetails?.staffName || deleteSalaryTarget?.title}"? This will also remove it from Expenses.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Aadhaar Card Photo Preview Modal */}
      <Modal
        isOpen={!!previewAadhar}
        onClose={() => setPreviewAadhar(null)}
        title="Aadhaar Card Photo"
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


