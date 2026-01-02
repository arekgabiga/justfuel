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
import { ImportPreviewDialog } from './ImportPreviewDialog';
import { parseCsv, validateImportAgainstCar } from '@justfuel/shared';

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

  const handleChartTypeChange = (type: 'consumption' | 'price_per_liter' | 'distance') => {
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

  // Import/Export Logic
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importFillups, setImportFillups] = React.useState<any[]>([]);
  const [importErrors, setImportErrors] = React.useState<any[]>([]);
  const [importSubmitting, setImportSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `/api/cars/${carId}/export`;
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear input so same file can be selected again if needed
    event.target.value = '';

    if (!car) return;

    const text = await file.text();

    const parseResult = await parseCsv(text, {
      mileage_input_preference: car.mileage_input_preference as 'odometer' | 'distance',
    });
    const validationErrors = validateImportAgainstCar(parseResult.fillups, car);

    const allErrors = [...parseResult.errors, ...validationErrors];

    setImportFillups(parseResult.fillups);
    setImportErrors(allErrors);
    setImportDialogOpen(true);
  };

  const confirmImport = async () => {
    setImportSubmitting(true);
    try {
      const response = await fetch(`/api/cars/${carId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fillups: importFillups }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      setImportDialogOpen(false);
      // Refresh data
      fetchCarDetails();
      // Force refresh fillups (clear cursor)
      // Actually useCarDetails doesn't expose a clean "reset" but fetching page 1 might help or window reload
      if (typeof window !== 'undefined') {
        window.location.reload(); // Simplest way to ensure full consistency after massive import
      }
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
    } finally {
      setImportSubmitting(false);
    }
  };

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
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <CarHeader
          car={car}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          onBack={handleBackToCars}
          onExport={handleExport}
          onImport={handleImportClick}
        />
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg ring-1 ring-black/5 p-4 md:p-8">
        <TabNavigation activeTab={activeMainTab} onTabChange={switchMainTab} />

        <div className="mt-6">
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
        </div>
      </div>

      {car && (
        <>
          <EditCarDialog car={car} isOpen={editDialogOpen} onUpdate={handleUpdateCar} onCancel={closeEditDialog} />
          <DeleteCarDialog
            car={car}
            isOpen={deleteDialogOpen}
            onDelete={handleDeleteCar}
            onCancel={closeDeleteDialog}
          />
          {/* Dynamic import of Dialog to avoid circular deps if any */}
          {importDialogOpen && (
            /* We need to import the component. I will add import at top */
            <ImportPreviewDialog
              isOpen={importDialogOpen}
              onCancel={() => setImportDialogOpen(false)}
              onConfirm={confirmImport}
              fillups={importFillups}
              errors={importErrors}
              isSubmitting={importSubmitting}
            />
          )}
        </>
      )}
    </main>
  );
};
