import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useNewCarForm } from "../useNewCarForm";

describe("useNewCarForm", () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    global.fetch = mockFetch;
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" };

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location = originalLocation;
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useNewCarForm());
      expect(result.current.formState).toEqual({
        name: "",
        initialOdometer: "",
        mileageInputPreference: "odometer",
      });
    });

    it("should initialize with empty errors", () => {
      const { result } = renderHook(() => useNewCarForm());
      expect(result.current.formErrors).toEqual({});
    });
  });

  describe("Validation", () => {
    it("should validate name", () => {
      const { result } = renderHook(() => useNewCarForm());

      act(() => {
        result.current.handleFieldChange("name", "");
        vi.runAllTimers();
      });
      expect(result.current.formErrors.name).toBe("Nazwa jest wymagana");

      act(() => {
        result.current.handleFieldChange("name", "Valid Name");
        vi.runAllTimers();
      });
      expect(result.current.formErrors.name).toBeUndefined();
    });

    it("should validate initialOdometer", () => {
      const { result } = renderHook(() => useNewCarForm());

      // Optional
      act(() => {
        result.current.handleFieldChange("initialOdometer", "");
        vi.runAllTimers();
      });
      expect(result.current.formErrors.initialOdometer).toBeUndefined();

      // Invalid number
      act(() => {
        result.current.handleFieldChange("initialOdometer", "abc");
        vi.runAllTimers();
      });
      expect(result.current.formErrors.initialOdometer).toBe("Stan licznika musi być liczbą całkowitą");

      // Negative
      act(() => {
        result.current.handleFieldChange("initialOdometer", "-100");
        vi.runAllTimers();
      });
      expect(result.current.formErrors.initialOdometer).toBe("Stan licznika nie może być ujemny");

      // Valid
      act(() => {
        result.current.handleFieldChange("initialOdometer", "1000");
        vi.runAllTimers();
      });
      expect(result.current.formErrors.initialOdometer).toBeUndefined();
    });
  });

  describe("Submit Handling", () => {
    it("should submit successfully", async () => {
      const { result } = renderHook(() => useNewCarForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "car-123", name: "New Car" }),
      });

      act(() => {
        result.current.handleFieldChange("name", "New Car");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cars",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            name: "New Car",
            mileage_input_preference: "odometer",
          }),
        })
      );

      // Wait for redirect timeout
      act(() => {
        vi.runAllTimers();
      });

      expect(window.location.href).toBe("/cars");
    });

    it("should handle conflict error (409)", async () => {
      const { result } = renderHook(() => useNewCarForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: { code: "CONFLICT", message: "Car exists" } }),
      });

      act(() => {
        result.current.handleFieldChange("name", "Existing Car");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.name).toContain("Samochód o tej nazwie już istnieje");
    });
  });
});
