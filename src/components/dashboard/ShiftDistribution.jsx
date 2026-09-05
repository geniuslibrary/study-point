import React from 'react';
import { Sun, Sunrise, Sunset, Clock, Users } from 'lucide-react';

export default function ShiftDistribution({ fullDayCount = 0, morningCount = 0, eveningCount = 0, totalStudents = 0 }) {
  const getPct = (count) => (totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Sun className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Shift Wise Distribution</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">Active member slots & capacity</p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {totalStudents} Active
        </span>
      </div>

      {/* 3 Shifts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Full Day */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-indigo-900 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-indigo-600" /> Full Day
            </span>
            <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-1.5 py-0.5 rounded font-extrabold">
              {getPct(fullDayCount)}%
            </span>
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-2">{fullDayCount}</p>
          <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-medium mt-1">
            <Clock className="w-3 h-3" />
            <span>6:00 AM - 11:00 PM</span>
          </div>
        </div>

        {/* 1st Half / Morning */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-amber-900 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Sunrise className="w-3.5 h-3.5 text-amber-600" /> 1st Half
            </span>
            <span className="text-[10px] bg-amber-200/60 text-amber-800 px-1.5 py-0.5 rounded font-extrabold">
              {getPct(morningCount)}%
            </span>
          </div>
          <p className="text-2xl font-black text-amber-950 mt-2">{morningCount}</p>
          <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-1">
            <Clock className="w-3 h-3" />
            <span>6:00 AM - 2:00 PM</span>
          </div>
        </div>

        {/* 2nd Half / Evening */}
        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-purple-900 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Sunset className="w-3.5 h-3.5 text-purple-600" /> 2nd Half
            </span>
            <span className="text-[10px] bg-purple-200/60 text-purple-800 px-1.5 py-0.5 rounded font-extrabold">
              {getPct(eveningCount)}%
            </span>
          </div>
          <p className="text-2xl font-black text-purple-950 mt-2">{eveningCount}</p>
          <div className="flex items-center gap-1 text-[11px] text-purple-700 font-medium mt-1">
            <Clock className="w-3 h-3" />
            <span>2:00 PM - 11:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
