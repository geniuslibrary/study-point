import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill }} className="font-semibold">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data }) => {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Revenue vs Expenses</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">Last 6 months trend</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Net Profit</p>
          <p className={`text-sm font-extrabold ${totalRevenue - totalExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(totalRevenue - totalExpenses)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-indigo-500" />
          <span className="text-xs text-gray-500 font-medium">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-rose-400" />
          <span className="text-xs text-gray-500 font-medium">Expenses</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', radius: 8 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenses" name="Expenses" fill="#FB7185" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
