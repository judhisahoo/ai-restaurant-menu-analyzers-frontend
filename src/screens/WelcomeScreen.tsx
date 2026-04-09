import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../constants';

const WelcomeScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // For simplicity, no default email fetch

  const sendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter email');
      return;
    }
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', generatedOtp); // For testing, log the OTP
    try {
      const response = await fetch(`${BASE_URL}/api/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: generatedOtp }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('OTP sent response:', data); // Log response for debugging
        setSentOtp(generatedOtp);
        setOtp('');
        setIsOtpVerified(false);
        setShowOtpInput(true);
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const verifyOtp = async () => {
    if (otp.trim() === sentOtp) {
      setIsOtpVerified(true);
      Alert.alert('Success', 'Email verified successfully');
    } else {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  const register = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      console.log('Registration response:', response); // Log response for debugging
      if (response.ok) {
        const user = await response.json();
        await AsyncStorage.setItem('user', JSON.stringify(user));
        // Navigate to main screen
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      {!showOtpInput ? (
        <TouchableOpacity style={styles.primaryButton} onPress={sendOtp}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
      ) : isOtpVerified ? (
        <>
          <Text style={styles.successText}>Email verified. Tap Register to continue.</Text>
          <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={register}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.otpRow}>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
            />
            <Ionicons name="help-circle" size={24} color="gray" />
          </View>
          <TouchableOpacity style={[styles.button, styles.verifyButton]} onPress={verifyOtp}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  button: {
    borderRadius: 6,
    padding: 12,
  },
  primaryButton: {
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    padding: 12,
  },
  verifyButton: {
    marginBottom: 16,
    backgroundColor: '#22c55e',
  },
  registerButton: {
    backgroundColor: '#a855f7',
  },
  successText: {
    marginBottom: 16,
    color: '#15803d',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
