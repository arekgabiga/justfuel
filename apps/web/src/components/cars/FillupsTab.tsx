import React from 'react';
import type { FillupDTO, PaginationDTO, CarDetailsDTO } from '../../types';
import { FillupsListView } from './FillupsListView';
import { AddFillupButton } from './AddFillupButton';

interface FillupsTabProps {
  car: CarDetailsDTO;
  fillups: FillupDTO[];
  pagination: PaginationDTO;
  loading: boolean;
  error: Error | null;
  onLoadMore: () => void;
  onFillupClick: (fillupId: string) => void;
  onAddFillup: () => void;
}

export const FillupsTab: React.FC<FillupsTabProps> = ({
  car,
  fillups,
  pagination,
  loading,
  error,
  onLoadMore,
  onFillupClick,
  onAddFillup,
}) => {
  return (
    <>
      {/* Add Fillup Button */}
      {/* Add Fillup Button - Hidden on mobile because it's a FAB handled inside AddFillupButton */}
      <div className="hidden sm:flex mb-6 justify-end">
        <AddFillupButton onClick={onAddFillup} />
      </div>

      {/* Mobile FAB Container - only logic needed is to render the button which handles its own positioning */}
      <div className="sm:hidden block">
        <AddFillupButton onClick={onAddFillup} />
      </div>

      {/* Fillups List */}
      <FillupsListView
        fillups={fillups}
        pagination={pagination}
        averageConsumption={car.statistics.average_consumption || 0}
        loading={loading}
        error={error}
        onLoadMore={onLoadMore}
        onFillupClick={onFillupClick}
        onAddFillup={onAddFillup}
      />
    </>
  );
};
