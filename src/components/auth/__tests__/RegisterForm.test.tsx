import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { screen } from "@testing-library/react";
import { customRender, setupUser } from "@/test-utils";
import RegisterForm from "../RegisterForm";
import { useRegisterForm } from "@/lib/hooks/useRegisterForm";

vi.mock("@/lib/hooks/useRegisterForm");

describe("RegisterForm", () => {
  const mockHandleEmailChange = vi.fn();
  const mockHandlePasswordChange = vi.fn();
  const mockHandleConfirmPasswordChange = vi.fn();
  const mockHandleFieldBlur = vi.fn();
  const mockHandleSubmit = vi.fn((e) => e.preventDefault());

  const defaultHookReturn = {
    formState: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    formErrors: {},
    isSubmitting: false,
    touchedFields: new Set<string>(),
    success: null,
    handleEmailChange: mockHandleEmailChange,
    handlePasswordChange: mockHandlePasswordChange,
    handleConfirmPasswordChange: mockHandleConfirmPasswordChange,
    handleFieldBlur: mockHandleFieldBlur,
    handleSubmit: mockHandleSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRegisterForm as Mock).mockReturnValue(defaultHookReturn);
  });

  describe("Rendering", () => {
    it("should render registration form with three fields", () => {
      customRender(<RegisterForm />);

      expect(screen.getByRole("heading", { name: /rejestracja/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Hasło")).toBeInTheDocument();
      expect(screen.getByLabelText(/potwierdzenie hasła/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
    });

    it("should render link to login page", () => {
      customRender(<RegisterForm />);

      expect(screen.getByRole("link", { name: /zaloguj się/i })).toHaveAttribute("href", "/auth/login");
    });
  });

  describe("Validation", () => {
    it("should display email validation error when touched", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: "Nieprawidłowy adres e-mail" },
        touchedFields: new Set(["email"]),
      });

      customRender(<RegisterForm />);

      expect(screen.getByText("Nieprawidłowy adres e-mail")).toBeInTheDocument();
    });

    it("should display password validation error", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { password: "Hasło musi mieć minimum 6 znaków" },
        touchedFields: new Set(["password"]),
      });

      customRender(<RegisterForm />);

      expect(screen.getByText("Hasło musi mieć minimum 6 znaków")).toBeInTheDocument();
    });

    it("should display confirm password validation error when passwords don't match", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { confirmPassword: "Hasła muszą być identyczne" },
        touchedFields: new Set(["confirmPassword"]),
      });

      customRender(<RegisterForm />);

      expect(screen.getByText("Hasła muszą być identyczne")).toBeInTheDocument();
    });
  });

  describe("Password Confirmation Logic", () => {
    it("should call handleConfirmPasswordChange when user types in confirm password field", async () => {
      const user = setupUser();
      customRender(<RegisterForm />);

      const confirmPasswordInput = screen.getByLabelText(/potwierdzenie hasła/i);
      await user.type(confirmPasswordInput, "password123");

      expect(mockHandleConfirmPasswordChange).toHaveBeenCalled();
    });

    it("should have separate fields for password and confirm password", () => {
      customRender(<RegisterForm />);

      // Check both password fields exist
      expect(screen.getByLabelText("Hasło")).toBeInTheDocument();
      expect(screen.getByLabelText(/potwierdzenie hasła/i)).toBeInTheDocument();
    });
  });

  describe("Success Message Display", () => {
    it("should display success message when registration succeeds", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        success: {
          message: "Rejestracja przebiegła pomyślnie",
          requiresEmailConfirmation: false,
        },
      });

      customRender(<RegisterForm />);

      expect(screen.getByText("Rejestracja przebiegła pomyślnie")).toBeInTheDocument();
      expect(screen.queryByRole("form")).not.toBeInTheDocument();
    });

    it("should display email confirmation instructions when required", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          email: "test@example.com",
          password: "",
          confirmPassword: "",
        },
        success: {
          message: "Konto utworzone",
          requiresEmailConfirmation: true,
        },
      });

      customRender(<RegisterForm />);

      expect(screen.getByText(/sprawdź swoją skrzynkę e-mail/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/kliknij w link/i)).toBeInTheDocument();
    });

    it("should display link to login after successful registration", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        success: {
          message: "Success",
          requiresEmailConfirmation: false,
        },
      });

      customRender(<RegisterForm />);

      expect(screen.getByRole("link", { name: /przejdź do logowania/i })).toHaveAttribute("href", "/auth/login");
    });
  });

  describe("API Error Handling", () => {
    it("should display general error message", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { general: "Email już istnieje w systemie" },
      });

      customRender(<RegisterForm />);

      expect(screen.getByText("Email już istnieje w systemie")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should disable submit button when submitting", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /rejestrowanie/i });
      expect(submitButton).toBeDisabled();
    });

    it("should change button text when submitting", () => {
      (useRegisterForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<RegisterForm />);

      expect(screen.getByRole("button", { name: /rejestrowanie\.\.\./i })).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call handleSubmit on form submit", async () => {
      const user = setupUser();
      customRender(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("should call handleFieldBlur when fields lose focus", async () => {
      const user = setupUser();
      customRender(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      await user.click(emailInput);
      await user.tab();

      expect(mockHandleFieldBlur).toHaveBeenCalledWith("email");
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels and required attributes", () => {
      customRender(<RegisterForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toBeRequired();
      expect(screen.getByLabelText("Hasło")).toBeRequired();
      expect(screen.getByLabelText(/potwierdzenie hasła/i)).toBeRequired();
    });

    it("should have proper autocomplete attributes", () => {
      customRender(<RegisterForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toHaveAttribute("autocomplete", "email");
      expect(screen.getByLabelText("Hasło")).toHaveAttribute("autocomplete", "new-password");
      expect(screen.getByLabelText(/potwierdzenie hasła/i)).toHaveAttribute("autocomplete", "new-password");
    });
  });
});
