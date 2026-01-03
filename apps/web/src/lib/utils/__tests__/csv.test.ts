import { describe, it, expect } from 'vitest';
import { generateCsv, parseCsv } from '@justfuel/shared';

describe('CSV Generation Logic', () => {
  it('should generate CSV for odometer-based fillups', () => {
    const fillups = [
      {
        date: '2025-01-01',
        fuel_amount: 50,
        total_price: 300,
        odometer: 1500,
        distance_traveled: 500,
        fuel_consumption: 10,
        price_per_liter: 6,
      },
    ];

    const csv = generateCsv(fillups);

    // Expect headers and values
    expect(csv).toContain('date,fuel_amount,total_price,odometer,distance,price_per_liter,fuel_consumption');
    expect(csv).toContain('01.01.2025'); // Checked format in parser.ts (dd.MM.yyyy)
    expect(csv).toContain('1500');
    expect(csv).toContain('500');
  });

  it('should generate CSV for distance-based fillups (null odometer)', () => {
    const fillups = [
      {
        date: '2025-01-02',
        fuel_amount: 40,
        total_price: 240,
        odometer: null,
        distance_traveled: 400,
        fuel_consumption: 10,
        price_per_liter: 6,
      },
    ];

    const csv = generateCsv(fillups);

    expect(csv).toContain('02.01.2025');
    expect(csv).toContain(',400,');
  });
});

describe('CSV Parsing Logic', () => {
  it('should round numerical values to 2 decimal places during import', async () => {
    const csvContent = `date,fuel_amount,total_price,odometer,distance
01.01.2025,50.1234,300.5678,1500.999,500.111`;

    const result = await parseCsv(csvContent, { mileage_input_preference: 'odometer' });

    expect(result.errors).toHaveLength(0);
    expect(result.fillups).toHaveLength(1);

    const fillup = result.fillups[0];
    expect(fillup.fuel_amount).toBe(50.12);
    expect(fillup.total_price).toBe(300.57);
    expect(fillup.odometer).toBe(1501.0); // 1500.999 -> 1501.00
    expect(fillup.distance_traveled).toBe(500.11);
  });
});
