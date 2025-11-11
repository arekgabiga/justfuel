import { useState, useCallback } from 'react';

interface LoginFormState {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const useLoginForm = () => {
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof LoginFormState>>(new Set());

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email.trim()) {
      return 'Nieprawidłowy adres e-mail';
    }
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Nieprawidłowy adres e-mail';
    }
    return undefined;
  }, []);

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Hasło jest wymagane';
    }
    return undefined;
  }, []);

  const validateField = useCallback(
    (field: keyof LoginFormState): boolean => {
      let error: string | undefined;
      const value = formState[field];

      if (field === 'email') {
        error = validateEmail(value);
      } else if (field === 'password') {
        error = validatePassword(value);
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
    [formState, formErrors, validateEmail, validatePassword]
  );

  const validateAllFields = useCallback((): boolean => {
    const emailValid = validateField('email');
    const passwordValid = validateField('password');
    return emailValid && passwordValid;
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

    if (touchedFields.has('password')) {
      setTimeout(() => {
        validateField('password');
      }, 0);
    }
  }, [formErrors, touchedFields, validateField]);

  const handleFieldBlur = useCallback(
    (field: keyof LoginFormState) => {
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

      try {
        // TODO: Replace with actual API call when backend is implemented
        // const response = await fetch('/api/auth/login', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     email: formState.email.trim(),
        //     password: formState.password,
        //   }),
        // });

        // Placeholder for now - will be implemented with backend
        console.log('Login attempt:', { email: formState.email.trim() });
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // For now, just show an error that backend is not implemented
        setFormErrors({
          general: 'Backend nie jest jeszcze zaimplementowany. Ta funkcjonalność będzie dostępna po implementacji API.',
        });
        setIsSubmitting(false);
      } catch (error) {
        console.error('Error during login:', error);
        setFormErrors({
          general: 'Wystąpił błąd podczas logowania. Spróbuj ponownie.',
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
    touchedFields,
    handleEmailChange,
    handlePasswordChange,
    handleFieldBlur,
    handleSubmit,
    validateEmail,
    validatePassword,
  };
};

