import { SHIFTS, COLLECTIONS } from './constants';
import { getActiveTenantId, fetchCollectionData } from '../firebase/storageService';
export { getActiveTenantId };

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

export const getDaysInMonth = (dateStringOrDate) => {
  if (!dateStringOrDate) return 30;
  if (typeof dateStringOrDate === 'string') {
    const parts = dateStringOrDate.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return new Date(year, month, 0).getDate();
      }
    }
  }
  const d = dateStringOrDate.toDate ? dateStringOrDate.toDate() : new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return 30;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
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

  // Helper to check if a configured addon is already included free in the membership plan perks (Strict Exact Match)
  const isCoveredByPerk = (addonName) => {
    if (!Array.isArray(includedPerks) || includedPerks.length === 0 || !addonName) return false;
    const aName = addonName.toLowerCase().trim();
    return includedPerks.some((perk) => String(perk).toLowerCase().trim() === aName);
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
  const filterNonCustom = (list) =>
    list.filter((s) => s.id !== 'custom' && s.id !== 'Custom Timing' && !s.label?.toLowerCase().startsWith('custom'));

  try {
    let tenantId = 'genius_root';
    try {
      tenantId = getActiveTenantId();
    } catch (_) {}
    const tenantKey = `studypoint_${tenantId}_shifts`;
    const localTenant = localStorage.getItem(tenantKey);
    if (localTenant) {
      const parsed = JSON.parse(localTenant);
      if (Array.isArray(parsed) && parsed.length > 0) return filterNonCustom(parsed);
    }
    const data = localStorage.getItem('studypoint_shifts');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return filterNonCustom(parsed);
    }
  } catch (e) {}
  return filterNonCustom(SHIFTS);
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

