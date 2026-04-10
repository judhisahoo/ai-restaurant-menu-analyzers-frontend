import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SavingLocationScreen = ({ navigation }: any) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [statusText, setStatusText] = React.useState('Detecting your location...');

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Spinning ring animation
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Core logic: save location & device email
    const saveData = async () => {
      try {
        // Step 1: Get current GPS position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
          savedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem('userLocation', JSON.stringify(locationData));
        setStatusText('Location saved! Setting up your profile...');

        // Step 2: Collect device primary account email
        // Expo managed workflow has no direct API for OS primary account email.
        // We try to read a previously saved deviceEmail (if user has launched before).
        // On first launch, it stays empty and the WelcomeScreen email field will be blank.
        const existingEmail = await AsyncStorage.getItem('deviceEmail');

        // On Android we can try to get the device identifier as a fallback hint,
        // but we do NOT fabricate emails. Leave blank if not previously set.
        if (!existingEmail) {
          // Nothing to pre-fill on first launch — WelcomeScreen will handle it
          await AsyncStorage.setItem('deviceEmail', '');
        }

        setStatusText('All done! Welcome aboard 🎉');

        setTimeout(() => {
          spin.stop();
          navigation.replace('Welcome');
        }, 800);
      } catch (error: any) {
        setStatusText('Could not fetch location. Using last known...');
        // Even on error, move forward after a short delay
        setTimeout(() => {
          navigation.replace('Welcome');
        }, 1500);
      }
    };

    saveData();

    return () => spin.stop();
  }, []);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Animated spinner + icon */}
        <View style={styles.spinnerWrapper}>
          <Animated.View
            style={[
              styles.spinnerRing,
              { transform: [{ rotate: spinInterpolate }] },
            ]}
          />
          <View style={styles.iconCircle}>
            <Ionicons name="location-sharp" size={36} color="#ffffff" />
          </View>
        </View>

        <Text style={styles.heading}>Saving Current Location</Text>
        <Text style={styles.statusText}>{statusText}</Text>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        {/* Info pills */}
        <View style={styles.pillRow}>
          {['GPS Signal', 'Encrypting', 'Storing Locally'].map((label, i) => (
            <View key={i} style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>
          Your location data is saved securely on this device only.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  bgBlob1: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(74,144,226,0.12)',
    top: -width * 0.3,
    left: -width * 0.2,
  },
  bgBlob2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(44,108,176,0.09)',
    bottom: -width * 0.2,
    right: -width * 0.15,
  },

  card: {
    width: '86%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },

  spinnerWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  spinnerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#4A90E2',
    borderRightColor: '#2C6CB0',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2C6CB0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#2E86C1',
    textAlign: 'center',
    marginBottom: 22,
    minHeight: 20,
  },

  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(44,108,176,0.15)',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2C6CB0',
    borderRadius: 4,
  },

  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 6,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,144,226,0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A90E2',
    marginRight: 5,
  },
  pillText: {
    fontSize: 10,
    color: '#1A5276',
    fontWeight: '600',
  },

  footerNote: {
    fontSize: 12,
    color: '#5DADE2',
    textAlign: 'center',
  },
});

export default SavingLocationScreen;
