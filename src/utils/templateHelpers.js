// Default WhatsApp Templates & Replacer Utilities

export const DEFAULT_WHATSAPP_TEMPLATES = {
  expiryReminder: {
    title: 'Subscription Expiry Alert (सब्सक्रिप्शन समाप्ति रिमाइंडर)',
    description: 'Sent to regular students when their monthly membership is expiring or expired.',
    template:
      'नमस्ते {student_name} जी,\n{library_name} की तरफ से यह रिमाइंडर है कि आपकी Seat #{seat_number} ({shift}) का Subscription {status_phrase}।\nकृपया अपनी सीट जारी रखने के लिए समय पर फीस जमा करें। धन्यवाद! 🙏',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'status_phrase', 'expiry_date'],
  },
  feeDueReminder: {
    title: 'Pending Monthly Fee Reminder (मासिक फीस बकाया रिमाइंडर)',
    description: 'Sent to students having fee pending for the current running month.',
    template:
      'नमस्ते {student_name} जी,\n{library_name} में आपके चालू माह ({month}) की फीस ₹{amount} बकाया है। कृपया समय पर फीस जमा करवाएं ताकि आपकी सीट सुरक्षित रहे। धन्यवाद! 🙏',
    availableTags: ['student_name', 'library_name', 'month', 'amount', 'seat_number', 'phone'],
  },
  demoEndingToday: {
    title: 'Demo Trial Ending Today (डेमो का आखिरी दिन फॉलो-अप)',
    description: 'Sent on the final day of a student’s free trial demo.',
    template:
      'नमस्ते {student_name} जी 🙏\n\n{library_name} में आज आपके Free Demo Trial का आखिरी दिन है।\n\nआशा है आपको हमारी लाइब्रेरी का माहौल, शांत वातावरण और AC सीट पसंद आई होगी। अपनी सीट नियमित रूप से कन्फर्म करवाने के लिए संपर्क करें।\n\nधन्यवाद! ✨\n{library_name}',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'phone'],
  },
  demoExpired: {
    title: 'Demo Trial Expired Offer (डेमो समाप्त होने पर ऑफर)',
    description: 'Sent after the demo trial period has passed to encourage admission.',
    template:
      'नमस्ते {student_name} जी 🙏\n\n{library_name} में आपका Free Demo Trial समाप्त हो चुका है।\n\nयदि आप अपनी सीट जारी रखना चाहते हैं तो कृपया जल्द संपर्क करें क्योंकि सीटें सीमित हैं।\n\nधन्यवाद! ✨\n{library_name}',
    availableTags: ['student_name', 'library_name', 'phone'],
  },
  visitorWelcome: {
    title: 'Visitor / Inquiry Welcome Note (विजिटर स्वागत नोट)',
    description: 'Sent to general visitors who came to inquire about the library.',
    template:
      'नमस्ते {student_name} जी 🙏\n\n{library_name} विजिट करने के लिए धन्यवाद! हमारी लाइब्रेरी में शांत वातावरण, आरामदायक सीट्स, पर्सनल लॉकर्स और हाई-स्पीड WiFi उपलब्ध है।\n\nएडमिशन या किसी भी जानकारी के लिए हमसे संपर्क करें।\n\nधन्यवाद! ✨\n{library_name}',
    availableTags: ['student_name', 'library_name', 'phone'],
  },
  feeReceipt: {
    title: 'Payment Confirmation Receipt (फीस रसीद पुष्टि)',
    description: 'Sent automatically after collecting fee along with receipt link.',
    template:
      '🎉 *FEE PAYMENT RECEIPT - {library_name}*\n\nHello *{student_name}*,\nYour official fee payment of *₹{amount}* has been confirmed!\n\n🧾 *Receipt No:* {receipt_no}\n📦 *Plan:* {plan_name}\n📅 *Validity:* {validity_period}\n💺 *Seat Allocated:* Seat #{seat_number} ({shift})\n💳 *Payment Mode:* {payment_mode}\n✅ *Status:* PAID & VERIFIED\n\nThank you! ✨',
    availableTags: ['student_name', 'library_name', 'amount', 'receipt_no', 'plan_name', 'validity_period', 'seat_number', 'shift', 'payment_mode'],
  },
};

