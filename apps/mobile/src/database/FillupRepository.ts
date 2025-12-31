import { Fillup, NewFillup } from '../types';
import { getDBConnection } from './schema';
import { generateUUID } from '../utils/uuid';

export const FillupRepository = {
  getFillupsByCarId: async (carId: string): Promise<Fillup[]> => {
    if (!carId) {
      console.error('[FillupRepo] getFillupsByCarId aborting: carId is missing');
      return [];
    }
    try {
      const db = await getDBConnection();
      const result = await db.getAllAsync<Fillup>('SELECT * FROM fillups WHERE car_id = ? ORDER BY date DESC', [carId]);
      return result;
    } catch (e) {
      console.error('[FillupRepo] getFillupsByCarId failed:', e);
      throw e;
    }
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
        now,
      ]
    );

    return {
      id,
      ...newFillup,
      distance_traveled: (newFillup as any).distance_traveled || null,
      fuel_consumption: (newFillup as any).fuel_consumption || null,
      price_per_liter: newFillup.total_price / newFillup.fuel_amount,
      created_at: now,
    };
  },

  getPreviousFillup: async (carId: string, date: string, excludeFillupId?: string): Promise<Fillup | null> => {
    const db = await getDBConnection();
    let query = 'SELECT * FROM fillups WHERE car_id = ? AND date < ?';
    const params = [carId, date];

    if (excludeFillupId) {
      query += ' AND id != ?';
      params.push(excludeFillupId);
    }

    query += ' ORDER BY date DESC LIMIT 1';
    
    const result = await db.getFirstAsync<Fillup>(query, params);
    return result;
  },

  updateFillup: async (fillup: Fillup): Promise<void> => {
    const db = await getDBConnection();
    await db.runAsync(
      `UPDATE fillups SET 
        date = ?, 
        fuel_amount = ?, 
        total_price = ?, 
        odometer = ?, 
        distance_traveled = ?, 
        fuel_consumption = ?, 
        price_per_liter = ? 
      WHERE id = ?`,
      [
        fillup.date,
        fillup.fuel_amount,
        fillup.total_price,
        fillup.odometer,
        fillup.distance_traveled,
        fillup.fuel_consumption,
        fillup.price_per_liter,
        fillup.id,
      ]
    );

    // Ensure chain consistency
    await FillupRepository.recalculateStats(fillup.car_id);
  },

  deleteFillup: async (id: string): Promise<void> => {
    const db = await getDBConnection();
    // Get carID before delete to recalc
    const fillup = await db.getFirstAsync<Fillup>('SELECT car_id FROM fillups WHERE id = ?', [id]);
    await db.runAsync('DELETE FROM fillups WHERE id = ?', [id]);
    if (fillup) {
      await FillupRepository.recalculateStats(fillup.car_id);
    }
  },

  recalculateStats: async (carId: string): Promise<void> => {
    const db = await getDBConnection();
    const fillups = await db.getAllAsync<Fillup>(
      'SELECT * FROM fillups WHERE car_id = ? ORDER BY date ASC',
      [carId]
    );

    for (let i = 0; i < fillups.length; i++) {
        const current = fillups[i];
        let previous = i > 0 ? fillups[i - 1] : null;
        
        let newDist: number | null = null;
        let newCons: number | null = null;

        if (previous) {
            newDist = current.odometer - previous.odometer;
            if (newDist > 0) {
                newCons = (current.fuel_amount / newDist) * 100;
            } else {
                newDist = 0;
                newCons = null;
            }
        } else {
             // For the first fillup (no previous), preserve existing distance (e.g. manual input)
             newDist = current.distance_traveled;
             if (newDist && newDist > 0) {
                 newCons = (current.fuel_amount / newDist) * 100;
             } else {
                 newCons = null;
             }
        }

        const distChanged = current.distance_traveled !== newDist;
        const consChanged = Math.abs((current.fuel_consumption || 0) - (newCons || 0)) > 0.001;
        
        if (distChanged || consChanged) {
             await db.runAsync(
                 'UPDATE fillups SET distance_traveled = ?, fuel_consumption = ? WHERE id = ?',
                 [newDist, newCons, current.id] // Params: index 0, 1, 2
             );
        }
    }
  },
};
