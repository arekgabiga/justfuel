import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ChartTabs } from './ChartTabs';
import { ChartVisualization } from './ChartVisualization';
import { Fillup, ChartType } from '../types';

interface ChartsTabProps {
  fillups: Fillup[];
}

export const ChartsTab: React.FC<ChartsTabProps> = ({ fillups }) => {
  const [activeChartType, setActiveChartType] = useState<ChartType>('consumption');

  return (
    <View style={styles.container}>
      <ChartTabs
        activeChartType={activeChartType}
        onChartTypeChange={setActiveChartType}
      />
      <ChartVisualization fillups={fillups} chartType={activeChartType} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
