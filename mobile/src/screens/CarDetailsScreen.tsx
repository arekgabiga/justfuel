import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, FAB, Card, useTheme, Divider, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FillupRepository } from '../database/FillupRepository';
import { Fillup, Car } from '../types';
import { CarRepository } from '../database/CarRepository';
import ConsumptionChart from '../components/ConsumptionChart';

export default function CarDetailsScreen({ route }: any) {
  const { carId, carName } = route.params;
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [fillups, setFillups] = useState<Fillup[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [activeTab, setActiveTab] = useState<'fillups' | 'charts'>('fillups');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [carData, fillupsData] = await Promise.all([
        CarRepository.getCarById(carId),
        FillupRepository.getFillupsByCarId(carId),
      ]);
      setCar(carData);
      setFillups(fillupsData);
    } catch (e) {
      console.error('Failed to load details', e);
    } finally {
      setLoading(false);
    }
  }, [carId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const renderFillupItem = ({ item }: { item: Fillup }) => {
    // Determine color based on average if available
    // Simple logic: if consumption < average, green; else red.
    // Ensure both exist.
    let consumptionColor = theme.colors.onSurface;
    if (item.fuel_consumption && car?.average_consumption) {
      consumptionColor =
        item.fuel_consumption <= car.average_consumption
          ? '#4CAF50' // Green
          : '#F44336'; // Red
    }

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Divider />
        <Card.Content style={styles.cardContent}>
          <View style={styles.statCol}>
            <Text variant="bodySmall" style={styles.label}>
              Spalanie
            </Text>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: consumptionColor }}>
              {item.fuel_consumption ? item.fuel_consumption.toFixed(2) : '-'}{' '}
              <Text variant="bodySmall" style={{ color: consumptionColor }}>
                L/100km
              </Text>
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text variant="bodySmall" style={styles.label}>
              Przebieg
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {item.odometer} <Text variant="bodySmall">km</Text>
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text variant="bodySmall" style={styles.label}>
              Cena
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {item.price_per_liter.toFixed(2)} <Text variant="bodySmall">zł/L</Text>
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !car) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fillups' && styles.activeTab]}
          onPress={() => setActiveTab('fillups')}
        >
          <Text style={[styles.tabText, activeTab === 'fillups' && styles.activeTabText]}>Tankowania</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'charts' && styles.activeTab]}
          onPress={() => setActiveTab('charts')}
        >
          <Text style={[styles.tabText, activeTab === 'charts' && styles.activeTabText]}>Wykresy</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'fillups' ? (
        <FlatList
          data={fillups}
          keyExtractor={(item) => item.id}
          renderItem={renderFillupItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text>Brak tankowań. Dodaj pierwsze tankowanie!</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.chartContainer}>
          <ConsumptionChart fillups={fillups} />
        </View>
      )}

      <FAB
        icon="plus"
        label="Dodaj tankowanie"
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 }]}
        color="white"
        onPress={() => navigation.navigate('FillupForm', { carId })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden', // for header radius
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
  },
});
