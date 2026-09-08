export const COLLECTIONS = {
  SECTIONS: 'sections',
  SEATS: 'seats',
  STUDENTS: 'students',
  MEMBERSHIP_PLANS: 'membershipPlans',
  FEES: 'fees',
  ADDON_PRICING: 'addonPricing',
  EXPENSES: 'expenses',
  SETTINGS: 'settings',
  STAFF_USERS: 'staffUsers',
  ROLE_PRESETS: 'rolePresets',
  VISITORS: 'visitors',
  STAFF_MEMBERS: 'staffMembers',
};

export const SHIFTS = [
  {
    id: 'full_day',
    label: 'Full Day (पूरा दिन)',
    timing: '6:00 AM - 11:00 PM (Full Day)',
    short: 'Full Day',
    color: 'indigo',
  },
  {
    id: 'first_half',
    label: '1st Half / Morning (सुबह)',
    timing: '6:00 AM - 2:00 PM',
    short: '6 AM - 2 PM',
    color: 'amber',
  },
  {
    id: 'second_half',
    label: '2nd Half / Evening (शाम)',
    timing: '2:00 PM - 11:00 PM',
    short: '2 PM - 11 PM',
    color: 'purple',
  },
  {
    id: 'custom',
    label: 'Custom Timing (कस्टम टाइम)',
    timing: 'Custom Timing',
    short: 'Custom',
    color: 'teal',
  },
];

export const SEAT_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  PARTIALLY_OCCUPIED: 'partially_occupied',
  RESERVED: 'reserved',
};

export const FEE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
};

export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const PAYMENT_MODES = [
  { id: 'cash', label: '💵 Cash (नकद)' },
  { id: 'upi', label: '📱 UPI / QR (GPay/PhonePe)' },
  { id: 'bank', label: '🏦 Bank Transfer / Net Banking' },
  { id: 'card', label: '💳 Card' },
  { id: 'other', label: '📝 Other' },
];

export const DEFAULT_ADDONS = [
  { name: 'Locker', monthlyCharge: 200, isActive: true },
  { name: 'WiFi', monthlyCharge: 100, isActive: true },
  { name: 'Desk Light', monthlyCharge: 150, isActive: true },
];

export const EXPENSE_CATEGORIES = [
  'Electricity',
  'Rent',
  'Maintenance / Repairs',
  'Internet/WiFi',
  'Water & RO Dispenser',
  'Cleaning & Sanitization',
  'Stationery & Printing',
  'AC Service & Cooling',
  'Generator / Power Backup',
  'Furniture & Fixtures',
  'Other Additional',
];

export const EXPENSE_TYPES = [
  { id: 'variable', label: 'Variable / Bill Based (Electricity / Utility)', icon: 'Zap' },
  { id: 'salary', label: 'Staff Salary (Staff-wise Monthly Calculation)', icon: 'Users' },
  { id: 'fixed', label: 'Fixed Monthly (Rent / WiFi / Regular)', icon: 'Calendar' },
  { id: 'additional', label: 'Occasional / One-Time Additional (Repairs / Hardware)', icon: 'Wrench' },
];

export const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Dashboard', actions: ['view'] },
  { id: 'sections', label: 'Sections & Seats', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'visitors', label: 'Visit & Demo', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'students', label: 'Students', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'fees', label: 'Fees & Receipts', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'reports', label: 'Daily & Monthly Reports', actions: ['view'] },
  { id: 'memberships', label: 'Membership Plans & Offers', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'offers', label: 'Offer & Broadcast', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'expenses', label: 'Expenses & Financials', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'settings', label: 'Library Settings', actions: ['view', 'edit'] },
  { id: 'staff', label: 'Staff & Role Management', actions: ['view', 'create', 'edit', 'delete'] },
];

export const ROLE_PRESETS = {
  owner: {
    label: '👑 Owner (Super Admin)',
    description: 'Full unrestricted access to all modules, financial reports, expenses, settings & staff control.',
    permissions: {
      dashboard: { view: true },
      sections: { view: true, create: true, edit: true, delete: true },
      visitors: { view: true, create: true, edit: true, delete: true },
      students: { view: true, create: true, edit: true, delete: true },
      fees: { view: true, create: true, edit: true, delete: true },
      reports: { view: true },
      memberships: { view: true, create: true, edit: true, delete: true },
      expenses: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, edit: true },
      staff: { view: true, create: true, edit: true, delete: true },
    },
  },
  receptionist: {
    label: '🛎️ Receptionist / Front Desk',
    description: 'Can manage seats, register students, collect fees & print receipts. Financials/expenses & settings hidden.',
    permissions: {
      dashboard: { view: true },
      sections: { view: true, create: false, edit: true, delete: false },
      visitors: { view: true, create: true, edit: true, delete: false },
      students: { view: true, create: true, edit: true, delete: false },
      fees: { view: true, create: true, edit: true, delete: false },
      reports: { view: false },
      memberships: { view: true, create: false, edit: false, delete: false },
      expenses: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, edit: false },
      staff: { view: false, create: false, edit: false, delete: false },
    },
  },
  manager: {
    label: '👔 Branch Manager',
    description: 'Can manage students, seats, fee records, view operational reports and record utility expenses.',
    permissions: {
      dashboard: { view: true },
      sections: { view: true, create: true, edit: true, delete: false },
      visitors: { view: true, create: true, edit: true, delete: false },
      students: { view: true, create: true, edit: true, delete: false },
      fees: { view: true, create: true, edit: true, delete: false },
      reports: { view: true },
      memberships: { view: true, create: true, edit: true, delete: false },
      expenses: { view: true, create: true, edit: false, delete: false },
      settings: { view: false, edit: false },
      staff: { view: false, create: false, edit: false, delete: false },
    },
  },
  custom: {
    label: '⚙️ Custom Role',
    description: 'Custom permission matrix manually configured by the owner.',
    permissions: {},
  },
};

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', module: 'dashboard' },
  { path: '/sections', label: 'Sections', icon: 'Building2', module: 'sections' },
  { path: '/visitors', label: 'Visit & Demo', icon: 'UserCheck', module: 'visitors' },
  { path: '/students', label: 'Students', icon: 'Users', module: 'students' },
  { path: '/fees', label: 'Fees', icon: 'IndianRupee', module: 'fees' },
  { path: '/reports', label: 'Reports', icon: 'BarChart3', module: 'reports' },
  { path: '/memberships', label: 'Memberships', icon: 'CreditCard', module: 'memberships' },
  { path: '/expenses', label: 'Expenses', icon: 'Receipt', module: 'expenses' },
  { path: '/staff', label: 'Staff & Roles', icon: 'ShieldCheck', module: 'staff' },
  { path: '/settings', label: 'Settings', icon: 'Settings', module: 'settings' },
];
