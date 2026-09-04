import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/helpers';
import {
  Phone,
  Mail,
  Lock,
  Wifi,
  Lamp,
  Sun,
  Sunrise,
  Sunset,
  Clock,
  Calendar,
  Armchair,
  Trash2,
  Edit,
  Tag,
  IndianRupee,
} from 'lucide-react';
import Button from '../common/Button';

export default function StudentProfile({
  isOpen,
  onClose,
  student,
  section,
  seat,
  fees = [],
  plan,
  onDeleteStudent,
  onEditStudent,
  canDelete = true,
  canEdit = true,
}) {
  if (!student) return null;

  const getShiftDisplay = () => {
    switch (student.shift) {
      case 'first_half':
        return {
          icon: <Sunrise className="w-4 h-4 text-amber-600" />,
          title: '1st Half / Morning',
          timing: student.shiftTiming || '6:00 AM - 2:00 PM',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'second_half':
        return {
          icon: <Sunset className="w-4 h-4 text-purple-600" />,
          title: '2nd Half / Evening',
          timing: student.shiftTiming || '2:00 PM - 11:00 PM',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'custom':
        return {
          icon: <Clock className="w-4 h-4 text-teal-600" />,
          title: 'Custom Timing',
          timing: student.shiftTiming || 'Custom Hours',
          badge: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case 'full_day':
      default:
        return {
          icon: <Sun className="w-4 h-4 text-indigo-600" />,
          title: 'Full Day (Full Time)',
          timing: student.shiftTiming || '6:00 AM - 11:00 PM (All Day)',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
    }
  };

  const shiftInfo = getShiftDisplay();

  const planBasePrice = Number(plan?.price) || 0;
  const discountAmt = Number(student.discountAmount) || 0;
  const netMonthly = Math.max(0, planBasePrice - discountAmt);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Profile & Record" size="xl">
      <div className="space-y-6">
        {/* Header with Avatar & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-600/20">
              {student.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{student.name}</h3>
                <StatusBadge status={student.status || 'active'} size="sm" />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-600">
                {student.phone && (
                  <span className="flex items-center gap-1 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.phone}
                  </span>
                )}
                {student.email && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(student.joinDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {canEdit && onEditStudent && (
              <button
                onClick={() => {
                  onClose();
                  onEditStudent(student);
                }}
                className="px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-50 flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            {canDelete && onDeleteStudent && (
              <button
                onClick={() => {
                  onClose();
                  onDeleteStudent(student);
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Detailed Grid: Section, Seat, Shift, Plan & Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Section</p>
            <p className="font-bold text-slate-900 mt-1">{section?.name || '—'}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Seat Number</p>
            <p className="font-extrabold text-indigo-700 mt-1 flex items-center gap-1">
              <Armchair className="w-4 h-4 text-indigo-500" />
              <span>#{seat?.seatNumber || '—'}</span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shift & Timing</p>
            <div className="mt-1 flex items-center gap-1 font-bold text-slate-900 text-xs">
              {shiftInfo.icon}
              <span className="truncate">{shiftInfo.title}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{shiftInfo.timing}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Membership & Pricing</p>
            <p className="font-bold text-slate-900 mt-1">{plan?.name || 'Standard Monthly'}</p>
            <div className="flex flex-wrap items-baseline gap-1 mt-0.5">
              <span className="text-xs font-black text-emerald-700">
                {formatCurrency(netMonthly)}/mo
              </span>
              {discountAmt > 0 && (
                <span className="text-[10px] text-rose-600 font-bold">
                  (-₹{discountAmt} छूट)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Add-ons on the Seat */}
        {seat?.addons && Object.values(seat.addons).some(Boolean) && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Seat Facilities & Add-ons
            </h4>
            <div className="flex flex-wrap gap-2">
              {(seat.addons.locker || seat.addons.Locker) && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Locker Facility Assigned
                </span>
              )}
              {(seat.addons.wifi || seat.addons.WiFi || seat.addons.Wifi) && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
                  <Wifi className="w-3.5 h-3.5 text-blue-600" /> High-Speed WiFi
                </span>
              )}
              {(seat.addons.light || seat.addons.lamp || seat.addons['Desk Light']) && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl text-xs font-bold">
                  <Lamp className="w-3.5 h-3.5 text-yellow-600" /> Dedicated Desk Light
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fee Payment History */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3">Fee Payment & Receipt History</h4>
          {fees.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              No fee records generated yet
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Validity Period / Month</th>
                      <th className="px-4 py-2.5 text-left">Plan Rate</th>
                      <th className="px-4 py-2.5 text-left">Discount</th>
                      <th className="px-4 py-2.5 text-left">Paid Amount</th>
                      <th className="px-4 py-2.5 text-left">Payment Date</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {fees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {fee.periodStart && fee.periodEnd
                            ? `${formatDate(fee.periodStart)} to ${formatDate(fee.periodEnd)}`
                            : fee.month}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {formatCurrency(fee.baseFee || fee.amount)}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-emerald-700">
                          {fee.discountAmount > 0 ? `- ₹${fee.discountAmount}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-black text-slate-900">
                          {formatCurrency(fee.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {formatDate(fee.paidDate || fee.dueDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={fee.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
