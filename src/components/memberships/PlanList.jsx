import React from 'react';
import {
  Pencil,
  Trash2,
  Power,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Zap,
  Sparkles,
  Calendar,
  CalendarDays,
  Users,
  Check,
  Tag,
  Flame,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function PlanList({ plans, studentCounts, onEdit, onDelete, onToggle, shifts = [] }) {
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 max-w-lg mx-auto">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CalendarDays className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">No Membership Plans Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Add your first day-based or monthly membership plan to get started.
        </p>
      </div>
    );
  }

  const getShiftBadge = (shiftType) => {
    if (!shiftType || shiftType === 'all') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-200/90 shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>All Shifts (सभी शिफ्ट्स)</span>
        </span>
      );
    }

    // Check in shifts prop or stored shifts
    const allShifts = shifts.length > 0 ? shifts : [];
    const custom = allShifts.find((s) => s.id === shiftType || s.label === shiftType);

    if (custom) {
      let Icon = Clock;
      let colorClass = 'bg-blue-50 text-blue-900 border-blue-200/90';
      let iconColor = 'text-blue-600';

      const lowerId = (custom.id || '').toLowerCase();
      const lowerLabel = (custom.label || '').toLowerCase();

      if (lowerId === 'full_day' || lowerLabel.includes('full day') || lowerLabel.includes('पूरा')) {
        Icon = Sun;
        colorClass = 'bg-amber-50 text-amber-900 border-amber-200/90';
        iconColor = 'text-amber-600';
      } else if (
        lowerId === 'first_half' ||
        lowerId === 'morning' ||
        lowerLabel.includes('morning') ||
        lowerLabel.includes('सुबह') ||
        lowerLabel.includes('1st')
      ) {
        Icon = Sunrise;
        colorClass = 'bg-emerald-50 text-emerald-900 border-emerald-200/90';
        iconColor = 'text-emerald-600';
      } else if (
        lowerId === 'second_half' ||
        lowerId === 'evening' ||
        lowerLabel.includes('evening') ||
        lowerLabel.includes('शाम') ||
        lowerLabel.includes('2nd')
      ) {
        Icon = Sunset;
        colorClass = 'bg-purple-50 text-purple-900 border-purple-200/90';
        iconColor = 'text-purple-600';
      }

      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border shadow-2xs ${colorClass}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span>{custom.label} {custom.timing ? `(${custom.timing})` : ''}</span>
        </span>
      );
    }

    switch (shiftType) {
      case 'full_day':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            <span>Full Day (6 AM - 11 PM)</span>
          </span>
        );
      case 'first_half':
      case 'morning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200/90 shadow-2xs">
            <Sunrise className="w-3.5 h-3.5 text-emerald-600" />
            <span>1st Shift / Morning (6 AM - 2 PM)</span>
          </span>
        );
      case 'second_half':
      case 'evening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-purple-50 text-purple-900 border border-purple-200/90 shadow-2xs">
            <Sunset className="w-3.5 h-3.5 text-purple-600" />
            <span>2nd Shift / Evening (2 PM - 11 PM)</span>
          </span>
        );
      case 'night':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-900 border border-rose-200/90 shadow-2xs">
            <Moon className="w-3.5 h-3.5 text-rose-600" />
            <span>Night Shift (10 PM - 6 AM)</span>
          </span>
        );
      case '24_hours':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-teal-50 text-teal-900 border border-teal-200/90 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>24 Hours / 24x7</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-900 border border-blue-200/90 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{shiftType}</span>
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {plans.map((plan) => {
        const studentCount = studentCounts[plan.id] || 0;
        const isDays = plan.durationUnit === 'days' || Boolean(plan.durationDays && !plan.durationMonths);
        const durationDisplay = isDays
          ? `${plan.durationDays || 10} Days (दिन)`
          : `${plan.durationMonths || 1} ${plan.durationMonths === 1 ? 'Month' : 'Months'}`;

        const priceNum = Number(plan.price) || 0;
        const origPriceNum = Number(plan.originalPrice) || 0;
        const hasDiscount = plan.isOffer && origPriceNum > priceNum;
        const discountAmount = hasDiscount ? origPriceNum - priceNum : 0;
        const discountPercent = hasDiscount ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100) : 0;

        const effectiveDays = isDays ? Number(plan.durationDays) || 1 : (Number(plan.durationMonths) || 1) * 30;
        const perDayCost = effectiveDays > 0 && priceNum > 0 ? Math.round(priceNum / effectiveDays) : null;

        const featuresList =
          Array.isArray(plan.features) && plan.features.length > 0
            ? plan.features
            : ['Reserved Seat Access', 'High-Speed WiFi', 'AC & Power Backup'];

        return (
          <div
            key={plan.id}
            className={`relative rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
              !plan.isActive
                ? 'bg-slate-50/70 border-slate-200 opacity-80'
                : plan.isOffer
                ? 'bg-white border-amber-300 shadow-sm hover:shadow-md hover:border-amber-400'
                : isDays
                ? 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md'
                : 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md'
            }`}
          >
            {/* Top Color Accent Ribbon */}
            <div
              className={`h-2 w-full ${
                !plan.isActive
                  ? 'bg-slate-300'
                  : plan.isOffer
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : isDays
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-500'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600'
              }`}
            />

            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                {/* Header Row: Duration Type Pill & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isDays
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                    }`}
                  >
                    {isDays ? <CalendarDays className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                    <span>{durationDisplay}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {plan.isOffer && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-xs animate-pulse">
                        <Flame className="w-3 h-3" />
                        <span>{discountPercent > 0 ? `${discountPercent}% OFF` : 'OFFER'}</span>
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                        plan.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          plan.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {plan.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Plan Title */}
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  {plan.name}
                </h3>

                {/* Shift Suitability Tag */}
                <div className="mt-3">{getShiftBadge(plan.shiftType)}</div>

                {/* Pricing Showcase */}
                <div className="my-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(priceNum)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm font-bold text-slate-400 line-through">
                          {formatCurrency(origPriceNum)}
                        </span>
                      )}
                    </div>
                    {perDayCost !== null && (
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        ⚡ ~₹{perDayCost}/day
                      </span>
                    )}
                  </div>

                  {hasDiscount && (
                    <p className="text-xs text-emerald-700 font-extrabold mt-1.5 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Save ₹{discountAmount} with this offer</span>
                    </p>
                  )}
                </div>

                {/* Features & Perks List */}
                <div className="space-y-1.5 mb-4">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Included Benefits
                  </p>
                  {featuresList.slice(0, 3).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                  {featuresList.length > 3 && (
                    <p className="text-[11px] text-slate-400 font-bold pl-6">
                      +{featuresList.length - 3} more perks
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Actions & Student Count Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[11px]">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-slate-900">{studentCount}</strong> Enrolled
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Toggle Active / Pause */}
                  <button
                    onClick={() => onToggle(plan)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      plan.isActive
                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50'
                    }`}
                    title={plan.isActive ? 'Pause Plan (अस्थायी रोकें)' : 'Activate Plan (सक्रिय करें)'}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => onEdit(plan)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                    title="Edit Plan Details"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(plan)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

