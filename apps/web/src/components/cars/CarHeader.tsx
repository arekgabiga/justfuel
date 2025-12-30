import React, { useState } from 'react';
import type { CarDetailsDTO } from '../../types';
import { CarNameDisplay } from './CarNameDisplay';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ArrowLeft, EllipsisVertical } from 'lucide-react';

interface CarHeaderProps {
  car?: CarDetailsDTO;
  carName?: string;
  onBack?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CarHeader: React.FC<CarHeaderProps> = ({ car, carName, onBack, showActions = true, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleEditClick = () => {
    setShowMenu(false);
    if (car && typeof window !== 'undefined') {
      window.location.href = `/cars/${car.id}/edit`;
    } else if (onEdit) {
      onEdit();
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    if (onDelete) onDelete();
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
          <span className="hidden md:inline">Wróć do listy pojazdów</span>
        </button>
      )}
      <div className="flex items-start justify-between relative">
        <CarNameDisplay name={displayName} />
        {showActions && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Opcje pojazdu"
              className="rounded-full"
              data-test-id="car-options-menu-button"
            >
              <EllipsisVertical className="h-5 w-5 text-gray-500" />
            </Button>

            {showMenu && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 w-full h-full cursor-default bg-transparent"
                  onClick={() => setShowMenu(false)}
                  aria-label="Zamknij menu"
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                  {onEdit && (
                    <button
                      onClick={handleEditClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      data-test-id="car-edit-button"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edytuj pojazd
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                      data-test-id="car-delete-button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Usuń pojazd
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
