import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './src/screens/SplashScreen';
import LocationPermissionScreen from './src/screens/LocationPermissionScreen';
import SavingLocationScreen from './src/screens/SavingLocationScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import MainScreen from './src/screens/MainScreen';
import ScanMenuScreen from './src/screens/ScanMenuScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#C8E6FA' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        <Stack.Screen name="SavingLocation" component={SavingLocationScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="ScanMenu" component={ScanMenuScreen} />
      </Stack.Navigator>
      <StatusBar style="dark" backgroundColor="#C8E6FA" />
    </NavigationContainer>
  );
}
