import React from 'react';
import { useCarDetails } from '../../lib/hooks/useCarDetails';
import { CarHeader } from './CarHeader';
import { TabNavigation } from './TabNavigation';
import { FillupsTab } from './FillupsTab';
import { ChartsTab } from './ChartsTab';
import { EditCarDialog } from './EditCarDialog';
import { DeleteCarDialog } from './DeleteCarDialog';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

interface CarDetailsViewProps {
  carId: string;
}

export const CarDetailsView: React.FC<CarDetailsViewProps> = ({ carId }) => {
  const {
    car,
    loading,
    error,
    activeMainTab,
    activeChartTab,
    editDialogOpen,
    deleteDialogOpen,
    fillups,
    pagination,
    fillupsLoading,
    fillupsError,
    chartData,
    chartLoading,
    chartError,
    switchMainTab,
    switchChartTab,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    updateCar,
    deleteCar,
    fetchChartData,
    loadMoreFillups,
    fetchCarDetails,
    handleAddFillup,
  } = useCarDetails(carId);

  const handleFillupClick = (fillupId: string) => {
    // Navigate to fillup edit page
    if (typeof window !== 'undefined') {
      window.location.href = `/cars/${carId}/fillups/${fillupId}/edit`;
    }
  };

  const handleBackToCars = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    fetchCarDetails();
  };

  const handleChartRetry = () => {
    fetchChartData(activeChartTab);
  };

  const handleChartTypeChange = (type: React.SetStateAction<'consumption' | 'price_per_liter' | 'distance'>) => {
    switchChartTab(type);
  };

  const handleUpdateCar = async (data: Parameters<typeof updateCar>[0]) => {
    await updateCar(data);
  };

  const handleDeleteCar = async (data: Parameters<typeof deleteCar>[0]) => {
    await deleteCar(data);
  };

  // Load chart data when chart tab is selected
  React.useEffect(() => {
    if (activeMainTab === 'charts' && !chartData && !chartLoading) {
      fetchChartData(activeChartTab);
    }
  }, [activeMainTab, activeChartTab, chartData, chartLoading, fetchChartData]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !car) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState error={error || new Error('Samochód nie został znaleziony')} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <CarHeader car={car} onEdit={openEditDialog} onDelete={openDeleteDialog} onBack={handleBackToCars} />
      </div>

      <TabNavigation activeTab={activeMainTab} onTabChange={switchMainTab} />

      {activeMainTab === 'fillups' && (
        <FillupsTab
          car={car}
          fillups={fillups}
          pagination={pagination}
          loading={fillupsLoading}
          error={fillupsError}
          onLoadMore={loadMoreFillups}
          onFillupClick={handleFillupClick}
          onAddFillup={handleAddFillup}
        />
      )}

      {activeMainTab === 'charts' && (
        <ChartsTab
          chartData={chartData}
          activeChartType={activeChartTab}
          loading={chartLoading}
          error={chartError}
          onChartTypeChange={handleChartTypeChange}
          onRetry={handleChartRetry}
        />
      )}

      {car && (
        <>
          <EditCarDialog car={car} isOpen={editDialogOpen} onUpdate={handleUpdateCar} onCancel={closeEditDialog} />
          <DeleteCarDialog
            car={car}
            isOpen={deleteDialogOpen}
            onDelete={handleDeleteCar}
            onCancel={closeDeleteDialog}
          />
        </>
      )}
    </main>
  );
};
