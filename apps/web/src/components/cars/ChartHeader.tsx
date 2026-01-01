import React from 'react';
import type { ChartType, ChartMetadataDTO } from '../../types';

interface ChartHeaderProps {
  chartType: ChartType;
  average: number;
  metadata: ChartMetadataDTO;
}

/**
 * ChartHeader component displays the chart title and statistics metadata
 * Shows average, minimum, maximum, and count values with proper formatting
 */
export const ChartHeader: React.FC<ChartHeaderProps> = ({ chartType, average, metadata }) => {
  // Get chart title and unit based on type
  const getChartTitle = (type: ChartType): string => {
    switch (type) {
      case 'consumption':
        return 'Spalanie (L/100km)';
      case 'price_per_liter':
        return 'Cena za litr (zł)';
      case 'distance':
        return 'Dystans (km)';
      default:
        return 'Wykres';
    }
  };

  // Get decimal places for formatting based on chart type
  const getDecimalPlaces = (type: ChartType): number => {
    switch (type) {
      case 'consumption':
      case 'price_per_liter':
        return 2;
      case 'distance':
        return 0;
      default:
        return 2;
    }
  };

  const decimalPlaces = getDecimalPlaces(chartType);
  const statsId = `chart-stats-${chartType}`;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{getChartTitle(chartType)}</h3>

      <div id={statsId} className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="region" aria-label="Statystyki wykresu">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Średnia</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{average.toFixed(decimalPlaces)}</div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Minimum</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {metadata.min.toFixed(decimalPlaces)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Maximum</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {metadata.max.toFixed(decimalPlaces)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Liczba punktów</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metadata.count}</div>
        </div>
      </div>
    </div>
  );
};
