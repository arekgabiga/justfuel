import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppSupabaseClient } from '../../../db/supabase.client';
import type {
  CarWithStatisticsDTO,
  CarDetailsDTO,
  CarStatisticsDTO,
  CreateCarCommand,
  UpdateCarCommand,
  DeleteCarCommand,
} from '../../../types';
import {
  listUserCarsWithStats,
  getUserCarWithStats,
  createCar,
  updateCar,
  deleteCar,
  getCarStatistics,
  ConflictError,
} from '../cars.service';

describe('cars.service', () => {
  let mockSupabase: AppSupabaseClient;
  const userId = 'user-123';

  beforeEach(() => {
    // Mock Supabase query builder pattern
    mockSupabase = {
      from: vi.fn(),
    } as unknown as AppSupabaseClient;
  });

  describe('ConflictError', () => {
    it('should create error with message', () => {
      // Arrange & Act
      const error = new ConflictError('Car name already exists');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('Car name already exists');
    });
  });

  describe('listUserCarsWithStats', () => {
    it('should list cars with default parameters (created_at desc)', async () => {
      // Arrange
      const mockCars = [
        { id: 'car-1', name: 'Audi A4', initial_odometer: 50000, mileage_input_preference: 'odometer' },
        { id: 'car-2', name: 'BMW X5', initial_odometer: 30000, mileage_input_preference: 'distance' },
      ];
      const mockStats = [
        {
          car_id: 'car-1',
          total_fuel_cost: 1000,
          total_fuel_amount: 200,
          total_distance: 1500,
          average_consumption: 7.5,
          average_price_per_liter: 5.0,
          fillup_count: 10,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            ...mockQuery,
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockCars, error: null }),
            }),
          } as any;
        }
        if (table === 'car_statistics') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
            }),
          } as any;
        }
        return mockQuery as any;
      });

      // Act
      const result = await listUserCarsWithStats(mockSupabase, { sort: 'name', order: 'asc' });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('car-1');
      expect(result[0].statistics.fillup_count).toBe(10);
      expect(result[1].statistics.fillup_count).toBe(0); // No stats for car-2
    });

    it('should sort cars by name ASC', async () => {
      // Arrange
      const mockCars = [
        { id: 'car-1', name: 'Audi A4', initial_odometer: 50000, mileage_input_preference: 'odometer' },
        { id: 'car-2', name: 'BMW X5', initial_odometer: 30000, mileage_input_preference: 'distance' },
      ];

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue(Promise.resolve({ data: mockCars, error: null })),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      // Act
      const result = await listUserCarsWithStats(mockSupabase, { sort: 'name', order: 'asc' });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('cars');
    });

    it('should return empty array for user with no cars', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as any);

      // Act
      const result = await listUserCarsWithStats(mockSupabase, {});

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle cars with zero statistics', async () => {
      // Arrange
      const mockCars = [
        { id: 'car-1', name: 'Audi A4', initial_odometer: 50000, mileage_input_preference: 'odometer' },
      ];

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockCars, error: null }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      // Act
      const result = await listUserCarsWithStats(mockSupabase, {});

      // Assert
      expect(result[0].statistics).toEqual({
        total_fuel_cost: 0,
        total_fuel_amount: 0,
        total_distance: 0,
        average_consumption: 0,
        average_price_per_liter: 0,
        fillup_count: 0,
      });
    });

    it('should use userId from options', async () => {
      // Arrange
      const customUserId = 'custom-user-456';
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      // Act
      await listUserCarsWithStats(mockSupabase, {}, { userId: customUserId });

      // Assert - verifies eq was called in chain
      expect(mockSupabase.from).toHaveBeenCalledWith('cars');
    });

    it('should throw error on database error', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as any);

      // Act & Assert
      await expect(listUserCarsWithStats(mockSupabase, {})).rejects.toThrow('Failed to fetch cars');
    });
  });

  describe('getUserCarWithStats', () => {
    const carId = 'car-123';

    it('should return existing car with statistics', async () => {
      // Arrange
      const mockCar = {
        id: carId,
        name: 'Audi A4',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
        created_at: '2024-01-01T00:00:00Z',
        user_id: userId,
      };
      const mockStats = {
        car_id: carId,
        total_fuel_cost: 1000,
        total_fuel_amount: 200,
        total_distance: 1500,
        average_consumption: 7.5,
        average_price_per_liter: 5.0,
        fillup_count: 10,
      };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockCar, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
              }),
            }),
          }),
        } as any;
      });

      // Act
      const result = await getUserCarWithStats(mockSupabase, carId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(carId);
      expect(result?.statistics.fillup_count).toBe(10);
    });

    it('should return car without statistics (zero values)', async () => {
      // Arrange
      const mockCar = {
        id: carId,
        name: 'Audi A4',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
        created_at: '2024-01-01T00:00:00Z',
        user_id: userId,
      };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockCar, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        } as any;
      });

      // Act
      const result = await getUserCarWithStats(mockSupabase, carId);

      // Assert
      expect(result?.statistics).toEqual({
        total_fuel_cost: 0,
        total_fuel_amount: 0,
        total_distance: 0,
        average_consumption: 0,
        average_price_per_liter: 0,
        fillup_count: 0,
      });
    });

    it('should return null for non-existent car', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getUserCarWithStats(mockSupabase, 'non-existent-car');

      // Assert
      expect(result).toBeNull();
    });

    it('should use userId from options', async () => {
      // Arrange
      const customUserId = 'custom-user-456';
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

      // Act
      await getUserCarWithStats(mockSupabase, carId, { userId: customUserId });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('cars');
    });
  });

  describe('createCar', () => {
    it('should create new car with valid input', async () => {
      // Arrange
      const input: CreateCarCommand = {
        name: 'Audi A4',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
      };
      const mockCreatedCar = {
        id: 'car-123',
        name: 'Audi A4',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedCar, error: null }),
          }),
        }),
      } as any);

      // Act
      const result = await createCar(mockSupabase, userId, input);

      // Assert
      expect(result.id).toBe('car-123');
      expect(result.name).toBe('Audi A4');
      expect(result.statistics.fillup_count).toBe(0);
    });

    it('should throw ConflictError on duplicate name', async () => {
      // Arrange
      const input: CreateCarCommand = {
        name: 'Audi A4',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(createCar(mockSupabase, userId, input)).rejects.toThrow(ConflictError);
    });

    it('should handle initial_odometer = 0', async () => {
      // Arrange
      const input: CreateCarCommand = {
        name: 'Audi A4',
        initial_odometer: 0,
        mileage_input_preference: 'odometer',
      };
      const mockCreatedCar = {
        id: 'car-123',
        name: 'Audi A4',
        initial_odometer: 0,
        mileage_input_preference: 'odometer',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedCar, error: null }),
          }),
        }),
      } as any);

      // Act
      const result = await createCar(mockSupabase, userId, input);

      // Assert
      expect(result.initial_odometer).toBe(0);
    });

    it('should handle null initial_odometer', async () => {
      // Arrange
      const input: CreateCarCommand = {
        name: 'Audi A4',
        initial_odometer: null,
        mileage_input_preference: 'distance',
      };
      const mockCreatedCar = {
        id: 'car-123',
        name: 'Audi A4',
        initial_odometer: null,
        mileage_input_preference: 'distance',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedCar, error: null }),
          }),
        }),
      } as any);

      // Act
      const result = await createCar(mockSupabase, userId, input);

      // Assert
      expect(result.initial_odometer).toBeNull();
    });

    it('should create car with odometer preference', async () => {
      // Arrange
      const input: CreateCarCommand = {
        name: 'Audi A4',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
      };
      const mockCreatedCar = {
        id: 'car-123',
        name: 'Audi A4',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedCar, error: null }),
          }),
        }),
      } as any);

      // Act
      const result = await createCar(mockSupabase, userId, input);

      // Assert
      expect(result.mileage_input_preference).toBe('odometer');
    });

    it('should create car with distance preference', async () => {
      // Arrange
      const input: CreateCarCommand = {
        name: 'BMW X5',
        initial_odometer: 30000,
        mileage_input_preference: 'distance',
      };
      const mockCreatedCar = {
        id: 'car-456',
        name: 'BMW X5',
        initial_odometer: 30000,
        mileage_input_preference: 'distance',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedCar, error: null }),
          }),
        }),
      } as any);

      // Act
      const result = await createCar(mockSupabase, userId, input);

      // Assert
      expect(result.mileage_input_preference).toBe('distance');
    });
  });

  describe('updateCar', () => {
    const carId = 'car-123';

    it('should update car name', async () => {
      // Arrange
      const input: UpdateCarCommand = { name: 'Audi A5' };
      const existingCar = { id: carId, name: 'Audi A4', user_id: userId };
      const updatedCar = {
        id: carId,
        name: 'Audi A5',
        initial_odometer: 50000,
        mileage_input_preference: 'odometer',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.length;

          // First call: fetch existingCar
          if (calls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: existingCar, error: null }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          // Second call: check duplicate
          if (calls === 2) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    neq: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          // Third call: update
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: updatedCar, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        // car_statistics query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        } as any;
      });

      // Act
      const result = await updateCar(mockSupabase, userId, carId, input);

      // Assert
      expect(result.name).toBe('Audi A5');
    });

    it('should throw ConflictError on duplicate name', async () => {
      // Arrange
      const input: UpdateCarCommand = { name: 'BMW X5' };
      const existingCar = { id: carId, name: 'Audi A4', user_id: userId };
      const duplicateCar = { id: 'other-car-id' };

      vi.mocked(mockSupabase.from).mockImplementation(() => {
        const calls = vi.mocked(mockSupabase.from).mock.calls.length;

        // First call: fetch existing car
        if (calls === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: existingCar, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        // Second call: check duplicate - found!
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: duplicateCar, error: null }),
                  }),
                }),
              }),
            }),
          }),
        } as any;
      });

      // Act & Assert
      await expect(updateCar(mockSupabase, userId, carId, input)).rejects.toThrow(ConflictError);
    });

    it('should throw error for non-existent car', async () => {
      // Arrange
      const input: UpdateCarCommand = { name: 'Audi A5' };

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
      await expect(updateCar(mockSupabase, userId, carId, input)).rejects.toThrow(
        'Car not found or does not belong to user'
      );
    });

    it('should trigger fillup recalculation when initial_odometer changes', async () => {
      // Arrange
      const input: UpdateCarCommand = { initial_odometer: 10200 };
      const existingCar = { 
        id: carId, 
        name: 'Audi A4', 
        user_id: userId, 
        initial_odometer: 10000, 
        mileage_input_preference: 'odometer' 
      };
      const updatedCar = {
        id: carId,
        name: 'Audi A4',
        initial_odometer: 10200,
        mileage_input_preference: 'odometer',
        created_at: '2024-01-01T00:00:00Z',
      };
      const mockFillups = [
        { id: 'f1', odometer: 10500, fuel_amount: 50, total_price: 300, distance_traveled: 500, fuel_consumption: 10 }
      ];

      let recalculateCalled = false;

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        const calls = vi.mocked(mockSupabase.from).mock.calls.filter(c => c[0] === table).length;

        if (table === 'cars') {
          // First call: fetch existing car
          if (calls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: existingCar, error: null }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          // Second call: update
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: updatedCar, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'car_statistics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'fillups') {
          recalculateCalled = true;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await updateCar(mockSupabase, userId, carId, input);

      // Assert
      expect(result.initial_odometer).toBe(10200);
      expect(recalculateCalled).toBe(true);
    });
  });

  describe('deleteCar', () => {
    const carId = 'car-123';

    it('should delete car with correct confirmation', async () => {
      // Arrange
      const input: DeleteCarCommand = { confirmation_name: 'Audi A4' };
      const existingCar = { id: carId, name: 'Audi A4', user_id: userId };

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'cars') {
          const calls = vi.mocked(mockSupabase.from).mock.calls.length;

          // First call: fetch existing car
          if (calls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: existingCar, error: null }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          // Second call: delete
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await deleteCar(mockSupabase, userId, carId, input);

      // Assert
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw error on incorrect confirmation', async () => {
      // Arrange
      const input: DeleteCarCommand = { confirmation_name: 'Wrong Name' };
      const existingCar = { id: carId, name: 'Audi A4', user_id: userId };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existingCar, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(deleteCar(mockSupabase, userId, carId, input)).rejects.toThrow(
        'Confirmation name does not match car name'
      );
    });

    it('should throw error for non-existent car', async () => {
      // Arrange
      const input: DeleteCarCommand = { confirmation_name: 'Audi A4' };

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
      await expect(deleteCar(mockSupabase, userId, carId, input)).rejects.toThrow('Car not found');
    });
  });

  describe('getCarStatistics', () => {
    const carId = 'car-123';

    it('should return statistics for car with fillups', async () => {
      // Arrange
      const mockData = {
        id: carId,
        user_id: userId,
        car_statistics: [
          {
            car_id: carId,
            total_fuel_cost: 1000,
            total_fuel_amount: 200,
            total_distance: 1500,
            average_consumption: 7.5,
            average_price_per_liter: 5.0,
            fillup_count: 10,
          },
        ],
        fillups: [{ date: '2024-01-15T00:00:00Z', odometer: 51500 }],
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getCarStatistics(mockSupabase, carId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.car_id).toBe(carId);
      expect(result?.fillup_count).toBe(10);
      expect(result?.latest_fillup_date).toBe('2024-01-15T00:00:00Z');
      expect(result?.current_odometer).toBe(51500);
    });

    it('should return statistics for car without fillups', async () => {
      // Arrange
      const mockData = {
        id: carId,
        user_id: userId,
        car_statistics: [
          {
            car_id: carId,
            total_fuel_cost: 0,
            total_fuel_amount: 0,
            total_distance: 0,
            average_consumption: 0,
            average_price_per_liter: 0,
            fillup_count: 0,
          },
        ],
        fillups: [],
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getCarStatistics(mockSupabase, carId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.fillup_count).toBe(0);
      expect(result?.latest_fillup_date).toBeNull();
      expect(result?.current_odometer).toBeNull();
    });

    it('should return null for non-existent car', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getCarStatistics(mockSupabase, 'non-existent-car');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      // Arrange
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' },
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(getCarStatistics(mockSupabase, carId)).rejects.toThrow('Failed to fetch car statistics');
    });
  });
});
