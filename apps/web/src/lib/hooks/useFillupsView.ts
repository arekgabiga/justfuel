import { useState, useEffect, useCallback } from 'react';
import { navigateTo } from '../utils/navigation';
import type { CarDetailsDTO, FillupDTO, PaginatedFillupsResponseDTO, PaginationDTO } from '../../types';

/**
 * State interface for the fillups view hook
 */
interface FillupsViewState {
  /** Car details object */
  car: CarDetailsDTO | null;
  /** Whether car details are currently being loaded */
  carLoading: boolean;
  /** Error object if car details failed to load */
  carError: Error | null;

  /** Array of fillups for the car */
  fillups: FillupDTO[];
  /** Pagination metadata */
  pagination: PaginationDTO;
  /** Whether fillups are currently being loaded */
  fillupsLoading: boolean;
  /** Error object if fillups failed to load */
  fillupsError: Error | null;
  /** Whether this is the initial load (both car and fillups) */
  initialLoading: boolean;
}

/**
 * Custom hook for managing the fillups view state and data fetching
 *
 * Handles:
 * - Fetching car details from API
 * - Fetching paginated fillups with infinite scroll support
 * - Managing loading and error states
 * - Providing navigation handlers
 * - Auth token management
 *
 * @param carId - UUID of the car to display fillups for
 * @returns Object containing state, data, and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   car,
 *   fillups,
 *   loading,
 *   handleFillupClick,
 *   loadMoreFillups
 * } = useFillupsView("car-id-123");
 * ```
 */
export const useFillupsView = (carId: string) => {
  const [state, setState] = useState<FillupsViewState>({
    car: null,
    carLoading: true,
    carError: null,

    fillups: [],
    pagination: {
      next_cursor: null,
      has_more: false,
      total_count: 0,
    },
    fillupsLoading: true,
    fillupsError: null,
    initialLoading: true,
  });

  /**
   * Fetches car details from the API
   *
   * Calls GET /api/cars/{carId} endpoint
   * Updates car loading state and handles errors appropriately
   *
   * @throws Error if car fetch fails (network, auth, not found, etc.)
   */
  const fetchCar = useCallback(async () => {
    setState((prev) => ({ ...prev, carLoading: true, carError: null }));

    try {
      const response = await fetch(`/api/cars/${carId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Brak autoryzacji. Zaloguj się ponownie.');
        }
        if (response.status === 404) {
          throw new Error('Samochód nie został znaleziony');
        }
        if (response.status >= 500) {
          throw new Error('Wystąpił błąd serwera. Spróbuj ponownie za chwilę.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const car: CarDetailsDTO = await response.json();
      setState((prev) => ({
        ...prev,
        car,
        carLoading: false,
        carError: null,
      }));
    } catch (error) {
      let errorMessage = 'Nieznany błąd';

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Nie udało się pobrać danych. Sprawdź połączenie internetowe.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Przekroczono limit czasu połączenia. Spróbuj ponownie.';
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        carLoading: false,
        carError: new Error(errorMessage),
      }));
    }
  }, [carId]);

  /**
   * Fetches fillups from the API with pagination support
   *
   * Calls GET /api/cars/{carId}/fillups endpoint with cursor-based pagination
   * Updates fillups array by appending or replacing based on cursor presence
   *
   * @param cursor - Optional pagination cursor for fetching next page
   * @throws Error if fillups fetch fails (network, auth, not found, etc.)
   */
  const fetchFillups = useCallback(
    async (cursor?: string) => {
      setState((prev) => ({ ...prev, fillupsLoading: true, fillupsError: null }));

      try {
        const params = new URLSearchParams({
          limit: '20',
          sort: 'date',
          order: 'desc',
        });
        if (cursor) {
          params.append('cursor', cursor);
        }

        const response = await fetch(`/api/cars/${carId}/fillups?${params}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Brak autoryzacji. Zaloguj się ponownie.');
          }
          if (response.status === 404) {
            throw new Error('Samochód nie został znaleziony');
          }
          if (response.status >= 500) {
            throw new Error('Wystąpił błąd serwera. Spróbuj ponownie za chwilę.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PaginatedFillupsResponseDTO = await response.json();

        setState((prev) => ({
          ...prev,
          fillups: cursor ? [...prev.fillups, ...data.fillups] : data.fillups,
          pagination: data.pagination,
          fillupsLoading: false,
          fillupsError: null,
          initialLoading: false,
        }));
      } catch (error) {
        let errorMessage = 'Nieznany błąd';

        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Nie udało się pobrać danych. Sprawdź połączenie internetowe.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Przekroczono limit czasu połączenia. Spróbuj ponownie.';
          } else {
            errorMessage = error.message;
          }
        }

        setState((prev) => ({
          ...prev,
          fillupsLoading: false,
          fillupsError: new Error(errorMessage),
          initialLoading: false,
        }));
      }
    },
    [carId]
  );

  /**
   * Loads more fillups for infinite scroll
   *
   * Only triggers if:
   * - Not already loading
   * - Has more pages available
   * - Next cursor exists
   *
   * Calls fetchFillups with the next_cursor from pagination state
   */
  const loadMoreFillups = useCallback(() => {
    if (state.fillupsLoading || !state.pagination.has_more || !state.pagination.next_cursor) {
      return;
    }
    fetchFillups(state.pagination.next_cursor);
  }, [state.fillupsLoading, state.pagination.has_more, state.pagination.next_cursor, fetchFillups]);

  /**
   * Retry mechanism for error recovery
   *
   * Clears error states and refetches both car details and fillups
   */
  const retry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      carError: null,
      fillupsError: null,
    }));
    fetchCar();
    fetchFillups();
  }, [fetchCar, fetchFillups]);

  /**
   * Handler for fillup card click
   *
   * Navigates to fillup edit page: /cars/{carId}/fillups/{fillupId}/edit
   *
   * @param fillupId - UUID of the fillup to edit
   */
  const handleFillupClick = useCallback(
    (fillupId: string) => {
      navigateTo(`/cars/${carId}/fillups/${fillupId}/edit`);
    },
    [carId]
  );

  /**
   * Handler for add fillup button click
   *
   * Navigates to add fillup form: /cars/{carId}/fillups/new
   */
  const handleAddFillupClick = useCallback(() => {
    navigateTo(`/cars/${carId}/fillups/new`);
  }, [carId]);

  /**
   * Handler for back button click
   *
   * Navigates to cars list: /cars
   */
  const handleBack = useCallback(() => {
    navigateTo('/cars');
  }, []);

  /**
   * Initial data fetch on mount
   *
   * Fetches both car details and fillups in parallel
   * Sets up 10-second timeout to prevent hanging requests
   * Cleans up timeout on unmount
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setState((prev) => {
        if (prev.initialLoading) {
          return {
            ...prev,
            initialLoading: false,
            carLoading: false,
            fillupsLoading: false,
          };
        }
        return prev;
      });
    }, 10000); // 10 second timeout

    // Fetch car and fillups in parallel
    Promise.all([fetchCar(), fetchFillups()]);

    return () => clearTimeout(timeoutId);
  }, [fetchCar, fetchFillups]);

  return {
    ...state,
    loadMoreFillups,
    retry,
    handleFillupClick,
    handleAddFillupClick,
    handleBack,
  };
};
