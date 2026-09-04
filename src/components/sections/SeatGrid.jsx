import { Armchair, Lock, Wifi, Lamp, Sun, Sunrise, Sunset, Clock, Moon, User, CheckCircle2 } from 'lucide-react';
import { getStoredShifts, getShiftInfo, getShiftBadgeStyle } from '../../utils/helpers';

export default function SeatGrid({ seats = [], onSeatClick }) {
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
      {/* Visual Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-400"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-50 border border-amber-400"></span>
          <span>Shift Booked (Partial)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-50 border border-indigo-400"></span>
          <span>Full Day Booked</span>
        </div>
      </div>

      {/* Grid of Modern Seat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {sortedSeats.map((seat) => {
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
                  assignedStudents.map((s, idx) => {
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
                  })
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/80 border border-dashed border-emerald-300 px-2.5 py-1.5 rounded-lg font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Empty (All Shifts Free)</span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Hint */}
              <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] font-semibold text-slate-400 group-hover:text-slate-700">
                <span>
                  {assignedStudents.length === 0
                    ? '🟢 Free to Book'
                    : hasFullDay || assignedStudents.length >= 2
                    ? '🔴 Full'
                    : '🟡 Open for other shifts'}
                </span>
                <span className="text-indigo-600 group-hover:underline">Manage ⚙️</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
