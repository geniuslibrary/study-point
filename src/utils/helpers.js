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

export const getStoredAddons = () => {
  try {
    const data = localStorage.getItem('studypoint_addons');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

export const calculateSeatAddonCharges = (seatAddons = {}, addonList = [], durationMonths = 1) => {
  const charges = {};
  let total = 0;
  if (!seatAddons || typeof seatAddons !== 'object') return { charges, total };

  const duration = Number(durationMonths) || 1;
  const list = Array.isArray(addonList) && addonList.length > 0 ? addonList : getStoredAddons();

  list.forEach((addon) => {
    const nameLower = addon.name?.toLowerCase();
    const isChecked = Boolean(
      seatAddons[addon.id] ||
      (nameLower && seatAddons[nameLower]) ||
      (addon.name && seatAddons[addon.name])
    );
    if (isChecked) {
      const monthly = Number(addon.monthlyCharge) || 0;
      const totalCharge = monthly * duration;
      charges[addon.name] = totalCharge;
      total += totalCharge;
    }
  });

  return { charges, total };
};

export const calculateTotalFee = (baseFee, addons = {}, addonPricing = []) => {
  let total = Number(baseFee) || 0;
  const { total: addonTotal } = calculateSeatAddonCharges(addons, addonPricing, 1);
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

  if (diffDays < 0) {
    return {
      diffDays,
      isExpired: true,
      isEndingToday: false,
      label: `🔴 Expired (${Math.abs(diffDays)}d ago)`,
      shortLabel: `${Math.abs(diffDays)}d ago`,
      color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    };
  } else if (diffDays === 0) {
    return {
      diffDays: 0,
      isExpired: false,
      isEndingToday: true,
      label: '⚠️ Ending Today (आज समाप्त)',
      shortLabel: 'Today',
      color: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    };
  } else if (diffDays <= 3) {
    return {
      diffDays,
      isExpired: false,
      isEndingToday: false,
      label: `⏳ In ${diffDays} days`,
      shortLabel: `${diffDays}d left`,
      color: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
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
 * Automatically inspect active students and free seats whose validity expired without extension
 */
export const checkAndAutoReleaseExpiredMemberships = async ({
  students = [],
  seats = [],
  updateDocument,
  COLLECTIONS,
  SEAT_STATUS,
}) => {
  if (!updateDocument || !COLLECTIONS || !SEAT_STATUS) return [];

  const releasedItems = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find active students with assigned seats whose membershipEnd is in the past (< today)
  const expiredActiveStudents = students.filter((s) => {
    if (s.status !== 'active' || !s.seatId || !s.membershipEnd) return false;
    const end = s.membershipEnd.toDate ? s.membershipEnd.toDate() : new Date(s.membershipEnd);
    if (isNaN(end.getTime())) return false;
    end.setHours(0, 0, 0, 0);
    return end.getTime() < today.getTime(); // Strictly expired before today
  });

  for (const student of expiredActiveStudents) {
    const seatId = student.seatId;
    const assignedSeat = seats.find((seat) => seat.id === seatId);

    // 1. Unlink seat and mark student as expired
    try {
      await updateDocument(COLLECTIONS.STUDENTS, student.id, {
        status: 'expired',
        seatId: '',
        seatReleasedAt: new Date().toISOString(),
        autoReleasedReason: 'Membership validity expired without extension',
      });

      // 2. Re-evaluate seat occupancy
      const remainingActiveStudents = students.filter(
        (s) => s.seatId === seatId && s.status === 'active' && s.id !== student.id
      );

      let newSeatStatus = SEAT_STATUS.AVAILABLE;
      if (remainingActiveStudents.length > 0) {
        const hasFullDay = remainingActiveStudents.some((s) => !s.shift || s.shift === 'full_day');
        const hasFirstHalf = remainingActiveStudents.some((s) => s.shift === 'first_half');
        const hasSecondHalf = remainingActiveStudents.some((s) => s.shift === 'second_half');

        if (hasFullDay || (hasFirstHalf && hasSecondHalf) || remainingActiveStudents.length >= 2) {
          newSeatStatus = SEAT_STATUS.OCCUPIED;
        } else {
          newSeatStatus = SEAT_STATUS.PARTIALLY_OCCUPIED;
        }
      }

      await updateDocument(COLLECTIONS.SEATS, seatId, {
        status: newSeatStatus,
        studentId: remainingActiveStudents[0] ? remainingActiveStudents[0].id : null,
      });

      releasedItems.push({
        studentId: student.id,
        studentName: student.name,
        seatNumber: assignedSeat?.seatNumber || '—',
        seatId,
        expiredDate: student.membershipEnd,
      });
    } catch (err) {
      console.error('Error auto-releasing expired seat for student:', student.name, err);
    }
  }

  return releasedItems;
};


