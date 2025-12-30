import React from 'react';
import { useFillupsView } from '../../lib/hooks/useFillupsView';
import { FillupsListView } from './FillupsListView';
import { AddFillupButton } from './AddFillupButton';
import { CarHeader } from './CarHeader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FillupsViewProps {
  carId: string;
}

export const FillupsView: React.FC<FillupsViewProps> = ({ carId }) => {
  const {
    car,
    carLoading,
    carError,
    fillups,
    pagination,
    fillupsLoading,
    fillupsError,
    initialLoading,
    loadMoreFillups,
    retry,
    handleFillupClick,
    handleAddFillupClick,
    handleBack,
  } = useFillupsView(carId);

  // Show loading state
  if (initialLoading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Ładowanie...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error state if car failed to load
  if (carError && !car) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Button onClick={handleBack} variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-800 dark:text-red-200">{carError.message}</p>
          <Button onClick={retry} variant="outline" className="mt-4" size="sm">
            Spróbuj ponownie
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Car Header with Back Navigation */}
      <div className="mb-8">{car && <CarHeader car={car} showActions={false} onBack={handleBack} />}</div>
      {carError && (
        <div className="mb-6">
          <p className="text-sm text-red-600 dark:text-red-400">Uwaga: {carError.message}</p>
        </div>
      )}

      {/* Add Fillup Button */}
      <div className="mb-8 flex justify-end">
        <AddFillupButton onClick={handleAddFillupClick} />
      </div>

      {/* Fillups List */}
      <FillupsListView
        fillups={fillups}
        pagination={pagination}
        averageConsumption={car?.statistics.average_consumption || 0}
        loading={fillupsLoading}
        error={fillupsError}
        onLoadMore={loadMoreFillups}
        onFillupClick={handleFillupClick}
        onRetry={retry}
        onAddFillup={handleAddFillupClick}
      />
    </main>
  );
};
