import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CarRepository } from '../database/CarRepository';
import { MileagePreference } from '../types';
import { createCarCommandSchema } from '@justfuel/shared';

export default function AddCarScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const carToEdit = route.params?.car;

  const [name, setName] = useState(carToEdit?.name || '');
  const [initialOdometer, setInitialOdometer] = useState(carToEdit?.initial_odometer?.toString() || '');
  const [preference, setPreference] = useState<MileagePreference>(carToEdit?.mileage_input_preference || 'odometer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (carToEdit) {
      navigation.setOptions({ title: 'Edytuj samochód' });
    }
  }, [carToEdit, navigation]);

  const handleSave = async () => {
    // Validate with Zod
    const validationResult = createCarCommandSchema.safeParse({
      name: name.trim(),
      initial_odometer: initialOdometer ? parseFloat(initialOdometer) : undefined,
      mileage_input_preference: preference,
    });

    if (!validationResult.success) {
      // For simplicity, just show the first error. In a real app, map errors to fields.
      const firstError = validationResult.error.errors[0];
      setError(firstError.message);
      return;
    }

    const validData = validationResult.data;

    setLoading(true);
    try {
      if (carToEdit) {
        await CarRepository.updateCar({
          ...carToEdit,
          name: validData.name,
          initial_odometer: validData.initial_odometer ?? 0,
          mileage_input_preference: validData.mileage_input_preference,
        });
      } else {
        await CarRepository.addCar({
          name: validData.name,
          initial_odometer: validData.initial_odometer ?? 0,
          mileage_input_preference: validData.mileage_input_preference,
        });
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      setError('Nie udało się zapisać samochodu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Nazwa samochodu (np. Audi A4)"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (error) setError('');
        }}
        mode="outlined"
        style={styles.input}
        error={!!error}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <TextInput
        label="Początkowy stan licznika (opcjonalne)"
        value={initialOdometer}
        onChangeText={setInitialOdometer}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <HelperText type="info" padding="none" style={styles.label}>
        Preferowany sposób wprowadzania przebiegu:
      </HelperText>

      <SegmentedButtons
        value={preference}
        onValueChange={(val) => setPreference(val as MileagePreference)}
        buttons={[
          {
            value: 'odometer',
            label: 'Stan Licznika',
            showSelectedCheck: true,
          },
          {
            value: 'distance',
            label: 'Dystans',
            showSelectedCheck: true,
          },
        ]}
        style={styles.segmentedButton}
      />

      <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading} style={styles.button}>
        Zapisz
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
  },
  segmentedButton: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
});
