import React from 'react';

interface TotalDistanceProps {
  value: number | null;
}

export const TotalDistance: React.FC<TotalDistanceProps> = ({ value }) => {
  const formatValue = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    if (val < 0) return 'N/A'; // Invalid negative distance
    return `${val.toLocaleString()} km`;
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-base text-gray-600 dark:text-gray-400">Całkowity dystans:</span>
      <span className="text-base font-medium text-gray-900 dark:text-gray-100">{formatValue(value)}</span>
    </div>
  );
};
