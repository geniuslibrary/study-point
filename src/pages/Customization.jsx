import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import {
  Sliders,
  MessageSquare,
  LayoutDashboard,
  Shield,
  Save,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Zap,
  IndianRupee,
  Armchair,
  Users,
  BarChart3,
  Receipt,
  UserCheck,
  Check,
  Tag,
  Eye,
  Lock,
  ChevronRight,
  Send,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  ListOrdered,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Phone,
  MessageCircle,
  Layers,
  Bell,
  Smile,
  Bold,
  Italic,
  Strikethrough,
  Share2,
  X,
} from 'lucide-react';
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_STAFF_DASHBOARD_CONFIG,
  DASHBOARD_WIDGET_OPTIONS,
  DEFAULT_DASHBOARD_ORDER,
  WHATSAPP_TEMPLATES_STORAGE_KEY,
  DASHBOARD_CONFIG_STORAGE_KEY,
  DASHBOARD_ORDER_STORAGE_KEY,
  STAFF_DASHBOARD_CONFIG_STORAGE_KEY,
  renderTemplate,
  getActiveDashboardOrder,
  getActiveDashboardConfig,
  getActiveTemplates,
  getWhatsAppTemplatesStorageKey,
  getDashboardConfigStorageKey,
  getDashboardOrderStorageKey,
  TEMPLATE_CATEGORIES,
  TAG_METADATA,
  TEMPLATE_PRESETS,
} from '../utils/templateHelpers';
import { getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import { getFirestoreDocRef, getTenantItem, setTenantItem } from '../firebase/storageService';

export default function Customization() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'whatsapp' | 'staff'
  const [widgetCategory, setWidgetCategory] = useState('all');
  const [widgetViewMode, setWidgetViewMode] = useState('grid'); // 'grid' | 'order'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Dashboard Widgets Configuration & Order
  const [dashConfig, setDashConfig] = useState(DEFAULT_DASHBOARD_CONFIG);
  const [widgetOrder, setWidgetOrder] = useState(getActiveDashboardOrder());

  // 2. WhatsApp Templates Configuration
  const [templates, setTemplates] = useState(DEFAULT_WHATSAPP_TEMPLATES);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('expiryReminder');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    title: '',
    category: 'custom',
    badge: '💬 Custom',
    description: '',
    template: '',
  });
  const [testPhone, setTestPhone] = useState(getTenantItem('library_phone', ''));
  const templateTextareaRef = useRef(null);

  // Load from LocalStorage and Firestore (tenant-scoped)
  useEffect(() => {
    const loadAllConfigs = async () => {
      // 1. LocalStorage
      try {
        setDashConfig(getActiveDashboardConfig());
        setWidgetOrder(getActiveDashboardOrder());
        setTemplates(getActiveTemplates());
      } catch (e) {
        console.error('Error reading local customization settings', e);
      }

      // 2. Firestore Cloud Sync
      try {
        const docSnap = await getDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'customization'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.dashboardConfig) {
            setDashConfig({ ...DEFAULT_DASHBOARD_CONFIG, ...data.dashboardConfig });
            localStorage.setItem(getDashboardConfigStorageKey(), JSON.stringify(data.dashboardConfig));
          }
          if (data.dashboardWidgetOrder && Array.isArray(data.dashboardWidgetOrder)) {
            setWidgetOrder(data.dashboardWidgetOrder);
            localStorage.setItem(getDashboardOrderStorageKey(), JSON.stringify(data.dashboardWidgetOrder));
          }
          if (data.whatsappTemplates) {
            setTemplates({ ...DEFAULT_WHATSAPP_TEMPLATES, ...data.whatsappTemplates });
            localStorage.setItem(getWhatsAppTemplatesStorageKey(), JSON.stringify(data.whatsappTemplates));
          }
        }
      } catch (e) {
        console.error('Error fetching cloud customization doc:', e);
      }
    };

    loadAllConfigs();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Save and sync Dashboard Config immediately
  const updateAndSaveDashConfig = async (newConfig, showToastMsg = false) => {
    setDashConfig(newConfig);
    try {
      localStorage.setItem(getDashboardConfigStorageKey(), JSON.stringify(newConfig));
      await setDoc(
        getFirestoreDocRef(COLLECTIONS.SETTINGS, 'customization'),
        { dashboardConfig: newConfig },
        { merge: true }
      );
      if (showToastMsg) {
        showToast('Dashboard widgets settings saved! ✨');
      }
    } catch (e) {
      console.warn('Sync error:', e);
      if (showToastMsg) {
        showToast('Saved locally!');
      }
    }
  };

  // Save and sync Dashboard Widget Sequence Order
  const updateAndSaveWidgetOrder = async (newOrder, showToastMsg = false) => {
    setWidgetOrder(newOrder);
    try {
      localStorage.setItem(getDashboardOrderStorageKey(), JSON.stringify(newOrder));
      await setDoc(
        getFirestoreDocRef(COLLECTIONS.SETTINGS, 'customization'),
        { dashboardWidgetOrder: newOrder },
        { merge: true }
      );
      if (showToastMsg) {
        showToast('Widgets sequence order updated! ✨');
      }
    } catch (e) {
      console.warn('Order sync error:', e);
      if (showToastMsg) {
        showToast('Order saved locally!');
      }
    }
  };

  // Move single step up (-1) or down (+1)
  const moveWidget = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= widgetOrder.length) return;
    const newOrder = [...widgetOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    updateAndSaveWidgetOrder(newOrder, false);
  };

  // Move directly to top (#1) or bottom (#end)
  const moveToEdge = (index, toTop = true) => {
    const newOrder = [...widgetOrder];
    const [movedItem] = newOrder.splice(index, 1);
    if (toTop) {
      newOrder.unshift(movedItem);
    } else {
      newOrder.push(movedItem);
    }
    updateAndSaveWidgetOrder(newOrder, false);
  };

  // Desktop Drag-and-drop
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    const newOrder = [...widgetOrder];
    const [movedItem] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, movedItem);
    updateAndSaveWidgetOrder(newOrder, false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Explicit Save Button
  const handleSaveDashboardConfig = async () => {
    setIsSaving(true);
    await updateAndSaveDashConfig(dashConfig, false);
    await updateAndSaveWidgetOrder(widgetOrder, true);
    setIsSaving(false);
  };

  // Save WhatsApp Templates
  const handleSaveWhatsAppTemplates = async (newTemplates = templates) => {
    setIsSaving(true);
    try {
      localStorage.setItem(getWhatsAppTemplatesStorageKey(), JSON.stringify(newTemplates));
      await setDoc(
        getFirestoreDocRef(COLLECTIONS.SETTINGS, 'customization'),
        { whatsappTemplates: newTemplates },
        { merge: true }
      );
      showToast('WhatsApp templates saved successfully! ✨');
    } catch (e) {
      console.error(e);
      showToast('Saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to insert dynamic tag into active template at cursor position
  const insertTag = (tag) => {
    const textarea = templateTextareaRef.current;
    const tagText = `{${tag}}`;
    const currentTpl = templates[selectedTemplateKey]?.template || '';

    if (!textarea) {
      setTemplates((prev) => ({
        ...prev,
        [selectedTemplateKey]: {
          ...prev[selectedTemplateKey],
          template: currentTpl + ' ' + tagText,
        },
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = currentTpl.substring(0, start) + tagText + currentTpl.substring(end);

    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateKey]: {
        ...prev[selectedTemplateKey],
        template: newText,
      },
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagText.length, start + tagText.length);
    }, 0);
  };

  // Helper to insert emoji or arbitrary text at cursor
  const insertTextAtCursor = (insertStr) => {
    const textarea = templateTextareaRef.current;
    const currentTpl = templates[selectedTemplateKey]?.template || '';

    if (!textarea) {
      setTemplates((prev) => ({
        ...prev,
        [selectedTemplateKey]: {
          ...prev[selectedTemplateKey],
          template: currentTpl + insertStr,
        },
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = currentTpl.substring(0, start) + insertStr + currentTpl.substring(end);

    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateKey]: {
        ...prev[selectedTemplateKey],
        template: newText,
      },
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertStr.length, start + insertStr.length);
    }, 0);
  };

  // Wrap selected text with markdown character (e.g. *bold*, _italic_)
  const wrapSelectionWith = (wrapper) => {
    const textarea = templateTextareaRef.current;
    const currentTpl = templates[selectedTemplateKey]?.template || '';
    if (!textarea) {
      insertTextAtCursor(`${wrapper}text${wrapper}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentTpl.substring(start, end);
    const replacement = selected ? `${wrapper}${selected}${wrapper}` : `${wrapper}text${wrapper}`;
    const newText = currentTpl.substring(0, start) + replacement + currentTpl.substring(end);

    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateKey]: {
        ...prev[selectedTemplateKey],
        template: newText,
      },
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
    }, 0);
  };

  // 1-Click apply pre-made tone preset (Hinglish, English, Short)
  const applyPreset = (presetType) => {
    const presetsForTemplate = TEMPLATE_PRESETS[selectedTemplateKey];
    if (presetsForTemplate && presetsForTemplate[presetType]) {
      setTemplates((prev) => ({
        ...prev,
        [selectedTemplateKey]: {
          ...prev[selectedTemplateKey],
          template: presetsForTemplate[presetType],
        },
      }));
      showToast(`Applied ${presetType.toUpperCase()} preset! ✨`);
    } else {
      showToast('No preset available for this template');
    }
  };

  // Create new custom template
  const handleCreateCustomTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateForm.title.trim() || !newTemplateForm.template.trim()) {
      alert('कृपया टेम्पलेट का नाम और संदेश भरें');
      return;
    }
    const newKey = `custom_${Date.now()}`;
    const newTemplate = {
      title: newTemplateForm.title.trim(),
      category: newTemplateForm.category || 'custom',
      badge: '💬 Custom',
      description: newTemplateForm.description.trim() || 'Custom created template',
      template: newTemplateForm.template.trim(),
      availableTags: [
        'student_name',
        'library_name',
        'phone',
        'seat_number',
        'amount',
        'expiry_date',
        'notice_message',
      ],
      isCustom: true,
    };
    const updated = { ...templates, [newKey]: newTemplate };
    setTemplates(updated);
    setSelectedTemplateKey(newKey);
    setShowNewTemplateModal(false);
    setNewTemplateForm({
      title: '',
      category: 'custom',
      badge: '💬 Custom',
      description: '',
      template: '',
    });
    await handleSaveWhatsAppTemplates(updated);
    showToast('Naya Custom Template ban gaya! 🎉');
  };

  // Delete custom template
  const handleDeleteCustomTemplate = async (key) => {
    if (!window.confirm(`Delete "${templates[key]?.title}" template permanently?`)) return;
    const updated = { ...templates };
    delete updated[key];
    setTemplates(updated);
    setSelectedTemplateKey(Object.keys(updated)[0] || 'expiryReminder');
    await handleSaveWhatsAppTemplates(updated);
    showToast('Custom template deleted! 🗑️');
  };

  // Copy preview message text to clipboard
  const handleCopyMessageText = () => {
    if (!currentPreviewText) return;
    navigator.clipboard.writeText(currentPreviewText);
    showToast('Message text copied! 📋');
  };

  // Send live test message to own WhatsApp
  const handleSendTestWhatsApp = () => {
    let target = testPhone ? testPhone.replace(/[^0-9]/g, '') : '';
    if (!target) {
      const promptPhone = window.prompt(
        'WhatsApp Test message bhejne ke liye 10-digit number daalein:',
        '91'
      );
      if (!promptPhone) return;
      target = promptPhone.replace(/[^0-9]/g, '');
    }
    const phoneWithCountry = target.length === 10 ? `91${target}` : target;
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(
      currentPreviewText
    )}`;
    window.open(waUrl, '_blank');
  };

  // Reset single template to default
  const handleResetTemplate = (key) => {
    if (!DEFAULT_WHATSAPP_TEMPLATES[key]) return;
    if (!window.confirm(`Reset "${DEFAULT_WHATSAPP_TEMPLATES[key].title}" to default message?`)) return;
    const updated = {
      ...templates,
      [key]: {
        ...templates[key],
        template: DEFAULT_WHATSAPP_TEMPLATES[key].template,
      },
    };
    setTemplates(updated);
    handleSaveWhatsAppTemplates(updated);
  };

  // Sample data for live WhatsApp preview
  const samplePreviewData = {
    student_name: 'Rahul Sharma',
    library_name: getTenantItem('library_name', 'Study Point Library'),
    seat_number: '14',
    shift: 'Full Day (6 AM - 11 PM)',
    status_phrase: 'कल समाप्त हो रहा है',
    expiry_date: '18/09/2026',
    month: 'September 2026',
    amount: '800',
    receipt_no: 'REC-982143',
    plan_name: '10 Days Crash / Monthly',
    validity_period: '01/09/2026 to 18/09/2026',
    payment_mode: 'UPI (GPay)',
    extra_days: '10',
    new_expiry_date: '28/09/2026',
    fee_amount: '400',
    notice_message: 'कल लाइब्रेरी सुबह 8:00 AM से दोपहर 2:00 PM तक खुली रहेगी।',
    phone: '9876543210',
  };

  // Render preview text
  const currentPreviewText = renderTemplate(
    templates[selectedTemplateKey]?.template || '',
    samplePreviewData
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 sm:p-7 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/20 flex items-center justify-center text-indigo-300">
                <Sliders className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Customization Center</h1>
              <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full uppercase">
                Owner Control
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-xl">
              Personalize your dashboard widgets, craft custom WhatsApp messages, and control staff portal access.
            </p>
          </div>

          {toastMessage && (
            <div className="relative z-10 bg-emerald-500/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* 3 Main Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>🎛️ Dashboard Widgets</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 WhatsApp & Notifications</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD WIDGETS TOGGLES */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Dashboard Widgets Visibility</h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials' && dashConfig[w.id] !== false).length} / {DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials').length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose which widgets and analytics appear on your main dashboard. Toggle any card on or off.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOn = DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials').reduce(
                      (acc, k) => ({ ...acc, [k.id]: true }),
                      {}
                    );
                    updateAndSaveDashConfig(allOn, true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Enable All ({DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials').length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allOff = DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials').reduce(
                      (acc, k) => ({ ...acc, [k.id]: false }),
                      {}
                    );
                    updateAndSaveDashConfig(allOff, true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Disable All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateAndSaveDashConfig(DEFAULT_DASHBOARD_CONFIG, true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setWidgetViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    widgetViewMode === 'grid'
                      ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>🎛️ Visibility Toggles (चालू / बंद)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWidgetViewMode('order')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    widgetViewMode === 'order'
                      ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🔢 Arrange Order (क्रम बदलें / ऊपर-नीचे)</span>
                </button>
              </div>

              {widgetViewMode === 'order' && (
                <button
                  type="button"
                  onClick={() => updateAndSaveWidgetOrder(DEFAULT_DASHBOARD_ORDER, true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer transition-colors flex items-center gap-1.5 self-end sm:self-auto shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Default Order</span>
                </button>
              )}
            </div>

            {/* VIEW 1: GRID TOGGLES VIEW */}
            {widgetViewMode === 'grid' && (
              <div className="space-y-4">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { id: 'all', label: `All Widgets (${DASHBOARD_WIDGET_OPTIONS.length})` },
                    { id: 'operations', label: `⚡ Core Operations (${DASHBOARD_WIDGET_OPTIONS.filter((w) => w.category === 'operations').length})` },
                    { id: 'alerts', label: `🚨 Urgent Alerts (${DASHBOARD_WIDGET_OPTIONS.filter((w) => w.category === 'alerts').length})` },
                    { id: 'financials', label: `💰 Financials (${DASHBOARD_WIDGET_OPTIONS.filter((w) => w.category === 'financials').length})` },
                    { id: 'security', label: `🔒 Privacy (${DASHBOARD_WIDGET_OPTIONS.filter((w) => w.category === 'security').length})` },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setWidgetCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        widgetCategory === cat.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 24 Widget Toggles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DASHBOARD_WIDGET_OPTIONS.filter(
                    (w) => w.id !== 'hideFinancials' && (widgetCategory === 'all' || w.category === widgetCategory)
                  ).map((item) => {
                    const isEnabled = dashConfig[item.id] !== false;
                    const categoryBadgeColors = {
                      operations: 'bg-blue-50 text-blue-700 border-blue-100',
                      financials: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      students: 'bg-purple-50 text-purple-700 border-purple-100',
                      facilities: 'bg-amber-50 text-amber-700 border-amber-100',
                    };
                    return (
                      <div
                        key={item.id}
                        onClick={() => updateAndSaveDashConfig({ ...dashConfig, [item.id]: !isEnabled }, false)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between group ${
                          isEnabled
                            ? 'bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-85'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors block">
                                {item.label}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                    categoryBadgeColors[item.category] || 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {item.category}
                                </span>
                                {item.span === 'full' && (
                                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                    Full Width
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 mt-0.5 ${
                                isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{item.desc}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-bold">
                          <span className={isEnabled ? 'text-indigo-600' : 'text-slate-400'}>
                            {isEnabled ? '✓ Visible on Main Dashboard' : '✕ Hidden from Dashboard'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: ARRANGE ORDER VIEW */}
            {widgetViewMode === 'order' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-indigo-900 font-medium">
                    💡 <span className="font-bold">Tips:</span> Jo widget sabse upar (#1, #2) hoga wo Dashboard par sabse pehle dikhega. Buttons (⬆️ / ⬇️) se order badal sakte hain ya direct Top (🔝) par bhej sakte hain.
                  </div>
                  <span className="text-[11px] font-black text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200 shrink-0 self-start sm:self-auto">
                    {widgetOrder.filter((id) => dashConfig[id] === true && DASHBOARD_WIDGET_OPTIONS.some((o) => o.id === id)).length} Active / {DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials').length} Total
                  </span>
                </div>

                <div className="space-y-2">
                  {widgetOrder.map((widgetId, index) => {
                    const item = DASHBOARD_WIDGET_OPTIONS.find((o) => o.id === widgetId);
                    if (!item || item.id === 'hideFinancials') return null;
                    const isEnabled = dashConfig[item.id] === true;
                    const categoryBadgeColors = {
                      operations: 'bg-blue-50 text-blue-700 border-blue-100',
                      financials: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      students: 'bg-purple-50 text-purple-700 border-purple-100',
                      facilities: 'bg-amber-50 text-amber-700 border-amber-100',
                    };

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none ${
                          isEnabled
                            ? 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-300'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        {/* Left: Drag handle, Rank position #, Label & Category */}
                        <div className="flex items-center gap-3">
                          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-100 shrink-0">
                            <GripVertical className="w-5 h-5" />
                          </div>

                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            #{index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{item.label}</span>
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                  categoryBadgeColors[item.category] || 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {item.category}
                              </span>
                              {item.span === 'full' && (
                                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  Full Width
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                          </div>
                        </div>

                        {/* Right: Re-order controls and toggle switch */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {/* Priority Action Buttons */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {/* Move to Top */}
                            <button
                              type="button"
                              title="Send to Top (#1)"
                              disabled={index === 0}
                              onClick={() => moveToEdge(index, true)}
                              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
                            >
                              <ChevronsUp className="w-4 h-4" />
                            </button>

                            {/* Move Up */}
                            <button
                              type="button"
                              title="Move Up 1 step"
                              disabled={index === 0}
                              onClick={() => moveWidget(index, -1)}
                              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              title="Move Down 1 step"
                              disabled={index === widgetOrder.length - 1}
                              onClick={() => moveWidget(index, 1)}
                              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>

                            {/* Move to Bottom */}
                            <button
                              type="button"
                              title="Send to Bottom"
                              disabled={index === widgetOrder.length - 1}
                              onClick={() => moveToEdge(index, false)}
                              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
                            >
                              <ChevronsDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quick Enable/Disable toggle */}
                          <div
                            onClick={() => updateAndSaveDashConfig({ ...dashConfig, [item.id]: !isEnabled }, false)}
                            className="flex items-center gap-2 cursor-pointer ml-1"
                          >
                            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                              {isEnabled ? 'Active' : 'Off'}
                            </span>
                            <div
                              className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                                isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveDashboardConfig()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Dashboard Settings'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: WHATSAPP TEMPLATES CUSTOMIZER */}
        {/* ========================================================= */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            {/* Top Filter and Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const isActive = templateCategory === cat.id;
                  const count =
                    cat.id === 'all'
                      ? Object.keys(templates).length
                      : Object.values(templates).filter((t) => t.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTemplateCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Template Button */}
              <button
                type="button"
                onClick={() => setShowNewTemplateModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold border border-indigo-200 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Custom Template</span>
              </button>
            </div>

            {/* 3-Stage Expiry & Notification Integration Guide Banner */}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                  🔔
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    3-Stage Automated Expiry & Overdue Notifications
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Fee Tracker aur Notification Center ab in 3 customizable templates se synchronized hain:
                    <br className="hidden sm:inline" />
                    <strong>⏳ 1. Ending Soon (0-3 Din):</strong> Advance renewal reminder •{' '}
                    <strong>⚠️ 2. Expired (1-2 Din Grace):</strong> Seat protection notice •{' '}
                    <strong>🚨 3. Overdue ({'>'}2 Din):</strong> Final notice & Left option.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateKey('endingSoonReminder')}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  ⏳ Ending Soon
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplateKey('expiredReminder')}
                  className="px-2.5 py-1.5 bg-white hover:bg-orange-100 text-orange-900 border border-orange-300 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  ⚠️ Expired
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplateKey('overdueReminder')}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  🚨 Overdue
                </button>
              </div>
            </div>

            {/* Main Studio Grid: Left Editor & Right WhatsApp Mockup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Template Selector & Editor (7 Cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                {/* Template Selection Cards */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      Select Template to Edit (टेम्पलेट चुनें)
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total {Object.keys(templates).length} Templates
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {Object.keys(templates)
                      .filter((key) => {
                        if (templateCategory === 'all') return true;
                        return templates[key]?.category === templateCategory;
                      })
                      .map((key) => {
                        const tpl = templates[key];
                        const isSelected = selectedTemplateKey === key;
                        const isCustom = tpl.isCustom || key.startsWith('custom_');

                        return (
                          <div
                            key={key}
                            onClick={() => setSelectedTemplateKey(key)}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between relative group ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-extrabold text-xs line-clamp-2 leading-snug">
                                {tpl.title?.split('(')[0] || key}
                              </span>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomTemplate(key);
                                  }}
                                  className={`p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity ${
                                    isSelected ? 'hover:bg-indigo-700 text-rose-200' : 'hover:bg-rose-50 text-rose-600'
                                  }`}
                                  title="Delete Custom Template"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                              >
                                {tpl.badge || '💬 Template'}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Active Template Editor Box */}
                {templates[selectedTemplateKey] && (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    {/* Header & Reset */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900">
                            {templates[selectedTemplateKey].title}
                          </h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {templates[selectedTemplateKey].badge || '💬 Template'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {templates[selectedTemplateKey].description}
                        </p>
                      </div>

                      {DEFAULT_WHATSAPP_TEMPLATES[selectedTemplateKey] && (
                        <button
                          type="button"
                          onClick={() => handleResetTemplate(selectedTemplateKey)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                          title="Reset this template to original default text"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    {/* 1-Click Tone Presets (If Available) */}
                    {TEMPLATE_PRESETS[selectedTemplateKey] && (
                      <div className="p-3 bg-gradient-to-r from-amber-50/70 to-indigo-50/70 rounded-2xl border border-amber-200/60 space-y-1.5">
                        <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>1-Click Tone Presets (तुरंत तैयार भाषा चुनें):</span>
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => applyPreset('hinglish')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 text-xs font-bold text-slate-800 shadow-2xs hover:bg-indigo-50 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>🇮🇳 Hinglish / Hindi</span>
                            <span className="text-[10px] text-slate-400 font-normal">(विनम्र)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('english')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 text-xs font-bold text-slate-800 shadow-2xs hover:bg-indigo-50 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>💼 Professional English</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('short')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 text-xs font-bold text-slate-800 shadow-2xs hover:bg-indigo-50 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>⚡ Short & Direct SMS</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Emoji & Formatting Toolbar */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Format:
                        </span>
                        <button
                          type="button"
                          onClick={() => wrapSelectionWith('*')}
                          className="p-1 px-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black text-xs border border-slate-200 transition-colors"
                          title="Bold (*text*)"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => wrapSelectionWith('_')}
                          className="p-1 px-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 italic font-serif text-xs border border-slate-200 transition-colors"
                          title="Italic (_text_)"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => wrapSelectionWith('~')}
                          className="p-1 px-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 line-through text-xs border border-slate-200 transition-colors"
                          title="Strikethrough (~text~)"
                        >
                          S
                        </button>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Emojis:
                        </span>
                        {['🙏', '✨', '📚', '💺', '⏰', '📅', '💰', '🧾', '⚠️', '✅', '🎉', '📢', '📞', '📍', '🎯', '💡'].map(
                          (emo) => (
                            <button
                              key={emo}
                              type="button"
                              onClick={() => insertTextAtCursor(emo)}
                              className="p-1 rounded-md hover:bg-white text-xs transition-transform hover:scale-125 cursor-pointer"
                              title={`Insert ${emo}`}
                            >
                              {emo}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Dynamic Tags Pill Bar with Hindi labels */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Click Tag to Insert into Message (वेरिएबल जोड़ें):</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(templates[selectedTemplateKey].availableTags || []).map((tag) => {
                          const meta = TAG_METADATA[tag] || { label: tag };
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => insertTag(tag)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs hover:scale-102"
                              title={`Insert {${tag}} - ${meta.label}`}
                            >
                              <span className="font-mono font-bold">+{`{${tag}}`}</span>
                              <span className="text-[10px] text-indigo-500 font-normal">({meta.label})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Textarea */}
                    <div>
                      <textarea
                        ref={templateTextareaRef}
                        rows={8}
                        value={templates[selectedTemplateKey].template}
                        onChange={(e) =>
                          setTemplates({
                            ...templates,
                            [selectedTemplateKey]: {
                              ...templates[selectedTemplateKey],
                              template: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed shadow-inner"
                        placeholder="Write WhatsApp message text here..."
                      />
                    </div>

                    {/* Footer / Save Bar */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Supports emojis, line breaks & WhatsApp markdown (*bold*, _italic_)
                      </span>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveWhatsAppTemplates()}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving...' : 'Save WhatsApp Template'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live WhatsApp Smartphone Mockup (5 Cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Live WhatsApp Preview</h4>
                        <p className="text-[11px] text-slate-400">Exact look on student's WhatsApp</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  </div>

                  {/* Smartphone Styled Wrapper */}
                  <div className="rounded-3xl bg-slate-900 p-2.5 shadow-xl border-4 border-slate-800">
                    {/* WhatsApp Top Header Bar */}
                    <div className="bg-[#075E54] text-white px-3.5 py-2.5 rounded-t-2xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs relative">
                          RS
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#075E54] absolute bottom-0 right-0" />
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">Rahul Sharma</p>
                          <p className="text-[10px] text-emerald-200 leading-tight">online • Seat #14</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-emerald-100 text-xs">
                        <Phone className="w-3.5 h-3.5" />
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* WhatsApp Chat Wall Background */}
                    <div
                      className="bg-[#E5DDD5] p-3.5 min-h-[300px] max-h-[380px] overflow-y-auto flex flex-col justify-end rounded-b-2xl shadow-inner relative"
                      style={{
                        backgroundImage:
                          'radial-gradient(#cfc6bc 1px, transparent 1px), radial-gradient(#cfc6bc 1px, #E5DDD5 1px)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 10px 10px',
                      }}
                    >
                      {/* Chat message bubble with WhatsApp green bubble style */}
                      <div className="bg-[#DCF8C6] text-slate-900 rounded-2xl rounded-tr-xs p-3.5 shadow-xs max-w-[92%] self-end space-y-1 text-xs sm:text-[13px] leading-relaxed relative border border-emerald-200/50 animate-in fade-in zoom-in-95">
                        <p className="whitespace-pre-wrap font-sans text-slate-900 select-text">
                          {currentPreviewText}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-1">
                          <span>10:45 AM</span>
                          <span className="text-blue-500 font-black tracking-tighter">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMessageText}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendTestWhatsApp}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Send this exact message to your own WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Test on WhatsApp</span>
                    </button>
                  </div>

                  {/* Sample Context Legend */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <span>Live Mockup Values:</span>
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                      <p>• Student: <span className="font-semibold text-slate-900">Rahul Sharma</span></p>
                      <p>• Seat: <span className="font-semibold text-slate-900">#14 (Full Day)</span></p>
                      <p>• Amount: <span className="font-semibold text-slate-900">₹800</span></p>
                      <p>• Expiry: <span className="font-semibold text-slate-900">18/09/2026</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Template Creation Modal */}
            {showNewTemplateModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Create Custom WhatsApp Template
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewTemplateModal(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateCustomTemplate} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Template Title (टेम्पलेट का नाम) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTemplateForm.title}
                        onChange={(e) =>
                          setNewTemplateForm({ ...newTemplateForm, title: e.target.value })
                        }
                        placeholder="e.g. Sunday Test Reminder, Silent Zone Notice"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Category (श्रेणी)
                        </label>
                        <select
                          value={newTemplateForm.category}
                          onChange={(e) =>
                            setNewTemplateForm({ ...newTemplateForm, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                        >
                          <option value="fees">Fees & Expiry</option>
                          <option value="admissions">Admissions</option>
                          <option value="leads">Demo & Leads</option>
                          <option value="notices">Notices</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Badge Label
                        </label>
                        <input
                          type="text"
                          value={newTemplateForm.badge}
                          onChange={(e) =>
                            setNewTemplateForm({ ...newTemplateForm, badge: e.target.value })
                          }
                          placeholder="e.g. 📢 Test, ⚠️ Alert"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Short Description (विवरण)
                      </label>
                      <input
                        type="text"
                        value={newTemplateForm.description}
                        onChange={(e) =>
                          setNewTemplateForm({ ...newTemplateForm, description: e.target.value })
                        }
                        placeholder="e.g. Sent on Saturdays for mock test"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Message Content (मैसेज) *
                      </label>
                      <textarea
                        rows={5}
                        required
                        value={newTemplateForm.template}
                        onChange={(e) =>
                          setNewTemplateForm({ ...newTemplateForm, template: e.target.value })
                        }
                        placeholder="नमस्ते {student_name} जी, ..."
                        className="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Available tags: {'{student_name}'}, {'{library_name}'}, {'{seat_number}'}, {'{phone}'}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowNewTemplateModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                      >
                        Save Custom Template
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
