import { useState } from 'react';
import { Armchair, Lock, Wifi, Lamp, Sun, Sunrise, Sunset, Clock, Moon, User, CheckCircle2, Search, Filter } from 'lucide-react';
import { getStoredShifts, getShiftInfo, getShiftBadgeStyle } from '../../utils/helpers';

export default function SeatGrid({ seats = [], onSeatClick }) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'available' | 'partial' | 'occupied'
  const [searchQuery, setSearchQuery] = useState('');

  if (seats.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-xs font-semibold">
        No seats configured in this section.
      </div>
    );
  }

  const shiftsList = getStoredShifts();

  // Deduplicate and Sort numerically by seatNumber: 1, 2, 3...
  const uniqueMap = new Map();
  seats.forEach((seat) => {
    const num = Number(seat.seatNumber) || seat.seatNumber;
    if (!uniqueMap.has(num)) {
      uniqueMap.set(num, seat);
    } else {
      const existing = uniqueMap.get(num);
      if ((!existing.assignedStudents || existing.assignedStudents.length === 0) && seat.assignedStudents?.length > 0) {
        uniqueMap.set(num, seat);
      }
    }
  });

  const sortedSeats = Array.from(uniqueMap.values()).sort(
    (a, b) => (Number(a.seatNumber) || 0) - (Number(b.seatNumber) || 0)
  );

  // Compute live breakdown counts
  let countAvailable = 0;
  let countPartial = 0;
  let countOccupied = 0;

  sortedSeats.forEach((seat) => {
    const assigned = seat.assignedStudents || [];
    const hasFullDay = assigned.some((s) => !s.shift || s.shift === 'full_day');
    if (assigned.length === 0) {
      countAvailable++;
    } else if (hasFullDay || assigned.length >= 2) {
      countOccupied++;
    } else {
      countPartial++;
    }
  });

  // Filter seats based on status and search query
  const filteredSeats = sortedSeats.filter((seat) => {
    const assigned = seat.assignedStudents || [];
    const hasFullDay = assigned.some((s) => !s.shift || s.shift === 'full_day');

    let matchesFilter = true;
    if (filterStatus === 'available') {
      matchesFilter = assigned.length === 0;
    } else if (filterStatus === 'partial') {
      matchesFilter = assigned.length === 1 && !hasFullDay;
    } else if (filterStatus === 'occupied') {
      matchesFilter = hasFullDay || assigned.length >= 2;
    }

    if (!matchesFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const seatMatch = String(seat.seatNumber).toLowerCase().includes(q);
      const studentMatch = assigned.some(
        (st) => st.name?.toLowerCase().includes(q) || st.phone?.includes(q)
      );
      return seatMatch || studentMatch;
    }

    return true;
  });

  const getShiftIcon = (shiftId = '') => {
    const id = shiftId.toLowerCase();
    if (id.includes('full')) return <Sun className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    if (id.includes('first') || id.includes('morn')) return <Sunrise className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    if (id.includes('second') || id.includes('even')) return <Sunset className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    if (id.includes('night')) return <Moon className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    return <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
  };

  return (
    <div className="space-y-4">
      {/* Interactive Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>All Seats</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                filterStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sortedSeats.length}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Available (खाली)</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                filterStatus === 'available' ? 'bg-emerald-700 text-white' : 'bg-emerald-200/80 text-emerald-900'
              }`}
            >
              {countAvailable}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('partial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'partial'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Shift Free (शिफ्ट खाली)</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                filterStatus === 'partial' ? 'bg-amber-600 text-white' : 'bg-amber-200/80 text-amber-900'
              }`}
            >
              {countPartial}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('occupied')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'occupied'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Full (पूरी भरी)</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                filterStatus === 'occupied' ? 'bg-indigo-700 text-white' : 'bg-indigo-200/80 text-indigo-900'
              }`}
            >
              {countOccupied}
            </span>
          </button>
        </div>

        {/* Quick Seat / Student Search */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search seat # or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Modern Seat Cards */}
      {filteredSeats.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-2">
          <Armchair className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No seats found matching current filter</p>
          <p className="text-[11px] text-slate-400">
            Try switching to "All Seats" or clearing your search query.
          </p>
          <button
            onClick={() => {
              setFilterStatus('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredSeats.map((seat) => {
          const assignedStudents = seat.assignedStudents || [];
          const hasFullDay = assignedStudents.some((s) => !s.shift || s.shift === 'full_day');

          let cardStyle =
            'border-emerald-300/80 bg-gradient-to-b from-white to-emerald-50/40 hover:border-emerald-500 hover:shadow-md shadow-2xs';

          if (hasFullDay) {
            cardStyle =
              'border-indigo-300/80 bg-gradient-to-b from-white to-indigo-50/50 hover:border-indigo-500 hover:shadow-md shadow-2xs';
          } else if (assignedStudents.length >= 2) {
            cardStyle =
              'border-purple-300/80 bg-gradient-to-b from-white to-purple-50/50 hover:border-purple-500 hover:shadow-md shadow-2xs';
          } else if (assignedStudents.length === 1) {
            cardStyle =
              'border-amber-300/80 bg-gradient-to-b from-white to-amber-50/50 hover:border-amber-500 hover:shadow-md shadow-2xs';
          }

          return (
            <div
              key={seat.id || `seat_${seat.seatNumber}`}
              onClick={() => onSeatClick && onSeatClick(seat)}
              className={`relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group ${cardStyle}`}
            >
              {/* Top Row: Seat Number & Facilities */}
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center font-black text-xs text-slate-800">
                    #{seat.seatNumber}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Seat</span>
                </div>

                {/* Facility Icons */}
                <div className="flex items-center gap-1">
                  {(seat.addons?.locker || seat.addons?.Locker) && (
                    <span title="Locker Facility" className="p-1 rounded-md bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                  {(seat.addons?.wifi || seat.addons?.WiFi || seat.addons?.Wifi) && (
                    <span title="High-speed WiFi" className="p-1 rounded-md bg-white border border-slate-200 text-teal-600 shadow-2xs">
                      <Wifi className="w-3 h-3" />
                    </span>
                  )}
                  {(seat.addons?.light || seat.addons?.lamp || seat.addons?.['Desk Light']) && (
                    <span title="Personal Desk Lamp" className="p-1 rounded-md bg-white border border-slate-200 text-amber-500 shadow-2xs">
                      <Lamp className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Dynamic Shift Occupancy Breakdown */}
              <div className="my-2.5 space-y-1.5">
                {assignedStudents.length > 0 ? (
                  <>
                    {assignedStudents.map((s, idx) => {
                      const shiftInfo = getShiftInfo(s.shift);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-lg font-bold border ${getShiftBadgeStyle(
                            s.shift
                          )}`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            {getShiftIcon(s.shift)}
                            <span className="truncate">{s.name}</span>
                          </div>
                          <span className="text-[9px] font-black opacity-80 shrink-0 ml-1">
                            {shiftInfo.short || shiftInfo.timing}
                          </span>
                        </div>
                      );
                    })}
                    {assignedStudents.length === 1 && !hasFullDay && (
                      <div className="flex items-center justify-between text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50/90 text-amber-800 border border-dashed border-amber-300">
                        <span>➕ Next Shift Open (खाली)</span>
                        <span className="text-[9px] font-black opacity-75">Bookable</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/90 border border-dashed border-emerald-300 px-2.5 py-1.5 rounded-lg font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Available (खाली सीट)</span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Hint */}
              <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] font-semibold text-slate-400 group-hover:text-slate-700">
                <span>
                  {assignedStudents.length === 0
                    ? '🟢 Free to Book (खाली)'
                    : hasFullDay || assignedStudents.length >= 2
                    ? '🔴 Full (पूरी भरी)'
                    : '🟡 Partial (शिफ्ट खाली)'}
                </span>
                <span className="text-indigo-600 font-bold group-hover:underline">Manage ⚙️</span>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
