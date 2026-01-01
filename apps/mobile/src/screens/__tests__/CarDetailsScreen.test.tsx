import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CarDetailsScreen from '../CarDetailsScreen';
import { CarRepository } from '../../database/CarRepository';
import { FillupRepository } from '../../database/FillupRepository';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

// helper to render with provider
const renderWithProvider = (component: React.ReactElement) => {
    return render(
        <PaperProvider>
            {component}
        </PaperProvider>
    );
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.requireActual('react').useEffect,
  useRoute: () => ({
    params: { carId: 'car-1', carName: 'Test Car' },
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const MOCK_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };
  const MockSafeAreaContext = React.createContext(MOCK_INSETS);
  return {
    useSafeAreaInsets: () => MOCK_INSETS,
    SafeAreaProvider: ({ children }: any) => React.createElement(MockSafeAreaContext.Provider, { value: MOCK_INSETS }, children),
    SafeAreaInsetsContext: MockSafeAreaContext,
    SafeAreaView: ({ children }: any) => children,
  };
});

// Repositories are already mocked globally via jest-setup perhaps? 
// Or we mock them specifically here to control return values.
// checking jest-setup.ts... it mocks libraries but not necessarily our repositories unless we inspect it.
// Assuming we need to mock implementations here for specific data.

jest.mock('../../database/CarRepository');
jest.mock('../../database/FillupRepository');

