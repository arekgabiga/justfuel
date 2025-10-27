import React from "react";
import type { CarDetailsDTO } from "../../types";
import { CarNameDisplay } from "./CarNameDisplay";
import { MileagePreferenceDisplay } from "./MileagePreferenceDisplay";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ArrowLeft } from "lucide-react";

interface CarHeaderProps {
  car?: CarDetailsDTO;
  carName?: string;
  onBack?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CarHeader: React.FC<CarHeaderProps> = ({
  car,
  carName,
  onBack,
  showActions = true,
  onEdit,
  onDelete,
}) => {
  const handleEditClick = () => {
    if (car && typeof window !== "undefined") {
      window.location.href = `/cars/${car.id}/edit`;
    } else if (onEdit) {
      onEdit();
    }
  };

  const displayName = car?.name || carName || "";

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Powrót
            </Button>
          )}
          <CarNameDisplay name={displayName} />
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              onClick={handleEditClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
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
            >
              <Trash2 className="h-4 w-4" />
              Usuń
            </Button>
          )}
        </div>
        )}
      </div>
      {car && <MileagePreferenceDisplay preference={car.mileage_input_preference} />}
    </div>
  );
};

