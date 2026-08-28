import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { SHIFTS } from '../../utils/constants';
import { Sun, Sunrise, Sunset, Clock, Armchair, AlertCircle } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    sectionId: '',
    seatId: '',
    membershipPlanId: '',
    shift: 'full_day',
    customStartTime: '06:00',
    customEndTime: '14:00',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [seatOptions, setSeatOptions] = useState([]);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        phone: editData.phone || '',
        email: editData.email || '',
        sectionId: editData.sectionId || '',
        seatId: editData.seatId || '',
        membershipPlanId: editData.membershipPlanId || '',
        shift: editData.shift || 'full_day',
        customStartTime: editData.customStartTime || '06:00',
        customEndTime: editData.customEndTime || '14:00',
        notes: editData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        sectionId: sections[0]?.id || '',
        seatId: '',
        membershipPlanId: '',
        shift: 'full_day',
        customStartTime: '06:00',
        customEndTime: '14:00',
        notes: '',
      });
    }
  }, [editData, isOpen, sections]);

  // Compute available seats based on selected Section and Shift
  useEffect(() => {
    if (!formData.sectionId) {
      setSeatOptions([]);
      return;
    }

    const sectionSeats = seats
      .filter((s) => s.sectionId === formData.sectionId)
      .sort((a, b) => (Number(a.seatNumber) || 0) - (Number(b.seatNumber) || 0));

    // Find all active students currently occupying seats in this section
    const activeStudents = students.filter(
      (s) =>
        s.status === 'active' &&
        s.sectionId === formData.sectionId &&
        s.seatId &&
        s.id !== editData?.id // exclude currently edited student
    );

    const evaluatedSeats = sectionSeats.map((seat) => {
      const seatStudents = activeStudents.filter((s) => s.seatId === seat.id);

      const hasFullDay = seatStudents.some((s) => !s.shift || s.shift === 'full_day');
      const hasFirstHalf = seatStudents.some((s) => s.shift === 'first_half');
      const hasSecondHalf = seatStudents.some((s) => s.shift === 'second_half');
      const customStudents = seatStudents.filter((s) => s.shift === 'custom');

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
          const occupants = seatStudents.map((s) => `${s.shift === 'first_half' ? '1st Half' : '2nd Half'}: ${s.name}`).join(', ');
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
    if (formData.shift === 'full_day') return '6:00 AM - 11:00 PM (Full Day)';
    if (formData.shift === 'first_half') return '6:00 AM - 2:00 PM (1st Half / Morning)';
    if (formData.shift === 'second_half') return '2:00 PM - 11:00 PM (2nd Half / Evening)';
    return `${formData.customStartTime} - ${formData.customEndTime} (Custom)`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        shiftTiming: getShiftTimingString(),
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
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Edit Student' : 'Add Student (with Shift & Seat)'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="e.g., Rahul Kumar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="e.g., 9876543210"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Optional)</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            placeholder="e.g., rahul@example.com"
          />
        </div>

        {/* Shift Selection (Full Day / Half Day) */}
        <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Seat Shift / Timing (फुल डे या हाफ डे) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SHIFTS.map((shift) => {
              const isSelected = formData.shift === shift.id;
              return (
                <label
                  key={shift.id}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-white shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-gray-200 bg-white/70 hover:bg-white hover:border-gray-300'
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
                    <div className="flex items-center gap-1.5 font-medium text-xs sm:text-sm text-gray-900">
                      {getShiftIcon(shift.id)}
                      <span>{shift.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{shift.timing}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Custom Time Slots if selected */}
          {formData.shift === 'custom' && (
            <div className="mt-3 pt-3 border-t border-indigo-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.customStartTime}
                  onChange={(e) => setFormData({ ...formData, customStartTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.customEndTime}
                  onChange={(e) => setFormData({ ...formData, customEndTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section & Seat Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
            <select
              value={formData.sectionId}
              onChange={(e) => setFormData({ ...formData, sectionId: e.target.value, seatId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seat Selection *
            </label>
            <select
              value={formData.seatId}
              onChange={(e) => setFormData({ ...formData, seatId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
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

        {/* Helper message if no seats available */}
        {formData.sectionId && seatOptions.filter((s) => s.isAvailable).length === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No seats are currently available in this section for the selected shift ({formData.shift}). Try another shift or section.</span>
          </div>
        )}

        {/* Membership Plan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Membership Plan</label>
          <select
            value={formData.membershipPlanId}
            onChange={(e) => setFormData({ ...formData, membershipPlanId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">Select membership plan (Optional)</option>
            {plans
              .filter((p) => p.isActive !== false)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price} ({p.durationMonths} Month{p.durationMonths > 1 ? 's' : ''})
                  {p.isOffer ? ' 🔥 Offer' : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
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
