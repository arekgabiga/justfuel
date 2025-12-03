import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLoginForm } from '../useLoginForm';

describe('useLoginForm', () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    global.fetch = mockFetch;
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with empty form state', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.formState).toEqual({ email: '', password: '' });
    });

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.formErrors).toEqual({});
    });

    it('should initialize isSubmitting as false', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialize touchedFields as empty Set', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.touchedFields.size).toBe(0);
    });
  });

  describe('Email Validation', () => {
    it('should return error for empty email', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.validateEmail('')).toBe('Nieprawidłowy adres e-mail');
      expect(result.current.validateEmail('   ')).toBe('Nieprawidłowy adres e-mail');
    });

    it('should return error for invalid email format', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.validateEmail('invalid')).toBe('Nieprawidłowy adres e-mail');
      expect(result.current.validateEmail('invalid@')).toBe('Nieprawidłowy adres e-mail');
      expect(result.current.validateEmail('invalid@domain')).toBe('Nieprawidłowy adres e-mail');
      expect(result.current.validateEmail('@domain.com')).toBe('Nieprawidłowy adres e-mail');
    });

    it('should return undefined for valid email', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.validateEmail('test@example.com')).toBeUndefined();
      expect(result.current.validateEmail('  test@example.com  ')).toBeUndefined();
    });
  });

  describe('Password Validation', () => {
    it('should return error for empty password', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.validatePassword('')).toBe('Hasło jest wymagane');
    });

    it('should return undefined for non-empty password', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.validatePassword('password123')).toBeUndefined();
    });
  });

  describe('Field Changes', () => {
    it('should update email and set touched', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('test@example.com');
      });

      expect(result.current.formState.email).toBe('test@example.com');
      expect(result.current.touchedFields.has('email')).toBe(true);
    });

    it('should update password and set touched', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handlePasswordChange('password123');
      });

      expect(result.current.formState.password).toBe('password123');
      expect(result.current.touchedFields.has('password')).toBe(true);
    });

    it('should clear error on change if it exists', () => {
      const { result } = renderHook(() => useLoginForm());

      // First create an error
      act(() => {
        result.current.handleFieldBlur('email');
      });

      expect(result.current.formErrors.email).toBeDefined();

      // Then change value
      act(() => {
        result.current.handleEmailChange('test@example.com');
      });

      expect(result.current.formErrors.email).toBeUndefined();
    });

    it('should validate on change if field was already touched', async () => {
      const { result } = renderHook(() => useLoginForm());

      // Touch the field first
      act(() => {
        result.current.handleFieldBlur('email');
      });

      // Change to invalid value
      act(() => {
        result.current.handleEmailChange('invalid');
        vi.runAllTimers();
      });

      expect(result.current.formErrors.email).toBeUndefined();
    });
  });

  describe('Blur Handling', () => {
    it('should mark field as touched and validate on blur', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleFieldBlur('email');
      });

      expect(result.current.touchedFields.has('email')).toBe(true);
      expect(result.current.formErrors.email).toBe('Nieprawidłowy adres e-mail');
    });
  });

  describe('Submit Handling', () => {
    it('should not submit if validation fails', async () => {
      const { result } = renderHook(() => useLoginForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.formErrors.email).toBeDefined();
      expect(result.current.formErrors.password).toBeDefined();
    });

    it('should submit successfully with valid data', async () => {
      const { result } = renderHook(() => useLoginForm({ redirectUrl: '/dashboard' }));
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200, // Added status code
        json: async () => ({ success: true }),
      });

      act(() => {
        result.current.handleEmailChange('test@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(window.location.href).toBe('/dashboard');
    });

    it('should handle API errors', async () => {
      const { result } = renderHook(() => useLoginForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401, // Added status code
        json: async () => ({ error: { code: 'INVALID_CREDENTIALS' } }),
      });

      act(() => {
        result.current.handleEmailChange('test@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.general).toBe('Nieprawidłowy adres e-mail lub hasło');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle network errors', async () => {
      const { result } = renderHook(() => useLoginForm());
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      act(() => {
        result.current.handleEmailChange('test@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.general).toBe('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
