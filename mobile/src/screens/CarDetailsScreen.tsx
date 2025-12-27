import React from 'react';
import { View, Text } from 'react-native';

export default function CarDetailsScreen({ route }: any) {
  const { carName } = route.params;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Szczegóły: {carName}</Text>
      <Text>Ekran w budowie...</Text>
    </View>
  );
}
