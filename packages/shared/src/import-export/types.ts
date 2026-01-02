
import { Car } from '../types';

export interface CsvImportRow {
  date: string;
  fuel_amount: string;
  total_price: string;
  odometer?: string;
  distance?: string;
  price_per_liter?: string;
  // potentially other fields like partial, notes, if we add them later
}

export interface ImportError {
  row: number;
  message: string;
  column?: string;
}

export type ImportWarning = {
  row: number;
  message: string;
};

export interface ValidatedFillup {
  date: Date; // Parsed Date object
  fuel_amount: number;
  total_price: number;
  odometer: number | null;
  distance_traveled: number | null;
  price_per_liter: number;
  // We might store original row index for reference
  sourceRowIndex: number;
}

export interface ParseResult {
  fillups: ValidatedFillup[];
  errors: ImportError[];
  warnings: ImportWarning[];
  uniqueDates: string[]; // ISO date strings (day resolution) for conflict detection
}

export interface ImportConfig {
  dateFormat?: string; // e.g. 'dd.MM.yyyy'
  mileage_input_preference?: 'odometer' | 'distance';
}
