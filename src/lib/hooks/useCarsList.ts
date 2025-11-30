import { useState, useEffect, useCallback } from "react";
import type { CarWithStatisticsDTO } from "../../types";

interface CarsListState {
  loading: boolean;
  error: Error | null;
  cars: CarWithStatisticsDTO[];
  sortBy: "name" | "created_at";
  sortOrder: "asc" | "desc";
}

export const useCarsList = () => {
  const [state, setState] = useState<CarsListState>({
    loading: true,
    error: null,
    cars: [],
    sortBy: "name",
    sortOrder: "asc",
  });

  const fetchCars = useCallback(async (sortBy: string, sortOrder: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Get auth token from localStorage or cookies
      let token =
        localStorage.getItem("auth_token") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1];

      // For development/testing: allow mock token
      if (!token && typeof window !== "undefined") {
        // Check for development mode
        const devToken = localStorage.getItem("dev_token");
        if (devToken) {
          token = devToken;
        }
      }

      if (!token) {
        // Redirect to login when no token is present
        if (typeof window !== "undefined") {
          window.location.href = "/login";
          return;
        }
        throw new Error("Brak tokenu autoryzacji");
      }

      const queryParams = new URLSearchParams({
        sort: sortBy,
        order: sortOrder,
      });

      const response = await fetch(`/api/cars?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login on auth error
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }

        // Handle different error types
        if (response.status === 403) {
          throw new Error("Brak uprawnień do przeglądania samochodów");
        }
        if (response.status === 404) {
          throw new Error("Endpoint nie został znaleziony");
        }
        if (response.status >= 500) {
          throw new Error("Wystąpił błąd serwera. Spróbuj ponownie za chwilę.");
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response data
      if (!data || typeof data !== "object") {
        throw new Error("Nieprawidłowa odpowiedź z serwera");
      }

      if (!Array.isArray(data.data)) {
        // Log warning only in development
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn("Oczekiwano tablicy samochodów, otrzymano:", typeof data.data);
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          cars: [],
          error: null,
        }));
        return;
      }

      // Validate car data
      const validCars = data.data.filter((car: CarWithStatisticsDTO) => {
        return (
          car &&
          typeof car.id === "string" &&
          typeof car.name === "string" &&
          car.statistics &&
          typeof car.statistics === "object"
        );
      });

      if (validCars.length !== data.data.length) {
        // Log warning only in development
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(`Filtrowano ${data.data.length - validCars.length} nieprawidłowych samochodów`);
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        cars: validCars,
        error: null,
      }));
    } catch (error) {
      // Log error only in development
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error fetching cars:", error);
      }

      let errorMessage = "Nieznany błąd";

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Nie udało się pobrać danych. Sprawdź połączenie internetowe.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Przekroczono limit czasu połączenia. Spróbuj ponownie.";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(errorMessage),
      }));
    }
  }, []);

  // handleSortChange removed - sorting is now fixed to name/asc

  const handleRetry = useCallback(() => {
    // Add exponential backoff for retry attempts
    const retryCount = state.error ? 1 : 0; // Simple retry counter
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5 seconds

    setTimeout(() => {
      fetchCars(state.sortBy, state.sortOrder);
    }, delay);
  }, [fetchCars, state.sortBy, state.sortOrder, state.error]);

  const handleCarClick = useCallback((carId: string) => {
    // Navigate to car details page using Astro router
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}`;
    }
  }, []);

  const handleAddCar = useCallback(() => {
    // Navigate to add car form using Astro router
    if (typeof window !== "undefined") {
      window.location.href = "/cars/new";
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    // Add timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      setState((prev) => {
        if (prev.loading) {
          return {
            ...prev,
            loading: false,
            error: new Error("Przekroczono limit czasu połączenia. Sprawdź połączenie internetowe."),
          };
        }
        return prev;
      });
    }, 10000); // 10 second timeout

    fetchCars(state.sortBy, state.sortOrder);

    return () => clearTimeout(timeoutId);
    // Only run on mount - sortBy and sortOrder are fixed values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCars]);

  return {
    ...state,
    fetchCars,
    handleRetry,
    handleCarClick,
    handleAddCar,
  };
};
