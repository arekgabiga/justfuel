import React from "react";
import { ChartTabs } from "./ChartTabs";
import type { ChartDataDTO, ChartType } from "../../types";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { Loader2 } from "lucide-react";

interface ChartsTabProps {
  chartData: ChartDataDTO | null;
  activeChartType: ChartType;
  loading: boolean;
  error: Error | null;
  onChartTypeChange: (type: ChartType) => void;
}

export const ChartsTab: React.FC<ChartsTabProps> = ({
  chartData,
  activeChartType,
  loading,
  error,
  onChartTypeChange,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState error={error} onRetry={() => {}} />
    );
  }

  if (!chartData || chartData.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ChartTabs activeChartType={activeChartType} onChartTypeChange={onChartTypeChange} />
      
      {/* Basic chart visualization - placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          {activeChartType === "consumption" && "Spalanie (L/100km)"}
          {activeChartType === "price_per_liter" && "Cena za litr (zł)"}
          {activeChartType === "distance" && "Dystans (km)"}
        </h3>
        
        {/* Basic text representation - to be replaced with actual chart */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Średnia: {chartData.average.toFixed(2)}</span>
            <span>Min: {chartData.metadata.min.toFixed(2)}</span>
            <span>Max: {chartData.metadata.max.toFixed(2)}</span>
            <span>Wszystkich: {chartData.metadata.count}</span>
          </div>
          
          {/* Placeholder for chart visualization */}
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Wizualizacja wykresu zostanie dodana wkrótce
            </p>
          </div>
          
          {/* Data points summary */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Ostatnie 5 wartości:
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs">
            {chartData.data.slice(0, 5).map((point, index) => (
              <div key={index} className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="font-medium">{point.value.toFixed(2)}</div>
                <div className="text-gray-400">{new Date(point.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

