import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFillupsView } from '../useFillupsView';
import { navigateTo } from '../../utils/navigation';

vi.mock('../../utils/navigation', () => ({
  navigateTo: vi.fn(),
}));

describe('useFillupsView', () => {
  const mockFetch = vi.fn();
  const carId = 'car-123';
  const mockCarData = {
    id: carId,
    name: 'Test Car',
  };
  const mockFillupsData = {
    fillups: [{ id: 'fillup-1', date: '2023-01-01' }],
    pagination: { next_cursor: 'cursor-1', has_more: true, total_count: 10 },
  };

  beforeEach(() => {
    global.fetch = mockFetch;
    // Reset URL
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
  });

  describe('Navigation', () => {
    it('should navigate to fillup edit', () => {
      const { result } = renderHook(() => useFillupsView(carId));

      act(() => {
        result.current.handleFillupClick('fillup-1');
      });

      expect(navigateTo).toHaveBeenCalledWith(`/cars/${carId}/fillups/fillup-1/edit`);
    });

    it('should navigate to add fillup', () => {
      const { result } = renderHook(() => useFillupsView(carId));

      act(() => {
        result.current.handleAddFillupClick();
      });

      expect(navigateTo).toHaveBeenCalledWith(`/cars/${carId}/fillups/new`);
    });

    it('should navigate back', () => {
      const { result } = renderHook(() => useFillupsView(carId));

      act(() => {
        result.current.handleBack();
      });

      expect(navigateTo).toHaveBeenCalledWith('/cars');
    });
  });
});
