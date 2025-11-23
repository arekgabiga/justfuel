import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User, Session } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "../../../db/supabase.client";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  resetPasswordForEmail,
  updatePasswordWithToken,
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  InvalidTokenError,
  SupabaseAuthError,
} from "../auth.service";

describe("auth.service", () => {
  // Mock Supabase client
  let mockSupabase: AppSupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
      },
    } as unknown as AppSupabaseClient;
  });

  describe("Custom Error Classes", () => {
    describe("InvalidCredentialsError", () => {
      it("should create error with default message", () => {
        // Arrange & Act
        const error = new InvalidCredentialsError();

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("InvalidCredentialsError");
        expect(error.message).toBe("Nieprawidłowy adres e-mail lub hasło");
      });

      it("should create error with custom message", () => {
        // Arrange
        const customMessage = "Custom error message";

        // Act
        const error = new InvalidCredentialsError(customMessage);

        // Assert
        expect(error.name).toBe("InvalidCredentialsError");
        expect(error.message).toBe(customMessage);
      });
    });

    describe("EmailAlreadyExistsError", () => {
      it("should create error with default message", () => {
        // Arrange & Act
        const error = new EmailAlreadyExistsError();

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("EmailAlreadyExistsError");
        expect(error.message).toBe("Konto z tym adresem e-mail już istnieje");
      });

      it("should create error with custom message", () => {
        // Arrange
        const customMessage = "Custom already exists message";

        // Act
        const error = new EmailAlreadyExistsError(customMessage);

        // Assert
        expect(error.name).toBe("EmailAlreadyExistsError");
        expect(error.message).toBe(customMessage);
      });
    });

    describe("InvalidTokenError", () => {
      it("should create error with default message", () => {
        // Arrange & Act
        const error = new InvalidTokenError();

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("InvalidTokenError");
        expect(error.message).toBe("Token resetowania jest nieprawidłowy lub wygasł");
      });

      it("should create error with custom message", () => {
        // Arrange
        const customMessage = "Custom token error";

        // Act
        const error = new InvalidTokenError(customMessage);

        // Assert
        expect(error.name).toBe("InvalidTokenError");
        expect(error.message).toBe(customMessage);
      });
    });

    describe("SupabaseAuthError", () => {
      it("should create error with required message", () => {
        // Arrange
        const message = "Required auth error message";

        // Act
        const error = new SupabaseAuthError(message);

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("SupabaseAuthError");
        expect(error.message).toBe(message);
      });
    });
  });

  describe("loginUser", () => {
    const mockUser = { id: "user-123", email: "test@example.com" } as User;
    const mockSession = { access_token: "token-123" } as Session;

    it("should login user with valid credentials", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      const result = await loginUser(mockSupabase, email, password);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toEqual({ user: mockUser, session: mockSession });
    });

    it("should trim email before login", async () => {
      // Arrange
      const email = "  test@example.com  ";
      const password = "password123";
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      await loginUser(mockSupabase, email, password);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should throw InvalidCredentialsError on invalid credentials", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 } as any,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, "test@example.com", "wrong-password")).rejects.toThrow(
        InvalidCredentialsError
      );
    });

    it("should throw InvalidCredentialsError on unconfirmed email", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email not confirmed", status: 400 } as any,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(InvalidCredentialsError);
    });

    it("should throw SupabaseAuthError when user is null", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: mockSession },
        error: null,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(SupabaseAuthError);
      await expect(loginUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(
        "Nie udało się zalogować. Spróbuj ponownie."
      );
    });

    it("should throw SupabaseAuthError when session is null", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(SupabaseAuthError);
    });

    it("should throw InvalidCredentialsError on status 400", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Some error", status: 400 } as any,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(InvalidCredentialsError);
    });

    it("should throw SupabaseAuthError on generic error", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Unknown error occurred" } as any,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(SupabaseAuthError);
    });
  });

  describe("registerUser", () => {
    const mockUser = { id: "user-123", email: "test@example.com" } as User;
    const mockSession = { access_token: "token-123" } as Session;

    it("should register user with auto-confirmation", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      const result = await registerUser(mockSupabase, email, password);

      // Assert
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toEqual({ user: mockUser, session: mockSession });
    });

    it("should register user with emailRedirectTo parameter", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      const redirectUrl = "https://example.com/confirm";
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      await registerUser(mockSupabase, email, password, redirectUrl);

      // Assert
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: { emailRedirectTo: redirectUrl },
      });
    });

    it("should register user without emailRedirectTo parameter", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      await registerUser(mockSupabase, email, password);

      // Assert
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should handle email confirmation required (session null)", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      // Act
      const result = await registerUser(mockSupabase, email, password);

      // Assert
      expect(result).toEqual({ user: mockUser, session: null });
    });

    it("should throw EmailAlreadyExistsError when email already exists", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" } as any,
      });

      // Act & Assert
      await expect(registerUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(
        EmailAlreadyExistsError
      );
    });

    it("should trim email before registration", async () => {
      // Arrange
      const email = "  test@example.com  ";
      const password = "password123";
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      await registerUser(mockSupabase, email, password);

      // Assert
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should throw SupabaseAuthError when user is null", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      // Act & Assert
      await expect(registerUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(SupabaseAuthError);
      await expect(registerUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(
        "Nie udało się zarejestrować. Spróbuj ponownie."
      );
    });

    it("should throw EmailAlreadyExistsError on 'email already exists' message", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email already exists" } as any,
      });

      // Act & Assert
      await expect(registerUser(mockSupabase, "test@example.com", "password123")).rejects.toThrow(
        EmailAlreadyExistsError
      );
    });
  });

  describe("logoutUser", () => {
    it("should logout user successfully", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      // Act
      await logoutUser(mockSupabase);

      // Assert
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should throw error on Supabase error", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: { message: "Logout failed" } as any,
      });

      // Act & Assert
      await expect(logoutUser(mockSupabase)).rejects.toThrow(SupabaseAuthError);
    });
  });

  describe("getCurrentUser", () => {
    const mockUser = { id: "user-123", email: "test@example.com" } as User;

    it("should return user when logged in", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await getCurrentUser(mockSupabase);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it("should return null when not logged in", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const result = await getCurrentUser(mockSupabase);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null on Supabase error (no throw)", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" } as any,
      });

      // Act
      const result = await getCurrentUser(mockSupabase);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("resetPasswordForEmail", () => {
    it("should send reset email with redirectTo", async () => {
      // Arrange
      const email = "test@example.com";
      const redirectTo = "https://example.com/reset";
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      await resetPasswordForEmail(mockSupabase, email, redirectTo);

      // Assert
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", { redirectTo });
    });

    it("should send reset email without redirectTo", async () => {
      // Arrange
      const email = "test@example.com";
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      await resetPasswordForEmail(mockSupabase, email);

      // Assert
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", undefined);
    });

    it("should trim email before sending reset", async () => {
      // Arrange
      const email = "  test@example.com  ";
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      await resetPasswordForEmail(mockSupabase, email);

      // Assert
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", undefined);
    });

    it("should throw error on Supabase error", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: { message: "Invalid email" } as any,
      });

      // Act & Assert
      await expect(resetPasswordForEmail(mockSupabase, "test@example.com")).rejects.toThrow(SupabaseAuthError);
    });
  });

  describe("updatePasswordWithToken", () => {
    it("should update password with valid token", async () => {
      // Arrange
      const newPassword = "newPassword123";
      vi.mocked(mockSupabase.auth.updateUser).mockResolvedValue({
        data: { user: {} as User },
        error: null,
      });

      // Act
      await updatePasswordWithToken(mockSupabase, newPassword);

      // Assert
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it("should throw InvalidTokenError on invalid token", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" } as any,
      });

      // Act & Assert
      await expect(updatePasswordWithToken(mockSupabase, "newPassword123")).rejects.toThrow(InvalidTokenError);
    });

    it("should throw error on Supabase error", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Update failed" } as any,
      });

      // Act & Assert
      await expect(updatePasswordWithToken(mockSupabase, "newPassword123")).rejects.toThrow(SupabaseAuthError);
    });
  });
});
