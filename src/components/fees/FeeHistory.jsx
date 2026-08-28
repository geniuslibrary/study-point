import { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';

export default function FeeHistory({ fees = [], showStudentName = false }) {
  const [filterStatus, setFilterStatus] = useState('');
  const filtered = filterStatus ? fees.filter(f => f.status === filterStatus) : fees;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Fee History</h3>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg text-sm">
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {showStudentName && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Month</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Paid Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(fee => (
              <tr key={fee.id}>
                {showStudentName && <td className="px-4 py-2">{fee.studentName || '—'}</td>}
                <td className="px-4 py-2">{fee.month}</td>
                <td className="px-4 py-2 font-medium">{formatCurrency(fee.amount)}</td>
                <td className="px-4 py-2">{formatDate(fee.paidDate)}</td>
                <td className="px-4 py-2"><StatusBadge status={fee.status} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="p-6 text-center text-gray-500">No records found</div>}
    </div>
  );
}
