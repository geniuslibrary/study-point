import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Clock,
  Calendar,
  Users,
  Armchair,
  IndianRupee,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  ChevronRight,
  Flame,
  Target,
  Award,
  CircleDollarSign,
  Compass,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

// Helper for formatting ₹
const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
};

// ==========================================
// 1. Hourly Peak Hours & Footfall Heatmap
// ==========================================
export function HourlyPeakHoursWidget({ students = [], seats = [] }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Approximate hourly load based on shifts
  const hours = [
    { label: '6 AM', hour: 6, morning: 0.6, evening: 0, full: 0.9 },
    { label: '7 AM', hour: 7, morning: 0.8, evening: 0, full: 0.95 },
    { label: '8 AM', hour: 8, morning: 0.9, evening: 0, full: 1.0 },
    { label: '9 AM', hour: 9, morning: 0.95, evening: 0, full: 1.0 },
    { label: '10 AM', hour: 10, morning: 1.0, evening: 0, full: 1.0 },
    { label: '11 AM', hour: 11, morning: 1.0, evening: 0, full: 1.0 },
    { label: '12 PM', hour: 12, morning: 0.95, evening: 0, full: 1.0 },
    { label: '1 PM', hour: 13, morning: 0.85, evening: 0, full: 0.95 },
    { label: '2 PM', hour: 14, morning: 0.3, evening: 0.5, full: 0.9 },
    { label: '3 PM', hour: 15, morning: 0, evening: 0.8, full: 0.95 },
    { label: '4 PM', hour: 16, morning: 0, evening: 0.9, full: 1.0 },
    { label: '5 PM', hour: 17, morning: 0, evening: 0.95, full: 1.0 },
    { label: '6 PM', hour: 18, morning: 0, evening: 1.0, full: 1.0 },
    { label: '7 PM', hour: 19, morning: 0, evening: 0.95, full: 0.95 },
    { label: '8 PM', hour: 20, morning: 0, evening: 0.85, full: 0.9 },
    { label: '9 PM', hour: 21, morning: 0, evening: 0.7, full: 0.8 },
  ];

  const fullDayCount = students.filter((s) => s.status === 'active' && (!s.shift || s.shift === 'full_day')).length;
  const morningCount = students.filter((s) => s.status === 'active' && s.shift === 'first_half').length;
  const eveningCount = students.filter((s) => s.status === 'active' && s.shift === 'second_half').length;
  const totalActive = fullDayCount + morningCount + eveningCount || 1;

  const data = hours.map((h) => {
    const present = Math.round(fullDayCount * h.full + morningCount * h.morning + eveningCount * h.evening);
    const capacity = seats.length || 20;
    const pct = Math.min(100, Math.round((present / Math.max(1, capacity)) * 100));
    return { ...h, present, pct };
  });

  const peakSlot = [...data].sort((a, b) => b.present - a.present)[0] || data[4];
  const activeHover = selectedSlot !== null ? data[selectedSlot] : peakSlot;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Library Footfall & Peak Hours
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">लाइब्रेरी पीक आवर्स व भीड़ ग्राफ (6 AM - 10 PM)</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Peak: {peakSlot.label}
          </span>
        </div>

        {/* Live Slot Stats Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Time Slot</p>
            <p className="text-sm font-black text-slate-800">{activeHover.label}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Occupancy</p>
            <p className="text-sm font-black text-indigo-600">{activeHover.pct}% Full</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Est. Students</p>
            <p className="text-sm font-black text-slate-800">{activeHover.present} seated</p>
          </div>
        </div>

        {/* High-Level Graphical Bar Chart */}
        <div className="pt-2">
          <div className="h-32 flex items-end gap-1 sm:gap-1.5 w-full">
            {data.map((item, idx) => {
              const isPeak = item.label === peakSlot.label;
              const isSelected = selectedSlot === idx;
              const heightPct = Math.max(12, item.pct);
              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setSelectedSlot(idx)}
                  onMouseLeave={() => setSelectedSlot(null)}
                >
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isSelected
                          ? 'bg-indigo-600 ring-2 ring-indigo-400 shadow-md'
                          : isPeak
                          ? 'bg-gradient-to-t from-indigo-500 to-amber-500 shadow-xs'
                          : item.pct > 70
                          ? 'bg-indigo-500/85 hover:bg-indigo-600'
                          : item.pct > 40
                          ? 'bg-indigo-300 hover:bg-indigo-400'
                          : 'bg-indigo-100 hover:bg-indigo-200'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 mt-1.5 truncate max-w-full text-center">
                    {idx % 2 === 0 ? item.label.replace(' ', '') : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-amber-500" />
          Busiest: <strong>10 AM - 1 PM</strong> & <strong>5 PM - 8 PM</strong>
        </span>
        <span className="text-[11px] text-indigo-600 font-bold">Live Hourly Matrix</span>
      </div>
    </div>
  );
}

// ==========================================
// 2. Daily Collection Trend (7 Days Bar Graph)
// ==========================================
export function DailyCollectionBarWidget({ fees = [] }) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];

    const dayTotal = fees
      .filter((f) => {
        if (!f.createdAt && !f.paymentDate && !f.date) return false;
        const fDate = new Date(f.createdAt?.toDate ? f.createdAt.toDate() : f.paymentDate || f.date);
        return fDate.toISOString().split('T')[0] === dateStr;
      })
      .reduce((sum, f) => sum + (Number(f.paidAmount || f.amount) || 0), 0);

    return { dateStr, dayLabel, total: dayTotal };
  });

  const maxDaily = Math.max(...last7Days.map((d) => d.total), 1000);
  const weekSum = last7Days.reduce((sum, d) => sum + d.total, 0);
  const bestDay = [...last7Days].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Daily Fee Collection (7 Days)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">पिछले 7 दिनों का दैनिक कमाई ग्राफ</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase">7-Day Total</p>
            <p className="text-base font-black text-emerald-700">{formatINR(weekSum)}</p>
          </div>
        </div>

        {/* Vertical Bars */}
        <div className="h-36 flex items-end gap-2 sm:gap-3 w-full pt-4">
          {last7Days.map((day) => {
            const barHeightPct = Math.max(10, Math.round((day.total / maxDaily) * 100));
            const isBest = day.total > 0 && day.dateStr === bestDay.dateStr;
            return (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition truncate">
                  {day.total > 0 ? `₹${day.total}` : '0'}
                </div>
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      isBest
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs ring-2 ring-emerald-300'
                        : day.total > 0
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-slate-100'
                    }`}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-slate-600 mt-2">{day.dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Best Day: <strong className="text-emerald-700">{bestDay.dayLabel} ({formatINR(bestDay.total)})</strong>
        </span>
        <span className="text-[11px] font-bold text-slate-400">Daily Average: {formatINR(Math.round(weekSum / 7))}</span>
      </div>
    </div>
  );
}

// ==========================================
// 3. Plan Popularity & Distribution Donut
// ==========================================
export function PlanPopularityDonutWidget({ students = [], plans = [] }) {
  const planCounts = {};
  let totalValid = 0;

  students
    .filter((s) => s.status === 'active')
    .forEach((s) => {
      totalValid++;
      let key = 'Monthly Plan';
      if (s.isDayBased || s.durationDays) {
        key = `${s.durationDays || 10}-Days Plan`;
      } else if (s.durationMonths >= 3) {
        key = `${s.durationMonths}M Multi-Plan`;
      } else if (s.shift === 'full_day') {
        key = 'Full Day Plan';
      } else if (s.shift === 'first_half') {
        key = 'Morning Slot';
      } else if (s.shift === 'second_half') {
        key = 'Evening Slot';
      }
      planCounts[key] = (planCounts[key] || 0) + 1;
    });

  const colors = [
    { fill: 'bg-indigo-600 text-white', hex: '#4f46e5', name: 'Indigo' },
    { fill: 'bg-emerald-600 text-white', hex: '#059669', name: 'Emerald' },
    { fill: 'bg-amber-500 text-white', hex: '#f59e0b', name: 'Amber' },
    { fill: 'bg-purple-600 text-white', hex: '#9333ea', name: 'Purple' },
    { fill: 'bg-cyan-600 text-white', hex: '#0891b2', name: 'Cyan' },
  ];

  const planList = Object.entries(planCounts).map(([name, count], i) => ({
    name,
    count,
    pct: totalValid ? Math.round((count / totalValid) * 100) : 0,
    color: colors[i % colors.length],
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Plan Popularity & Distribution
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">छात्रों में सबसे लोकप्रिय मेंबरशिप प्लान्स</p>
            </div>
          </div>
          <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            {totalValid} Members
          </span>
        </div>

        {/* Multi-Segment High Level Progress Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 mb-4 shadow-inner">
          {planList.map((p) => (
            <div
              key={p.name}
              style={{ width: `${Math.max(4, p.pct)}%`, backgroundColor: p.color.hex }}
              className="h-full transition-all duration-500 hover:opacity-90"
              title={`${p.name}: ${p.count} students (${p.pct}%)`}
            />
          ))}
        </div>

        {/* Breakdown List */}
        <div className="space-y-2.5 pt-1">
          {planList.slice(0, 4).map((p) => (
            <div key={p.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color.hex }} />
                <span className="font-bold text-slate-800 truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-slate-500">{p.count} students</span>
                <span className="font-black text-slate-900 w-10 text-right">{p.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Most Popular: <strong className="text-purple-700">{planList[0]?.name || 'Full Day'}</strong></span>
        <span className="text-[11px] text-slate-400 font-semibold">{planList.length} Active Plans</span>
      </div>
    </div>
  );
}

// ==========================================
// 4. 6-Month Admission vs Exit Growth Trend
// ==========================================
export function AdmissionVsExitGrowthWidget({ students = [] }) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  // Generate 6 recent months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mYear = d.getFullYear();
    const mMonth = d.getMonth();
    const label = `${monthNames[mMonth]} '${String(mYear).slice(2)}`;

    // Admissions in this month
    const admissions = students.filter((s) => {
      if (!s.joinDate) return false;
      const jDate = new Date(s.joinDate.toDate ? s.joinDate.toDate() : s.joinDate);
      return jDate.getFullYear() === mYear && jDate.getMonth() === mMonth;
    }).length;

    // Exits in this month
    const exits = students.filter((s) => {
      if (s.status !== 'left' && !s.leftDate) return false;
      const lDate = new Date(s.leftDate?.toDate ? s.leftDate.toDate() : s.leftDate || s.membershipEnd);
      return lDate.getFullYear() === mYear && lDate.getMonth() === mMonth;
    }).length;

    return { label, admissions, exits, net: admissions - exits };
  });

  const maxVal = Math.max(...months.map((m) => Math.max(m.admissions, m.exits)), 5);
  const totalNew = months.reduce((s, m) => s + m.admissions, 0);
  const totalLeft = months.reduce((s, m) => s + m.exits, 0);
  const netGrowth = totalNew - totalLeft;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Student Growth & Exit Velocity
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">6 माह नए एडमिशन बनाम छोड़ चुके छात्र</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border ${
              netGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {netGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              Net: {netGrowth >= 0 ? `+${netGrowth}` : netGrowth}
            </span>
          </div>
        </div>

        {/* Dual Bar Chart */}
        <div className="h-32 flex items-end gap-2 sm:gap-4 w-full pt-2">
          {months.map((m) => {
            const addH = Math.max(6, Math.round((m.admissions / maxVal) * 100));
            const exitH = Math.max(6, Math.round((m.exits / maxVal) * 100));
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Admission Bar */}
                  <div
                    style={{ height: `${addH}%` }}
                    className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 shadow-2xs"
                    title={`Admissions: ${m.admissions}`}
                  />
                  {/* Exit Bar */}
                  <div
                    style={{ height: `${exitH}%` }}
                    className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t-md transition-all duration-300 shadow-2xs"
                    title={`Exits: ${m.exits}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-2 truncate max-w-full">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> New: <strong>{totalNew}</strong></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Exits: <strong>{totalLeft}</strong></span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">Retention: {totalNew ? Math.round(((totalNew - totalLeft) / totalNew) * 100) : 100}%</span>
      </div>
    </div>
  );
}

// ==========================================
// 5. Seat Occupancy Radial Speedometer
// ==========================================
export function SeatOccupancyGaugeWidget({ seats = [], students = [] }) {
  const totalPhysicalSeats = seats.length || 20;
  const occupiedCount = seats.filter((s) => {
    const isAssigned = s.studentId || (s.assignedStudents && s.assignedStudents.length > 0);
    return isAssigned;
  }).length;

  const freeSeats = Math.max(0, totalPhysicalSeats - occupiedCount);
  const occupancyPct = Math.min(100, Math.round((occupiedCount / Math.max(1, totalPhysicalSeats)) * 100));

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Live Capacity Speedometer
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">सीट ऑक्यूपेंसी स्पीडोमीटर व खाली क्षमता</p>
            </div>
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
            occupancyPct >= 85
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : occupancyPct >= 50
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {occupancyPct >= 85 ? '🔥 High Demand' : occupancyPct >= 50 ? '⚡ Steady' : '🟢 Vacant'}
          </span>
        </div>

        {/* Speedometer Radial Arc Simulation */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative w-44 h-24 flex items-center justify-center overflow-hidden">
            {/* Background Arch */}
            <svg className="w-44 h-44 absolute top-0" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(180 50 50)"
              />
              {/* Dynamic Value Arch */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={occupancyPct >= 85 ? '#e11d48' : occupancyPct >= 50 ? '#f59e0b' : '#10b981'}
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (occupancyPct / 100) * 125.6}
                strokeLinecap="round"
                transform="rotate(180 50 50)"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute bottom-2 text-center">
              <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {occupancyPct}%
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Filled</p>
            </div>
          </div>
        </div>

        {/* Capacity Breakdown */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-center mt-3">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Seats</p>
            <p className="text-sm font-black text-slate-800">{totalPhysicalSeats}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Occupied</p>
            <p className="text-sm font-black text-indigo-600">{occupiedCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Available</p>
            <p className="text-sm font-black text-emerald-600">{freeSeats}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Available for new admission: <strong className="text-emerald-700">{freeSeats} seats</strong></span>
        <span className="text-[11px] font-bold text-slate-400">Live Sync</span>
      </div>
    </div>
  );
}

// ==========================================
// 6. Fee Dues Aging & Recovery Bucket
// ==========================================
export function FeeAgingRecoveryWidget({ students = [], fees = [] }) {
  const navigate = useNavigate();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let bucketGrace = 0; // 0-3 days
  let bucketMid = 0; // 4-7 days
  let bucketLate = 0; // 8-15 days
  let bucketCritical = 0; // >15 days

  students
    .filter((s) => s.status === 'active' && s.membershipEnd)
    .forEach((s) => {
      const end = new Date(s.membershipEnd);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((now - end) / (1000 * 60 * 60 * 24));
      const feeAmount = Number(s.finalPrice || s.planPrice) || 800;

      if (diffDays >= 0 && diffDays <= 3) bucketGrace += feeAmount;
      else if (diffDays >= 4 && diffDays <= 7) bucketMid += feeAmount;
      else if (diffDays >= 8 && diffDays <= 15) bucketLate += feeAmount;
      else if (diffDays > 15) bucketCritical += feeAmount;
    });

  const totalAtRisk = bucketGrace + bucketMid + bucketLate + bucketCritical;
  const maxBucket = Math.max(bucketGrace, bucketMid, bucketLate, bucketCritical, 1000);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Fee Dues Aging & Recovery
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">बकाया फीस रिकवरी बकेट ग्राफ</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase">Pending Dues</p>
            <p className="text-base font-black text-rose-600">{formatINR(totalAtRisk)}</p>
          </div>
        </div>

        {/* Aging Buckets */}
        <div className="space-y-2.5 pt-1">
          {/* Grace 0-3 */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-amber-700">0 - 3 Days (Grace Period)</span>
              <span className="text-slate-800">{formatINR(bucketGrace)}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.round((bucketGrace / maxBucket) * 100)}%` }}
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Followup 4-7 */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-orange-700">4 - 7 Days (Gentle Reminder)</span>
              <span className="text-slate-800">{formatINR(bucketMid)}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.round((bucketMid / maxBucket) * 100)}%` }}
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Late 8-15 */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-rose-600">8 - 15 Days (Urgent Alert)</span>
              <span className="text-slate-800">{formatINR(bucketLate)}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.round((bucketLate / maxBucket) * 100)}%` }}
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Critical >15 */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-red-700">15+ Days (Critical Overdue)</span>
              <span className="text-slate-800">{formatINR(bucketCritical)}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.round((bucketCritical / maxBucket) * 100)}%` }}
                className="h-full bg-red-700 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-500">Fast action prevents fee default</span>
        <button
          onClick={() => navigate('/fees')}
          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>Collect Now</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 7. Shift Capacity & Slot Comparison Chart
// ==========================================
export function ShiftCapacityCompareWidget({ seats = [], students = [] }) {
  const totalPhysical = seats.length || 20;

  const morningSeated = students.filter((s) => s.status === 'active' && s.shift === 'first_half').length;
  const eveningSeated = students.filter((s) => s.status === 'active' && s.shift === 'second_half').length;
  const fullDaySeated = students.filter((s) => s.status === 'active' && (!s.shift || s.shift === 'full_day')).length;

  const morningFree = Math.max(0, totalPhysical - (fullDaySeated + morningSeated));
  const eveningFree = Math.max(0, totalPhysical - (fullDaySeated + eveningSeated));
  const fullDayFree = Math.max(0, totalPhysical - (fullDaySeated + Math.max(morningSeated, eveningSeated)));

  const shifts = [
    {
      name: 'Full Day (पूरा दिन)',
      seated: fullDaySeated,
      free: fullDayFree,
      color: 'bg-indigo-600',
      timing: '6:00 AM - 11:00 PM',
    },
    {
      name: 'Morning Slot (सुबह)',
      seated: morningSeated,
      free: morningFree,
      color: 'bg-amber-500',
      timing: '6:00 AM - 2:00 PM',
    },
    {
      name: 'Evening Slot (शाम)',
      seated: eveningSeated,
      free: eveningFree,
      color: 'bg-purple-600',
      timing: '2:00 PM - 10:00 PM',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Shift Slot Capacity & Vacancy
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">प्रत्येक शिफ्ट में खाली सीटों का सटीक ग्राफ</p>
            </div>
          </div>
          <span className="text-xs font-black text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
            {totalPhysical} Max Seats
          </span>
        </div>

        {/* Progress Rows */}
        <div className="space-y-3.5 pt-1">
          {shifts.map((sh) => {
            const fillPct = Math.min(100, Math.round((sh.seated / totalPhysical) * 100));
            return (
              <div key={sh.name} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                  <div>
                    <span className="text-slate-900">{sh.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-1.5">({sh.timing})</span>
                  </div>
                  <span className="text-emerald-700 font-extrabold">{sh.free} Seats Free</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${fillPct}%` }}
                    className={`h-full ${sh.color} transition-all duration-500`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>{sh.seated} Booked ({fillPct}%)</span>
                  <span>{totalPhysical} Total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Instant Admissions Available: <strong className="text-emerald-700">{Math.max(morningFree, eveningFree)} slots</strong></span>
        <span className="text-[11px] font-bold text-slate-400">Shift Matrix</span>
      </div>
    </div>
  );
}

