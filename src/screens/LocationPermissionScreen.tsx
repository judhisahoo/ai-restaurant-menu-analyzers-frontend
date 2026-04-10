import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LocationPermissionScreen = ({ navigation }: any) => {
  const [requesting, setRequesting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation on location icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleAllowLocation = async () => {
    setRequesting(true);
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        // Permission granted — proceed
        navigation.replace('SavingLocation');
      } else if (!canAskAgain) {
        // Permanently denied — must open Settings
        Alert.alert(
          'Location Required',
          'Location permission was permanently denied. Please enable it in your device Settings to continue using this app.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
          { cancelable: false }
        );
      } else {
        // Denied but can ask again — show message and let user retry
        Alert.alert(
          'Location Required',
          'This app requires location access to provide personalized restaurant recommendations near you. Please allow location to continue.',
          [{ text: 'Try Again', style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not request location permission. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Icon area */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconRing2} />
          <View style={styles.iconRing1} />
          <Animated.View
            style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}
          >
            <Ionicons name="location-sharp" size={52} color="#ffffff" />
          </Animated.View>
        </View>

        {/* Text */}
        <Text style={styles.title}>Location Access{'\n'}Required</Text>
        <Text style={styles.subtitle}>
          Smart Menu Analyzer uses your location to show nearby restaurants and
          provide personalized menu recommendations.
        </Text>

        <View style={styles.featureList}>
          {[
            { icon: 'restaurant-outline', text: 'Find restaurants near you' },
            { icon: 'star-outline', text: 'Personalized recommendations' },
            { icon: 'shield-checkmark-outline', text: 'Your location stays private' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBg}>
                <Ionicons name={item.icon as any} size={18} color="#2C6CB0" />
              </View>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Mandatory note */}
        <View style={styles.mandatoryNote}>
          <Ionicons name="information-circle-outline" size={16} color="#E67E22" />
          <Text style={styles.mandatoryText}>
            Location access is mandatory to use this app.
          </Text>
        </View>

        {/* Allow Button */}
        <TouchableOpacity
          style={[styles.allowButton, requesting && styles.allowButtonDisabled]}
          onPress={handleAllowLocation}
          disabled={requesting}
          activeOpacity={0.85}
        >
          <Ionicons name="location-outline" size={20} color="#fff" style={styles.btnIcon} />
          <Text style={styles.allowButtonText}>
            {requesting ? 'Requesting...' : 'Allow Location Access'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          You cannot skip this step.
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
  bgCircle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(74,144,226,0.1)',
    top: -width * 0.3,
    right: -width * 0.25,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(44,108,176,0.08)',
    bottom: -width * 0.2,
    left: -width * 0.15,
  },
  content: {
    width: '88%',
    alignItems: 'center',
  },

  // Icon
  iconWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconRing2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(44,108,176,0.12)',
  },
  iconRing1: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(44,108,176,0.18)',
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#2C6CB0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },

  // Text
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    color: '#2C6CB0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  // Feature list
  featureList: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(74,144,226,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1A5276',
    fontWeight: '500',
  },

  // Mandatory note
  mandatoryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 24,
    gap: 6,
  },
  mandatoryText: {
    fontSize: 13,
    color: '#E67E22',
    fontWeight: '500',
    flex: 1,
  },

  // Button
  allowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 14,
  },
  allowButtonDisabled: {
    opacity: 0.65,
  },
  btnIcon: {
    marginRight: 8,
  },
  allowButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 12,
    color: '#5DADE2',
    textAlign: 'center',
  },
});

export default LocationPermissionScreen;
