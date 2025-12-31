/**
 * Integration Test: Inconsistent Fillups Sequence
 * 
 * Scenario:
 * 1. User has 3 fillups: A (01.12), B (04.12), C (10.12).
 *    Odometers: 500, 950, 1500.
 * 2. User edits C (1500, 10.12) and changes date to 02.12.
 * 3. Validation for C: Previous is A (500). 1500 > 500. OK. Save succeeds.
 * 4. New list order (Date DESC): 
 *    - B (04.12, 950)
 *    - C (02.12, 1500)
 *    - A (01.12, 500)
 * 5. B (950) now follows C (1500). 
 *    950 < 1500. This is inconsistent.
 * 6. UI should flag B as invalid/requiring attention.
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

jest.mock('../../../database/schema', () => ({
  getDBConnection: jest.fn(async () => mockDb),
  createTables: jest.fn(),
}));

jest.mock('@react-native-community/datetimepicker', () => {
    const React = require('react');
    const MockDateTimePicker = (props: any) => {
      const triggerChange = () => {
         // Set date to 02.12.2025
         const newDate = new Date('2025-12-02T12:00:00.000Z');
         props.onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
      };
      return React.createElement('View', { testID: 'wrapper-mock-picker' }, 
         React.createElement('Button', { 
           title: "Set Date to 02.12",
           onPress: triggerChange,
           testID: 'mock-datetimepicker-trigger' 
         })
      );
    };
    return { __esModule: true, default: MockDateTimePicker };
});

import CarDetailsScreen from '../../../screens/CarDetailsScreen';
import FillupFormScreen from '../../../screens/FillupFormScreen';
import { RootStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const TestApp = ({ initialCarId, initialCarName }: { initialCarId: string, initialCarName: string }) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, bottom: 0, left: 0, right: 0 } }}>
    <PaperProvider theme={MD3LightTheme}>
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

describe('Inconsistent Fillup Sequence', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  it('flags a fillup as invalid when another fillup change breaks the odometer sequence', async () => {
    // 1. Setup Data
    const car = seedCar({ name: 'Test Car', initial_odometer: 0, mileage_input_preference: 'odometer' });

    seedFillup(car.id, { date: '2025-12-01', odometer: 500 }); // A
    const fB = seedFillup(car.id, { date: '2025-12-04', odometer: 950 }); // B
    seedFillup(car.id, { date: '2025-12-10', odometer: 1500 }); // C

    const { getByText, findByTestId } = render(
        <TestApp initialCarId={car.id} initialCarName={car.name} />
    );

    // 2. Edit Fillup C (1500km)
    const fCCard = await waitFor(() => getByText('1500'));
    await act(async () => { fireEvent.press(fCCard); });

    // 3. Change date to 02.12 (mock triggers this date)
    await waitFor(() => findByTestId('date-input'));
    await act(async () => { fireEvent.press(await findByTestId('date-input')); });
    await act(async () => { fireEvent.press(await findByTestId('mock-datetimepicker-trigger')); });

    // 4. Save
    await act(async () => { fireEvent.press(await findByTestId('save-button')); });

    // 5. Verify C was updated in DB
    await waitFor(async () => {
         const fillups = getMockFillups();
         // Find C (1500km)
         const c = fillups.find(f => f.odometer === 1500);
         expect(c?.date).toContain('2025-12-02');
    });

    // 6. Expect warning on B (950km) because 950 < 1500 (C is now older than B but has higher odometer)
    const warningIcon = await findByTestId(`warning-icon-${fB.id}`);
    expect(warningIcon).toBeTruthy();
  });
});
