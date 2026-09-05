import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageSquare, CheckCircle2, IndianRupee, ChevronRight, Phone } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function PendingDuesAlert({ pendingFees = [] }) {
  const navigate = useNavigate();

  const handleSendReminder = (item) => {
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const message = `Namaste ${item.studentName || 'Student'} ji 🙏\n\nYeh ek reminder hai Study Point Library ki taraf se. Aapki is mahine ki fees ₹${item.amount || 0} pending hai.\n\nKripya samay par jama karwayein taaki aapki seat reserve rahe.\n\nDhanyawad! ✨\nStudy Point Library`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Urgent Fee Follow-Ups</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">Pending dues requiring recovery</p>
        </div>
        {pendingFees.length > 0 && (
          <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
            {pendingFees.length} Pending
          </span>
        )}
      </div>

      {/* List */}
      {pendingFees.length > 0 ? (
        <div className="space-y-2.5 flex-1">
          {pendingFees.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-rose-50/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 text-sm truncate">{item.studentName}</p>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    Seat {item.seatNumber || '—'}
                  </span>
                </div>
                <p className="text-xs text-rose-600 font-extrabold mt-0.5">
                  Due: {formatCurrency(item.amount || 0)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.phone && (
                  <button
                    onClick={() => handleSendReminder(item)}
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
                    title="Send WhatsApp Reminder"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => navigate('/fees')}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Collect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">100% Fees Collected! 🎉</p>
          <p className="text-xs text-slate-400 mt-0.5">No pending student dues for this month.</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Auto dues synced monthly</span>
        <button
          onClick={() => navigate('/fees')}
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Open Fee Tracker</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
