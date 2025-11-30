import { useState, useCallback, useRef, useEffect } from "react";
import type {
  UpdateFillupCommand,
  FillupDTO,
  UpdatedFillupDTO,
  ErrorResponseDTO,
  ValidationWarningDTO,
  DeleteResponseDTO,
} from "../../types";

const REQUEST_TIMEOUT = 10000; // 10 seconds

interface EditFillupFormState {
  date: string; // Format: YYYY-MM-DD
  fuelAmount: string; // String for editing, converted to number
  totalPrice: string; // String for editing, converted to number
  inputMode: "odometer" | "distance";
  odometer: string; // String, optional when mode = odometer
  distance: string; // String, optional when mode = distance
}

interface EditFillupFormErrors {
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

interface UseEditFillupFormProps {
  carId: string;
  fillupId: string;
}

export const useEditFillupForm = ({ carId, fillupId }: UseEditFillupFormProps) => {
  const [formState, setFormState] = useState<EditFillupFormState>({
    date: new Date().toISOString().split("T")[0],
    fuelAmount: "",
    totalPrice: "",
    inputMode: "odometer",
    odometer: "",
    distance: "",
  });

  const [originalFillupData, setOriginalFillupData] = useState<FillupDTO | null>(null);
  const [formErrors, setFormErrors] = useState<EditFillupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [touchedFields, setTouchedFields] = useState<Set<keyof EditFillupFormState>>(new Set());
  const [warnings, setWarnings] = useState<ValidationWarningDTO[]>([]);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load fillup data on mount
  useEffect(() => {
    const loadFillupData = async () => {
      try {
        const authToken = localStorage.getItem("auth_token");
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1];
        const devToken = localStorage.getItem("dev_token");

        const token = authToken || cookieToken || devToken;

        // Build headers - only include Authorization if we have a valid token
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Fetch car and fillup data in parallel
        const [carResponse, fillupResponse] = await Promise.all([
          fetch(`/api/cars/${carId}`, {
            method: "GET",
            headers,
          }),
          fetch(`/api/cars/${carId}/fillups/${fillupId}`, {
            method: "GET",
            headers,
          }),
        ]);

        if (!fillupResponse.ok) {
          if (fillupResponse.status === 401) {
            console.error("[useEditFillupForm] Unauthorized - NOT redirecting (showing error instead)");
            // Don't redirect, show error instead
            setFormErrors({
              submit: "Brak autoryzacji. Ustaw token w localStorage (/dev/set-token) lub włącz DEV_AUTH_FALLBACK=true",
            });
            setIsLoading(false);
            return;
          } else if (fillupResponse.status === 404) {
            setFormErrors({ submit: "Tankowanie nie zostało znalezione. Przekierowywanie..." });
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = `/cars/${carId}?tab=fillups`;
              }, 3000);
            }
            setIsLoading(false);
            return;
          }

          const errorData: ErrorResponseDTO = await fillupResponse.json();
          setFormErrors({ submit: errorData.error.message });
          setIsLoading(false);
          return;
        }

        const fillupData: FillupDTO = await fillupResponse.json();

        // Get car data to use mileage_input_preference
        let inputMode: "odometer" | "distance" = "odometer"; // Default fallback
        if (carResponse.ok) {
          try {
            const carData = await carResponse.json();
            // Use mileage_input_preference from car configuration
            if (carData.mileage_input_preference === "odometer" || carData.mileage_input_preference === "distance") {
              inputMode = carData.mileage_input_preference;
            }
          } catch (carError) {
            console.error("[useEditFillupForm] Error parsing car data:", carError);
            // Continue with default odometer mode if car fetch fails
          }
        }

        // Populate both values, user can switch between modes
        const odometerValue = fillupData.odometer?.toString() || "";
        const distanceValue = fillupData.distance_traveled?.toString() || "";

        setOriginalFillupData(fillupData);
        setFormState({
          date: new Date(fillupData.date).toISOString().split("T")[0],
          fuelAmount: fillupData.fuel_amount.toString(),
          totalPrice: fillupData.total_price.toString(),
          inputMode,
          odometer: odometerValue,
          distance: distanceValue,
        });
        setIsLoading(false);

        // Auto-focus date input after loading
        setTimeout(() => {
          dateInputRef.current?.focus();
        }, 100);
      } catch (error) {
        console.error("Error loading fillup data:", error);
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            setFormErrors({ submit: "Nie udało się pobrać danych. Sprawdź połączenie internetowe." });
          } else {
            setFormErrors({ submit: error.message });
          }
        } else {
          setFormErrors({ submit: "Nie udało się załadować danych tankowania" });
        }
        setIsLoading(false);
      }
    };

    loadFillupData();
  }, [carId, fillupId]);

  // Validation functions
  const validateDate = useCallback((date: string): string | undefined => {
    if (!date.trim()) {
      return "Data jest wymagana";
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "Data jest nieprawidłowa";
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateObj > today) {
      return "Data nie może być z przyszłości";
    }

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
        return "Tankowanie nie zostało znalezione";
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
    (field: keyof EditFillupFormState, values: EditFillupFormState = formState): boolean => {
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

    let conditionalValid = true;
    if (formState.inputMode === "odometer") {
      conditionalValid = validateField("odometer");
    } else if (formState.inputMode === "distance") {
      conditionalValid = validateField("distance");
    }

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

  // Check if any changes were made
  const hasChanges = useCallback((): boolean => {
    if (!originalFillupData) return false;

    const dateChanged =
      new Date(formState.date).toISOString().split("T")[0] !==
      new Date(originalFillupData.date).toISOString().split("T")[0];
    const fuelAmountChanged = parseFloat(formState.fuelAmount) !== originalFillupData.fuel_amount;
    const totalPriceChanged = parseFloat(formState.totalPrice) !== originalFillupData.total_price;

    // Check input mode and corresponding field
    let inputFieldChanged = false;
    if (formState.inputMode === "odometer") {
      const currentOdometer = parseInt(formState.odometer, 10);
      inputFieldChanged = currentOdometer !== (originalFillupData.odometer || 0);
    } else if (formState.inputMode === "distance") {
      const currentDistance = parseFloat(formState.distance);
      inputFieldChanged = currentDistance !== (originalFillupData.distance_traveled || 0);
    }

    return dateChanged || fuelAmountChanged || totalPriceChanged || inputFieldChanged;
  }, [formState, originalFillupData]);

  // Handle field change with real-time validation
  const handleFieldChange = useCallback(
    (field: keyof EditFillupFormState, value: string) => {
      const newState = { ...formState, [field]: value };
      setFormState(newState);
      setTouchedFields((prev) => new Set(prev).add(field));

      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      setTimeout(() => {
        validateField(field, newState);
      }, 0);
    },
    [formState, formErrors, touchedFields, validateField]
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (field: keyof EditFillupFormState) => {
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
        odometer: mode === "distance" ? "" : prev.odometer,
        distance: mode === "odometer" ? "" : prev.distance,
      };
      return newState;
    });

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

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Check if any changes were made
      if (!hasChanges()) {
        setFormErrors({ submit: "Nie wprowadzono żadnych zmian" });
        return;
      }

      // Validate all fields
      if (!validateAllFields()) {
        return;
      }

      setIsSubmitting(true);
      setFormErrors({});
      setWarnings([]);

      let abortController: (() => void) | null = null;

      try {
        const authToken = localStorage.getItem("auth_token");
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1];
        const devToken = localStorage.getItem("dev_token");

        const token = authToken || cookieToken || devToken;

        // Convert date from YYYY-MM-DD to ISO 8601
        const convertDateToISO = (date: string): string => {
          return new Date(date).toISOString();
        };

        // Prepare request body with only changed fields
        const requestBody: UpdateFillupCommand = {};
        let hasAnyChanges = false;

        if (
          new Date(formState.date).toISOString().split("T")[0] !==
          new Date(originalFillupData!.date).toISOString().split("T")[0]
        ) {
          requestBody.date = convertDateToISO(formState.date);
          hasAnyChanges = true;
        }
        if (parseFloat(formState.fuelAmount) !== originalFillupData!.fuel_amount) {
          requestBody.fuel_amount = parseFloat(formState.fuelAmount);
          hasAnyChanges = true;
        }
        if (parseFloat(formState.totalPrice) !== originalFillupData!.total_price) {
          requestBody.total_price = parseFloat(formState.totalPrice);
          hasAnyChanges = true;
        }

        // Handle odometer/distance based on input mode
        if (formState.inputMode === "odometer") {
          const odometerValue = parseInt(formState.odometer, 10);
          const originalOdometer = originalFillupData!.odometer || 0;
          if (odometerValue !== originalOdometer) {
            requestBody.odometer = odometerValue;
            hasAnyChanges = true;
          }
        } else if (formState.inputMode === "distance") {
          const distanceValue = parseFloat(formState.distance);
          const originalDistance = originalFillupData!.distance_traveled || 0;
          if (distanceValue !== originalDistance) {
            requestBody.distance = distanceValue;
            hasAnyChanges = true;
          }
        }

        if (!hasAnyChanges) {
          setFormErrors({ submit: "Nie wprowadzono żadnych zmian" });
          setIsSubmitting(false);
          return;
        }

        // Build headers - only include Authorization if we have a valid token
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // API call with timeout
        const fetchRequest = abortableFetch(`/api/cars/${carId}/fillups/${fillupId}`, {
          method: "PATCH",
          headers,
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

          if (response.status === 400) {
            const errors: EditFillupFormErrors = {};

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

            if (Object.keys(errors).length === 0) {
              errors.submit = getErrorMessage(response.status, errorData);
            }

            setFormErrors(errors);
            dateInputRef.current?.focus();
          } else if (response.status === 401) {
            // Unauthorized - check if we should redirect or show error
            console.error("[useEditFillupForm] Unauthorized on submit");

            // If no token was sent, it means DEV_AUTH_FALLBACK should handle it
            // But if we got 401, either fallback is not enabled or token was invalid
            if (!token) {
              // No token - should have used DEV_AUTH_FALLBACK
              setFormErrors({
                submit:
                  "Brak autoryzacji. Ustaw token w localStorage (/dev/set-token) lub włącz DEV_AUTH_FALLBACK=true w pliku .env",
              });
            } else {
              // Token was invalid - redirect to login
              setFormErrors({ submit: "Wymagana autoryzacja. Przekierowywanie..." });
              if (typeof window !== "undefined") {
                setTimeout(() => {
                  window.location.href = "/login";
                }, 2000);
              }
            }
            setIsSubmitting(false);
            return;
          } else if (response.status === 404) {
            setFormErrors({ submit: "Tankowanie nie zostało znalezione. Przekierowywanie..." });
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = `/cars/${carId}?tab=fillups`;
              }, 3000);
            }
            setIsSubmitting(false);
            return;
          } else {
            const errorMessage = getErrorMessage(response.status, errorData);
            setFormErrors({ submit: errorMessage });
          }

          setIsSubmitting(false);
          return;
        }

        // Success - handle warnings and navigate
        try {
          const updatedFillup: UpdatedFillupDTO = await response.json();

          // Show warnings if any
          const hasWarnings = updatedFillup.warnings && updatedFillup.warnings.length > 0;
          if (hasWarnings) {
            setWarnings(updatedFillup.warnings || []);
            setRedirectIn(5); // 5 seconds countdown
          }

          setFormErrors({});
          setIsSubmitting(false);

          if (typeof window !== "undefined") {
            if (hasWarnings) {
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
        console.error("Error updating fillup:", error);

        let errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie później.";

        if (error instanceof Error) {
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
        if (abortController) {
          abortController();
        }
      }
    },
    [carId, fillupId, formState, originalFillupData, hasChanges, validateAllFields, abortableFetch, getErrorMessage]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}?tab=fillups`;
    }
  }, [carId]);

  // Handle skip countdown
  const handleSkipCountdown = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}?tab=fillups`;
    }
  }, [carId]);

  // Handle delete click - open dialog
  const handleDeleteClick = useCallback(() => {
    setIsDeleteDialogOpen(true);
    setDeleteError(null);
  }, []);

  // Handle delete cancel - close dialog
  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeleteError(null);
  }, []);

  // Handle delete confirm - execute DELETE request
  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT);

    try {
      const authToken = localStorage.getItem("auth_token");
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];
      const devToken = localStorage.getItem("dev_token");

      const token = authToken || cookieToken || devToken;

      // Build headers - only include Authorization if we have a valid token
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/cars/${carId}/fillups/${fillupId}`, {
        method: "DELETE",
        headers,
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }

        if (response.status === 404) {
          // Not found - redirect to fillups list
          if (typeof window !== "undefined") {
            window.location.href = `/cars/${carId}?tab=fillups`;
          }
          return;
        }

        let errorData: ErrorResponseDTO | undefined;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: { code: "INTERNAL_ERROR", message: "Nieznany błąd" },
          };
        }

        const errorMessage = getErrorMessage(response.status, errorData);
        setDeleteError(errorMessage);
        setIsDeleting(false);
        return;
      }

      // Success - parse response and redirect
      try {
        (await response.json()) as DeleteResponseDTO;

        // Close dialog and redirect to fillups list
        setIsDeleteDialogOpen(false);
        setIsDeleting(false);

        if (typeof window !== "undefined") {
          window.location.href = `/cars/${carId}?tab=fillups`;
        }
      } catch (parseError) {
        console.error("Error parsing delete response:", parseError);
        setDeleteError("Nie udało się przetworzyć odpowiedzi serwera");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting fillup:", error);

      let errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie później.";

      if (error instanceof Error) {
        if (error.name === "AbortError" || error.message.includes("aborted")) {
          errorMessage = "Przekroczono limit czasu połączenia. Spróbuj ponownie.";
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Przekroczono limit czasu połączenia. Spróbuj ponownie.";
        }
      }

      setDeleteError(errorMessage);
      setIsDeleting(false);
    } finally {
      clearTimeout(timeoutId);
    }
  }, [carId, fillupId, getErrorMessage]);

  return {
    formState,
    formErrors,
    isSubmitting,
    isLoading,
    touchedFields,
    warnings,
    redirectIn,
    dateInputRef,
    originalFillupData,
    handleFieldChange,
    handleFieldBlur,
    handleModeToggle,
    handleSubmit,
    handleCancel,
    handleSkipCountdown,
    validateField,
    // Delete functionality
    isDeleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
};
