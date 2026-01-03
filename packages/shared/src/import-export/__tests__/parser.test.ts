import { describe, it, expect } from 'vitest';
import { parseCsv } from '../parser';

describe('CSV Parser Logic', () => {
    it('should round numerical values to 2 decimal places', async () => {
        const csvContent = `date,fuel_amount,total_price,odometer,distance
01.01.2025,50.1234,300.5678,1500.999,500.111`;
        
        const result = await parseCsv(csvContent, { mileage_input_preference: 'odometer' });
        
        expect(result.errors).toHaveLength(0);
        expect(result.fillups).toHaveLength(1);
        
        const fillup = result.fillups[0];
        expect(fillup.fuel_amount).toBe(50.12);
        expect(fillup.total_price).toBe(300.57);
        expect(fillup.odometer).toBe(1501.00); // 1500.999 -> 1501.00
        // Strict filtering: distance should be null
        expect(fillup.distance_traveled).toBeNull();
    });

    it('should handle comma as decimal separator', async () => {
         const csvContent = `date,fuel_amount,total_price,odometer,distance
01.01.2025,"50,1234","300,5678","1500,999","500,111"`;
        
        const result = await parseCsv(csvContent, { mileage_input_preference: 'odometer' });
        
        expect(result.errors).toHaveLength(0);
        expect(result.fillups).toHaveLength(1);
        
        const fillup = result.fillups[0];
        expect(fillup.fuel_amount).toBe(50.12);
        expect(fillup.total_price).toBe(300.57);
        expect(fillup.odometer).toBe(1501.00);
        // Distance should be null because preference is odometer and strict filtering is on
        expect(fillup.distance_traveled).toBeNull(); 
    });

    it('should ignore distance column when preference is odometer', async () => {
        const csvContent = `date,fuel_amount,total_price,odometer,distance
01.01.2025,50.00,300.00,1500.00,100.00`;
        
        const result = await parseCsv(csvContent, { mileage_input_preference: 'odometer' });
        
        const fillup = result.fillups[0];
        expect(fillup.odometer).toBe(1500.00);
        expect(fillup.distance_traveled).toBeNull();
    });

    it('should ignore odometer column when preference is distance', async () => {
        const csvContent = `date,fuel_amount,total_price,odometer,distance
01.01.2025,50.00,300.00,1500.00,100.00`;
        
        const result = await parseCsv(csvContent, { mileage_input_preference: 'distance' });
        
        const fillup = result.fillups[0];
        expect(fillup.distance_traveled).toBe(100.00);
        expect(fillup.odometer).toBeNull();
    });
    it('should parse date as UTC Noon (12:00:00Z)', async () => {
        const csvContent = `date,fuel_amount,total_price,odometer
01.01.2023,50.00,300.00,1500.00`;
        
        const result = await parseCsv(csvContent, { mileage_input_preference: 'odometer' });
        
        const fillup = result.fillups[0];
        const date = fillup.date;
        
        // Month is 0-indexed in JS Date (0 = Jan)
        expect(date.getUTCFullYear()).toBe(2023);
        expect(date.getUTCMonth()).toBe(0); 
        expect(date.getUTCDate()).toBe(1);
        expect(date.getUTCHours()).toBe(12); // Verify 12:00 UTC
        expect(date.getUTCMinutes()).toBe(0);
        expect(date.getUTCSeconds()).toBe(0);
    });
});
