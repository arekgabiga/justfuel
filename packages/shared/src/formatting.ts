/**
 * Formats a date string or Date object to a locale string.
 * Uses 'pl-PL' locale for consistency across apps.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
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

import { parseISO, set } from 'date-fns';

/**
 * Injects current time components (hours, minutes, seconds, milliseconds) into a target date string (ISO).
 * Useful when the UI provides only a Date (YYYY-MM-DD) but we want to capture the creation time.
 * @param dateStr The date string (YYYY-MM-DD or ISO) to modify.
 * @param baseTime Optional base time to use instead of 'now'.
 */
export function injectTimeIntoDate(dateStr: string, baseTime: Date = new Date()): string {
  const targetDate = parseISO(dateStr);
  
  // Create a new date with targetDate's YMD and baseTime's HMSms
  const result = set(targetDate, {
    hours: baseTime.getHours(),
    minutes: baseTime.getMinutes(),
    seconds: baseTime.getSeconds(),
    milliseconds: baseTime.getMilliseconds(),
  });
  
  return result.toISOString();
}


export type SortDirection = 'asc' | 'desc';

/**
 * Detects the sort direction of a list of items with dates.
 * Assumes the list is generally sorted.
 * @param items List of items with a date property (Date object or string)
 * @returns 'desc' if generally descending (newest first), 'asc' otherwise.
 */
export function detectSortDirection(items: { date: string | Date }[]): SortDirection {
  if (items.length < 2) return 'desc'; // Default to descending as it's common for exports
  
  const first = new Date(items[0].date).getTime();
  const last = new Date(items[items.length - 1].date).getTime();
  
  return first >= last ? 'desc' : 'asc';
}

/**
 * Calculates a date with a specific offset in milliseconds.
 * Used for importing multiple rows on the same day to preserve order.
 * @param dateStr Base date string
 * @param baseTime Base time reference
 * @param index Index for offset calculation
 * @param offsetMs Offset per index in ms (default 1000ms = 1s)
 * @param direction Sort direction of the import file. If 'desc', offsets subtract time.
 */
export function getDateWithOffset(
  dateStr: string, 
  baseTime: Date, 
  index: number, 
  offsetMs: number = 1000,
  direction: SortDirection = 'asc'
): string {
    // If descending (Newest First), we want the first item to have the LATEST time
    // and subsequent items to have EARLIER times.
    const multiplier = direction === 'desc' ? -1 : 1;
    const timeWithOffset = new Date(baseTime.getTime() + (index * offsetMs * multiplier));
    return injectTimeIntoDate(dateStr, timeWithOffset);
}
