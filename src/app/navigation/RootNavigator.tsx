import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { BreedListScreen } from '../../screens/BreedListScreen';
import { BreedDetailsScreen } from '../../screens/BreedDetailsScreen';
import { FilterScreen } from '../../screens/FilterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="BreedList"
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    >
      <Stack.Screen name="BreedList" component={BreedListScreen} />
      <Stack.Screen name="BreedDetails" component={BreedDetailsScreen} />
      <Stack.Screen
        name="FilterModal"
        component={FilterScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};
