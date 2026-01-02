/**
 * Test for the bug: When importing fillups to a car with initial_odometer set
 * and no existing fillups, the first fillup's fuel consumption was not calculated
 * because recalculateStats didn't consider initial_odometer.
 * 
 * Also tests: updating initial_odometer should trigger recalculation of first fillup.
 */

import { 
  mockDb, 
  resetMockDatabase, 
  seedCar,
  MockCar
} from '../utils/mockDatabase';
import { MileagePreference } from '../../../types';

// Mock dependencies
jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

import { FillupRepository } from '../../../database/FillupRepository';
import { CarRepository } from '../../../database/CarRepository';
import { ValidatedFillup } from '@justfuel/shared';

// Helper to create ValidatedFillup with required fields
const createValidatedFillup = (data: Omit<ValidatedFillup, 'sourceRowIndex'>): ValidatedFillup => ({
  ...data,
  sourceRowIndex: 0
});

describe('Import with initial_odometer', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('correctly calculates consumption for first fillup using initial_odometer as base', async () => {
    // Setup: Car with initial_odometer = 10000, no existing fillups
    const car = seedCar({ 
      name: 'Test Car', 
      initial_odometer: 10000, 
      mileage_input_preference: 'odometer' 
    });

    // Simulate import: first fillup at odometer 10500
    const importedFillups: ValidatedFillup[] = [
      createValidatedFillup({
        date: new Date('2025-12-15'),
        fuel_amount: 50,
        total_price: 300,
        odometer: 10500,
        distance_traveled: null,
        price_per_liter: 6
      })
    ];

    await FillupRepository.batchImportFillups(car.id, importedFillups);

    // Verify: distance should be 10500 - 10000 = 500
    // consumption should be (50 / 500) * 100 = 10 L/100km
    const fillups = await FillupRepository.getFillupsByCarId(car.id);
    
    expect(fillups).toHaveLength(1);
    expect(fillups[0].distance_traveled).toBe(500);
    expect(fillups[0].fuel_consumption).toBeCloseTo(10, 2);
  });

  it('correctly chains multiple imported fillups with initial_odometer as base', async () => {
    // Setup: Car with initial_odometer = 50000
    const car = seedCar({ 
      name: 'Test Car', 
      initial_odometer: 50000, 
      mileage_input_preference: 'odometer' 
    });

    // Import 3 fillups
    const importedFillups: ValidatedFillup[] = [
      createValidatedFillup({
        date: new Date('2025-12-01'),
        fuel_amount: 40,
        total_price: 240,
        odometer: 50400,
        distance_traveled: null,
        price_per_liter: 6
      }),
      createValidatedFillup({
        date: new Date('2025-12-08'),
        fuel_amount: 45,
        total_price: 270,
        odometer: 50900,
        distance_traveled: null,
        price_per_liter: 6
      }),
      createValidatedFillup({
        date: new Date('2025-12-15'),
        fuel_amount: 50,
        total_price: 300,
        odometer: 51500,
        distance_traveled: null,
        price_per_liter: 6
      })
    ];

    await FillupRepository.batchImportFillups(car.id, importedFillups);

    const fillups = await FillupRepository.getFillupsByCarId(car.id);
    // Order is DESC by date, so: 51500, 50900, 50400
    const sorted = [...fillups].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // First fillup: 50400 - 50000 = 400km, 40L -> 10 L/100km
    expect(sorted[0].distance_traveled).toBe(400);
    expect(sorted[0].fuel_consumption).toBeCloseTo(10, 2);

    // Second fillup: 50900 - 50400 = 500km, 45L -> 9 L/100km
    expect(sorted[1].distance_traveled).toBe(500);
    expect(sorted[1].fuel_consumption).toBeCloseTo(9, 2);

    // Third fillup: 51500 - 50900 = 600km, 50L -> 8.33 L/100km
    expect(sorted[2].distance_traveled).toBe(600);
    expect(sorted[2].fuel_consumption).toBeCloseTo(8.33, 2);
  });

  it('handles initial_odometer of 0 correctly (edge case)', async () => {
    // Setup: Car with initial_odometer = 0 (new car)
    const car = seedCar({ 
      name: 'New Car', 
      initial_odometer: 0, 
      mileage_input_preference: 'odometer' 
    });

    const importedFillups: ValidatedFillup[] = [
      createValidatedFillup({
        date: new Date('2025-12-15'),
        fuel_amount: 30,
        total_price: 180,
        odometer: 300,
        distance_traveled: null,
        price_per_liter: 6
      })
    ];

    await FillupRepository.batchImportFillups(car.id, importedFillups);

    const fillups = await FillupRepository.getFillupsByCarId(car.id);
    
    // 300 - 0 = 300km, 30L -> 10 L/100km
    expect(fillups[0].distance_traveled).toBe(300);
    expect(fillups[0].fuel_consumption).toBeCloseTo(10, 2);
  });

  it('recalculates first fillup when initial_odometer is updated', async () => {
    // Setup: Car with initial_odometer = 10000
    const car = seedCar({ 
      name: 'Test Car', 
      initial_odometer: 10000, 
      mileage_input_preference: 'odometer' 
    });

    // Import fillup at odometer 10500
    const importedFillups: ValidatedFillup[] = [
      createValidatedFillup({
        date: new Date('2025-12-15'),
        fuel_amount: 50,
        total_price: 300,
        odometer: 10500,
        distance_traveled: null,
        price_per_liter: 6
      })
    ];

    await FillupRepository.batchImportFillups(car.id, importedFillups);

    // Verify initial calculation: 10500 - 10000 = 500km, 50L -> 10 L/100km
    let fillups = await FillupRepository.getFillupsByCarId(car.id);
    expect(fillups[0].distance_traveled).toBe(500);
    expect(fillups[0].fuel_consumption).toBeCloseTo(10, 2);

    // Now update initial_odometer to 10200
    await CarRepository.updateCar({
      id: car.id,
      name: car.name,
      initial_odometer: 10200,
      mileage_input_preference: 'odometer' as MileagePreference,
      created_at: car.created_at
    });

    // Verify recalculated: 10500 - 10200 = 300km, 50L -> 16.67 L/100km
    fillups = await FillupRepository.getFillupsByCarId(car.id);
    expect(fillups[0].distance_traveled).toBe(300);
    expect(fillups[0].fuel_consumption).toBeCloseTo(16.67, 2);
  });
});
