import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, InitialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { View, Text } from 'react-native';
import { getDBConnection, createTables } from './src/database/schema';
import CarListScreen from './src/screens/CarListScreen';
import AddCarScreen from './src/screens/AddCarScreen';
import CarDetailsScreen from './src/screens/CarDetailsScreen';
import FillupFormScreen from './src/screens/FillupFormScreen';
import { RootStackParamList, CarDetailsScreenProps } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();



const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066CC',
    secondary: '#FFCC00',
  },
};

import { CarRepository } from './src/database/CarRepository';
import { getLastActiveCarId } from './src/utils/storage';
import { ActivityIndicator } from 'react-native-paper';

import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState<InitialState>();

  React.useEffect(() => {
    async function init() {
      try {
        const db = await getDBConnection();
        await createTables(db);
        // console.log('Database initialized');

        const cars = await CarRepository.getAllCars();
        
        if (cars.length === 1) {
          setInitialState({
            index: 1,
            routes: [
              { name: 'CarList' },
              { name: 'CarDetails', params: { carId: cars[0].id, carName: cars[0].name } },
            ],
          });
        } else if (cars.length > 1) {
          const lastId = await getLastActiveCarId();
          if (lastId) {
            const car = cars.find((c) => c.id === lastId);
            if (car) {
              setInitialState({
                index: 1,
                routes: [
                  { name: 'CarList' },
                  { name: 'CarDetails', params: { carId: car.id, carName: car.name } },
                ],
              });
            }
          }
        }
      } catch (e) {
        console.error('Init failed', e);
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 20 }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <ErrorBoundary>
        <NavigationContainer initialState={initialState}>
          <StatusBar style="dark" />
          <Stack.Navigator initialRouteName="CarList">
            <Stack.Screen name="CarList" component={CarListScreen} options={{ title: 'Moje Samochody' }} />
            <Stack.Screen name="AddCar" component={AddCarScreen} options={{ title: 'Dodaj Samochód' }} />
            <Stack.Screen
              name="CarDetails"
              component={CarDetailsScreen}
              options={({ route }) => ({ title: route.params.carName })}
            />
            <Stack.Screen name="FillupForm" component={FillupFormScreen} options={{ title: 'Nowe Tankowanie' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    </PaperProvider>
  );
}
