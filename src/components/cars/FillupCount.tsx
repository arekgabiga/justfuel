import React from 'react';

interface FillupCountProps {
  value: number | null;
}

export const FillupCount: React.FC<FillupCountProps> = ({ value }) => {
  const formatValue = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    if (val < 0 || !Number.isInteger(val)) return 'N/A'; // Invalid negative or non-integer count
    return `${val} tankowań`;
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-base text-gray-600 dark:text-gray-400">Liczba tankowań:</span>
      <span className="text-base font-medium text-gray-900 dark:text-gray-100">{formatValue(value)}</span>
    </div>
  );
};
