import React from 'react';

interface AverageConsumptionProps {
  value: number | null;
  average: number | null;
}

type ConsumptionColor = "primary" | "gray";

export const AverageConsumption: React.FC<AverageConsumptionProps> = ({ value, average }) => {
  const getConsumptionColor = (consumption: number | null): ConsumptionColor => {
    // Tylko sprawdzenie dla nieprawidłowych wartości
    if (consumption === null || consumption === undefined || isNaN(consumption)) return "gray";
    if (consumption < 0 || consumption > 50) return "gray";
    // Dla wszystkich prawidłowych wartości używamy jednego koloru
    return "primary";
  };

  const getColorClasses = (color: ConsumptionColor) => {
    switch (color) {
      case "primary":
        // Użyj koloru akcentowego z aplikacji (niebieski)
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
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
