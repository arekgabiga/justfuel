import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, useTheme } from 'react-native-paper';
import { ChartType } from '../types';

interface ChartTabsProps {
  activeChartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}

export const ChartTabs: React.FC<ChartTabsProps> = ({
  activeChartType,
  onChartTypeChange,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={activeChartType}
        onValueChange={(value) => onChartTypeChange(value as ChartType)}
        buttons={[
          {
            value: 'consumption',
            label: 'Spalanie',
            icon: 'gas-station',
          },
          {
            value: 'price_per_liter',
            label: 'Cena/L',
            icon: 'cash',
          },
          {
            value: 'distance',
            label: 'Dystans',
            icon: 'road',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
