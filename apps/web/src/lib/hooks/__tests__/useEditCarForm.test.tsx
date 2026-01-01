import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEditCarForm } from '../useEditCarForm';
import { navigateTo } from '../../utils/navigation';

vi.mock('../../utils/navigation', () => ({
  navigateTo: vi.fn(),
}));

describe('useEditCarForm', () => {
  const mockFetch = vi.fn();
  const carId = 'car-123';
  const mockCarData = {
    id: carId,
    name: 'Test Car',
    mileage_input_preference: 'odometer',
  };

  beforeEach(() => {
    global.fetch = mockFetch;
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

  describe('Initialization', () => {
    it('should load car data on mount', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCarData,
      });

      const { result } = renderHook(() => useEditCarForm({ carId }));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.formState).toEqual({
        name: 'Test Car',
        mileageInputPreference: 'odometer',
      });
      expect(result.current.originalCarData).toEqual(mockCarData);
    });

    it('should handle load error', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not found' } }),
      });

      const { result } = renderHook(() => useEditCarForm({ carId }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.formErrors.submit).toBe('Samochód nie został znaleziony');
    });
  });

  describe('Update Handling', () => {
    beforeEach(() => {
      // Reset all mocks first
      mockFetch.mockClear();

      // Setup localStorage mock
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');

      // Setup successful load for update tests
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCarData,
      });
    });

    it('should not submit if no changes', async () => {
      const { result } = renderHook(() => useEditCarForm({ carId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.formErrors.submit).toBe('Nie wprowadzono żadnych zmian');
      // Should not call fetch for update (only initial load was called)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should submit only changed fields', async () => {
      const { result } = renderHook(() => useEditCarForm({ carId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Now enable fake timers for redirect testing
      vi.useFakeTimers();
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      // Update name
      act(() => {
        result.current.handleFieldChange('name', 'Updated Name');
      });

      // Mock update response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockCarData, name: 'Updated Name' }),
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2); // Load + Update
      const updateCall = mockFetch.mock.calls[1];
      expect(updateCall[0]).toBe(`/api/cars/${carId}`);
      expect(updateCall[1].method).toBe('PATCH');
      expect(JSON.parse(updateCall[1].body)).toEqual({ name: 'Updated Name' });

      // Check redirect
      act(() => {
        vi.runAllTimers();
      });
      // expect(window.location.href).toBe(`/cars/${carId}`);
      expect(navigateTo).toHaveBeenCalledWith(`/cars/${carId}`);

      vi.useRealTimers();
    });
  });

  describe('Delete Handling', () => {
    beforeEach(() => {
      // Reset all mocks first
      mockFetch.mockClear();

      // Setup localStorage mock
      vi.mocked(localStorage.getItem).mockReturnValue('fake-token');

      // Setup successful load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCarData,
      });
    });

    it('should open and close delete dialog', async () => {
      const { result } = renderHook(() => useEditCarForm({ carId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.handleDeleteClick();
      });
      expect(result.current.deleteDialogOpen).toBe(true);

      act(() => {
        result.current.handleDeleteCancel();
      });
      expect(result.current.deleteDialogOpen).toBe(false);
    });

    it('should handle delete confirmation', async () => {
      const { result } = renderHook(() => useEditCarForm({ carId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Mock delete response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Deleted' }),
      });

      await act(async () => {
        await result.current.handleDeleteConfirm({ confirmation_name: 'Test Car' });
      });

      expect(mockFetch).toHaveBeenCalledTimes(2); // Load + Delete
      const deleteCall = mockFetch.mock.calls[1];
      expect(deleteCall[0]).toBe(`/api/cars/${carId}`);
      expect(deleteCall[1].method).toBe('DELETE');

      expect(navigateTo).toHaveBeenCalledWith('/cars');
    });

    it('should handle delete error', async () => {
      const { result } = renderHook(() => useEditCarForm({ carId }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Mock delete error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Wrong name' } }),
      });

      await act(async () => {
        try {
          await result.current.handleDeleteConfirm({ confirmation_name: 'Wrong Name' });
        } catch (error) {
          expect((error as Error).message).toBe('Wrong name');
        }
      });

      expect(result.current.deleteError).toBe('Wrong name');
      expect(result.current.isDeleting).toBe(false);
    });
  });
});
