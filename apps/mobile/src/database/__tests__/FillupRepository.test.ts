import { FillupRepository } from '../FillupRepository';
import { getDBConnection } from '../schema';
import { NewFillup } from '../../types';

// Mock sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('../schema', () => ({
  getDBConnection: jest.fn(),
}));

describe('FillupRepository', () => {
  let mockDb: any;
  const mockDate = '2025-01-01T12:00:00.000Z';

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };
    (getDBConnection as jest.Mock).mockResolvedValue(mockDb);
    
    // Silence console logs for clean test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFillup', () => {
    it('should insert a new fillup and return it', async () => {
      const newFillup: NewFillup = {
        car_id: 'car-123',
        date: mockDate,
        fuel_amount: 50,
        total_price: 100,
        odometer: 15000,
      };

      await FillupRepository.addFillup(newFillup);

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO fillups'),
        expect.arrayContaining([
            expect.any(String), // id
            'car-123',
            mockDate,
            50,
            100,
            15000,
            null, // distance_traveled default
            null, // fuel_consumption default
            2,    // price_per_liter (100/50)
            expect.any(String) // created_at
        ])
      );
    });
  });

  describe('getFillupsByCarId', () => {
    it('should return fillups for a specific car', async () => {
      const mockFillups = [
        { id: '1', car_id: 'car-123', date: '2025-01-02' },
        { id: '2', car_id: 'car-123', date: '2025-01-01' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockFillups);

      const result = await FillupRepository.getFillupsByCarId('car-123');

      expect(result).toEqual(mockFillups);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM fillups WHERE car_id = ?'),
        ['car-123']
      );
    });

    it('should return empty list if carId is missing', async () => {
       const result = await FillupRepository.getFillupsByCarId('');
       expect(result).toEqual([]);
       expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });
  });

  describe('deleteFillup', () => {
    it('should delete a fillup by id', async () => {
      await FillupRepository.deleteFillup('fillup-123');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM fillups WHERE id = ?',
        ['fillup-123']
      );
    });
  });
});
