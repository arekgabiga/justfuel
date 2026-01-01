import { Car as CarDB, Fillup as FillupDB } from '@justfuel/shared';

export type MileagePreference = 'odometer' | 'distance';

export interface Car extends Omit<CarDB, 'mileage_input_preference' | 'user_id'> {
  mileage_input_preference: MileagePreference;
  average_consumption?: number;
  total_cost?: number;
  total_distance?: number;
  fillups_count?: number;
}

export interface Fillup extends Omit<FillupDB, 'odometer'> {
  odometer: number | null;
  // Mobile specific extensions if any
}

// For creating a new car (omit auto-generated fields and user_id if handling locally)
export type NewCar = Omit<Car, 'id' | 'created_at' | 'user_id'>;

// For creating a new fillup
export type NewFillup = Omit<
  Fillup,
  'id' | 'created_at' | 'distance_traveled' | 'fuel_consumption' | 'price_per_liter'
> & {
  distance_traveled?: number;
  fuel_consumption?: number | null;
  price_per_liter?: number;
};

export type ChartType = 'consumption' | 'price_per_liter' | 'distance';

