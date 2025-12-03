import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { screen } from '@testing-library/react';
import { customRender, setupUser } from '@/test-utils';
import LoginForm from '../LoginForm';
import { useLoginForm } from '@/lib/hooks/useLoginForm';

// Mock the hook
vi.mock('@/lib/hooks/useLoginForm');

describe('LoginForm', () => {
  const mockHandleEmailChange = vi.fn();
  const mockHandlePasswordChange = vi.fn();
  const mockHandleFieldBlur = vi.fn();
  const mockHandleSubmit = vi.fn((e) => e.preventDefault());

  const defaultHookReturn = {
    formState: {
      email: '',
      password: '',
    },
    formErrors: {},
    isSubmitting: false,
    touchedFields: new Set<string>(),
    handleEmailChange: mockHandleEmailChange,
    handlePasswordChange: mockHandlePasswordChange,
    handleFieldBlur: mockHandleFieldBlur,
    handleSubmit: mockHandleSubmit,
    validateEmail: vi.fn(),
    validatePassword: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLoginForm as Mock).mockReturnValue(defaultHookReturn);
  });

  describe('Rendering', () => {
    it('should render login form with all fields', () => {
      customRender(<LoginForm />);

      expect(screen.getByRole('heading', { name: /logowanie/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeInTheDocument();
    });

    it('should render form description', () => {
      customRender(<LoginForm />);

      expect(screen.getByText(/zaloguj się, aby zarządzać swoimi samochodami/i)).toBeInTheDocument();
    });

    it('should render registration and forgot password links', () => {
      customRender(<LoginForm />);

      expect(screen.getByRole('link', { name: /zarejestruj się/i })).toHaveAttribute('href', '/auth/register');
      expect(screen.getByRole('link', { name: /zapomniałeś hasła/i })).toHaveAttribute('href', '/auth/forgot-password');
    });
  });

  describe('Email Validation', () => {
    it('should display email error after blur when field is touched', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: 'Nieprawidłowy adres e-mail' },
        touchedFields: new Set(['email']),
      });

      customRender(<LoginForm />);

      expect(screen.getByText('Nieprawidłowy adres e-mail')).toBeInTheDocument();
      expect(screen.getByLabelText(/adres e-mail/i)).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not display email error when field is not touched', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: 'Nieprawidłowy adres e-mail' },
        touchedFields: new Set(),
      });

      customRender(<LoginForm />);

      expect(screen.queryByText('Nieprawidłowy adres e-mail')).not.toBeInTheDocument();
    });

    it('should associate error message with input via aria-describedby', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: 'Nieprawidłowy adres e-mail' },
        touchedFields: new Set(['email']),
      });

      customRender(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const errorId = emailInput.getAttribute('aria-describedby');
      expect(errorId).toBe('email-error');
    });
  });

  describe('Password Validation', () => {
    it('should display password error after blur when field is touched', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { password: 'Hasło jest wymagane' },
        touchedFields: new Set(['password']),
      });

      customRender(<LoginForm />);

      expect(screen.getByText('Hasło jest wymagane')).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło/i)).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not display password error when field is not touched', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { password: 'Hasło jest wymagane' },
        touchedFields: new Set(),
      });

      customRender(<LoginForm />);

      expect(screen.queryByText('Hasło jest wymagane')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call handleEmailChange when user types in email field', async () => {
      const user = setupUser();
      customRender(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      await user.type(emailInput, 'test@example.com');

      expect(mockHandleEmailChange).toHaveBeenCalled();
    });

    it('should call handlePasswordChange when user types in password field', async () => {
      const user = setupUser();
      customRender(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(passwordInput, 'password123');

      expect(mockHandlePasswordChange).toHaveBeenCalled();
    });

    it('should call handleFieldBlur when email field loses focus', async () => {
      const user = setupUser();
      customRender(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      await user.click(emailInput);
      await user.tab();

      expect(mockHandleFieldBlur).toHaveBeenCalledWith('email');
    });

    it('should call handleFieldBlur when password field loses focus', async () => {
      const user = setupUser();
      customRender(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.click(passwordInput);
      await user.tab();

      expect(mockHandleFieldBlur).toHaveBeenCalledWith('password');
    });
  });

  describe('Form Submission', () => {
    it('should call handleSubmit when form is submitted', async () => {
      const user = setupUser();
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      customRender(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
      await user.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe('General Error Display', () => {
    it('should display AuthError component when general error exists', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { general: 'Nieprawidłowy adres e-mail lub hasło' },
      });

      customRender(<LoginForm />);

      expect(screen.getByText('Nieprawidłowy adres e-mail lub hasło')).toBeInTheDocument();
    });

    it('should display network error message', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { general: 'Wystąpił błąd podczas logowania. Spróbuj ponownie.' },
      });

      customRender(<LoginForm />);

      expect(screen.getByText('Wystąpił błąd podczas logowania. Spróbuj ponownie.')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable submit button when isSubmitting is true', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /logowanie/i });
      expect(submitButton).toBeDisabled();
    });

    it('should change button text to "Logowanie..." when submitting', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        isSubmitting: true,
      });

      customRender(<LoginForm />);

      expect(screen.getByRole('button', { name: /logowanie\.\.\./i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^zaloguj się$/i })).not.toBeInTheDocument();
    });

    it('should not disable submit button when not submitting', () => {
      customRender(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      customRender(<LoginForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    });

    it('should mark inputs as required', () => {
      customRender(<LoginForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toBeRequired();
      expect(screen.getByLabelText(/hasło/i)).toBeRequired();
    });

    it('should have proper autocomplete attributes', () => {
      customRender(<LoginForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/hasło/i)).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should have type="email" for email input', () => {
      customRender(<LoginForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toHaveAttribute('type', 'email');
    });

    it('should have type="password" for password input', () => {
      customRender(<LoginForm />);

      expect(screen.getByLabelText(/hasło/i)).toHaveAttribute('type', 'password');
    });

    it('should have noValidate attribute on form', () => {
      customRender(<LoginForm />);

      const form = screen.getByRole('button', { name: /zaloguj się/i }).closest('form');
      expect(form).toHaveAttribute('noValidate');
    });

    it('should have role="alert" on error messages', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formErrors: { email: 'Nieprawidłowy adres e-mail' },
        touchedFields: new Set(['email']),
      });

      customRender(<LoginForm />);

      const errorElement = screen.getByText('Nieprawidłowy adres e-mail');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });
  });

  describe('Redirect URL', () => {
    it('should pass redirectUrl to hook when provided', () => {
      customRender(<LoginForm redirectUrl="/dashboard" />);

      expect(useLoginForm).toHaveBeenCalledWith({ redirectUrl: '/dashboard' });
    });

    it('should use default redirectUrl when not provided', () => {
      customRender(<LoginForm />);

      expect(useLoginForm).toHaveBeenCalledWith({ redirectUrl: '/' });
    });
  });

  describe('Form State Display', () => {
    it('should display current email value', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          email: 'test@example.com',
          password: '',
        },
      });

      customRender(<LoginForm />);

      expect(screen.getByLabelText(/adres e-mail/i)).toHaveValue('test@example.com');
    });

    it('should display current password value', () => {
      (useLoginForm as Mock).mockReturnValue({
        ...defaultHookReturn,
        formState: {
          email: '',
          password: 'mypassword',
        },
      });

      customRender(<LoginForm />);

      expect(screen.getByLabelText(/hasło/i)).toHaveValue('mypassword');
    });
  });
});
