import React, { useState, useEffect } from 'react';
import { Settings, MapPin, ShieldCheck, Users, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Save, Clock, Sliders } from 'lucide-react';
import { api } from '../services/api';

export default function AdminOfficeSettingsPage({ office, onRefreshOffice }) {
  const [formOffice, setFormOffice] = useState({
    name: '',
    address: '',
    latitude: 37.789172,
    longitude: -122.401449,
    radiusMeters: 150,
    maxGpsAccuracyMeters: 100,
    workStartTime: '09:00',
    workEndTime: '17:00',
    lateGraceMinutes: 15,
    requireFaceMatch: true,
    requireLiveness: true,
    storePhotos: false,
    matchThreshold: 0.55
  });

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Live Stats & Monitor Data
  const [stats, setStats] = useState(null);
  const [allAttendance, setAllAttendance] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Test geofence state
  const [testLat, setTestLat] = useState('');
  const [testLng, setTestLng] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (office) {
      setFormOffice({
        name: office.name || '',
        address: office.address || '',
        latitude: office.latitude || 37.789172,
        longitude: office.longitude || -122.401449,
        radiusMeters: office.radiusMeters || 150,
        maxGpsAccuracyMeters: office.maxGpsAccuracyMeters || 100,
        workStartTime: office.workStartTime || '09:00',
        workEndTime: office.workEndTime || '17:00',
        lateGraceMinutes: office.lateGraceMinutes || 15,
        requireFaceMatch: office.requireFaceMatch !== false,
        requireLiveness: office.requireLiveness !== false,
        storePhotos: Boolean(office.storePhotos),
        matchThreshold: office.matchThreshold || 0.55
      });
      setTestLat(String(office.latitude));
      setTestLng(String(office.longitude));
    }
  }, [office]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, attRes, corrRes] = await Promise.all([
        api.getStats(),
        api.getHistory(),
        api.getCorrections()
      ]);
      setStats(statsRes.stats);
      setAllAttendance(attRes.records || []);
      setCorrections(corrRes.corrections || []);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.updateOffice(formOffice);
      setSaveMsg({ type: 'success', text: 'Office geofence & attendance rules updated successfully!' });
      if (onRefreshOffice) onRefreshOffice();
      loadDashboardData();
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestGeofence = async () => {
    if (!testLat || !testLng) return;
    try {
      const res = await api.testGeofence({ latitude: Number(testLat), longitude: Number(testLng) });
      setTestResult(res);
    } catch (err) {
      alert('Error testing geofence: ' + err.message);
    }
  };

  const handleReviewCorrection = async (id, status) => {
    const note = prompt(`Enter review notes for ${status}:`, status === 'APPROVED' ? 'Verified with department lead.' : 'Insufficient justification.');
    if (note === null) return;

    try {
      await api.reviewCorrection(id, {
        status,
        reviewNotes: note,
        reviewedBy: 'Admin (HR Dept)'
      });
      loadDashboardData();
    } catch (err) {
      alert('Failed to update correction request: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Total Employees</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {stats ? stats.totalEmployees : '--'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Face Biometrics</span>
          <span className="text-xl font-bold text-indigo-400 mt-1 block">
            {stats ? `${stats.enrolledEmployees} Enrolled` : '--'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Present Today</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">
            {stats ? stats.presentToday : '--'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Rejected Checks</span>
          <span className="text-xl font-bold text-red-400 mt-1 block">
            {stats ? stats.rejectedTodayCheckIns : '--'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 block">Pending HR Requests</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">
            {stats ? stats.pendingCorrections : '--'}
          </span>
        </div>
      </div>

      {/* Main Two Columns: Settings & Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Office Geofence Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Office Geofence & Rules Configuration</h2>
              <p className="text-xs text-slate-400">
                Coordinates and thresholds evaluated on the server using Haversine formula
              </p>
            </div>
          </div>

          {saveMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                saveMsg.type === 'success'
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                  : 'bg-red-950/70 text-red-300 border border-red-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Office Name</label>
                <input
                  type="text"
                  value={formOffice.name}
                  onChange={(e) => setFormOffice({ ...formOffice, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Campus Address</label>
                <input
                  type="text"
                  value={formOffice.address}
                  onChange={(e) => setFormOffice({ ...formOffice, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Office Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formOffice.latitude}
                  onChange={(e) => setFormOffice({ ...formOffice, latitude: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Office Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formOffice.longitude}
                  onChange={(e) => setFormOffice({ ...formOffice, longitude: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Geofence Radius (meters)
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={formOffice.radiusMeters}
                  onChange={(e) => setFormOffice({ ...formOffice, radiusMeters: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
                <span className="text-[10px] text-slate-500">Attendance accepted when distance ≤ radius</span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Max GPS Accuracy (meters)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formOffice.maxGpsAccuracyMeters}
                  onChange={(e) => setFormOffice({ ...formOffice, maxGpsAccuracyMeters: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
                <span className="text-[10px] text-slate-500">Rejected if phone accuracy is worse than 100m</span>
              </div>
            </div>

            {/* Attendance Rules Toggles */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="text-slate-300 font-semibold block">Attendance Verification Rules</span>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formOffice.requireFaceMatch}
                  onChange={(e) => setFormOffice({ ...formOffice, requireFaceMatch: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Require 128-d Face Descriptor Match against enrolled profile
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formOffice.requireLiveness}
                  onChange={(e) => setFormOffice({ ...formOffice, requireLiveness: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Require Live Presence Check (e.g. blink detection)
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formOffice.storePhotos}
                  onChange={(e) => setFormOffice({ ...formOffice, storePhotos: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Store Full Photos (default is metadata-only to safeguard privacy)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center space-x-2 shadow-lg shadow-indigo-900/30"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Geofence & Rules</span>
            </button>
          </form>

          {/* Quick Geofence Distance Tester */}
          <div className="pt-4 border-t border-slate-800 text-xs">
            <span className="text-indigo-400 font-semibold block mb-2">
              Instant Geofence Distance Test Tool
            </span>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={testLat}
                onChange={(e) => setTestLat(e.target.value)}
                placeholder="Test Latitude"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs flex-1"
              />
              <input
                type="number"
                step="any"
                value={testLng}
                onChange={(e) => setTestLng(e.target.value)}
                placeholder="Test Longitude"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleTestGeofence}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Calculate
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2 p-2 rounded-lg text-[11px] ${
                  testResult.isInside
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950/60 text-red-300 border border-red-800'
                }`}
              >
                <strong>Distance:</strong> {testResult.distanceMeters} m — {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Right: Pending HR Corrections Approval Workflow */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">HR Correction Workflow</h3>
            </div>
            <button
              onClick={loadDashboardData}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            When camera detection or GPS fails, employees submit correction requests here. Approving a request instantly validates and logs their attendance.
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {corrections.filter((c) => c.status === 'PENDING').length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/60">
                No pending HR correction requests. All employee check-ins are up to date!
              </div>
            ) : (
              corrections
                .filter((c) => c.status === 'PENDING')
                .map((corr) => (
                  <div
                    key={corr.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{corr.employeeName}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]">
                        {corr.requestedType}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Date: <strong className="text-slate-300">{corr.targetDate}</strong> at{' '}
                      <strong className="text-slate-300">{corr.targetTime}</strong>
                    </div>

                    <p className="text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                      "{corr.reason}"
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleReviewCorrection(corr.id, 'APPROVED')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleReviewCorrection(corr.id, 'REJECTED')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Real-time Company Attendance Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4">
          Live Company-Wide Attendance Feed (All Staff)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Employee</th>
                <th className="px-3 py-2.5">Action</th>
                <th className="px-3 py-2.5">Server Time</th>
                <th className="px-3 py-2.5">Source</th>
                <th className="px-3 py-2.5">Distance</th>
                <th className="px-3 py-2.5">GPS Acc</th>
                <th className="px-3 py-2.5">Face Scan</th>
                <th className="px-3 py-2.5">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allAttendance.slice(0, 10).map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/30">
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-200">
                    {rec.employeeName}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        rec.type === 'CHECK_IN' ? 'text-emerald-300 bg-emerald-950' : 'text-indigo-300 bg-indigo-950'
                      }`}
                    >
                      {rec.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                    {new Date(rec.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-400 capitalize">
                    {rec.source}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">
                    {rec.officeDistanceMeters}m
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">
                    {rec.gpsAccuracyMeters ? `±${rec.gpsAccuracyMeters}m` : '--'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {rec.faceDetectedCount === 1 ? (
                      <span className="text-emerald-400 font-medium">1 Face</span>
                    ) : (
                      <span className="text-red-400 font-medium">{rec.faceDetectedCount} Faces</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
