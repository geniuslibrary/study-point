import React from 'react';
import { Users, Armchair, IndianRupee, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const StatsCards = ({ stats }) => {
  const {
    totalStudents = 0,
    seatsOccupied = 0,
    totalSeats = 0,
    revenue = 0,
    pendingFees = 0,
  } = stats || {};

  const occupancyRate = totalSeats ? Math.round((seatsOccupied / totalSeats) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Students Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Students</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {totalStudents}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100/60 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
            <TrendingUp className="w-3 h-3" /> Live
          </span>
          <span>Full & Half Day shifts</span>
        </div>
      </div>

      {/* 2. Seat Occupancy Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seat Occupancy</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {seatsOccupied}
              </h3>
              <span className="text-sm font-semibold text-slate-400">/ {totalSeats}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100/60 group-hover:scale-110 transition-transform">
            <Armchair className="w-6 h-6" />
          </div>
        </div>

        {/* Occupancy Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-slate-500">Occupancy</span>
            <span className={occupancyRate > 80 ? 'text-amber-600' : 'text-emerald-600'}>
              {occupancyRate}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                occupancyRate > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Monthly Revenue Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue (This Month)</p>
            <h3 className="text-3xl font-extrabold text-indigo-900 mt-1 tracking-tight">
              {formatCurrency(revenue)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100/60 group-hover:scale-110 transition-transform">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1 text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
            <Sparkles className="w-3 h-3 text-amber-500" /> Collected
          </span>
          <span>Cash, UPI & Bank fees</span>
        </div>
      </div>

      {/* 4. Pending Dues Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Dues</p>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-1 tracking-tight">
              {pendingFees > 0 ? `${pendingFees} Students` : '₹0 Due'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs border border-rose-100/60 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold ${
              pendingFees > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {pendingFees > 0 ? 'Action Needed' : 'All Clear'}
          </span>
          <span className="truncate">{pendingFees > 0 ? 'Send 3-day WhatsApp reminders' : 'No dues pending'}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
