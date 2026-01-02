
import { 
  mockDb, 
  resetMockDatabase, 
  getMockFillups, 
  seedCar, 
  seedFillup 
} from '../utils/mockDatabase';

// Mock dependencies
jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

import { FillupRepository } from '../../../database/FillupRepository';

describe('Recalculate Stats Logic Bug', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('correctly recalculates consumption when valid sequence is restored (Logic Only)', async () => {
    // 1. Initial State
    const car = seedCar({ name: 'Test Car', initial_odometer: 0, mileage_input_preference: 'odometer' });
    const fA = seedFillup(car.id, { date: '2025-12-01', odometer: 500, fuel_amount: 50, total_price: 250 });
    const fB = seedFillup(car.id, { date: '2025-12-07', odometer: 950, fuel_amount: 40, total_price: 280 });
    const fC = seedFillup(car.id, { date: '2025-12-10', odometer: 1500, fuel_amount: 48, total_price: 270 });

    // Initial recalculation
    await FillupRepository.recalculateStats(car.id);
    
    let fillups = await FillupRepository.getFillupsByCarId(car.id);
    let c = fillups.find(f => f.id === fC.id);
    // 1500 - 950 = 550. 48/5.5 = 8.727.
    expect(c?.fuel_consumption).toBeCloseTo(8.727, 2);

    // Krok 1 & 2: Update B to 1950, Date 12.12
    // Simulate what FillupFormScreen does: calls updateFillup
    await FillupRepository.updateFillup({
        ...fB,
        odometer: 1950,
        date: '2025-12-12T12:00:00.000Z',
        fuel_amount: 40,
        total_price: 280,
        // UI calculates these, but repo should fix them?
        // Let's pass junk values to ensure repo fixes them for THIS fillup (recalculateStats covers chain, but what about self?)
        // Actually updateFillup assumes params are correct input.
        // But let's assume UI passed calculated values for 1950
        distance_traveled: 450, // 1950 - 1500 (C) = 450
        fuel_consumption: 8.89, // 40/4.5
        price_per_liter: 7
    });

    // Check state (Order: A, C, B)
    fillups = await FillupRepository.getFillupsByCarId(car.id);
    // C (1500). Prev A (500). Dist 1000. Cons 4.8.
    c = fillups.find(f => f.id === fC.id);
    expect(c?.fuel_consumption).toBeCloseTo(4.8, 1);

    // Krok 2: Revert Date to 07.12, keep 1950.
    await FillupRepository.updateFillup({
        ...fB, // Note: fB is stale local var, we should fetch fresh or just patch ID
        id: fB.id,
        car_id: car.id,
        odometer: 1950,
        date: '2025-12-07T12:00:00.000Z',
        fuel_amount: 40,
        total_price: 280,
        // UI calculation: 1950 - 500 = 1450.
        distance_traveled: 1450,
        fuel_consumption: 2.76, 
        price_per_liter: 7
    });

    // Check state (Order: A, B, C)
    // B (1950). Prev A (500). Dist 1450. Cons 2.76.
    // C (1500). Prev B (1950). Dist -450. Cons NULL (Invalid).
    fillups = await FillupRepository.getFillupsByCarId(car.id);
    c = fillups.find(f => f.id === fC.id);
    expect(c?.fuel_consumption).toBeNull();

    // Krok 3: Fix Odometer to 950.
    await FillupRepository.updateFillup({
        ...fB,
        id: fB.id,
        car_id: car.id,
        odometer: 950, // Back to 950
        date: '2025-12-07T12:00:00.000Z',
        fuel_amount: 40,
        total_price: 280,
        // UI calculation: 950 - 500 = 450.
        distance_traveled: 450,
        fuel_consumption: 8.89,
        price_per_liter: 7
    });

    // VERIFY FINAL STATE
    // C (1500). Prev B (950). Dist 550. Cons 8.727.
    fillups = await FillupRepository.getFillupsByCarId(car.id);
    c = fillups.find(f => f.id === fC.id);
    
    // Debug log
    // Verify the final fillup C has correct values
    
    expect(c?.distance_traveled).toBe(550);
    expect(c?.fuel_consumption).not.toBeNull();
    expect(c?.fuel_consumption).toBeCloseTo(8.727, 2);
  });
});
