import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCarDetails } from '../useCarDetails';

describe('useCarDetails', () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;
  const carId = 'car-123';
  const mockCarData = {
    id: carId,
    name: 'Test Car',
    statistics: {},
  };
  const mockFillupsData = {
    fillups: [{ id: 'fillup-1', date: '2023-01-01' }],
    pagination: { next_cursor: 'cursor-1', has_more: true, total_count: 10 },
  };
  const mockChartData = {
    type: 'consumption',
    data: [],
    average: 5.5,
    metadata: { count: 0, min: 0, max: 0 },
  };

  beforeEach(() => {
    global.fetch = mockFetch;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '', search: '' };

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location = originalLocation;
  });

  describe('Initialization', () => {
    it('should fetch car details on mount', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCarData,
      });

      const { result } = renderHook(() => useCarDetails(carId));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.car).toEqual(mockCarData);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not found' } }),
      });

      const { result } = renderHook(() => useCarDetails(carId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Samochód nie został znaleziony');
    });
  });

  describe('Tab Management & Data Loading', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
      // Mock car fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCarData,
      });
    });

    it('should fetch fillups when active tab is fillups', async () => {
      // Mock fillups fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFillupsData,
      });

      const { result } = renderHook(() => useCarDetails(carId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should auto-fetch fillups because default tab is 'fillups'
      await waitFor(() => {
        expect(result.current.fillups.length).toBe(1);
      });

      expect(result.current.fillups).toEqual(mockFillupsData.fillups);
    });

    it('should fetch charts when switching to charts tab', async () => {
      // Mock fillups fetch (initial load)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFillupsData,
      });

      const { result } = renderHook(() => useCarDetails(carId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock chart fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockChartData,
      });

      act(() => {
        result.current.switchMainTab('charts');
      });

      await waitFor(() => {
        expect(result.current.chartData).toEqual(mockChartData);
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockCarData });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockFillupsData });
    });

    it('should load more fillups', async () => {
      const { result } = renderHook(() => useCarDetails(carId));

      await waitFor(() => {
        expect(result.current.fillups.length).toBe(1);
      });

      // Mock next page fetch
      const nextFillups = {
        fillups: [{ id: 'fillup-2', date: '2022-12-31' }],
        pagination: { next_cursor: null, has_more: false, total_count: 10 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => nextFillups,
      });

      act(() => {
        result.current.loadMoreFillups();
      });

      await waitFor(() => {
        expect(result.current.fillups.length).toBe(2);
      });
    });
  });

  describe('Dialogs', () => {
    it('should toggle edit dialog', () => {
      const { result } = renderHook(() => useCarDetails(carId));

      act(() => {
        result.current.openEditDialog();
      });
      expect(result.current.editDialogOpen).toBe(true);

      act(() => {
        result.current.closeEditDialog();
      });
      expect(result.current.editDialogOpen).toBe(false);
    });

    it('should toggle delete dialog', () => {
      const { result } = renderHook(() => useCarDetails(carId));

      act(() => {
        result.current.openDeleteDialog();
      });
      expect(result.current.deleteDialogOpen).toBe(true);

      act(() => {
        result.current.closeDeleteDialog();
      });
      expect(result.current.deleteDialogOpen).toBe(false);
    });
  });
});
