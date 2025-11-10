import { useState, useEffect, useCallback } from "react";
import type {
  CarDetailsDTO,
  FillupDTO,
  PaginatedFillupsResponseDTO,
  PaginationDTO,
  ChartDataDTO,
  ChartType,
  UpdateCarCommand,
  DeleteCarCommand,
  ErrorResponseDTO,
} from "../../types";

interface CarDetailsState {
  car: CarDetailsDTO | null;
  loading: boolean;
  error: Error | null;
  activeMainTab: "fillups" | "charts";
  activeChartTab: ChartType;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  fillups: FillupDTO[];
  pagination: PaginationDTO;
  fillupsLoading: boolean;
  fillupsError: Error | null;
  chartData: ChartDataDTO | null;
  chartLoading: boolean;
  chartError: Error | null;
}

export const useCarDetails = (carId: string) => {
  const [state, setState] = useState<CarDetailsState>({
    car: null,
    loading: true,
    error: null,
    activeMainTab: "fillups",
    activeChartTab: "consumption",
    editDialogOpen: false,
    deleteDialogOpen: false,
    fillups: [],
    pagination: {
      next_cursor: null,
      has_more: false,
      total_count: 0,
    },
    fillupsLoading: false,
    fillupsError: null,
    chartData: null,
    chartLoading: false,
    chartError: null,
  });

  // Get auth token
  const getAuthToken = useCallback(() => {
    if (typeof window === "undefined") return null;

    const authToken = localStorage.getItem("auth_token");
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];
    const devToken = localStorage.getItem("dev_token");

    const token = authToken || cookieToken || devToken;

    console.log("[useCarDetails] Auth tokens:", {
      localStorage_auth_token: authToken ? "exists" : "missing",
      cookie_auth_token: cookieToken ? "exists" : "missing",
      localStorage_dev_token: devToken ? "exists" : "missing",
      final_token: token ? `${token.substring(0, 20)}...` : "missing",
    });

    return token;
  }, []);

  // Fetch car details
  const fetchCarDetails = useCallback(async () => {
    if (!carId) {
      setState((prev) => ({ ...prev, loading: false, error: new Error("Brak ID samochodu") }));
      return;
    }

    setState((prev) => {
      if (prev.loading) return prev; // Prevent multiple simultaneous fetches
      return { ...prev, loading: true, error: null };
    });

    try {
      const token = getAuthToken();

      // Don't require token - API will use DEV_AUTH_FALLBACK if needed
      console.log("[useCarDetails] Fetching car:", carId);

      // Build headers - only include Authorization if we have a valid token
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/cars/${carId}`, {
        headers,
      });

      console.log("[useCarDetails] API response:", response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          console.error("[useCarDetails] Unauthorized - NOT redirecting (showing error instead)");
          // Don't redirect, show error instead
          setState((prev) => ({
            ...prev,
            loading: false,
            error: new Error(
              "Brak autoryzacji. Ustaw token w localStorage (kliknij /dev/set-token) lub włącz DEV_AUTH_FALLBACK=true"
            ),
          }));
          return;
        }

        if (response.status === 404) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: new Error("Samochód nie został znaleziony"),
          }));
          return;
        }

        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      const car: CarDetailsDTO = await response.json();
      console.log("[useCarDetails] Car loaded:", car?.name);

      setState((prev) => ({
        ...prev,
        loading: false,
        car,
        error: null,
      }));
    } catch (error) {
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

      console.error("[useCarDetails] Error loading car:", errorMessage);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(errorMessage),
      }));
    }
  }, [carId, getAuthToken]);

  // Fetch fillups
  const fetchFillups = useCallback(
    async (cursor?: string | null) => {
      if (cursor === null) return;

      setState((prev) => {
        if (prev.fillupsLoading) return prev;
        return { ...prev, fillupsLoading: true, fillupsError: null };
      });

      try {
        const token = getAuthToken();

        const params = new URLSearchParams({
          limit: "20",
          sort: "date",
          order: "desc",
        });

        if (cursor) {
          params.append("cursor", cursor);
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/cars/${carId}/fillups?${params}`, {
          headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Don't redirect - show error instead
            return;
          }

          if (response.status === 404) {
            setState((prev) => ({
              ...prev,
              fillupsLoading: false,
              fillupsError: new Error("Samochód nie został znaleziony"),
            }));
            return;
          }

          const errorData: ErrorResponseDTO = await response.json();
          throw new Error(errorData.error.message);
        }

        const data: PaginatedFillupsResponseDTO = await response.json();

        setState((prev) => ({
          ...prev,
          fillups: cursor ? [...prev.fillups, ...data.fillups] : data.fillups,
          pagination: data.pagination,
          fillupsLoading: false,
          fillupsError: null,
        }));
      } catch (error) {
        let errorMessage = "Nieznany błąd";
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "Nie udało się pobrać tankowań. Sprawdź połączenie internetowe.";
          } else {
            errorMessage = error.message;
          }
        }

        setState((prev) => ({
          ...prev,
          fillupsLoading: false,
          fillupsError: new Error(errorMessage),
        }));
      }
    },
    [carId, getAuthToken]
  );

  // Fetch chart data
  const fetchChartData = useCallback(
    async (type: ChartType) => {
      setState((prev) => ({ ...prev, chartLoading: true, chartError: null }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      try {
        const token = getAuthToken();

        const params = new URLSearchParams({
          type,
          limit: "50",
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/cars/${carId}/charts?${params}`, {
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            setState((prev) => ({
              ...prev,
              chartLoading: false,
              chartError: new Error("Wymagana autoryzacja. Zaloguj się ponownie."),
            }));
            return;
          }

          if (response.status === 404) {
            setState((prev) => ({
              ...prev,
              chartLoading: false,
              chartError: new Error("Samochód nie został znaleziony."),
            }));
            return;
          }

          if (response.status >= 500 && response.status < 600) {
            const errorData: ErrorResponseDTO = await response.json();
            setState((prev) => ({
              ...prev,
              chartLoading: false,
              chartError: new Error(
                errorData.error.message || "Wystąpił błąd serwera. Spróbuj ponownie później."
              ),
            }));
            return;
          }

          const errorData: ErrorResponseDTO = await response.json();
          throw new Error(errorData.error.message);
        }

        const chartData: ChartDataDTO = await response.json();

        setState((prev) => ({
          ...prev,
          chartData,
          chartLoading: false,
          chartError: null,
        }));
      } catch (error) {
        clearTimeout(timeoutId);

        let errorMessage = "Nieznany błąd";
        if (error instanceof Error) {
          if (error.name === "AbortError" || error.message.includes("aborted")) {
            errorMessage = "Przekroczono limit czasu połączenia. Spróbuj ponownie.";
          } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.";
          } else {
            errorMessage = error.message;
          }
        }

        setState((prev) => ({
          ...prev,
          chartLoading: false,
          chartError: new Error(errorMessage),
        }));
      }
    },
    [carId, getAuthToken]
  );

  // Switch chart tab and fetch data
  const switchChartTabAndFetch = useCallback(
    (type: ChartType) => {
      setState((prev) => ({ ...prev, activeChartTab: type, chartData: null }));
      fetchChartData(type);
    },
    [fetchChartData]
  );

  // Update car
  const updateCar = useCallback(
    async (data: UpdateCarCommand) => {
      const token = getAuthToken();

      if (!token) {
        throw new Error("Wymagana autoryzacja");
      }

      const response = await fetch(`/api/cars/${carId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }

        if (response.status === 409) {
          const errorData: ErrorResponseDTO = await response.json();
          throw new Error(errorData.error.message || "Nazwa samochodu już istnieje");
        }

        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      const updated: CarDetailsDTO = await response.json();

      setState((prev) => ({
        ...prev,
        car: updated,
        editDialogOpen: false,
      }));
    },
    [carId, getAuthToken]
  );

  // Delete car
  const deleteCar = useCallback(
    async (confirmation: DeleteCarCommand) => {
      const token = getAuthToken();

      if (!token) {
        throw new Error("Wymagana autoryzacja");
      }

      const response = await fetch(`/api/cars/${carId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(confirmation),
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }

        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      // Redirect to cars list
      if (typeof window !== "undefined") {
        window.location.href = "/cars";
      }
    },
    [carId, getAuthToken]
  );

  // Tab management
  const switchMainTab = useCallback((tab: "fillups" | "charts") => {
    setState((prev) => ({ ...prev, activeMainTab: tab }));
  }, []);

  // Dialog management
  const openEditDialog = useCallback(() => {
    setState((prev) => ({ ...prev, editDialogOpen: true }));
  }, []);

  const closeEditDialog = useCallback(() => {
    setState((prev) => ({ ...prev, editDialogOpen: false }));
  }, []);

  const openDeleteDialog = useCallback(() => {
    setState((prev) => ({ ...prev, deleteDialogOpen: true }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setState((prev) => ({ ...prev, deleteDialogOpen: false }));
  }, []);

  // Handle add fillup button click
  const handleAddFillup = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}/fillups/new`;
    }
  }, [carId]);

  // Load more fillups
  const loadMoreFillups = useCallback(() => {
    if (!state.fillupsLoading && state.pagination.has_more && state.pagination.next_cursor) {
      fetchFillups(state.pagination.next_cursor);
    }
  }, [state.fillupsLoading, state.pagination.has_more, state.pagination.next_cursor, fetchFillups]);

  // Initial load - only when carId changes
  useEffect(() => {
    fetchCarDetails();
    // fetchCarDetails is stable (depends only on carId and getAuthToken which is stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  // Load fillups when main tab is fillups
  useEffect(() => {
    if (state.activeMainTab === "fillups" && state.car && state.fillups.length === 0) {
      fetchFillups();
    }
  }, [state.activeMainTab, state.car, state.fillups.length, fetchFillups]);

  // Load chart data when main tab is charts and chart type changes
  useEffect(() => {
    if (state.activeMainTab === "charts" && state.car) {
      fetchChartData(state.activeChartTab);
    }
  }, [state.activeMainTab, state.activeChartTab, state.car, fetchChartData]);

  return {
    ...state,
    fetchCarDetails,
    fetchFillups,
    fetchChartData,
    updateCar,
    deleteCar,
    switchMainTab,
    switchChartTab: switchChartTabAndFetch,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    loadMoreFillups,
    handleAddFillup,
  };
};
