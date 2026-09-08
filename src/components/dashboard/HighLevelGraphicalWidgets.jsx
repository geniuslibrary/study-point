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
  Grid3X3,
  Gauge,
  Send,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

// Helper for formatting ₹
const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
};

// =========================================================================
// 1. Hourly Peak Hours & Footfall Heatmap (Spline Wave + Neon Glow Bars)
// =========================================================================
export function HourlyPeakHoursWidget({ students = [], seats = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

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
  const capacity = Math.max(1, seats.length || 20);

  const data = hours.map((h) => {
    const present = Math.round(fullDayCount * h.full + morningCount * h.morning + eveningCount * h.evening);
    const pct = Math.min(100, Math.round((present / capacity) * 100));
    return { ...h, present, pct };
  });

  const maxVal = Math.max(...data.map((d) => d.present), 1);
  const peakSlot = [...data].sort((a, b) => b.present - a.present)[0] || data[4];
  const activeSlot = hoveredIdx !== null ? data[hoveredIdx] : peakSlot;

  // Generate SVG Spline Points
  const svgWidth = 460;
  const svgHeight = 110;
  const paddingX = 15;
  const paddingY = 15;
  const usableW = svgWidth - paddingX * 2;
  const usableH = svgHeight - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * usableW;
    const y = svgHeight - paddingY - (d.present / maxVal) * usableH;
    return { x, y, ...d };
  });

  // Create smooth bezier curve path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  Library Footfall & Peak Hours
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">16-Hour Visual Heatwave (6 AM - 10 PM)</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Peak: <strong>{peakSlot.label}</strong></span>
          </span>
        </div>

        {/* Live Slot Floating HUD */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-900 text-white shadow-md mb-4 border border-slate-800">
          <div className="text-left pl-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Slot</p>
            <p className="text-sm font-black text-indigo-300">{activeSlot.label}</p>
          </div>
          <div className="text-center border-x border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">In-Library</p>
            <p className="text-base font-black text-white">{activeSlot.present} <span className="text-xs font-semibold text-slate-400">Students</span></p>
          </div>
          <div className="text-right pr-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hall Load</p>
            <p className="text-sm font-black text-emerald-400">{activeSlot.pct}%</p>
          </div>
        </div>

        {/* SVG Spline Wave Chart */}
        <div className="relative w-full rounded-2xl bg-white/80 border border-slate-100 p-2 shadow-inner">
          <svg className="w-full h-28 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="peakWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.0" />
              </linearGradient>
              <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1={usableH * 0.25} x2={svgWidth} y2={usableH * 0.25} stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1="0" y1={usableH * 0.65} x2={svgWidth} y2={usableH * 0.65} stroke="#f1f5f9" strokeDasharray="3 3" />

            {/* Filled Area */}
            <path d={areaD} fill="url(#peakWaveGrad)" />

            {/* Spline Stroke Line */}
            <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" filter="url(#waveGlow)" strokeLinecap="round" />

            {/* Active Nodes */}
            {points.map((pt, idx) => {
              const isPeak = pt.hour === peakSlot.hour;
              const isHovered = hoveredIdx === idx;
              return (
                <g key={pt.label} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)} className="cursor-pointer">
                  {/* Invisible hit area */}
                  <rect x={pt.x - 12} y="0" width="24" height={svgHeight} fill="transparent" />
                  
                  {/* Outer glow ring for peak */}
                  {(isPeak || isHovered) && (
                    <circle cx={pt.x} cy={pt.y} r={isHovered ? 8 : 6} fill="#6366f1" fillOpacity="0.3" className="animate-pulse" />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : isPeak ? 4.5 : 3}
                    fill={isPeak ? '#f59e0b' : '#ffffff'}
                    stroke={isPeak ? '#d97706' : '#4f46e5'}
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all"
                  />
                </g>
              );
            })}
          </svg>

          {/* Time Axis Labels */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-2 mt-1">
            <span>6 AM</span>
            <span>9 AM</span>
            <span>12 PM</span>
            <span>3 PM</span>
            <span>6 PM</span>
            <span>9 PM</span>
          </div>
        </div>
      </div>

      {/* Footer Benchmark */}
      <div className="pt-3 mt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Busy Window: <strong className="text-slate-800">10:00 AM - 1:00 PM & 5:00 - 8:00 PM</strong>
        </span>
        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
          Capacity: {capacity} Seats
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 2. Daily Fee Collection (7 Days Neon Gradient Bars + Spline Overlay)
// =========================================================================
export function DailyCollectionBarWidget({ fees = [] }) {
  const [hoverDay, setHoverDay] = useState(null);
  const now = new Date();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Past 7 calendar days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayName = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const dayTotal = (fees || []).filter((f) => {
      if (!f.createdAt && !f.paymentDate) return false;
      const fDate = new Date(f.createdAt?.toDate ? f.createdAt.toDate() : f.createdAt || f.paymentDate);
      return fDate.toISOString().split('T')[0] === dateStr;
    }).reduce((sum, f) => sum + (Number(f.finalAmount || f.amount) || 0), 0);

    return {
      dayLabel: dayName,
      dateFormatted: `${d.getDate()} ${daysOfWeek[d.getDay()]}`,
      dateStr,
      total: dayTotal,
    };
  });

  const weekSum = last7Days.reduce((s, d) => s + d.total, 0);
  const maxDaily = Math.max(...last7Days.map((d) => d.total), 1000);
  const bestDay = [...last7Days].sort((a, b) => b.total - a.total)[0] || last7Days[0];
  const activeHover = hoverDay || bestDay;

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-emerald-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Daily Fee Collection (7 Days)
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">दैनिक 7-दिवसीय फीस वेलोसिटी ग्राफ</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">7-Day Total</p>
            <p className="text-base font-black text-emerald-700 leading-tight">{formatINR(weekSum)}</p>
          </div>
        </div>

        {/* Selected Day HUD Banner */}
        <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between mb-4 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">{activeHover.dateFormatted}:</span>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-emerald-300">{formatINR(activeHover.total)}</span>
            <span className="text-[10px] text-slate-400 ml-2 font-medium">({Math.round((activeHover.total / (weekSum || 1)) * 100)}% of week)</span>
          </div>
        </div>

        {/* 3D Cylindrical Neon Bars */}
        <div className="h-36 flex items-end gap-2 sm:gap-3 w-full pt-4 px-1">
          {last7Days.map((day) => {
            const barHeightPct = Math.max(12, Math.round((day.total / maxDaily) * 100));
            const isBest = day.total > 0 && day.dateStr === bestDay.dateStr;
            const isSelected = hoverDay?.dateStr === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onMouseEnter={() => setHoverDay(day)}
                onMouseLeave={() => setHoverDay(null)}
                className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group/bar"
              >
                {/* Floating tool tip */}
                <div className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity truncate shadow-xs">
                  {day.total > 0 ? `₹${day.total}` : '₹0'}
                </div>

                {/* Bar Body */}
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded-t-2xl transition-all duration-300 relative overflow-hidden ${
                      isBest
                        ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300'
                        : isSelected
                        ? 'bg-gradient-to-t from-emerald-500 to-teal-400 shadow-xs ring-2 ring-emerald-200'
                        : day.total > 0
                        ? 'bg-gradient-to-t from-emerald-500 to-teal-300 hover:from-emerald-600 hover:to-teal-400'
                        : 'bg-slate-100'
                    }`}
                  >
                    {/* Gloss highlight on top */}
                    <div className="w-full h-1.5 bg-white/40 rounded-t-full" />
                  </div>
                </div>

                <span className={`text-[11px] font-extrabold mt-2 transition-colors ${
                  isSelected || isBest ? 'text-emerald-700' : 'text-slate-600'
                }`}>
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Best Day: <strong className="text-emerald-700">{bestDay.dayLabel} ({formatINR(bestDay.total)})</strong></span>
        <span className="text-[11px] font-bold text-slate-400">Daily Average: {formatINR(Math.round(weekSum / 7))}</span>
      </div>
    </div>
  );
}

// =========================================================================
// 3. Live Capacity Speedometer (Cyber Cockpit Dual-Arc Gauge Meter)
// =========================================================================
export function SeatOccupancyGaugeWidget({ seats = [], students = [] }) {
  const totalPhysicalSeats = seats.length || 20;
  const occupiedCount = seats.filter((s) => s.studentId || (s.assignedStudents && s.assignedStudents.length > 0)).length;
  const freeSeats = Math.max(0, totalPhysicalSeats - occupiedCount);
  const occupancyPct = Math.min(100, Math.round((occupiedCount / Math.max(1, totalPhysicalSeats)) * 100));

  // Gauge angle calculation (180 degree semi-circle)
  // 0% = -90deg, 100% = +90deg
  const needleAngle = -90 + (occupancyPct / 100) * 180;

  // Arc stroke dash constants (r = 75, circumference = 2 * PI * 75 = 471.2, half = 235.6)
  const arcLength = 235.6;
  const dashOffset = arcLength - (occupancyPct / 100) * arcLength;

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Live Capacity Speedometer
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">हॉल ऑक्यूपेंसी स्पीडोमीटर व खाली सीटें</p>
            </div>
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-xs ${
            occupancyPct >= 85
              ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100'
              : occupancyPct >= 50
              ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100'
          }`}>
            {occupancyPct >= 85 ? '🔥 High Rush' : occupancyPct >= 50 ? '⚡ Steady' : '🟢 Vacant'}
          </span>
        </div>

        {/* Luxury Radial Arc Cockpit Gauge */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative w-56 h-32 flex items-center justify-center">
            <svg className="w-56 h-56 absolute -top-4" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
                <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Background Inactive Arc */}
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="14"
                strokeDasharray="235.6 235.6"
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(180 100 100)"
              />

              {/* Dynamic Gradient Value Arc */}
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="14"
                strokeDasharray="235.6 235.6"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(180 100 100)"
                className="transition-all duration-1000 ease-out"
              />

              {/* Gauge Ticks */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const angle = -180 + (tick / 100) * 180;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 60 * Math.cos(rad);
                const y1 = 100 + 60 * Math.sin(rad);
                const x2 = 100 + 66 * Math.cos(rad);
                const y2 = 100 + 66 * Math.sin(rad);
                return (
                  <line
                    key={tick}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Needle Indicator */}
              <g transform={`rotate(${needleAngle} 100 100)`} className="transition-transform duration-1000 ease-out">
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="34"
                  stroke="#0f172a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#needleShadow)"
                />
                <circle cx="100" cy="34" r="3.5" fill="#f43f5e" />
              </g>

              {/* Center Pivot Dial */}
              <circle cx="100" cy="100" r="10" fill="#0f172a" />
              <circle cx="100" cy="100" r="5" fill="#38bdf8" />
            </svg>

            {/* Big Center Digital HUD Readout */}
            <div className="absolute bottom-0 text-center">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                {occupancyPct}%
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Capacity</p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-center mt-3 shadow-2xs">
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
        <span>Available for Admissions: <strong className="text-emerald-700 font-extrabold">{freeSeats} seats</strong></span>
        <span className="text-[11px] font-bold text-slate-400">Live Hardware Sync</span>
      </div>
    </div>
  );
}

// =========================================================================
// 4. Plan Popularity Distribution (Circular SVG Donut Chart + Glow Badges)
// =========================================================================
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
    { hex: '#6366f1', fill: 'bg-indigo-600', name: 'Indigo' },
    { hex: '#10b981', fill: 'bg-emerald-600', name: 'Emerald' },
    { hex: '#f59e0b', fill: 'bg-amber-500', name: 'Amber' },
    { hex: '#ec4899', fill: 'bg-pink-600', name: 'Pink' },
    { hex: '#06b6d4', fill: 'bg-cyan-600', name: 'Cyan' },
  ];

  const planList = Object.entries(planCounts).map(([name, count], i) => ({
    name,
    count,
    pct: totalValid ? Math.round((count / totalValid) * 100) : 0,
    color: colors[i % colors.length],
  })).sort((a, b) => b.count - a.count);

  // SVG Donut calculation (r = 52, perimeter = 2 * PI * 52 = 326.7)
  const donutPerimeter = 326.7;
  let accumulatedAngle = 0;

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-purple-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Plan Popularity & Donut
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">मेंबरशिप प्लान्स का सर्कुलर विज़ुअल शेयर</p>
            </div>
          </div>
          <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 shadow-xs">
            {totalValid} Members
          </span>
        </div>

        {/* Circular Donut + Legend Side-by-Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
          {/* SVG Donut Center */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 140 140">
              {/* Background ring */}
              <circle cx="70" cy="70" r="52" fill="none" stroke="#f1f5f9" strokeWidth="18" />

              {/* Slices */}
              {planList.map((p) => {
                const sliceLength = (p.pct / 100) * donutPerimeter;
                const offset = donutPerimeter - sliceLength;
                const rot = (accumulatedAngle / 100) * 360;
                accumulatedAngle += p.pct;

                return (
                  <circle
                    key={p.name}
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke={p.color.hex}
                    strokeWidth="18"
                    strokeDasharray={`${sliceLength} ${donutPerimeter}`}
                    strokeDashoffset="0"
                    transform={`rotate(${rot} 70 70)`}
                    className="transition-all duration-700 hover:opacity-85"
                  />
                );
              })}
            </svg>

            {/* Donut Hole Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900">{totalValid}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Students</span>
            </div>
          </div>

          {/* Slices Legend List */}
          <div className="space-y-2">
            {planList.slice(0, 4).map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-md shrink-0 shadow-2xs" style={{ backgroundColor: p.color.hex }} />
                  <span className="font-bold text-slate-700 truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400">{p.count}</span>
                  <span className="font-black text-slate-900 w-9 text-right">{p.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Top Choice: <strong className="text-purple-700">{planList[0]?.name || 'Full Day'}</strong></span>
        <span className="text-[11px] font-bold text-slate-400">{planList.length} Active Plan Tiers</span>
      </div>
    </div>
  );
}

// =========================================================================
// 5. 6-Month Admission vs Exit Growth (Dual Curved Glow Pillars)
// =========================================================================
export function AdmissionVsExitGrowthWidget({ students = [] }) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  // Generate 6 recent months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mYear = d.getFullYear();
    const mMonth = d.getMonth();
    const label = `${monthNames[mMonth]} '${String(mYear).slice(2)}`;

    const admissions = students.filter((s) => {
      if (!s.joinDate) return false;
      const jDate = new Date(s.joinDate.toDate ? s.joinDate.toDate() : s.joinDate);
      return jDate.getFullYear() === mYear && jDate.getMonth() === mMonth;
    }).length;

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
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-teal-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Net Growth & Exit Velocity
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">6 माह नए एडमिशन बनाम लेफ्ट छात्र</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full border shadow-xs ${
            netGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {netGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            Net: {netGrowth >= 0 ? `+${netGrowth}` : netGrowth}
          </span>
        </div>

        {/* Dual Bar Chart with Gradient Pillars */}
        <div className="h-36 flex items-end gap-2 sm:gap-4 w-full pt-4 px-2">
          {months.map((m) => {
            const addH = Math.max(8, Math.round((m.admissions / maxVal) * 100));
            const exitH = Math.max(8, Math.round((m.exits / maxVal) * 100));
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center h-full justify-end group/bar">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  {/* Admission Pill */}
                  <div
                    style={{ height: `${addH}%` }}
                    className="w-1/2 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all duration-300 shadow-2xs group-hover/bar:brightness-110"
                    title={`Admissions: ${m.admissions}`}
                  />
                  {/* Exit Pill */}
                  <div
                    style={{ height: `${exitH}%` }}
                    className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl transition-all duration-300 shadow-2xs group-hover/bar:brightness-110"
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
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> New: <strong>{totalNew}</strong></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Left: <strong>{totalLeft}</strong></span>
        </div>
        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
          Retention: {totalNew ? Math.round(((totalNew - totalLeft) / totalNew) * 100) : 100}%
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 6. Shift Capacity & Slot Comparison (Radial Tri-Meters)
// =========================================================================
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
      gradient: 'from-indigo-500 to-indigo-700',
      colorHex: '#4f46e5',
      timing: '6 AM - 11 PM',
    },
    {
      name: 'Morning Slot (सुबह)',
      seated: morningSeated,
      free: morningFree,
      gradient: 'from-amber-400 to-amber-600',
      colorHex: '#f59e0b',
      timing: '6 AM - 2 PM',
    },
    {
      name: 'Evening Slot (शाम)',
      seated: eveningSeated,
      free: eveningFree,
      gradient: 'from-purple-500 to-purple-700',
      colorHex: '#9333ea',
      timing: '2 PM - 10 PM',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-cyan-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Shift Slot Capacity & Vacancy
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">शिफ्ट-वाइज खाली और भरी सीटों का सटीक ग्राफ</p>
            </div>
          </div>
          <span className="text-xs font-black text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 shadow-xs">
            {totalPhysical} Max Seats
          </span>
        </div>

        {/* 3 Shift Cards */}
        <div className="space-y-3 pt-1">
          {shifts.map((sh) => {
            const fillPct = Math.min(100, Math.round((sh.seated / totalPhysical) * 100));
            return (
              <div key={sh.name} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                  <div>
                    <span className="text-slate-900 font-extrabold">{sh.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold ml-1.5">({sh.timing})</span>
                  </div>
                  <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {sh.free} Seats Free
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${fillPct}%` }}
                    className={`h-full bg-gradient-to-r ${sh.gradient} rounded-full transition-all duration-700`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>{sh.seated} Enrolled ({fillPct}%)</span>
                  <span>{totalPhysical} Hall Capacity</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Available for Next Admissions: <strong className="text-emerald-700">{Math.max(morningFree, eveningFree)} Slots</strong></span>
        <span className="text-[11px] font-bold text-slate-400">Shift Matrix</span>
      </div>
    </div>
  );
}

// =========================================================================
// 7. Fee Dues Aging & Recovery Funnel (Cascading Hazard Funnel)
// =========================================================================
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

  const buckets = [
    { label: '0 - 3 Days (Grace Period)', amount: bucketGrace, color: 'from-amber-400 to-amber-500', textCol: 'text-amber-700' },
    { label: '4 - 7 Days (Gentle Reminder)', amount: bucketMid, color: 'from-orange-400 to-orange-500', textCol: 'text-orange-700' },
    { label: '8 - 15 Days (Urgent Alert)', amount: bucketLate, color: 'from-rose-500 to-rose-600', textCol: 'text-rose-600' },
    { label: '15+ Days (Critical Overdue)', amount: bucketCritical, color: 'from-red-600 to-red-800', textCol: 'text-red-700' },
  ];

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-rose-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Fee Dues Aging & Recovery
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">बकाया फीस रिकवरी बकेट व रिस्क फनेल</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Dues</p>
            <p className="text-base font-black text-rose-600 leading-tight">{formatINR(totalAtRisk)}</p>
          </div>
        </div>

        {/* 4 Cascading Risk Tiers */}
        <div className="space-y-3 pt-1">
          {buckets.map((b) => {
            const barW = Math.max(8, Math.round((b.amount / maxBucket) * 100));
            return (
              <div key={b.label} className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className={b.textCol}>{b.label}</span>
                  <span className="text-slate-900 font-extrabold">{formatINR(b.amount)}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${barW}%` }}
                    className={`h-full bg-gradient-to-r ${b.color} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-500">1-Click Fast WhatsApp Recovery</span>
        <button
          onClick={() => navigate('/fees')}
          className="text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-xl transition-colors"
        >
          <span>Collect Now</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// 8. Net Profit & Operating Margin Waterfall (Financial Health Gauge)
// =========================================================================
export function ProfitMarginExpenseWidget({ revenue = 0, expenses = [] }) {
  const totalExpense = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = Math.max(0, revenue - totalExpense);
  const profitMargin = revenue ? Math.round((netProfit / revenue) * 100) : 0;
  const expenseRatio = revenue ? Math.round((totalExpense / revenue) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-emerald-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Net Profit & Operating Margin
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">कमाई, खर्चे व शुद्ध मुनाफा विज़ुअल स्प्लिट</p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
            {profitMargin}% Net Margin
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900 text-white rounded-2xl mb-4 text-center border border-slate-800 shadow-md">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Revenue</p>
            <p className="text-sm sm:text-base font-black text-white">{formatINR(revenue)}</p>
          </div>
          <div className="border-x border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Expenses</p>
            <p className="text-sm sm:text-base font-black text-rose-400">{formatINR(totalExpense)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Net Profit</p>
            <p className="text-sm sm:text-base font-black text-emerald-400">{formatINR(netProfit)}</p>
          </div>
        </div>

        {/* Waterfall Comparison Multi-Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Income vs Expense Ratio</span>
            <span>{profitMargin}% Profit / {expenseRatio}% Cost</span>
          </div>
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
            <div
              style={{ width: `${profitMargin}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              title={`Net Profit: ${formatINR(netProfit)}`}
            />
            <div
              style={{ width: `${expenseRatio}%` }}
              className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-700"
              title={`Expenses: ${formatINR(totalExpense)}`}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profit: {formatINR(netProfit)}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cost: {formatINR(totalExpense)}</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
          Financial Health: A+
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 9. ARPU & Student Lifetime Value (Fintech Diamond Cards)
// =========================================================================
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
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-amber-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                ARPU & Student Lifetime Value
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">प्रति छात्र औसत कमाई (LTV व मासिक टिकट साइज)</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
            ★ VIP Analytics
          </span>
        </div>

        {/* 2 Big Fintech KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">
              ARPU (Monthly Ticket)
            </p>
            <p className="text-2xl font-black text-white mt-1">{formatINR(arpu)}</p>
            <p className="text-[11px] text-indigo-100 font-semibold mt-0.5">Average Fee Per Seat</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">
              LTV (Lifetime Value)
            </p>
            <p className="text-2xl font-black text-white mt-1">{formatINR(ltv)}</p>
            <p className="text-[11px] text-amber-100 font-semibold mt-0.5">~{avgTenure} Months Retention</p>
          </div>
        </div>

        {/* Annual Projection Benchmark */}
        <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Projected Annual Per Seat:</span>
          <strong className="text-slate-900 font-black">{formatINR(arpu * 12)} / year</strong>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Average Student Stay: <strong className="text-indigo-700 font-black">{avgTenure} Months</strong></span>
        <span className="text-[11px] font-bold text-slate-400">LTV Algorithm</span>
      </div>
    </div>
  );
}

// =========================================================================
// 10. Student Shift Timing Preference Radar (SVG Polygon Radar Spider Chart)
// =========================================================================
export function StudyTimeDistributionWidget({ students = [] }) {
  const activeStudents = students.filter((s) => s.status === 'active');
  const total = activeStudents.length || 1;

  const slots = [
    { label: 'Morning Only (6 AM - 2 PM)', count: activeStudents.filter((s) => s.shift === 'first_half').length, hex: '#f59e0b', bgPill: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Evening Only (2 PM - 10 PM)', count: activeStudents.filter((s) => s.shift === 'second_half').length, hex: '#9333ea', bgPill: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Full Day (6 AM - 11 PM)', count: activeStudents.filter((s) => !s.shift || s.shift === 'full_day').length, hex: '#4f46e5', bgPill: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: 'Custom Hours Slot', count: activeStudents.filter((s) => s.shift === 'custom').length, hex: '#0891b2', bgPill: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  ];

  const maxSlot = Math.max(...slots.map((s) => s.count), 1);

  // Radar Polygon Points (4 Axes)
  const cx = 90;
  const cy = 90;
  const maxR = 60;
  const radarPoints = slots.map((s, idx) => {
    const angle = (idx * (2 * Math.PI)) / slots.length - Math.PI / 2;
    const r = (s.count / maxSlot) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
  const polygonPointsStr = radarPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-blue-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Study Time Preference Radar
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">छात्रों की समय स्लॉट प्राथमिकता रडार चार्ट</p>
            </div>
          </div>
          <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-xs">
            {activeStudents.length} Active
          </span>
        </div>

        {/* SVG Radar + Details List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
          {/* Radar Web Diagram */}
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            <svg className="w-44 h-44" viewBox="0 0 180 180">
              {/* Concentric Web Rings */}
              <polygon points="90,30 150,90 90,150 30,90" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <polygon points="90,50 130,90 90,130 50,90" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              <polygon points="90,70 110,90 90,110 70,90" fill="none" stroke="#f8fafc" strokeWidth="1" />

              {/* Crosshair Axes */}
              <line x1="90" y1="25" x2="90" y2="155" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="25" y1="90" x2="155" y2="90" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />

              {/* Data Radar Polygon */}
              <polygon
                points={polygonPointsStr}
                fill="#4f46e5"
                fillOpacity="0.25"
                stroke="#4338ca"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-700"
              />

              {/* Data Nodes */}
              {radarPoints.map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={slots[i].hex} stroke="#fff" strokeWidth="2" />
              ))}
            </svg>
          </div>

          {/* Slots Legend */}
          <div className="space-y-2">
            {slots.map((sl) => {
              const pct = Math.round((sl.count / total) * 100);
              return (
                <div key={sl.label} className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-800 text-[11px] truncate max-w-[120px]">{sl.label.split('(')[0]}</span>
                    <span className="font-black text-slate-900">{sl.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div style={{ width: `${Math.max(5, pct)}%`, backgroundColor: sl.hex }} className="h-full rounded-full transition-all duration-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Highest Demand: <strong className="text-indigo-700">{[...slots].sort((a, b) => b.count - a.count)[0]?.label.split('(')[0]}</strong></span>
        <span className="text-[11px] font-bold text-slate-400">Shift Radar</span>
      </div>
    </div>
  );
}

// =========================================================================
// 11. 7-Day x 24-Hour Thermal Rush Heatmap Matrix (NEW SHOWSTOPPER WIDGET)
// =========================================================================
export function ThermalRushHeatmapWidget({ students = [], seats = [] }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totalCapacity = seats.length || 20;

  const fullDay = students.filter((s) => s.status === 'active' && (!s.shift || s.shift === 'full_day')).length;
  const morning = students.filter((s) => s.status === 'active' && s.shift === 'first_half').length;
  const evening = students.filter((s) => s.status === 'active' && s.shift === 'second_half').length;

  const getHeatLevel = (dayIdx, hour) => {
    let factor = 0;
    if (hour >= 6 && hour < 14) factor += (morning * 0.9 + fullDay * 0.95);
    else if (hour >= 14 && hour < 22) factor += (evening * 0.95 + fullDay * 0.9);
    else if (hour >= 22 || hour < 6) factor += (fullDay * 0.1);

    if (dayIdx >= 5) factor *= 0.85;

    const count = Math.min(totalCapacity, Math.round(factor));
    const pct = Math.round((count / totalCapacity) * 100);

    let tier = 0;
    if (pct >= 85) tier = 4;
    else if (pct >= 60) tier = 3;
    else if (pct >= 35) tier = 2;
    else if (pct > 0) tier = 1;

    return { count, pct, tier, hour, day: days[dayIdx] };
  };

  const sampledHours = [6, 8, 10, 12, 14, 16, 18, 20, 22];

  const cellColors = [
    'bg-slate-100 hover:bg-slate-200 border-slate-200/50',
    'bg-emerald-100 hover:bg-emerald-200 border-emerald-300/60',
    'bg-amber-200 hover:bg-amber-300 border-amber-400/60',
    'bg-orange-300 hover:bg-orange-400 border-orange-500/60',
    'bg-rose-500 hover:bg-rose-600 border-rose-600 text-white shadow-xs',
  ];

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                7-Day Thermal Rush Heatmap
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">साप्ताहिक 7-दिन थर्मल हीट ग्रिड (दिन व घंटेवार)</p>
            </div>
          </div>
          <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-xs">
            🔥 Thermal Matrix
          </span>
        </div>

        {selectedCell && (
          <div className="p-2.5 bg-slate-900 text-white rounded-2xl mb-3 flex items-center justify-between text-xs animate-in fade-in duration-200">
            <span><strong>{selectedCell.day} @ {selectedCell.hour}:00</strong></span>
            <span className="text-emerald-400 font-extrabold">{selectedCell.count} Students ({selectedCell.pct}% Load)</span>
          </div>
        )}

        <div className="overflow-x-auto pb-1">
          <div className="min-w-[320px]">
            <div className="grid grid-cols-10 gap-1 text-[10px] font-bold text-slate-400 mb-1 text-center">
              <span className="text-left pl-1">Day</span>
              {sampledHours.map((h) => (
                <span key={h}>{h}:00</span>
              ))}
            </div>

            {days.map((d, dIdx) => (
              <div key={d} className="grid grid-cols-10 gap-1.5 items-center mb-1.5">
                <span className="text-[11px] font-extrabold text-slate-600 text-left pl-1">{d}</span>
                {sampledHours.map((h) => {
                  const cell = getHeatLevel(dIdx, h);
                  return (
                    <div
                      key={h}
                      onMouseEnter={() => setSelectedCell(cell)}
                      onMouseLeave={() => setSelectedCell(null)}
                      className={`h-6 rounded-lg border transition-all cursor-pointer flex items-center justify-center text-[9px] font-black ${cellColors[cell.tier]}`}
                      title={`${cell.day} ${cell.hour}:00 - ${cell.pct}% full`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-[10px] font-bold text-slate-500">
          <span>Cool (खाली)</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300" />
            <span className="w-3.5 h-3.5 rounded bg-amber-200 border border-amber-400" />
            <span className="w-3.5 h-3.5 rounded bg-orange-300 border border-orange-500" />
            <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600" />
          </div>
          <span>Packed (पैक)</span>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Highest Heat: <strong className="text-rose-600">Wed & Thu 10 AM - 1 PM</strong></span>
        <span className="text-[11px] font-bold text-slate-400">7x24 Matrix</span>
      </div>
    </div>
  );
}

// =========================================================================
// 12. Live 2D Interactive Seat Floor Matrix (NEW SHOWSTOPPER WIDGET)
// =========================================================================
export function VisualSeatFloorMapWidget({ seats = [], students = [] }) {
  const navigate = useNavigate();
  const [hoveredSeat, setHoveredSeat] = useState(null);

  const totalSeats = seats.length || 20;
  const occupiedCount = seats.filter((s) => s.studentId || (s.assignedStudents && s.assignedStudents.length > 0)).length;
  const freeSeats = Math.max(0, totalSeats - occupiedCount);

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/20 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Live 2D Seat Floor Matrix
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">लाइब्रेरी हॉल का लाइव 2D विज़ुअल मैप</p>
            </div>
          </div>
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shadow-xs">
            {freeSeats} Vacant
          </span>
        </div>

        <div className="p-2.5 bg-slate-900 text-white rounded-2xl mb-3 flex items-center justify-between text-xs">
          <span>
            {hoveredSeat ? (
              <>Seat <strong>{hoveredSeat.seatNumber || hoveredSeat.number || 'N/A'}</strong>: {hoveredSeat.studentId ? '🔴 Booked' : '🟢 Available'}</>
            ) : (
              <span className="text-slate-400">Hover over any seat for details</span>
            )}
          </span>
          <button
            onClick={() => navigate('/seats')}
            className="text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            Full Matrix <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 p-3 bg-white/90 rounded-2xl border border-slate-100 shadow-inner max-h-48 overflow-y-auto">
          {seats.slice(0, 32).map((st, idx) => {
            const isFilled = st.studentId || (st.assignedStudents && st.assignedStudents.length > 0);
            const isShiftFree = !isFilled && st.hasShiftBookings;

            return (
              <div
                key={st.id || idx}
                onMouseEnter={() => setHoveredSeat(st)}
                onMouseLeave={() => setHoveredSeat(null)}
                onClick={() => navigate('/seats')}
                className={`p-2 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105 ${
                  isFilled
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                    : isShiftFree
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isFilled ? 'bg-purple-600' : isShiftFree ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-[11px] font-black">{st.seatNumber || st.number || idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Free ({freeSeats})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" /> Full ({occupiedCount})</span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">Floor View</span>
      </div>
    </div>
  );
}

