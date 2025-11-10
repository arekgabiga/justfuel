import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CarsListHeaderProps {
  onAddCar: () => void;
}

export const CarsListHeader: React.FC<CarsListHeaderProps> = ({ 
  onAddCar
}) => {

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="text-gray-900 dark:text-gray-100">Auta</span>
      </nav>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Moje Samochody
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Zarządzaj swoimi samochodami i śledź zużycie paliwa
          </p>
        </div>
        
        <Button 
          onClick={onAddCar}
          className="flex items-center gap-2"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Dodaj samochód
        </Button>
      </div>
    </div>
  );
};
