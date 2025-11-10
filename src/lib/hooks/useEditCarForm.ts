import { useState, useCallback, useRef, useEffect } from "react";
import type { UpdateCarCommand, CarDetailsDTO, ErrorResponseDTO, DeleteCarCommand } from "../../types";

const REQUEST_TIMEOUT = 10000; // 10 seconds

interface EditCarFormState {
  name: string;
  mileageInputPreference: "odometer" | "distance";
}

interface EditCarFormErrors {
  name?: string;
  mileageInputPreference?: string;
  submit?: string;
}

interface AbortableFetch {
  abort: () => void;
  ready: Promise<Response>;
}

interface UseEditCarFormProps {
  carId: string;
}

export const useEditCarForm = ({ carId }: UseEditCarFormProps) => {
  const [formState, setFormState] = useState<EditCarFormState>({
    name: "",
    mileageInputPreference: "odometer",
  });

  const [originalCarData, setOriginalCarData] = useState<CarDetailsDTO | null>(null);
  const [formErrors, setFormErrors] = useState<EditCarFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [touchedFields, setTouchedFields] = useState<Set<keyof EditCarFormState>>(new Set());
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Delete car dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load car data on mount
  useEffect(() => {
    const loadCarData = async () => {
      try {
        // Get auth token - try multiple sources
        const authToken = localStorage.getItem("auth_token");
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1];
        const devToken = localStorage.getItem("dev_token");

        const token = authToken || cookieToken || devToken;

        console.log("[useEditCarForm] Auth tokens:", {
          localStorage_auth_token: authToken ? "exists" : "missing",
          cookie_auth_token: cookieToken ? "exists" : "missing",
          localStorage_dev_token: devToken ? "exists" : "missing",
          final_token: token ? `${token.substring(0, 20)}...` : "missing",
        });

        // Build headers - only include Authorization if we have a valid token
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/cars/${carId}`, {
          method: "GET",
          headers,
        });

        console.log("[useEditCarForm] API response:", response.status, response.statusText);

        if (!response.ok) {
          if (response.status === 401) {
            console.error("[useEditCarForm] Unauthorized - NOT redirecting (showing error instead)");
            // Don't redirect, show error instead
            setFormErrors({
              submit: "Brak autoryzacji. Ustaw token w localStorage (/dev/set-token) lub włącz DEV_AUTH_FALLBACK=true",
            });
            setIsLoading(false);
            return;
          } else if (response.status === 404) {
            setFormErrors({ submit: "Samochód nie został znaleziony" });
            setTimeout(() => {
              if (typeof window !== "undefined") {
                window.location.href = "/cars";
              }
            }, 3000);
            setIsLoading(false);
            return;
          }

          const errorData: ErrorResponseDTO = await response.json();
          setFormErrors({ submit: errorData.error.message });
          setIsLoading(false);
          return;
        }

        const carData: CarDetailsDTO = await response.json();
        console.log("[useEditCarForm] Car loaded:", carData?.name);

        setOriginalCarData(carData);
        setFormState({
          name: carData.name,
          mileageInputPreference: carData.mileage_input_preference,
        });
        setIsLoading(false);

        // Auto-focus name input after loading
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 100);
      } catch (error) {
        console.error("Error loading car data:", error);
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            setFormErrors({ submit: "Nie udało się pobrać danych. Sprawdź połączenie internetowe." });
          } else {
            setFormErrors({ submit: error.message });
          }
        } else {
          setFormErrors({ submit: "Nie udało się załadować danych samochodu" });
        }
        setIsLoading(false);
      }
    };

    loadCarData();
  }, [carId]);

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
    (field: keyof EditCarFormState): boolean => {
      let error: string | undefined;
      const value = formState[field];

      if (field === "name") {
        error = validateName(value as string);
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
    [formState, formErrors, validateName, validateMileagePreference]
  );

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const nameValid = validateField("name");
    const preferenceValid = validateField("mileageInputPreference");

    // Focus first invalid field
    if (!nameValid) {
      nameInputRef.current?.focus();
      return false;
    }
    if (!preferenceValid) {
      return false;
    }

    return true;
  }, [validateField]);

  // Check if any fields have changed
  const hasChanges = useCallback((): boolean => {
    if (!originalCarData) return false;

    return (
      formState.name.trim() !== originalCarData.name ||
      formState.mileageInputPreference !== originalCarData.mileage_input_preference
    );
  }, [formState, originalCarData]);

  // Handle field change with real-time validation
  const handleFieldChange = useCallback(
    (field: keyof EditCarFormState, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      setTouchedFields((prev) => new Set(prev).add(field));

      // Clear submit error when user makes changes
      if (formErrors.submit) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.submit;
          return newErrors;
        });
      }

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
    (field: keyof EditCarFormState) => {
      setTouchedFields((prev) => new Set(prev).add(field));
      validateField(field);
    },
    [validateField]
  );

  // Handle submit with enhanced error handling
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

      let abortController: (() => void) | null = null;

      try {
        // Get auth token - try multiple sources
        const authToken = localStorage.getItem("auth_token");
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1];
        const devToken = localStorage.getItem("dev_token");

        const token = authToken || cookieToken || devToken;

        // Prepare request body with only changed fields
        const requestBody: UpdateCarCommand = {};
        let hasAnyChanges = false;

        if (formState.name.trim() !== originalCarData?.name) {
          requestBody.name = formState.name.trim();
          hasAnyChanges = true;
        }

        if (formState.mileageInputPreference !== originalCarData?.mileage_input_preference) {
          requestBody.mileage_input_preference = formState.mileageInputPreference;
          hasAnyChanges = true;
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

        console.log("[useEditCarForm] Sending PATCH request to:", `/api/cars/${carId}`);
        console.log("[useEditCarForm] Request body:", requestBody);
        console.log("[useEditCarForm] Headers:", {
          ...headers,
          Authorization: headers.Authorization ? "***" : undefined,
        });

        // API call with timeout
        const fetchRequest = abortableFetch(`/api/cars/${carId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(requestBody),
        });

        abortController = fetchRequest.abort;

        const response = await fetchRequest.ready;

        console.log("[useEditCarForm] PATCH API response:", response.status, response.statusText);

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
            const errors: EditCarFormErrors = {};

            // Try to extract field-specific errors from API
            if (errorData && errorData.error.details?.issues) {
              const issues = errorData.error.details.issues as string;

              if (issues.toLowerCase().includes("name") || issues.toLowerCase().includes("trim")) {
                errors.name = "Nieprawidłowa nazwa samochodu";
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
            // Unauthorized - check if we should redirect or show error
            console.error("[useEditCarForm] Unauthorized on submit");

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
            // Not found - redirect to cars list
            setFormErrors({ submit: "Samochód nie został znaleziony" });
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/cars";
              }, 3000);
            }
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

        // Success - navigate to car details
        try {
          const updatedCar: CarDetailsDTO = await response.json();

          // Show success briefly before redirect
          setFormErrors({});
          setIsSubmitting(false);

          if (typeof window !== "undefined") {
            // Small delay to let user see success state
            setTimeout(() => {
              window.location.href = `/cars/${carId}`;
            }, 300);
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setFormErrors({ submit: "Nie udało się przetworzyć odpowiedzi serwera" });
          setIsSubmitting(false);
        }
      } catch (error) {
        // Handle different error types
        console.error("Error updating car:", error);

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
    [formState, originalCarData, hasChanges, validateAllFields, abortableFetch, getErrorMessage, carId]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}`;
    }
  }, [carId]);

  // Handle delete click - opens delete dialog
  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setDeleteError(null);
  }, []);

  // Handle delete cancel - closes delete dialog
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  }, []);

  // Handle delete confirm - performs car deletion
  const handleDeleteConfirm = useCallback(
    async (data: DeleteCarCommand) => {
      setIsDeleting(true);
      setDeleteError(null);

      let abortController: (() => void) | null = null;

      try {
        // Get auth token - try multiple sources
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

        console.log("[useEditCarForm] Sending DELETE request to:", `/api/cars/${carId}`);
        console.log("[useEditCarForm] Request body:", data);

        // API call with timeout
        const fetchRequest = abortableFetch(`/api/cars/${carId}`, {
          method: "DELETE",
          headers,
          body: JSON.stringify(data),
        });

        abortController = fetchRequest.abort;

        const response = await fetchRequest.ready;

        console.log("[useEditCarForm] DELETE API response:", response.status, response.statusText);

        if (!response.ok) {
          let errorData: ErrorResponseDTO | undefined;

          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: { code: "INTERNAL_ERROR", message: "Nieznany błąd" },
            };
          }

          // Handle different error codes
          let errorMessage: string;
          if (response.status === 400) {
            // Validation errors - incorrect confirmation name
            errorMessage =
              errorData?.error.message || "Nazwa potwierdzenia nie pasuje do nazwy samochodu";
            setDeleteError(errorMessage);
          } else if (response.status === 401) {
            // Unauthorized
            if (!token) {
              errorMessage =
                "Brak autoryzacji. Ustaw token w localStorage (/dev/set-token) lub włącz DEV_AUTH_FALLBACK=true";
              setDeleteError(errorMessage);
            } else {
              errorMessage = "Wymagana autoryzacja. Przekierowywanie...";
              setDeleteError(errorMessage);
              if (typeof window !== "undefined") {
                setTimeout(() => {
                  window.location.href = "/login";
                }, 2000);
              }
            }
          } else if (response.status === 404) {
            // Not found
            errorMessage = "Samochód nie został znaleziony";
            setDeleteError(errorMessage);
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/cars";
              }, 3000);
            }
          } else if (response.status === 500) {
            // Server error
            errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie później";
            setDeleteError(errorMessage);
          } else {
            // Other errors
            errorMessage = getErrorMessage(response.status, errorData);
            setDeleteError(errorMessage);
          }

          setIsDeleting(false);
          throw new Error(errorMessage);
        }

        // Success - redirect to cars list
        try {
          await response.json(); // Consume response body
          
          if (typeof window !== "undefined") {
            window.location.href = "/cars";
          }
        } catch (parseError) {
          console.error("[useEditCarForm] Error parsing response:", parseError);
          // Even if parsing fails, redirect if status was OK
          if (typeof window !== "undefined") {
            window.location.href = "/cars";
          }
        }
      } catch (error) {
        // Handle different error types
        console.error("[useEditCarForm] Error deleting car:", error);

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

        setDeleteError(errorMessage);
        setIsDeleting(false);
        throw new Error(errorMessage);
      } finally {
        // Clean up abort controller
        if (abortController) {
          abortController();
        }
      }
    },
    [carId, abortableFetch, getErrorMessage]
  );

  return {
    formState,
    formErrors,
    isSubmitting,
    isLoading,
    touchedFields,
    nameInputRef,
    originalCarData,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    handleCancel,
    validateField,
    // Delete car functionality
    deleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
};
