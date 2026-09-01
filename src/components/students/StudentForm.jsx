import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Sun, Sunrise, Sunset, Clock, Armchair, AlertCircle, Calendar, UserX, CheckCircle, Tag, IndianRupee } from 'lucide-react';
import { formatDate, formatCurrency, getStoredShifts } from '../../utils/helpers';

export default function StudentForm({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  sections = [],
  seats = [],
  plans = [],
  students = [],
}) {
  const getTodayInput = () => new Date().toISOString().split('T')[0];
  const shiftsList = getStoredShifts();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    sectionId: '',
    seatId: '',
    membershipPlanId: '',
    discountAmount: '',
    shift: 'full_day',
    joinDate: getTodayInput(),
    status: 'active',
    customStartTime: '06:00 AM',
    customEndTime: '02:00 PM',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [seatOptions, setSeatOptions] = useState([]);

  useEffect(() => {
    if (editData) {
      const jDate = editData.joinDate
        ? (editData.joinDate.toDate ? editData.joinDate.toDate() : new Date(editData.joinDate))
            .toISOString()
            .split('T')[0]
        : getTodayInput();

      setFormData({
        name: editData.name || '',
        phone: editData.phone || '',
        email: editData.email || '',
        sectionId: editData.sectionId || '',
        seatId: editData.seatId || '',
        membershipPlanId: editData.membershipPlanId || '',
        discountAmount: editData.discountAmount !== undefined && editData.discountAmount !== null && editData.discountAmount !== 0 ? String(editData.discountAmount) : '',
        shift: editData.shift || 'full_day',
        joinDate: jDate,
        status: editData.status || 'active',
        customStartTime: editData.customStartTime || '06:00 AM',
        customEndTime: editData.customEndTime || '02:00 PM',
        notes: editData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        sectionId: sections[0]?.id || '',
        seatId: '',
        membershipPlanId: plans[0]?.id || '',
        discountAmount: '',
        shift: 'full_day',
        joinDate: getTodayInput(),
        status: 'active',
        customStartTime: '06:00 AM',
        customEndTime: '02:00 PM',
        notes: '',
      });
    }
  }, [editData, isOpen, sections, plans]);

  // Calculate Subscription Period from Join Date & Plan Duration
  const getBillingCycleInfo = () => {
    const selectedPlan = plans.find((p) => p.id === formData.membershipPlanId);
    const duration = selectedPlan?.durationMonths || 1;
    const planPrice = Number(selectedPlan?.price) || 0;
    const discount = formData.discountAmount === '' ? 0 : Number(formData.discountAmount) || 0;
    const finalPrice = Math.max(0, planPrice - discount);

    try {
      const [y, m, d] = formData.joinDate.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const end = new Date(y, m - 1 + duration, d);

      return {
        startDate: start,
        endDate: end,
        duration,
        planName: selectedPlan?.name || '1 Month Plan',
        planPrice,
        discount,
        finalPrice,
      };
    } catch (e) {
      const now = new Date();
      return {
        startDate: now,
        endDate: new Date(now.getFullYear(), now.getMonth() + duration, now.getDate()),
        duration,
        planName: selectedPlan?.name || '1 Month Plan',
        planPrice,
        discount,
        finalPrice,
      };
    }
  };

  const cycleInfo = getBillingCycleInfo();

  // Compute available seats based on selected Section and Shift
  useEffect(() => {
    if (!formData.sectionId) {
      setSeatOptions([]);
      return;
    }

    const sectionSeats = seats
      .filter((s) => s.sectionId === formData.sectionId)
      .sort((a, b) => (Number(a.seatNumber) || 0) - (Number(b.seatNumber) || 0));

    const activeStudents = students.filter(
      (s) =>
        s.status === 'active' &&
        s.sectionId === formData.sectionId &&
        s.seatId &&
        s.id !== editData?.id
    );

    const evaluatedSeats = sectionSeats.map((seat) => {
      const seatStudents = activeStudents.filter((s) => s.seatId === seat.id);

      const hasFullDay = seatStudents.some((s) => !s.shift || s.shift === 'full_day');
      const hasFirstHalf = seatStudents.some((s) => s.shift === 'first_half');
      const hasSecondHalf = seatStudents.some((s) => s.shift === 'second_half');

      let isAvailable = false;
      let statusHint = '';

      if (hasFullDay) {
        const fullDayStudent = seatStudents.find((s) => !s.shift || s.shift === 'full_day');
        isAvailable = false;
        statusHint = `Full Day Booked (${fullDayStudent?.name || 'Occupied'})`;
      } else if (formData.shift === 'full_day') {
        if (seatStudents.length === 0) {
          isAvailable = true;
          statusHint = 'Fully Available (All Shifts)';
        } else {
          isAvailable = false;
          const occupants = seatStudents
            .map((s) => `${s.shift === 'first_half' ? '1st Half' : '2nd Half'}: ${s.name}`)
            .join(', ');
          statusHint = `Not available for Full Day (Occupied by ${occupants})`;
        }
      } else if (formData.shift === 'first_half') {
        if (!hasFirstHalf) {
          isAvailable = true;
          if (hasSecondHalf) {
            const eveningStudent = seatStudents.find((s) => s.shift === 'second_half');
            statusHint = `Available (2nd Half occupied by ${eveningStudent?.name || 'Student'})`;
          } else {
            statusHint = 'Available (Empty Seat)';
          }
        } else {
          const morningStudent = seatStudents.find((s) => s.shift === 'first_half');
          isAvailable = false;
          statusHint = `1st Half already booked (${morningStudent?.name || 'Occupied'})`;
        }
      } else if (formData.shift === 'second_half') {
        if (!hasSecondHalf) {
          isAvailable = true;
          if (hasFirstHalf) {
            const morningStudent = seatStudents.find((s) => s.shift === 'first_half');
            statusHint = `Available (1st Half occupied by ${morningStudent?.name || 'Student'})`;
          } else {
            statusHint = 'Available (Empty Seat)';
          }
        } else {
          const eveningStudent = seatStudents.find((s) => s.shift === 'second_half');
          isAvailable = false;
          statusHint = `2nd Half already booked (${eveningStudent?.name || 'Occupied'})`;
        }
      } else {
        if (!hasFullDay && seatStudents.length < 2) {
          isAvailable = true;
          statusHint = seatStudents.length === 0 ? 'Empty Seat' : `Shared with ${seatStudents[0]?.name}`;
        } else {
          isAvailable = false;
          statusHint = 'Seat Fully Occupied';
        }
      }

      if (editData && editData.seatId === seat.id) {
        isAvailable = true;
        statusHint = 'Current Assigned Seat';
      }

      return {
        ...seat,
        isAvailable,
        statusHint,
        seatStudents,
      };
    });

    setSeatOptions(evaluatedSeats);
  }, [formData.sectionId, formData.shift, seats, students, editData]);

  const getShiftTimingString = () => {
    if (formData.shift === 'custom') {
      return `${formData.customStartTime} - ${formData.customEndTime} (Custom)`;
    }
    const currentShift = shiftsList.find((s) => s.id === formData.shift);
    return currentShift?.timing || 'Full Day';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        discountAmount: formData.discountAmount === '' ? 0 : Number(formData.discountAmount) || 0,
        seatId: formData.status === 'left' ? null : formData.seatId,
        shiftTiming: getShiftTimingString(),
        joinDate: new Date(formData.joinDate).toISOString(),
        membershipStart: cycleInfo.startDate.toISOString(),
        membershipEnd: cycleInfo.endDate.toISOString(),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getShiftIcon = (shiftId) => {
    switch (shiftId) {
      case 'full_day':
        return <Sun className="w-4 h-4 text-indigo-600" />;
      case 'first_half':
        return <Sunrise className="w-4 h-4 text-amber-600" />;
      case 'second_half':
        return <Sunset className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Student Admission & Shift' : 'Add New Student Admission'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. Rahul Kumar"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Phone * (10 Digits)
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        {/* Joining Date & Student Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/80">
          <div>
            <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Joining Date * (एडमिशन / फीस शुरू दिनांक)</span>
            </label>
            <input
              type="date"
              required
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              className="w-full px-3.5 py-2 border border-indigo-200 rounded-xl text-sm bg-white font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              इस तारीख से छात्र का महीना और सब्सक्रिप्शन साइकिल शुरू होगा।
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Student Status (छात्र स्थिति)
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'active' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formData.status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active (जारी)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'left', seatId: '' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formData.status === 'left'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Left (छोड़ दिया)</span>
              </button>
            </div>
            {formData.status === 'left' && (
              <p className="text-[11px] text-rose-600 font-bold mt-1">
                Seat automatically free ho jayegi aur active list se hat jayega.
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Shift Selection (Editable Timings from Settings) */}
        {formData.status === 'active' && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Seat Shift / Timing (शिफ्ट चुनें) *
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold">Configured in Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {shiftsList.map((shift) => {
                const isSelected = formData.shift === shift.id;
                return (
                  <label
                    key={shift.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shift"
                      value={shift.id}
                      checked={isSelected}
                      onChange={() => setFormData({ ...formData, shift: shift.id, seatId: '' })}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                        {getShiftIcon(shift.id)}
                        <span>{shift.label}</span>
                      </div>
                      <p className="text-xs text-indigo-700 font-bold mt-0.5">{shift.timing}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Custom Timing Pickers (if custom shift is selected) */}
            {formData.shift === 'custom' && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-teal-900 uppercase mb-1">Custom Start Time</label>
                  <input
                    type="text"
                    value={formData.customStartTime}
                    onChange={(e) => setFormData({ ...formData, customStartTime: e.target.value })}
                    placeholder="e.g. 06:00 AM"
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-teal-900 uppercase mb-1">Custom End Time</label>
                  <input
                    type="text"
                    value={formData.customEndTime}
                    onChange={(e) => setFormData({ ...formData, customEndTime: e.target.value })}
                    placeholder="e.g. 01:00 PM"
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-semibold"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section & Seat Assignment */}
        {formData.status === 'active' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Section *
              </label>
              <select
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value, seatId: '' })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white"
                required
              >
                <option value="">Select section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.totalSeats} seats)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Seat Selection *
              </label>
              <select
                value={formData.seatId}
                onChange={(e) => setFormData({ ...formData, seatId: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white"
                disabled={!formData.sectionId}
              >
                <option value="">Select available seat</option>
                {seatOptions
                  .filter((s) => s.isAvailable)
                  .sort((a, b) => (Number(a.seatNumber) || 0) - (Number(b.seatNumber) || 0))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      Seat #{s.seatNumber} — {s.statusHint}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* Membership Plan & Special Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Membership Plan (सब्सक्रिप्शन प्लान) *
            </label>
            <select
              value={formData.membershipPlanId}
              onChange={(e) => setFormData({ ...formData, membershipPlanId: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
            >
              <option value="">Select membership plan</option>
              {plans
                .filter((p) => p.isActive !== false)
                .map((p) => (
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
              value={formData.discountAmount}
              onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 100"
            />
          </div>
        </div>

        {/* Dynamic Billing Cycle & Price Preview Card */}
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold block">📅 Billing Period ({cycleInfo.duration} Month{cycleInfo.duration > 1 ? 's' : ''}):</span>
            <span className="font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md text-xs">
              Next Due: {formatDate(cycleInfo.endDate)}
            </span>
          </div>

          <p className="text-[11px] text-emerald-800">
            <strong>{formatDate(cycleInfo.startDate)}</strong> से <strong>{formatDate(cycleInfo.endDate)}</strong> तक valid रहेगा।
          </p>

          <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span>
              Plan Rate: <strong>₹{cycleInfo.planPrice}</strong>
              {cycleInfo.discount > 0 && <span className="text-emerald-700 font-bold ml-1.5">(-₹{cycleInfo.discount} Discount)</span>}
            </span>
            <span className="font-black text-sm text-emerald-900">
              Payable: {formatCurrency(cycleInfo.finalPrice)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {editData ? 'Update Student' : 'Save & Book Seat'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
