
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_ACTIVE_CAR_KEY = 'justfuel_last_active_car_id';

export const saveLastActiveCarId = async (carId: string) => {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_CAR_KEY, carId);
  } catch (e) {
    console.error('Failed to save last active car ID', e);
  }
};

export const getLastActiveCarId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_ACTIVE_CAR_KEY);
  } catch (e) {
    console.error('Failed to get last active car ID', e);
    return null;
  }
};

export const clearLastActiveCarId = async () => {
  try {
    await AsyncStorage.removeItem(LAST_ACTIVE_CAR_KEY);
  } catch (e) {
    console.error('Failed to clear last active car ID', e);
  }
};
