import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEditFillupForm } from "../useEditFillupForm";

describe("useEditFillupForm", () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;
  const carId = "car-123";
  const fillupId = "fillup-456";
  const mockCarData = {
    id: carId,
    name: "Test Car",
    mileage_input_preference: "odometer",
  };
  const mockFillupData = {
    id: fillupId,
    car_id: carId,
    date: "2023-01-01",
    fuel_amount: 50,
    total_price: 300,
    odometer: 1000,
    distance_traveled: null,
  };

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

  describe("Initialization", () => {
    it("should load fillup data on mount", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");

      // Mock parallel fetches: car and fillup
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockCarData }) // Car fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockFillupData }); // Fillup fetch

      const { result } = renderHook(() => useEditFillupForm({ carId, fillupId }));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.formState).toEqual({
        date: "2023-01-01",
        fuelAmount: "50",
        totalPrice: "300",
        inputMode: "odometer",
        odometer: "1000",
        distance: "",
      });
      expect(result.current.originalFillupData).toEqual(mockFillupData);
    });

    it("should handle load error", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockCarData })
        .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: { message: "Not found" } }) });

      const { result } = renderHook(() => useEditFillupForm({ carId, fillupId }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.formErrors.submit).toContain("Tankowanie nie zostało znalezione");
    });
  });

  describe("Update Handling", () => {
    beforeEach(() => {
      // Reset all mocks first
      mockFetch.mockClear();

      // Setup localStorage mock
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");

      // Setup successful loads for update tests
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockCarData })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockFillupData });
    });

    it("should not submit if no changes", async () => {
      const { result } = renderHook(() => useEditFillupForm({ carId, fillupId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.submit).toBe("Nie wprowadzono żadnych zmian");
      // Should not call fetch for update (only initial loads were called)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should submit only changed fields", async () => {
      const { result } = renderHook(() => useEditFillupForm({ carId, fillupId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Now enable fake timers for redirect testing
      vi.useFakeTimers();
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      // Update fuel amount
      act(() => {
        result.current.handleFieldChange("fuelAmount", "60");
      });

      // Mock update response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockFillupData, fuel_amount: 60 }),
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).toHaveBeenCalledTimes(3); // Load Car + Load Fillup + Update
      const updateCall = mockFetch.mock.calls[2];
      expect(updateCall[0]).toBe(`/api/cars/${carId}/fillups/${fillupId}`);
      expect(updateCall[1].method).toBe("PATCH");
      expect(JSON.parse(updateCall[1].body)).toEqual({ fuel_amount: 60 });

      // Check redirect
      act(() => {
        vi.runAllTimers();
      });
      expect(window.location.href).toBe(`/cars/${carId}?tab=fillups`);

      vi.useRealTimers();
    });
  });

  describe("Delete Handling", () => {
    beforeEach(() => {
      // Reset all mocks first
      mockFetch.mockClear();

      // Setup localStorage mock
      vi.mocked(localStorage.getItem).mockReturnValue("fake-token");

      // Setup successful loads
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockCarData })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockFillupData });
    });

    it("should open and close delete dialog", async () => {
      const { result } = renderHook(() => useEditFillupForm({ carId, fillupId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.handleDeleteClick();
      });
      expect(result.current.isDeleteDialogOpen).toBe(true);

      act(() => {
        result.current.handleDeleteCancel();
      });
      expect(result.current.isDeleteDialogOpen).toBe(false);
    });

    it("should handle delete confirmation", async () => {
      const { result } = renderHook(() => useEditFillupForm({ carId, fillupId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Mock delete response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Deleted" }),
      });

      await act(async () => {
        await result.current.handleDeleteConfirm();
      });

      expect(mockFetch).toHaveBeenCalledTimes(3); // Load Car + Load Fillup + Delete
      const deleteCall = mockFetch.mock.calls[2];
      expect(deleteCall[0]).toBe(`/api/cars/${carId}/fillups/${fillupId}`);
      expect(deleteCall[1].method).toBe("DELETE");

      expect(window.location.href).toBe(`/cars/${carId}?tab=fillups`);
    });
  });
});
