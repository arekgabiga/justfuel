import React from "react";
import type { FillupDTO, PaginationDTO, CarDetailsDTO } from "../../types";
import { FillupsListView } from "./FillupsListView";

interface FillupsTabProps {
  car: CarDetailsDTO;
  fillups: FillupDTO[];
  pagination: PaginationDTO;
  loading: boolean;
  error: Error | null;
  onLoadMore: () => void;
  onFillupClick: (fillupId: string) => void;
}

export const FillupsTab: React.FC<FillupsTabProps> = ({
  car,
  fillups,
  pagination,
  loading,
  error,
  onLoadMore,
  onFillupClick,
}) => {
  return (
    <FillupsListView
      fillups={fillups}
      pagination={pagination}
      averageConsumption={car.statistics.average_consumption}
      loading={loading}
      error={error}
      onLoadMore={onLoadMore}
      onFillupClick={onFillupClick}
    />
  );
};

