import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface CarActionsProps {
  carId: string;
}

export const CarActions: React.FC<CarActionsProps> = ({ carId }) => {
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (typeof window !== 'undefined') {
      window.location.href = `/cars/${carId}`;
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-700 transition-colors duration-300">
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewDetails}
        className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
      >
        <ExternalLink className="h-3 w-3" />
        Zobacz szczegóły
      </Button>
    </div>
  );
};
