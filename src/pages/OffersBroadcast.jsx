import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  Megaphone,
  Tag,
  Send,
  Users,
  UserX,
  UserCheck,
  Calendar,
  Sparkles,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Phone,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Gift,
  Percent,
  IndianRupee,
  Smartphone,
  Eye,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';
import { useAuth } from '../context/AuthContext';

// Ready-made high converting promo templates
const QUICK_TEMPLATES = [
  {
    id: 'win_back',
    name: '🌟 Comeback / Win-Back (छोड़े हुए छात्रों के लिए)',
    targetType: 'left',
    text: `नमस्ते *{name}* जी! 🙏\n\nStudy Point Library में हम आपको बहुत मिस कर रहे हैं। आपके पढ़ाई के लक्ष्य और आगामी परीक्षाओं को ध्यान में रखते हुए, हम आपके लिए लाए हैं विशेष *{offer_title}*!\n\n🎁 *छूट:* {discount}\n🎟️ *प्रोमो कोड:* *{code}*\n⏳ *वैलिडिटी:* {valid_till}\n\nआज ही अपनी पसंदीदा सीट दोबारा बुक करें और शांत व अनुशासित माहौल में अपनी तैयारी को नई रफ्तार दें।\n\nस्थान: {library_name}\nसंपर्क करें: {library_phone}\nशुभकामनाएं! ✨`,
  },
  {
    id: 'exam_booster',
    name: '⚡ Exam Season Discount (परीक्षा स्पेशल)',
    targetType: 'all',
    text: `हेलो *{name}* जी! 📚\n\nपरीक्षाएं नजदीक आ चुकी हैं! अपनी पढ़ाई में 100% फोकस और बेहतरीन परिणाम के लिए Study Point Library से बेहतर कोई जगह नहीं।\n\n🔥 *{offer_title}*\n💰 *बचत:* {discount}\n🎟️ *कूपन कोड:* *{code}*\n📅 *अंतिम तिथि:* {valid_till}\n\n✨ सुविधाएँ: साइलेंट AC ज़ोन, 5G सुपरफ़ास्ट WiFi, पर्सनल चार्जिंग पॉइंट व आरामदायक कुर्सियां।\n\nसीटें सीमित हैं! तुरंत अपनी सीट सुरक्षित करें।\n— *{library_name}*`,
  },
  {
    id: 'festive_offer',
    name: '🪔 Festive Dhamaka (त्योहार / स्पेशल छूट)',
    targetType: 'all',
    text: `शुभकामनाएं *{name}* जी! 🎉\n\nत्योहारों के इस खास मौके पर Study Point Library परिवार आपके लिए लाया है सबसे बड़ा डिस्काउंट ऑफर: *{offer_title}*!\n\n🏷️ *ऑफर:* {discount} की सीधी छूट\n🔑 *कोड:* *{code}*\n⏰ *ऑफर वैध:* {valid_till}\n\nअपने दोस्तों को भी बताएं और साथ मिलकर पढ़ाई करें।\nअधिक जानकारी के लिए रिसेप्शन पर संपर्क करें।\n— *{library_name}*`,
  },
  {
    id: 'demo_followup',
    name: '👥 Visitor & Demo Follow-up (डेमो के बाद)',
    targetType: 'visitors',
    text: `नमस्ते *{name}* जी! 🙏\n\nआपने हाल ही में {library_name} विजिट किया था। हमें उम्मीद है आपको लाइब्रेरी का शांत माहौल और सुविधाएं पसंद आई होंगी।\n\nअगर आप आज ही एडमिशन लेते हैं तो आपके लिए स्पेशल ऑफर: *{offer_title}* उपलब्ध है!\n\n🎁 *डिस्काउंट:* {discount}\n🎟️ *कोड का उपयोग करें:* *{code}*\n📅 *मान्य तिथि:* {valid_till}\n\nअपनी मनपसंद सीट रिज़र्व कराने के लिए संपर्क करें।\n— *{library_name}*`,
  },
  {
    id: 'general_notice',
    name: '📢 Important Announcement / Notice (सामान्य सूचना)',
    targetType: 'active',
    text: `महत्वपूर्ण सूचना - {library_name} 📢\n\nप्रिय छात्र *{name}*,\n\nलाइब्रेरी से संबंधित यह महत्वपूर्ण अपडेट आपके लिए है:\n\n{offer_title}\n{description}\n\nकिसी भी सहायता या प्रश्न के लिए रिसेप्शन पर संपर्क करें।\nधन्यवाद! ✨\n— *{library_name}*`,
  },
];

