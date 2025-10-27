import React, { useEffect, useRef } from "react";
import type { FillupDTO, PaginationDTO } from "../../types";
import { FillupCard } from "./FillupCard";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FillupsListViewProps {
  fillups: FillupDTO[];
  pagination: PaginationDTO;
  averageConsumption: number;
  loading: boolean;
  error: Error | null;
  onLoadMore: () => void;
  onFillupClick: (fillupId: string) => void;
}

export const FillupsListView: React.FC<FillupsListViewProps> = ({
  fillups,
  pagination,
  averageConsumption,
  loading,
  error,
  onLoadMore,
  onFillupClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && pagination.has_more) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loading, pagination.has_more, onLoadMore]);

  if (error) {
    return (
      <ErrorState error={error} onRetry={() => onFillupClick} />
    );
  }

  if (loading && fillups.length === 0) {
    return <LoadingState />;
  }

  if (fillups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⛽</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Brak tankowań
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Dodaj pierwsze tankowanie dla tego samochodu.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {fillups.map((fillup) => (
        <FillupCard
          key={fillup.id}
          fillup={fillup}
          averageConsumption={averageConsumption}
          onClick={() => onFillupClick(fillup.id)}
        />
      ))}

      {/* Infinite scroll trigger */}
      {pagination.has_more && (
        <div ref={observerTargetRef} className="py-4 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Ładowanie kolejnych tankowań...</span>
            </div>
          )}
        </div>
      )}

      {/* Loading indicator at bottom */}
      {!pagination.has_more && fillups.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          Wyświetlono wszystkie tankowania ({pagination.total_count})
        </div>
      )}
    </div>
  );
};

