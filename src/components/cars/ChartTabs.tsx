import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingDown, DollarSign, Route } from 'lucide-react';
import type { ChartType } from '../../types';

interface ChartTabsProps {
  activeChartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}

export const ChartTabs: React.FC<ChartTabsProps> = ({ activeChartType, onChartTypeChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <Button
        onClick={() => onChartTypeChange('consumption')}
        variant={activeChartType === 'consumption' ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        <TrendingDown className="h-4 w-4" />
        Spalanie
      </Button>
      <Button
        onClick={() => onChartTypeChange('price_per_liter')}
        variant={activeChartType === 'price_per_liter' ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        <DollarSign className="h-4 w-4" />
        Cena za litr
      </Button>
      <Button
        onClick={() => onChartTypeChange('distance')}
        variant={activeChartType === 'distance' ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        <Route className="h-4 w-4" />
        Dystans
      </Button>
    </div>
  );
};
