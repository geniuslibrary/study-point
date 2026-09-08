import { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatDate, formatMonthDisplay } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import {
  IndianRupee,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  X,
  Armchair,
  Layers,
  ArrowUpDown,
  RotateCcw,
  Tag,
  UserX,
  Clock,
} from 'lucide-react';

export default function FeeTracker({
  fees = [],
  students = [],
  sections = [],
  seats = [],
  onCollect,
  onViewReceipt,
  onMarkLeft,
  selectedMonth,
  onMonthChange,
  initialStatusFilter = 'all',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter); // all | paid | ending_soon | pending | overdue
  const [sectionFilter, setSectionFilter] = useState('all');

  useEffect(() => {
    if (initialStatusFilter && initialStatusFilter !== 'all') {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const months = useMemo(() => {
    return [...new Set(fees.map((f) => f.month))].filter(Boolean).sort().reverse();
  }, [fees]);

  const getStudent = (studentId) => students.find((s) => s.id === studentId);

  const getSectionName = (studentId) => {
    const student = getStudent(studentId);
    return sections.find((s) => s.id === student?.sectionId)?.name || '—';
  };

  const getSeatNumber = (studentId) => {
    const student = getStudent(studentId);
    const seat = seats.find((s) => s.id === student?.seatId);
    return seat?.seatNumber || null;
  };

  // Helper to calculate days difference relative to today
  // diff > 0: upcoming (e.g. 1, 2, 3 days left)
  // diff === 0: today
  // diff < 0: overdue (e.g. -1, -2, -3 days overdue)
  const getFeeDiffDays = (fee) => {
    const student = getStudent(fee.studentId);
    const dateStr = fee.periodEnd || fee.dueDate || student?.membershipEnd;
    if (!dateStr) return null;
    try {
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    } catch (e) {
      return null;
    }
  };

  // Calculate live counts for each filter category
  const statusCounts = useMemo(() => {
    let all = 0;
    let paid = 0;
    let ending_soon = 0;
    let pending = 0;
    let overdue = 0;

    fees.forEach((f) => {
      if (selectedMonth && f.month !== selectedMonth) return;
      const st = getStudent(f.studentId);
      if (sectionFilter !== 'all' && st?.sectionId !== sectionFilter) return;

      const diff = getFeeDiffDays(f);
      const isP = f.status === 'paid';
      const isEnd = diff !== null && diff >= 0 && diff <= 3 && st?.status !== 'left';
      const isO = !isP && diff !== null && diff < -2;
      const isPend = !isP && (diff === null || diff >= -2);

      all++;
      if (isP) paid++;
      if (isEnd) ending_soon++;
      if (isPend) pending++;
      if (isO) overdue++;
    });

    return { all, paid, ending_soon, pending, overdue };
  }, [fees, students, selectedMonth, sectionFilter]);

  // Comprehensive Search & Multi-Filter Logic
  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      const student = getStudent(fee.studentId);
      const studentName = student?.name?.toLowerCase() || '';
      const studentPhone = student?.phone || '';
      const seatNum = String(getSeatNumber(fee.studentId) || '');
      const search = searchTerm.toLowerCase().trim();

      // 1. Month Filter
      if (selectedMonth && fee.month !== selectedMonth) return false;

      // 2. Status Filter
      const diffDays = getFeeDiffDays(fee);
      const isPaid = fee.status === 'paid';
      const isOverdue = !isPaid && diffDays !== null && diffDays < -2;
      const isPending = !isPaid && (diffDays === null || diffDays >= -2);
      const isEndingSoon = diffDays !== null && diffDays >= 0 && diffDays <= 3 && student?.status !== 'left';

      if (statusFilter !== 'all') {
        if (statusFilter === 'paid' && !isPaid) return false;
        if (statusFilter === 'ending_soon' && !isEndingSoon) return false;
        if (statusFilter === 'pending' && !isPending) return false;
        if (statusFilter === 'overdue' && !isOverdue) return false;
      }

      // 3. Section Filter
      if (sectionFilter !== 'all') {
        if (student?.sectionId !== sectionFilter) return false;
      }

      // 4. Search Filter (Name, Phone, Seat #, Month, Fee ID)
      if (search) {
        const matchesName = studentName.includes(search);
        const matchesPhone = studentPhone.includes(search);
        const matchesSeat = seatNum === search || `seat ${seatNum}`.includes(search) || `#${seatNum}`.includes(search);
        const matchesMonth = fee.month?.includes(search);
        const matchesPlan = fee.planName?.toLowerCase().includes(search);
        if (!matchesName && !matchesPhone && !matchesSeat && !matchesMonth && !matchesPlan) {
          return false;
        }
      }

      return true;
    });
  }, [fees, students, sections, seats, selectedMonth, statusFilter, sectionFilter, searchTerm]);

  // Totals for filtered records
  const totalCollected = filteredFees
    .filter((f) => f.status === 'paid')
    .reduce((s, f) => s + (Number(f.amount) || 0), 0);

  const totalPending = filteredFees
    .filter((f) => f.status !== 'paid')
    .reduce((s, f) => s + (Number(f.amount) || 0), 0);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || sectionFilter !== 'all' || selectedMonth !== '';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSectionFilter('all');
    onMonthChange('');
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden space-y-0">
      {/* Top Bar: Search, Month, Status & Section Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, phone, seat #, or plan..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Removed Quick Stats Pills */}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Month Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth || ''}
              onChange={(e) => onMonthChange(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  Month: {formatMonthDisplay(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Buttons with Live Counts */}
          <div className="flex flex-wrap items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
            {[
              { id: 'all', label: 'All Status', count: statusCounts.all },
              { id: 'paid', label: '🟢 Paid', count: statusCounts.paid },
              { id: 'ending_soon', label: '⏳ Ending Soon (0-3 Days)', count: statusCounts.ending_soon },
              { id: 'pending', label: '🟡 Membership Expired (0-2 Days)', count: statusCounts.pending },
              { id: 'overdue', label: '🔴 Overdue (>2 Days)', count: statusCounts.overdue },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    statusFilter === st.id
                      ? 'bg-indigo-700/90 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Section Filter Dropdown */}
          {sections.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Count Badge */}
          <span className="text-[11px] font-bold text-slate-400 ml-auto">
            Showing {filteredFees.length} of {fees.length} bills
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5">Student & Phone</th>
              <th className="px-5 py-3.5">Seat / Section</th>
              <th className="px-5 py-3.5">Billing Validity Period</th>
              <th className="px-5 py-3.5">Amount & Discount</th>
              <th className="px-5 py-3.5">Due Date</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredFees.map((fee) => {
              const student = getStudent(fee.studentId);
              const seatNum = getSeatNumber(fee.studentId);
              const discount = Number(fee.discountAmount) || Number(student?.discountAmount) || 0;
              const addonTotal = fee.addonCharges ? Object.values(fee.addonCharges).reduce((s, v) => s + (Number(v) || 0), 0) : 0;
              const baseRate = Number(fee.baseFee) || (Number(fee.amount) + discount - addonTotal);
              const diffDays = getFeeDiffDays(fee);
              const isOverdue = fee.status !== 'paid' && diffDays !== null && diffDays < -2;
              const isEndingSoon = diffDays !== null && diffDays >= 0 && diffDays <= 3 && student?.status !== 'left';

              return (
                <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {student?.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {student?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-slate-900 leading-tight">{student?.name || 'Unknown'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{student?.phone || '—'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {seatNum ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-100 flex items-center gap-1">
                          <Armchair className="w-3 h-3" /> #{seatNum}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No seat</span>
                      )}
                      <span className="text-xs text-slate-600 font-medium">
                        {getSectionName(fee.studentId)}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    {fee.periodStart && fee.periodEnd ? (
                      <div>
                        <p className="text-xs font-bold text-indigo-900">
                          {formatDate(fee.periodStart)} to {formatDate(fee.periodEnd)}
                        </p>
                        <p className="text-[10px] text-slate-400">{fee.planName || 'Monthly Plan'}</p>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-semibold text-indigo-700">
                        Month: {formatMonthDisplay(fee.month)}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(fee.amount)}
                    </div>
                    {addonTotal > 0 && (
                      <div className="text-[10px] font-bold text-indigo-700 mt-0.5">
                        +₹{addonTotal} ({Object.keys(fee.addonCharges).join(', ')})
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="text-[11px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>-₹{discount} छूट ({formatCurrency(baseRate)})</span>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    <p className="font-bold text-slate-800">
                      {formatDate(fee.dueDate || fee.periodEnd || fee.paidDate)}
                    </p>
                    {diffDays !== null && (
                      <p
                        className={`text-[10px] font-extrabold mt-0.5 ${
                          diffDays < -2
                            ? 'text-rose-600'
                            : diffDays <= 0
                            ? 'text-amber-600'
                            : diffDays <= 3
                            ? 'text-indigo-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {diffDays === 0
                          ? 'Due Today'
                          : diffDays > 0
                          ? `${diffDays} days left`
                          : `${Math.abs(diffDays)} days overdue`}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    {fee.status === 'paid' ? (
                      <div>
                        <StatusBadge status="paid" />
                        {isEndingSoon && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200">
                              ⏳ {diffDays === 0 ? 'Ends Today' : diffDays === 1 ? '1 Day Left' : `${diffDays} Days Left`}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : isOverdue ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Overdue ({Math.abs(diffDays)}d)</span>
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {diffDays === 0
                            ? 'Expired Today'
                            : diffDays === -1
                            ? 'Expired (1d Grace)'
                            : diffDays === -2
                            ? 'Expired (2d Grace)'
                            : diffDays > 0
                            ? `Pending (${diffDays}d left)`
                            : 'Expired'}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1.5 items-center">
                      {fee.status !== 'paid' && (
                        <button
                          onClick={() => onCollect(fee)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="Collect Fee"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      )}

                      {fee.status === 'paid' && (
                        <button
                          onClick={() => onViewReceipt(fee)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="View & Print Bill"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Bill / PDF</span>
                        </button>
                      )}

                      {fee.status === 'paid' && isEndingSoon && (
                        <button
                          onClick={() => onCollect(fee)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="Renew Membership"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Renew</span>
                        </button>
                      )}

                      {isOverdue && student?.status !== 'left' && onMarkLeft && (
                        <button
                          onClick={() => onMarkLeft(fee, student, seats.find((s) => s.id === student?.seatId))}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="Mark Student Left & Free Seat"
                        >
                          <UserX className="w-3.5 h-3.5 text-rose-600" />
                          <span>Left & Free Seat</span>
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
      <div className="sm:hidden divide-y divide-slate-100">
        {filteredFees.map((fee) => {
          const student = getStudent(fee.studentId);
          const seatNum = getSeatNumber(fee.studentId);
          const discount = Number(fee.discountAmount) || Number(student?.discountAmount) || 0;
          const addonTotal = fee.addonCharges ? Object.values(fee.addonCharges).reduce((s, v) => s + (Number(v) || 0), 0) : 0;
          const diffDays = getFeeDiffDays(fee);
          const isOverdue = fee.status !== 'paid' && diffDays !== null && diffDays < -2;
          const isEndingSoon = diffDays !== null && diffDays >= 0 && diffDays <= 3 && student?.status !== 'left';

          return (
            <div key={fee.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {student?.photo ? (
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {student?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm leading-tight">
                      {student?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📞 {student?.phone || '—'} {seatNum ? `• Seat #${seatNum}` : ''}
                    </p>
                  </div>
                </div>

                {fee.status === 'paid' ? (
                  <div className="text-right">
                    <StatusBadge status="paid" size="sm" />
                    {isEndingSoon && (
                      <span className="block mt-1 text-[10px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        ⏳ {diffDays === 0 ? 'Ends Today' : diffDays === 1 ? '1d Left' : `${diffDays}d Left`}
                      </span>
                    )}
                  </div>
                ) : isOverdue ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" /> Overdue ({Math.abs(diffDays)}d)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {diffDays === 0 ? 'Expired Today' : diffDays === -1 ? 'Expired (1d)' : diffDays === -2 ? 'Expired (2d)' : diffDays > 0 ? `Pending (${diffDays}d)` : 'Expired'}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Billing Period</span>
                  <span className="font-bold text-indigo-900">
                    {fee.periodStart && fee.periodEnd
                      ? `${formatDate(fee.periodStart)} to ${formatDate(fee.periodEnd)}`
                      : formatMonthDisplay(fee.month)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Due Date</span>
                  <span className="font-bold text-slate-800">
                    {formatDate(fee.dueDate || fee.periodEnd || fee.paidDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount & Discount</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-slate-900">{formatCurrency(fee.amount)}</span>
                    {addonTotal > 0 && (
                      <span className="text-[10px] text-indigo-700 font-bold">
                        (+₹{addonTotal})
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="text-[11px] text-emerald-700 font-bold">
                        (-₹{discount} छूट)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-end">
                  {fee.status !== 'paid' && (
                    <button
                      onClick={() => onCollect(fee)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Collect</span>
                    </button>
                  )}
                  {fee.status === 'paid' && (
                    <button
                      onClick={() => onViewReceipt(fee)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Bill / PDF</span>
                    </button>
                  )}
                  {fee.status === 'paid' && isEndingSoon && (
                    <button
                      onClick={() => onCollect(fee)}
                      className="px-2.5 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Renew</span>
                    </button>
                  )}
                  {isOverdue && student?.status !== 'left' && onMarkLeft && (
                    <button
                      onClick={() => onMarkLeft(fee, student, seats.find((s) => s.id === student?.seatId))}
                      className="px-2.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Left & Free Seat</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFees.length === 0 && (
        <div className="text-center py-12 p-4 text-slate-400 space-y-2">
          <Search className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No fee records found</p>
          <p className="text-xs text-slate-400">
            Try adjusting your search keywords, month or status filter.
          </p>
        </div>
      )}
    </div>
  );
}
