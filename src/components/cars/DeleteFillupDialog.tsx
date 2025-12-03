import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface DeleteFillupDialogProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
  fillupDate?: string;
  error?: string | null;
}

export const DeleteFillupDialog: React.FC<DeleteFillupDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
  fillupDate,
  error,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen || isDeleting) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-focus first button when dialog opens
  useEffect(() => {
    if (isOpen && !isDeleting) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    }
  }, [isOpen, isDeleting]);

  // Focus trap: keep focus within dialog
  useEffect(() => {
    if (!isOpen || isDeleting) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // If only one focusable element, prevent tabbing
      if (focusableElements.length === 1) {
        e.preventDefault();
        firstElement?.focus();
        return;
      }

      // Shift+Tab on first element: focus last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
        return;
      }

      // Tab on last element: focus first element
      if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
        return;
      }
    };

    dialog.addEventListener('keydown', handleTabKey);
    return () => dialog.removeEventListener('keydown', handleTabKey);
  }, [isOpen, isDeleting]);

  if (!isOpen) return null;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-fillup-dialog-title"
      aria-describedby="delete-fillup-dialog-description"
      onClick={(e) => {
        // Close dialog when clicking outside (only if not deleting)
        if (!isDeleting && e.target === e.currentTarget) {
          onCancel();
        }
      }}
      onKeyDown={(e) => {
        if (!isDeleting && e.key === 'Escape') {
          onCancel();
        }
      }}
      tabIndex={-1}
    >
      <div ref={dialogRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 id="delete-fillup-dialog-title" className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Usuń tankowanie
        </h2>

        <div id="delete-fillup-dialog-description" className="mb-6 space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Ta operacja jest nieodwracalna. Wpis o tankowaniu zostanie trwale usunięty.
          </p>
          {fillupDate && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Usuwane tankowanie z dnia: <strong>{formatDate(fillupDate)}</strong>
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Statystyki dla wszystkich kolejnych wpisów tankowań zostaną automatycznie przeliczone.
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/50"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end" role="group" aria-label="Akcje dialogu">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Anuluj usuwanie"
          >
            Anuluj
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            variant="destructive"
            aria-busy={isDeleting}
            aria-label="Potwierdź usunięcie tankowania"
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń tankowanie'}
          </Button>
        </div>
      </div>
    </div>
  );
};
