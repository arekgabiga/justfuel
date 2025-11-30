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

interface RegisterFormSuccess {
  message: string;
  requiresEmailConfirmation: boolean;
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
  const [success, setSuccess] = useState<RegisterFormSuccess | null>(null);

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
    (field: keyof RegisterFormState, values: RegisterFormState = formState): boolean => {
      let error: string | undefined;
      const value = values[field];

      if (field === "email") {
        error = validateEmail(value);
      } else if (field === "password") {
        error = validatePassword(value);
      } else if (field === "confirmPassword") {
        error = validateConfirmPassword(value, values.password);
      }

      setFormErrors((prev) => {
        if (error) {
          return { ...prev, [field]: error };
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [field]: _, ...rest } = prev;
          return rest;
        }
      });

      return !error;
    },
    [formState, validateEmail, validatePassword, validateConfirmPassword]
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

      // Only clear error if it exists, don't re-validate on every keystroke
      if (formErrors.email) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, password: value }));
      setTouchedFields((prev) => new Set(prev).add("password"));

      // Clear password error if exists
      if (formErrors.password) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.password;
          return newErrors;
        });
      }

      // Cross-field validation: if confirmPassword is touched and matches, clear its error
      if (touchedFields.has("confirmPassword") && formState.confirmPassword) {
        if (value === formState.confirmPassword) {
          // Passwords match - clear confirmPassword error
          setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.confirmPassword;
            return newErrors;
          });
        }
      }
    },
    [formState, formErrors, touchedFields]
  );

  const handleConfirmPasswordChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, confirmPassword: value }));
      setTouchedFields((prev) => new Set(prev).add("confirmPassword"));

      // Immediately check if passwords match and clear/set error accordingly
      if (value === formState.password) {
        // Passwords match - clear error
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      } else if (touchedFields.has("confirmPassword") || value.length > 0) {
        // Only show error if field was touched or user started typing
        setFormErrors((prev) => ({
          ...prev,
          confirmPassword: "Hasła nie są identyczne",
        }));
      }
    },
    [formState, touchedFields]
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
      setSuccess(null);

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formState.email.trim(),
            password: formState.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle API errors
          const errorMessage = data.error?.message || "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.";

          if (data.error?.code === "EMAIL_ALREADY_EXISTS") {
            setFormErrors({
              email: "Konto z tym adresem e-mail już istnieje",
              general: "Konto z tym adresem e-mail już istnieje",
            });
          } else {
            setFormErrors({
              general: errorMessage,
            });
          }
          setIsSubmitting(false);
          return;
        }

        // Success - show success message
        setSuccess({
          message: data.message || "Rejestracja zakończona powodzeniem",
          requiresEmailConfirmation: data.requiresEmailConfirmation ?? true,
        });
        setIsSubmitting(false);
      } catch (error) {
        // eslint-disable-next-line no-console
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
    success,
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
