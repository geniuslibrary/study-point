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
  quickActions: true,
  todayPulse: true,
  coreStats: true,
  revenueChart: true,
  pendingDuesAlert: true,
  demoTracker: true,
  occupancyOverview: true,
  shiftDistribution: true,
  recentActivity: true,
};

export const DEFAULT_STAFF_DASHBOARD_CONFIG = {
  hideFinancialsFromStaff: true, // Hides Revenue chart, total revenue stat, and profit/loss
  allowStaffDemoTracker: true,
  allowStaffSeatOccupancy: true,
  allowStaffPendingDues: true,
  allowStaffShiftDistribution: true,
  allowStaffRecentActivity: false, // Hides financial transaction streams
};

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
