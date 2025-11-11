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
    (field: keyof ForgotPasswordFormState): boolean => {
      let error: string | undefined;
      const value = formState[field];

      if (field === 'email') {
        error = validateEmail(value);
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
    [formState, formErrors, validateEmail]
  );

  const validateAllFields = useCallback((): boolean => {
    return validateField('email');
  }, [validateField]);

  const handleEmailChange = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, email: value }));
    setTouchedFields((prev) => new Set(prev).add('email'));

    if (formErrors.email) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }

    if (touchedFields.has('email')) {
      setTimeout(() => {
        validateField('email');
      }, 0);
    }
  }, [formErrors, touchedFields, validateField]);

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
        // TODO: Replace with actual API call when backend is implemented
        // const response = await fetch('/api/auth/forgot-password', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     email: formState.email.trim(),
        //   }),
        // });

        // Placeholder for now - will be implemented with backend
        console.log('Forgot password attempt:', { email: formState.email.trim() });
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // For now, just show an error that backend is not implemented
        setFormErrors({
          general: 'Backend nie jest jeszcze zaimplementowany. Ta funkcjonalność będzie dostępna po implementacji API.',
        });
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

