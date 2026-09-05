import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ArrowUpRight, ChevronRight, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

const RecentActivity = ({ fees = [] }) => {
  const navigate = useNavigate();
  const recentFees = (fees || []).slice(0, 6);

  const getPaymentModeBadge = (mode) => {
    switch (mode) {
      case 'upi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span>📱</span> UPI / QR
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            <span>🏦</span> Bank
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span>💵</span> Cash
          </span>
        );
    }
  };

  return (
    <div className="p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Recent Fee Collections</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">Real-time payment audit stream</p>
        </div>
        <button
          onClick={() => navigate('/fees')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer self-start sm:self-auto"
        >
          <span>View All Transactions</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recentFees.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {recentFees.map((fee) => {
            const studentName = fee.studentName || 'Student';
            const initials = studentName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={fee.id}
                onClick={() => navigate('/fees')}
                className="py-3 sm:py-3.5 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                      {studentName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(fee.paidDate || fee.date || fee.createdAt)}
                      </span>
                      <span>•</span>
                      <span>Month: {fee.month || 'Current'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Payment Mode & Amount */}
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-right">
                  <div className="hidden sm:block">
                    {getPaymentModeBadge(fee.paymentMode)}
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black text-emerald-600">
                      +{formatCurrency(fee.amount || 0)}
                    </span>
                    <div className="block sm:hidden mt-0.5">
                      {getPaymentModeBadge(fee.paymentMode)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No fee collections recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Fee payments will appear here as soon as they are collected.</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
