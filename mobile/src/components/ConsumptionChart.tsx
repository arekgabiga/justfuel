import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Text, useTheme } from 'react-native-paper';
import { Fillup } from '../types';

interface Props {
  fillups: Fillup[];
}

export default function ConsumptionChart({ fillups }: Props) {
  const theme = useTheme();
  
  // Filter fillups with valid consumption and sort by date (asc)
  const validFillups = fillups
    .filter(f => f.fuel_consumption !== null && f.fuel_consumption > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (validFillups.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: '#888' }}>
          Za mało danych do wykresu (min. 2 tankowania z obliczonym spalaniem)
        </Text>
      </View>
    );
  }

  // Take last 5-10 points to avoid overcrowding
  const dataPoints = validFillups.slice(-6);

  const data = {
    labels: dataPoints.map(f => {
      const d = new Date(f.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: dataPoints.map(f => f.fuel_consumption!),
        color: (opacity = 1) => theme.colors.primary, // optional
        strokeWidth: 2
      }
    ],
    legend: ["Spalanie (l/100km)"]
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Trend Spalania</Text>
      <LineChart
        data={data}
        width={Dimensions.get('window').width - 32} // Screen width - padding
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#ffa726"
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center'
  },
  title: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 8
  }
});
