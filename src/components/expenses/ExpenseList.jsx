import React, { useState } from 'react';
import { Pencil, Trash2, Zap, Users, Receipt, Wrench, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  const [filterCategory, setFilterCategory] = useState('All');

  const filteredExpenses = expenses
    .filter((e) => filterCategory === 'All' || e.category === filterCategory)
    .sort((a, b) => {
      const dateA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime();
      const dateB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime();
      return dateB - dateA;
    });

  const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const getCategoryIcon = (category) => {
    if (category?.includes('Electricity')) return <Zap className="w-3.5 h-3.5 text-amber-600" />;
    if (category?.includes('Staff')) return <Users className="w-3.5 h-3.5 text-indigo-600" />;
    if (category?.includes('Repair') || category?.includes('Maintenance'))
      return <Wrench className="w-3.5 h-3.5 text-purple-600" />;
    return <Receipt className="w-3.5 h-3.5 text-gray-600" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Monthly Expense & Utility Records</h3>
          <p className="text-xs text-gray-500 mt-0.5">Electricity bills, staff salaries & additional repairs</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600">Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border-gray-300 text-xs font-medium focus:border-indigo-500 focus:ring-indigo-500 border p-1.5 bg-white"
          >
            <option value="All">All Categories ({expenses.length})</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-left">Description / Meter Details</th>
              <th className="px-5 py-3 text-right">Amount (₹)</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-sm">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-gray-600">
                    {formatDate(
                      expense.date?.seconds ? new Date(expense.date.seconds * 1000) : expense.date
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                      {getCategoryIcon(expense.category)}
                      <span>{expense.category}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-700 max-w-sm">
                    <div className="font-medium text-gray-900">{expense.description || '—'}</div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-lg mr-1 cursor-pointer transition-colors"
                      title="Edit expense"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(expense)}
                      className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-xs text-gray-400">
                  No expense records found for this month / category.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50/80 border-t border-gray-200">
            <tr>
              <td colSpan="3" className="px-5 py-3.5 text-right text-xs font-bold text-gray-700 uppercase">
                Total Expenses for Period:
              </td>
              <td className="px-5 py-3.5 text-right text-base font-extrabold text-red-600">
                {formatCurrency(total)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
