import { SHIFTS } from './constants';
import { getActiveTenantId } from '../firebase/storageService';

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

export const formatMonthDisplay = (yyyy_mm) => {
  if (!yyyy_mm) return '';
  if (typeof yyy_mm !== 'string') return String(yyyy_mm);
  if (!yyyy_mm.includes('-')) return yyy_mm;
  const [year, month] = yyy_mm.split('-');
  return `${month}/${year}`;
};

export const getMonthName = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export const isOverdue = (dueDate, graceDays = 2) => {
  if (!dueDate) return false;
  const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const threshold = new Date(due);
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() + graceDays);
  return threshold < now;
};

export const daysUntil = (date) => {
  if (!date) return 0;
  const target = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getStoredAddons = () => {
  try {
    let tenantId = 'genius_root';
    try {
      tenantId = getActiveTenantId();
    } catch (_) {}
    const tenantKey = `studypoint_${tenantId}_addons`;
    const localTenant = localStorage.getItem(tenantKey);
    if (localTenant) {
      const parsed = JSON.parse(localTenant);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const data = localStorage.getItem('studypoint_addons');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

export const calculateSeatAddonCharges = (
  seatAddons = {},
  addonList = [],
  durationMonths = 1,
  includedPerks = []
) => {
  const charges = {};
  const includedCharges = {};
  let total = 0;
  if (!seatAddons || typeof seatAddons !== 'object') return { charges, total, includedCharges };

  const duration = Number(durationMonths) || 1;
  const list = Array.isArray(addonList) && addonList.length > 0 ? addonList : getStoredAddons();

  // Helper to check if a configured addon is already included free in the membership plan perks
  const isCoveredByPerk = (addonName) => {
    if (!Array.isArray(includedPerks) || includedPerks.length === 0 || !addonName) return false;
    const aName = addonName.toLowerCase();
    return includedPerks.some((perk) => {
      const p = String(perk).toLowerCase();
      return (
        p.includes(aName) ||
        aName.includes(p) ||
        (aName.includes('wifi') && p.includes('wifi')) ||
        (aName.includes('locker') && p.includes('locker')) ||
        ((aName.includes('light') || aName.includes('lamp')) && (p.includes('light') || p.includes('lamp'))) ||
        ((aName.includes('ac') || aName.includes('cooler')) && (p.includes('ac') || p.includes('air conditioned')))
      );
    });
  };

  list.forEach((addon) => {
    const nameLower = addon.name?.toLowerCase();
    const isChecked = Boolean(
      seatAddons[addon.id] ||
      (nameLower && seatAddons[nameLower]) ||
      (addon.name && seatAddons[addon.name])
    );
    if (isChecked) {
      if (isCoveredByPerk(addon.name)) {
        // Free because it's included in the Membership Plan!
        charges[addon.name] = 0;
        includedCharges[addon.name] = true;
      } else {
        const monthly = Number(addon.monthlyCharge) || 0;
        const totalCharge = monthly * duration;
        charges[addon.name] = totalCharge;
        total += totalCharge;
      }
    }
  });

  return { charges, total, includedCharges };
};

export const calculateTotalFee = (baseFee, addons = {}, addonPricing = [], includedPerks = []) => {
  let total = Number(baseFee) || 0;
  const { total: addonTotal } = calculateSeatAddonCharges(addons, addonPricing, 1, includedPerks);
  return total + addonTotal;
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
    let tenantId = 'genius_root';
    try {
      tenantId = getActiveTenantId();
    } catch (_) {}
    const tenantKey = `studypoint_${tenantId}_shifts`;
    const localTenant = localStorage.getItem(tenantKey);
    if (localTenant) {
      const parsed = JSON.parse(localTenant);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
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
  return (
    found || {
      id: shiftId,
      label: shiftId || 'Custom Timing',
      timing: 'Custom',
      short: 'Custom',
      color: 'gray',
    }
  );
};

export const getShiftBadgeStyle = (shiftId) => {
  switch (shiftId) {
    case 'full_day':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'first_half':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'second_half':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'night_shift':
    case 'night':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'custom':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
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

export const formatReminderTime = (timestamp) => {
  if (!timestamp) return null;
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  if (isToday) {
    return { text: `Sent Today at ${timeStr}`, isToday: true, date: d };
  } else if (isYesterday) {
    return { text: `Sent Yesterday at ${timeStr}`, isToday: false, date: d };
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]}`;
    return { text: `Sent on ${dateStr} (${timeStr})`, isToday: false, date: d };
  }
};

/**
 * High-fidelity, lightweight image compressor
 * - Crops center-square for ID / passport photo
 * - Smooth bicubic resampling at high quality
 * - Uses URL.createObjectURL for instant decoding with minimal RAM
 * - Returns a crisp JPEG data URL (~35-55 KB)
 */
export const compressImageFile = (fileOrBlob, targetDim = 480, quality = 0.86) => {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob) {
      reject(new Error('No image provided'));
      return;
    }

    let objectUrl = null;
    try {
      objectUrl = URL.createObjectURL(fileOrBlob);
    } catch (e) {
      objectUrl = null;
    }

    const processImg = (img) => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const minDim = Math.min(width, height);
        const startX = Math.round((width - minDim) / 2);
        const startY = Math.round((height - minDim) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetDim, targetDim);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (_) {}
        }
      }
    };

    if (objectUrl) {
      const img = new Image();
      img.onload = () => processImg(img);
      img.onerror = () => {
        if (objectUrl) try { URL.revokeObjectURL(objectUrl); } catch (_) {}
        fallbackFileReader();
      };
      img.src = objectUrl;
    } else {
      fallbackFileReader();
    }

    function fallbackFileReader() {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImg(img);
        img.onerror = (err) => reject(new Error('Failed to load image.'));
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBlob);
    }
  });
};

/**
 * Calculate membership end date based on days or months
 */
export const calculateMembershipEndDate = (startDateInput, plan, customDays = null) => {
  const start = startDateInput instanceof Date ? new Date(startDateInput) : new Date(startDateInput);
  if (isNaN(start.getTime())) return new Date();

  // 1. If explicit custom days provided
  if (customDays !== null && customDays !== undefined && Number(customDays) > 0) {
    const end = new Date(start);
    end.setDate(end.getDate() + Number(customDays));
    return end;
  }

  // 2. If plan is Day-based
  if (plan?.durationUnit === 'days' || (plan?.durationDays && Number(plan.durationDays) > 0)) {
    const days = Number(plan.durationDays) || 7;
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return end;
  }

  // 3. Month-based plan (standard)
  const durationMonths = Number(plan?.durationMonths) || 1;
  const end = new Date(start.getFullYear(), start.getMonth() + durationMonths, start.getDate());
  return end;
};

/**
 * Calculate remaining days or overdue days for a membership
 */
export const getMembershipRemainingDays = (membershipEnd) => {
  if (!membershipEnd) return { diffDays: 0, isExpired: false, isEndingToday: false, label: '—' };
  const end = membershipEnd.toDate ? membershipEnd.toDate() : new Date(membershipEnd);
  if (isNaN(end.getTime())) return { diffDays: 0, isExpired: false, isEndingToday: false, label: '—' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(end);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -2) {
    return {
      diffDays,
      isExpired: true,
      isOverdue: true,
      isEndingToday: false,
      label: `🔴 Overdue (${Math.abs(diffDays)}d ago)`,
      shortLabel: `${Math.abs(diffDays)}d Overdue`,
      color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    };
  } else if (diffDays < 0) {
    return {
      diffDays,
      isExpired: true,
      isGrace: true,
      isEndingToday: false,
      label: `🟡 Expired (${Math.abs(diffDays)}d Grace)`,
      shortLabel: `${Math.abs(diffDays)}d Grace`,
      color: 'bg-amber-50 text-amber-900 border-amber-200 font-bold',
    };
  } else if (diffDays === 0) {
    return {
      diffDays: 0,
      isExpired: false,
      isEndingToday: true,
      label: '⚠️ Ending Today (आज समाप्त)',
      shortLabel: 'Today',
      color: 'bg-amber-50 text-amber-900 border-amber-200 font-bold',
    };
  } else if (diffDays <= 3) {
    return {
      diffDays,
      isExpired: false,
      isEndingToday: false,
      isEndingSoon: true,
      label: `⏳ In ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      shortLabel: `${diffDays}d left`,
      color: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    };
  } else {
    return {
      diffDays,
      isExpired: false,
      isEndingToday: false,
      label: `Active (${diffDays} days left)`,
      shortLabel: `${diffDays}d left`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    };
  }
};

/**
 * Note: Seats are NEVER automatically released.
 * Seats are freed ONLY manually when the Admin clicks "Left" or changes status to 'left'.
 */
export const checkAndAutoReleaseExpiredMemberships = async () => {
  return [];
};


