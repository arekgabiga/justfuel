import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface ChartStatisticsProps {
  label: string;
  average: number;
  min: number;
  max: number;
  count: number;
  unit: string;
}

export const ChartStatistics: React.FC<ChartStatisticsProps> = ({ label, average, min, max, count, unit }) => {
  const theme = useTheme();

  const StatCard = ({ title, value }: { title: string; value: string }) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{title}</Text>
      <Text variant="titleLarge" style={styles.cardValue}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.header}>
        {label} {unit ? `(${unit})` : ''}
      </Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard title="Średnia" value={`${average.toFixed(2)}`} />
          <StatCard title="Minimum" value={`${min.toFixed(2)}`} />
        </View>
        <View style={styles.row}>
          <StatCard title="Maximum" value={`${max.toFixed(2)}`} />
          <StatCard title="Liczba punktów" value={`${count}`} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 14,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light background
    padding: 8,
    borderRadius: 8,
  },
  cardLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  cardValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
