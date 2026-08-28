import React from 'react';
import { Pencil, Trash2, Power, Sun, Sunrise, Layers } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';

export default function PlanList({ plans, studentCounts, onEdit, onDelete, onToggle }) {
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">No membership plans found. Add one to get started.</p>
      </div>
    );
  }

  const getShiftBadge = (shiftType) => {
    switch (shiftType) {
      case 'full_day':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sun className="w-3 h-3 text-indigo-600" /> Full Day Plan
          </span>
        );
      case 'half_day':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Sunrise className="w-3 h-3 text-amber-600" /> Half Day Plan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
            <Layers className="w-3 h-3 text-gray-500" /> All Shifts
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const studentCount = studentCounts[plan.id] || 0;

        return (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col ${
              !plan.isActive
                ? 'opacity-75 bg-gray-50'
                : 'border-gray-200 hover:border-indigo-300 transition-colors'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan.durationMonths} {plan.durationMonths === 1 ? 'Month' : 'Months'} Duration
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={plan.isActive ? 'active' : 'inactive'} />
                {plan.isOffer && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 animate-pulse">
                    🔥 OFFER
                  </span>
                )}
              </div>
            </div>

            <div className="mb-3">{getShiftBadge(plan.shiftType)}</div>

            <div className="mb-6 flex-grow">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-600">
                  {formatCurrency(plan.price)}
                </span>
                {plan.isOffer && plan.originalPrice > plan.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(plan.originalPrice)}
                  </span>
                )}
              </div>
              {plan.isOffer && plan.originalPrice > plan.price && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  Save ₹{plan.originalPrice - plan.price} with this offer
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{studentCount}</span> Students Enrolled
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => onToggle(plan)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title={plan.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Power size={18} />
                </button>
                <button
                  onClick={() => onEdit(plan)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => onDelete(plan)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
