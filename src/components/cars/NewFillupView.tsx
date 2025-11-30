import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNewFillupForm } from "@/lib/hooks/useNewFillupForm";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { ValidationWarningDTO, CarDetailsDTO } from "@/types";

interface NewFillupViewProps {
  carId: string;
  initialInputMode?: "odometer" | "distance";
}

const NewFillupView: React.FC<NewFillupViewProps> = ({ carId, initialInputMode = "odometer" }) => {
  const [carPreference, setCarPreference] = useState<"odometer" | "distance" | null>(null);

  // Fetch car name and preference first
  useEffect(() => {
    const fetchCarData = async () => {
      try {
        const response = await fetch(`/api/cars/${carId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (response.ok) {
          const carData: CarDetailsDTO = await response.json();
          // Use car's saved preference if available, otherwise use prop default
          setCarPreference((carData.mileage_input_preference as "odometer" | "distance") || initialInputMode);
        } else {
          // If API call fails, use prop default
          setCarPreference(initialInputMode);
        }
      } catch {
        // Error fetching car data - use defaults
        setCarPreference(initialInputMode);
      }
    };

    fetchCarData();
  }, [carId, initialInputMode]);

  // Initialize hook only after car data is loaded
  const {
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
  } = useNewFillupForm({ carId, initialInputMode: carPreference || initialInputMode });

  useEffect(() => {
    // Auto-focus date input on mount
    dateInputRef.current?.focus();
  }, [dateInputRef]);

  const hasErrors = Object.keys(formErrors).length > 0;
  const isSubmitDisabled = isSubmitting || (hasErrors && touchedFields.size > 0);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Navigation */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors -ml-0.5"
        aria-label="Wróć do szczegółów auta"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Wróć do szczegółów auta</span>
      </button>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dodaj Nowe Tankowanie</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Wypełnij formularz, aby dodać nowe tankowanie</p>
      </header>
      {/* Form */}
      <form onSubmit={handleSubmit} noValidate aria-label="Formularz dodawania nowego tankowania" className="space-y-6">
        {/* Date field */}
        <div className="space-y-2">
          <Label htmlFor="date" aria-required="true">
            Data tankowania
            <span aria-label="Pole wymagane" className="text-destructive ml-1">
              *
            </span>
          </Label>
          <Input
            ref={dateInputRef}
            id="date"
            name="date"
            type="date"
            value={formState.date}
            onChange={(e) => handleFieldChange("date", e.target.value)}
            onBlur={() => handleFieldBlur("date")}
            aria-invalid={touchedFields.has("date") && !!formErrors.date}
            aria-describedby={
              touchedFields.has("date") && formErrors.date
                ? "date-error date-help"
                : touchedFields.has("date")
                  ? "date-help"
                  : undefined
            }
            aria-required="true"
            disabled={isSubmitting}
            className={touchedFields.has("date") && formErrors.date ? "border-destructive" : ""}
            required
          />
          <p id="date-help" className="sr-only">
            Wprowadź datę tankowania
          </p>
          {touchedFields.has("date") && formErrors.date && (
            <p id="date-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
              {formErrors.date}
            </p>
          )}
        </div>

        {/* Fuel amount field */}
        <div className="space-y-2">
          <Label htmlFor="fuelAmount" aria-required="true">
            Ilość paliwa (litry)
            <span aria-label="Pole wymagane" className="text-destructive ml-1">
              *
            </span>
          </Label>
          <Input
            id="fuelAmount"
            name="fuelAmount"
            type="number"
            min="0"
            step="0.01"
            value={formState.fuelAmount}
            onChange={(e) => handleFieldChange("fuelAmount", e.target.value)}
            onBlur={() => handleFieldBlur("fuelAmount")}
            placeholder="np. 45.5"
            aria-invalid={touchedFields.has("fuelAmount") && !!formErrors.fuelAmount}
            aria-describedby={
              touchedFields.has("fuelAmount") && formErrors.fuelAmount
                ? "fuelAmount-error fuelAmount-help"
                : touchedFields.has("fuelAmount")
                  ? "fuelAmount-help"
                  : undefined
            }
            aria-required="true"
            autoComplete="off"
            disabled={isSubmitting}
            className={touchedFields.has("fuelAmount") && formErrors.fuelAmount ? "border-destructive" : ""}
            required
          />
          <p id="fuelAmount-help" className="sr-only">
            Wprowadź ilość zatankowanego paliwa w litrach
          </p>
          {touchedFields.has("fuelAmount") && formErrors.fuelAmount && (
            <p id="fuelAmount-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
              {formErrors.fuelAmount}
            </p>
          )}
        </div>

        {/* Total price field */}
        <div className="space-y-2">
          <Label htmlFor="totalPrice" aria-required="true">
            Całkowita cena (PLN)
            <span aria-label="Pole wymagane" className="text-destructive ml-1">
              *
            </span>
          </Label>
          <Input
            id="totalPrice"
            name="totalPrice"
            type="number"
            min="0"
            step="0.01"
            value={formState.totalPrice}
            onChange={(e) => handleFieldChange("totalPrice", e.target.value)}
            onBlur={() => handleFieldBlur("totalPrice")}
            placeholder="np. 227.5"
            aria-invalid={touchedFields.has("totalPrice") && !!formErrors.totalPrice}
            aria-describedby={
              touchedFields.has("totalPrice") && formErrors.totalPrice
                ? "totalPrice-error totalPrice-help"
                : touchedFields.has("totalPrice")
                  ? "totalPrice-help"
                  : undefined
            }
            aria-required="true"
            autoComplete="off"
            disabled={isSubmitting}
            className={touchedFields.has("totalPrice") && formErrors.totalPrice ? "border-destructive" : ""}
            required
          />
          <p id="totalPrice-help" className="sr-only">
            Wprowadź całkowitą cenę tankowania w PLN
          </p>
          {touchedFields.has("totalPrice") && formErrors.totalPrice && (
            <p id="totalPrice-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
              {formErrors.totalPrice}
            </p>
          )}
        </div>

        {/* Mileage input mode toggle */}
        <div className="space-y-2">
          <Label htmlFor="inputMode" aria-required="true">
            Tryb wprowadzania przebiegu
            <span aria-label="Pole wymagane" className="text-destructive ml-1">
              *
            </span>
          </Label>
          <Select
            key={formState.inputMode} // Force re-mount when value changes
            value={formState.inputMode}
            onValueChange={(value: "odometer" | "distance") => {
              handleModeToggle(value);
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id="inputMode"
              name="inputMode"
              aria-invalid={!!formErrors.inputMode}
              aria-describedby={
                formErrors.inputMode
                  ? "inputMode-error inputMode-help"
                  : touchedFields.has("inputMode")
                    ? "inputMode-help"
                    : undefined
              }
              aria-required="true"
              className={touchedFields.has("inputMode") && formErrors.inputMode ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Wybierz tryb" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="odometer">Stan licznika</SelectItem>
              <SelectItem value="distance">Przejechany dystans</SelectItem>
            </SelectContent>
          </Select>
          <p id="inputMode-help" className="sr-only">
            Wybierz czy podajesz stan licznika czy przejechany dystans
          </p>
          {touchedFields.has("inputMode") && formErrors.inputMode && (
            <p id="inputMode-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
              {formErrors.inputMode}
            </p>
          )}
        </div>

        {/* Conditional fields based on input mode */}
        {formState.inputMode === "odometer" && (
          <div className="space-y-2">
            <Label htmlFor="odometer" aria-required="true">
              Stan licznika
              <span aria-label="Pole wymagane" className="text-destructive ml-1">
                *
              </span>
            </Label>
            <Input
              id="odometer"
              name="odometer"
              type="number"
              min="0"
              step="1"
              value={formState.odometer}
              onChange={(e) => handleFieldChange("odometer", e.target.value)}
              onBlur={() => handleFieldBlur("odometer")}
              placeholder="np. 55000"
              aria-invalid={touchedFields.has("odometer") && !!formErrors.odometer}
              aria-describedby={
                touchedFields.has("odometer") && formErrors.odometer
                  ? "odometer-error odometer-help"
                  : touchedFields.has("odometer")
                    ? "odometer-help"
                    : undefined
              }
              aria-required="true"
              autoComplete="off"
              disabled={isSubmitting}
              className={touchedFields.has("odometer") && formErrors.odometer ? "border-destructive" : ""}
              required
            />
            <p id="odometer-help" className="sr-only">
              Wprowadź aktualny stan licznika w kilometrach
            </p>
            {touchedFields.has("odometer") && formErrors.odometer && (
              <p id="odometer-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {formErrors.odometer}
              </p>
            )}
          </div>
        )}

        {formState.inputMode === "distance" && (
          <div className="space-y-2">
            <Label htmlFor="distance" aria-required="true">
              Dystans (km)
              <span aria-label="Pole wymagane" className="text-destructive ml-1">
                *
              </span>
            </Label>
            <Input
              id="distance"
              name="distance"
              type="number"
              min="0"
              step="0.01"
              value={formState.distance}
              onChange={(e) => handleFieldChange("distance", e.target.value)}
              onBlur={() => handleFieldBlur("distance")}
              placeholder="np. 500"
              aria-invalid={touchedFields.has("distance") && !!formErrors.distance}
              aria-describedby={
                touchedFields.has("distance") && formErrors.distance
                  ? "distance-error distance-help"
                  : touchedFields.has("distance")
                    ? "distance-help"
                    : undefined
              }
              aria-required="true"
              autoComplete="off"
              disabled={isSubmitting}
              className={touchedFields.has("distance") && formErrors.distance ? "border-destructive" : ""}
              required
            />
            <p id="distance-help" className="sr-only">
              Wprowadź przejechany dystans od ostatniego tankowania w kilometrach
            </p>
            {touchedFields.has("distance") && formErrors.distance && (
              <p id="distance-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {formErrors.distance}
              </p>
            )}
          </div>
        )}

        {/* Validation warnings */}
        {warnings.length > 0 && (
          <div
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Ostrzeżenia walidacji</h4>
                <ul className="space-y-1 mb-3">
                  {warnings.map((warning: ValidationWarningDTO, index: number) => (
                    <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                      <span className="font-medium">{warning.field}:</span> {warning.message}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                  {redirectIn !== null && redirectIn > 0 && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Przekierowywanie za <span className="font-medium">{redirectIn}</span> sekund...
                    </p>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={handleSkipCountdown} className="ml-auto">
                    Rozumiem, przejdź dalej
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit error message */}
        {formErrors.submit && (
          <div
            className="p-4 rounded-md bg-destructive/10 border border-destructive/50"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <p className="text-sm text-destructive">{formErrors.submit}</p>
          </div>
        )}

        {/* Form actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6" role="group" aria-label="Akcje formularza">
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            size="lg"
            className="flex-1 sm:flex-none min-w-[120px]"
            aria-busy={isSubmitting}
            aria-describedby={isSubmitting ? "submitting-status" : undefined}
          >
            {isSubmitting ? "Zapisywanie..." : "Zapisz"}
          </Button>
          {isSubmitting && (
            <span id="submitting-status" className="sr-only">
              Zapisywanie formularza, proszę czekać
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            size="lg"
            className="flex-1 sm:flex-none min-w-[120px]"
            aria-label="Anuluj i wróć do listy tankowań"
          >
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewFillupView;
