/**
 * Shared Calculation Logic for JustFuel
 * Contains pure functions for fuel consumption, price, and distance calculations.
 */

/**
 * Calculates fuel consumption in L/100km.
 * @param distanceTraveled - Distance traveled in km.
 * @param fuelAmount - Amount of fuel consumed in liters.
 * @returns Fuel consumption in L/100km, or null if distance is invalid (<= 0).
 */
export function calculateFuelConsumption(distanceTraveled: number, fuelAmount: number): number | null {
  if (distanceTraveled <= 0) return null;
  return (fuelAmount / distanceTraveled) * 100;
}

/**
 * Calculates price per liter.
 * @param totalPrice - Total price paid.
 * @param fuelAmount - Amount of fuel in liters.
 * @returns Price per liter, or null if fuel amount is invalid (<= 0).
 */
export function calculatePricePerLiter(totalPrice: number, fuelAmount: number): number | null {
  if (fuelAmount <= 0) return null;
  return totalPrice / fuelAmount;
}

/**
 * Calculates distance traveled based on odometer readings.
 * @param currentOdometer - Current odometer reading.
 * @param previousOdometer - Previous odometer reading.
 * @returns Distance traveled.
 */
export function calculateDistanceTraveled(currentOdometer: number, previousOdometer: number): number {
  return currentOdometer - previousOdometer;
}

/**
 * Calculates current odometer based on previous odometer and distance.
 * @param previousOdometer - Previous odometer reading.
 * @param distanceTraveled - Distance traveled in this segment.
 * @returns Current odometer reading.
 */
export function calculateOdometer(previousOdometer: number, distanceTraveled: number): number {
  return previousOdometer + distanceTraveled;
}

export enum ConsumptionDeviation {
  EXTREMELY_LOW = 'EXTREMELY_LOW',
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  NEUTRAL = 'NEUTRAL',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  EXTREMELY_HIGH = 'EXTREMELY_HIGH',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Calculates deviation of valid consumption from average.
 * returns Deviation level.
 */
export function getConsumptionDeviation(
  consumption: number | null | undefined,
  average: number
): ConsumptionDeviation {
  if (consumption === null || consumption === undefined || average <= 0) {
    return ConsumptionDeviation.UNKNOWN;
  }

  const deviation = ((consumption - average) / average) * 100;

  if (deviation <= -30) return ConsumptionDeviation.EXTREMELY_LOW;
  if (deviation <= -15) return ConsumptionDeviation.VERY_LOW;
  if (deviation <= -5) return ConsumptionDeviation.LOW;
  if (deviation <= 5) return ConsumptionDeviation.NEUTRAL;
  if (deviation <= 15) return ConsumptionDeviation.HIGH;
  if (deviation <= 30) return ConsumptionDeviation.VERY_HIGH;
  return ConsumptionDeviation.EXTREMELY_HIGH;
}
