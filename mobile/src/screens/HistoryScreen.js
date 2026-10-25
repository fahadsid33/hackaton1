import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { mobileApi } from '../services/api';

export default function HistoryScreen({ currentEmployee }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!currentEmployee) return;
    setLoading(true);
    try {
      const res = await mobileApi.getHistory(currentEmployee.id);
      setRecords(res.records || []);
    } catch (e) {
      console.warn('History fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentEmployee]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Attendance Records</Text>
        <TouchableOpacity onPress={loadHistory} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        Official records for {currentEmployee?.name} ({currentEmployee?.id})
      </Text>

      {loading ? (
        <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
      ) : records.length === 0 ? (
        <Text style={styles.emptyText}>No attendance records found.</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isApproved = item.status === 'APPROVED';
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.typeText}>{item.type}</Text>
                  <Text
                    style={[
                      styles.statusPill,
                      isApproved ? styles.statusApproved : styles.statusRejected
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                <Text style={styles.dateText}>
                  {new Date(item.timestamp).toLocaleString()} (Server Time)
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>Source: {item.source}</Text>
                  <Text style={styles.metaText}>Distance: {item.officeDistanceMeters}m</Text>
                  <Text style={styles.metaText}>
                    GPS Acc: {item.gpsAccuracyMeters ? `±${item.gpsAccuracyMeters}m` : '--'}
                  </Text>
                </View>

                {item.rejectionReason && (
                  <Text style={styles.reasonText}>{item.rejectionReason}</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  refreshBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  refreshText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  subtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 16, marginTop: 4 },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  typeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statusPill: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusApproved: { backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981' },
  statusRejected: { backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' },
  dateText: { color: '#94a3b8', fontSize: 11, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { color: '#64748b', fontSize: 10 },
  reasonText: { color: '#f87171', fontSize: 11, marginTop: 6 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 12 }
});
