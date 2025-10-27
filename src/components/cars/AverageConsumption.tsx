import React from 'react';

interface AverageConsumptionProps {
  value: number | null;
  average: number | null;
}

type ConsumptionColor = "green" | "yellow" | "red" | "gray";

export const AverageConsumption: React.FC<AverageConsumptionProps> = ({ value, average }) => {
  const getConsumptionColor = (consumption: number | null): ConsumptionColor => {
    if (consumption === null || consumption === undefined || isNaN(consumption)) return "gray";
    if (consumption < 0 || consumption > 50) return "gray"; // Invalid range
    if (consumption <= 6) return "green";
    if (consumption <= 8) return "yellow";
    return "red";
  };

  const getColorClasses = (color: ConsumptionColor) => {
    switch (color) {
      case "green":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "yellow":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "red":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      case "gray":
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const formatValue = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    if (val < 0 || val > 50) return "N/A"; // Invalid range
    return `${val.toFixed(1)} L/100km`;
  };

  const color = getConsumptionColor(value);
  const colorClasses = getColorClasses(color);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">Średnie spalanie:</span>
      <span className={`px-2 py-1 rounded-full text-sm font-medium ${colorClasses}`}>
        {formatValue(value)}
      </span>
    </div>
  );
};
