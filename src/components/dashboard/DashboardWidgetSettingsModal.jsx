import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  Sliders,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Sparkles,
  BarChart3,
  Layers,
  Wallet,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  DASHBOARD_WIDGET_OPTIONS,
  DEFAULT_DASHBOARD_WIDGETS,
  setCustomDashboardConfig,
} from '../../utils/templateHelpers';

export default function DashboardWidgetSettingsModal({
  isOpen,
  onClose,
  currentConfig = {},
  onSave,
}) {
  const [config, setConfig] = useState({ ...currentConfig });
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const categories = [
    { id: 'all', label: 'All Widgets (सभी)', icon: Layers },
    { id: 'operations', label: '⚡ Operations (दैनिक)', icon: Sparkles },
    { id: 'alerts', label: '🚨 Urgent Alerts (फॉलो-अप)', icon: Users },
    { id: 'financials', label: '💵 Financials (कमाई/खर्च)', icon: Wallet },
    { id: 'security', label: '🔒 Privacy (सुरक्षा)', icon: ShieldCheck },
  ];

  const handleToggle = (id) => {
    setConfig((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEnableAll = () => {
    const updated = { ...config };
    DASHBOARD_WIDGET_OPTIONS.forEach((w) => {
      if (w.id !== 'hideFinancials') updated[w.id] = true;
    });
    setConfig(updated);
  };

  const handleResetDefault = () => {
    setConfig({ ...DEFAULT_DASHBOARD_WIDGETS });
  };

  const handleApply = () => {
    setCustomDashboardConfig(config);
    if (onSave) onSave(config);
    onClose();
  };

  const filteredWidgets = DASHBOARD_WIDGET_OPTIONS.filter((w) => {
    const matchesTab = activeTab === 'all' || w.category === activeTab;
    const matchesSearch =
      !search ||
      w.label.toLowerCase().includes(search.toLowerCase()) ||
      (w.desc && w.desc.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const enabledCount = DASHBOARD_WIDGET_OPTIONS.filter(
    (w) => w.id !== 'hideFinancials' && config[w.id]
  ).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dashboard Widgets Visibility & Display (डैशबोर्ड विजेट्स)"
      size="xl"
    >
      <div className="space-y-4">
        {/* Top Summary Bar & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 rounded-2xl border border-indigo-100/80">
          <div>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>
                Active Widgets: <strong className="text-indigo-700">{enabledCount}</strong> of{' '}
                {DASHBOARD_WIDGET_OPTIONS.length - 1} Enabled
              </span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              अपनी पसंद के ग्राफिकल चार्ट्स और विजेट्स को ऑन/ऑफ करें।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 transition shadow-2xs cursor-pointer active:scale-95"
            >
              Enable All (सब चालू)
            </button>
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Search & Category Tabs */}
        <div className="space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search widget by name (e.g. Footfall, Peak Hours, Speedometer, Collection)..."
              className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {filteredWidgets.map((w) => {
            const isEnabled = Boolean(config[w.id]);
            return (
              <div
                key={w.id}
                onClick={() => handleToggle(w.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isEnabled
                    ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-500/20 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {w.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{w.desc}</p>
                </div>

                {/* Custom Toggle Pill */}
                <button
                  type="button"
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
            Changes apply to your dashboard instantly.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="secondary" size="sm" onClick={onClose} type="button" className="flex-1 sm:flex-none justify-center">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply} type="button" className="flex-1 sm:flex-none justify-center">
              Save & Apply Widgets (लागू करें)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
