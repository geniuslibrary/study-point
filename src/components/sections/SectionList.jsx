import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2, Building2, Users, PlusCircle } from 'lucide-react';
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
        const fullyOccupied = sectionSeats.filter((s) => s.status === 'occupied').length;
        const partiallyOccupied = sectionSeats.filter((s) => s.status === 'partially_occupied').length;
        const totalStudentsInSection = sectionSeats.reduce(
          (sum, s) => sum + (s.assignedStudents?.length || 0),
          0
        );

        const percentage =
          sectionSeats.length > 0
            ? Math.round(((fullyOccupied + partiallyOccupied * 0.5) / sectionSeats.length) * 100)
            : 0;
        const isExpanded = expandedId === section.id;

        return (
          <div key={section.id} className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-200">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{section.name}</h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 mt-1">
                      <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {sectionSeats.length} Physical Seats
                      </span>
                      <span>•</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {totalStudentsInSection} Students (Full & Half Day)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  {/* Quick Add Seat Button */}
                  <button
                    onClick={() => onAddSeat && onAddSeat(section.id)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Add 1 new seat to this section"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+ Add Seat</span>
                  </button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Edit className="w-3.5 h-3.5 text-gray-600" />}
                    onClick={() => onEdit(section)}
                    title="Edit Section Name & Total Seats"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => onDelete(section)}
                    title="Delete Section"
                  />
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : section.id)}
                    className="px-3 py-1.5 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors flex items-center gap-1 text-xs font-semibold border border-gray-200 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Grid' : 'View Seats'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Occupancy rate</span>
                  <span className="font-semibold text-gray-700">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage > 85
                        ? 'bg-red-500'
                        : percentage > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
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
                <SeatGrid seats={sectionSeats} onSeatClick={onSeatClick} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
