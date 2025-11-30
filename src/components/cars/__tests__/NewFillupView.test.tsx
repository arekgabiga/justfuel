import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { customRender, setupUser, createMockWarning } from "@/test-utils";
import NewFillupView from "../NewFillupView";
import { useNewFillupForm } from "@/lib/hooks/useNewFillupForm";
import type { CarDetailsDTO } from "@/types";

// Mock the hook
vi.mock("@/lib/hooks/useNewFillupForm");

// Mock fetch for car name loading
global.fetch = vi.fn();

describe("NewFillupView", () => {
  const mockCarId = "test-car-id";
  const mockHandleFieldChange = vi.fn();
  const mockHandleFieldBlur = vi.fn();
  const mockHandleModeToggle = vi.fn();
  const mockHandleSubmit = vi.fn((e) => e.preventDefault());
  const mockHandleCancel = vi.fn();
  const mockHandleSkipCountdown = vi.fn();

  const defaultHookReturn = {
    formState: {
      date: "2024-01-15",
      fuelAmount: "",
      totalPrice: "",
      inputMode: "odometer" as const,
      odometer: "",
      distance: "",
    },
    formErrors: {},
    isSubmitting: false,
    touchedFields: new Set(),
    warnings: [],
    redirectIn: null,
    dateInputRef: { current: null },
    handleFieldChange: mockHandleFieldChange,
    handleFieldBlur: mockHandleFieldBlur,
    handleModeToggle: mockHandleModeToggle,
    handleSubmit: mockHandleSubmit,
    handleCancel: mockHandleCancel,
    handleSkipCountdown: mockHandleSkipCountdown,
    validateField: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNewFillupForm as Mock).mockReturnValue(defaultHookReturn);

    // Mock successful car fetch
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ name: "Test Car" }) as CarDetailsDTO,
    });
  });

  describe("Car Name Fetching", () => {
    it("should fetch and display car name in breadcrumbs", async () => {
      customRender(<NewFillupView carId={mockCarId} />);

      await waitFor(() => {
        expect(screen.getByText("Test Car")).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/cars/${mockCarId}`,
        expect.objectContaining({
          credentials: "include",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle fetch error gracefully", async () => {
      (global.fetch as Mock).mockRejectedValue(new Error("Network error"));

      customRender(<NewFillupView carId={mockCarId} />);

      // Should still render form even if car name fetch fails
      expect(screen.getByRole("form")).toBeInTheDocument();
    });
  });

  describe("Input Mode Toggle", () => {
    it("should initialize with default odometer mode", () => {
      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByLabelText(/stan licznika/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/dystans \(km\)/i)).not.toBeInTheDocument();
    });

    it("should initialize with specified initial mode", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          ...defaultHookReturn.formState,
          inputMode: "distance",
        },
      });

      customRender(<NewFillupView carId={mockCarId} initialInputMode="distance" />);

      expect(screen.getByLabelText(/dystans \(km\)/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/stan licznika/i)).not.toBeInTheDocument();
    });

    // LIMITATION: Direct Radix UI Select interaction testing is not possible in jsdom
    // Radix UI components use Portals and complex ARIA patterns that don't work in jsdom
    // The functionality is tested indirectly through hook mocking and state changes
    // For E2E testing of the actual select interaction, use Playwright tests
  });

  describe("Conditional Field Rendering", () => {
    it("should show odometer field when mode is odometer", () => {
      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByLabelText(/stan licznika/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/dystans \(km\)/i)).not.toBeInTheDocument();
    });

    it("should show distance field when mode is distance", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          ...defaultHookReturn.formState,
          inputMode: "distance",
        },
      });

      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByLabelText(/dystans \(km\)/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/stan licznika/i)).not.toBeInTheDocument();
    });

    it("should display only one mileage field at a time (mutual exclusivity)", () => {
      const { rerender } = customRender(<NewFillupView carId={mockCarId} />);

      // Initial: odometer mode
      expect(screen.getByLabelText(/stan licznika/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/dystans \(km\)/i)).not.toBeInTheDocument();

      // Switch to distance mode
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          ...defaultHookReturn.formState,
          inputMode: "distance",
        },
      });
      rerender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByLabelText(/dystans \(km\)/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/stan licznika/i)).not.toBeInTheDocument();
    });
  });

  describe("Form Field Validation Errors", () => {
    it("should display date validation error when touched", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { date: "Data jest wymagana" },
        touchedFields: new Set(["date"]),
      });

      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByText("Data jest wymagana")).toBeInTheDocument();
      expect(screen.getByLabelText(/data tankowania/i)).toHaveAttribute("aria-invalid", "true");
    });

    it("should display fuel amount validation error", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { fuelAmount: "Ilość paliwa musi być większa od zera" },
        touchedFields: new Set(["fuelAmount"]),
      });

      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByText("Ilość paliwa musi być większa od zera")).toBeInTheDocument();
    });

    it("should display total price validation error", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { totalPrice: "Całkowita cena musi być większa od zera" },
        touchedFields: new Set(["totalPrice"]),
      });

      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByText("Całkowita cena musi być większa od zera")).toBeInTheDocument();
    });

    it("should display odometer validation error", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { odometer: "Stan licznika nie może być ujemny" },
        touchedFields: new Set(["odometer"]),
      });

      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByText("Stan licznika nie może być ujemny")).toBeInTheDocument();
    });

    it("should display distance validation error", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          ...defaultHookReturn.formState,
          inputMode: "distance",
        },
        formErrors: { distance: "Dystans nie może być ujemny" },
        touchedFields: new Set(["distance"]),
      });

      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByText("Dystans nie może być ujemny")).toBeInTheDocument();
    });
  });

  describe("Validation Warnings Display", () => {
    it("should display validation warnings with AlertTriangle icon", () => {
      const warnings = [
        createMockWarning("odometer", "Stan licznika jest mniejszy niż poprzedni"),
        createMockWarning("distance", "Bardzo krótki dystans od ostatniego tankowania"),
      ];

      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        warnings,
      });

      customRender(<NewFillupView carId={mockCarId} />);

      // Check that warnings are displayed
      expect(screen.getByText(/stan licznika jest mniejszy niż poprzedni/i)).toBeInTheDocument();
      expect(screen.getByText(/bardzo krótki dystans/i)).toBeInTheDocument();
    });

    it("should call handleSkipCountdown when skip button is clicked", async () => {
      const user = setupUser();
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        warnings: [createMockWarning("odometer", "Test warning")],
        redirectIn: 5,
      });

      customRender(<NewFillupView carId={mockCarId} />);

      const skipButton = screen.getByRole("button", { name: /rozumiem/i });
      await user.click(skipButton);

      expect(mockHandleSkipCountdown).toHaveBeenCalled();
    });

    it("should not display warnings section when no warnings", () => {
      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.queryByText(/ostrzeżenia walidacji/i)).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call handleSubmit when form is submitted", async () => {
      const user = setupUser();
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          ...defaultHookReturn.formState,
          fuelAmount: "45.5",
          totalPrice: "227.5",
          odometer: "55000",
        },
      });

      customRender(<NewFillupView carId={mockCarId} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("should disable submit button when submitting", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<NewFillupView carId={mockCarId} />);

      const submitButton = screen.getByRole("button", { name: /zapisywanie/i });
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when there are errors in touched fields", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { date: "Data jest wymagana" },
        touchedFields: new Set(["date"]),
      });

      customRender(<NewFillupView carId={mockCarId} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      expect(submitButton).toBeDisabled();
    });

    it("should display submit error message", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { submit: "Wystąpił błąd podczas zapisywania" },
      });

      customRender(<NewFillupView carId={mockCarId} />);

      expect(screen.getByText("Wystąpił błąd podczas zapisywania")).toBeInTheDocument();
      // Auth error component is displayed with role="alert"
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("should call handleFieldChange when typing in fields", async () => {
      const user = setupUser();
      customRender(<NewFillupView carId={mockCarId} />);

      const fuelInput = screen.getByLabelText(/ilość paliwa/i);
      await user.type(fuelInput, "45.5");

      expect(mockHandleFieldChange).toHaveBeenCalled();
    });

    it("should call handleFieldBlur when leaving a field", async () => {
      const user = setupUser();
      customRender(<NewFillupView carId={mockCarId} />);

      const fuelInput = screen.getByLabelText(/ilość paliwa/i);
      await user.click(fuelInput);
      await user.tab();

      expect(mockHandleFieldBlur).toHaveBeenCalledWith("fuelAmount");
    });
  });

  describe("Cancel Button", () => {
    it("should call handleCancel when cancel button is clicked", async () => {
      const user = setupUser();
      customRender(<NewFillupView carId={mockCarId} />);

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(mockHandleCancel).toHaveBeenCalled();
    });

    it("should disable cancel button when submitting", () => {
      (useNewFillupForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<NewFillupView carId={mockCarId} />);

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Breadcrumbs Navigation", () => {
    it("should display breadcrumbs with car name after loading", async () => {
      customRender(<NewFillupView carId={mockCarId} />);

      await waitFor(() => {
        expect(screen.getByText("Test Car")).toBeInTheDocument();
      });
    });

    it("should not display breadcrumbs while loading car data", () => {
      const carPromise = new Promise(() => {
        // Never resolves - simulates pending fetch
      });
      (global.fetch as Mock).mockReturnValue(carPromise);

      customRender(<NewFillupView carId={mockCarId} />);

      // Breadcrumbs component might not be rendered yet
      // Since we mock the fetch, it stays pending
      expect(screen.queryByText("Test Car")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on form", () => {
      customRender(<NewFillupView carId={mockCarId} />);

      const form = screen.getByRole("form");
      expect(form).toHaveAttribute("aria-label", "Formularz dodawania nowego tankowania");
    });

    it("should mark required fields with asterisk and aria-required", () => {
      customRender(<NewFillupView carId={mockCarId} />);

      const dateInput = screen.getByLabelText(/data tankowania/i);
      expect(dateInput).toHaveAttribute("aria-required", "true");
      expect(dateInput).toBeRequired();

      const fuelInput = screen.getByLabelText(/ilość paliwa/i);
      expect(fuelInput).toHaveAttribute("aria-required", "true");
      expect(fuelInput).toBeRequired();

      const priceInput = screen.getByLabelText(/całkowita cena/i);
      expect(priceInput).toHaveAttribute("aria-required", "true");
      expect(priceInput).toBeRequired();
    });
  });
});
