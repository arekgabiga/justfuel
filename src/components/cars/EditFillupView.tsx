import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditFillupForm } from '@/lib/hooks/useEditFillupForm';
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';
import type { ValidationWarningDTO } from '@/types';
import { DeleteFillupDialog } from './DeleteFillupDialog';

interface EditFillupViewProps {
  carId: string;
  fillupId: string;
}

const EditFillupView: React.FC<EditFillupViewProps> = ({ carId, fillupId }) => {
  const {
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
    isDeleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useEditFillupForm({ carId, fillupId });

  useEffect(() => {
    dateInputRef.current?.focus();
  }, [dateInputRef]);

  const hasErrors = Object.keys(formErrors).length > 0;
  const isSubmitDisabled = isSubmitting || (hasErrors && touchedFields.size > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Ładowanie danych tankowania...</div>
        </div>
      </div>
    );
  }

  if (!originalFillupData) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div
          className="p-4 rounded-md bg-destructive/10 border border-destructive/50"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-destructive">{formErrors.submit || 'Nie udało się załadować danych tankowania'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors -ml-0.5"
        aria-label="Wróć do szczegółów auta"
        disabled={isSubmitting || isDeleting}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Wróć do szczegółów auta</span>
      </button>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edytuj Tankowanie</h1>
      </header>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg ring-1 ring-black/5 p-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formularz edycji tankowania"
          className="grid gap-8 grid-cols-1 md:grid-cols-2"
        >
          {/* Row 1: Date field */}
          <div className="md:col-span-1 space-y-2">
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
              onChange={(e) => handleFieldChange('date', e.target.value)}
              onBlur={() => handleFieldBlur('date')}
              aria-invalid={touchedFields.has('date') && !!formErrors.date}
              aria-describedby={
                touchedFields.has('date') && formErrors.date
                  ? 'date-error date-help'
                  : touchedFields.has('date')
                    ? 'date-help'
                    : undefined
              }
              aria-required="true"
              disabled={isSubmitting}
              className={touchedFields.has('date') && formErrors.date ? 'border-destructive' : ''}
              required
            />
            <p id="date-help" className="sr-only">
              Wprowadź datę tankowania
            </p>
            {touchedFields.has('date') && formErrors.date && (
              <p id="date-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {formErrors.date}
              </p>
            )}
          </div>

          {/* Spacer */}
          <div className="hidden md:block"></div>

          {/* Row 2: Fuel Amount | Total Price */}
          <div className="space-y-2">
            <Label htmlFor="fuelAmount" aria-required="true">
              Ilość paliwa
              <span aria-label="Pole wymagane" className="text-destructive ml-1">
                *
              </span>
            </Label>
            <div className="relative">
              <Input
                id="fuelAmount"
                name="fuelAmount"
                type="number"
                min="0"
                step="0.01"
                value={formState.fuelAmount}
                onChange={(e) => handleFieldChange('fuelAmount', e.target.value)}
                onBlur={() => handleFieldBlur('fuelAmount')}
                placeholder="np. 45.5"
                aria-invalid={touchedFields.has('fuelAmount') && !!formErrors.fuelAmount}
                aria-describedby={
                  touchedFields.has('fuelAmount') && formErrors.fuelAmount
                    ? 'fuelAmount-error fuelAmount-help'
                    : touchedFields.has('fuelAmount')
                      ? 'fuelAmount-help'
                      : undefined
                }
                aria-required="true"
                autoComplete="off"
                disabled={isSubmitting}
                className={`pr-10 ${touchedFields.has('fuelAmount') && formErrors.fuelAmount ? 'border-destructive' : ''}`}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                L
              </span>
            </div>
            {touchedFields.has('fuelAmount') && formErrors.fuelAmount && (
              <p id="fuelAmount-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {formErrors.fuelAmount}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalPrice" aria-required="true">
              Całkowita cena
              <span aria-label="Pole wymagane" className="text-destructive ml-1">
                *
              </span>
            </Label>
            <div className="relative">
              <Input
                id="totalPrice"
                name="totalPrice"
                type="number"
                min="0"
                step="0.01"
                value={formState.totalPrice}
                onChange={(e) => handleFieldChange('totalPrice', e.target.value)}
                onBlur={() => handleFieldBlur('totalPrice')}
                placeholder="np. 227.5"
                aria-invalid={touchedFields.has('totalPrice') && !!formErrors.totalPrice}
                aria-describedby={
                  touchedFields.has('totalPrice') && formErrors.totalPrice
                    ? 'totalPrice-error totalPrice-help'
                    : touchedFields.has('totalPrice')
                      ? 'totalPrice-help'
                      : undefined
                }
                aria-required="true"
                autoComplete="off"
                disabled={isSubmitting}
                className={`pr-12 ${touchedFields.has('totalPrice') && formErrors.totalPrice ? 'border-destructive' : ''}`}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                PLN
              </span>
            </div>
            {touchedFields.has('totalPrice') && formErrors.totalPrice && (
              <p id="totalPrice-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {formErrors.totalPrice}
              </p>
            )}
          </div>

          {/* Row 3: Input Mode | Active Field */}
          <div className="space-y-2">
            <Label htmlFor="inputMode" aria-required="true">
              Tryb wprowadzania przebiegu
              <span aria-label="Pole wymagane" className="text-destructive ml-1">
                *
              </span>
            </Label>
            <Select
              value={formState.inputMode}
              onValueChange={(value: 'odometer' | 'distance') => handleModeToggle(value)}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="inputMode"
                aria-invalid={!!formErrors.inputMode}
                className={touchedFields.has('inputMode') && formErrors.inputMode ? 'border-destructive' : ''}
              >
                <SelectValue placeholder="Wybierz tryb" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odometer">Stan licznika</SelectItem>
                <SelectItem value="distance">Przejechany dystans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {formState.inputMode === 'odometer' ? (
              <>
                <Label htmlFor="odometer" aria-required="true">
                  Stan licznika
                  <span aria-label="Pole wymagane" className="text-destructive ml-1">
                    *
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="odometer"
                    name="odometer"
                    type="number"
                    min="0"
                    step="1"
                    value={formState.odometer}
                    onChange={(e) => handleFieldChange('odometer', e.target.value)}
                    onBlur={() => handleFieldBlur('odometer')}
                    placeholder="np. 55000"
                    aria-invalid={touchedFields.has('odometer') && !!formErrors.odometer}
                    aria-describedby={
                      touchedFields.has('odometer') && formErrors.odometer
                        ? 'odometer-error'
                        : undefined
                    }
                    disabled={isSubmitting}
                    className={`pr-10 ${touchedFields.has('odometer') && formErrors.odometer ? 'border-destructive' : ''}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    km
                  </span>
                </div>
                {touchedFields.has('odometer') && formErrors.odometer && (
                  <p id="odometer-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                    {formErrors.odometer}
                  </p>
                )}
              </>
            ) : (
              <>
                <Label htmlFor="distance" aria-required="true">
                  Dystans
                  <span aria-label="Pole wymagane" className="text-destructive ml-1">
                    *
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.distance}
                    onChange={(e) => handleFieldChange('distance', e.target.value)}
                    onBlur={() => handleFieldBlur('distance')}
                    placeholder="np. 500"
                    aria-invalid={touchedFields.has('distance') && !!formErrors.distance}
                    aria-describedby={
                      touchedFields.has('distance') && formErrors.distance
                        ? 'distance-error'
                        : undefined
                    }
                    disabled={isSubmitting}
                    className={`pr-10 ${touchedFields.has('distance') && formErrors.distance ? 'border-destructive' : ''}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    km
                  </span>
                </div>
                {touchedFields.has('distance') && formErrors.distance && (
                  <p id="distance-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                    {formErrors.distance}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Validation warnings - Full Width */}
          {warnings.length > 0 && (
            <div
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 md:col-span-2"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Ostrzeżenia walidacji
                  </h4>
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

          {/* Submit error message - Full Width */}
          {formErrors.submit && (
            <div
              className="p-4 rounded-md bg-destructive/10 border border-destructive/50 md:col-span-2"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <p className="text-sm text-destructive">{formErrors.submit}</p>
            </div>
          )}

          {/* Form actions - Full Width */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 md:col-span-2"
            role="group"
            aria-label="Akcje formularza"
          >
            {/* Delete button (Left side on desktop) */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleDeleteClick}
              disabled={isSubmitting || isDeleting}
              className="w-full sm:w-auto text-destructive hover:text-destructive/90 hover:bg-destructive/10 order-3 sm:order-none"
              aria-label="Usuń tankowanie"
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Usuń
            </Button>

            {/* Save/Cancel (Right side) */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto order-1 sm:order-none">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isDeleting}
                className="w-full sm:w-auto min-w-[120px]"
                aria-label="Anuluj i wróć do listy tankowań"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full sm:w-auto min-w-[120px]"
                aria-busy={isSubmitting}
                aria-describedby={isSubmitting ? 'submitting-status' : undefined}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
              {isSubmitting && (
                <span id="submitting-status" className="sr-only">
                  Zapisywanie formularza, proszę czekać
                </span>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteFillupDialog
        isOpen={isDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
        fillupDate={originalFillupData?.date}
        error={deleteError}
      />
    </div>
  );
};

export default EditFillupView;
