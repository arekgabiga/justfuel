
import { CarRepository } from '../CarRepository';
import { getDBConnection } from '../schema';
import * as SQLite from 'expo-sqlite';

// Mock schema.ts to control the DB instance directly if needed, 
// or rely on expo-sqlite mock. 
// Since CarRepository calls getDBConnection which calls openDatabaseAsync,
// and expo-sqlite is mocked in jest-setup.ts, we should be able to spy on the db methods.

describe('CarRepository', () => {
  let mockRunAsync: jest.Mock;
  let mockGetAllAsync: jest.Mock;
  let mockGetFirstAsync: jest.Mock;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Get the mock DB instance that openDatabaseAsync returns
    const db = await (SQLite.openDatabaseAsync as jest.Mock)('justfuel.db');
    mockRunAsync = db.runAsync as jest.Mock;
    mockGetAllAsync = db.getAllAsync as jest.Mock;
    mockGetFirstAsync = db.getFirstAsync as jest.Mock;
  });

  describe('addCar', () => {
    it('should add a car and return the object with generated ID', async () => {
      const newCar = {
        name: 'Test Car',
        initial_odometer: 1000,
        mileage_input_preference: 'odometer' as const,
      };

      const result = await CarRepository.addCar(newCar);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(newCar.name);
      expect(result.initial_odometer).toBe(newCar.initial_odometer);
      expect(result.created_at).toBeDefined();

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cars'),
        expect.arrayContaining([expect.any(String), 'Test Car', 1000, 'odometer', expect.any(String)])
      );
    });
  });

  describe('getAllCars', () => {
    it('should return a list of cars', async () => {
      const mockCars = [
        { id: '1', name: 'Car 1', created_at: '2023-01-01' },
        { id: '2', name: 'Car 2', created_at: '2023-01-02' },
      ];
      mockGetAllAsync.mockResolvedValue(mockCars);

      const result = await CarRepository.getAllCars();

      expect(result).toEqual(mockCars);
      expect(mockGetAllAsync).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });
  });

  describe('getCarById', () => {
    it('should return a car when found', async () => {
      const mockCar = { id: '1', name: 'Car 1' };
      mockGetFirstAsync.mockResolvedValue(mockCar);

      const result = await CarRepository.getCarById('1');

      expect(result).toEqual(mockCar);
      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE cars.id = ?'),
        ['1']
      );
    });

    it('should return null if id is missing', async () => {
      const result = await CarRepository.getCarById('');
      expect(result).toBeNull();
      expect(mockGetFirstAsync).not.toHaveBeenCalled();
    });
  });

  describe('updateCar', () => {
    it('should update car details', async () => {
      const carToUpdate = {
        id: '1',
        name: 'Updated Car',
        initial_odometer: 2000,
        mileage_input_preference: 'distance' as const,
        created_at: '2023-01-01',
      };

      await CarRepository.updateCar(carToUpdate);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cars SET'),
        ['Updated Car', 2000, 'distance', '1']
      );
    });
  });

  describe('deleteCar', () => {
    it('should delete a car by id', async () => {
      const idToDelete = '123';
      await CarRepository.deleteCar(idToDelete);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cars WHERE id = ?'),
        [idToDelete]
      );
    });
  });
});
