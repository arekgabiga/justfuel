import type { Tables, TablesInsert } from './database.types';

// ============================================================================
// Base Entity Types (from Database)
// ============================================================================

/**
 * Base Car entity from database
 */
export type Car = Tables<'cars'>;

/**
 * Base Fillup entity from database
 */
export type Fillup = Tables<'fillups'>;

/**
 * Car statistics view from database
 */
export type CarStatisticsView = Tables<'car_statistics'>;

// ============================================================================
// Car DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Basic car data returned by API
 * Used in responses for: POST /api/cars, PATCH /api/cars/{carId}
 * Excludes internal fields like user_id and created_at
 */
export type CarDTO = Pick<Car, 'id' | 'name' | 'initial_odometer' | 'mileage_input_preference'>;

/**
 * Car data with aggregated statistics
 * Used in responses for: GET /api/cars, GET /api/cars/{carId}
 * Combines CarDTO with statistics from CarStatisticsView
 */
export type CarWithStatisticsDTO = CarDTO & {
  statistics: Pick<
    CarStatisticsView,
    | 'total_fuel_cost'
    | 'total_fuel_amount'
    | 'total_distance'
    | 'average_consumption'
    | 'average_price_per_liter'
    | 'fillup_count'
  >;
};

/**
 * Detailed car data returned by API for single car view
 * Used in responses for: GET /api/cars/{carId}
 * Extends CarWithStatisticsDTO with created_at timestamp (ISO string)
 */
export type CarDetailsDTO = CarWithStatisticsDTO & { created_at: string };

/**
 * Extended car statistics with additional computed fields
 * Used in response for: GET /api/cars/{carId}/statistics
 * Combines database statistics with additional computed fields
 */
export type CarStatisticsDTO = Pick<
  CarStatisticsView,
  | 'car_id'
  | 'total_fuel_cost'
  | 'total_fuel_amount'
  | 'total_distance'
  | 'average_consumption'
  | 'average_price_per_liter'
  | 'fillup_count'
> & {
  latest_fillup_date: string | null;
  current_odometer: number | null;
};

// ============================================================================
// Car Commands (Request DTOs)
// ============================================================================

/**
 * Command to create a new car
 * Used in request body for: POST /api/cars
 */
export type CreateCarCommand = Pick<TablesInsert<'cars'>, 'name' | 'initial_odometer' | 'mileage_input_preference'>;

/**
 * Command to update existing car
 * Used in request body for: PATCH /api/cars/{carId}
 * All fields are optional - only provided fields will be updated
 */
export type UpdateCarCommand = Partial<Pick<Car, 'name' | 'mileage_input_preference'>>;

/**
 * Command to delete a car (requires confirmation)
 * Used in request body for: DELETE /api/cars/{carId}
 */
export interface DeleteCarCommand {
  confirmation_name: string;
}

// ============================================================================
// Fillup DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Basic fillup data returned by API
 * Used in responses for: GET /api/cars/{carId}/fillups, GET /api/cars/{carId}/fillups/{fillupId}
 * Excludes internal fields like created_at
 */
export type FillupDTO = Pick<
  Fillup,
  | 'id'
  | 'car_id'
  | 'date'
  | 'fuel_amount'
  | 'total_price'
  | 'odometer'
  | 'distance_traveled'
  | 'fuel_consumption'
  | 'price_per_liter'
>;

/**
 * Validation warning returned when creating/updating fillups
 */
export interface ValidationWarningDTO {
  field: string;
  message: string;
}

/**
 * Fillup data with validation warnings
 * Used in response for: POST /api/cars/{carId}/fillups
 */
export type FillupWithWarningsDTO = FillupDTO & {
  warnings?: ValidationWarningDTO[];
};

/**
 * Fillup data after update with metadata about affected entries
 * Used in response for: PATCH /api/cars/{carId}/fillups/{fillupId}
 */
export type UpdatedFillupDTO = FillupDTO & {
  updated_entries_count: number;
  warnings: ValidationWarningDTO[];
};

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
}

/**
 * Paginated list of fillups
 * Used in response for: GET /api/cars/{carId}/fillups
 */
export interface PaginatedFillupsResponseDTO {
  fillups: FillupDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Fillup Commands (Request DTOs)
// ============================================================================

/**
 * Base fillup input fields shared between create and update
 */
export interface BaseFillupInput {
  date: string; // ISO 8601 timestamp
  fuel_amount: number;
  total_price: number;
}

/**
 * Fillup input variant using odometer reading
 */
type FillupInputWithOdometer = BaseFillupInput & {
  odometer: number;
  distance?: never; // Explicitly exclude distance when odometer is provided
};

/**
 * Fillup input variant using distance traveled
 */
type FillupInputWithDistance = BaseFillupInput & {
  distance: number;
  odometer?: never; // Explicitly exclude odometer when distance is provided
};

/**
 * Command to create a new fillup
 * Used in request body for: POST /api/cars/{carId}/fillups
 * Supports two input methods: odometer or distance (mutually exclusive)
 */
export type CreateFillupCommand = FillupInputWithOdometer | FillupInputWithDistance;

/**
 * Command to update existing fillup
 * Used in request body for: PATCH /api/cars/{carId}/fillups/{fillupId}
 * All fields are optional - only provided fields will be updated
 */
export type UpdateFillupCommand = Partial<BaseFillupInput> & {
  odometer?: number;
  distance?: number;
};

// ============================================================================
// Chart and Statistics DTOs
// ============================================================================

/**
 * Chart type enum for chart data requests
 */
export type ChartType = 'consumption' | 'price_per_liter' | 'distance';

/**
 * Individual data point in chart time series
 */
export interface ChartDataPointDTO {
  date: string; // ISO 8601 timestamp
  value: number;
  odometer: number;
}

/**
 * Metadata about chart data distribution
 */
export interface ChartMetadataDTO {
  count: number;
  min: number;
  max: number;
}

/**
 * Chart data response with time series and statistics
 * Used in response for: GET /api/cars/{carId}/charts
 */
export interface ChartDataDTO {
  type: ChartType;
  data: ChartDataPointDTO[];
  average: number;
  metadata: ChartMetadataDTO;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

/**
 * Standard success response for list operations
 */
export interface ListResponseDTO<T> {
  data: T[];
}

/**
 * Standard success response for delete operations
 */
export interface DeleteResponseDTO {
  message: string;
  updated_entries_count?: number;
}

/**
 * Standard error response format
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for listing cars
 * Used in: GET /api/cars
 */
export interface ListCarsQueryParams {
  sort?: 'name' | 'created_at';
  order?: 'asc' | 'desc';
}

/**
 * Query parameters for listing fillups
 * Used in: GET /api/cars/{carId}/fillups
 */
export interface ListFillupsQueryParams {
  limit?: number; // default: 20, max: 100
  cursor?: string;
  sort?: 'date' | 'odometer';
  order?: 'asc' | 'desc';
}

/**
 * Query parameters for chart data
 * Used in: GET /api/cars/{carId}/charts
 */
export interface ChartQueryParams {
  type: ChartType;
  start_date?: string; // ISO 8601 timestamp
  end_date?: string; // ISO 8601 timestamp
  limit?: number; // default: 50
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if fillup input uses odometer
 */
export function isFillupInputWithOdometer(input: CreateFillupCommand): input is FillupInputWithOdometer {
  return 'odometer' in input && input.odometer !== undefined;
}

/**
 * Type guard to check if fillup input uses distance
 */
export function isFillupInputWithDistance(input: CreateFillupCommand): input is FillupInputWithDistance {
  return 'distance' in input && input.distance !== undefined;
}
