import React, { useEffect, useRef } from 'react';
import type { FillupDTO, PaginationDTO } from '../../types';
import { FillupCard } from './FillupCard';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyFillupsState } from './EmptyFillupsState';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FillupsListViewProps {
  fillups: FillupDTO[];
  pagination: PaginationDTO;
  averageConsumption: number;
  loading: boolean;
  error: Error | null;
  onLoadMore: () => void;
  onFillupClick: (fillupId: string) => void;
  onRetry?: () => void;
  onAddFillup?: () => void;
  mileageInputPreference?: 'odometer' | 'distance';
}

export const FillupsListView: React.FC<FillupsListViewProps> = ({
  fillups,
  pagination,
  averageConsumption,
  loading,
  error,
  onLoadMore,
  onFillupClick,
  onRetry,
  onAddFillup,
  mileageInputPreference,
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
    return <ErrorState error={error} onRetry={onRetry || (() => undefined)} />;
  }

  if (loading && fillups.length === 0) {
    return <LoadingState />;
  }

  if (fillups.length === 0) {
    return <EmptyFillupsState onAddFillup={onAddFillup} />;
  }

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fillups.map((fillup, index) => {
        // Calculate validation status
        // Assuming fillups are sorted by date DESC (newest first)
        // Check if NEXT fillup (older) has specific relationship
        let isOdometerInvalid = false;
        
        // We can only validate if we have a next item
        if (index < fillups.length - 1) {
          const olderFillup = fillups[index + 1];
          // If current odometer is defined AND older odometer is defined
          if (
            fillup.odometer !== null && 
            fillup.odometer !== undefined && 
            olderFillup.odometer !== null && 
            olderFillup.odometer !== undefined
          ) {
            // It is invalid if current (newer) < older
            if (fillup.odometer < olderFillup.odometer) {
              isOdometerInvalid = true;
            }
          }
        }

        return (
          <FillupCard
            key={fillup.id}
            fillup={fillup}
            averageConsumption={averageConsumption}
            onClick={() => onFillupClick(fillup.id)}
            mileageInputPreference={mileageInputPreference}
            isOdometerInvalid={isOdometerInvalid}
          />
        );
      })}

      {/* Infinite scroll trigger */}
      {pagination.has_more && (
        <div ref={observerTargetRef} className="col-span-full py-4 flex justify-center">
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
        <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          Wyświetlono wszystkie tankowania ({pagination.total_count})
        </div>
      )}
    </div>
  );
};
