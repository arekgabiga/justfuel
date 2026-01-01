import React from 'react';
import { Button } from '@/components/ui/button';
import { Fuel, TrendingUp } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'fillups' | 'charts';
  onTabChange: (tab: 'fillups' | 'charts') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 w-full">
      <Button
        onClick={() => onTabChange('fillups')}
        variant="ghost"
        className="flex-1 min-w-[120px] h-12 text-base rounded-none border-b-2 border-transparent hover:bg-transparent hover:text-blue-600 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-bold text-gray-500 dark:text-gray-400 transition-colors"
        data-state={activeTab === 'fillups' ? 'active' : undefined}
      >
        <Fuel className="h-5 w-5 mr-2" />
        Tankowania
      </Button>
      <Button
        onClick={() => onTabChange('charts')}
        variant="ghost"
        className="flex-1 min-w-[120px] h-12 text-base rounded-none border-b-2 border-transparent hover:bg-transparent hover:text-blue-600 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-bold text-gray-500 dark:text-gray-400 transition-colors"
        data-state={activeTab === 'charts' ? 'active' : undefined}
      >
        <TrendingUp className="h-5 w-5 mr-2" />
        Wykresy
      </Button>
    </div>
  );
};
