import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditCarForm } from '@/lib/hooks/useEditCarForm';
import { DeleteCarDialog } from './DeleteCarDialog';
import { Trash2, ArrowLeft } from 'lucide-react';
import type { DeleteCarCommand } from '../../types';

interface EditCarViewProps {
  carId: string;
}

const EditCarView: React.FC<EditCarViewProps> = ({ carId }) => {
  const {
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
    // Delete car functionality
    deleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useEditCarForm({ carId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Ładowanie danych samochodu...</div>
        </div>
      </div>
    );
  }

  if (!originalCarData) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div
          className="p-4 rounded-md bg-destructive/10 border border-destructive/50"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-destructive">{formErrors.submit || 'Nie udało się załadować danych samochodu'}</p>
        </div>
      </div>
    );
  }

  // Check if there are field validation errors (excluding submit error)
  const hasFieldValidationErrors = Object.keys(formErrors).some(
    (key) => key !== 'submit' && formErrors[key as keyof typeof formErrors]
  );

  // Check if there are changes in the form
  const hasChanges = originalCarData
    ? formState.name.trim() !== originalCarData.name ||
      formState.initialOdometer !== (originalCarData.initial_odometer ?? 0) ||
      formState.mileageInputPreference !== originalCarData.mileage_input_preference
    : false;

  // Button is disabled only when:
  // 1. Submitting is in progress
  // 2. There are field validation errors AND fields were touched
  // 3. There are no changes in the form
  const isSubmitDisabled = isSubmitting || (hasFieldValidationErrors && touchedFields.size > 0) || !hasChanges;
  const isDeleteDisabled = isSubmitting || isDeleting;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors -ml-0.5"
        aria-label="Wróć do szczegółów auta"
        disabled={isSubmitting || isDeleting}
        data-test-id="back-to-car-details-link"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Wróć do szczegółów auta</span>
      </button>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edytuj samochód</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Zmodyfikuj dane samochodu</p>
      </header>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg ring-1 ring-black/5 p-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formularz edycji samochodu"
          className="grid gap-6 grid-cols-1 md:grid-cols-2"
          data-test-id="edit-car-form"
        >
          {/* Name field */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" aria-required="true">
              Nazwa samochodu
              <span aria-label="Pole wymagane" className="text-destructive ml-1">
                *
              </span>
            </Label>
            <Input
              ref={nameInputRef}
              id="name"
              name="name"
              type="text"
              value={formState.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              placeholder="np. Moje Audi A4"
              aria-invalid={touchedFields.has('name') && !!formErrors.name}
              aria-describedby={
                touchedFields.has('name') && formErrors.name
                  ? 'name-error name-help'
                  : touchedFields.has('name')
                    ? 'name-help'
                    : undefined
              }
              aria-required="true"
              autoComplete="off"
              disabled={isSubmitting || isDeleting}
              className={touchedFields.has('name') && formErrors.name ? 'border-destructive' : ''}
              data-test-id="edit-car-name-input"
              required
            />
            <p id="name-help" className="sr-only">
              Wprowadź nazwę samochodu (1-100 znaków)
            </p>
            {touchedFields.has('name') && formErrors.name && (
              <p id="name-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Initial Odometer field */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="initialOdometer" aria-required="true">
              Początkowy stan licznika
              <span aria-label="Pole wymagane" className="text-destructive ml-1">
                *
              </span>
            </Label>
            <Input
              id="initialOdometer"
              name="initialOdometer"
              type="number"
              min="0"
              value={formState.initialOdometer}
              onChange={(e) => handleFieldChange('initialOdometer', e.target.value)}
              onBlur={() => handleFieldBlur('initialOdometer')}
              placeholder="0"
              aria-invalid={touchedFields.has('initialOdometer') && !!formErrors.initialOdometer}
              aria-describedby={
                touchedFields.has('initialOdometer') && formErrors.initialOdometer ? 'odometer-error' : undefined
              }
              aria-required="true"
              autoComplete="off"
              disabled={isSubmitting || isDeleting}
              className={touchedFields.has('initialOdometer') && formErrors.initialOdometer ? 'border-destructive' : ''}
              data-test-id="edit-car-initial-odometer-input"
              required
            />
            {touchedFields.has('initialOdometer') && formErrors.initialOdometer && (
              <p id="odometer-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {formErrors.initialOdometer}
              </p>
            )}
          </div>

          {/* Mileage input preference field */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mileageInputPreference" aria-required="true">
              Preferencja wprowadzania przebiegu
            </Label>
            <Select
              value={formState.mileageInputPreference}
              onValueChange={(value) => {
                // Read-only in edit mode
              }}
              disabled={true}
            >
              <SelectTrigger
                id="mileageInputPreference"
                name="mileageInputPreference"
                className="bg-muted text-muted-foreground opacity-100" // Ensure it looks readable but disabled
                data-test-id="edit-car-mileage-preference-select"
              >
                <SelectValue placeholder="Wybierz preferencję" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odometer">Stan licznika</SelectItem>
                <SelectItem value="distance">Przejechany dystans</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Wybrany sposób wprowadzania przebiegu jest przypisany do samochodu na stałe i nie może zostać zmieniony.
            </p>
          </div>

          {/* Submit error message */}
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

          {/* Form actions */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 md:col-span-2 border-t border-gray-100 dark:border-gray-800"
            role="group"
            aria-label="Akcje formularza"
          >
            {/* Delete button (Left) */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleDeleteClick}
              disabled={isDeleteDisabled}
              className="w-full sm:w-auto text-destructive hover:text-destructive/90 hover:bg-destructive/10 order-3 sm:order-1 sm:mr-auto"
              aria-label="Usuń samochód i wszystkie powiązane tankowania"
              data-test-id="edit-car-delete-button"
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Usuń
            </Button>

            {/* Save/Cancel container (Right) */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isDeleting}
                className="w-full sm:w-auto min-w-[120px] h-12 px-6 order-2 sm:order-1"
                aria-label="Anuluj i wróć do szczegółów samochodu"
                data-test-id="edit-car-cancel-button"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled || isDeleting}
                className="w-full sm:w-auto min-w-[120px] h-12 px-6 order-1 sm:order-2"
                aria-busy={isSubmitting}
                aria-describedby={isSubmitting ? 'submitting-status' : undefined}
                data-test-id="edit-car-save-button"
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

      {/* Delete Car Dialog */}
      {originalCarData && (
        <DeleteCarDialog
          car={originalCarData}
          isOpen={deleteDialogOpen}
          onDelete={async (data: DeleteCarCommand) => {
            await handleDeleteConfirm(data);
            // On success, handleDeleteConfirm redirects to /cars
            // No need to handle success here
          }}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default EditCarView;
