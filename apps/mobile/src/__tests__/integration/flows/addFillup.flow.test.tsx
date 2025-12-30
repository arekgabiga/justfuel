/**
 * Integration Test: Add Fillup Flow
 * 
 * Tests the complete flow of adding a new fillup to an existing car.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { 
  mockDb, 
  resetMockDatabase, 
  getMockFillups, 
  seedCar, 
  seedFillup,
  MockCar 
} from '../utils/mockDatabase';

// Mock the schema module
jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

// Screens - import AFTER mocking dependencies
import CarDetailsScreen from '../../../screens/CarDetailsScreen';
import FillupFormScreen from '../../../screens/FillupFormScreen';

const Stack = createNativeStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066CC',
    secondary: '#FFCC00',
  },
};

const mockSafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

interface TestAppProps {
  initialCarId: string;
  initialCarName: string;
}

const TestApp = ({ initialCarId, initialCarName }: TestAppProps) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: mockSafeAreaInsets }}>
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="CarDetails">
          <Stack.Screen 
            name="CarDetails" 
            component={CarDetailsScreen}
            initialParams={{ carId: initialCarId, carName: initialCarName }}
            options={{ title: initialCarName }}
          />
          <Stack.Screen 
            name="FillupForm" 
            component={FillupFormScreen} 
            options={{ title: 'Nowe Tankowanie' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  </SafeAreaProvider>
);

describe('Add Fillup Flow (Integration)', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('shows empty fillups state for a car', async () => {
    const car = seedCar({ name: 'Audi A4' });
    const { getByText } = render(<TestApp initialCarId={car.id} initialCarName={car.name} />);

    await waitFor(() => {
      expect(getByText('Brak tankowań. Dodaj pierwsze tankowanie!')).toBeTruthy();
    });
  });

  it('navigates to FillupForm when FAB is pressed', async () => {
    const car = seedCar({ name: 'BMW X5' });
    const { getByTestId } = render(<TestApp initialCarId={car.id} initialCarName={car.name} />);

    await waitFor(() => {
      expect(getByTestId('add-fillup-fab')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('add-fillup-fab'));
    });

    await waitFor(() => {
      expect(getByTestId('fuel-amount-input')).toBeTruthy();
      expect(getByTestId('total-price-input')).toBeTruthy();
      expect(getByTestId('save-button')).toBeTruthy();
    });
  });

  it('adds a fillup and saves it to the database', async () => {
    const car = seedCar({ 
      name: 'Audi A4', 
      initial_odometer: 10000,
      mileage_input_preference: 'odometer',
    });
    
    const { getByTestId } = render(<TestApp initialCarId={car.id} initialCarName={car.name} />);

    await waitFor(() => {
      expect(getByTestId('add-fillup-fab')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('add-fillup-fab'));
    });

    await waitFor(() => {
      expect(getByTestId('fuel-amount-input')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('fuel-amount-input'), '50');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('total-price-input'), '300');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('odometer-input'), '10500');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      const fillups = getMockFillups();
      expect(fillups).toHaveLength(1);
      expect(fillups[0].fuel_amount).toBe(50);
      expect(fillups[0].total_price).toBe(300);
      expect(fillups[0].odometer).toBe(10500);
      expect(fillups[0].price_per_liter).toBe(6); // 300/50
    });
  });

  it('calculates distance and consumption when adding second fillup', async () => {
    const car = seedCar({ 
      name: 'Audi A4', 
      initial_odometer: 10000,
      mileage_input_preference: 'odometer',
    });
    
    // Add first fillup (previous reference point)
    seedFillup(car.id, {
      date: '2024-01-01',
      odometer: 10000,
      fuel_amount: 45,
      total_price: 270,
      distance_traveled: null,
      fuel_consumption: null,
    });
    
    const { getByTestId } = render(<TestApp initialCarId={car.id} initialCarName={car.name} />);

    await waitFor(() => {
      expect(getByTestId('add-fillup-fab')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('add-fillup-fab'));
    });

    await waitFor(() => {
      expect(getByTestId('fuel-amount-input')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('fuel-amount-input'), '50');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('total-price-input'), '300');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('odometer-input'), '10500');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      const fillups = getMockFillups();
      expect(fillups).toHaveLength(2);
      const newFillup = fillups.find(f => f.odometer === 10500);
      expect(newFillup).toBeTruthy();
      expect(newFillup!.distance_traveled).toBe(500); // 10500 - 10000
      expect(newFillup!.fuel_consumption).toBe(10); // 50L / 500km * 100 = 10 L/100km
    });
  });

  it('displays fillups in the list after adding', async () => {
    const car = seedCar({ name: 'BMW X5' });
    seedFillup(car.id, {
      date: '2024-12-30',
      fuel_amount: 55,
      total_price: 330,
      fuel_consumption: 9.5,
    });
    
    const { getByText } = render(<TestApp initialCarId={car.id} initialCarName={car.name} />);

    await waitFor(() => {
      expect(getByText('9.50')).toBeTruthy();
    });
  });
});
