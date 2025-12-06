import React from 'react';
import type { CarWithStatisticsDTO } from '../../types';
import { CarCard } from './CarCard';
import { Skeleton } from '@/components/ui/skeleton';

interface CarsGridProps {
  cars: CarWithStatisticsDTO[];
  onCarClick: (carId: string) => void;
  loading?: boolean;
}

export const CarsGrid: React.FC<CarsGridProps> = ({ cars, onCarClick, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
          >
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-8 w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (cars.length === 0) {
    return null; // EmptyState will be shown instead
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-test-id="cars-grid">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} onClick={onCarClick} />
      ))}
    </div>
  );
};
