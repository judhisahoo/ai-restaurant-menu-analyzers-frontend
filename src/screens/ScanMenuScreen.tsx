import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../constants';

const { width } = Dimensions.get('window');

type ScanState = 'idle' | 'uploading' | 'success' | 'error';

const ScanMenuScreen = ({ navigation }: any) => {
  const [userId, setUserId] = useState<string>('');
  const [rawUser, setRawUser] = useState<string>('Not loaded yet...');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    id: number;
    scan_photo: string;
    captured_at: string;
  } | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Load user_id from AsyncStorage
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          // Handle both shapes: {id,name,email} or {data:{id,name,email}, message:"..."}
          const obj = parsed?.data ?? parsed;
          setRawUser(JSON.stringify(obj, null, 2));
          const id: string = String(obj?.user_id ?? obj?.id ?? obj?.userId ?? obj?._id ?? '');
          setUserId(id);
          console.log('[ScanMenu] user object:', JSON.stringify(obj));
          console.log('[ScanMenu] resolved userId:', id);
        } else {
          setRawUser('⚠️ No "user" key found in AsyncStorage');
          console.warn('[ScanMenu] No user key in AsyncStorage');
        }
      } catch (e) {
        setRawUser('❌ Error reading user: ' + String(e));
      }
    };
    loadUser();

    // Pulsing scanner ring animation (idle state)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Trigger success animation when scan succeeds
  useEffect(() => {
    if (scanState === 'success') {
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      successAnim.setValue(0);
    }
  }, [scanState]);

  // ─── Pick from gallery ────────────────────────────────────────────────────
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to pick a menu photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setScanState('idle');
      setErrorMsg('');
    }
  };

  // ─── Capture with camera ─────────────────────────────────────────────────
  const captureWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to scan a menu.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setScanState('idle');
      setErrorMsg('');
    }
  };

  const uploadScan = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please capture or select a menu photo first.');
      return;
    }

    // Use userId state (set by loadUser on mount, proven working).
    // Fall back to fresh AsyncStorage read only if state is still empty.
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          const obj = parsed?.data ?? parsed;
          resolvedUserId = String(obj?.user_id ?? obj?.id ?? obj?.userId ?? obj?._id ?? '');
        }
      } catch (e) {
        console.warn('[ScanMenu] AsyncStorage fallback failed:', e);
      }
    }

    console.log('[ScanMenu] uploadScan — userId state:', userId, '| resolved:', resolvedUserId);

    if (!resolvedUserId || resolvedUserId === 'undefined' || resolvedUserId === '') {
      Alert.alert('Session Error', 'Could not find your user ID. Please log out and log in again.');
      return;
    }

    setScanState('uploading');
    setErrorMsg('');
    try {
      const formData = new FormData();
      // Send as numeric string — server expects "numeric string"
      formData.append('user_id', resolvedUserId);

      const filename = imageUri.split('/').pop() ?? 'scan.jpg';
      const ext = (/\.([a-zA-Z0-9]+)$/.exec(filename) ?? [])[1] ?? 'jpg';
      const mimeType = ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('scan_photo', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type: mimeType,
      } as any);

      console.log('[ScanMenu] Posting to:', `${BASE_URL}/api/menu-scans`);
      console.log('[ScanMenu] user_id:', resolvedUserId, '| file:', filename, '| mime:', mimeType);

      const res = await fetch(`${BASE_URL}/api/menu-scans`, {
        method: 'POST',
        // Do NOT set Content-Type manually — fetch sets it with correct multipart boundary
        body: formData,
      });

      console.log('[ScanMenu] response status:', res.status);
      if (res.ok) {
        const json = await res.json();
        console.log('[ScanMenu] success response:', JSON.stringify(json));
        const resultData = json?.data ?? json;
        setScanResult({
          id: resultData?.id ?? 0,
          scan_photo: resultData?.scan_photo ?? '',
          captured_at: resultData?.captured_at ?? new Date().toISOString(),
        });
        setScanState('success');
      } else {
        const errText = await res.text();
        console.warn('[ScanMenu] Server error:', errText);
        setErrorMsg(errText || 'Scan upload failed. Please try again.');
        setScanState('error');
      }
    } catch (err: any) {
      console.warn('[ScanMenu] Upload exception:', err);
      setErrorMsg(err.message ?? 'Network error. Please check your connection.');
      setScanState('error');
    }
  };

  // ─── Reset to scan another ────────────────────────────────────────────────
  const resetScan = () => {
    setImageUri(null);
    setScanState('idle');
    setErrorMsg('');
    setScanResult(null);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A5276" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Menu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SUCCESS STATE ── */}
        {scanState === 'success' ? (
          <Animated.View
            style={[
              styles.successCard,
              {
                opacity: successAnim,
                transform: [{ scale: successAnim }],
              },
            ]}
          >
          <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#27AE60" />
            </View>
            <Text style={styles.successTitle}>Menu Scanned Successfully! ✅</Text>
            <Text style={styles.successSubtitle}>
              Your menu photo has been uploaded to the server.
            </Text>

            {/* Server-returned hosted image */}
            {scanResult?.scan_photo ? (
              <>
                <Text style={styles.successLabel}>Uploaded Image (from server):</Text>
                <Image
                  source={{ uri: scanResult.scan_photo }}
                  style={styles.successThumb}
                  resizeMode="cover"
                />
                <View style={styles.successMeta}>
                  <Ionicons name="barcode-outline" size={14} color="#2E86C1" />
                  <Text style={styles.successMetaText}>Scan ID: #{scanResult.id}</Text>
                </View>
                <View style={styles.successMeta}>
                  <Ionicons name="time-outline" size={14} color="#2E86C1" />
                  <Text style={styles.successMetaText}>
                    {new Date(scanResult.captured_at).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.successUrlBox}>
                  <Text style={styles.successUrlLabel}>Image URL:</Text>
                  <Text style={styles.successUrl} numberOfLines={3}>
                    {scanResult.scan_photo}
                  </Text>
                </View>
              </>
            ) : (
              // Fallback: show local preview if no server URL
              imageUri && (
                <Image source={{ uri: imageUri }} style={styles.successThumb} />
              )
            )}

            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
              <Ionicons name="scan-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.scanAgainBtnText}>Scan Another Menu</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            {/* ── SCANNER ZONE ── */}
            <View style={styles.scannerZone}>
              {imageUri ? (
                /* Preview of selected image */
                <View style={styles.previewWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeBtn} onPress={resetScan}>
                    <Ionicons name="close-circle" size={28} color="#fff" />
                  </TouchableOpacity>
                  {/* Corner scan brackets */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
              ) : (
                /* Idle scanner ring */
                <Animated.View
                  style={[styles.scannerRing, { transform: [{ scale: pulseAnim }] }]}
                >
                  <View style={styles.scannerInner}>
                    <Ionicons name="restaurant" size={52} color="#2C6CB0" />
                    <Text style={styles.scannerPrompt}>Tap below to scan</Text>
                  </View>
                  {/* Decorative corner brackets */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </Animated.View>
              )}
            </View>

            {/* ── ERROR MESSAGE ── */}
            {scanState === 'error' && errorMsg !== '' && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#C0392B" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* ── ACTION BUTTONS ── */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={captureWithCamera}
                disabled={scanState === 'uploading'}
                activeOpacity={0.82}
              >
                <View style={[styles.actionBtnIcon, { backgroundColor: '#2C6CB0' }]}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
                <Text style={styles.actionBtnLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={pickFromGallery}
                disabled={scanState === 'uploading'}
                activeOpacity={0.82}
              >
                <View style={[styles.actionBtnIcon, { backgroundColor: '#1A7BB9' }]}>
                  <Ionicons name="images" size={24} color="#fff" />
                </View>
                <Text style={styles.actionBtnLabel}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* ── UPLOAD BUTTON ── */}
            <TouchableOpacity
              style={[
                styles.uploadBtn,
                !imageUri && styles.uploadBtnDisabled,
                scanState === 'uploading' && styles.uploadBtnDisabled,
              ]}
              onPress={uploadScan}
              disabled={!imageUri || scanState === 'uploading'}
              activeOpacity={0.85}
            >
              {scanState === 'uploading' ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.uploadBtnText}>Uploading Scan...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.uploadBtnText}>
                    {imageUri ? 'Upload & Analyze Menu' : 'Select a Photo First'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* ── TIPS CARD ── */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>📋 Tips for best results</Text>
              {[
                'Ensure the menu is well-lit and in focus',
                'Capture the full page — avoid cutting off items',
                'Hold your phone steady while shooting',
                'Avoid glare from lighting sources',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* ── DEBUG CARD — shows raw user object from AsyncStorage ── */}
            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>🔍 AsyncStorage: "user" key</Text>
              <Text style={styles.debugUserId}>Resolved user_id: "{userId || 'EMPTY'}"</Text>
              <Text style={styles.debugJson}>{rawUser}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = '#2C6CB0';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#C8E6FA', overflow: 'hidden' },

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
    bottom: -width * 0.18,
    left: -width * 0.18,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A5276',
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },

  // Scanner zone
  scannerZone: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  scannerRing: {
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  scannerInner: { alignItems: 'center', gap: 10 },
  scannerPrompt: {
    fontSize: 14,
    color: '#2E86C1',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Preview
  previewWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
  },

  // Scan corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 10,
    left: 10,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 10,
    right: 10,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 10,
    left: 10,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 10,
    right: 10,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderBottomRightRadius: 4,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.3)',
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#C0392B', lineHeight: 18 },

  // Action buttons (Camera / Gallery)
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 18,
    paddingVertical: 18,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A5276',
  },

  // Upload button
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Tips card
  tipsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 12,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2C6CB0',
    marginTop: 5,
  },
  tipText: { flex: 1, fontSize: 13, color: '#2E86C1', lineHeight: 19 },

  // Success state
  successCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(39,174,96,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#2E86C1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successThumb: {
    width: width * 0.72,
    height: width * 0.52,
    borderRadius: 14,
    marginBottom: 14,
    resizeMode: 'cover',
  },
  successLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A5276',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  successMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  successMetaText: {
    fontSize: 12,
    color: '#2E86C1',
    fontWeight: '600',
  },
  successUrlBox: {
    width: '100%',
    backgroundColor: 'rgba(200,230,250,0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(44,108,176,0.2)',
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  successUrlLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A5276',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  successUrl: {
    fontSize: 11,
    color: '#2C6CB0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanAgainBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Debug card
  debugCard: {
    width: '100%',
    backgroundColor: 'rgba(255,245,245,0.95)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(192,57,43,0.4)',
    padding: 14,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C0392B',
    marginBottom: 4,
  },
  debugUserId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#922B21',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugJson: {
    fontSize: 11,
    color: '#4A235A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 17,
  },
});

export default ScanMenuScreen;
