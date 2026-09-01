import { SHIFTS } from './constants';

export const formatCurrency = (amount) => {
  const safeNum = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeNum);
};

// Strict Day/Month/Year Format (DD/MM/YYYY, e.g. 30/08/2026)
export const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Day/Month/Year with month name (e.g. 30 Aug 2026)
export const formatDateText = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatDateInput = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMonthYear = (date = new Date()) => {
  const d = date.toDate ? date.toDate() : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthName = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
  return due < new Date();
};

export const daysUntil = (date) => {
  if (!date) return 0;
  const target = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const calculateTotalFee = (baseFee, addons = {}, addonPricing = []) => {
  let total = Number(baseFee) || 0;
  addonPricing.forEach((addon) => {
    if (addons[addon.name?.toLowerCase()]) {
      total += Number(addon.monthlyCharge) || 0;
    }
  });
  return total;
};

// Security: XSS & HTML Sanitizer
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

// Security: Phone Sanitizer (Keeps strictly digits)
export const sanitizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Dynamic Shifts Loader from LocalStorage / Settings
export const getStoredShifts = () => {
  try {
    const data = localStorage.getItem('studypoint_shifts');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return SHIFTS;
};

export const getShiftInfo = (shiftId) => {
  const shifts = getStoredShifts();
  const found = shifts.find((s) => s.id === shiftId);
  return found || { id: shiftId, label: 'Custom Timing', timing: 'Custom', short: 'Custom', color: 'gray' };
};

export const getShiftBadgeStyle = (shiftId) => {
  switch (shiftId) {
    case 'full_day':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'first_half':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'second_half':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'custom':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'partially_occupied':
      return 'bg-amber-100 text-amber-800';
    case 'occupied':
      return 'bg-blue-100 text-blue-800';
    case 'reserved':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};
