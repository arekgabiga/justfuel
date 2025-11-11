import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthSuccessProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const AuthSuccess: React.FC<AuthSuccessProps> = ({ message, onDismiss, className }) => {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-green-800 dark:text-green-200',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <CheckCircle2 className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          aria-label="Zamknij komunikat sukcesu"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

