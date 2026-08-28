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
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { getShiftBadgeStyle, formatDate } from '../../utils/helpers';
import { SHIFTS } from '../../utils/constants';

export default function StudentList({
  students = [],
  sections = [],
  seats = [],
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

  const getShiftBadge = (shiftId, shiftTiming) => {
    switch (shiftId) {
      case 'first_half':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShiftBadgeStyle(shiftId)}`}>
            <Sunrise className="w-3 h-3 text-amber-600" />
            <span>1st Half (6 AM - 2 PM)</span>
          </span>
        );
      case 'second_half':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShiftBadgeStyle(shiftId)}`}>
            <Sunset className="w-3 h-3 text-purple-600" />
            <span>2nd Half (2 PM - 11 PM)</span>
          </span>
        );
      case 'custom':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShiftBadgeStyle(shiftId)}`}>
            <Clock className="w-3 h-3 text-teal-600" />
            <span>{shiftTiming || 'Custom Timing'}</span>
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

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xs p-12 text-center border border-slate-200/80">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Students Registered Yet</h3>
        <p className="text-slate-400 text-xs mt-1">Click "Add Student" to register a new student and book a seat shift.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden space-y-0">
      {/* Active vs Left Tabs Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs self-start">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Active Students ({activeCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('left')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'left'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Left / Discontinued ({leftCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({students.length})
          </button>
        </div>

        {activeTab === 'left' && (
          <span className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 font-semibold">
            ℹ️ Left students are archived here and removed from active seat grid & notifications.
          </span>
        )}
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
            >
              <option value="">All Shifts</option>
              {SHIFTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
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
              <th className="px-5 py-3.5">Seat & Section</th>
              <th className="px-5 py-3.5">Shift Timing</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((student) => {
              const isLeft = student.status === 'left' || student.status === 'inactive';
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
                      {isLeft ? '🔴 Left (छोड़ दिया)' : '🟢 Active'}
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

                      {canEdit && onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(student)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isLeft
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={isLeft ? 'Reactivate Student' : 'Mark as Left (Free Seat)'}
                        >
                          {isLeft ? <RotateCcw className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => onDelete(student)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors cursor-pointer"
                          title="Delete Student Permanently"
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

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((student) => {
          const isLeft = student.status === 'left' || student.status === 'inactive';
          return (
            <div key={student.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLeft ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {student.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.phone}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    isLeft ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isLeft ? 'Left' : 'Active'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Joined: {formatDate(student.joinDate)}</span>
                </div>
                {!isLeft && student.seatId && (
                  <div className="flex items-center gap-1 font-bold text-indigo-700">
                    <Armchair className="w-3.5 h-3.5" />
                    <span>Seat {getSeatNumber(student.seatId)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                <button
                  onClick={() => onViewProfile(student)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>

                {!isLeft && canCollectFee && (
                  <button
                    onClick={() => onCollectFee(student)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
                  >
                    <IndianRupee className="w-3.5 h-3.5" /> Fee
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => onEdit(student)}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}

                {canEdit && onToggleStatus && (
                  <button
                    onClick={() => onToggleStatus(student)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${
                      isLeft
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {isLeft ? <RotateCcw className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    <span>{isLeft ? 'Reactivate' : 'Left'}</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={() => onDelete(student)}
                    className="p-1 text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-10 text-center text-slate-400 text-xs font-semibold">
          No students found under this tab ({activeTab}).
        </div>
      )}
    </div>
  );
}
