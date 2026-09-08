import { getActiveTenantId } from '../firebase/storageService';

// Default WhatsApp Templates & Replacer Utilities

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates (सभी)', icon: 'Layers' },
  { id: 'fees', label: 'Fees & Expiry (फीस व समाप्ति)', icon: 'IndianRupee' },
  { id: 'admissions', label: 'Admissions & Extension (एडमिशन व दिन बढ़ाना)', icon: 'UserCheck' },
  { id: 'leads', label: 'Demo & Leads (डेमो व पूछताछ)', icon: 'Sparkles' },
  { id: 'notices', label: 'Notices & Support (सूचना व उपस्थिति)', icon: 'Bell' },
  { id: 'custom', label: 'Custom (कस्टम टेम्पलेट्स)', icon: 'Sliders' },
];

export const TAG_METADATA = {
  student_name: { label: 'छात्र का नाम', example: 'Rahul Sharma' },
  library_name: { label: 'लाइब्रेरी का नाम', example: 'Study Point Library' },
  seat_number: { label: 'सीट नंबर', example: '14' },
  shift: { label: 'शिफ्ट', example: 'Full Day' },
  status_phrase: { label: 'स्टेटस वाक्य', example: 'समाप्त होने वाला है' },
  expiry_date: { label: 'एक्सपायरी डेट', example: '18/09/2026' },
  month: { label: 'महीना', example: 'September 2026' },
  amount: { label: 'फीस राशि (₹)', example: '800' },
  receipt_no: { label: 'रसीद संख्या', example: 'REC-982143' },
  plan_name: { label: 'प्लान का नाम', example: 'Monthly Standard' },
  validity_period: { label: 'वैलिडिटी अवधि', example: '01/09/2026 to 01/10/2026' },
  payment_mode: { label: 'पेमेंट मोड', example: 'UPI' },
  extra_days: { label: 'बढ़ाए गए दिन', example: '10' },
  new_expiry_date: { label: 'नई अंतिम तिथि', example: '28/09/2026' },
  fee_amount: { label: 'अतिरिक्त फीस', example: '400' },
  notice_message: { label: 'सूचना का विवरण', example: 'कल लाइब्रेरी सुबह 8 बजे से दोपहर 2 बजे तक खुलेगी।' },
  phone: { label: 'मोबाइल नंबर', example: '9876543210' },
};

