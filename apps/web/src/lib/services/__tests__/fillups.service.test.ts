import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppSupabaseClient } from '../../../db/supabase.client';
import type { CreateFillupCommand, UpdateFillupCommand, PaginatedFillupsResponseDTO } from '../../../types';
import { listFillupsByCar, getFillupById, createFillup, updateFillup, deleteFillup } from '../fillups.service';

/**
 * TODO: Refactor mocking strategy
 *
 * Current implementation uses call-count-based conditional mocking which is fragile.
 * If the service implementation changes the order of database calls, tests will break
 * even if the business logic is correct.
 *
 * Recommended approaches:
 * 1. Use separate mock instances for each expected call
 * 2. Use a library like msw (Mock Service Worker) for more robust HTTP/API mocking
 * 3. Create explicit mock builder functions that don't rely on call order
 */

// Helper functions to test encoding/decoding (not exported, but testable via service behavior)
describe('fillups.service', () => {
  let mockSupabase: AppSupabaseClient;
  const userId = 'user-123';
  const carId = 'car-123';

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as AppSupabaseClient;
  });

  describe('listFillupsByCar', () => {
    it('should list fillups with default parameters', async () => {
      // Arrange
      const mockFillups = [
        {
          id: 'fillup-1',
          car_id: carId,
          date: '2024-01-15',
          fuel_amount: 50,
          total_price: 250,
          odometer: 50500,
          distance_traveled: 500,
          fuel_consumption: 10.0,
          price_per_liter: 5.0,
        },
      ];

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'fillups') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.length;

          // First call: fetch fillups
          if (calls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          // Second call: count query
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await listFillupsByCar(mockSupabase, userId, carId, {});

      // Assert
      expect(result.fillups).toHaveLength(1);
      expect(result.pagination.total_count).toBe(1);
      expect(result.pagination.has_more).toBe(false);
    });

    it('should return empty array when car has no fillups', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'fillups') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'cars') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: carId }, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await listFillupsByCar(mockSupabase, userId, carId, {});

      // Assert
      expect(result.fillups).toEqual([]);
      expect(result.pagination.total_count).toBe(0);
    });

    it('should throw error for non-existent car', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'fillups') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'cars') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act & Assert
      await expect(listFillupsByCar(mockSupabase, userId, 'non-existent-car', {})).rejects.toThrow('Car not found');
    });

    it('should throw error on invalid cursor', async () => {
      // Act & Assert
      await expect(listFillupsByCar(mockSupabase, userId, carId, { cursor: 'invalid-cursor' })).rejects.toThrow(
        'Invalid cursor format'
      );
    });
  });

  describe('getFillupById', () => {
    const fillupId = 'fillup-123';

    it('should return fillup by ID', async () => {
      // Arrange
      const mockFillup = {
        id: fillupId,
        car_id: carId,
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 50500,
        distance_traveled: 500,
        fuel_consumption: 10.0,
        price_per_liter: 5.0,
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockFillup, error: null }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getFillupById(mockSupabase, userId, carId, fillupId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(fillupId);
    });

    it('should return null for non-existent fillup', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getFillupById(mockSupabase, userId, carId, 'non-existent-fillup');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createFillup', () => {
    it('should create first fillup with odometer method', async () => {
      // Arrange
      const input: CreateFillupCommand = {
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 50500,
      };
      const mockCar = { id: carId, initial_odometer: 50000 };
      const mockCreatedFillup = {
        id: 'fillup-123',
        car_id: carId,
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 50500,
        distance_traveled: 500,
        fuel_consumption: 10.0,
        price_per_liter: 5.0,
      };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
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
        if (table === 'fillups') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.filter((c) => c[0] === 'fillups').length;

          if (calls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lt: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          // Second call: insert new fillup
          if (calls === 2) {
             return {
               insert: vi.fn().mockReturnValue({
                 select: vi.fn().mockReturnValue({
                   single: vi.fn().mockResolvedValue({ data: mockCreatedFillup, error: null }),
                 }),
               }),
             } as any;
          }
           // Third call: chain recalculation
           if (calls === 3) {
             return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                }),
             } as any;
           }
          return {} as any; // fallback
        }
        return {} as any;
      });

      // Act
      const result = await createFillup(mockSupabase, userId, carId, input);

      // Assert
      expect(result.id).toBe('fillup-123');
      expect(result.distance_traveled).toBe(500);
      expect(result.fuel_consumption).toBe(10.0);
    });

    it('should create fillup with distance method', async () => {
      // Arrange
      const input: CreateFillupCommand = {
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        distance: 500,
      };
      const mockCar = { id: carId, initial_odometer: 50000 };
      const mockPreviousFillup = { odometer: 50000, date: '2024-01-01' };
      const mockCreatedFillup = {
        id: 'fillup-123',
        car_id: carId,
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 50500,
        distance_traveled: 500,
        fuel_consumption: 10.0,
        price_per_liter: 5.0,
      };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { ...mockCar, mileage_input_preference: 'distance' }, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'fillups') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.filter((c) => c[0] === 'fillups').length;

          // First call: get previous fillup
          if (calls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lt: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                       limit: vi.fn().mockReturnValue({
                         maybeSingle: vi.fn().mockResolvedValue({ data: mockPreviousFillup, error: null }),
                       }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          // Second call: insert
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockCreatedFillup, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await createFillup(mockSupabase, userId, carId, input);

      // Assert
      expect(result.id).toBe('fillup-123');
      expect(result.odometer).toBe(50500);
    });

    it('should generate warning for odometer going backwards', async () => {
      // Arrange
      const input: CreateFillupCommand = {
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 49500, // Less than previous odometer
      };
      const mockCar = { id: carId, initial_odometer: 50000 };
      const mockPreviousFillup = { odometer: 50000, date: '2024-01-01' };
      const mockCreatedFillup = {
        id: 'fillup-123',
        car_id: carId,
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 49500,
        distance_traveled: -500,
        fuel_consumption: null,
        price_per_liter: 5.0,
      };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
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
        if (table === 'fillups') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.filter((c) => c[0] === 'fillups').length;

          if (calls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lt: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                       limit: vi.fn().mockReturnValue({
                         maybeSingle: vi.fn().mockResolvedValue({ data: mockPreviousFillup, error: null }),
                       }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          if (calls === 2) {
             return {
                insert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockCreatedFillup, error: null }),
                  }),
                }),
             } as any;
          }
           // Third call: chain recalculation
           if (calls === 3) {
             return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                }),
             } as any;
           }
          return {} as any;
        }
        return {} as any;
      });

      // Act
      const result = await createFillup(mockSupabase, userId, carId, input);

      // Assert
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0].field).toBe('odometer');
    });

    it('should throw error for non-existent car', async () => {
      // Arrange
      const input: CreateFillupCommand = {
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 50500,
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(createFillup(mockSupabase, userId, 'non-existent-car', input)).rejects.toThrow(
        'Car not found or does not belong to user'
      );
    });
  });

  describe('updateFillup', () => {
    const fillupId = 'fillup-123';

    it('should update fillup fuel amount', async () => {
      // Arrange
      const input: UpdateFillupCommand = { fuel_amount: 55 };
      const existingFillup = {
        id: fillupId,
        car_id: carId,
        date: '2024-01-15',
        fuel_amount: 50,
        total_price: 250,
        odometer: 50500,
        distance_traveled: 500,
        fuel_consumption: 10.0,
        price_per_liter: 5.0,
      };
      const mockCar = { id: carId, initial_odometer: 50000 };
      const updatedFillup = { ...existingFillup, fuel_amount: 55, price_per_liter: 4.545 };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'fillups') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.filter((c) => c[0] === 'fillups').length;

          // First call: fetch existing fillup
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
          // Second call: update the fillup
          if (calls === 2) {
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
          // Third call: refresh/recalculate logic (fetch all fillups)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }), 
              }),
            }),
          } as any;
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
      const result = await updateFillup(mockSupabase, userId, carId, fillupId, input);

      // Assert
      expect(result.fuel_amount).toBe(55);
      expect(result.updated_entries_count).toBe(1);
    });

    it('should throw error for non-existent fillup', async () => {
      // Arrange
      const input: UpdateFillupCommand = { fuel_amount: 55 };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(updateFillup(mockSupabase, userId, carId, 'non-existent-fillup', input)).rejects.toThrow(
        'Fillup not found'
      );
    });
  });

  describe('deleteFillup', () => {
    const fillupId = 'fillup-123';

    it('should delete fillup successfully', async () => {
      // Arrange
      const existingFillup = {
        id: fillupId,
        car_id: carId,
        odometer: 50500,
        date: '2024-01-15',
      };
      const mockCar = { id: carId };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'fillups') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.filter((c) => c[0] === 'fillups').length;

          // First call: fetch existing fillup
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
          // Second call: get subsequent fillups
          if (calls === 2) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gt: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            } as any;
          }
          // Third call: delete
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          } as any;
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
      const result = await deleteFillup(mockSupabase, userId, carId, fillupId);

      // Assert
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw error for non-existent fillup', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(deleteFillup(mockSupabase, userId, carId, 'non-existent-fillup')).rejects.toThrow(
        'Fillup not found'
      );
    });
  });
});
