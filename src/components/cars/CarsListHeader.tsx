import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowUpDown, Home } from 'lucide-react';

interface CarsListHeaderProps {
  onAddCar: () => void;
  sortBy: "name" | "created_at";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: string) => void;
}

export const CarsListHeader: React.FC<CarsListHeaderProps> = ({ 
  onAddCar, 
  sortBy, 
  sortOrder, 
  onSortChange 
}) => {
  const handleSortByChange = (value: string) => {
    onSortChange(value, sortOrder);
  };

  const handleSortOrderChange = (value: string) => {
    onSortChange(sortBy, value);
  };

  const handleHomeClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <button 
          onClick={handleHomeClick}
          className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <Home className="h-4 w-4" />
          Strona główna
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Samochody</span>
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
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Sortuj:</span>
            
            <Select value={sortBy} onValueChange={handleSortByChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data dodania</SelectItem>
                <SelectItem value="name">Nazwa</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={handleSortOrderChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Malejąco</SelectItem>
                <SelectItem value="asc">Rosnąco</SelectItem>
              </SelectContent>
            </Select>
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
    </div>
  );
};
