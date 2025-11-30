import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useForgotPasswordForm } from "../useForgotPasswordForm";

describe("useForgotPasswordForm", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with empty form state", () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      expect(result.current.formState).toEqual({ email: "" });
    });

    it("should initialize with empty errors", () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      expect(result.current.formErrors).toEqual({});
    });

    it("should initialize isSubmitting as false", () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      expect(result.current.isSubmitting).toBe(false);
    });

    it("should initialize isSuccess as false", () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe("Email Validation", () => {
    it("should return error for empty email", () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      expect(result.current.validateEmail("")).toBe("Nieprawidłowy adres e-mail");
    });

    it("should return error for invalid email format", () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      expect(result.current.validateEmail("invalid")).toBe("Nieprawidłowy adres e-mail");
    });

    it("should return undefined for valid email", () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      expect(result.current.validateEmail("test@example.com")).toBeUndefined();
    });
  });

  describe("Field Changes", () => {
    it("should update email and set touched", () => {
      const { result } = renderHook(() => useForgotPasswordForm());

      act(() => {
        result.current.handleEmailChange("test@example.com");
      });

      expect(result.current.formState.email).toBe("test@example.com");
      expect(result.current.touchedFields.has("email")).toBe(true);
    });

    it("should validate on change if field was already touched", () => {
      const { result } = renderHook(() => useForgotPasswordForm());

      act(() => {
        result.current.handleFieldBlur("email");
      });

      act(() => {
        result.current.handleEmailChange("invalid");
        vi.runAllTimers();
      });

      expect(result.current.formErrors.email).toBe("Nieprawidłowy adres e-mail");
    });
  });

  describe("Submit Handling", () => {
    it("should not submit if validation fails", async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.formErrors.email).toBeDefined();
    });

    it("should submit successfully", async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Email sent" }),
      });

      act(() => {
        result.current.handleEmailChange("test@example.com");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );

      expect(result.current.isSuccess).toBe(true);
    });

    it("should handle API errors", async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400, // Changed from 500 to 400 for client-side error
        json: async () => ({ error: { message: "Server error" } }),
      });

      act(() => {
        result.current.handleEmailChange("test@example.com");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.general).toBe("Server error");
      expect(result.current.isSuccess).toBe(false);
    });

    it("should handle network errors", async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      act(() => {
        result.current.handleEmailChange("test@example.com");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.general).toBe("Wystąpił błąd. Spróbuj ponownie.");
      expect(result.current.isSuccess).toBe(false);
    });
  });
});