/**
 * Resolves a human-friendly user display name.
 * Falls back from user.displayName -> user.name -> saved library ownerName -> email prefix.
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'User';

  // 1. If staff user, or if displayName is a real name (not generic 'Owner' / 'Study Point Owner')
  const genericNames = ['owner', 'library owner', 'study point owner', 'staff member', 'team member'];
  if (user.displayName && !genericNames.includes(user.displayName.trim().toLowerCase())) {
    return user.displayName.trim();
  }

  // 2. If user.name is provided
  if (user.name && !genericNames.includes(user.name.trim().toLowerCase())) {
    return user.name.trim();
  }

  // 3. Try reading from saved library settings in localStorage
  try {
    let tenantId = 'genius_root';
    try {
      tenantId = getActiveTenantId();
    } catch (_) {
      tenantId = user.tenantId || 'genius_root';
    }
    const sKey = `studypoint_${tenantId}_settings`;
    let local = typeof window !== 'undefined' ? localStorage.getItem(sKey) : null;
    if (!local && typeof window !== 'undefined') {
      local = localStorage.getItem('studypoint_settings');
    }
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.ownerName && parsed.ownerName.trim() && !genericNames.includes(parsed.ownerName.trim().toLowerCase())) {
        return parsed.ownerName.trim();
      }
    }
  } catch (_) {}

  // 4. Try from email prefix (e.g. manish@... -> Manish)
  if (user.email && user.email.includes('@')) {
    const prefix = user.email.split('@')[0];
    const cleaned = prefix.replace(/[0-9]/g, '').replace(/[._-]/g, ' ').trim();
    if (cleaned) {
      return cleaned
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return user.email.split('@')[0];
  }

  return user.displayName || 'Owner';
};

// Clean and normalize 10-digit mobile number
export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

// Synchronous check against passed in-memory arrays (students, staffUsers, staffMembers)
export const checkDuplicatePhoneSync = ({
  phone,
  excludeId = null,
  scope = 'all', // 'student' | 'staff' | 'all'
  students = [],
  staffUsers = [],
  staffMembers = [],
}) => {
  const norm = normalizePhone(phone);
  if (!norm || norm.length !== 10) return null;

  // 1. Student-to-Student check (if scope is 'student' or 'all')
  if (scope === 'student' || scope === 'all') {
    if (Array.isArray(students)) {
      const matched = students.find(
        (s) => !s.isDeleted && s.id !== excludeId && normalizePhone(s.phone) === norm
      );
      if (matched) {
        return {
          exists: true,
          type: 'student',
          name: matched.name,
          phone: matched.phone,
          message: `Yeh mobile number (${norm}) pehle se student "${matched.name}" ke paas registered hai! Do students ka same number nahi ho sakta.`,
        };
      }
    }
  }

  // 2. Staff Member check (if scope is 'staff_member' or 'staff' or 'all')
  if (scope === 'staff_member' || scope === 'staff' || scope === 'all') {
    if (Array.isArray(staffMembers)) {
      const matched = staffMembers.find(
        (m) => m.id !== excludeId && m.status !== 'deleted' && normalizePhone(m.phone) === norm
      );
      if (matched) {
        return {
          exists: true,
          type: 'staff_member',
          name: matched.name,
          phone: matched.phone,
          message: `Yeh mobile number (${norm}) pehle se staff member "${matched.name}" ke paas registered hai! Do staff members ka same number nahi ho sakta.`,
        };
      }
    }
  }

  // 3. Staff User (login account) check (if scope is 'staff_user' or 'staff' or 'all')
  if (scope === 'staff_user' || scope === 'staff' || scope === 'all') {
    if (Array.isArray(staffUsers)) {
      const matched = staffUsers.find(
        (u) => u.id !== excludeId && normalizePhone(u.phone) === norm
      );
      if (matched) {
        return {
          exists: true,
          type: 'staff_user',
          name: matched.name,
          phone: matched.phone,
          message: `Yeh mobile number (${norm}) pehle se login user "${matched.name}" ke paas registered hai! Do login users ka same number nahi ho sakta.`,
        };
      }
    }
  }

  return null;
};

// Comprehensive Asynchronous check against database collections
export const checkDuplicatePhoneNumber = async ({ phone, excludeId = null, scope = 'all' }) => {
  const norm = normalizePhone(phone);
  if (!norm || norm.length !== 10) return null;

  try {
    let students = [];
    let staffUsers = [];
    let staffMembers = [];

    if (scope === 'student' || scope === 'all') {
      students = await fetchCollectionData(COLLECTIONS.STUDENTS).catch(() => []);
    }
    if (scope === 'staff_member') {
      staffMembers = await fetchCollectionData(COLLECTIONS.STAFF_MEMBERS).catch(() => []);
    } else if (scope === 'staff_user') {
      staffUsers = await fetchCollectionData(COLLECTIONS.STAFF_USERS).catch(() => []);
    } else if (scope === 'staff' || scope === 'all') {
      [staffUsers, staffMembers] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STAFF_USERS).catch(() => []),
        fetchCollectionData(COLLECTIONS.STAFF_MEMBERS).catch(() => []),
      ]);
    }

    return checkDuplicatePhoneSync({
      phone: norm,
      excludeId,
      scope,
      students: students || [],
      staffUsers: staffUsers || [],
      staffMembers: staffMembers || [],
    });
  } catch (err) {
    console.warn('Error checking duplicate phone number:', err);
    return null;
  }
};

/**
 * Extract all individual payment transactions from fee records
 * Handles full payments, partial payments, installment arrays, and split modes.
 */
