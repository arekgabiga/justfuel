
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

describe('Distance Input Preference Logic', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('preserves distance_traveled and consumption for distance-based car when recalculating', async () => {
    // 1. Initial State: Car with 'distance' preference
    const car = seedCar({ 
        name: 'Distance Car', 
        initial_odometer: 0, 
        mileage_input_preference: 'distance' 
    });

    // Add fillups. Note: odometer might be NULL in reality if schema allowed, but for now we might put junk or 0.
    // However, if we put 0, existing logic might see "0 - 0 = 0" and break consumption.
    // Let's assume the user puts valid distances.
    // Fillup A: 500km traveled.
    const fA = seedFillup(car.id, { 
        date: '2025-12-01', 
        odometer: null,
        distance_traveled: 500, 
        fuel_amount: 50, 
        total_price: 250,
        fuel_consumption: 10 // 50/5
    });

    // Fillup B: 400km traveled.
    const fB = seedFillup(car.id, { 
        date: '2025-12-07', 
        odometer: null, 
        distance_traveled: 400, 
        fuel_amount: 40, 
        total_price: 280,
        fuel_consumption: 10 // 40/4
    });

    // Fillup C: 450km traveled.
    const fC = seedFillup(car.id, { 
        date: '2025-12-10', 
        odometer: null, 
        distance_traveled: 450, 
        fuel_amount: 36, 
        total_price: 270,
        fuel_consumption: 8 // 36/4.5
    });

    // Verify initial mock state is correct
    let fillups = await FillupRepository.getFillupsByCarId(car.id);
    expect(fillups.find(f => f.id === fB.id)?.distance_traveled).toBe(400);

    // 2. Trigger Recalculation by updating Fillup B (e.g. changing price)
    await FillupRepository.updateFillup({
        ...fB,
        total_price: 300 // Price change shouldn't affect stats but triggers recalculate
    });

    // 3. Verify that distance_traveled is NOT overwritten by odometer diff
    // Current bug: 
    //   It will likely take odometer(0) - prev_odometer(0) = 0.
    //   distance -> 0.
    //   consumption -> null or infinity.
    fillups = await FillupRepository.getFillupsByCarId(car.id);
    
    const updatedA = fillups.find(f => f.id === fA.id);
    const updatedB = fillups.find(f => f.id === fB.id);
    const updatedC = fillups.find(f => f.id === fC.id);

    // Debug
    console.log('Updated B:', JSON.stringify(updatedB, null, 2));

    // Assertions
    // A should arguably stay 500 (since it has no previous, logic might keep it)
    expect(updatedA?.distance_traveled).toBe(500);

    // B should stay 400. If bug exists, it might be 0.
    expect(updatedB?.distance_traveled).toBe(400);
    expect(updatedB?.fuel_consumption).toBe(10);

    // C should stay 450.
    expect(updatedC?.distance_traveled).toBe(450);
    expect(updatedC?.fuel_consumption).toBe(8);
  });
});
