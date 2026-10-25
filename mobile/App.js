import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CameraAttendanceScreen from './src/screens/CameraAttendanceScreen';
import FaceEnrollScreen from './src/screens/FaceEnrollScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CorrectionScreen from './src/screens/CorrectionScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { mobileApi } from './src/services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('camera'); // camera | enroll | history | correction | settings
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [office, setOffice] = useState(null);

  const fetchAppData = async () => {
    try {
      const [empRes, offRes] = await Promise.all([mobileApi.getEmployees(), mobileApi.getOffice()]);
      const list = empRes.employees || [];
      setEmployees(list);
      if (list.length > 0 && !currentEmployee) {
        setCurrentEmployee(list[0]);
      }
      setOffice(offRes.office);
    } catch (e) {
      console.warn('Initial load error (mobile):', e.message);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Main View Area */}
      <View style={styles.container}>
        {activeTab === 'camera' && (
          <CameraAttendanceScreen
            currentEmployee={currentEmployee}
            office={office}
            onNavigateToCorrection={() => setActiveTab('correction')}
          />
        )}

        {activeTab === 'enroll' && (
          <FaceEnrollScreen
            currentEmployee={currentEmployee}
            onRefreshEmployee={fetchAppData}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            currentEmployee={currentEmployee}
          />
        )}

        {activeTab === 'correction' && (
          <CorrectionScreen
            currentEmployee={currentEmployee}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            employees={employees}
            currentEmployee={currentEmployee}
            setCurrentEmployee={setCurrentEmployee}
            office={office}
            onRefreshAll={fetchAppData}
          />
        )}
      </View>

      {/* Bottom Tab Bar Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('camera')}
        >
          <Text style={[styles.tabLabel, activeTab === 'camera' && styles.tabActive]}>
            📷 Camera
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('enroll')}
        >
          <Text style={[styles.tabLabel, activeTab === 'enroll' && styles.tabActive]}>
            👤 Enroll
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabActive]}>
            📋 Logs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('correction')}
        >
          <Text style={[styles.tabLabel, activeTab === 'correction' && styles.tabActive]}>
            📝 HR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabActive]}>
            ⚙️ Config
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090d16' },
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  tabActive: { color: '#818cf8', fontWeight: '800' }
});
