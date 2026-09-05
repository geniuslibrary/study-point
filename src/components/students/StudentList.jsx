import { useState } from 'react';
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
  CheckCircle,
  Tag,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { getShiftBadgeStyle, formatDate, formatCurrency } from '../../utils/helpers';
import { SHIFTS } from '../../utils/constants';

export default function StudentList({
  students = [],
  sections = [],
  seats = [],
  plans = [],
  onEdit,
  onDelete,
  onCollectFee,
  onViewProfile,
  onToggleStatus,
  canEdit = true,
  canDelete = true,
  canCollectFee = true,
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'left' | 'all'
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterShift, setFilterShift] = useState('');

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
    const matchShift = !filterShift || s.shift === filterShift;

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
              const planPrice = Number(plan?.price) || 0;
              const discount = Number(student.discountAmount) || 0;
              const netFee = Math.max(0, planPrice - discount);

              return (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isLeft ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {student.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                        {student.email && <p className="text-xs text-slate-400">{student.email}</p>}
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
                      <p className="font-bold text-xs text-slate-900">{plan?.name || 'Standard Monthly'}</p>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <span className="font-extrabold text-indigo-700">{formatCurrency(netFee)}</span>
                        {discount > 0 && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            -₹{discount} छूट
                          </span>
                        )}
                      </div>
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

                      {!isLeft && canCollectFee && (
                        <button
                          onClick={() => onCollectFee(student)}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors cursor-pointer"
                          title="Collect Fee"
                        >
                          <IndianRupee className="w-4 h-4" />
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
          const planPrice = Number(plan?.price) || 0;
          const discount = Number(student.discountAmount) || 0;
          const netFee = Math.max(0, planPrice - discount);

          return (
            <div key={student.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                    isLeft ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {student.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{student.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">📞 {student.phone}</p>
                  </div>
                </div>
                <StatusBadge status={student.status || 'active'} size="sm" />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Plan & Net Fee:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <span>{plan?.name || 'Monthly'}</span>
                    <span className="text-indigo-700 font-extrabold">({formatCurrency(netFee)})</span>
                    {discount > 0 && <span className="text-emerald-700 text-[10px]">(-₹{discount})</span>}
                  </div>
                </div>

                {!isLeft && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Seat & Section:</span>
                    <span className="font-bold text-slate-800">
                      {getSeatNumber(student.seatId)} ({getSectionName(student.sectionId)})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => onViewProfile(student)}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Profile
                </button>
                {!isLeft && canCollectFee && (
                  <button
                    onClick={() => onCollectFee(student)}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <IndianRupee size={12} /> Fee
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => onEdit(student)}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete(student)}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold"
                  >
                    Delete
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
