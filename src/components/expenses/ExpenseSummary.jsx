import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';
import Card from '../common/Card';
import { TrendingUp, TrendingDown, IndianRupee, Zap, Users, ShieldAlert } from 'lucide-react';

const COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#3B82F6', '#EF4444', '#14B8A6'];

export default function ExpenseSummary({ expenses, revenue }) {
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = revenue - totalExpenses;
  const isProfit = netProfit >= 0;

  // Sub-totals
  const electricityTotal = expenses
    .filter((e) => e.category?.includes('Electricity'))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const salaryTotal = expenses
    .filter((e) => e.category?.includes('Staff'))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const maintenanceTotal = expenses
    .filter((e) => e.category?.includes('Maintenance') || e.category?.includes('Repair') || e.category?.includes('Other'))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Group by category for pie chart
  const categoryData = expenses
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.name === curr.category);
      if (existing) {
        existing.value += Number(curr.amount);
      } else {
        acc.push({ name: curr.category, value: Number(curr.amount) });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const comparisonData = [
    { name: 'Financials', Revenue: revenue, Expenses: totalExpenses },
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Student Fee Revenue
            </span>
            <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(revenue)}</p>
            <p className="text-xs text-green-600 font-medium mt-0.5">Month Collections</p>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-red-600">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{expenses.length} Expense Bills</p>
          </div>
        </div>

        {/* Card 3: Electricity & Staff Sub-totals */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 rounded-2xl p-5 shadow-xs border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Light Bill & Staff
            </span>
            <div className="flex items-center gap-1 text-indigo-600">
              <Zap className="w-4 h-4" />
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs font-medium text-gray-700">
              <span>⚡ Electricity:</span>
              <span className="font-bold text-gray-900">{formatCurrency(electricityTotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-700">
              <span>👥 Staff Salary:</span>
              <span className="font-bold text-gray-900">{formatCurrency(salaryTotal)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Profit/Loss */}
        <div
          className={`rounded-2xl p-5 shadow-xs border flex flex-col justify-between ${
            isProfit
              ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/40 border-green-200'
              : 'bg-gradient-to-br from-red-50/80 to-rose-50/40 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Net Profit / Loss
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-extrabold ${
                isProfit ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {formatCurrency(netProfit)}
            </p>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              {isProfit ? '✅ Net Surplus This Month' : '⚠️ Net Deficit'}
            </p>
          </div>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80 flex flex-col" title="Expense Breakdown by Category">
          <div className="flex-grow">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                No expense data for this month
              </div>
            )}
          </div>
        </Card>

        <Card className="h-80 flex flex-col" title="Monthly Revenue vs Expenses">
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Revenue" fill="#10B981" radius={[6, 6, 0, 0]} name="Fee Revenue" />
                <Bar dataKey="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} name="Total Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
