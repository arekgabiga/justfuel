import React from 'react';
import type { FillupDTO } from '../../types';
import { ConsumptionDeviation, getConsumptionDeviation, formatDate, formatNumber } from '@justfuel/shared';
import { AlertCircle } from 'lucide-react';


interface FillupCardProps {
  fillup: FillupDTO;
  averageConsumption: number;
  onClick: () => void;
  mileageInputPreference?: 'odometer' | 'distance';
  isOdometerInvalid?: boolean;
}

export const FillupCard: React.FC<FillupCardProps> = ({ 
  fillup, 
  averageConsumption, 
  onClick,
  mileageInputPreference = 'odometer',
  isOdometerInvalid = false
}) => {


  // Calculate color intensity based on deviation from average
  // Uses 7 color levels according to percentage deviation from average
  const getConsumptionColor = (consumption: number | null | undefined, avg: number) => {
    const deviation = getConsumptionDeviation(consumption, avg);

    switch (deviation) {
      case ConsumptionDeviation.EXTREMELY_LOW:
        return 'text-green-800 dark:text-green-300 font-semibold';
      case ConsumptionDeviation.VERY_LOW:
        return 'text-green-600 dark:text-green-400 font-semibold';
      case ConsumptionDeviation.LOW:
        return 'text-lime-500 dark:text-lime-400';
      case ConsumptionDeviation.NEUTRAL:
        return 'text-yellow-600 dark:text-yellow-400';
      case ConsumptionDeviation.HIGH:
        return 'text-orange-600 dark:text-orange-400';
      case ConsumptionDeviation.VERY_HIGH:
        return 'text-red-600 dark:text-red-400 font-semibold';
      case ConsumptionDeviation.EXTREMELY_HIGH:
        return 'text-red-800 dark:text-red-300 font-semibold';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const containerClasses = `bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-blue-300 dark:hover:border-blue-600 p-3 md:p-5 ${
    isOdometerInvalid 
      ? 'border-red-500 dark:border-red-500' 
      : 'border-gray-200 dark:border-gray-700'
  }`;

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 relative">
         {/* Validation Error Icon */}
         {isOdometerInvalid && (
          <div 
            className="absolute -top-2 -right-2 md:-top-3 md:-right-3 z-10 bg-red-100 dark:bg-red-900 rounded-full p-1 cursor-help" 
            aria-label="Błąd przebiegu"
            title="Przebieg niższy niż w poprzednim tankowaniu"
          >
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
          </div>
        )}

        {/* Top Left: Date */}
        <div className="text-lg md:text-sm text-gray-500 dark:text-gray-400">{formatDate(fillup.date)}</div>

        {/* Top Right: Consumption */}
        <div
          className={`text-right text-lg md:text-sm font-bold flex justify-end items-baseline ${getConsumptionColor(fillup.fuel_consumption, averageConsumption)}`}
        >
          {formatNumber(fillup.fuel_consumption)}{' '}
          <span className="font-normal text-base md:text-xs text-gray-400 w-[80px] md:w-[60px] text-left ml-1.5 inline-block">
            L/100km
          </span>
        </div>

        {/* Bottom Left: Distance or Odometer */}
        <div className="text-lg md:text-sm font-medium text-gray-900 dark:text-gray-200">
          {mileageInputPreference === 'odometer' && fillup.odometer !== null && fillup.odometer !== undefined ? (
            <>
              {formatNumber(fillup.odometer)} <span className="text-gray-500 font-normal">km</span>
            </>
          ) : (
            <>
              {formatNumber(fillup.distance_traveled)} <span className="text-gray-500 font-normal">km</span>
            </>
          )}
        </div>

        {/* Bottom Right: Price */}
        <div className="text-right text-lg md:text-sm text-gray-600 dark:text-gray-400 flex justify-end items-baseline">
          {formatNumber(fillup.price_per_liter)}{' '}
          <span className="text-base md:text-xs text-gray-400 w-[80px] md:w-[60px] text-left ml-1.5 inline-block">
            zł/L
          </span>
        </div>
      </div>
    </div>
  );
};
