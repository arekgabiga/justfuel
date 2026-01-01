/**
 * Integration Test: Full User Journey
 * 
 * Tests the complete end-to-end flow of a typical user:
 * 1. User adds a new car
 * 2. User adds multiple fillups
 * 3. Statistics are correctly calculated and displayed
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockDb, resetMockDatabase, getMockCars, getMockFillups } from '../utils/mockDatabase';

// Mock schema
jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

// Import screens after mocking
import CarListScreen from '../../../screens/CarListScreen';
import AddCarScreen from '../../../screens/AddCarScreen';
import CarDetailsScreen from '../../../screens/CarDetailsScreen';
import FillupFormScreen from '../../../screens/FillupFormScreen';
import { RootStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

const FullApp = () => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: mockSafeAreaInsets }}>
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="CarList">
          <Stack.Screen name="CarList" component={CarListScreen} options={{ title: 'Moje Samochody' }} />
          <Stack.Screen name="AddCar" component={AddCarScreen} options={{ title: 'Dodaj Samochód' }} />
          <Stack.Screen
            name="CarDetails"
            component={CarDetailsScreen}
            options={({ route }: any) => ({ title: route.params?.carName || 'Szczegóły' })}
          />
          <Stack.Screen name="FillupForm" component={FillupFormScreen} options={{ title: 'Nowe Tankowanie' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  </SafeAreaProvider>
);

describe('Full User Journey (Integration)', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('complete flow: add car → add fillups → view statistics', async () => {
    const { getByTestId, getByText } = render(<FullApp />);

    // ========================================
    // Step 1: Start with empty car list
    // ========================================
    await waitFor(() => {
      expect(getByText('Brak samochodów')).toBeTruthy();
    });

    // ========================================
    // Step 2: Add a new car
    // ========================================
    await act(async () => {
      fireEvent.press(getByTestId('add-car-fab'));
    });

    await waitFor(() => {
      expect(getByTestId('name-input')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('name-input'), 'Audi A4');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('odometer-input'), '100000');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      expect(getMockCars()).toHaveLength(1);
      expect(getMockCars()[0].name).toBe('Audi A4');
    });

    // ========================================
    // Step 3: Navigate to car details
    // ========================================
    await waitFor(() => {
      expect(getByText('Audi A4')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Audi A4'));
    });

    await waitFor(() => {
      expect(getByTestId('add-fillup-fab')).toBeTruthy();
      expect(getByText('Brak tankowań. Dodaj pierwsze tankowanie!')).toBeTruthy();
    });

    // ========================================
    // Step 4: Add first fillup
    // ========================================
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
      fireEvent.changeText(getByTestId('distance-input'), '500');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      expect(getMockFillups()).toHaveLength(1);
    });

    // ========================================
    // Step 5: Add second fillup
    // ========================================
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
      fireEvent.changeText(getByTestId('fuel-amount-input'), '45');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('total-price-input'), '280');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('distance-input'), '500');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      expect(getMockFillups()).toHaveLength(2);
    });

    // ========================================
    // Step 6: Verify calculated statistics
    // ========================================
    const fillups = getMockFillups();
    const secondFillup = fillups.find(f => f.distance_traveled === 500 && f.fuel_amount === 45);
    expect(secondFillup).toBeTruthy();
    expect(secondFillup!.distance_traveled).toBe(500);
    expect(secondFillup!.fuel_consumption).toBe(9); // 45L / 500km * 100 = 9 L/100km
    expect(secondFillup!.price_per_liter).toBeCloseTo(6.22, 1); // 280/45

    // ========================================
    // Step 7: Verify database integrity
    // ========================================
    expect(getMockCars()).toHaveLength(1);
    expect(getMockFillups()).toHaveLength(2);
    
    // All fillups belong to our car
    expect(fillups.every(f => f.car_id === getMockCars()[0].id)).toBe(true);
  });

  it('handles multiple cars independently', async () => {
    const { getByTestId, getByText } = render(<FullApp />);

    // Add first car
    await waitFor(() => {
      expect(getByTestId('add-car-fab')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('add-car-fab'));
    });

    await waitFor(() => {
      expect(getByTestId('name-input')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('name-input'), 'BMW X5');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      expect(getMockCars()).toHaveLength(1);
    });

    // Add second car
    await waitFor(() => {
      expect(getByTestId('add-car-fab')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('add-car-fab'));
    });

    await waitFor(() => {
      expect(getByTestId('name-input')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('name-input'), 'Audi A4');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      const cars = getMockCars();
      expect(cars).toHaveLength(2);
      expect(cars[0].id).not.toBe(cars[1].id);
      expect(cars.map(c => c.name)).toContain('BMW X5');
      expect(cars.map(c => c.name)).toContain('Audi A4');
    });
  });
});
