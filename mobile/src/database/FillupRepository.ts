import { Fillup, NewFillup } from '../types';
import { getDBConnection } from './schema';
import { generateUUID } from '../utils/uuid';

export const FillupRepository = {
  getFillupsByCarId: async (carId: string): Promise<Fillup[]> => {
    const db = await getDBConnection();
    const result = await db.getAllAsync<Fillup>(
      'SELECT * FROM fillups WHERE car_id = ? ORDER BY date DESC',
      [carId]
    );
    return result;
  },

  addFillup: async (newFillup: NewFillup): Promise<Fillup> => {
    const db = await getDBConnection();
    
    // Auto-calculate logic (simplified for MVP first cut)
    // In a real app, we would fetch previous fillup here to calc distance/consumption
    // For now, we assume derived values are passed or handled in Service layer
    
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO fillups (
        id, car_id, date, fuel_amount, total_price, odometer, 
        distance_traveled, fuel_consumption, price_per_liter, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        newFillup.car_id, 
        newFillup.date, 
        newFillup.fuel_amount, 
        newFillup.total_price, 
        newFillup.odometer,
        // Default to nulls/calculated values if not in newFillup type, but I updated interface to match generic logic
        // We really should computing this in a Service or Hook, but for repository we just insert
        (newFillup as any).distance_traveled || null, 
        (newFillup as any).fuel_consumption || null, 
        newFillup.total_price / newFillup.fuel_amount, // simple calc
        now
      ]
    );

    return {
      id,
      ...newFillup,
      distance_traveled: (newFillup as any).distance_traveled || null,
      fuel_consumption: (newFillup as any).fuel_consumption || null,
      price_per_liter: newFillup.total_price / newFillup.fuel_amount,
      created_at: now
    };
  },

  deleteFillup: async (id: string): Promise<void> => {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM fillups WHERE id = ?', [id]);
  }
};
