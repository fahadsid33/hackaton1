import React from 'react';
import { CheckCircle2, AlertTriangle, Eye, ShieldAlert, Sparkles } from 'lucide-react';

export default function BoundingBoxOverlay({
  faceData,
  livenessVerified,
  videoWidth = 640,
  videoHeight = 480,
  isScanning = false,
  employee
}) {
  const { faces = [], faceCount = 0, isBlinking = false } = faceData || {};

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-between p-4">
      {/* Top Banner: Face Count & Integrity Status */}
      <div className="flex items-center justify-between z-10">
        <div>
          {faceCount === 1 ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1 Face Detected (Compliant)</span>
            </div>
          ) : faceCount === 0 ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-950/50">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>No Face Detected — Look into Camera</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-red-950/50 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Multiple Faces ({faceCount})! Only 1 Allowed</span>
            </div>
          )}
        </div>

        {/* Liveness State Indicator */}
        <div className="flex items-center space-x-2">
          {livenessVerified ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/60 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Liveness Verified</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-md">
              <Eye className={`w-3.5 h-3.5 ${isBlinking ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{isBlinking ? 'Blink Detected!' : 'Blink to verify'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Target Guide Oval */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-64 h-80 sm:w-72 sm:h-96 rounded-[45%] border-2 transition-all duration-300 ${
            faceCount === 1
              ? 'border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
              : faceCount > 1
              ? 'border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
              : 'border-slate-500/40 border-dashed'
          } flex items-center justify-center relative`}
        >
          {/* Animated laser scan line when scanning */}
          {isScanning && (
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-scan-line"></div>
          )}

          {/* Corner tick marks */}
          <div className="absolute top-2 left-6 w-4 h-4 border-t-2 border-l-2 border-white/60"></div>
          <div className="absolute top-2 right-6 w-4 h-4 border-t-2 border-r-2 border-white/60"></div>
          <div className="absolute bottom-2 left-6 w-4 h-4 border-b-2 border-l-2 border-white/60"></div>
          <div className="absolute bottom-2 right-6 w-4 h-4 border-b-2 border-r-2 border-white/60"></div>
        </div>
      </div>

      {/* Dynamic detected face bounding boxes */}
      {faces.map((f, idx) => {
        const leftPercent = (f.box.x / videoWidth) * 100;
        const topPercent = (f.box.y / videoHeight) * 100;
        const widthPercent = (f.box.width / videoWidth) * 100;
        const heightPercent = (f.box.height / videoHeight) * 100;

        return (
          <div
            key={idx}
            className={`absolute border-2 rounded-lg transition-all duration-100 ${
              faceCount === 1 ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-red-400/80 bg-red-500/10'
            }`}
            style={{
              left: `${Math.max(5, Math.min(85, leftPercent))}%`,
              top: `${Math.max(5, Math.min(85, topPercent))}%`,
              width: `${Math.max(15, Math.min(70, widthPercent))}%`,
              height: `${Math.max(20, Math.min(80, heightPercent))}%`
            }}
          >
            <span
              className={`absolute -top-6 left-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                faceCount === 1 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              Face #{idx + 1}
            </span>
          </div>
        );
      })}

      {/* Bottom overlay info */}
      <div className="flex items-center justify-between text-xs text-slate-300 z-10 bg-slate-950/70 p-2 rounded-xl backdrop-blur-sm border border-slate-800/60">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white">{employee?.name}</span>
          <span className="text-slate-400">({employee?.id})</span>
        </div>
        <div className="text-[11px] text-slate-400">
          {faceCount === 1 && livenessVerified ? (
            <span className="text-emerald-400 font-medium">✓ Ready for Attendance</span>
          ) : (
            <span className="text-amber-400">Keep face inside oval & blink</span>
          )}
        </div>
      </div>
    </div>
  );
}
