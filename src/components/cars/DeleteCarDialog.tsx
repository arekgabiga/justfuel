import React, { useState } from "react";
import type { CarDetailsDTO, DeleteCarCommand } from "../../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteCarDialogProps {
  car: CarDetailsDTO;
  isOpen: boolean;
  onDelete: (data: DeleteCarCommand) => Promise<void>;
  onCancel: () => void;
}

export const DeleteCarDialog: React.FC<DeleteCarDialogProps> = ({ car, isOpen, onDelete, onCancel }) => {
  const [confirmationName, setConfirmationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmButtonEnabled = confirmationName === car.name && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmationName !== car.name) {
      setError("Nazwa potwierdzenia nie pasuje do nazwy samochodu");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onDelete({ confirmation_name: confirmationName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas usuwania");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Usuń samochód</h2>
        
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Ta operacja jest nieodwracalna. Wszystkie tankowania związane z tym samochodem zostaną trwale usunięte.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Aby potwierdzić usunięcie, wpisz nazwę samochodu: <strong>{car.name}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="confirmation">Potwierdź nazwą</Label>
            <Input
              id="confirmation"
              type="text"
              value={confirmationName}
              onChange={(e) => {
                setConfirmationName(e.target.value);
                setError(null);
              }}
              placeholder={car.name}
              className="mt-1"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Anuluj
            </Button>
            <Button 
              type="submit" 
              disabled={!isConfirmButtonEnabled}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Usuwanie..." : "Usuń samochód"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

