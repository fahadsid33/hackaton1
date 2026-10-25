import React from 'react';
import { CheckCircle, XCircle, Clock, MapPin, ShieldAlert, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

export default function AttendanceStatusModal({
  isOpen,
  onClose,
  result,
  onNavigateToCorrection
}) {
  if (!isOpen || !result) return null;

  const isSuccess = result.success;
  const record = result.record || {};
  const valSummary = result.validationSummary || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isSuccess ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        ></div>

        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/40">
              <CheckCircle className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500/60 flex items-center justify-center text-red-400 shadow-lg shadow-red-900/40">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h3 className="text-xl font-bold text-white mb-1">
            {isSuccess
              ? `${record.type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Confirmed!`
              : 'Attendance Rejected'}
          </h3>
          <p className="text-xs text-slate-400">
            {result.message || (isSuccess ? 'Verified by camera AI & geofence' : 'One or more verification checks failed')}
          </p>
        </div>

        {/* Verification Check Matrix */}
        <div className="space-y-2 mb-5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          {/* Face Check */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Face Detection</span>
            </span>
            <span
              className={`font-semibold ${
                valSummary.faceDetected ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {valSummary.faceDetected ? '1 Face (Passed)' : `Failed (${valSummary.faceCount || 0} faces)`}
            </span>
          </div>

          {/* Location / Geofence Check */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Geofence Distance</span>
            </span>
            <span
              className={`font-semibold ${
                valSummary.locationInside ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {valSummary.distanceMeters !== undefined
                ? `${valSummary.distanceMeters}m / max ${valSummary.radiusMeters}m`
                : '--'}
            </span>
          </div>

          {/* GPS Accuracy Check */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>GPS Accuracy (≤ 100m)</span>
            </span>
            <span
              className={`font-semibold ${
                valSummary.accuracyValid ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {valSummary.accuracyMeters !== undefined ? `±${Math.round(valSummary.accuracyMeters)}m` : '--'}
            </span>
          </div>

          {/* Timestamp by server */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Server Time</span>
            </span>
            <span className="font-mono text-slate-200">
              {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isSuccess && (
            <button
              onClick={() => {
                onClose();
                onNavigateToCorrection();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/30"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Request HR Correction Fallback</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          )}

          <button
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs transition-colors ${
              isSuccess
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isSuccess ? 'Done' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
}
