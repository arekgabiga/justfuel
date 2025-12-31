import { useMemo } from 'react';
import {
  calculateFuelConsumption,
  calculatePricePerLiter,
  calculateDistanceTraveled,
  calculateOdometer,
} from '@justfuel/shared';
import { Car, Fillup } from '../types';

interface UseFillupCalculationsProps {
  car: Car | null;
  lastFillup: Fillup | null;
  odometerInput: string;
  distanceInput: string;
  fuelAmount: string;
  totalPrice: string;
}

export function useFillupCalculations({
  car,
  lastFillup,
  odometerInput,
  distanceInput,
  fuelAmount,
  totalPrice,
}: UseFillupCalculationsProps) {
  return useMemo(() => {
    const fuel = parseFloat(fuelAmount);
    const price = parseFloat(totalPrice);

    let finalOdometer: number | null = 0;
    let finalDistance = 0;
    let calculationError = '';

    if (car?.mileage_input_preference === 'distance') {
      const dist = parseFloat(distanceInput);
      if (!isNaN(dist)) {
        finalDistance = dist;
        // Don't calculate odometer from distance as it leads to inconsistencies if history is broken/out-of-order
        // effectively making "odometer" a derived temporary value which is better left null in DB.
        finalOdometer = null;
      }
    } else {
      // Default 'odometer'
      const odo = parseFloat(odometerInput);
      if (!isNaN(odo)) {
        finalOdometer = odo;
        const baseOdometer = (lastFillup && lastFillup.odometer != null) ? lastFillup.odometer : car?.initial_odometer || 0;
        finalDistance = calculateDistanceTraveled(finalOdometer, baseOdometer);
        if (finalDistance < 0) {
          calculationError = `Przebieg musi być wyższy niż poprzedni (${baseOdometer} km)`;
        }
      }
    }

    const consumption = calculateFuelConsumption(finalDistance, fuel);
    const pricePerLiter = calculatePricePerLiter(price, fuel) || 0;

    return {
      fuel,
      price,
      finalOdometer,
      finalDistance,
      consumption,
      pricePerLiter,
      calculationError,
    };
  }, [car, lastFillup, odometerInput, distanceInput, fuelAmount, totalPrice]);
}
