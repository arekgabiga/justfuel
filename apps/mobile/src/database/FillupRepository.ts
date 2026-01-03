import { Fillup, NewFillup } from '../types';
import { ValidatedFillup, calculateFuelConsumption, calculatePricePerLiter, calculateDistanceTraveled, roundToTwo, injectTimeIntoDate, getDateWithOffset, detectSortDirection } from '@justfuel/shared';
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

  batchImportFillups: async (carId: string, fillups: ValidatedFillup[]): Promise<void> => {
    const db = await getDBConnection();
    try {
        await db.runAsync('BEGIN TRANSACTION');
        const now = new Date().toISOString();
        const sortDirection = detectSortDirection(fillups.map(f => ({ date: f.date })));
        
        for (const fillup of fillups) {
            const id = generateUUID();
            await db.runAsync(
               `INSERT INTO fillups (
                id, car_id, date, fuel_amount, total_price, odometer,
                distance_traveled, fuel_consumption, price_per_liter, created_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
               [
                   id,
                   carId,
                   getDateWithOffset(fillup.date.toISOString(), new Date(now), fillups.indexOf(fillup), 1000, sortDirection),
                   fillup.fuel_amount,
                   fillup.total_price,
                   fillup.odometer ? roundToTwo(fillup.odometer) : null,
                   fillup.distance_traveled ? roundToTwo(fillup.distance_traveled) : null,
                   null, // consumption will be recalculated
                   calculatePricePerLiter(fillup.total_price, fillup.fuel_amount),
                   now
               ]
            );
        }
        
        await db.runAsync('COMMIT');
        
        // Recalculate stats for the car to ensure consistency
        await FillupRepository.recalculateStats(carId);
    } catch (error) {
        console.error('Batch import failed:', error);
        try {
           await db.runAsync('ROLLBACK');
        } catch (e) { /* ignore */ }
        throw error;
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
        injectTimeIntoDate(newFillup.date, new Date(now)),
        newFillup.fuel_amount,
        newFillup.total_price,
        newFillup.odometer ? roundToTwo(newFillup.odometer) : null,
        (newFillup as any).distance_traveled ? roundToTwo((newFillup as any).distance_traveled) : null,
        (newFillup as any).fuel_consumption || null,
        calculatePricePerLiter(newFillup.total_price, newFillup.fuel_amount),
        now,
      ]
    );

    // Ensure chain consistency
    await FillupRepository.recalculateStats(newFillup.car_id);

    return {
      id,
      ...newFillup,
      fuel_amount: newFillup.fuel_amount,
      total_price: newFillup.total_price,
      odometer: newFillup.odometer ? roundToTwo(newFillup.odometer) : null,
      distance_traveled: (newFillup as any).distance_traveled ? roundToTwo((newFillup as any).distance_traveled) : null,
      fuel_consumption: (newFillup as any).fuel_consumption || null,
      price_per_liter: calculatePricePerLiter(newFillup.total_price, newFillup.fuel_amount) ?? 0,
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
    
    // Fetch car's initial_odometer for proper first fillup calculation
    const car = await db.getFirstAsync<{ initial_odometer: number | null }>(
      'SELECT initial_odometer FROM cars WHERE id = ?',
      [carId]
    );
    const initialOdometer = car?.initial_odometer ?? 0;
    
    const fillups = await db.getAllAsync<Fillup>(
      'SELECT * FROM fillups WHERE car_id = ? ORDER BY date ASC',
      [carId]
    );

    for (let i = 0; i < fillups.length; i++) {
        const current = fillups[i];
        const previous = i > 0 ? fillups[i - 1] : null;
        
        let newDist: number | null = null;
        let newCons: number | null = null;

        if (current.odometer != null) {
            // Odometer-based entry: calculate distance from previous odometer or initial_odometer
            const prevOdometer = previous?.odometer ?? initialOdometer;
            newDist = calculateDistanceTraveled(current.odometer, prevOdometer);
            if (newDist > 0) {
                newCons = calculateFuelConsumption(newDist, current.fuel_amount);
            } else {
                newDist = Math.max(0, newDist); // Clamp to 0 if negative
                newCons = null;
            }
        } else {
            // Distance-based entry (odometer is NULL): trust the stored distance_traveled
            newDist = current.distance_traveled ? roundToTwo(current.distance_traveled) : current.distance_traveled;

            if (newDist && newDist > 0) {
                newCons = calculateFuelConsumption(newDist, current.fuel_amount);
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