// ==========================================
// 8. Profit Margin & Expense Waterfall Chart
// ==========================================
export function ProfitMarginExpenseWidget({ revenue = 0, expenses = [] }) {
  const totalExpense = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = Math.max(0, revenue - totalExpense);
  const profitMargin = revenue ? Math.round((netProfit / revenue) * 100) : 0;
  const expenseRatio = revenue ? Math.round((totalExpense / revenue) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Net Profit & Operating Margin
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">कमाई, खर्चे व शुद्ध मुनाफा विज़ुअल ब्रेकडाउन</p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {profitMargin}% Net Margin
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</p>
            <p className="text-sm sm:text-base font-black text-slate-900">{formatINR(revenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Expenses</p>
            <p className="text-sm sm:text-base font-black text-rose-600">{formatINR(totalExpense)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Net Profit</p>
            <p className="text-sm sm:text-base font-black text-emerald-700">{formatINR(netProfit)}</p>
          </div>
        </div>

        {/* Waterfall Comparison Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Income vs Expense Split</span>
            <span>{profitMargin}% Profit / {expenseRatio}% Cost</span>
          </div>
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
            <div
              style={{ width: `${profitMargin}%` }}
              className="h-full bg-emerald-500 transition-all duration-500"
              title={`Net Profit: ${formatINR(netProfit)} (${profitMargin}%)`}
            />
            <div
              style={{ width: `${expenseRatio}%` }}
              className="h-full bg-rose-500 transition-all duration-500"
              title={`Expenses: ${formatINR(totalExpense)} (${expenseRatio}%)`}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Profit: {formatINR(netProfit)}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Cost: {formatINR(totalExpense)}</span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">Monthly Cashflow</span>
      </div>
    </div>
  );
}

// ==========================================
// 9. ARPU & Student Lifetime Value (LTV)
// ==========================================
export function AverageRevenueMetricWidget({ students = [], revenue = 0 }) {
  const activeCount = students.filter((s) => s.status === 'active').length || 1;
  const arpu = Math.round(revenue / activeCount);

  // Estimate tenure in months
  const tenures = students.map((s) => {
    if (!s.joinDate) return 3;
    const start = new Date(s.joinDate.toDate ? s.joinDate.toDate() : s.joinDate);
    const end = s.status === 'left' && s.leftDate ? new Date(s.leftDate) : new Date();
    const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
    return months;
  });

  const avgTenure = tenures.length ? (tenures.reduce((a, b) => a + b, 0) / tenures.length).toFixed(1) : '3.5';
  const ltv = Math.round(arpu * Number(avgTenure));

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                ARPU & Student Lifetime Value
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">प्रति छात्र औसत कमाई (LTV व प्रति माह टिकट साइज)</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            ★ VIP Analytics
          </span>
        </div>

        {/* 2 Big KPI Boxes */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl border border-indigo-100">
            <p className="text-[10px] text-indigo-900/70 font-bold uppercase tracking-wider">
              ARPU (Monthly Ticket)
            </p>
            <p className="text-2xl font-black text-indigo-950 mt-1">{formatINR(arpu)}</p>
            <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">Average Fee Per Seat</p>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-100">
            <p className="text-[10px] text-amber-900/70 font-bold uppercase tracking-wider">
              LTV (Lifetime Value)
            </p>
            <p className="text-2xl font-black text-amber-950 mt-1">{formatINR(ltv)}</p>
            <p className="text-[11px] text-amber-700 font-semibold mt-0.5">~{avgTenure} Months Retention</p>
          </div>
        </div>

        {/* Key Benchmark Badges */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Projected Annual Per Seat:</span>
          <strong className="text-slate-900 font-black">{formatINR(arpu * 12)} / year</strong>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Average Student Stay: <strong className="text-indigo-700">{avgTenure} Months</strong></span>
        <span className="text-[11px] font-bold text-slate-400">LTV Algorithm</span>
      </div>
    </div>
  );
}

// ==========================================
// 10. Student Shift Timing Preference Radar
// ==========================================
export function StudyTimeDistributionWidget({ students = [] }) {
  const activeStudents = students.filter((s) => s.status === 'active');
  const total = activeStudents.length || 1;

  const slots = [
    { label: 'Morning Only (6 AM - 2 PM)', count: activeStudents.filter((s) => s.shift === 'first_half').length, color: 'bg-amber-500', barColor: 'bg-amber-400' },
    { label: 'Evening Only (2 PM - 10 PM)', count: activeStudents.filter((s) => s.shift === 'second_half').length, color: 'bg-purple-600', barColor: 'bg-purple-500' },
    { label: 'Full Day Intensive (6 AM - 11 PM)', count: activeStudents.filter((s) => !s.shift || s.shift === 'full_day').length, color: 'bg-indigo-600', barColor: 'bg-indigo-500' },
    { label: 'Custom Hours Slot', count: activeStudents.filter((s) => s.shift === 'custom').length, color: 'bg-teal-600', barColor: 'bg-teal-500' },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Study Time Preference Radar
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">छात्रों की समय स्लॉट प्राथमिकता अनुपात</p>
            </div>
          </div>
          <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {activeStudents.length} Active
          </span>
        </div>

        {/* Shift Breakdown Bars */}
        <div className="space-y-3 pt-1">
          {slots.map((sl) => {
            const pct = Math.round((sl.count / total) * 100);
            return (
              <div key={sl.label}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">{sl.label}</span>
                  <span className="text-slate-900">{sl.count} ({pct}%)</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(4, pct)}%` }}
                    className={`h-full ${sl.barColor} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Highest Demand: <strong className="text-indigo-700">{[...slots].sort((a, b) => b.count - a.count)[0]?.label.split('(')[0]}</strong></span>
        <span className="text-[11px] font-bold text-slate-400">Shift Radar</span>
      </div>
    </div>
  );
}
