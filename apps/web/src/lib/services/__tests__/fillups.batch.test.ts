
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { batchCreateFillups } from '../fillups.service';
import type { CreateFillupCommand } from '@/types';
import { createSupabaseServerInstance } from '@/db/supabase.client';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/db/supabase.client', () => ({
  createSupabaseServerInstance: vi.fn(() => mockSupabase),
}));

describe('batchCreateFillups Integration Logic', () => {
  const userId = 'user-123';
  const carId = 'car-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate statistics for odometer-based import', async () => {
    // 1. Mock Car (Odometer preference)
    const mockCar = {
      id: carId,
      initial_odometer: 0,
      mileage_input_preference: 'odometer',
      user_id: userId,
    };

    // 2. Mock input data (from User's CSV example, reversed to chronological for processing ideally, 
    // but the function handles sorting)
    // CSV:
    // 10.12.2025, 1500km
    // 07.12.2025, 950km
    // 01.12.2025, 500km
    const inputFillups: CreateFillupCommand[] = [
      { date: '2025-12-01', fuel_amount: 50, total_price: 250, odometer: 500 },
      { date: '2025-12-07', fuel_amount: 40, total_price: 280, odometer: 950 },
      { date: '2025-12-10', fuel_amount: 48, total_price: 270, odometer: 1500 },
    ];

    // 3. Mock Supabase Responses
    const mockSelectBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockCar, error: null }),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }), // Add update here
    };
    
    // We need to capture what is passed to update to verify the logic "update"
    const updateSpy = vi.spyOn(mockSelectBuilder, 'update');
    // We already have mocked 'update' returning 'eq'... we need to capture the arguments passed to update()

    mockSupabase.from.mockImplementation((table) => {
        if (table === 'cars') return mockSelectBuilder;
        if (table === 'fillups') {
            return {
                ...mockSelectBuilder,
                select: vi.fn().mockImplementation((cols) => {
                    return {
                        ...mockSelectBuilder,
                        eq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue({
                            data: [
                                { id: 'f1', date: '2025-12-01', odometer: 500, fuel_amount: 50, distance_traveled: null, fuel_consumption: null },
                                { id: 'f2', date: '2025-12-07', odometer: 950, fuel_amount: 40, distance_traveled: null, fuel_consumption: null },
                                { id: 'f3', date: '2025-12-10', odometer: 1500, fuel_amount: 48, distance_traveled: null, fuel_consumption: null },
                            ],
                            error: null
                        })
                    }
                }),
                // update returns a builder that has eq()...
                update: vi.fn().mockImplementation((data) => {
                    return {
                        eq: vi.fn().mockResolvedValue({ error: null })
                    }
                })
            }
        }
        return mockSelectBuilder;
    });
    
    // We need to re-spy on the implementation we just returned above? 
    // Actually the mockSupabase.from is called inside the function.
    // Let's capture the update spy from the return value of the mock.
    // It's easier to verify via the mock calls if we structure it right.
    
    // Let's reset the mockSupabase.from implementation to use a consistent object we can spy on.
    const fillupsBuilder = {
        ...mockSelectBuilder,
        select: vi.fn().mockImplementation(() => ({
            ...mockSelectBuilder, 
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: [
                    { id: 'f1', date: '2025-12-01', odometer: 500, fuel_amount: 50, distance_traveled: null, fuel_consumption: null },
                    { id: 'f2', date: '2025-12-07', odometer: 950, fuel_amount: 40, distance_traveled: null, fuel_consumption: null },
                    { id: 'f3', date: '2025-12-10', odometer: 1500, fuel_amount: 48, distance_traveled: null, fuel_consumption: null },
                ],
                error: null
            })
        })),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        insert: vi.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from.mockImplementation((table) => {
        if (table === 'fillups') return fillupsBuilder;
        return mockSelectBuilder;
    });

    // 4. Run Batch Import
    await batchCreateFillups(mockSupabase as any, userId, carId, inputFillups);

    // 5. Verify Update Calls
    // We expect 3 update calls (one for each fillup in the chain)
    expect(fillupsBuilder.update).toHaveBeenCalledTimes(3);
    
    const calls = fillupsBuilder.update.mock.calls;
    
    // f1 update
    const f1Update = calls.find(args => args[0].distance_traveled === 500);
    expect(f1Update).toBeDefined();
    expect(f1Update![0].fuel_consumption).toBeCloseTo(10.0, 1);

    // f2 update (950 - 500 = 450)
    const f2Update = calls.find(args => args[0].distance_traveled === 450);
    expect(f2Update).toBeDefined();
    expect(f2Update![0].fuel_consumption).toBeCloseTo(8.89, 1);

    // f3 update (1500 - 950 = 550)
    const f3Update = calls.find(args => args[0].distance_traveled === 550);
    expect(f3Update).toBeDefined();
    expect(f3Update![0].fuel_consumption).toBeCloseTo(8.73, 1);
  });

  it('should calculate statistics for distance-based import', async () => {
    // 1. Mock Car (Distance preference)
    const mockCar = {
      id: carId,
      initial_odometer: 0,
      mileage_input_preference: 'distance',
      user_id: userId,
    };

    // 2. Mock input data
    // CSV with direct distance input:
    // 2025-12-01: 500km
    // 2025-12-07: 400km
    // 2025-12-10: 550km
    const inputFillups: any[] = [
      { date: '2025-12-01', fuel_amount: 50, total_price: 250, distance_traveled: 500 },
      { date: '2025-12-07', fuel_amount: 40, total_price: 280, distance_traveled: 400 },
      { date: '2025-12-10', fuel_amount: 48, total_price: 270, distance_traveled: 550 },
    ];

    // 3. Mock Supabase Responses
    // Reuse similar structure but ensure car returns 'distance' preference
    const mockSelectBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockCar, error: null }),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    
    // Create verify-ready spies
    const fillupsBuilder = {
        ...mockSelectBuilder,
        select: vi.fn().mockImplementation(() => ({
            ...mockSelectBuilder, 
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: [
                    { id: 'f1', date: '2025-12-01', odometer: null, fuel_amount: 50, distance_traveled: 500, fuel_consumption: null },
                    { id: 'f2', date: '2025-12-07', odometer: null, fuel_amount: 40, distance_traveled: 400, fuel_consumption: null },
                    { id: 'f3', date: '2025-12-10', odometer: null, fuel_amount: 48, distance_traveled: 550, fuel_consumption: null },
                ],
                error: null
            }),
            // For the distance mode simple select (no order chained immediately sometimes, or it awaits promise directly)
            then: (resolve: any) => resolve({
                 data: [
                    { id: 'f1', date: '2025-12-01', odometer: null, fuel_amount: 50, distance_traveled: 500, fuel_consumption: null },
                    { id: 'f2', date: '2025-12-07', odometer: null, fuel_amount: 40, distance_traveled: 400, fuel_consumption: null },
                    { id: 'f3', date: '2025-12-10', odometer: null, fuel_amount: 48, distance_traveled: 550, fuel_consumption: null },
                ],
                error: null
            })
        })),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        insert: vi.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from.mockImplementation((table) => {
        if (table === 'cars') return mockSelectBuilder;
        if (table === 'fillups') return fillupsBuilder;
        return mockSelectBuilder;
    });

    // 4. Run Batch Import
    await batchCreateFillups(mockSupabase as any, userId, carId, inputFillups);

    // 5. Verify Update Calls - Check calculations
    expect(fillupsBuilder.update).toHaveBeenCalledTimes(3);
    const calls = fillupsBuilder.update.mock.calls;
    
    // f1 update (500km, 50L) -> 10.0
    const f1Update = calls.find(args => args[0].distance_traveled === 500); // distance shouldn't change, but it might be passed
    // Actually batchCreateFillups calls update(stats, ...)
    // For distance preference, distance_traveled is already there, but statistics recalculation recalculates consumption.
    
    // Find calls by validating fuel consumption values
    const consumption10 = calls.find(args => Math.abs(args[0].fuel_consumption - 10.0) < 0.1);
    expect(consumption10).toBeDefined();

    // f2 update (400km, 40L) -> 10.0
    const consumption10_2 = calls.filter(args => Math.abs(args[0].fuel_consumption - 10.0) < 0.1);
    expect(consumption10_2.length).toBeGreaterThanOrEqual(1);

    // f3 update (550km, 48L) -> 8.72
    const consumption87 = calls.find(args => Math.abs(args[0].fuel_consumption - 8.72) < 0.1);
    expect(consumption87).toBeDefined();
  });
});
