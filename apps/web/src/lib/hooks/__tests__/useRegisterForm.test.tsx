import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRegisterForm } from '../useRegisterForm';

describe('useRegisterForm', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with empty form state', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.formState).toEqual({
        email: '',
        password: '',
        confirmPassword: '',
      });
    });

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.formErrors).toEqual({});
    });

    it('should initialize isSubmitting as false', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialize success as null', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.success).toBeNull();
    });
  });

  describe('Email Validation', () => {
    it('should return error for empty email', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validateEmail('')).toBe('Nieprawidłowy adres e-mail');
    });

    it('should return error for invalid email format', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validateEmail('invalid')).toBe('Nieprawidłowy adres e-mail');
    });

    it('should return undefined for valid email', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validateEmail('test@example.com')).toBeUndefined();
    });
  });

  describe('Password Validation', () => {
    it('should return error for empty password', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validatePassword('')).toBe('Hasło jest wymagane');
    });

    it('should return error for short password', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validatePassword('12345')).toBe('Hasło musi mieć minimum 6 znaków');
    });

    it('should return undefined for valid password', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validatePassword('123456')).toBeUndefined();
    });
  });

  describe('Confirm Password Validation', () => {
    it('should return error for empty confirm password', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validateConfirmPassword('', 'password')).toBe('Potwierdzenie hasła jest wymagane');
    });

    it('should return error if passwords do not match', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validateConfirmPassword('password123', 'password456')).toBe('Hasła nie są identyczne');
    });

    it('should return undefined if passwords match', () => {
      const { result } = renderHook(() => useRegisterForm());
      expect(result.current.validateConfirmPassword('password123', 'password123')).toBeUndefined();
    });
  });

  describe('Field Changes & Cross-Validation', () => {
    it('should update password and trigger confirm password validation if touched', () => {
      const { result } = renderHook(() => useRegisterForm());

      // First set confirm password and touch it
      act(() => {
        result.current.handleConfirmPasswordChange('password123');
        vi.runAllTimers();
      });

      // Then change password to something else
      act(() => {
        result.current.handlePasswordChange('password456');
        vi.runAllTimers();
      });

      expect(result.current.formErrors.confirmPassword).toBe('Hasła nie są identyczne');
    });

    it('should update confirm password and validate against password', () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange('password123');
      });

      act(() => {
        result.current.handleConfirmPasswordChange('password456');
        vi.runAllTimers();
      });

      expect(result.current.formErrors.confirmPassword).toBe('Hasła nie są identyczne');
    });

    it('should clear confirm password error immediately when passwords match (BUG-19)', () => {
      const { result } = renderHook(() => useRegisterForm());

      // Set password
      act(() => {
        result.current.handlePasswordChange('password123');
      });

      // Set different confirm password to trigger error
      act(() => {
        result.current.handleConfirmPasswordChange('password456');
      });

      // Verify error exists
      expect(result.current.formErrors.confirmPassword).toBe('Hasła nie są identyczne');

      // Now fix confirm password to match - error should clear IMMEDIATELY
      act(() => {
        result.current.handleConfirmPasswordChange('password123');
      });

      // Error should be cleared WITHOUT needing blur or timers
      expect(result.current.formErrors.confirmPassword).toBeUndefined();
    });

    it('should clear confirm password error when changing password to match (BUG-19)', () => {
      const { result } = renderHook(() => useRegisterForm());

      // Set password
      act(() => {
        result.current.handlePasswordChange('password123');
      });

      // Set different confirm password to trigger error
      act(() => {
        result.current.handleConfirmPasswordChange('password456');
      });

      // Verify error exists
      expect(result.current.formErrors.confirmPassword).toBe('Hasła nie są identyczne');

      // Now change password to match confirm password
      act(() => {
        result.current.handlePasswordChange('password456');
      });

      // Error should be cleared IMMEDIATELY
      expect(result.current.formErrors.confirmPassword).toBeUndefined();
    });
  });

  describe('Submit Handling', () => {
    it('should not submit if validation fails', async () => {
      const { result } = renderHook(() => useRegisterForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.formErrors.email).toBeDefined();
    });

    it('should submit successfully', async () => {
      const { result } = renderHook(() => useRegisterForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Success', requiresEmailConfirmation: true }),
      });

      act(() => {
        result.current.handleEmailChange('test@example.com');
        result.current.handlePasswordChange('password123');
        result.current.handleConfirmPasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(result.current.success).toEqual({
        message: 'Success',
        requiresEmailConfirmation: true,
      });
    });

    it('should handle EMAIL_ALREADY_EXISTS error', async () => {
      const { result } = renderHook(() => useRegisterForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409, // Added status code
        json: async () => ({ error: { code: 'EMAIL_ALREADY_EXISTS' } }),
      });

      act(() => {
        result.current.handleEmailChange('existing@example.com');
        result.current.handlePasswordChange('password123');
        result.current.handleConfirmPasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.email).toBe('Konto z tym adresem e-mail już istnieje');
      expect(result.current.formErrors.general).toBe('Konto z tym adresem e-mail już istnieje');
    });
  });
});
