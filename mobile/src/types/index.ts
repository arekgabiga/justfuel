export type MileagePreference = 'odometer' | 'distance';

export interface Car {
  id: string; // UUID
  name: string;
  initial_odometer: number;
  mileage_input_preference: MileagePreference;
  created_at: string; // ISO Date String
  average_consumption?: number;
  total_cost?: number;
  total_distance?: number;
  fillups_count?: number;
}

export interface Fillup {
  id: string; // UUID
  car_id: string;
  date: string; // ISO Date String
  fuel_amount: number;
  total_price: number;
  odometer: number;
  distance_traveled: number | null; // Null for the first fillup
  fuel_consumption: number | null; // Null for the first fillup
  price_per_liter: number;
  created_at: string; // ISO Date String
}

// For creating a new car (omit auto-generated fields)
export type NewCar = Omit<Car, 'id' | 'created_at'>;

// For creating a new fillup
export type NewFillup = Omit<
  Fillup,
  'id' | 'created_at' | 'distance_traveled' | 'fuel_consumption' | 'price_per_liter'
> & {
  // We might calculate these before saving, or validation, but usually we pass raw input
};
