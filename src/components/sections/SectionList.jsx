import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2, Building2, Users, PlusCircle, CheckCircle2, Clock, Armchair } from 'lucide-react';
import SeatGrid from './SeatGrid';
import Button from '../common/Button';

export default function SectionList({
  sections = [],
  seats = [],
  onEdit,
  onDelete,
  onSeatClick,
  onAddSeat,
}) {
  // Expand first section by default
  const [expandedId, setExpandedId] = useState(sections[0]?.id || null);
  const [sectionFilters, setSectionFilters] = useState({});

  const handleFilterClick = (sectionId, filterStatus) => {
    setExpandedId(sectionId);
    setSectionFilters((prev) => ({
      ...prev,
      [sectionId]: filterStatus,
    }));
  };

  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs p-12 text-center border border-gray-100">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">No Sections Created Yet</h3>
        <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
          Click the "Add Section" button above to create your first section (e.g., Boys, Girls, AC Quiet Hall).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const sectionSeats = seats.filter((s) => s.sectionId === section.id);

        let availableSeats = 0;
        let fullyOccupiedSeats = 0;
        let partiallyOccupiedSeats = 0;
        let totalStudentsInSection = 0;

        sectionSeats.forEach((seat) => {
          const assigned = seat.assignedStudents || [];
          totalStudentsInSection += assigned.length;
          if (assigned.length === 0) {
            availableSeats++;
          } else if (assigned.some((st) => !st.shift || st.shift === 'full_day') || assigned.length >= 2) {
            fullyOccupiedSeats++;
          } else {
            partiallyOccupiedSeats++;
          }
        });

        const percentage =
          sectionSeats.length > 0
            ? Math.round(((fullyOccupiedSeats + partiallyOccupiedSeats * 0.5) / sectionSeats.length) * 100)
            : 0;
        const isExpanded = expandedId === section.id;
        const currentFilter = sectionFilters[section.id] || 'all';

        return (
          <div key={section.id} className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-200 transition-shadow hover:shadow-sm">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-gray-900 text-base sm:text-lg leading-tight truncate">
                      {section.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="font-semibold text-gray-700">
                        {sectionSeats.length} Physical Seats
                      </span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {totalStudentsInSection} Active Students
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="flex items-center justify-end gap-1.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Edit className="w-3.5 h-3.5 text-gray-600" />}
                    onClick={() => onEdit(section)}
                    title="Edit Section Name & Total Seats"
                    className="justify-center text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => onDelete(section)}
                    title="Delete Section"
                    className="justify-center hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl"
                  />
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : section.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      isExpanded
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span>{isExpanded ? 'Hide' : 'Seats'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* The 4 Interactive Filter Pills - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-100">
                {/* All Seats */}
                <button
                  type="button"
                  onClick={() => handleFilterClick(section.id, 'all')}
                  className={`p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 shadow-2xs ${
                    currentFilter === 'all' && isExpanded
                      ? 'bg-slate-900 text-white ring-2 ring-slate-900/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                  title="Show all seats"
                >
                  <span className="truncate">All Seats</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
                      currentFilter === 'all' && isExpanded ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {sectionSeats.length}
                  </span>
                </button>

                {/* Available */}
                <button
                  type="button"
                  onClick={() => handleFilterClick(section.id, 'available')}
                  className={`p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 shadow-2xs ${
                    currentFilter === 'available' && isExpanded
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                      : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                  }`}
                  title="Filter vacant available seats"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">Available (खाली)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
                      currentFilter === 'available' && isExpanded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-200/80 text-emerald-950'
                    }`}
                  >
                    {availableSeats}
                  </span>
                </button>

                {/* Shift Free */}
                <button
                  type="button"
                  onClick={() => handleFilterClick(section.id, 'partial')}
                  className={`p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 shadow-2xs ${
                    currentFilter === 'partial' && isExpanded
                      ? 'bg-amber-500 text-white ring-2 ring-amber-500/30'
                      : 'bg-amber-50/80 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
                  }`}
                  title="Filter seats with free shift"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="truncate">Shift Free (शिफ्ट)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
                      currentFilter === 'partial' && isExpanded ? 'bg-amber-600 text-white' : 'bg-amber-200/80 text-amber-950'
                    }`}
                  >
                    {partiallyOccupiedSeats}
                  </span>
                </button>

                {/* Full */}
                <button
                  type="button"
                  onClick={() => handleFilterClick(section.id, 'occupied')}
                  className={`p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 shadow-2xs ${
                    currentFilter === 'occupied' && isExpanded
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-600/30'
                      : 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80'
                  }`}
                  title="Filter fully occupied seats"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                    <span className="truncate">Full (भरी)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
                      currentFilter === 'occupied' && isExpanded ? 'bg-indigo-700 text-white' : 'bg-indigo-200/80 text-indigo-950'
                    }`}
                  >
                    {fullyOccupiedSeats}
                  </span>
                </button>
              </div>

              {/* Progress Bar with Live Badges */}
              <div className="mt-3 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 border border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-slate-600 mb-1.5 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span>Occupancy:</span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${
                        percentage >= 85
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : percentage >= 50
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {percentage}% Booked
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    <strong className="text-emerald-700">{availableSeats} available</strong> of {sectionSeats.length} seats
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      percentage >= 85
                        ? 'bg-rose-500'
                        : percentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Expandable Visual Seat Grid */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-4 sm:px-6 py-5 bg-gray-50/70">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Physical Seats Grid ({sectionSeats.length} Seats)
                  </p>
                  <button
                    onClick={() => onAddSeat && onAddSeat(section.id)}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Add Seat #{sectionSeats.length + 1}</span>
                  </button>
                </div>
                <SeatGrid
                  seats={sectionSeats}
                  onSeatClick={onSeatClick}
                  filterStatus={currentFilter}
                  onFilterChange={(status) =>
                    setSectionFilters((prev) => ({ ...prev, [section.id]: status }))
                  }
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
