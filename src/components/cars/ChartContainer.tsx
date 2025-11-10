import React from "react";
import { ChartHeader } from "./ChartHeader";
import { ChartVisualization } from "./ChartVisualization";
import type { ChartDataDTO, ChartType } from "../../types";

interface ChartContainerProps {
  chartData: ChartDataDTO;
  chartType: ChartType;
}

/**
 * ChartContainer component wraps chart header and visualization
 * Provides a consistent container with background, shadow, and padding
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({ chartData, chartType }) => {
  // Validate that we have enough data points
  if (!chartData.data || chartData.data.length < 2) {
    return null;
  }

  // Get chart title for aria-label
  const getChartTitle = (type: ChartType): string => {
    switch (type) {
      case "consumption":
        return "Wykres spalania";
      case "price_per_liter":
        return "Wykres ceny za litr";
      case "distance":
        return "Wykres dystansu";
      default:
        return "Wykres";
    }
  };

  const statsId = `chart-stats-${chartType}`;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6"
      aria-label={getChartTitle(chartType)}
      role="region"
    >
      <ChartHeader
        chartType={chartType}
        average={chartData.average}
        metadata={chartData.metadata}
      />
      <ChartVisualization chartData={chartData} chartType={chartType} aria-describedby={statsId} />
    </div>
  );
};

