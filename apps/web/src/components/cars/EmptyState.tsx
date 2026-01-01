import React from 'react';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';

interface EmptyStateProps {
  onAddCar: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddCar }) => {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Car className="h-12 w-12 text-gray-400" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Nie masz jeszcze żadnych samochodów
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Dodaj pierwszy samochód, aby rozpocząć śledzenie zużycia paliwa i analizować swoje koszty podróży.
      </p>

      <Button onClick={onAddCar} size="lg" className="hover:scale-105 transition-transform duration-200">
        Dodaj pierwszy samochód
      </Button>
    </div>
  );
};
