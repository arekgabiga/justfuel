import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FillupRepository } from '../database/FillupRepository';
import { CarRepository } from '../database/CarRepository';
import { NewFillup, Fillup, Car } from '../types';
import {
  formatDate,
  createFillupRequestSchema,
  CreateFillupRequestInput,
} from '@justfuel/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList, RootStackNavigationProp } from '../navigation/types';
import { useFillupCalculations } from '../hooks/useFillupCalculations';

export default function FillupFormScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'FillupForm'>>();
  const theme = useTheme();
  const { carId, fillup } = route.params;

  // State
  const [car, setCar] = useState<Car | null>(null);
  const [date, setDate] = useState<Date>(fillup ? new Date(fillup.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Inputs
  const [odometerInput, setOdometerInput] = useState(fillup ? fillup.odometer.toString() : '');
  const [distanceInput, setDistanceInput] = useState(
    fillup && fillup.distance_traveled ? fillup.distance_traveled.toString() : ''
  );
  const [fuelAmount, setFuelAmount] = useState(fillup ? fillup.fuel_amount.toString() : '');
  const [totalPrice, setTotalPrice] = useState(fillup ? fillup.total_price.toString() : '');
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
          FillupRepository.getPreviousFillup(carId, date.toISOString(), fillup?.id),
        ]);
        setCar(carData);
        setLastFillup(previousFillup);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
    loadData();
  }, [carId, date]);

  const {
    fuel,
    price,
    finalOdometer,
    finalDistance,
    consumption,
    pricePerLiter,
    calculationError,
  } = useFillupCalculations({
    car,
    lastFillup,
    odometerInput,
    distanceInput,
    fuelAmount,
    totalPrice,
  });

  // Real-time Validation
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    // Fuel Validation
    if (fuelAmount) {
      const f = parseFloat(fuelAmount);
      if (isNaN(f)) newErrors.fuel_amount = 'Nieprawidłowa liczba';
      else if (f > 2000) newErrors.fuel_amount = 'Maksymalna ilość to 2000L';
      else if (!/^\d*\.?\d{0,2}$/.test(fuelAmount)) newErrors.fuel_amount = 'Maksymalnie 2 miejsca po przecinku';
    }

    // Price Validation
    if (totalPrice) {
      const p = parseFloat(totalPrice);
      if (isNaN(p)) newErrors.total_price = 'Nieprawidłowa liczba';
      else if (p > 100000) newErrors.total_price = 'Maksymalna kwota to 100 000 PLN';
      else if (!/^\d*\.?\d{0,2}$/.test(totalPrice)) newErrors.total_price = 'Maksymalnie 2 miejsca po przecinku';
    }
    
    // Distance/Odometer logic
    if (car?.mileage_input_preference === 'distance') {
        if (distanceInput) {
             const d = parseFloat(distanceInput);
             if (d > 10000) newErrors.distance = 'Dystans wydaje się zbyt duży';
             else if (!/^\d*\.?\d{0,2}$/.test(distanceInput)) newErrors.distance = 'Maksymalnie 2 miejsca po przecinku';
        }
    } else {
        if (odometerInput && parseFloat(odometerInput) > 2000000) {
             newErrors.odometer = 'Przebieg wydaje się nieprawdopodobny';
        }
    }

    setErrors(newErrors);
  }, [fuelAmount, totalPrice, distanceInput, odometerInput, car]);

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

  const handleBlur = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!value) return;
    const numericValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numericValue)) {
      // Round to 2 decimal places
      const formatted = Math.round(numericValue * 100) / 100;
      setter(formatted.toString());
    }
  };

  const isFormValid = () => {
    const hasErrors = Object.keys(errors).length > 0;
    const hasCalculationError = !!calculationError;
    const hasEmptyFields = !fuelAmount || !totalPrice || 
       (car?.mileage_input_preference === 'distance' ? !distanceInput : !odometerInput);
    
    return !hasErrors && !hasCalculationError && !hasEmptyFields;
  };

  const handleSubmit = async () => {
    // Final validation before submit
    if (!isFormValid()) return;

    // Payload preparation
    const payload: CreateFillupRequestInput = {
      date: date.toISOString(),
      fuel_amount: fuel,
      total_price: price,
      ...(car?.mileage_input_preference === 'distance'
        ? { distance: parseFloat(distanceInput) }
        : { odometer: parseFloat(odometerInput) }),
    };

    const validationResult = createFillupRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      // Should not happen if UI validation works
      Alert.alert('Błąd walidacji', validationResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
        const validData = validationResult.data;
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
          date: validData.date,
          odometer: finalOdometer,
          fuel_amount: validData.fuel_amount,
          total_price: validData.total_price,
          distance_traveled: finalDistance,
          fuel_consumption: consumption,
        };

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
      <TouchableOpacity onPress={toggleDatePicker} testID="date-picker-trigger">
        <TextInput
          label="Data"
          value={formatDate(date)}
          editable={false}
          testID="date-input"
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
        onBlur={() => handleBlur(fuelAmount, setFuelAmount)}
        keyboardType="numeric"
        mode="outlined"
        maxLength={10}
        testID="fuel-amount-input"
        error={!!errors.fuel_amount}
        activeOutlineColor={errors.fuel_amount ? theme.colors.error : undefined}
        style={styles.input}
      />
      {errors.fuel_amount && <HelperText type="error" visible={true}>{errors.fuel_amount}</HelperText>}

      <TextInput
        label="Cena całkowita (PLN)"
        value={totalPrice}
        onChangeText={(text) => setTotalPrice(text.replace(',', '.'))}
        onBlur={() => handleBlur(totalPrice, setTotalPrice)}
        keyboardType="numeric"
        mode="outlined"
        maxLength={10}
        testID="total-price-input"
        error={!!errors.total_price}
        activeOutlineColor={errors.total_price ? theme.colors.error : undefined}
        style={styles.input}
      />
      {errors.total_price && <HelperText type="error" visible={true}>{errors.total_price}</HelperText>}

      {car?.mileage_input_preference === 'distance' ? (
        <View>
            <TextInput
            label="Przejechany dystans (km)"
            value={distanceInput}
            onChangeText={(text) => setDistanceInput(text.replace(',', '.'))}
            onBlur={() => handleBlur(distanceInput, setDistanceInput)}
            keyboardType="numeric"
            mode="outlined"
            maxLength={10}
            testID="distance-input"
            error={!!errors.distance}
            activeOutlineColor={errors.distance ? theme.colors.error : undefined}
            style={styles.input}
            />
            {errors.distance && <HelperText type="error" visible={true}>{errors.distance}</HelperText>}
        </View>
      ) : (
        <View>
            <TextInput
            label="Aktualny Stan Licznika (km)"
            value={odometerInput}
            onChangeText={(text) => setOdometerInput(text.replace(',', '.'))}
            keyboardType="numeric"
            mode="outlined"
            maxLength={8}
            testID="odometer-input"
            error={!!errors.odometer || !!calculationError}
            activeOutlineColor={(errors.odometer || calculationError) ? theme.colors.error : undefined}
            style={styles.input}
            />
             {(errors.odometer || calculationError) && (
                <HelperText type="error" visible={true}>
                    {errors.odometer || calculationError}
                </HelperText>
             )}
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
        testID="save-button"
        disabled={loading || !isFormValid()}
      >
        Zapisz tankowanie
      </Button>

      {fillup && (
        <Button
          mode="outlined"
          onPress={handleDelete}
          textColor={theme.colors.error}
          style={[styles.button, { borderColor: theme.colors.error, marginTop: 12 }]}
          testID="delete-button"
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
    marginTop: 8,
    marginBottom: 4, 
    backgroundColor: 'white'
  },
  button: {
    marginTop: 24,
    paddingVertical: 6,
  },
});
