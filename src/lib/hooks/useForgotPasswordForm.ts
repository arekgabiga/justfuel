import { useState, useCallback } from 'react';

interface ForgotPasswordFormState {
  email: string;
}

interface ForgotPasswordFormErrors {
  email?: string;
  general?: string;
}

export const useForgotPasswordForm = () => {
  const [formState, setFormState] = useState<ForgotPasswordFormState>({
    email: '',
  });

  const [formErrors, setFormErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof ForgotPasswordFormState>>(new Set());

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email.trim()) {
      return 'Nieprawidłowy adres e-mail';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Nieprawidłowy adres e-mail';
    }
    return undefined;
  }, []);

  const validateField = useCallback(
    (field: keyof ForgotPasswordFormState, values: ForgotPasswordFormState = formState): boolean => {
      let error: string | undefined;
      const value = values[field];

      if (field === 'email') {
        error = validateEmail(value);
      }

      setFormErrors((prev) => {
        if (error) {
          return { ...prev, [field]: error };
        }
        const { [field]: _, ...rest } = prev;
        return rest;
      });

      return !error;
    },
    [formState, validateEmail]
  );

  const validateAllFields = useCallback((): boolean => {
    return validateField('email');
  }, [validateField]);

  const handleEmailChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, email: value }));
      const predictedState = { ...formState, email: value };
      setTouchedFields((prev) => new Set(prev).add('email'));

      if (formErrors.email) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }

      setTimeout(() => {
        validateField('email', predictedState);
      }, 0);
    },
    [formState, formErrors, validateField]
  );

  const handleFieldBlur = useCallback(
    (field: keyof ForgotPasswordFormState) => {
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
      setIsSuccess(false);

      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formState.email.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setFormErrors({
            general: data.error?.message || 'Wystąpił błąd podczas wysyłania linku resetującego.',
          });
          setIsSubmitting(false);
          return;
        }

        // Success - show success message
        setIsSuccess(true);
        setIsSubmitting(false);
      } catch (error) {
        console.error('Error during forgot password:', error);
        setFormErrors({
          general: 'Wystąpił błąd. Spróbuj ponownie.',
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
    isSuccess,
    touchedFields,
    handleEmailChange,
    handleFieldBlur,
    handleSubmit,
    validateEmail,
  };
};
