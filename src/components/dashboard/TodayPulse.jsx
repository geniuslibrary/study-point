import React from 'react';
import { IndianRupee, UserPlus, TrendingDown, Armchair, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function TodayPulse({ todayCollection = 0, todayFeesCount = 0, todayAdmissions = 0, todayExpense = 0, emptySeats = 0 }) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-900/40 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header title */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-200">
            Today's Live Pulse (आज का हिसाब)
          </h3>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-300 border border-white/10">
          Realtime
        </span>
      </div>

      {/* 4 Micro Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {/* Today's Fee Collection */}
        <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3.5 transition-all">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1">
            <span>Today Collected</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-white">{formatCurrency(todayCollection)}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
            {todayFeesCount} payments received
          </p>
        </div>

        {/* Today's Admissions */}
        <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3.5 transition-all">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1">
            <span>New Admissions</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-white">{todayAdmissions} Students</p>
          <p className="text-[11px] text-indigo-300 font-semibold mt-0.5">
            Enrolled today
          </p>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3.5 transition-all">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1">
            <span>Today's Expenses</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-white">{formatCurrency(todayExpense)}</p>
          <p className="text-[11px] text-rose-300 font-semibold mt-0.5">
            Daily out-flow
          </p>
        </div>

        {/* Available Empty Seats */}
        <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3.5 transition-all">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1">
            <span>Empty Seats</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Armchair className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-white">{emptySeats} Seats</p>
          <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
            Ready for admission
          </p>
        </div>
      </div>
    </div>
  );
}
