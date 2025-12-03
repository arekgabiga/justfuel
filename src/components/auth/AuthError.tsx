import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthErrorProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const AuthError: React.FC<AuthErrorProps> = ({ message, onDismiss, className }) => {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-md bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/40 text-destructive',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-md hover:bg-destructive/20 dark:hover:bg-destructive/30 transition-colors"
          aria-label="Zamknij komunikat błędu"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
