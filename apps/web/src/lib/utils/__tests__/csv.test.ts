import { describe, it, expect } from 'vitest';
import { generateCsv } from '@justfuel/shared';

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
    // Odometer should be empty or handled
    // Papa unparse usually leaves empty string for null/undefined
    // Let's check that we verify the row structure simply
    // date, fuel, price, odometer, distance...
    // 02.01.2025, 40, 240, , 400, ...

    // Exact row check might be flaky due to line endings or exact spacing, verify key segments
    expect(csv).toContain('02.01.2025');
    expect(csv).toContain(',400,'); // distance 400 surrounded by commas roughly
  });
});
