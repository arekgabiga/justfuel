import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCarsList } from '../useCarsList';
import { navigateTo } from '../../utils/navigation';

vi.mock('../../utils/navigation', () => ({
  navigateTo: vi.fn(),
}));

describe('useCarsList', () => {
  const mockFetch = vi.fn();
  const mockCars = [
    {
      id: 'car-1',
      name: 'Car 1',
      statistics: {
        total_fuel_cost: 100,
        total_fuel_amount: 50,
        total_distance: 500,
        average_consumption: 10,
        average_price_per_liter: 2,
        fillup_count: 5,
      },
    },
    {
      id: 'car-2',
      name: 'Car 2',
      statistics: {
        total_fuel_cost: 200,
        total_fuel_amount: 100,
        total_distance: 1000,
        average_consumption: 10,
        average_price_per_liter: 2,
        fillup_count: 10,
      },
    },
  ];

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization and Fetching', () => {
    it('should fetch cars on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockCars }),
      });

      const { result } = renderHook(() => useCarsList());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cars).toEqual(mockCars);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cars?sort=name&order=asc'),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useCarsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Wystąpił błąd serwera');
    });

    it('should handle unauthorized (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      renderHook(() => useCarsList());

      await waitFor(() => {
        expect(navigateTo).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should fetch cars even without explicit token (session-based auth)', async () => {
      // Clear any previous fetch calls
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockCars }),
      });

      const { result } = renderHook(() => useCarsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should make fetch request with session credentials
      expect(mockFetch).toHaveBeenCalled();
      expect(result.current.cars).toEqual(mockCars);
    });
  });

  describe('Retry Logic', () => {
    it('should retry fetching', async () => {
      // First attempt fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCarsList());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockCars }),
      });

      // Enable fake timers for timeout testing
      vi.useFakeTimers();
      act(() => {
        result.current.handleRetry();
        vi.runAllTimers();
      });
      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.cars).toEqual(mockCars);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Mock successful fetch for navigation tests
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockCars }),
      });
    });

    it('should navigate to car details', async () => {
      const { result } = renderHook(() => useCarsList());

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleCarClick('car-1');
      });

      expect(navigateTo).toHaveBeenCalledWith('/cars/car-1');
    });

    it('should navigate to add car', async () => {
      const { result } = renderHook(() => useCarsList());

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleAddCar();
      });

      expect(navigateTo).toHaveBeenCalledWith('/cars/new');
    });
  });
});
