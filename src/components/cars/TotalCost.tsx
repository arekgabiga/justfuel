import React from 'react';

interface TotalCostProps {
  value: number | null;
}

export const TotalCost: React.FC<TotalCostProps> = ({ value }) => {
  const formatValue = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    if (val < 0) return "N/A"; // Invalid negative cost
    return `${val.toFixed(2)} zł`;
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">Całkowity koszt:</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {formatValue(value)}
      </span>
    </div>
  );
};