export const DEFAULT_WHATSAPP_TEMPLATES = {
  endingSoonReminder: {
    title: 'Membership Ending Soon (समाप्ति पूर्व सूचना - 0-3 दिन शेष)',
    category: 'fees',
    badge: '⏳ Ending Soon',
    description: 'Sent 0 to 3 days before membership expiry to prompt timely renewal.',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* की तरफ से यह सूचना है कि आपकी *Seat #{seat_number} ({shift})* की सदस्यता *{status_phrase}*।\n\n📅 *समाप्ति तिथि (Expiry Date):* {expiry_date}\n\nकृपया अपनी सीट सुरक्षित रखने के लिए समय पर रिन्यू करवाएं ताकि आपकी पढ़ाई में कोई रुकावट न आए। धन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'status_phrase', 'expiry_date', 'days_left', 'phone'],
  },

  expiredReminder: {
    title: 'Membership Expired / Grace Period (सदस्यता समाप्त - 1-2 दिन रिमाइंडर)',
    category: 'fees',
    badge: '⚠️ Expired',
    description: 'Sent when membership expired 1-2 days ago (during the 2-day grace period).',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* में आपकी *Seat #{seat_number} ({shift})* की सदस्यता *{expiry_date}* को समाप्त हो चुकी है।\n\nकृपया अपनी पसंदीदा सीट सुरक्षित रखने के लिए आज ही रिन्यूअल करवाएं। 2 दिन बाद सीट किसी अन्य छात्र को आवंटित हो सकती है।\n\nधन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'expiry_date', 'phone'],
  },

  overdueReminder: {
    title: 'Critical Overdue Alert (अति-बकाया अंतिम नोटिस - 2+ दिन)',
    category: 'fees',
    badge: '🚨 Overdue',
    description: 'Sent when membership has been expired for more than 2 days.',
    template:
      '⚠️ *FINAL NOTICE - {library_name}*\n\nनमस्ते *{student_name}* जी,\nआपकी *Seat #{seat_number} ({shift})* की सदस्यता समाप्त हुए 2 दिन से अधिक हो चुके हैं।\n\nकृपया अपनी सीट खाली होने (Release) से बचाने के लिए तुरंत रिन्यूअल करवाएं अथवा रिसेप्शन पर संपर्क करें।\n\nधन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'expiry_date', 'phone'],
  },

  expiryReminder: {
    title: 'Subscription Expiry Alert (सब्सक्रिप्शन समाप्ति रिमाइंडर)',
    category: 'fees',
    badge: '⏳ Expiry',
    description: 'General expiry alert for students when their membership is expiring.',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* की तरफ से यह रिमाइंडर है कि आपकी *Seat #{seat_number} ({shift})* की वैलिडिटी *{status_phrase}*।\n\n📅 *समाप्ति तिथि (Expiry Date):* {expiry_date}\n\nकृपया अपनी सीट सुरक्षित रखने के लिए समय पर रिन्यूअल करवाएं। धन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'status_phrase', 'expiry_date', 'phone'],
  },

  feeDueReminder: {
    title: 'Pending Monthly Fee Reminder (मासिक फीस बकाया रिमाइंडर)',
    category: 'fees',
    badge: '💸 Pending Fee',
    description: 'Sent to students having fee pending for the current running month.',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* में आपके माह *{month}* की लाइब्रेरी फीस *₹{amount}* बकाया है।\n\n💺 *सीट:* Seat #{seat_number}\n\nसुविधाजनक अध्ययन जारी रखने के लिए कृपया समय पर फीस जमा करवाएं ताकि आपकी सीट बनी रहे। धन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'month', 'amount', 'seat_number', 'phone'],
  },

  feeReceipt: {
    title: 'Payment Confirmation Receipt (फीस रसीद पुष्टि)',
    category: 'fees',
    badge: '🧾 Receipt',
    description: 'Sent automatically after collecting fee along with official payment confirmation.',
    template:
      '🎉 *FEE PAYMENT RECEIPT - {library_name}*\n\nनमस्ते *{student_name}* जी,\nआपकी फीस *₹{amount}* सफलतापूर्वक प्राप्त हो गई है! ✅\n\n🧾 *रसीद सं. (Receipt No):* {receipt_no}\n📦 *प्लान:* {plan_name}\n📅 *वैलिडिटी:* {validity_period}\n💺 *सीट आवंटित:* Seat #{seat_number} ({shift})\n💳 *माध्यम:* {payment_mode}\n\nधन्यवाद! पढ़ाई जारी रखें और उज्ज्वल भविष्य बनाएं। ✨\n— *{library_name}*',
    availableTags: [
      'student_name',
      'library_name',
      'amount',
      'receipt_no',
      'plan_name',
      'validity_period',
      'seat_number',
      'shift',
      'payment_mode',
      'phone',
    ],
  },

  admissionWelcome: {
    title: 'New Admission Welcome (नया प्रवेश बधाई व नियम)',
    category: 'admissions',
    badge: '🎓 Admission',
    description: 'Sent when a student joins the library with their seat, shift, and basic library rules.',
    template:
      '🎉 *Welcome to {library_name}!* 📚✨\n\nनमस्ते *{student_name}* जी,\n{library_name} परिवार में आपका हार्दिक स्वागत है!\n\n💺 *आपकी आवंटित सीट:* Seat #{seat_number}\n⏰ *शिफ्ट टाइमिंग:* {shift}\n📦 *सदस्यता प्लान:* {plan_name}\n📅 *वैलिडिटी:* {validity_period}\n\n💡 *लाइब्रेरी नियम:* कृपया शांति बनाए रखें, मोबाइल साइलेंट पर रखें और अपनी सीट साफ रखें।\n\nसफलता की अग्रिम शुभकामनाएं! 🎯\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'plan_name', 'validity_period', 'phone'],
  },

  membershipExtended: {
    title: 'Validity Extension Confirmation (दिन आगे बढ़ाने की रसीद)',
    category: 'admissions',
    badge: '➕ Extension',
    description: 'Sent when student extends their validity period by extra days.',
    template:
      '🙏 नमस्ते *{student_name}* जी!\n\n🎉 आपकी *{library_name}* की सदस्यता सफलतापूर्वक *+{extra_days} दिन* आगे बढ़ा दी गई है।\n\n📅 *नई समाप्ति तिथि (New Expiry):* {new_expiry_date}\n💺 *सीट:* Seat #{seat_number} ({shift})\n💰 *प्राप्त शुल्क:* ₹{fee_amount}\n💳 *भुगतान माध्यम:* {payment_mode}\n\nधन्यवाद! पढ़ाई जारी रखें और उज्ज्वल भविष्य बनाएं। ✨\n— *{library_name}*',
    availableTags: [
      'student_name',
      'library_name',
      'extra_days',
      'new_expiry_date',
      'seat_number',
      'shift',
      'fee_amount',
      'payment_mode',
      'phone',
    ],
  },

  demoEndingToday: {
    title: 'Demo Trial Ending Today (डेमो का आखिरी दिन फॉलो-अप)',
    category: 'leads',
    badge: '🎯 Demo',
    description: 'Sent on the final day of a student’s free trial demo.',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* में आज आपके Free Demo Trial का आखिरी दिन है।\n\nआशा है आपको हमारी लाइब्रेरी का शांत वातावरण, आरामदायक सीट और हाई-स्पीड WiFi पसंद आया होगा। अपनी पसंदीदा सीट नियमित कन्फर्म करवाने के लिए रिसेप्शन पर संपर्क करें।\n\nधन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'seat_number', 'shift', 'phone'],
  },

  demoExpired: {
    title: 'Demo Trial Expired Offer (डेमो समाप्त होने पर ऑफर)',
    category: 'leads',
    badge: '🎯 Demo',
    description: 'Sent after the demo trial period has passed to encourage admission.',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* में आपका Free Demo Trial समाप्त हो चुका है।\n\nयदि आप अपनी सीट नियमित रूप से जारी रखना चाहते हैं तो कृपया आज ही संपर्क करें क्योंकि सीटें सीमित हैं।\n\nधन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'phone'],
  },

  visitorWelcome: {
    title: 'Visitor / Inquiry Welcome Note (विजिटर स्वागत नोट)',
    category: 'leads',
    badge: '📋 Inquiry',
    description: 'Sent to general visitors who came to inquire about the library.',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* विजिट करने के लिए धन्यवाद! हमारी लाइब्रेरी में शांत वातावरण, आरामदायक सीटें, पर्सनल लॉकर्स और हाई-स्पीड इंटरनेट उपलब्ध है।\n\nएडमिशन या किसी भी जानकारी के लिए हमसे संपर्क करें।\n\nधन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'phone'],
  },

  absentAlert: {
    title: 'Student Absence Check (अनुपस्थिति फॉलो-अप)',
    category: 'notices',
    badge: '❓ Absence',
    description: 'Sent to students who haven’t visited the library for a few days.',
    template:
      'नमस्ते *{student_name}* जी 🙏\n\nहम देख रहे हैं कि आप पिछले कुछ दिनों से *{library_name}* नहीं आ पा रहे हैं।\nसब कुछ ठीक है न? यदि आपको टाइमिंग या सीट से जुड़ी कोई भी समस्या है, तो हमें बताएं। हम आपकी मदद के लिए हमेशा तत्पर हैं।\n\nजल्द आकर अपनी पढ़ाई जारी रखें! 📚✨\n— *{library_name}*',
    availableTags: ['student_name', 'library_name', 'seat_number', 'phone'],
  },

  generalNotice: {
    title: 'Library Announcement / Holiday (सामान्य सूचना या अवकाश)',
    category: 'notices',
    badge: '📢 Notice',
    description: 'Send general announcements, timing changes, or holiday notices.',
    template:
      '📢 *ज़रूरी सूचना - {library_name}*\n\nप्रिय विद्यार्थियों,\n{notice_message}\n\nकिसी भी प्रश्न के लिए रिसेप्शन पर संपर्क करें।\n\nधन्यवाद! ✨\n— *{library_name}*',
    availableTags: ['library_name', 'notice_message', 'phone'],
  },
};

