import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppSupabaseClient } from '../../../db/supabase.client';
import { updateFillup } from '../fillups.service';

/**
 * Tests to verify data consistency across fillups when edits occur.
 * Specifically checks if subsequent fillups are recalculated when a previous one changes.
 */
describe('fillups.service consistency', () => {
  let mockSupabase: AppSupabaseClient;
  const userId = 'user-123';
  const carId = 'car-123';

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as AppSupabaseClient;
  });

  it('should recalculate subsequent fillups when odometer is updated', async () => {
    // Arrange
    const fillupId = 'fillup-1';

    // Original state:
    // f1: odo 50000 -> 50500 (dist 500)
    // f2: odo 50500 -> 51000 (dist 500)

    // Update f1 odometer to 50600 (+100)
    // Expected result:
    // f1: distance 600 (was 500)
    // f2: distance 400 (was 500), because it starts from f1's new end odometer (50600) to its own end (51000)

    const existingFillup = {
      id: fillupId,
      car_id: carId,
      date: '2024-01-01',
      fuel_amount: 50,
      total_price: 250,
      odometer: 50500,
      distance_traveled: 500,
      fuel_consumption: 10.0,
      price_per_liter: 5.0,
    };

    const nextFillup = {
      id: 'fillup-2',
      car_id: carId,
      date: '2024-01-15', // Later date
      fuel_amount: 50,
      total_price: 250,
      odometer: 51000,
      distance_traveled: 500, // Calculated from 51000 - 50500
      fuel_consumption: 10.0,
      price_per_liter: 5.0,
    };

    const mockCar = { id: carId, initial_odometer: 50000, mileage_input_preference: 'odometer' };

    // Updated f1 returned from DB after update
    const updatedFillup = {
      ...existingFillup,
      odometer: 50600,
      distance_traveled: 600,
    };

    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'fillups') {
        const calls = vi.mocked(mockSupabase.from).mock.calls.filter((c) => c[0] === 'fillups').length;

        // 1. Fetch existing fillup (updateFillup -> getFillupById/select)
        if (calls === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: existingFillup, error: null }),
                }),
              }),
            }),
          } as any;
        }

        // 2. Fetch previous fillup (for calculating new distance of f1)
        if (calls === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  lt: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: { odometer: 50000, date: '2023-12-01' },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        // 3. Update current fillup (f1)
        if (calls === 3) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: updatedFillup, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        // 4. Fetch subsequent fillups (should happen to recalc chain)
        if (calls === 4) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  // .order is the end of this chain as written in service
                  data: [nextFillup],
                  error: null,
                }),
              }),
            }),
          } as any;
        }

        // 5. Update subsequent fillup (f2)
        // This is what we primarily want to verify is called
        if (calls === 5) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }

        return {} as any;
      }

      if (table === 'cars') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockCar, error: null }),
                }),
              }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    // Act
    const input = { odometer: 50600 }; // Increase odometer by 100
    const result = await updateFillup(mockSupabase, userId, carId, fillupId, input);

    // Assert
    expect(result.odometer).toBe(50600);
    // This expectation will FAIL because the current implementation hardcoded returns 1
    expect(result.updated_entries_count).toBeGreaterThan(1);
  });
});
