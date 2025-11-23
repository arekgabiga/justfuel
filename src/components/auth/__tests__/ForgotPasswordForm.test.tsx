import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { screen } from "@testing-library/react";
import { customRender, setupUser } from "@/test-utils";
import ForgotPasswordForm from "../ForgotPasswordForm";
import { useForgotPasswordForm } from "@/lib/hooks/useForgotPasswordForm";

vi.mock("@/lib/hooks/useForgotPasswordForm");

describe("ForgotPasswordForm", () => {
  const mockHandleEmailChange = vi.fn();
  const mockHandleFieldBlur = vi.fn();
  const mockHandleSubmit = vi.fn((e) => e.preventDefault());

  const defaultHookReturn = {
    formState: { email: "" },
    formErrors: {},
    isSubmitting: false,
    isSuccess: false,
    touchedFields: new Set<string>(),
    handleEmailChange: mockHandleEmailChange,
    handleFieldBlur: mockHandleFieldBlur,
    handleSubmit: mockHandleSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useForgotPasswordForm as Mock).mockReturnValue(defaultHookReturn);
  });

  describe("Rendering", () => {
    it("should render forgot password form", () => {
      customRender(<ForgotPasswordForm />);

      expect(screen.getByRole("heading", { name: /odzyskiwanie hasła/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /wyślij link resetujący/i })).toBeInTheDocument();
    });

    it("should render description text", () => {
      customRender(<ForgotPasswordForm />);

      expect(screen.getByText(/podaj adres e-mail powiązany z kontem/i)).toBeInTheDocument();
    });

    it("should render link back to login", () => {
      customRender(<ForgotPasswordForm />);

      expect(screen.getByRole("link", { name: /wróć do logowania/i })).toHaveAttribute("href", "/auth/login");
    });
  });

  describe("Email Validation", () => {
    it("should display email error when touched", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: "Nieprawidłowy adres e-mail" },
        touchedFields: new Set(["email"]),
      });

      customRender(<ForgotPasswordForm />);

      expect(screen.getByText("Nieprawidłowy adres e-mail")).toBeInTheDocument();
    });

    it("should not display error when field not touched", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: "Error" },
        touchedFields: new Set(),
      });

      customRender(<ForgotPasswordForm />);

      expect(screen.queryByText("Error")).not.toBeInTheDocument();
    });
  });

  describe("Success Message Display", () => {
    it("should display success view after submission", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSuccess: true,
      });

      customRender(<ForgotPasswordForm />);

      expect(screen.getByRole("heading", { name: /sprawdź swoją skrzynkę/i })).toBeInTheDocument();
      expect(screen.queryByRole("form")).not.toBeInTheDocument();
    });

    it("should display security best practice message", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSuccess: true,
      });

      customRender(<ForgotPasswordForm />);

      const securityMessage = screen.getByText(/jeśli konto z tym adresem e-mail istnieje, wysłaliśmy link/i);
      expect(securityMessage).toBeInTheDocument();
    });

    it("should display link to login in success view", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSuccess: true,
      });

      customRender(<ForgotPasswordForm />);

      expect(screen.getByRole("link", { name: /wróć do logowania/i })).toHaveAttribute("href", "/auth/login");
    });
  });

  describe("Loading State", () => {
    it("should disable button when submitting", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<ForgotPasswordForm />);

      expect(screen.getByRole("button", { name: /wysyłanie/i })).toBeDisabled();
    });

    it("should change button text when submitting", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<ForgotPasswordForm />);

      expect(screen.getByText("Wysyłanie...")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call handleEmailChange when typing", async () => {
      const user = setupUser();
      customRender(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      await user.type(emailInput, "test@example.com");

      expect(mockHandleEmailChange).toHaveBeenCalled();
    });

    it("should call handleFieldBlur when email field loses focus", async () => {
      const user = setupUser();
      customRender(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      await user.click(emailInput);
      await user.tab();

      expect(mockHandleFieldBlur).toHaveBeenCalledWith("email");
    });

    it("should call handleSubmit on form submit", async () => {
      const user = setupUser();
      customRender(<ForgotPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
      await user.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels", () => {
      customRender(<ForgotPasswordForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toBeRequired();
    });

    it("should have autocomplete attribute", () => {
      customRender(<ForgotPasswordForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toHaveAttribute("autocomplete", "email");
    });

    it("should associate error with input", () => {
      (useForgotPasswordForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: "Error" },
        touchedFields: new Set(["email"]),
      });

      customRender(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
    });
  });
});
