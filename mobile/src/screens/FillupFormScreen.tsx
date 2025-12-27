import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, Text, Card, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FillupRepository } from '../database/FillupRepository';
import { NewFillup, Fillup } from '../types';

export default function FillupFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const theme = useTheme();
  const { carId } = route.params;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFillup, setLastFillup] = useState<Fillup | null>(null);

  useEffect(() => {
    async function fetchLastFillup() {
      try {
        const fillups = await FillupRepository.getFillupsByCarId(carId);
        if (fillups.length > 0) {
          // Assuming fetching returns sorted by date DESC
          setLastFillup(fillups[0]);
        }
      } catch (e) {
        console.error('Failed to fetch last fillup', e);
      }
    }
    fetchLastFillup();
  }, [carId]);

  // Derived calculations
  const currentOdometer = parseFloat(odometer);
  const fuel = parseFloat(fuelAmount);
  const price = parseFloat(totalPrice);

  const distance = lastFillup && !isNaN(currentOdometer) ? currentOdometer - lastFillup.odometer : null;

  const consumption = distance && !isNaN(fuel) && distance > 0 ? (fuel / distance) * 100 : null;

  const pricePerLiter = !isNaN(price) && !isNaN(fuel) && fuel > 0 ? price / fuel : null;

  const handleSubmit = async () => {
    if (!odometer || !fuelAmount || !totalPrice) return;

    setLoading(true);
    try {
      const newFillup: NewFillup = {
        car_id: carId,
        date: new Date(date).toISOString(),
        odometer: currentOdometer,
        fuel_amount: fuel,
        total_price: price,
        // Optional: save derived values if backend supports it,
        // relying on repo to save them if they are part of the type.
        // The type definition I saw earlier for NewFillup didn't strictly require them,
        // but let's pass them as extended props if needed or just let the repo handle/ignore.
        // Actually, looking at Types, NewFillup excludes them.
        // The Repo logic had (newFillup as any).distance_traveled so passing them works if we cast.
      };

      // Inject calculated values for the repo to use
      (newFillup as any).distance_traveled = distance;
      (newFillup as any).fuel_consumption = consumption;

      await FillupRepository.addFillup(newFillup);
      navigation.goBack();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput label="Data (YYYY-MM-DD)" value={date} onChangeText={setDate} mode="outlined" style={styles.input} />

      <TextInput
        label="Aktualny Przebieg (km)"
        value={odometer}
        onChangeText={(text) => setOdometer(text.replace(',', '.'))}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
        right={lastFillup ? <TextInput.Affix text={`(Ost: ${lastFillup.odometer})`} /> : null}
      />
      {distance !== null && distance < 0 && (
        <HelperText type="error" visible={true}>
          Przebieg musi być większy niż poprzedni ({lastFillup?.odometer} km).
        </HelperText>
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

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
        disabled={loading || (distance !== null && distance < 0)}
      >
        Zapisz tankowanie
      </Button>
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
