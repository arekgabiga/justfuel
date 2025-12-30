import React from 'react';
import { ChartStatistics } from './ChartStatistics';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Text, useTheme } from 'react-native-paper';
import { Fillup, ChartType } from '../types';

interface ChartVisualizationProps {
  fillups: Fillup[];
  chartType: ChartType;
}

export const ChartVisualization: React.FC<ChartVisualizationProps> = ({ fillups, chartType }) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Filter and process data
  const processData = () => {
    const validFillups = [...fillups].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let getValue: (f: Fillup) => number | null;
    let label: string;
    let suffix: string;
    let unit: string;

    switch (chartType) {
      case 'consumption':
        getValue = (f) => f.fuel_consumption;
        label = 'Spalanie';
        unit = 'L/100km';
        suffix = ' l/100km';
        break;
      case 'price_per_liter':
        getValue = (f) => f.price_per_liter;
        label = 'Cena za litr';
        unit = 'zł';
        suffix = ' zł/l';
        break;
      case 'distance':
        getValue = (f) => f.distance_traveled;
        label = 'Dystans';
        unit = 'km';
        suffix = ' km';
        break;
      default:
        getValue = () => null;
        label = '';
        unit = '';
        suffix = '';
    }

    // Filter points with valid values
    const allPoints = validFillups
      .map((f) => ({
        date: new Date(f.date),
        value: getValue(f),
      }))
      .filter((p): p is { date: Date; value: number } => p.value !== null && p.value !== undefined && p.value > 0);

    // Calculate stats from ALL valid points (not just the displayed ones)
    const count = allPoints.length;
    const sum = allPoints.reduce((acc, curr) => acc + curr.value, 0);
    const average = count > 0 ? sum / count : 0;
    const min = count > 0 ? Math.min(...allPoints.map((p) => p.value)) : 0;
    const max = count > 0 ? Math.max(...allPoints.map((p) => p.value)) : 0;

    // Take last 6 points for the chart
    return {
      dataPoints: allPoints.slice(-6),
      label,
      suffix,
      unit,
      stats: { average, min, max, count },
    };
  };

  const { dataPoints, label, suffix, unit, stats } = processData();

  if (dataPoints.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Za mało danych do wykresu (min. 2 tankowania z danymi)</Text>
      </View>
    );
  }

  const chartData = {
    labels: dataPoints.map((p) => {
      return `${p.date.getDate()}/${p.date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: dataPoints.map((p) => p.value),
        color: (opacity = 1) => theme.colors.primary, // optional
        strokeWidth: 2,
      },
    ],
    legend: [label],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: chartType === 'distance' ? 0 : 2, // 0 decimals for distance
    color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`, // Matching standard primary blue
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
    fillShadowGradient: theme.colors.primary,
    fillShadowGradientOpacity: 0.2,
  };

  const commonStyle = {
    marginVertical: 8,
    borderRadius: 16,
  };

  return (
    <View style={styles.container}>
      <ChartStatistics
        label={label}
        unit={unit}
        average={stats.average}
        min={stats.min}
        max={stats.max}
        count={stats.count}
      />

      {chartType === 'distance' ? (
        <BarChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          yAxisLabel=""
          yAxisSuffix={chartType === 'distance' ? '' : suffix} // BarChart handles suffix differently sometimes, but here we can try
          chartConfig={chartConfig}
          style={commonStyle}
          showValuesOnTopOfBars // Good for distance bars
        />
      ) : (
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={commonStyle}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
});
