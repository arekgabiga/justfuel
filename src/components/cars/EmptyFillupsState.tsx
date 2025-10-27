import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyFillupsStateProps {
  onAddFillup?: () => void;
}

export const EmptyFillupsState: React.FC<EmptyFillupsStateProps> = ({ onAddFillup }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">⛽</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Brak tankowań
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Dodaj pierwsze tankowanie dla tego samochodu.
      </p>
      {onAddFillup && (
        <Button onClick={onAddFillup} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj tankowanie
        </Button>
      )}
    </div>
  );
};

