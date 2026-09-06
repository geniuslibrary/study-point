import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Armchair,
  MessageSquare,
  UserPlus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { formatReminderTime } from '../../utils/helpers';
import { updateDocument } from '../../firebase/storageService';
import { COLLECTIONS } from '../../utils/constants';

export default function LiveDemoTracker({
  visitors = [],
  seats = [],
  sections = [],
  onUpdate,
}) {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to calculate demo status
  const getDemoInfo = (v) => {
    if (v.status === 'converted') {
      return { type: 'converted', label: 'Converted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (v.status === 'not_interested') {
      return { type: 'not_interested', label: 'Not Interested', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
    if (v.purpose === 'inquiry' || v.status === 'inquiry') {
      return { type: 'inquiry', label: 'Inquiry', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }

    const endD = new Date(v.endDate || v.startDate || today);
    endD.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((endD - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      return { type: 'active', diffDays, label: `🟢 ${diffDays} Days Left`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    } else if (diffDays === 1) {
      return { type: 'active', diffDays, label: '🟢 1 Day Left', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    } else if (diffDays === 0) {
      return { type: 'today', diffDays, label: '🟡 Ending Today!', color: 'bg-amber-50 text-amber-700 border-amber-200 font-bold animate-pulse' };
    } else {
      return { type: 'expired', diffDays, label: `🔴 Expired (${Math.abs(diffDays)}d ago)`, color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
    }
  };

  // Metrics counts
  const metrics = visitors.reduce(
    (acc, v) => {
      const info = getDemoInfo(v);
      if (v.status === 'not_interested') return acc;
      if (v.status === 'converted') acc.converted++;
      else if (info.type === 'today') acc.endingToday++;
      else if (info.type === 'expired') acc.expired++;
      else if (info.type === 'active') acc.active++;
      else if (info.type === 'inquiry') acc.inquiry++;
      return acc;
    },
    { active: 0, endingToday: 0, expired: 0, converted: 0, inquiry: 0 }
  );

  // Filter relevant items for dashboard: show active demos, ending today, expired, inquiries (max 4)
  const displayVisitors = visitors
    .filter((v) => v.status !== 'not_interested' && v.status !== 'converted')
    .map((v) => ({ ...v, info: getDemoInfo(v) }))
    .sort((a, b) => {
      // Priority: Ending Today -> Expired -> Active -> Inquiry
      const priority = { today: 1, expired: 2, active: 3, inquiry: 4 };
      const prioA = priority[a.info.type] || 5;
      const prioB = priority[b.info.type] || 5;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    })
    .slice(0, 4);

  const getSeatNumber = (seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    return seat ? `#${seat.seatNumber}` : '—';
  };

  const getSectionName = (secId) => {
    const sec = sections.find((s) => s.id === secId);
    return sec ? sec.name : '';
  };

  // 1-Click WhatsApp Follow-up
  const handleWhatsApp = async (visitor) => {
    const cleanPhone = (visitor.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let message = '';
    if (visitor.info?.type === 'today') {
      message = `Namaste ${visitor.name || 'Student'} ji 🙏\n\nStudy Point Library me aaj aapke Free Demo Trial ka aakhiri din hai. Kaisi lagi aapko library aur study space?\n\nRegular seat confirm karwane ke liye humse sampark karein. Dhanyawad! ✨\nStudy Point Library`;
    } else if (visitor.info?.type === 'expired') {
      message = `Namaste ${visitor.name || 'Student'} ji 🙏\n\nStudy Point Library me aapka demo trial complete ho chuka hai. Agar aap apni regular seat confirm karna chahte hain toh batayein, seats limited hain. Dhanyawad! ✨\nStudy Point Library`;
    } else {
      message = `Namaste ${visitor.name || 'Student'} ji 🙏\n\nStudy Point Library me aapka free demo trial chal raha hai. Kisi bhi suvidha ya query ke liye humse sampark karein! ✨\nStudy Point Library`;
    }

    const nowIso = new Date().toISOString();
    try {
      await updateDocument(COLLECTIONS.VISITORS, visitor.id, {
        lastReminderAt: nowIso,
      });
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error('Error recording reminder in dashboard:', e);
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 1-Click Convert to Regular Student
  const handleAdmit = (visitor) => {
    navigate('/students', {
      state: {
        convertVisitor: {
          visitorId: visitor.id,
          name: visitor.name || '',
          phone: visitor.phone || '',
          sectionId: visitor.sectionId || '',
          seatId: visitor.seatId || '',
          shift: visitor.shift || 'full_day',
          notes: visitor.notes ? `Converted from Demo. Notes: ${visitor.notes}` : 'Converted from Demo',
        },
      },
    });
  };

  // Mark Not Interested (Instant Free Seat)
  const handleNotInterested = async (visitor) => {
    if (!window.confirm(`Mark "${visitor.name}" as Not Interested? Their trial seat will be freed immediately.`)) return;
    try {
      await updateDocument(COLLECTIONS.VISITORS, visitor.id, {
        status: 'not_interested',
        seatId: '',
        notInterestedAt: new Date().toISOString(),
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error marking not interested:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Visit & Demo Tracker</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Active trial students & prospective leads</p>
          </div>

          <button
            onClick={() => navigate('/visitors')}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            <span>Open Manager</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Micro Pill Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
            <p className="text-xs text-emerald-700 font-bold">Active</p>
            <p className="text-sm sm:text-base font-black text-emerald-900">{metrics.active}</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
            <p className="text-xs text-amber-700 font-bold">Ending Today</p>
            <p className="text-sm sm:text-base font-black text-amber-900">{metrics.endingToday}</p>
          </div>
          <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 text-center">
            <p className="text-xs text-rose-700 font-bold">Expired</p>
            <p className="text-sm sm:text-base font-black text-rose-900">{metrics.expired}</p>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
            <p className="text-xs text-indigo-700 font-bold">Converted</p>
            <p className="text-sm sm:text-base font-black text-indigo-900">{metrics.converted}</p>
          </div>
        </div>

        {/* Visitor Cards List */}
        {displayVisitors.length > 0 ? (
          <div className="space-y-2.5">
            {displayVisitors.map((item) => {
              const reminderInfo = formatReminderTime(item.lastReminderAt);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/30 transition-colors"
                >
                  {/* Left Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${item.info.color}`}>
                        {item.info.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      {item.seatId ? (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Armchair className="w-3 h-3 text-indigo-600" />
                          <span>Seat {getSeatNumber(item.seatId)}</span>
                          <span className="text-slate-400 font-normal">({getSectionName(item.sectionId)})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No Seat</span>
                      )}
                      <span>•</span>
                      <span className="capitalize">{item.shift?.replace('_', ' ') || 'Full Day'}</span>
                      <span>•</span>
                      <a href={`tel:${item.phone}`} className="hover:text-blue-600 font-medium">
                        {item.phone}
                      </a>
                    </div>

                    {reminderInfo && (
                      <div className="mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${
                          reminderInfo.isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{reminderInfo.text}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                    {/* WhatsApp */}
                    {item.phone && (
                      <button
                        onClick={() => handleWhatsApp(item)}
                        className={`p-2 rounded-xl text-white transition-all shadow-xs cursor-pointer active:scale-95 ${
                          reminderInfo?.isToday
                            ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                        title={reminderInfo?.isToday ? 'Follow-up already sent today. Click to resend' : 'Send WhatsApp Follow-up'}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Admit */}
                    <button
                      onClick={() => handleAdmit(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      title="Convert to Regular Student"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Admit</span>
                    </button>

                    {/* Not Interested (Clean Text Button, No Logo) */}
                    <button
                      onClick={() => handleNotInterested(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300/80 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                      title="Mark Not Interested (Frees trial seat immediately)"
                    >
                      Not Interested
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No active demo trials today</p>
            <p className="text-xs text-slate-400 mt-0.5">New inquiries and demo requests will appear here.</p>
            <button
              onClick={() => navigate('/visitors')}
              className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              + Add New Visit / Demo
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Free demo seats auto-synced</span>
        <button
          onClick={() => navigate('/visitors')}
          className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View All ({visitors.length})</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
