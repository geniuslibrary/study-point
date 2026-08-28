import { formatCurrency, formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import { IndianRupee, FileText, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FeeTracker({
  fees = [],
  students = [],
  sections = [],
  onCollect,
  onViewReceipt,
  selectedMonth,
  onMonthChange,
}) {
  const months = [...new Set(fees.map((f) => f.month))].sort().reverse();
  const filteredFees = selectedMonth ? fees.filter((f) => f.month === selectedMonth) : fees;
  const totalCollected = filteredFees
    .filter((f) => f.status === 'paid')
    .reduce((s, f) => s + (f.amount || 0), 0);
  const totalPending = filteredFees
    .filter((f) => f.status !== 'paid')
    .reduce((s, f) => s + (f.amount || 0), 0);

  const getStudent = (studentId) => students.find((s) => s.id === studentId);
  const getSectionName = (studentId) => {
    const student = getStudent(studentId);
    return sections.find((s) => s.id === student?.sectionId)?.name || '—';
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Month Filter & Summary Pills */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedMonth || ''}
            onChange={(e) => onMonthChange(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                Month: {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Collected: {formatCurrency(totalCollected)}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/60 px-3 py-1.5 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Pending: {formatCurrency(totalPending)}</span>
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5">Student</th>
              <th className="px-5 py-3.5">Section</th>
              <th className="px-5 py-3.5">Month</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">Due Date</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredFees.map((fee) => {
              const student = getStudent(fee.studentId);
              return (
                <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900 leading-tight">{student?.name || 'Unknown'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{student?.phone || ''}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                    {getSectionName(fee.studentId)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono font-semibold text-indigo-700">
                    {fee.month}
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-slate-900">
                    {formatCurrency(fee.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {formatDate(fee.dueDate || fee.paidDate)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={fee.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {fee.status !== 'paid' && (
                        <button
                          onClick={() => onCollect(fee)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Collect Fee"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      )}
                      {fee.status === 'paid' && (
                        <button
                          onClick={() => onViewReceipt(fee)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="View & Print Bill"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Bill / PDF</span>
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
          return (
            <div key={fee.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">
                    {student?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {getSectionName(fee.studentId)} • Month: <strong>{fee.month}</strong>
                  </p>
                </div>
                <StatusBadge status={fee.status} size="sm" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount</span>
                  <span className="text-base font-black text-slate-900">{formatCurrency(fee.amount)}</span>
                </div>

                <div className="flex gap-1.5">
                  {fee.status !== 'paid' && (
                    <button
                      onClick={() => onCollect(fee)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Collect</span>
                    </button>
                  )}
                  {fee.status === 'paid' && (
                    <button
                      onClick={() => onViewReceipt(fee)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Bill / PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFees.length === 0 && (
        <div className="p-10 text-center text-slate-400 text-xs font-semibold">
          No fee records found for this selection.
        </div>
      )}
    </div>
  );
}
