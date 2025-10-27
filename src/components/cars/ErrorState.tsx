import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const getErrorMessage = (error: Error) => {
    if (error.message.includes('401') || error.message.includes('autoryzacji')) {
      return 'Sesja wygasła. Zaloguj się ponownie.';
    }
    if (error.message.includes('500')) {
      return 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Nie udało się pobrać danych. Sprawdź połączenie internetowe.';
    }
    return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
  };

  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Wystąpił błąd
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        {getErrorMessage(error)}
      </p>
      
      <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
        <RefreshCw className="h-4 w-4" />
        Spróbuj ponownie
      </Button>
    </div>
  );
};
