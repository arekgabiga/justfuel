export enum ConsumptionDeviation {
  EXTREMELY_LOW = 'EXTREMELY_LOW', // <= -15%
  VERY_LOW = 'VERY_LOW', // (-15%, -8%]
  LOW = 'LOW', // (-8%, 0%)
  NEUTRAL = 'NEUTRAL', // [0%, 5%)
  HIGH = 'HIGH', // [5%, 10%)
  VERY_HIGH = 'VERY_HIGH', // [10%, 20%)
  EXTREMELY_HIGH = 'EXTREMELY_HIGH', // >= 20%
  INVALID = 'INVALID',
}

export const getConsumptionDeviation = (
  consumption: number | null | undefined,
  avg: number
): ConsumptionDeviation => {
  if (
    consumption === null ||
    consumption === undefined ||
    avg === 0 ||
    !isFinite(consumption) ||
    !isFinite(avg)
  ) {
    return ConsumptionDeviation.INVALID;
  }

  // Calculate percentage deviation from average
  const deviation = ((consumption - avg) / avg) * 100;

  // EKSTREMALNIE NISKIE: Significantly better than average (deviation <= -15%)
  if (deviation <= -15) {
    return ConsumptionDeviation.EXTREMELY_LOW;
  }

  // BARDZO NISKIE: Clearly better than average (-15% < deviation <= -8%)
  if (deviation <= -8) {
    return ConsumptionDeviation.VERY_LOW;
  }

  // LEKKO NISKIE: Slightly better than average (-8% < deviation < 0%)
  if (deviation < 0) {
    return ConsumptionDeviation.LOW;
  }

  // NEUTRALNE: Result within normal range (0% <= deviation < 5%)
  if (deviation < 5) {
    return ConsumptionDeviation.NEUTRAL;
  }

  // LEKKO WYSOKIE: Slightly worse than average (5% <= deviation < 10%)
  if (deviation < 10) {
    return ConsumptionDeviation.HIGH;
  }

  // BARDZO WYSOKIE: Clearly worse than average (10% <= deviation < 20%)
  if (deviation < 20) {
    return ConsumptionDeviation.VERY_HIGH;
  }

  // EKSTREMALNIE WYSOKIE: Significantly worse than average (deviation >= 20%)
  return ConsumptionDeviation.EXTREMELY_HIGH;
};
