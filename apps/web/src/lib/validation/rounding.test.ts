import { describe, it, expect } from 'vitest';
import { createCarCommandSchema } from './cars';
import { createFillupRequestSchema } from './fillups';

describe('Rounding Logic', () => {
  it('should round initial_odometer to 2 decimal places', () => {
    const input = {
      name: 'Test',
      initial_odometer: 123.456,
      mileage_input_preference: 'odometer' as const,
    };
    const result = createCarCommandSchema.parse(input);
    expect(result.initial_odometer).toBe(123.46);
  });

  it('should NOT round fuel_amount', () => {
    const input = {
      date: new Date().toISOString(),
      fuel_amount: 50.1234,
      total_price: 100,
      odometer: 1000,
    };
    const result = createFillupRequestSchema.parse(input);
    expect(result.fuel_amount).toBe(50.1234);
  });

  it('should NOT round total_price', () => {
    const input = {
      date: new Date().toISOString(),
      fuel_amount: 50,
      total_price: 250.999,
      odometer: 1000,
    };
    const result = createFillupRequestSchema.parse(input);
    expect(result.total_price).toBe(250.999);
  });

  it('should round odometer to 2 decimal places in fillup', () => {
    const input = {
      date: new Date().toISOString(),
      fuel_amount: 50,
      total_price: 100,
      odometer: 1000.555,
    };
    const result = createFillupRequestSchema.parse(input);
    expect(result.odometer).toBe(1000.56);
  });
});
