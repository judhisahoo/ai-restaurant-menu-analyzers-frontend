import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { BASE_URL } from '../constants';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Pre-fill email from AsyncStorage (saved on previous session)
  useEffect(() => {
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

    const loadSavedUser = async () => {
      try {
        const userRaw = await AsyncStorage.getItem('user');
        if (userRaw) {
          // 'user' key exists — returning user, skip the welcome flow
          const userObj = JSON.parse(userRaw);
          const storedUserId: string = userObj?.user_id ?? userObj?.id ?? '';
          const storedEmail: string = userObj?.email ?? '';

          if (storedEmail) {
            setEmail(storedEmail);
          }
          if (storedUserId) {
            setUserId(storedUserId);
          }

          // Update current location on the server (using last-known / placeholder coords)
          try {
            await fetch(`${BASE_URL}/api/user/current-location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: storedUserId,
                latitude: 1234.45565,
                longitude: 3455.567,
                accuracy: 5.7,
              }),
            });
          } catch (_) {
            // Location update failure is non-blocking; continue navigation
          }

          // Skip welcome / OTP flow — go directly to Dashboard
          navigation.replace('Main');
        }
      } catch (_) {
        // If parsing fails, fall through and show the welcome form normally
      }
    };
    loadSavedUser();
  }, []);

  const sendOtp = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name.');
      return;
    }
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP (dev):', generatedOtp);
    try {
      const res = await fetch(`${BASE_URL}/api/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: generatedOtp }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log('OTP sent response:', data);
        setSentOtp(generatedOtp);
        setOtp('');
        setIsOtpVerified(false);
        setShowOtpInput(true);
        await AsyncStorage.setItem('deviceEmail', email);
      } else {
        const errText = await res.text();
        Alert.alert('Error', errText || 'Failed to send OTP');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = () => {
    if (otp.trim() === sentOtp) {
      setIsOtpVerified(true);
    } else {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect. Please try again.');
    }
  };

  const register = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name before continuing.');
      return;
    }
    setLoading(true);
    try {
      // 1. Device ID — Android uses getAndroidId(), iOS uses getIosIdForVendor()
      const deviceId =
        Platform.OS === 'android'
          ? (Application.getAndroidId() ?? 'unknown-android')
          : ((await Application.getIosIdForVendorAsync()) ?? 'unknown-ios');

      // 2. Location saved by SavingLocationScreen
      const locationRaw = await AsyncStorage.getItem('userLocation');
      const location = locationRaw ? JSON.parse(locationRaw) : null;

      const payload = {
        name: name.trim(),
        email,
        deviceId: String(deviceId),
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        accuracy: location?.accuracy ?? null,
      };

      console.log('Register payload:', payload);

      const res = await fetch(`${BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const user = await res.json();
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('deviceEmail', email);
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Background blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <KeyboardAvoidingView
        style={styles.kvContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.inner,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Logo */}
            <View style={styles.logoArea}>
              <View style={styles.logoCircle}>
                <Ionicons name="restaurant" size={36} color="#ffffff" />
              </View>
              <Text style={styles.appName}>Smart Menu Analyzer</Text>
              <Text style={styles.appTagline}>Scan • Understand • Enjoy</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {isOtpVerified ? '✅ Email Verified' : "Welcome! Let's get started"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isOtpVerified
                  ? 'Your email is verified. Tap Register to continue.'
                  : showOtpInput
                  ? 'Enter the OTP sent to your email.'
                  : 'Enter your name and email to get started.'}
              </Text>

              {/* Full Name Field — always visible from step 1 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#2C6CB0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Your full name"
                    placeholderTextColor="#90BEE0"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    editable={!showOtpInput}
                  />
                  {name !== '' && !showOtpInput && (
                    <TouchableOpacity onPress={() => setName('')}>
                      <Ionicons name="close-circle" size={18} color="#90BEE0" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#2C6CB0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor="#90BEE0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!showOtpInput}
                  />
                  {email !== '' && !showOtpInput && (
                    <TouchableOpacity onPress={() => setEmail('')}>
                      <Ionicons name="close-circle" size={18} color="#90BEE0" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* OTP Field */}
              {showOtpInput && !isOtpVerified && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color="#2C6CB0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#90BEE0"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </View>
              )}



              {/* Action Buttons */}
              {!showOtpInput ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={sendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              ) : isOtpVerified ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.registerBtn, loading && styles.btnDisabled]}
                  onPress={register}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    {loading ? 'Registering...' : 'Register & Continue'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.otpBtnRow}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, styles.verifyBtn, { flex: 1 }]}
                    onPress={verifyOtp}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Verify OTP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={() => {
                      setShowOtpInput(false);
                      setOtp('');
                      setSentOtp('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resendBtnText}>Resend</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#C8E6FA', overflow: 'hidden' },
  bgBlob1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(74,144,226,0.12)',
    top: -width * 0.35,
    right: -width * 0.25,
  },
  bgBlob2: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    backgroundColor: 'rgba(44,108,176,0.09)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  kvContainer: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  inner: { alignItems: 'center' },

  // Logo
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2C6CB0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#1A5276', textAlign: 'center' },
  appTagline: { fontSize: 13, color: '#2E86C1', fontStyle: 'italic', marginTop: 4, letterSpacing: 0.8 },

  // Card
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A5276', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#2E86C1', marginBottom: 20, lineHeight: 18 },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A5276',
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200,230,250,0.5)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(44,108,176,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  inputIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A5276',
    paddingVertical: 12,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerBtn: { backgroundColor: '#1A5276' },
  verifyBtn: { backgroundColor: '#27AE60' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  otpBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  resendBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2C6CB0',
  },
  resendBtnText: { color: '#2C6CB0', fontWeight: '700', fontSize: 14 },

  // Terms
  termsText: { fontSize: 11, color: '#2E86C1', textAlign: 'center', lineHeight: 16 },
  termsLink: { color: '#1A5276', fontWeight: '700', textDecorationLine: 'underline' },
});

export default WelcomeScreen;
