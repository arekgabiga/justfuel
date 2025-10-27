import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNewCarForm } from "@/lib/hooks/useNewCarForm";
import { Home } from "lucide-react";

const NewCarFormView: React.FC = () => {
  const {
    formState,
    formErrors,
    isSubmitting,
    touchedFields,
    nameInputRef,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    handleCancel,
  } = useNewCarForm();

  const handleHomeClick = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    // Auto-focus name input on mount
    nameInputRef.current?.focus();
  }, [nameInputRef]);

  const hasErrors = Object.keys(formErrors).length > 0;
  const isSubmitDisabled = isSubmitting || (hasErrors && touchedFields.size > 0);

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumbs with proper ARIA */}
      <nav
        aria-label="Breadcrumb navigation"
        className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
      >
        <ol className="flex items-center space-x-2" role="list">
          <li>
            <button
              onClick={handleHomeClick}
              onKeyDown={(e) => handleKeyDown(e, handleHomeClick)}
              className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Przejdź do strony głównej"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Strona główna</span>
            </button>
          </li>
          <li aria-hidden="true">
            <span>/</span>
          </li>
          <li>
            <button
              onClick={handleCancel}
              onKeyDown={(e) => handleKeyDown(e, handleCancel)}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
              aria-label="Przejdź do listy samochodów"
            >
              Samochody
            </button>
          </li>
          <li aria-hidden="true">
            <span>/</span>
          </li>
          <li aria-current="page" className="text-gray-900 dark:text-gray-100">
            Nowy samochód
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dodaj Nowy Samochód
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Wypełnij formularz, aby dodać nowy samochód do swojego konta
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate aria-label="Formularz dodawania nowego samochodu" className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name" aria-required="true">
            Nazwa samochodu
            <span aria-label="Pole wymagane" className="text-destructive ml-1">*</span>
          </Label>
          <Input
            ref={nameInputRef}
            id="name"
            name="name"
            type="text"
            value={formState.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            onBlur={() => handleFieldBlur("name")}
            placeholder="np. Moje Audi A4"
            aria-invalid={touchedFields.has("name") && !!formErrors.name}
            aria-describedby={
              touchedFields.has("name") && formErrors.name
                ? "name-error name-help"
                : touchedFields.has("name")
                  ? "name-help"
                  : undefined
            }
            aria-required="true"
            autoComplete="off"
            disabled={isSubmitting}
            className={touchedFields.has("name") && formErrors.name ? "border-destructive" : ""}
            required
          />
          <p id="name-help" className="sr-only">
            Wprowadź nazwę samochodu (1-100 znaków)
          </p>
          {touchedFields.has("name") && formErrors.name && (
            <p id="name-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
              {formErrors.name}
            </p>
          )}
        </div>

        {/* Initial odometer field */}
        <div className="space-y-2">
          <Label htmlFor="initialOdometer">
            Początkowy stan licznika (opcjonalne)
          </Label>
          <Input
            id="initialOdometer"
            name="initialOdometer"
            type="number"
            min="0"
            step="1"
            value={formState.initialOdometer}
            onChange={(e) => handleFieldChange("initialOdometer", e.target.value)}
            onBlur={() => handleFieldBlur("initialOdometer")}
            placeholder="np. 50000"
            aria-invalid={touchedFields.has("initialOdometer") && !!formErrors.initialOdometer}
            aria-describedby={
              touchedFields.has("initialOdometer") && formErrors.initialOdometer
                ? "initialOdometer-error initialOdometer-help"
                : touchedFields.has("initialOdometer")
                  ? "initialOdometer-help"
                  : undefined
            }
            autoComplete="off"
            disabled={isSubmitting}
            className={
              touchedFields.has("initialOdometer") && formErrors.initialOdometer ? "border-destructive" : ""
            }
          />
          <p id="initialOdometer-help" className="sr-only">
            Wprowadź początkowy stan licznika w kilometrach (opcjonalne)
          </p>
          {touchedFields.has("initialOdometer") && formErrors.initialOdometer && (
            <p
              id="initialOdometer-error"
              className="text-sm text-destructive mt-1"
              role="alert"
              aria-live="polite"
            >
              {formErrors.initialOdometer}
            </p>
          )}
        </div>

        {/* Mileage input preference field */}
        <div className="space-y-2">
          <Label htmlFor="mileageInputPreference" aria-required="true">
            Preferencja wprowadzania przebiegu
            <span aria-label="Pole wymagane" className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={formState.mileageInputPreference}
            onValueChange={(value) => {
              handleFieldChange("mileageInputPreference", value);
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id="mileageInputPreference"
              name="mileageInputPreference"
              aria-invalid={!!formErrors.mileageInputPreference}
              aria-describedby={
                formErrors.mileageInputPreference
                  ? "mileageInputPreference-error mileageInputPreference-help"
                  : touchedFields.has("mileageInputPreference")
                    ? "mileageInputPreference-help"
                    : undefined
              }
              aria-required="true"
              className={
                touchedFields.has("mileageInputPreference") && formErrors.mileageInputPreference
                  ? "border-destructive"
                  : ""
              }
            >
              <SelectValue placeholder="Wybierz preferencję" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="odometer">Stan licznika</SelectItem>
              <SelectItem value="distance">Przejechany dystans</SelectItem>
            </SelectContent>
          </Select>
          <p id="mileageInputPreference-help" className="sr-only">
            Wybierz jak będziesz wprowadzać przebieg: stan licznika lub przejechany dystans
          </p>
          {touchedFields.has("mileageInputPreference") && formErrors.mileageInputPreference && (
            <p
              id="mileageInputPreference-error"
              className="text-sm text-destructive mt-1"
              role="alert"
              aria-live="polite"
            >
              {formErrors.mileageInputPreference}
            </p>
          )}
        </div>

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
            aria-label="Anuluj i wróć do listy samochodów"
          >
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewCarFormView;

