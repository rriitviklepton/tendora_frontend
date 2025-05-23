import React from 'react';

interface StatusBadgeProps {
  status: string;
  color?: 'red' | 'blue' | 'yellow' | 'green' | 'gray';
}

const StatusBadge = ({ status, color }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    if (color) {
      switch (color) {
        case 'red':
          return 'bg-red-100 text-red-800';
        case 'blue':
          return 'bg-blue-100 text-blue-800';
        case 'yellow':
          return 'bg-amber-100 text-amber-800';
        case 'green':
          return 'bg-green-100 text-green-800';
        case 'gray':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }

    // Default status styles if no color is provided
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Submitted':
        return 'bg-amber-100 text-amber-800';
      case 'Disqualified':
        return 'bg-red-100 text-red-800';
      case 'Won':
        return 'bg-green-100 text-green-800';
      case 'Mandatory':
        return 'bg-red-100 text-red-800';
      case 'Optional':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;