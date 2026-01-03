import { describe, it, expect } from 'vitest';
import { parseCsv } from '../parser';

describe('CSV Parser Logic', () => {
    it('should round numerical values to 2 decimal places', async () => {
        const csvContent = `date,fuel_amount,total_price,odometer,distance
2025-01-01,50.1234,300.5678,1500.999,500.111`;
        
        const result = await parseCsv(csvContent, { mileage_input_preference: 'odometer' });
        
        expect(result.errors).toHaveLength(0);
        expect(result.fillups).toHaveLength(1);
        
        const fillup = result.fillups[0];
        expect(fillup.fuel_amount).toBe(50.12);
        expect(fillup.total_price).toBe(300.57);
        expect(fillup.odometer).toBe(1501.00); // 1500.999 -> 1501.00
        expect(fillup.distance_traveled).toBe(500.11);
    });

    it('should handle comma as decimal separator', async () => {
         const csvContent = `date,fuel_amount,total_price,odometer,distance
2025-01-01,"50,1234","300,5678","1500,999","500,111"`;
        
        const result = await parseCsv(csvContent, { mileage_input_preference: 'odometer' });
        
        expect(result.errors).toHaveLength(0);
        expect(result.fillups).toHaveLength(1);
        
        const fillup = result.fillups[0];
        expect(fillup.fuel_amount).toBe(50.12);
        expect(fillup.total_price).toBe(300.57);
        expect(fillup.odometer).toBe(1501.00);
        expect(fillup.distance_traveled).toBe(500.11);
    });
});
