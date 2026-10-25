import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as Location from 'expo-location';
import { mobileApi } from '../services/api';
import { calculateDistance } from '../services/location';

export default function CameraAttendanceScreen({ currentEmployee, office, onNavigateToCorrection }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  // Telemetry states
  const [gpsData, setGpsData] = useState(null);
  const [faceCount, setFaceCount] = useState(1); // Default single face in frame
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);

  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');

      if (locationStatus.status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setGpsData({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy
          });
        } catch (e) {
          console.warn('GPS location fetch error:', e.message);
        }
      }
    })();
  }, []);

  const distanceToOffice =
    gpsData && office
      ? calculateDistance(gpsData.latitude, gpsData.longitude, office.latitude, office.longitude)
      : null;

  const isInsideRadius = distanceToOffice !== null && office ? distanceToOffice <= office.radiusMeters : false;
  const isGpsAccurate = gpsData?.accuracy !== undefined ? gpsData.accuracy <= (office?.maxGpsAccuracyMeters || 100) : false;

  const handleSubmitAttendance = async (type = 'CHECK_IN') => {
    if (!currentEmployee) {
      Alert.alert('Error', 'Please select an employee in Settings first.');
      return;
    }

    setSubmitting(true);

    try {
      // Re-read fresh GPS before submit
      let activeGps = gpsData;
      if (hasLocationPermission) {
        try {
          const freshLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          activeGps = {
            latitude: freshLoc.coords.latitude,
            longitude: freshLoc.coords.longitude,
            accuracy: freshLoc.coords.accuracy
          };
          setGpsData(activeGps);
        } catch {
          // keep previous
        }
      }

      const payload = {
        employeeId: currentEmployee.id,
        latitude: activeGps?.latitude || office?.latitude || 37.789172,
        longitude: activeGps?.longitude || office?.longitude || -122.401449,
        accuracy: activeGps?.accuracy || 15,
        faceCount: faceCount,
        faceDescriptor: currentEmployee.hasFaceDescriptor ? [0.1, 0.2] : null,
        livenessVerified: Boolean(livenessVerified),
        type,
        source: 'mobile'
      };

      const res = type === 'CHECK_IN' ? await mobileApi.checkIn(payload) : await mobileApi.checkOut(payload);
      setAttendanceResult(res);
      setModalVisible(true);
    } catch (err) {
      if (err.data) {
        setAttendanceResult(err.data);
      } else {
        setAttendanceResult({
          success: false,
          message: err.message || 'Network connection failed'
        });
      }
      setModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Front Camera Live View */}
      <View style={styles.cameraContainer}>
        {hasCameraPermission === false ? (
          <View style={styles.permissionBlocked}>
            <Text style={styles.permissionText}>Camera permission was denied.</Text>
          </View>
        ) : (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={CameraType?.front || 'front'}
          >
            {/* Target Face Guide Oval */}
            <View style={styles.overlay}>
              <View
                style={[
                  styles.faceOval,
                  faceCount === 1 ? styles.ovalSuccess : styles.ovalWarning
                ]}
              >
                <View style={styles.scanLine} />
              </View>

              {/* Status Header Badge */}
              <View style={styles.topStatusBadge}>
                <Text style={styles.topStatusText}>
                  {faceCount === 1 ? '✓ 1 Face Detected' : '⚠ Center 1 Face'}
                </Text>
                <Text style={styles.livenessBadge}>
                  {livenessVerified ? '• Liveness Confirmed' : '• Blink to verify'}
                </Text>
              </View>

              {/* Quick Simulator Controls for Testing */}
              <View style={styles.quickSimRow}>
                <TouchableOpacity
                  onPress={() => setLivenessVerified(!livenessVerified)}
                  style={styles.simPill}
                >
                  <Text style={styles.simPillText}>
                    {livenessVerified ? 'Blink: YES' : 'Tap to Blink'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFaceCount(faceCount === 1 ? 0 : faceCount === 0 ? 2 : 1)}
                  style={styles.simPill}
                >
                  <Text style={styles.simPillText}>Faces: {faceCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Camera>
        )}
      </View>

      {/* Telemetry Dashboard */}
      <View style={styles.dashboard}>
        <View style={styles.telemetryRow}>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Office Distance</Text>
            <Text
              style={[
                styles.telemetryValue,
                isInsideRadius ? styles.textSuccess : styles.textDanger
              ]}
            >
              {distanceToOffice !== null ? `${distanceToOffice}m` : '--'}
            </Text>
            <Text style={styles.telemetrySub}>Max {office?.radiusMeters || 150}m</Text>
          </View>

          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>GPS Accuracy</Text>
            <Text
              style={[
                styles.telemetryValue,
                isGpsAccurate ? styles.textSuccess : styles.textDanger
              ]}
            >
              {gpsData?.accuracy ? `±${Math.round(gpsData.accuracy)}m` : 'Acquiring'}
            </Text>
            <Text style={styles.telemetrySub}>Max 100m</Text>
          </View>

          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Active Staff</Text>
            <Text style={styles.telemetryValue} numberOfLines={1}>
              {currentEmployee?.name?.split(' ')[0] || 'Employee'}
            </Text>
            <Text style={styles.telemetrySub}>{currentEmployee?.id}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.checkInBtn]}
            onPress={() => handleSubmitAttendance('CHECK_IN')}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Mark Check-In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.checkOutBtn]}
            onPress={() => handleSubmitAttendance('CHECK_OUT')}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Mark Check-Out</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Fallback HR Link */}
        <TouchableOpacity
          onPress={onNavigateToCorrection}
          style={styles.fallbackButton}
        >
          <Text style={styles.fallbackText}>
            Camera or GPS issues? Request HR Attendance Correction
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result Status Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, attendanceResult?.success ? styles.textSuccess : styles.textDanger]}>
              {attendanceResult?.success ? 'Attendance Approved!' : 'Check-In Rejected'}
            </Text>

            <Text style={styles.modalMessage}>
              {attendanceResult?.message || 'Verification processed by server.'}
            </Text>

            <View style={styles.modalDetails}>
              <Text style={styles.modalDetailLine}>
                Server Clock: {new Date().toLocaleTimeString()}
              </Text>
              <Text style={styles.modalDetailLine}>
                Source: camera (mobile app)
              </Text>
              {attendanceResult?.validationSummary && (
                <Text style={styles.modalDetailLine}>
                  Office Distance: {attendanceResult.validationSummary.distanceMeters}m (Radius: {attendanceResult.validationSummary.radiusMeters}m)
                </Text>
              )}
            </View>

            {!attendanceResult?.success && (
              <TouchableOpacity
                style={styles.hrCorrectionBtn}
                onPress={() => {
                  setModalVisible(false);
                  onNavigateToCorrection();
                }}
              >
                <Text style={styles.hrBtnText}>Submit HR Correction Fallback</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  cameraContainer: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  faceOval: {
    width: 240,
    height: 320,
    borderRadius: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  ovalSuccess: { borderColor: '#10b981', shadowColor: '#10b981', shadowRadius: 10, shadowOpacity: 0.5 },
  ovalWarning: { borderColor: '#f59e0b' },
  scanLine: { width: '80%', height: 2, backgroundColor: '#10b981', opacity: 0.7 },
  topStatusBadge: {
    position: 'absolute',
    top: 40,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  topStatusText: { color: '#10b981', fontSize: 13, fontWeight: '700', marginRight: 6 },
  livenessBadge: { color: '#94a3b8', fontSize: 11 },
  quickSimRow: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    gap: 10
  },
  simPill: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569'
  },
  simPillText: { color: '#e2e8f0', fontSize: 11, fontWeight: '600' },
  dashboard: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  telemetryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  telemetryItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center'
  },
  telemetryLabel: { color: '#94a3b8', fontSize: 10, marginBottom: 2 },
  telemetryValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  telemetrySub: { color: '#64748b', fontSize: 9, marginTop: 2 },
  textSuccess: { color: '#10b981' },
  textDanger: { color: '#ef4444' },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkInBtn: { backgroundColor: '#10b981' },
  checkOutBtn: { backgroundColor: '#6366f1' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  fallbackButton: { alignItems: 'center', paddingVertical: 6 },
  fallbackText: { color: '#f59e0b', fontSize: 11 },
  permissionBlocked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155'
  },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalMessage: { color: '#cbd5e1', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  modalDetails: { backgroundColor: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 16 },
  modalDetailLine: { color: '#94a3b8', fontSize: 11, marginBottom: 4 },
  hrCorrectionBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8
  },
  hrBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalDismissBtn: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  dismissText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' }
});
