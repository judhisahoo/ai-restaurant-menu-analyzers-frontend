import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import WelcomeScreen from './src/screens/WelcomeScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required');
        // In real app, perhaps exit
      } else {
        // Update location
        const location = await Location.getCurrentPositionAsync({});
        // Call API to update location_history
        // fetch(BASE_URL/api/user/current-location, ...)
      }
    })();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