describe('CarDetailsScreen Import/Export', () => {
  const mockCar = {
    id: 'car-1',
    name: 'Test Car',
    mileage_input_preference: 'odometer',
    user_id: 'u1'
  };

  const mockFillups = [
    { id: 'f1', date: '2025-01-01', fuel_amount: 50, total_price: 300, odometer: 1000, distance_traveled: 500, fuel_consumption: 10, price_per_liter: 6 },
    { id: 'f2', date: '2024-12-01', fuel_amount: 50, total_price: 300, odometer: 500, distance_traveled: 500, fuel_consumption: 10, price_per_liter: 6 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (CarRepository.getCarById as any).mockResolvedValue(mockCar);
    (FillupRepository.getFillupsByCarId as any).mockResolvedValue(mockFillups);
    (FileSystem.writeAsStringAsync as any).mockResolvedValue(undefined);
    (Sharing.shareAsync as any).mockResolvedValue(undefined);
    (Sharing.isAvailableAsync as any).mockResolvedValue(true);
  });

  it('should export CSV correctly for odometer-based car', async () => {
     renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);
     
     // Wait for load
     await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());

     // Verify setOptions called
     expect(mockNavigation.setOptions).toHaveBeenCalled();
     let lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     let HeaderRight = lastCall.headerRight;
     
     let headerRender = renderWithProvider(<HeaderRight />);

     // Open Menu
     fireEvent.press(headerRender.getByTestId('menu-action'));

     await waitFor(() => {
         const calls = (mockNavigation.setOptions as any).mock.calls;
         expect(calls.length).toBeGreaterThan(1);
     });

     lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     HeaderRight = lastCall.headerRight;
     headerRender = renderWithProvider(<HeaderRight />);

     await waitFor(() => headerRender.getByText('Eksportuj (CSV)'));

     // Press Export
     fireEvent.press(headerRender.getByText('Eksportuj (CSV)'));

     // Verify File Write
     await waitFor(() => {
         expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
             expect.stringContaining('justfuel_Test_Car'),
             expect.stringContaining('date,fuel_amount'),
             expect.objectContaining({ encoding: 'utf8' })
         );
     });
     
     // Verify Share
     await waitFor(() => {
         expect(Sharing.shareAsync).toHaveBeenCalled();
     });
  });

  it('should export CSV correctly for distance-based car', async () => {
    (CarRepository.getCarById as any).mockResolvedValue({
        ...mockCar,
        mileage_input_preference: 'distance'
    });
    const distanceFillups = [
         { id: 'f1', date: '2025-01-01', fuel_amount: 50, total_price: 300, odometer: null, distance_traveled: 500, fuel_consumption: 10, price_per_liter: 6 },
    ];
    (FillupRepository.getFillupsByCarId as any).mockResolvedValue(distanceFillups);

     renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);

     await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());

     let lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     let HeaderRight = lastCall.headerRight;
     
     let headerRender = renderWithProvider(<HeaderRight />);
     
     fireEvent.press(headerRender.getByTestId('menu-action'));
     
     // Wait for re-render with menu open
     await waitFor(() => {
         const calls = (mockNavigation.setOptions as any).mock.calls;
         expect(calls.length).toBeGreaterThan(1); // At least initial + update
         return calls;
     });
     
     // Get NEW header
     lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     HeaderRight = lastCall.headerRight;
     headerRender = renderWithProvider(<HeaderRight />);

     await waitFor(() => headerRender.getByText('Eksportuj (CSV)'));
     fireEvent.press(headerRender.getByText('Eksportuj (CSV)'));

     await waitFor(() => {
         expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
         const [[path, content]] = (FileSystem.writeAsStringAsync as any).mock.calls;
         expect(content).toMatch(/,500,/); // distance
     });
  });

  it('should handle import for odometer car', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title: any, message: any, buttons: any) => {
        const importBtn = buttons?.find((b: any) => b.text === 'Importuj');
        if (importBtn && importBtn.onPress) {
            importBtn.onPress(); // Auto-confirm
        }
    });

      (DocumentPicker.getDocumentAsync as any).mockResolvedValue({
          canceled: false,
          assets: [{ uri: 'file:///test.csv' }]
      });
      (FileSystem.readAsStringAsync as any).mockResolvedValue(`date,fuel_amount,total_price,odometer
01.01.2025,50,300,1000`);

      renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);
      await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());

     let lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     let HeaderRight = lastCall.headerRight;
     let headerRender = renderWithProvider(<HeaderRight />);

     fireEvent.press(headerRender.getByTestId('menu-action'));

     await waitFor(() => {
         const calls = (mockNavigation.setOptions as any).mock.calls;
         expect(calls.length).toBeGreaterThan(1); 
     });

     lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     HeaderRight = lastCall.headerRight;
     headerRender = renderWithProvider(<HeaderRight />);

     await waitFor(() => headerRender.getByText('Importuj (CSV)'));
     fireEvent.press(headerRender.getByText('Importuj (CSV)'));
    
    await waitFor(() => {
        expect(FillupRepository.batchImportFillups).toHaveBeenCalledWith(
            'car-1',
            expect.arrayContaining([
                expect.objectContaining({ odometer: 1000 })
            ])
        );
    });
  });

  it('should handle import for distance car', async () => {
    (CarRepository.getCarById as any).mockResolvedValue({
        ...mockCar,
        mileage_input_preference: 'distance'
    });

    jest.spyOn(Alert, 'alert').mockImplementation((title: any, message: any, buttons: any) => {
        const importBtn = buttons?.find((b: any) => b.text === 'Importuj');
        if (importBtn && importBtn.onPress) {
            importBtn.onPress();
        }
    });

      (DocumentPicker.getDocumentAsync as any).mockResolvedValue({
          canceled: false,
          assets: [{ uri: 'file:///test.csv' }]
      });
      (FileSystem.readAsStringAsync as any).mockResolvedValue(`date,fuel_amount,total_price,distance
01.01.2025,50,300,500`);

      renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);
      await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());

     let lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     let HeaderRight = lastCall.headerRight;
     let headerRender = renderWithProvider(<HeaderRight />);

     fireEvent.press(headerRender.getByTestId('menu-action'));
     
     await waitFor(() => {
         const calls = (mockNavigation.setOptions as any).mock.calls;
         expect(calls.length).toBeGreaterThan(1);
     });

     lastCall = (mockNavigation.setOptions as any).mock.calls[(mockNavigation.setOptions as any).mock.calls.length - 1][0];
     HeaderRight = lastCall.headerRight;
     headerRender = renderWithProvider(<HeaderRight />);

     await waitFor(() => headerRender.getByText('Importuj (CSV)'));
     
     fireEvent.press(headerRender.getByText('Importuj (CSV)'));
    
    await waitFor(() => {
        expect(FillupRepository.batchImportFillups).toHaveBeenCalledWith(
            'car-1',
            expect.arrayContaining([
                expect.objectContaining({ 
                    distance_traveled: 500,
                    odometer: null 
                })
            ])
        );
    });
  });
});
