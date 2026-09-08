import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  Calendar,
  CalendarDays,
  Clock,
  IndianRupee,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Zap,
  CheckCircle2,
  Tag,
  Flame,
  Check,
  Plus,
} from 'lucide-react';
import { getStoredShifts, getStoredAddons } from '../../utils/helpers';

export default function PlanForm({ isOpen, onClose, onSubmit, editData, shifts = [], addons = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    durationUnit: 'months', // 'months' | 'days'
    durationMonths: '1',
    durationDays: '10',
    price: '',
    originalPrice: '',
    shiftType: 'all',
    isOffer: false,
    isActive: true,
    features: [],
    description: '',
  });

  const [shiftsList, setShiftsList] = useState([]);
  const [addonsList, setAddonsList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const activeShifts = shifts && shifts.length > 0 ? shifts : getStoredShifts();
      setShiftsList(activeShifts);

      const activeAddons = addons && addons.length > 0 ? addons : getStoredAddons();
      setAddonsList(activeAddons);
    }
  }, [isOpen, shifts, addons]);

  // Only display 'All Shifts' + the EXACT shifts configured in Settings
  const shiftOptions = React.useMemo(() => {
    const list = [
      {
        id: 'all',
        label: 'All Shifts (सभी शिफ्ट्स)',
        timing: 'Full & Half Day Compatible',
        icon: Zap,
        color: 'indigo',
      },
    ];

    (shiftsList || []).forEach((s) => {
      const lowerId = (s.id || '').toLowerCase();
      const lowerLabel = (s.label || '').toLowerCase();

      let Icon = Clock;
      let color = 'blue';

      if (lowerId === 'full_day' || lowerLabel.includes('full day') || lowerLabel.includes('पूरा')) {
        Icon = Sun;
        color = 'amber';
      } else if (
        lowerId === 'first_half' ||
        lowerId === 'morning' ||
        lowerLabel.includes('morning') ||
        lowerLabel.includes('सुबह') ||
        lowerLabel.includes('1st')
      ) {
        Icon = Sunrise;
        color = 'emerald';
      } else if (
        lowerId === 'second_half' ||
        lowerId === 'evening' ||
        lowerLabel.includes('evening') ||
        lowerLabel.includes('शाम') ||
        lowerLabel.includes('2nd')
      ) {
        Icon = Sunset;
        color = 'purple';
      } else if (lowerId === 'night' || lowerLabel.includes('night') || lowerLabel.includes('रात')) {
        Icon = Moon;
        color = 'rose';
      } else if (lowerLabel.includes('24') || lowerLabel.includes('round')) {
        Icon = Sparkles;
        color = 'teal';
      }

      let timingDisplay = s.timing;
      if (!timingDisplay && s.start && s.end) {
        timingDisplay = `${s.start} - ${s.end}`;
      }
      if (!timingDisplay) {
        timingDisplay = s.short || 'Configured Shift Slot';
      }

      list.push({
        id: s.id || s.label,
        label: s.label || s.short || 'Shift Slot',
        timing: timingDisplay,
        icon: Icon,
        color: color,
      });
    });

    return list;
  }, [shiftsList]);

  // Only display the features/facilities configured in Settings (+ any previously saved perks on the plan)
  const availableFeatures = React.useMemo(() => {
    const names = [];
    (addonsList || []).forEach((addon) => {
      const n = typeof addon === 'string' ? addon.trim() : addon?.name?.trim();
      if (n && !names.includes(n)) {
        names.push(n);
      }
    });

    // Also include any features saved earlier in editData (excluding legacy dummy perks)
    (formData.features || []).forEach((f) => {
      const trimmed = f?.trim();
      if (
        trimmed &&
        !names.includes(trimmed) &&
        !['Reserved Seat Access', 'Pin-Drop Silence Zone', 'AC & Power Backup', 'Fully Air Conditioned', 'Power Backup & RO Water', 'Locker Facility Support'].includes(trimmed)
      ) {
        names.push(trimmed);
      }
    });

    return names;
  }, [addonsList, formData.features]);

  useEffect(() => {
    if (editData) {
      // Smart detection for days vs months
      const isDays =
        editData.durationUnit === 'days' ||
        Boolean(editData.durationDays && (!editData.durationMonths || Number(editData.durationMonths) === 0)) ||
        Boolean(editData.name && /day|दिन/i.test(editData.name));

      setFormData({
        name: editData.name || '',
        durationUnit: isDays ? 'days' : 'months',
        durationMonths:
          editData.durationMonths !== undefined && editData.durationMonths !== null && Number(editData.durationMonths) > 0
            ? String(editData.durationMonths)
            : '1',
        durationDays:
          editData.durationDays !== undefined && editData.durationDays !== null && Number(editData.durationDays) > 0
            ? String(editData.durationDays)
            : '10',
        price: editData.price !== undefined && editData.price !== null ? String(editData.price) : '',
        originalPrice:
          editData.originalPrice !== undefined && editData.originalPrice !== null ? String(editData.originalPrice) : '',
        shiftType: editData.shiftType === 'morning' ? 'first_half' : editData.shiftType === 'evening' ? 'second_half' : editData.shiftType || 'all',
        isOffer: !!editData.isOffer,
        isActive: editData.isActive !== false,
        features: Array.isArray(editData.features)
          ? editData.features.filter(
              (f) =>
                f &&
                !['Reserved Seat Access', 'Pin-Drop Silence Zone', 'AC & Power Backup', 'Fully Air Conditioned', 'Power Backup & RO Water', 'Locker Facility Support'].includes(f)
            )
          : [],
        description: editData.description || '',
      });
    } else {
      setFormData({
        name: '',
        durationUnit: 'months',
        durationMonths: '1',
        durationDays: '10',
        price: '',
        originalPrice: '',
        shiftType: 'all',
        isOffer: false,
        isActive: true,
        features: [],
        description: '',
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleFeature = (perk) => {
    setFormData((prev) => {
      const exists = prev.features.includes(perk);
      return {
        ...prev,
        features: exists ? prev.features.filter((f) => f !== perk) : [...prev.features, perk],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const isDays = formData.durationUnit === 'days';
    const parsedDays = isDays ? Number(formData.durationDays) || 10 : null;
    const parsedMonths = isDays ? 0 : Number(formData.durationMonths) || 1;

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      durationUnit: formData.durationUnit,
      durationDays: parsedDays,
      durationMonths: parsedMonths,
      price: formData.price === '' ? 0 : Number(formData.price) || 0,
      originalPrice: formData.originalPrice === '' ? 0 : Number(formData.originalPrice) || 0,
      features: formData.features,
    });
  };

  const priceNum = Number(formData.price) || 0;
  const origPriceNum = Number(formData.originalPrice) || 0;
  const isDays = formData.durationUnit === 'days';
  const effectiveDays = isDays ? Number(formData.durationDays) || 1 : (Number(formData.durationMonths) || 1) * 30;
  const perDayCost = effectiveDays > 0 && priceNum > 0 ? Math.round(priceNum / effectiveDays) : null;
  const savingsAmount = origPriceNum > priceNum ? origPriceNum - priceNum : 0;
  const discountPercent = origPriceNum > priceNum ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100) : 0;

  const quickNamePresets = [
    { name: '10 Days Exam Crash', unit: 'days', days: '10', price: '400' },
    { name: '15 Days Intensive', unit: 'days', days: '15', price: '550' },
    { name: '1 Month Full Day', unit: 'months', months: '1', shift: 'full_day', price: '900' },
    { name: '1 Month 1st Shift (Morning)', unit: 'months', months: '1', shift: 'first_half', price: '600' },
    { name: '1 Month 2nd Shift (Evening)', unit: 'months', months: '1', shift: 'second_half', price: '600' },
    { name: '3 Months Booster Plan', unit: 'months', months: '3', price: '2400', isOffer: true, origPrice: '2700' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Membership Plan' : 'Create New Membership Plan'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quick Suggestion Pills for New Plans */}
        {!editData && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick Presets (क्विक प्लान टेम्पलेट)</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickNamePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => {
                      let targetShift = prev.shiftType;
                      if (preset.shift) {
                        const matched = shiftOptions.find(
                          (opt) => opt.id === preset.shift || opt.id.toLowerCase().includes(preset.shift.toLowerCase())
                        );
                        if (matched) targetShift = matched.id;
                      }
                      return {
                        ...prev,
                        name: preset.name,
                        durationUnit: preset.unit,
                        durationDays: preset.days || prev.durationDays,
                        durationMonths: preset.months || prev.durationMonths,
                        shiftType: targetShift,
                        price: preset.price || prev.price,
                        isOffer: !!preset.isOffer,
                        originalPrice: preset.origPrice || '',
                      };
                    });
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plan Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Plan Name (प्लान का नाम) *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. 10 Days Exam Crash, 1 Month Full Day, 3 Months Booster"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
          />
        </div>

        {/* Duration Unit & Value */}
        <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span>Duration Type & Validity (अवधि प्रकार) *</span>
            </label>
            <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
              {isDays ? '🗓️ Days Based (दिन)' : '📅 Monthly Based (महीने)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Toggle Buttons */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, durationUnit: 'months' }))}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isDays
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Months (महीने)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, durationUnit: 'days' }))}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDays
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Days (दिन)</span>
              </button>
            </div>

            {/* Duration Input */}
            <div>
              <div className="relative">
                <input
                  type="number"
                  name={isDays ? 'durationDays' : 'durationMonths'}
                  min="1"
                  required
                  value={isDays ? formData.durationDays : formData.durationMonths}
                  onChange={handleChange}
                  placeholder={isDays ? '10' : '1'}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs pr-14"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  {isDays ? 'Days' : 'Months'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Duration Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Select:</span>
            {isDays ? (
              [5, 7, 10, 15, 20, 25, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, durationDays: String(d) }))}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    Number(formData.durationDays) === d
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {d} Days
                </button>
              ))
            ) : (
              [1, 2, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, durationMonths: String(m) }))}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    Number(formData.durationMonths) === m
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {m === 12 ? '1 Year' : `${m} Month${m > 1 ? 's' : ''}`}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Shift Suitability - Full Shifts Available */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Shift Suitability (लागू शिफ्ट्स) *</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              Select which shift can take this plan
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {shiftOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = formData.shiftType === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setFormData((prev) => ({ ...prev, shiftType: opt.id }))}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-bold leading-tight ${
                        isSelected ? 'text-indigo-950 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {opt.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-tight">
                      {opt.timing}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Section & Live Breakdown */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>Pricing & Fee Details (फीस राशि) *</span>
            </label>
            {perDayCost !== null && (
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                ⚡ Approx. ₹{perDayCost} / day
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plan Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Final Plan Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  min="0"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 400 or 900"
                  className="w-full pl-8 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-black text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Special Offer Toggle */}
            <div className="flex flex-col justify-end">
              <label
                htmlFor="isOffer"
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  formData.isOffer
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  name="isOffer"
                  id="isOffer"
                  checked={formData.isOffer}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="text-xs font-bold leading-tight">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Special Promotional Offer</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                    Show discount & original cut price
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Original Price if Offer */}
          {formData.isOffer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Original Regular Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="originalPrice"
                    min="0"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    className="w-full pl-8 pr-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {savingsAmount > 0 && (
                <div className="flex items-center">
                  <div className="w-full bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Student Savings: ₹{savingsAmount}</span>
                    </span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                      {discountPercent}% OFF
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features & Perks Included */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Features & Perks Included (सुविधाएं)</span>
            </span>
            <span className="text-[10px] text-slate-400">Click to toggle included facility</span>
          </label>

          {availableFeatures.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              No facilities configured in Settings yet. You can configure facilities in Settings or type below.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableFeatures.map((perk) => {
                const active = formData.features.includes(perk);
                return (
                  <button
                    key={perk}
                    type="button"
                    onClick={() => toggleFeature(perk)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs ring-1 ring-emerald-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {active ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{perk}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Plan Status Active Switch */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <h5 className="text-xs font-bold text-slate-800">Plan Status (सक्रिय स्थिति)</h5>
            <p className="text-[11px] text-slate-500">
              {formData.isActive
                ? 'Active — Available in admission & membership dropdowns'
                : 'Inactive — Hidden from new admissions'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              formData.isActive
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {formData.isActive ? '🟢 Active' : '⏸️ Inactive'}
          </button>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200/80">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {editData ? 'Update Plan' : 'Save Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

