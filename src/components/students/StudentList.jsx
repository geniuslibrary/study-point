import { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  IndianRupee,
  Users,
  Sun,
  Sunrise,
  Sunset,
  Clock,
  Armchair,
  UserX,
  RotateCcw,
  Calendar,
  CalendarPlus,
  CheckCircle,
  Tag,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { getShiftBadgeStyle, formatDate, formatCurrency, getMembershipRemainingDays } from '../../utils/helpers';
import { SHIFTS } from '../../utils/constants';

export default function StudentList({
  students = [],
  sections = [],
  seats = [],
  plans = [],
  onEdit,
  onDelete,
  onCollectFee,
  onExtend,
  onViewProfile,
  onToggleStatus,
  canEdit = true,
  canDelete = true,
  canCollectFee = true,
  initialFilterShift = '',
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'left' | 'all'
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterShift, setFilterShift] = useState(initialFilterShift);

  useEffect(() => {
    if (initialFilterShift) {
      setFilterShift(initialFilterShift);
    }
  }, [initialFilterShift]);

  const activeCount = students.filter((s) => s.status === 'active').length;
  const leftCount = students.filter((s) => s.status === 'left' || s.status === 'inactive').length;

  const filtered = students.filter((s) => {
    const isLeft = s.status === 'left' || s.status === 'inactive';
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'active' && !isLeft) ||
      (activeTab === 'left' && isLeft);

    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) ||
      s.email?.toLowerCase().includes(search.toLowerCase());

    const matchSection = !filterSection || s.sectionId === filterSection;
    const studentShift = s.shift || 'full_day';
    const matchShift = !filterShift || studentShift === filterShift;

    return matchTab && matchSearch && matchSection && matchShift;
  });

  const getSectionName = (sectionId) => sections.find((s) => s.id === sectionId)?.name || '—';
  const getSeatNumber = (seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    return seat ? `#${seat.seatNumber}` : '—';
  };
  const getPlan = (planId) => plans.find((p) => p.id === planId);

  const getShiftBadge = (shiftId, shiftTiming) => {
    switch (shiftId) {
      case 'first_half':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShiftBadgeStyle(shiftId)}`}>
            <Sunrise className="w-3 h-3 text-amber-600" />
            <span>1st Half</span>
          </span>
        );
      case 'second_half':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShiftBadgeStyle(shiftId)}`}>
            <Sunset className="w-3 h-3 text-purple-600" />
            <span>2nd Half</span>
          </span>
        );
      case 'custom':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShiftBadgeStyle(shiftId)}`}>
            <Clock className="w-3 h-3 text-teal-600" />
            <span>{shiftTiming || 'Custom'}</span>
          </span>
        );
      case 'full_day':
      default:
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShiftBadgeStyle('full_day')}`}>
            <Sun className="w-3 h-3 text-indigo-600" />
            <span>Full Day</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden space-y-0">
      {/* Top Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Active / Left / All Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('left')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'left'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Left / Inactive ({leftCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Section & Shift Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {sections.length > 0 && (
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-2xs"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-2xs"
          >
            <option value="">All Shifts</option>
            {SHIFTS.map((sh) => (
              <option key={sh.id} value={sh.id}>
                {sh.label}
              </option>
            ))}
          </select>

          {(search || filterSection || filterShift) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterSection('');
                setFilterShift('');
              }}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}

          <span className="text-[11px] font-bold text-slate-400 ml-auto">
            Showing {filtered.length} students
          </span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5">Student</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Joining Date</th>
              <th className="px-5 py-3.5">Plan & Fee</th>
              <th className="px-5 py-3.5">Seat & Section</th>
              <th className="px-5 py-3.5">Shift</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((student) => {
              const isLeft = student.status === 'left' || student.status === 'inactive';
              const plan = getPlan(student.membershipPlanId);
              const planPrice = Number(student.planPrice || plan?.price) || 0;
              const discount = Number(student.discountAmount) || 0;
              const netFee = Math.max(0, planPrice - discount);
              const planLabel = student.durationLabel || (student.isDayBased ? `${student.durationDays} Days Plan` : plan?.name) || 'Standard Monthly';
              const remainingInfo = getMembershipRemainingDays(student.membershipEnd);

              return (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          onClick={() => onViewProfile(student)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-[60px] h-[60px] rounded-full object-cover border-2 border-indigo-100/90 shrink-0 shadow-sm ring-2 ring-slate-200/60 cursor-pointer hover:scale-105 transition-transform"
                          title="Click to view profile"
                        />
                      ) : (
                        <div
                          onClick={() => onViewProfile(student)}
                          className={`w-[60px] h-[60px] rounded-full flex items-center justify-center font-black text-base shrink-0 shadow-sm cursor-pointer hover:scale-105 transition-transform ${
                            isLeft ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                          title="Click to view profile"
                        >
                          {student.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p
                          onClick={() => onViewProfile(student)}
                          className="font-bold text-slate-900 text-sm sm:text-base hover:text-indigo-600 cursor-pointer transition-colors leading-snug"
                        >
                          {student.name}
                        </p>
                        {student.email && <p className="text-xs text-slate-400 mt-0.5">{student.email}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-xs text-slate-600 font-semibold">{student.phone}</td>

                  <td className="px-5 py-3.5 text-xs text-slate-700 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{formatDate(student.joinDate)}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{planLabel}</p>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <span className="font-extrabold text-indigo-700">{formatCurrency(netFee)}</span>
                        {discount > 0 && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            -₹{discount} छूट
                          </span>
                        )}
                      </div>
                      {student.membershipEnd && (
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${remainingInfo.color}`}
                            title={`Valid till ${formatDate(student.membershipEnd)}`}
                          >
                            {remainingInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    {!isLeft && student.seatId ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Armchair className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Seat {getSeatNumber(student.seatId)}</span>
                        <span className="text-[11px] text-slate-400 font-normal">({getSectionName(student.sectionId)})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No seat (Left)</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    {!isLeft ? getShiftBadge(student.shift, student.shiftTiming) : '—'}
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${
                        isLeft
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isLeft ? '🔴 Left' : '🟢 Active'}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onViewProfile(student)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                        title="View Profile & Fee History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {onExtend && (
                        <button
                          onClick={() => onExtend(student)}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors cursor-pointer"
                          title="Extend Membership Validity (दिन आगे बढ़ाएं)"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                      )}

                      {!isLeft && canCollectFee && (
                        <button
                          onClick={() => onCollectFee(student)}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors cursor-pointer"
                          title="Collect Fee"
                        >
                          <IndianRupee className="w-4 h-4" />
                        </button>
                      )}

                      {!isLeft && onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(student)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors cursor-pointer"
                          title="Mark Left & Free Seat (छोड़ दिया)"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}

                      {canEdit && (
                        <button
                          onClick={() => onEdit(student)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors cursor-pointer"
                          title="Edit Student Admission / Shift"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => onDelete(student)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Fluid Cards View */}
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((student) => {
          const isLeft = student.status === 'left' || student.status === 'inactive';
          const plan = getPlan(student.membershipPlanId);
          const planPrice = Number(student.planPrice || plan?.price) || 0;
          const discount = Number(student.discountAmount) || 0;
          const netFee = Math.max(0, planPrice - discount);
          const planLabel = student.durationLabel || (student.isDayBased ? `${student.durationDays} Days Plan` : plan?.name) || 'Monthly';
          const remainingInfo = getMembershipRemainingDays(student.membershipEnd);

          return (
            <div key={student.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3.5">
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt={student.name}
                      onClick={() => onViewProfile(student)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100/90 shrink-0 shadow-sm ring-2 ring-slate-200/60 cursor-pointer active:scale-95 transition-transform"
                      title="View Profile"
                    />
                  ) : (
                    <div
                      onClick={() => onViewProfile(student)}
                      className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-lg shrink-0 shadow-sm cursor-pointer active:scale-95 transition-transform ${
                        isLeft ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                      title="View Profile"
                    >
                      {student.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <h4
                      onClick={() => onViewProfile(student)}
                      className="font-extrabold text-slate-900 text-base leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                    >
                      {student.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">📞 {student.phone}</p>
                  </div>
                </div>
                <StatusBadge status={student.status || 'active'} size="sm" />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Plan & Net Fee:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <span>{planLabel}</span>
                    <span className="text-indigo-700 font-extrabold">({formatCurrency(netFee)})</span>
                    {discount > 0 && <span className="text-emerald-700 text-[10px]">(-₹{discount})</span>}
                  </div>
                </div>

                {student.membershipEnd && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Validity:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${remainingInfo.color}`}>
                      {remainingInfo.label}
                    </span>
                  </div>
                )}

                {!isLeft && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Seat & Section:</span>
                    <span className="font-bold text-slate-800">
                      {getSeatNumber(student.seatId)} ({getSectionName(student.sectionId)})
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-1.5">
                <button
                  onClick={() => onViewProfile(student)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="View Student Profile"
                >
                  <Eye size={13} className="shrink-0 text-slate-600" />
                  <span>Profile</span>
                </button>
                {onExtend && (
                  <button
                    onClick={() => onExtend(student)}
                    className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Extend Membership Validity (दिन आगे बढ़ाएं)"
                  >
                    <CalendarPlus size={13} className="shrink-0 text-emerald-600" />
                    <span>Extend</span>
                  </button>
                )}
                {!isLeft && canCollectFee && (
                  <button
                    onClick={() => onCollectFee(student)}
                    className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Collect Fee"
                  >
                    <IndianRupee size={13} className="shrink-0" />
                    <span>Fee</span>
                  </button>
                )}
                {!isLeft && onToggleStatus && (
                  <button
                    onClick={() => onToggleStatus(student)}
                    className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Mark Left & Free Seat (छोड़ दिया)"
                  >
                    <UserX size={13} className="shrink-0 text-rose-600" />
                    <span>Left</span>
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => onEdit(student)}
                    className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Edit Student Admission"
                  >
                    <Edit size={13} className="shrink-0 text-indigo-600" />
                    <span>Edit</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete(student)}
                    className="px-2 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Delete Student Record"
                  >
                    <Trash2 size={13} className="shrink-0" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-xs font-semibold">
          No students found matching current filters.
        </div>
      )}
    </div>
  );
}
