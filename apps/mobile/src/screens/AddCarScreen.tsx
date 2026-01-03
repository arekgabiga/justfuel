import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CarRepository } from '../database/CarRepository';
import { MileagePreference } from '../types';
import { createCarCommandSchema } from '@justfuel/shared';
import { RootStackParamList, RootStackNavigationProp } from '../navigation/types';

export default function AddCarScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddCar'>>();
  const theme = useTheme();
  const carToEdit = route.params?.car;

  const [name, setName] = useState(carToEdit?.name || '');
  const [initialOdometer, setInitialOdometer] = useState(carToEdit?.initial_odometer?.toString() || '');
  const [preference, setPreference] = useState<MileagePreference>(carToEdit?.mileage_input_preference || 'distance');
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (carToEdit) {
      navigation.setOptions({ title: 'Edytuj samochód' });
    }
  }, [carToEdit, navigation]);

  // Real-time Validation
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    // Name Validation
    if (!name.trim()) {
       // Optional: could mark as required here if desired, but button disable is safer
    } else if (name.length > 100) {
        newErrors.name = 'Nazwa jest zbyt długa';
    }

    // Odometer Validation
    if (initialOdometer) {
        const odo = parseFloat(initialOdometer.replace(',', '.'));
        if (isNaN(odo)) {
            newErrors.initial_odometer = 'Nieprawidłowa liczba';
        } else if (odo < 0) {
            newErrors.initial_odometer = 'Przebieg nie może być ujemny';
        } else if (!/^\d*\.?\d{0,2}$/.test(initialOdometer.replace(',', '.'))) {
             newErrors.initial_odometer = 'Maksymalnie 2 miejsca po przecinku';
        }
    }

    setErrors(newErrors);
  }, [name, initialOdometer]);

  const handleBlurOdometer = () => {
      if (!initialOdometer) return;
      const val = initialOdometer.replace(',', '.');
      const num = parseFloat(val);
      if (!isNaN(num)) {
          // Round to 2 decimal places
          const formatted = Math.round(num * 100) / 100;
          setInitialOdometer(formatted.toString());
      }
  };

  const isFormValid = () => {
      const hasErrors = Object.keys(errors).length > 0;
      const isNameEmpty = !name.trim();
      return !hasErrors && !isNameEmpty;
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    // Validate with Zod
    const validationResult = createCarCommandSchema.safeParse({
      name: name.trim(),
      initial_odometer: initialOdometer ? parseFloat(initialOdometer.replace(',', '.')) : undefined,
      mileage_input_preference: preference,
    });

    if (!validationResult.success) {
      Alert.alert('Błąd walidacji', validationResult.error.errors[0].message);
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
      Alert.alert('Błąd', 'Nie udało się zapisać samochodu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Nazwa samochodu (np. Audi A4)"
        testID="name-input"
        value={name}
        onChangeText={setName}
        mode="outlined"
        maxLength={100}
        error={!!errors.name}
        activeOutlineColor={errors.name ? theme.colors.error : undefined}
        style={styles.input}
      />
      {errors.name && <HelperText type="error" visible={true}>{errors.name}</HelperText>}

      <TextInput
        label="Początkowy stan licznika (opcjonalne)"
        testID="odometer-input"
        value={initialOdometer}
        onChangeText={(text) => setInitialOdometer(text.replace(',', '.'))}
        onBlur={handleBlurOdometer}
        mode="outlined"
        keyboardType="numeric"
        maxLength={10}
        error={!!errors.initial_odometer}
        activeOutlineColor={errors.initial_odometer ? theme.colors.error : undefined}
        style={styles.input}
      />
      {errors.initial_odometer && <HelperText type="error" visible={true}>{errors.initial_odometer}</HelperText>}

      <HelperText type="info" padding="none" style={styles.label}>
        Preferowany sposób wprowadzania przebiegu:
      </HelperText>

      <SegmentedButtons
        value={preference}
        onValueChange={(val) => {
            if (carToEdit) return;
            setPreference(val as MileagePreference);
        }}
        buttons={[
          {
            value: 'odometer',
            label: 'Stan Licznika',
            showSelectedCheck: true,
            disabled: !!carToEdit,
          },
          {
            value: 'distance',
            label: 'Dystans',
            showSelectedCheck: true,
            disabled: !!carToEdit,
          },
        ]}
        style={styles.segmentedButton}
      />
      
      {!!carToEdit ? (
        <HelperText type="info" visible={true} style={styles.infoText}>
          Tego ustawienia nie można zmienić po utworzeniu samochodu.
        </HelperText>
      ) : (
        <HelperText type="info" visible={true} style={styles.infoText}>
          Uwaga: Tego ustawienia nie będzie można później zmienić.
        </HelperText>
      )}

      <Button 
        mode="contained" 
        testID="save-button"
        onPress={handleSave} 
        loading={loading} 
        disabled={loading || !isFormValid()} 
        style={styles.button}
      >
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
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'white',
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
  infoText: {
    marginBottom: 8,
  },
});
