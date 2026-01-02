
import Papa from 'papaparse';
import { parse, isValid, startOfDay, format } from 'date-fns';
import { CsvImportRow, ImportConfig, ParseResult, ValidatedFillup, ImportError } from './types';

const REQUIRED_HEADERS = ['date', 'fuel_amount', 'total_price'];
const DATE_FORMAT = 'dd.MM.yyyy';

export const parseCsv = async (fileContent: string, config: ImportConfig = {}): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse<CsvImportRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: ImportError[] = [];
        const warnings: any[] = [];
        
        // 1. Validate Headers
        const headers = results.meta.fields || [];
        const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
        
        const requiredHeaders = [...REQUIRED_HEADERS];
        if (config.mileage_input_preference === 'odometer') {
            requiredHeaders.push('odometer');
        } else if (config.mileage_input_preference === 'distance') {
            requiredHeaders.push('distance');
        }

        const missingHeaders = requiredHeaders.filter(h => {
             // We use includes to match aliases like 'przebieg' or 'dystans' via normalizeKeys logic
             // But for header validation, we should check if ANY of the allowed aliases for a required field exist.
             if (h === 'odometer') {
                 return !normalizedHeaders.some(nh => nh.includes('odometer') || nh.includes('przebieg'));
             }
             if (h === 'distance') {
                 return !normalizedHeaders.some(nh => nh.includes('distance') || nh.includes('dystans'));
             }
             if (h === 'fuel_amount') {
                 return !normalizedHeaders.some(nh => nh.includes('fuel_amount') || nh.includes('amount') || nh.includes('liters'));
             }
             if (h === 'total_price') {
                 return !normalizedHeaders.some(nh => nh.includes('total_price') || nh.includes('total') || nh.includes('cost'));
             }
             return !normalizedHeaders.some(nh => nh.includes(h.toLowerCase()));
        });

        if (missingHeaders.length > 0) {
            resolve({
                fillups: [],
                errors: [{ row: 0, message: `Brakujące wymagane kolumny: ${missingHeaders.join(', ')}` }],
                warnings: [],
                uniqueDates: []
            });
            return;
        }

        // 2. Parse Rows
        const parsedFillups: ValidatedFillup[] = [];
        const uniqueDatesSet = new Set<string>();

        results.data.forEach((rowData, index) => {
           const rowNumber = index + 1; // 1-based index (header is 0 usually, but let's say user sees 1-based)
           const row = normalizeKeys(rowData);
           
           // Basic Field Validation
           if (!row.date) {
               errors.push({ row: rowNumber, message: 'Missing Date' });
               return;
           }
           if (!row.fuel_amount) {
               errors.push({ row: rowNumber, message: 'Missing Fuel Amount' });
               return;
           }
           if (!row.total_price) {
               errors.push({ row: rowNumber, message: 'Missing Total Price' });
               return;
           }

           // Parse Date
           const parsedDate = parse(row.date.trim(), DATE_FORMAT, new Date());
           if (!isValid(parsedDate)) {
               errors.push({ row: rowNumber, message: `Invalid Date format. Expected ${DATE_FORMAT}` });
               return;
           }

           // Format date to ISO for unique check and storage
           const isoDate = format(parsedDate, 'yyyy-MM-dd'); // Day resolution
           uniqueDatesSet.add(isoDate);

           // Parse Numbers
           const fuelAmount = parseFloat(row.fuel_amount.replace(',', '.'));
           const totalPrice = parseFloat(row.total_price.replace(',', '.'));
           
           if (isNaN(fuelAmount) || fuelAmount < 0) {
               errors.push({ row: rowNumber, message: 'Invalid Fuel Amount' });
               return;
           }
           if (isNaN(totalPrice) || totalPrice < 0) {
              errors.push({ row: rowNumber, message: 'Invalid Total Price' });
              return;
           }

           // Optional / Calculation fields
           let odometer: number | null = null;
           if (row.odometer) {
               odometer = parseFloat(row.odometer.replace(',', '.'));
               if (isNaN(odometer)) {
                   errors.push({ row: rowNumber, message: 'Invalid Odometer value' });
                   return;
               }
           }

           let distance: number | null = null;
           if (row.distance) {
               distance = parseFloat(row.distance.replace(',', '.'));
               if (isNaN(distance)) {
                   errors.push({ row: rowNumber, message: 'Invalid Distance value' });
                   return;
               }
           }
            
           // Recalculate price_per_liter
           const pricePerLiter = fuelAmount > 0 ? totalPrice / fuelAmount : 0;

           parsedFillups.push({
               date: parsedDate, // Keep as Date object for sorting if needed, or string
               fuel_amount: fuelAmount,
               total_price: totalPrice,
               odometer: odometer,
               distance_traveled: distance,
               price_per_liter: pricePerLiter,
               sourceRowIndex: rowNumber
           });
        });

        resolve({
             fillups: parsedFillups,
             errors: errors,
             warnings: warnings,
             uniqueDates: Array.from(uniqueDatesSet)
        });
      },
      error: (error: Error) => {
          resolve({
              fillups: [],
              errors: [{ row: 0, message: error.message }],
              warnings: [],
              uniqueDates: []
          });
      }
    });
  });
};

const normalizeKeys = (row: any): CsvImportRow => {
    const newRow: any = {};
    Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        const value = row[key];
        
        if (lowerKey.includes('date')) newRow.date = value;
        else if (lowerKey === 'fuel_amount' || lowerKey.includes('amount') || lowerKey.includes('liters')) newRow.fuel_amount = value;
        else if (lowerKey === 'total_price' || lowerKey.includes('total') || lowerKey.includes('cost')) newRow.total_price = value;
        else if (lowerKey.includes('odometer') || lowerKey.includes('przebieg')) newRow.odometer = value;
        else if (lowerKey.includes('distance') || lowerKey.includes('dystans')) newRow.distance = value;
        else if (lowerKey.includes('price') && lowerKey.includes('liter')) newRow.price_per_liter = value;
    });
    return newRow as CsvImportRow;
};

export const generateCsv = (fillups: any[]): string => {
    // We map internal fields to CSV headers
    const rows = fillups.map(f => ({
        date: f.date ? format(new Date(f.date), DATE_FORMAT) : '',
        fuel_amount: f.fuel_amount,
        total_price: f.total_price,
        odometer: f.odometer,
        distance: f.distance_traveled,
        price_per_liter: f.price_per_liter,
        fuel_consumption: f.fuel_consumption
    }));
    
    return Papa.unparse(rows, {
        columns: ['date', 'fuel_amount', 'total_price', 'odometer', 'distance', 'price_per_liter', 'fuel_consumption']
    });
};
