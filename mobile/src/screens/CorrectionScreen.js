import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { mobileApi } from '../services/api';

export default function CorrectionScreen({ currentEmployee }) {
  const [requestedType, setRequestedType] = useState('CHECK_IN');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentEmployee) {
      Alert.alert('Error', 'Please select an employee first in Settings.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please describe the reason for your correction request.');
      return;
    }

    setSubmitting(true);
    try {
      await mobileApi.submitCorrection({
        employeeId: currentEmployee.id,
        requestedType,
        targetDate: new Date().toISOString().split('T')[0],
        targetTime: new Date().toLocaleTimeString().slice(0, 5),
        reason: reason.trim()
      });

      Alert.alert('Success', 'HR correction request submitted. Awaiting HR review.');
      setReason('');
    } catch (e) {
      Alert.alert('Submission Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HR Attendance Correction Fallback</Text>
      <Text style={styles.subtitle}>
        Submit manual correction when camera or GPS fails verification
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Action</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, requestedType === 'CHECK_IN' && styles.typeBtnActive]}
            onPress={() => setRequestedType('CHECK_IN')}
          >
            <Text style={styles.typeBtnText}>Check-In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, requestedType === 'CHECK_OUT' && styles.typeBtnActive]}
            onPress={() => setRequestedType('CHECK_OUT')}
          >
            <Text style={styles.typeBtnText}>Check-Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Reason & Issue Context</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. GPS drift inside basement parking garage, lighting glare..."
          placeholderTextColor="#64748b"
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#090d16" />
          ) : (
            <Text style={styles.submitBtnText}>Submit to HR</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
  subtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 20 },
  formCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' },
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#4f46e5' },
  typeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  textArea: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    color: '#fff',
    padding: 12,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16,
    fontSize: 12
  },
  submitBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitBtnText: { color: '#090d16', fontSize: 13, fontWeight: '700' }
});
