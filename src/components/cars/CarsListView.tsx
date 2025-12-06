import React from 'react';
import { useCarsList } from '../../lib/hooks/useCarsList';
import { CarsListHeader } from './CarsListHeader';
import { CarsGrid } from './CarsGrid';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

const CarsListView: React.FC = () => {
  const { loading, error, cars, handleCarClick, handleAddCar, handleRetry } = useCarsList();

  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Show empty state
  if (cars.length === 0) {
    return (
      <>
        <CarsListHeader onAddCar={handleAddCar} />
        <EmptyState onAddCar={handleAddCar} />
      </>
    );
  }

  // Show cars grid
  return (
    <div className="space-y-6 w-full">
      <CarsListHeader onAddCar={handleAddCar} />
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg ring-1 ring-black/5 p-8">
        <CarsGrid cars={cars} onCarClick={handleCarClick} />
      </div>
    </div>
  );
};

export default CarsListView;
