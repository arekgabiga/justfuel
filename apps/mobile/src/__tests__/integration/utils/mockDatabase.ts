/**
 * Mock Database for Integration Tests
 * 
 * Provides a smart mock that simulates SQLite behavior in-memory.
 * Since expo-sqlite requires native modules unavailable in Jest,
 * we use arrays to simulate database tables.
 */

// Data types
export interface MockCar {
  id: string;
  name: string;
  initial_odometer: number;
  mileage_input_preference: string;
  created_at: string;
  average_consumption: number | null;
  total_cost: number | null;
  total_distance: number | null;
  fillups_count: number;
}

export interface MockFillup {
  id: string;
  car_id: string;
  date: string;
  fuel_amount: number;
  total_price: number;
  odometer: number;
  distance_traveled: number | null;
  fuel_consumption: number | null;
  price_per_liter: number;
  created_at: string;
}

// In-memory storage
let mockCars: MockCar[] = [];
let mockFillups: MockFillup[] = [];
let mockIdCounter = 0;

/**
 * Reset all mock data - call in beforeEach()
 */
export const resetMockDatabase = () => {
  mockCars = [];
  mockFillups = [];
  mockIdCounter = 0;
};

/**
 * Get current mock cars (for assertions)
 */
export const getMockCars = () => mockCars;

/**
 * Get current mock fillups (for assertions)
 */
export const getMockFillups = () => mockFillups;

/**
 * Generate a unique mock ID
 */
export const generateMockId = () => `mock-id-${++mockIdCounter}`;

/**
 * Seed a car into the mock database
 */
export const seedCar = (overrides: Partial<MockCar> = {}): MockCar => {
  const car: MockCar = {
    id: overrides.id || generateMockId(),
    name: overrides.name || 'Test Car',
    initial_odometer: overrides.initial_odometer ?? 10000,
    mileage_input_preference: overrides.mileage_input_preference || 'odometer',
    created_at: new Date().toISOString(),
    average_consumption: null,
    total_cost: null,
    total_distance: null,
    fillups_count: 0,
  };
  mockCars.push(car);
  return car;
};

/**
 * Seed a fillup into the mock database
 */
export const seedFillup = (carId: string, overrides: Partial<MockFillup> = {}): MockFillup => {
  const fillup: MockFillup = {
    id: overrides.id || generateMockId(),
    car_id: carId,
    date: overrides.date || new Date().toISOString().split('T')[0],
    fuel_amount: overrides.fuel_amount ?? 50,
    total_price: overrides.total_price ?? 300,
    odometer: overrides.odometer ?? 10500,
    distance_traveled: overrides.distance_traveled ?? 500,
    fuel_consumption: overrides.fuel_consumption ?? 10,
    price_per_liter: overrides.price_per_liter ?? 6,
    created_at: new Date().toISOString(),
  };
  mockFillups.push(fillup);
  return fillup;
};

/**
 * Calculate car aggregates from fillups
 */
const calculateCarAggregates = (car: MockCar) => {
  const carFillups = mockFillups.filter(f => f.car_id === car.id);
  const validConsumptions = carFillups.filter(f => f.fuel_consumption != null);
  const avgConsumption = validConsumptions.length > 0
    ? validConsumptions.reduce((sum, f) => sum + f.fuel_consumption!, 0) / validConsumptions.length
    : null;
  return {
    ...car,
    average_consumption: avgConsumption,
    total_cost: carFillups.reduce((sum, f) => sum + f.total_price, 0),
    total_distance: carFillups.reduce((sum, f) => sum + (f.distance_traveled || 0), 0),
    fillups_count: carFillups.length,
  };
};

/**
 * The mock database object that simulates expo-sqlite API
 */
export const createMockDb = () => ({
  execAsync: jest.fn().mockResolvedValue(undefined),
  
  runAsync: jest.fn().mockImplementation(async (sql: string, params: any[]) => {
    if (sql.includes('INSERT INTO cars')) {
      mockCars.push({
        id: params[0],
        name: params[1],
        initial_odometer: params[2],
        mileage_input_preference: params[3],
        created_at: params[4],
        average_consumption: null,
        total_cost: null,
        total_distance: null,
        fillups_count: 0,
      });
    } else if (sql.includes('INSERT INTO fillups')) {
      mockFillups.push({
        id: params[0],
        car_id: params[1],
        date: params[2],
        fuel_amount: params[3],
        total_price: params[4],
        odometer: params[5],
        distance_traveled: params[6],
        fuel_consumption: params[7],
        price_per_liter: params[8],
        created_at: params[9],
      });
    } else if (sql.includes('DELETE FROM fillups')) {
      const id = params[0];
      mockFillups = mockFillups.filter(f => f.id !== id);
    } else if (sql.includes('DELETE FROM cars')) {
      const id = params[0];
      mockCars = mockCars.filter(c => c.id !== id);
      mockFillups = mockFillups.filter(f => f.car_id !== id);
    }
    return undefined;
  }),
  
  getAllAsync: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
    if (sql.includes('FROM cars')) {
      return mockCars.map(calculateCarAggregates);
    }
    if (sql.includes('FROM fillups') && params?.[0]) {
      return mockFillups
        .filter(f => f.car_id === params[0])
        .sort((a, b) => b.date.localeCompare(a.date));
    }
    return [];
  }),
  
  getFirstAsync: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
    if (sql.includes('FROM cars') && params?.[0]) {
      const car = mockCars.find(c => c.id === params[0]);
      if (car) {
        return calculateCarAggregates(car);
      }
      return null;
    }
    // getPreviousFillup query
    if (sql.includes('FROM fillups') && sql.includes('ORDER BY date DESC LIMIT 1')) {
      const carId = params?.[0];
      const date = params?.[1];
      const filtered = mockFillups
        .filter(f => f.car_id === carId && f.date < date)
        .sort((a, b) => b.date.localeCompare(a.date));
      return filtered[0] || null;
    }
    return null;
  }),
  
  closeAsync: jest.fn().mockResolvedValue(undefined),
});

// Default mock instance
export const mockDb = createMockDb();

/**
 * Setup function to mock the schema module
 * Call this with jest.mock() at the top of your test file:
 * 
 * import { mockDb } from '../mockDatabase';
 * jest.mock('../../../database/schema', () => ({
 *   getDBConnection: jest.fn(async () => mockDb),
 *   createTables: jest.fn(),
 * }));
 */
