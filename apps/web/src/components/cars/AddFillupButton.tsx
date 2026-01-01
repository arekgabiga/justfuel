import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddFillupButtonProps {
  onClick: () => void;
}

export const AddFillupButton: React.FC<AddFillupButtonProps> = ({ onClick }) => {
  return (
    <>
      {/* Desktop Button */}
      <Button onClick={onClick} size="lg" className="hidden sm:inline-flex w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Dodaj tankowanie
      </Button>

      {/* Mobile FAB */}
      <Button
        onClick={onClick}
        size="icon"
        className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 animate-in fade-in zoom-in duration-300"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">Dodaj tankowanie</span>
      </Button>
    </>
  );
};
