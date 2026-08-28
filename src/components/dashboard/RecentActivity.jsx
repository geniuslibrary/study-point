import React from 'react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/helpers';

const RecentActivity = ({ fees }) => {
  const recentFees = (fees || []).slice(0, 5);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Fee Collections</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentFees.length > 0 ? (
              recentFees.map((fee) => (
                <tr key={fee.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{fee.studentName || 'Unknown'}</td>
                  <td className="px-4 py-3">{formatCurrency(fee.amount || 0)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(fee.date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={fee.status || 'paid'} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  No recent fee collections found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RecentActivity;
