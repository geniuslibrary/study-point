import { Building2, Users } from 'lucide-react';

export default function OccupancyOverview({ sections = [] }) {
  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Occupancy</h3>
        <p className="text-gray-500 text-center py-4">No sections created yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Section Occupancy</h3>
        <span className="text-xs text-gray-400">Seats & Shifts</span>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => {
          const percentage =
            section.totalSeats > 0 ? Math.round((section.occupied / section.totalSeats) * 100) : 0;
          const barColor =
            percentage > 85 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500';

          return (
            <div key={index} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-gray-800">{section.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {section.studentCount !== undefined && (
                    <span className="text-indigo-600 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> {section.studentCount} Students
                    </span>
                  )}
                  <span>
                    ({section.occupied}/{section.totalSeats} seats • {percentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full ${barColor} transition-all duration-300`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