// Preset Tone Styles for Instant 1-Click Switch
export const TEMPLATE_PRESETS = {
  endingSoonReminder: {
    hinglish:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* की तरफ से यह सूचना है कि आपकी *Seat #{seat_number} ({shift})* की सदस्यता *{status_phrase}*।\n\n📅 *समाप्ति तिथि (Expiry Date):* {expiry_date}\n\nकृपया अपनी सीट सुरक्षित रखने के लिए समय पर रिन्यू करवाएं ताकि आपकी पढ़ाई में कोई रुकावट न आए। धन्यवाद! ✨\n— *{library_name}*',
    english:
      'Dear *{student_name}*,\n\nThis is a friendly advance reminder that your membership for *Seat #{seat_number} ({shift})* at *{library_name}* is expiring on *{expiry_date}* ({status_phrase}).\n\nPlease renew in advance to retain your seat.\n\nThank you,\n*{library_name}*',
    short:
      '⏳ *{library_name}:* Dear {student_name}, your seat #{seat_number} subscription expires on {expiry_date}. Please renew soon to keep your seat reserved!',
  },
  expiredReminder: {
    hinglish:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* में आपकी *Seat #{seat_number} ({shift})* की सदस्यता *{expiry_date}* को समाप्त हो चुकी है।\n\nकृपया अपनी पसंदीदा सीट सुरक्षित रखने के लिए आज ही रिन्यूअल करवाएं। 2 दिन बाद सीट किसी अन्य छात्र को आवंटित हो सकती है।\n\nधन्यवाद! ✨\n— *{library_name}*',
    english:
      'Dear *{student_name}*,\n\nYour library membership at *{library_name}* (Seat #{seat_number}) expired on *{expiry_date}*.\n\nYou are currently within the 2-day grace period. Please renew today to prevent your seat from being reassigned.\n\nThank you,\n*{library_name}*',
    short:
      '⚠️ *{library_name}:* Dear {student_name}, your membership expired on {expiry_date}. Please renew today to keep your seat reserved!',
  },
  overdueReminder: {
    hinglish:
      '⚠️ *FINAL NOTICE - {library_name}*\n\nनमस्ते *{student_name}* जी,\nआपकी *Seat #{seat_number} ({shift})* की सदस्यता समाप्त हुए 2 दिन से अधिक हो चुके हैं।\n\nकृपया अपनी सीट खाली होने (Release) से बचाने के लिए तुरंत रिन्यूअल करवाएं अथवा रिसेप्शन पर संपर्क करें।\n\nधन्यवाद! ✨\n— *{library_name}*',
    english:
      '⚠️ *FINAL OVERDUE NOTICE - {library_name}*\n\nDear *{student_name}*,\nYour membership for *Seat #{seat_number}* is now overdue by more than 2 days.\n\nPlease clear your renewal immediately to prevent immediate release of your seat.\n\nRegards,\n*{library_name}*',
    short:
      '🚨 *Critical Overdue:* Dear {student_name}, membership expired >2 days ago at {library_name}. Please renew today to avoid seat cancellation.',
  },
  expiryReminder: {
    hinglish:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* की तरफ से यह रिमाइंडर है कि आपकी *Seat #{seat_number} ({shift})* की वैलिडिटी *{status_phrase}*।\n\n📅 *समाप्ति तिथि (Expiry Date):* {expiry_date}\n\nकृपया अपनी सीट सुरक्षित रखने के लिए समय पर रिन्यूअल करवाएं। धन्यवाद! ✨\n— *{library_name}*',
    english:
      'Dear *{student_name}*,\n\nThis is a friendly reminder from *{library_name}* that your membership for *Seat #{seat_number} ({shift})* will expire on *{expiry_date}*.\n\nPlease renew on time to retain your seat reservation.\n\nThank you,\n*{library_name}*',
    short:
      '⚠️ *{library_name}:* Dear {student_name}, your seat #{seat_number} subscription expires on {expiry_date}. Please renew your fee to avoid seat release. Thanks!',
  },
  feeDueReminder: {
    hinglish:
      'नमस्ते *{student_name}* जी 🙏\n\n*{library_name}* में आपके माह *{month}* की लाइब्रेरी फीस *₹{amount}* बकाया है।\n\n💺 *सीट:* Seat #{seat_number}\n\nकृपया समय पर फीस जमा करवाएं ताकि आपकी सीट बनी रहे। धन्यवाद! ✨\n— *{library_name}*',
    english:
      'Dear *{student_name}*,\n\nYour library fee of *₹{amount}* for *{month}* is pending at *{library_name}* (Seat #{seat_number}).\n\nPlease clear your dues at the counter or via UPI at your earliest convenience.\n\nThank you,\n*{library_name}*',
    short:
      '🚨 *Fee Due Alert:* Dear {student_name}, ₹{amount} is pending for {month} at {library_name}. Please pay soon. Thank you!',
  },
  feeReceipt: {
    hinglish:
      '🎉 *FEE PAYMENT RECEIPT - {library_name}*\n\nनमस्ते *{student_name}* जी,\nआपकी फीस *₹{amount}* सफलतापूर्वक प्राप्त हो गई है! ✅\n\n🧾 *रसीद सं. (Receipt No):* {receipt_no}\n📦 *प्लान:* {plan_name}\n📅 *वैलिडिटी:* {validity_period}\n💺 *सीट आवंटित:* Seat #{seat_number} ({shift})\n💳 *माध्यम:* {payment_mode}\n\nधन्यवाद! पढ़ाई जारी रखें और उज्ज्वल भविष्य बनाएं। ✨\n— *{library_name}*',
    english:
      '🎉 *OFFICIAL PAYMENT RECEIPT*\n\nDear *{student_name}*,\nPayment of *₹{amount}* has been successfully received at *{library_name}*.\n\nReceipt: {receipt_no}\nSeat: #{seat_number} ({shift})\nPlan: {plan_name}\nValid: {validity_period}\nMode: {payment_mode}\nStatus: PAID & VERIFIED\n\nThank you for choosing {library_name}!',
    short:
      '✅ *Payment Received:* ₹{amount} received for {student_name} at {library_name}. Receipt #{receipt_no}. Valid: {validity_period}. Thank you!',
  },
  membershipExtended: {
    hinglish:
      '🙏 नमस्ते *{student_name}* जी!\n\n🎉 आपकी *{library_name}* की सदस्यता सफलतापूर्वक *+{extra_days} दिन* आगे बढ़ा दी गई है।\n\n📅 *नई समाप्ति तिथि (New Expiry):* {new_expiry_date}\n💺 *सीट:* Seat #{seat_number} ({shift})\n💰 *प्राप्त शुल्क:* ₹{fee_amount}\n💳 *भुगतान माध्यम:* {payment_mode}\n\nधन्यवाद! पढ़ाई जारी रखें और उज्ज्वल भविष्य बनाएं। ✨\n— *{library_name}*',
    english:
      'Dear *{student_name}*,\n\nYour library membership at *{library_name}* has been extended by *{extra_days} days*!\n\nNew Expiry Date: {new_expiry_date}\nSeat: #{seat_number} ({shift})\nFee Paid: ₹{fee_amount} ({payment_mode})\n\nKeep studying hard! ✨\n*{library_name}*',
    short:
      '🎉 *Validity Extended:* Dear {student_name}, +{extra_days} days added to your membership! New Expiry: {new_expiry_date}. Fee: ₹{fee_amount}. - {library_name}',
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

  // Group 5: Advanced Graphical Analytics & Visual Charts (High-Level Widgets)
  hourlyPeakHours: true,
  dailyCollectionBar: true,
  planPopularityDonut: true,
  admissionVsExitGrowth: true,
  seatOccupancyGauge: true,
  feeAgingRecovery: true,
  shiftCapacityCompare: true,
  profitMarginExpense: true,
  averageRevenueMetric: true,
  studyTimeDistribution: true,
  thermalFootfallHeatmap: true,
  visualSeatMatrixMini: true,
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

  // Graphical widgets for staff
  hourlyPeakHours: true,
  dailyCollectionBar: false,
  planPopularityDonut: true,
  admissionVsExitGrowth: true,
  seatOccupancyGauge: true,
  feeAgingRecovery: true,
  shiftCapacityCompare: true,
  profitMarginExpense: false,
  averageRevenueMetric: false,
  studyTimeDistribution: true,
  thermalFootfallHeatmap: true,
  visualSeatMatrixMini: true,

  hideFinancials: true,
};

export const DASHBOARD_WIDGET_OPTIONS = [
  // 1. Core Operations
  { id: 'quickActions', label: '⚡ Quick Shortcuts Strip (शॉर्टकट स्ट्रिप)', category: 'operations', span: 'full', desc: 'Top shortcut buttons for common daily tasks' },
  { id: 'todayPulse', label: '🔴 Today Pulse - Aaj Ka Hisaab (आज का हिसाब)', category: 'operations', span: 'full', desc: 'Realtime daily counters of fee, admissions, and expenses' },
  { id: 'coreStats', label: '📈 Core Monthly Stat Cards (मासिक आंकड़े)', category: 'operations', span: 'full', desc: 'Active students, occupancy, monthly revenue, pending dues' },
  { id: 'occupancyOverview', label: '🪑 Hall & Section Occupancy (हॉल सीट ऑक्यूपेंसी)', category: 'operations', span: 'half', desc: 'Live seat matrix and progress percentage per section' },
  { id: 'shiftDistribution', label: '⏰ Shift Wise Distribution (शिफ्ट विभाजन)', category: 'operations', span: 'half', desc: 'Student enrollment by Morning, Evening, and Full Day slots' },
  { id: 'quickSeatSearch', label: '🔍 Instant Seat Finder (त्वरित सीट खोजक)', category: 'operations', span: 'half', desc: 'Quickly check if a seat is vacant or assigned to whom' },

  // 2. High-Level Graphical Analytics (Tagda Visual Widgets)
  { id: 'seatOccupancyGauge', label: '🎯 Live Cockpit Capacity Speedometer (सीट स्पीडोमीटर डायल)', category: 'visualAnalytics', span: 'half', desc: 'Sports cockpit arc gauge showing live occupancy percentage and vacant seats' },
  { id: 'hourlyPeakHours', label: '⏱️ Library Footfall & Spline Wave (लाइब्रेरी पीक आवर्स वेव ग्राफ)', category: 'visualAnalytics', span: 'half', desc: '16-Hour spline wave area chart highlighting busy study hours and quiet slots' },
  { id: 'dailyCollectionBar', label: '📊 Daily Fee Collection Trend (दैनिक 7-दिवसीय फीस ग्राफ)', category: 'visualAnalytics', span: 'half', desc: 'Day-by-day 3D cylindrical neon bars with best day highlight and average' },
  { id: 'thermalFootfallHeatmap', label: '🔥 7-Day Thermal Rush Heatmap (साप्ताहिक 7-दिन थर्मल हीट ग्रिड)', category: 'visualAnalytics', span: 'half', desc: 'Day x Hour thermal intensity heat grid showing exact rush timings' },
  { id: 'visualSeatMatrixMini', label: '🪑 Live 2D Seat Floor Matrix (लाइब्रेरी 2D फ्लोर विज़ुअल मैप)', category: 'visualAnalytics', span: 'half', desc: 'Live 2D interactive floor map with pulsating LED seat indicators' },
  { id: 'planPopularityDonut', label: '🍩 Plan Popularity Circular Donut (मेंबरशिप डोनट चार्ट)', category: 'visualAnalytics', span: 'half', desc: 'Circular SVG Donut chart showing student share across all membership plans' },
  { id: 'admissionVsExitGrowth', label: '📈 6-Month Net Student Growth (विद्यार्थी वृद्धि व एग्जिट ग्राफ)', category: 'visualAnalytics', span: 'half', desc: 'Dual-bar 6-month comparison of new admissions vs left members with retention rate' },
  { id: 'shiftCapacityCompare', label: '⚖️ Shift-Wise Capacity & Vacancy (प्रत्येक शिफ्ट में खाली सीटें)', category: 'visualAnalytics', span: 'half', desc: 'Triple comparative progress meters for Full Day, Morning, and Evening slots' },
  { id: 'studyTimeDistribution', label: '📚 Study Time Preference Radar (समय स्लॉट प्राथमिकता रडार)', category: 'visualAnalytics', span: 'half', desc: 'SVG polygon spider radar chart for Morning, Evening, and Full Day slots' },
  { id: 'feeAgingRecovery', label: '📉 Fee Dues Aging & Recovery Funnel (बकाया फीस रिकवरी बकेट)', category: 'visualAnalytics', span: 'half', desc: '4-Tier dues aging progress bar (0-3d, 4-7d, 8-15d, 15d+) with 1-click WhatsApp recovery' },
  { id: 'profitMarginExpense', label: '💰 Net Profit & Operating Margin (कमाई, खर्च व शुद्ध मुनाफा ग्राफ)', category: 'visualAnalytics', span: 'half', desc: 'Visual split comparison of Gross Income, Expenses, and Net Margin %' },
  { id: 'averageRevenueMetric', label: '💎 ARPU & Student Lifetime Value (प्रति छात्र आय व LTV एनालिटिक्स)', category: 'visualAnalytics', span: 'half', desc: 'High-level KPI with average ticket size, student retention months, and projected MRR' },

  // 3. Financials & Money
  { id: 'revenueChart', label: '📊 Revenue vs Expense Trend (कमाई व खर्च ग्राफ)', category: 'financials', span: 'half', desc: '6-Month comparison between income and expenses' },
  { id: 'cashRegister', label: '💵 Counter Cash Register (काउंटर कैश इन हैंड)', category: 'financials', span: 'half', desc: 'Today cash fees minus cash expenses in counter drawer' },
  { id: 'paymentModesPie', label: '📱 Payment Mode Breakdown (पेमेंट माध्यम UPI/Cash/Bank)', category: 'financials', span: 'half', desc: 'Percentage & volume of UPI, Cash and Bank collections' },
  { id: 'monthlyTarget', label: '🎯 Monthly Revenue Target (मासिक कमाई लक्ष्य)', category: 'financials', span: 'half', desc: 'Target collection progress bar and remaining amount' },
  { id: 'expenseCategories', label: '🧾 Expense Categories Breakdown (खर्च श्रेणीवार)', category: 'financials', span: 'half', desc: 'Rent, electricity, wifi, salary and maintenance costs' },
  { id: 'recentActivity', label: '📜 Recent Fee Collections Log (हालिया फीस लिस्ट)', category: 'financials', span: 'full', desc: 'Real-time payment audit stream of latest receipts' },
  { id: 'feeCalculator', label: '🧮 Quick Fee & Discount Calculator (त्वरित फीस कैलकुलेटर)', category: 'financials', span: 'half', desc: 'Instant pricing quoting with plan, addons and discount' },

  // 4. Students, Leads & Recoveries
  { id: 'pendingDuesAlert', label: '🚨 Urgent Fee Follow-Ups (बकाया फीस अलर्ट)', category: 'students', span: 'half', desc: 'Unpaid dues list with 1-click WhatsApp payment reminders' },
  { id: 'expiringMemberships', label: '⏳ Expiring in Next 7 Days (आगामी समाप्ति अलर्ट)', category: 'students', span: 'half', desc: 'Students whose memberships expire this week with WhatsApp reminder' },
  { id: 'demoTracker', label: '🎯 Live Demo & Trial Tracker (डेमो ट्रैकर)', category: 'students', span: 'half', desc: 'Prospective students currently on trial seats' },
  { id: 'newInquiries', label: '📋 New Inquiries & Leads (नई पूछताछ पाइपलाइन)', category: 'students', span: 'half', desc: 'Visitors who inquired but haven’t taken demo or admission' },
  { id: 'admissionsVsExits', label: '🌱 Monthly Net Growth (विद्यार्थी वृद्धि दर)', category: 'students', span: 'half', desc: 'New admissions vs departed members comparison' },
  { id: 'topMembers', label: '⭐ Long-Term Members (दीर्घकालिक सदस्य)', category: 'students', span: 'half', desc: 'Students enrolled in 3M, 6M, or 1Yr multi-month plans' },
  { id: 'leftStudentsAudit', label: '🚪 Recently Departed Students (छोड़ चुके विद्यार्थी)', category: 'students', span: 'half', desc: 'Log of recently inactive/left students with exit dates' },

  // 5. Facilities, Reminders & Team
  { id: 'addonUtilization', label: '🔐 Lockers & Facilities (लॉकर व सुविधाएं)', category: 'facilities', span: 'half', desc: 'Assigned vs available lockers and addon revenue' },
  { id: 'remindersCounter', label: '💬 WhatsApp Reminders Today (आज भेजे गए रिमाइंडर)', category: 'facilities', span: 'half', desc: 'Total automated WhatsApp reminders dispatched today' },
  { id: 'noticeBoard', label: '📌 Digital Notice Board (लाइब्रेरी नोटिस बोर्ड)', category: 'facilities', span: 'half', desc: 'Daily announcement and broadcast notes for staff/students' },
  { id: 'staffActivity', label: '👥 Staff On-Duty Overview (स्टाफ टीम स्थिति)', category: 'facilities', span: 'half', desc: 'Active team members, roles, contacts, and quick permissions' },

  // Privacy Protection
  { id: 'hideFinancials', label: '🔒 Hide All Financial Numbers (कमाई/रुपये छिपाएं)', category: 'security', span: 'full', desc: 'Hides all revenue, collections, and expense amounts from staff' },
];

export const DEFAULT_DASHBOARD_ORDER = [
  'quickActions',
  'todayPulse',
  'coreStats',
  'seatOccupancyGauge',
  'hourlyPeakHours',
  'dailyCollectionBar',
  'thermalFootfallHeatmap',
  'visualSeatMatrixMini',
  'shiftCapacityCompare',
  'planPopularityDonut',
  'admissionVsExitGrowth',
  'quickSeatSearch',
  'occupancyOverview',
  'revenueChart',
  'profitMarginExpense',
  'averageRevenueMetric',
  'monthlyTarget',
  'cashRegister',
  'paymentModesPie',
  'expenseCategories',
  'feeAgingRecovery',
  'feeCalculator',
  'pendingDuesAlert',
  'studyTimeDistribution',
  'expiringMemberships',
  'demoTracker',
  'newInquiries',
  'admissionsVsExits',
  'remindersCounter',
  'shiftDistribution',
  'addonUtilization',
  'topMembers',
  'leftStudentsAudit',
  'noticeBoard',
  'staffActivity',
  'recentActivity',
];

export const DEFAULT_STAFF_DASHBOARD_CONFIG = DEFAULT_STAFF_DASHBOARD_WIDGETS;

export const getWhatsAppTemplatesStorageKey = () => `studypoint_${getActiveTenantId()}_whatsapp_templates`;
export const getDashboardConfigStorageKey = () => `studypoint_${getActiveTenantId()}_dashboard_config`;
export const getDashboardOrderStorageKey = () => `studypoint_${getActiveTenantId()}_dashboard_order`;
export const getStaffDashboardConfigStorageKey = () => `studypoint_${getActiveTenantId()}_staff_dashboard_config`;

// Legacy keys for backward compatibility
export const WHATSAPP_TEMPLATES_STORAGE_KEY = 'studypoint_whatsapp_templates';
export const DASHBOARD_CONFIG_STORAGE_KEY = 'studypoint_dashboard_config';
export const DASHBOARD_ORDER_STORAGE_KEY = 'studypoint_dashboard_order';
export const STAFF_DASHBOARD_CONFIG_STORAGE_KEY = 'studypoint_staff_dashboard_config';

// Replace placeholders in template with robust alias support
export const renderTemplate = (templateString, data = {}) => {
  if (!templateString) return '';

  const normalized = { ...data };

  // Common aliases mapping
  if (normalized.student_name && !normalized.name) normalized.name = normalized.student_name;
  if (normalized.name && !normalized.student_name) normalized.student_name = normalized.name;

  if (normalized.amount !== undefined && normalized.pending_amount === undefined) normalized.pending_amount = normalized.amount;
  if (normalized.pending_amount !== undefined && normalized.amount === undefined) normalized.amount = normalized.pending_amount;
  if (normalized.amount !== undefined && normalized.fee_amount === undefined) normalized.fee_amount = normalized.amount;
  if (normalized.fee_amount !== undefined && normalized.amount === undefined) normalized.amount = normalized.fee_amount;

  if (normalized.library_name && !normalized.libraryName) normalized.libraryName = normalized.library_name;
  if (normalized.libraryName && !normalized.library_name) normalized.library_name = normalized.libraryName;

  if (normalized.seat_number !== undefined && normalized.seatNumber === undefined) normalized.seatNumber = normalized.seat_number;
  if (normalized.seatNumber !== undefined && normalized.seat_number === undefined) normalized.seat_number = normalized.seatNumber;

  if (normalized.expiry_date && !normalized.due_date) normalized.due_date = normalized.expiry_date;
  if (normalized.due_date && !normalized.expiry_date) normalized.expiry_date = normalized.due_date;

  if (normalized.days_left === undefined && normalized.diffDays !== undefined) {
    normalized.days_left = Math.abs(normalized.diffDays);
  }

  let result = templateString;
  Object.keys(normalized).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, normalized[key] !== undefined && normalized[key] !== null ? String(normalized[key]) : '');
  });
  return result;
};

