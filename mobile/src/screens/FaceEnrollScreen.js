import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { mobileApi } from '../services/api';

export default function FaceEnrollScreen({ currentEmployee, onRefreshEmployee }) {
  const [enrolling, setEnrolling] = useState(false);

  const handleEnrollFace = async () => {
    if (!currentEmployee) {
      Alert.alert('Error', 'Please select an employee first in Settings.');
      return;
    }

    setEnrolling(true);
    try {
      // Mock standard 128-d descriptor vector from on-device face detector
      const descriptor = new Array(128).fill(0).map((_, i) => Math.sin(i * 1.5) * 0.15);
      await mobileApi.enrollFace(currentEmployee.id, descriptor);

      Alert.alert('Success', `Face enrolled for ${currentEmployee.name}! Attendance check will now verify matching descriptors.`);
      if (onRefreshEmployee) onRefreshEmployee();
    } catch (e) {
      Alert.alert('Enrollment Error', e.message);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Biometric Enrollment</Text>
      <Text style={styles.subtitle}>
        Register face descriptors for {currentEmployee?.name} ({currentEmployee?.id})
      </Text>

      <View style={styles.cameraBox}>
        <Camera style={styles.camera} type={CameraType?.front || 'front'}>
          <View style={styles.overlay}>
            <View style={styles.oval} />
          </View>
        </Camera>
      </View>

      <TouchableOpacity
        style={styles.enrollBtn}
        onPress={handleEnrollFace}
        disabled={enrolling}
      >
        {enrolling ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.enrollBtnText}>Capture & Enroll Face Descriptor</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
  subtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 20 },
  cameraBox: { height: 350, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  oval: { width: 200, height: 260, borderRadius: 100, borderWidth: 2, borderColor: '#6366f1' },
  enrollBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  enrollBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' }
});
