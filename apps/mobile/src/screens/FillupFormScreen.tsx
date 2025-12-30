import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, Text, Card, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FillupRepository } from '../database/FillupRepository';
import { CarRepository } from '../database/CarRepository';
import { NewFillup, Fillup, Car } from '../types';
import {
  calculateFuelConsumption,
  calculatePricePerLiter,
  calculateDistanceTraveled,
  calculateOdometer,
} from '@justfuel/shared';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function FillupFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const theme = useTheme();
  const { carId, fillup } = route.params;

  // State
  const [car, setCar] = useState<Car | null>(null);
  const [date, setDate] = useState<Date>(fillup ? new Date(fillup.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // We keep 'odometerInput' and 'distanceInput' separate to avoid confusion
  const [odometerInput, setOdometerInput] = useState(fillup ? fillup.odometer.toString() : '');
  const [distanceInput, setDistanceInput] = useState(
    fillup && fillup.distance_traveled ? fillup.distance_traveled.toString() : ''
  );

  const [fuelAmount, setFuelAmount] = useState(fillup ? fillup.fuel_amount.toString() : '');
  const [totalPrice, setTotalPrice] = useState(fillup ? fillup.total_price.toString() : '');
  const [loading, setLoading] = useState(false);
  const [lastFillup, setLastFillup] = useState<Fillup | null>(null);

  React.useEffect(() => {
    if (fillup) {
      navigation.setOptions({ title: 'Edytuj tankowanie' });
    }
  }, [fillup, navigation]);

  useEffect(() => {
    async function loadData() {
      try {
        const [carData, previousFillup] = await Promise.all([
          CarRepository.getCarById(carId),
          FillupRepository.getPreviousFillup(carId, date.toISOString()),
        ]);
        setCar(carData);
        setLastFillup(previousFillup);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
    loadData();
  }, [carId, date]);

  // Derived calculations
  const fuel = parseFloat(fuelAmount);
  const price = parseFloat(totalPrice);

  // Logic:
  // If preference is 'distance': User inputs Distance. Odometer = LastOdometer + Distance.
  // If preference is 'odometer': User inputs Odometer. Distance = Odometer - LastOdometer.

  let finalOdometer = 0;
  let finalDistance = 0;

  if (car?.mileage_input_preference === 'distance') {
    const dist = parseFloat(distanceInput);
    if (!isNaN(dist)) {
      finalDistance = dist;
      // If we have a last fillup, we add to it. If not (first fillup), odometer is just distance (assuming starts at 0? or we ask for initial odo in car creation).
      const baseOdometer = lastFillup ? lastFillup.odometer : car.initial_odometer || 0;
      finalOdometer = calculateOdometer(baseOdometer, dist);
    }
  } else {
    // Default 'odometer'
    const odo = parseFloat(odometerInput);
    if (!isNaN(odo)) {
      finalOdometer = odo;
      const baseOdometer = lastFillup ? lastFillup.odometer : car?.initial_odometer || 0;
      finalDistance = calculateDistanceTraveled(finalOdometer, baseOdometer);
    }
  }

  const consumption = calculateFuelConsumption(finalDistance, fuel);
  const pricePerLiter = calculatePricePerLiter(price, fuel) || 0;

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const onDateChange = ({ type }: any, selectedDate?: Date) => {
    if (type === 'set') {
      const currentDate = selectedDate || date;
      setDate(currentDate);
      if (Platform.OS === 'android') {
        toggleDatePicker();
      }
    } else {
      toggleDatePicker();
    }
  };

  // Format date as DD-MM-YYYY
  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!fuelAmount || !totalPrice) return;

    // Validate specific inputs based on preference
    if (car?.mileage_input_preference === 'distance' && !distanceInput) return;
    if (car?.mileage_input_preference !== 'distance' && !odometerInput) return;

    setLoading(true);
    try {
      if (fillup) {
        // Update existing
        await FillupRepository.updateFillup({
          ...fillup,
          date: date.toISOString(),
          odometer: finalOdometer,
          fuel_amount: fuel,
          total_price: price,
          distance_traveled: finalDistance,
          fuel_consumption: consumption,
          price_per_liter: pricePerLiter || 0,
        });
      } else {
        // Create new
        const newFillup: NewFillup = {
          car_id: carId,
          date: date.toISOString(),
          odometer: finalOdometer,
          fuel_amount: fuel,
          total_price: price,
        };

        (newFillup as any).distance_traveled = finalDistance;
        (newFillup as any).fuel_consumption = consumption;

        await FillupRepository.addFillup(newFillup);
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się zapisać.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Usuń tankowanie', 'Czy na pewno chcesz usunąć to tankowanie?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            if (fillup && fillup.id) {
              await FillupRepository.deleteFillup(fillup.id);
              navigation.goBack();
            }
          } catch (e) {
            console.error(e);
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={toggleDatePicker}>
        <TextInput
          label="Data"
          value={formatDate(date)}
          editable={false}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Icon icon="calendar" onPress={toggleDatePicker} />}
        />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker mode="date" display="spinner" value={date} onChange={onDateChange} maximumDate={new Date()} />
      )}

      <TextInput
        label="Ilość paliwa (L)"
        value={fuelAmount}
        onChangeText={(text) => setFuelAmount(text.replace(',', '.'))}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Cena całkowita (PLN)"
        value={totalPrice}
        onChangeText={(text) => setTotalPrice(text.replace(',', '.'))}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      {car?.mileage_input_preference === 'distance' ? (
        <TextInput
          label="Przejechany dystans (km)"
          value={distanceInput}
          onChangeText={(text) => setDistanceInput(text.replace(',', '.'))}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      ) : (
        <TextInput
          label="Aktualny Stan Licznika (km)"
          value={odometerInput}
          onChangeText={(text) => setOdometerInput(text.replace(',', '.'))}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
      )}

      {car?.mileage_input_preference !== 'distance' && finalDistance < 0 && (
        <HelperText type="error" visible={true}>
          Przebieg musi być wyższy niż poprzedni ({lastFillup?.odometer || car?.initial_odometer} km).
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
        disabled={loading || (car?.mileage_input_preference !== 'distance' && finalDistance < 0)}
      >
        Zapisz tankowanie
      </Button>

      {fillup && (
        <Button
          mode="outlined"
          onPress={handleDelete}
          textColor={theme.colors.error}
          style={[styles.button, { borderColor: theme.colors.error, marginTop: 12 }]}
          disabled={loading}
        >
          Usuń tankowanie
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
});
