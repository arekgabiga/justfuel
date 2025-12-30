import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationState } from '@react-navigation/native';
import { Car, Fillup } from '../types';

/**
 * Central navigation types for the entire application.
 * All screens should use these types instead of defining their own.
 */
export type RootStackParamList = {
  CarList: undefined;
  AddCar: { car?: Car } | undefined;
  CarDetails: { carId: string; carName: string };
  FillupForm: { carId: string; fillup?: Fillup };
};

// Screen props types - use these in screen components
export type CarListScreenProps = NativeStackScreenProps<RootStackParamList, 'CarList'>;
export type AddCarScreenProps = NativeStackScreenProps<RootStackParamList, 'AddCar'>;
export type CarDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'CarDetails'>;
export type FillupFormScreenProps = NativeStackScreenProps<RootStackParamList, 'FillupForm'>;

// Navigation prop type for useNavigation hook
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Initial state type for App.tsx
export type AppInitialState = NavigationState<RootStackParamList> | undefined;
