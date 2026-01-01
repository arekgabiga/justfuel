import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, FAB, Card, useTheme, Divider, ActivityIndicator, Menu, Appbar } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FillupRepository } from '../database/FillupRepository';
import { Fillup, Car } from '../types';
import { CarRepository } from '../database/CarRepository';
import { ChartsTab } from '../components/ChartsTab';
import { ConsumptionDeviation, getConsumptionDeviation, formatDate } from '@justfuel/shared';
import { saveLastActiveCarId } from '../utils/storage';
import { CarDetailsScreenProps, RootStackNavigationProp } from '../navigation/types';

export default function CarDetailsScreen({ route }: CarDetailsScreenProps) {
  const { carId, carName } = route.params;
  const navigation = useNavigation<RootStackNavigationProp>();
  
  React.useEffect(() => {
    if (carId) {
      saveLastActiveCarId(carId);
    }
  }, [carId]);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [fillups, setFillups] = useState<Fillup[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [activeTab, setActiveTab] = useState<'fillups' | 'charts'>('fillups');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleEdit = useCallback(() => {
    closeMenu();
    if (car) {
      navigation.navigate('AddCar', { car });
    }
  }, [car, navigation]);

  const handleDelete = useCallback(() => {
    closeMenu();
    Alert.alert(
      'Usuń samochód',
      'Czy na pewno chcesz usunąć ten samochód i wszystkie jego tankowania? Tej operacji nie można cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await CarRepository.deleteCar(carId);
              navigation.goBack();
            } catch (e) {
              console.error(e);
              Alert.alert('Błąd', 'Nie udało się usunąć samochodu.');
              setLoading(false); // Restore state if failed
            }
          },
        },
      ]
    );
  }, [carId, navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={<Appbar.Action icon="dots-vertical" onPress={openMenu} testID="menu-action" />}
        >
          <Menu.Item onPress={handleEdit} title="Edytuj" leadingIcon="pencil" />
          <Menu.Item onPress={handleDelete} title="Usuń" leadingIcon="delete" />
        </Menu>
      ),
    });
  }, [navigation, menuVisible, handleEdit, handleDelete]);

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

  const renderFillupItem = ({ item, index }: { item: Fillup; index: number }) => {
    // Check consistency with the previous fillup (which is next in the list sorted DESC)
    let isInvalid = false;
    if (index < fillups.length - 1) {
      const olderFillup = fillups[index + 1];
      // Check consistency with the previous fillup (which is next in the list sorted DESC)
      // Only enforce this for Odometer preference, as Distance preference can have disconnected odometers due to calculation logic
      if (car?.mileage_input_preference !== 'distance' && item.odometer != null && olderFillup.odometer != null && item.odometer < olderFillup.odometer) {
        isInvalid = true;
      }
    }

    const getConsumptionColor = (consumption: number | null | undefined, avg: number | undefined) => {
      if (avg === undefined) return theme.colors.onSurface;
      const deviation = getConsumptionDeviation(consumption, avg);
      switch (deviation) {
        case ConsumptionDeviation.EXTREMELY_LOW:
          return '#166534'; // Green 800
        case ConsumptionDeviation.VERY_LOW:
          return '#16a34a'; // Green 600
        case ConsumptionDeviation.LOW:
          return '#65a30d'; // Lime 600
        case ConsumptionDeviation.NEUTRAL:
          return '#ca8a04'; // Yellow 600
        case ConsumptionDeviation.HIGH:
          return '#ea580c'; // Orange 600
        case ConsumptionDeviation.VERY_HIGH:
          return '#dc2626'; // Red 600
        case ConsumptionDeviation.EXTREMELY_HIGH:
          return '#991b1b'; // Red 800
        default:
          return theme.colors.onSurface;
      }
    };

    const consumptionColor = getConsumptionColor(item.fuel_consumption, car?.average_consumption);

    return (
      <Card style={[styles.card, isInvalid && styles.invalidCard]} onPress={() => navigation.navigate('FillupForm', { carId, fillup: item })}>
        <View style={[styles.cardHeader, isInvalid && styles.invalidCardHeader]}>
          <View style={styles.row}>
             <Text variant="titleMedium" style={{ fontWeight: 'bold', color: isInvalid ? theme.colors.error : theme.colors.onSurface }}>
                {item.date ? formatDate(item.date) : 'Invalid Date'}
             </Text>
             {isInvalid && (
                 <View style={styles.row} testID={`warning-icon-${item.id}`}>
                    <Text style={{ color: theme.colors.error, marginRight: 4, fontWeight: 'bold' }}>Błąd przebiegu</Text>
                    <Appbar.Action icon="alert-circle" size={20} color={theme.colors.error} style={{ margin: 0, padding: 0 }} />
                 </View>
             )}
          </View>
        </View>
        <Divider />
        <Card.Content style={styles.cardContent}>
          <View style={styles.statCol}>
            <Text variant="bodySmall" style={styles.label}>
              Spalanie
            </Text>
            {typeof item.fuel_consumption === 'number' ? (
              <>
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: consumptionColor }}>
                  {item.fuel_consumption.toFixed(2)}
                </Text>
                <Text variant="labelSmall" style={{ color: consumptionColor, marginTop: -4 }}>
                  L/100km
                </Text>
              </>
            ) : (
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurfaceDisabled }}>
                -
              </Text>
            )}
          </View>

          <View style={styles.statCol}>
            <Text variant="bodySmall" style={styles.label}>
              {car?.mileage_input_preference === 'distance' ? 'Dystans' : 'Przebieg'}
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {car?.mileage_input_preference === 'distance'
                ? item.distance_traveled ?? '-'
                : item.odometer ?? '-'}
            </Text>
            <Text variant="labelSmall" style={{ marginTop: -2 }}>
              km
            </Text>
          </View>

          <View style={styles.statCol}>
            <Text variant="bodySmall" style={styles.label}>
              Cena
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {item.price_per_liter?.toFixed(2) ?? '-'}
            </Text>
            <Text variant="labelSmall" style={{ marginTop: -2 }}>
              zł/L
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
        <React.Fragment>
          {/* Fillups List */}
          <FlatList
          style={{ flex: 1 }}
          data={fillups}
          extraData={fillups} // Force re-render when the array changes, important for relative checks (index+1)
          removeClippedSubviews={false} // Prevent blank views issues on Android
          keyExtractor={(item) => item.id}
          renderItem={renderFillupItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text>Brak tankowań. Dodaj pierwsze tankowanie!</Text>
            </View>
          }
        />
        </React.Fragment>
      ) : (
        <ChartsTab fillups={fillups} />
      )}

      {activeTab === 'fillups' && (
        <FAB
          testID="add-fillup-fab"
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 }]}
          color="white"
          onPress={() => navigation.navigate('FillupForm', { carId })}
        />
      )}
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
  },
  card: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden', // for header radius
    borderWidth: 1,
    borderColor: 'transparent',
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
  invalidCard: {
    borderColor: '#dc2626', // error color
  },
  invalidCardHeader: {
    backgroundColor: '#fef2f2', // light red
  },
});
