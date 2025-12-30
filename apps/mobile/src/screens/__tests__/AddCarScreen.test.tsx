import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddCarScreen from '../AddCarScreen';
import { CarRepository } from '../../database/CarRepository';
import { Provider as PaperProvider } from 'react-native-paper';

// Mocks
jest.mock('../../database/CarRepository', () => ({
  CarRepository: {
    addCar: jest.fn(),
    updateCar: jest.fn(),
  },
}));

const mockNavigation = {
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
}));

// Helper to render with required providers
const renderScreen = () => {
    return render(
        <PaperProvider>
            <AddCarScreen />
        </PaperProvider>
    );
};

describe('AddCarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText, getByTestId } = renderScreen();
    // Labels are still there (Paper renders checks multiple times for animation)
    expect(getAllByText('Nazwa samochodu (np. Audi A4)').length).toBeGreaterThan(0);
    expect(getByTestId('save-button')).toBeTruthy();
  });

  it('validates empty name', async () => {
    const { getByTestId } = renderScreen();
    const saveButton = getByTestId('save-button');

    fireEvent.press(saveButton);
    expect(CarRepository.addCar).not.toHaveBeenCalled();
  });

  it('adds a new car successfully', async () => {
    const { getByTestId } = renderScreen();

    // Fill form
    fireEvent.changeText(getByTestId('name-input'), 'My New Car');
    fireEvent.changeText(getByTestId('odometer-input'), '12345');

    // Press save
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(CarRepository.addCar).toHaveBeenCalledWith({
        name: 'My New Car',
        initial_odometer: 12345,
        mileage_input_preference: 'distance', // Default
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('validates odometer input', async () => {
      const { getByTestId, getByText } = renderScreen();
      
      const input = getByTestId('odometer-input');
      fireEvent.changeText(input, 'abc'); // Invalid number
      
      // Force validation
      await waitFor(() => {
          expect(getByText('Nieprawidłowa liczba')).toBeTruthy();
      });

      const saveButton = getByTestId('save-button');
      fireEvent.press(saveButton);
      expect(CarRepository.addCar).not.toHaveBeenCalled();
  });
});
