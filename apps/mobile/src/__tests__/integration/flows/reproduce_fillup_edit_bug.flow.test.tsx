/**
 * Integration Test: Reproduce Fillup Edit Bug
 * 
 * Scenario:
 * 1. User has car with 3 fillups.
 * 2. User edits the middle fillup (#2).
 * 3. Bug: The first fillup (f1) loses its manually entered/valid stats because recalculateStats wipes it out for the first record.
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
  seedFillup 
} from '../utils/mockDatabase';

// Mock the schema module
jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View, Button } = require('react-native');
  const MockDateTimePicker = (props: any) => {
    
    const triggerDate = (isoDate: string) => {
       const newDate = new Date(isoDate);
       props.onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
    };

    return React.createElement(View, { testID: 'wrapper-mock-picker' }, [
       React.createElement(Button, { 
         key: 'btn-1',
         title: "Set 12.12",
         onPress: () => triggerDate('2025-12-12T12:00:00.000Z'),
         testID: 'set-date-12-12' 
       }),
       React.createElement(Button, { 
         key: 'btn-2',
         title: "Set 07.12",
         onPress: () => triggerDate('2025-12-07T12:00:00.000Z'),
         testID: 'set-date-07-07'
       })
    ]);
  };
  return {
    __esModule: true,
    default: MockDateTimePicker,
  };
});


import CarDetailsScreen from '../../../screens/CarDetailsScreen';
import FillupFormScreen from '../../../screens/FillupFormScreen';
import { RootStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = { ...MD3LightTheme };
const mockSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const TestApp = ({ initialCarId, initialCarName }: { initialCarId: string, initialCarName: string }) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: mockSafeAreaInsets }}>
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="CarDetails">
          <Stack.Screen 
            name="CarDetails" 
            component={CarDetailsScreen}
            initialParams={{ carId: initialCarId, carName: initialCarName }}
          />
          <Stack.Screen 
            name="FillupForm" 
            component={FillupFormScreen} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  </SafeAreaProvider>
);

describe('Bug Reproduction: f1 Stats Loss', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('preserves stats for the first fillup after recalculation', async () => {
    // 1. Initial State
    
    const car = seedCar({ 
      name: 'Test Car', 
      initial_odometer: 0,
      mileage_input_preference: 'odometer' 
    });

    const f1 = seedFillup(car.id, {
        date: '2025-12-01T12:00:00.000Z',
        odometer: 500,
        fuel_amount: 50,
        total_price: 250,
        // Manually entered / Valid stats for first fillup
        distance_traveled: 500, 
        fuel_consumption: 10.0,
    }); 

    const f2 = seedFillup(car.id, {
        date: '2025-12-07T12:00:00.000Z',
        odometer: 950,
        fuel_amount: 40,
        total_price: 280,
        distance_traveled: 450,
        fuel_consumption: 8.89,
    }); 

    const f3 = seedFillup(car.id, {
        date: '2025-12-10T12:00:00.000Z',
        odometer: 1500,
        fuel_amount: 48,
        total_price: 270,
        distance_traveled: 550,
        fuel_consumption: 8.73,
    }); 

    // Helper to get fresh data
    const getFreshFillups = () => getMockFillups().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Verify Initial State
    let fillups = getFreshFillups();
    expect(fillups[0].id).toBe(f1.id);
    expect(fillups[0].distance_traveled).toBe(500); // Has data
    expect(fillups[0].fuel_consumption).toBeCloseTo(10.0, 1);


    const { getByText, getByTestId, findByText } = render(
        <TestApp initialCarId={car.id} initialCarName={car.name} />
    );

    // ===========================================
    // STEP 1: Edit middle fillup (f2). 
    // Just triggering any save should trigger recalculateStats.
    // ===========================================
    
    // Find f2 card (950km)
    await waitFor(() => getByText('950'));
    const f2Card = getByText('950');
    await act(async () => fireEvent.press(f2Card));

    // Change Odometer to 1950 (Step 1)
    const odoInput = await waitFor(() => getByTestId('odometer-input'));
    await act(async () => fireEvent.changeText(odoInput, '1950'));

    // Save
    await act(async () => fireEvent.press(getByTestId('save-button')));

    // Verify f1 state -- IT SHOULD BE PRESERVED
    await waitFor(() => {
        fillups = getFreshFillups();
        // f1 is still first fillup (sorted by date: 01.12)
        expect(fillups[0].id).toBe(f1.id);
        
        // BUG EXPECTATION: logic sets this to null.
        // ASSERT: It should retain 500.
        expect(fillups[0].distance_traveled).toBe(500);
        expect(fillups[0].fuel_consumption).not.toBeNull();
        expect(fillups[0].fuel_consumption).toBeCloseTo(10.0, 1);
    });
  });
});
