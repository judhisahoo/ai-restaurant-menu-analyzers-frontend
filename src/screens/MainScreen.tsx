import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type UserData = {
  name?: string;
  email?: string;
};

type LocationData = {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
};

const MainScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<UserData>({});
  const [location, setLocation] = useState<LocationData>({});
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const userRaw = await AsyncStorage.getItem('user');
        const locationRaw = await AsyncStorage.getItem('userLocation');
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          // Handle both flat {id,name,email} and wrapped {message, data:{id,name,email}} shapes
          const userObj = parsed?.data ?? parsed;
          console.log('[MainScreen] user from storage:', JSON.stringify(userObj));
          setUser(userObj);
        }
        if (locationRaw) {
          const loc: LocationData = JSON.parse(locationRaw);
          setLocation(loc);
          // Reverse-geocode to a human-readable address (Nominatim — free, no API key)
          if (loc.latitude && loc.longitude) {
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.latitude}&lon=${loc.longitude}`,
                { headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartMenuAnalyzer/1.0' } }
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                setAddress(geoData?.display_name ?? '');
              }
            } catch (_) {
              // Reverse-geocode failure is non-blocking
            }
          }
        }
      } catch (_) {}
    };
    load();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['user', 'deviceEmail']);
          navigation.replace('Welcome');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'camera-outline', label: 'Scan Menu', color: '#2C6CB0', route: 'ScanMenu' },
    { icon: 'search-outline', label: 'Search Dishes', color: '#27AE60', route: null },
    { icon: 'heart-outline', label: 'Favourites', color: '#E74C3C', route: null },
    { icon: 'time-outline', label: 'History', color: '#E67E22', route: null },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day 👋</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name ? user.name : (user?.email ?? 'User')}
            </Text>
            {user?.name && user?.email ? (
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#2C6CB0" />
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="restaurant" size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Smart Menu Analyzer</Text>
          <Text style={styles.heroSubtitle}>
            Scan any restaurant menu and get instant AI-powered insights — calories,
            ingredients, and descriptions at a glance.
          </Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.gridItem}
              activeOpacity={0.8}
              onPress={() =>
                item.route
                  ? navigation.navigate(item.route)
                  : Alert.alert('Coming Soon', `${item.label} will be available soon!`)
              }
            >
              <View style={[styles.gridIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={26} color="#fff" />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}

        </View>

        {/* Location info */}
        {location?.latitude && (
          <View style={styles.locationCard}>
            <Ionicons name="location-sharp" size={20} color="#2C6CB0" />
            <View style={styles.locationText}>
              <Text style={styles.locationTitle}>Current Saved Location</Text>
              <Text style={styles.locationCoords}>
                {address
                  ? address
                  : `${location.latitude?.toFixed(4)}°N, ${location.longitude?.toFixed(4)}°E`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8E6FA',
    overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(74,144,226,0.1)',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  bgBlob2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(44,108,176,0.08)',
    bottom: -width * 0.15,
    left: -width * 0.15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#2E86C1',
    fontWeight: '500',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A5276',
    maxWidth: width * 0.65,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E86C1',
    maxWidth: width * 0.65,
    marginTop: 1,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  // Hero
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2C6CB0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#2E86C1',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Grid
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A5276',
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  locationText: { flex: 1 },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A5276',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  locationCoords: {
    fontSize: 13,
    color: '#2E86C1',
    marginTop: 2,
  },
});

export default MainScreen;