// Retrieve saved templates or fallback to defaults (tenant-scoped)
export const getActiveTemplates = () => {
  try {
    const key = getWhatsAppTemplatesStorageKey();
    let local = localStorage.getItem(key);
    if (!local && getActiveTenantId() === 'genius_root') {
      local = localStorage.getItem(WHATSAPP_TEMPLATES_STORAGE_KEY);
      if (local) localStorage.setItem(key, local);
    }
    if (local) {
      const parsed = JSON.parse(local);
      return { ...DEFAULT_WHATSAPP_TEMPLATES, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_WHATSAPP_TEMPLATES;
};

// Retrieve saved dashboard config or fallback to defaults (tenant-scoped)
export const getActiveDashboardConfig = () => {
  try {
    const key = getDashboardConfigStorageKey();
    let local = localStorage.getItem(key);
    if (!local && getActiveTenantId() === 'genius_root') {
      local = localStorage.getItem(DASHBOARD_CONFIG_STORAGE_KEY);
      if (local) localStorage.setItem(key, local);
    }
    if (local) {
      return { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(local) };
    }
  } catch (e) {}
  return DEFAULT_DASHBOARD_CONFIG;
};

// Retrieve saved staff dashboard config (tenant-scoped)
export const getActiveStaffDashboardConfig = () => {
  try {
    const key = getStaffDashboardConfigStorageKey();
    let local = localStorage.getItem(key);
    if (!local && getActiveTenantId() === 'genius_root') {
      local = localStorage.getItem(STAFF_DASHBOARD_CONFIG_STORAGE_KEY);
      if (local) localStorage.setItem(key, local);
    }
    if (local) {
      return { ...DEFAULT_STAFF_DASHBOARD_CONFIG, ...JSON.parse(local) };
    }
  } catch (e) {}
  return DEFAULT_STAFF_DASHBOARD_CONFIG;
};

// Retrieve saved dashboard widgets sequence order or fallback to defaults (tenant-scoped)
export const getActiveDashboardOrder = () => {
  try {
    const key = getDashboardOrderStorageKey();
    let local = localStorage.getItem(key);
    if (!local && getActiveTenantId() === 'genius_root') {
      local = localStorage.getItem(DASHBOARD_ORDER_STORAGE_KEY);
      if (local) localStorage.setItem(key, local);
    }
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingSet = new Set(parsed);
        const missing = DEFAULT_DASHBOARD_ORDER.filter((id) => !existingSet.has(id));
        return [...parsed, ...missing];
      }
    }
  } catch (e) {}
  return DEFAULT_DASHBOARD_ORDER;
};

// Aliases and setters for widgets modal
export const DEFAULT_DASHBOARD_WIDGETS = DEFAULT_DASHBOARD_CONFIG;

export const setCustomDashboardConfig = (config) => {
  try {
    const key = getDashboardConfigStorageKey();
    localStorage.setItem(key, JSON.stringify(config));
    if (getActiveTenantId() === 'genius_root') {
      localStorage.setItem(DASHBOARD_CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Failed to save dashboard config:', e);
  }
};
