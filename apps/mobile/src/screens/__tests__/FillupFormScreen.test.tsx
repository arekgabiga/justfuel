import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FillupFormScreen from '../FillupFormScreen';
import { FillupRepository } from '../../database/FillupRepository';
import { CarRepository } from '../../database/CarRepository';
import { Provider as PaperProvider } from 'react-native-paper';

// Mocks
jest.mock('../../database/FillupRepository', () => ({
  FillupRepository: {
    addFillup: jest.fn(),
    updateFillup: jest.fn(),
    getPreviousFillup: jest.fn(),
    deleteFillup: jest.fn(),
  },
}));

jest.mock('../../database/CarRepository', () => ({
  CarRepository: {
    getCarById: jest.fn(),
  },
}));

const mockNavigation = {
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
    params: {
        carId: 'car-123'
    }
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

// Helper to render with required providers
const renderScreen = () => {
    return render(
        <PaperProvider>
            <FillupFormScreen />
        </PaperProvider>
    );
};

describe('FillupFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (CarRepository.getCarById as jest.Mock).mockResolvedValue({
        id: 'car-123',
        name: 'Test Car',
        initial_odometer: 10000,
        mileage_input_preference: 'odometer'
    });
    (FillupRepository.getPreviousFillup as jest.Mock).mockResolvedValue(null);
  });

  it('renders correctly', async () => {
    const { getByTestId, getAllByText } = renderScreen();
    
    // Wait for async data loading and validation effect to complete
    await waitFor(() => {
        expect(CarRepository.getCarById).toHaveBeenCalledWith('car-123');
    });
    
    // Then check rendering - this ensures all effects have settled
    await waitFor(() => {
        expect(getAllByText('Data').length).toBeGreaterThan(0);
        expect(getByTestId('save-button')).toBeTruthy();
    });
  });

  it('loads car data on mount', async () => {
    renderScreen();
    
    // Wait for load and effects to settle
    await waitFor(() => {
        expect(CarRepository.getCarById).toHaveBeenCalledWith('car-123');
    });
    
    // Additional wait for effects to complete (validation runs after car is loaded)
    await waitFor(() => {
        expect(FillupRepository.getPreviousFillup).toHaveBeenCalled();
    });
  });

  it('adds a new fillup successfully', async () => {
    const { getByTestId } = renderScreen();

    // Wait for full data load and all effects to settle
    await waitFor(() => {
        expect(CarRepository.getCarById).toHaveBeenCalled();
    });

    // Additional small wait for validation effect chain
    await waitFor(() => {
        expect(FillupRepository.getPreviousFillup).toHaveBeenCalled();
    });

    // Fill form within act to properly handle state updates
    await act(async () => {
      fireEvent.changeText(getByTestId('fuel-amount-input'), '50');
    });
    
    await act(async () => {
      fireEvent.changeText(getByTestId('total-price-input'), '250');
    });
    
    await act(async () => {
      fireEvent.changeText(getByTestId('odometer-input'), '10500');
    });

    // Press save button
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
        expect(FillupRepository.addFillup).toHaveBeenCalledWith(expect.objectContaining({
            car_id: 'car-123',
            fuel_amount: 50,
            total_price: 250,
            odometer: 10500,
        }));
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('validates invalid numbers', async () => {
    const { getByTestId, getByText } = renderScreen();
    
    // Wait for data load and effects to settle
    await waitFor(() => {
        expect(CarRepository.getCarById).toHaveBeenCalled();
    });
    
    await waitFor(() => {
        expect(FillupRepository.getPreviousFillup).toHaveBeenCalled();
    });

    // Change text within act to handle validation effect
    await act(async () => {
      fireEvent.changeText(getByTestId('fuel-amount-input'), 'abc');
    });
    
    await waitFor(() => {
        expect(getByText('Nieprawidłowa liczba')).toBeTruthy();
    });
  });

  it('calculates distance correctly for odometer preference', async () => {
      const { getByTestId, getByText } = renderScreen();
      
      // Wait for full data load
      await waitFor(() => {
          expect(CarRepository.getCarById).toHaveBeenCalled();
      });
      
      await waitFor(() => {
          expect(FillupRepository.getPreviousFillup).toHaveBeenCalled();
      });

      // Change input within act
      await act(async () => {
        fireEvent.changeText(getByTestId('odometer-input'), '9000');
      });

      await waitFor(() => {
          expect(getByText(/Przebieg musi być wyższy/)).toBeTruthy();
      });
  });
});
