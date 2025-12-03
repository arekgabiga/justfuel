import React from 'react';
import { ChartTabs } from './ChartTabs';
import { ChartContainer } from './ChartContainer';
import { EmptyChartState } from './EmptyChartState';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import type { ChartDataDTO, ChartType } from '../../types';

interface ChartsTabProps {
  chartData: ChartDataDTO | null;
  activeChartType: ChartType;
  loading: boolean;
  error: Error | null;
  onChartTypeChange: (type: ChartType) => void;
  onRetry: () => void;
}

/**
 * ChartsTab component is the main component for the charts view
 * Coordinates rendering of all chart-related components based on data availability
 */
export const ChartsTab: React.FC<ChartsTabProps> = ({
  chartData,
  activeChartType,
  loading,
  error,
  onChartTypeChange,
  onRetry,
}) => {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!chartData || chartData.data.length === 0) {
    return (
      <div>
        <ChartTabs activeChartType={activeChartType} onChartTypeChange={onChartTypeChange} />
        <EmptyChartState />
      </div>
    );
  }

  return (
    <div>
      <ChartTabs activeChartType={activeChartType} onChartTypeChange={onChartTypeChange} />
      <ChartContainer chartData={chartData} chartType={activeChartType} />
    </div>
  );
};
