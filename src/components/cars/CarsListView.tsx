import React from "react";
import { useCarsList } from "../../lib/hooks/useCarsList";
import { CarsListHeader } from "./CarsListHeader";
import { CarsGrid } from "./CarsGrid";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

const CarsListView: React.FC = () => {
  const { loading, error, cars, sortBy, sortOrder, handleCarClick, handleAddCar, handleRetry, handleSortChange } =
    useCarsList();

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
        <CarsListHeader onAddCar={handleAddCar} sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
        <EmptyState onAddCar={handleAddCar} />
      </>
    );
  }

  // Show cars grid
  return (
    <>
      <CarsListHeader onAddCar={handleAddCar} sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
      <CarsGrid cars={cars} onCarClick={handleCarClick} />
    </>
  );
};

export default CarsListView;
