import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/helpers';
import { Armchair, Clock } from 'lucide-react';

export default function CollectFeeModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  plan,
  seat,
  addonPricing = [],
}) {
  const [paymentMode, setPaymentMode] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const baseFee = plan?.price || 0;
  const perMonth = plan?.durationMonths ? Math.round(baseFee / plan.durationMonths) : baseFee;

  const addonCharges = {};
  let addonTotal = 0;
  if (seat?.addons) {
    addonPricing.forEach((addon) => {
      const key = addon.name?.toLowerCase();
      if (seat.addons[key]) {
        addonCharges[addon.name] = addon.monthlyCharge || 0;
        addonTotal += addon.monthlyCharge || 0;
      }
    });
  }
  const totalAmount = perMonth + addonTotal;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({ amount: totalAmount, baseFee: perMonth, addonCharges, paymentMode, notes });
      setNotes('');
      setPaymentMode('cash');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collect Fee">
      <div className="space-y-4">
        {student && (
          <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100">
            <p className="font-bold text-gray-900 text-base">{student.name}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <Armchair className="w-3.5 h-3.5 text-indigo-600" /> Seat #{seat?.seatNumber || '—'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-indigo-700 font-medium">
                <Clock className="w-3.5 h-3.5" /> {student.shiftTiming || 'Full Day'}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Fee ({plan?.name || 'Standard'})</span>
            <span className="font-medium">{formatCurrency(perMonth)}</span>
          </div>

          {Object.entries(addonCharges).map(([name, charge]) => (
            <div key={name} className="flex justify-between text-sm">
              <span className="text-gray-600">{name} Facility</span>
              <span className="font-medium">{formatCurrency(charge)}</span>
            </div>
          ))}

          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total Payable</span>
            <span className="font-extrabold text-xl text-indigo-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Payment Mode
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {['cash', 'upi', 'bank'].map((mode) => (
              <label
                key={mode}
                className={`text-center py-2 px-3 rounded-lg border cursor-pointer text-xs font-bold transition-all uppercase ${
                  paymentMode === mode
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value={mode}
                  checked={paymentMode === mode}
                  onChange={() => setPaymentMode(mode)}
                  className="sr-only"
                />
                {mode === 'cash' ? '💵 Cash' : mode === 'upi' ? '📱 UPI / QR' : '🏦 Bank Transfer'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Notes / Reference (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            rows="2"
            placeholder="e.g., GPay Transaction ID, Advance paid, etc."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Collect {formatCurrency(totalAmount)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
