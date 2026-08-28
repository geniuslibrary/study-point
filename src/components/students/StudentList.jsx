import { useState } from 'react';
import { Search, Edit, Trash2, Eye, IndianRupee, Users, Sun, Sunrise, Sunset, Clock, Armchair } from 'lucide-react';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import { getShiftBadgeStyle } from '../../utils/helpers';
import { SHIFTS } from '../../utils/constants';

export default function StudentList({
  students = [],
  sections = [],
  seats = [],
  onEdit,
  onDelete,
  onCollectFee,
  onViewProfile,
  canEdit = true,
  canDelete = true,
  canCollectFee = true,
}) {
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchSection = !filterSection || s.sectionId === filterSection;
    const matchShift = !filterShift || s.shift === filterShift;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchSection && matchShift && matchStatus;
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
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getShiftBadgeStyle(shiftId)}`}>
            <Sunrise className="w-3 h-3 text-amber-600" />
            <span>1st Half (6 AM - 2 PM)</span>
          </span>
        );
      case 'second_half':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getShiftBadgeStyle(shiftId)}`}>
            <Sunset className="w-3 h-3 text-purple-600" />
            <span>2nd Half (2 PM - 11 PM)</span>
          </span>
        );
      case 'custom':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getShiftBadgeStyle(shiftId)}`}>
            <Clock className="w-3 h-3 text-teal-600" />
            <span>{shiftTiming || 'Custom Timing'}</span>
          </span>
        );
      case 'full_day':
      default:
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getShiftBadgeStyle('full_day')}`}>
            <Sun className="w-3 h-3 text-indigo-600" />
            <span>Full Day</span>
          </span>
        );
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs p-12 text-center border border-gray-100">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-700">No Students Registered Yet</h3>
        <p className="text-gray-400 text-sm mt-1">Click "Add Student" to register a new student and book a seat shift.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
      {/* Search & Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/70">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-xl bg-white"
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
              className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-xl bg-white"
            >
              <option value="">All Shifts</option>
              {SHIFTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-xl bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Student</th>
              <th className="px-5 py-3.5">Phone</th>
              <th className="px-5 py-3.5">Seat & Section</th>
              <th className="px-5 py-3.5">Shift Timing</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                      {student.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                      {student.email && <p className="text-xs text-gray-400">{student.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-600 font-medium">{student.phone}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                    <Armchair className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Seat {getSeatNumber(student.seatId)}</span>
                    <span className="text-[11px] text-gray-400 font-normal">({getSectionName(student.sectionId)})</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {getShiftBadge(student.shift, student.shiftTiming)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={student.status || 'active'} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onViewProfile(student)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canCollectFee && (
                      <button
                        onClick={() => onCollectFee(student)}
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors cursor-pointer"
                        title="Collect Fee"
                      >
                        <IndianRupee className="w-4 h-4" />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => onEdit(student)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors cursor-pointer"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(student)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors cursor-pointer"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {filtered.map((student) => (
          <div key={student.id} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-600">
                    {student.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.phone}</p>
                </div>
              </div>
              <StatusBadge status={student.status || 'active'} size="sm" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                <Armchair className="w-3.5 h-3.5 text-indigo-600" />
                <span>Seat {getSeatNumber(student.seatId)}</span>
                <span className="text-gray-400">({getSectionName(student.sectionId)})</span>
              </div>
              <div>{getShiftBadge(student.shift, student.shiftTiming)}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={() => onViewProfile(student)}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              {canCollectFee && (
                <button
                  onClick={() => onCollectFee(student)}
                  className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5" /> Fee
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onEdit(student)}
                  className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(student)}
                  className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
