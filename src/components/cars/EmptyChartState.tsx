import React from "react";
import { Info } from "lucide-react";

/**
 * EmptyChartState component displays a message when there is insufficient data to render a chart
 * Shown when there are less than 2 fillups for a car
 */
export const EmptyChartState: React.FC = () => {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
        <Info className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Za mało danych
      </h3>

      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania.
      </p>
    </div>
  );
};


