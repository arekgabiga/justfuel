import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useResetPasswordForm } from "../useResetPasswordForm";

describe("useResetPasswordForm", () => {
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
    it("should initialize with empty form state", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.formState).toEqual({
        password: "",
        confirmPassword: "",
      });
    });

    it("should initialize with empty errors", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.formErrors).toEqual({});
    });

    it("should initialize isSubmitting as false", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.isSubmitting).toBe(false);
    });

    it("should initialize tokenError as null", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.tokenError).toBeNull();
    });
  });

  describe("Password Validation", () => {
    it("should return error for empty password", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.validatePassword("")).toBe("Hasło jest wymagane");
    });

    it("should return error for short password", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.validatePassword("12345")).toBe("Hasło musi mieć minimum 6 znaków");
    });

    it("should return undefined for valid password", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.validatePassword("123456")).toBeUndefined();
    });
  });

  describe("Confirm Password Validation", () => {
    it("should return error for empty confirm password", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.validateConfirmPassword("", "password")).toBe("Potwierdzenie hasła jest wymagane");
    });

    it("should return error if passwords do not match", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.validateConfirmPassword("password123", "password456")).toBe("Hasła nie są identyczne");
    });

    it("should return undefined if passwords match", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      expect(result.current.validateConfirmPassword("password123", "password123")).toBeUndefined();
    });
  });

  describe("Field Changes & Cross-Validation", () => {
    it("should update password and trigger confirm password validation if touched", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));

      // First set confirm password and touch it
      act(() => {
        result.current.handleConfirmPasswordChange("password123");
        vi.runAllTimers();
      });

      // Then change password to something else
      act(() => {
        result.current.handlePasswordChange("password456");
        vi.runAllTimers();
      });

      expect(result.current.formErrors.confirmPassword).toBe("Hasła nie są identyczne");
    });

    it("should update confirm password and validate against password", () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));

      act(() => {
        result.current.handlePasswordChange("password123");
      });

      act(() => {
        result.current.handleConfirmPasswordChange("password456");
        vi.runAllTimers();
      });

      expect(result.current.formErrors.confirmPassword).toBe("Hasła nie są identyczne");
    });
  });

  describe("Submit Handling", () => {
    it("should not submit if validation fails", async () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.formErrors.password).toBeDefined();
    });

    it("should submit successfully", async () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200, // Added status
        json: async () => ({ success: true }),
      });

      act(() => {
        result.current.handlePasswordChange("password123");
        result.current.handleConfirmPasswordChange("password123");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password123" }),
      });
      expect(window.location.href).toBe("/auth/login?reset=success");
    });

    it("should handle INVALID_TOKEN error", async () => {
      const { result } = renderHook(() => useResetPasswordForm("invalid-token"));
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400, // Added status
        json: async () => ({ error: { code: "INVALID_TOKEN", message: "Token invalid" } }),
      });

      act(() => {
        result.current.handlePasswordChange("password123");
        result.current.handleConfirmPasswordChange("password123");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.tokenError).toBe("Token invalid");
      expect(result.current.isSubmitting).toBe(false);
    });

    it("should handle general API errors", async () => {
      const { result } = renderHook(() => useResetPasswordForm("valid-token"));
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500, // Added status
        json: async () => ({ error: { message: "General error" } }),
      });

      act(() => {
        result.current.handlePasswordChange("password123");
        result.current.handleConfirmPasswordChange("password123");
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.general).toBe("General error");
      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
