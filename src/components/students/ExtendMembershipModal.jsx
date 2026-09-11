import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  CalendarPlus,
} from 'lucide-react';
import { formatDate, getMembershipRemainingDays } from '../../utils/helpers';

export default function ExtendMembershipModal({
  isOpen,
  onClose,
  student,
  seat,
  plan,
  onExtend,
  loading = false,
}) {
  const [extraDays, setExtraDays] = useState(10);
  const [feeAmount, setFeeAmount] = useState('');
  const [isFreeExtension, setIsFreeExtension] = useState(false);
  const [notes, setNotes] = useState('');

  // Compute daily rate and suggested fee based on plan
  const planPrice = Number(student?.planPrice || plan?.price) || 0;
  const durationDays = student?.durationDays || (plan?.durationUnit === 'days' ? plan?.durationDays : 30);
  const dailyRate = durationDays > 0 ? planPrice / durationDays : 25;
  const suggestedFee = Math.round(dailyRate * (extraDays || 0));

  // Calculate base daily rate to suggest a reasonable default fee
  useEffect(() => {
    if (!student) return;
    if (isFreeExtension) {
      setFeeAmount('0');
      return;
    }
    setFeeAmount(suggestedFee > 0 ? suggestedFee.toString() : '0');
  }, [student, plan, extraDays, isFreeExtension]);

  if (!student) return null;

  const totalFee = Number(feeAmount) || 0;

  // Compute current expiry date & remaining info
  const currentEnd = student.membershipEnd
    ? student.membershipEnd.toDate
      ? student.membershipEnd.toDate()
      : new Date(student.membershipEnd)
    : new Date();

  const remainingInfo = getMembershipRemainingDays(student.membershipEnd);
  const isAlreadyExpired = remainingInfo.isExpired;

  // New Expiry Date calculation
  // If active with days remaining, add to current expiry. If already expired, add to today.
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let newEndDate = new Date();
  if (!isAlreadyExpired && currentEnd.getTime() > today.getTime()) {
    newEndDate = new Date(currentEnd.getTime() + (Number(extraDays) || 0) * 86400000);
  } else {
    newEndDate = new Date(today.getTime() + (Number(extraDays) || 0) * 86400000);
  }

  const quickPillOptions = [3, 5, 7, 10, 15, 20, 30];

  const handleFeeAmountChange = (val) => {
    setFeeAmount(val);
    const num = Number(val) || 0;
    if (num <= 0) {
      setIsFreeExtension(true);
      return;
    }
    setIsFreeExtension(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!extraDays || Number(extraDays) <= 0) {
      alert('कृपया कम से कम 1 दिन दर्ज करें (Please enter at least 1 day)');
      return;
    }

    const payload = {
      studentId: student.id,
      extraDays: Number(extraDays),
      totalFee,
      feeAmount: totalFee,
      paidNow: 0,
      dueAmount: totalFee,
      paymentType: 'pay_later',
      paymentMode: 'due',
      splitDetails: null,
      newExpiryDate: newEndDate.toISOString(),
      notes: notes.trim(),
      paymentRemarks: '',
      sendWhatsApp: false,
      isFree: totalFee === 0,
    };

    if (onExtend) {
      await onExtend(payload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Extend Membership Validity (दिन आगे बढ़ाएं)"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student & Current Validity Summary Banner */}
        <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 p-4 rounded-2xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-indigo-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm shrink-0">
                  {student.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                  {student.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  📞 {student.phone} {seat?.seatNumber && `• Seat #${seat.seatNumber}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${remainingInfo.color}`}
              >
                {remainingInfo.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Current Expiry: <strong>{formatDate(student.membershipEnd)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Days Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Select Days to Extend (कितने दिन बढ़ाना चाहते हैं?)
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {quickPillOptions.map((days) => {
              const isSelected = Number(extraDays) === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExtraDays(days)}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer text-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{days} दिन
                </button>
              );
            })}
          </div>

          {/* Custom Days Input */}
          <div className="mt-3 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
            <span className="text-xs text-slate-500 font-semibold">
              Or Custom Days (या अपनी पसंद के दिन):
            </span>
            <div className="relative w-32">
              <input
                type="number"
                min="1"
                max="365"
                value={extraDays}
                onChange={(e) => setExtraDays(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="10"
              />
              <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">दिन</span>
            </div>
          </div>
        </div>

        {/* New Expiry Date Card */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                New Membership Expiry (नया समाप्त दिनांक)
              </p>
              <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                {formatDate(newEndDate)}
              </p>
            </div>
          </div>
          <div className="self-end sm:self-auto">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-emerald-800 rounded-xl border border-emerald-200 text-xs font-extrabold shadow-2xs">
              +{extraDays} Days Extended
            </span>
          </div>
        </div>

        {/* Extension Fee Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Extension Fee Amount (अतिरिक्त शुल्क - ₹) *
            </label>
            <div className="flex items-center gap-1.5">
              {!isFreeExtension && totalFee > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsFreeExtension(true);
                    setFeeAmount('0');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  ⚡ Free Extension (₹0)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsFreeExtension(false);
                    setFeeAmount(suggestedFee.toString());
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 transition-all cursor-pointer"
                >
                  ↺ Auto Calculate (₹{suggestedFee})
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold pointer-events-none">₹</span>
            <input
              type="number"
              min="0"
              value={feeAmount}
              onChange={(e) => handleFeeAmountChange(e.target.value)}
              onFocus={(e) => {
                if (e.target.value === '0') setFeeAmount('');
              }}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalFee === 0
              ? '✨ निःशुल्क एक्सटेंशन (Free Extension) - कोई शुल्क नहीं कटेगा।'
              : `यह ₹${totalFee} का नया बिल (Pending Bill) बनेगा। फीस आप बाद में "₹ Fee" / "Collect Fee" से जमा कर सकते हैं (या पार्शियल/किस्त में ले सकते हैं)।`}
          </p>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Notes / Reason (वैकल्पिक टिप्पणी)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Exam extension for SSC / 10 days test series"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Action Buttons - Exactly like Add New Student Admission */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? 'Saving...' : 'Save & Extend Days'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
