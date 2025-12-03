import React from 'react';
import type { CarDetailsDTO } from '../../types';
import { CarNameDisplay } from './CarNameDisplay';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ArrowLeft } from 'lucide-react';

interface CarHeaderProps {
  car?: CarDetailsDTO;
  carName?: string;
  onBack?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CarHeader: React.FC<CarHeaderProps> = ({ car, carName, onBack, showActions = true, onEdit, onDelete }) => {
  const handleEditClick = () => {
    if (car && typeof window !== 'undefined') {
      window.location.href = `/cars/${car.id}/edit`;
    } else if (onEdit) {
      onEdit();
    }
  };

  const displayName = car?.name || carName || '';

  return (
    <div className="space-y-6" data-test-id="car-header">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors -ml-0.5"
          aria-label="Wróć do listy pojazdów"
          data-test-id="back-to-cars-button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Wróć do listy pojazdów</span>
        </button>
      )}
      <div className="flex items-start justify-between">
        <CarNameDisplay name={displayName} />
        {showActions && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                onClick={handleEditClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-test-id="car-edit-button"
              >
                <Edit2 className="h-4 w-4" />
                Edytuj
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-600"
                data-test-id="car-delete-button"
              >
                <Trash2 className="h-4 w-4" />
                Usuń
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
