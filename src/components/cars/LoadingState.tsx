import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Ładowanie samochodów...
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400">
        Pobieranie danych z serwera
      </p>
    </div>
  );
};