export const DEFAULT_DASHBOARD_CONFIG = {
  // Group 1: Core Operations & Live Pulse
  quickActions: true,
  todayPulse: true,
  coreStats: true,
  revenueChart: true,
  pendingDuesAlert: true,
  demoTracker: true,
  occupancyOverview: true,
  shiftDistribution: true,
  recentActivity: true,

  // Group 2: Smart Financials & Audits
  cashRegister: true,
  paymentModesPie: true,
  monthlyTarget: true,
  expenseCategories: true,
  feeCalculator: true,

  // Group 3: Students, Retention & Leads
  expiringMemberships: true,
  newInquiries: true,
  admissionsVsExits: true,
  topMembers: true,
  leftStudentsAudit: true,

  // Group 4: Facilities, Automation & Team
  addonUtilization: true,
  quickSeatSearch: true,
  remindersCounter: true,
  noticeBoard: true,
  staffActivity: true,
};

export const DEFAULT_STAFF_DASHBOARD_WIDGETS = {
  quickActions: true,
  todayPulse: true,
  coreStats: true,
  revenueChart: false,
  pendingDuesAlert: true,
  demoTracker: true,
  occupancyOverview: true,
  shiftDistribution: true,
  recentActivity: false,
  
  cashRegister: false,
  paymentModesPie: false,
  monthlyTarget: false,
  expenseCategories: false,
  feeCalculator: true,

  expiringMemberships: true,
  newInquiries: true,
  admissionsVsExits: true,
  topMembers: false,
  leftStudentsAudit: false,

  addonUtilization: true,
  quickSeatSearch: true,
  remindersCounter: true,
  noticeBoard: true,
  staffActivity: true,

  hideFinancials: true,
};

export const DASHBOARD_WIDGET_OPTIONS = [
  // 1. Core Operations
  { id: 'quickActions', label: '⚡ Quick Shortcuts Strip (शॉर्टकट स्ट्रिप)', category: 'operations', desc: 'Top shortcut buttons for common daily tasks' },
  { id: 'todayPulse', label: '🔴 Today Pulse - Aaj Ka Hisaab (आज का हिसाब)', category: 'operations', desc: 'Realtime daily counters of fee, admissions, and expenses' },
  { id: 'coreStats', label: '📈 Core Monthly Stat Cards (मासिक आंकड़े)', category: 'operations', desc: 'Active students, occupancy, monthly revenue, pending dues' },
  { id: 'occupancyOverview', label: '🪑 Hall & Section Occupancy (हॉल सीट ऑक्यूपेंसी)', category: 'operations', desc: 'Live seat matrix and progress percentage per section' },
  { id: 'shiftDistribution', label: '⏰ Shift Wise Distribution (शिफ्ट विभाजन)', category: 'operations', desc: 'Student enrollment by Morning, Evening, and Full Day slots' },
  { id: 'quickSeatSearch', label: '🔍 Instant Seat Finder (त्वरित सीट खोजक)', category: 'operations', desc: 'Quickly check if a seat is vacant or assigned to whom' },

  // 2. Financials & Money
  { id: 'revenueChart', label: '📊 Revenue vs Expense Trend (कमाई व खर्च ग्राफ)', category: 'financials', desc: '6-Month comparison between income and expenses' },
  { id: 'cashRegister', label: '💵 Counter Cash Register (काउंटर कैश इन हैंड)', category: 'financials', desc: 'Today cash fees minus cash expenses in counter drawer' },
  { id: 'paymentModesPie', label: '📱 Payment Mode Breakdown (पेमेंट माध्यम UPI/Cash/Bank)', category: 'financials', desc: 'Percentage & volume of UPI, Cash and Bank collections' },
  { id: 'monthlyTarget', label: '🎯 Monthly Revenue Target (मासिक कमाई लक्ष्य)', category: 'financials', desc: 'Target collection progress bar and remaining amount' },
  { id: 'expenseCategories', label: '🧾 Expense Categories Breakdown (खर्च श्रेणीवार)', category: 'financials', desc: 'Rent, electricity, wifi, salary and maintenance costs' },
  { id: 'recentActivity', label: '📜 Recent Fee Collections Log (हालिया फीस लिस्ट)', category: 'financials', desc: 'Real-time payment audit stream of latest receipts' },
  { id: 'feeCalculator', label: '🧮 Quick Fee & Discount Calculator (त्वरित फीस कैलकुलेटर)', category: 'financials', desc: 'Instant pricing quoting with plan, addons and discount' },

  // 3. Students, Leads & Recoveries
  { id: 'pendingDuesAlert', label: '🚨 Urgent Fee Follow-Ups (बकाया फीस अलर्ट)', category: 'students', desc: 'Unpaid dues list with 1-click WhatsApp payment reminders' },
  { id: 'expiringMemberships', label: '⏳ Expiring in Next 7 Days (आगामी समाप्ति अलर्ट)', category: 'students', desc: 'Students whose memberships expire this week with WhatsApp reminder' },
  { id: 'demoTracker', label: '🎯 Live Demo & Trial Tracker (डेमो ट्रैकर)', category: 'students', desc: 'Prospective students currently on trial seats' },
  { id: 'newInquiries', label: '📋 New Inquiries & Leads (नई पूछताछ पाइपलाइन)', category: 'students', desc: 'Visitors who inquired but haven’t taken demo or admission' },
  { id: 'admissionsVsExits', label: '🌱 Monthly Net Growth (विद्यार्थी वृद्धि दर)', category: 'students', desc: 'New admissions vs departed members comparison' },
  { id: 'topMembers', label: '⭐ Long-Term Members (दीर्घकालिक सदस्य)', category: 'students', desc: 'Students enrolled in 3M, 6M, or 1Yr multi-month plans' },
  { id: 'leftStudentsAudit', label: '🚪 Recently Departed Students (छोड़ चुके विद्यार्थी)', category: 'students', desc: 'Log of recently inactive/left students with exit dates' },

  // 4. Facilities, Reminders & Team
  { id: 'addonUtilization', label: '🔐 Lockers & Facilities (लॉकर व सुविधाएं)', category: 'facilities', desc: 'Assigned vs available lockers and addon revenue' },
  { id: 'remindersCounter', label: '💬 WhatsApp Reminders Today (आज भेजे गए रिमाइंडर)', category: 'facilities', desc: 'Total automated WhatsApp reminders dispatched today' },
  { id: 'noticeBoard', label: '📌 Digital Notice Board (लाइब्रेरी नोटिस बोर्ड)', category: 'facilities', desc: 'Daily announcement and broadcast notes for staff/students' },
  { id: 'staffActivity', label: '👥 Staff On-Duty Overview (स्टाफ टीम स्थिति)', category: 'facilities', desc: 'Active team members, roles, contacts, and quick permissions' },

  // Privacy Protection
  { id: 'hideFinancials', label: '🔒 Hide All Financial Numbers (कमाई/रुपये छिपाएं)', category: 'security', desc: 'Hides all revenue, collections, and expense amounts from staff' },
];

