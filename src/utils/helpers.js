import { SHIFTS } from './constants';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateInput = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toISOString().split('T')[0];
};

export const getMonthYear = (date = new Date()) => {
  const d = date.toDate ? date.toDate() : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthName = (monthStr) => {
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
  let total = baseFee || 0;
  addonPricing.forEach((addon) => {
    if (addons[addon.name?.toLowerCase()]) {
      total += addon.monthlyCharge || 0;
    }
  });
  return total;
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getShiftInfo = (shiftId) => {
  const found = SHIFTS.find((s) => s.id === shiftId);
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
