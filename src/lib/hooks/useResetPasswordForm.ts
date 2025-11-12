import { useState, useCallback, useEffect } from 'react';

interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const useResetPasswordForm = (token: string | null) => {
  const [formState, setFormState] = useState<ResetPasswordFormState>({
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<ResetPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<keyof ResetPasswordFormState>>(new Set());

  useEffect(() => {
    // Token validation is now handled server-side via session check
    // The token from URL is used by Supabase client to establish session
    // We'll check session validity when form is submitted
    setTokenError(null);
  }, [token]);

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Hasło jest wymagane';
    }
    if (password.length < 6) {
      return 'Hasło musi mieć minimum 6 znaków';
    }
    return undefined;
  }, []);

  const validateConfirmPassword = useCallback(
    (confirmPassword: string, password: string): string | undefined => {
      if (!confirmPassword) {
        return 'Potwierdzenie hasła jest wymagane';
      }
      if (confirmPassword !== password) {
        return 'Hasła nie są identyczne';
      }
      return undefined;
    },
    []
  );

  const validateField = useCallback(
    (field: keyof ResetPasswordFormState): boolean => {
      let error: string | undefined;
      const value = formState[field];

      if (field === 'password') {
        error = validatePassword(value);
      } else if (field === 'confirmPassword') {
        error = validateConfirmPassword(value, formState.password);
      }

      const newErrors = { ...formErrors };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      setFormErrors(newErrors);

      return !error;
    },
    [formState, formErrors, validatePassword, validateConfirmPassword]
  );

  const validateAllFields = useCallback((): boolean => {
    const passwordValid = validateField('password');
    const confirmPasswordValid = validateField('confirmPassword');
    return passwordValid && confirmPasswordValid;
  }, [validateField]);

  const handlePasswordChange = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, password: value }));
    setTouchedFields((prev) => new Set(prev).add('password'));

    if (formErrors.password) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }

    // Also validate confirmPassword if it's been touched
    if (touchedFields.has('confirmPassword')) {
      setTimeout(() => {
        validateField('confirmPassword');
      }, 0);
    }

    if (touchedFields.has('password')) {
      setTimeout(() => {
        validateField('password');
      }, 0);
    }
  }, [formErrors, touchedFields, validateField]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, confirmPassword: value }));
    setTouchedFields((prev) => new Set(prev).add('confirmPassword'));

    if (formErrors.confirmPassword) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }

    if (touchedFields.has('confirmPassword')) {
      setTimeout(() => {
        validateField('confirmPassword');
      }, 0);
    }
  }, [formErrors, touchedFields, validateField]);

  const handleFieldBlur = useCallback(
    (field: keyof ResetPasswordFormState) => {
      setTouchedFields((prev) => new Set(prev).add(field));
      validateField(field);
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateAllFields()) {
        return;
      }

      setIsSubmitting(true);
      setFormErrors({});
      setTokenError(null);

      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: formState.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Check if it's a token error
          if (data.error?.code === 'INVALID_TOKEN') {
            setTokenError(data.error.message || 'Token resetowania jest nieprawidłowy lub wygasł');
          } else {
            setFormErrors({
              general: data.error?.message || 'Wystąpił błąd podczas resetowania hasła.',
            });
          }
          setIsSubmitting(false);
          return;
        }

        // Success - redirect to login page
        window.location.href = '/auth/login?reset=success';
      } catch (error) {
        console.error('Error during reset password:', error);
        setFormErrors({
          general: 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.',
        });
        setIsSubmitting(false);
      }
    },
    [formState, validateAllFields]
  );

  return {
    formState,
    formErrors,
    isSubmitting,
    tokenError,
    touchedFields,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFieldBlur,
    handleSubmit,
    validatePassword,
    validateConfirmPassword,
  };
};

