import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataDTO, ChartType, ChartDataPointDTO } from '../../types';

interface ChartVisualizationProps {
  chartData: ChartDataDTO;
  chartType: ChartType;
  'aria-describedby'?: string;
}

/**
 * Custom tooltip component for chart data points
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as ChartDataPointDTO;
  const chartType = payload[0].dataKey as string;

  // Format date to Polish format (dd.mm.yyyy)
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Format value with appropriate unit
  const getLabelAndUnit = (type: string): { label: string; unit: string; decimals: number } => {
    switch (type) {
      case 'consumption':
        return { label: 'Spalanie', unit: 'L/100km', decimals: 2 };
      case 'price_per_liter':
        return { label: 'Cena za litr', unit: 'zł', decimals: 2 };
      case 'distance':
        return { label: 'Dystans', unit: 'km', decimals: 0 };
      default:
        return { label: 'Wartość', unit: '', decimals: 2 };
    }
  };

  const { label, unit, decimals } = getLabelAndUnit(chartType);
  const value = data.value;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{formatDate(data.date)}</p>
      <div className="space-y-1">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">{label}:</span> {value.toFixed(decimals)} {unit}
        </p>
        {data.odometer != null ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Licznik: {data.odometer.toLocaleString('pl-PL')} km</p>
        ) : data.distance != null ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Dystans: {data.distance.toLocaleString('pl-PL')} km</p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">Licznik: --</p>
        )}
      </div>
    </div>
  );
};

/**
 * Format date for X-axis display (dd.mm.yyyy)
 */
const formatXAxisDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format Y-axis value based on chart type
 */
const formatYAxisValue = (value: number, chartType: ChartType): string => {
  switch (chartType) {
    case 'consumption':
      return `${value.toFixed(1)} L/100km`;
    case 'price_per_liter':
      return `${value.toFixed(2)} zł`;
    case 'distance':
      return `${Math.round(value)} km`;
    default:
      return value.toFixed(2);
  }
};

/**
 * ChartVisualization component renders interactive charts using recharts
 * Supports line charts for consumption and price_per_liter, and bar chart for distance
 */
export const ChartVisualization: React.FC<ChartVisualizationProps> = ({
  chartData,
  chartType,
  'aria-describedby': ariaDescribedBy,
}) => {
  // Prepare data for chart - reverse to show chronological order (oldest to newest)
  const chartDataPoints = useMemo(() => {
    if (!chartData.data || chartData.data.length === 0) {
      return [];
    }

    // Filter out invalid data points and reverse to show oldest first
    return [...chartData.data]
      .filter((point) => {
        return (
          point.value != null && !isNaN(point.value) && point.date && 
          // Allow odometer to be null, but if it is present it must be valid number? 
          // Actually if it's null it's valid for "distance" mode.
          (point.odometer == null || !isNaN(point.odometer))
        );
      })
      .reverse()
      .map((point) => ({
        date: point.date,
        value: point.value,
        odometer: point.odometer,
        distance: point.distance,
      }));
  }, [chartData.data]);

  // Get Y-axis label based on chart type
  const getYAxisLabel = (type: ChartType): string => {
    switch (type) {
      case 'consumption':
        return 'L/100km';
      case 'price_per_liter':
        return 'zł';
      case 'distance':
        return 'km';
      default:
        return '';
    }
  };

  // Get chart description for accessibility
  const getChartDescription = (type: ChartType, dataPoints: number): string => {
    switch (type) {
      case 'consumption':
        return `Wykres liniowy przedstawiający spalanie w czasie. Zawiera ${dataPoints} punktów danych pokazujących wartości spalania w litrach na 100 kilometrów.`;
      case 'price_per_liter':
        return `Wykres liniowy przedstawiający cenę paliwa za litr w czasie. Zawiera ${dataPoints} punktów danych pokazujących ceny w złotych.`;
      case 'distance':
        return `Wykres słupkowy przedstawiający dystans między tankowaniami w czasie. Zawiera ${dataPoints} punktów danych pokazujących dystanse w kilometrach.`;
      default:
        return `Wykres zawierający ${dataPoints} punktów danych.`;
    }
  };

  const chartDescription = getChartDescription(chartType, chartDataPoints.length);

  // Common props for both chart types
  const commonProps = {
    data: chartDataPoints,
    margin: {
      top: 5,
      right: 10,
      left: 0,
      bottom: 5,
    },
  };

  if (chartType === 'distance') {
    // Bar chart for distance
    return (
      <div
        className="w-full"
        style={{ minHeight: '300px' }}
        role="img"
        aria-label={chartDescription}
        aria-describedby={ariaDescribedBy}
      >
        <ResponsiveContainer width="100%" height={400}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisDate}
              className="text-sm fill-gray-600 dark:fill-gray-400"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              width={40}
              label={{ value: getYAxisLabel(chartType), angle: -90, position: 'insideLeft' }}
              className="text-sm fill-gray-600 dark:fill-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} className="hover:opacity-80" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Line chart for consumption and price_per_liter
  return (
    <div
      className="w-full"
      style={{ minHeight: '300px' }}
      role="img"
      aria-label={chartDescription}
      aria-describedby={ariaDescribedBy}
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisDate}
            className="text-sm fill-gray-600 dark:fill-gray-400"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            width={40}
            label={{ value: getYAxisLabel(chartType), angle: -90, position: 'insideLeft' }}
            className="text-sm fill-gray-600 dark:fill-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
