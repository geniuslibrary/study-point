import { formatCurrency, formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import { IndianRupee, FileText } from 'lucide-react';

export default function FeeTracker({ fees = [], students = [], sections = [], onCollect, onViewReceipt, selectedMonth, onMonthChange }) {
  const months = [...new Set(fees.map(f => f.month))].sort().reverse();
  const filteredFees = selectedMonth ? fees.filter(f => f.month === selectedMonth) : fees;
  const totalCollected = filteredFees.filter(f => f.status === 'paid').reduce((s, f) => s + (f.amount || 0), 0);
  const totalPending = filteredFees.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.amount || 0), 0);

  const getStudentName = (studentId) => students.find(s => s.id === studentId)?.name || 'Unknown';
  const getSectionName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return sections.find(s => s.id === student?.sectionId)?.name || '—';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <select value={selectedMonth || ''} onChange={(e) => onMonthChange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
          <option value="">All Months</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">Collected: {formatCurrency(totalCollected)}</span>
          <span className="text-red-600 font-medium">Pending: {formatCurrency(totalPending)}</span>
        </div>
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredFees.map(fee => (
              <tr key={fee.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{getStudentName(fee.studentId)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{getSectionName(fee.studentId)}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(fee.amount)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(fee.dueDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={fee.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {fee.status !== 'paid' && (<button onClick={() => onCollect(fee)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Collect"><IndianRupee className="w-4 h-4 text-green-600" /></button>)}
                    {fee.status === 'paid' && (<button onClick={() => onViewReceipt(fee)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Receipt"><FileText className="w-4 h-4 text-blue-600" /></button>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y">
        {filteredFees.map(fee => (
          <div key={fee.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{getStudentName(fee.studentId)}</span>
              <StatusBadge status={fee.status} size="sm" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{formatCurrency(fee.amount)}</span>
              <div className="flex gap-1">
                {fee.status !== 'paid' && <button onClick={() => onCollect(fee)} className="p-1.5 bg-green-50 rounded"><IndianRupee className="w-4 h-4 text-green-600" /></button>}
                {fee.status === 'paid' && <button onClick={() => onViewReceipt(fee)} className="p-1.5 bg-blue-50 rounded"><FileText className="w-4 h-4 text-blue-600" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredFees.length === 0 && <div className="p-8 text-center text-gray-500">No fee records found</div>}
    </div>
  );
}
