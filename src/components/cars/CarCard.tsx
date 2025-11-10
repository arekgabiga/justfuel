import React from 'react';
import type { CarWithStatisticsDTO } from '../../types';
import { CarName } from './CarName';
import { CarStatistics } from './CarStatistics';

interface CarCardProps {
  car: CarWithStatisticsDTO;
  onClick: (carId: string) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onClick }) => {
  const handleClick = () => {
    onClick(car.id);
  };

  return (
    <div 
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1 transform"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Przejdź do szczegółów samochodu ${car.name}`}
    >
      <div className="p-6">
        <CarName name={car.name} />
        <CarStatistics statistics={car.statistics} />
      </div>
    </div>
  );
};
