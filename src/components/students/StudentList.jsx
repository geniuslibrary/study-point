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
  LayoutGrid,
  LayoutList,
  Phone,
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
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('studypoint_student_view_mode') || 'table';
    } catch {
      return 'table';
    }
  });

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

          <div className="flex items-center gap-3 ml-auto">
            {/* View Mode Switcher for Desktop */}
            <div className="hidden md:flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setViewMode('table');
                  try { localStorage.setItem('studypoint_student_view_mode', 'table'); } catch {}
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Table View (तालिका व्यू)"
              >
                <LayoutList size={13} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('cards');
                  try { localStorage.setItem('studypoint_student_view_mode', 'cards'); } catch {}
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cards Grid View (कार्ड ग्रिड व्यू)"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
            </div>

            <span className="text-[11px] font-bold text-slate-400">
              Showing {filtered.length} students
            </span>
          </div>
        </div>
      </div>

      {/* Desktop View: Table Mode */}
      {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/90 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Seat & Shift</th>
                <th className="px-5 py-3.5">Plan & Fee</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[390px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
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
                    {/* Student Info: Avatar + Name + Phone + Join Date */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {student.photo ? (
                          <img
                            src={student.photo}
                            alt={student.name}
                            onClick={() => onViewProfile(student)}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100/90 shrink-0 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                            title="Click to view profile"
                          />
                        ) : (
                          <div
                            onClick={() => onViewProfile(student)}
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-2xs cursor-pointer hover:scale-105 transition-transform ${
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
                            className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer transition-colors leading-tight"
                          >
                            {student.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1 font-semibold text-slate-600">
                              <Phone size={11} className="text-slate-400" />
                              <span>{student.phone}</span>
                            </span>
                            {student.joinDate && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                • <span>{formatDate(student.joinDate)}</span>
                              </span>
                            )}
                          </div>
                          {student.email && <p className="text-[11px] text-slate-400">{student.email}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Seat & Shift Info */}
                    <td className="px-5 py-3.5">
                      {!isLeft && student.seatId ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-extrabold">
                              <Armchair size={11} />
                              <span>Seat {getSeatNumber(student.seatId)}</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal truncate max-w-[130px]" title={getSectionName(student.sectionId)}>
                              {getSectionName(student.sectionId)}
                            </span>
                          </div>
                          <div>
                            {getShiftBadge(student.shift, student.shiftTiming)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No seat (Left)</span>
                      )}
                    </td>

                    {/* Plan & Fee & Validity */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-900">{planLabel}</span>
                          <span className="font-extrabold text-indigo-700">({formatCurrency(netFee)})</span>
                          {discount > 0 && (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              -₹{discount}
                            </span>
                          )}
                        </div>
                        {student.membershipEnd && (
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${remainingInfo.color}`}
                              title={`Valid till ${formatDate(student.membershipEnd)}`}
                            >
                              {remainingInfo.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${
                          isLeft
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isLeft ? '🔴 Left' : '🟢 Active'}
                      </span>
                    </td>

                    {/* Actions: Clean, Colorful, Clearly Labeled Button Pills in a Single Line */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end flex-nowrap gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onViewProfile(student)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                          title="View Student Profile & Fee History"
                        >
                          <Eye size={12} className="text-slate-600" />
                          <span>Profile</span>
                        </button>

                        {onExtend && (
                          <button
                            onClick={() => onExtend(student)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                            title="Extend Membership Validity (दिन आगे बढ़ाएं)"
                          >
                            <CalendarPlus size={12} className="text-emerald-600" />
                            <span>Extend</span>
                          </button>
                        )}

                        {!isLeft && canCollectFee && (
                          <button
                            onClick={() => onCollectFee(student)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                            title="Collect Fee / Record Payment"
                          >
                            <IndianRupee size={12} />
                            <span>Fee</span>
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => onEdit(student)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                            title="Edit Student Admission / Shift"
                          >
                            <Edit size={12} className="text-indigo-600" />
                            <span>Edit</span>
                          </button>
                        )}

                        {!isLeft && onToggleStatus && (
                          <button
                            onClick={() => onToggleStatus(student)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                            title="Mark Left & Free Seat (छोड़ दिया)"
                          >
                            <UserX size={12} className="text-rose-600" />
                            <span>Left</span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDelete(student)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-bold inline-flex items-center justify-center cursor-pointer transition-colors shrink-0"
                            title="Delete Student Record"
                          >
                            <Trash2 size={13} />
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
      )}

      {/* Desktop View: Cards Grid Mode (Matches Mobile Design Elegance on Big Screens) */}
      {viewMode === 'cards' && (
        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 p-5 bg-slate-50/50">
          {filtered.map((student) => {
            const isLeft = student.status === 'left' || student.status === 'inactive';
            const plan = getPlan(student.membershipPlanId);
            const planPrice = Number(student.planPrice || plan?.price) || 0;
            const discount = Number(student.discountAmount) || 0;
            const netFee = Math.max(0, planPrice - discount);
            const planLabel = student.durationLabel || (student.isDayBased ? `${student.durationDays} Days Plan` : plan?.name) || 'Standard Monthly';
            const remainingInfo = getMembershipRemainingDays(student.membershipEnd);

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header: Avatar + Name + Phone + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          onClick={() => onViewProfile(student)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100/90 shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                          title="Click to view profile"
                        />
                      ) : (
                        <div
                          onClick={() => onViewProfile(student)}
                          className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-base shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-transform ${
                            isLeft ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                          title="Click to view profile"
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
                        <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" />
                          <span>{student.phone}</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={student.status || 'active'} size="sm" />
                  </div>

                  {/* Info Box: Plan, Validity, Seat, Shift */}
                  <div className="bg-slate-50/90 border border-slate-100 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Plan & Net Fee:</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>{planLabel}</span>
                        <span className="text-indigo-700 font-extrabold">({formatCurrency(netFee)})</span>
                        {discount > 0 && <span className="text-emerald-700 text-[10px]">(-₹{discount})</span>}
                      </div>
                    </div>

                    {student.membershipEnd && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Validity:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${remainingInfo.color}`}>
                          {remainingInfo.label}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Seat & Section:</span>
                      {!isLeft && student.seatId ? (
                        <span className="font-bold text-slate-800">
                          #{getSeatNumber(student.seatId)} ({getSectionName(student.sectionId)})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No seat</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Shift:</span>
                      <div>
                        {!isLeft ? getShiftBadge(student.shift, student.shiftTiming) : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Row: 6 Clearly Labeled Buttons */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
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
      )}

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
