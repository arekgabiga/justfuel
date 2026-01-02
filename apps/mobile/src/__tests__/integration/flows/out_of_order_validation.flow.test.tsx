
import { 
  mockDb, 
  resetMockDatabase, 
  seedCar, 
  seedFillup 
} from '../utils/mockDatabase';

// Mock dependencies
jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

import { FillupRepository } from '../../../database/FillupRepository';

describe('Out of Order Insertion Odometer Logic', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('results in inconsistent odometers when derived from distance and inserted out of order', async () => {
    // 1. Initial State: Car with 'distance' preference
    const car = seedCar({ 
        name: 'Insertion Order Car', 
        initial_odometer: 0, 
        mileage_input_preference: 'distance' 
    });

    // 2. User adds NEWER fillup (28.12) first.
    // Since there are no previous fillups, base Odometer = 0.
    // Distance = 288.2.
    // Derived Odometer = 288.2.
    const fNew = seedFillup(car.id, { 
        date: '2025-12-28', 
        odometer: null, // Desired: UI should send null for distance pref
        distance_traveled: 288.2, 
        fuel_amount: 28, 
        total_price: 168
    });

    // 3. User adds OLDER fillup (19.12) second.
    // User provides Distance = 479.6.
    // Base Odometer? Let's assume there was pre-existing history or initial odometer was actually higher.
    // Or maybe the user just inputs it.
    // Let's assume for this test that 19.12 fillup ends up with a "Real" odometer (e.g. maybe user inputted it, or base was different).
    // Or even if it's derived from 0 base: Odometer = 479.6.
    const fOld = seedFillup(car.id, { 
        date: '2025-12-19', 
        odometer: null,
        distance_traveled: 479.6, 
        fuel_amount: 42, 
        total_price: 246
    });

    // 4. Check consistency
    // New (28.12): Odo = 288.2.
    // Old (19.12): Odo = 479.6.
    // 288.2 < 479.6.
    // This triggers "Invalid Odometer" in UI because chronological order requires Increasing Odometer.

    const fillups = await FillupRepository.getFillupsByCarId(car.id);
    const storedNew = fillups.find(f => f.id === fNew.id);
    const storedOld = fillups.find(f => f.id === fOld.id);

    // Both fillups should be null as they are distance-based cars

    // Assert that odometers are NULL (as we stopped calculating them for distance pref)
    expect(storedNew?.odometer).toBeNull();
    expect(storedOld?.odometer).toBeNull();
  });
});
