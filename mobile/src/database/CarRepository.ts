import { Car, NewCar } from '../types';
import { getDBConnection } from './schema';
import { generateUUID } from '../utils/uuid';

export const CarRepository = {
  getAllCars: async (): Promise<Car[]> => {
    const db = await getDBConnection();
    const result = await db.getAllAsync<Car>('SELECT * FROM cars ORDER BY created_at DESC');
    return result;
  },

  getCarById: async (id: string): Promise<Car | null> => {
    const db = await getDBConnection();
    const result = await db.getAllAsync<Car>('SELECT * FROM cars WHERE id = ?', [id]);
    return result[0] || null;
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
      created_at: now
    };
  },

  updateCar: async (car: Car): Promise<void> => {
    const db = await getDBConnection();
    await db.runAsync(
      'UPDATE cars SET name = ?, mileage_input_preference = ? WHERE id = ?',
      [car.name, car.mileage_input_preference, car.id]
    );
  },

  deleteCar: async (id: string): Promise<void> => {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM cars WHERE id = ?', [id]);
  }
};
