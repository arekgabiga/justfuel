import { useState, useCallback } from "react";

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const useRegisterForm = () => {
  const [formState, setFormState] = useState<RegisterFormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof RegisterFormState>>(new Set());

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email.trim()) {
      return "Nieprawidłowy adres e-mail";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Nieprawidłowy adres e-mail";
    }
    return undefined;
  }, []);

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return "Hasło jest wymagane";
    }
    if (password.length < 6) {
      return "Hasło musi mieć minimum 6 znaków";
    }
    return undefined;
  }, []);

  const validateConfirmPassword = useCallback((confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return "Potwierdzenie hasła jest wymagane";
    }
    if (confirmPassword !== password) {
      return "Hasła nie są identyczne";
    }
    return undefined;
  }, []);

  const validateField = useCallback(
    (field: keyof RegisterFormState): boolean => {
      let error: string | undefined;
      const value = formState[field];

      if (field === "email") {
        error = validateEmail(value);
      } else if (field === "password") {
        error = validatePassword(value);
      } else if (field === "confirmPassword") {
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
    [formState, formErrors, validateEmail, validatePassword, validateConfirmPassword]
  );

  const validateAllFields = useCallback((): boolean => {
    const emailValid = validateField("email");
    const passwordValid = validateField("password");
    const confirmPasswordValid = validateField("confirmPassword");
    return emailValid && passwordValid && confirmPasswordValid;
  }, [validateField]);

  const handleEmailChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, email: value }));
      setTouchedFields((prev) => new Set(prev).add("email"));

      if (formErrors.email) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }

      if (touchedFields.has("email")) {
        setTimeout(() => {
          validateField("email");
        }, 0);
      }
    },
    [formErrors, touchedFields, validateField]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, password: value }));
      setTouchedFields((prev) => new Set(prev).add("password"));

      if (formErrors.password) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.password;
          return newErrors;
        });
      }

      // Also validate confirmPassword if it's been touched
      if (touchedFields.has("confirmPassword")) {
        setTimeout(() => {
          validateField("confirmPassword");
        }, 0);
      }

      if (touchedFields.has("password")) {
        setTimeout(() => {
          validateField("password");
        }, 0);
      }
    },
    [formErrors, touchedFields, validateField]
  );

  const handleConfirmPasswordChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, confirmPassword: value }));
      setTouchedFields((prev) => new Set(prev).add("confirmPassword"));

      if (formErrors.confirmPassword) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }

      if (touchedFields.has("confirmPassword")) {
        setTimeout(() => {
          validateField("confirmPassword");
        }, 0);
      }
    },
    [formErrors, touchedFields, validateField]
  );

  const handleFieldBlur = useCallback(
    (field: keyof RegisterFormState) => {
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
        // const response = await fetch('/api/auth/register', {
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
        console.log("Register attempt:", { email: formState.email.trim() });

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // For now, just show an error that backend is not implemented
        setFormErrors({
          general: "Backend nie jest jeszcze zaimplementowany. Ta funkcjonalność będzie dostępna po implementacji API.",
        });
        setIsSubmitting(false);
      } catch (error) {
        console.error("Error during registration:", error);
        setFormErrors({
          general: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
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
    handleConfirmPasswordChange,
    handleFieldBlur,
    handleSubmit,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
  };
};
