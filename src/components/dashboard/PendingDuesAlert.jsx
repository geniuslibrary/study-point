import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageSquare, CheckCircle2, IndianRupee, ChevronRight, Phone } from 'lucide-react';
import { formatCurrency, formatReminderTime } from '../../utils/helpers';
import { updateDocument } from '../../firebase/storageService';
import { COLLECTIONS } from '../../utils/constants';
import { getActiveTemplates, renderTemplate } from '../../utils/templateHelpers';

export default function PendingDuesAlert({ pendingFees = [] }) {
  const navigate = useNavigate();
  const [remindedMap, setRemindedMap] = useState({});

  const handleSendReminder = async (item) => {
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const currentTemplates = getActiveTemplates();
    
    const message = renderTemplate(currentTemplates.feeDueReminder?.template, {
      student_name: item.studentName || 'Student',
      library_name: 'Study Point Library',
      month: item.month || currentMonth,
      amount: item.amount || 0,
      seat_number: item.seatNumber || '—',
      phone: item.phone || '',
    });

    const nowIso = new Date().toISOString();

    if (item.studentId) {
      setRemindedMap((prev) => ({ ...prev, [item.id]: nowIso }));
      try {
        await updateDocument(COLLECTIONS.STUDENTS, item.studentId, {
          lastFeeReminderAt: nowIso,
          lastFeeReminderMonth: currentMonth,
        });
      } catch (err) {
        console.error('Error saving fee reminder in dashboard:', err);
      }
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      {/* Header */}
      <div
        onClick={() => navigate('/fees', { state: { statusFilter: 'pending' } })}
        className="flex items-start justify-between mb-4 cursor-pointer group"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Urgent Fee Follow-Ups</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">Pending dues requiring recovery</p>
        </div>
        {pendingFees.length > 0 && (
          <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full group-hover:bg-rose-100 transition-colors">
            {pendingFees.length} Pending
          </span>
        )}
      </div>

      {/* List */}
      {pendingFees.length > 0 ? (
        <div className="space-y-2.5 flex-1">
          {pendingFees.slice(0, 4).map((item) => {
            const reminderTimestamp = remindedMap[item.id] || item.lastFeeReminderAt;
            const reminderInfo = formatReminderTime(reminderTimestamp);

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-rose-50/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.studentPhoto ? (
                    <img
                      src={item.studentPhoto}
                      alt={item.studentName}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.studentName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.studentName}</p>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        Seat {item.seatNumber || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-rose-600 font-extrabold">
                        Due: {formatCurrency(item.amount || 0)}
                      </p>
                      {reminderInfo ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          reminderInfo.isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{reminderInfo.isToday ? 'Sent Today' : reminderInfo.text}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">⏳ Not sent</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.phone && (
                    <button
                      onClick={() => handleSendReminder(item)}
                      className={`px-2.5 py-1.5 rounded-xl active:scale-95 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold ${
                        reminderInfo?.isToday
                          ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                      title={reminderInfo?.isToday ? "Reminder already sent today. Click to resend" : "Send WhatsApp Reminder"}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{reminderInfo?.isToday ? 'Sent ✓' : 'Remind'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/fees', { state: { statusFilter: 'pending', collectStudentId: item.studentId } })}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>Collect</span>
                  </button>
                </div>
              </div>
            );
          })}
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
          onClick={() => navigate('/fees', { state: { statusFilter: 'pending' } })}
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Open Fee Tracker</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
