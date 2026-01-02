import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import CarDetailsScreen from '../CarDetailsScreen';
import { CarRepository } from '../../database/CarRepository';
import { FillupRepository } from '../../database/FillupRepository';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, View, Component, TouchableOpacity, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

// Setup Mocks
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  dispatch: jest.fn(),
};

jest.mock('@react-navigation/native', () => {
    const Actual = jest.requireActual('@react-navigation/native');
    const React = require('react');
    return {
        ...Actual,
        useNavigation: jest.fn(() => mockNavigation),
        // Use empty dependency array to prevent multiple calls
        useFocusEffect: jest.fn((cb) => {
          React.useEffect(() => {
            const cleanup = cb();
            return cleanup;
          }, []);  // Empty array - only run once per mount
        }),
    };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const MOCK_INSETS = { top: 0, left: 0, right: 0, bottom: 0 };
  const CA = React.createContext(MOCK_INSETS);
  return {
    useSafeAreaInsets: () => MOCK_INSETS,
    SafeAreaProvider: ({ children }: any) => React.createElement(CA.Provider, { value: MOCK_INSETS }, children),
    SafeAreaInsetsContext: CA,
    SafeAreaView: ({ children }: any) => children,
  };
});

jest.mock('react-native-paper', () => {
    // console.log('REGISTERING MOCK: react-native-paper');
    const Actual = jest.requireActual('react-native-paper');
    const { View, Text, TouchableOpacity } = require('react-native');
    const React = require('react');

    const MockAppbar = {
        ...Actual.Appbar,
        Header: ({ children, style }: any) => <View style={style}>{children}</View>,
        BackAction: (props: any) => <TouchableOpacity onPress={props.onPress} testID="back-action"><Text>Back</Text></TouchableOpacity>,
        Content: (props: any) => <Text>{props.title}</Text>,
        Action: (props: any) => <TouchableOpacity onPress={() => { props.onPress && props.onPress(); }} testID={props.testID || "appbar-action"}><Text>Action</Text></TouchableOpacity>
    };

    const MockModal = ({ visible, children, onDismiss }: any) => {
        if (!visible) return null;
        return (
            <View testID="mock-modal">
                {children}
            </View>
        );
    };

    const MockPortal = ({ children }: any) => {
        return <View testID="mock-portal">{children}</View>;
    };

    return {
        ...Actual,
        Appbar: MockAppbar,
        Modal: MockModal,
        Portal: MockPortal,
    };
});

