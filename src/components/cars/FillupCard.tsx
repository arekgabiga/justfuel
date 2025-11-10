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
  // Uses 7 color levels according to percentage deviation from average
  const getConsumptionColor = (consumption: number | null | undefined, avg: number) => {
    if (!consumption || avg === 0 || !isFinite(consumption) || !isFinite(avg)) {
      return "text-gray-600 dark:text-gray-400";
    }

    // Calculate percentage deviation from average
    const deviation = ((consumption - avg) / avg) * 100;

    // EKSTREMALNIE NISKIE: Significantly better than average (deviation <= -15%)
    if (deviation <= -15) {
      return "text-green-800 dark:text-green-300 font-semibold";
    }

    // BARDZO NISKIE: Clearly better than average (-15% < deviation <= -8%)
    if (deviation <= -8) {
      return "text-green-600 dark:text-green-400 font-semibold";
    }

    // LEKKO NISKIE: Slightly better than average (-8% < deviation < 0%)
    if (deviation < 0) {
      return "text-lime-500 dark:text-lime-400";
    }

    // NEUTRALNE: Result within normal range (0% <= deviation < 5%)
    if (deviation < 5) {
      return "text-yellow-600 dark:text-yellow-400";
    }

    // LEKKO WYSOKIE: Slightly worse than average (5% <= deviation < 10%)
    if (deviation < 10) {
      return "text-orange-600 dark:text-orange-400";
    }

    // BARDZO WYSOKIE: Clearly worse than average (10% <= deviation < 20%)
    if (deviation < 20) {
      return "text-red-600 dark:text-red-400 font-semibold";
    }

    // EKSTREMALNIE WYSOKIE: Significantly worse than average (deviation >= 20%)
    return "text-red-800 dark:text-red-300 font-semibold";
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 p-5"
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
      <div className="grid grid-cols-[min-content_min-content_1fr_1fr] gap-x-4 gap-y-3 xl:grid-cols-4">
        <div className="min-w-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{formatDate(fillup.date)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spalanie</div>
          <div className={`font-medium ${getConsumptionColor(fillup.fuel_consumption, averageConsumption)}`}>
            {formatNumber(fillup.fuel_consumption)} L/100km
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dystans</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatNumber(fillup.distance_traveled)} km
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cena za litr</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatNumber(fillup.price_per_liter)} zł
          </div>
        </div>
      </div>
    </div>
  );
};

