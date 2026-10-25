import React from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function GpsStatusBadge({
  coords,
  office,
  distance,
  isInside,
  gpsError
}) {
  const accuracy = coords?.accuracy ? Math.round(coords.accuracy) : null;
  const isAccuracyAcceptable = accuracy !== null && accuracy <= (office?.maxGpsAccuracyMeters || 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
          <Navigation className="w-4 h-4 text-indigo-400" />
          <span>GPS Geolocation Telemetry</span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs">
          {coords ? (
            <span className="flex items-center space-x-1 text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>GPS Active</span>
            </span>
          ) : (
            <span className="text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
              Acquiring GPS...
            </span>
          )}
        </div>
      </div>

      {gpsError && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{gpsError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Coordinates */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Latitude, Longitude</span>
          <span className="font-mono text-slate-200 font-medium text-[12px] truncate block mt-0.5">
            {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : '--'}
          </span>
        </div>

        {/* GPS Accuracy with color grading */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Accuracy</span>
            <span className="text-[10px] text-slate-500">Max {office?.maxGpsAccuracyMeters || 100}m</span>
          </div>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span
              className={`font-semibold ${
                accuracy === null
                  ? 'text-slate-400'
                  : accuracy <= 30
                  ? 'text-emerald-400'
                  : accuracy <= 100
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {accuracy !== null ? `± ${accuracy} m` : '--'}
            </span>
            {accuracy !== null && (
              <span className="text-[10px]">
                {accuracy <= 100 ? (
                  <span className="text-emerald-400">✓ OK</span>
                ) : (
                  <span className="text-red-400">⚠ Low</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Distance to Office */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Distance to Office</span>
          <span className="font-semibold text-slate-200 block mt-0.5">
            {distance !== null ? `${distance} m` : '--'}
          </span>
        </div>

        {/* Geofence Perimeter Status */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Geofence</span>
            <span className="text-[10px] text-slate-500">Radius {office?.radiusMeters || 150}m</span>
          </div>
          <div className="flex items-center space-x-1 mt-0.5">
            {isInside ? (
              <span className="flex items-center text-emerald-400 font-semibold space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Inside Office</span>
              </span>
            ) : (
              <span className="flex items-center text-red-400 font-semibold space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Outside Radius</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
