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
} from 'lucide-react';
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_STAFF_DASHBOARD_CONFIG,
  DASHBOARD_WIDGET_OPTIONS,
  WHATSAPP_TEMPLATES_STORAGE_KEY,
  DASHBOARD_CONFIG_STORAGE_KEY,
  STAFF_DASHBOARD_CONFIG_STORAGE_KEY,
  renderTemplate,
} from '../utils/templateHelpers';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';

export default function Customization() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'whatsapp' | 'staff'
  const [widgetCategory, setWidgetCategory] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Dashboard Widgets Configuration
  const [dashConfig, setDashConfig] = useState(DEFAULT_DASHBOARD_CONFIG);

  // 2. WhatsApp Templates Configuration
  const [templates, setTemplates] = useState(DEFAULT_WHATSAPP_TEMPLATES);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('expiryReminder');
  const templateTextareaRef = useRef(null);

  // Load from LocalStorage and Firestore
  useEffect(() => {
    const loadAllConfigs = async () => {
      // 1. LocalStorage
      try {
        const localDash = localStorage.getItem(DASHBOARD_CONFIG_STORAGE_KEY);
        if (localDash) setDashConfig({ ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(localDash) });

        const localWA = localStorage.getItem(WHATSAPP_TEMPLATES_STORAGE_KEY);
        if (localWA) setTemplates({ ...DEFAULT_WHATSAPP_TEMPLATES, ...JSON.parse(localWA) });
      } catch (e) {
        console.error('Error reading local customization settings', e);
      }

      // 2. Firestore Cloud Sync
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'customization'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.dashboardConfig) {
            setDashConfig({ ...DEFAULT_DASHBOARD_CONFIG, ...data.dashboardConfig });
            localStorage.setItem(DASHBOARD_CONFIG_STORAGE_KEY, JSON.stringify(data.dashboardConfig));
          }
          if (data.whatsappTemplates) {
            setTemplates({ ...DEFAULT_WHATSAPP_TEMPLATES, ...data.whatsappTemplates });
            localStorage.setItem(WHATSAPP_TEMPLATES_STORAGE_KEY, JSON.stringify(data.whatsappTemplates));
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

  // Save Dashboard Config
  const handleSaveDashboardConfig = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(DASHBOARD_CONFIG_STORAGE_KEY, JSON.stringify(dashConfig));
      await setDoc(
        doc(db, COLLECTIONS.SETTINGS, 'customization'),
        { dashboardConfig: dashConfig },
        { merge: true }
      );
      showToast('Dashboard widgets settings saved! ✨');
    } catch (e) {
      console.error(e);
      showToast('Saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  // Save WhatsApp Templates
  const handleSaveWhatsAppTemplates = async (newTemplates = templates) => {
    setIsSaving(true);
    try {
      localStorage.setItem(WHATSAPP_TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
      await setDoc(
        doc(db, COLLECTIONS.SETTINGS, 'customization'),
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

  // Reset single template to default
  const handleResetTemplate = (key) => {
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
    library_name: localStorage.getItem('studypoint_library_name') || 'Study Point Library',
    seat_number: '12',
    shift: 'Full Day',
    status_phrase: 'कल समाप्त हो रहा है',
    expiry_date: '08/09/2026',
    month: 'September 2026',
    amount: '800',
    receipt_no: 'REC-982143',
    plan_name: 'Standard Monthly Plan',
    validity_period: '01/09/2026 to 01/10/2026',
    payment_mode: 'UPI',
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
            <span>💬 WhatsApp Templates</span>
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
                    {DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials' && dashConfig[w.id] !== false).length} / 24 Active
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
                    setDashConfig(allOn);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Enable All (24)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allOff = DASHBOARD_WIDGET_OPTIONS.filter((w) => w.id !== 'hideFinancials').reduce(
                      (acc, k) => ({ ...acc, [k.id]: false }),
                      {}
                    );
                    setDashConfig(allOff);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Disable All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDashConfig(DEFAULT_DASHBOARD_CONFIG);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: 'all', label: 'All Widgets (24)' },
                { id: 'operations', label: '⚡ Core Operations (6)' },
                { id: 'financials', label: '💰 Financials & Target (7)' },
                { id: 'students', label: '👥 Students & Retention (7)' },
                { id: 'facilities', label: '🏢 Facilities & Team (4)' },
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
                    onClick={() => setDashConfig((prev) => ({ ...prev, [item.id]: !isEnabled }))}
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
                          <span
                            className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              categoryBadgeColors[item.category] || 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {item.category}
                          </span>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Template Selector & Editor (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">WhatsApp Message Templates</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a template to customize its wording. You can use dynamic tags like {'{student_name}'} and {'{amount}'}.
                </p>
              </div>

              {/* Template Select Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.keys(templates).map((key) => {
                  const tpl = templates[key];
                  const isSelected = selectedTemplateKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplateKey(key)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{tpl.title?.split('(')[0] || key}</span>
                      <span className={`text-[10px] mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {key === 'expiryReminder' ? '⏳ Expiry' : key === 'feeDueReminder' ? '💸 Pending Fee' : key.includes('demo') ? '🎯 Demo' : '🧾 Receipt'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Template Editor Box */}
              {templates[selectedTemplateKey] && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {templates[selectedTemplateKey].title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {templates[selectedTemplateKey].description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetTemplate(selectedTemplateKey)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reset this template to original default text"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Dynamic Tags Pill Bar */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-600" />
                      <span>Click Tag to Insert into Message:</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(templates[selectedTemplateKey].availableTags || []).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertTag(tag)}
                          className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-mono font-bold transition-all cursor-pointer"
                          title={`Insert {${tag}}`}
                        >
                          +{`{${tag}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      ref={templateTextareaRef}
                      rows={7}
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
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
                      placeholder="Write WhatsApp message text here..."
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Supports emojis, new lines & bold (*text*)
                    </span>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveWhatsAppTemplates()}
                      className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live WhatsApp Chat Bubble Preview (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Live WhatsApp Preview</h4>
                    <p className="text-[11px] text-slate-400">How student will see this on phone</p>
                  </div>
                </div>

                {/* WhatsApp Phone Mockup Container */}
                <div className="rounded-2xl bg-[#E5DDD5] p-3.5 border border-slate-300 shadow-inner min-h-[300px] flex flex-col justify-end">
                  {/* Chat message bubble */}
                  <div className="bg-[#DCF8C6] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs max-w-[92%] self-end space-y-1 text-xs sm:text-[13px] leading-relaxed relative">
                    <p className="whitespace-pre-wrap font-sans text-slate-800">{currentPreviewText}</p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-1">
                      <span>10:45 AM</span>
                      <span className="text-blue-500 font-black">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Context Legend */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <p className="font-bold text-slate-700 mb-1">Preview Values Applied:</p>
                <p>• Student: <span className="font-semibold text-slate-800">Rahul Sharma</span></p>
                <p>• Seat: <span className="font-semibold text-slate-800">Seat #12 (Full Day)</span></p>
                <p>• Amount: <span className="font-semibold text-slate-800">₹800</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