export const DEFAULT_STAFF_DASHBOARD_CONFIG = DEFAULT_STAFF_DASHBOARD_WIDGETS;

export const WHATSAPP_TEMPLATES_STORAGE_KEY = 'studypoint_whatsapp_templates';
export const DASHBOARD_CONFIG_STORAGE_KEY = 'studypoint_dashboard_config';
export const STAFF_DASHBOARD_CONFIG_STORAGE_KEY = 'studypoint_staff_dashboard_config';

// Replace placeholders in template
export const renderTemplate = (templateString, data = {}) => {
  if (!templateString) return '';
  let result = templateString;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, data[key] !== undefined && data[key] !== null ? String(data[key]) : '');
  });
  return result;
};

// Retrieve saved templates or fallback to defaults
export const getActiveTemplates = () => {
  try {
    const local = localStorage.getItem(WHATSAPP_TEMPLATES_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return { ...DEFAULT_WHATSAPP_TEMPLATES, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_WHATSAPP_TEMPLATES;
};

// Retrieve saved dashboard config or fallback to defaults
export const getActiveDashboardConfig = () => {
  try {
    const local = localStorage.getItem(DASHBOARD_CONFIG_STORAGE_KEY);
    if (local) {
      return { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(local) };
    }
  } catch (e) {}
  return DEFAULT_DASHBOARD_CONFIG;
};

// Retrieve saved staff dashboard config
export const getActiveStaffDashboardConfig = () => {
  try {
    const local = localStorage.getItem(STAFF_DASHBOARD_CONFIG_STORAGE_KEY);
    if (local) {
      return { ...DEFAULT_STAFF_DASHBOARD_CONFIG, ...JSON.parse(local) };
    }
  } catch (e) {}
  return DEFAULT_STAFF_DASHBOARD_CONFIG;
};
