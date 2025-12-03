import React from 'react';
import type { CarStatisticsView } from '../../types';
import { AverageConsumption } from './AverageConsumption';
import { TotalCost } from './TotalCost';
import { TotalDistance } from './TotalDistance';
import { FillupCount } from './FillupCount';

interface CarStatisticsProps {
  statistics: Pick<
    CarStatisticsView,
    | 'total_fuel_cost'
    | 'total_fuel_amount'
    | 'total_distance'
    | 'average_consumption'
    | 'average_price_per_liter'
    | 'fillup_count'
  >;
}

export const CarStatistics: React.FC<CarStatisticsProps> = ({ statistics }) => {
  return (
    <div className="space-y-3" data-test-id="car-statistics-container">
      <AverageConsumption value={statistics.average_consumption} average={statistics.average_consumption} />
      <TotalCost value={statistics.total_fuel_cost} />
      <TotalDistance value={statistics.total_distance} />
      <FillupCount value={statistics.fillup_count} />
    </div>
  );
};
