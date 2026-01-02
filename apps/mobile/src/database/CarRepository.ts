import { Car, NewCar } from '../types';
import { getDBConnection } from './schema';
import { generateUUID } from '../utils/uuid';

export const CarRepository = {
  getAllCars: async (): Promise<Car[]> => {

    try {
      const db = await getDBConnection();
      const result = await db.getAllAsync<Car>(`
        SELECT 
          cars.*, 
          AVG(fillups.fuel_consumption) as average_consumption,
          SUM(fillups.total_price) as total_cost,
          SUM(fillups.distance_traveled) as total_distance,
          COUNT(fillups.id) as fillups_count
        FROM cars 
        LEFT JOIN fillups ON cars.id = fillups.car_id 
        GROUP BY cars.id 
        ORDER BY cars.created_at DESC
      `);
      return result;
    } catch (e) {
      throw e;
    }
  },

  getCarById: async (id: string): Promise<Car | null> => {
    if (!id) {
      return null;
    }
    try {
      const db = await getDBConnection();
      const result = await db.getFirstAsync<Car>(
        `
        SELECT 
          cars.*, 
          AVG(fillups.fuel_consumption) as average_consumption,
          SUM(fillups.total_price) as total_cost,
          SUM(fillups.distance_traveled) as total_distance,
          COUNT(fillups.id) as fillups_count
        FROM cars 
        LEFT JOIN fillups ON cars.id = fillups.car_id 
        WHERE cars.id = ?
        GROUP BY cars.id
      `,
        [id]
      );
      return result;
    } catch (e) {
      throw e;
    }
  },

  addCar: async (newCar: NewCar): Promise<Car> => {
    const db = await getDBConnection();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO cars (id, name, initial_odometer, mileage_input_preference, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, newCar.name, newCar.initial_odometer, newCar.mileage_input_preference, now]
    );

    return {
      id,
      ...newCar,
      created_at: now,
    };
  },

  updateCar: async (car: Car): Promise<void> => {
    const db = await getDBConnection();
    
    // Get old car data to check if initial_odometer changed
    const oldCar = await db.getFirstAsync<{ initial_odometer: number | null }>(
      'SELECT initial_odometer FROM cars WHERE id = ?',
      [car.id]
    );
    
    await db.runAsync('UPDATE cars SET name = ?, initial_odometer = ?, mileage_input_preference = ? WHERE id = ?', [
      car.name,
      car.initial_odometer,
      car.mileage_input_preference,
      car.id,
    ]);
    
    // If initial_odometer changed, recalculate fillup stats
    if (oldCar && oldCar.initial_odometer !== car.initial_odometer) {
      // Use require to avoid circular dependency issues and Jest ESM limitations
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { FillupRepository } = require('./FillupRepository');
      await FillupRepository.recalculateStats(car.id);
    }
  },

  deleteCar: async (id: string): Promise<void> => {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM cars WHERE id = ?', [id]);
  },
};