export const extractAllFeePayments = (fees, students = []) => {
  const result = [];
  if (!Array.isArray(fees)) return result;

  const studentMap = {};
  if (Array.isArray(students)) {
    students.forEach((s) => {
      if (s && s.id) studentMap[s.id] = s;
    });
  }

  fees.forEach((fee) => {
    const st = studentMap[fee.studentId];
    const sName = fee.studentName || st?.name || 'Student';
    const sPhone = fee.studentPhone || st?.phone || '';
    const feeMonth =
      fee.month ||
      (fee.periodStart ? String(fee.periodStart).slice(0, 7) : '') ||
      (fee.paidDate ? String(fee.paidDate).slice(0, 7) : '') ||
      (fee.date ? String(fee.date).slice(0, 7) : '');

    // 1. If fee has an explicit payments array (installments / multiple dues / extension payments)
    if (Array.isArray(fee.payments) && fee.payments.length > 0) {
      fee.payments.forEach((p, idx) => {
        const amt = Number(p.amount) || 0;
        if (amt <= 0) return;
        const pDate = p.paidDate || fee.paidDate || fee.date || (feeMonth ? `${feeMonth}-01` : null);
        result.push({
          id: p.id || `${fee.id}_pay_${idx}`,
          feeId: fee.id,
          studentId: fee.studentId,
          studentName: sName,
          studentPhone: sPhone,
          amount: amt,
          totalFeeAmount: Number(fee.amount) || amt,
          dueAmount: Number(fee.dueAmount) || 0,
          paidDate: pDate,
          month: feeMonth,
          paymentMode: p.paymentMode || fee.paymentMode || 'cash',
          splitDetails: p.splitDetails || fee.splitDetails || null,
          notes: p.notes || fee.notes || '',
          receiptNumber: p.receiptNumber || fee.receiptNumber || '',
          planName: fee.planName || '',
          status: fee.status || 'paid',
          isPartial: fee.status === 'partial' || (Number(fee.dueAmount) > 0),
        });
      });
    } else {
      // 2. Single fee record payment (paid or partial)
      const isEligible =
        fee.status === 'paid' ||
        fee.status === 'partial' ||
        Number(fee.paidAmount) > 0 ||
        Number(fee.paidNow) > 0;
      if (!isEligible) return;

      let amt = 0;
      if (fee.paidAmount !== undefined && fee.paidAmount !== null && Number(fee.paidAmount) > 0) {
        amt = Number(fee.paidAmount);
      } else if (fee.paidNow !== undefined && fee.paidNow !== null && Number(fee.paidNow) > 0) {
        amt = Number(fee.paidNow);
      } else if (fee.status === 'paid') {
        amt = Number(fee.amount) || 0;
      } else if (fee.status === 'partial' && fee.amount !== undefined && fee.dueAmount !== undefined) {
        amt = Math.max(0, (Number(fee.amount) || 0) - (Number(fee.dueAmount) || 0));
      }

      if (amt <= 0) return;
      const pDate = fee.paidDate || fee.date || (feeMonth ? `${feeMonth}-01` : null);

      result.push({
        id: fee.id,
        feeId: fee.id,
        studentId: fee.studentId,
        studentName: sName,
        studentPhone: sPhone,
        amount: amt,
        totalFeeAmount: Number(fee.amount) || amt,
        dueAmount: Number(fee.dueAmount) || 0,
        paidDate: pDate,
        month: feeMonth,
        paymentMode: fee.paymentMode || 'cash',
        splitDetails: fee.splitDetails || null,
        notes: fee.notes || '',
        receiptNumber: fee.receiptNumber || '',
        planName: fee.planName || '',
        status: fee.status || (Number(fee.dueAmount) > 0 ? 'partial' : 'paid'),
        isPartial: fee.status === 'partial' || (Number(fee.dueAmount) > 0),
      });
    }
  });

  return result;
};

// Calculate first eligible salary date and month: exactly 1 month after join date
export const getFirstSalaryInfo = (joinDateStr) => {
  if (!joinDateStr) return { firstDate: null, firstMonth: null };
  const parts = String(joinDateStr).split('T')[0].split('-').map(Number);
  if (parts.length < 3) return { firstDate: null, firstMonth: null };
  const [y, m, d] = parts;
  if (!y || !m || !d) return { firstDate: null, firstMonth: null };

  let nextYear = y;
  let nextMonth = m + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const maxDays = new Date(nextYear, nextMonth, 0).getDate();
  const validDay = Math.min(d, maxDays);
  const firstDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
  const firstMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  return { firstDate, firstMonth };
};
