
import {
  calculateFuelConsumption,
  calculatePricePerLiter,
  calculateDistanceTraveled,
  calculateOdometer,
  getConsumptionDeviation,
  ConsumptionDeviation,
} from '@justfuel/shared';

describe('Shared Calculations', () => {
  describe('calculateFuelConsumption', () => {
    it('should calculate consumption correctly', () => {
      // 50L for 1000km = 5L/100km
      expect(calculateFuelConsumption(1000, 50)).toBe(5);
    });

    it('should return null for invalid distance', () => {
      expect(calculateFuelConsumption(0, 50)).toBeNull();
      expect(calculateFuelConsumption(-10, 50)).toBeNull();
    });
  });

  describe('calculatePricePerLiter', () => {
    it('should calculate price per liter correctly', () => {
      // 200 currency / 40L = 5 per liter
      expect(calculatePricePerLiter(200, 40)).toBe(5);
    });

    it('should return null for invalid fuel amount', () => {
      expect(calculatePricePerLiter(200, 0)).toBeNull();
    });
  });

  describe('calculateDistanceTraveled', () => {
    it('should calculate distance from odometer readings', () => {
      expect(calculateDistanceTraveled(150500, 150000)).toBe(500);
    });
  });

  describe('calculateOdometer', () => {
    it('should calculate new odometer from distance', () => {
      expect(calculateOdometer(150000, 500)).toBe(150500);
    });
  });

  describe('getConsumptionDeviation', () => {
    it('should return NEUTRAL for small deviation', () => {
      // Average 5.0, current 5.1 -> +2% deviation -> NEUTRAL (-5 to 5 is NEUTRAL?)
      // Let's check logic: if deviation <= 5 return NEUTRAL
      // ((5.1 - 5.0) / 5.0) * 100 = 2%. Correct.
      expect(getConsumptionDeviation(5.1, 5.0)).toBe(ConsumptionDeviation.NEUTRAL);
    });

    it('should return HIGH for higher consumption', () => {
      // Average 5.0, current 6.0 -> +20% deviation
      // Logic: <= 15 HIGH, <= 30 VERY_HIGH.
      // Wait, 20% is > 15 and <= 30. So VERY_HIGH.
      expect(getConsumptionDeviation(6.0, 5.0)).toBe(ConsumptionDeviation.VERY_HIGH);
    });

    it('should return UNKNOWN if inputs are invalid', () => {
      expect(getConsumptionDeviation(null, 5.0)).toBe(ConsumptionDeviation.UNKNOWN);
      expect(getConsumptionDeviation(5.0, 0)).toBe(ConsumptionDeviation.UNKNOWN);
    });
  });
});