jest.mock('@justfuel/shared', () => ({
    ConsumptionDeviation: {
        EXTREMELY_LOW: 'EXTREMELY_LOW',
        VERY_LOW: 'VERY_LOW',
        LOW: 'LOW',
        NEUTRAL: 'NEUTRAL',
        HIGH: 'HIGH',
        VERY_HIGH: 'VERY_HIGH',
        EXTREMELY_HIGH: 'EXTREMELY_HIGH',
    },
    getConsumptionDeviation: jest.fn(() => 'NEUTRAL'),
    formatDate: jest.fn(() => '01.01.2025'),
    generateCsv: jest.fn(() => 'date,fuel_amount\n2025-01-01,50'),
    parseCsv: jest.fn((content) => {
        if (content.includes('distance')) {
             return Promise.resolve({
                fillups: [{ date: '2025-01-01', fuel_amount: 50, total_price: 300, distance_traveled: 500, odometer: null }],
                errors: [],
                uniqueDates: []
            });
        }
        return Promise.resolve({
            fillups: [{ date: '2025-01-01', fuel_amount: 50, total_price: 300, odometer: 1000 }],
            errors: [],
            uniqueDates: []
        });
    }),
    validateImportAgainstCar: jest.fn(() => []),
}));

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
    (FileSystem as any).documentDirectory = 'file:///test/';
    (Sharing.shareAsync as any).mockResolvedValue(undefined);
    (Sharing.isAvailableAsync as any).mockResolvedValue(true);
  });

  afterEach(async () => {
    // Wait for any pending async operations to settle before cleanup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  const renderWithProvider = (component: any) => {
    return render(
      <PaperProvider>
        <NavigationContainer>
          {component}
        </NavigationContainer>
      </PaperProvider>
    );
  };

  const triggerMenu = async () => {
      await waitFor(() => expect(mockNavigation.setOptions).toHaveBeenCalled());
      const calls = (mockNavigation.setOptions as any).mock.calls;
      const lastCall = calls[calls.length - 1];
      const options = lastCall[0];
      if (options?.headerRight) {
           const element = options.headerRight();
          if (element.props.onPress) {
              await act(async () => {
                element.props.onPress();
              });
          }
      }
  };

  it('should export CSV correctly for odometer-based car', async () => {
     const { getByText, findAllByText, debug } = renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);
     
     await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());
     await waitFor(() => expect(findAllByText(/2025/)).toBeTruthy());

     await waitFor(() => expect(findAllByText(/2025/)).toBeTruthy());

     await triggerMenu();

     const exportBtn = await waitFor(() => getByText('Eksportuj (CSV)'));
     fireEvent.press(exportBtn);

     const { generateCsv } = require('@justfuel/shared');
     expect(generateCsv).toHaveBeenCalled();

     await waitFor(() => {
         expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
             expect.stringContaining('justfuel_Test_Car'),
             expect.stringContaining('date,fuel_amount'),
             expect.objectContaining({ encoding: 'utf8' })
         );
     });
     
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
    
    // Update generateCsv mock for this test
    const { generateCsv } = require('@justfuel/shared');
    (generateCsv as any).mockReturnValue('date,fuel_amount,distance,other\n2025-01-01,50,500,0');

     const { findAllByText, getByText } = renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);

     await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());
     await findAllByText(/2025/);

     await triggerMenu();
     
     const exportBtn = await waitFor(() => getByText('Eksportuj (CSV)'));
     fireEvent.press(exportBtn);

     await waitFor(() => {
         expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
         const [[path, content]] = (FileSystem.writeAsStringAsync as any).mock.calls;
         expect(content).toMatch(/,500,/);
     });
  });

  it('should handle import for odometer car', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title: any, message: any, buttons: any) => {
        const proceedBtn = buttons?.find((b: any) => b.text === 'Wybierz plik');
        if (proceedBtn && proceedBtn.onPress) {
            proceedBtn.onPress();
        }
        const importBtn = buttons?.find((b: any) => b.text === 'Importuj');
        if (importBtn && importBtn.onPress) {
            importBtn.onPress();
        }
    });

      (DocumentPicker.getDocumentAsync as any).mockResolvedValue({
          canceled: false,
          assets: [{ uri: 'file:///test.csv' }]
      });
      (FileSystem.readAsStringAsync as any).mockResolvedValue(`date,fuel_amount,total_price,odometer
01.01.2025,50,300,1000`);

      const { getByText, findAllByText } = renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);
      await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());
      await findAllByText(/2025/);

     await triggerMenu();

     const importMenuBtn = await waitFor(() => getByText('Importuj (CSV)'));
     await act(async () => {
       fireEvent.press(importMenuBtn);
       // Wait for async import operations to complete
       await new Promise(resolve => setTimeout(resolve, 100));
     });
    
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
        const proceedBtn = buttons?.find((b: any) => b.text === 'Wybierz plik');
        if (proceedBtn && proceedBtn.onPress) {
            proceedBtn.onPress();
        }
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

      const { getByText, findAllByText } = renderWithProvider(<CarDetailsScreen route={{ params: { carId: 'car-1', carName: 'Test Car' } } as any} navigation={mockNavigation as any} />);
      await waitFor(() => expect(CarRepository.getCarById).toHaveBeenCalled());
      await findAllByText(/2025/);

     await triggerMenu();
     
     const importMenuBtn = await waitFor(() => getByText('Importuj (CSV)'));
     
     await act(async () => {
       fireEvent.press(importMenuBtn);
       // Wait for async import operations to complete
       await new Promise(resolve => setTimeout(resolve, 100));
     });
     
     // Verify import was called (even though this is distance car)
     await waitFor(() => {
       expect(FillupRepository.batchImportFillups).toHaveBeenCalled();
     });
  });
});
