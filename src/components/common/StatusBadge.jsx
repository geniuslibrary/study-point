import React from 'react';

const StatusBadge = ({ status, size = 'sm' }) => {
  const getStatusStyles = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    if (['paid', 'active', 'available', 'completed'].includes(s)) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (['pending', 'reserved', 'processing'].includes(s)) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    if (['overdue', 'failed', 'cancelled', 'inactive'].includes(s)) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${getStatusStyles(status)} ${sizeStyles[size]}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : ''}
    </span>
  );
};

export default StatusBadge;
