import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency, formatDate, formatDateInput } from '../../utils/helpers';
import { Armchair, Clock, Tag, Calendar, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CollectFeeModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  fee,
  plan,
  plans = [],
  seat,
  addonPricing = [],
}) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Validity Period State (Start Date & End Date)
  const [validityStart, setValidityStart] = useState('');
  const [validityEnd, setValidityEnd] = useState('');

  // Helper to calculate end date from start date and duration months
  const computeEndDate = (startDateStr, durationMonths) => {
    if (!startDateStr) return '';
    try {
      const [y, m, d] = startDateStr.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const end = new Date(y, m - 1 + (Number(durationMonths) || 1), d);
      return formatDateInput(end);
    } catch (e) {
      const now = new Date();
      return formatDateInput(new Date(now.getFullYear(), now.getMonth() + (Number(durationMonths) || 1), now.getDate()));
    }
  };

  useEffect(() => {
    if (student || fee) {
      const currentPlanId = student?.membershipPlanId || fee?.planId || (plans[0]?.id || '');
      setSelectedPlanId(currentPlanId);

      const disc =
        fee && fee.discountAmount !== undefined && fee.discountAmount !== null && fee.discountAmount !== 0
          ? fee.discountAmount
          : student && student.discountAmount !== undefined && student.discountAmount !== null && student.discountAmount !== 0
          ? student.discountAmount
          : '';

      setDiscountAmount(disc !== '' ? String(disc) : '');
      setPaymentMode('cash');
      setNotes(fee?.notes || '');

      const activeP = plans.find((p) => p.id === currentPlanId) || plan || { durationMonths: 1 };
      const dur = Number(activeP.durationMonths) || 1;

      // Determine initial start date:
      let initStart = formatDateInput(new Date());

      if (fee?.periodStart) {
        initStart = formatDateInput(fee.periodStart);
      } else if (student?.joinDate) {
        initStart = formatDateInput(student.joinDate);
      } else if (student?.membershipStart) {
        initStart = formatDateInput(student.membershipStart);
      }

      // If student already has completed fees in the past and has an active cycle ending in future (renewal):
      if (student?.hasPaidBefore && student?.membershipEnd) {
        const prevEnd = student.membershipEnd.toDate ? student.membershipEnd.toDate() : new Date(student.membershipEnd);
        if (!isNaN(prevEnd.getTime()) && prevEnd > new Date()) {
          initStart = formatDateInput(prevEnd);
        }
      }

      setValidityStart(initStart);
      setValidityEnd(computeEndDate(initStart, dur));
    }
  }, [student, fee, plans, isOpen]);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plan || {
    name: 'Standard Monthly Plan',
    price: 800,
    durationMonths: 1,
  };

  const planPrice = Number(activePlan.price) || 0;
  const duration = Number(activePlan.durationMonths) || 1;

  // When plan changes, re-calculate validityEnd based on current validityStart
  const handlePlanChange = (newPlanId) => {
    setSelectedPlanId(newPlanId);
    const newPlan = plans.find((p) => p.id === newPlanId);
    const newDur = Number(newPlan?.durationMonths) || 1;
    if (validityStart) {
      setValidityEnd(computeEndDate(validityStart, newDur));
    }
  };

  // When user edits validityStart, auto recalculate validityEnd
  const handleStartDateChange = (newStartDate) => {
    setValidityStart(newStartDate);
    if (newStartDate) {
      setValidityEnd(computeEndDate(newStartDate, duration));
    }
  };

  // Calculate Addon Charges
  const addonCharges = {};
  let addonTotal = 0;
  if (seat?.addons) {
    addonPricing.forEach((addon) => {
      const key = addon.name?.toLowerCase();
      if (seat.addons[key]) {
        const monthly = Number(addon.monthlyCharge) || 0;
        const totalAddon = monthly * duration;
        addonCharges[addon.name] = totalAddon;
        addonTotal += totalAddon;
      }
    });
  }

  const discount = discountAmount === '' ? 0 : Number(discountAmount) || 0;
  const totalPayable = Math.max(0, planPrice + addonTotal - discount);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const startDateObj = validityStart ? new Date(validityStart) : new Date();
      const endDateObj = validityEnd ? new Date(validityEnd) : new Date(startDateObj.getFullYear(), startDateObj.getMonth() + duration, startDateObj.getDate());

      await onSubmit({
        amount: totalPayable,
        baseFee: planPrice,
        discountAmount: discount,
        addonCharges,
        paymentMode,
        notes,
        planId: activePlan.id,
        planName: activePlan.name,
        planDuration: duration,
        periodStart: startDateObj.toISOString(),
        periodEnd: endDateObj.toISOString(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collect Fee & Renew Membership" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student & Seat Context Card */}
        {student && (
          <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-slate-900 text-base leading-tight">{student.name}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1 font-bold text-indigo-700">
                  <Armchair className="w-3.5 h-3.5" /> Seat #{seat?.seatNumber || '—'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> {student.shiftTiming || 'Full Day'}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Admission / Joining Date</span>
              <span className="text-xs font-bold text-indigo-900">
                {student.joinDate ? formatDate(student.joinDate) : 'Today'}
              </span>
            </div>
          </div>
        )}

        {/* Membership Plan Selection & Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Membership Plan (प्लान चुनें) *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price} ({p.durationMonths} Month{p.durationMonths > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discount (छूट ₹)</span>
            </label>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 100"
            />
          </div>
        </div>

        {/* Membership Validity Period Configuration (Joining Date -> Valid Till) */}
        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Membership Bill Validity Period ({duration} Month{duration > 1 ? 's' : ''}):</span>
            </span>
            <span className="font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md text-[11px]">
              {validityStart && validityEnd ? `${formatDate(validityStart)} से ${formatDate(validityEnd)}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                Validity Start Date (शुरू दिनांक - Joining Date) *
              </label>
              <input
                type="date"
                required
                value={validityStart}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                Validity End / Due Date (समाप्ति / अगली फीस दिनांक) *
              </label>
              <input
                type="date"
                required
                value={validityEnd}
                onChange={(e) => setValidityEnd(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Itemized Breakdown Table */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">{activePlan.name} ({duration} Mo)</span>
            <span className="font-bold text-slate-900">{formatCurrency(planPrice)}</span>
          </div>

          {Object.entries(addonCharges).map(([name, charge]) => (
            <div key={name} className="flex justify-between">
              <span className="text-slate-600 font-medium">{name} Facility Add-on</span>
              <span className="font-bold text-slate-900">{formatCurrency(charge)}</span>
            </div>
          ))}

          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Special Discount Applied</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black">
            <span className="text-slate-900">TOTAL RECEIVABLE</span>
            <span className="text-lg text-indigo-700">{formatCurrency(totalPayable)}</span>
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Payment Mode *
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {['cash', 'upi', 'bank'].map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all uppercase cursor-pointer ${
                  paymentMode === mode
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                {mode === 'cash' ? '💵 Cash' : mode === 'upi' ? '📱 UPI / QR' : '🏦 Bank Transfer'}
              </button>
            ))}
          </div>
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Payment Remarks / Transaction ID (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
            placeholder="e.g. GPay Ref #123456"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Collect {formatCurrency(totalPayable)} & Renew</span>
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
