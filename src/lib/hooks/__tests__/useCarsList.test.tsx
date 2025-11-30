import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCarsList } from "../useCarsList";

describe("useCarsList", () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;
  const mockCars = [
    {
      id: "car-1",
      name: "Car 1",
      statistics: {
        total_fuel_cost: 100,
        total_fuel_amount: 50,
        total_distance: 500,
        average_consumption: 10,
        average_price_per_liter: 2,
        fillup_count: 5,
      },
    },
    {
      id: "car-2",
      name: "Car 2",
      statistics: {
        total_fuel_cost: 200,
        total_fuel_amount: 100,
        total_distance: 1000,
        average_consumption: 10,
        average_price_per_liter: 2,
        fillup_count: 10,
      },
    },
  ];

  beforeEach(() => {
    global.fetch = mockFetch;
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" };

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location = originalLocation;
  });

  describe("Initialization and Fetching", () => {
    it("should fetch cars on mount", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockCars }),
      });

      const { result } = renderHook(() => useCarsList());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cars).toEqual(mockCars);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cars?sort=name&order=asc"),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
        })
      );
    });

    it("should handle fetch error", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useCarsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain("Wystąpił błąd serwera");
    });

    it("should handle unauthorized (401)", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useCarsList());

      await waitFor(() => {
        expect(window.location.href).toBe("/login");
      });
    });

    it("should redirect to login if no token", async () => {
      // Ensure no token is available
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      // Clear any previous fetch calls
      mockFetch.mockClear();

      const { result } = renderHook(() => useCarsList());

      // Should redirect immediately
      expect(window.location.href).toBe("/login");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Retry Logic", () => {
    it("should retry fetching", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");

      // First attempt fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCarsList());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockCars }),
      });

      // Enable fake timers for timeout testing
      vi.useFakeTimers();
      act(() => {
        result.current.handleRetry();
        vi.runAllTimers();
      });
      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.cars).toEqual(mockCars);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to car details", () => {
      const { result } = renderHook(() => useCarsList());

      act(() => {
        result.current.handleCarClick("car-1");
      });

      expect(window.location.href).toBe("/cars/car-1");
    });

    it("should navigate to add car", () => {
      const { result } = renderHook(() => useCarsList());

      act(() => {
        result.current.handleAddCar();
      });

      expect(window.location.href).toBe("/cars/new");
    });
  });
});
