import React from 'react';
import {
  Users, TrendingUp, Wallet, AlertCircle,
  ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const StatCard = ({ label, value, subLabel, subColor = 'text-gray-500', icon: Icon, iconBg, iconColor, accent, trend }) => (
  <div className={`relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all duration-200 group ${accent || 'border-slate-200/80'}`}>
    {/* Background decoration */}
    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: iconColor?.replace('text-', '') }} />
    
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1 tracking-tight">{value}</h3>
      </div>
      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform ${iconBg} ${iconColor}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2 text-xs font-medium">
      {trend && (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold ${trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
      <span className={`truncate ${subColor}`}>{subLabel}</span>
    </div>
  </div>
);

const StatsCards = ({ stats }) => {
  const { totalStudents, seatsOccupied, totalSeats, revenue, pendingFees } = stats;
  const occupancyPct = totalSeats > 0 ? Math.round((seatsOccupied / totalSeats) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label="Active Students"
        value={totalStudents}
        subLabel="Enrolled & active"
        subColor="text-indigo-500"
        icon={Users}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      />
      <StatCard
        label="Seat Occupancy"
        value={`${seatsOccupied}/${totalSeats}`}
        subLabel={`${occupancyPct}% filled`}
        subColor={occupancyPct > 85 ? 'text-rose-500' : occupancyPct > 60 ? 'text-amber-500' : 'text-emerald-500'}
        icon={TrendingUp}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
      <StatCard
        label="Revenue (This Month)"
        value={formatCurrency(revenue)}
        subLabel="Cash, UPI & Bank"
        subColor="text-indigo-500"
        icon={Wallet}
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
      />
      <StatCard
        label="Pending Dues"
        value={pendingFees > 0 ? `${pendingFees} Students` : 'All Clear ✓'}
        subLabel={pendingFees > 0 ? 'Action required' : 'No dues pending'}
        subColor={pendingFees > 0 ? 'text-rose-500' : 'text-emerald-600'}
        icon={AlertCircle}
        iconBg={pendingFees > 0 ? 'bg-rose-50' : 'bg-emerald-50'}
        iconColor={pendingFees > 0 ? 'text-rose-600' : 'text-emerald-600'}
      />
    </div>
  );
};

export default StatsCards;
