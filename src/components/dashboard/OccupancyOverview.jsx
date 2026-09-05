import React from 'react';
import { Building2, Users, Armchair, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OccupancyOverview({ sections = [] }) {
  const navigate = useNavigate();

  if (sections.length === 0) {
    return (
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Section Occupancy</h3>
          </div>
        </div>
        <div className="text-center py-10">
          <Armchair className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">No sections created yet</p>
          <button
            onClick={() => navigate('/sections')}
            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
          >
            Create your first section
          </button>
        </div>
      </div>
    );
  }

  const totalCapacity = sections.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalOccupied = sections.reduce((sum, s) => sum + s.occupied, 0);
  const overallPercentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Hall & Section Occupancy</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">Live seat allocation breakdown</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {overallPercentage}% Total
          </span>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3.5 flex-1">
        {sections.map((section, index) => {
          const percentage =
            section.totalSeats > 0 ? Math.round((section.occupied / section.totalSeats) * 100) : 0;
          
          const availableSeats = Math.max(0, section.totalSeats - section.occupied);
          const isFull = percentage >= 90;
          const isModerate = percentage >= 60 && percentage < 90;

          const progressColor = isFull
            ? 'from-rose-500 to-rose-600'
            : isModerate
            ? 'from-amber-400 to-amber-500'
            : 'from-emerald-400 to-teal-500';

          const badgeBg = isFull
            ? 'bg-rose-50 text-rose-700 border-rose-100'
            : isModerate
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-emerald-50 text-emerald-700 border-emerald-100';

          return (
            <div
              key={section.id || index}
              onClick={() => navigate('/seats')}
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                    {section.name}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {percentage}% Full
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{section.occupied}</span>
                  <span>/</span>
                  <span>{section.totalSeats} seats</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Progress Bar with smooth gradient */}
              <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400 font-medium">
                <span>{availableSeats} seats empty</span>
                <span>{section.occupied} active students</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer View Seats Button */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Want to change seat arrangements?</span>
        <button
          onClick={() => navigate('/seats')}
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Open Seat Matrix</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
