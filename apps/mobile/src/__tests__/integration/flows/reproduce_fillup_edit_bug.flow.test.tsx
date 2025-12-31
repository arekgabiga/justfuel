/**
 * Integration Test: Reproduce Fillup Edit Bug
 * 
 * Scenario:
 * 1. User has car with 3 fillups.
 * 2. User edits the middle fillup (#2) and changes its date forward (e.g. 04.12 -> 07.12).
 * 3. Bug: The "previous fillup" query mistakenly finds the *current* fillup (old version in DB) because it is 'before' the new date.
 * 4. Result: Consumption becomes invalid because distance is calculated as 0 (current - current).
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
  const MockDateTimePicker = (props: any) => {
    // When we press this, it will simulate a date change to '2025-12-07'
    // In a real test we might want to pass the date dynamically, but for this reproduction hardcoding the target date 
    // in the 'onPress' triggers the flow we want.
    const triggerChange = () => {
       const newDate = new Date('2025-12-07T12:00:00.000Z');
       props.onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
    };

    return React.createElement('View', { testID: 'wrapper-mock-picker' }, 
       React.createElement('Button', { 
         title: "Change Date",
         onPress: triggerChange,
         testID: 'mock-datetimepicker-trigger' 
       })
    );
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

describe('Bug Reproduction: Edit Fillup Date', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('recalculates correctly when date is moved forward but still assumes correct order', async () => {
    // 1. Setup
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
    }); // 500km traveled (from 0), 10 L/100km

    const f2 = seedFillup(car.id, {
        date: '2025-12-04T12:00:00.000Z',
        odometer: 950,
        fuel_amount: 40,
        total_price: 280,
    }); // 450km traveled (from 500), ~8.88 L/100km

    const f3 = seedFillup(car.id, {
        date: '2025-12-10T12:00:00.000Z',
        odometer: 1500,
        fuel_amount: 48,
        total_price: 270,
    }); // 550km traveled (from 950), ~8.72 L/100km

    const { getByText, getByTestId, findByTestId } = render(
        <TestApp initialCarId={car.id} initialCarName={car.name} />
    );

    // Verify initial state of f2
    await waitFor(() => {
        // We look for the card with f2 date. 
        // formatDate might vary (DD.MM.YYYY), assume "04.12.2025" or similar.
        // We can just rely on clicking the second item in the list if we can find it.
        // But clicking by text is safer if unique.
        // Let's assume the list renders in order.
    });

    // Instead of relying on text, let's find the card by some content.
    // The odometer "950" is unique to f2.
    const f2CardOdometer = await waitFor(() => getByText('950'));
    
    // Check initial consumption is visible (not "-")
    // It should be around 8.89
    // Due to multiple "8.89" potentially, we just ensure we click the card containing 950.
    // The renderFillupItem wraps everything in a Card that is touchable.
    // We can traverse up or just fire press on the card.
    
    await act(async () => {
        fireEvent.press(f2CardOdometer);
    });

    // NOW in FillupFormScreen
    await waitFor(() => expect(getByTestId('odometer-input')).toBeTruthy());

    // 2. Open Date Picker
    const dateInput = getByTestId('date-input');
    await act(async () => {
        // The icon has the onPress, but the TouchableOpacity wraps the input.
        // The input parent is TouchableOpacity.
        fireEvent.press(dateInput); 
    });

    // 3. Change Date to 07.12.2025
    const trigger = await findByTestId('mock-datetimepicker-trigger');
    
    await act(async () => {
        fireEvent.press(trigger);
    });

    // Wait for effect to reload data (loadData depends on [date])
    // The bug causes 'lastFillup' to become f2 itself (because f2 in DB is 04.12, which is < 07.12)
    // f2.odometer is 950. Input is 950. Dist = 0.
    
    // 4. Save
    await act(async () => {
        fireEvent.press(getByTestId('save-button'));
    });

    // 5. Verify Result
    // Back in list.
    // The second fillup (now 07.12) should have valid consumption.
    // If bug exists, it will have "-" (null) or 0 consumption or infinite.
    // But importantly, if dist=0, user says consumption shown as "-".
    
    await waitFor(async () => {
       const fillups = getMockFillups();
       // Find the updated fillup
       const updated = fillups.find(f => f.id === f2.id);
       expect(updated?.date).toContain('2025-12-07');
       
       // BUG ASSERTION:
       // If bug is present, distance_traveled will be 0 (950 - 950)
       // And fuel_consumption will be calculated from 0 distance -> likely Infinity or null.
       
       // Correct behavior: LAST fillup found should be f1 (01.12, 500km).
       // Dist = 950 - 500 = 450.
       // Consumption = 40 / 4.5 = 8.88.
       

       expect(updated?.distance_traveled).toBe(450); 
       expect(updated?.fuel_consumption).not.toBeNull();
       expect(updated?.fuel_consumption).toBeCloseTo(8.89, 2);
    });
  });
});
