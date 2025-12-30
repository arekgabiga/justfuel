import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, FAB, Card, Text, TouchableRipple, useTheme, Avatar } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from '../types';
import { CarRepository } from '../database/CarRepository';

// Define navigation types locally for now or move to a types file
interface RootStackParamList {
  CarList: undefined;
  AddCar: undefined;
  CarDetails: { carId: string; carName: string };
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CarListScreen() {
  const [cars, setCars] = useState<Car[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const loadCars = useCallback(async () => {
    try {
      const data = await CarRepository.getAllCars();
      setCars(data);
    } catch (e) {
      console.error('Failed to load cars', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCars();
    }, [loadCars])
  );

  const renderItem = ({ item }: { item: Car }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('CarDetails', { carId: item.id, carName: item.name })}>
      <Card.Content>
        <Text variant="headlineMedium" style={{ marginBottom: 16, fontWeight: 'bold' }}>
          {item.name}
        </Text>

        <View style={styles.statRow}>
          <Text variant="bodyLarge">Średnie spalanie:</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.average_consumption ? `${item.average_consumption.toFixed(2)} L/100km` : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <Text variant="bodyLarge" style={{ color: '#444' }}>
            Całkowity koszt:
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            {item.total_cost ? `${item.total_cost.toFixed(2)} zł` : '0.00 zł'}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text variant="bodyLarge" style={{ color: '#444' }}>
            Całkowity dystans:
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            {item.total_distance ? `${item.total_distance.toFixed(1)} km` : '0 km'}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text variant="bodyLarge" style={{ color: '#444' }}>
            Liczba tankowań:
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            {item.fillups_count ? `${item.fillups_count} tankowań` : '0'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {cars.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>
            Brak samochodów
          </Text>
          <Text variant="bodyMedium">Dodaj swój pierwszy samochód, aby zacząć.</Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 }]}
        icon="plus"
        color="white"
        onPress={() => navigation.navigate('AddCar')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
  },
});
