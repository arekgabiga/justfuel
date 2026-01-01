/**
 * Integration Test: Add Car Flow
 * 
 * Tests the complete flow of adding a new car using a simulated in-memory database.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockDb, resetMockDatabase, getMockCars } from '../utils/mockDatabase';

// Mock the schema module to use our test database
jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

// Screens - import AFTER mocking dependencies
import CarListScreen from '../../../screens/CarListScreen';
import AddCarScreen from '../../../screens/AddCarScreen';
import CarDetailsScreen from '../../../screens/CarDetailsScreen';

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

const TestApp = () => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: mockSafeAreaInsets }}>
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="CarList">
          <Stack.Screen name="CarList" component={CarListScreen} options={{ title: 'Moje Samochody' }} />
          <Stack.Screen name="CarDetails" component={CarDetailsScreen} options={{ title: 'Szczegóły' }} />
          <Stack.Screen name="AddCar" component={AddCarScreen} options={{ title: 'Dodaj Samochód' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  </SafeAreaProvider>
);

describe('Add Car Flow (Integration)', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  // ... existing tests ...

  it('shows empty state when no cars exist', async () => {
    const { getByText, getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByText('Brak samochodów')).toBeTruthy();
      expect(getByTestId('add-car-fab')).toBeTruthy();
    });
  });

  it('navigates to AddCar screen when FAB is pressed', async () => {
    const { getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('add-car-fab')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('add-car-fab'));
    });

    await waitFor(() => {
      expect(getByTestId('name-input')).toBeTruthy();
      expect(getByTestId('save-button')).toBeTruthy();
    });
  });

  it('adds a car and saves it to the database', async () => {
    const { getByTestId, getByText } = render(<TestApp />);

    await waitFor(() => {
      expect(getByText('Brak samochodów')).toBeTruthy();
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
      fireEvent.changeText(getByTestId('odometer-input'), '150000');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      const cars = getMockCars();
      expect(cars).toHaveLength(1);
      expect(cars[0].name).toBe('Audi A4');
      expect(cars[0].initial_odometer).toBe(150000);
    });

    await waitFor(() => {
      expect(getByText('Audi A4')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('shows validation error for empty name and does not save', async () => {
    const { getByTestId } = render(<TestApp />);

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
      fireEvent.press(getByTestId('save-button'));
    });

    expect(getMockCars()).toHaveLength(0);
  });

  it('can add multiple cars', async () => {
    const { getByTestId } = render(<TestApp />);

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
      expect(cars.map(c => c.name)).toContain('BMW X5');
      expect(cars.map(c => c.name)).toContain('Audi A4');
    });
  });

  it('prevents changing mileage preference when editing an existing car', async () => {
    // Setup - add a car first
    const { getByTestId, getByText, getByLabelText, getAllByText } = render(<TestApp />);
    
    // Add a car with 'odometer' preference
    await waitFor(() => expect(getByTestId('add-car-fab')).toBeTruthy());
    await act(async () => fireEvent.press(getByTestId('add-car-fab')));
    
    await waitFor(() => expect(getByTestId('name-input')).toBeTruthy());
    await act(async () => {
      fireEvent.changeText(getByTestId('name-input'), 'Edit Me');
      fireEvent.changeText(getByTestId('odometer-input'), '100');
    });
    
    // Select odometer explicitly
    const odometerButton = getByText('Stan Licznika');
    await act(async () => fireEvent.press(odometerButton));
    
    await act(async () => fireEvent.press(getByTestId('save-button')));
    
    // Wait for list to update
    await waitFor(() => expect(getByText('Edit Me')).toBeTruthy());
    
    // Navigate to details
    const carItem = getByText('Edit Me');
    await act(async () => fireEvent.press(carItem));
    
    // In CarDetails
    await waitFor(() => expect(getByText('Tankowania')).toBeTruthy());

    // Open Menu
    await waitFor(() => expect(getByTestId('menu-action')).toBeTruthy());
    await act(async () => fireEvent.press(getByTestId('menu-action')));

    // Click Edit
    await waitFor(() => expect(getByText('Edytuj')).toBeTruthy());
    await act(async () => fireEvent.press(getByText('Edytuj')));

    // Verify AddCar screen is in Edit Mode
    await waitFor(() => expect(getByTestId('name-input')).toBeTruthy());
    // Should see "Edit Mode" specific text or title
    expect(getByText('Tego ustawienia nie można zmienić po utworzeniu samochodu.')).toBeTruthy();

    // Try to change preference to 'distance'
    const distanceButton = getByText('Dystans');
    await act(async () => fireEvent.press(distanceButton));

    // Save and verify it's still odometer
    await act(async () => fireEvent.press(getByTestId('save-button')));
    
    // Navigate back to details or list, verify car data in DB or logic
    const cars = getMockCars();
    const editedCar = cars.find(c => c.name === 'Edit Me');
    expect(editedCar).toBeDefined();
    expect(editedCar?.mileage_input_preference).toBe('odometer');
  });
});
