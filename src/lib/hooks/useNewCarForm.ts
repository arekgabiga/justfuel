import { useState, useCallback, useRef } from "react";
import type { CreateCarCommand, CarDetailsDTO, ErrorResponseDTO } from "../../types";

const REQUEST_TIMEOUT = 10000; // 10 seconds

interface NewCarFormState {
  name: string;
  initialOdometer: string; // string because it can be empty
  mileageInputPreference: "odometer" | "distance";
}

interface NewCarFormErrors {
  name?: string;
  initialOdometer?: string;
  mileageInputPreference?: string;
  submit?: string;
}

interface AbortableFetch {
  abort: () => void;
  ready: Promise<Response>;
}

export const useNewCarForm = () => {
  const [formState, setFormState] = useState<NewCarFormState>({
    name: "",
    initialOdometer: "",
    mileageInputPreference: "odometer",
  });

  const [formErrors, setFormErrors] = useState<NewCarFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof NewCarFormState>>(new Set());
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Enhanced validation functions with detailed error messages
  const validateName = useCallback((name: string): string | undefined => {
    const trimmed = name.trim();
    if (!trimmed) {
      return "Nazwa jest wymagana";
    }
    if (trimmed.length < 1) {
      return "Nazwa nie może być pusta";
    }
    if (trimmed.length > 100) {
      return "Nazwa może mieć maksymalnie 100 znaków";
    }
    return undefined;
  }, []);

  const validateInitialOdometer = useCallback((odometer: string): string | undefined => {
    if (!odometer.trim()) {
      return undefined; // Optional field
    }

    // Check if it's a valid integer format
    if (!/^-?\d+$/.test(odometer.trim())) {
      return "Stan licznika musi być liczbą całkowitą";
    }

    const num = parseInt(odometer, 10);
    if (isNaN(num)) {
      return "Stan licznika musi być liczbą";
    }
    if (num < 0) {
      return "Stan licznika nie może być ujemny";
    }
    // Check for unreasonably large numbers
    if (num > 9999999) {
      return "Stan licznika jest zbyt duży (maksymalnie 9999999)";
    }
    return undefined;
  }, []);

  const validateMileagePreference = useCallback((preference: string): string | undefined => {
    if (preference !== "odometer" && preference !== "distance") {
      return "Wybierz preferencję wprowadzania przebiegu";
    }
    return undefined;
  }, []);

  // Helper function to create abortable fetch with timeout
  const abortableFetch = useCallback((url: string, options: RequestInit): AbortableFetch => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const promise = fetch(url, {
      ...options,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    return {
      abort: () => {
        clearTimeout(timeoutId);
        controller.abort();
      },
      ready: promise,
    };
  }, []);

  // Helper function to get user-friendly error message
  const getErrorMessage = useCallback((status: number, errorData?: ErrorResponseDTO): string => {
    if (!errorData) {
      return "Wystąpił nieoczekiwany błąd";
    }

    const code = errorData.error.code;
    const message = errorData.error.message;

    switch (status) {
      case 400:
        return message || "Nieprawidłowe dane formularza";
      case 401:
        return "Wymagana autoryzacja";
      case 403:
        return "Brak uprawnień";
      case 404:
        return "Endpoint nie został znaleziony";
      case 409:
        return message || "Konflikt danych";
      case 422:
        return message || "Nieprawidłowe dane";
      case 429:
        return "Zbyt wiele żądań. Spróbuj ponownie za chwilę";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Wystąpił błąd serwera. Spróbuj ponownie później";
      default:
        return message || `Wystąpił błąd (status: ${status})`;
    }
  }, []);

  // Field validation
  const validateField = useCallback(
    (field: keyof NewCarFormState): boolean => {
      let error: string | undefined;
      const value = formState[field];

      if (field === "name") {
        error = validateName(value as string);
      } else if (field === "initialOdometer") {
        error = validateInitialOdometer(value as string);
      } else if (field === "mileageInputPreference") {
        error = validateMileagePreference(value as string);
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
    [formState, formErrors, validateName, validateInitialOdometer, validateMileagePreference]
  );

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const nameValid = validateField("name");
    const odometerValid = validateField("initialOdometer");
    const preferenceValid = validateField("mileageInputPreference");

    // Focus first invalid field
    if (!nameValid) {
      nameInputRef.current?.focus();
      return false;
    }
    if (!odometerValid) {
      const odometerInput = document.querySelector('input[name="initialOdometer"]') as HTMLInputElement;
      odometerInput?.focus();
      return false;
    }
    if (!preferenceValid) {
      return false;
    }

    return true;
  }, [validateField]);

  // Handle field change with real-time validation
  const handleFieldChange = useCallback(
    (field: keyof NewCarFormState, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      setTouchedFields((prev) => new Set(prev).add(field));

      // Clear field error when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      // Real-time validation for critical fields (run async to not block input)
      if (touchedFields.has(field)) {
        // Defer validation to next tick to avoid blocking input
        setTimeout(() => {
          validateField(field);
        }, 0);
      }
    },
    [formErrors, touchedFields, validateField]
  );

  // Handle field blur (additional validation)
  const handleFieldBlur = useCallback(
    (field: keyof NewCarFormState) => {
      setTouchedFields((prev) => new Set(prev).add(field));
      validateField(field);
    },
    [validateField]
  );

  // Handle submit with enhanced error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      if (!validateAllFields()) {
        return;
      }

      setIsSubmitting(true);
      setFormErrors({});

      let abortController: (() => void) | null = null;

      try {
        // Prepare request body
        const requestBody: CreateCarCommand = {
          name: formState.name.trim(),
          mileage_input_preference: formState.mileageInputPreference,
        };

        if (formState.initialOdometer.trim()) {
          const odometerValue = parseInt(formState.initialOdometer, 10);
          if (!isNaN(odometerValue)) {
            requestBody.initial_odometer = odometerValue;
          }
        }

        // API call with timeout
        const fetchRequest = abortableFetch("/api/cars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });

        abortController = fetchRequest.abort;

        const response = await fetchRequest.ready;

        if (!response.ok) {
          let errorData: ErrorResponseDTO | undefined;

          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: { code: "INTERNAL_ERROR", message: "Nieznany błąd" },
            };
          }

          // Handle different error codes with detailed mapping
          if (response.status === 400) {
            // Validation errors - map to fields
            const errors: NewCarFormErrors = {};

            // Try to extract field-specific errors from API
            if (errorData && errorData.error.details?.issues) {
              const issues = errorData.error.details.issues as string;

              if (issues.toLowerCase().includes("name") || issues.toLowerCase().includes("trim")) {
                errors.name = "Nieprawidłowa nazwa samochodu";
              }
              if (issues.toLowerCase().includes("odometer")) {
                errors.initialOdometer = "Nieprawidłowy stan licznika";
              }
              if (issues.toLowerCase().includes("preference") || issues.toLowerCase().includes("mileage")) {
                errors.mileageInputPreference = "Nieprawidłowa preferencja";
              }
            }

            // If no specific field errors, show general message
            if (Object.keys(errors).length === 0) {
              errors.submit = getErrorMessage(response.status, errorData);
            }

            setFormErrors(errors);
            nameInputRef.current?.focus();
          } else if (response.status === 401) {
            // Unauthorized - session expired, redirect to login
            setFormErrors({ submit: "Sesja wygasła. Przekierowywanie do logowania..." });
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/auth/login";
              }, 2000);
            }
            setIsSubmitting(false);
            return;
          } else if (response.status === 409) {
            // Conflict - car name already exists
            setFormErrors({
              name: "Samochód o tej nazwie już istnieje. Wybierz inną nazwę.",
              submit: "Nazwa samochodu musi być unikalna",
            });
            nameInputRef.current?.focus();
          } else {
            // Other errors
            const errorMessage = getErrorMessage(response.status, errorData);
            setFormErrors({ submit: errorMessage });
          }

          setIsSubmitting(false);
          return;
        }

        // Success - navigate to /cars
        try {
          const createdCar: CarDetailsDTO = await response.json();

          // Show success briefly before redirect
          setFormErrors({});
          setIsSubmitting(false);

          if (typeof window !== "undefined") {
            // Small delay to let user see success state
            setTimeout(() => {
              window.location.href = "/cars";
            }, 300);
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setFormErrors({ submit: "Nie udało się przetworzyć odpowiedzi serwera" });
          setIsSubmitting(false);
        }
      } catch (error) {
        // Handle different error types
        console.error("Error creating car:", error);

        let errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie później.";

        if (error instanceof Error) {
          // Check for AbortError (timeout)
          if (error.name === "AbortError" || error.message.includes("aborted")) {
            errorMessage = "Przekroczono limit czasu połączenia. Spróbuj ponownie.";
          } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Przekroczono limit czasu połączenia. Spróbuj ponownie.";
          }
        }

        setFormErrors({ submit: errorMessage });
        setIsSubmitting(false);
      } finally {
        // Clean up abort controller
        if (abortController) {
          abortController();
        }
      }
    },
    [formState, validateAllFields, abortableFetch, getErrorMessage]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/cars";
    }
  }, []);

  return {
    formState,
    formErrors,
    isSubmitting,
    touchedFields,
    nameInputRef,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    handleCancel,
    validateField,
  };
};
