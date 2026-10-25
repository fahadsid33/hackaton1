import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export default function SettingsScreen({
  employees,
  currentEmployee,
  setCurrentEmployee,
  office,
  onRefreshAll
}) {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());

  const handleSaveUrl = () => {
    setApiBaseUrl(urlInput);
    Alert.alert('Saved', `API Base URL updated to: ${urlInput}`);
    if (onRefreshAll) onRefreshAll();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mobile App Settings</Text>
      <Text style={styles.subtitle}>Configure server connection & testing profile</Text>

      {/* Backend API Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Server API URL</Text>
        <Text style={styles.cardDesc}>
          Default: http://localhost:5000 (web) or http://10.0.2.2:5000 (Android emulator). For a physical phone, set to your computer's LAN IP.
        </Text>
        <TextInput
          style={styles.input}
          value={urlInput}
          onChangeText={setUrlInput}
          placeholder="http://192.168.1.X:5000"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
          <Text style={styles.saveBtnText}>Update Connection URL</Text>
        </TouchableOpacity>
      </View>

      {/* Switch Employee */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Active Employee Profile</Text>
        <View style={styles.empList}>
          {employees.map((emp) => {
            const isSelected = currentEmployee?.id === emp.id;
            return (
              <TouchableOpacity
                key={emp.id}
                style={[styles.empItem, isSelected && styles.empItemActive]}
                onPress={() => setCurrentEmployee(emp)}
              >
                <View>
                  <Text style={[styles.empName, isSelected && styles.textWhite]}>
                    {emp.name} ({emp.id})
                  </Text>
                  <Text style={styles.empDept}>{emp.department} • {emp.role}</Text>
                </View>
                {isSelected && <Text style={styles.activeCheck}>✓ Active</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Office Geofence Info */}
      {office && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Office Geofence</Text>
          <Text style={styles.infoLine}>Office Name: {office.name}</Text>
          <Text style={styles.infoLine}>
            Location: {office.latitude.toFixed(5)}, {office.longitude.toFixed(5)}
          </Text>
          <Text style={styles.infoLine}>Allowed Radius: {office.radiusMeters} meters</Text>
          <Text style={styles.infoLine}>Max GPS Accuracy: {office.maxGpsAccuracyMeters} meters</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
  subtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 20 },
  card: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#64748b', fontSize: 11, marginBottom: 10 },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#fff',
    padding: 10,
    fontSize: 12,
    marginBottom: 10
  },
  saveBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empList: { marginTop: 8, gap: 8 },
  empItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  empItemActive: { backgroundColor: '#312e81', borderWidth: 1, borderColor: '#6366f1' },
  empName: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  empDept: { color: '#64748b', fontSize: 10, marginTop: 2 },
  textWhite: { color: '#fff' },
  activeCheck: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },
  infoLine: { color: '#94a3b8', fontSize: 11, marginTop: 4 }
});
