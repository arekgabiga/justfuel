import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddFillupButtonProps {
  onClick: () => void;
}

export const AddFillupButton: React.FC<AddFillupButtonProps> = ({ onClick }) => {
  return (
    <Button onClick={onClick} size="lg" className="w-full sm:w-auto">
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      Dodaj tankowanie
    </Button>
  );
};

