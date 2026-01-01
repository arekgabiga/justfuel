import React, { useState } from 'react';
import type { CarDetailsDTO, UpdateCarCommand } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditCarDialogProps {
  car: CarDetailsDTO;
  isOpen: boolean;
  onUpdate: (data: UpdateCarCommand) => Promise<void>;
  onCancel: () => void;
}

export const EditCarDialog: React.FC<EditCarDialogProps> = ({ car, isOpen, onUpdate, onCancel }) => {
  const [name, setName] = useState(car.name);
  const [mileagePreference, setMileagePreference] = useState<'odometer' | 'distance'>(car.mileage_input_preference as 'odometer' | 'distance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onUpdate({
        name,
        mileage_input_preference: mileagePreference,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas aktualizacji');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Edytuj samochód</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nazwa samochodu</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mileagePreference">Preferencja wprowadzania przebiegu</Label>
            <Select
              value={mileagePreference}
              onValueChange={(value) => setMileagePreference(value as 'odometer' | 'distance')}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odometer">Od licznika</SelectItem>
                <SelectItem value="distance">Od dystansu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
