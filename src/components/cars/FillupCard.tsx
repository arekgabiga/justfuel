import React from "react";
import type { FillupDTO } from "../../types";

interface FillupCardProps {
  fillup: FillupDTO;
  averageConsumption: number;
  onClick: () => void;
}

export const FillupCard: React.FC<FillupCardProps> = ({ fillup, averageConsumption, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return value.toFixed(2);
  };

  // Calculate color intensity based on deviation from average
  const getConsumptionColor = (consumption: number | null | undefined, avg: number) => {
    if (!consumption || avg === 0) return "text-gray-600 dark:text-gray-400";

    const deviation = ((consumption - avg) / avg) * 100;

    if (deviation <= -10) return "text-green-600 dark:text-green-400 font-semibold";
    if (deviation <= -5) return "text-green-500 dark:text-green-500";
    if (deviation <= 5) return "text-gray-700 dark:text-gray-300";
    if (deviation <= 10) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400 font-semibold";
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 p-4"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{formatDate(fillup.date)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spalanie</div>
          <div className={`font-medium ${getConsumptionColor(fillup.fuel_consumption, averageConsumption)}`}>
            {formatNumber(fillup.fuel_consumption)} L/100km
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dystans</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatNumber(fillup.distance_traveled)} km
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cena za litr</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatNumber(fillup.price_per_liter)} zł
          </div>
        </div>
      </div>
    </div>
  );
};

