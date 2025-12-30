/**
 * Formats a date string or Date object to a locale string.
 * Uses 'pl-PL' locale for consistency across apps.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats a number as a currency string (PLN).
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return `${amount.toFixed(2)} zł`;
}

/**
 * Formats a number as fuel consumption (L/100km).
 */
export function formatConsumption(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(2)} L/100km`;
}

/**
 * Formats a number as distance (km).
 */
export function formatDistance(distance: number | null | undefined): string {
  if (distance === null || distance === undefined) return '-';
  // Use toFixed(1) for distance to match common car odometer precision if needed, or integers.
  // Using generic number formatting for now, but explicit 'km' suffix
  return `${distance.toFixed(1)} km`;
}

/**
 * Formats a number generic with 2 decimals (e.g. liters).
 */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(decimals);
}
