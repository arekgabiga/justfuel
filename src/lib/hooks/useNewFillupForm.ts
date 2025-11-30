import { useState, useCallback, useRef } from "react";
import type { CreateFillupCommand, FillupWithWarningsDTO, ErrorResponseDTO, ValidationWarningDTO } from "../../types";

const REQUEST_TIMEOUT = 10000; // 10 seconds

interface NewFillupFormState {
  date: string; // Format: YYYY-MM-DD
  fuelAmount: string; // String for editing, converted to number
  totalPrice: string; // String for editing, converted to number
  inputMode: "odometer" | "distance";
  odometer: string; // String, optional when mode = odometer
  distance: string; // String, optional when mode = distance
}

interface NewFillupFormErrors {
  date?: string;
  fuelAmount?: string;
  totalPrice?: string;
  odometer?: string;
  distance?: string;
  inputMode?: string;
  submit?: string;
}

interface AbortableFetch {
  abort: () => void;
  ready: Promise<Response>;
}

interface UseNewFillupFormProps {
  carId: string;
  initialInputMode?: "odometer" | "distance";
}

export const useNewFillupForm = ({ carId, initialInputMode = "odometer" }: UseNewFillupFormProps) => {
  const [formState, setFormState] = useState<NewFillupFormState>({
    date: new Date().toISOString().split("T")[0], // Today's date
    fuelAmount: "",
    totalPrice: "",
    inputMode: initialInputMode,
    odometer: "",
    distance: "",
  });

  const [formErrors, setFormErrors] = useState<NewFillupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof NewFillupFormState>>(new Set());
  const [warnings, setWarnings] = useState<ValidationWarningDTO[]>([]);
  const [redirectIn, setRedirectIn] = useState<number | null>(null); // Countdown timer
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Enhanced validation functions with detailed error messages
  const validateDate = useCallback((date: string): string | undefined => {
    if (!date.trim()) {
      return "Data jest wymagana";
    }

    // Check if date is a valid date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "Data jest nieprawidłowa";
    }

    // Check if date is not too far in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (dateObj > today) {
      return "Data nie może być z przyszłości";
    }

    // Check if date is not too old (more than 10 years ago)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(today.getFullYear() - 10);
    if (dateObj < tenYearsAgo) {
      return "Data jest zbyt stara (maksymalnie 10 lat wstecz)";
    }

    return undefined;
  }, []);

  const validateFuelAmount = useCallback((amount: string): string | undefined => {
    if (!amount.trim()) {
      return "Ilość paliwa jest wymagana";
    }

    // Check if it's a valid number (positive only)
    if (!/^\d*\.?\d*$/.test(amount.trim())) {
      return "Ilość paliwa musi być liczbą";
    }

    const num = parseFloat(amount);
    if (isNaN(num)) {
      return "Ilość paliwa musi być liczbą";
    }
    if (num <= 0) {
      return "Ilość paliwa musi być większa od zera";
    }
    if (num > 2000) {
      return "Ilość paliwa nie może przekraczać 2000 litrów";
    }

    return undefined;
  }, []);

  const validateTotalPrice = useCallback((price: string): string | undefined => {
    if (!price.trim()) {
      return "Całkowita cena jest wymagana";
    }

    // Check if it's a valid number
    if (!/^\d*\.?\d*$/.test(price.trim())) {
      return "Całkowita cena musi być liczbą";
    }

    const num = parseFloat(price);
    if (isNaN(num)) {
      return "Całkowita cena musi być liczbą";
    }
    if (num <= 0) {
      return "Całkowita cena musi być większa od zera";
    }
    if (num > 100000) {
      return "Całkowita cena nie może przekraczać 100000 PLN";
    }

    return undefined;
  }, []);

  const validateOdometer = useCallback((odometer: string, inputMode: string): string | undefined => {
    if (inputMode !== "odometer") {
      return undefined;
    }

    if (!odometer.trim()) {
      return "Stan licznika jest wymagany";
    }

    // Check if it's a valid integer
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

    return undefined;
  }, []);

  const validateDistance = useCallback((distance: string, inputMode: string): string | undefined => {
    if (inputMode !== "distance") {
      return undefined;
    }

    if (!distance.trim()) {
      return "Dystans jest wymagany";
    }

    // Check if it's a valid number (including decimals)
    if (!/^-?\d*\.?\d+$/.test(distance.trim())) {
      return "Dystans musi być liczbą";
    }

    const num = parseFloat(distance);
    if (isNaN(num)) {
      return "Dystans musi być liczbą";
    }
    if (num < 0) {
      return "Dystans nie może być ujemny";
    }

    return undefined;
  }, []);

  const validateInputMode = useCallback((mode: string): string | undefined => {
    if (mode !== "odometer" && mode !== "distance") {
      return "Wybierz tryb wprowadzania przebiegu";
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
        return "Samochód nie został znaleziony";
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
    (field: keyof NewFillupFormState, values: NewFillupFormState = formState): boolean => {
      let error: string | undefined;
      const value = values[field];

      if (field === "date") {
        error = validateDate(value as string);
      } else if (field === "fuelAmount") {
        error = validateFuelAmount(value as string);
      } else if (field === "totalPrice") {
        error = validateTotalPrice(value as string);
      } else if (field === "odometer") {
        error = validateOdometer(value as string, values.inputMode);
      } else if (field === "distance") {
        error = validateDistance(value as string, values.inputMode);
      } else if (field === "inputMode") {
        error = validateInputMode(value as string);
      }

      setFormErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });

      return !error;
    },
    [
      formState,
      validateDate,
      validateFuelAmount,
      validateTotalPrice,
      validateOdometer,
      validateDistance,
      validateInputMode,
    ]
  );

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const dateValid = validateField("date");
    const fuelAmountValid = validateField("fuelAmount");
    const totalPriceValid = validateField("totalPrice");
    const modeValid = validateField("inputMode");

    // Validate conditional fields based on input mode
    let conditionalValid = true;
    if (formState.inputMode === "odometer") {
      conditionalValid = validateField("odometer");
    } else if (formState.inputMode === "distance") {
      conditionalValid = validateField("distance");
    }

    // Focus first invalid field
    if (!dateValid) {
      dateInputRef.current?.focus();
      return false;
    }
    if (!fuelAmountValid) {
      const fuelInput = document.querySelector('input[name="fuelAmount"]') as HTMLInputElement;
      fuelInput?.focus();
      return false;
    }
    if (!totalPriceValid) {
      const priceInput = document.querySelector('input[name="totalPrice"]') as HTMLInputElement;
      priceInput?.focus();
      return false;
    }
    if (!conditionalValid) {
      const conditionalInput = document.querySelector(
        formState.inputMode === "odometer" ? 'input[name="odometer"]' : 'input[name="distance"]'
      ) as HTMLInputElement;
      conditionalInput?.focus();
      return false;
    }

    return dateValid && fuelAmountValid && totalPriceValid && modeValid && conditionalValid;
  }, [formState, validateField]);

  // Handle field change with real-time validation
  const handleFieldChange = useCallback(
    (field: keyof NewFillupFormState, value: string) => {
      const newState = { ...formState, [field]: value };
      setFormState(newState);
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
      setTimeout(() => {
        validateField(field, newState);
      }, 0);
    },
    [formState, formErrors, touchedFields, validateField]
  );

  // Handle field blur (additional validation)
  const handleFieldBlur = useCallback(
    (field: keyof NewFillupFormState) => {
      setTouchedFields((prev) => new Set(prev).add(field));
      validateField(field);
    },
    [validateField]
  );

  // Handle mode toggle
  const handleModeToggle = useCallback((mode: "odometer" | "distance") => {
    setFormState((prev) => {
      const newState = {
        ...prev,
        inputMode: mode,
        // Clear the field that is not being used
        odometer: mode === "distance" ? "" : prev.odometer,
        distance: mode === "odometer" ? "" : prev.distance,
      };
      return newState;
    });

    // Clear errors for the field that is no longer active
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      if (mode === "odometer") {
        delete newErrors.distance;
      } else {
        delete newErrors.odometer;
      }
      return newErrors;
    });
  }, []);

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
      setWarnings([]);

      let abortController: (() => void) | null = null;

      try {
        // Convert date from YYYY-MM-DD to ISO 8601
        const convertDateToISO = (date: string): string => {
          return new Date(date).toISOString();
        };

        // Prepare request body
        const requestBody: CreateFillupCommand = {
          date: convertDateToISO(formState.date),
          fuel_amount: parseFloat(formState.fuelAmount),
          total_price: parseFloat(formState.totalPrice),
        };

        if (formState.inputMode === "odometer") {
          (requestBody as any).odometer = parseInt(formState.odometer, 10);
        } else {
          (requestBody as any).distance = parseFloat(formState.distance);
        }

        // API call with timeout
        const fetchRequest = abortableFetch(`/api/cars/${carId}/fillups`, {
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
            const errors: NewFillupFormErrors = {};

            // Try to extract field-specific errors from API
            if (errorData && errorData.error.details?.issues) {
              const issues = errorData.error.details.issues as string;

              if (issues.toLowerCase().includes("date")) {
                errors.date = "Nieprawidłowa data";
              }
              if (issues.toLowerCase().includes("fuel") || issues.toLowerCase().includes("amount")) {
                errors.fuelAmount = "Nieprawidłowa ilość paliwa";
              }
              if (issues.toLowerCase().includes("price") || issues.toLowerCase().includes("total")) {
                errors.totalPrice = "Nieprawidłowa cena";
              }
              if (issues.toLowerCase().includes("odometer")) {
                errors.odometer = "Nieprawidłowy stan licznika";
              }
              if (issues.toLowerCase().includes("distance")) {
                errors.distance = "Nieprawidłowy dystans";
              }
            }

            // If no specific field errors, show general message
            if (Object.keys(errors).length === 0) {
              errors.submit = getErrorMessage(response.status, errorData);
            }

            setFormErrors(errors);
            dateInputRef.current?.focus();
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
          } else if (response.status === 404) {
            // Car not found
            setFormErrors({ submit: "Samochód nie został znaleziony. Przekierowywanie..." });
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/cars";
              }, 3000);
            }
            setIsSubmitting(false);
            return;
          } else {
            // Other errors
            const errorMessage = getErrorMessage(response.status, errorData);
            setFormErrors({ submit: errorMessage });
          }

          setIsSubmitting(false);
          return;
        }

        // Success - handle warnings and navigate
        try {
          const createdFillup: FillupWithWarningsDTO = await response.json();

          // Show warnings if any
          const hasWarnings = createdFillup.warnings && createdFillup.warnings.length > 0;
          if (hasWarnings) {
            setWarnings(createdFillup.warnings || []);
            // Start countdown timer for warnings
            setRedirectIn(5); // 5 seconds countdown
          }

          setFormErrors({});
          setIsSubmitting(false);

          if (typeof window !== "undefined") {
            if (hasWarnings) {
              // For warnings, start countdown
              const countdown = setInterval(() => {
                setRedirectIn((prev) => {
                  if (prev === null || prev <= 1) {
                    clearInterval(countdown);
                    window.location.href = `/cars/${carId}?tab=fillups`;
                    return null;
                  }
                  return prev - 1;
                });
              }, 1000);
            } else {
              // No warnings, quick redirect
              setTimeout(() => {
                window.location.href = `/cars/${carId}?tab=fillups`;
              }, 300);
            }
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setFormErrors({ submit: "Nie udało się przetworzyć odpowiedzi serwera" });
          setIsSubmitting(false);
        }
      } catch (error) {
        // Handle different error types
        console.error("Error creating fillup:", error);

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
    [carId, formState, validateAllFields, abortableFetch, getErrorMessage]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}?tab=fillups`;
    }
  }, [carId]);

  // Handle immediate redirect (skip countdown)
  const handleSkipCountdown = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}?tab=fillups`;
    }
  }, [carId]);

  return {
    formState,
    formErrors,
    isSubmitting,
    touchedFields,
    warnings,
    redirectIn,
    dateInputRef,
    handleFieldChange,
    handleFieldBlur,
    handleModeToggle,
    handleSubmit,
    handleCancel,
    handleSkipCountdown,
    validateField,
  };
};
