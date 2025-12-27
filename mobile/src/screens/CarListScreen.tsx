import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, FAB, Card, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Car } from '../types';
import { CarRepository } from '../database/CarRepository';

// Define navigation types locally for now or move to a types file
type RootStackParamList = {
  CarList: undefined;
  AddCar: undefined;
  CarDetails: { carId: string; carName: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CarListScreen() {
  const [cars, setCars] = useState<Car[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

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
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('CarDetails', { carId: item.id, carName: item.name })}
    >
      <Card.Title
        title={item.name}
        subtitle={`${item.mileage_input_preference === 'odometer' ? 'Licznik' : 'Dystans'}`}
        left={(props) => <Appbar.Action icon="car" {...props} />}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      {cars.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Brak samochodów</Text>
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
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
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
    marginBottom: 12,
    backgroundColor: 'white',
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
    bottom: 0,
  },
});
