import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFillup, updateFillup, listFillupsByCar } from '../fillups.service';
import type { AppSupabaseClient } from '../../../db/supabase.client';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  })),
} as unknown as AppSupabaseClient;

describe('Fillup Backfill Consistency', () => {
  const userId = 'user-123';
  const carId = 'car-123';

  // Mock Data Store
  let fillupsStore: any[] = [];
  const carStore: any = {
    id: carId,
    user_id: userId,
    initial_odometer: 0,
    mileage_input_preference: 'odometer',
  };

  beforeEach(() => {
    fillupsStore = [];
    vi.clearAllMocks();

    // Setup generic mock implementation
    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === 'cars') {
        return {
          select: () => ({
            eq: (col: string, val: any) => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: carStore, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'fillups') {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(),
          single: vi.fn(),
          insert: vi.fn(),
          update: vi.fn(),
        };

        // Implementation for INSERT
        chain.insert.mockImplementation((data: any) => {
          const newFillup = { ...data, id: `fillup-${fillupsStore.length + 1}` };
          fillupsStore.push(newFillup);
          // Sort store by date for easier looking up in tests (though DB usually does this via ORDER BY)
          fillupsStore.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          return {
            select: () => ({
              single: async () => ({ data: newFillup, error: null }),
            }),
          };
        });

        // Implementation for UPDATE
        chain.update.mockImplementation((data: any) => {
          return {
            eq: (col: string, val: any) => {
              // id match
              const idx = fillupsStore.findIndex((f) => f.id === val);
              if (idx >= 0) {
                fillupsStore[idx] = { ...fillupsStore[idx], ...data };
                return {
                  eq: () => ({
                    // car_id match
                    select: () => ({
                      single: async () => ({ data: fillupsStore[idx], error: null }),
                    }),
                  }),
                };
              }
              // fallback for chain update which might not use exact chain structure
              return {
                eq: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }),
              };
            },
          };
        });

        // Complex Mocking for Queries (Get Previous, etc)
        // We need to capture the filters applied to return correct mock data
        const filters: any = {};

        const queryChain = {
          select: () => queryChain,
          eq: (col: string, val: any) => {
            filters[col] = val;
            return queryChain;
          },
          neq: (col: string, val: any) => {
            filters[`neq_${col}`] = val;
            return queryChain;
          },
          lt: (col: string, val: any) => {
            filters[`lt_${col}`] = val;
            return queryChain;
          },
          gt: (col: string, val: any) => {
            filters[`gt_${col}`] = val;
            return queryChain;
          },
          gte: (col: string, val: any) => {
            filters[`gte_${col}`] = val;
            return queryChain;
          },
          order: (col: string, dir: any) => {
            filters['order'] = { col, dir };
            return queryChain;
          },
          limit: (val: number) => {
            filters['limit'] = val;
            return queryChain;
          },
          maybeSingle: async () => {
            const results = applyFilters(fillupsStore, filters);
            return { data: results[0] || null, error: null };
          },
          single: async () => ({ data: {}, error: null }),
          insert: chain.insert,
          update: chain.update,
          then: (onfulfilled: any) => {
            const results = applyFilters(fillupsStore, filters);
            return Promise.resolve({ data: results, error: null }).then(onfulfilled);
          },
        };

        const applyFilters = (store: any[], filters: any) => {
          let results = [...store];

          if (filters.car_id) results = results.filter((f) => f.car_id === filters.car_id);
          if (filters['lt_date']) results = results.filter((f) => f.date < filters['lt_date']);
          if (filters['gt_date']) results = results.filter((f) => f.date > filters['gt_date']);
          if (filters['gte_date']) results = results.filter((f) => f.date >= filters['gte_date']);

          // Sort
          if (filters.order) {
            const { col, dir } = filters.order;
            results.sort((a, b) => {
              if (dir.ascending === false) return new Date(b[col]).getTime() - new Date(a[col]).getTime();
              return new Date(a[col]).getTime() - new Date(b[col]).getTime();
            });
          }

          // Limit
          if (filters.limit) results = results.slice(0, filters.limit);
          return results;
        };

        // Hack to support the queryChain logic inside the main mock
        return queryChain;
      }
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({}) }) }) }) };
    });
  });

  it('should correctly calculate distance when inserting an older fillup', async () => {
    // 1. Create Future Fillup (T+10)
    // Odometer: 1500
    await createFillup(mockSupabase, userId, carId, {
      date: '2025-12-10T12:00:00Z',
      odometer: 1500,
      fuel_amount: 48,
      total_price: 270,
    });

    const futureFillup = fillupsStore[0];
    expect(futureFillup.odometer).toBe(1500);
    // Distance should be 1500 - 0 (initial) = 1500
    expect(futureFillup.distance_traveled).toBe(1500);

    // 2. Create Older Fillup (T+0)
    // Odometer: 950
    // This fillup is BEFORE the one above.
    // It should calculate distance from Initial (0) -> 950.
    // AND it should trigger recalc of the Future Fillup: 1500 - 950 = 550.

    await createFillup(mockSupabase, userId, carId, {
      date: '2025-12-07T12:00:00Z',
      odometer: 950,
      fuel_amount: 40,
      total_price: 280,
    });

    // Debug store state
    // expect(fillupsStore).toHaveLength(2);
    const olderFillup = fillupsStore.find((f) => f.odometer === 950);
    const updatedFutureFillup = fillupsStore.find((f) => f.odometer === 1500);

    // Check Older Fillup
    // Should be 950 - 0 = 950
    expect(olderFillup.distance_traveled).toBe(950);

    // Check Future Fillup
    // BUG: In current implementation, it likely won't be updated, or might be wrong?
    // Correct behavior: 1500 - 950 = 550.
    // If Logic is broken:
    // - It might stay 1500 not updated.
    expect(updatedFutureFillup.distance_traveled).toBe(550);

    // Also check consumption for future fillup
    // 48L / 5.5 (100km) = 8.72
    const expectedConsumption = (48 / 550) * 100;
    expect(updatedFutureFillup.fuel_consumption).toBeCloseTo(expectedConsumption, 2);
  });
});
