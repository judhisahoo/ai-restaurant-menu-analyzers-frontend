import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import styles from './SplashScreenStyle';

const SplashScreen = ({ navigation }) => {

  useEffect(() => {
    setTimeout(() => {
      // Navigate to Home Screen after 3 seconds
      navigation.replace('Home');
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>

      {/* Top Section */}
      <View style={styles.topContainer}>
        <Text style={styles.title}>Smart Menu Analyzer</Text>
        <Text style={styles.tagline}>Scan • Understand • Enjoy</Text>
      </View>

      {/* Center Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/splash-image.png')} // your image path
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.poweredText}>Powered by AI</Text>
      </View>

    </View>
  );
};

export default SplashScreen;