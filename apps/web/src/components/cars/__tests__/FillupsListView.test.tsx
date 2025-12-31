import { render, screen, fireEvent } from '@testing-library/react';
import { FillupsListView } from '../FillupsListView';
import type { FillupDTO, PaginationDTO } from '../../../types';
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock IntersectionObserver
beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  // @ts-ignore
  window.IntersectionObserver = MockIntersectionObserver;
});

describe('FillupsListView', () => {
  const mockPagination: PaginationDTO = {
    has_more: false,
    next_cursor: null,
    total_count: 3,
  };

  const mockFillups: FillupDTO[] = [
    {
      id: '3',
      car_id: 'car1',
      date: '2025-12-10',
      odometer: 1500,
      fuel_amount: 48,
      price_per_liter: 6.5,
      total_price: 312,
      distance_traveled: 550, // Calculated from purely 1500 - 950 (but currently 950 is actually 1950 in the bug scenario)
      fuel_consumption: 8.7,
    },
    {
      id: '2',
      car_id: 'car1',
      date: '2025-12-07',
      odometer: 1950, // ERROR: Higher than next fillup (id 3, date 12.10)
      fuel_amount: 40,
      price_per_liter: 6.4,
      total_price: 256,
      distance_traveled: 450,
      fuel_consumption: 8.8,
    },
    {
      id: '1',
      car_id: 'car1',
      date: '2025-12-01',
      odometer: 500,
      fuel_amount: 50,
      price_per_liter: 6.3,
      total_price: 315,
      distance_traveled: 0,
      fuel_consumption: 0,
    },
  ];

  const defaultProps = {
    fillups: mockFillups,
    pagination: mockPagination,
    averageConsumption: 8.5,
    loading: false,
    error: null,
    onLoadMore: vi.fn(),
    onFillupClick: vi.fn(),
    onAddFillup: vi.fn(),
    mileageInputPreference: 'odometer' as const,
  };

  it('renders fillup cards correctly', () => {
    render(<FillupsListView {...defaultProps} />);
    
    expect(screen.getByText('10.12.2025')).toBeInTheDocument();
    expect(screen.getByText('07.12.2025')).toBeInTheDocument();
    expect(screen.getByText('01.12.2025')).toBeInTheDocument();
  });

  it('shows error indication for fillup with inconsistent odometer', () => {
    render(<FillupsListView {...defaultProps} />);
    
    // In the scenario:
    // Fillup 1 (oldest): 500km
    // Fillup 2 (middle): 1950km
    // Fillup 3 (newest): 1500km
    
    // Fillup 3 (10.12.2025) has odometer 1500km.
    // The previous fillup chronologically is Fillup 2 (07.12.2025) with 1950km.
    // Since 1500 < 1950, Fillup 3 is invalid given the history.
    // Wait, let's trace the sorting. The list is usually sorted by Date DESC.
    // Index 0: ID 3 (10.12) - 1500km
    // Index 1: ID 2 (07.12) - 1950km
    // Index 2: ID 1 (01.12) - 500km
    
    // When iterating:
    // Checking Item 0 (ID 3): Next item is ID 2. 1500 < 1950? YES. ERROR on Item 0. 
    // Checking Item 1 (ID 2): Next item is ID 1. 1950 < 500? NO. OK.
    
    // So the card for 10.12.2025 should have an error.
    
    // We expect some visual indicator. The class 'border-red-500' or text 'Invalid odometer reading'
    // For now, since we haven't implemented it, we can just assert that it DOESN'T exist yet, or fails.
    // Ideally we want to write a test that fails NOW and passes LATER.
    
    // Let's assume we will add a tooltip text "Przebieg niższy niż w poprzednim tankowaniu"
    // or generic "Błąd przebiegu".
    
    // We expect the error indicator to be present for the fillup with ID 3 (10.12.2025)
    // because 1500 (current) < 1950 (previous/older).
    
    // Note: The fillups are rendered in order.
    // 1st card: 10.12.2025 (ID 3) - invalid
    // 2nd card: 07.12.2025 (ID 2) - valid (1950 > 500)
    // 3rd card: 01.12.2025 (ID 1) - valid (last one)

    // Find all cards
    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(3);

    // Check specific specific card for error
    const invalidCard = cards[0]; // 10.12.2025
    
    // Look for the error icon/container within this card
    // We added aria-label="Błąd przebiegu" to the wrapper div of the tooltip trigger
    const errorIndicator = screen.getByLabelText('Błąd przebiegu');
    expect(errorIndicator).toBeInTheDocument();
  });
});
