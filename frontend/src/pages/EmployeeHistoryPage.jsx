import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Clock, MapPin, Camera, Smartphone, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function EmployeeHistoryPage({ currentEmployee, onNavigateToCorrection }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    if (!currentEmployee) return;
    setLoading(true);
    try {
      const res = await api.getHistory({ employeeId: currentEmployee.id });
      setRecords(res.records || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentEmployee]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Attendance History & Audit Log</h2>
            <p className="text-xs text-slate-400">
              Showing official server-timestamped records for {currentEmployee?.name} ({currentEmployee?.id})
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Records Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Loading records from server...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No attendance records recorded yet. Head over to the Camera tab to mark your attendance!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Server Timestamp</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Office Distance</th>
                  <th className="px-4 py-3">GPS Accuracy</th>
                  <th className="px-4 py-3">Face Verification</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((rec) => {
                  const isApproved = rec.status === 'APPROVED';
                  const dateObj = new Date(rec.timestamp);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Type */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            rec.type === 'CHECK_IN'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                          }`}
                        >
                          {rec.type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}
                        </span>
                        {rec.isLate && (
                          <span className="ml-1 text-[10px] text-amber-400 font-medium">Late</span>
                        )}
                      </td>

                      {/* Server Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Server Clock</span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          {rec.source === 'camera' && <Camera className="w-3.5 h-3.5 text-indigo-400" />}
                          {rec.source === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-sky-400" />}
                          {rec.source === 'hr_correction' && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                          <span className="capitalize">{rec.source || 'camera'}</span>
                        </div>
                      </td>

                      {/* Distance */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={
                            rec.officeDistanceMeters <= rec.officeRadiusMeters
                              ? 'text-slate-200'
                              : 'text-red-400 font-medium'
                          }
                        >
                          {rec.officeDistanceMeters !== undefined ? `${rec.officeDistanceMeters} m` : '--'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          max {rec.officeRadiusMeters}m
                        </span>
                      </td>

                      {/* GPS Accuracy */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={
                            rec.gpsAccuracyMeters <= 100
                              ? 'text-slate-200'
                              : 'text-red-400 font-medium'
                          }
                        >
                          {rec.gpsAccuracyMeters ? `±${rec.gpsAccuracyMeters}m` : '--'}
                        </span>
                      </td>

                      {/* Face verification */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                        {rec.faceDetectedCount === 1 ? (
                          <span className="text-emerald-400 font-medium">
                            1 Face {rec.livenessVerified ? '• Live ✓' : ''}
                          </span>
                        ) : (
                          <span className="text-red-400 font-medium">
                            {rec.faceDetectedCount || 0} Faces Detected
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-950 text-red-400 border border-red-800">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                            {rec.rejectionReason && (
                              <p className="text-[10px] text-red-300 mt-1 max-w-xs truncate" title={rec.rejectionReason}>
                                {rec.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
