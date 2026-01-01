
import { ValidatedFillup, ImportError } from './types';
import { CarDTO } from '../types';

export const validateImportAgainstCar = (
  fillups: ValidatedFillup[],
  car: Pick<CarDTO, 'mileage_input_preference'>
): ImportError[] => {
  const errors: ImportError[] = [];

  fillups.forEach(fillup => {
      if (car.mileage_input_preference === 'odometer') {
          if (fillup.odometer === null || fillup.odometer === undefined) {
              errors.push({
                  row: fillup.sourceRowIndex,
                  message: 'Ten samochód jest skonfigurowany do wprowadzania licznika, ale w pliku brakuje poprawnej wartości licznika (odometer).'
              });
          }
      } else if (car.mileage_input_preference === 'distance') {
          if (fillup.distance_traveled === null || fillup.distance_traveled === undefined) {
              errors.push({
                  row: fillup.sourceRowIndex,
                  message: 'Ten samochód jest skonfigurowany do wprowadzania dystansu, ale w pliku brakuje poprawnej wartości dystansu (distance).'
              });
          }
      }
  });

  return errors;
};