export default function OffersBroadcast() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('offers', 'create') || user?.role === 'owner';
  const canEdit = hasPermission('offers', 'edit') || user?.role === 'owner';
  const canDelete = hasPermission('offers', 'delete') || user?.role === 'owner';

  // Tabs: 'offers' | 'broadcast' | 'logs'
  const [activeTab, setActiveTab] = useState('offers');

  // Data States
  const [offers, setOffers] = useState([]);
  const [students, setStudents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [broadcastLogs, setBroadcastLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Offer Form State
  const [offerForm, setOfferForm] = useState({
    title: '',
    code: '',
    discountType: 'percentage', // 'percentage' | 'flat' | 'free_days'
    discountValue: '20',
    targetAudience: 'left', // 'all' | 'left' | 'active' | 'visitors'
    validFrom: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    description: '',
    perks: ['Reserved AC Seat', '5G WiFi', 'Silent Zone', 'Personal Charging'],
    status: 'active', // 'active' | 'paused' | 'expired'
  });

  // Broadcast Composer State
  const [audienceFilter, setAudienceFilter] = useState('left'); // 'left' | 'all' | 'active' | 'expired' | 'visitors'
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [customMessage, setCustomMessage] = useState(QUICK_TEMPLATES[0].text);

  // Dispatcher Queue State
  const [queueStatus, setQueueStatus] = useState({}); // { [id]: 'sent' | 'skipped' }
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  // Fetch all collections
  const fetchData = async () => {
    setLoading(true);
    try {
      const [offersData, studentsData, visitorsData, logsData, settingsData] = await Promise.all([
        fetchCollectionData(COLLECTIONS.OFFERS),
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.VISITORS),
        fetchCollectionData(COLLECTIONS.BROADCAST_LOGS),
        fetchCollectionData(COLLECTIONS.SETTINGS),
      ]);

      setOffers(offersData || []);
      setStudents(studentsData || []);
      setVisitors(visitorsData || []);
      setBroadcastLogs(
        (logsData || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );

      // Look for library branding in settings
      if (settingsData && settingsData.length > 0) {
        const gen = settingsData.find((s) => s.id === 'general' || s.libraryName) || settingsData[0];
        setSettings(gen);
      }
    } catch (err) {
      console.error('Error fetching offers and broadcast data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const libraryName = settings?.libraryName || 'Study Point Library';
  const libraryPhone = settings?.phone || settings?.contactNumber || '';

  // Stats Calculations
  const stats = useMemo(() => {
    const activeOffersCount = offers.filter((o) => o.status === 'active').length;
    const activeStudentsCount = students.filter((s) => s.status === 'active').length;
    const leftStudentsCount = students.filter(
      (s) => s.status === 'left' || s.status === 'inactive'
    ).length;
    const visitorsCount = visitors.length;

    return {
      activeOffersCount,
      activeStudentsCount,
      leftStudentsCount,
      visitorsCount,
    };
  }, [offers, students, visitors]);

  // Audience list based on filter
  const audienceList = useMemo(() => {
    let list = [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (audienceFilter === 'all') {
      const stu = students.map((s) => ({
        id: s.id,
        name: s.name || 'Student',
        phone: s.phone || '',
        type: s.status === 'left' ? 'Left / Ex-Student' : 'Student',
        category: s.status === 'left' ? 'left' : 'active',
        detail: s.shift ? `Shift: ${s.shift}` : 'Regular Student',
        status: s.status,
      }));
      const vis = visitors.map((v) => ({
        id: v.id,
        name: v.name || 'Visitor Lead',
        phone: v.phone || '',
        type: 'Demo / Visitor',
        category: 'visitor',
        detail: v.visitDate ? `Visited: ${formatDate(v.visitDate)}` : 'Inquiry',
      }));
      list = [...stu, ...vis];
    } else if (audienceFilter === 'left') {
      list = students
        .filter((s) => s.status === 'left' || s.status === 'inactive')
        .map((s) => ({
          id: s.id,
          name: s.name || 'Student',
          phone: s.phone || '',
          type: 'Left / Ex-Student',
          category: 'left',
          detail: s.leftDate ? `Left on ${formatDate(s.leftDate)}` : 'Past Member',
          status: 'left',
        }));
    } else if (audienceFilter === 'active') {
      list = students
        .filter((s) => s.status === 'active')
        .map((s) => ({
          id: s.id,
          name: s.name || 'Student',
          phone: s.phone || '',
          type: 'Active Student',
          category: 'active',
          detail: s.shift ? `Shift: ${s.shift}` : 'Seat Allocated',
          status: 'active',
        }));
    } else if (audienceFilter === 'expired') {
      list = students
        .filter((s) => {
          if (!s.endDate && !s.expiryDate) return false;
          const exp = s.endDate || s.expiryDate;
          return exp < todayStr;
        })
        .map((s) => ({
          id: s.id,
          name: s.name || 'Student',
          phone: s.phone || '',
          type: 'Expired Membership',
          category: 'expired',
          detail: `Expired: ${formatDate(s.endDate || s.expiryDate)}`,
          status: s.status,
        }));
    } else if (audienceFilter === 'visitors') {
      list = visitors.map((v) => ({
        id: v.id,
        name: v.name || 'Visitor Lead',
        phone: v.phone || '',
        type: 'Demo / Inquiry',
        category: 'visitor',
        detail: v.purpose || (v.visitDate ? `Visited: ${formatDate(v.visitDate)}` : 'Inquiry'),
      }));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) => item.name.toLowerCase().includes(q) || item.phone.includes(q)
      );
    }

    return list;
  }, [students, visitors, audienceFilter, searchQuery]);

  // Keep all filtered contacts selected by default when audience changes
  useEffect(() => {
    setSelectedContactIds(audienceList.map((c) => c.id));
  }, [audienceFilter, searchQuery]);

  // Selected Offer Object
  const activeOffer = useMemo(() => {
    return offers.find((o) => o.id === selectedOfferId) || null;
  }, [offers, selectedOfferId]);

  // Auto-generate Promo Code
  const handleGenerateCode = () => {
    const prefix = offerForm.title
      ? offerForm.title.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
      : 'OFFER';
    const rand = Math.floor(100 + Math.random() * 900);
    setOfferForm((prev) => ({ ...prev, code: `${prefix}${rand}` }));
  };

  // Open Offer Modal (New or Edit)
  const handleOpenOfferModal = (offerToEdit = null) => {
    if (offerToEdit) {
      setEditingOffer(offerToEdit);
      setOfferForm({
        title: offerToEdit.title || '',
        code: offerToEdit.code || '',
        discountType: offerToEdit.discountType || 'percentage',
        discountValue: String(offerToEdit.discountValue || '20'),
        targetAudience: offerToEdit.targetAudience || 'all',
        validFrom: offerToEdit.validFrom || new Date().toISOString().split('T')[0],
        validTill: offerToEdit.validTill || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        description: offerToEdit.description || '',
        perks: offerToEdit.perks || ['Reserved AC Seat', '5G WiFi'],
        status: offerToEdit.status || 'active',
      });
    } else {
      setEditingOffer(null);
      setOfferForm({
        title: '',
        code: `OFFER${Math.floor(100 + Math.random() * 900)}`,
        discountType: 'percentage',
        discountValue: '20',
        targetAudience: 'left',
        validFrom: new Date().toISOString().split('T')[0],
        validTill: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        description: '',
        perks: ['Reserved AC Seat', '5G WiFi', 'Silent Zone', 'Personal Charging'],
        status: 'active',
      });
    }
    setIsOfferModalOpen(true);
  };

  // Save Offer
  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.title.trim()) {
      alert('Please enter an offer title!');
      return;
    }

    try {
      const payload = {
        ...offerForm,
        code: offerForm.code.toUpperCase().trim(),
        discountValue: Number(offerForm.discountValue) || 0,
        updatedAt: new Date().toISOString(),
      };

      if (editingOffer) {
        await updateDocument(COLLECTIONS.OFFERS, editingOffer.id, payload);
        showToast('Offer updated successfully! 🎉');
      } else {
        payload.createdAt = new Date().toISOString();
        await createDocument(COLLECTIONS.OFFERS, payload);
        showToast('New Promotional Offer created! 🚀');
      }

      setIsOfferModalOpen(false);
      setEditingOffer(null);
      fetchData();
    } catch (err) {
      console.error('Error saving offer:', err);
      alert('Failed to save offer. Please try again.');
    }
  };

  // Delete Offer
  const handleDeleteOffer = async () => {
    if (!deleteTarget) return;
    try {
      await removeDocument(COLLECTIONS.OFFERS, deleteTarget.id);
      showToast('Offer deleted successfully.');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting offer:', err);
      alert('Failed to delete offer.');
    }
  };

  // Quick Action: "Broadcast This Offer"
  const handleBroadcastThisOffer = (offer) => {
    setSelectedOfferId(offer.id);
    if (offer.targetAudience === 'left') {
      setAudienceFilter('left');
    } else if (offer.targetAudience === 'visitors') {
      setAudienceFilter('visitors');
    } else if (offer.targetAudience === 'active') {
      setAudienceFilter('active');
    } else {
      setAudienceFilter('all');
    }

    // Auto-compose message with offer data
    const discountStr =
      offer.discountType === 'percentage'
        ? `${offer.discountValue}% OFF`
        : offer.discountType === 'free_days'
        ? `+${offer.discountValue} Days Free`
        : `₹${offer.discountValue} Flat Discount`;

    const template = offer.targetAudience === 'left' ? QUICK_TEMPLATES[0].text : QUICK_TEMPLATES[1].text;
    const populated = template
      .replace(/{offer_title}/g, offer.title)
      .replace(/{discount}/g, discountStr)
      .replace(/{code}/g, offer.code)
      .replace(/{valid_till}/g, formatDate(offer.validTill))
      .replace(/{library_name}/g, libraryName)
      .replace(/{library_phone}/g, libraryPhone || '9876543210');

    setCustomMessage(populated);
    setActiveTab('broadcast');
    showToast(`Prepared Broadcast campaign for "${offer.title}"! 📢`);
  };

  // Render text with recipient placeholders
  const formatRecipientMessage = (templateText, recipient) => {
    const discountStr = activeOffer
      ? activeOffer.discountType === 'percentage'
        ? `${activeOffer.discountValue}% OFF`
        : activeOffer.discountType === 'free_days'
        ? `+${activeOffer.discountValue} Days Free`
        : `₹${activeOffer.discountValue} Flat Discount`
      : 'Special Discount';

    const codeStr = activeOffer?.code || 'STUDYNOW';
    const validStr = activeOffer ? formatDate(activeOffer.validTill) : formatDate(new Date().toISOString());

    return templateText
      .replace(/{name}/g, recipient.name || 'Student')
      .replace(/{offer_title}/g, activeOffer?.title || 'Special Study Offer')
      .replace(/{discount}/g, discountStr)
      .replace(/{code}/g, codeStr)
      .replace(/{valid_till}/g, validStr)
      .replace(/{library_name}/g, libraryName)
      .replace(/{library_phone}/g, libraryPhone || 'Contact Desk')
      .replace(/{phone}/g, recipient.phone || '')
      .replace(/{description}/g, activeOffer?.description || 'Exclusive access to our silent study room.');
  };

  // Launch WhatsApp link for a contact
  const handleOpenWhatsAppForContact = (contact, markSent = true) => {
    const cleanPhone = (contact.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert(`Invalid phone number for ${contact.name}: ${contact.phone}`);
      return false;
    }

    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = formatRecipientMessage(customMessage, contact);
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    if (markSent) {
      setQueueStatus((prev) => ({ ...prev, [contact.id]: 'sent' }));
    }
    return true;
  };

  // Open Dispatcher Modal
  const handleStartBroadcast = () => {
    if (selectedContactIds.length === 0) {
      alert('Please select at least one recipient!');
      return;
    }
    if (!customMessage.trim()) {
      alert('Please write a message to broadcast!');
      return;
    }
    setQueueStatus({});
    setCurrentQueueIndex(0);
    setIsDispatcherOpen(true);
  };

  // Dispatch Next in Queue
  const handleDispatchNext = () => {
    const recipients = audienceList.filter((c) => selectedContactIds.includes(c.id));
    if (currentQueueIndex >= recipients.length) {
      alert('All selected contacts have been dispatched! 🎉');
      return;
    }

    const contact = recipients[currentQueueIndex];
    handleOpenWhatsAppForContact(contact, true);
    setCurrentQueueIndex((prev) => Math.min(prev + 1, recipients.length));
  };

  // Complete & Save Broadcast Log
  const handleFinishBroadcast = async () => {
    const recipients = audienceList.filter((c) => selectedContactIds.includes(c.id));
    const sentCount = Object.values(queueStatus).filter((s) => s === 'sent').length || recipients.length;

    try {
      const logEntry = {
        title: activeOffer?.title || 'Broadcast Campaign',
        offerCode: activeOffer?.code || null,
        audienceFilter,
        totalSelected: recipients.length,
        totalSent: sentCount,
        messageSnippet: customMessage.slice(0, 150) + '...',
        sentBy: user?.displayName || user?.email || 'Owner',
        createdAt: new Date().toISOString(),
      };

      await createDocument(COLLECTIONS.BROADCAST_LOGS, logEntry);
      showToast('Broadcast Campaign recorded successfully! 📜');
      setIsDispatcherOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error logging broadcast:', err);
      setIsDispatcherOpen(false);
    }
  };

  // Copy Comma Separated Phone Numbers (for WhatsApp Broadcast List)
  const handleCopyAllPhoneNumbers = () => {
    const recipients = audienceList.filter((c) => selectedContactIds.includes(c.id));
    const phones = recipients
      .map((c) => c.phone.replace(/[^0-9]/g, ''))
      .filter((p) => p.length >= 10)
      .join(', ');

    if (!phones) {
      alert('No valid phone numbers found in selection!');
      return;
    }

    navigator.clipboard.writeText(phones);
    showToast(`Copied ${recipients.length} phone numbers to clipboard! 📋`);
  };

  // Insert tag into custom message
  const handleInsertTag = (tag) => {
    setCustomMessage((prev) => `${prev} {${tag}} `);
  };

  return (
    <Layout title="Offers & Broadcast">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-200 border border-slate-700">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase text-amber-300 mb-2 border border-white/10">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Marketing & Win-Back Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Offers & Broadcast Hub
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl">
              Naye promotional offers banayein, <strong>chhode huye students</strong> ko wapis layein, aur 1-click WhatsApp broadcast se sabko instant message bhejein.
            </p>
          </div>

          <div className="flex items-center gap-2.5 relative z-10 shrink-0">
            {canCreate && (
              <button
                onClick={() => handleOpenOfferModal()}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Offer</span>
              </button>
            )}
            <button
              onClick={fetchData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Active Offers */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Offers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.activeOffersCount}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Running campaigns</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-2xs">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          {/* Left / Ex-Students (Highlighted Target!) */}
          <div className="bg-gradient-to-br from-rose-50/70 to-white p-4 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-rose-900 uppercase tracking-wider">Left Students</p>
                <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full uppercase">
                  Win-Back
                </span>
              </div>
              <p className="text-2xl font-black text-rose-700 mt-1">{stats.leftStudentsCount}</p>
              <p className="text-[11px] text-rose-600 font-bold mt-0.5">Chhode huye members</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-2xs">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          {/* Active Students */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Students</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.activeStudentsCount}</p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Currently studying</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Demo Visitors / Inquiries */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inquiry Leads</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.visitorsCount}</p>
              <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Demo & walk-ins</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-2xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'offers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Active Offers & Discounts</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'offers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {offers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>📢 Smart Broadcast Hub (मैसेज प्रचार)</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Broadcast History & Logs</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {broadcastLogs.length}
            </span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: OFFERS & DISCOUNTS MANAGEMENT
        ======================================================== */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Promotional Coupons & Offer Cards
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ye offers aapke students ko discount dene aur broadcast message me attach karne ke kaam aayenge.
                </p>
              </div>

              {canCreate && (
                <Button
                  onClick={() => handleOpenOfferModal()}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create Offer
                </Button>
              )}
            </div>

            {offers.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                  <Gift className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Abhi koi Offer create nahi hai</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Aap "Comeback Discount", "Festival Dhamaka", ya "Exam Season Offer" bana sakte hain taaki chhode huye students ko wapis aakar admission lene ke liye attract kiya ja sake!
                  </p>
                </div>
                {canCreate && (
                  <Button onClick={() => handleOpenOfferModal()}>
                    + Create First Offer
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers.map((offer) => {
                  const isLeftTarget = offer.targetAudience === 'left';
                  const isExpired =
                    offer.status === 'expired' ||
                    (offer.validTill && offer.validTill < new Date().toISOString().split('T')[0]);

                  const discountDisplay =
                    offer.discountType === 'percentage'
                      ? `${offer.discountValue}% OFF`
                      : offer.discountType === 'free_days'
                      ? `+${offer.discountValue} Days Free`
                      : `₹${offer.discountValue} OFF`;

                  return (
                    <div
                      key={offer.id}
                      className="group relative bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Top banner / tags */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                              isLeftTarget
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : offer.targetAudience === 'visitors'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            <span>
                              {isLeftTarget
                                ? '🎯 Win-Back (Chhode Huye)'
                                : offer.targetAudience === 'visitors'
                                ? '👥 Demo Leads'
                                : '🌐 All Students'}
                            </span>
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isExpired
                                ? 'bg-slate-100 text-slate-500'
                                : offer.status === 'paused'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isExpired ? '🔴 Expired' : offer.status === 'paused' ? '⏸️ Paused' : '🟢 Active'}
                          </span>
                        </div>

                        {/* Title & Discount */}
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {offer.title}
                            </h4>
                            <span className="text-lg font-black text-indigo-700 shrink-0 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                              {discountDisplay}
                            </span>
                          </div>
                          {offer.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {offer.description}
                            </p>
                          )}
                        </div>

                        {/* Promo Code Box with 1-click copy */}
                        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 p-3 rounded-2xl border border-dashed border-indigo-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              Promo Code
                            </span>
                            <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                              {offer.code}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(offer.code);
                              showToast(`Coupon Code ${offer.code} copied!`);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Copy Promo Code"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {/* Validity & Perks */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Valid: <strong>{formatDate(offer.validFrom)}</strong> to{' '}
                              <strong>{formatDate(offer.validTill)}</strong>
                            </span>
                          </div>

                          {offer.perks && offer.perks.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {offer.perks.map((perk, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold"
                                >
                                  ✓ {perk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* 1-Click Broadcast Button */}
                        <button
                          type="button"
                          onClick={() => handleBroadcastThisOffer(offer)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
                          title="Broadcast this offer on WhatsApp"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Broadcast Offer</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenOfferModal(offer)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                              title="Edit Offer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(offer)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Offer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: SMART BROADCAST & BULK WHATSAPP HUB
        ======================================================== */}
        {activeTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Audience Selector & Message Composer (8 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Target Audience Selection */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Select Target Audience (किसे भेजना है?)
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                    {selectedContactIds.length} / {audienceList.length} Selected
                  </span>
                </div>

                {/* Audience Segment Filter Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAudienceFilter('left')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      audienceFilter === 'left'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs ring-2 ring-rose-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span className="font-extrabold">Ex-Students</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-rose-200 text-rose-700">
                      {stats.leftStudentsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceFilter('active')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      audienceFilter === 'active'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs ring-2 ring-indigo-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold">Active</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-700">
                      {stats.activeStudentsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceFilter('expired')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      audienceFilter === 'expired'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs ring-2 ring-amber-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold">Expired</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-amber-200 text-amber-700">
                      Due
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceFilter('visitors')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      audienceFilter === 'visitors'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-2xs ring-2 ring-purple-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span className="font-extrabold">Visitors</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-700">
                      {stats.visitorsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceFilter('all')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      audienceFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="font-extrabold">All Total</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                      {students.length + visitors.length}
                    </span>
                  </button>
                </div>

                {/* Search & Bulk Select Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search recipient by name or mobile..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedContactIds(audienceList.map((c) => c.id))}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedContactIds([])}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Audience Preview List (Scrollable) */}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {audienceList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No contacts found in this filter.
                    </div>
                  ) : (
                    audienceList.map((contact) => {
                      const isChecked = selectedContactIds.includes(contact.id);
                      return (
                        <label
                          key={contact.id}
                          className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-white transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedContactIds((prev) => [...prev, contact.id]);
                                } else {
                                  setSelectedContactIds((prev) => prev.filter((id) => id !== contact.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                {contact.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                📞 {contact.phone || 'No phone'} • {contact.detail}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                              contact.category === 'left'
                                ? 'bg-rose-100 text-rose-700'
                                : contact.category === 'visitor'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {contact.type}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Message Composer */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Compose WhatsApp Broadcast Message
                    </h3>
                  </div>
                </div>

                {/* Attach Offer Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link Active Offer (ऑफर चुनें - कोड व डिस्काउंट स्वतः जुड़ेंगे):
                  </label>
                  <select
                    value={selectedOfferId}
                    onChange={(e) => {
                      const offId = e.target.value;
                      setSelectedOfferId(offId);
                      const chosen = offers.find((o) => o.id === offId);
                      if (chosen) {
                        const discountStr =
                          chosen.discountType === 'percentage'
                            ? `${chosen.discountValue}% OFF`
                            : chosen.discountType === 'free_days'
                            ? `+${chosen.discountValue} Days Free`
                            : `₹${chosen.discountValue} Flat Discount`;

                        setCustomMessage((prev) =>
                          prev
                            .replace(/{offer_title}/g, chosen.title)
                            .replace(/{discount}/g, discountStr)
                            .replace(/{code}/g, chosen.code)
                            .replace(/{valid_till}/g, formatDate(chosen.validTill))
                        );
                        showToast(`Linked Offer "${chosen.title}"!`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- No specific offer (General message / choose from below) --</option>
                    {offers.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.title} ({off.code} — {off.discountValue}
                        {off.discountType === 'percentage' ? '%' : '₹'} off)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pre-made Templates Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quick Templates (तैयार टेम्पलेट चुनें):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setCustomMessage(tmpl.text);
                          showToast(`Loaded "${tmpl.name}" template!`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Message Content (WhatsApp Formatted):
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {customMessage.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your WhatsApp message..."
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Dynamic Placeholder Tag Pills */}
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Click to insert dynamic variable tags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['name', 'offer_title', 'discount', 'code', 'valid_till', 'library_name', 'library_phone', 'phone'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleInsertTag(tag)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer border border-indigo-200"
                        >
                          +{`{${tag}}`}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleCopyAllPhoneNumbers}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copy all phone numbers for WhatsApp Business app broadcast list"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All {selectedContactIds.length} Phone Numbers</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartBroadcast}
                    disabled={selectedContactIds.length === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Launch WhatsApp Broadcast Queue ({selectedContactIds.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live WhatsApp Mobile Screen Mockup (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-xl border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                      Live WhatsApp Phone Preview
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Recipient View
                  </span>
                </div>

                {/* Realistic WhatsApp Chat Device */}
                <div className="bg-[#EFEAE2] rounded-2xl overflow-hidden border border-slate-700 shadow-inner text-slate-900">
                  {/* WhatsApp Top Chat Header */}
                  <div className="bg-[#075E54] text-white p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-black text-xs">
                      SP
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{libraryName}</p>
                      <p className="text-[10px] text-emerald-200">Online</p>
                    </div>
                  </div>

                  {/* Chat Message Area */}
                  <div className="p-3.5 space-y-2 min-h-[320px] max-h-[460px] overflow-y-auto flex flex-col justify-end bg-[radial-gradient(#d1d7db_1px,transparent_1px)] [background-size:16px_16px]">
                    {/* Chat Bubble */}
                    <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-md border border-black/5 max-w-[95%] space-y-1.5 self-start text-xs leading-relaxed text-slate-800">
                      <div className="whitespace-pre-wrap font-sans">
                        {formatRecipientMessage(
                          customMessage,
                          audienceList[0] || { name: 'Rahul Sharma', phone: '9876543210' }
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 font-bold pt-1">
                        <span>
                          {new Date().toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-sky-500 font-black">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  Preview shows sample message addressed to <strong>{audienceList[0]?.name || 'Student'}</strong>.
                </p>
              </div>

              {/* Quick Strategy Tips */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Win-Back Marketing Tip</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Chhode huye students ko jab aap <strong>"Special Comeback Offer"</strong> ya <strong>"20% Flat Discount"</strong> ka message bhejte hain, toh 10 me se 3-4 students wapis rejoin karte hain!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: BROADCAST HISTORY & LOGS
        ======================================================== */}
        {activeTab === 'logs' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Previous Broadcast Campaigns</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record of all marketing campaigns, win-back offers and announcements dispatched.
                </p>
              </div>
            </div>

            {broadcastLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No previous broadcast campaigns logged yet. Launch a broadcast to see history here!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {broadcastLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">{log.title}</span>
                        {log.offerCode && (
                          <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                            Code: {log.offerCode}
                          </span>
                        )}
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                          Audience: {log.audienceFilter}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic max-w-xl truncate">
                        "{log.messageSnippet}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <span className="text-xs font-black text-emerald-600 block">
                          ✓ {log.totalSent || log.totalSelected} Sent
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {log.createdAt ? formatDate(log.createdAt) : ''} • By {log.sentBy}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          CREATE / EDIT OFFER MODAL
      ======================================================== */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setEditingOffer(null);
        }}
        title={editingOffer ? 'Edit Promotional Offer' : 'Create New Promotional Offer'}
        size="md"
      >
        <form onSubmit={handleSaveOffer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Offer Title * (e.g. Comeback Special 20% OFF)
            </label>
            <input
              type="text"
              required
              value={offerForm.title}
              onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
              placeholder="e.g. Win-Back Special / Exam Season Booster"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Promo Code *</label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Auto-Generate
                </button>
              </div>
              <input
                type="text"
                required
                value={offerForm.code}
                onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                placeholder="COMEBACK20"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-black focus:ring-2 focus:ring-indigo-500 uppercase bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
              <select
                value={offerForm.discountType}
                onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="percentage">Percentage (% OFF)</option>
                <option value="flat">Flat Cash (₹ OFF)</option>
                <option value="free_days">Free Bonus Days (+Days)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Discount Value * (Amount or %)
              </label>
              <input
                type="number"
                min="1"
                required
                value={offerForm.discountValue}
                onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value })}
                placeholder="20"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={offerForm.targetAudience}
                onChange={(e) => setOfferForm({ ...offerForm, targetAudience: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="left">🎯 Ex-Students / Left (Win Back)</option>
                <option value="all">🌐 All Students</option>
                <option value="active">🟢 Active Students</option>
                <option value="visitors">👥 Visitors / Demo Leads</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Valid From</label>
              <input
                type="date"
                value={offerForm.validFrom}
                onChange={(e) => setOfferForm({ ...offerForm, validFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Valid Till</label>
              <input
                type="date"
                value={offerForm.validTill}
                onChange={(e) => setOfferForm({ ...offerForm, validTill: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Short Description / Terms
            </label>
            <textarea
              rows={2}
              value={offerForm.description}
              onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
              placeholder="e.g. Valid on 1 Month & 3 Months membership plans. AC seat guaranteed."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={offerForm.status === 'active'}
                onChange={(e) =>
                  setOfferForm({ ...offerForm, status: e.target.checked ? 'active' : 'paused' })
                }
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span>Keep Offer Active immediately</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOfferModalOpen(false);
                  setEditingOffer(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <Button type="submit">
                {editingOffer ? 'Save Changes' : 'Create Offer'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          WHATSAPP BROADCAST DISPATCHER QUEUE MODAL
      ======================================================== */}
      <Modal
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
        title="WhatsApp Broadcast Dispatcher"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-indigo-900">
                1-by-1 Safe WhatsApp Dispatch Queue
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Browser popup blocker se bachne ke liye aap niche <strong>"Send Next"</strong> dabakar ek-ek karke WhatsApp chat khol sakte hain.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-white rounded-xl border border-indigo-200 text-indigo-800 shrink-0">
              {Object.values(queueStatus).filter((s) => s === 'sent').length} / {selectedContactIds.length} Sent
            </span>
          </div>

          {/* Recipient Queue List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white">
            {audienceList
              .filter((c) => selectedContactIds.includes(c.id))
              .map((contact, idx) => {
                const status = queueStatus[contact.id] || 'pending';
                const isCurrent = idx === currentQueueIndex;

                return (
                  <div
                    key={contact.id}
                    className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                      isCurrent ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs text-slate-900 block truncate">
                          {contact.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          📞 {contact.phone} • {contact.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          status === 'sent'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : status === 'skipped'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {status === 'sent' ? '✓ Sent' : status === 'skipped' ? 'Skipped' : '⏳ Ready'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenWhatsAppForContact(contact, true);
                          setCurrentQueueIndex(idx + 1);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Send WhatsApp Message"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Modal Bottom Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleFinishBroadcast}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Done & Save Log
            </button>

            <button
              type="button"
              onClick={handleDispatchNext}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Next Recipient & Advance →</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteOffer}
        title="Delete Promotional Offer"
        message={`Are you sure you want to delete the offer "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete Offer"
        variant="danger"
      />
    </Layout>
  );
}
