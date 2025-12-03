import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppSupabaseClient } from '../../../db/supabase.client';
import type { ChartQueryInput } from '../../validation/charts';
import { getChartData } from '../charts.service';

describe('charts.service', () => {
  let mockSupabase: AppSupabaseClient;
  const userId = 'user-123';
  const carId = 'car-123';

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as AppSupabaseClient;
  });

  describe('getChartData', () => {
    it('should return consumption chart data', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'consumption',
        limit: 50,
      };
      const mockCar = { id: carId };
      const mockFillups = [
        {
          date: '2024-01-15',
          odometer: 50500,
          fuel_consumption: 7.5,
          price_per_liter: 5.0,
          distance_traveled: 500,
        },
        {
          date: '2024-01-01',
          odometer: 50000,
          fuel_consumption: 8.0,
          price_per_liter: 4.8,
          distance_traveled: 480,
        },
      ];

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
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getChartData(mockSupabase, userId, carId, params);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.type).toBe('consumption');
      expect(result?.data).toHaveLength(2);
      expect(result?.average).toBe(7.75); // (7.5 + 8.0) / 2
      expect(result?.metadata.min).toBe(7.5);
      expect(result?.metadata.max).toBe(8.0);
      expect(result?.metadata.count).toBe(2);
    });

    it('should return price_per_liter chart data', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'price_per_liter',
        limit: 50,
      };
      const mockCar = { id: carId };
      const mockFillups = [
        {
          date: '2024-01-15',
          odometer: 50500,
          fuel_consumption: 7.5,
          price_per_liter: 5.0,
          distance_traveled: 500,
        },
      ];

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
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getChartData(mockSupabase, userId, carId, params);

      // Assert
      expect(result?.type).toBe('price_per_liter');
      expect(result?.data).toHaveLength(1);
      expect(result?.average).toBe(5.0);
    });

    it('should return distance chart data', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'distance',
        limit: 50,
      };
      const mockCar = { id: carId };
      const mockFillups = [
        {
          date: '2024-01-15',
          odometer: 50500,
          fuel_consumption: 7.5,
          price_per_liter: 5.0,
          distance_traveled: 500,
        },
      ];

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
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getChartData(mockSupabase, userId, carId, params);

      // Assert
      expect(result?.type).toBe('distance');
      expect(result?.average).toBe(500);
    });

    it('should filter data by start_date', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'consumption',
        limit: 50,
        start_date: '2024-01-10',
      };
      const mockCar = { id: carId };
      const mockFillups = [
        {
          date: '2024-01-15',
          odometer: 50500,
          fuel_consumption: 7.5,
          price_per_liter: 5.0,
          distance_traveled: 500,
        },
      ];

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
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    gte: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getChartData(mockSupabase, userId, carId, params);

      // Assert
      expect(result?.data).toHaveLength(1);
    });

    it('should filter data by end_date', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'consumption',
        limit: 50,
        end_date: '2024-01-20',
      };
      const mockCar = { id: carId };
      const mockFillups = [
        {
          date: '2024-01-15',
          odometer: 50500,
          fuel_consumption: 7.5,
          price_per_liter: 5.0,
          distance_traveled: 500,
        },
      ];

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
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getChartData(mockSupabase, userId, carId, params);

      // Assert
      expect(result?.data).toHaveLength(1);
    });

    it('should return empty data for car without fillups', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'consumption',
        limit: 50,
      };
      const mockCar = { id: carId };

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
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getChartData(mockSupabase, userId, carId, params);

      // Assert
      expect(result?.data).toEqual([]);
      expect(result?.metadata.count).toBe(0);
      expect(result?.average).toBe(0);
    });

    it('should filter out null values', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'consumption',
        limit: 50,
      };
      const mockCar = { id: carId };
      const mockFillups = [
        {
          date: '2024-01-15',
          odometer: 50500,
          fuel_consumption: 7.5,
          price_per_liter: 5.0,
          distance_traveled: 500,
        },
        {
          date: '2024-01-01',
          odometer: 50000,
          fuel_consumption: null,
          price_per_liter: 4.8,
          distance_traveled: 0,
        },
      ];

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
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockFillups, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getChartData(mockSupabase, userId, carId, params);

      // Assert
      expect(result?.data).toHaveLength(1); // Only one non-null consumption
      expect(result?.metadata.count).toBe(1);
    });

    it('should return null for non-existent car', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'consumption',
        limit: 50,
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

      // Act
      const result = await getChartData(mockSupabase, userId, 'non-existent-car', params);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      // Arrange
      const params: ChartQueryInput = {
        type: 'consumption',
        limit: 50,
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(getChartData(mockSupabase, userId, carId, params)).rejects.toThrow('Failed to verify car');
    });
  });
});
