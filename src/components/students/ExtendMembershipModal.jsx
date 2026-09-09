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
  const [isFreeExtension, setIsFreeExtension] = useState(false);
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'partial'
  const [customPayingAmount, setCustomPayingAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'bank' | 'split'
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

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
  const actualPaidNow = totalFee <= 0
    ? 0
    : paymentType === 'full'
      ? totalFee
      : Math.min(totalFee, Math.max(0, Number(customPayingAmount) || 0));
  const remainingAfterPayment = Math.max(0, totalFee - actualPaidNow);

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

  const handleSelectPaymentMode = (modeId) => {
    setPaymentMode(modeId);
    if (modeId === 'split') {
      const half = Math.round(actualPaidNow / 2);
      setSplitCash(String(half));
      setSplitUpi(String(actualPaidNow - half));
    }
  };

  const handleSplitCashChange = (val) => {
    setSplitCash(val);
    const cNum = Number(val) || 0;
    const uNum = Math.max(0, actualPaidNow - cNum);
    setSplitUpi(String(uNum));
  };

  const handleSplitUpiChange = (val) => {
    setSplitUpi(val);
    const uNum = Number(val) || 0;
    const cNum = Math.max(0, actualPaidNow - uNum);
    setSplitCash(String(cNum));
  };

  const handleTogglePaymentType = (type) => {
    setPaymentType(type);
    let targetPaid = totalFee;
    if (type === 'partial') {
      const suggested = customPayingAmount && Number(customPayingAmount) > 0 && Number(customPayingAmount) < totalFee
        ? Number(customPayingAmount)
        : Math.round(totalFee / 2) || totalFee;
      targetPaid = suggested;
      setCustomPayingAmount(String(suggested));
    }
    if (paymentMode === 'split' && targetPaid > 0) {
      const half = Math.round(targetPaid / 2);
      setSplitCash(String(half));
      setSplitUpi(String(targetPaid - half));
    }
  };

  const handleFeeAmountChange = (val) => {
    setFeeAmount(val);
    const num = Number(val) || 0;
    if (num <= 0) {
      setIsFreeExtension(true);
      setPaymentType('full');
      return;
    }
    setIsFreeExtension(false);
    if (paymentType === 'full') {
      if (paymentMode === 'split') {
        const half = Math.round(num / 2);
        setSplitCash(String(half));
        setSplitUpi(String(num - half));
      }
    } else if (paymentType === 'partial') {
      if (Number(customPayingAmount) > num) {
        setCustomPayingAmount(String(num));
      }
      if (paymentMode === 'split') {
        const effectivePaid = Math.min(num, Number(customPayingAmount) || 0);
        const half = Math.round(effectivePaid / 2);
        setSplitCash(String(half));
        setSplitUpi(String(effectivePaid - half));
      }
    }
  };

  const handleCustomPayingAmountChange = (val) => {
    setCustomPayingAmount(val);
    const num = Number(val) || 0;
    if (paymentMode === 'split') {
      const half = Math.round(num / 2);
      setSplitCash(String(half));
      setSplitUpi(String(num - half));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!extraDays || Number(extraDays) <= 0) {
      alert('कृपया कम से कम 1 दिन दर्ज करें (Please enter at least 1 day)');
      return;
    }

    if (totalFee > 0 && paymentType === 'partial' && actualPaidNow <= 0) {
      alert('कृपया आज जमा की जाने वाली राशि (Paying Now) दर्ज करें।');
      return;
    }

    const isSplit = paymentMode === 'split';
    let finalSplitDetails = null;
    if (isSplit && actualPaidNow > 0) {
      const cNum = Number(splitCash) || 0;
      const uNum = Number(splitUpi) || 0;
      if (cNum + uNum !== actualPaidNow) {
        alert(`Cash (₹${cNum}) aur UPI (₹${uNum}) ka jod ₹${actualPaidNow} ke barabar hona chahiye!`);
        return;
      }
      finalSplitDetails = { cash: cNum, upi: uNum };
    }

    const payload = {
      studentId: student.id,
      extraDays: Number(extraDays),
      totalFee,
      feeAmount: totalFee,
      paidNow: actualPaidNow,
      dueAmount: remainingAfterPayment,
      paymentType,
      paymentMode: actualPaidNow > 0 ? paymentMode : 'due',
      splitDetails: actualPaidNow > 0 ? finalSplitDetails : null,
      newExpiryDate: newEndDate.toISOString(),
      notes: notes.trim(),
      paymentRemarks: paymentRemarks.trim(),
      sendWhatsApp,
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
            {totalFee === 0 ? '✨ निःशुल्क एक्सटेंशन (Free Extension) - कोई शुल्क नहीं कटेगा।' : 'Free extension ke liye ₹0 daal sakte hain ya upar ⚡ Free button dabayein'}
          </p>
        </div>

        {/* Payment Type, Partial Selector & Summary (if Fee > 0) */}
        {totalFee > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Payment Type (भुगतान प्रकार)
              </span>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTogglePaymentType('full')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    paymentType === 'full'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ● Full Payment (पूरा ₹{totalFee})
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePaymentType('partial')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    paymentType === 'partial'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ● Partial (किस्त)
                </button>
              </div>
            </div>

            {paymentType === 'partial' && (
              <div className="pt-2 border-t border-slate-200 space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-900">
                  Amount Paying Now (आज कितना जमा कर रहे हैं) *
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 pointer-events-none">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={totalFee}
                    value={customPayingAmount}
                    onChange={(e) => handleCustomPayingAmountChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border-2 border-amber-300 rounded-xl text-sm font-black text-amber-950 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder={`Max ₹${totalFee}`}
                  />
                </div>
              </div>
            )}

            {/* Live 3-Column Summary Bar */}
            <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Plan Fee</span>
                <span className="font-black text-slate-800 text-sm">{formatCurrency(totalFee)}</span>
              </div>
              <div className={`p-2 rounded-xl border ${actualPaidNow > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase block ${actualPaidNow > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>Paying Now</span>
                <span className={`font-black text-sm ${actualPaidNow > 0 ? 'text-emerald-800' : 'text-slate-600'}`}>{formatCurrency(actualPaidNow)}</span>
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  remainingAfterPayment > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-900 ring-1 ring-rose-200'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-[10px] font-bold uppercase block">Remaining Due (बाकी)</span>
                <span className="font-black text-sm">{formatCurrency(remainingAfterPayment)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Mode Selector (Only if Fee > 0 and Paid Now > 0) */}
        {totalFee > 0 && actualPaidNow > 0 ? (
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Payment Mode (भुगतान माध्यम) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cash', label: '💵 Cash' },
                { id: 'upi', label: '📱 UPI / QR' },
                { id: 'bank', label: '🏦 Bank' },
                { id: 'split', label: '⚡ Split (Cash + UPI)' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => handleSelectPaymentMode(m.id)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    paymentMode === m.id
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Split Mode Inputs (Cash + UPI) */}
            {paymentMode === 'split' && (
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                  <span>⚡ Split Payment Breakdown</span>
                  <span className="text-[11px] text-indigo-700 font-bold">
                    Cash + UPI = ₹{actualPaidNow}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      💵 Cash Portion (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={actualPaidNow}
                      value={splitCash}
                      onChange={(e) => handleSplitCashChange(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-xs font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Cash ₹"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      📱 UPI Portion (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={actualPaidNow}
                      value={splitUpi}
                      onChange={(e) => handleSplitUpiChange(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-xs font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="UPI ₹"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Optional Payment Remarks / Transaction ID */}
        {totalFee > 0 && actualPaidNow > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Payment Remarks / Transaction ID (Optional)
            </label>
            <input
              type="text"
              value={paymentRemarks}
              onChange={(e) => setPaymentRemarks(e.target.value)}
              placeholder="e.g. UPI Ref / GPay Ref #123456 / Cash collected"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

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
            className={`w-full sm:w-auto font-bold text-white ${
              totalFee <= 0
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading
              ? 'Extending...'
              : totalFee <= 0
                ? `Confirm & Extend (+${extraDays} Days - Free)`
                : remainingAfterPayment > 0
                  ? `Confirm & Pay ₹${actualPaidNow} (Due: ₹${remainingAfterPayment}) (+${extraDays} Days)`
                  : `Confirm & Pay ₹${actualPaidNow} (+${extraDays} Days)`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
