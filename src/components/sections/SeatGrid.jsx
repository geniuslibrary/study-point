import { Armchair, Lock, Wifi, Lamp, Sun, Sunrise, Sunset, Clock, User } from 'lucide-react';

export default function SeatGrid({ seats = [], onSeatClick }) {
  if (seats.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 text-xs font-semibold">
        No seats configured in this section.
      </div>
    );
  }

  // Proper numerical sorting: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, ...
  const sortedSeats = [...seats].sort(
    (a, b) => (Number(a.seatNumber) || 0) - (Number(b.seatNumber) || 0)
  );

  return (
    <div className="space-y-4">
      {/* Visual Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg bg-emerald-100 border border-emerald-400"></span>
          <span>Available (All Shifts Free)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg bg-amber-50 border border-amber-400"></span>
          <span>Half-Day Free (Morning / Evening Open)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg bg-indigo-50 border border-indigo-400"></span>
          <span>Full Day Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg bg-purple-50 border border-purple-400"></span>
          <span>Both Halves Booked (Full)</span>
        </div>
      </div>

      {/* Grid of Modern Seat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {sortedSeats.map((seat) => {
          const assignedStudents = seat.assignedStudents || [];
          const fullDayStudent = assignedStudents.find((s) => !s.shift || s.shift === 'full_day');
          const firstHalfStudent = assignedStudents.find((s) => s.shift === 'first_half');
          const secondHalfStudent = assignedStudents.find((s) => s.shift === 'second_half');
          const customStudents = assignedStudents.filter((s) => s.shift === 'custom');

          let cardStyle =
            'border-emerald-300/80 bg-gradient-to-b from-white to-emerald-50/40 hover:border-emerald-500 hover:shadow-md shadow-2xs';

          if (fullDayStudent) {
            cardStyle =
              'border-indigo-300/80 bg-gradient-to-b from-white to-indigo-50/50 hover:border-indigo-500 hover:shadow-md shadow-2xs';
          } else if (firstHalfStudent && secondHalfStudent) {
            cardStyle =
              'border-purple-300/80 bg-gradient-to-b from-white to-purple-50/50 hover:border-purple-500 hover:shadow-md shadow-2xs';
          } else if (firstHalfStudent || secondHalfStudent || customStudents.length > 0) {
            cardStyle =
              'border-amber-300/80 bg-gradient-to-b from-white to-amber-50/50 hover:border-amber-500 hover:shadow-md shadow-2xs';
          }

          return (
            <div
              key={seat.id}
              onClick={() => onSeatClick && onSeatClick(seat)}
              className={`border-2 rounded-2xl p-3.5 cursor-pointer transition-all duration-150 flex flex-col justify-between hover:-translate-y-0.5 group ${cardStyle}`}
            >
              {/* Header: Seat Number + Facilities */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900 bg-white/90 px-2.5 py-1 rounded-lg shadow-2xs border border-slate-200 group-hover:border-slate-300">
                  Seat #{seat.seatNumber}
                </span>

                <div className="flex items-center gap-1.5">
                  {seat.addons?.locker && (
                    <span className="p-1 bg-amber-100 text-amber-800 rounded-md" title="Locker Included">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                  {seat.addons?.wifi && (
                    <span className="p-1 bg-blue-100 text-blue-800 rounded-md" title="High Speed WiFi">
                      <Wifi className="w-3 h-3" />
                    </span>
                  )}
                  {seat.addons?.light && (
                    <span className="p-1 bg-yellow-100 text-yellow-800 rounded-md" title="Dedicated Desk Lamp">
                      <Lamp className="w-3 h-3" />
                    </span>
                  )}
                  <Armchair className="w-4 h-4 text-slate-400 ml-0.5" />
                </div>
              </div>

              {/* Occupant Shifts Content */}
              <div className="space-y-1.5 text-xs my-1">
                {fullDayStudent ? (
                  <div className="bg-white/95 p-2 rounded-xl border border-indigo-100 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Sun className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{fullDayStudent.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Full Day (6 AM - 11 PM)</p>
                  </div>
                ) : firstHalfStudent || secondHalfStudent || customStudents.length > 0 ? (
                  <div className="space-y-1.5">
                    {/* 1st Half Shift */}
                    <div
                      className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                        firstHalfStudent
                          ? 'bg-white/95 border-amber-200 text-amber-950 font-bold shadow-2xs'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Sunrise className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{firstHalfStudent ? firstHalfStudent.name : '1st Half: Free'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-1">6 AM-2 PM</span>
                    </div>

                    {/* 2nd Half Shift */}
                    <div
                      className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                        secondHalfStudent
                          ? 'bg-white/95 border-purple-200 text-purple-950 font-bold shadow-2xs'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Sunset className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">{secondHalfStudent ? secondHalfStudent.name : '2nd Half: Free'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-1">2 PM-11 PM</span>
                    </div>

                    {/* Custom Shifts */}
                    {customStudents.map((cs) => (
                      <div
                        key={cs.id}
                        className="p-1.5 rounded-lg border bg-white/95 border-teal-200 text-[11px] text-teal-950 font-bold flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">{cs.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-1">
                          {cs.shiftTiming || 'Custom'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/80 text-center">
                    <p className="font-extrabold text-emerald-700 text-xs">Available</p>
                    <p className="text-[11px] text-slate-500 font-medium">All shifts open</p>
                  </div>
                )}
              </div>

              {/* Click to manage footer */}
              <div className="text-[11px] text-slate-400 font-bold text-right pt-1.5 flex items-center justify-end gap-1 group-hover:text-indigo-600 transition-colors">
                <span>Manage seat</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
