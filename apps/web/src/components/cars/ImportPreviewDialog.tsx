import React from 'react';
import { Button } from '@/components/ui/button';
import type { ValidatedFillup, ImportError } from '@justfuel/shared';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  fillups: ValidatedFillup[];
  errors: ImportError[];
  isSubmitting?: boolean;
}

export const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  fillups,
  errors,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const hasErrors = errors.length > 0;
  // If "All-or-Nothing" validation strategy is used, then strictly speaking all are invalid if there is at least one error.
  // But the UI says "Found X correct entries and Y errors".
  // `fillups` contains ALL parsed rows (validated or not), or only valid ones?
  // Looking at the previous context/code not fully visible here for caller, but usually `fillups` are all parsed rows.
  // If `fillups` contains all rows including invalid ones, then validCount should be total - errors.
  // If `fillups` only contains valid rows, then validCount is correct.
  // BUT the user said "Found 6 correct entries and 6 errors" for a file with 6 rows.
  // This implies `fillups.length` is 6 and `errors.length` is 6.
  // So `fillups` contains everything.
  const validCount = Math.max(0, fillups.length - errors.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {hasErrors ? <XCircle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
            Import {hasErrors ? 'zablokowany' : 'gotowy'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Znaleziono {validCount} poprawnych wpisów i {errors.length} błędów.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6 space-y-6 overflow-y-auto">
          {/* Errors Section */}
          {hasErrors && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-red-700 dark:text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Błędy uniemożliwiające import ({errors.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400 max-h-40 overflow-y-auto">
                {errors.map((err, idx) => (
                  <li key={idx}>
                    <span className="font-mono">Wiersz {err.row}:</span> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {validCount > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Podgląd danych (pierwsze 50)</h3>
              <div className="border rounded-md overflow-hidden dark:border-gray-700">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Paliwo (L)</th>
                        <th className="px-6 py-3">Koszt</th>
                        <th className="px-6 py-3">Licznik</th>
                        <th className="px-6 py-3">Dystans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fillups.slice(0, 50).map((f, i) => (
                        <tr key={i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                          <td className="px-6 py-4">
                            {f.date instanceof Date
                              ? f.date.toLocaleDateString()
                              : new Date(f.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">{f.fuel_amount.toFixed(2)}</td>
                          <td className="px-6 py-4">{f.total_price.toFixed(2)}</td>
                          <td className="px-6 py-4">{f.odometer ?? '-'}</td>
                          <td className="px-6 py-4">{f.distance_traveled ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
          <Button
            onClick={onConfirm}
            disabled={hasErrors || validCount === 0 || isSubmitting}
            className={hasErrors ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSubmitting ? 'Importowanie...' : 'Importuj dane'}
          </Button>
        </div>
      </div>
    </div>
  );
};
