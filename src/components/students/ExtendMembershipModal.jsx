import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  Calendar,
  CalendarPlus,
  IndianRupee,
  Clock,
  Sparkles,
  MessageCircle,
  AlertCircle,
  Armchair,
} from 'lucide-react';
import { formatCurrency, formatDate, getMembershipRemainingDays } from '../../utils/helpers';
import { PAYMENT_MODES } from '../../utils/constants';

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
  const [paymentMode, setPaymentMode] = useState('cash');
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Calculate base daily rate to suggest a reasonable default fee
  useEffect(() => {
    if (!student) return;
    const planPrice = Number(student.planPrice || plan?.price) || 0;
    const durationDays = student.durationDays || (plan?.durationUnit === 'days' ? plan?.durationDays : 30);
    const dailyRate = durationDays > 0 ? planPrice / durationDays : 25;
    const suggestedFee = Math.round(dailyRate * (extraDays || 0));
    setFeeAmount(suggestedFee > 0 ? suggestedFee.toString() : '0');
  }, [student, plan, extraDays]);

  if (!student) return null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!extraDays || Number(extraDays) <= 0) {
      alert('कृपया कम से कम 1 दिन दर्ज करें (Please enter at least 1 day)');
      return;
    }

    const payload = {
      studentId: student.id,
      extraDays: Number(extraDays),
      feeAmount: Number(feeAmount) || 0,
      paymentMode,
      newExpiryDate: newEndDate.toISOString(),
      notes: notes.trim(),
      sendWhatsApp,
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
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Extension Fee & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Extension Fee Amount (अतिरिक्त शुल्क - ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Free extension ke liye ₹0 daal sakte hain
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Payment Mode (भुगतान माध्यम)
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
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

        {/* WhatsApp Notification Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">
                Send WhatsApp Confirmation to Student
              </p>
              <p className="text-[11px] text-slate-500">
                Extends validity and sends an instant WhatsApp renewal receipt to {student.phone}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={sendWhatsApp}
            onChange={(e) => setSendWhatsApp(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            {loading ? 'Extending...' : `Confirm & Extend (+${extraDays} Days)`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
